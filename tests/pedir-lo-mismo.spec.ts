import { test, expect } from '@playwright/test';
import { gotoApp, pedirUnSignature } from './helpers';

// «PEDIR LO MISMO» COBRA LA CARTA DE HOY (2026-10-01).
//
// Promesa: repetir un pedido arma el carrito con los productos de ese pedido y el PRECIO DE HOY.
// Modo de fallo silencioso: el ítem viejo trae guardado el precio con que se pagó; si el carrito
// lo usara, el total no coincidiría con el que calcula el servidor y el pedido se rechazaría
// al pagar (o, peor, se mostraría un precio que ya no existe). Nada revienta al tocar el botón.

test('repetir un pedido viejo arma el carrito con el precio de hoy', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await pedirUnSignature(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const hoy = w.cartTotal ? w.cartTotal() : w.payableTotal();
    // El mismo ítem, como volvería de un pedido viejo: con un precio guardado que ya no rige.
    const viejo = w.cart.map((it: any) => ({ ...it, precio: 1, price: 1, unitPrice: 1 }));
    w.cart = []; w.saveCart();
    w.loadCart(viejo);
    const repetido = w.cartTotal ? w.cartTotal() : w.payableTotal();
    return { hoy, repetido, n: w.cart.length };
  });
  expect(r.n).toBeGreaterThan(0);
  expect(r.repetido).toBe(r.hoy);
});
