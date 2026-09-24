#!/usr/bin/env node
// Que la especificación del front no se pierda en silencio: cada maqueta aprobada tiene su
// PNG, su fila en el índice y (si la tiene) su fuente. Ver docs/maquetas/README.md.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { MAPA } from './render-maquetas.mjs';

const D = 'docs/maquetas';
const pngs = readdirSync(join(D, 'aprobadas')).filter((f) => f.endsWith('.png'));
const readme = readFileSync(join(D, 'README.md'), 'utf8');
const enIndice = new Set([...readme.matchAll(/`([^`]+\.png)`/g)].map((m) => m[1]));
const problemas = [];

for (const f of pngs) if (!enIndice.has(f)) problemas.push(`${f} está en aprobadas/ y no en el índice del README`);
for (const f of enIndice) if (!pngs.includes(f)) problemas.push(`el índice cita ${f} y no existe en aprobadas/`);
for (const [nombre, fuente] of MAPA) {
  if (!existsSync(join(D, 'fuentes', fuente))) problemas.push(`${nombre}: su fuente ${fuente} no existe`);
  if (!pngs.includes(nombre + '.png')) problemas.push(`${nombre}: está en MAPA y no tiene PNG (correr scripts/render-maquetas.mjs)`);
}

// El SANDO viejo (`img/sando_*.png`, sin el 2) no vuelve ni a la app ni a una maqueta: el
// dueño lo pidió dos veces (2026-09-18 y 2026-09-24). El logo (`img/marca/`) no cuenta: ese
// se queda con el anterior a propósito.
//
// ⚠ EL «2» DEL NOMBRE NO PRUEBA NADA. Cinco archivos que llegaron el 2026-09-23 se llaman
// sando2_* y son del dibujo VIEJO (mechón verde oscuro, trazo pintado): cuerpo_b, come,
// come_b, grita y piensa. Se usaron creyendo que eran el nuevo y el dueño lo corrigió
// (2026-09-24, «este es el sando viejo en todas»). Los nuevos de verdad están en
// img/fuente/FUENTES.md.
const VIEJO = /img\/sando_[a-z_]+\.png|img\/sando2_(?:cuerpo_b|come_b|come|grita|piensa)\.png/g;
const revisar = [
  ...readdirSync('src/app').map((f) => join('src/app', f)),
  'src/shell.html',
  ...readdirSync(join(D, 'fuentes')).filter((f) => f.endsWith('.html')).map((f) => join(D, 'fuentes', f)),
];
for (const f of revisar) {
  const m = readFileSync(f, 'utf8').match(VIEJO);
  if (m) problemas.push(`${f} usa el SANDO viejo (${[...new Set(m)].join(', ')}) — va el actual (ver img/fuente/FUENTES.md)`);
}

if (problemas.length) {
  console.error(`\n✗ Maquetas: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error('  • ' + p);
  process.exit(1);
}
console.log(`✓ Maquetas: ${pngs.length} aprobadas, todas en el índice, ${MAPA.length} con su fuente.`);
