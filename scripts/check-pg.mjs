// SND//WCH — scripts/check-pg
// Pruebas de las funciones de la BASE contra un Postgres local con el esquema real.
//
// Levanta su propio Postgres (scripts/pg-local/postgres.mjs), carga la foto completa del esquema
// (supabase/esquema-actual.sql) y corre cada archivo de tests-db/ en una base NUEVA, así una
// prueba no hereda lo que dejó otra. Cada archivo afirma con `raise exception`.
//
// Por qué existe: hasta el 2026-09-24 la única forma de probar una función de la base era
// correrla contra PRODUCCIÓN dentro de un bloque que se deshace. Y además comprueba que la foto
// del esquema no esté vieja: si hay una migración más nueva que ella, falla.
//
// Correr con: npm run check:pg   (dentro de `npm run verify`)
import { readdirSync, readFileSync } from 'node:fs';
import { levantarPostgres } from './pg-local/postgres.mjs';
import { cargarEsquema, psql } from './pg-local/esquema.mjs';

const foto = /foto-tomada-tras-migracion:\s*(\d{14})/.exec(readFileSync('supabase/esquema-actual.sql', 'utf8'));
const ultima = readdirSync('supabase/migrations').map((f) => /^(\d{14})_/.exec(f)?.[1]).filter(Boolean).sort().pop();
if (!foto || foto[1] !== ultima) {
  console.error(`✗ supabase/esquema-actual.sql está viejo: es de ${foto ? foto[1] : '(sin marca)'} y la última migración es ${ultima}.`);
  console.error('  Vuelve a sacar la foto: corre scripts/pg-local/foto-del-esquema.sql contra la base y guarda el resultado.');
  process.exit(1);
}

const pg = levantarPostgres();
if (!pg) {
  console.error('✗ No hay Postgres local (initdb) para probar la base.');
  process.exit(1);
}
const fallas = [];
let n = 0;
try {
  const pruebas = readdirSync('tests-db').filter((f) => f.endsWith('.sql')).sort();
  for (const f of pruebas) {
    const base = 'prueba_' + (++n);
    psql(pg.url, `create database ${base};`);
    const url = pg.url.replace('/postgres?', `/${base}?`);
    try {
      cargarEsquema(url);
      psql(url, 'set search_path to public, extensions;\n' + readFileSync(`tests-db/${f}`, 'utf8'));
    } catch (e) {
      fallas.push(`${f}: ${String(e.stderr || e.message).trim().split('\n').filter((l) => /ERROR|no carga/.test(l)).slice(0, 2).join(' ') || e.message}`);
    }
  }
} finally {
  pg.parar();
}
if (fallas.length) {
  console.error('✗ Pruebas de la base:\n  · ' + fallas.join('\n  · '));
  process.exit(1);
}
console.log(`✓ Base: ${n} archivo(s) de tests-db/ pasan contra el esquema real (foto tras ${ultima})`);
