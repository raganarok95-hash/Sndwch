import { test, expect } from '@playwright/test';
import { gotoApp, salirALaPuerta } from './helpers';

// ENTRAR SOLO CON GOOGLE AL ABRIR LA APP (dueño: «no veo que se ingrese en automático con el
// proceso de google OAuth»).
//
// ⚠ MODO DE FALLO: SILENCIO. Si One Tap no se pide al abrir, nada se rompe: el cliente
// simplemente tiene que volver a entrar a mano cada vez, y nadie lo nota salvo él.
//
// Google no se puede llamar desde una prueba: se reemplaza `google.accounts.id` por uno falso
// que anota qué se le pidió. El script real se bloquea para que no pise al falso.
async function abrir(page: any, opciones: { yaEntroConGoogle: boolean }) {
  await page.route('https://accounts.google.com/**', (r: any) => r.abort());
  await page.addInitScript((antes: boolean) => {
    const w = window as any;
    w.__g = { init: [] as any[], prompts: 0, sinAuto: 0 };
    w.google = { accounts: { id: {
      initialize: (o: any) => w.__g.init.push(o),
      prompt: () => { w.__g.prompts++; },
      renderButton: () => {},
      disableAutoSelect: () => { w.__g.sinAuto++; },
    } } };
    if (antes) localStorage.setItem('sw_g_antes', '1');
  }, opciones.yaEntroConGoogle);
  await gotoApp(page, { 'get-store-hours': { hours: [], businessLaunched: true, googleClientId: 'cliente-de-prueba.apps.googleusercontent.com' } });
  await salirALaPuerta(page);
}

test('quien ya entró con Google vuelve a entrar solo al abrir la app, desde la puerta', async ({ page }) => {
  await abrir(page, { yaEntroConGoogle: true });
  const g = await page.evaluate(() => (window as any).__g);
  expect(g.init.length, 'Google no se inicializó al abrir la app').toBeGreaterThan(0);
  expect(g.init[0].auto_select, 'sin auto_select hay que tocar el botón').toBe(true);
  expect(g.prompts, 'no se le pidió a Google la sesión al abrir').toBe(1);
});

test('a quien nunca entró con Google no se le ofrece cuenta al abrir', async ({ page }) => {
  await abrir(page, { yaEntroConGoogle: false });
  const g = await page.evaluate(() => (window as any).__g);
  expect(g.prompts).toBe(0);
});

test('cerrar sesión apaga la entrada automática', async ({ page }) => {
  await abrir(page, { yaEntroConGoogle: true });
  const r = await page.evaluate(() => {
    const w = window as any;
    w.doLogout();
    return { sinAuto: w.__g.sinAuto, marca: localStorage.getItem('sw_g_antes') };
  });
  expect(r.sinAuto, 'sin disableAutoSelect, Google lo vuelve a entrar al abrir').toBeGreaterThan(0);
  expect(r.marca).toBeNull();
});
