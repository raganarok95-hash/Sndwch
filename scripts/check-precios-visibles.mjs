// SND//WCH — scripts/check-precios-visibles
// Comprueba que TODO importe que se le muestra a alguien pasa por pz().
//
// POR QUÉ EXISTE. Desde que los precios llevan decimales (.90, decisión del dueño del
// 2026-08-15) la aritmética de punto flotante produce basura VISIBLE. El caso real que
// obligó a escribir esto lo reportó el dueño el 2026-09-09 usando la app: el empujón a
// 30CM decía "por S/9.999999999999998", porque `p30 - p15` con 23.90 y 13.90 da eso, y la
// pantalla lo pintaba crudo. Lo mismo pasaba con la albóndiga (11.999999999999998) y el
// pavo (12.999999999999998) — tres de las cuatro proteínas del armador.
//
// `money()` y `pz()` existían desde el mismo día que los decimales y el CLAUDE.md ya pedía
// usarlos. No alcanzó: nada avisaba cuando alguien escribía `SOLES+x` en vez de
// `SOLES+pz(x)`. El typecheck no lo ve (los dos son números), los tests tampoco (ninguno
// compara el texto exacto de ese empujón), y el defecto no lanza ningún error — se ve, y
// solo si alguien abre esa pantalla con esa proteína.
//
// El modo de fallo de este chequeo es el mismo del defecto: SILENCIO. Por eso corre en
// `verify` y no depende de que alguien se acuerde.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = join(ROOT, 'src/app');

// `SOLES` es el símbolo dentro de HTML, `SOLES_TXT` el de texto plano (push, correo). Los
// dos terminan delante de los ojos de alguien, así que los dos exigen pz().
const RE = /SOLES(_TXT)?\+(?!pz\()/g;

const problems = [];
for (const f of readdirSync(APP_DIR).filter((x) => x.endsWith('.ts')).sort()) {
  const src = readFileSync(join(APP_DIR, f), 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    RE.lastIndex = 0;
    let m;
    while ((m = RE.exec(line))) {
      // El único uso legítimo sin pz() es concatenar OTRA cadena ya formateada.
      const resto = line.slice(m.index + m[0].length);
      if (/^['"`]/.test(resto)) continue;
      problems.push(
        `${f}:${i + 1} — importe mostrado sin pz(): ...${line.slice(Math.max(0, m.index - 20), m.index + 60).trim()}...`,
      );
    }
  });
}

if (problems.length) {
  console.error('✗ check:precios — importes que se muestran sin redondear:\n');
  for (const p of problems) console.error('  ' + p);
  console.error(
    `\n${problems.length} caso(s). Un precio calculado que no pasa por pz() se le muestra al cliente\n` +
      'con la basura de punto flotante completa (S/9.999999999999998). Envuélvelo: SOLES+pz(x).\n' +
      'Si además el valor se COMPARA o se guarda, redondéalo en el cálculo con money().',
  );
  process.exit(1);
}

console.log('✓ check:precios — todos los importes visibles pasan por pz()');
