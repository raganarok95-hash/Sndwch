import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// TU PEDIDO FIJO (maqueta tu-pedido-fijo.png) y EL LUGAR APARTADO (2026-09-24).
//
// Lo que no puede pasar en silencio:
//   · que la pantalla prometa «guardado» con una hora inventada, o sin que el servidor lo diga;
//   · que «Pedirlo ahora» arme el carrito SIN el id del fijo: el servidor no le gastaría su lugar
//     y se lo contaría en contra al pagar (la hora le saldría llena, su propio lugar lo tapa);
//   · que a quien tiene su hora apartada se la tachen como llena;
//   · que ofrecer «¿lo dejamos fijo?» mande otro día u otra hora que la de su costumbre.

const CLIENTE = { phone: '900000001', name: 'Ana', points: 0, credit_balance: 0, total_orders: 9 };
const DIR = { id: 12, label: 'Oficina', address: 'Av. España 123', reference: 'Piso 3', lat: -8.112, lon: -79.031 };
const ITEMS = [{ type: 'sig', sigId: 'SIG02', size: '15', qty: 1 }];
const FIJO = {
  id: '11111111-2222-3333-4444-555555555555', items: ITEMS, weekday: 4, slot: '13:30', addressId: 12,
  label: 'The Marinara 15CM', valido: true, precio: 21.9, veces: 9, horaHabitual: '13:25',
  vez: '2026-10-01T18:30:00.000Z', estado: 'apartada', apartada: true, sueltaA: '2026-10-01T17:00:00.000Z', confirmados: 4,
};

async function abrir(page: any, lista: any, extra: Record<string, any> = {}) {
  const calls = await gotoApp(page, {
    login: { customer: CLIENTE, isAdmin: false, token: 'tok' },
    'session-check': { valid: true, customer: CLIENTE },
    'addresses-list': { addresses: [DIR] },
    'recurring-list': lista,
    ...extra,
  });
  await page.evaluate(async () => {
    const w = window as any;
    w.token = 'tok';
    w.cust = { phone: '900000001', name: 'Ana', total_orders: 9 };
    await w.goRecurring();
  });
  return calls;
}

test('con el lugar apartado dice hasta cuándo, con horas del servidor, y nunca que se cobra solo', async ({ page }) => {
  await abrir(page, { recurring: [FIJO], sugerido: null, desdeConfirmados: 2 });
  await expect(page.getByText('Tu jueves de las 1:30 p.m. está guardado')).toBeVisible();
  await expect(page.getByText(/Hasta las 12 p\.m\./)).toBeVisible();
  await expect(page.getByText('9 veces')).toBeVisible();
  await expect(page.getByText('1:25 p.m.')).toBeVisible();
  // «Te sale» = comida a precio de hoy + el envío a SU dirección, con la tarifa del checkout.
  const esperado = await page.evaluate((d) => 'S/' + (window as any).pz(21.9 + (window as any).envioADireccion(d)), DIR);
  await expect(page.locator('.mfj .vec')).toContainText(esperado);
  await expect(page.getByText(/No te cobramos sin que confirmes/)).toBeVisible();
  await expect(page.getByText(/lo mandamos solo/i)).toHaveCount(0);
});

test('«Pedirlo ahora» arma el carrito con SU dirección y el id del fijo, que viaja al pagar', async ({ page }) => {
  await abrir(page, { recurring: [FIJO], sugerido: null, desdeConfirmados: 2 });
  await page.locator('.mfj .go .oro').click();
  expect(await page.evaluate(() => (window as any).sndScreen)).toBe('o_cart');
  expect(await page.evaluate(() => (window as any).pendingRecurringId)).toBe(FIJO.id);
  expect(await page.evaluate(() => (window as any).addrText)).toBe('Av. España 123');
  // metaAttribution() es lo que llega a los TRES caminos de cobro.
  expect(await page.evaluate(() => (window as any).metaAttribution().recurringId)).toBe(FIJO.id);
  // Vaciar el carrito corta el vínculo: lo siguiente que arme ya no es el fijo.
  await page.evaluate(() => (window as any).clearCart());
  expect(await page.evaluate(() => (window as any).metaAttribution().recurringId)).toBe('');
});

test('la hora que le guardamos NO se le tacha como llena; a otro sí', async ({ page }) => {
  await abrir(page, { recurring: [FIJO], sugerido: null, desdeConfirmados: 2 });
  const r = await page.evaluate(() => {
    const w = window as any;
    const h = '2026-10-01T18:00:00.000Z';
    w.maxPerHour = 10; w.fullHours = [h]; w.cargaPorHora = { [h]: 10 };
    const paraOtro = w.hourIsFull(new Date('2026-10-01T18:30:00Z'));
    w.miHoraApartada = h;
    const paraEl = w.hourIsFull(new Date('2026-10-01T18:30:00Z'));
    // Si además hay 10 pedidos SIN contar su lugar, está llena para él también.
    w.cargaPorHora = { [h]: 11 };
    const llenaDeVerdad = w.hourIsFull(new Date('2026-10-01T18:30:00Z'));
    return { paraOtro, paraEl, llenaDeVerdad };
  });
  expect(r).toEqual({ paraOtro: true, paraEl: false, llenaDeVerdad: true });
});

test('a quien repite le ofrece dejarlo fijo el día y la hora de su costumbre', async ({ page }) => {
  const calls = await abrir(page, {
    recurring: [],
    sugerido: { items: ITEMS, label: 'The Marinara 15CM', precio: 21.9, veces: 3, horaHabitual: '13:25', weekday: 4, slot: '13:30' },
    desdeConfirmados: 2,
  }, { 'recurring-add': { success: true } });
  await expect(page.getByText('Lo que más pides')).toBeVisible();
  await page.getByRole('button', { name: /¿Lo dejamos fijo los jueves\?/ }).click();
  await expect.poll(() => calls.some((c: any) => c.action === 'recurring-add')).toBe(true);
  const b = calls.find((c: any) => c.action === 'recurring-add')!.body;
  expect(b.weekday).toBe(4);
  expect(b.slot).toBe('13:30');
  expect(b.items).toEqual(ITEMS);
  expect(b.addressId).toBe(12);
});

test('«Esta semana no» suelta el lugar sin quitar el fijo', async ({ page }) => {
  const calls = await abrir(page, { recurring: [FIJO], sugerido: null, desdeConfirmados: 2 }, { 'recurring-skip': { success: true, skipOn: '2026-10-01' } });
  await page.getByRole('button', { name: 'Esta semana no' }).click();
  await expect.poll(() => calls.some((c: any) => c.action === 'recurring-skip')).toBe(true);
  expect(calls.find((c: any) => c.action === 'recurring-skip')!.body.id).toBe(FIJO.id);
  expect(calls.some((c: any) => c.action === 'recurring-delete')).toBe(false);
});

test('sin el lugar todavía, dice desde cuántas veces lo guardamos — la cifra viene del servidor', async ({ page }) => {
  await abrir(page, { recurring: [{ ...FIJO, estado: 'faltan-confirmaciones', apartada: false, confirmados: 1 }], sugerido: null, desdeConfirmados: 3 });
  await expect(page.getByText(/Cuando lo hayas pedido 3 veces desde acá, te guardamos el lugar \(vas 1\)/)).toBeVisible();
  await expect(page.getByText(/está guardado/)).toHaveCount(0);
});
