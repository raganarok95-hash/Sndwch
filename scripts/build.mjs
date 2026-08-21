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
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

function main() {
  rmSync(distDir, { recursive: true, force: true });
  execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });

  let appJs = readFileSync(path.join(distDir, 'app.js'), 'utf8');
  const shell = readFileSync(path.join(root, 'src/shell.html'), 'utf8');

  // Sello de build. Se inyecta acá y no se escribe a mano en src/app.ts para que no haya
  // forma de que quede desactualizado. Es lo que permite saber, mirando la app en el
  // teléfono del dueño, si está corriendo el código que acabamos de desplegar o un shell
  // viejo servido por el service worker.
  //
  // Es el HASH DEL CONTENIDO COMPILADO, no el SHA de git ni la hora del build — y eso es
  // deliberado. La primera versión usaba `git rev-parse HEAD` + timestamp, y tenía un
  // defecto que se ve recién al usarla: el build corre ANTES de que exista el commit que
  // lo va a contener, así que index.html se sellaba con el SHA del commit ANTERIOR y
  // quedaba modificado inmediatamente después de cada commit. Regresión infinita: cada
  // commit ensuciaba el árbol de nuevo. El timestamp agregaba lo suyo, cambiando el
  // archivo aunque el código fuera idéntico.
  //
  // El hash del contenido no tiene ninguno de los dos problemas: mismo código fuente →
  // mismo sello → cero diffs espurios. Y además identifica mejor lo que se quiere
  // identificar: los bytes que de verdad se están sirviendo, no el commit desde el que
  // se compilaron.
  if (!appJs.includes('__APP_BUILD__')) {
    throw new Error('src/app.ts ya no tiene el marcador __APP_BUILD__ — el sello de versión dejaría de actualizarse en silencio.');
  }
  const stamp = createHash('sha256').update(appJs).digest('hex').slice(0, 10);
  appJs = appJs.split('__APP_BUILD__').join(stamp);

  if (!shell.includes('__APP_JS__')) {
    throw new Error('src/shell.html no tiene el placeholder __APP_JS__ — revisa que no se haya borrado por error.');
  }

  const html = shell.replace('__APP_JS__', () => appJs);
  writeFileSync(path.join(root, 'index.html'), html);
  rmSync(distDir, { recursive: true, force: true });
  console.log('✓ index.html regenerado desde src/app.ts + src/shell.html');
}

main();
