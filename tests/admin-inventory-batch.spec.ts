import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// C7 — El dueño cocina por tandas 1-2 veces por semana. Al terminar sabe cuánto PRODUJO,
// no cuánto suma eso con lo que sobró: hacer esa cuenta a mano por cada insumo, recién
// salido de cocinar, es donde se equivoca — y un stock mal puesto apaga un producto en la
// tienda o vende algo que ya no hay.
//
// Lo que fija este test: en modo tanda el campo va vacío (mostrarlo precargado con el
// stock de ahora haría que escribir encima se leyera como "fijar" y sumara el doble), el
// número viaja como `add` y la suma la hace el servidor, y todo va en UNA sola llamada:
// si se cortara a la mitad, el dueño no tendría forma de saber qué insumos ya se sumaron.

const MOCK_ORDER = {
  id: 'ord-inv-1',
  ref: 'ORD-INV0001-AAAA',
  customer_name: 'Cliente',
  customer_address: 'Av. Test 1',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
};

// P01 arranca con 4 porciones en stock: es lo que sobró de la tanda anterior.
const INVENTARIO = { P01: { inStock: true, qty: 4 } };

async function abrirInventario(page: any) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await page.locator('[onclick*="loadInventory()"]').first().click();
  await expect(page.locator('text=INVENTARIO')).toBeVisible();
}

test('registrar una tanda suma lo producido en vez de reemplazar el stock', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'get-catalog': { inventory: INVENTARIO },
    'admin-inventory-restock': (body: any) => ({
      success: true,
      applied: body.items.map((it: any) => ({ code: it.code, from: 4, to: 4 + it.add })),
    }),
  });
  await abrirInventario(page);

  // En modo "Fijar cantidad" (el de siempre) el campo trae el stock actual.
  await expect(page.locator('#qty-P01')).toHaveValue('4');

  await page.getByText('Sumar tanda', { exact: true }).click();
  // Vacío a propósito: si mostrara "4", escribir 30 encima significaría "fija 30" para el
  // ojo y "suma 30 a los 4" para el sistema.
  await expect(page.locator('#qty-P01')).toHaveValue('');
  await expect(page.locator('text=/Se suma a lo que quedaba/')).toBeVisible();

  await page.locator('#qty-P01').fill('30');
  await page.getByRole('button', { name: 'Registrar la tanda //' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect.poll(() => calls.filter((c) => c.action === 'admin-inventory-restock').length).toBeGreaterThan(0);
  const call = calls.find((c) => c.action === 'admin-inventory-restock')!;
  // Va lo PRODUCIDO, no el total: el servidor lee la fila fresca y suma.
  expect(call.body.items).toEqual([{ code: 'P01', name: 'Res // Asado', add: 30 }]);
  // Una sola llamada para toda la tanda.
  expect(calls.filter((c) => c.action === 'admin-inventory-restock').length).toBe(1);
  // Y la pantalla muestra el resultado que devolvió el servidor, no un cálculo local.
  await expect(page.locator('text=/34 unid\\./')).toBeVisible();
});

test('una tanda sin ninguna cantidad escrita no llama al servidor', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'get-catalog': { inventory: INVENTARIO },
    'admin-inventory-restock': () => ({ success: true, applied: [] }),
  });
  await abrirInventario(page);
  await page.getByText('Sumar tanda', { exact: true }).click();
  await page.getByRole('button', { name: 'Registrar la tanda //' }).click();

  await expect(page.locator('text=/Escribe cuánto produjiste/')).toBeVisible();
  expect(calls.find((c) => c.action === 'admin-inventory-restock')).toBeFalsy();
});

test('una tanda no acepta cantidades en cero o negativas', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'get-catalog': { inventory: INVENTARIO },
    'admin-inventory-restock': () => ({ success: true, applied: [] }),
  });
  await abrirInventario(page);
  await page.getByText('Sumar tanda', { exact: true }).click();

  // Una tanda solo SUMA: para bajar un número está la edición normal, que fija el valor
  // exacto. Aceptar un negativo acá convertiría "reponer" en un descuento silencioso.
  await page.locator('#qty-P01').fill('-5');
  await page.getByRole('button', { name: 'Registrar la tanda //' }).click();
  await expect(page.locator('text=/Una tanda solo suma/')).toBeVisible();
  expect(calls.find((c) => c.action === 'admin-inventory-restock')).toBeFalsy();
});
