import { test, expect, Page } from '@playwright/test';
import { elegirSando, pedirUnSignature, ponerRecibe, ponerDireccion, salirALaPuerta } from '../tests/helpers';

// RECORRIDO DE UN CLIENTE POR EL SITIO REAL (dueño, 2026-10-07: «revisa toda la app si realmente
// funciona, busca errores»). Las pruebas de tests/ abren el archivo local con el servidor
// simulado; esto abre https://sndwch.app con el servidor de verdad, como un celular, y recorre lo
// que un cliente toca. NO paga ni crea pedidos: se detiene en las pantallas de pago.
//
// Lo que cuenta como error, en cualquier paso: un error de JavaScript, un error en la consola, una
// llamada a la API que no responde 2xx, una imagen rota o un archivo que no carga.

type Hallazgo = { paso: string; que: string };
const hallazgos: Hallazgo[] = [];

// La apertura (dueño, 2026-11-02: «Abrimos el 20 de noviembre»; el cron sndwch-abrir-tienda-20-nov la
// prende a las 6:00 de Lima). Antes de esa hora la app NO debe tomar pedidos. El 2026-11-10 el recorrido
// llegaba a «Pagar con Yape» todos los días y salía en verde: la tienda había quedado abierta desde las
// pruebas del 2026-11-02 y cualquiera con el enlace podía pagar. Se volvió hallazgo, pero el dueño decidió
// dejarla abierta a propósito (2026-11-10: «no cerraremos el app hasta abrir el 20, que siga abierta»):
// queda como nota en el registro, no como rojo. Si se cierra antes de abrir otra vez, se vuelve hallazgo.
// Si la fecha se mueve, se cambia aquí y en el cron el mismo día.
const APERTURA = Date.parse('2026-11-20T11:00:00Z');
let pasoActual = '';

// El píxel de Meta (el script y sus envíos): un robot no es un cliente.
const META_PIXEL = /connect\.facebook\.net|facebook\.com\/tr/i;

// Ruido conocido de terceros que no es de la app (se anota abajo si cambia).
const IGNORAR = [
  /favicon/i,
  /google-analytics|googletagmanager|facebook\.net|connect\.facebook/i,
  // El botón de Google (Entrar): en un navegador sin cuenta de Google iniciada, su ventana dice
  // que no hay cuentas y su registro se corta al cambiar de página. Visto el 2026-10-07; no es la app.
  /Provider's accounts list is empty|accounts\.google\.com\/gsi\/button|play\.google\.com\/log/i,
  // El mismo botón de Google pide un token por FedCM y, en un navegador sin sesión de Google, falla con NetworkError.
  // Visto todos los días desde el 2026-10-25 en el paso «entrar»; no es la app.
  /\[GSI_LOGGER\]: FedCM get\(\) rejects with NetworkError/i,
];

function vigilar(page: Page) {
  page.on('pageerror', (e) => hallazgos.push({ paso: pasoActual, que: 'JS: ' + String(e.message).slice(0, 200) }));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text() + ' ' + (m.location()?.url || '');
    if (!IGNORAR.some((r) => r.test(t))) hallazgos.push({ paso: pasoActual, que: 'consola: ' + t.slice(0, 200) });
  });
  page.on('requestfailed', (r) => {
    if (IGNORAR.some((x) => x.test(r.url()))) return;
    // ERR_ABORTED = el navegador la canceló porque la prueba cambió de página: no es una falla.
    if (/ERR_ABORTED/.test(r.failure()?.errorText || '')) return;
    hallazgos.push({ paso: pasoActual, que: `no cargó ${r.url().slice(0, 120)} (${r.failure()?.errorText})` });
  });
  page.on('response', async (r) => {
    if (r.status() < 400 || IGNORAR.some((x) => x.test(r.url()))) return;
    let accion = '';
    try { accion = JSON.parse(r.request().postData() || '{}').action || ''; } catch {}
    const cuerpo = (await r.text().catch(() => '')).slice(0, 160);
    hallazgos.push({ paso: pasoActual, que: `${r.status()} ${accion ? 'acción ' + accion : r.url().slice(0, 100)}: ${cuerpo}` });
  });
}
async function imagenesRotas(page: Page) {
  const rotas = await page.evaluate(() => [...document.images]
    .filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:'))
    .map((i) => i.src.slice(0, 120)));
  for (const r of rotas) hallazgos.push({ paso: pasoActual, que: 'imagen rota: ' + r });
}
async function paso(page: Page, nombre: string, fn: () => Promise<void>) {
  pasoActual = nombre;
  await test.step(nombre, async () => {
    await fn();
    await page.waitForLoadState('networkidle').catch(() => {});
    await imagenesRotas(page);
    await page.screenshot({ path: `recorrido/${nombre.replace(/[^a-z0-9]+/gi, '-')}.png` });
  });
}

test.afterAll(async () => {
  console.log(`\n── RECORRIDO: ${hallazgos.length} hallazgo(s)`);
  for (const h of hallazgos) console.log(`  · [${h.paso}] ${h.que}`);
});

