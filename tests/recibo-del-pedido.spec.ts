import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL COMPROBANTE DE UN PEDIDO YA PAGADO TAMBIÉN TIENE QUE CUADRAR.
//
// De todas las pantallas de la app, el detalle de un pedido es la que el dueño describió
// cuando eligió ETIQUETA "solo para los recibos de pago": un pedido cerrado, mirado después.
//
// Mostraba un número grande y nada más. Y `total` INCLUYE el envío, así que el cliente veía
// un monto que no coincidía con lo que recordaba haber pedido, sin ninguna forma de saber
// por qué. Es el mismo defecto que descuadraba el recibo del carrito — con la diferencia de
// que acá el pedido ya está cerrado y no puede preguntar.
//
// ⚠ Modo de fallo: SILENCIO. Un comprobante que no cuadra no lanza nada. Solo le enseña al
// cliente que la cuenta del negocio no se puede seguir.

// Desde el recibo kraft (maqueta aprobada detalle-de-un-pedido.png, 2026-09-30) cada línea
// lleva el precio que el servidor guardó ese día; los descuentos salen de la resta.
const PEDIDO = {
  id: 7,
  ref: 'SW-1042',
  customer_name: 'Ana Torres',
  customer_address: 'Av. España 123, Trujillo',
  summary: 'pedido de prueba',
  total: 33.9,
  delivery_fee: 8,
  delivery_km: 4,
  status: 'EN CAMINO',
  payment_status: 'paid',
  payment_method: 'yape',
  created_at: '2026-09-10T15:12:00.000Z',
  redeemed_reward: null,
};

async function abrirDetalle(page: any, pedido: Record<string, unknown>, conPrecio = true) {
  await gotoApp(page, {});
  await page.waitForTimeout(500);
  await page.evaluate(([o, conPrecio]) => {
    const w = window as any;
    // Una línea de la carta de verdad y una bebida: 20.90 + 6.00 = 26.90 de lista; se pagó
    // 25.90 de comida (33.90 − 8 de envío), así que hubo 1.00 de combo.
    const sig = { type: 'sig', sigId: w.SIGS[0].id, size: '15', qty: 1, precio: conPrecio ? 20.9 : undefined };
    const beb = { type: 'side', code: w.SIDES[0].id, qty: 1, precio: conPrecio ? 6 : undefined };
    w.cust = { id: 1, name: 'Ana Torres', phone: '987654321', points: 0, total_orders: 1, credit_balance: 0 };
    w.myOrders = [{ ...(o as any), items: [sig, beb] }];
    w._sndOd = (o as any).id;
    w.sndScreen = 'p_ord_detail';
    w.render();
  }, [pedido, conPrecio] as const);
  await page.locator('.mod').waitFor();
  return (await page.locator('.mod').innerText()).replace(/\s+/g, ' ') as string;
}
const num = (plano: string, re: RegExp) => { const m = re.exec(plano); return m ? Number(m[1]) : null; };

test('las líneas, menos los descuentos, más el envío dan exactamente lo que se pagó', async ({ page }) => {
  await abrirDetalle(page, PEDIDO);
  const lineas = await page.locator('.mod .ln > span').allInnerTexts();
  expect(lineas.length, 'el recibo no muestra el precio de cada línea').toBe(2);
  const suma = lineas.reduce((a: number, t: string) => a + Number(t), 0);
  const plano = (await page.locator('.mod').innerText()).replace(/\s+/g, ' ');
  const desc = num(plano, /descuentos\s*−\s*([\d.]+)/i) ?? 0;
  const envio = num(plano, /Envío[^−]*?pagado con Yape\s*([\d.]+)/i);
  const total = num(plano, /Pagaste\s*S\/\s*([\d.]+)/);
  expect(envio, 'el envío no está en el recibo').not.toBeNull();
  expect(total).not.toBeNull();
  expect(Math.round((suma - desc + envio!) * 100) / 100, `líneas ${suma} − ${desc} + ${envio} no dan ${total}`).toBeCloseTo(total!, 2);
  expect(desc, 'el combo no aparece').toBeCloseTo(1, 2);
  // Los km medidos van en la línea: son la única forma de entender por qué ese envío.
  expect(plano).toMatch(/4 km/i);
});

// Un pedido anterior al precio por línea no lo trae: recalcular con la carta de hoy daría un
// número que el cliente nunca pagó. Se muestra lo que se pidió, sin precios, y el total.
test('sin el precio guardado no se inventan precios por línea', async ({ page }) => {
  const txt = await abrirDetalle(page, PEDIDO, false);
  await expect(page.locator('.mod .ln')).toHaveCount(2);
  await expect(page.locator('.mod .ln > span')).toHaveCount(0);
  expect(txt, 'inventó un descuento sin saber los precios').not.toMatch(/descuentos/i);
  expect(txt).toMatch(/33\.90/);
});

// Un pedido consultado por referencia, sin sesión, puede no traer la columna del envío.
test('sin el dato del envío no se inventa una línea de envío', async ({ page }) => {
  const txt = await abrirDetalle(page, { ...PEDIDO, delivery_fee: undefined, delivery_km: undefined } as any);
  expect(txt).not.toMatch(/Envío/);
  expect(txt).toMatch(/Pagaste/);
  expect(txt).toMatch(/33\.90/);
});
