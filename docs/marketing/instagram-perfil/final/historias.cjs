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
  { n: '4-meatball', f: 'foto-meatball-lata.jpg', tit: 'Hoy no cocinas.', voz: 'Meatball Marinara. Albóndigas en su propia marinara.', cita: 'Albóndigas en su propia marinara.', nombre: 'Meatball Marinara' },
  { n: '5-turkey', f: 'foto-turkey-v4.jpg', tit: 'El almuerzo que no te tumba la tarde.', voz: 'Turkey. Llena sin pesar.', cita: 'Llena sin pesar.', nombre: 'Turkey' },
  { n: '6-tuna-melt', f: 'foto-tuna-melt.jpg', tit: 'Antojo de algo caliente.', voz: 'Tuna Melt. El cheddar se estira al primer mordisco.', cita: 'El cheddar se estira al primer mordisco.', nombre: 'Tuna Melt' },
  { n: '7-italian-hoagie', f: 'foto-italian-hoagie.jpg', tit: 'Cuando quieres de todo.', voz: 'Italian Hoagie. Cada capa suma y ninguna sobra.', cita: 'Cada capa suma y ninguna sobra.', nombre: 'Italian Hoagie' },
  { n: '8-classic-tuna', f: 'foto-classic-tuna.jpg', tit: 'Se come con una mano.', voz: 'Classic Tuna. Simple y bien hecho.', cita: 'Simple y bien hecho.', nombre: 'Classic Tuna' },
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
// LAS HISTORIAS DE LOS DESTACADOS (2026-10-30). Un destacado se arma con historias publicadas: estas son
// las de cada uno, en 1080 × 1920. Lo importante va entre los 250 px de arriba (nombre de la cuenta) y los 250
// de abajo (la barra para responder). Cada destacado vive en el mundo de su hermano, igual que su portada:
//  · Cómo pedir (WICHO): los 4 pasos, sin «Próximamente» (dueño, 2026-10-30: «Quítale el próximamente, solo
//    las bebidas deben tener el próximamente»). Salen ya.
//  · Envíos (SANDO): todo Trujillo y el envío por distancia. Salen ya.
//  · Carta (SANDO): los seis Signatures. Salen ya.
//  · Bebidas (WICHO): las tres de la casa, en su lata, con «Próximamente»: al abrir salen en botella (dueño,
//    2026-10-24: «Botella al abrir, latas después»), y la etiqueta dice que la lata todavía no llega. Salen ya.
// ════════════════════════════════════════════════════════════════════════════════════════════════
const anillos = (cx, cy, c) => `<svg class="abs" style="left:0;top:0" width="1080" height="1920">${[150, 250, 350, 450].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="${r > 300 ? '18 16' : 'none'}"/>`).join('')}</svg>`;
const LATAS = `${REPO}/docs/marketing/instagram-perfil/final/latas`;
const historia = (fondo, dentro, color = papel) => caja(1080, 1920, `background:${fondo};color:${color}`, dentro);
// «Próximamente»: una píldora junto a la etiqueta, en el color del hermano.
const pronto = (fondo, color) => `<span class="mono" style="font-size:38px;background:${fondo};color:${color};padding:12px 30px;border-radius:999px">PRÓXIMAMENTE</span>`;
const cabeza = (etiqueta, titulo, frase, t = 140, chip = '') => `<div class="abs" style="left:84px;right:84px;top:270px">
  <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap"><span class="mono" style="font-size:30px">${etiqueta}</span>${chip}</div>
  <div class="disp" style="font-size:${t}px;margin-top:22px">${titulo}</div>
  <div class="voz" style="font-size:54px;line-height:1.12;margin-top:24px;max-width:860px">${frase}</div></div>`;

// Cómo pedir, dibujado (sin WICHO): el celular, las dos formas, el pago y la bolsa que llega.
const tarjeta = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="${w * 0.63}" rx="${w * 0.07}" fill="${S.verde}"/><rect x="${x + w * 0.1}" y="${y + w * 0.17}" width="${w * 0.17}" height="${w * 0.13}" rx="${w * 0.02}" fill="${S.oro}"/><rect x="${x + w * 0.1}" y="${y + w * 0.42}" width="${w * 0.55}" height="${w * 0.05}" rx="${w * 0.025}" fill="${papel}" opacity=".7"/>`;
const PASOS_TXT = [
  ['Entras a sndwch.app', 'Desde el celular. No hay nada que descargar.', svg(celular(540, 1350, 330))],
  ['Eliges uno o armas el tuyo', 'Uno de los seis de la casa, o el tuyo desde el pan.', `${svg(`${sandwich(540, 1000, 720)}${sandwich(540, 1490, 720, { abre: 22 })}`)}<div class="abs voz" style="left:0;right:0;top:1150px;text-align:center;font-size:110px;line-height:1">o</div>`],
  ['Pagas con Yape o tarjeta', 'Antes de pagar ves el total, con el envío.', svg(`<g transform="rotate(-8 400 1350)">${celular(400, 1350, 300).replace(/sandwich/g, 'sandwich')}</g><g transform="rotate(10 760 1420)">${tarjeta(600, 1320, 330)}</g>`)],
  ['Te llega a la puerta', 'Armado al momento y directo a tu casa.', svg(`${[0, 1, 2].map((k) => `<path d="M${150 + k * 20},${1260 + k * 90} L${330 + k * 20},${1260 + k * 90}" stroke="${W.tinta}" stroke-width="16" stroke-linecap="round" opacity="${0.5 - k * 0.12}"/>`).join('')}${bolsa(620, 1360, 420)}`)],
];
const pedir = PASOS_TXT.map(([t, f, dibujo], i) => historia(W.pelaje, `${curvas(1080, 1920, 540, 1500, W.curvas, 22, 70, i + 2)}
  ${cabeza(`CÓMO PEDIR · ${i + 1} DE ${PASOS_TXT.length}`, t, f, 132)}${dibujo}`, W.tinta));

