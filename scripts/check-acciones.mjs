#!/usr/bin/env node
// CHEQUEO DE ACCIONES — que ninguna quede escrita y muerta, ni registrada e inalcanzable.
//
// POR QUÉ EXISTE. Este repo ya pagó el defecto entero: `actAdminRetentionReport` —el reporte
// de cohortes, "el mejor dato del panel"— estaba IMPORTADO y nunca REGISTRADO en `ACTIONS`.
// La app no podía abrirlo y nadie se enteró, porque:
//   · `deno check` no marca un import que sí se usa dentro de un objeto;
//   · el typecheck del cliente no sabe qué acciones existen en el servidor;
//   · y nada revienta — la pantalla simplemente no está.
// Registrar una acción es un paso APARTE de importarla, y hasta hoy nada avisaba si faltaba.
//
// Cubre los dos sentidos, que son dos defectos distintos:
//   1. Exportada y no registrada  → código que no se puede ejecutar (el caso real de arriba).
//   2. Registrada y sin llamador  → superficie de API viva que nadie usa; cada una es una
//      puerta más que mantener, revisar y proteger, por nada.
//
// NO se mide contra sí mismo: las dos listas salen de archivos distintos y de lados distintos
// del sistema (el servidor declara, el cliente y los crons consumen).
//
// Correr con: npm run check:acciones   (dentro de `npm run verify`)

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR_ACCIONES = 'supabase/functions/api/actions';
const ENTRYPOINT = 'supabase/functions/api/index.ts';

const leer = (p) => readFileSync(p, 'utf8');
const archivos = (dir, ext) => readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));
// La base nueva (src/nuevo) tiene carpetas: se recorre entera.
const archivosEnArbol = (dir, ext) =>
  readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(ext)).map((f) => join(dir, f));

// ── 1. Lo que el servidor EXPORTA, con el cuerpo de cada función ──────────────────────────
// El cuerpo hace falta para reconocer un cron sin lista escrita a mano: una acción que llama a
// `verifyCronSecret` la dispara pg_cron por HTTP, así que no aparece llamada en ningún código.
// Detectarlo por estructura y no por nombre evita que la lista se desactualice en silencio.
const cuerpoDe = new Map();
const archivoDe = new Map();
for (const f of archivos(DIR_ACCIONES, '.ts')) {
  const src = leer(f);
  const re = /export\s+(?:async\s+)?function\s+(act\w+)/g;
  const marcas = [];
  let m;
  while ((m = re.exec(src)) !== null) marcas.push({ nombre: m[1], i: m.index });
  marcas.forEach((mk, k) => {
    cuerpoDe.set(mk.nombre, src.slice(mk.i, k + 1 < marcas.length ? marcas[k + 1].i : src.length));
    archivoDe.set(mk.nombre, f);
  });
}

// ── 2. Lo que el servidor REGISTRA ────────────────────────────────────────────────────────
// Las claves conviven entrecomilladas (`"admin-cac-brake"`) y sin comillas (`ping:`): las dos
// formas son válidas en un objeto de TS y las dos están en uso hoy. Una expresión que solo
// reconociera una dejaría fuera un bloque entero sin decirlo.
const idx = leer(ENTRYPOINT);
const ini = idx.indexOf('const ACTIONS');
if (ini < 0) { console.error('✗ No encontré la tabla ACTIONS en ' + ENTRYPOINT); process.exit(1); }
const fin = idx.indexOf('\n};', ini);
const tabla = idx.slice(ini, fin);
const registradas = new Map();
for (const m of tabla.matchAll(/"?([a-z0-9][a-z0-9-]*)"?\s*:\s*(act\w+)/g)) registradas.set(m[1], m[2]);

// ── 3. Quién las LLAMA ────────────────────────────────────────────────────────────────────
// El cliente (`api('x')`), el botón de exportar CSV (`exportCsv('x')`, que no pasa por `api`),
// y los scripts que golpean producción (`llamar('ping')` en la prueba de humo). Tres
// consumidores reales y ningún nombre escrito a mano acá.
//
// ⚠ La comilla puede venir ESCAPADA: los botones del panel se arman como texto dentro de un
// atributo `onclick="..."`, así que en el fuente se lee `exportCsv(\'export-orders\'`. Sin
// contemplarlo, las dos exportaciones a CSV salían marcadas como muertas — un falso positivo
// que habría hecho borrar código vivo o, peor, apagar el chequeo entero.
const consumidores = [
  ...archivos('src/app', '.ts'),
  ...archivosEnArbol('src/nuevo', '.ts'),
  ...archivos('scripts', '.mjs').filter((f) => !f.endsWith('check-acciones.mjs')),
].map(leer).join('\n');
const llamadas = new Set();
// En la base nueva la llamada lleva el tipo de la respuesta: `legado.api<RespuestaLista>('x'`.
for (const m of consumidores.matchAll(/(?:api|exportCsv|llamar)(?:<[^>()]*>)?\(\s*\\?['"]([a-z0-9][a-z0-9-]*)\\?['"]/g)) llamadas.add(m[1]);

// ── Veredictos ────────────────────────────────────────────────────────────────────────────
const errores = [];

const usadasEnTabla = new Set(registradas.values());
for (const [nombre, f] of archivoDe) {
  if (!usadasEnTabla.has(nombre)) {
    errores.push(`${nombre} (${f}) está exportada pero NO registrada en ACTIONS — nadie puede llamarla.`);
  }
}

for (const [accion, fn] of registradas) {
  if (!cuerpoDe.has(fn)) {
    errores.push(`"${accion}" apunta a ${fn}, que no existe como función exportada en ${DIR_ACCIONES}/.`);
    continue;
  }
  if (llamadas.has(accion)) continue;
  if (/verifyCronSecret/.test(cuerpoDe.get(fn))) continue; // la dispara pg_cron por HTTP
  errores.push(`"${accion}" (${fn}) está registrada pero nadie la llama: ni el cliente, ni un script, ni un cron.`);
}

if (errores.length) {
  console.error('✗ Acciones del backend:\n');
  for (const e of errores) console.error('  · ' + e);
  console.error('\n  Registrar una acción es un paso APARTE de importarla, y nada más avisa si falta.');
  console.error('  Si una acción es alcanzable por una vía que este chequeo no conoce, agrégala acá');
  console.error('  como consumidor real — nunca como excepción por nombre.');
  process.exit(1);
}

const crones = [...registradas.values()].filter((fn) => /verifyCronSecret/.test(cuerpoDe.get(fn) || '')).length;
console.log(
  `✓ Acciones: ${registradas.size} registradas, todas alcanzables ` +
  `(${llamadas.size} desde el cliente o scripts, ${crones} por cron) y ninguna exportada sin registrar`,
);
