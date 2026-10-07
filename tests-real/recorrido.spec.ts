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
let pasoActual = '';

// Ruido conocido de terceros que no es de la app (se anota abajo si cambia).
const IGNORAR = [/favicon/i, /google-analytics|googletagmanager|facebook\.net|connect\.facebook/i];

function vigilar(page: Page) {
  page.on('pageerror', (e) => hallazgos.push({ paso: pasoActual, que: 'JS: ' + String(e.message).slice(0, 200) }));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text() + ' ' + (m.location()?.url || '');
    if (!IGNORAR.some((r) => r.test(t))) hallazgos.push({ paso: pasoActual, que: 'consola: ' + t.slice(0, 200) });
  });
  page.on('requestfailed', (r) => {
    if (IGNORAR.some((x) => x.test(r.url()))) return;
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
  await page.addInitScript(() => { (window as any).open = () => null; });

  await paso(page, 'puerta', async () => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Ya está resuelto/ })).toBeVisible({ timeout: 30000 });
  });
  await paso(page, 'sando-carta', async () => { await elegirSando(page); });
  await paso(page, 'signature-al-carrito', async () => { await pedirUnSignature(page); });
  await paso(page, 'carrito-recibe-y-donde', async () => {
    await ponerRecibe(page, 'Revisión Automática', '900000000');
    await ponerDireccion(page);
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
      hallazgos.push({ paso: pasoActual, que: 'Pagar no llevó a ninguna pantalla' + (aviso ? ': ' + aviso.slice(0, 160) : '') });
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

  expect(hallazgos, hallazgos.map((h) => `[${h.paso}] ${h.que}`).join('\n')).toHaveLength(0);
});