// Envíos (SANDO, sin repetir su cara): hasta dónde llega, cuánto cuesta y cuándo. El horario sale de STORE_HOURS
// (_shared/reglas.ts, igual que store_hours en la base).
const HORAS = JSON.parse(fs.readFileSync(`${REPO}/supabase/functions/_shared/reglas.ts`, 'utf8').match(/STORE_HOURS[^=]*=\s*(\[[\s\S]*?\]);/)[1].replace(/\s/g, '').replace(/,\]/g, ']'));
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const abiertos = HORAS.map((h, k) => (h ? k : null)).filter((k) => k !== null);
const cerrados = HORAS.map((h, k) => (h ? null : k)).filter((k) => k !== null);
const hh = (n) => String(n).padStart(2, '0') + ':00';
const unaHora = HORAS.find(Boolean);
// «Martes a domingo» solo si los días abiertos son seguidos a partir del primero después del descanso.
const desde = cerrados.length === 1 ? (cerrados[0] + 1) % 7 : abiertos[0];
const seguidos = abiertos.every((k) => HORAS[k][0] === unaHora[0] && HORAS[k][1] === unaHora[1]);
const tituloHorario = `${DIAS[desde][0].toUpperCase() + DIAS[desde].slice(1)} a ${DIAS[(desde + abiertos.length - 1) % 7]}, ${hh(unaHora[0])} a ${hh(unaHora[1])}.`;
if (!seguidos || cerrados.length !== 1) throw new Error('el horario cambió: revisa la historia de Envíos');
const fondoEnvios = `<div class="abs" style="left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div>`;
const boleta = `<div class="abs" style="left:150px;right:150px;top:1010px;background:${papel};color:${S.tinta};border-radius:20px;padding:56px 60px;display:flex;flex-direction:column;gap:30px;box-shadow:0 30px 60px rgba(0,0,0,.35)">
  ${[['Tu pedido', '✓'], ['Envío', 'según distancia'], ['Total', 'antes de pagar']].map(([a, b], k) => `<div style="display:flex;justify-content:space-between;align-items:baseline;${k === 2 ? `border-top:3px dashed ${S.oliva};padding-top:30px` : ''}"><span class="mono" style="font-size:34px">${a.toUpperCase()}</span><span class="voz" style="font-size:48px">${b}</span></div>`).join('')}</div>`;
