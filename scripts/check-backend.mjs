// Chequeo de tipos del backend (las 8 edge functions de Supabase).
//
// Hasta ahora el backend NO tenía ninguna verificación estática: `npm run typecheck` solo
// cubre `src/**` (ver tsconfig.json), así que un typo en el camino del dinero —
// orders.ts, catalog.ts, session.ts— solo se descubría cuando el CI intentaba desplegar
// o, peor, en producción. Esto corre `deno check` sobre los 8 entrypoints, que arrastra
// todo el grafo de imports de cada función.
//
// SIEMPRE se trabaja sobre una copia temporal, nunca sobre el árbol real. Deno resuelve
// `npm:web-push` creando su propio `node_modules/.deno`, y hacerlo dentro del repo dejó
// dos copias de @playwright/test en el árbol: el runner de tests dejaba de arrancar
// ("Playwright Test did not expect test() to be called here"). Pasó de verdad al montar
// esto — no es una precaución teórica.
//
// Los entrypoints abren con `import "jsr:@supabase/functions-js/edge-runtime.d.ts"`, que
// solo aporta tipos de ambiente. Si la red no puede llegar a jsr.io (pasa en entornos con
// proxy restringido), se reintenta sin esa línea en vez de fallar: perder tipos de
// ambiente es mucho mejor que perder el chequeo entero.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FUNCTIONS = join(ROOT, 'supabase/functions');

const local = join(ROOT, 'node_modules/.bin/deno');
const deno = existsSync(local) ? local : 'deno';
if (deno === 'deno' && spawnSync('deno', ['--version'], { encoding: 'utf8' }).error) {
  console.error('\n✗ No se encontró deno. Instálalo con `npm install` (está en devDependencies).\n');
  process.exit(1);
}

function entrypoints(base) {
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => join(base, d.name, 'index.ts'))
    .filter(existsSync)
    .sort();
}

const work = mkdtempSync(join(tmpdir(), 'sndwch-fncheck-'));
try {
  cpSync(FUNCTIONS, work, { recursive: true });
  const files = entrypoints(work);

  const run = () => spawnSync(deno, ['check', '--node-modules-dir=auto', ...files], { encoding: 'utf8', cwd: work });
  let r = run();
  let degraded = false;
  if (r.status !== 0 && /jsr\.io|JSR package manifest/.test(r.stderr || '')) {
    for (const f of files) {
      writeFileSync(f, readFileSync(f, 'utf8').replace(/^import "jsr:@supabase\/functions-js\/edge-runtime\.d\.ts";\n/, ''));
    }
    r = run();
    degraded = true;
  }

  if (r.status !== 0) {
    // Las rutas del error apuntan a la copia temporal; se reescriben a las reales para
    // que el mensaje sea clicable desde el repo.
    process.stderr.write((r.stderr || '').split(work).join(FUNCTIONS));
    console.error('\n✗ El backend no pasa el chequeo de tipos. Corrige antes de pushear:');
    console.error('  el CI despliega estas funciones sin verificarlas, así que un error acá llega a producción.\n');
    process.exit(1);
  }

  console.log(`✓ Backend: ${files.length} edge functions pasan el chequeo de tipos` + (degraded ? ' (sin los tipos de ambiente de jsr.io — la red los bloqueó)' : ''));
} finally {
  rmSync(work, { recursive: true, force: true });
}
