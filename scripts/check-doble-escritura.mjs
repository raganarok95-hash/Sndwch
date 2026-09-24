#!/usr/bin/env node
// CHEQUEO DE DOBLE ESCRITURA — que ninguna tabla se escriba dos veces por la misma operación:
// una dentro de la RPC y otra después, desde el código.
//
// POR QUÉ EXISTE. El 2026-09-23 la auditoría encontró que cada regalo de crédito quedaba
// anotado DOS veces en `credit_ledger`: `gift_credit` ya escribía sus filas del libro dentro
// de la transacción, y `actCreditGift` las volvía a escribir al volver de la RPC. Lo mismo
// en la tarjeta de regalo. Nada fallaba: el saldo era correcto y el libro decía el doble.
// Peor, la segunda escritura iba FUERA de la transacción: si fallaba, el cliente veía un
// error con el saldo ya movido, y reintentar era regalar dos veces.
//
// Es el mismo patrón en tres sitios del repo, así que no es un descuido de una vez: pasa
// cuando la RPC se escribe (o se reescribe) en una migración y el código que la llama se
// escribió antes, o al revés, y nadie ve los dos lados a la vez. Esto los mira a la vez.
//
// Cómo (desde el 2026-09-24): le pregunta a la base. Levanta un Postgres local con la foto del
// esquema (`supabase/esquema-actual.sql`, al día por `check:pg`) y lee de `pg_proc` el cuerpo
// VIGENTE de cada función y en qué tablas inserta — también a través de otra función que llame
// (`vincular_pedido_de_invitado` escribe el historial por `aplicar_pedido_a_la_cuenta`). Antes
// reconstruía eso leyendo las migraciones con regex, y no veía las llamadas entre funciones.
// Después recorre cada función de supabase/functions/**: si llama a rpc("x") y además hace
// sbInsert("t") sobre una tabla t en la que x ya inserta, falla.
//
// Correr con: npm run check:doble-escritura   (dentro de `npm run verify`)
// Verificarlo con: npm run check:doble-escritura -- --probar  (le inyecta el defecto real)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { levantarPostgres } from './pg-local/postgres.mjs';
import { psql, cargarEsquema } from './pg-local/esquema.mjs';

const PROBAR = process.argv.includes('--probar');

// ── 1. Qué tablas escribe cada RPC, según su definición vigente en la base ──────────────
const cuerpos = new Map(); // función -> cuerpo
{
  const pg = levantarPostgres();
  if (!pg) {
    console.error('✗ No hay Postgres local (initdb) para leer pg_proc.');
    process.exit(1);
  }
  try {
    psql(pg.url, 'create database doble;');
    const url = pg.url.replace('/postgres?', '/doble?');
    cargarEsquema(url);
    // Un separador que no aparece en ningún cuerpo: cada función en su bloque.
    const salida = psql(url, `select '@@FN ' || p.proname || E'\n' || p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prolang <> 12;`);
    for (const bloque of salida.split('@@FN ').slice(1)) {
      const salto = bloque.indexOf('\n');
      const nombre = bloque.slice(0, salto).trim().toLowerCase();
      cuerpos.set(nombre, (cuerpos.get(nombre) || '') + bloque.slice(salto + 1));
    }
  } finally {
    pg.parar();
  }
  if (cuerpos.size < 20) {
    console.error(`✗ pg_proc devolvió solo ${cuerpos.size} funciones; ¿cargó el esquema?`);
    process.exit(1);
  }
}
const directas = new Map();
for (const [nombre, cuerpo] of cuerpos) {
  directas.set(nombre, new Set([...cuerpo.matchAll(/insert\s+into\s+(?:public\.)?(\w+)/gi)].map((t) => t[1].toLowerCase())));
}
// Lo que inserta una función incluye lo que insertan las funciones que llama (cierre transitivo).
const insertaEn = new Map();
function tablasDe(nombre, visto = new Set()) {
  if (insertaEn.has(nombre)) return insertaEn.get(nombre);
  if (visto.has(nombre)) return new Set();
  visto.add(nombre);
  const out = new Set(directas.get(nombre) || []);
  const cuerpo = cuerpos.get(nombre) || '';
  for (const otra of cuerpos.keys()) {
    if (otra !== nombre && new RegExp('\\b(?:public\\.)?' + otra + '\\s*\\(', 'i').test(cuerpo)) {
      for (const t of tablasDe(otra, visto)) out.add(t);
    }
  }
  insertaEn.set(nombre, out);
  return out;
}
for (const nombre of cuerpos.keys()) tablasDe(nombre);

