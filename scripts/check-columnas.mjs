// SND//WCH — scripts/check-columnas
// Que TODA columna que el servidor nombra en una consulta a PostgREST exista en la base real.
//
// POR QUÉ EXISTE. La clase de defecto más cara de este repo es una consulta a una columna que no
// existe: `assertHourCapacity` pedía `scheduled_for`, el error se lo tragaba un catch, y el tope
// de pedidos por hora no se aplicó desde el primer día. `leer()` (db.ts) lo impide en el código
// nuevo porque tipa las columnas, pero hay decenas de `sbGet("tabla", "select=a,b&c=eq.x")`
// escritos como texto. Y el paso 6 iba a quitar cuatro columnas de `orders` que cuatro de esas
// consultas todavía pedían: el panel se habría roto en producción sin que nada avisara.
//
// Qué mira: los `sbGet/sbUpdate/sbDelete("tabla", "...")` de supabase/functions, y dentro del
// texto de la consulta, las columnas del `select=`, de los filtros (`col=eq.`, `col=in.`…) y del
// `order=`. Las compara con las tablas de supabase/esquema-actual.sql (la foto de la base real).
// Lo que se arma dinámicamente (`${...}`) se ignora: no se puede saber qué va a ser.
//
// Correr con: npm run check:columnas   (dentro de `npm run verify`)
// `-- --probar` inyecta una consulta a una columna inexistente y exige que se detecte.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const esquema = readFileSync('supabase/esquema-actual.sql', 'utf8');
const columnas = new Map();
for (const m of esquema.matchAll(/^create table public\.(\w+) \(\n([\s\S]*?)\n\);/gm)) {
  columnas.set(m[1], new Set(m[2].split('\n').map((l) => /^\s+"?(\w+)"?\s/.exec(l)?.[1]).filter(Boolean)));
}

function archivos(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const OPS = 'eq|neq|gt|gte|lt|lte|in|is|not|like|ilike|cs|cd|ov|fts|plfts|phfts|wfts';

// El texto de la consulta es el SEGUNDO argumento entero, no el primer literal: hay consultas
// con comentarios entre la tabla y la consulta, y consultas armadas en partes con `+`. La primera
// versión leía solo el literal pegado a la tabla y se le escapaban tres de las cuatro consultas
// que el paso 6 iba a romper (visto simulando el borrado de las columnas en la foto).
function segundoArgumento(src, desde) {
  let i = desde, prof = 0, texto = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') { texto += src[j + 1]; j += 2; continue; }
        if (c === '`' && src[j] === '$' && src[j + 1] === '{') {
          let d = 1; j += 2;
          while (j < src.length && d > 0) { if (src[j] === '{') d++; else if (src[j] === '}') d--; j++; }
          texto += '§';
          continue;
        }
        texto += src[j];
        j++;
      }
      i = j + 1;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') { if (prof === 0) break; prof--; }
    else if (c === ',' && prof === 0) break;
    else if (/[A-Za-z_]/.test(c) && prof === 0) {
      // Una variable en la consulta (no un literal): lo que aporte es desconocido.
      const m = /^[\w.]+/.exec(src.slice(i));
      texto += '§';
      i += m ? m[0].length : 1;
      continue;
    }
    i++;
  }
  return texto;
}

export function revisar(ruta, src) {
  const problemas = [];
  const re = /\b(sbGet|sbUpdate|sbDelete)\(\s*["'](\w+)["']\s*,/g;
  for (const m of src.matchAll(re)) {
    const tabla = m[2];
    const cols = columnas.get(tabla);
    const linea = src.slice(0, m.index).split('\n').length;
    if (!cols) {
      problemas.push(`${ruta}:${linea} · la tabla «${tabla}» no existe en la base`);
      continue;
    }
    // Lo dinámico se reemplaza por un marcador que no parece columna.
    const q = segundoArgumento(src, m.index + m[0].length);
    const nombradas = new Set();
    for (const part of q.split('&')) {
      const [clave, valor = ''] = part.split(/=(.*)/s);
      if (clave === 'select') {
        // Sin embebidos (`rel(col)`) ni agregados: solo columnas propias, con alias y casts fuera.
        for (const c of valor.replace(/\w+\([^)]*\)/g, '').split(',')) {
          const nombre = c.trim().split('::')[0].split(':').pop().trim();
          if (nombre && nombre !== '*' && /^\w+$/.test(nombre)) nombradas.add(nombre);
        }
      } else if (clave === 'order') {
        for (const c of valor.split(',')) {
          const nombre = c.split('.')[0].trim();
          if (/^\w+$/.test(nombre)) nombradas.add(nombre);
        }
      } else if (clave === 'or' || clave === 'and') {
        for (const f of valor.matchAll(new RegExp(`(\\w+)\\.(?:${OPS})\\.`, 'g'))) nombradas.add(f[1]);
      } else if (/^\w+$/.test(clave) && new RegExp(`^(?:${OPS})\\.`).test(valor) && !['limit', 'offset', 'on_conflict', 'columns'].includes(clave)) {
        nombradas.add(clave);
      }
    }
    for (const c of nombradas) {
      if (!cols.has(c)) problemas.push(`${ruta}:${linea} · ${tabla}.${c} no existe en la base`);
    }
  }
  return problemas;
}

const probar = process.argv.includes('--probar');
if (probar) {
  const inyectado = revisar('(inyectado)', 'await sbGet("orders", `status=eq.RECIBIDO&select=id,scheduled_for&order=created_at.desc`);');
  if (!inyectado.some((p) => p.includes('orders.scheduled_for'))) {
    console.error('✗ --probar: no detectó la columna inexistente inyectada (orders.scheduled_for)');
    process.exit(1);
  }
  console.log('✓ --probar: detecta la consulta a una columna inexistente:\n  · ' + inyectado.join('\n  · '));
  process.exit(0);
}

const problemas = archivos('supabase/functions').flatMap((f) => revisar(f, readFileSync(f, 'utf8')));
let consultas = 0;
for (const f of archivos('supabase/functions')) consultas += [...readFileSync(f, 'utf8').matchAll(/\b(sbGet|sbUpdate|sbDelete)\(/g)].length;
if (problemas.length) {
  console.error(`✗ Columnas: ${problemas.length} consulta(s) nombran algo que no existe en la base real:\n  · ` + problemas.join('\n  · '));
  process.exit(1);
}
console.log(`✓ Columnas: las ${consultas} consultas a PostgREST nombran solo tablas y columnas que existen en la base real`);
