import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL ARMADOR TIENE QUE COBRAR LO MISMO QUE EL CARRITO.
//
// `total()` (el precio que el armador y la confirmación muestran) y `itemUnitPrice()` (el
// que usan el carrito, el checkout y el mensaje de WhatsApp) eran DOS implementaciones de
// la misma fórmula. Ya habían divergido: `itemUnitPrice` suma el recargo del pan de
// focaccia y `total()` no.
//
// Efecto real: en ARMA EL TUYO con focaccia, el armador anunciaba S/13.90 durante todo el
// flujo y el carrito cobraba S/14.40 apenas se agregaba el sándwich. El cliente no pierde
// plata —el cobro correcto es el del carrito— pero ve cambiar el precio sin haber tocado
// nada, justo antes de pagar.
//
// ⚠ Modo de fallo: SILENCIO. Ninguna excepción, ningún test rojo, ningún reporte. Solo un
// número que cambia solo. Es el mismo defecto que costó tres semanas de precios fantasma
// —dos sitios fijando el mismo número y uno ganando sin avisar— en versión chica.

async function precios(page: any, baseId: string, size: '15' | '30') {
  return page.evaluate(
    ([b, sz]: [string, string]) => {
      const w = window as any;
      w.mode = 'byo';
      w.sigId = null;
      w.size = sz;
      w.base = b;
      w.prot = w.PROTS.filter((p: any) => !p.sigOnly && !p.vaultOnly)[0].id;
      w.tops = [];
      w.sauces = [];
      w.cheese = null;
      w.doubleProt = false;
      w.extraSauce = false;
      return {
        armador: w.total(),
        carrito: w.itemUnitPrice(w.currentBuiltItem()),
        recargo: w.baseSurcharge(b, sz),
      };
    },
    [baseId, size],
  );
}

for (const size of ['15', '30'] as const) {
  test(`el armador y el carrito cobran lo mismo con focaccia en ${size}CM`, async ({ page }) => {
    await gotoApp(page, {});
    await page.waitForTimeout(400);

    // B03 es el único pan con recargo (BASE_SURCHARGE). Si algún día hay otro, esta prueba
    // sigue valiendo para él: lo que fija es que las dos fórmulas coincidan.
    const f = await precios(page, 'B03', size);
    expect(f.recargo, 'la focaccia dejó de tener recargo — revisa BASE_SURCHARGE').toBeGreaterThan(0);
    expect(
      f.armador,
      `el armador dice ${f.armador} y el carrito cobra ${f.carrito} — se pierden los ${f.recargo} del pan`,
    ).toBeCloseTo(f.carrito, 2);
  });
}

test('un pan sin recargo no inventa uno', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const sinRecargo = await precios(page, 'B01', '15');
  expect(sinRecargo.recargo).toBe(0);
  expect(sinRecargo.armador).toBeCloseTo(sinRecargo.carrito, 2);
});

// Un Signature NO lleva recargo de pan: la receta fija el pan, el cliente no lo elige.
// Cobrárselo sería cobrar por una decisión que nadie tomó.
test('un Signature nunca paga el recargo del pan', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const w = window as any;
    const sig = w.SIGS.find((s: any) => !s.secret && s.base === 'B03') || w.SIGS.find((s: any) => !s.secret);
    w.mode = 'sig';
    w.sigId = sig.id;
    w.size = '15';
    w.doubleProt = false;
    w.extraSauce = false;
    return { total: w.total(), carta: w.sigPrice(sig) };
  });
  expect(r.total).toBeCloseTo(r.carta, 2);
});
