// Corre las pruebas de comportamiento del backend (Deno.test) sobre el código REAL.
//
// Se hace por script y no con `deno test` directo por la misma razón que
// scripts/check-backend.mjs: el entorno bloquea jsr.io para los tipos de ambiente del
// entrypoint, y hay que correr sobre una copia temporal para que el node_modules/.deno que
// Deno crea al resolver npm: no deje dos copias de @playwright/test en el árbol y rompa el
// runner de los otros tests.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'sndwch-money-'));
try {
  cpSync(join(ROOT, 'supabase'), join(tmp, 'supabase'), { recursive: true });
  cpSync(join(ROOT, 'tests-api'), join(tmp, 'tests-api'), { recursive: true });
  const deno = join(ROOT, 'node_modules', '.bin', 'deno');
  execFileSync(deno, ['test', '--allow-read', '--allow-env', '--no-check', 'tests-api/'], {
    cwd: tmp,
    stdio: 'inherit',
  });
  console.log('\n✓ Lógica de dinero del servidor: las pruebas de comportamiento pasan');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
