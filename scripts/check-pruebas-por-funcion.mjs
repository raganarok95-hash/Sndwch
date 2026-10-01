// ¿LAS PRUEBAS BUSCAN POR FUNCIÓN? (2026-10-01)
//
// Dueño: «¿Por qué las pruebas buscan texto y no funciones?». Cada cambio de copy («Seguir» →
// «Mandarme el código», «CONFIRMAR //») rompía pruebas que no tenían nada que ver con el texto.
// Regla: una prueba encuentra un botón por lo que HACE (`data-accion`, id de campo, rol sin
// nombre) y nunca espera un tiempo fijo. Hay pruebas viejas que todavía no cumplen: este
// chequeo es un TRINQUETE. Lee el conteo por archivo de tests/POR_TEXTO.txt y falla si un
// archivo SUBE (o aparece uno nuevo con texto o con waitForTimeout). Bajar está bien: con
// `--anotar` se reescribe la línea base con los números nuevos, más bajos.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const BASE = 'tests/POR_TEXTO.txt';
const POR_TEXTO = /getByRole\([^)]*name:|getByText\(|['"`]text=|:has-text\(|getByLabel\(|getByPlaceholder\(/g;
const ESPERA_FIJA = /waitForTimeout\(/g;

const ahora = {};
for (const f of readdirSync('tests').filter((n) => n.endsWith('.ts')).sort()) {
  const src = readFileSync('tests/' + f, 'utf8');
  const t = (src.match(POR_TEXTO) || []).length, e = (src.match(ESPERA_FIJA) || []).length;
  if (t || e) ahora[f] = { t, e };
}

const base = {};
if (existsSync(BASE)) for (const l of readFileSync(BASE, 'utf8').split('\n')) {
  const m = l.match(/^(\S+)\s+texto=(\d+)\s+espera=(\d+)/);
  if (m) base[m[1]] = { t: +m[2], e: +m[3] };
}

if (process.argv.includes('--anotar')) {
  const subio = Object.entries(ahora).filter(([f, v]) => v.t > (base[f]?.t ?? 0) || v.e > (base[f]?.e ?? 0));
  if (subio.length && existsSync(BASE)) { console.error('No se anota una SUBIDA:', subio.map(([f]) => f).join(', ')); process.exit(1); }
  writeFileSync(BASE, '# Selectores por texto y esperas fijas que quedan (solo puede bajar). Ver docs/COMO_PROBAR.md\n'
    + Object.entries(ahora).map(([f, v]) => `${f} texto=${v.t} espera=${v.e}`).join('\n') + '\n');
  console.log('Línea base anotada.'); process.exit(0);
}

const malos = [];
for (const [f, v] of Object.entries(ahora)) {
  const b = base[f] || { t: 0, e: 0 };
  if (v.t > b.t) malos.push(`${f}: ${v.t} selectores por texto (tope ${b.t}). Usa data-accion, un id o el rol sin nombre.`);
  if (v.e > b.e) malos.push(`${f}: ${v.e} waitForTimeout (tope ${b.e}). Espera el efecto (expect/poll), no el reloj.`);
}
if (malos.length) { console.error('check:pruebas-por-funcion\n  ' + malos.join('\n  ')); process.exit(1); }
const tot = Object.values(ahora).reduce((s, v) => s + v.t, 0);
console.log(`check:pruebas-por-funcion OK (${tot} selectores por texto heredados; solo pueden bajar)`);
