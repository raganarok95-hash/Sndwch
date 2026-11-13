// SND//WCH — piezas/stickers-apertura: los stickers para abrir el 20 de noviembre de 2026
// (dueño, 2026-11-09: «También necesito que me mandes todos los stickers que necesito»).
// Detalle, cantidades y dónde imprimir: docs/marketing/stickers-apertura/README.md.
//   1 · botellas de 500 ml (BLOOM, COLD BREW TEA, COOL): el frente de la lata v3 a 60 × 100 mm con
//       «500 ML» de 4 mm, y el atrás de 50 × 92 con la tabla por 100 ml y por botella. Vinilo transparente.
//       Al abrir no hay latas (no se compra la selladora todavía): van en la botella de 500 ml.
//   2 · etiquetas de salsas y soluciones, 60 × 40 mm, 18 por A4: nombre, código de la carta y
//       HECHA / VENCE para escribir con plumón (frascos.md: «todo con etiqueta: código, fecha y vence»).
// Mismo diseño y mismas reglas que scripts/piezas/etiquetas-latas-v3.mjs (de donde se copian las piezas
// de dibujo). El nombre del titular NO se commitea: se pasa al imprimir con LEGAL_TITULAR.
//
// Uso: FUENTES_CSS=… [LEGAL_TITULAR=…] node scripts/piezas/stickers-apertura.mjs [carpeta]
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [OUT = 'docs/marketing/stickers-apertura'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const CREMA = '#F2F0EB', OSCURA = '#1E3932', ORO = '#CBA258', CELESTE = '#8CC8EC';
// Los mismos textos de la lata v3 (PROPUESTA_V3.md). Al abrir solo hay tres bebidas (OPERATIVO.md).
const BOTELLAS = [
  { id: 'bloom', nut: [2, 0, 0, 0.5, 0.2, 0, 4], nombre: 'BLOOM', sabor: 'Hibiscus', icono: 'flor', tinta: CREMA, liquido: '#7F0D31',
    ing: 'agua, flor de jamaica (hibiscus), cáscara de naranja, canela, edulcorante (sucralosa, INS 955), colorantes (mica, INS 555; dióxido de titanio, INS 171)' },
  { id: 'cold-brew', nut: [1, 0, 0, 0.3, 0, 0, 3], nombre: 'COLD BREW TEA', sabor: 'Té negro', icono: 'brote', tinta: CREMA, liquido: '#441C0B',
    ing: 'agua, té negro, edulcorante (sucralosa, INS 955), colorantes (mica, INS 555; dióxido de titanio, INS 171)' },
  { id: 'cool', nut: [2, 0, 0, 0.4, 0.1, 0, 2], nombre: 'COOL', sabor: 'Hierba luisa y menta', icono: 'rama', tinta: OSCURA, liquido: '#BFB662',
    ing: 'agua, hierba luisa, menta, jugo de limón, edulcorante (sucralosa, INS 955), colorantes (mica, INS 555; dióxido de titanio, INS 171)' },
].map((B) => ({ ...B, ml: '500 ML', mlCap: 4.4 }));  // 4.4 en el dibujo de 66 mm = 4.0 mm impresos a 60 mm
const ML = 500;
const LEGAL = { razonSocial: (process.env.LEGAL_TITULAR || '[nombre del titular del RUC]') + ' (SNDWCH)', ruc: '10736044523',
  direccion: 'Av. Prolongación César Vallejo 2670, Trujillo', registro: null };
// Un QR por sabor, como en la lata: el ?src= queda en el pedido.
const URL_BOTELLA = (id) => 'https://sndwch.app/?src=botella-' + id;

// Salsas y soluciones: nombre (como en la carta), código de carta y dónde va. Lo que no tiene código va sin él.
const SALSAS = [
  ['MAYONESA AMERICANA', 'S13', 'squeeze'], ['MAYONESA LIGHT', 'S14', 'squeeze'], ['KETCHUP AMERICANO', 'S15', 'squeeze'],
  ['HONEY // MUSTARD', 'S04', 'squeeze'], ['SPICY // MAYO', 'S02', 'squeeze'], ['OIL & VINEGAR', 'S06', 'squeeze'],
  ['PICANTE // MIEL', 'S12', 'squeeze'], ['HONEY // MUSTARD', 'S04', 'frasco'], ['SPICY // MAYO', 'S02', 'frasco'],
  ['PICANTE // MIEL', 'S12', 'frasco'], ['CHIMICHURRI', 'S09', 'frasco'], ['CHIMICHURRI', 'S09', 'frasco'],
  ['CHIMICHURRI', 'S09', 'frasco'], ['CHIMICHURRI SIN PICANTE', '', 'frasco'], ['SUCRALOSA AL 2%', '', 'solución'],
  ['', '', ''], ['', '', ''], ['', '', ''],  // sin «SAL AL 10%»: las bebidas no llevan sal (RECETAS, 2026-11-10, Q12)
];
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
  // los módulos oscuros como cuadrados, para calarlos en la placa con evenodd (sin <mask>: Chrome la pasa al PDF
  // como imagen con máscara suave y hay lectores e imprentas que la pintan entera, sin QR; 2026-11-11)
  const { modules: M } = QRCode.create(url, { errorCorrectionLevel: 'Q' });
  let huecos = ''; for (let y = 0; y < M.size; y++) for (let x = 0; x < M.size; x++) if (M.get(x, y)) huecos += `M${x} ${y}h1v1h-1z`;
  return { n, d, huecos };
};


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
  o+=lineaH(L.sello||'SABOR 100% NATURAL','mono',33,93.8,1.6,34.3,t);
  o+=regla(15.8, 50.2, 96.3, t);
  o+=lineaH('REPOSADA EN FRÍO //','mono',33,100.4,1.5,34.3,t);
  o+=lineaH(L.ml||'355 ML','mono',33,106.4,L.mlCap||4.0,0,t);
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


