// SND//WCH — scripts/exportar-carta
// Escribe `modelo/carta.json` desde `supabase/functions/_shared/carta.ts`: el modelo de Python
// no puede importar TypeScript, y hasta el 2026-09-24 tenía su propia copia de la carta, que
// `check_costos.py` comparaba con el servidor por regex. Ahora la lee de acá.
//
//   node --experimental-strip-types scripts/exportar-carta.mjs            → escribe el JSON
//   node --experimental-strip-types scripts/exportar-carta.mjs --check    → falla si está viejo
//
// `--check` corre dentro de `verify` (npm run check:carta): una carta cambiada sin exportar deja
// al modelo costeando otra carta, sin que nada lo diga.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { CARTA } from '../supabase/functions/_shared/carta.ts';

const DESTINO = 'modelo/carta.json';
const json = JSON.stringify({
  _generado: 'NO SE EDITA A MANO. Sale de supabase/functions/_shared/carta.ts (node scripts/exportar-carta.mjs).',
  ...CARTA,
}, null, 2) + '\n';

if (process.argv.includes('--check')) {
  const actual = existsSync(DESTINO) ? readFileSync(DESTINO, 'utf8') : '';
  if (actual !== json) {
    console.error(`✗ ${DESTINO} no coincide con _shared/carta.ts: corre \`npm run exportar:carta\` y commitea el resultado.`);
    process.exit(1);
  }
  console.log(`✓ Carta: ${DESTINO} al día con _shared/carta.ts`);
} else {
  writeFileSync(DESTINO, json);
  console.log(`✓ ${DESTINO} escrito (${CARTA.signatures.length} Signatures, ${CARTA.proteinas.length} proteínas)`);
}
