// SND//WCH — scripts/pg-local/esquema
// Carga el esquema REAL en un Postgres local: supabase/esquema-actual.sql (la foto completa de la
// base, generada con foto-del-esquema.sql) sobre el preámbulo que imita las piezas de Supabase
// (supabase-de-mentira.sql).
//
// NO se cargan las migraciones: no reconstruyen la base. La primera ya altera `customers`, una
// tabla que ninguna migración crea (las originales nacieron desde el panel de Supabase). Se
// descubrió el 2026-09-24 al intentar exactamente eso.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binPostgres } from './postgres.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function psql(url, sql) {
  const dir = mkdtempSync(join(tmpdir(), 'sndwch-sql-'));
  const f = join(dir, 'q.sql');
  writeFileSync(f, sql);
  try {
    return execFileSync(join(binPostgres() || '', 'psql'), [url, '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-At', '-f', f], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function cargarEsquema(url) {
  psql(url, readFileSync(join(RAIZ, 'scripts/pg-local/supabase-de-mentira.sql'), 'utf8'));
  try {
    // La base real es Postgres 17; la local puede ser 16, que no conoce el permiso MAINTAIN. Se
    // quita SOLO acá, al cargar: la foto sigue fiel a la base real.
    const ddl = readFileSync(join(RAIZ, 'supabase/esquema-actual.sql'), 'utf8')
      .replace(/\bMAINTAIN, /g, '').replace(/, MAINTAIN\b/g, '').replace(/grant MAINTAIN on table [^;]*;/g, '');
    psql(url, 'set search_path to public, extensions;\n' + ddl);
  } catch (e) {
    const err = String(e.stderr || e.message).trim().split('\n').slice(0, 6).join('\n');
    throw new Error(`supabase/esquema-actual.sql no carga en el Postgres local:\n${err}`);
  }
  return Number(psql(url, "select count(*) from pg_tables where schemaname = 'public'").trim());
}
