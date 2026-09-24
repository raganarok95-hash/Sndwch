import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// TODAS LAS HERRAMIENTAS DEL PANEL SE ABREN, UNA POR UNA
//
// El panel tiene 35 pantallas registradas y nueve pruebas, cada una sobre una herramienta
// concreta (cola, inventario, salud, plan de tandas, guion de video...). Nadie comprobaba
// que el RESTO siquiera abriera. Y el panel es lo que el dueño usa con el local lleno: una
// herramienta que revienta al abrirse no se descubre revisando código, se descubre un
// viernes a las ocho.
//
// MODO DE FALLO que esta prueba persigue, en orden de gravedad:
//   1. La pantalla revienta (excepción de JavaScript) y el router pinta "Algo se rompió".
//   2. La pantalla se queda en "No se pudo cargar //" aunque el servidor respondió bien —
//      pasa cuando el loader lee un campo que la respuesta no trae y se lo traga un catch.
//   3. La pantalla se pinta con la piel del CLIENTE en vez de la del panel. Eso ya pasó:
//      hasta el 2026-07-29 el admin oscuro no tenía clase propia y heredaba el verde del
//      cliente sin que nadie lo hubiera decidido.
//
// La lista de herramientas NO se escribe acá: se lee de `adminToolsSections()`, que es la
// misma que dibuja el cajón de navegación. Escribirla acá significaría que una herramienta
// nueva no se prueba hasta que alguien se acuerde de agregarla a dos sitios — y el día que
// se olvide es justo el día que hace falta.

const PEDIDO = {
  id: 'ord-1',
  ref: 'ORD-SWEEP01-AAAA',
  customer_name: 'Cliente',
  customer_address: 'Av. Test 1',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'yape',
  created_at: new Date().toISOString(),
};

// Una respuesta vacía pero BIEN FORMADA para cualquier acción del panel. No es `{}`: un
// objeto pelado haría que cualquier `d.rows.map(...)` reventara y la prueba culparía a la
// pantalla de un defecto que en realidad sería del mock. Lo que se persigue es la pantalla
// que se rompe con una respuesta legítima.
const VACIO = {
  ok: true,
  orders: [],
  rows: [],
  items: [],
  customers: [],
  ratings: [],
  complaints: [],
  recipes: [],
  promos: [],
  events: [],
  ingredients: [],
  assembly: [],
  miseEnPlace: [],
  checks: [],
  admins: [],
  uploads: [],
  hours: Array.from({ length: 7 }, () => ({ open: 11, close: 22, closed: false })),
};

test('cada herramienta del panel abre, sin reventar y sin quedarse en "No se pudo cargar"', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [PEDIDO], truncated: false }),
    // Cuatro herramientas leen una forma propia que `VACIO` no puede adivinar. Se declaran
    // con la MISMA forma que ya usan sus pruebas dedicadas, no con una inventada acá: si el
    // servidor cambia la forma, esas pruebas caen primero y esto no se queda mintiendo.
    'admin-health': () => ({ checkedAt: new Date().toISOString(), overall: 'ok', signals: [] }),
    'admin-marketing-content': () => ({
      current: { theme: 'TEMA', whatsapp: 'wa', caption: 'cap', videoIdea: 'vid', photoIdea: 'foto' },
      next: { theme: 'TEMA 2', whatsapp: 'wa2', caption: 'cap2', videoIdea: 'vid2', photoIdea: 'foto2' },
    }),
    'admin-campaign-performance': () => ({ campaigns: [], windowDays: 7, lookbackDays: 30 }),
    'admin-accounts-list': () => ({ accounts: [] }),
    // Cualquier otra acción del panel responde vacío pero bien formada.
    '*': () => VACIO,
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000000', '1234');
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + PEDIDO.ref)).toBeVisible({ timeout: 10000 });

  // La lista sale de la app, no de esta prueba.
  const herramientas: string[] = await page.evaluate(() =>
    (window as any).adminToolsSections().flatMap((sec: any) => sec[1].map((row: any) => row[1])),
  );
  expect(herramientas.length, 'el cajón de herramientas no puede venir vacío').toBeGreaterThan(15);

  const rotas: string[] = [];
  for (const etiqueta of herramientas) {
    errores.length = 0;
    await page.evaluate(() => {
      (window as any).adminToolsDrawerOpen = true;
      (window as any).render();
    });
    const fila = page.locator('button', { hasText: new RegExp('^' + etiqueta + '$') }).first();
    if (!(await fila.count())) { rotas.push(`${etiqueta}: no aparece en el cajón`); continue; }
    await fila.click();
    // Las herramientas piden datos: se espera a que el cargando se apague, no un tiempo fijo.
    await page.waitForFunction(() => (window as any).busy === false, null, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(150);

    const texto = await page.locator('#app').innerText();
    if (errores.length) rotas.push(`${etiqueta}: reventó — ${errores[0].slice(0, 120)}`);
    else if (/Algo se rompió/i.test(texto)) rotas.push(`${etiqueta}: el router pintó la pantalla de error`);
    else if (/No se pudo cargar/i.test(texto)) rotas.push(`${etiqueta}: se quedó en "No se pudo cargar" con una respuesta válida`);
    else if (!texto.trim()) rotas.push(`${etiqueta}: pintó una pantalla vacía`);

    // La piel del panel, nunca la del cliente.
    const piel = await page.evaluate(() => {
      const el = document.querySelector('.admin-dark,.admin-light');
      return !!el;
    });
    if (!piel) rotas.push(`${etiqueta}: se pintó sin la piel del panel (.admin-dark/.admin-light)`);
  }

  expect(rotas, 'herramientas del panel que no abren bien:\n  · ' + rotas.join('\n  · ')).toEqual([]);
});
