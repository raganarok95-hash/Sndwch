// SND//WCH — scripts/backup-to-sql
// Convierte un directorio de respaldo (`scripts/backup-db.mjs`) en el SQL que lo vuelve a
// meter en una base. Esta es la MITAD DE DATOS de una restauración; la mitad de esquema
// son las migraciones de `supabase/migrations/`, que ya están versionadas.
//
// Restaurar de verdad, el día malo:
//   1. Proyecto Supabase nuevo (o el mismo, vaciado).
//   2. Aplicar `supabase/migrations/*.sql` en orden — deja tablas, RPCs, políticas y crons.
//   3. `node scripts/backup-to-sql.mjs backup > datos.sql` y correr ese SQL.
// Con `--ddl` además emite los CREATE TABLE deducidos del esquema volcado. Eso NO es para
// una restauración real (no lleva claves, índices, RLS ni triggers): es para levantar un
// Postgres desechable en CI y comprobar que los datos del respaldo cargan de verdad.
//
// POR QUÉ `jsonb_populate_record` Y NO INSERTs CON LITERALES. Escribir a mano el literal
// SQL de cada valor obliga a reimplementar el formato de entrada de Postgres para cada
// tipo — y se rompe justo en los bordes: un `text[]` se escribe `{a,b}` y no `["a","b"]`,
// un `jsonb` con comillas dentro, un `numeric` que en JS ya perdió precisión. Pasarle el
// JSON de la fila a `jsonb_populate_record(null::tabla, ...)` deja que Postgres use las
// funciones de entrada del propio tipo de la columna. Un solo escape (la comilla simple)
// en vez de una tabla de casos que solo se descubre incompleta el día del desastre.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const conDDL = args.includes('--ddl');
const DIR = args.find((a) => !a.startsWith('--')) || 'backup';

const manifiesto = JSON.parse(readFileSync(join(DIR, 'manifiesto.json'), 'utf8'));
const esquema = JSON.parse(readFileSync(join(DIR, 'esquema.json'), 'utf8'));
const secuencias = JSON.parse(readFileSync(join(DIR, 'secuencias.json'), 'utf8'));

const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const out = [];

out.push(`-- SND//WCH — datos restaurados del respaldo del ${manifiesto.fecha}`);
out.push(`-- Proyecto ${manifiesto.proyecto} · ${manifiesto.filasTotales} filas en ${Object.keys(manifiesto.tablas).length} tablas`);
out.push('begin;');

if (conDDL) {
  out.push('\n-- Esquema MÍNIMO deducido del respaldo: solo columnas y tipos. Sin claves, sin');
  out.push('-- índices, sin RLS. Sirve para comprobar que los datos cargan, no para producción.');
  for (const [tabla, cols] of Object.entries(esquema)) {
    const defs = cols.map((c) => {
      // 'ARRAY' no es un tipo que Postgres acepte al crear: el tipo real está en el udt
      // (`_text` → `text[]`). Es el único caso donde data_type no sirve tal cual.
      const tipo = c.tipo === 'ARRAY' ? `${c.udt.replace(/^_/, '')}[]` : c.tipo;
      return `  "${c.nombre}" ${tipo}`;
    });
    out.push(`create table public."${tabla}" (\n${defs.join(',\n')}\n);`);
  }
  // Las secuencias también: el bloque de `setval` del final las da por existentes porque en
  // una restauración real las crean las migraciones. En el Postgres desechable de CI no hay
  // migraciones, así que sin esto la verificación falla por una razón que no es la que se
  // está verificando.
  for (const s of secuencias) out.push(`create sequence public."${s.nombre}";`);
}

out.push('');
for (const tabla of Object.keys(manifiesto.tablas).sort()) {
  const lineas = readFileSync(join(DIR, 'data', `${tabla}.jsonl`), 'utf8').split('\n').filter(Boolean);
  if (!lineas.length) {
    out.push(`-- public."${tabla}": 0 filas`);
    continue;
  }
  out.push(`-- public."${tabla}": ${lineas.length} filas`);
  // Por lotes: un INSERT por fila serían decenas de miles de sentencias y una restauración
  // que tarda horas por puro ida y vuelta.
  const LOTE = 500;
  for (let i = 0; i < lineas.length; i += LOTE) {
    const json = '[' + lineas.slice(i, i + LOTE).join(',') + ']';
    out.push(
      `insert into public."${tabla}" select (jsonb_populate_record(null::public."${tabla}", fila)).* ` +
        `from jsonb_array_elements(${lit(json)}::jsonb) as fila;`,
    );
  }
}

// Las secuencias van AL FINAL y a propósito: si se fijaran antes de insertar, cualquier
// default `nextval` de las filas insertadas las volvería a mover. Una base restaurada con
// la secuencia atrasada reparte ids que ya existen y el primer pedido nuevo choca contra
// la clave primaria de uno viejo.
const conValor = secuencias.filter((s) => s.last_value != null);
if (conValor.length) {
  out.push('\n-- Secuencias');
  for (const s of conValor) out.push(`select setval('public."${s.nombre}"', ${Number(s.last_value)}, true);`);
}

out.push('\ncommit;');
process.stdout.write(out.join('\n') + '\n');