// Cocina: una etiqueta por TANDA (en el táper donde van las porciones), no una por bolsita: se reusa como la de
// las salsas. Los nombres y si va congelado salen de OPERATIVO.md §2 (2026-11-10: «bolsitas de congelar y etiquetas»).
const COCINA = [
  ['RES // LAMINADA', '', 'congelado'], ['RES // LAMINADA', '', 'congelado'], ['ALBÓNDIGA // MARINARA', '', 'congelado'],
  ['ALBÓNDIGA // MARINARA', '', 'congelado'], ['PAN SUB', '', 'congelado'], ['PAN SUB', '', 'congelado'],
  ['CEBOLLA // SALTEADA', '', 'refri'], ['CEBOLLA // SALTEADA', '', 'refri'], ['ATÚN // HOUSE', '', 'refri · no se congela'],
  ['PAVO // LAMINADO', '', 'refri'], ['EMBUTIDO // ITALIANO', '', 'refri'], ['QUESOS', '', 'refri'],
  ['VEGETALES DEL DÍA', '', 'refri'], ['VEGETALES DEL DÍA', '', 'refri'], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''],
];

// ── 1 · Botellas: frente 60 × 100 (el dibujo de la lata, a escala) ────────────────────────────
for (const L of BOTELLAS) {
  await pieza(`botella-frente-${L.id}`, 60, 100, {
    fn: ({ L, ICONO }) => { document.getElementById('v').innerHTML = '<svg width="60mm" height="100mm" viewBox="0 0 66 110">' + frente(L, ICONO) + '</svg>'; },
    arg: { L, ICONO: ICONOS[L.icono] },
  }, L.liquido);
}

