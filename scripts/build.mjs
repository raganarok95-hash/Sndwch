// SND//WCH — scripts/build
// Compila las partes de src/app/ a JS, las concatena e inyecta el resultado en el
// placeholder __APP_JS__ de
// src/shell.html para regenerar index.html en la raíz del repo (el único artefacto
// servido, un solo archivo estático). src/ es la fuente de verdad a partir de ahora.
//
// Usa `tsc` (no esbuild) para la emisión — esbuild transforma TS a JS pero descarta los
// comentarios normales al reparsear, y buena parte del código fuente lleva comentarios
// en español documentando el PORQUÉ de cada decisión (hallazgos de auditoría, bugs ya
// corregidos, etc.) que no deben perderse en cada build. tsc con removeComments:false
// sí los conserva tal cual (ver tsconfig.build.json).
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

function main() {
  rmSync(distDir, { recursive: true, force: true });
  execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });

  // El cliente vive en src/app/*.ts: son archivos de SCRIPT GLOBAL (sin import/export),
  // no módulos. tsc emite uno por archivo y acá se concatenan EN ORDEN ALFABÉTICO, que es
  // el mismo orden en que estaban dentro del app.ts único del que salieron — por eso los
  // nombres llevan prefijo numérico. No es cosmético: el archivo se ejecuta de arriba a
  // abajo y hay estado de módulo (constantes, catálogo) que tiene que existir antes de que
  // corra nada de abajo, así que reordenarlos cambia el comportamiento.
  //
  // La división se hizo verificando que el JS concatenado sea BYTE A BYTE idéntico al que
  // producía el archivo único (ver scripts/check-bundle.mjs, que lo sigue comprobando en
  // cada `npm run verify` contra el índice de partes). Si algún día hace falta partir un
  // archivo de nuevo, ese script es la red: cualquier cambio real de salida lo delata.
  const partFiles = readdirSync(path.join(distDir, 'app')).filter((f) => f.endsWith('.js')).sort();
  if (!partFiles.length) throw new Error('dist/app no tiene ninguna parte compilada — revisa el include de tsconfig.build.json.');
  // ── DOS BUNDLES: EL CLIENTE Y EL PANEL (2026-09-10) ────────────────────────────────
  // Las partes hasta el ROUTER son el cliente; las de después, el panel. El corte se
  // deriva del nombre del router y no de un número escrito acá a mano: renumerar las
  // partes (algo que ya pasó una vez) no puede cambiar en silencio qué viaja a cada
  // celular.
  //
  // Por qué se parte: el panel son ~300 KB de ~800 por 34 pantallas que solo abre el dueño,
  // y las descargaba TODO cliente que abre la carta. El CAC es
  // `CPM / (1000 × CTR × CVR) × 1.18` y la conversión es la única de las tres variables que
  // el negocio controla, así que un bundle que pesa el doble es fricción en el punto exacto
  // donde se pierde al cliente.
  const iRouter = partFiles.findIndex((f) => /^\d{2}-router\.js$/.test(f));
  if (iRouter === -1) {
    throw new Error('No hay ninguna parte NN-router.js — sin el router no se sabe dónde termina el cliente y empieza el panel.');
  }
  const clientFiles = partFiles.slice(0, iRouter + 1);
  const adminFiles = partFiles.slice(iRouter + 1);
  if (!adminFiles.length) {
    throw new Error('No hay ninguna parte después del router — el panel tiene que ser su propio archivo.');
  }

  let appJs = clientFiles
    .map((f, i) => {
      const js = readFileSync(path.join(distDir, 'app', f), 'utf8');
      // tsc antepone su propio `"use strict";` a CADA archivo emitido. En un bundle
      // concatenado, todos menos el primero caen a mitad del script, donde la directiva
      // no tiene ningún efecto (solo cuenta como prólogo, al inicio de un script o de una
      // función) — o sea que son 8 líneas muertas. Se quitan para que el bundle salga
      // idéntico byte a byte al que producía el archivo único, que es lo que hace
      // verificable esta división. El `'use strict';` del primer archivo NO se toca: ese
      // viene del propio código fuente (comillas simples) y es el que pone todo el bundle
      // en modo estricto.
      return i === 0 ? js : js.replace(/^"use strict";\r?\n/, '');
    })
    .join('');
  // El panel se concatena igual, pero SIEMPRE sin el `"use strict"` de tsc: este archivo
  // se carga como script aparte, así que su primera línea ya no es el prólogo de nada — y
  // el bundle del cliente, que corre antes, ya puso todo en modo estricto.
  const adminJs = adminFiles
    .map((f) => readFileSync(path.join(distDir, 'app', f), 'utf8').replace(/^"use strict";\r?\n/, ''))
    .join('');

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
    throw new Error('El cliente ya no tiene el marcador __APP_BUILD__ (debería estar en src/app/01-*.ts) — el sello de versión dejaría de actualizarse en silencio.');
  }
  // ⚠ EL SELLO HASHEA LOS DOS BUNDLES, no solo el del cliente. El panel se pide como
  // `admin.js?v=<sello>`, así que si el sello ignorara el panel, un cambio SOLO en el panel
  // dejaría a los navegadores sirviendo el archivo viejo desde su caché bajo la misma URL —
  // y el dueño vería su panel sin actualizar sin ningún error de por medio. Es exactamente
  // el defecto del 2026-08-21 (shell viejo pegado a la vez en la app, el celular y la PC),
  // que ya obligó a escribir `check:shell`.
  const stamp = createHash('sha256').update(appJs).update(adminJs).digest('hex').slice(0, 10);
  appJs = appJs.split('__APP_BUILD__').join(stamp);

  if (!shell.includes('__APP_JS__')) {
    throw new Error('src/shell.html no tiene el placeholder __APP_JS__ — revisa que no se haya borrado por error.');
  }

  const html = shell.replace('__APP_JS__', () => appJs);
  writeFileSync(path.join(root, 'index.html'), html);

  // El panel, como archivo aparte servido desde la raíz. Lo pide `loadAdminBundle()` en el
  // router, y SOLO cuando alguien abre una pantalla de admin: ningún cliente lo descarga.
  writeFileSync(
    path.join(root, 'admin.js'),
    '// SND//WCH — bundle del PANEL. Generado por scripts/build.mjs; no editar a mano.\n' +
      '// Se carga bajo demanda desde el router (loadAdminBundle) cuando se abre una pantalla\n' +
      '// de admin. Ningún cliente lo descarga: son ~' + Math.round(adminJs.length / 1024) + ' KB que antes\n' +
      '// viajaban en index.html a cada celular que abría la carta.\n' +
      adminJs,
  );

  rmSync(distDir, { recursive: true, force: true });
  const kbCliente = Math.round(html.length / 1024);
  const kbPanel = Math.round(adminJs.length / 1024);
  console.log(
    `✓ index.html (${clientFiles.length} partes, ${kbCliente} KB) + admin.js (${adminFiles.length} partes, ${kbPanel} KB, bajo demanda)`,
  );
}

main();
