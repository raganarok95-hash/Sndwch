#!/usr/bin/env node
// ¿EL CONTRATO DECLARA TODO LO QUE LA ACCIÓN LEE? (2026-10-01)
//
// La frontera (api/entrada.ts) le pasa a una acción con contrato SOLO los campos declarados:
// lo demás se descarta, a propósito. El reverso es un defecto mudo: si la acción lee `b.email`
// y el contrato no lo declara, `b.email` llega vacío para siempre y nada revienta — el correo
// simplemente deja de llegar. Migrar 147 acciones al contrato sin esto es sembrar ese defecto.
//
// Para cada acción con contrato: junta los `b.campo` que lee su manejador y falla si alguno no
// está en el contrato. Y si el manejador le pasa `b` ENTERO a otra función, falla también: ahí
// el chequeo no ve qué campos se leen. Se resuelve desarmando (`f(b.x, b.y)`) o anotando
// `// contrato-campos: b pasa entero a f(), que lee x, y` con los campos que lee, que deben
// estar declarados.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const contrato = readFileSync('supabase/functions/_shared/contrato.ts', 'utf8');
const idx = readFileSync('supabase/functions/api/index.ts', 'utf8');
const fuentes = readdirSync('supabase/functions/api/actions').filter((f) => f.endsWith('.ts'))
  .map((f) => readFileSync(join('supabase/functions/api/actions', f), 'utf8')).join('\n');

// Campos declarados por acción: el bloque `'accion': accion<...>()( e.objeto({ ... }) )`.
const declarados = {};
const re = /^\s*'([a-z0-9-]+)':\s*accion</gm;
let m; const inicios = [];
while ((m = re.exec(contrato))) inicios.push([m[1], m.index]);
// Grupos de campos compartidos (`const CAMPOS_X = { ... }`), que un contrato usa entero
// (`e.objeto(CAMPOS_X)`) o esparcido (`...CAMPOS_X`).
const grupos = {};
const sinParentesis = (t) => { let p; do { p = t; t = t.replace(/\([^()]*\)/g, ''); } while (t !== p); return t; };
for (const g of contrato.matchAll(/^const (CAMPOS_[A-Z_]+) = \{([\s\S]*?)\};$/gm))
  grupos[g[1]] = [...sinParentesis(g[2].replace(/\/\/[^\n]*/g, '')).matchAll(/(?:^|[{,\s])([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=[:,}]|$)/gm)].map((x) => x[1]);
inicios.forEach(([a, i], k) => {
  const fin = k + 1 < inicios.length ? inicios[k + 1][1] : contrato.length;
  const bloque = contrato.slice(i, fin);
  const obj = bloque.slice(bloque.indexOf('e.objeto('));
  declarados[a] = new Set([...obj.matchAll(/(?:^|[{,\s])([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=[:,}\n])/g)].map((x) => x[1]));
  for (const g of obj.matchAll(/\b(CAMPOS_[A-Z_]+)\b/g)) for (const c of grupos[g[1]] || []) declarados[a].add(c);
});

const manejador = Object.fromEntries([...idx.matchAll(/^\s*"([a-z0-9-]+)":\s*(act\w+)/gm)].map((x) => [x[1], x[2]]));
function cuerpo(fn) {
  const i = fuentes.search(new RegExp(`export async function ${fn}\\b`));
  if (i < 0) return null;
  let j = fuentes.indexOf('{', fuentes.indexOf(')', i)), prof = 0;
  for (let k = j; k < fuentes.length; k++) {
    if (fuentes[k] === '{') prof++;
    else if (fuentes[k] === '}' && --prof === 0) return fuentes.slice(i, k + 1);
  }
  return null;
}

const malos = [];
for (const a of Object.keys(declarados)) {
  const fn = manejador[a];
  let c = fn && cuerpo(fn);
  if (!c) { malos.push(`${a}: no encontré el manejador ${fn || '(sin registrar)'}`); continue; }
  // Una flecha que declara su PROPIO `b` (`.sort((a, b) => b.x - a.x)`) no lee la entrada.
  c = c.replace(/\(\s*\w+\s*,\s*b\s*\)\s*=>[^\n]*/g, '');
  const anotados = new Set([...c.matchAll(/contrato-campos:[^\n]*lee ([a-zA-Z0-9_, ]+)/g)].flatMap((x) => x[1].split(/[ ,]+/).filter(Boolean)));
  const leidos = new Set([...c.matchAll(/\bb\??\.([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((x) => x[1]).concat([...anotados]));
  for (const campo of leidos) if (campo !== '_ip' && !declarados[a].has(campo)) malos.push(`${a}: lee b.${campo} y el contrato no lo declara (llegaría vacío)`);
  const sinCuerpo = c.replace(/\/\/[^\n]*/g, '');
  if (/\(\s*b\s*(?:[,)]|\|\|)|,\s*b\s*\)/.test(sinCuerpo.replace(/^export async function \w+\(b[^)]*\)/, '')) && !anotados.size)
    malos.push(`${a}: pasa \`b\` entero a otra función; desármalo o anota «contrato-campos: … lee x, y»`);
}
if (malos.length) { console.error('✗ check:contrato-campos\n  ' + malos.join('\n  ')); process.exit(1); }
console.log(`✓ check:contrato-campos — las ${Object.keys(declarados).length} acciones con contrato declaran todo lo que leen`);
