import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// TU CUENTA (maqueta aprobada tu-cuenta.png). Modo de fallo: SILENCIO — una fila que no lleva a
// ningún lado, o la cuenta vieja (con la barra de abajo) que vuelve por una ruta olvidada.
const CLIENTE = { id: 'c1', name: 'Ana Prueba', phone: '900000001', email: 'ana@x.pe', points: 180, total_orders: 2, dni: '12345678', credit_balance: 12.5 };

async function aLaCuenta(page: any) {
  await gotoApp(page, { 'my-orders': { orders: [] }, 'addresses-list': { addresses: [] } });
  await page.evaluate((c: any) => { const w = window as any; w.cust = c; w.token = 'tok'; w.volverALaPuerta(); }, CLIENTE);
  // Desde la esquina de la puerta, como un cliente con sesión.
  await page.locator('.pta .yo').click();
  await page.locator('.mcu').waitFor();
}

test('la cuenta es la nueva: ficha con cifras reales y sin la barra vieja', async ({ page }) => {
  await aLaCuenta(page);
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
  const ficha = page.locator('.mcu .ficha');
  await expect(ficha).toContainText('Ana Prueba');
  await expect(ficha).toContainText('180');
  const credito = await page.evaluate(() => (window as any).SOLES_TXT + (window as any).pz(12.5));
  await expect(ficha).toContainText(credito);
});

for (const [fila, destino] of [['Tus datos', '.mcu h1:has-text("DATOS")'], ['Cómo pagas', 'text=CÓMO'], ['Avisos', 'text=AVISOS'], ['Lo legal', '.mll']] as const) {
  test(`«${fila}» lleva a su pantalla y se vuelve a la cuenta`, async ({ page }) => {
    await aLaCuenta(page);
    await page.locator('.mcu .r', { hasText: fila }).click();
    await expect(page.locator(destino).first()).toBeVisible();
  });
}

test('las cifras llevan a lo suyo: pedidos a tus pedidos', async ({ page }) => {
  await aLaCuenta(page);
  await page.locator('.mcu .cifras button', { hasText: 'Pedidos' }).click();
  await expect(page.locator('.mcu')).toHaveCount(0);
});
