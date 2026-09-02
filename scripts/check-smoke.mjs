// SND//WCH — scripts/check-smoke
// Comprueba que la prueba de humo de producción (`scripts/smoke-prod.mjs`) de verdad se
// da cuenta cuando producción está rota.
//
// POR QUÉ EXISTE. Un chequeo de salud que siempre pasa es peor que no tener ninguno: da
// una señal de "todo bien" que nadie vuelve a mirar. Y es el error fácil de cometer acá,
// porque el camino feliz se prueba solo cada vez que el deploy sale bien — el que nunca se
// ejerce es el camino roto. Así que en vez de confiar, se le sirven al script respuestas
// deliberadamente averiadas y se exige que las señale, una por una.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Producción sana, tal como responde hoy.
const SANO = {
  ping: { status: 200, cuerpo: { ok: true, checks: { db: true, sessionSecret: true, culqiKey: true, resendKey: true, vapidKey: true, googleClientId: true } } },
  'get-catalog': {
    status: 200,
    cuerpo: {
      sigItems: {
        SIG01: { n: 'The Original', p15: 20.9, p30: 26.9, active: true },
        SIG07: { n: 'The Chicago', p15: 22, p30: 29.9, active: false },
      },
      proteins: { P01: { p15: 13.9, p30: 18.9 } },
      sides: { D06: 6 },
      rewardPts: { R06: 400 },
    },
  },
  'get-store-hours': { status: 200, cuerpo: { hours: Array.from({ length: 7 }, (_, i) => ({ open: 12, close: 21, closed: i === 1 })) } },
  __desconocida: { status: 400, cuerpo: { error: 'unknown action' } },
};

// Cada caso rompe UNA cosa y nombra el trozo del mensaje que el script tiene que emitir.
const CASOS = [
  ['sano', (r) => r, null],
  ['la base no responde', (r) => ({ ...r, ping: { status: 200, cuerpo: { ok: false, checks: { db: false, sessionSecret: true } } } }), 'la base NO responde'],
  ['falta SESSION_SECRET', (r) => ({ ...r, ping: { status: 200, cuerpo: { ok: false, checks: { db: true, sessionSecret: false } } } }), 'falta SESSION_SECRET'],
  ['la función devuelve 500', (r) => ({ ...r, ping: { status: 500, cuerpo: { error: 'boom' } } }), 'ping devolvió 500'],
  ['catálogo sin Signatures activos', (r) => ({ ...r, 'get-catalog': { status: 200, cuerpo: { ...r['get-catalog'].cuerpo, sigItems: { SIG01: { n: 'x', p15: 1, p30: 2, active: false } } } } }), 'sin menú'],
  [
    'un Signature con precio 0',
    (r) => ({ ...r, 'get-catalog': { status: 200, cuerpo: { ...r['get-catalog'].cuerpo, sigItems: { SIG01: { n: 'The Original', p15: 0, p30: 26.9, active: true } } } } }),
    'precio de 15CM inválido',
  ],
  [
    'el 30CM más barato que el 15CM',
    (r) => ({ ...r, 'get-catalog': { status: 200, cuerpo: { ...r['get-catalog'].cuerpo, sigItems: { SIG01: { n: 'The Original', p15: 26.9, p30: 20.9, active: true } } } } }),
    'cuesta menos que el 15CM',
  ],
  ['catálogo sin proteínas', (r) => ({ ...r, 'get-catalog': { status: 200, cuerpo: { ...r['get-catalog'].cuerpo, proteins: {} } } }), 'no devolvió proteínas'],
  ['recompensas sin puntos', (r) => ({ ...r, 'get-catalog': { status: 200, cuerpo: { ...r['get-catalog'].cuerpo, rewardPts: {} } } }), 'programa de fidelidad'],
  ['horario incompleto', (r) => ({ ...r, 'get-store-hours': { status: 200, cuerpo: { hours: [{ open: 12, close: 21, closed: false }] } } }), '1 días en vez de 7'],
  [
    'cerrado los 7 días',
    (r) => ({ ...r, 'get-store-hours': { status: 200, cuerpo: { hours: Array.from({ length: 7 }, () => ({ open: null, close: null, closed: true })) } } }),
    'cerrada los 7 días',
  ],
  ['una acción inexistente responde 200', (r) => ({ ...r, __desconocida: { status: 200, cuerpo: { ok: true } } }), 'no está rechazando nada'],
  ['una acción inexistente revienta con 500', (r) => ({ ...r, __desconocida: { status: 500, cuerpo: { error: 'boom' } } }), 'manejo de errores está roto'],
];

function servidor(respuestas) {
  return createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      const accion = JSON.parse(cuerpo).action;
      const r = respuestas[accion] || respuestas.__desconocida;
      res.writeHead(r.status, { 'Content-Type': 'application/json' }).end(JSON.stringify(r.cuerpo));
    });
  });
}

function correrHumo(url) {
  return new Promise((res) => {
    const hijo = spawn(process.execPath, [join(ROOT, 'scripts/smoke-prod.mjs')], { env: { ...process.env, SMOKE_URL: url } });
    let texto = '';
    hijo.stdout.on('data', (d) => (texto += d));
    hijo.stderr.on('data', (d) => (texto += d));
    hijo.on('close', (code) => res({ code, texto }));
  });
}

const problemas = [];
for (const [nombre, romper, esperado] of CASOS) {
  const srv = servidor(romper(structuredClone(SANO)));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const { code, texto } = await correrHumo(`http://127.0.0.1:${srv.address().port}`);
  srv.close();

  if (esperado === null) {
    if (code !== 0) problemas.push(`Con producción SANA la prueba de humo falló:\n      ${texto.trim().split('\n').join('\n      ')}`);
  } else if (code === 0) {
    problemas.push(`«${nombre}»: la prueba de humo dio VERDE sobre una producción rota.`);
  } else if (!texto.includes(esperado)) {
    problemas.push(`«${nombre}»: falló, pero sin decir por qué (se esperaba «${esperado}»):\n      ${texto.trim().split('\n').join('\n      ')}`);
  }
}

if (problemas.length) {
  console.error(`\n✗ Prueba de humo: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error('  • ' + p + '\n');
  process.exit(1);
}
console.log(`✓ Prueba de humo: detecta las ${CASOS.length - 1} formas de romperse que vigila, y no se queja de una producción sana`);
