import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// AL MOVER EL PIN, LA REFERENCIA DICE «BUSCANDO…» (2026-09-24).
//
// El mapa escribía el aviso en `#maddr`, un elemento que el mapa rehecho del 2026-09-17 ya no
// tiene. No daba ningún error: el aviso simplemente no aparecía, y bajo el pin recién movido
// seguía la referencia del punto anterior, como si ya estuviera resuelta.
//
// Google Maps se descarga de internet y en las pruebas no carga, así que se reemplaza por uno
// falso que guarda los manejadores: lo que se prueba es qué hace NUESTRO código cuando el mapa
// se arrastra.

test('mover el mapa cambia la referencia a «Buscando…»', async ({ page }) => {
  await gotoApp(page, {});
  await page.evaluate(() => {
    const w = window as any;
    const manejadores: Record<string, Function> = {};
    w.__mapa = manejadores;
    w.googleMapsKey = 'KEY-DE-PRUEBA';
    w.google = { maps: {
      Map: function () {
        this.addListener = (ev: string, fn: Function) => { manejadores[ev] = fn; };
        this.getCenter = () => ({ lat: () => -8.11, lng: () => -79.03 });
        this.setCenter = () => {}; this.setZoom = () => {};
      },
      Geocoder: function () { this.geocode = () => new Promise(() => {}); },
      places: { AutocompleteSuggestion: {} },
    } };
    w._gmapsPromise = Promise.resolve();
    w.openMap(-8.11, -79.03, false);
  });
  await expect.poll(() => page.evaluate(() => typeof (window as any).__mapa.dragstart)).toBe('function');
  await page.evaluate(() => {
    const h = document.getElementById('maddr-hint')!;
    h.textContent = 'Av. España 123';
    (window as any).__mapa.dragstart();
  });
  await expect(page.locator('#maddr-hint')).toHaveText('Buscando…');
});