// ── 2. Funciones del servidor: qué RPC llaman y en qué tablas insertan ─────────────────
function archivosTs(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...archivosTs(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

// Cuerpo exacto de cada función de nivel superior, emparejando llaves. Ignora llaves dentro
// de strings y comentarios de línea — suficiente para este código, y lo que importa es no
// mezclar dos funciones vecinas (el extractor aproximado de la auditoría daba falsos positivos
// justamente por eso).
// Posición de la `{` que abre el cuerpo, dado el `(` de los parámetros. Una `{` es parte del
// TIPO de retorno si viene dentro de `<…>`/`(…)`/`[…]`, o si abre un tipo literal (justo
// después de `:`, `|`, `&` o `=>`); si no, es el cuerpo.
function cuerpoDesde(src, abreParen) {
  let i = abreParen;
  for (let prof = 0; i < src.length; i++) {
    if (src[i] === '(') prof++;
    else if (src[i] === ')' && --prof === 0) break;
  }
  let prof = 0;
  let ultimo = '';
  for (i++; i < src.length; i++) {
    const c = src[i];
    if (/\s/.test(c)) continue;
    if (c === '{') {
      const abreTipo = ultimo === ':' || ultimo === '|' || ultimo === '&' || /=>\s*$/.test(src.slice(Math.max(0, i - 6), i));
      if (prof === 0 && !abreTipo) return i;
      prof++;
    } else if (c === '(' || c === '<' || c === '[') prof++;
    else if ((c === '}' || c === ')' || c === '>' || c === ']') && prof > 0) prof--;
    ultimo = c;
  }
  return -1;
}

function funciones(src) {
  const out = [];
  const re = /(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    // ⚠ EL CUERPO NO ES «LA PRIMERA LLAVE DESPUÉS DEL PRIMER PARÉNTESIS» (2026-09-24). Así se
    // hacía, y en una función con tipo de retorno de objeto —`): Promise<{ order: any }> {`— lo
    // que se tomaba como cuerpo era el TIPO: la función entera quedaba fuera del chequeo sin que
    // nada avisara. Pasaba con finalizeAndInsertOrder, la que crea los pedidos. Ahora se
    // emparejan los paréntesis de los parámetros y se salta el tipo de retorno.
    let i = cuerpoDesde(src, m.index + m[0].length - 1);
    if (i < 0) continue;
    let prof = 0;
    let ini = -1;
    let enStr = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (enStr) {
        if (c === '\\') { i++; continue; }
        if (c === enStr) enStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { enStr = c; continue; }
      if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
      if (c === '{') { if (prof === 0) ini = i; prof++; }
      else if (c === '}') { prof--; if (prof === 0) { out.push({ nombre: m[1], cuerpo: src.slice(ini, i + 1) }); break; } }
    }
  }
  return out;
}

const problemas = [];
function revisar(ruta, src) {
  for (const fn of funciones(src)) {
    // Solo comentarios de línea completa: un `//` a mitad de línea suele ser el de la marca
    // («SND//WCH») dentro de un texto, y cortar desde ahí escondería lo que sigue. Un
    // comentario al final de una línea de código queda — como mucho da un falso positivo.
    const sinComentarios = fn.cuerpo.replace(/^\s*\/\/[^\n]*/gm, '');
    const rpcs = [...sinComentarios.matchAll(/\brpc\(\s*["'](\w+)["']/g)].map((x) => x[1].toLowerCase());
    if (!rpcs.length) continue;
    const inserts = [...sinComentarios.matchAll(/\bsbInsert\(\s*["'](\w+)["']/g)].map((x) => x[1].toLowerCase());
    for (const r of rpcs) {
      const tablasRpc = insertaEn.get(r);
      if (!tablasRpc) continue;
      for (const t of inserts) {
        if (tablasRpc.has(t)) {
          problemas.push(`${ruta} · ${fn.nombre}: llama a ${r}(), que YA inserta en ${t}, y además inserta en ${t} él mismo — cada operación queda anotada dos veces.`);
        }
      }
    }
  }
}

const RAIZ = 'supabase/functions';
if (PROBAR) {
  // El defecto real, tal como estaba antes del arreglo.
  const falso = `
export async function actCreditGift(b: any) {
  await rpc("gift_credit", { p_from: s.phone, p_to: toPhone, p_amount: amount });
  await Promise.all([
    sbInsert("credit_ledger", { customer_phone: s.phone, delta: -amount, reason: "Regalo enviado" }),
  ]);
}`;
  revisar('(inyectado)', falso);
  if (!problemas.length) {
    console.error('✗ --probar: el chequeo NO detectó el defecto que dice cazar. No sirve.');
    process.exit(1);
  }
  console.log('✓ --probar: detecta la doble escritura inyectada:\n  • ' + problemas[0]);
  process.exit(0);
}

for (const f of archivosTs(RAIZ)) revisar(f, readFileSync(f, 'utf8'));

const conInserts = [...insertaEn.values()].filter((s) => s.size).length;
if (problemas.length) {
  console.error(`\n✗ Doble escritura: ${problemas.length} caso(s)\n`);
  for (const p of problemas) console.error('  • ' + p);
  console.error('\nQue escriba UNO: preferiblemente la RPC, que lo hace dentro de la transacción.');
  process.exit(1);
}
console.log(`✓ Doble escritura: ninguna función escribe una tabla que su RPC ya escribe (${conInserts} RPC que insertan, revisadas contra ${RAIZ}).`);
