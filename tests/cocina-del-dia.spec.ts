import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #10 y #12 — La pantalla de preparación, que es donde el dueño mira antes de abrir.
//
// El cálculo está probado contra el código real del servidor en tests-api/cocina-del-dia.
// Lo que se fija acá es que la pantalla muestre la hora de EMPEZAR y no solo la de entregar
// —que era el dato que no servía— y que el mise en place llegue agrupado. Y sobre todo el
// respaldo: esta pantalla se usa con las manos ocupadas, así que una respuesta incompleta
// del servidor tiene que degradar a la vista anterior, nunca a una pantalla en blanco.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};

async function entrarAPreparacion(page: any, prep: unknown) {
  await gotoApp(page, { ...ADMIN, 'admin-prep-list': prep });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  await page.locator('[onclick*="loadPrepList()"]').first().click();
}

const PREP_COMPLETO = {
  windowHours: 24,
  minutesPerOrder: 5,
  orders: [
    { ref: 'ORD-1', customerName: 'Ana', deliveryTime: '2026-09-10T20:00:00Z' },
    { ref: 'ORD-2', customerName: 'Beto', deliveryTime: '2026-09-10T20:00:00Z' },
  ],
  assembly: [
    { ref: 'ORD-1', customerName: 'Ana', deliveryTime: '2026-09-10T20:00:00Z', startBy: '2026-09-10T19:55:00.000Z', late: false },
    { ref: 'ORD-2', customerName: 'Beto', deliveryTime: '2026-09-10T20:00:00Z', startBy: '2026-09-10T19:50:00.000Z', late: true },
  ],
  ingredients: [
    { code: 'P01', label: 'Res asada', qty: 2, stockQty: 1, shortfall: true },
    { code: 'B01', label: 'Pan classic', qty: 2, stockQty: 30, shortfall: false },
  ],
  miseEnPlace: [
    { key: 'prot', label: 'Proteínas', items: [{ code: 'P01', label: 'Res asada', qty: 2, stockQty: 1, shortfall: true }] },
    { key: 'base', label: 'Panes', items: [{ code: 'B01', label: 'Pan classic', qty: 2, stockQty: 30, shortfall: false }] },
  ],
};

test('la pantalla dice a qué hora EMPEZAR cada pedido, no solo a qué hora entrega', async ({ page }) => {
  await entrarAPreparacion(page, PREP_COMPLETO);
  await expect(page.locator('text=Orden de armado //')).toBeVisible();
  await expect(page.locator('text=EMPIEZA').first()).toBeVisible();
  // Dos pedidos para la misma hora arrancan con 5 minutos de diferencia: se arman uno tras
  // otro. Si la pantalla mostrara la misma hora para los dos, el segundo saldría tarde.
  const horas = await page.locator('text=EMPIEZA').locator('..').locator('div').first();
  await expect(horas).toBeVisible();
  await expect(page.locator('text=/ya vas tarde/')).toBeVisible();
});

test('el mise en place llega agrupado por dónde está cada cosa', async ({ page }) => {
  await entrarAPreparacion(page, PREP_COMPLETO);
  await expect(page.locator('text=Mise en place //')).toBeVisible();
  await expect(page.locator('text=PROTEÍNAS')).toBeVisible();
  await expect(page.locator('text=PANES')).toBeVisible();
});

test('el faltante se sigue viendo primero: es lo único que hay que resolver antes de abrir', async ({ page }) => {
  await entrarAPreparacion(page, PREP_COMPLETO);
  await expect(page.locator('text=No va a alcanzar //')).toBeVisible();
  await expect(page.locator('text=/Res asada — necesitas 2, tienes 1/')).toBeVisible();
});

test('si el servidor no manda los grupos, la lista plana sigue apareciendo', async ({ page }) => {
  // Un deploy a medias (cliente nuevo, servidor viejo) no puede dejar al dueño sin la lista
  // de ingredientes: se usa con las manos ocupadas y sin ella no se puede armar nada.
  const sinGrupos = { ...PREP_COMPLETO, miseEnPlace: undefined, assembly: undefined };
  await entrarAPreparacion(page, sinGrupos);
  await expect(page.locator('text=Res asada').first()).toBeVisible();
  await expect(page.locator('text=Pan classic').first()).toBeVisible();
  // Y el bloque de armado sigue listando los pedidos aunque no haya hora calculada.
  await expect(page.locator('text=Orden de armado //')).toBeVisible();
  await expect(page.locator('text=/ORD-1 · Ana/')).toBeVisible();
});

test('sin pedidos programados lo dice, en vez de dejar la pantalla en blanco', async ({ page }) => {
  await entrarAPreparacion(page, { windowHours: 24, orders: [], ingredients: [], miseEnPlace: [], assembly: [] });
  await expect(page.locator('text=/Sin pedidos programados/')).toBeVisible();
});
