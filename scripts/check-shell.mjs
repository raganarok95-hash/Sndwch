// SND//WCH — scripts/check-shell
// Comprueba que la verificación del shell desplegado (`scripts/shell-live.mjs`) de verdad
// se da cuenta cuando producción sirve una versión vieja.
//
// POR QUÉ EXISTE. Mismo motivo que `check-smoke.mjs`: el camino feliz se ejerce solo cada
// vez que un deploy sale bien, y el camino roto no se ejerce nunca. Un chequeo que siempre
// pasa es peor que no tener ninguno — da una señal de "todo al día" que nadie vuelve a
// mirar, y el fallo que vigila (#90) es justamente uno que no produce ningún error: todo
// responde 200 y lo que se sirve es la versión anterior.
//
// Además, desde este entorno NO se puede correr contra producción: el proxy bloquea
// sndwch.app igual que bloquea el host de Supabase. Así que esta es la única forma de
// probar el script sin desplegar.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { esperado } from './shell-live.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUIERO = esperado(ROOT);

// Producción al día: sirve exactamente lo que este repo construyó.
const SANO = {
  '/index.html': { status: 200, cuerpo: `<!doctype html><script>var APP_BUILD = '${QUIERO.build}';</script>` },
  '/sw.js': { status: 200, cuerpo: `const VERSION = '${QUIERO.version}';` },
};

// Cada caso rompe UNA cosa y nombra el trozo del mensaje que el script tiene que emitir.
const CASOS = [
  ['al día', (r) => r, null],
  [
    'shell viejo pegado',
    (r) => ({ ...r, '/index.html': { status: 200, cuerpo: "var APP_BUILD = 'deadbeef00';" } }),
    'el deploy del cliente no llegó',
  ],
  [
    'index.html sin sello de versión',
    (r) => ({ ...r, '/index.html': { status: 200, cuerpo: '<!doctype html><p>hola</p>' } }),
    'no tiene el sello APP_BUILD',
  ],
  ['la app no responde', (r) => ({ ...r, '/index.html': { status: 500, cuerpo: 'boom' } }), 'la app no está sirviendo'],
  [
    'service worker viejo con shell nuevo',
    (r) => ({ ...r, '/sw.js': { status: 200, cuerpo: "const VERSION = 'v1';" } }),
    'el shell viejo puede seguir pegado',
  ],
  [
    'service worker sin VERSION',
    (r) => ({ ...r, '/sw.js': { status: 200, cuerpo: 'self.addEventListener("fetch", () => {});' } }),
    'dejó de existir',
  ],
  ['sin service worker', (r) => ({ ...r, '/sw.js': { status: 404, cuerpo: 'not found' } }), 'sin caché de shell'],
];

function servidor(respuestas) {
  return createServer((req, res) => {
    const r = respuestas[req.url] || { status: 404, cuerpo: 'not found' };
    res.writeHead(r.status, { 'Content-Type': 'text/plain' }).end(r.cuerpo);
  });
}

function correr(url) {
  return new Promise((res) => {
    const hijo = spawn(process.execPath, [join(ROOT, 'scripts/shell-live.mjs')], {
      // Sin espera entre reintentos: acá el servidor no va a cambiar de opinión, y esperar
      // cinco minutos por cada caso roto convertiría este chequeo en algo que nadie corre.
      env: { ...process.env, SHELL_URL: url, SHELL_MAX_WAIT_MS: '0' },
    });
    let texto = '';
    hijo.stdout.on('data', (d) => (texto += d));
    hijo.stderr.on('data', (d) => (texto += d));
    hijo.on('close', (code) => res({ code, texto }));
  });
}

const problemas = [];

// Antes que nada: que el repo tenga de verdad los dos sellos. Si el marcador desapareciera
// del build, todos los casos de abajo compararían `null` contra `null` y pasarían en verde
// mientras la verificación entera dejó de poder verificar nada.
if (!QUIERO.build) problemas.push('index.html de este repo no tiene el sello APP_BUILD: la verificación del shell no tiene contra qué comparar.');
if (!QUIERO.version) problemas.push('sw.js de este repo no declara VERSION: la verificación del shell no tiene contra qué comparar.');

for (const [nombre, romper, esperadoTexto] of CASOS) {
  const srv = servidor(romper(structuredClone(SANO)));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const { code, texto } = await correr(`http://127.0.0.1:${srv.address().port}`);
  srv.close();

  if (esperadoTexto === null) {
    if (code !== 0) problemas.push(`Con producción AL DÍA la verificación falló:\n      ${texto.trim().split('\n').join('\n      ')}`);
  } else if (code === 0) {
    problemas.push(`«${nombre}»: la verificación dio VERDE sobre una producción desactualizada.`);
  } else if (!texto.includes(esperadoTexto)) {
    problemas.push(`«${nombre}»: falló, pero sin decir por qué (se esperaba «${esperadoTexto}»):\n      ${texto.trim().split('\n').join('\n      ')}`);
  }
}

if (problemas.length) {
  console.error(`\n✗ Verificación del shell: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error('  • ' + p + '\n');
  process.exit(1);
}
console.log(`✓ Verificación del shell: detecta las ${CASOS.length - 1} formas de quedarse con una versión vieja, y no se queja de una producción al día`);
