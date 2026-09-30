import { test, expect, type Page } from '@playwright/test';
import { gotoApp, ponerDireccion } from './helpers';

// TODO BOTÓN QUE SE VE SE PUEDE TOCAR (2026-09-30).
//
// El «✕» y «Tu pedido» del Mundo SANDO no respondían: el riel lleva `pointer-events:none` para
// dejar pasar el deslizamiento, y sus botones, con `all:unset`, heredaban ese `none` por encima
// de la regla que se lo devolvía. El toque atravesaba el botón y caía en la foto. Nada lanzaba
// error: el cliente tocaba y no pasaba nada, sin poder volver a la puerta ni abrir su pedido.
//
// Esta prueba recorre el camino de compra y en cada pantalla pregunta al navegador qué recibe el
// toque en el centro de cada botón visible. Si no es el botón (o algo suyo), lo nombra.

async function intocables(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const hoja = document.querySelector('.hoja');
    const raiz: ParentNode = hoja || document;
    const malos: string[] = [];
    const els = Array.from(raiz.querySelectorAll('button, [onclick], a[href], input, select, textarea')) as HTMLElement[];
    for (const el of els) {
      if ((el as HTMLButtonElement).disabled) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      const x = b.left + b.width / 2, y = b.top + b.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === el || el.contains(hit))) continue;
      // Tapado por una barra fija que queda al pie por diseño: se mide solo lo que asoma.
      if (hit && hit.closest('.sw-barra') && !el.closest('.sw-barra')) continue;
      const nombre = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('onclick') || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
      const encima = hit ? hit.tagName.toLowerCase() + (hit.className ? '.' + String(hit.className).split(' ')[0] : '') : 'nada';
      malos.push(`«${nombre}» tapado por ${encima}`);
    }
    // Una barra fija queda tapada o no según dónde esté el scroll (lo que pasa por debajo de
    // ella cambia): sus botones se miden con el scroll arriba, al medio y abajo.
    const sc = document.scrollingElement as HTMLElement;
    const fijos = els.filter((el) => el.closest('.sw-barra') && !(el as HTMLButtonElement).disabled);
    const zonas = [...new Set([0, 0.5, 1].map((f) => Math.round((sc.scrollHeight - innerHeight) * f)))];
    for (const y0 of zonas) {
      sc.scrollTop = y0;
      for (const el of fijos) {
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
        const hit = document.elementFromPoint(cx, cy);
        if (hit && (hit === el || el.contains(hit))) continue;
        const nombre = (el.getAttribute('aria-label') || el.textContent || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
        malos.push(`«${nombre}» (barra fija, scroll ${y0}) tapado por ${hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0] : 'nada'}`);
      }
    }
    return [...new Set(malos)];
  });
}

test('en cada pantalla del camino de compra, todo botón visible recibe el toque', async ({ page }) => {
  await gotoApp(page, { 'place-order': (b: any) => ({ success: true, order: { id: 'o', ref: b.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: b.total }, customer: null }) });
  const informe: Record<string, string[]> = {};
  const medir = async (donde: string) => { informe[donde] = await intocables(page); };

  await medir('Mundo SANDO (M15)');
  await page.locator('.m15 .plato').first().locator('button.b').click();
  await page.locator('.f01').waitFor();
  await medir('ficha (01)');
  await page.locator('.f01 .pie button').click();
  const sin = page.getByRole('button', { name: /Sigo sin bebida/ });
  await Promise.race([sin.waitFor(), page.locator('.m30').waitFor()]);
  if (await sin.isVisible()) { await medir('bebidas'); await sin.click(); }
  await page.locator('.m30').waitFor();
  await medir('tu pedido (30G)');
  await page.locator('.m30 .en', { hasText: 'Recibe' }).click();
  await page.locator('.hoja').waitFor();
  await medir('hoja RECIBE');
  await page.locator('#o-nom').fill('Cliente');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('.m30-go .oro').click();
  await page.locator('.hoja').waitFor({ state: 'detached' });
  await page.evaluate(() => (window as any).go('o_dir'));
  await page.locator('.m34').waitFor();
  await medir('dónde te lo dejamos (34)');
  await page.evaluate(() => (window as any).go('o_cart'));
  await ponerDireccion(page, 'Calle Los Cedros 500', '');
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31.y').waitFor();
  await medir('pagar con Yape (31)');
  await page.locator('[onclick*="selectPayMethod(\'culqi\')"]').click();
  await page.locator('.m31.t').waitFor();
  await medir('pagar con tarjeta (31)');

  // Y de vuelta: el «✕» del Mundo SANDO tiene que llevar a la puerta de verdad.
  await page.evaluate(() => (window as any).go('o_home'));
  await page.locator('.m15 [aria-label="Cambiar de lado"]').click({ timeout: 5000 });
  await expect(page.locator('.pta')).toBeVisible();
  await medir('la puerta (M2)');

  const fallas = Object.entries(informe).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.join('; ')}`);
  expect(fallas, fallas.join('\n')).toEqual([]);
});


// El lado de WICHO, de la puerta al carrito. El «Siguiente» del paso de la proteína no respondía:
// el velo de las hojas de la 30G se llamaba `.velo`, igual que el degradado de las tarjetas de
// proteína, y su `z-index:95` global subía ese degradado por encima de la barra del armador.
test('ARMA EL TUYO se puede recorrer entero y llega al carrito, tocando en cada paso', async ({ page }) => {
  await gotoApp(page, {});
  await page.locator('.m15 [aria-label="Cambiar de lado"]').click({ timeout: 5000 });
  await page.locator('button[onclick="elegirLado(\'byo\')"]').click({ timeout: 5000 });
  const informe: Record<string, string[]> = {};
  const opcion = '#app button[onclick]:not([onclick*="byoIrAPaso"]):not([onclick*="byoStepBack"]):not([onclick*="byoStepNext"]):not([onclick*="volverALaPuerta"]):not([disabled])';
  for (let i = 0; i < 10; i++) {
    const s = await page.evaluate(() => [(window as any).sndScreen, (window as any).byoStep]);
    if (s[0] !== 'o_build') break;
    // Se toca la primera opción del paso, como un cliente apurado, y se mide antes de avanzar.
    await page.locator(opcion).first().click({ timeout: 5000 });
    informe['armador, paso ' + s[1]] = await intocables(page);
    await page.locator('button[onclick="byoStepNext()"]').click({ timeout: 5000 });
  }
  const sin = page.getByRole('button', { name: /Sigo sin bebida/ });
  await Promise.race([sin.waitFor(), page.locator('.m30').waitFor()]);
  if (await sin.isVisible()) { informe['bebidas de WICHO'] = await intocables(page); await sin.click(); }
  await expect(page.locator('.m30')).toBeVisible();
  expect(await page.evaluate(() => (window as any).cart.length)).toBe(1);
  const fallas = Object.entries(informe).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v.join('; ')}`);
  expect(fallas, fallas.join('\n')).toEqual([]);
});
