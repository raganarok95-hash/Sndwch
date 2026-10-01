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
      Map: function () { this.addListener = () => {}; this.getCenter = () => ({ lat: () => -8.1, lng: () => -79.02 }); this.setCenter = () => {}; this.setZoom = () => {}; },
      Geocoder: function () { this.geocode = () => Promise.resolve({ results: [] }); },
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
  await page.locator('#mmap-hoja .oro').click();
  await expect.poll(() => updates.length, { message: 'la dirección guardada no se actualizó con su pin' }).toBe(1);
  expect(typeof updates[0].lat).toBe('number');
  const r = await page.evaluate(() => { const w = window as any; return { pantalla: w.sndScreen, lista: w.direccionLista(), elegida: w.pickedAddrId }; });
  expect(r.pantalla).toBe('o_cart');
  expect(r.lista, 'la dirección quedó sin poder pagar').toBe(true);
  expect(r.elegida, 'el carrito no quedó con la dirección guardada elegida').toBe(7);
});
