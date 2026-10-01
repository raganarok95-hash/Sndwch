import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// BUSCAR UNA DIRECCIÓN CON GOOGLE, Y SEGUIR FUNCIONANDO SIN ÉL
//
// El dueño lo reportó como "la geolocalización es una porquería, no ubica mi dirección".
// La causa concreta: Nominatim (OpenStreetMap) tiene la avenida pero casi nunca el NÚMERO
// en Trujillo — y el número es justo lo que el motorizado necesita.
//
// ⚠ MODO DE FALLO: SILENCIO, en las dos direcciones.
//  · Si el respaldo se rompe, un cliente sin key (shell viejo, secret no configurado) se
//    queda sin buscador y nada avisa: el checkout "funciona", solo que no encuentra nada.
//  · Si el token de sesión se reusa, Google deja de cobrar por sesión y pasa a cobrar tecla
//    por tecla. Eso no rompe nada tampoco — llega como una factura.

// Google no se puede llamar de verdad desde una prueba, así que se suplanta el SDK con uno
// que registra qué se le pidió. Lo que se mide es el CONTRATO: qué le manda la app y qué
// hace con la respuesta.
const SDK_FALSO = `
  window.__gCalls = [];
  window.google = {
    maps: {
      places: {
        AutocompleteSessionToken: function(){ this.id = 'tok-' + (++window.__tokN || (window.__tokN = 1)); },
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions: function(req){
            window.__gCalls.push({ tipo: 'autocomplete', input: req.input, token: req.sessionToken && req.sessionToken.id, region: req.includedRegionCodes });
            return Promise.resolve({ suggestions: [{ placePrediction: {
              text: { toString: function(){ return 'Av. España 1234, Trujillo'; } },
              toPlace: function(){ return {
                location: null,
                formattedAddress: '',
                fetchFields: function(o){
                  window.__gCalls.push({ tipo: 'details', fields: o.fields });
                  this.location = { lat: function(){ return -8.111; }, lng: function(){ return -79.033; } };
                  this.formattedAddress = 'Av. España 1234, Trujillo 13001, Perú';
                  return Promise.resolve();
                },
              }; },
            } }] });
          },
        },
      },
      Geocoder: function(){ this.geocode = function(){ return Promise.resolve({ results: [] }); }; },
    },
  };
`;

async function conKey(page: any, key: string | null) {
  await gotoApp(page, { 'get-store-hours': { hours: [], googleMapsKey: key } });
  await page.evaluate((sdk: string) => {
    const w = window as any;
    // Se marca el cargador como ya resuelto para que la prueba no salga a la red de Google.
    // eslint-disable-next-line no-eval
    eval(sdk);
    w._gmapsPromise = Promise.resolve();
  }, SDK_FALSO);
}

test('con key, busca en Google y pide solo Perú', async ({ page }) => {
  await conKey(page, 'KEY-DE-PRUEBA');
  const hits = await page.evaluate(async () => {
    const w = window as any;
    w.googleMapsKey = 'KEY-DE-PRUEBA';
    return await w.buscarConGoogle('Av España 1234');
  });
  expect(hits[0].texto).toBe('Av. España 1234, Trujillo');

  const calls = await page.evaluate(() => (window as any).__gCalls);
  expect(calls[0].input).toBe('Av España 1234');
  // Sin esto, "Av. España" devuelve resultados de España — el mismo defecto que el viewbox
  // resolvía a mano en Nominatim.
  expect(calls[0].region, 'la búsqueda no está acotada a Perú').toEqual(['pe']);
  expect(calls[0].token, 'sin token de sesión Google cobra tecla por tecla').toBeTruthy();
});

// El costo entero del rediseño depende de esto: una sesión cerrada con un Place Details es
// gratis en cualquier volumen; reusar el token la invalida y cada tecla pasa a cobrarse.
test('elegir un resultado cierra la sesión y suelta el token', async ({ page }) => {
  await conKey(page, 'KEY-DE-PRUEBA');
  const r = await page.evaluate(async () => {
    const w = window as any;
    w.googleMapsKey = 'KEY-DE-PRUEBA';
    const hits = await w.buscarConGoogle('Av España');
    w._addrHits = hits;
    const tokenAntes = w._gSessionToken && w._gSessionToken.id;
    await w.addrPick(0);
    return { tokenAntes, tokenDespues: w._gSessionToken, lat: w._mLat, lon: w._mLon };
  });
  expect(r.tokenAntes).toBeTruthy();
  expect(r.tokenDespues, 'el token de sesión no se soltó — Google pasaría a cobrar por tecla').toBeNull();

  const calls = await page.evaluate(() => (window as any).__gCalls);
  const det = calls.find((c: any) => c.tipo === 'details');
  expect(det, 'no se pidió el Place Details — la sesión queda abierta y se cobra').toBeTruthy();
  // Sin `location` no hay coordenadas, y sin coordenadas el envío no se puede cobrar por
  // distancia: volvería al cobro por zona sin que nada avise.
  expect(det.fields).toContain('location');
});

