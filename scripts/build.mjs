// SND//WCH — scripts/build
// Compila src/app.ts a JS e inyecta el resultado en el placeholder __APP_JS__ de
// src/shell.html para regenerar index.html en la raíz del repo (el único artefacto
// servido, un solo archivo estático). src/ es la fuente de verdad a partir de ahora.
//
// Usa `tsc` (no esbuild) para la emisión — esbuild transforma TS a JS pero descarta los
// comentarios normales al reparsear, y buena parte del código fuente lleva comentarios
// en español documentando el PORQUÉ de cada decisión (hallazgos de auditoría, bugs ya
// corregidos, etc.) que no deben perderse en cada build. tsc con removeComments:false
// sí los conserva tal cual (ver tsconfig.build.json).
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

function main() {
  rmSync(distDir, { recursive: true, force: true });
  execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });

  const appJs = readFileSync(path.join(distDir, 'app.js'), 'utf8');
  const shell = readFileSync(path.join(root, 'src/shell.html'), 'utf8');

  if (!shell.includes('__APP_JS__')) {
    throw new Error('src/shell.html no tiene el placeholder __APP_JS__ — revisa que no se haya borrado por error.');
  }

  const html = shell.replace('__APP_JS__', () => appJs);
  writeFileSync(path.join(root, 'index.html'), html);
  rmSync(distDir, { recursive: true, force: true });
  console.log('✓ index.html regenerado desde src/app.ts + src/shell.html');
}

main();
