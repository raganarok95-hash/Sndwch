// SND//WCH — scripts/check-e2e
// Corre tests-e2e/flujos.mjs contra el backend REAL levantado en local
// (scripts/e2e/servidor-local.mjs). Cada flujo es independiente (cliente propio); si uno falla,
// los demás siguen, y al final se listan todos los que fallaron.
//
// Correr con: npm run check:e2e   (dentro de `npm run verify`)
import { levantarServidor } from './e2e/servidor-local.mjs';
import { FLUJOS } from '../tests-e2e/flujos.mjs';

const soloEste = process.argv[2];
const s = await levantarServidor();
const fallas = [];
let corridos = 0;
try {
  const cat = await s.llamar('get-catalog');
  const sig = {};
  for (const [id, x] of Object.entries(cat.sigItems || {})) sig[id] = { prot: x.prot, p15: x.p15, p30: x.p30, salsas: (x.sauces || []).length };
  for (const [id, x] of Object.entries(cat.sigs || {})) if (sig[id]) Object.assign(sig[id], { p15: x.p15, p30: x.p30 });
  const precios = { prot: cat.proteins, sig, bebida: cat.sides };
  for (const [nombre, flujo] of Object.entries(FLUJOS)) {
    if (soloEste && !nombre.includes(soloEste)) continue;
    corridos++;
    try {
      await flujo(s, precios);
      console.log('  ✓ ' + nombre);
    } catch (e) {
      console.log('  ✗ ' + nombre + '\n      ' + e.message);
      fallas.push(nombre);
    }
  }
} finally {
  if (fallas.length) console.log('\n── últimas líneas del api ──\n' + s.log().slice(-2000));
  s.parar();
}
if (fallas.length) {
  console.error(`\n✗ Flujos de punta a punta: ${fallas.length} de ${corridos} fallaron.`);
  process.exit(1);
}
console.log(`\n✓ Flujos de punta a punta: ${corridos} pasan contra el backend real (api + PostgREST + Postgres)`);
