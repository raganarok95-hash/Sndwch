#!/usr/bin/env node
// CHEQUEO DE RPC — que ninguna función `security definer` quede llamable con la anon key.
//
// POR QUÉ EXISTE. Una función `security definer` corre con los privilegios de quien la creó,
// saltándose RLS. Sin un `revoke`, Postgres la deja ejecutable por PUBLIC, y en Supabase eso
// incluye a `anon` — la llave que va escrita en el HTML de la app. El defecto no produce ningún
// error: la función funciona igual de bien para el servidor, solo que además funciona para todo el
// mundo. Fue el séptimo caso del mismo defecto en este repo; el peor, `record_cron_heartbeat`,
// dejaba a cualquiera escribir un latido falso y callar la alarma de crons caídos.
//
// CÓMO LO MIRA (desde el 2026-09-24). Antes leía las migraciones con expresiones regulares y
// reconstruía a mano qué seguía vivo: tuvo un punto ciego (el `drop` de una sobrecarga vieja daba
// por muerta a la viva) que solo se encontró cruzándolo contra `pg_proc`. Ahora le pregunta
// directamente a `pg_proc`: levanta un Postgres local, carga la foto del esquema
// (`supabase/esquema-actual.sql`, que `check:pg` exige al día tras cada migración y el respaldo
// diario compara contra producción) y pide los permisos reales de cada función.
//
//   npm run check:rpc              → falla si alguna `security definer` la puede ejecutar anon,
//                                    authenticated o public
//   npm run check:rpc -- --probar  → crea una función sin revoke y exige que se detecte
import { levantarPostgres } from './pg-local/postgres.mjs';
import { psql, cargarEsquema } from './pg-local/esquema.mjs';

const probar = process.argv.includes('--probar');
const pg = levantarPostgres();
if (!pg) {
  console.error('✗ No hay Postgres local (initdb) para mirar pg_proc.');
  process.exit(1);
}

const CONSULTA = `
select p.oid::regprocedure::text || '|' ||
       concat_ws(',',
         case when has_function_privilege('anon', p.oid, 'execute') then 'anon' end,
         case when has_function_privilege('authenticated', p.oid, 'execute') then 'authenticated' end,
         case when exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                           where a.grantee = 0 and a.privilege_type = 'EXECUTE') then 'public' end)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
 order by 1;`;

let filas;
try {
  psql(pg.url, 'create database rpc;');
  const url = pg.url.replace('/postgres?', '/rpc?');
  cargarEsquema(url);
  if (probar) {
    psql(url, `create function public.prueba_sin_revoke() returns int language sql security definer as 'select 1';`);
  }
  filas = psql(url, CONSULTA).split('\n').map((l) => l.trim()).filter((l) => l.includes('|'));
} finally {
  pg.parar();
}

const abiertas = filas.map((l) => l.split('|')).filter(([, quien]) => quien);
if (probar) {
  if (abiertas.some(([f]) => f.startsWith('prueba_sin_revoke'))) {
    console.log('✓ check:rpc --probar: una función `security definer` sin revoke se detecta');
    process.exit(0);
  }
  console.error('✗ check:rpc --probar: una función sin revoke pasó sin que nadie la viera');
  process.exit(1);
}
if (filas.length < 10) {
  console.error(`✗ check:rpc: pg_proc devolvió solo ${filas.length} funciones security definer; ¿cargó el esquema?`);
  process.exit(1);
}
if (abiertas.length) {
  console.error('✗ RPC `security definer` que se pueden llamar sin ser el servidor:\n');
  for (const [firma, quien] of abiertas) console.error(`  · ${firma}  — la ejecuta: ${quien}`);
  console.error('\n  Agrega a su migración:');
  console.error('    revoke execute on function <nombre>(<args>) from public, anon, authenticated;');
  process.exit(1);
}
console.log(`✓ RPC: ${filas.length} funciones \`security definer\` en la base, ninguna ejecutable por anon, authenticated ni public`);
