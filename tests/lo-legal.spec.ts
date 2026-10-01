import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LO LEGAL (maqueta aprobada lo-legal.png). Modo de fallo: SILENCIO — una fila que no abre su
// texto, o un texto del que no se vuelve al índice. El Libro de Reclamaciones va aquí porque la
// ley lo pide a la vista y desde el camino nuevo no se llegaba.
async function alIndice(page: any) {
  await gotoApp(page, { 'my-orders': { orders: [] }, 'addresses-list': { addresses: [] } });
  await page.evaluate(() => { const w = window as any; w.cust = { id: 'c1', name: 'Ana', phone: '900000001', points: 0, total_orders: 1 }; w.token = 'tok'; w.volverALaPuerta(); });
  await page.locator('.pta .yo').click();
  await page.locator('.mcu .r', { hasText: 'Lo legal' }).click();
  await page.locator('.mll').waitFor();
}

for (const [fila, texto] of [
  ['Términos y condiciones', 'QUÉ VENDEMOS'],
  ['Política de privacidad', 'QUÉ DATOS PEDIMOS'],
  ['Cambios y devoluciones', 'POR QUÉ NO HAY DEVOLUCIÓN GENERAL'],
  ['Libro de Reclamaciones', 'Reclamo'],
] as const) {
  test(`«${fila}» abre su texto y se vuelve al índice`, async ({ page }) => {
    await alIndice(page);
    await page.locator('.mll .doc', { hasText: fila }).click();
    await expect(page.getByText(texto).first()).toBeVisible();
    await page.getByRole('button', { name: /volver|atrás|←/i }).first().click();
    await expect(page.locator('.mll')).toBeVisible();
  });
}

test('al pie van la razón social y el RUC que tiene el código, no inventados', async ({ page }) => {
  await alIndice(page);
  const { n, r } = await page.evaluate(() => ({ n: (window as any).BIZ_NAME, r: (window as any).BIZ_RUC }));
  await expect(page.locator('.mll .biz')).toContainText(n);
  await expect(page.locator('.mll .biz')).toContainText(r);
});
