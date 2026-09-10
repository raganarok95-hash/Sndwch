import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL TOTAL QUE SE VE ENCIMA DEL BOTÓN DE PAGAR TIENE QUE ESTAR REDONDEADO.
//
// `AB()` es la barra de acción fija: la usan las CUATRO pantallas que muestran un total —
// Signature, armador, confirmación y carrito. Interpolaba el número crudo, así que:
//
//     un Signature de S/20.90  se anunciaba  "S/20.9"
//     el armador podía llegar a mostrar      "S/24.369999999999997"
//
// Es exactamente el defecto que el dueño reportó el 2026-09-09 en el empujón a 30CM
// ("por S/9.999999999999998"), sobreviviendo en otra pantalla. `check:precios` no lo veía
// porque su regla exigía pz() PEGADO a SOLES, y acá entre medio hay una etiqueta HTML para
// pintar el número en dorado. La regla ya se amplió; esta prueba cubre lo que ninguna
// regla de texto puede cubrir: lo que de verdad se pinta.
//
// ⚠ Su modo de fallo es SILENCIO. Un total sin redondear no lanza ningún error, no rompe
// el cobro (el servidor compara con Math.round(total*100)) y se ve casi bien. Lo único que
// hace es que el número más importante de la pantalla parezca un error de la app, en el
// segundo exacto en que se decide pagar.

// Lee el importe de la barra fija tal como lo ve el cliente.
async function totalDeLaBarra(page: any): Promise<string | null> {
  return page.evaluate(() => {
    const barras = Array.from(document.querySelectorAll('div')).filter(
      (d) => (d as HTMLElement).style.position === 'fixed' && (d as HTMLElement).style.bottom === '0px',
    );
    for (const b of barras) {
      const m = /S\/\s*([\d.]+)/.exec((b as HTMLElement).innerText || '');
      if (m) return m[1];
    }
    return null;
  });
}

// Un importe bien formateado tiene dos decimales o ninguno — nunca uno solo, y nunca la
// cola de punto flotante. `pz()` es justamente esa regla.
function esImporteLimpio(txt: string) {
  return /^\d+(\.\d{2})?$/.test(txt);
}

test('el total del Signature se muestra con sus dos decimales', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);

  const esperado = await page.evaluate(() => {
    const w = window as any;
    w.size = '15';
    w.sigId = w.SIGS.find((s: any) => !s.secret).id;
    w.sndScreen = 'o_sig';
    w.render();
    return w.sigPrice(w.SIGS.find((s: any) => s.id === w.sigId));
  });
  await page.waitForTimeout(300);

  const visto = await totalDeLaBarra(page);
  expect(visto, 'la barra de acción no mostró ningún total').not.toBeNull();
  expect(esImporteLimpio(visto!), `la barra muestra "S/${visto}" — un precio de ${esperado} sin redondear`).toBe(true);
});

test('el total del armador se muestra con sus dos decimales', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const w = window as any;
    w.size = '15';
    w.sigId = null;
    // Un armado cualquiera, con lo que basta para que total() devuelva un número.
    w.base = w.BASES[0].id;
    w.prot = w.PROTS.filter((p: any) => !p.sigOnly)[0].id;
    w.sndScreen = 'o_build';
    w.byoStep = 4;
    w.render();
  });
  await page.waitForTimeout(300);

  const visto = await totalDeLaBarra(page);
  expect(visto, 'el armador no mostró ningún total').not.toBeNull();
  expect(esImporteLimpio(visto!), `el armador muestra "S/${visto}"`).toBe(true);
});

// La prueba de fuego: un total con basura de punto flotante de verdad. Si alguien quita el
// pz() de AB(), esto pinta la cola entera y falla.
test('un total con cola de punto flotante igual se muestra limpio', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);

  const pintado = await page.evaluate(() => {
    const w = window as any;
    // 18.90 - 3 + 8.47 = 24.369999999999997 — el caso literal del CLAUDE.md.
    const sucio = 18.9 - 3 + 8.47;
    const html = w.AB(sucio, true, null, 'void 0');
    const cont = document.createElement('div');
    cont.innerHTML = html;
    return cont.innerText || cont.textContent || '';
  });

  expect(pintado).toContain('24.37');
  expect(pintado, 'la barra pintó la cola de punto flotante').not.toContain('24.3699');
});
