import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL RECIBO DEL CARRITO TIENE QUE CUADRAR.
//
// Al convertir el carrito al tratamiento ETIQUETA (dirección visual elegida por el dueño)
// apareció un defecto que la versión anterior escondía: el recibo mostraba
//
//     Subtotal  S/40.90        Combo  -S/1        TOTAL  S/47.90
//
// Ocho soles salidos de la nada. La causa: `payableTotal()` es
// `cartFinalTotal() + deliveryFeeAmount()`, o sea que el envío YA estaba dentro del total,
// mientras la línea de envío decía "se calcula con tu dirección".
//
// El defecto existía antes de esta pantalla — el total siempre incluyó el envío — pero era
// INVISIBLE porque solo se mostraba el número final. Ponerlo en forma de recibo lo hizo
// evidente. Ése es el argumento a favor del recibo: obliga a que la cuenta se pueda seguir.
//
// ⚠ Su modo de fallo es que se ve perfecto. Un recibo descuadrado no lanza ningún error;
// solo le enseña al cliente a desconfiar de la cuenta, justo antes de pagar.

async function carritoConDosItems(page: any) {
  const calls = await gotoApp(page, {});
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const w = window as any;
    w.cart = [
      { type: 'sig', sigId: 'SIG03', size: '30', qty: 1, unitPrice: 34.9, label: 'THE SMOKE 30CM' },
      { type: 'side', code: 'D08', qty: 1, unitPrice: 6, label: 'THE COOL // MINT' },
    ];
    w.sndScreen = 'o_cart';
    w.render();
  });
  await page.waitForTimeout(500);
  return calls;
}

// Lee los montos del recibo tal como los ve el cliente y comprueba la aritmética.
test('las líneas del recibo suman exactamente el total', async ({ page }) => {
  await carritoConDosItems(page);

  const cuenta = await page.evaluate(() => {
    const w = window as any;
    const num = (x: number) => Math.round(x * 100) / 100;
    return {
      subtotal: num(w.cartBaseTotal()),
      combo: num(w.cartComboDiscount()),
      valle: num(w.cartOffPeakDrinkDiscount()),
      envio: num(w.deliveryFeeAmount()),
      total: num(w.payableTotal()),
    };
  });

  // Solo se aplica el mayor de combo y hora valle — nunca los dos (regla del catálogo).
  const descuento = Math.max(cuenta.combo, cuenta.valle);
  const esperado = Math.round((cuenta.subtotal - descuento + cuenta.envio) * 100) / 100;

  expect(
    cuenta.total,
    `el recibo muestra ${cuenta.subtotal} - ${descuento} + ${cuenta.envio} = ${esperado}, ` +
      `pero el total cobrado es ${cuenta.total}`,
  ).toBeCloseTo(esperado, 2);
});

test('el envío aparece en el recibo con su monto, no como una promesa', async ({ page }) => {
  await carritoConDosItems(page);

  const envio = await page.evaluate(() => (window as any).deliveryFeeAmount());
  const texto = await page.locator('text=/TU PEDIDO · NO ES BOLETA/').locator('..').innerText();

  if (envio > 0) {
    // Si ya se está cobrando, el recibo tiene que DECIR cuánto. Decir "se calcula después"
    // mientras el total ya lo incluye es lo que descuadraba la cuenta.
    expect(texto).toMatch(/Envío/);
    expect(texto).not.toMatch(/se calcula con tu dirección/);
  } else {
    expect(texto).toMatch(/se calcula con tu dirección/);
  }
});

test('cada descuento aplicado tiene su propia línea', async ({ page }) => {
  await carritoConDosItems(page);
  const combo = await page.evaluate(() => (window as any).cartComboDiscount());
  test.skip(combo <= 0, 'sin combo aplicado en este carrito no hay línea que comprobar');

  const texto = await page.locator('text=/TU PEDIDO · NO ES BOLETA/').locator('..').innerText();
  // Antes los descuentos eran líneas diminutas en cursiva DEBAJO del total. Quien mirara
  // rápido veía el total y no de dónde salía.
  expect(texto).toMatch(/Combo/);
  expect(texto).toMatch(/Subtotal/);
});
