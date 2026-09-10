import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Una bebida se tenía que poder comprar sola, y no se podía llegar a ella.
//
// El checkout NUNCA exigió un sándwich — solo mira `cart.length` —, así que un pedido de
// pura bebida ya funcionaba de punta a punta. Lo que no existía era el camino: el único
// acceso a las bebidas era un botón DENTRO de la pantalla del carrito, o sea que para
// comprar una bebida había que armar un sándwich primero. El dueño lo reportó probando
// la app.
//
// Importa por plata, no por comodidad: las infusiones cuestan 19-32% de su precio contra
// ~45% de un sándwich, así que son el ítem de mejor margen del catálogo. Esconderlas
// detrás de otra compra era regalar la venta más rentable.
//
// ⚠ EL MODO DE FALLO DE ESTO ES SILENCIO. Si alguien quita la pestaña, no revienta nada:
// las bebidas simplemente vuelven a ser inalcanzables y la app se ve perfectamente bien.
// Por eso la prueba fija el CAMINO COMPLETO — llegar, agregar, y pagar sin sándwich — y
// no solo que el botón exista.

test('se puede pedir una bebida sola, sin armar ningún sándwich', async ({ page }) => {
  const calls = await gotoApp(page, {});

  // 1 · Llegar. La pestaña vive en el menú, al lado de los Signatures y ARMA EL TUYO.
  await page.getByRole('button', { name: 'Bebidas' }).click();
  await expect(page.getByText('The Cool', { exact: false }).first()).toBeVisible();

  // 2 · Agregar, sin pasar por el armador.
  await page.locator('[onclick*="addSideToCart(\'D08\')"]').first().click();

  // 3 · El carrito acepta un pedido que no lleva ni un sándwich. Se llega por la tarjeta
  // del home, que aparece recién cuando el carrito tiene algo — o sea que su sola
  // presencia ya prueba que la bebida entró sin pasar por el armador.
  await page.locator('[onclick*="o_cart"]').first().click();
  await expect(page.locator('text=The Cool').first()).toBeVisible();

  // Y el botón de pagar queda habilitado: si algún día alguien agrega una guarda de
  // "mínimo un sándwich", esto falla acá en vez de en producción.
  const pagar = page.locator('[onclick*="doOrder()"]');
  await expect(pagar.first()).toBeVisible();
  expect(calls.length).toBeGreaterThan(0);
});

// La promesa se dice en la pantalla, no solo se cumple en el código: alguien que llega a
// la pestaña tiene que saber que puede pedir la bebida sola, o va a armar un sándwich
// igual "por si acaso".
test('la pestaña dice que la bebida se puede pedir sola', async ({ page }) => {
  await gotoApp(page, {});
  await page.getByRole('button', { name: 'Bebidas' }).click();
  await expect(page.locator('text=/no hace falta armar un sándwich/i')).toBeVisible();
});
