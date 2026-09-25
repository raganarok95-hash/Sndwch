#!/usr/bin/env node
// check:pruebas-sin-codigos — ninguna prueba nombra un producto de la carta (2026-09-25).
//
// POR QUÉ EXISTE. El 2026-09-24 la carta v4 retiró The Original, The Smoke y The Teriyaki, y
// 29 pruebas del backend reventaron sin que ninguna regla de dinero hubiera cambiado. Peor fue
// lo que NO reventó: la prueba de contraste siguió midiendo la ficha de un Signature que ya no
// existe, y la del recibo armaba un carrito con uno retirado. Una prueba atada a un producto
// concreto prueba ese producto, no la regla — y el día que el producto sale, o se cae sin
// motivo o sigue verde mirando otra cosa.
//
// La regla: una prueba pide «un Signature vigente», «un pan con recargo», «la recompensa que
// regala una bebida» a `tests/carta.ts` o `tests-api/carta.ts`, que se lo preguntan a la carta.
// Un código INVENTADO a propósito para probar un caso que la carta no tiene (un pan que no
// existe, una proteína nueva) usa la serie 9x —P99, B99, SIG99— y ese sí se permite.
//
// Mira el código, no los comentarios: el relato de por qué existe una prueba puede nombrar el
// producto que la originó.
//
// `--probar` le inyecta los casos que dice cazar y falla si alguno pasa.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;
const CARPETAS = ['tests', 'tests-api', 'tests-e2e'];
const PERMITIDOS = new Set(['tests/carta.ts', 'tests-api/carta.ts']);

// Un código de la carta: prefijo de sección + dos dígitos que no empiezan en 9. Sin letra ni
// dígito pegado a los lados (así no confunde «2026-09-10T18:00», «ORD-TEST01» ni «p15»).
const CODIGO = /(?<![0-9A-Za-z_-])(SIG|P|D|R|T|S|B|C)[0-8][0-9](?![0-9:A-Za-z_])/g;

/** Quita los comentarios // y /* *\/ sin comerse un // que esté dentro de una cadena
 *  (la marca se escribe SND//WCH y una URL lleva //). */
export function sinComentarios(src) {
  let out = '', i = 0, cadena = null;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (cadena) {
      out += c;
      if (c === '\\') { out += d ?? ''; i += 2; continue; }
      if (c === cadena) cadena = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { cadena = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const f = src.indexOf('*/', i + 2); i = f < 0 ? src.length : f + 2; continue; }
    out += c; i++;
  }
  return out;
}

export function hallazgos(nombre, src) {
  const res = [];
  sinComentarios(src).split('\n').forEach((linea, n) => {
    for (const m of linea.matchAll(CODIGO)) res.push(`${nombre}:${n + 1}: «${m[0]}» en ${linea.trim().slice(0, 110)}`);
  });
  return res;
}

function archivos() {
  const out = [];
  for (const dir of CARPETAS) {
    let lista = [];
    try { lista = readdirSync(join(RAIZ, dir)); } catch { continue; }
    for (const f of lista) {
      if (!/\.(ts|mjs|js)$/.test(f)) continue;
      const rel = `${dir}/${f}`;
      if (!PERMITIDOS.has(rel)) out.push(rel);
    }
  }
  return out;
}

function correr() {
  const todos = [];
  const lista = archivos();
  for (const rel of lista) todos.push(...hallazgos(rel, readFileSync(join(RAIZ, rel), 'utf8')));
  return { todos, n: lista.length };
}

function probar() {
  const casos = [
    ['un Signature escrito en un dato simulado', "const x = { sigId: 'SIG04' };", true],
    ['una recompensa como llave de objeto', 'REWARDS.R05.pts = 1;', true],
    ['un código escapado dentro de un selector', `page.locator('[onclick*="\\'T01\\'"]');`, true],
    ['un código dentro de un texto esperado', "page.locator('text=/P04 · RINDE/');", true],
    ['un código en el nombre de una prueba', "test('el 15CM gratis (R06) perdona el pan', () => {});", true],
    ['un código inventado de la serie 9x', "const x = { base: 'B99', prot: 'P99' };", false],
    ['un código dentro de un comentario', '// la res (P01) salió del armador', false],
    ['una fecha ISO', "const t = '2026-09-10T18:00:00Z';", false],
    ['una referencia de pedido', "const ref = 'ORD-TEST01-AAAA';", false],
    ['la marca, que lleva // dentro de una cadena', "const m = 'SND//WCH'; const y = 'P04';", true],
  ];
  const malos = [];
  for (const [nombre, src, debe] of casos) {
    const visto = hallazgos('caso', src).length > 0;
    console.log(`  ${visto === debe ? '✓' : '✗'} ${nombre}${debe ? '' : ' (no debe señalarse)'}`);
    if (visto !== debe) malos.push(nombre);
  }
  return malos;
}

if (process.argv.includes('--probar')) {
  console.log('\n  Inyectando los casos que este chequeo dice cazar:\n');
  const malos = probar();
  if (malos.length) { console.log(`\n  ✗ ${malos.length} caso(s) mal resueltos.\n`); process.exit(1); }
  console.log('\n  OK — cada caso se resolvió como debía.\n');
  process.exit(0);
}

const { todos, n } = correr();
if (todos.length) {
  console.log('\n  ✗ Pruebas que nombran un producto de la carta en vez de preguntarlo:\n');
  for (const h of todos) console.log('    ' + h);
  console.log('\n  Pídelo a tests/carta.ts o tests-api/carta.ts (un Signature vigente, un pan con recargo,');
  console.log('  la recompensa de tipo «bebida»…). Un código inventado a propósito usa la serie 9x.\n');
  process.exit(1);
}
console.log(`\n  ✓ Ninguna de las ${n} pruebas nombra un producto de la carta.\n`);
