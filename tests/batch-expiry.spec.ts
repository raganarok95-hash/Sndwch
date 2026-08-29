import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #5 — Caducidad de tanda. SEGURIDAD ALIMENTARIA, no optimización de merma.
//
// El dueño cocina por tandas 1-2 veces por semana y en hora de servicio solo ARMA: hay
// proteína cocida esperando en frío durante días. El modo de fallo de esto no es un error
// visible, es SILENCIO — si la pantalla no dice qué tanda está vieja, el insumo se ve
// exactamente igual que uno recién hecho y se usa.
//
// Lo que fija este test: la fila de inventario dice de cuándo es la tanda y en qué estado
// está, una tanda vencida se lee como prohibición y no como dato, la vida útil se puede
// cambiar por insumo desde el panel (sin sesión de código, que es lo que este repo ya
// aprendió con los precios), y un insumo sin tanda registrada NO recibe una fecha inventada.

const MOCK_ORDER = {
  id: 'ord-cad-1',
  ref: 'ORD-CAD00001-AAAA',
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

const haceHoras = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

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

const BASE = {
  login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
  'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
};

test('una tanda vencida se lee como prohibición, no como un dato más', async ({ page }) => {
  await gotoApp(page, {
    ...BASE,
    'get-catalog': { inventory: { P01: { inStock: true, qty: 6 } } },
    'admin-inventory-batches': {
      // Cocinada hace 80 h con 3 días (72 h) de vida útil: venció hace 8.
      batches: { P01: { cookedAt: haceHoras(80), shelfLifeDays: 3, estado: 'vencida' } },
      warnHours: 24,
      defaultDays: 3,
    },
  });
  await abrirInventario(page);

  // "No usar" y no un simple "vencida": la fila tiene que decir qué hacer, porque se lee
  // con las manos en la comida.
  await expect(page.locator('text=/VENCIDA hace 8 h\\. No usar/')).toBeVisible();
});

test('una tanda por vencer avisa con las horas que quedan', async ({ page }) => {
  await gotoApp(page, {
    ...BASE,
    'get-catalog': { inventory: { P01: { inStock: true, qty: 6 } } },
    'admin-inventory-batches': {
      // Hace 52 h de 72: quedan 20, dentro de la ventana de aviso de 24.
      batches: { P01: { cookedAt: haceHoras(52), shelfLifeDays: 3, estado: 'por-vencer' } },
      warnHours: 24,
      defaultDays: 3,
    },
  });
  await abrirInventario(page);
  await expect(page.locator('text=/vence en 20 h/')).toBeVisible();
});

test('un insumo sin tanda registrada no recibe una fecha inventada', async ({ page }) => {
  await gotoApp(page, {
    ...BASE,
    // D06 es una bebida que se compra ya lista: nunca hubo una tanda que cocinar.
    'get-catalog': { inventory: { D06: { inStock: true, qty: 30 } } },
    'admin-inventory-batches': {
      batches: { D06: { cookedAt: null, shelfLifeDays: 3, estado: 'sin-tanda' } },
      warnHours: 24,
      defaultDays: 3,
    },
  });
  await abrirInventario(page);
  // Ninguna fila puede hablar de una tanda que no existe.
  await expect(page.locator('text=/Tanda del/')).toHaveCount(0);
});

test('la vida útil se cambia por insumo desde el panel, sin tocar código', async ({ page }) => {
  const calls = await gotoApp(page, {
    ...BASE,
    'get-catalog': { inventory: { P01: { inStock: true, qty: 6 } } },
    'admin-inventory-batches': {
      batches: { P01: { cookedAt: haceHoras(10), shelfLifeDays: 3, estado: 'ok' } },
      warnHours: 24,
      defaultDays: 3,
    },
    'admin-inventory-set-shelf-life': (body: any) => ({ success: true, days: body.days }),
  });
  await abrirInventario(page);

  const campo = page.locator('#vida-P01');
  await expect(campo).toBeVisible();
  // Precargado con lo que la base dice de ESE insumo, no con el default global.
  await expect(campo).toHaveValue('3');

  await campo.fill('7');
  await page.locator('[onclick*="setShelfLife(\'P01\'"]').click();

  await expect
    .poll(() => calls.filter((c) => c.action === 'admin-inventory-set-shelf-life').length)
    .toBeGreaterThan(0);
  const guardado = calls.find((c) => c.action === 'admin-inventory-set-shelf-life');
  expect(guardado.body.code).toBe('P01');
  expect(guardado.body.days).toBe(7);
});

test('si la lectura de tandas falla, el inventario se sigue pudiendo usar', async ({ page }) => {
  // Perder la fecha de caducidad empeora la pantalla; dejar al dueño sin inventario en
  // plena hora de servicio la inutiliza. El fallo tiene que degradar, no bloquear.
  await gotoApp(page, {
    ...BASE,
    'get-catalog': { inventory: { P01: { inStock: true, qty: 6 } } },
    // Sin mock: el helper responde 400 a cualquier acción no mockeada, que es justo el
    // fallo que se quiere provocar.
  });
  await abrirInventario(page);
  await expect(page.locator('#qty-P01')).toBeVisible();
  await expect(page.locator('text=/Tanda del/')).toHaveCount(0);
});
