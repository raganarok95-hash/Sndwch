// SND//WCH — scripts/comparar-esquema
// Compara dos fotos del esquema (foto-del-esquema.sql) ignorando la cabecera de comentarios.
// Lo corre el respaldo diario: base real de esta noche contra supabase/esquema-actual.sql.
//
// Uso: node scripts/comparar-esquema.mjs <foto-de-la-base.sql> <foto-del-repo.sql>
import { readFileSync } from 'node:fs';

const sinCabecera = (f) => readFileSync(f, 'utf8').split('\n').filter((l) => !l.startsWith('-- ') && l !== '--').join('\n').trim().split('\n\n');
const [a, b] = process.argv.slice(2);
const real = sinCabecera(a);
const repo = sinCabecera(b);
const soloReal = real.filter((x) => !repo.includes(x));
const soloRepo = repo.filter((x) => !real.includes(x));
if (!soloReal.length && !soloRepo.length) {
  console.log(`✓ El esquema de la base coincide con ${b} (${real.length} sentencias)`);
  process.exit(0);
}
console.error(`✗ La base y ${b} no coinciden: ${soloReal.length} sentencia(s) solo en la base, ${soloRepo.length} solo en el repo.`);
for (const x of soloReal.slice(0, 15)) console.error('\n  + BASE: ' + x.slice(0, 400));
for (const x of soloRepo.slice(0, 15)) console.error('\n  - REPO: ' + x.slice(0, 400));
console.error('\nSi el cambio es legítimo, reemplaza supabase/esquema-actual.sql por la foto del respaldo (conserva la cabecera).');
process.exit(1);
