// SND//WCH — scripts/ficha-google
// Revisa la ficha de Google del negocio (dueño, 2026-10-07: «revísala»). La llave de Maps está
// restringida a sndwch.app (no sirve para la API web directa), así que se abre sndwch.app en un
// navegador y se busca con la misma librería de Google que usa la app. Solo lee.
// Corre en GitHub (el proxy de las sesiones bloquea sndwch.app).
import { chromium } from '@playwright/test';

const consultas = (process.env.CONSULTAS || 'SND//WCH Trujillo|SNDWCH Trujillo|SND WCH sandwich Trujillo').split('|');
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('https://sndwch.app/');
await p.waitForFunction(() => typeof window.loadGoogleMaps === 'function', null, { timeout: 30000 }).catch(() => {});
const r = await p.evaluate(async (qs) => {
  const w = window;
  try { await w.loadGoogleMaps(); } catch (e) { return { error: 'Maps no cargó: ' + e.message }; }
  const { Place } = await w.google.maps.importLibrary('places');
  const campos = ['id', 'displayName', 'formattedAddress', 'businessStatus', 'primaryTypeDisplayName', 'rating', 'userRatingCount',
    'regularOpeningHours', 'websiteURI', 'nationalPhoneNumber', 'googleMapsURI', 'photos', 'editorialSummary'];
  const out = [];
  for (const q of qs) {
    try {
      const { places } = await Place.searchByText({ textQuery: q, fields: campos, language: 'es', region: 'pe', maxResultCount: 5 });
      out.push({ q, encontrados: places.map((x) => ({
        id: x.id, nombre: x.displayName, direccion: x.formattedAddress, estado: x.businessStatus, tipo: x.primaryTypeDisplayName,
        rating: x.rating, resenas: x.userRatingCount, web: x.websiteURI, telefono: x.nationalPhoneNumber, mapa: x.googleMapsURI,
        fotos: (x.photos || []).length, resumen: x.editorialSummary,
        horario: x.regularOpeningHours ? x.regularOpeningHours.weekdayDescriptions : null,
      })) });
    } catch (e) { out.push({ q, error: String(e.message || e) }); }
  }
  return out;
}, consultas);
console.log(JSON.stringify(r, null, 2));
for (const c of [].concat(...(Array.isArray(r) ? r : []).map((x) => x.encontrados || []))) {
  console.log(`enlace de reseña de «${c.nombre}»: https://search.google.com/local/writereview?placeid=${c.id}`);
}
await b.close();
