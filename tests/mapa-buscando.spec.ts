import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// AL MOVER EL PIN, LA REFERENCIA DICE «BUSCANDO…» (2026-09-24).
//
// El mapa escribía el aviso en `#maddr`, un elemento que el mapa rehecho del 2026-09-17 ya no
// tiene. No daba ningún error: el aviso simplemente no aparecía, y bajo el pin recién movido
// seguía la referencia del punto anterior, como si ya estuviera resuelta.
//
// Leaflet se descarga de internet y en las pruebas no carga, así que se reemplaza por uno falso
// que guarda los manejadores: lo que se prueba es qué hace NUESTRO código cuando el mapa se mueve.

test('mover el mapa cambia la referencia a «Buscando…»', async ({ page }) => {
  await gotoApp(page, {});
  await page.evaluate(() => {
    const w = window as any;
    const manejadores: Record<string, Function> = {};
    w.__mapa = manejadores;
    w.L = {
      map: () => ({
        on: (ev: string, fn: Function) => { manejadores[ev] = fn; },
        setView: () => {}, invalidateSize: () => {}, getCenter: () => ({ lat: -8.11, lng: -79.03 }),
      }),
      tileLayer: () => ({ addTo: () => {} }),
    };
    w.openMap(-8.11, -79.03, false);
  });
  await expect.poll(() => page.evaluate(() => typeof (window as any).__mapa.move)).toBe('function');
  await page.evaluate(() => {
    const h = document.getElementById('maddr-hint')!;
    h.textContent = 'Av. España 123';
    (window as any).__mapa.move();
  });
  await expect(page.locator('#maddr-hint')).toHaveText('Buscando…');
});
