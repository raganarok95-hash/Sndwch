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
const LATAS = `${REPO}/docs/marketing/instagram-perfil/final/latas`;
const historia = (fondo, dentro, color = papel) => caja(1080, 1920, `background:${fondo};color:${color}`, dentro);
// «Próximamente»: una píldora junto a la etiqueta, en el color del hermano.
const pronto = (fondo, color) => `<span class="mono" style="font-size:38px;background:${fondo};color:${color};padding:12px 30px;border-radius:999px">PRÓXIMAMENTE</span>`;
const cabeza = (etiqueta, titulo, frase, t = 140, chip = '') => `<div class="abs" style="left:84px;right:84px;top:270px">
  <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap"><span class="mono" style="font-size:30px">${etiqueta}</span>${chip}</div>
  <div class="disp" style="font-size:${t}px;margin-top:22px">${titulo}</div>
  <div class="voz" style="font-size:54px;line-height:1.12;margin-top:24px;max-width:860px">${frase}</div></div>`;

const PASOS_TXT = [
  // Cada pose, una vez y anclada al borde por donde viene cortada (grita, por abajo; pulgar, por la derecha).
  ['Entras a sndwch.app', 'Desde el celular. No hay nada que descargar.', 'wicho_saluda', 'left:50%;transform:translateX(-50%);bottom:250px;height:760px'],
  ['Eliges uno o armas el tuyo', 'Uno de los seis de la casa, o el tuyo desde el pan.', 'wicho_grita', 'left:50%;transform:translateX(-50%);bottom:0;height:860px'],
  ['Pagas con Yape o tarjeta', 'Antes de pagar ves el total, con el envío.', 'wicho_pulgar', 'right:0;bottom:330px;height:540px'],
  ['Te llega a la puerta', 'Armado al momento y directo a tu casa.', 'wicho2_come', 'left:50%;transform:translateX(-50%);bottom:250px;height:760px'],
];
const pedir = PASOS_TXT.map(([t, f, pose, donde], i) => historia(W.pelaje, `${curvas(1080, 1920, 540, 1500, W.curvas, 22, 70, i + 2)}
  ${cabeza(`CÓMO PEDIR · ${i + 1} DE ${PASOS_TXT.length}`, t, f, 132)}
  <img src="${PJ(pose)}" class="abs" style="${donde}">`, W.tinta));

const envios = [
  historia(S.verde, `<div class="abs" style="left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div>
    ${cabeza('ENVÍOS', 'Llegamos a todo Trujillo.', 'No hay zonas: si estás en Trujillo, llegamos.')}
    <img src="${PJ('sando2_asoma')}" class="abs" style="left:26px;bottom:0;height:1080px">`),
  historia(S.verde, `<div class="abs" style="left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div>
    ${cabeza('ENVÍOS', 'El envío se calcula por distancia.', 'La app te dice cuánto es antes de pagar.')}
    <img src="${PJ('sando2_pulgar')}" class="abs" style="left:0;bottom:320px;height:620px">`),
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

const HISTORIAS = { 'como-pedir': pedir, envios, carta: cartaHist, bebidas };

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