const envios = [
  historia(S.verde, `${fondoEnvios}${anillos(540, 1330, 'rgba(201,168,124,.40)')}<div class="abs" style="left:50%;top:1330px;transform:translate(-50%,-62%)">${ico('zonas', S.forro, 300)}</div>
    ${cabeza('ENVÍOS · 1 DE 2', 'Llegamos a todo Trujillo.', 'No hay zonas: si estás en Trujillo, llegamos.')}`),
  historia(S.verde, `${fondoEnvios}${boleta}
    ${cabeza('ENVÍOS · 2 DE 2', 'El envío va por distancia.', 'La app te dice cuánto es antes de pagar. Sin sorpresas.')}`),
];
// Horario, destacado propio (dueño: «Horario como destacado propio»).
const horario = [
  historia(S.verde, `${fondoEnvios}<div class="abs" style="left:110px;right:84px;top:1020px;display:grid;grid-template-columns:repeat(7,1fr);gap:14px">${[1, 2, 3, 4, 5, 6, 0].map((k) => `<div style="height:440px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:26px 0;${HORAS[k] ? `background:${papel};color:${S.tinta}` : `border:4px dashed ${S.tan};color:${S.tan}`}"><span class="mono" style="font-size:30px">${DIAS[k].slice(0, 2).toUpperCase()}</span><span class="mono" style="font-size:26px;writing-mode:vertical-rl;transform:rotate(180deg)">${HORAS[k] ? `${hh(HORAS[k][0])}–${hh(HORAS[k][1])}` : 'DESCANSO'}</span></div>`).join('')}</div>
    ${cabeza('HORARIO', tituloHorario, `Los ${cerrados.map((k) => DIAS[k]).join(' y ')} descansamos.`)}`),
];

const cartaHist = FOOD.map((d, i) => historia(S.oliva, `
  <div class="abs" style="left:0;right:0;top:580px;bottom:0;${foto(d.f, 'center 62%')}"></div>
  <div class="abs rib" style="left:0;right:0;top:0;height:580px;background-color:${S.oliva}"></div>
  <div class="abs" style="left:84px;right:84px;top:250px">
    <div class="mono" style="font-size:28px">LOS DE LA CASA · ${i + 1} DE ${FOOD.length}</div>
    <div class="disp" style="font-size:${tam(d.nombre, 120)}px;margin-top:16px">${d.nombre}</div>
    <div class="voz" style="font-size:50px;line-height:1.1;margin-top:12px">${d.cita}</div></div>`));

// Las bebidas, con el nombre y la primera frase de carta.ts (D06, D07, D08).
const BEB = [
  ['bloom', 'The Bloom', 'Flor de jamaica en infusión con un toque de canela, bien helada.'],
  ['cold-brew', 'Cold Brew Tea', 'Té negro de hoja entera, reposado doce horas en frío.'],
  ['cool', 'The Cool', 'Hierba luisa y menta fresca en infusión helada.'],
];
const bebidas = BEB.map(([f, n, d], i) => historia(W.lilaO, `${svgEsp(1080, 1920, 540, 1180, 640, 'rgba(195,166,210,.22)', 26)}
  ${cabeza(`BEBIDAS DE LA CASA · ${i + 1} DE ${BEB.length}`, n, d, 132, pronto(W.lila, W.lilaO))}
  <img src="${img(`${LATAS}/lata-${f}.png`)}" class="abs" style="left:50%;transform:translateX(-50%);bottom:250px;height:880px;filter:drop-shadow(0 30px 40px rgba(0,0,0,.35))">`));


