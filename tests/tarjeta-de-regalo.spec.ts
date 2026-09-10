import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA TARJETA DE REGALO TIENE QUE AYUDAR A DECIDIR, Y NO PROMETER UN RANGO QUE NO EXISTE
//
// Era la pantalla más vacía de la app: dos campos y un botón. Regalar exige decidir un
// número, y decidir un número en abstracto es justo donde la gente abandona.
//
// ⚠ MODO DE FALLO: SILENCIO, en dos formas.
//  · Los montos sugeridos escritos a mano dejarían de alcanzar para lo que prometen el día
//    que un Signature suba de precio. Un regalo que se queda corto en la caja es peor que
//    no haberlo sugerido, y nada avisaría.
//  · Los límites (S/10-S/500) estaban ESCRITOS A MANO en el cliente mientras el servidor
//    los tiene como constantes: mover el tope en el servidor dejaba a la app ofreciendo un
//    monto que el checkout después rechaza.

const CUST = { phone: '999888777', name: 'Juan', points: 2000, credit_balance: 0, total_orders: 30 };

async function pantalla(page: any, cust: any = CUST) {
  await gotoApp(page, {});
  await page.evaluate((c: any) => {
    const w = window as any;
    w.cust = c; w.token = 't'; w.gcAmt = ''; w.gcPhone = ''; w.gcMsg = '';
    w.sndScreen = 'gift_card'; w.render();
  }, cust);
  await page.waitForTimeout(300);
}

test('los montos sugeridos salen del catálogo y alcanzan para lo que prometen', async ({ page }) => {
  await pantalla(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const publicos = w.SIGS.filter((x: any) => !x.secret);
    return {
      sug: w.giftSugerencias(),
      p15: Math.min(...publicos.map((x: any) => x.p15).filter(Boolean)),
      p30: Math.min(...publicos.map((x: any) => x.p30).filter(Boolean)),
    };
  });
  expect(r.sug.length).toBeGreaterThan(1);
  const un15 = r.sug.find((x: any) => x.t === 'Un 15CM');
  const un30 = r.sug.find((x: any) => x.t === 'Un 30CM');
  // Lo único que no se puede romper: el monto tiene que ALCANZAR para el producto que
  // nombra. Redondear hacia abajo dejaría al que recibe el regalo pagando la diferencia
  // de algo que se le prometió entero.
  expect(un15.v, 'el monto "Un 15CM" no alcanza para el 15CM más barato').toBeGreaterThanOrEqual(r.p15);
  expect(un30.v, 'el monto "Un 30CM" no alcanza para el 30CM más barato').toBeGreaterThanOrEqual(r.p30);
  // Y no puede pasarse tanto que deje de ser un regalo razonable.
  expect(un15.v - r.p15).toBeLessThan(5);
});

test('ningún monto sugerido cae fuera de lo que el servidor acepta', async ({ page }) => {
  await pantalla(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    return { sug: w.giftSugerencias(), min: w.GIFT_CARD_AMOUNT_MIN, max: w.GIFT_CARD_AMOUNT_MAX };
  });
  for (const x of r.sug) {
    expect(x.v, `el monto S/${x.v} está fuera del rango que el servidor acepta`).toBeGreaterThanOrEqual(r.min);
    expect(x.v).toBeLessThanOrEqual(r.max);
  }
});

test('el rango que se muestra sale de las constantes, no de un texto escrito', async ({ page }) => {
  await pantalla(page);
  const txt = await page.evaluate(() => document.body.innerText);
  const { min, max } = await page.evaluate(() => {
    const w = window as any;
    return { min: w.GIFT_CARD_AMOUNT_MIN, max: w.GIFT_CARD_AMOUNT_MAX };
  });
  expect(txt).toContain(`S/${min}`);
  expect(txt).toContain(`S/${max}`);
});

// El caso que más se va a dar: un cliente nuevo mirando una pantalla donde nada le alcanza.
// Tres montos apagados sin explicación dicen "no puedes" tres veces sin decir cuánto falta.
test('a quien no le alcanza se le dice cuánto falta, y en pedidos', async ({ page }) => {
  await pantalla(page, { ...CUST, points: 340 });
  const txt = await page.evaluate(() => document.body.innerText);
  expect(txt, 'no dice que todavía no alcanza').toMatch(/no te alcanza/i);
  expect(txt, 'no dice cuántos puntos faltan').toMatch(/60 pts/);
  expect(txt, 'no traduce lo que falta a pedidos').toMatch(/pedidos?/i);
});

// El saldo de puntos que solo se ve ANTES de gastar deja al cliente haciendo la resta de
// cabeza justo en el momento de decidir.
test('al elegir un monto se ve el costo y lo que queda', async ({ page }) => {
  await pantalla(page);
  await page.evaluate(() => (window as any).giftElegirMonto(20));
  await page.waitForTimeout(300);
  const txt = await page.evaluate(() => document.body.innerText);
  expect(txt).toMatch(/800 pts/);       // 20 × GIFT_CARD_POINTS_PER_SOL
  expect(txt).toMatch(/Te quedan/i);
  expect(txt).toMatch(/1200 pts/);      // 2000 − 800
});
