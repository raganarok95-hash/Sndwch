import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL PÍXEL DE META SE CALLA CUANDO EL CLIENTE SE OPONE (Ley 29733)
//
// La Política de Privacidad dice, palabra por palabra: "si no quieres que midamos tus
// compras para publicidad, apágalo en tu perfil". Esto comprueba que apagarlo apaga algo.
//
// ⚠ MODO DE FALLO: SILENCIO. Si alguien mueve el corte de `fbTrack` a los llamadores, o lo
// borra "porque el servidor ya corta", nada revienta: el pedido se cobra, la pantalla se ve
// igual, el interruptor sigue marcándose. Lo único que cambia es que la app hace lo
// contrario de lo que promete su propio texto legal.

async function conPixel(page: any, optOut: boolean) {
  await gotoApp(page, {
    // El id del píxel viaja al cliente por get-store-hours (es público por diseño).
    'get-store-hours': { hours: [], metaPixelId: '1571699187700546' },
  });
  return await page.evaluate((oo: boolean) => {
    const w = window as any;
    const enviados: string[] = [];
    // Se suplanta `fbq` en vez de dejar cargar el script real de Meta: la prueba mide qué
    // le LLEGA al píxel, no si Meta responde — y no debe hablar con la red de nadie.
    w.fbq = (_m: string, ev: string) => { enviados.push(ev); };
    w.cust = { phone: '999999999', ad_tracking_opt_out: oo };
    w.fbTrack('AddToCart', { currency: 'PEN', value: 20 });
    w.fbTrack('Purchase', { currency: 'PEN', value: 20 }, 'REF-1');
    return enviados;
  }, optOut);
}

test('quien se opuso no le manda NADA al píxel', async ({ page }) => {
  const enviados = await conPixel(page, true);
  expect(enviados, 'el píxel siguió reportando a alguien que apagó la medición').toEqual([]);
});

// La otra mitad importa igual: un corte que apaga a todos deja al negocio sin medir su CAC
// —el bloqueo número uno— y tampoco daría ningún error.
test('quien no se opuso sí se mide, con evento y todo', async ({ page }) => {
  const enviados = await conPixel(page, false);
  expect(enviados).toEqual(['AddToCart', 'Purchase']);
});

test('un invitado sin cuenta se mide igual', async ({ page }) => {
  await gotoApp(page, { 'get-store-hours': { hours: [], metaPixelId: '1571699187700546' } });
  const enviados = await page.evaluate(() => {
    const w = window as any;
    const out: string[] = [];
    w.fbq = (_m: string, ev: string) => { out.push(ev); };
    w.cust = null;
    w.fbTrack('AddToCart', {});
    return out;
  });
  expect(enviados).toEqual(['AddToCart']);
});

// El texto legal es una promesa pública: si alguien lo "simplifica" y borra la vía para
// ejercer el derecho, el interruptor del perfil queda huérfano y nadie lo encuentra.
test('la política dice cómo ejercer el derecho, y nombra la ley', async ({ page }) => {
  await gotoApp(page, {});
  const txt = await page.evaluate(() => {
    const w = window as any;
    w.sndScreen = 'p_legal';
    w.render();
    return document.body.innerText;
  });
  expect(txt, 'la política ya no nombra a Meta pese a que sí se le mandan datos').toContain('Meta');
  expect(txt, 'la política no dice cómo oponerse').toMatch(/apágalo en tu perfil/i);
  expect(txt, 'la política no cita la ley que da el derecho').toContain('29733');
  // Lo que NO se manda tiene que seguir diciéndose: es la mitad tranquilizadora, y la que
  // dejaría de ser cierta si alguien agrega el DNI al evento "para mejorar la coincidencia".
  expect(txt).toMatch(/NO le llegan tu DNI/);
});
