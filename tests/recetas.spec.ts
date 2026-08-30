import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #9 / #3 / #4 — La pantalla de recetas.
//
// El escalado, el acumulado de tiempos y la fecha límite están probados contra el código
// real del servidor en tests-api/recetas.test.ts. Lo que se fija acá es lo que decide si la
// pantalla sirve para cocinar con ella al lado:
//   · que el escalado se pida al SERVIDOR y no se calcule en el cliente (dos sitios
//     calculando cuánto comprar es la forma de que un día digan cosas distintas),
//   · que la cantidad base quede visible junto a la escalada — sin ella no hay forma de
//     notar que el factor está mal,
//   · que los TIEMPOS no se escalen: duplicar la tanda no duplica el braseado, y decir que
//     sí haría planificar contra un número falso.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
};

const RECETA_BASE = {
  recipe_code: 'P01',
  name: 'Res asada mechada',
  yield_portions: 38,
  portion_grams: 85,
  ingredients: [
    { item: 'Punta de pecho (brisket)', qty: 6000, unit: 'g' },
    { item: 'Sal', qty: 72, unit: 'g' },
  ],
  steps: [{ label: 'Sellar', minutes: 15 }, { label: 'Brasear', minutes: 55 }, { label: 'Salar al gusto', minutes: null }],
  notes: 'Probar la sal EN FRIO.',
  timeline: {
    steps: [
      { label: 'Sellar', minutes: 15, startsAtMinute: 0 },
      { label: 'Brasear', minutes: 55, startsAtMinute: 15 },
      { label: 'Salar al gusto', minutes: null, startsAtMinute: 70 },
    ],
    totalMinutes: 70,
  },
  shelfLifeDays: 3,
  scaled: null,
};

async function entrarARecetas(page: any, respuesta: unknown) {
  const calls = await gotoApp(page, { ...ADMIN, 'admin-recipes': respuesta });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  await page.locator('[onclick*="loadRecipes()"]').first().click();
  return calls;
}

test('muestra la receta tal como está escrita cuando no se pidió escalar', async ({ page }) => {
  await entrarARecetas(page, { recipes: [RECETA_BASE], targetPortions: null });
  await expect(page.locator('text=Res asada mechada')).toBeVisible();
  await expect(page.locator('text=/P01 · RINDE 38 × 85g/')).toBeVisible();
  await expect(page.locator('text=/6000 g/')).toBeVisible();
  // El total de la tanda es lo que decide si entra hoy o hay que empezar mañana.
  await expect(page.locator('text=/1h 10m/')).toBeVisible();
});

test('el escalado se le pide al servidor, no se calcula en el cliente', async ({ page }) => {
  // Es la decisión de cuánto comprar: tenerla en dos sitios es la forma de que un día digan
  // cosas distintas, que es el defecto que este proyecto ya pagó con los precios fantasma.
  const calls = await entrarARecetas(page, { recipes: [RECETA_BASE], targetPortions: null });
  await page.locator('#rec-target').fill('76');
  await page.getByRole('button', { name: 'Calcular' }).click();
  const pedidas = calls.filter((c) => c.action === 'admin-recipes');
  expect(pedidas.length).toBeGreaterThan(1);
  expect(pedidas[pedidas.length - 1].body.targetPortions).toBe(76);
});

test('con escalado, la cantidad base sigue visible al lado de la nueva', async ({ page }) => {
  await entrarARecetas(page, {
    targetPortions: 76,
    recipes: [{
      ...RECETA_BASE,
      scaled: [
        { item: 'Punta de pecho (brisket)', qty: 6000, unit: 'g', scaledQty: 12000 },
        { item: 'Sal', qty: 72, unit: 'g', scaledQty: 144 },
      ],
    }],
  });
  await expect(page.locator('text=/INGREDIENTES · PARA 76/')).toBeVisible();
  await expect(page.locator('text=/12000 g/')).toBeVisible();
  // Sin la base al lado no hay forma de notar que el factor está mal.
  await expect(page.locator('text=/\\(base 6000\\)/')).toBeVisible();
});

test('los tiempos NO se escalan aunque se duplique la tanda', async ({ page }) => {
  // Duplicar la carne no duplica el braseado. Escalar el tiempo haría planificar la jornada
  // contra un número que no existe.
  await entrarARecetas(page, {
    targetPortions: 76,
    recipes: [{ ...RECETA_BASE, scaled: [{ item: 'Sal', qty: 72, unit: 'g', scaledQty: 144 }] }],
  });
  await expect(page.locator('text=/1h 10m/')).toBeVisible();
  await expect(page.getByRole('button', { name: /55 min/ })).toBeVisible();
});

test('una etapa sin tiempo se muestra como paso, pero sin cronómetro inventado', async ({ page }) => {
  await entrarARecetas(page, { recipes: [RECETA_BASE], targetPortions: null });
  await expect(page.locator('text=Salar al gusto')).toBeVisible();
  await expect(page.locator('text=sin tiempo')).toBeVisible();
});

test('la etiqueta dice de dónde sale la fecha límite, y avisa si falta', async ({ page }) => {
  // Que la vida útil venga del Inventario y no de la receta no es un detalle interno: es lo
  // que evita tener dos números para la misma cosa. La pantalla lo dice para que el dueño
  // sepa dónde cambiarlo.
  await entrarARecetas(page, { recipes: [RECETA_BASE], targetPortions: null });
  await expect(page.getByRole('button', { name: /Imprimir 38 etiquetas/ })).toBeVisible();
  await expect(page.locator('text=/límite a 3 días, tomado del inventario/')).toBeVisible();

  await entrarARecetas(page, { recipes: [{ ...RECETA_BASE, shelfLifeDays: null }], targetPortions: null });
  await expect(page.locator('text=/Sin vida útil configurada/')).toBeVisible();
  await expect(page.locator('text=/Se configura en Inventario/')).toBeVisible();
});

test('sin recetas cargadas lo dice, en vez de una pantalla vacía', async ({ page }) => {
  await entrarARecetas(page, { recipes: [], targetPortions: null });
  await expect(page.locator('text=/Todavía no hay ninguna receta cargada/')).toBeVisible();
});
