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
// Cómo: lee la ÚLTIMA definición de cada función desde supabase/migrations (en orden de
// versión, como check-rpc) y anota en qué tablas inserta. Después recorre cada función de
// supabase/functions/**: si llama a rpc("x") y además hace sbInsert("t") sobre una tabla t
// en la que x ya inserta, falla.
//
// Correr con: npm run check:doble-escritura   (dentro de `npm run verify`)
// Verificarlo con: npm run check:doble-escritura -- --probar  (le inyecta el defecto real)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROBAR = process.argv.includes('--probar');

// ── 1. Qué tablas escribe cada RPC, según su última definición ──────────────────────────
const MIG = 'supabase/migrations';
const insertaEn = new Map(); // función -> Set(tablas)
for (const f of readdirSync(MIG).filter((x) => x.endsWith('.sql')).sort()) {
  const sql = readFileSync(join(MIG, f), 'utf8');
  const re = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql))) {
    const nombre = m[1].toLowerCase();
    // El cuerpo va entre los dos $tag$ que siguen a la firma.
    const resto = sql.slice(m.index);
    const tag = resto.match(/\$(\w*)\$/);
    if (!tag) continue;
    const ini = resto.indexOf(tag[0]) + tag[0].length;
    const fin = resto.indexOf(tag[0], ini);
    if (fin < 0) continue;
    const cuerpo = resto.slice(ini, fin);
    const tablas = new Set();
    for (const t of cuerpo.matchAll(/insert\s+into\s+(?:public\.)?(\w+)/gi)) tablas.add(t[1].toLowerCase());
    insertaEn.set(nombre, tablas); // la última definición manda
  }
  for (const d of sql.matchAll(/drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?(\w+)/gi)) {
    // Un drop seguido de un create en la misma migración se resuelve solo: el create vuelve
    // a anotar la función al procesarse (va después en el texto solo si se escribió así).
    if (!new RegExp(`create\\s+(?:or\\s+replace\\s+)?function\\s+(?:public\\.)?${d[1]}\\s*\\(`, 'i').test(sql)) {
      insertaEn.delete(d[1].toLowerCase());
    }
  }
}

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
function funciones(src) {
  const out = [];
  const re = /(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = src.indexOf('{', src.indexOf(')', m.index));
    // saltar el tipo de retorno: la primera llave después del paréntesis de la firma
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