test('un cliente nuevo recorre la app real sin errores', async ({ page }) => {
  vigilar(page);
  // Sin píxel de Meta (2026-10-15): el recorrido de cada mañana le mandaba a Meta visitas y
  // «agregar al carrito» de un robot, y Meta aprende de esos eventos para la pauta y los públicos.
  await page.route(META_PIXEL, (r) => r.abort());
  await page.addInitScript(() => { (window as any).open = () => null; });

  await paso(page, 'puerta', async () => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Ya está resuelto/ })).toBeVisible({ timeout: 30000 });
  });
  await paso(page, 'sando-carta', async () => { await elegirSando(page); });
  await paso(page, 'signature-al-carrito', async () => { await pedirUnSignature(page); });
  await paso(page, 'carrito-recibe-y-donde', async () => {
    // La dirección va ANTES de RECIBE: desde «menos toques» (2026-11-02) el «Listo» de RECIBE sin
    // el punto del mapa abre el mapa, y su «Es acá» tapaba «Pagar» (rojo desde el 2026-11-02).
    await ponerDireccion(page);
    await ponerRecibe(page, 'Revisión Automática', '900000000');
  });
  await paso(page, 'pagar-yape', async () => {
    await page.locator('.m30-go .oro').click();
    // Abierto → Pagar con Yape. Cerrado → el pedido se programa solo y también llega a Pagar; si
    // no hay hora libre, se abre la hoja «Programar». Cualquier otra cosa es un hallazgo.
    const yape = page.locator('.m31.y');
    let llego = '';
    for (let i = 0; i < 30 && !llego; i++) {
      if (await yape.isVisible()) llego = 'yape';
      else if (await page.locator('.hoja').first().isVisible()) llego = 'hoja';
      else await page.waitForTimeout(500);
    }
    if (!llego) {
      const aviso = (await page.locator('[role="alert"]').allInnerTexts()).join(' ').trim();
      // Antes de abrir, Pagar avisa «Todavía no abrimos» (05-carrito-y-checkout.ts) y no cobra: es lo esperado mientras
      // el negocio no abre (businessLaunched). Se anota en el registro y no cuenta como hallazgo, para que el vigía
      // vuelva a avisar de los errores de verdad (estuvo en rojo todos los días del 2026-10-25 al 2026-11-01 por esto).
      if (/Todavía no abrimos/.test(aviso)) { console.log('antes de abrir: Pagar avisa «Todavía no abrimos» (esperado)'); return; }
      hallazgos.push({ paso: pasoActual, que: 'Pagar no llevó a ninguna pantalla' + (aviso ? ': ' + aviso.slice(0, 160) : '') });
    }
    if (llego && Date.now() < APERTURA) {
      console.log('nota: la tienda toma pedidos antes del 20 de noviembre (abierta a propósito por el dueño): Pagar llegó a ' + (llego === 'yape' ? 'Yape' : 'Programar'));
    }
    if (llego === 'yape') {
      await expect(page.locator('[data-accion="copiar-yape"]')).toContainText(/\d{3} \d{3} \d{3}/);
    }
  });
  await paso(page, 'pagar-tarjeta-sin-cobrar', async () => {
    if (!(await page.locator('.m31.y').isVisible())) return;
    await page.evaluate(() => { (window as any).selectPayMethod('culqi'); (window as any).render(); });
    await expect(page.locator('.m31.t')).toBeVisible();
  });
  await paso(page, 'wicho-armador', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: /Tú decides/ }).click();
    await page.waitForSelector('text=¿De qué tamaño?');
    const sig = () => page.locator('button[onclick="byoStepNext()"]').click();
    await page.locator('[onclick*="size=\'15\'"]').click(); await sig();
    await page.locator('[onclick^="base="]').first().click(); await sig();
    await page.locator('[onclick^="prot="]').first().click(); await sig();
    for (let i = 0; i < 3; i++) await sig();
    const sin = page.getByRole('button', { name: /Sigo sin bebida/ });
    await Promise.race([sin.waitFor({ timeout: 15000 }), page.locator('.m30').waitFor({ timeout: 15000 })]);
    if (await sin.isVisible()) await sin.click();
    await expect(page.locator('.m30')).toBeVisible();
  });
  for (const [nombre, q] of [['terminos', 'terminos'], ['privacidad', 'privacidad'], ['devoluciones', 'devoluciones'], ['libro-de-reclamaciones', 'reclamaciones']]) {
    await paso(page, 'legal-' + nombre, async () => {
      await page.goto('/?legal=' + q);
      await page.waitForTimeout(1500);
      expect((await page.locator('body').innerText()).length).toBeGreaterThan(200);
    });
  }
  await paso(page, 'entrar', async () => {
    await page.goto('/');
    await page.locator('.pta .yo').click();
    await expect(page.locator('.en')).toBeVisible();
  });

  // LA CUENTA Y LOS PUNTOS, con la cuenta robot (scripts/robot-recorrido.mjs; Ezra, 2026-11-11). Entra con
  // teléfono y PIN y abre su cuenta: cualquier acción de la cuenta que falle (pedidos, puntos, avisos) sale
  // arriba como hallazgo. Sin las variables (corrida local) se salta y se dice.
  await paso(page, 'cuenta-y-puntos', async () => {
    if (!process.env.ROBOT_PIN) { console.log('sin cuenta robot: no se revisó la cuenta'); return; }
    await page.goto('/');
    await page.locator('.pta .yo').click();
    await page.locator('.en').waitFor();
    await page.locator('button[onclick^="authPinFallback=true"]').click();
    await page.locator('#l-phone').fill(process.env.ROBOT_TELEFONO || '000000000');
    await page.locator('#l-pin').fill(process.env.ROBOT_PIN);
    await page.locator('.en-go button.oro').click();
    await expect.poll(() => page.evaluate(() => (window as any).sndScreen), { timeout: 20000 }).toBe('p_home');
    const cuenta = await page.evaluate(() => { const w = window as any; return { puntos: w.cust?.points, admin: w.isAdmin }; });
    if (typeof cuenta.puntos !== 'number') hallazgos.push({ paso: pasoActual, que: 'la cuenta abrió sin puntos: ' + JSON.stringify(cuenta) });
    if (cuenta.admin) hallazgos.push({ paso: pasoActual, que: 'la cuenta robot entró como administradora' });
  });

  expect(hallazgos, hallazgos.map((h) => `[${h.paso}] ${h.que}`).join('\n')).toHaveLength(0);
});
