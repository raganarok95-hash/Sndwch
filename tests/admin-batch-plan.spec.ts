import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// C6 — Proyecta cuánto cocinar en la próxima tanda a partir del consumo real. Lo aprobó el
// dueño sabiendo que necesita 3-4 semanas de ventas reales para valer algo, así que lo que
// más importa probar NO son las cantidades (las calcula el servidor) sino que la pantalla
// trate la FIABILIDAD como el dato principal: con pocos días de historial, una proyección
// es un número inventado con aspecto de dato, y el aspecto de dato es lo que hace que se
// le crea.

const MOCK_ORDER = {
  id: 'ord-batch-1',
  ref: 'ORD-BAT0001-AAAA',
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

const ITEM = {
  code: 'P01',
  name: 'RES // ASADO',
  usedInWindow: 60,
  perDay: 3,
  committed: 4,
  needed: 15,
  stock: 4,
  toCook: 11,
  stockTracked: true,
};

function plan(extra: any = {}) {
  return {
    coverDays: 4,
    lookbackDays: 28,
    daysOfData: 20,
    ordersConsidered: 60,
    scheduledConsidered: 2,
    safetyFactor: 1.25,
    reliable: true,
    minDaysOfData: 14,
    minOrders: 20,
    items: [ITEM],
    ...extra,
  };
}

async function abrirPlan(page: any, handlers: any) {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    ...handlers,
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await page.locator('[onclick*="loadBatchPlan()"]').first().click();
  await expect(page.locator('text=PLAN DE TANDA')).toBeVisible();
  return calls;
}

test('con historial suficiente muestra cuánto cocinar y de dónde sale el número', async ({ page }) => {
  await abrirPlan(page, { 'admin-batch-plan': () => plan() });

  await expect(page.locator('text=RES // ASADO')).toBeVisible();
  await expect(page.locator('text=COCINAR')).toBeVisible();
  await expect(page.locator('text=/Necesitas 15 · tienes 4/')).toBeVisible();
  // El razonamiento va a la vista, no solo el resultado: un número sin su origen no se
  // puede corregir cuando la realidad de la cocina dice otra cosa.
  await expect(page.locator('text=/usaste 60 en 20 día\\(s\\)/')).toBeVisible();
  await expect(page.locator('text=/4 ya pedido\\(s\\)/')).toBeVisible();
  await expect(page.locator('text=/Todavía es una referencia/')).toHaveCount(0);
});

test('con poco historial el aviso va primero, antes que cualquier cantidad', async ({ page }) => {
  await abrirPlan(page, {
    'admin-batch-plan': () => plan({ reliable: false, daysOfData: 3, ordersConsidered: 5 }),
  });

  const aviso = page.locator('text=/Todavía es una referencia, no una indicación/');
  await expect(aviso).toBeVisible();
  await expect(page.locator('text=/Hay 5 pedido\\(s\\) en 3 día\\(s\\)/')).toBeVisible();
  // Literalmente arriba: si las cifras aparecieran primero se leerían como indicación y
  // el aviso quedaría como letra chica.
  const avisoY = (await aviso.boundingBox())!.y;
  const itemY = (await page.locator('text=RES // ASADO').boundingBox())!.y;
  expect(avisoY).toBeLessThan(itemY);
});

test('cambiar los días a cubrir vuelve a pedir el plan con ese horizonte', async ({ page }) => {
  const calls = await abrirPlan(page, { 'admin-batch-plan': (body: any) => plan({ coverDays: body.coverDays }) });

  await page.getByText('7 días', { exact: true }).click();
  await expect.poll(() => calls.filter((c) => c.action === 'admin-batch-plan').length).toBeGreaterThan(1);
  const ultima = calls.filter((c) => c.action === 'admin-batch-plan').pop()!;
  expect(ultima.body.coverDays).toBe(7);
});

test('un insumo sin rastreo de cantidad no inventa un número para cocinar', async ({ page }) => {
  await abrirPlan(page, {
    'admin-batch-plan': () => plan({ items: [{ ...ITEM, stock: null, toCook: null, stockTracked: false }] }),
  });

  // Asumir cero haría cocinar de más; asumir que alcanza, quedarse corto. Se dice que
  // falta el dato y dónde ponerlo.
  await expect(page.locator('text=/sin rastreo de cantidad/')).toBeVisible();
  await expect(page.locator('text=/ponle un número en Inventario/')).toBeVisible();
});
