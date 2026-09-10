// SND//WCH — scripts/check-colores
// Comprueba que ningún color de ESTADO vuelva a escribirse como literal suelto.
//
// POR QUÉ EXISTE. La revisión de arquitectura del 2026-09-10 midió ~230 literales de color
// semántico repartidos por `src/app/`: el rojo de error escrito 79 veces, el verde de
// confirmación 60, los ámbar de aviso 47. Subir el contraste de uno para cumplir WCAG
// significaba acertarle a 79 sitios y la garantía de que alguno se quedara atrás.
//
// La tokenización sacó a la luz dos cosas que nadie había notado en meses:
//   · El verde de confirmación era `#25D366`, EL VERDE DE WHATSAPP, y en la misma app hay
//     botones reales de WhatsApp. Un color decía dos cosas distintas.
//   · El texto sobre dorado estaba escrito de DOS formas para el mismo trabajo: `#0d0d0d`
//     en 21 sitios y `#241a08` en 20.
// Ninguna de las dos rompía nada. Por eso hace falta un chequeo y no buena intención: el
// modo de fallo es que se ve bien.
//
// Es el mismo patrón de `check-precios-visibles`, que en su primera corrida encontró 6
// casos que se le habían escapado al reemplazo automático.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src/app');

// Los colores de estado y su token. Si aparece el literal fuera de un `var(--token,...)`,
// es que alguien escribió el color a mano otra vez.
const ESTADO = {
  '#ff8888': '--sw-danger',
  '#ff5555': '--sw-danger-strong',
  '#25D366': '--sw-ok  (o --sw-whatsapp si de verdad es un control de WhatsApp)',
  '#ffa500': '--sw-warn',
  '#ffb366': '--sw-warn-soft',
  '#241a08': '--sw-on-gold',
  '#0d0d0d': '--sw-on-gold',
};

const problems = [];
for (const f of readdirSync(APP_DIR).filter((x) => x.endsWith('.ts')).sort()) {
  const src = readFileSync(join(APP_DIR, f), 'utf8');
  src.split('\n').forEach((line, i) => {
    for (const [hex, token] of Object.entries(ESTADO)) {
      // Dentro de un var(--x,#hex) el literal es el FALLBACK y es correcto que esté: es la
      // convención de todo el repo. Lo que se persigue es el literal suelto.
      const re = new RegExp(`(?<!,)${hex}(?![0-9A-Fa-f])`, 'gi');
      let m;
      while ((m = re.exec(line))) {
        problems.push(
          `${f}:${i + 1} — ${hex} suelto; usa var(${token},${hex})\n      ...${line
            .slice(Math.max(0, m.index - 26), m.index + 34)
            .trim()}...`,
        );
      }
    }
  });
}

if (problems.length) {
  console.error('✗ check:colores — colores de estado escritos a mano:\n');
  for (const p of problems) console.error('  ' + p);
  console.error(
    `\n${problems.length} caso(s). Un color de estado suelto no rompe nada: se ve bien. Lo que\n` +
      'rompe es el día que haya que moverlo — y entonces hay que acertarle a todos los sitios\n' +
      'a la vez. Los tokens viven en el bloque :root de src/shell.html.',
  );
  process.exit(1);
}

console.log('✓ check:colores — ningún color de estado escrito a mano');