// ── 2 · Botellas: atrás 50 × 92, transparente; la fecha y el lote se escriben en el recuadro ──
for (const L of BOTELLAS) {
  await pieza(`botella-atras-${L.id}`, 50, 92, {
    fn: ({ L, LEGAL, QR, ML }) => {
      const t = L.tinta, clara = t !== CREMA;
      let s = marca(25, 6.4, 2.8, t) + regla(7, 43, 9.2, t, 0.18);
      s += lineaH(L.nombre, 'anton', 25, 16.4, 5.4, 0, t);
      s += regla(7, 43, 18.8, t, 0.18);
      const lado = 11.5, q = lado / QR.n, qx = 4.6, qy = 76.6;
      if (clara) s += '<g transform="translate(' + qx + ' ' + qy + ') scale(' + q + ')"><path d="' + QR.d + '" stroke="' + t + '" fill="none"/></g>';
      else s += '<path fill-rule="evenodd" fill="' + t + '" transform="translate(' + qx + ' ' + qy + ') scale(' + q + ')" d="M' + (-1 / q) + ' ' + (-1 / q) + 'H' + (QR.n + 1 / q) + 'V' + (QR.n + 1 / q) + 'H' + (-1 / q) + 'Z' + QR.huecos + '"/>';
      s += '<rect x="27" y="66.2" width="19" height="7.4" rx="0.8" fill="none" stroke="' + t + '" stroke-width="0.22" stroke-dasharray="0.7 0.5"/>';
      const der = 'style="text-align:right"', k = ML / 100;
      const tabla = '<table style="width:100%;border-collapse:collapse;margin:0.9mm 0 0.8mm;font:500 1.75mm/1.22 Archivo">'
        + '<tr style="font-weight:800;border-bottom:0.25mm solid ' + t + '"><td>Información nutricional</td><td ' + der + '>100 ml</td><td ' + der + '>' + ML + ' ml</td></tr>'
        + ['Energía (kcal)', 'Grasa total (g)', '&nbsp;&nbsp;Grasa saturada (g)', 'Carbohidratos (g)', '&nbsp;&nbsp;Azúcares (g)', 'Proteína (g)', 'Sodio (mg)']
          .map((n, i) => { const v = L.nut[i]; const f = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1)).replace('.', ',');
            const tot = i === 0 ? Math.round(v * k) : Math.round(v * k * 10) / 10;
            return '<tr><td>' + n + '</td><td ' + der + '>' + f(v) + '</td><td ' + der + '>' + f(tot) + '</td></tr>'; }).join('') + '</table>'
          + '<div style="font-size:1.4mm;margin:-0.3mm 0 0.8mm">Valores aproximados, calculados a partir de sus ingredientes.</div>';
      const legal = '<div style="position:absolute;left:4mm;top:20.2mm;width:42mm;font:500 1.8mm/1.3 Archivo,sans-serif;color:' + t + '">'
        + '<b style="font-weight:800">Ingredientes:</b> ' + esc(L.ing) + '.' + tabla
        + '<b style="font-weight:800">Contenido neto: ' + ML + ' ml.</b> Mantener refrigerada a 4&nbsp;°C o menos. Agítala antes de abrir.<br>'
        + 'Elaborado por ' + esc(LEGAL.razonSocial) + ', RUC ' + esc(LEGAL.ruc) + ', ' + esc(LEGAL.direccion) + '. Hecho en Perú.</div>';
      const fecha = '<div style="position:absolute;left:4mm;top:66.4mm;width:22mm;font:500 1.55mm/1.25 IBM Plex Mono;letter-spacing:.04em;color:' + t + '">HECHA · VENCE · LOTE<br><span style="font-family:Archivo;letter-spacing:0">en el recuadro →</span></div>';
      const pide = '<div style="position:absolute;left:19.4mm;top:76.4mm;width:28mm;color:' + t + '">'
        + '<div style="font-family:Anton;font-size:3.4mm;line-height:1;letter-spacing:.02em">¿OTRA?</div>'
        + '<div style="font-family:Instrument Serif;font-style:italic;font-size:2.8mm;line-height:1.05;margin-top:.4mm">Pídela con tu sándwich.</div>'
        + '<div style="font:500 1.7mm/1 IBM Plex Mono;letter-spacing:.12em;margin-top:1mm">SNDWCH.APP</div>'
        + '<div style="font:500 1.4mm/1.2 IBM Plex Mono;letter-spacing:.03em;margin-top:1.3mm">PARA LOS QUE NO SE CONFORMAN //</div></div>';
      document.getElementById('v').innerHTML = '<svg style="position:absolute;inset:0" width="50mm" height="92mm" viewBox="0 0 50 92">' + s + '</svg>' + legal + fecha + pide;
    },
    arg: { L, LEGAL, ML, QR: await qrPath(URL_BOTELLA(L.id)) },
  }, L.liquido);
}

