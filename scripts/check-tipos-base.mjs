// SND//WCH — scripts/check-tipos-base
// Los tipos de la base (supabase/functions/_shared/base.ts) se GENERAN desde el esquema real.
// Sirven mientras coincidan con él: una migración que agrega, renombra o quita una columna los
// deja viejos, y un tipo viejo es peor que ninguno — el compilador aprueba una columna que ya no
// existe. Este chequeo falla si hay en supabase/migrations/ una migración más nueva que la
// versión contra la que se generó el archivo.
//
// Correr con: npm run check:tipos-base   (dentro de `npm run verify`)
import { readFileSync, readdirSync } from 'node:fs';

const base = readFileSync('supabase/functions/_shared/base.ts', 'utf8');
const m = /generado-contra-migracion:\s*(\d{14})/.exec(base);
if (!m) {
  console.error('✗ base.ts no dice contra qué migración se generó (línea «generado-contra-migracion: <versión>»).');
  process.exit(1);
}
const generado = m[1];
const versiones = readdirSync('supabase/migrations')
  .map((f) => /^(\d{14})_.*\.sql$/.exec(f)?.[1])
  .filter(Boolean)
  .sort();
const ultima = versiones[versiones.length - 1];
const nuevas = versiones.filter((v) => v > generado);
if (nuevas.length) {
  console.error(`✗ Los tipos de la base están viejos: se generaron contra ${generado} y después hay ${nuevas.length} migración(es): ${nuevas.join(', ')}.`);
  console.error('  Regenera base.ts (Supabase → generate_typescript_types) y actualiza la línea «generado-contra-migracion».');
  process.exit(1);
}
if (!versiones.includes(generado)) {
  console.error(`✗ base.ts dice que se generó contra ${generado}, pero esa migración no está en supabase/migrations/.`);
  process.exit(1);
}
console.log(`✓ Tipos de la base al día (generados contra ${ultima}, la última migración)`);
