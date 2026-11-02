// SND//WCH — piezas/etiquetas-latas: los stickers de las cinco latas para la imprenta (2026-11-02,
// docs/marketing/latas/). Dueño: «guarda los diseños de etiquetas, etc. y guárdalo en el repo a
// detalle todo sobre las bebidas».
//
// Los diseños originales (24 de octubre) se perdieron con el contenedor; estos se rehacen midiendo
// las latas aprobadas en alta (docs/marketing/instagram-perfil/final/latas/), a 19 px por mm.
//
//   frente   66 × 110 mm   vinilo TRANSPARENTE impreso en crema (en The Cool, tinta oscura): el color
//                          de la lata es la bebida (BEBIDAS_PRODUCTO.md §15)
//   atrás    42 × 62 mm    mismo vinilo: lo legal, el QR y «¿Otra? Pídela con tu sándwich.» (§22)
//   tapa     Ø 36 mm       sello: «AGÍTALA» con flechas y el espacio para la etiquetadora (hecha ·
//                          vence · lote) (§21, §22)
//
// Lo legal que falta (razón social, RUC, dirección, registro sanitario e ingredientes de la fórmula
// final) NO se inventa: sale entre corchetes hasta que el dueño lo dé (PENDIENTE_DEL_DUENO P65).
// Se llena en LEGAL, abajo, y se vuelve a correr.
//
// Cada pieza sale en PDF (vectorial, a medida; el frente y el atrás sin fondo porque el vinilo es
// transparente) y en PNG sobre el color de su bebida para verla. Más la hoja A3 con todo y su línea
// de corte, y una lámina de vista.
//
// Uso: FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node scripts/piezas/etiquetas-latas.mjs
// Necesita `npm install --no-save qrcode@1.5.4` (igual que stickers.mjs).
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [OUT = 'docs/marketing/latas/etiquetas'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const CREMA = '#F4EEE2', OSCURA = '#1C2920', ORO = '#CBA258', CELESTE = '#8CC8EC', CORTE = '#E6007E';
// El color de cada bebida, tomado de su lata (solo para la vista: el vinilo no lleva fondo).
const LATAS = [
  { id: 'bloom', nombre: 'BLOOM', sabor: 'Hibiscus', icono: 'flor', tinta: CREMA, liquido: '#7F0D31' },
  { id: 'cold-brew', nombre: 'COLD BREW TEA', sabor: 'Té negro', icono: 'brote', tinta: CREMA, liquido: '#441C0B' },
  { id: 'cool', nombre: 'COOL', sabor: 'Hierba luisa y menta', icono: 'rama', tinta: OSCURA, liquido: '#BFB662' },
  { id: 'lemon-tea', nombre: 'LEMON TEA', sabor: 'Té negro y limón', icono: 'limon', tinta: CREMA, liquido: '#AD5E13' },
  { id: 'chai', nombre: 'CHAI', sabor: 'Especiado y aromático', icono: 'anis', tinta: CREMA, liquido: '#772612' },
];
// Lo legal: lo que no se sabe va entre corchetes. Nunca se inventa (CLAUDE.md, restricciones).
const LEGAL = {
  razonSocial: '[razón social]', ruc: '[RUC]', direccion: '[dirección]', registro: '[pendiente]',
  ingredientes: {
    bloom: '[de la fórmula final, de mayor a menor]', 'cold-brew': '[de la fórmula final, de mayor a menor]',
    cool: '[de la fórmula final, de mayor a menor]', 'lemon-tea': '[de la fórmula final, de mayor a menor]',
    chai: '[de la fórmula final, de mayor a menor]',
  },
};
const URL_LATA = 'https://sndwch.app/?src=lata';

// Íconos de línea (viewBox 100), el mismo trazo que la flor y la hoja de las latas aprobadas.
const ICONOS = {
  flor: [0, 1, 2, 3, 4].map((i) => `<path transform="rotate(${72 * i} 50 50)" d="M50 44 C38 36 34 18 42 10 C46 6 54 6 58 10 C66 18 62 36 50 44 Z"/>`).join('') + '<circle cx="50" cy="50" r="6"/>',
  brote: '<path d="M28 94 L66 22"/><path d="M47 58 C30 60 16 52 12 38 C28 34 42 42 47 58 Z"/><path d="M47 58 L22 44"/>'
    + '<path d="M58 38 C50 26 52 10 62 4 C70 16 68 30 58 38 Z"/><path d="M58 38 L62 8"/><path d="M62 30 C72 20 86 18 94 24 C86 36 72 38 62 30 Z"/><path d="M62 30 L90 24"/>',
  rama: '<path d="M50 96 L50 18"/><path d="M50 24 C40 16 40 4 50 -2 C60 4 60 16 50 24 Z" transform="translate(0 6)"/>'
    + '<path d="M50 56 C36 58 22 50 18 36 C34 32 46 42 50 56 Z"/><path d="M50 56 C64 58 78 50 82 36 C66 32 54 42 50 56 Z"/>'
    + '<path d="M50 78 C38 80 26 74 22 62 C36 58 46 66 50 78 Z"/><path d="M50 78 C62 80 74 74 78 62 C64 58 54 66 50 78 Z"/>',
  limon: '<circle cx="50" cy="50" r="43"/><circle cx="50" cy="50" r="33"/>' + [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i * 60 + 30) * Math.PI / 180;
    return `<line x1="${(50 + 7 * Math.cos(a)).toFixed(1)}" y1="${(50 + 7 * Math.sin(a)).toFixed(1)}" x2="${(50 + 28 * Math.cos(a)).toFixed(1)}" y2="${(50 + 28 * Math.sin(a)).toFixed(1)}"/>`;
  }).join(''),
  anis: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path transform="rotate(${45 * i} 50 50)" d="M50 44 Q59 26 50 6 Q41 26 50 44 Z"/>`).join('') + '<circle cx="50" cy="50" r="5"/>',
};

const qrPath = async (url) => {
  const s = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'Q' });
  const n = Number(s.match(/viewBox="0 0 (\d+) \d+"/)[1]);
  const d = [...s.matchAll(/<path[^>]*stroke="[^"]+"[^>]*d="([^"]+)"/g)].map((m) => m[1]).join(' ')
    || s.match(/<path[^>]*d="([^"]+)"[^>]*stroke=/)[1];
  return { n, d };
};

// ── El diseño, en el navegador: mide la tinta de cada texto (canvas) y lo coloca exacto en mm ──
// Medidas del frente sacadas de la lata de Cold Brew Tea en alta (19 px por mm, borde de arriba
// del sticker en y = 252): ver docs/marketing/latas/README.md.
const PAGINA = String.raw`
const CREMA='${CREMA}', ORO='${ORO}', CELESTE='${CELESTE}';
const cv=document.createElement('canvas').getContext('2d');
// métrica de tinta a 100 px: l, r (a los lados del origen), a (arriba de la línea base), d (abajo)
function met(txt, fuente, ls=0){ cv.font=(fuente[0]?fuente[0]+' ':'')+'100px '+fuente[1]; cv.letterSpacing=ls+'px'; const m=cv.measureText(txt);
  return {l:m.actualBoundingBoxLeft, r:m.actualBoundingBoxRight, a:m.actualBoundingBoxAscent, d:m.actualBoundingBoxDescent}; }
