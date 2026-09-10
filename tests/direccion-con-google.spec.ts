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

// Si la key falta —secret sin configurar, o un shell viejo servido por un service worker
// desactualizado— el cliente NO se puede quedar sin buscador. El peor caso tiene que ser el
// comportamiento anterior, nunca un checkout roto.
test('sin key cae a Nominatim en vez de quedarse sin buscador', async ({ page }) => {
  await conKey(page, null);
  const usoNominatim = await page.evaluate(async () => {
    const w = window as any;
    w.googleMapsKey = '';
    let pedido = '';
    const origFetch = window.fetch;
    (window as any).fetch = (u: any) => {
      pedido = String(u);
      return Promise.resolve({ json: () => Promise.resolve([]) } as any);
    };
    // La app ya trae estos dos elementos (el mapa vive en el DOM desde el arranque). Crear
    // otros con el mismo id dejaría a getElementById devolviendo el original vacío — y la
    // prueba pasaría o fallaría por una razón que no es la que persigue.
    const box = document.getElementById('maddr-results') || Object.assign(document.createElement('div'), { id: 'maddr-results' });
    if (!box.parentNode) document.body.appendChild(box);
    const inp = (document.getElementById('maddr-input') || Object.assign(document.createElement('input'), { id: 'maddr-input' })) as HTMLInputElement;
    if (!inp.parentNode) document.body.appendChild(inp);
    inp.value = 'Av España 1234';
    w.addrSearchNow();
    await new Promise((r) => setTimeout(r, 300));
    (window as any).fetch = origFetch;
    return pedido;
  });
  expect(usoNominatim, 'sin key el buscador se quedó mudo').toContain('nominatim.openstreetmap.org');
});

// Los tiles del mapa siguen en OpenStreetMap a propósito: son gratis, arrastrar el pin ya
// funcionaba bien, y pasar a "Dynamic Maps" de Google cobraría por cada apertura del mapa
// sin resolver ningún problema que exista.
test('el mapa sigue usando tiles gratis de OSM, no los de Google', async ({ page }) => {
  await gotoApp(page, {});
  const src = await page.evaluate(() => String((window as any).openMap));
  expect(src).toContain('tile.openstreetmap.org');
  expect(src).not.toContain('maps.googleapis.com');
});