// Arma el tuyo (WICHO, en su tinta para no confundirse con Cómo pedir): pan, proteína y lo de encima.
// El pan: el Classic largo y la Focaccia, dibujados (B01 y B03 de carta.ts).
const panes = `${svg(`
  <path d="M170,1150 Q170,1040 300,1030 L780,1030 Q910,1040 910,1150 Q910,1230 780,1235 L300,1235 Q170,1230 170,1150 Z" fill="${C.pan}" stroke="${C.corteza}" stroke-width="12"/>
  ${[330, 470, 610, 750].map((x) => `<path d="M${x - 50},1080 q50,-30 100,0" fill="none" stroke="${C.corteza}" stroke-width="10" stroke-linecap="round"/>`).join('')}
  <rect x="240" y="1390" width="600" height="250" rx="46" fill="${C.pan}" stroke="${C.corteza}" stroke-width="12"/>
  ${Array.from({ length: 15 }, (_, k) => `<circle cx="${300 + (k % 5) * 120}" cy="${1440 + Math.floor(k / 5) * 75}" r="17" fill="${C.corteza}" opacity=".55"/>`).join('')}
  ${Array.from({ length: 22 }, (_, k) => `<circle cx="${280 + ((k * 137) % 520)}" cy="${1420 + ((k * 61) % 190)}" r="5" fill="#fff"/>`).join('')}`)}
  <div class="abs mono" style="left:0;right:0;top:1265px;text-align:center;font-size:34px">CLASSIC</div>
  <div class="abs mono" style="left:0;right:0;top:1670px;text-align:center;font-size:34px">FOCACCIA</div>`;
// La proteína: cuatro capas con su nombre, las que la app deja armar.
const PROT = ['Res', 'Atún', 'Albóndiga', 'Pavo'];
const colProt = { Res: C.carne, 'Atún': '#CDB894', 'Albóndiga': '#8A3F2C', Pavo: '#EAC9B2' };
const proteinas = svg(PROT.map((n, k) => `<rect x="170" y="${1000 + k * 170}" width="740" height="120" rx="56" fill="${colProt[n]}"/>
  <text x="540" y="${1000 + k * 170 + 76}" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="40" letter-spacing="3" fill="${n === 'Pavo' || n === 'Atún' ? W.tinta : papel}">${n.toUpperCase()}</text>`).join(''));
// Lo de encima: el sándwich abierto y tres gotas de salsa.
const gota = (x, y, c) => `<path d="M${x},${y} C${x + 34},${y + 50} ${x + 40},${y + 80} ${x},${y + 96} C${x - 40},${y + 80} ${x - 34},${y + 50} ${x},${y} Z" fill="${c}"/>`;
const encima = svg(`${sandwich(470, 1330, 640, { abre: 30, rellenos: ['lechuga', 'tomate', 'cebolla', 'queso'] })}${gota(870, 1120, '#F4E3B5')}${gota(870, 1270, '#C9772F')}${gota(870, 1420, '#7FA650')}`);
const ARMA = [
  ['El pan.', 'Classic, de miga suave, o Focaccia, con aceite de oliva y sal gruesa.', panes],
  ['La proteína.', PROT.join(', ').replace(/, ([^,]*)$/, ' o $1') + '.', proteinas],
  ['Lo de encima.', 'Verduras, queso y hasta 3 salsas incluidas. Lo eliges tú.', encima],
];
const armaHist = ARMA.map(([t, f, dibujo], i) => historia(W.tinta, `<div class="full cruz"></div>${curvas(1080, 1920, 540, 1500, 'rgba(144,204,240,.20)', 22, 70, i + 7)}
  ${cabeza(`ARMA EL TUYO · ${i + 1} DE ${ARMA.length}`, t, f, 150)}${dibujo}`, papel));
const HISTORIAS = { 'como-pedir': pedir, carta: cartaHist, arma: armaHist, envios, horario, bebidas };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const dir = path.join(OUT, 'historias'); fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(OUT, '.hist.html');
  for (const [k, cuadros] of Object.entries(HISTORIAS)) for (const [i, html] of cuadros.entries()) {
    fs.writeFileSync(tmp, pagina(1080, 1920, html));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    await pg.screenshot({ path: path.join(dir, `historia-${k}-${i + 1}.jpg`), type: 'jpeg', quality: 92 });
  }
  fs.rmSync(tmp, { force: true }); await b.close();
  console.log('historias', Object.entries(HISTORIAS).map(([k, v]) => `${k}: ${v.length}`).join(' · '));
})();
