// SND//WCH — scripts/pg-local/guardar-tipos
// Guarda supabase/functions/_shared/base.ts a partir de lo que devuelve la herramienta de
// Supabase generate_typescript_types (el JSON tal cual), con la cabecera y la marca de la
// migración contra la que se generó (la mira `npm run check:tipos-base`).
//
// Uso: node scripts/pg-local/guardar-tipos.mjs <resultado> <version-de-la-ultima-migracion>
import { readFileSync, writeFileSync } from 'node:fs';

const [archivo, version] = process.argv.slice(2);
if (!archivo || !/^\d{14}$/.test(version || '')) {
  console.error('Uso: node scripts/pg-local/guardar-tipos.mjs <resultado> <version-14-digitos>');
  process.exit(1);
}
let d = JSON.parse(readFileSync(archivo, 'utf8'));
if (Array.isArray(d)) d = JSON.parse(d[0].text);
const tipos = d.types;
if (!tipos || !tipos.includes('export type Database')) {
  console.error('El resultado no trae los tipos de la base.');
  process.exit(1);
}
const destino = 'supabase/functions/_shared/base.ts';
const viejo = readFileSync(destino, 'utf8');
const cabecera = viejo.slice(0, viejo.indexOf('export type Json')).replace(/generado-contra-migracion: \d{14}/, `generado-contra-migracion: ${version}`);
writeFileSync(destino, cabecera + tipos.trimEnd() + '\n');
console.log(`✓ ${destino} (tras ${version})`);
