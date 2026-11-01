// La guía «Cómo pedir» (dueño, 2026-11-01: «el cómo pedir de manera ultra detallada, con los pasos en la web, con
// imágenes de la propia web y señalando cómo hacer el paso a paso»). Recorre la app real (index.html) en un celular
// de 390 × 844, con el backend simulado igual que las pruebas, y guarda cada pantalla con la caja de lo que hay que
// tocar. Después `componer.cjs` las monta en historias. Se corre a mano:
//   npx playwright test -c scripts/guia-pedir/playwright.config.ts
import { test, Page, Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { gotoApp, ponerDireccion } from '../../tests/helpers';

const OUT = path.join(__dirname, 'capturas');
// El horario real (el de la base es el mismo, store_hours, verificado el 2026-11-01): el de las pruebas abre las 24 horas
// y la puerta decía «cierra 12:00 a. m.». Se lee de reglas.ts como texto, como el número de Yape en componer.cjs.
const reglas = fs.readFileSync(path.join(__dirname, '../../supabase/functions/_shared/reglas.ts'), 'utf8');
const crudo = (reglas.match(/STORE_HOURS[^=]*=\s*\[([\s\S]*?)\];/) || [])[1];
if (!crudo) throw new Error('no encontré STORE_HOURS en reglas.ts');
const HORARIO = (JSON.parse(`[${crudo.trim().replace(/,$/, '')}]`) as Array<[number, number] | null>)
  .map((r) => (r ? { open: r[0], close: r[1], closed: false } : { open: null, close: null, closed: true }));
const pasos: any[] = [];
// `objetivo` es lo que se toca (lleva el aro); `zona`, si se da, es lo que amplía la lupa cuando no es lo mismo.
async function foto(page: Page, n: string, objetivo: Locator | null, zona?: Locator) {
  let caja = null, lupa = null;
  if (objetivo) { await objetivo.first().scrollIntoViewIfNeeded(); caja = await objetivo.first().boundingBox(); }
  if (zona) lupa = await zona.first().boundingBox();
  await page.waitForTimeout(350); // deja terminar las transiciones de la pantalla antes de la foto (no es una prueba)
  await page.screenshot({ path: path.join(OUT, `${n}.png`) });
  pasos.push({ n, caja, ...(lupa ? { zona: lupa } : {}) });
}

test('el recorrido de un pedido, pantalla por pantalla', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  // Un martes a la 1 p. m. de Lima: la cocina abierta y la hora de llegada de un pedido normal.
  await page.clock.setFixedTime(new Date('2026-11-03T18:00:00Z'));
  // gotoApp ya entra por la puerta: aquí se vuelve a abrir la app limpia para fotografiar la puerta.
  await gotoApp(page, { 'get-store-hours': { hours: HORARIO, businessLaunched: true }, 'place-order': (b: any) => ({ success: true, order: { id: 'ord-guia', ref: b.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: b.total }, customer: null }) });
  await page.reload();
  const puerta = page.getByRole('button', { name: /Ya está resuelto/ });
  await puerta.waitFor();
  await foto(page, '01-puerta', puerta);
  await puerta.click();
  const tarot = page.locator('.mtarot');
  await Promise.race([page.locator('.m15').waitFor(), tarot.waitFor()]);
  if (await tarot.isVisible()) { await foto(page, '02-carta', tarot.locator('.k').first()); await tarot.locator('.k').first().dispatchEvent('click'); }
  await page.locator('.m15').waitFor();
  await foto(page, '03-platos', page.locator('.m15 .plato').first().locator('button.b'));
  await page.locator('.m15 .plato').first().locator('button.b').click();
  await page.locator('.f01').waitFor();
  await foto(page, '04-tamano', page.locator('.f01 .tam'));
  await page.locator(`.f01 .tam button[onclick*="size='15'"]`).click();
  await foto(page, '05-agregar', page.locator('.f01 .pie button'));
  await page.locator('.f01 .pie button').click();
  const sin = page.getByRole('button', { name: /Sigo sin bebida/ });
  await Promise.race([sin.waitFor(), page.locator('.m30').waitFor()]);
  if (await sin.isVisible()) { await foto(page, '06-bebida', sin); await sin.click(); }
  await page.locator('.m30').waitFor();
  const recibe = page.locator('.m30 .en', { hasText: 'Recibe' });
  await foto(page, '07-resumen', recibe);
  await recibe.click();
  await page.locator('#o-nom').fill('Ana Torres');
  await page.locator('#o-phone').fill('987654321');
  await foto(page, '08-recibe', page.locator('.m30-go .oro'), page.locator('.hoja'));
  await page.locator('.m30-go .oro').click();
  await page.locator('.hoja').waitFor({ state: 'detached' });
  const dir = page.locator('.m30 .en', { hasText: /Dónde/ });
  await foto(page, '09-direccion', dir);
  // La hoja «¿Dónde te lo dejamos?»: el botón que abre el mapa. Sin red, Google Maps no carga, así que el mapa en sí no se
  // fotografía; se vuelve al resumen con la flecha y la dirección se deja por estado, igual que en las pruebas.
  await dir.first().click();
  const marcar = page.getByRole('button', { name: /Marcar en el mapa/i });
  await marcar.waitFor();
  await foto(page, '09b-mapa', marcar);
  await page.getByText('←').first().click();
  await page.locator('.m30').waitFor();
  await ponerDireccion(page, 'Calle Los Cedros 500, Trujillo', '');
  await foto(page, '10-pagar', page.locator('.m30-go .oro'));
  await page.locator('.m30-go .oro').click();
  await page.locator('.m31.y').waitFor();
  await foto(page, '11-yape', page.locator('.m31.y').getByText(/\d{3} \d{3} \d{3}/));
  await foto(page, '12-ya-pague', page.locator('.m30-go .oro'));
  await page.locator('.m30-go .oro').click();
  await page.locator('.m06').waitFor({ timeout: 15000 });
  const seguir = page.getByRole('button', { name: /Seguir el pedido/i });
  await foto(page, '13-listo', (await seguir.count()) ? seguir : page.locator('.m06'));
  fs.writeFileSync(path.join(OUT, 'pasos.json'), JSON.stringify(pasos, null, 1));
});
