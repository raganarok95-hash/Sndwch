import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA ESTRELLA DEL MENÚ — que lo más rentable sea lo más visible (2026-09-12).
//
// POR QUÉ EXISTE ESTE ARCHIVO. El home tiene TRES mecanismos que empujan un Signature por
// encima de los demás, y los tres viven en sitios distintos del código:
//
//   1. `recommended:true` en el array SIGS          (src/app/01-*)
//   2. `SIG_HOME_ORDER`, el orden fijo de la lista  (src/app/03-*)
//   3. el puente desde ARMA EL TUYO                 (src/app/03-*, usa `recommended`)
//
// Mientras apunten al mismo producto, el empujón es uno solo y se nota. Cuando se
// desalinean, cada uno tira para un lado y el cliente ve una lista que recomienda A,
// enseña B primero y le sugiere C si dudó — y el negocio no gana nada.
//
// YA PASÓ, y por eso esto es una prueba y no un comentario. Hasta el 2026-09-12:
//   · la estrella estaba en THE ORIGINAL, el CUARTO de cinco en contribución;
//   · `SIG_HOME_ORDER` decía ordenar por margen con números de ANTES del recosteo con
//     merma ("SIG03 68% y SIG04 49% bruto", contra 32.5% y 26.6% reales hoy), así que
//     ponía al cuarto y al quinto en las dos posiciones más miradas de la lista;
//   · y "Recomendado" era un sufijo de 11px en itálica, del mismo color y tamaño que el
//     badge de al lado, o sea invisible.
//
// EL MODO DE FALLO ES SILENCIO PURO. Nada de esto lanza un error, ningún tipo deja de
// compilar y la app se ve entera: solo se deja de empujar el sándwich que deja S/2.73 más
// por unidad en 15CM (S/17.43 contra S/14.70), y no hay forma de enterarse mirando la
// pantalla. Un `npm run typecheck` en verde es compatible con las tres flechas apuntando
// a tres productos distintos.
//
// LO QUE ESTA PRUEBA **NO** DICE: cuál Signature merece ser la estrella. Eso sale de
// `modelo/rentabilidad_por_parte.py`, que lee `catalog_prices`/`catalog_items` de la base,
// y cambia el día que el dueño mueva un precio desde el panel. Acá solo se fija que los
// tres mecanismos apunten al MISMO, que es la parte que se rompe sola.

const SIG_ITEMS = [
  { item_id: 'SIG01', name: 'The Original', active: true },
  { item_id: 'SIG02', name: 'The Marinara', active: true },
  { item_id: 'SIG03', name: 'The Smoke', active: true },
  { item_id: 'SIG04', name: 'The Fresh', active: true },
  { item_id: 'SIG06', name: 'The Teriyaki', active: true },
];

test.describe('la estrella del menú', () => {
  test('exactamente UN Signature lleva el sello, y se ve como sello y no como sufijo', async ({ page }) => {
    await gotoApp(page);
    const sellos = page.locator('text=Recomendado');
    await expect(sellos).toHaveCount(1);

    // Un sufijo de texto y un sello se distinguen por tener fondo propio: sin fondo, el
    // rótulo queda del mismo color y tamaño que todo lo que lo rodea, que es exactamente
    // el defecto que esto vino a cerrar.
    const fondo = await sellos.first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(fondo).not.toBe('rgba(0, 0, 0, 0)');
    expect(fondo).not.toBe('transparent');
  });

  test('el Signature de la estrella es el PRIMERO de la lista del home', async ({ page }) => {
    await gotoApp(page);

    // El nombre que acompaña al sello y el nombre de la primera fila tienen que ser el
    // mismo. Si `SIG_HOME_ORDER` se reordena sin mover `recommended` (o al revés), acá
    // aparecen dos nombres distintos.
    const nombres = await page.evaluate(() => {
      const SIGS = (window as any).SIGS as any[];
      const orden = Array.from(document.querySelectorAll('div[onclick^="startOrderWithSig"]'))
        .map((el) => (el.getAttribute('onclick') || '').match(/startOrderWithSig\('([^']+)'\)/))
        .filter(Boolean)
        .map((m) => (m as RegExpMatchArray)[1]);
      const estrella = SIGS.filter((s) => s.recommended).map((s) => s.id);
      return { orden, estrella };
    });

    expect(nombres.estrella).toHaveLength(1);
    expect(nombres.orden.length).toBeGreaterThan(1);
    expect(nombres.orden[0]).toBe(nombres.estrella[0]);
  });

  test('el puente desde ARMA EL TUYO ofrece esa MISMA estrella, no otra', async ({ page }) => {
    await gotoApp(page, {
      'get-catalog': { proteins: {}, sigs: {}, sides: {}, rewardPts: {}, inventory: {}, sigItems: SIG_ITEMS },
    });

    const estrella = await page.evaluate(() => {
      const s = ((window as any).SIGS as any[]).find((x) => x.recommended);
      return s ? s.n : null;
    });
    expect(estrella).toBeTruthy();

    await page.evaluate(() => { (window as any).homeTab = 'byo'; (window as any).render(); });

    // El puente nombra el Signature LEYÉNDOLO del catálogo, nunca escrito a mano: si el
    // dueño lo renombra desde el panel, el texto lo sigue solo.
    const puente = page.locator('text=¿Prefieres que ya esté resuelto?');
    await expect(puente).toBeVisible();
    await expect(puente).toContainText(estrella as string);
  });
});
