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

if (problemas.length) {
  console.error(`\n✗ Maquetas: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error('  • ' + p);
  process.exit(1);
}
console.log(`✓ Maquetas: ${pngs.length} aprobadas, todas en el índice, ${MAPA.length} con su fuente.`);
