// REVISIÓN CONTRA EL SITIO REAL, TRAS CADA PUBLICACIÓN (dueño, 2026-10-01, aprobado).
//
// Las pruebas de tests/ abren el archivo LOCAL con el servidor y Google simulados. Por eso no vieron
// nada de lo que el dueño encontró en su celular: el logo que Vercel no publicaba, el mapa que no
// cargaba con la key real, la ubicación que caía al motor viejo. Esto abre https://sndwch.app en un
// celular simulado y mira lo que ve un cliente. Corre en GitHub (el proxy de las sesiones bloquea
// el dominio). No hace pedidos ni deja datos.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const SITIO = process.env.SITIO || 'https://sndwch.app';
const problemas = [];
const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errores = [];
pagina.on('pageerror', (e) => errores.push(String(e.message || e)));
pagina.on('response', (r) => { if (r.url().startsWith(SITIO) && r.status() >= 400) problemas.push(`${r.status()} ${r.url()}`); });

await pagina.goto(SITIO + '/', { waitUntil: 'networkidle', timeout: 60000 });

// 1. Toda imagen que pide la app existe EN PRODUCCIÓN (no solo en el repo).
const html = readFileSync('index.html', 'utf8');
const rutas = new Set();
for (const m of html.matchAll(/["'(]\.?\/?((?:img|icon|apple|favicon|qr)[A-Za-z0-9_\-/.]*\.(?:png|jpe?g|webp|svg|gif|ico))["')]/g)) rutas.add(m[1]);
for (const r of rutas) {
  const res = await pagina.request.get(`${SITIO}/${r}`);
  const tipo = res.headers()['content-type'] || '';
  if (res.status() !== 200 || !tipo.startsWith('image/')) problemas.push(`imagen ${r}: ${res.status()} ${tipo}`);
}

// 2. El servidor le entregó a la app las keys de Google (si no, el mapa y el ingreso no existen).
await pagina.waitForFunction(() => !!(window.googleMapsKey && window.googleConfigured()), null, { timeout: 20000 })
  .catch(() => problemas.push('la app no recibió googleMapsKey o googleClientId de get-store-hours'));

// 3. Google Maps carga con la key REAL desde el dominio REAL: si Google rechaza la key (API apagada,
//    dominio no permitido), llama a gm_authFailure o falta una librería.
const maps = await pagina.evaluate(async () => {
  let rechazo = false;
  const previo = window.gm_authFailure;
  window.gm_authFailure = () => { rechazo = true; if (previo) previo(); };
  try {
    await window.loadGoogleMaps();
    await new Promise((r) => setTimeout(r, 3000));
    return { ok: true, rechazo, mapa: !!window.gClase('maps', 'Map'), buscador: !!window.gClase('places', 'AutocompleteSuggestion'), geo: !!window.gClase('geocoding', 'Geocoder') };
  } catch (e) { return { ok: false, error: String(e && e.message || e), rechazo }; }
});
if (!maps.ok) problemas.push('Google Maps no cargó: ' + maps.error);
else {
  if (maps.rechazo) problemas.push('Google rechazó la key de Maps (gm_authFailure): revisar APIs activadas y dominios permitidos');
  if (!maps.mapa) problemas.push('Google Maps cargó sin el mapa');
  if (!maps.buscador) problemas.push('Google Maps cargó sin Places (el buscador de direcciones)');
  if (!maps.geo) problemas.push('Google Maps cargó sin el geocodificador');
}

// 4. El motor de ubicación anterior no existe en lo publicado.
const publicado = await (await pagina.request.get(SITIO + '/')).text();
if (/nominatim\.openstreetmap|tile\.openstreetmap|unpkg\.com\/leaflet/.test(publicado)) problemas.push('lo publicado todavía nombra el motor de ubicación anterior');

for (const e of errores) problemas.push('error en la página: ' + e);
await navegador.close();
if (problemas.length) {
  console.error('✗ El sitio real tiene problemas:\n  ' + problemas.join('\n  '));
  process.exit(1);
}
console.log(`✓ Sitio real: ${rutas.size} imágenes publicadas, keys de Google recibidas, Maps carga con la key real, sin errores`);
