import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LAS TRES PALANCAS — contra el OBJETIVO, no contra el punto de partida del modelo.
//
// POR QUÉ EXISTE. La pantalla comparaba lo medido SOLO contra `MODELO_SUPUESTOS`, que es de
// dónde PARTE el modelo. Con un supuesto de 6 referidos por cada 100 pedidos, medir 8 se
// pintaba en verde — y el plan que llega a S/3,000 netos en el mes 3 necesita 25
// (`PREDICCION_V14.md`). Un tablero que da por bueno el punto de partida no empuja a ningún
// lado, y encima lo hace con cara de estar midiendo.
//
// MODO DE FALLO: SILENCIO. Nada revienta si el veredicto vuelve a colgar del supuesto — solo
// se ve verde mientras el negocio no llega.

const ADMIN = { phone: '900000000', name: 'Admin' };

const REPORTE = {
  palancas: {
    reliable: true, orders: 120,
    byoPct: 50, drinkPct: 25, referralsPer100: 8,
    sigUnits: 60, byoUnits: 60, referredCustomers: 10,
  },
  modelo: { byoPct: 50, drinkPct: 25, referralsPer100: 6 },
  objetivo: { byoPct: 35, drinkPct: 40, referralsPer100: 25 },
};

async function abrirPalancas(page: any, data: any = REPORTE) {
  await gotoApp(page, {
    login: { customer: ADMIN, isAdmin: true, token: 'tok-admin' },
    'session-check': { valid: true, customer: ADMIN, isAdmin: true },
    'admin-orders': { orders: [], truncated: false },
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
    'my-orders': { orders: [] },
    'admin-retention-report': data,
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await page.getByText('Las tres palancas').first().click();
  await expect(page.locator('text=LAS TRES PALANCAS')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(600);
}

test('muestra el OBJETIVO y el punto de partida, sin colapsarlos', async ({ page }) => {
  await abrirPalancas(page);
  // Los dos números, y el objetivo primero: es el que hay que mover.
  await expect(page.locator('text=objetivo 25 · el modelo parte de 6')).toBeVisible();
  await expect(page.locator('text=objetivo 40% · el modelo parte de 25%')).toBeVisible();
  await expect(page.locator('text=objetivo 35% · el modelo parte de 35%')).toHaveCount(0);
  await expect(page.locator('text=objetivo 35% · el modelo parte de 50%')).toBeVisible();
});

test('⚠ 8 referidos por 100 NO se pinta en verde: el objetivo son 25', async ({ page }) => {
  await abrirPalancas(page);
  // El color lo decide el objetivo, no el supuesto. Con la versión vieja, 8 contra un supuesto
  // de 6 daba verde — y el negocio no llegaba igual.
  const color = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div'))
      .find((d) => (d.textContent || '').trim() === '8' && getComputedStyle(d).fontSize === '28px');
    return el ? getComputedStyle(el).color : null;
  });
  expect(color).not.toBeNull();
  // Verde es el ok del sistema (#25D366 → rgb(37, 211, 102)).
  expect(color).not.toBe('rgb(37, 211, 102)');
});

test('alcanzar el objetivo SÍ se pinta en verde — si no, nunca daría buena noticia', async ({ page }) => {
  await abrirPalancas(page, {
    ...REPORTE,
    palancas: { ...REPORTE.palancas, referralsPer100: 26 },
  });
  const color = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div'))
      .find((d) => (d.textContent || '').trim() === '26' && getComputedStyle(d).fontSize === '28px');
    return el ? getComputedStyle(el).color : null;
  });
  expect(color).toBe('rgb(37, 211, 102)');
});
