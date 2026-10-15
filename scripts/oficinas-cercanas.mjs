// SND//WCH — oficinas cercanas: lo que hay a 2 km del punto de despacho, para el almuerzo de
// oficina (docs/PRIMER_MES.md; dueño, 2026-10-15: «hazme esa lista»). Pregunta a OpenStreetMap
// (Overpass) por oficinas, bancos, clínicas, colegios, universidades y entidades públicas, mide
// la distancia en línea recta y escribe una tabla. Corre en GitHub (oficinas-cercanas.yml): el
// proxy de las sesiones no deja llegar a Overpass. Solo lee datos públicos; no guarda nada en la base.
import { readFileSync, writeFileSync } from 'node:fs';

const reglas = readFileSync('supabase/functions/_shared/reglas.ts', 'utf8');
const LAT = Number(reglas.match(/STORE_LAT = (-?[\d.]+)/)[1]);
const LON = Number(reglas.match(/STORE_LON = (-?[\d.]+)/)[1]);
const RADIO = Number(process.env.RADIO || 2000);

const q = `[out:json][timeout:90];
(
  nwr(around:${RADIO},${LAT},${LON})["office"];
  nwr(around:${RADIO},${LAT},${LON})["amenity"~"^(bank|clinic|hospital|doctors|dentist|school|college|university|townhall|courthouse|police|public_building|coworking_space)$"];
  nwr(around:${RADIO},${LAT},${LON})["healthcare"];
  nwr(around:${RADIO},${LAT},${LON})["shop"="mall"];
);
out center tags;`;

// Overpass rechaza (406) una petición sin identificarse y limita (429) a quien insiste: se manda un
// User-Agent propio y se prueba cada servidor hasta 3 veces, esperando cada vez más.
const servidores = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const cabeceras = { 'User-Agent': 'sndwch-oficinas-cercanas/1.0 (github.com/raganarok95-hash/Sndwch)',
  'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
let datos = null;
fuera: for (let intento = 0; intento < 3; intento++) {
  for (const url of servidores) {
    try {
      const r = await fetch(url, { method: 'POST', headers: cabeceras, body: new URLSearchParams({ data: q }) });
      if (r.ok) { datos = await r.json(); break fuera; }
      console.error(`${url}: ${r.status}`);
    } catch (e) { console.error(`${url}: ${e.message}`); }
  }
  await new Promise((r) => setTimeout(r, 15000 * (intento + 1)));
}
if (!datos) { console.error('Ningún servidor de Overpass respondió.'); process.exit(1); }

const rad = (g) => (g * Math.PI) / 180;
const metros = (la, lo) => {
  const a = Math.sin(rad(la - LAT) / 2) ** 2 + Math.cos(rad(LAT)) * Math.cos(rad(la)) * Math.sin(rad(lo - LON) / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(a)));
};
const tipo = (t) => {
  if (t.office) return 'oficina';
  if (t.amenity === 'bank') return 'banco';
  if (['clinic', 'hospital', 'doctors', 'dentist'].includes(t.amenity) || t.healthcare) return 'salud';
  if (['school', 'college', 'university'].includes(t.amenity)) return 'educación';
  if (['townhall', 'courthouse', 'police', 'public_building'].includes(t.amenity) || t.office === 'government') return 'público';
  if (t.amenity === 'coworking_space') return 'coworking';
  if (t.shop === 'mall') return 'centro comercial';
  return 'otro';
};
const vistos = new Set();
const filas = [];
for (const e of datos.elements || []) {
  const t = e.tags || {};
  const nombre = (t.name || t['name:es'] || t.brand || t.operator || '').trim();
  if (!nombre) continue;
  const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
  if (la == null) continue;
  const clave = nombre.toLowerCase();
  if (vistos.has(clave)) continue;
  vistos.add(clave);
  const dir = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  filas.push({ nombre, tipo: tipo(t), m: metros(la, lo), dir, sub: t.office || t.amenity || t.healthcare || t.shop || '' , mapa: `https://www.openstreetmap.org/${e.type}/${e.id}` });
}
filas.sort((a, b) => a.m - b.m);
const md = [`# Oficinas y lugares de trabajo a ${RADIO / 1000} km del punto de despacho`, '',
  `OpenStreetMap, consultado el ${new Date().toISOString().slice(0, 10)}. Distancia en línea recta. ${filas.length} lugares con nombre.`, '',
  '| # | lugar | tipo | distancia | dirección | mapa |', '|---|---|---|---|---|---|',
  ...filas.map((f, i) => `| ${i + 1} | ${f.nombre.replace(/\|/g, '/')} | ${f.tipo}${f.sub ? ' (' + f.sub + ')' : ''} | ${(f.m / 1000).toFixed(2)} km | ${f.dir || '—'} | [ver](${f.mapa}) |`)].join('\n');
writeFileSync('oficinas-cercanas.md', md + '\n');
console.log(md);
