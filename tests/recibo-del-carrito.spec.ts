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

// EL BLOQUE DE ENVÍO Y EL RECIBO TIENEN QUE DECIR LO MISMO.
//
// Segunda forma del mismo defecto. El recibo ya mostraba "Envío · estimado por zona S/8" y
// lo sumaba al total, mientras el bloque "Envío //" del checkout, en la MISMA pantalla,
// decía "confirma tu ubicación y calculamos el envío al instante" — como si todavía no
// hubiera nada que cobrar. Dos párrafos contando cosas distintas sobre la misma plata.
//
// No es un número mal sumado como el de arriba: es un número que se afirma y se niega a la
// vez. Y el efecto en el cliente es peor, porque lo empuja a creer que el total todavía va
// a subir — justo antes de decidir si paga.
//
// ⚠ Modo de fallo: SILENCIO otra vez. Las dos frases son correctas por separado.
test('el bloque de envío no niega el monto que el recibo ya está cobrando', async ({ page }) => {
  await carritoConDosItems(page);

  const { envio, bloque } = await page.evaluate(() => {
    const w = window as any;
    // ⚠ SIN PIN A PROPÓSITO. `gotoApp` restaura una dirección guardada que YA trae
    // coordenadas, así que sin borrarlas esta prueba ejercitaba la rama CON pin —
    // justamente la que nunca tuvo el defecto— y pasaba en verde midiendo lo que no era.
    // El caso que importa es el del cliente que todavía no confirmó su ubicación: ahí el
    // servidor cae a la tarifa por zona, el recibo la suma, y este bloque decía que el
    // envío se iba a calcular después.
    w._mLat = null;
    w._mLon = null;
    const cont = document.createElement('div');
    cont.innerHTML = w.deliveryZonePickerHTML();
    return { envio: w.deliveryFeeAmount(), bloque: (cont.innerText || cont.textContent || '').trim() };
  });

  expect(bloque, 'deliveryZonePickerHTML() no pintó nada').not.toBe('');
  expect(envio, 'sin pin el servidor cae a la tarifa por zona, así que hay monto que mostrar').toBeGreaterThan(0);

  // Si ya se cobra, el bloque tiene que NOMBRAR el monto, no prometer un cálculo futuro.
  expect(bloque, 'el bloque de envío no dice cuánto se está cobrando').toContain(String(envio));
  expect(bloque, 'el bloque niega un cobro que el recibo ya sumó al total').not.toMatch(
    /calculamos el envío al instante/,
  );
});
