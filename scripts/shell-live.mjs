// SND//WCH — scripts/shell-live
// Comprueba que el shell que sirve producción es el que hay en este repo.
//
// POR QUÉ EXISTE (automatización #90). El backend ya tiene su prueba de humo después del
// deploy (`smoke-prod.mjs`); el CLIENTE no tenía ninguna. Y el cliente es la mitad que ya
// falló de verdad: el 2026-08-21 un shell viejo se quedó pegado a la vez en la app
// instalada, en el navegador del celular y en el de la PC, y nadie se enteró por una
// alarma — se enteró porque alguien reportó que ARMA EL TUYO no funcionaba.
//
// Ese modo de fallo NO produce ningún error. Todo responde 200, el deploy dice éxito, y lo
// que se sirve es la versión anterior. Por eso no alcanza con mirar el código de estado:
// hay que comparar CONTENIDO contra lo que este repo acaba de construir.
//
// Compara dos cosas, que son dos fallos distintos:
//   1. El sello `APP_BUILD` de index.html — hash del JS compilado (ver scripts/build.mjs).
//      Si producción sirve otro, el deploy del cliente no llegó (o llegó a medias).
//   2. La `VERSION` de sw.js — la palanca que invalida la caché en todos los dispositivos.
//      Un index.html nuevo servido por un service worker viejo es exactamente el caso del
//      2026-08-21: el navegador tiene el archivo nuevo disponible y sigue sirviendo el de
//      la caché.
//
// REINTENTA CON ESPERA, y eso no es cortesía: el deploy del cliente lo hace Vercel de forma
// asíncrona tras el push, así que preguntar una sola vez al segundo siguiente mediría la
// carrera y no el resultado. Sin la espera, este chequeo fallaría casi siempre por una razón
// que no es la que vigila — y un chequeo que falla en falso se apaga a la semana.
//
// NO NECESITA NINGÚN SECRET: pide los mismos dos archivos públicos que pide un cliente.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.SHELL_URL || 'https://sndwch.app').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.SHELL_TIMEOUT_MS || 15000);
// Vercel suele publicar en menos de un minuto; el techo alto es para no fallar en falso un
// día de cola. Cada intento espera el doble que el anterior, hasta 60 s.
const MAX_ESPERA_MS = Number(process.env.SHELL_MAX_WAIT_MS || 300000);

export function appBuildStamp(html) {
  const m = /var\s+APP_BUILD\s*=\s*'([^']*)'/.exec(String(html || ''));
  return m ? m[1] : null;
}

export function swVersion(js) {
  const m = /const\s+VERSION\s*=\s*'([^']*)'/.exec(String(js || ''));
  return m ? m[1] : null;
}

// Lo que este repo construyó. Si el marcador no está, algo se rompió ANTES de comparar y
// decirlo es más útil que comparar contra `null` y dar un diagnóstico equivocado.
export function esperado(root = ROOT) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  return { build: appBuildStamp(html), version: swVersion(sw) };
}

async function pedir(url) {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // no-store: sin esto, el propio caché de la petición podría contestar con la copia
    // vieja y este chequeo diría "producción está desactualizada" o —peor— "está al día"
    // sin haber preguntado a producción.
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
    return { status: res.status, texto: await res.text() };
  } finally {
    clearTimeout(reloj);
  }
}

async function revisarUnaVez(quiero) {
  const problemas = [];
  const notas = [];

  const idx = await pedir(`${BASE}/index.html`);
  if (idx.status !== 200) {
    problemas.push(`index.html devolvió ${idx.status}: la app no está sirviendo.`);
  } else {
    const vivo = appBuildStamp(idx.texto);
    if (!vivo) {
      problemas.push('index.html de producción no tiene el sello APP_BUILD: no se puede saber qué versión está sirviendo.');
    } else if (vivo !== quiero.build) {
      problemas.push(`producción sirve el shell ${vivo} y este repo construyó ${quiero.build}: el deploy del cliente no llegó.`);
    } else {
      notas.push(`index.html: shell ${vivo} (el que construyó este repo)`);
    }
  }

  const sw = await pedir(`${BASE}/sw.js`);
  if (sw.status !== 200) {
    // Sin service worker la app sigue abriendo; lo que se pierde es el arranque offline y
    // el aviso de versión nueva. Es un problema, no una caída.
    problemas.push(`sw.js devolvió ${sw.status}: la app quedaría sin caché de shell ni aviso de versión nueva.`);
  } else {
    const vivo = swVersion(sw.texto);
    if (!vivo) {
      problemas.push('sw.js de producción no declara VERSION: la palanca para invalidar la caché en todos los dispositivos dejó de existir.');
    } else if (vivo !== quiero.version) {
      problemas.push(`producción sirve el service worker ${vivo} y este repo tiene ${quiero.version}: el shell viejo puede seguir pegado en los dispositivos.`);
    } else {
      notas.push(`sw.js: versión ${vivo}`);
    }
  }
  return { problemas, notas };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const quiero = esperado();
  if (!quiero.build) {
    console.error('✗ index.html de este repo no tiene el sello APP_BUILD. Corre `npm run build` antes de comparar.');
    process.exit(1);
  }
  if (!quiero.version) {
    console.error('✗ sw.js de este repo no declara VERSION: no hay contra qué comparar.');
    process.exit(1);
  }

  let espera = 5000;
  let gastado = 0;
  let ultimo = await revisarUnaVez(quiero);
  while (ultimo.problemas.length && gastado < MAX_ESPERA_MS) {
    console.log(`  · todavía no coincide (${ultimo.problemas[0]}). Reintento en ${Math.round(espera / 1000)} s…`);
    await new Promise((r) => setTimeout(r, espera));
    gastado += espera;
    espera = Math.min(espera * 2, 60000);
    ultimo = await revisarUnaVez(quiero);
  }

  for (const n of ultimo.notas) console.log('  · ' + n);
  if (ultimo.problemas.length) {
    console.error(`\n✗ El shell de producción NO es el de este repo (tras ${Math.round(gastado / 1000)} s de espera)\n`);
    for (const p of ultimo.problemas) console.error('  • ' + p);
    process.exit(1);
  }
  console.log('\n✓ Producción sirve el mismo shell y el mismo service worker que este repo.');
}
