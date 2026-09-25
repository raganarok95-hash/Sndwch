import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, cartaDeLaApp, elegirSando, type Carta } from './helpers';

// CATÁLOGO EDITABLE DESDE EL PANEL (2026-08-27). Hasta esta fecha, cambiar el nombre, el
// pitch, el badge, la composición o el precio de un Signature exigía editar `SIGS` en
// src/app.ts, `SIG_DATA` y `SIG_LABEL` en catalog.ts, la foto en `SIG_IMG`, la tabla
// `catalog_prices`, y recompilar y desplegar. Retirar uno (como pasó con THE CHICAGO)
// costaba una sesión de código entera.
//
// Ahora la fila vigente de la tabla `catalog_items` manda, y el cliente la recibe por la
// acción pública `get-catalog` (campo `sigItems`). Los literales de SIGS quedaron como
// SEMILLA: lo que se ve en el primer render y el respaldo si el servidor no responde.
//
// Estos dos tests cubren justamente eso — que el literal del código NO sea lo que gana.

// Lo que el panel publica para un Signature, armado sobre el mismo Signature que la app tiene
// en su carta: la prueba no nombra ningún producto, así que vale para cualquier carta.
async function publicarDesdeElPanel(page: any, cambiar: (item: any, c: Carta) => any) {
  const c = await cartaDeLaApp(page);
  // Uno que NO sea la estrella: en su tarjeta el sello «La estrella» ocupa el lugar del badge.
  const estrella = await page.evaluate(() => ((window as any).SIGS.find((x: any) => x.recommended) || {}).id);
  const id = c.signatures.find((x) => x !== estrella)!;
  const semilla = await page.evaluate((x: string) => {
    const s = (window as any).SIGS.find((y: any) => y.id === x);
    return { n: s.n, s: s.s, badge: s.badge, base: s.base, prot: s.prot, tops: s.tops, sauces: s.sauces,
      p15: s.p15, p30: s.p30, img: (window as any).SIG_IMG[x] || null, active: true, fixedCheese: s.fixedCheese || null, cheeseOptional: false };
  }, id);
  // Una ruta nueva gana a la anterior: desde acá `get-catalog` responde lo publicado.
  await mockBackend(page, { 'get-catalog': { proteins: {}, sigs: {}, sides: {}, rewardPts: {}, sigItems: { [id]: cambiar(semilla, c) } } });
  await page.reload();
  // La app abre siempre en la puerta: se vuelve a entrar por SANDO, como un cliente.
  await elegirSando(page);
  return { c, id, nombreSemilla: semilla.n as string };
}

test('el nombre de un Signature sale de la base, no del literal del código', async ({ page }) => {
  await gotoApp(page);
  // Si el cliente mostrara el literal del código en vez de lo publicado, el test falla — que
  // es exactamente lo que se quiere detectar: cambiar el menú desde el panel no tendría efecto.
  const { nombreSemilla } = await publicarDesdeElPanel(page, (item) => ({
    ...item, n: 'El Renombrado', badge: 'Badge del panel', pitch: 'Pitch publicado desde el panel.',
  }));

  await expect(page.locator('text=El Renombrado')).toBeVisible();
  // El badge también sale de la base. Se verifica en la tarjeta del home junto al nombre;
  // el pitch NO se comprueba acá porque esa pantalla no lo muestra — vive en el detalle
  // del Signature. Afirmarlo acá haría fallar el test por una expectativa equivocada, no
  // por un defecto del código (pasó exactamente eso al escribirlo).
  await expect(page.locator('text=Badge del panel')).toBeVisible();
  // Y el literal del código ya no debe aparecer por ningún lado.
  await expect(page.locator(`text=${nombreSemilla}`)).not.toBeVisible();
});

test('un Signature publicado como inactivo desaparece de la carta', async ({ page }) => {
  await gotoApp(page);
  // Retirar un ítem del menú es publicar active:false — sin tocar código, y conservando su
  // receta en la tabla para cuando vuelva.
  const { c, id: retirado, nombreSemilla } = await publicarDesdeElPanel(page, (item) => ({ ...item, pitch: 'Da igual, está retirado.', active: false }));
  const otroId = c.signatures.find((x) => x !== retirado)!;
  const otro = await page.evaluate((x: string) => (window as any).SIGS.find((y: any) => y.id === x).n, otroId);

  // Se espera a que OTRO Signature esté visible antes de afirmar la ausencia: si no, el
  // test podría pasar simplemente porque el fetch de catálogo todavía no resolvió, y no
  // estaría probando nada.
  await expect(page.locator(`text=${otro}`).first()).toBeVisible();
  await expect(page.locator(`text=${nombreSemilla}`)).not.toBeVisible();
});