// El dueño (2026-10-01): «No debería derivar nunca al motor anterior. Ese motor es muy
// impreciso». Si Google falla, el buscador NO sale a Nominatim: lo dice, y el error se reporta.
test('si Google falla, no se usa otro motor: se dice y se reporta', async ({ page }) => {
  const reportes: any[] = [];
  await gotoApp(page, {
    'get-store-hours': { hours: [], googleMapsKey: 'KEY-DE-PRUEBA' },
    'report-client-error': (b: any) => { reportes.push(b); return { success: true }; },
  });
  const r = await page.evaluate(async () => {
    const w = window as any;
    w.googleMapsKey = 'KEY-DE-PRUEBA';
    w._gmapsPromise = Promise.reject(new Error('Google rechazó la key'));
    w._gmapsPromise.catch(() => {});
    const pedidos: string[] = [];
    const origFetch = window.fetch;
    (window as any).fetch = (u: any, o: any) => { pedidos.push(String(u)); return origFetch(u, o); };
    const inp = document.getElementById('maddr-input') as HTMLInputElement;
    inp.value = 'Av España 1234';
    w.addrSearchNow();
    await new Promise((res) => setTimeout(res, 400));
    (window as any).fetch = origFetch;
    return { pedidos, caja: (document.getElementById('maddr-results') as HTMLElement).textContent };
  });
  expect(r.pedidos.join(' '), 'el buscador salió a otro motor').not.toMatch(/nominatim|openstreetmap/);
  expect(r.caja).toContain('No pudimos buscar');
  await expect.poll(() => reportes.length, { message: 'la falla de Google no llegó al dueño' }).toBeGreaterThan(0);
  expect(String(reportes[0].donde)).toContain('ubicacion-google');
});

// Ni el mapa ni el pin usan OpenStreetMap: el motor viejo no existe en la app.
test('el motor viejo no está en ninguna parte de la app', async ({ page }) => {
  await gotoApp(page, {});
  const html = await page.content();
  const fuentes = await page.evaluate(() => [
    String((window as any).openMap), String((window as any).revGeo), String((window as any).addrSearchNow),
  ].join('\n'));
  expect(html + fuentes).not.toMatch(/nominatim\.openstreetmap|tile\.openstreetmap|unpkg\.com\/leaflet/);
  expect(String(await page.evaluate(() => String((window as any).loadGoogleMaps)))).toContain('importLibrary');
});

// El mapa abre con el BUSCADOR (no con el GPS), dibujado por Google, y la dirección bajo el
// pin la da Google. El GPS queda como botón dentro del mapa.
test('el mapa abre con Google y el buscador listo; el GPS es un botón', async ({ page }) => {
  await gotoApp(page, { 'get-store-hours': { hours: [], googleMapsKey: 'KEY-DE-PRUEBA' } });
  const r = await page.evaluate(async () => {
    const w = window as any;
    w.googleMapsKey = 'KEY-DE-PRUEBA';
    let gpsPedido = false;
    (navigator as any).geolocation.getCurrentPosition = () => { gpsPedido = true; };
    let creado: any = null;
    w.google = { maps: {
      Map: function (el: any, o: any) { creado = o; this.c = o.center; this.addListener = () => {}; this.getCenter = () => ({ lat: () => this.c.lat, lng: () => this.c.lng }); this.setCenter = (c: any) => { this.c = c; }; this.setZoom = () => {}; },
      Geocoder: function () { this.geocode = () => Promise.resolve({ results: [{ address_components: [
        { types: ['route'], long_name: 'Av. España' }, { types: ['street_number'], long_name: '1234' }, { types: ['locality'], long_name: 'Trujillo' },
      ] }] }); },
      places: { AutocompleteSuggestion: {} },
    } };
    w._gmapsPromise = Promise.resolve();
    w.abrirUbicacion();
    await new Promise((res) => setTimeout(res, 500));
    return {
      visible: getComputedStyle(document.getElementById('mmap')!).display !== 'none',
      creado, gpsPedido,
      foco: document.activeElement && document.activeElement.id,
      hint: (document.getElementById('maddr-hint') as HTMLElement | null)?.textContent || '',
      hayBotonGps: !!document.getElementById('gps-btn'),
    };
  });
  expect(r.visible).toBe(true);
  expect(r.creado, 'el mapa no lo dibujó Google').toBeTruthy();
  expect(r.gpsPedido, 'abrir el mapa no debe disparar el GPS').toBe(false);
  expect(r.foco).toBe('maddr-input');
  expect(r.hint).toContain('Av. España 1234');
  expect(r.hayBotonGps).toBe(true);
});
