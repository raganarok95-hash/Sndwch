import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// UNA DIRECCIÓN GUARDADA SIN PIN SE UBICA Y SE PAGA (dueño, 2026-10-01: «pide marcar en mapa aún
// si seleccionas una dirección guardada, luego no deja seleccionar en el mapa o ir a pagar»).
// Bloquea el pago: cuesta pedidos. El mapa de Google se reemplaza por uno falso.
test('elegir una guardada sin pin abre el mapa para ELLA, la guarda con su pin y vuelve al carrito listo', async ({ page }) => {
  const updates: any[] = [];
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Prueba', points: 0 }, isAdmin: false, token: 't' },
    'addresses-list': { addresses: [{ id: 7, label: 'Casa', address: 'Av Prolongación César Vallejo 2670', reference: '', lat: null, lon: null }] },
    'addresses-update': (b: any) => { updates.push(b); return { success: true }; },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust);
  await page.evaluate(async () => {
    const w = window as any;
    w.myAddresses = (await w.api('addresses-list', {})).addresses;
    w.cart = [{ type: 'sig', code: w.SIGS[0].id, size: '15', qty: 1 }];
    w.googleMapsKey = 'K';
    w.google = { maps: {
      // Un mapa que recuerda dónde está su centro: abre en lo que le pasen y se mueve con setCenter.
      Map: function (_el: any, o: any) { let c = o.center; this.addListener = () => {}; this.getCenter = () => ({ lat: () => c.lat, lng: () => c.lng }); this.setCenter = (n: any) => { c = n; }; this.setZoom = () => {}; },
      // Google encuentra la dirección escrita (lejos del local, para que se note la diferencia).
      Geocoder: function () { this.geocode = (q: any) => Promise.resolve({ results: q.address ? [{ geometry: { location: { lat: () => -8.0912, lng: () => -79.0101 } } }] : [] }); },
      places: { AutocompleteSuggestion: { fetchAutocompleteSuggestions: () => Promise.resolve({ suggestions: [] }) }, AutocompleteSessionToken: function () {} },
    } };
    w._gmapsPromise = Promise.resolve();
    w.sndScreen = 'o_dir'; w.render();
  });
  await page.locator('.m34 .et').first().click();
  await page.getByRole('button', { name: /Ubicar «Casa» en el mapa/ }).click();
  await expect(page.locator('#mmap')).toBeVisible();
  // El buscador viene con la dirección guardada escrita.
  await expect(page.locator('#maddr-input')).toHaveValue(/César Vallejo 2670/);
  // El mapa abre donde Google ubicó ESA dirección, no en el local: si no, «Es acá» guardaba el
  // local como casa del cliente (0 km, envío mínimo) sin que nadie lo notara.
  await expect.poll(() => page.evaluate(() => (window as any)._mLat)).toBe(-8.0912);
  await page.locator('#mmap-hoja .oro').click();
  await expect.poll(() => updates.length, { message: 'la dirección guardada no se actualizó con su pin' }).toBe(1);
  expect(updates[0].lat, 'el pin guardado no es el de la dirección').toBe(-8.0912);
  const r = await page.evaluate(() => { const w = window as any; return { pantalla: w.sndScreen, lista: w.direccionLista(), elegida: w.pickedAddrId }; });
  expect(r.pantalla).toBe('o_cart');
  expect(r.lista, 'la dirección quedó sin poder pagar').toBe(true);
  expect(r.elegida, 'el carrito no quedó con la dirección guardada elegida').toBe(7);
});

// UN PIN QUE NADIE PUSO NO SE GUARDA. El mapa abre en el local; confirmar sin mover el mapa ni
// elegir nada guardaba el local como la dirección del cliente: envío mínimo cobrado a cualquiera.
test('confirmar el mapa sin haber puesto el pin no guarda el local como dirección', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.evaluate(async () => {
    const w = window as any;
    w.cart = [{ type: 'sig', code: w.SIGS[0].id, size: '15', qty: 1 }];
    w.googleMapsKey = 'K';
    w.google = { maps: {
      Map: function (_el: any, o: any) { let c = o.center; this.addListener = () => {}; this.getCenter = () => ({ lat: () => c.lat, lng: () => c.lng }); this.setCenter = (n: any) => { c = n; }; this.setZoom = () => {}; },
      Geocoder: function () { this.geocode = () => Promise.resolve({ results: [] }); },
      places: { AutocompleteSuggestion: { fetchAutocompleteSuggestions: () => Promise.resolve({ suggestions: [] }) }, AutocompleteSessionToken: function () {} },
    } };
    w._gmapsPromise = Promise.resolve();
    w._mLat = null; w._mLon = null;
    w.sndScreen = 'o_dir'; w.render();
  });
  await page.locator('.m34 .otra').click();
  await expect(page.locator('#mmap')).toBeVisible();
  await page.locator('#maddr-input').fill('Mi casa');
  await page.locator('#mmap-hoja .oro').click();
  await expect(page.locator('#mmap'), 'el mapa se cerró con el pin en el local').toBeVisible();
  expect(await page.evaluate(() => (window as any).direccionLista())).toBe(false);
});

// LA GUARDADA SE ELIGE SOLA (dueño, 2026-10-02: «sigue pidiendo marcar en el mapa, debería
// seleccionarse sola la dirección que tengo guardada»). El carrito copiaba solo el TEXTO de la
// última dirección: se veía escrita pero sin pin, y pedía el mapa a quien ya la tenía guardada.
test('con una dirección guardada con pin, el carrito queda listo para pagar sin tocar nada', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Prueba', points: 0, last_address: 'Av Prolongación Cesar Vallejo 2670' }, isAdmin: false, token: 't' },
    'addresses-list': { addresses: [{ id: 1, label: 'Casa', address: 'Av Prolongación Cesar Vallejo 2670', reference: null, lat: -8.0912, lon: -79.0101 }] },
    '*': { success: true },
  });
  await entrarConTelefono(page);
  await page.waitForFunction(() => (window as any).cust && (window as any).myAddresses.length);
  await page.evaluate(() => {
    const w = window as any;
    // Como un teléfono recién abierto: sin el pin de prueba que deja gotoApp.
    w._mLat = null; w._mLon = null;
    w.cart = [{ type: 'sig', code: w.SIGS[0].id, size: '15', qty: 1 }];
    w.initCheckoutFields();
    w.sndScreen = 'o_cart'; w.render();
  });
  const r = await page.evaluate(() => { const w = window as any; return { lista: w.direccionLista(), elegida: w.pickedAddrId, lat: w._mLat, problema: w.problemaDelPedido() }; });
  expect(r.elegida, 'la guardada no quedó elegida').toBe(1);
  expect(r.lat).toBe(-8.0912);
  expect(r.lista, 'el carrito sigue pidiendo el mapa').toBe(true);
  expect(r.problema || '').not.toMatch(/mapa/);
});
