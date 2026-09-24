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

// ── LA PALETA ANTERIOR NO PUEDE SOBREVIVIR NI COMO RESPALDO (2026-09-17) ─────────────
// El front se rehízo desde cero y el verde de la app anterior seguía vivo en 968 sitios.
// 127 eran VALORES REALES —`html,body` y `#app` tenían `background:#1E3932` a pelo, así que
// el verde viejo asomaba debajo de cada pantalla, y el modal del mapa (que el cliente ve al
// elegir su dirección en el checkout) estaba entero en la paleta vieja—, y los otros 841
// eran el respaldo dentro de `var(--sw-x, #viejo)`: el día que un token no cargue, la app
// no se degrada a un gris neutro, REAPARECE la app anterior.
//
// Acá se persiguen los dos casos, y a diferencia de los colores de estado de arriba, el
// respaldo TAMBIÉN cuenta: no hay ninguna razón legítima para que el hex de la paleta
// anterior siga escrito en este repo.
const PALETA_VIEJA = {
  '#1E3932': '--sw-bg',
  '#2D5246': '--sw-card',
  '#1A3028': '--sw-card2',
  '#3A6B58': '--sw-border',
  '#A8C8B0': '--sw-text-muted',
  '#F2F0EB': '--sw-text-body',
  '#4A7A68': '--sw-text-muted3',
  // Estos cuatro no son la paleta anterior literal — son de su MISMA familia, verde sobre
  // una app que dejó de ser verde. Sobrevivieron a la migración del 2026-09-17 justamente
  // porque no estaban en la lista: el chip de insignia ganada, el fondo del bloqueado, el
  // degradado de un CTA y el día cerrado del horario. Se encontraron midiendo TODOS los hex
  // sueltos del cliente y mirando los que no eran ni token ni color de estado.
  '#1E4A38': '--sw-forest-deep',
  '#162922': '--sw-card2',
  '#0D1A15': '--sw-card2',
  '#2A2A2A': '--sw-border',
  // Y los dos del pie de página, que escondían el RUC y la razón social a 2.5:1 sobre el
  // fondo — o sea la identificación legal del negocio pintada casi invisible. Los encontró
  // `tests/contraste.spec.ts` midiendo, no mirando.
  '#4A5A52': '--sw-text-muted2',
  '#3E4C46': '--sw-text-muted2',
  // Los dos grises verdosos de los correos, que nunca vivieron en `src/` y por eso ningún
  // chequeo los veía (2026-09-24).
  '#8BAF9A': '--sw-text-muted2',
  '#6E8A7A': '--sw-text-muted3',
};

