// La versión FINAL del Instagram de SND//WCH (2026-10-30), elegida de las 10 anteriores. Antes:
// siete versiones más del Instagram de SND//WCH (dueño, 2026-10-30: «dame 7 versiones más de todo lo
// que Instagram, con sando, wicho, sin, mezclados, descompuestos y en todas una idea de la foto de
// perfil»). Cada versión: foto de perfil, 4 destacados, 9 publicaciones y la maqueta del perfil.
// Reglas que no cambian en ninguna: la comida no se tapa ni se tiñe; las cifras y nombres salen de la
// carta; los elementos de cada hermano salen de docs/LOS_DOS_HERMANOS.md.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, REPO = path.resolve(D, '../../../..');
const OUT = process.env.SALIDA ? path.resolve(process.env.SALIDA) : D; fs.mkdirSync(OUT, { recursive: true });
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8'); // FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh)
// Exporta sin ensuciar el color: la captura sale en PNG y PIL la pasa a JPEG al 95 % sin submuestreo de croma (4:4:4),
// para que los bordes de las letras y del sándwich queden limpios (2026-10-31, dueño: «se ven como que de poca calidad»).
const { execFileSync: _ejecutar } = require('child_process');
async function captura(pg, salida, opciones = {}) {
  const png = salida.replace(/\.jpg$/, '.png');
  await pg.screenshot({ path: png, type: 'png', ...opciones });
  _ejecutar('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=95,subsampling=0)", png, salida]);
  fs.rmSync(png);
}
const FOTOS = `${REPO}/docs/marketing/anuncios/fotos`;
const img = (p) => 'file://' + path.resolve(p);
const PJ = (n) => img(`${REPO}/img/${n}.png`);
const S = { oliva: '#6C7860', verde: '#183024', tan: '#C9A87C', forro: '#D8823C', oro: '#CBA258', tinta: '#1E2B22' };
const W = { pelaje: '#90CCF0', curvas: '#7DB6DA', durazno: '#F0D8CC', lila: '#C3A6D2', lilaO: '#4A3D62', tinta: '#1E2F3A' };
const papel = '#EFE6D4', celeste = '#8CC8EC';

const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;text-wrap:balance}
.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}
.wm{font:800 42px/1 Archivo,sans-serif;display:inline-flex;align-items:center;letter-spacing:.01em}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:${S.oro}}.mk i:last-child{background:${celeste}}
.rib{background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 7px,rgba(255,255,255,.045) 7px 14px)}
.abs{position:absolute}.full{position:absolute;inset:0}
.cruz{background-image:repeating-linear-gradient(45deg,rgba(144,204,240,.08) 0 2px,transparent 2px 22px),repeating-linear-gradient(-45deg,rgba(144,204,240,.08) 0 2px,transparent 2px 22px)}`;
const marca = (c = papel, t = 42) => `<span class="wm" style="color:${c};font-size:${t}px">SND<span class="mk"><i></i><i></i></span>WCH</span>`;
const barras = (alto) => `<span class="mk" style="font-size:${alto}px;margin:0"><i></i><i></i></span>`;
const pagina = (w, h, cuerpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:${w}px;height:${h}px;overflow:hidden}${BASE}${extra}</style></head><body>${cuerpo}</body></html>`;
const caja = (w, h, estilo, dentro) => `<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;${estilo}">${dentro}</div>`;

