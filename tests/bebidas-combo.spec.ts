import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LAS BEBIDAS: SE ELIGEN A LA VISTA, SE VENDEN Y EL COMBO SE VE TACHADO (dueño, 2026-10-01:
// «no deja seleccionarlas bien, tampoco tienen descripción de venta, cuando es en combo debe
// verse tachado el precio anterior y se vea el que se cobra en combo»).
//
// ⚠ MODO DE FALLO: SILENCIO. Un combo que se cobra pero no se ve no rompe nada: solo no vende.

async function conSandwichEnBebidas(page: any) {
  await gotoApp(page, {});
  await page.locator('.m15 .plato').first().locator('button.b').click();
  await page.locator('.f01 .pie button').click();
  await page.getByRole('button', { name: /Sigo sin bebida/ }).waitFor();
}

test('con un sándwich en el pedido, la bebida muestra su precio tachado y el de combo', async ({ page }) => {
  await conSandwichEnBebidas(page);
  const b = await page.evaluate(() => { const d = (window as any).bebidasDisponibles()[0]; return { nombre: d.l, desc: d.d }; });
  expect(b.desc, 'la bebida no tiene descripción').toBeTruthy();
  const vaso = page.locator('.b3 .vaso').first();
  await expect(vaso.locator('.pz del'), 'el precio de carta no está tachado').toBeVisible();
  // La descripción que vende está a la vista, no solo el sabor.
  await expect(vaso.locator('.nom p')).toContainText(b.desc.slice(0, 20));
  // La barra dice qué se agrega, y con el precio tachado.
  await expect(page.locator('#bebida-nombre')).toContainText(b.nombre);
  await expect(page.locator('#bebida-precio del')).toBeVisible();
});

test('en el carrito, la bebida del combo trae el precio tachado en su propio renglón', async ({ page }) => {
  await conSandwichEnBebidas(page);
  await page.locator('#bebida-nombre').click();
  await page.locator('.m30').waitFor();
  const filaBebida = page.locator('.m30 .li').filter({ hasText: /en combo/ });
  await expect(filaBebida, 'la bebida no dice que va en combo').toHaveCount(1);
  await expect(filaBebida.locator('p del')).toBeVisible();
});

test('del lado WICHO, tocar una bebida la marca como elegida y la barra lo dice', async ({ page }) => {
  await gotoApp(page, {});
  const nombres = await page.evaluate(() => {
    const w = window as any;
    w.homeTab = 'byo'; w.sndScreen = 'o_sides'; w.render();
    return w.bebidasDisponibles().map((d: any) => d.l);
  });
  await page.locator('.bw .bd').nth(1).click();
  await expect(page.locator('.bw .bd').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.bw .bd').nth(1).locator('.ok')).toBeVisible();
  await expect(page.locator('.bw .bd').nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#bebida-nombre')).toContainText(nombres[1]);
  await expect(page.locator('.bw .bd').nth(1).locator('.tx p')).not.toBeEmpty();
});
