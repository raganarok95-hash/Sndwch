import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Cubre 2 hallazgos de auditoría UX del panel admin, confirmados por el dueño para
// implementar juntos:
// 1) El grid de accesos rápidos (Clientes y ventas, Catálogo, etc.) ahora aparece ARRIBA
//    de "Pedidos activos //" en admin_home — antes quedaba debajo de toda la cola.
// 2) Un drawer de navegación lateral (botón de grilla en H(), ver toolsNav) permite
//    saltar de una herramienta admin a otra (ej. Inventario -> Reportes) sin volver
//    primero a admin_home.

const MOCK_ORDER = {
  id: 'ord-nav-1',
  ref: 'ORD-NAV0001-AAAA',
  customer_name: 'Cliente Nav',
  customer_address: 'Av. Test 1',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
};

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
}

test('admin_home muestra el grid de herramientas arriba de la lista de pedidos', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
  });
  await loginAsAdmin(page);

  const toolsY = (await page.locator('text=Clientes y ventas //').boundingBox())!.y;
  const ordersY = (await page.locator('text=Pedidos activos //').boundingBox())!.y;
  expect(toolsY).toBeLessThan(ordersY);
});

test('drawer de navegación lateral permite saltar de Inventario a Reportes', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
  });
  await loginAsAdmin(page);

  // Entra a Inventario desde el grid (ahora arriba de la cola).
  await page.locator('[onclick*="loadInventory()"]').first().click();
  await expect(page.locator('text=INVENTARIO')).toBeVisible();

  // El botón de la cola ya no está visible en esta pantalla — sin el drawer, la única
  // forma de llegar a Reportes sería volver primero a admin_home.
  await page.locator('[aria-label="Abrir navegación de herramientas"]').click();
  await expect(page.locator('text=Herramientas //')).toBeVisible();

  await page.locator('text=Reportes').first().click();
  await expect(page.locator('text=REPORTE POR FECHAS')).toBeVisible();
});
