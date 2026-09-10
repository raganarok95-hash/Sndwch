import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// SE PUEDE CARGAR UNA RECETA DESDE EL PANEL.
//
// `admin-recipe-set` existía en el servidor desde que se creó la pantalla de Recetas, con su
// código, sus validaciones y su historial append-only. Lo que NUNCA existió es una pantalla
// que lo llamara: el panel solo LEÍA. O sea que CLAUDE.md decía "las demás las carga el dueño
// desde el panel" y desde el panel no se podía cargar ninguna.
//
// ⚠ Modo de fallo: SILENCIO, y del peor tipo. El backend compila, la acción responde bien a
// quien la llame, `deno check` no ve nada raro y ninguna prueba falla. Simplemente no hay
// forma de usarla. Es el mismo defecto que dejó `actAdminRetentionReport` importada y sin
// registrar durante meses.

const RECETA = {
  recipe_code: 'P01',
  name: 'Res asada mechada',
  yield_portions: 24,
  portion_grams: 85,
  ingredients: [
    { item: 'Punta de pecho', qty: 2.5, unit: 'kg' },
    { item: 'Sal', qty: 40, unit: 'g' },
  ],
  steps: [
    { label: 'Sellado', minutes: 15 },
    { label: 'Braseado', minutes: 180 },
  ],
};

async function panelDeRecetas(page: any) {
  const calls = await gotoApp(page, {
    'admin-recipes': { recipes: [RECETA], targetPortions: null },
    'admin-recipe-set': { success: true },
  });
  await page.evaluate(() => (window as any).loadAdminBundle());
  await page.waitForFunction(() => typeof (window as any).loadRecipes === 'function', null, { timeout: 10000 });
  await page.evaluate(() => {
    const w = window as any;
    w.isAdmin = true;
    w.token = 'tok';
  });
  await page.evaluate(() => (window as any).loadRecipes(''));
  await page.waitForFunction(() => !!(window as any).recipesData, null, { timeout: 10000 });
  return calls;
}

test('el panel manda al servidor exactamente lo que se escribió', async ({ page }) => {
  const calls = await panelDeRecetas(page);

  await page.evaluate(() => {
    const w = window as any;
    w.recipeForm = {
      code: 'P09',
      name: 'Pollo cajún',
      yield: '18',
      grams: '85',
      // El formato de texto es el que el dueño escribe: una línea por ingrediente.
      ing: 'Pechuga | 3 | kg\nPáprika | 60 | g',
      steps: 'Marinado | 240\nHorno | 35',
    };
    w.recipeFormOpen = true;
    w.render();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => (window as any).doPublishRecipe());
  await page.waitForTimeout(600);

  const enviado = calls.find((c: any) => c.action === 'admin-recipe-set');
  expect(enviado, 'el panel no llamó a admin-recipe-set').toBeTruthy();
  expect(enviado!.body.recipeCode).toBe('P09');
  expect(enviado!.body.yieldPortions).toBe(18);
  // Los números tienen que llegar como NÚMEROS: la columna los espera así, y una cantidad
  // en texto haría que el escalado y el costo por porción den cualquier cosa.
  expect(enviado!.body.ingredients).toEqual([
    { item: 'Pechuga', qty: 3, unit: 'kg' },
    { item: 'Páprika', qty: 60, unit: 'g' },
  ]);
  expect(enviado!.body.steps).toEqual([
    { label: 'Marinado', minutes: 240 },
    { label: 'Horno', minutes: 35 },
  ]);
});

// Corregir una receta = cargarla y publicarla de nuevo (la tabla es append-only). Si el
// precargado perdiera un ingrediente, el dueño publicaría una versión incompleta creyendo
// que solo cambió el nombre.
test('cargar una receta existente la trae ENTERA al formulario', async ({ page }) => {
  await panelDeRecetas(page);
  const f = await page.evaluate(() => {
    (window as any).recipeFormLoad('P01');
    return (window as any).recipeForm;
  });
  expect(f.code).toBe('P01');
  expect(f.name).toBe('Res asada mechada');
  expect(f.yield).toBe('24');
  expect(f.ing).toBe('Punta de pecho | 2.5 | kg\nSal | 40 | g');
  expect(f.steps).toBe('Sellado | 15\nBraseado | 180');
});

// La unidad mal escrita no se puede detectar (comprar en kg y escribir g es válido como
// texto), pero una cantidad vacía o cero sí — y publicarla dejaría el costo por porción
// mintiendo sin que nada avise.
test('una cantidad inválida se detiene ANTES de llegar al servidor', async ({ page }) => {
  const calls = await panelDeRecetas(page);
  await page.evaluate(() => {
    const w = window as any;
    w.recipeForm = { code: 'P09', name: 'Prueba', yield: '10', grams: '', ing: 'Pechuga | | kg', steps: '' };
    w.recipeFormOpen = true;
    w.render();
  });
  await page.evaluate(() => (window as any).doPublishRecipe());
  await page.waitForTimeout(400);

  expect(calls.find((c: any) => c.action === 'admin-recipe-set'), 'mandó una receta con una cantidad vacía').toBeFalsy();
  const msg = await page.evaluate(() => (window as any).recipeFormMsg);
  expect(msg, 'no le dijo al dueño qué línea está mal').toMatch(/ingredientes/i);
});

test('una receta sin ingredientes no se publica', async ({ page }) => {
  const calls = await panelDeRecetas(page);
  await page.evaluate(() => {
    const w = window as any;
    w.recipeForm = { code: 'P09', name: 'Vacía', yield: '10', grams: '', ing: '', steps: 'Horno | 20' };
    w.recipeFormOpen = true;
    w.render();
  });
  await page.evaluate(() => (window as any).doPublishRecipe());
  await page.waitForTimeout(400);
  expect(calls.find((c: any) => c.action === 'admin-recipe-set')).toBeFalsy();
});
