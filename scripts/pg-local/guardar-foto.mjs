// SND//WCH — scripts/pg-local/guardar-foto
// Guarda la foto del esquema en supabase/esquema-actual.sql a partir del resultado de correr
// foto-del-esquema.sql contra la base (lo que devuelve execute_sql, tal cual, o un JSON con la
// columna `ddl`). Pone la cabecera con la migración tras la que se tomó.
//
// Uso: node scripts/pg-local/guardar-foto.mjs <resultado> <version-de-la-ultima-migracion>
import { readFileSync, writeFileSync } from 'node:fs';

const [archivo, version] = process.argv.slice(2);
if (!archivo || !/^\d{14}$/.test(version || '')) {
  console.error('Uso: node scripts/pg-local/guardar-foto.mjs <resultado> <version-14-digitos>');
  process.exit(1);
}
let txt = readFileSync(archivo, 'utf8');
try { txt = JSON.parse(txt).result ?? txt; } catch { /* no venía envuelto */ }
const m = /(\[\{"ddl".*\}\])/s.exec(txt);
if (!m) {
  console.error('No encontré la columna `ddl` en el resultado.');
  process.exit(1);
}
const ddl = JSON.parse(m[1])[0].ddl.trim();
const cabecera = `-- SND//WCH — EL ESQUEMA COMPLETO DE LA BASE, TAL COMO ESTÁ. GENERADO, NO SE EDITA A MANO.
--
-- Sale de scripts/pg-local/foto-del-esquema.sql corrida contra la base real. Existe porque las
-- migraciones NO reconstruyen la base (las tablas originales nacieron fuera del historial): con
-- este archivo sí. Restaurar = cargar este archivo y después los datos del respaldo.
--
-- foto-tomada-tras-migracion: ${version}
`;
writeFileSync('supabase/esquema-actual.sql', cabecera + '\n' + ddl + '\n');
console.log(`✓ supabase/esquema-actual.sql (${ddl.length} caracteres, tras ${version})`);
