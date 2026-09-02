import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #38 (compras y costo real), #34/#31 (comisiones y conciliación de Culqi) y #39 (pasivo de
// crédito), del lado del cliente.
//
// Los cálculos están probados contra el servidor en tests-api/costo-y-margen. Acá se fija lo
// que decide si sirven de algo:
//   · que un costo por porción INCOMPLETO no se muestre como si estuviera completo — sobre
//     ese número se fija el precio de venta,
//   · que la subida de precio se avise en el momento de registrar la compra, no un mes
//     después cuando el margen ya bajó,
//   · que el pasivo de crédito se vea separado del día, porque es un saldo acumulado.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};

async function entrarComoAdmin(page: any, handlers: Record<string, unknown>) {
  const calls = await gotoApp(page, { ...ADMIN, ...handlers });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  return calls;
}

// ── #38 ────────────────────────────────────────────────────────────────────────────────

const COMPRAS_COMPLETO = {
  purchases: [],
  avgWindow: 3,
  spikeThreshold: 0.15,
  costs: [
    { code: 'P01', unit: 'g', lastUnitCost: 0.02, avgUnitCost: 0.02, purchases: 2, lastPurchasedAt: '2026-09-02', spikePct: 0.2 },
  ],
  recipeCosts: [
    { recipeCode: 'P01', name: 'Res asada mechada', yieldPortions: 38, known: 2, total: 120.14, costPerPortion: 3.16, missing: [] },
  ],
};

test('con todos los precios registrados muestra el costo por porción', async ({ page }) => {
  await entrarComoAdmin(page, { 'admin-purchases': COMPRAS_COMPLETO });
  await page.locator('[onclick*="loadPurchases()"]').first().click();
  await expect(page.locator('text=/S\\/3\\.16/')).toBeVisible();
  await expect(page.locator('text=/120\\.14 la tanda ÷ 38 porciones/')).toBeVisible();
});

test('si falta el precio de un ingrediente NO se muestra un total parcial', async ({ page }) => {
  // Un número que parece completo y no lo está es sobre lo que se fija el precio de venta.
  await entrarComoAdmin(page, {
    'admin-purchases': {
      ...COMPRAS_COMPLETO,
      recipeCosts: [{ recipeCode: 'P01', name: 'Res asada mechada', yieldPortions: 38, known: 1, total: 120, costPerPortion: null, missing: ['Sal'] }],
    },
  });
  await page.locator('[onclick*="loadPurchases()"]').first().click();
  await expect(page.locator('text=/Falta el precio de: Sal/')).toBeVisible();
  await expect(page.locator('text=/un total parcial engañaría/')).toBeVisible();
  await expect(page.locator('text=/S\\/120\\.00/')).toHaveCount(0);
});

test('una subida fuerte se avisa al registrar la compra, no un mes después', async ({ page }) => {
  await entrarComoAdmin(page, {
    'admin-purchases': COMPRAS_COMPLETO,
    'admin-purchase-add': { success: true, purchase: {}, spike: { pct: 0.25, previous: 20, current: 25 } },
  });
  await page.locator('[onclick*="loadPurchases()"]').first().click();
  await page.locator('#pu-code').fill('P01');
  await page.locator('#pu-qty').fill('6');
  await page.locator('#pu-unit').fill('kg');
  await page.locator('#pu-total').fill('150');
  await page.getByRole('button', { name: /Guardar compra/ }).click();
  await expect(page.locator('text=/subió 25%/')).toBeVisible();
});

test('el formulario no manda una compra a medias', async ({ page }) => {
  const calls = await entrarComoAdmin(page, { 'admin-purchases': COMPRAS_COMPLETO });
  await page.locator('[onclick*="loadPurchases()"]').first().click();
  await page.locator('#pu-code').fill('P01');
  await page.getByRole('button', { name: /Guardar compra/ }).click();
  await expect(page.locator('text=/Completa insumo, cantidad, unidad/')).toBeVisible();
  expect(calls.filter((c) => c.action === 'admin-purchase-add')).toHaveLength(0);
});

// ── #34 / #31 ──────────────────────────────────────────────────────────────────────────

test('el reporte de Culqi pone arriba lo que debería depositarse', async ({ page }) => {
  // Es el número contra el que se compara el depósito real: si no cuadra, hay algo que ver.
  await entrarComoAdmin(page, {
    'admin-culqi-report': {
      orders: 12, invoiced: 400, fees: 22, netExpected: 378, declines: 2, declineRate: 0.143, orphanCharges: 0, feeRate: 0.055,
    },
  });
  await page.locator('[onclick*="loadCulqiReport()"]').first().click();
  await expect(page.locator('text=/S\\/378\\.00/')).toBeVisible();
  await expect(page.locator('text=/DEBERÍA LLEGARTE DE CULQI/')).toBeVisible();
  await expect(page.locator('text=/Es un costo, no un redondeo/')).toBeVisible();
});

test('sin intentos de cobro no se muestra un 0% engañoso', async ({ page }) => {
  await entrarComoAdmin(page, {
    'admin-culqi-report': {
      orders: 0, invoiced: 0, fees: 0, netExpected: 0, declines: 0, declineRate: null, orphanCharges: 0, feeRate: 0.055,
    },
  });
  await page.locator('[onclick*="loadCulqiReport()"]').first().click();
  await expect(page.locator('text=/Sin intentos este mes/')).toBeVisible();
});

// ── #39 ────────────────────────────────────────────────────────────────────────────────

test('el pasivo de crédito se muestra separado y dice que NO es del día', async ({ page }) => {
  // Mezclarlo con el cierre sería el mismo error que ese cierre vino a arreglar.
  await entrarComoAdmin(page, {
    'admin-cash-close': {
      orders: 1, gross: 26.9, deliveryPassThrough: 6, cardFees: 0, creditUsed: 0, cashIn: 26.9,
      businessRevenue: 20.9, culqiFeeRate: 0.055, byMethod: [], pendingConfirmation: { orders: 0, amount: 0 },
      creditLiability: { customers: 4, total: 320, average: 80, largest: 100 },
    },
  });
  await page.locator('[onclick*="loadCashClose()"]').first().click();
  await expect(page.locator('text=/acumulado, no de hoy/')).toBeVisible();
  await expect(page.locator('text=/S\\/320\\.00/')).toBeVisible();
  await expect(page.locator('text=/todavía debes en comida/')).toBeVisible();
});

test('sin nadie con saldo no aparece el bloque de crédito', async ({ page }) => {
  await entrarComoAdmin(page, {
    'admin-cash-close': {
      orders: 1, gross: 26.9, deliveryPassThrough: 6, cardFees: 0, creditUsed: 0, cashIn: 26.9,
      businessRevenue: 20.9, culqiFeeRate: 0.055, byMethod: [], pendingConfirmation: { orders: 0, amount: 0 },
      creditLiability: { customers: 0, total: 0, average: 0, largest: 0 },
    },
  });
  await page.locator('[onclick*="loadCashClose()"]').first().click();
  await expect(page.locator('text=/acumulado, no de hoy/')).toHaveCount(0);
});
