import { test, expect } from '@playwright/test';
import { gotoApp, pedirUnSignature } from './helpers';
import { nombreDe, unaBebida } from './carta';

const BEBIDA = unaBebida();

// LAS BEBIDAS SE VEN Y SE ENTRA DIRECTO, PERO VAN CON UN SÁNDWICH (dueño, 2026-09-30).
//
// Hasta hoy esta prueba exigía lo contrario —«se puede pedir una bebida sola»—, por un pedido
// anterior del dueño y porque las bebidas son lo de mejor margen. El 2026-09-30 lo decidió de
// nuevo, con las dos opciones delante: «No, solo con sándwich». Se entra a las bebidas y se
// ven sin armar nada; lo que no se puede es PAGAR un pedido que solo trae bebidas. El servidor
// lo exige igual (assertTraeSandwich en orders.ts, probado en tests-api/solo-bebidas.test.ts).
//
// Modo de fallo: silencio en los dos sentidos. Si el aviso desaparece, un pedido de pura bebida
// llega al servidor y rebota ahí, al final; si el aviso sale tarde, el cliente llena dirección y
// datos para enterarse al último de que no puede pagar.

test('solo con bebidas no se llega a pagar, y el aviso sale antes de pedir dirección', async ({ page }) => {
  const calls = await gotoApp(page, {});
  // La entrada directa a las bebidas se restituye con su maqueta; mientras tanto se entra igual
  // que ese botón: a la pantalla de bebidas, sin armar nada.
  await page.evaluate(() => (window as any).irABebidas('o_home'));
  await expect(page.getByText(nombreDe(BEBIDA), { exact: false }).first()).toBeVisible();
  await page.evaluate((id) => { (window as any).bebidaSel = id; (window as any).agregarBebidaElegida(); }, BEBIDA);

  await page.evaluate(() => (window as any).go('o_cart'));
  await page.locator('.m30').waitFor();
  await page.locator('.m30-go .oro').click();
  // Se queda en la 30G con el aviso: ni la 34 (dirección) ni la hoja de datos, ni un pedido.
  await expect(page.getByText('Las bebidas van con un sándwich', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.m34')).toHaveCount(0);
  await expect(page.locator('.m31')).toHaveCount(0);
  expect(calls.find((c) => c.action === 'place-order' || c.action === 'prepare-order')).toBeFalsy();
});

test('con un sándwich, la bebida sí se paga', async ({ page }) => {
  await gotoApp(page, {});
  await pedirUnSignature(page, { size: '15' });
  await page.evaluate((id) => (window as any).addSideToCart(id), BEBIDA);
  await page.locator('.m30-go .oro').click();
  await expect(page.getByText('Las bebidas van con un sándwich', { exact: false })).toHaveCount(0);
});