// Todo lo que pinta HTML fuera del cliente: los correos, el prompt de video y la página legal
// estática. Hasta el 2026-09-24 solo se miraba `src/`, y los correos salieron dos meses en la
// paleta anterior sin que nada lo notara.
function archivosDelServidor(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...archivosDelServidor(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}
const FUERA_DEL_CLIENTE = [
  ...archivosDelServidor(join(ROOT, 'supabase/functions')),
  join(ROOT, 'scripts/gen-legal-estatico.mjs'),
].sort();

const problems = [];
const viejos = [];
// El shell también se revisa: es donde estaban los dos peores casos, y hasta hoy ningún
// chequeo lo miraba.
for (const [nombre, src] of [
  ['src/shell.html', readFileSync(join(ROOT, 'src/shell.html'), 'utf8')],
  ...readdirSync(APP_DIR).filter((x) => x.endsWith('.ts')).sort()
    .map((x) => ['src/app/' + x, readFileSync(join(APP_DIR, x), 'utf8')]),
  ...FUERA_DEL_CLIENTE.map((p) => [p.slice(ROOT.length + 1), readFileSync(p, 'utf8')]),
]) {
  // Un comentario CSS abarca VARIAS líneas, y mirar solo la línea actual daba un falso
  // positivo en el comentario que explica por qué la paleta anterior se fue — que es
  // justamente el texto que hay que conservar. Se arrastra el estado de bloque.
  let dentroDeBloque = false;
  src.split('\n').forEach((line, i) => {
    const abre = line.lastIndexOf('/*');
    const cierra = line.lastIndexOf('*/');
    const empiezaDentro = dentroDeBloque;
    if (abre > cierra) dentroDeBloque = true;
    else if (cierra > abre) dentroDeBloque = false;
    if (empiezaDentro && cierra === -1) return;
    // Los comentarios SÍ pueden nombrar la paleta vieja: media docena de ellos cuentan
    // justamente por qué se fue, y borrar ese relato para pasar un chequeo sería cambiar
    // historia por verde. Solo se persigue el hex que de verdad pinta algo.
    //
    // ⚠ Un `//` antes del hex NO basta para llamarlo comentario: en un correo el HTML lleva
    // «SND//WCH» y «ALERTAS //» dentro de la cadena, y con esa regla el chequeo daba por
    // comentario —y dejaba pasar— justamente los colores que tenía que cazar. Cuenta solo el
    // `//` que abre la línea o que va después de código y un espacio (`x; // ...`).
    const enComentario = (idx) => {
      if (empiezaDentro) return true;
      const antes = line.slice(0, idx);
      return /^\s*(\/\/|\/\*|\*)/.test(antes) || /[;,{}()]\s+\/\/ /.test(antes) || /\s\/\*/.test(antes);
    };
    for (const [hex, token] of Object.entries(PALETA_VIEJA)) {
      const re = new RegExp(`${hex}(?![0-9A-Fa-f])`, 'gi');
      let m;
      while ((m = re.exec(line))) {
        if (enComentario(m.index)) continue;
        // La definición de un token puede valer cualquier cosa — es donde se decide el
        // color — PERO solo para los hex que son ambiguos. `#2A2A2A` es un gris neutro que
        // legítimamente es el borde del panel; `#1E3932` es el verde de la app anterior y no
        // puede volver a ser el valor de un token, que es EXACTAMENTE por donde volvería
        // entera. Sin esta distinción el chequeo dejaba pasar `--sw-bg:#1E3932`, o sea el
        // único cambio que hace falta para deshacer toda la reconstrucción.
        const AMBIGUOS = ['#2A2A2A'];
        if (AMBIGUOS.includes(hex.toUpperCase()) && /--sw-[a-z0-9-]+\s*:\s*$/.test(line.slice(0, m.index))) continue;
        viejos.push(`${nombre}:${i + 1} — ${hex} es de la paleta ANTERIOR; su token hoy es ${token}`);
      }
    }
  });
}

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

// ── LA PALETA DE LOS CORREOS TIENE QUE SER LA DE LA APP (2026-09-24) ─────────────────────
// Un correo no puede leer `var(--sw-x)`, así que `_shared/paleta.ts` lleva los valores. Es una
// copia, y una copia se desalinea en silencio: se compara token por token contra el `:root`.
{
  const shell = readFileSync(join(ROOT, 'src/shell.html'), 'utf8');
  const raiz = shell.slice(shell.indexOf(':root{'), shell.indexOf('}', shell.indexOf('--sw-bg:')));
  const oro = (shell.match(/\n\.wm-mark i:first-child\{background:(#[0-9A-Fa-f]{6})\}/) || [])[1];
  const paleta = readFileSync(join(ROOT, 'supabase/functions/_shared/paleta.ts'), 'utf8');
  const pares = [...paleta.matchAll(/^\s*"?([a-z0-9-]+)"?:\s*"(#[0-9A-Fa-f]{3,8})",/gm)];
  if (pares.length < 10) viejos.push(`_shared/paleta.ts — solo se leyeron ${pares.length} colores; ¿cambió su forma?`);
  for (const [, nombre, valor] of pares) {
    const esperado = nombre === 'oro' ? oro : (raiz.match(new RegExp(`--sw-${nombre}:\\s*(#[0-9A-Fa-f]{3,8})`)) || [])[1];
    if (!esperado) viejos.push(`_shared/paleta.ts — «${nombre}» no existe en el :root de src/shell.html`);
    else if (esperado.toLowerCase() !== valor.toLowerCase())
      viejos.push(`_shared/paleta.ts — «${nombre}» vale ${valor} y en src/shell.html vale ${esperado}`);
  }
}

if (viejos.length) {
  console.error('✗ check:colores — la paleta de la app ANTERIOR sigue escrita en el repo:\n');
  for (const p of viejos.slice(0, 40)) console.error('  ' + p);
  if (viejos.length > 40) console.error(`  ... y ${viejos.length - 40} más`);
  console.error(
    `\n${viejos.length} caso(s). El front se rehízo desde cero: ninguno de esos hex debería\n` +
      'seguir existiendo, ni siquiera como respaldo de un var(). Un respaldo a la paleta vieja\n' +
      'significa que el día que un token falle, vuelve la app anterior en vez de degradarse.',
  );
  process.exit(1);
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

console.log('✓ check:colores — ningún color de estado escrito a mano y ni un hex de la paleta anterior');
