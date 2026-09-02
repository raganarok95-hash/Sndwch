// SND//WCH — scripts/check-bundle
// Comprueba que el bundle del cliente sigue armándose de UNA sola forma predecible.
//
// POR QUÉ EXISTE. El cliente vivía en un único src/app.ts de más de 8 000 líneas. Se
// dividió en src/app/NN-*.ts (archivos de script global, sin import/export) y el build los
// concatena EN ORDEN ALFABÉTICO. Esa división se hizo verificando que el JS resultante
// fuera byte a byte idéntico al que producía el archivo único — pero esa garantía se
// evapora en cuanto alguien agrega una parte con un nombre que ordena mal, o mete un
// `import`/`export` que convierta un archivo en módulo (tsc lo envolvería y el orden de
// ejecución dejaría de ser el del texto).
//
// El archivo se ejecuta de arriba a abajo y hay estado que tiene que existir antes de que
// corra nada de abajo: el catálogo, las constantes de dinero, los helpers. Reordenar las
// partes no da un error de compilación, da una app rota en runtime. Esto lo atrapa antes.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src/app');

const problems = [];
const files = readdirSync(APP_DIR).filter((f) => f.endsWith('.ts'));

if (!files.length) problems.push('src/app/ no tiene ninguna parte .ts — el build no tendría qué compilar.');

// 1. Prefijo numérico en todas: es lo único que hace que el orden alfabético coincida con
//    el orden de ejecución que el código necesita.
for (const f of files) {
  if (!/^\d{2}-[a-z0-9-]+\.ts$/.test(f)) {
    problems.push(`${f}: el nombre debe ser NN-nombre-en-minusculas.ts — el build concatena por orden alfabético y sin prefijo numérico la parte cae en cualquier lado.`);
  }
}

// 2. Prefijos consecutivos y sin repetir: dos partes con el mismo número dejan su orden
//    relativo a merced de cómo el sistema de archivos desempate.
const nums = files.map((f) => Number(f.slice(0, 2))).sort((a, b) => a - b);
const dupes = nums.filter((n, i) => i > 0 && n === nums[i - 1]);
if (dupes.length) problems.push(`Prefijos repetidos (${[...new Set(dupes)].join(', ')}): el orden entre esas partes queda indefinido.`);
for (let i = 0; i < nums.length; i++) {
  if (nums[i] !== i + 1) {
    problems.push(`Los prefijos deben ir 01..${String(nums.length).padStart(2, '0')} sin saltos — hay un ${String(nums[i]).padStart(2, '0')} donde iba un ${String(i + 1).padStart(2, '0')}.`);
    break;
  }
}

// 3. Ninguna parte puede ser un MÓDULO. Un solo import/export de nivel superior cambia
//    cómo tsc emite ese archivo y rompe el modelo de "concatenar scripts globales".
for (const f of files) {
  const src = readFileSync(join(APP_DIR, f), 'utf8');
  const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  if (/^\s*(import|export)\s/m.test(sinComentarios)) {
    problems.push(`${f}: tiene un import/export de nivel superior. Las partes son scripts globales; convertir una en módulo cambia el orden de ejecución sin que nada falle al compilar.`);
  }
}

if (problems.length) {
  console.error(`\n✗ Estructura del bundle del cliente: ${problems.length} problema(s)\n`);
  for (const p of problems) console.error('  • ' + p + '\n');
  process.exit(1);
}
console.log(`✓ Bundle del cliente: ${files.length} partes, orden de concatenación bien definido`);
