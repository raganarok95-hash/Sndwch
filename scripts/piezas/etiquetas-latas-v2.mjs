// SND//WCH — piezas/etiquetas-latas-v2: PROPUESTA (maqueta) de mejora de los stickers de las latas
// (2026-11-02, docs/marketing/latas/PROPUESTA_V2.md). No reemplaza a etiquetas-latas.mjs hasta que el
// dueño elija. Cambios frente a la v1:
//   frente  · el contenido neto «355 ML» en la cara principal con cifras de 4 mm; «·» pasa a «//»;
//             crema y verde de la paleta (#F2F0EB, #1E3932)
//   atrás   · 56 × 100 mm (la v1 de 42 × 62 no deja espacio para la tabla nutricional); una placa
//             crema con texto verde, igual en las cinco (se lee en todas, también en Lemon Tea);
//             el nombre igual que el frente; ingredientes con su INS; tabla nutricional por 100 ml y
//             por lata; «Hecho en Perú»; el lema «Para los que no se conforman //»
//   tapa    · verde de la marca; el aro con el nombre y «//»; «HECHA / VENCE / LOTE» con el año
// Lo que no se sabe va entre corchetes: nunca se inventa (P65, P66).
//
// Uso: FUENTES_CSS=… node scripts/piezas/etiquetas-latas-v2.mjs   (con Bodoni Moda 700 en el CSS)
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [OUT = 'docs/marketing/latas/propuesta-v2'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const CREMA = '#F2F0EB', OSCURA = '#1E3932', ORO = '#CBA258', CELESTE = '#8CC8EC';
const LATAS = [
  { id: 'bloom', nombre: 'BLOOM', sabor: 'Hibiscus', icono: 'flor', tinta: CREMA, liquido: '#7F0D31',
    desc: 'Floral, vibrante y bien helada.',
    ing: 'agua, flor de jamaica (hibiscus), cáscara de naranja, canela, edulcorante (sucralosa, INS 955), colorantes (mica, INS 555; dióxido de titanio, INS 171)' },
  { id: 'cool', nombre: 'COOL', sabor: 'Hierba luisa y menta', icono: 'rama', tinta: OSCURA, liquido: '#BFB662',
    desc: 'Un respiro de menta helada.',
    ing: 'agua, hierba luisa, menta, jugo de limón, edulcorante (sucralosa, INS 955), colorantes (mica, INS 555; dióxido de titanio, INS 171)' },
  { id: 'lemon-tea', nombre: 'LEMON TEA', sabor: 'Té negro y limón', icono: 'limon', tinta: CREMA, liquido: '#AD5E13',
    desc: 'Cítrico, brillante y helado.',
    ing: 'agua, té negro, jugo de limón, edulcorante (sucralosa, INS 955), colorantes (mica, INS 555; dióxido de titanio, INS 171)' },
  { id: 'chai', nombre: 'CHAI', sabor: 'Especiado y aromático', icono: 'anis', tinta: CREMA, liquido: '#772612',
    desc: 'Especiado, aromático y helado.',
    ing: 'agua, té negro y especias [la lista de la caja de filtrantes], edulcorante (sucralosa, INS 955), colorantes [los de la ficha del brillo dorado, con su INS]' },
  { id: 'cold-brew', nombre: 'COLD BREW TEA', sabor: 'Té negro', icono: 'brote', tinta: CREMA, liquido: '#441C0B',
    desc: 'Suave como terciopelo.',
    ing: 'agua, té negro, edulcorante (sucralosa, INS 955), colorantes [los de la ficha del brillo dorado, con su INS]' },
];
const LEGAL = { razonSocial: '[razón social]', ruc: '[RUC]', direccion: '[dirección]', registro: '[pendiente]' };
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
  // v2: el contenido neto en la cara principal con cifras de 4 mm (NMP 001 / OIML R79, de 200 a 1000 ml)
  // y el // de la marca en vez del punto medio
  o+=regla(15.8, 50.2, 89.6, t);
  o+=lineaH('SABOR 100% NATURAL','mono',33,93.8,1.6,34.3,t);
  o+=regla(15.8, 50.2, 96.3, t);
  o+=lineaH('REPOSADA EN FRÍO //','mono',33,100.4,1.5,34.3,t);
  o+=lineaH('355 ML','mono',33,106.4,4.0,0,t);
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

// ── 2 · Atrás 56 × 100 mm: placa crema con texto verde, igual en las cinco ─────────────────────
const QR = await qrPath(URL_LATA);
for (const L of LATAS) {
  await pieza(`atras-${L.id}`, 56, 100, {
    fn: ({ L, LEGAL, QR, OSCURA }) => {
      const t = L.tinta, V = OSCURA;
      // arriba, sobre el vinilo: la marca y el nombre en la tinta del frente
      let s = marca(28, 7.2, 3.0, t) + regla(8, 48, 10.2, t, 0.18);
      s += lineaH(L.nombre, 'anton', 28, 18.6, 6.2, 0, t);
      s += lineaH(L.sabor, 'serif', 28, 23.6, 2.6, 0, t);
      // la placa crema (tinta blanca de base + crema) con todo lo legal en verde
      s += '<rect x="3" y="26.4" width="50" height="70.6" rx="2.2" fill="' + CREMA + '"/>';
      const lado = 13, q = lado / QR.n, qx = 6.2, qy = 80.2;
      s += '<g transform="translate(' + qx + ' ' + qy + ') scale(' + q + ')"><path d="' + QR.d + '" stroke="' + V + '" fill="none"/></g>';
      const fila = (a, b, c) => '<tr><td>' + a + '</td><td>' + b + '</td><td>' + c + '</td></tr>';
      const lab = '[lab.]';
      const tabla = '<table style="width:100%;border-collapse:collapse;margin:1.1mm 0 1mm;font:400 1.75mm/1.25 Archivo">'
        + '<tr style="font-weight:800;border-bottom:0.25mm solid ' + V + '"><td>Información nutricional</td><td style="text-align:right">100 ml</td><td style="text-align:right">lata 355 ml</td></tr>'
        + ['Energía (kcal)', 'Grasa total (g)', '  Grasa saturada (g)', 'Carbohidratos (g)', '  Azúcares (g)', 'Proteína (g)', 'Sodio (mg)']
          .map((n) => fila(n.replace(/^  /, '&nbsp;&nbsp;'), lab, lab)).join('').replace(/<td>([^<]*)<\/td><td>/g, '<td>$1</td><td style="text-align:right">').replace(/<\/td><td>\[/g, '</td><td style="text-align:right">[')
        + '</table>';
      const legal = '<div style="position:absolute;left:5.6mm;top:28.6mm;width:44.8mm;font:400 1.85mm/1.32 Archivo,sans-serif;color:' + V + '">'
        + '<div style="font-family:Instrument Serif;font-style:italic;font-size:3.1mm;line-height:1.1;margin-bottom:1mm">' + esc(L.desc) + '</div>'
        + '<b style="font-weight:800">Ingredientes:</b> ' + esc(L.ing) + '.'
        + tabla
        + '<b style="font-weight:800">Contenido neto: 355 ml.</b> Mantener refrigerada a 4 °C o menos. Agítala antes de abrir. Vencimiento y lote: en la tapa.<br>'
        + 'R.S. N.° ' + esc(LEGAL.registro) + ' · Elaborado por ' + esc(LEGAL.razonSocial) + ', RUC ' + esc(LEGAL.ruc) + ', ' + esc(LEGAL.direccion) + '. Hecho en Perú.</div>';
      const pide = '<div style="position:absolute;left:21.6mm;top:80mm;width:29mm;color:' + V + '">'
        + '<div style="font-family:Anton;font-size:3.6mm;line-height:1;letter-spacing:.02em">¿OTRA?</div>'
        + '<div style="font-family:Instrument Serif;font-style:italic;font-size:2.9mm;line-height:1.05;margin-top:.5mm">Pídela con tu sándwich.</div>'
        + '<div style="font:500 1.8mm/1 IBM Plex Mono;letter-spacing:.12em;margin-top:1.1mm">SNDWCH.APP</div>'
        + '<div style="font:500 1.45mm/1.2 IBM Plex Mono;letter-spacing:.04em;margin-top:1.6mm">PARA LOS QUE NO SE CONFORMAN //</div></div>';
      document.getElementById('v').innerHTML = '<svg style="position:absolute;inset:0" width="56mm" height="100mm" viewBox="0 0 56 100">' + s + '</svg>' + legal + pide;
    },
    arg: { L, LEGAL, QR, OSCURA },
  }, L.liquido);
}

// ── 3 · Tapa Ø 36 mm (+3 de sangrado), una por lata: verde de la marca, aro con el nombre y // ──
for (const L of LATAS) {
  await pieza(`tapa-${L.id}`, 42, 42, {
    fn: ({ TT, nombre }) => {
      const c = 21;
      let s = '<rect width="42" height="42" fill="' + CREMA + '"/>';
      s += '<circle cx="' + c + '" cy="' + c + '" r="17.2" fill="none" stroke="' + ORO + '" stroke-width="0.35"/>';
      s += '<defs><path id="aro" d="M' + (c - 15.2) + ' ' + c + ' a15.2 15.2 0 1 1 30.4 0 a15.2 15.2 0 1 1 -30.4 0"/></defs>';
      const aro = ('ACTIVA LA MAGIA // ' + nombre + ' // ').repeat(2);  // termina en espacio: la costura queda pareja
      s += '<text style="font-family:IBM Plex Mono;font-weight:500" font-size="1.55" letter-spacing="0.16" fill="' + TT + '"><textPath href="#aro" textLength="95.0" lengthAdjust="spacing">' + aro + '</textPath></text>';
      s += marca(c, 11.6, 1.7, TT);
      s += lineaH('AGÍTALA', 'anton', c, 19.4, 4.4, 0, TT);
      const cy = 16.6, r = 11.6;
      const flecha = (deA, aA) => {
        const P = (g) => [c + r * Math.cos(g * Math.PI / 180), cy + r * Math.sin(g * Math.PI / 180)];
        const [x0, y0] = P(deA), [x1, y1] = P(aA), barre = aA > deA ? 1 : 0;
        const tg = (aA + (aA > deA ? 90 : -90)) * Math.PI / 180, k = 1.3;
        const pa = (d) => [x1 - k * Math.cos(tg + d), y1 - k * Math.sin(tg + d)];
        const [ax, ay] = pa(0.56), [bx, by] = pa(-0.56);
        return '<path d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 0 ' + barre + ' ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + '" fill="none" stroke="' + TT + '" stroke-width="0.55" stroke-linecap="round"/>'
          + '<path d="M' + ax.toFixed(2) + ' ' + ay.toFixed(2) + ' L' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' L' + bx.toFixed(2) + ' ' + by.toFixed(2) + '" fill="none" stroke="' + TT + '" stroke-width="0.55" stroke-linecap="round" stroke-linejoin="round"/>';
      };
      s += flecha(150, 210) + flecha(-30, 30);
      // el recuadro de la etiquetadora, con los rótulos impresos y el año
      s += '<rect x="' + (c - 8) + '" y="23.0" width="16" height="8.6" rx="0.9" fill="none" stroke="' + TT + '" stroke-width="0.22" stroke-dasharray="0.7 0.5"/>';
      const rot = (txt, y) => lineaH(txt, 'mono', c, y, 0.9, 0, TT);
      s += rot('HECHA __/__/__', 25.3) + rot('VENCE __/__/__', 27.8) + rot('LOTE ________', 30.3);
      document.getElementById('v').innerHTML = '<svg width="42mm" height="42mm" viewBox="0 0 42 42">' + s + '</svg>';
    },
    arg: { TT: OSCURA, nombre: L.nombre },
  }, CREMA, true);
}

// ── 4 · La lámina para verla: las cinco con frente, atrás y tapa, sobre el color de cada bebida ─
{
  const W = 5 * 132 + 20, H = 190;
  const col = LATAS.map((L, i) => {
    const x = 10 + i * 132, img = (f) => 'file://' + resolve(OUT, f + '.png');
    return `<div style="position:absolute;left:${x}mm;top:16mm;width:128mm;height:166mm;background:${L.liquido};border-radius:3mm"></div>
      <img src="${img('frente-' + L.id)}" style="position:absolute;left:${x + 2}mm;top:22mm;width:66mm;height:110mm">
      <img src="${img('atras-' + L.id)}" style="position:absolute;left:${x + 70}mm;top:22mm;width:56mm;height:100mm">
      <img src="${img('tapa-' + L.id)}" style="position:absolute;left:${x + 14}mm;top:138mm;width:42mm;height:42mm;border-radius:50%">
      <div style="position:absolute;left:${x + 70}mm;top:140mm;width:56mm;font:500 2.6mm/1.4 'IBM Plex Mono';color:${L.tinta}">${L.nombre}<br>frente 66 × 110<br>atrás 56 × 100<br>tapa Ø 36</div>`;
  }).join('');
  const tmp = resolve(OUT, '.lamina.html');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${W}mm;height:${H}mm;overflow:hidden;background:${CREMA}}</style></head><body>
    <div style="position:absolute;left:10mm;top:6mm;font:600 4mm/1 'IBM Plex Mono';letter-spacing:.06em;color:${OSCURA}">SND//WCH // LATAS // PROPUESTA V2 (MAQUETA, A ESCALA) // LO QUE VA ENTRE [ ] FALTA</div>
    ${col}</body></html>`);
  const p = await b.newPage({ viewport: { width: Math.ceil(W * MM), height: Math.ceil(H * MM) }, deviceScaleFactor: 2 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.screenshot({ path: `${OUT}/lamina-v2.png` });
  await p.close(); rmSync(tmp);
}
await b.close();
console.log('listo', OUT);