// ── 3 · Salsas: 60 × 40 mm, vinilo blanco con fondo crema; 18 por A4 (3 × 6, 5 mm entre una y otra) ──
// Una etiqueta: el wordmark, el nombre, el código y HECHA / VENCE con su línea para el plumón.
const ETIQUETA = String.raw`
function etiqueta(x0, y0, nombre, codigo, donde){
  const t='${OSCURA}'; let o='<g transform="translate('+x0+' '+y0+')">';
  o+='<rect width="60" height="40" rx="3" fill="${CREMA}"/>';
  o+='<rect x="0.05" y="0.05" width="59.9" height="39.9" rx="3" fill="none" stroke="#E6007E" stroke-width="0.1"/>';  // línea de corte
  o+=marca(30, 6.6, 2.6, t)+regla(6, 54, 9.2, t, 0.2);
  if (nombre){ const m=met(nombre,F.anton), H=met('H',F.anton).a; const cap=Math.min(7.2, 50*H/(m.l+m.r));
    o+=lineaH(nombre,'anton',30,13.6+cap*0.5+3.2,cap,0,t); }
  else o+=regla(8, 52, 20.6, t, 0.25);
  const pie=[codigo?'CÓDIGO '+codigo:'', donde?donde.toUpperCase():''].filter(Boolean).join(' · ');
  if (pie) o+=lineaH(pie,'mono',30,25.4,1.5,0,t);
  o+=lineaH('HECHA','mono',16.5,30.6,1.6,0,t)+lineaH('VENCE','mono',43.5,30.6,1.6,0,t);
  o+=regla(5, 28, 36.2, t, 0.25)+regla(32, 55, 36.2, t, 0.25);
  return o+'</g>';
}`;
async function pliegoSalsas(archivo, lista) {
  const W = 210, H = 297, x0 = (W - (3 * 60 + 2 * 5)) / 2, y0 = (H - (6 * 40 + 5 * 5)) / 2;
  await pieza(archivo, W, H, {
    fn: ({ lista, x0, y0, ETIQUETA }) => { eval(ETIQUETA + ';window.etiqueta=etiqueta');
      let s = ''; lista.forEach(([n, c, d], i) => { s += window.etiqueta(x0 + (i % 3) * 65, y0 + Math.floor(i / 3) * 45, n, c, d); });
      document.getElementById('v').innerHTML = '<svg width="210mm" height="297mm" viewBox="0 0 210 297">' + s + '</svg>'; },
    arg: { lista, x0, y0, ETIQUETA },
  }, '#FFFFFF', true);
}
await pliegoSalsas('salsas-A4-1-con-nombre', SALSAS);
await pliegoSalsas('cocina-A4-tandas', COCINA);
await pliegoSalsas('salsas-A4-2-en-blanco', Array.from({ length: 18 }, () => ['', '', '']));

// ── 4 · Vista para el dueño: las tres botellas (frente y atrás) sobre su bebida ──
{
  const W = 3 * 130 + 20, H = 128;
  const col = BOTELLAS.map((L, i) => {
    const x = 10 + i * 130, img = (f) => 'file://' + resolve(OUT, f + '.png');
    return `<div style="position:absolute;left:${x}mm;top:16mm;width:124mm;height:106mm;background:${L.liquido};border-radius:3mm"></div>
      <img src="${img('botella-frente-' + L.id)}" style="position:absolute;left:${x + 3}mm;top:19mm;width:60mm;height:100mm">
      <img src="${img('botella-atras-' + L.id)}" style="position:absolute;left:${x + 70}mm;top:19mm;width:50mm;height:92mm">`;
  }).join('');
  const tmp = resolve(OUT, '.vista.html');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${W}mm;height:${H}mm;overflow:hidden;background:${CREMA}}</style></head><body>
    <div style="position:absolute;left:10mm;top:6mm;font:600 4mm/1 'IBM Plex Mono';letter-spacing:.06em;color:${OSCURA}">SND//WCH // BOTELLAS 500 ML // FRENTE 60 × 100 Y ATRÁS 50 × 92, A TAMAÑO REAL // VINILO TRANSPARENTE (EL COLOR ES LA BEBIDA)</div>
    ${col}</body></html>`);
  const p = await b.newPage({ viewport: { width: Math.ceil(W * MM), height: Math.ceil(H * MM) }, deviceScaleFactor: 3 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.screenshot({ path: `${OUT}/vista-botellas.png` });
  await p.close(); rmSync(tmp);
}
await b.close();
console.log('listo', OUT);
