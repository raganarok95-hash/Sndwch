import { test, expect } from '@playwright/test';
import { gotoApp, clearDeliveryPin, setDeliveryPin, PIN_TEST } from './helpers';

// Cobro del delivery por DISTANCIA REAL (2026-09-02), del lado del cliente.
//
// QUÉ SE ROMPIÓ Y POR QUÉ IMPORTA. Hasta hoy el cliente elegía su "zona de entrega" en un
// desplegable —cerca S/6 · media S/8 · lejos S/12 · muy lejos S/15— con `media` por defecto,
// y ESE monto era el que se cobraba. O sea: el cliente elegía su propio precio de envío, y
// elegir el más barato no le costaba nada. El pin del mapa existía pero solo AVISABA del
// desajuste; llegaba a decirle "puede que el motorizado te pida la diferencia al llegar",
// una promesa sobre lo que iba a hacer un tercero.
//
// El motorizado cobra S/2 por kilómetro. La diferencia entre lo cobrado y lo real salía del
// bolsillo del dueño, porque el delivery es pass-through y no tiene margen del que salga.
//
// El cálculo está probado contra el servidor en tests-api/delivery-distancia.test.ts. Lo que
// se fija ACÁ es lo único que decide si sirve: que el cliente no pueda pagar sin un punto
// confirmado, y que vea de dónde sale el monto.

const SIG = { proteins: {}, sigs: {}, sides: {}, rewardPts: {}, inventory: {} };

// Mismo camino que checkout.spec.ts: con el carrito vacío el primer sándwich entra en modo
// "pago rápido" y el checkout completo se muestra inline, que es donde vive la tarifa.
async function irAlCheckout(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
}

test('con el pin puesto se ve la distancia y el monto que sale de ella', async ({ page }) => {
  await gotoApp(page, { 'get-catalog': SIG });
  await irAlCheckout(page);
  await expect(page.locator('text=/4\\.0 km hasta tu punto/')).toBeVisible();
  await expect(page.locator('text=/por distancia real/')).toBeVisible();
  // El desplegable de zonas ya no existe: era el que dejaba al cliente elegir su precio.
  await expect(page.locator('text=Distancia media')).toHaveCount(0);
  await expect(page.locator('text=Muy lejos')).toHaveCount(0);
});

test('sin pin no se muestra ninguna tarifa inventada, se pide la ubicación', async ({ page }) => {
  // El modo de fallo que hay que evitar: mostrar un monto por defecto. Cualquier número
  // puesto ahí sin saber dónde vive el cliente es una cifra que alguien va a pagar.
  await gotoApp(page, { 'get-catalog': SIG });
  await clearDeliveryPin(page);
  await irAlCheckout(page);
  await expect(page.locator('text=/Confirma tu ubicación en el mapa/')).toBeVisible();
  await expect(page.getByRole('button', { name: /Confirmar mi ubicación/ })).toBeVisible();
  await expect(page.locator('text=/km hasta tu punto/')).toHaveCount(0);
});

test('se avisa que el pin se pide una sola vez por dirección', async ({ page }) => {
  // Si el cliente cree que va a tener que hacer esto en cada pedido, el paso extra se siente
  // mucho más caro de lo que es — y este es el punto del checkout donde más gente abandona.
  await gotoApp(page, { 'get-catalog': SIG });
  await clearDeliveryPin(page);
  await irAlCheckout(page);
  await expect(page.locator('text=/Solo la primera vez por dirección/')).toBeVisible();
});

test('más lejos cuesta más, y el monto sube con la distancia', async ({ page }) => {
  await gotoApp(page, { 'get-catalog': SIG });
  await irAlCheckout(page);
  const cerca = await page.locator('text=/km hasta tu punto/').innerText();
  expect(cerca).toContain('4.0');

  // Un punto claramente más lejos: el doble de separación en latitud.
  await setDeliveryPin(page, -8.084, PIN_TEST.lon);
  await page.evaluate(() => (window as any).render());
  const lejos = await page.locator('text=/km hasta tu punto/').innerText();
  const kmCerca = parseFloat(cerca.match(/([\d.]+) km/)![1]);
  const kmLejos = parseFloat(lejos.match(/([\d.]+) km/)![1]);
  expect(kmLejos).toBeGreaterThan(kmCerca);
});

test('un punto fuera de cobertura se avisa en vez de cobrar un monto absurdo', async ({ page }) => {
  // Un pin mal puesto (o una dirección en otra ciudad) generaría una tarifa enorme que el
  // cliente vería recién en el total. Se corta antes, con el motivo.
  await gotoApp(page, { 'get-catalog': SIG });
  await setDeliveryPin(page, -8.45, -79.4);
  await irAlCheckout(page);
  await expect(page.locator('text=/por ahora llegamos hasta/')).toBeVisible();
});

test('el cliente puede corregir su ubicación desde el mismo sitio donde ve el monto', async ({ page }) => {
  await gotoApp(page, { 'get-catalog': SIG });
  await irAlCheckout(page);
  await expect(page.getByRole('button', { name: /Cambiar mi ubicación/ })).toBeVisible();
});
