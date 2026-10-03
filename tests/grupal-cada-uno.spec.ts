import { test, expect } from '@playwright/test';
import { gotoApp, APP_FILE } from './helpers';

// «CERRAR Y PAGAR» = CADA UNO PAGA LO SUYO (maqueta pedido-grupal, decisión del dueño 2026-09-24).
//
// Lo que no puede pasar en silencio: que «Cerrar y pagar» siga cobrándole todo al organizador
// (el cierre viejo), que el reparto salga sin la dirección con pin de la que sale el envío, o
// que las partes no se puedan pagar una por una con su propio monto.

const ANA = { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 };
const ABIERTO = {
  code: 'ABC123', status: 'open', organizerName: 'Ana Cliente',
  expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
  items: [
    { id: 1, contributorName: 'Ana Cliente', label: 'The Original 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
    { id: 2, contributorName: 'Beto', label: 'The Original 15CM', qty: 1, unitPrice: 20.9, isSandwich: true },
  ],
  total: 41.8, isOrganizer: true, sandwichQty: 2, organizerFreeAt: 5,
  canPay: true, freeApplies: false, missingForFree: 3,
};
const REPARTIDO = {
  ...ABIERTO, status: 'splitting', canPay: false,
  splitDeadline: new Date(Date.now() + 20 * 60000).toISOString(),
  partes: [
    { ref: 'ORD-GABC123-0XY', name: 'Ana Cliente', total: 24.4, envio: 3.5, paid: false, cancelled: false },
    { ref: 'ORD-GABC123-1QW', name: 'Beto', total: 24.4, envio: 3.5, paid: true, cancelled: false },
  ],
};
// Ids NUMÉRICOS, como los manda la base (saved_addresses.id es bigint): con ids de texto la
// comparación === pasaba en la prueba y fallaba en producción.
const DIRECCION = { id: 7, label: 'Oficina', address: 'Av. España 123', reference: 'Piso 3', lat: -8.11, lon: -79.03 };
const CASA = { id: 8, label: 'Casa', address: 'Jr. Pizarro 500', lat: -8.115, lon: -79.035 };

// La mesa (maqueta aprobada 2026-10-03): antes de cobrar se ve cuánto paga cada uno. Lo que
// no puede pasar en silencio: que la mesa muestre un monto que NO es el que el servidor va a
// cobrar (por eso los montos vienen de `group-split-preview`, no de una cuenta local), que el
// reparto salga desde otra dirección que la elegida, o que las partes no se puedan pagar.
test('la mesa muestra lo que cobra el servidor, reparte desde la dirección elegida y cada parte se paga sola', async ({ page }) => {
  let repartido = false;
  const calls = await gotoApp(page, {
    login: { customer: ANA, isAdmin: false, token: 'tok-ana' },
    'addresses-list': { addresses: [CASA, DIRECCION] },
    'get-group-order': () => (repartido ? REPARTIDO : ABIERTO),
    'group-split-preview': (b: any) => ({ success: true, fee: 7, km: 2, partes: [
      { name: 'Ana Cliente', food: 20.9, envio: 3.5, total: b.lat === DIRECCION.lat ? 24.4 : 24.41, gratis: 0, esOrganizador: true },
      { name: 'Beto', food: 20.9, envio: 3.5, total: 24.4, gratis: 0, esOrganizador: false },
    ] }),
    'split-group-order': () => { repartido = true; return { success: true }; },
    'close-group-order': { success: true, items: [] },
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await page.locator('[data-accion="cerrar-y-pagar"]').click();

  // La primera con pin (Casa) viene elegida y la mesa pide el reparto para ELLA.
  await expect.poll(() => calls.filter((c) => c.action === 'group-split-preview').length).toBeGreaterThan(0);
  expect(calls.find((c) => c.action === 'group-split-preview')!.body.lat).toBe(CASA.lat);
  await expect(page.locator('.mesa .pz').first()).toContainText('24.41');

  // Se cambia a la Oficina en la hoja: el reparto se vuelve a pedir y la mesa lo muestra.
  await page.locator('[data-accion="reparto-cambiar"]').click();
  await page.locator('[data-accion="reparto-direccion"]', { hasText: DIRECCION.label }).click();
  await page.locator('[data-accion="reparto-listo"]').click();
  await expect(page.locator('.mesa .pz').first()).toContainText('24.40');
  await page.locator('[data-accion="reparto-cobrar"]').click();

  await expect.poll(() => calls.some((c) => c.action === 'split-group-order')).toBe(true);
  const body = calls.find((c) => c.action === 'split-group-order')!.body;
  expect(body.code).toBe('ABC123');
  expect(body.lat).toBe(DIRECCION.lat);
  expect(body.lon).toBe(DIRECCION.lon);
  expect(body.address).toContain('Piso 3');
  // El cierre viejo (todo en un pedido) no se toca por este camino.
  expect(calls.some((c) => c.action === 'close-group-order')).toBe(false);

  // Cobrando: la parte que falta se paga sola, con su ref y su monto.
  await page.locator('[data-accion="pagar-parte"]').click();
  expect(await page.evaluate(() => (window as any).sndScreen)).toBe('o_sent');
  expect(await page.evaluate(() => (window as any)._lRef)).toBe('ORD-GABC123-0XY');
  expect(await page.evaluate(() => (window as any)._lTot)).toBe(24.4);
});

// Dueño, 2026-10-01: una dirección sin pin no es un callejón: se ofrece ubicarla en el mapa ahí
// mismo. Lo que NO cambia: sin pin no se reparte (el envío sale del pin).
test('sin una dirección con pin no se reparte: la hoja ofrece ubicarla en el mapa', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: ANA, isAdmin: false, token: 'tok-ana' },
    'addresses-list': { addresses: [{ ...DIRECCION, lat: null, lon: null }] },
    'get-group-order': ABIERTO,
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await page.locator('[data-accion="cerrar-y-pagar"]').click();
  await expect(page.locator('[data-accion="reparto-ubicar"]')).toBeVisible();
  await expect(page.locator('[data-accion="reparto-cobrar"]')).toBeDisabled();
  expect(calls.some((c) => c.action === 'split-group-order' || c.action === 'group-split-preview')).toBe(false);
});

// «QUIÉNES COMEN» salía en blanco cuando el grupo no cargaba (dueño, 2026-10-01). Silencioso: la
// pantalla no dice nada y el grupo, que es venta, se pierde. Ahora el error se ve, con reintentar.
test('si el grupo no carga, la pantalla lo dice y deja reintentar (nunca en blanco)', async ({ page }) => {
  let caido = true;
  await gotoApp(page, {
    'get-group-order': () => { if (caido) throw new Error('Se cortó la conexión.'); return ABIERTO; },
  });
  await page.goto(APP_FILE + '?group=ABC123');
  await expect(page.getByText('No pudimos cargar el grupo')).toBeVisible();
  caido = false;
  await page.getByRole('button', { name: /Reintentar/ }).click();
  await expect(page.getByRole('button', { name: /cerrar y pagar/i }).first()).toBeVisible();
});

// Quien entra por el enlace (sin cuenta) agrega una bebida, la ve en «Lo tuyo» y la quita ahí
// mismo con la llave que le dio el servidor (dueño, 2026-10-01: «al agregar más al mío es muy
// silencioso… puede generar pedidos por error, no permite quitarlos allí mismo»; «no deja elegir
// bebidas»). Y sin nombre no se agrega nada.
test('el invitado agrega una bebida, la ve en «Lo tuyo» y la quita con su llave', async ({ page }) => {
  const items: any[] = [...ABIERTO.items];
  const agregados: any[] = [], quitados: any[] = [];
  const ID = '11111111-2222-3333-4444-555555555555';
  await gotoApp(page, {
    'get-group-order': () => ({ ...ABIERTO, isOrganizer: false, items: [...items] }),
    'add-group-item': (b: any) => {
      agregados.push(b);
      items.push({ id: ID, contributorName: b.contributorName, label: 'Bebida', qty: 1, unitPrice: 6, isSandwich: false });
      return { success: true, id: ID, llave: 'llave-firmada' };
    },
    'remove-group-item': (b: any) => { quitados.push(b); items.splice(items.findIndex((x) => x.id === b.id), 1); return { success: true }; },
  });
  await page.goto(APP_FILE + '?group=ABC123');
  const primeraBebida = page.locator('.sumar h3:has-text("Para tomar") ~ .it').first();
  // Sin nombre: no se llama al servidor.
  await primeraBebida.getByRole('button', { name: 'Agregar' }).click();
  expect(agregados.length, 'se agregó sin nombre').toBe(0);
  await page.locator('#grp-name').fill('Juan');
  await primeraBebida.getByRole('button', { name: 'Agregar' }).click();
  await expect.poll(() => agregados.length).toBe(1);
  expect(agregados[0].item.type).toBe('side');
  const tuyo = page.locator('.tuyo');
  await expect(tuyo, '«Lo tuyo» no aparece tras agregar').toContainText('Bebida');
  await tuyo.getByRole('button', { name: /Quitar/ }).click();
  await expect.poll(() => quitados.length).toBe(1);
  expect(quitados[0].llave, 'se quitó sin la llave').toBe('llave-firmada');
  await expect(page.locator('.tuyo')).toHaveCount(0);
});
