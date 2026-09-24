// SND//WCH — scripts/suite-contra-conocidas
// Corre la suite de Playwright entera y la compara contra tests/ROJAS_CONOCIDAS.txt.
//
// Por qué existe: la suite lleva días con las mismas pruebas rojas, conocidas, y una suite
// siempre roja no avisa de nada — una regresión nueva queda escondida entre las viejas. Hasta
// hoy la comparación «¿son las mismas de antes?» se hacía a mano con diff después de cada
// cambio. Esto la hace siempre y de la misma forma:
//   · sale con error si aparece una roja que no está en la lista (defecto nuevo);
//   · avisa, y también sale con error, si una de la lista ya pasa: hay que borrarla, o la
//     lista volvería a tapar una regresión en esa misma prueba.
//
// Correr con: npm run test:estado
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const r = spawnSync('npx', ['playwright', 'test', '--reporter=json', ...process.argv.slice(2)], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
let reporte;
try {
  reporte = JSON.parse(r.stdout);
} catch {
  console.error('✗ Playwright no devolvió un reporte legible. Salida de error:\n' + (r.stderr || '').slice(-3000));
  process.exit(1);
}

const pruebas = [];
(function recorrer(s, ruta) {
  for (const x of s.suites || []) recorrer(x, [...ruta, x.title]);
  for (const sp of s.specs || []) {
    for (const t of sp.tests || []) {
      pruebas.push({ id: [sp.file, ...ruta.slice(1), sp.title].filter(Boolean).join(' › '), estado: t.status });
    }
  }
})(reporte, []);

const conocidas = new Set(
  readFileSync('tests/ROJAS_CONOCIDAS.txt', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')),
);
const rojas = pruebas.filter((p) => p.estado === 'unexpected').map((p) => p.id);
const inestables = pruebas.filter((p) => p.estado === 'flaky').map((p) => p.id);
const nuevas = rojas.filter((id) => !conocidas.has(id));
const ids = new Set(pruebas.map((p) => p.id));
const yaPasan = [...conocidas].filter((id) => ids.has(id) && !rojas.includes(id));
const noExisten = [...conocidas].filter((id) => !ids.has(id));

console.log(`${pruebas.length} pruebas · ${pruebas.length - rojas.length} pasan · ${rojas.length} rojas (${rojas.length - nuevas.length} conocidas)`);
if (inestables.length) console.log(`⚠ Inestables (pasaron al reintentar):\n  · ${inestables.join('\n  · ')}`);
let mal = false;
if (nuevas.length) {
  mal = true;
  console.error(`\n✗ ${nuevas.length} roja(s) NUEVA(S) — esto es un defecto, no ruido:\n  · ${nuevas.join('\n  · ')}`);
}
if (yaPasan.length) {
  mal = true;
  console.error(`\n✗ ${yaPasan.length} de la lista ya pasan. Bórralas de tests/ROJAS_CONOCIDAS.txt:\n  · ${yaPasan.join('\n  · ')}`);
}
if (noExisten.length && !process.argv.slice(2).length) {
  mal = true;
  console.error(`\n✗ ${noExisten.length} de la lista ya no existen (¿se renombraron?):\n  · ${noExisten.join('\n  · ')}`);
}
if (mal) process.exit(1);
console.log('✓ Sin rojas nuevas: todo lo que falla es deuda conocida y anotada.');
