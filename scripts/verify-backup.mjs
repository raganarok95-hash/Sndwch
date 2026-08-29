// SND//WCH — scripts/verify-backup
// Carga un respaldo REAL en un Postgres y comprueba que lo que entra es lo que salió.
//
// La diferencia con `scripts/check-backup.mjs`: aquel prueba el MECANISMO con datos
// inventados y hostiles, y corre en cada `npm run verify`. Este prueba el ARCHIVO DEL DÍA,
// con los datos que de verdad tiene el negocio, y corre dentro del workflow de respaldo.
// Hacen falta los dos: el mecanismo puede estar bien y el volcado del martes venir cortado.
//
// Uso: node scripts/verify-backup.mjs <directorio> <url-de-postgres>
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [DIR, PG] = process.argv.slice(2);
if (!DIR || !PG) {
  console.error('Uso: node scripts/verify-backup.mjs <directorio-de-respaldo> <url-de-postgres>');
  process.exit(1);
}

// Comparar fila por fila exige traerse la base entera a memoria. Con los volúmenes de este
// negocio eso no es problema hoy, pero el día que lo sea es mejor degradar a comparar solo
// los conteos —y DECIRLO— que reventar el workflow por falta de memoria.
const TOPE_COMPARACION_COMPLETA = 200_000;

const manifiesto = JSON.parse(readFileSync(join(DIR, 'manifiesto.json'), 'utf8'));
const sqlPath = join(DIR, 'restaurar.sql');
if (!existsSync(sqlPath)) {
  console.error(`✗ Falta ${sqlPath}. Generarlo con: node scripts/backup-to-sql.mjs --ddl ${DIR} > ${sqlPath}`);
  process.exit(1);
}

const problemas = [];
const psql = (...args) => execFileSync('psql', [PG, ...args], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });

console.log(`Verificando el respaldo del ${manifiesto.fecha} (${manifiesto.filasTotales} filas)`);

try {
  psql('-v', 'ON_ERROR_STOP=1', '-q', '-f', sqlPath);
} catch (e) {
  console.error('\n✗ El respaldo NO carga en Postgres. No es un respaldo, es un archivo.\n');
  console.error(String(e.stderr || e.message).trim());
  process.exit(1);
}

const completa = manifiesto.filasTotales <= TOPE_COMPARACION_COMPLETA;
if (!completa) {
  console.log(`  · ${manifiesto.filasTotales} filas superan el tope: se comparan conteos, no contenido.`);
}

for (const [tabla, info] of Object.entries(manifiesto.tablas)) {
  const cuenta = Number(psql('-t', '-A', '-c', `select count(*) from public."${tabla}"`).trim());
  if (cuenta !== info.filas) {
    problemas.push(`${tabla}: el respaldo dice ${info.filas} filas y en la base restaurada hay ${cuenta}.`);
    continue;
  }
  if (!completa || !info.filas) continue;

  // El contenido se compara como objetos y no como texto: `jsonb` tiene su propia forma
  // canónica de escribirse ({"a": 1}, con espacio) y compararla contra el texto del volcado
  // marcaría como distinto algo que solo cambió de formato. El precio de esa comodidad es
  // que la comparación pasa por JSON.parse, así que NO vería un número que perdió precisión
  // (20.90 y 20.9 le parecen iguales). Eso lo cubre `scripts/check-backup.mjs`, que compara
  // texto contra texto sobre una tabla hecha a medida para ese caso.
  const SALTO = String.raw`e'\n'`;
  const salida = psql(
    '-t',
    '-A',
    '-c',
    `select coalesce(string_agg(row_to_json(t)::text, ${SALTO} order by row_to_json(t)::text), '') from public."${tabla}" t`,
  ).replace(/\n$/, '');
  const norm = (ls) => ls.map((l) => JSON.stringify(JSON.parse(l))).sort().join('');
  const restaurado = norm(salida ? salida.split('\n') : []);
  const respaldado = norm(readFileSync(join(DIR, 'data', `${tabla}.jsonl`), 'utf8').split('\n').filter(Boolean));
  if (restaurado !== respaldado) {
    problemas.push(`${tabla}: los ${cuenta} registros están, pero el contenido restaurado no coincide con el respaldado.`);
  }
}

if (problemas.length) {
  console.error(`\n✗ El respaldo del día no se restaura fielmente: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error('  • ' + p);
  process.exit(1);
}
console.log(
  `\n✓ Respaldo verificado: ${Object.keys(manifiesto.tablas).length} tablas y ${manifiesto.filasTotales} filas ` +
    `cargan en Postgres${completa ? ' y coinciden una por una' : ' con los conteos correctos'}.`,
);
