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

const PEDIDO = {
  id: 7,
  ref: 'SW-1042',
  customer_name: 'Ana Torres',
  customer_address: 'Av. España 123, Trujillo',
  summary: 'THE ORIGINAL // 15CM · THE COOL // MINT',
  total: 33.9,
  delivery_fee: 8,
  delivery_km: 4,
  status: 'EN CAMINO',
  payment_status: 'paid',
  payment_method: 'yape',
  date: '10/09/2026 10:12',
  redeemed_reward: null,
};

async function abrirDetalle(page: any, pedido: Record<string, unknown>) {
  await gotoApp(page, {});
  await page.waitForTimeout(500);
  await page.evaluate((o) => {
    const w = window as any;
    w.cust = { id: 1, name: 'Ana Torres', phone: '987654321', points: 0, total_orders: 1, credit_balance: 0 };
    w.myOrders = [o];
    w._sndOd = (o as any).id;
    w.sndScreen = 'p_ord_detail';
    w.render();
  }, pedido);
  await page.waitForTimeout(400);
  return (await page.locator('text=/NO ES BOLETA/').locator('..').innerText()) as string;
}

test('el consumo más el envío dan exactamente el total', async ({ page }) => {
  const txt = await abrirDetalle(page, PEDIDO);

  // innerText mete un salto de línea entre las dos mitades de cada renglón (son filas
  // flex), así que se aplana antes de leer los montos.
  const plano = txt.replace(/\s+/g, ' ');
  const num = (etiqueta: RegExp) => {
    const m = etiqueta.exec(plano);
    return m ? Number(m[1]) : null;
  };
  const consumo = num(/Consumo\s*S\/\s*([\d.]+)/);
  const envio = num(/Envío[^\n]*?S\/\s*([\d.]+)/);
  const total = num(/TOTAL\s*S\/\s*([\d.]+)/);

  expect(consumo, 'el comprobante no separa el consumo del envío').not.toBeNull();
  expect(envio).not.toBeNull();
  expect(total).not.toBeNull();
  expect(
    Math.round((consumo! + envio!) * 100) / 100,
    `el comprobante dice ${consumo} + ${envio} pero cobra ${total}`,
  ).toBeCloseTo(total!, 2);
  // El envío se cobró por distancia real: los km medidos van en la línea, porque son la
  // única forma de que el cliente entienda por qué pagó ese monto y no otro.
  expect(txt).toMatch(/4 km/);
});

// Un pedido consultado por referencia, sin sesión, puede no traer la columna del envío.
// Partir el total con un número inventado sería peor que no partirlo.
test('sin el dato del envío no se inventa un desglose', async ({ page }) => {
  const sinEnvio = { ...PEDIDO, delivery_fee: undefined, delivery_km: undefined };
  const txt = await abrirDetalle(page, sinEnvio as any);

  expect(txt, 'inventó una línea de consumo sin saber cuánto fue el envío').not.toMatch(/Consumo/);
  expect(txt, 'el total sí se muestra siempre').toMatch(/TOTAL/);
  expect(txt).toMatch(/33\.90/);
});
