// SND//WCH — scripts/ficha-google
// Revisa la ficha de Google del negocio (dueño, 2026-10-07: «revísala»): la busca en Google
// Places con la llave del propio servidor (la entrega get-store-hours) y muestra lo que ve un
// cliente: nombre, dirección, horario, categoría, reseñas, fotos, web y teléfono. Solo lee.
// Corre en GitHub (el proxy de las sesiones bloquea supabase.co).
const API = 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api';
const h = await (await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get-store-hours' }) })).json();
const key = h.googleMapsKey || h.mapsKey || (h.google && h.google.mapsKey);
if (!key) { console.log('get-store-hours no trajo la llave. Campos:', Object.keys(h).join(', ')); process.exit(1); }
const ref = { Referer: 'https://sndwch.app/' };
const consultas = (process.env.CONSULTAS || 'SND//WCH Trujillo|SNDWCH Trujillo|SND WCH sandwich Trujillo').split('|');
const vistos = new Set();
for (const q of consultas) {
  const r = await (await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&language=es&key=${key}`, { headers: ref })).json();
  console.log(`\nBúsqueda «${q}»: ${r.status} · ${(r.results || []).length} resultado(s)${r.error_message ? ' · ' + r.error_message : ''}`);
  for (const c of (r.results || []).slice(0, 5)) {
    console.log(`  · ${c.name} — ${c.formatted_address} (${c.place_id})`);
    if (vistos.has(c.place_id) || !/snd|wch|sand/i.test(c.name)) continue;
    vistos.add(c.place_id);
    const f = 'name,formatted_address,formatted_phone_number,website,url,opening_hours,business_status,types,rating,user_ratings_total,photos,editorial_summary,delivery,serves_lunch,serves_dinner';
    const d = (await (await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${c.place_id}&fields=${f}&language=es&key=${key}`, { headers: ref })).json()).result || {};
    console.log(JSON.stringify({ ...d, photos: (d.photos || []).length }, null, 2));
    console.log(`  enlace de reseña: https://search.google.com/local/writereview?placeid=${c.place_id}`);
  }
}
