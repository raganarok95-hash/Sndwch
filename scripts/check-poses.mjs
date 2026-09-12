// Comprueba que TODA pose declarada en POSES (src/app/02-*) apunte a un archivo que existe.
//
// Por qué existe: pedir `img/wicho_piensa.png` cuando ese archivo no está NO lanza ningún
// error. El typecheck no lo ve, el build no lo ve y ningún test lo ve — lo que sale es una
// imagen rota en la pantalla del cliente, que es el peor sitio posible para enterarse.
// El mapa de POSES está escrito justamente para que eso no pase; esto verifica que sigue
// siendo verdad después de cada cambio.
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(RAIZ, 'src', 'app', '02-ui-base-y-api.ts'), 'utf8');

const bloque = src.match(/var POSES[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!bloque) { console.error('✗ check:poses — no se encontró el mapa POSES en 02-ui-base-y-api.ts'); process.exit(1); }

const fallos = [];
let total = 0;
for (const m of bloque[1].matchAll(/(\w+)\s*:\s*\{\s*sando:\s*'([^']+)'\s*,\s*wicho:\s*'([^']+)'/g)) {
  const [, estado, sando, wicho] = m;
  for (const [quien, pose] of [['sando', sando], ['wicho', wicho]]) {
    total++;
    const rel = `img/${quien}_${pose}.png`;
    if (!fs.existsSync(path.join(RAIZ, rel))) {
      fallos.push(`estado "${estado}" → ${rel} NO EXISTE (imagen rota en el cliente, sin error)`);
    }
  }
}
if (!total) { console.error('✗ check:poses — el mapa POSES quedó vacío'); process.exit(1); }
if (fallos.length) { console.error('✗ check:poses'); fallos.forEach(f => console.error('   ' + f)); process.exit(1); }
console.log(`✓ check:poses — ${total} referencias de pose, todas con archivo`);
