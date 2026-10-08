// SND//WCH — pg-local/foto-remota: rehace la foto del esquema y los tipos SIN pasar por el chat.
// Corre en GitHub (.github/workflows/foto-del-esquema.yml) con el SUPABASE_ACCESS_TOKEN: pide a la
// API de Supabase el resultado de foto-del-esquema.sql y los tipos, y los guarda con los mismos
// guardar-foto.mjs y guardar-tipos.mjs de siempre, marcados con la última migración registrada.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { REF } from '../video-auto/produccion.mjs';

const H = { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' };
const api = async (ruta, init = {}) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}${ruta}`, { ...init, headers: H });
  if (!r.ok) throw new Error(`${ruta} → ${r.status} ${await r.text()}`);
  return r.json();
};
const migraciones = await api('/database/migrations');
const version = migraciones.map((m) => m.version).sort().pop();
const foto = await api('/database/query', { method: 'POST', body: JSON.stringify({ query: readFileSync('scripts/pg-local/foto-del-esquema.sql', 'utf8') }) });
writeFileSync('/tmp/foto.json', JSON.stringify(foto));
const tipos = await api('/types/typescript');
writeFileSync('/tmp/tipos.json', JSON.stringify(tipos));
execFileSync('node', ['scripts/pg-local/guardar-foto.mjs', '/tmp/foto.json', version], { stdio: 'inherit' });
execFileSync('node', ['scripts/pg-local/guardar-tipos.mjs', '/tmp/tipos.json', version], { stdio: 'inherit' });