// [estilo y peso, familia]: el canvas exige el peso ANTES del tamaño, si no cae a otra letra sin avisar
const F = { anton:['','Anton'], mono:['500','"IBM Plex Mono"'], bodoni:['700','"Bodoni Moda"'], serif:['italic','"Instrument Serif"'], archivo:['','Archivo'] };
const CSSF = { anton:'font-family:Anton', mono:'font-family:IBM Plex Mono;font-weight:500', bodoni:'font-family:Bodoni Moda;font-weight:700',
  serif:'font-family:Instrument Serif;font-style:italic', archivo:'font-family:Archivo;font-weight:400' };
const esc = (t) => t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
// texto horizontal centrado en cx con la línea base en y; alto de mayúscula 'cap' y ancho de tinta 'ancho' (mm)
function lineaH(txt, f, cx, y, cap, ancho, color){
  const H=met('H',F[f]).a/100, s=cap/H, m0=met(txt,F[f]); const w0=(m0.l+m0.r)*s/100;
  const ls = ancho ? (ancho-w0)/(txt.length-1) : 0; const m=met(txt,F[f],ls*100/s);
  const x = cx - ((m.r - m.l)*s/100)/2;
  return '<text x="'+x.toFixed(3)+'" y="'+y.toFixed(3)+'" font-size="'+s.toFixed(3)+'" letter-spacing="'+ls.toFixed(3)+'" fill="'+color+'" style="'+CSSF[f]+'">'+esc(txt)+'</text>';
}
// texto girado (se lee de abajo hacia arriba): la tinta empieza en x = xa (izquierda) y su centro va en yc
function lineaV(txt, f, xa, yc, s, lsEm, color){
  const m=met(txt,F[f],lsEm*100); const k=s/100;
  const X = xa + m.a*k, Y = yc + (m.r - m.l)*k/2;
  return { svg:'<text transform="translate('+X.toFixed(3)+' '+Y.toFixed(3)+') rotate(-90)" font-size="'+s.toFixed(3)+'" letter-spacing="'+(lsEm*s).toFixed(3)+'" fill="'+color+'" style="'+CSSF[f]+'">'+esc(txt)+'</text>',
           ancho:(m.a+m.d)*k, largo:(m.l+m.r)*k };
}
function regla(x0, x1, y, color, g=0.18){ return '<line x1="'+x0+'" x2="'+x1+'" y1="'+y+'" y2="'+y+'" stroke="'+color+'" stroke-width="'+g+'" stroke-linecap="round"/>'; }
// el wordmark: SND + las dos barras (dorada y celeste, iguales y paralelas) + WCH
function marca(cx, base, cap, color){
  const H=met('H',F.bodoni).a/100, s=cap/H, mS=met('SND',F.bodoni), mW=met('WCH',F.bodoni), k=s/100;
  const wS=(mS.l+mS.r)*k, wW=(mW.l+mW.r)*k, b=0.10*s, g=0.16*s, mg=0.10*s, alto=0.88*s;
  const total=wS+mg+b+g+b+mg+wW; let x=cx-total/2;
  let o='<text x="'+(x+mS.l*k).toFixed(3)+'" y="'+base+'" font-size="'+s.toFixed(3)+'" fill="'+color+'" style="'+CSSF.bodoni+'">SND</text>';
  x+=wS+mg; const y0=base-cap-(alto-cap)/2;
  for (const [i,c] of [[0,ORO],[1,CELESTE]]) { const xb=x+i*(b+g);
    o+='<rect x="'+xb.toFixed(3)+'" y="'+y0.toFixed(3)+'" width="'+b.toFixed(3)+'" height="'+alto.toFixed(3)+'" rx="'+(b*0.1).toFixed(3)+'" fill="'+c+'" transform="translate('+(Math.tan(16*Math.PI/180)*(y0+alto/2)).toFixed(3)+' 0) skewX(-16)"/>'; }
  x+=2*b+g+mg; o+='<text x="'+(x+mW.l*k).toFixed(3)+'" y="'+base+'" font-size="'+s.toFixed(3)+'" fill="'+color+'" style="'+CSSF.bodoni+'">WCH</text>';
  return o;
}
function frente(L, ICONO){
  const t=L.tinta; let o='';
  o+=marca(33, 11.4, 4.8, t);
  o+=regla(15.8, 50.2, 14.55, t);
  o+=lineaH('CERO AZÚCAR','mono',33,19.3,2.2,31.4,t);
  o+=regla(15.8, 50.2, 21.66, t);
  // el bloque del medio: frase en mono · nombre · sabor (e ícono), centrado en x = 35.4
  const H=met('H',F.anton); const mN=met(L.nombre,F.anton);
  const sN=Math.min(62*100/(mN.l+mN.r), 22.4*100/H.a);
  const mono0=met('AGÍTALA Y ACTIVA LA MAGIA',F.mono,0); const sM=2.37;
  const lsM=(55.1 - (mono0.l+mono0.r)*sM/100)/24/sM;
  let sS=5.32; const lsS=0.12; const mS=met(L.sabor,F.serif,lsS*100); if ((mS.l+mS.r)*sS/100>49.2) sS=49.2*100/(mS.l+mS.r);
  const anM=(mono0.a+mono0.d)*sM/100, anN=(mN.a+mN.d)*sN/100, anS=(mS.a+mS.d)*sS/100;
  const total=anM+2.5+anN+2.16+anS; let x=35.4-total/2;
  const vM=lineaV('AGÍTALA Y ACTIVA LA MAGIA','mono',x,57.2,sM,lsM,t); o+=vM.svg; x+=anM+2.5;
  const vN=lineaV(L.nombre,'anton',x,57.1,sN,0,t); o+=vN.svg; const xNfin=x+anN; x+=anN+2.16;
  const vS=lineaV(L.sabor,'serif',x,63.7,sS,lsS,t); o+=vS.svg;
  const ti=8.7; o+='<svg x="'+(xNfin+0.95).toFixed(3)+'" y="'+(31.5-ti/2).toFixed(3)+'" width="'+ti+'" height="'+ti+'" viewBox="0 0 100 100" overflow="visible" fill="none" stroke="'+t+'" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">'+ICONO+'</svg>';
  o+=regla(15.8, 50.2, 91.3, t);
  o+=lineaH('SABOR 100% NATURAL','mono',33,95.7,1.6,34.3,t);
  o+=regla(15.8, 50.2, 98.4, t);
  o+=lineaH('REPOSADA EN FRÍO · 355 ML','mono',33,103.3,1.5,43.5,t);
  return o;
}
`;

const BASE = '*{box-sizing:border-box;margin:0;padding:0}body{-webkit-font-smoothing:antialiased}';
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : { executablePath: '/opt/pw-browsers/chromium' });
const fuentes = readFileSync(process.env.FUENTES_CSS, 'utf8');
const MM = 96 / 25.4;
const cargar = async (p) => {
  await p.addStyleTag({ content: fuentes });
  await p.evaluate(async () => { await Promise.all(['400 10px Anton', '400 10px Archivo', '800 10px Archivo', '700 10px "Bodoni Moda"', '500 10px "IBM Plex Mono"', '600 10px "IBM Plex Mono"', 'italic 400 10px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
};

// Cada pieza: un SVG en mm armado por el navegador. `vista` = fondo de color solo para el PNG.
async function pieza(archivo, w, h, armar, vista, conFondoEnPdf = false) {
  const tmp = resolve(OUT, `.${archivo}.html`);
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${w}mm;height:${h}mm;overflow:hidden;background:transparent}@page{size:${w}mm ${h}mm;margin:0}</style></head><body><div id="v" style="position:relative;width:${w}mm;height:${h}mm;overflow:hidden"></div></body></html>`);
  const p = await b.newPage({ viewport: { width: Math.ceil(w * MM), height: Math.ceil(h * MM) }, deviceScaleFactor: 6 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.addScriptTag({ content: PAGINA });
  await p.evaluate(armar.fn, armar.arg);
  if (conFondoEnPdf) await p.evaluate((c) => { document.getElementById('v').style.background = c; }, vista);
  await p.pdf({ path: `${OUT}/${archivo}.pdf`, width: `${w}mm`, height: `${h}mm`, printBackground: true, pageRanges: '1' });
  await p.evaluate((c) => { document.getElementById('v').style.background = c; }, vista);
  await p.screenshot({ path: `${OUT}/${archivo}.png`, clip: { x: 0, y: 0, width: w * MM, height: h * MM } });
  await p.close(); rmSync(tmp);
}

// ── 1 · Frentes ──────────────────────────────────────────────────────────────────────────────
for (const L of LATAS) {
  await pieza(`frente-${L.id}`, 66, 110, {
    fn: ({ L, ICONO }) => { document.getElementById('v').innerHTML = '<svg width="66mm" height="110mm" viewBox="0 0 66 110">' + frente(L, ICONO) + '</svg>'; },
    arg: { L, ICONO: ICONOS[L.icono] },
  }, L.liquido);
}

// ── 2 · Atrás 42 × 62 mm: la marca, la bebida, lo legal y el QR ───────────────────────────────
const QR = await qrPath(URL_LATA);
for (const L of LATAS) {
  const ing = LEGAL.ingredientes[L.id];
  await pieza(`atras-${L.id}`, 42, 62, {
    fn: ({ L, ing, LEGAL, QR }) => {
      const t = L.tinta, oscura = t !== CREMA;
      let s = marca(21, 5.4, 2.3, t) + regla(6, 36, 7.4, t, 0.15);
      s += lineaH(L.nombre, 'anton', 21, 13.0, 4.2, 0, t);
      s += lineaH(L.sabor, 'serif', 21, 16.9, 2.0, 0, t);
      s += regla(6, 36, 18.7, t, 0.15);
      // el QR: en tinta oscura sobre el líquido claro; en crema, una placa con los módulos calados
      const lado = 11.5, q = lado / QR.n, qx = 4.6, qy = 45.2;
      if (oscura) s += '<g transform="translate(' + qx + ' ' + qy + ') scale(' + q + ')"><path d="' + QR.d + '" stroke="' + t + '" fill="none"/></g>';
      else s += '<defs><mask id="m"><rect x="' + (qx - 1.1) + '" y="' + (qy - 1.1) + '" width="' + (lado + 2.2) + '" height="' + (lado + 2.2) + '" fill="#fff"/><g transform="translate(' + qx + ' ' + qy + ') scale(' + q + ')"><path d="' + QR.d + '" stroke="#000" fill="none"/></g></mask></defs>'
        + '<rect x="' + (qx - 1.1) + '" y="' + (qy - 1.1) + '" width="' + (lado + 2.2) + '" height="' + (lado + 2.2) + '" rx="0.8" fill="' + t + '" mask="url(#m)"/>';
      const legal = '<div style="position:absolute;left:4mm;top:20.4mm;width:34mm;font:400 1.8mm/1.3 Archivo,sans-serif;color:' + t + '">'
        + '<b style="font-weight:800">Ingredientes:</b> ' + esc(ing) + '.<br>'
        + '<b style="font-weight:800">Contenido neto:</b> 355 ml.<br>'
        + 'Mantener refrigerado. Agítala antes de abrir.<br>'
        + 'Fecha de producción, vencimiento y lote: en la tapa.<br>'
        + 'Reg. San. DIGESA: ' + esc(LEGAL.registro) + '.<br>'
        + 'Elaborado por ' + esc(LEGAL.razonSocial) + ' · RUC ' + esc(LEGAL.ruc) + ' · ' + esc(LEGAL.direccion) + '.</div>';
      const pide = '<div style="position:absolute;left:19.6mm;top:44.6mm;width:19mm;color:' + t + '">'
        + '<div style="font-family:Instrument Serif;font-style:italic;font-size:3.5mm;line-height:1.02">¿Otra? Pídela con tu sándwich.</div>'
        + '<div style="font:500 1.9mm/1 IBM Plex Mono;letter-spacing:.12em;margin-top:1.6mm">SNDWCH.APP</div></div>';
      document.getElementById('v').innerHTML = '<svg style="position:absolute;inset:0" width="42mm" height="62mm" viewBox="0 0 42 62">' + s + '</svg>' + legal + pide;
    },
    arg: { L, ing, LEGAL, QR },
  }, L.liquido);
}

// ── 3 · Tapa Ø 36 mm (+3 mm de sangrado): «AGÍTALA», las flechas y la etiquetadora ──────────────
const TINTA_TAPA = '#241C10';
await pieza('tapa', 42, 42, {
  fn: ({ TT }) => {
    const c = 21; // centro, con 3 mm de sangrado
    let s = '<rect width="42" height="42" fill="' + CREMA + '"/>';
    s += '<circle cx="' + c + '" cy="' + c + '" r="16.3" fill="none" stroke="' + ORO + '" stroke-width="0.35"/>';
    s += lineaH('AGÍTALA', 'anton', c, 19.2, 5.6, 0, TT);
    // dos flechas curvas, una a cada lado y en sentidos opuestos: el gesto de agitar
    const cy = 16.4, r = 11.9;
    const flecha = (deA, aA) => {
      const P = (g) => [c + r * Math.cos(g * Math.PI / 180), cy + r * Math.sin(g * Math.PI / 180)];
      const [x0, y0] = P(deA), [x1, y1] = P(aA), barre = aA > deA ? 1 : 0;
      // la punta: dos trazos a ±32° de la tangente en el extremo
      const tg = (aA + (aA > deA ? 90 : -90)) * Math.PI / 180, k = 1.5;
      const pa = (d) => [x1 - k * Math.cos(tg + d), y1 - k * Math.sin(tg + d)];
      const [ax, ay] = pa(0.56), [bx, by] = pa(-0.56);
      return '<path d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 0 ' + barre + ' ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + '" fill="none" stroke="' + TT + '" stroke-width="0.6" stroke-linecap="round"/>'
        + '<path d="M' + ax.toFixed(2) + ' ' + ay.toFixed(2) + ' L' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' L' + bx.toFixed(2) + ' ' + by.toFixed(2) + '" fill="none" stroke="' + TT + '" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/>';
    };
    s += flecha(150, 210) + flecha(-30, 30);
    // el espacio para la etiqueta de la etiquetadora
    s += lineaH('HECHA · VENCE · LOTE', 'mono', c, 23.3, 1.05, 0, TT);
    s += '<rect x="' + (c - 11) + '" y="24.4" width="22" height="6.2" rx="1" fill="none" stroke="' + TT + '" stroke-width="0.25" stroke-dasharray="0.8 0.6"/>';
    s += marca(c, 9.4, 1.9, TT);
    document.getElementById('v').innerHTML = '<svg width="42mm" height="42mm" viewBox="0 0 42 42">' + s + '</svg>';
  },
  arg: { TT: TINTA_TAPA },
}, CREMA, true);

// ── 4 · La hoja A3 para la imprenta: todo a escala real con su línea de corte ─────────────────
{
  const W = 297, H = 420, g = 8;
  const pos = [];
  LATAS.slice(0, 4).forEach((L, i) => pos.push({ f: `frente-${L.id}`, x: 12 + i * (66 + g), y: 20, w: 66, h: 110 }));
  pos.push({ f: `frente-${LATAS[4].id}`, x: 12, y: 20 + 110 + g + 6, w: 66, h: 110 });
  LATAS.forEach((L, i) => pos.push({ f: `atras-${L.id}`, x: 12 + 66 + g + (i % 4) * (42 + g), y: 20 + 110 + g + 6 + Math.floor(i / 4) * (62 + g), w: 42, h: 62 }));
  for (let i = 0; i < 6; i++) pos.push({ f: 'tapa', x: 12 + i * (36 + g + 2), y: 20 + 2 * (110 + g) + 26 + 12, w: 36, h: 36, circ: true });
  const tmp = resolve(OUT, '.hoja.html');
  const piezasHtml = pos.map((p) => {
    const img = 'file://' + resolve(OUT, `${p.f}.png`);
    const sang = p.circ ? 3 : 0;
    return `<div style="position:absolute;left:${p.x}mm;top:${p.y}mm;width:${p.w}mm;height:${p.h}mm;${p.circ ? 'border-radius:50%;' : ''}overflow:hidden;outline:0.15mm solid ${CORTE};${p.circ ? 'outline:none;box-shadow:0 0 0 0.15mm ' + CORTE + ';' : ''}">
      <img src="${img}" style="position:absolute;left:${-sang}mm;top:${-sang}mm;width:${p.w + 2 * sang}mm;height:${p.h + 2 * sang}mm"></div>`;
  }).join('');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${W}mm;height:${H}mm;overflow:hidden;background:#fff}@page{size:${W}mm ${H}mm;margin:0}</style></head><body>
    <div style="position:absolute;left:12mm;top:8mm;font:600 3mm/1 'IBM Plex Mono';letter-spacing:.06em;color:#333">SND//WCH · STICKERS DE LAS LATAS · A3 A ESCALA REAL · <span style="color:${CORTE}">MAGENTA = LÍNEA DE CORTE (NO SE IMPRIME)</span></div>
    ${piezasHtml}
    <div style="position:absolute;left:12mm;top:395mm;width:270mm;font:400 3.2mm/1.45 Archivo;color:#333">
      <b>Frente</b> 66 × 110 mm y <b>atrás</b> 42 × 62 mm: vinilo transparente; se imprime solo la tinta (crema; en Cool, verde oscuro) y las dos barras del logo (dorada ${ORO} y celeste ${CELESTE}). El color de fondo de esta hoja es la bebida, para que se vea: no se imprime.
      <b>Tapa</b> Ø 36 mm: adhesivo crema a todo color, con 3 mm de sangrado. Los PDF sueltos de cada pieza están en la misma carpeta.</div>
  </body></html>`);
  const p = await b.newPage({ viewport: { width: Math.ceil(W * MM), height: Math.ceil(H * MM) }, deviceScaleFactor: 2 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.pdf({ path: `${OUT}/hoja-a3.pdf`, width: `${W}mm`, height: `${H}mm`, printBackground: true, pageRanges: '1' });
  await p.screenshot({ path: `${OUT}/hoja-a3.png` });
  await p.close(); rmSync(tmp);
}
await b.close();
console.log('listo', OUT);