// La espiral de WICHO, por cálculo (~3.6 vueltas). Las curvas de nivel de su polo, tono sobre tono.
function espiral(cx, cy, rmax, color, ancho) {
  const v = 3.6, n = 420, p = [];
  for (let i = 0; i <= n; i++) { const t = (i / n) * v * 2 * Math.PI, r = (t / (v * 2 * Math.PI)) * rmax; p.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
  return `<polyline points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>`;
}
const svgEsp = (w, h, cx, cy, r, c, a) => `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}">${espiral(cx, cy, r, c, a)}</svg>`;
function curvas(w, h, cx, cy, color, n = 18, paso = 66, sem = 1) {
  let s = '';
  for (let k = 1; k <= n; k++) {
    const p = [];
    for (let i = 0; i <= 180; i++) { const t = (i / 180) * 2 * Math.PI; const r = k * paso * (1 + 0.09 * Math.sin(3 * t + k * 0.35 + sem) + 0.05 * Math.sin(5 * t + 1.7 * sem) + 0.03 * Math.sin(2 * t - k * 0.2)); p.push(`${(cx + r * Math.cos(t) * 1.15).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
    s += `<polygon points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
  }
  return `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}">${s}</svg>`;
}
const ICON = {
  carta: '<path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><path d="M3 11h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/><path d="M4 15.5h16"/><path d="M8 7c.7-1.3 1.9-2 4-2s3.3.7 4 2"/>',
  pedir: '<path d="M4 5h2l2.3 11.4A2 2 0 0 0 10.3 18h7.4a2 2 0 0 0 2-1.6L21 9H7.2"/><circle cx="10.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>',
  bebidas: '<rect x="8" y="8" width="8" height="13" rx="2"/><path d="M10 8V5.5h4V8"/><path d="M9.6 3.8h4.8"/><path d="M8 12.5h8"/>',
  zonas: '<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>',
};
const ico = (k, c, t = 480) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position:relative">${ICON[k]}</svg>`;
const centrado = 'display:flex;align-items:center;justify-content:center';
// Portada de destacado: 1080 × 1920, lo importante dentro del círculo central.
const portada = (fondo, dentro) => caja(1080, 1920, `background:${fondo};${centrado}`, dentro);
const conCara = (fondo, pose, alto, dy = 0, clase = '') => portada(fondo, `<div class="full ${clase}"></div><img src="${PJ(pose)}" style="position:relative;height:${alto}px;transform:translateY(${dy}px)">`);
const foto = (n, pos = 'center 62%') => `background:url('${img(`${FOTOS}/${n}`)}') ${pos}/cover`;

const FOOD = [
  { n: '1-philly', f: 'foto-philly-30.jpg', tit: 'Hambre en serio.', voz: 'Philly Cheesesteak. Tan jugoso que no lleva salsa.', cita: 'Tan jugoso que no lleva salsa.', nombre: 'Philly Cheesesteak' },
  { n: '4-meatball', f: 'foto-meatball-30.jpg', tit: 'Hoy no cocinas.', voz: 'Meatball Marinara. Albóndigas en su propia marinara.', cita: 'Albóndigas en su propia marinara.', nombre: 'Meatball Marinara' },
  { n: '5-turkey', f: 'foto-turkey-30.jpg', tit: 'El almuerzo que no te tumba la tarde.', voz: 'Turkey. Llena sin pesar.', cita: 'Llena sin pesar.', nombre: 'Turkey' },
  { n: '6-tuna-melt', f: 'foto-tuna-melt-30.jpg', tit: 'Antojo de algo caliente.', voz: 'Tuna Melt. El cheddar se estira al primer mordisco.', cita: 'El cheddar se estira al primer mordisco.', nombre: 'Tuna Melt' },
  { n: '7-italian-hoagie', f: 'foto-italian-hoagie-30.jpg', tit: 'Cuando quieres de todo.', voz: 'Italian Hoagie. Cada capa suma y ninguna sobra.', cita: 'Cada capa suma y ninguna sobra.', nombre: 'Italian Hoagie' },
  { n: '8-classic-tuna', f: 'foto-classic-tuna-30.jpg', tit: 'Se come con una mano.', voz: 'Classic Tuna. Simple y bien hecho.', cita: 'Simple y bien hecho.', nombre: 'Classic Tuna' },
];
const SIGS = FOOD.map((x) => x.nombre);
const tam = (t, base = 112) => (t.length <= 16 ? base : t.length <= 24 ? Math.round(base * 0.88) : Math.round(base * 0.76));
const PASOS = ['Entras a sndwch.app', 'Eliges uno o armas el tuyo', 'Pagas con Yape o tarjeta', 'Te llega a la puerta'];
const MONO = 'SNDWCH.APP';

// Un panel de texto de Signature (debajo de la foto): fondo, color del titular, de la voz y del resto.
const panelSig = (d, { fondo, clase = '', extra = '', tit, voz, resto, alto = 430, titular = d.tit }) => caja(1080, 1350, `background:${fondo}`, `
  <div class="full" style="bottom:${alto}px;${foto(d.f)}"></div>
  <div class="abs ${clase}" style="left:0;right:0;bottom:0;height:${alto}px;background-color:${fondo};overflow:hidden">${extra}
    <div class="abs" style="left:84px;right:84px;top:50px;bottom:52px;display:flex;flex-direction:column">
      <div class="disp" style="font-size:${tam(titular, 112)}px;color:${tit}">${titular}</div>
      <div class="voz" style="font-size:42px;line-height:1.12;margin-top:14px;color:${voz}">${d.voz}</div>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:26px;color:${resto}">${MONO}</div>${marca(resto, 38)}</div></div></div>`);
const listaCarta = (c, t = 92) => `<div class="disp" style="font-size:${t}px;line-height:1.03;color:${c}">${SIGS.join('<br>')}</div>`;

// ════════════════════════════════════════════════════════════════════════════════════════════════
// «UN SÁNDWICH ES CAPAS» (2026-10-30, dueño: «No necesitas usar a SANDO y WICHO para todo, solo estás usando lo que ya
// tienes, sé creativo»). Los destacados y sus historias se dibujan con objetos planos del mundo del sándwich: el corte
// (Carta), las capas sueltas (Arma el tuyo), la bolsa kraft con el sello // (Envíos), la lata (Bebidas) y el celular
// (Cómo pedir). Los hermanos quedan descompuestos en los fondos: el acanalado y el forro de SANDO, y las curvas, la
// espiral y el celeste de WICHO. Colores de comida planos, sin brillo: se leen a 66 px.
// ════════════════════════════════════════════════════════════════════════════════════════════════
const C = { pan: '#D9AE73', corteza: '#A8692F', miga: '#F3E2BF', lechuga: '#7FA650', tomate: '#D8503A', queso: '#EDB93B', carne: '#6E3F2A', cebolla: '#9C5A8C', kraft: '#C49A62', kraftO: '#9C7442' };
// Una capa de relleno, con su forma: la lechuga ondea, el queso chorrea, el tomate lleva semillas.
function capa(tipo, x, y, w, h) {
  if (tipo === 'lechuga') { let d = `M${x},${y + h * 0.5}`; for (let k = 0; k <= 12; k++) d += ` Q${x + (k + 0.5) * w / 12},${y + (k % 2 ? h * 1.15 : -h * 0.1)} ${x + (k + 1) * w / 12},${y + h * 0.5}`; return `<path d="${d} L${x + w},${y + h} L${x},${y + h} Z" fill="${C.lechuga}"/>`; }
  if (tipo === 'queso') { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 3}" fill="${C.queso}"/>`; for (const f of [0.18, 0.47, 0.76]) s += `<path d="M${x + w * f - h * 0.6},${y + h * 0.9} Q${x + w * f},${y + h * 2.4} ${x + w * f + h * 0.6},${y + h * 0.9} Z" fill="${C.queso}"/>`; return s; }
  if (tipo === 'tomate') { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.tomate}"/>`; for (let k = 1; k < 8; k++) s += `<ellipse cx="${x + k * w / 8}" cy="${y + h / 2}" rx="${h * 0.14}" ry="${h * 0.22}" fill="#F4C9A8"/>`; return s; }
  const col = { carne: C.carne, cebolla: C.cebolla }[tipo] || tipo;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.2}" fill="${col}"/>`;
}
// El sándwich de costado, como pan largo (nunca como hamburguesa): el pan de arriba es un domo bajo y alargado con
// sus cortes en diagonal, los rellenos asoman por el lado y el pan de abajo es una tira. `abre` separa las capas.
function sandwich(cx, cy, w, { abre = 0, rellenos = ['lechuga', 'tomate', 'queso', 'carne'] } = {}) {
  const hp = w * 0.13, hb = w * 0.07, hr = w * 0.045, n = rellenos.length;
  const alto = hp + hb + n * hr + (n + 1) * abre;
  let y = cy - alto / 2, s = '';
  const L = cx - w / 2, R = cx + w / 2, k = hp * 0.9;
  s += `<path d="M${L + k},${y + hp} Q${L},${y + hp} ${L + k * 0.35},${y + hp * 0.45} Q${L + k},${y} ${L + k * 2},${y} L${R - k * 2},${y} Q${R - k},${y} ${R - k * 0.35},${y + hp * 0.45} Q${R},${y + hp} ${R - k},${y + hp} Z" fill="${C.pan}" stroke="${C.corteza}" stroke-width="${w * 0.014}"/>`;
  s += [0.28, 0.43, 0.58, 0.73].map((f) => `<path d="M${L + w * f - w * 0.04},${y + hp * 0.62} L${L + w * f + w * 0.03},${y + hp * 0.22}" stroke="${C.corteza}" stroke-width="${w * 0.012}" stroke-linecap="round"/>`).join('');
  y += hp + abre;
  for (const r of rellenos) { s += capa(r, L + w * 0.015, y, w * 0.97, hr); y += hr + abre; }
  s += `<rect x="${L + w * 0.01}" y="${y}" width="${w * 0.98}" height="${hb}" rx="${hb / 2}" fill="${C.pan}" stroke="${C.corteza}" stroke-width="${w * 0.014}"/>`;
  return s;
}
// La bolsa kraft con el sello // (dos barras paralelas, dorada y celeste).
function bolsa(cx, cy, w) {
  const h = w * 1.18, x = cx - w / 2, y = cy - h / 2;
  return `<path d="M${x + w * 0.04},${y + h * 0.16} L${x + w * 0.96},${y + h * 0.16} L${x + w},${y + h} L${x},${y + h} Z" fill="${C.kraft}"/>
    <path d="M${x + w * 0.04},${y + h * 0.16} L${x + w * 0.1},${y} L${x + w * 0.9},${y} L${x + w * 0.96},${y + h * 0.16} Z" fill="${C.kraftO}"/>
    <path d="M${x + w * 0.04},${y + h * 0.16} L${x + w * 0.96},${y + h * 0.16}" stroke="#8A6438" stroke-width="${w * 0.02}" stroke-dasharray="${w * 0.04} ${w * 0.03}"/>
    <circle cx="${cx}" cy="${y + h * 0.6}" r="${w * 0.24}" fill="${papel}"/>
    <g transform="translate(${cx},${y + h * 0.6}) skewX(-16)"><rect x="${-w * 0.075}" y="${-w * 0.12}" width="${w * 0.045}" height="${w * 0.24}" rx="2" fill="${S.oro}"/><rect x="${w * 0.03}" y="${-w * 0.12}" width="${w * 0.045}" height="${w * 0.24}" rx="2" fill="${celeste}"/></g>`;
}
// El celular con el sándwich en pantalla y el toque (la espiral de WICHO hecha onda).
function celular(cx, cy, w) {
  const h = w * 1.95, x = cx - w / 2, y = cy - h / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.16}" fill="${W.tinta}"/>
    <rect x="${x + w * 0.06}" y="${y + w * 0.06}" width="${w * 0.88}" height="${h - w * 0.12}" rx="${w * 0.11}" fill="${papel}"/>
    ${sandwich(cx, y + h * 0.36, w * 0.8)}
    <rect x="${x + w * 0.18}" y="${y + h * 0.66}" width="${w * 0.64}" height="${w * 0.17}" rx="${w * 0.085}" fill="${S.verde}"/>
    ${espiral(cx + w * 0.16, y + h * 0.745, w * 0.32, W.lila, w * 0.03)}`;
}
const svg = (dentro) => `<svg class="abs" style="left:0;top:0" width="1080" height="1920">${dentro}</svg>`;
// ════════════════════════════════════════════════════════════════════════════════════════════════
// EL CONCEPTO: «Dos formas de comer SND//WCH». El logo ya lo dice: una cara partida en dos hermanos.
// El perfil entero repite esa partición: el lado de SANDO son los Signatures (ya resueltos, tranquilos,
// su oliva acanalado y su forro) y el lado de WICHO es «arma el tuyo» y cómo pedir (su celeste, sus
// curvas de nivel, su espiral). Dibujados, los hermanos aparecen UNA vez: en el logo de la foto de
// perfil, que acompaña cada publicación, historia y comentario. En el resto salen descompuestos, para
// no competir con la comida, que va siempre limpia y arriba (estilo «Lo que llega»).
// ════════════════════════════════════════════════════════════════════════════════════════════════
const LOGO = img(`${REPO}/img/marca/avatar-1024-transparente.png`);
// Los hermanos, con sus poses oficiales. El WICHO generado el 2026-10-30 se descartó (dueño: «lo
// modificaste demasiado»): una pose nueva tiene que ser el mismo personaje, no uno parecido.
const perfil = caja(1080, 1080, '', `<div class="abs rib" style="left:0;top:0;bottom:0;width:540px;background-color:${S.oliva}"></div>
  <div class="abs" style="right:0;top:0;bottom:0;width:540px;background:${W.pelaje}"></div>
  <div class="full" style="${centrado}"><img src="${LOGO}" style="width:940px;height:940px;position:relative"></div>`);

// Destacados, en el orden en que un cliente nuevo pregunta: cómo pido, ¿cuánto me cobran por traerlo?, qué hay,
// qué tomo. No hay «zonas»: el envío llega a todo Trujillo y se cobra por distancia (reglas.ts, sin límite
// desde el 2026-09-30).
// Destacados (dueño, 2026-10-30: «la de zonas no me convence, además como que falta destacado»). Cinco, en el orden en
// que un cliente nuevo duda: cómo pido, qué hay de la casa, cómo armo el mío, cuánto y cuándo llega, qué tomo. Instagram
// muestra unos cinco sin deslizar. Cada portada es distinta: Envíos ya no repite la cara de SANDO que lleva Carta.
const anillos = (cx, cy, c) => `<svg class="abs" style="left:0;top:0" width="1080" height="1920">${[150, 250, 350, 450].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="${r > 300 ? '18 16' : 'none'}"/>`).join('')}</svg>`;
const DEST = [
  ['pedir', 'Cómo pedir', portada(W.pelaje, `${curvas(1080, 1920, 540, 960, W.curvas, 16, 70, 2)}${svg(celular(540, 960, 380))}`)],
  ['carta', 'Carta', portada(S.oliva, `<div class="full rib"></div>${svg(sandwich(540, 960, 820))}`)],
  ['arma', 'Arma el tuyo', portada(W.tinta, `<div class="full cruz"></div>${curvas(1080, 1920, 540, 960, 'rgba(144,204,240,.22)', 16, 70, 5)}${svg(sandwich(540, 960, 800, { abre: 34 }))}`)],
  ['envios', 'Envíos', portada(S.verde, `<div class="abs" style="left:0;top:0;bottom:0;width:40px;background:${S.forro}"></div>${anillos(540, 960, 'rgba(201,168,124,.40)')}${svg(bolsa(540, 975, 470))}`)],
  // Horario: un reloj en las 11 con el arco hasta las 22, sobre papel (dueño: «Horario como destacado propio»).
  ['horario', 'Horario', portada(papel, svg(`<circle cx="540" cy="960" r="330" fill="none" stroke="${S.tinta}" stroke-width="34"/>
    <path d="M${540 + 270 * Math.cos(-Math.PI / 2 - Math.PI / 6)},${960 + 270 * Math.sin(-Math.PI / 2 - Math.PI / 6)} A270,270 0 1,1 ${540 + 270 * Math.cos(-Math.PI / 2 - Math.PI / 3)},${960 + 270 * Math.sin(-Math.PI / 2 - Math.PI / 3)}" fill="none" stroke="${S.forro}" stroke-width="40" stroke-linecap="round"/>
    ${Array.from({ length: 12 }, (_, k) => `<circle cx="${540 + 300 * Math.cos(k * Math.PI / 6)}" cy="${960 + 300 * Math.sin(k * Math.PI / 6)}" r="9" fill="${S.tinta}"/>`).join('')}
    <path d="M540,960 L${540 + 150 * Math.cos(-Math.PI / 2 - Math.PI / 6)},${960 + 150 * Math.sin(-Math.PI / 2 - Math.PI / 6)}" stroke="${S.tinta}" stroke-width="30" stroke-linecap="round"/>
    <path d="M540,960 L540,720" stroke="${S.tinta}" stroke-width="22" stroke-linecap="round"/><circle cx="540" cy="960" r="26" fill="${S.forro}"/>`))],
  ['bebidas', 'Bebidas', portada(W.lilaO, `${svgEsp(1080, 1920, 540, 960, 520, 'rgba(195,166,210,.35)', 22)}<img src="${img(`${REPO}/docs/marketing/instagram-perfil/final/latas/lata-bloom.png`)}" class="abs" style="left:50%;top:50%;height:860px;transform:translate(-50%,-50%) rotate(-8deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.35))">`)],
];

// El lado de SANDO: cada Signature con la foto limpia arriba y su basta acanalada abajo, con el texto.
// El lado de SANDO: cada Signature, versión C (dueño, 2026-10-30, eligió «C: más cerca» porque «a las fotos de
// sándwich les falta algo» y «falta el poder pedir por WhatsApp»). El sándwich llena el cuadro, el nombre es el
// titular (un nombre descriptivo vende más: Wansink, Painter y van Ittersum, 2001), el momento va debajo, y abajo
// «Pide por WhatsApp» con el número del código (src/app/01-catalogo-y-estado.ts) y el logo oficial como sello.
const WA = (fs.readFileSync(`${REPO}/src/app/01-catalogo-y-estado.ts`, 'utf8').match(/var WA='(\d+)'/) || [])[1];
if (!WA) throw new Error('no encontré el número de WhatsApp en 01-catalogo-y-estado.ts');
const WA_BONITO = WA.replace(/^51/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
const icoWa = (c, t) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M9 8.6c.3-.6.8-.6 1.1 0l.6 1.4c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.4.6c.6.3.6.8 0 1.1-.8.6-1.8.8-2.8.4a8.4 8.4 0 0 1-4.3-4.3c-.4-1-.2-2 .6-2.6z"/></svg>`;
const sello = (t) => `<div style="width:${t}px;height:${t}px;border-radius:999px;background:${papel};display:flex;align-items:center;justify-content:center;flex:none"><img src="${LOGO}" style="width:${t * 0.92}px;height:${t * 0.92}px"></div>`;
// Encuadre de cada foto con el acercamiento: que el pan no toque el borde.
// Las 6 fotos son del de 30 cm partido en dos (4:5): entran casi enteras, con el par de mitades al centro.
const ENCUADRE = { '1-philly': 'center 47%/104%', '4-meatball': 'center 30%/100%', '5-turkey': 'center 50%/100%', '6-tuna-melt': 'center 52%/100%', '7-italian-hoagie': 'center 50%/100%', '8-classic-tuna': 'center 50%/100%' };
const sig = (d) => caja(1080, 1350, `background:${S.oliva}`, `
  <div class="full" style="bottom:430px;background:url('${img(`${FOTOS}/${d.f}`)}') ${ENCUADRE[d.n] || 'center 64%/128%'} auto no-repeat;background-color:#2a2018"></div>
  <div class="abs rib" style="left:0;right:0;bottom:0;height:430px;background-color:${S.oliva}"></div>
  <div class="abs" style="left:84px;right:84px;bottom:52px;height:326px;display:flex;flex-direction:column;color:${papel}">
    <div class="mono" style="font-size:26px;color:${S.tan}">LOS DE LA CASA · ${FOOD.indexOf(d) + 1} DE ${FOOD.length}</div>
    <div class="disp" style="font-size:${tam(d.nombre, 104)}px;margin-top:12px">${d.nombre}</div>
    <div class="voz" style="font-size:42px;line-height:1.1;margin-top:10px">${d.tit} ${d.cita}</div>
    <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:16px">${icoWa(papel, 46)}<span class="mono" style="font-size:28px">PIDE POR WHATSAPP · ${WA_BONITO}</span></div>${sello(96)}</div></div>`);
// La carta: el mundo de SANDO, y la última línea ya es de WICHO (el puente a la publicación de al lado).
const carta = caja(1080, 1350, `background:${S.verde};color:${papel}`, `<div class="abs" style="left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div>
  <div class="abs rib" style="left:26px;right:0;bottom:0;height:150px;background-color:${S.oliva}"></div>
  <img src="${PJ('sando2_ladea')}" class="abs" style="right:40px;bottom:150px;height:500px">
  <div class="abs" style="left:110px;right:84px;top:92px"><div class="mono" style="font-size:26px;color:${S.tan}">LOS DE LA CASA · 15 CM Y 30 CM</div>
    <div style="margin-top:40px">${listaCarta(papel, 96)}</div>
    <div style="display:flex;align-items:center;gap:22px;margin-top:40px"><svg width="70" height="70">${espiral(35, 35, 31, W.lila, 5)}</svg><span class="voz" style="font-size:58px;color:${W.pelaje}">Y el que armas tú →</span></div></div>
  <div class="abs" style="left:110px;right:84px;bottom:46px;display:flex;justify-content:space-between;align-items:center"><div class="mono" style="font-size:26px">${MONO}</div>${marca(papel, 40)}</div>`);
// El lado de WICHO: armar el tuyo. Solo lo que la app ya hace (carta.ts): dos panes, cuatro proteínas
// para armar, verduras y hasta tres salsas incluidas.
const PROT = ['Res', 'Atún', 'Albóndiga', 'Pavo'];
const arma = caja(1080, 1350, `background:${W.pelaje};color:${W.tinta}`, `${curvas(1080, 1350, 880, 1120, W.curvas, 18, 66, 3)}
  <img src="${PJ('wicho2_celebra')}" class="abs" style="right:10px;bottom:110px;height:560px">
  <div class="abs" style="left:96px;top:92px;right:96px">
    <div class="mono" style="font-size:26px">EL OTRO LADO</div>
    <div class="disp" style="font-size:168px;margin-top:30px">Arma<br>el tuyo.</div>
    <div class="voz" style="font-size:52px;margin-top:30px;max-width:600px">Tú decides el pan, la proteína y todo lo que va encima.</div>
    <div style="margin-top:46px;display:flex;flex-direction:column;gap:22px">${[['Pan', 'Classic o Focaccia'], ['Proteína', PROT.join(' · ')], ['Encima', 'verduras y hasta 3 salsas incluidas']].map(([a, b]) => `<div style="display:flex;gap:22px;align-items:center">
      <svg width="58" height="58"><circle cx="29" cy="29" r="29" fill="${W.lilaO}"/>${espiral(29, 29, 22, W.lila, 3.5)}</svg><span class="mono" style="font-size:24px;width:170px">${a.toUpperCase()}</span><span class="voz" style="font-size:40px;max-width:330px">${b}</span></div>`).join('')}</div></div>
  <div class="abs" style="left:96px;right:96px;bottom:56px;display:flex;justify-content:space-between;align-items:center"><div class="mono" style="font-size:26px">${MONO}</div>${marca(W.tinta, 40)}</div>`);
// El Reel «Los seis de la casa» (reel.cjs), al centro de la cuadrícula: su portada es su primer cuadro.
const reel = caja(1080, 1350, `background:url('${img(path.join(OUT, 'reel-portada.jpg'))}') center/cover`, '');

const F = Object.fromEntries(FOOD.map((d) => [d.n, d]));
const laminaArma = (n, titulo, frase, pose, alto) => caja(1080, 1350, `background:${W.pelaje};color:${W.tinta}`, `${curvas(1080, 1350, 880, 1120, W.curvas, 18, 66, n + 3)}
  <img src="${PJ(pose)}" class="abs" style="right:20px;bottom:110px;height:${alto}px">
  <div class="abs" style="left:96px;top:92px;right:96px"><div class="mono" style="font-size:26px">ARMA EL TUYO · ${n} DE 3</div>
    <div class="disp" style="font-size:150px;margin-top:30px">${titulo}</div><div class="voz" style="font-size:56px;margin-top:30px;max-width:640px">${frase}</div></div>
  <div class="abs" style="left:96px;right:96px;bottom:56px;display:flex;justify-content:space-between;align-items:center"><div class="mono" style="font-size:26px">${MONO}</div>${marca(W.tinta, 40)}</div>`);
const CARRUSELES = {
  carta: FOOD.map((d) => sig(d)),
  arma: [
    laminaArma(1, 'El pan.', 'Classic, de miga suave, o Focaccia, con aceite de oliva y sal gruesa.', 'wicho2_rie', 520),
    laminaArma(2, 'La proteína.', PROT.join(', ').replace(/, ([^,]*)$/, ' o $1') + '.', 'wicho_saluda', 560),
    laminaArma(3, 'Lo de encima.', 'Verduras, queso y hasta 3 salsas incluidas. Lo eliges tú.', 'wicho2_come', 580),
  ],
};
// La cuadrícula, de izquierda a derecha y de arriba abajo. Las 3 primeras van fijadas.
const POSTS = [
  { n: '1-philly', html: sig(F['1-philly']), fijada: true, por: 'Fijada 1: el Signature estrella, lo primero que se ve.' },
  { n: '2-carta', html: carta, fijada: true, por: 'Fijada 2: el lado de SANDO, los seis de la casa (carrusel: una lámina por Signature).' },
  { n: '3-arma-el-tuyo', html: arma, fijada: true, por: 'Fijada 3: el lado de WICHO, armar el tuyo.' },
  { n: '4-meatball', html: sig(F['4-meatball']), por: 'La cena.' },
  { n: '5-reel', html: reel, reel: true, por: 'El Reel «Los seis de la casa», al centro: lo que más alcance trae entre gente que no te sigue.' },
  { n: '6-turkey', html: sig(F['5-turkey']), por: 'El almuerzo.' },
  { n: '7-tuna-melt', html: sig(F['6-tuna-melt']), por: 'El antojo de la noche.' },
  { n: '8-italian-hoagie', html: sig(F['7-italian-hoagie']), por: 'El de todo.' },
  { n: '9-classic-tuna', html: sig(F['8-classic-tuna']), por: 'El del escritorio.' },
];
const BIO = ['Sándwiches de pan largo, al estilo americano.', 'Elige uno de la casa o arma el tuyo.', 'A domicilio en todo Trujillo.'];

const ui = `body{background:#fff;font-family:Archivo,sans-serif;color:#0B0B0B}
  .t{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px;font:800 19px Archivo}
  .cab{display:flex;align-items:center;gap:22px;padding:8px 16px}.av{width:86px;height:86px;border-radius:50%;background:url('${img(path.join(OUT, 'foto-de-perfil.jpg'))}') center/cover;flex:none}
  .num{display:flex;flex:1;justify-content:space-around;text-align:center;font:700 16px Archivo}.num span{display:block;font:400 13px Archivo;color:#333}
  .bio{padding:4px 16px 0;font:400 14px/1.35 Archivo}.bio b{font-weight:800}.bio .cat{color:#737373}.bio a{color:#00376B;font-weight:600}
  .bt{display:flex;gap:6px;padding:12px 16px}.bt div{flex:1;height:32px;border-radius:8px;background:#EFEFEF;display:flex;align-items:center;justify-content:center;font:700 13px Archivo}.bt .az{background:#0095F6;color:#fff}
  .hl{display:flex;gap:16px;padding:4px 16px 12px}.h{width:66px;text-align:center;font:400 12px Archivo}
  .h i{display:block;width:66px;height:66px;border-radius:50%;border:1px solid #DBDBDB;padding:3px;margin-bottom:5px}.h i b{display:block;width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center}
  .tabs{display:flex;border-top:1px solid #DBDBDB}.tabs div{flex:1;height:44px;display:flex;align-items:center;justify-content:center}.tabs div:first-child{border-bottom:1.5px solid #0B0B0B}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.g{position:relative;aspect-ratio:3/4;background-size:cover;background-position:center}
  .g svg{position:absolute;top:7px;right:7px;filter:drop-shadow(0 0 2px rgba(0,0,0,.6))}`;
const pin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15 3l6 6-3 1-4 4 1 4-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4 1 4-4z"/></svg>';
const rl = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage();
  const sacar = async (html, w, h, salida) => {
    await pg.setViewportSize({ width: w, height: h });
    const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const faltan = await pg.evaluate(() => ['Anton', 'Archivo', 'IBM Plex Mono', 'Instrument Serif'].filter((f) => ![...document.fonts].some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded')));
    if (faltan.length) throw new Error('faltan fuentes: ' + faltan);
    await captura(pg, salida);
  };
  await sacar(pagina(1080, 1080, perfil), 1080, 1080, path.join(OUT, 'foto-de-perfil.jpg'));
  for (const [k, , html] of DEST) await sacar(pagina(1080, 1920, html), 1080, 1920, path.join(OUT, `destacado-${k}.jpg`));
  for (const p of POSTS) { p.jpg = path.join(OUT, `publicacion-${p.n}.jpg`); await sacar(pagina(1080, 1350, p.html), 1080, 1350, p.jpg); }
  for (const [k, laminas] of Object.entries(CARRUSELES)) for (const [i, html] of laminas.entries()) await sacar(pagina(1080, 1350, html), 1080, 1350, path.join(OUT, `carrusel-${k}-${i + 2}.jpg`));
  const cuerpo = `<div style="width:390px"><div class="t"><span>snd__wch</span><span style="font-weight:400">≡</span></div>
    <div class="cab"><div class="av"></div><div class="num"><div>9<span>publicaciones</span></div><div>—<span>seguidores</span></div><div>—<span>seguidos</span></div></div></div>
    <div class="bio"><b>SND//WCH · Sándwiches a domicilio</b><br><span class="cat">Restaurante de sándwiches</span><br>${BIO.join('<br>')}<br><a>sndwch.app</a></div>
    <div class="bt"><div class="az">Seguir</div><div>Mensaje</div><div>WhatsApp</div></div>
    <div class="hl">${DEST.map(([k, t]) => `<div class="h"><i><b style="background-image:url('${img(path.join(OUT, `destacado-${k}.jpg`))}')"></b></i>${t}</div>`).join('')}</div>
    <div class="tabs"><div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" stroke-width="1.8"><rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></div><div>${rl.replace('#fff', '#737373')}</div><div></div></div>
    <div class="grid">${POSTS.map((p) => `<div class="g" style="background-image:url('${img(p.jpg)}')">${p.fijada ? pin : p.reel ? rl : ''}</div>`).join('')}</div></div>`;
  const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, pagina(390, 1200, cuerpo, ui).replace('html,body{width:390px;height:1200px;overflow:hidden}', 'html,body{width:390px}'));
  await pg.setViewportSize({ width: 390, height: 1200 }); await pg.goto('file://' + tmp, { waitUntil: 'load' });
  const alto = await pg.evaluate(() => document.body.scrollHeight);
  const pg2 = await b.newPage({ viewport: { width: 390, height: alto }, deviceScaleFactor: 2 });
  await pg2.goto('file://' + tmp, { waitUntil: 'load' }); await pg2.evaluate(() => document.fonts.ready);
  await captura(pg2, path.join(OUT, 'perfil-final.jpg'), { fullPage: true });
  fs.rmSync(tmp, { force: true }); await b.close();
  fs.writeFileSync(path.join(OUT, 'orden.json'), JSON.stringify(POSTS.map((p) => ({ n: p.n, por: p.por })), null, 1));
  console.log('listo', OUT);
})();
