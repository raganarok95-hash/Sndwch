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
//
// La comprobación no es "hay un pz() cerca": es seguir la concatenación desde el símbolo
// de soles hasta el PRIMER dato que se interpola, y exigir que ése pase por pz().
//
// ── POR QUÉ NO ALCANZA CON MIRAR SI pz() VA PEGADO A SOLES (2026-09-10) ──
// La forma más común en este repo separa el símbolo del número con markup, para pintar el
// número en dorado:
//
//     SOLES+'<span style="color:'+GOLD+'">'+t+'</span>'
//                                          ↑ acá nadie miraba
//
// Y no era hipotético: así estaba escrita `AB()`, la barra de acción — o sea el total que
// se ve JUSTO ENCIMA DEL BOTÓN DE PAGAR, en las cuatro pantallas que tienen uno
// (Signature, armador, confirmación y carrito). Un Signature de S/20.90 se anunciaba como
// "S/20.9", y el armador podía llegar a mostrar 24.369999999999997 — el mismo defecto que
// el dueño ya había reportado en el empujón a 30CM, sobreviviendo en otra pantalla.
const SOLES_RE = /SOLES(_TXT)?\+/g;
// Constantes de ESTILO que aparecen entre el símbolo y el número. No son el importe, así
// que la búsqueda las salta y sigue. GOLD y los dos acentos de lado son todo lo que hay
// hoy; cualquier identificador en MAYÚSCULAS o una llamada a función de color cuenta.
const ES_ESTILO = /^(?:[A-Z][A-Z0-9_]*|ACC|ACC_INK|SHADOW_[A-Z]+)(?:\(\))?$/;
// Nombres que por convención ya traen texto formateado, no un número crudo.
const YA_FORMATEADO = /(Txt|Lbl|Str|Html|Fmt)$/;

// Devuelve el primer dato interpolado después de `SOLES+`, saltando literales y estilo.
// `null` si no hay ninguno (el importe llega ya formateado dentro de un literal).
function primerDato(resto) {
  let i = 0;
  for (let vuelta = 0; vuelta < 8; vuelta++) {
    while (resto[i] === ' ') i++;
    const c = resto[i];
    if (c === "'" || c === '"' || c === '`') {
      // Un literal: saltarlo entero, con sus escapes.
      const cierre = c;
      i++;
      while (i < resto.length && resto[i] !== cierre) i += resto[i] === '\\' ? 2 : 1;
      i++;
      if (resto[i] !== '+') return null; // la concatenación terminó sin interpolar nada
      i++;
      continue;
    }
    const m = /^[A-Za-z_$][\w$]*(\(\))?/.exec(resto.slice(i));
    if (!m) return null;
    if (ES_ESTILO.test(m[0])) {
      i += m[0].length;
      if (resto[i] !== '+') return null;
      i++;
      continue;
    }
    return m[0] === 'pz' && resto[i + 2] === '(' ? 'pz' : m[0];
  }
  return null;
}

const problems = [];
for (const f of readdirSync(APP_DIR).filter((x) => x.endsWith('.ts')).sort()) {
  const src = readFileSync(join(APP_DIR, f), 'utf8');
  src.split('\n').forEach((line, i) => {
    // Los comentarios no le llegan a nadie. Sin esto, escribir `SOLES+x` al EXPLICAR el
    // defecto lo reporta como defecto.
    const codigo = line.replace(/^(\s*)\/\/.*$/, '$1');
    SOLES_RE.lastIndex = 0;
    let m;
    while ((m = SOLES_RE.exec(codigo))) {
      const dato = primerDato(codigo.slice(m.index + m[0].length));
      if (dato === null || dato === 'pz' || YA_FORMATEADO.test(dato)) continue;
      problems.push(
        `${f}:${i + 1} — importe mostrado sin pz() (llega como \`${dato}\`): ` +
          `...${codigo.slice(Math.max(0, m.index - 22), m.index + 66).trim()}...`,
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
