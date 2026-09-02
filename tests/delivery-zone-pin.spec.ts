import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// C4 — La zona de delivery la elige el cliente y por defecto es "Distancia media", así
// que la mayoría nunca la toca. El delivery es pass-through puro: si la zona elegida
// cobra menos de lo que el motorizado va a pedir por esa distancia, la diferencia sale
// del bolsillo del dueño, y si cobra de más el cliente paga por algo que no usó. Cuando
// hay un pin del mapa hay un dato objetivo para contrastar, y este aviso lo usa.
//
// Nunca bloquea el pedido: un pin puede caer mal (GPS en interiores, mapa arrastrado a
// ojo) y el cliente conoce su dirección mejor que el navegador. Solo avisa y ofrece el
// cambio en un toque.

async function irAlCheckout(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
}

// Coordenadas del punto de despacho, las mismas que usa el banner "estás cerca"
// (STORE_LAT/STORE_LON en src/app.ts).
const STORE = { lat: -8.139599, lon: -79.039458 };

// Mueve el pin a una distancia aproximada en km hacia el norte. 1° de latitud ≈ 111 km.
async function ponerPinA(page: any, km: number) {
  await page.evaluate(
    ([lat, lon, d]: number[]) => {
      (window as any)._mLat = lat + d / 111;
      (window as any)._mLon = lon;
      (window as any).confirmRerender();
    },
    [STORE.lat, STORE.lon, km],
  );
}

test('el pin lejos de la zona elegida avisa que el motorizado puede pedir la diferencia', async ({ page }) => {
  await gotoApp(page, {});
  await irAlCheckout(page);

  // Zona por defecto: "Distancia media" (S/8, hasta ~4 km). Un pin a ~8 km cae en MUY
  // LEJOS (S/15) — casi el doble de lo que se estaría cobrando.
  await ponerPinA(page, 8);

  const aviso = page.locator('text=/Tu pin está a ~8/');
  await expect(aviso).toBeVisible();
  await expect(page.locator('text=/puede que el motorizado te pida la diferencia/i')).toBeVisible();

  // Y se corrige en un toque, sin volver al mapa.
  await page.getByRole('button', { name: /Cambiar a MUY LEJOS/i }).click();
  await expect(page.locator('text=/puede que el motorizado te pida la diferencia/i')).toHaveCount(0);
});

test('el pin más cerca de lo elegido avisa que el cliente está pagando de más', async ({ page }) => {
  await gotoApp(page, {});
  await irAlCheckout(page);

  // ~1 km del local: le alcanza "Cerca del local" (S/6), no los S/8 por defecto.
  await ponerPinA(page, 1);

  await expect(page.locator('text=/estás pagando/i')).toBeVisible();
  await page.getByRole('button', { name: /Cambiar a CERCA DEL LOCAL/i }).click();
  await expect(page.locator('text=/estás pagando/i')).toHaveCount(0);
});

test('sin pin no se muestra ningún aviso de zona', async ({ page }) => {
  await gotoApp(page, {});
  await irAlCheckout(page);

  // La mayoría de los pedidos escribe la dirección a mano y nunca toca el mapa: sin dato
  // objetivo que contrastar, inventar un aviso sería ruido.
  await expect(page.locator('text=/Tu pin está a/')).toHaveCount(0);
});

test('el pin que coincide con la zona elegida no molesta con ningún aviso', async ({ page }) => {
  await gotoApp(page, {});
  await irAlCheckout(page);

  // ~3.5 km cae dentro de "Distancia media" (hasta 4 km), que ya está elegida.
  await ponerPinA(page, 3.5);
  await expect(page.locator('text=/Tu pin está a/')).toHaveCount(0);
});
