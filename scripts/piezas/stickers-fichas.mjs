// SND//WCH — piezas/stickers-fichas: una imagen por sticker con su medida acotada y lo que hay que pedir
// (dueño, 2026-11-11: «necesito los stickers en imágenes con cada medida para poder pedirlos»).
// Lee las PNG de la carpeta de imprenta (stickers-apertura.mjs) y escribe JPG en <carpeta>/para-pedir.
// Uso: FUENTES_CSS=… node scripts/piezas/stickers-fichas.mjs /mnt/project-files/stickers-apertura
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [DIR = '/mnt/project-files/stickers-apertura'] = process.argv.slice(2);
const OUT = resolve(DIR, 'para-pedir'); mkdirSync(OUT, { recursive: true });
const REPO = 'docs/marketing/stickers-apertura';
const png = (f) => { const a = resolve(DIR, f + '.png'); return 'file://' + (existsSync(a) ? a : resolve(REPO, f + '.png')); };
const VERDE = '#1E3932', CREMA = '#F2F0EB', ROJO = '#C0392B';

// Las fichas van a la imprenta (dueño, 2026-11-11: «no debe contener tus consejos o si es opcional o no»):
// solo el sticker, la medida de corte, el material, la cantidad y el archivo. Nada de precios ni avisos.
// k = mm de pantalla por mm real (para que todo entre parejo en la ficha)
const TRANSP = process.env.TRANSP_DIR || '/tmp/claude-0/transp';  // botellas con fondo transparente (pdftocairo -transp)
const FICHAS = [
  { f: '1-cierre-bolsa-7x7', titulo: 'STICKER DE CIERRE CON QR', piezas: [{ img: 'sticker-bolsa-7x7cm', w: 70, h: 70, bleed: 3 }], k: 2.2,
    datos: [['Medida de corte', '7 × 7 cm, esquinas redondeadas de 4 mm'], ['Material', 'papel adhesivo mate, troquelado'], ['Acabado', 'precorte (micro-perforado) a 1.1 cm del borde de arriba'], ['Cantidad', '250'], ['Archivo', 'sticker-bolsa-7x7cm.pdf (con 3 mm de sangrado)']] },
  ...[['bloom', 'BLOOM'], ['cold-brew', 'COLD BREW TEA'], ['cool', 'COOL']].map(([id, n], i) => ({
    f: `${2 + i}-botella-${id}`, titulo: `ETIQUETA DE BOTELLA · ${n} (FRENTE Y ATRÁS)`, k: 1.7, transp: true, claro: id === 'cool',
    piezas: [{ img: 'botella-frente-' + id, w: 60, h: 100, nombre: 'FRENTE' }, { img: 'botella-atras-' + id, w: 50, h: 92, nombre: 'ATRÁS' }],
    datos: [['Medida de corte', 'frente 6 × 10 cm · atrás 5 × 9.2 cm'], ['Material', 'vinilo transparente, corte de contorno'], ['Impresión', id === 'cool' ? 'tinta verde; el fondo no se imprime (cuadriculado = transparente)' : 'tinta crema con base de tinta blanca; el fondo no se imprime (cuadriculado = transparente)'], ['Cantidad', '24 frentes y 24 atrás'], ['Archivos', `botella-frente-${id}.pdf · botella-atras-${id}.pdf`]] })),
  ...[['5-salsas-con-nombre', 'salsas-A4-1-con-nombre', 'ETIQUETAS DE SALSAS'], ['6-salsas-en-blanco', 'salsas-A4-2-en-blanco', 'ETIQUETAS EN BLANCO'], ['7-cocina', 'cocina-A4-tandas', 'ETIQUETAS DE COCINA']].map(([f, img, titulo]) => ({
    f, titulo: titulo + ' · PLANCHA A4', piezas: [{ img, w: 210, h: 297, nombre: 'PLANCHA A4' }], k: 0.75, celda: true,
    datos: [['Medida de corte', 'cada etiqueta 6 × 4 cm, esquinas de 3 mm · 18 por plancha A4 (21 × 29.7 cm)'], ['Material', 'vinilo blanco + laminado mate, corte de contorno'], ['Línea fucsia', 'guía de corte: no se imprime'], ['Cantidad', '1 plancha'], ['Archivo', img + '.pdf']] })),
  { f: '9-sello-bolsa-10x10', titulo: 'STICKER DEL FRENTE DE LA BOLSA', piezas: [{ img: 'sticker-sello-10x10cm', w: 100, h: 100 }], k: 1.6,
    datos: [['Medida de corte', '10 × 10 cm, esquinas redondeadas de 4 mm'], ['Material', 'papel adhesivo mate, troquelado'], ['Impresión', 'una tinta, verde casi negro #1E2B22'], ['Cantidad', '250'], ['Archivo', 'sticker-sello-10x10cm.pdf (con 3 mm de sangrado)']] },
  { f: '8-sticker-8x8', titulo: 'STICKER CUADRADO 8 × 8', piezas: [{ img: 'sticker-calle-8x8cm', w: 80, h: 80, bleed: 3 }], k: 2.0,
    datos: [['Medida de corte', '8 × 8 cm, esquinas redondeadas de 6 mm'], ['Material', 'vinilo blanco + laminado mate UV, troquelado'], ['Cantidad', '250'], ['Archivo', 'sticker-calle-8x8cm.pdf (con 3 mm de sangrado)']] },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const fuentes = readFileSync(process.env.FUENTES_CSS, 'utf8');
const cota = (largo, txt, vertical) => vertical
  ? `<div style="position:absolute;top:0;height:${largo}mm;left:-9mm;width:6mm;border-left:.35mm solid ${ROJO};border-top:.35mm solid ${ROJO};border-bottom:.35mm solid ${ROJO}"><span style="position:absolute;top:50%;left:-1mm;transform:translate(-100%,-50%) rotate(-90deg);transform-origin:center;white-space:nowrap;font:600 4mm 'IBM Plex Mono';color:${ROJO}">${txt}</span></div>`
  : `<div style="position:absolute;left:0;width:${largo}mm;top:-9mm;height:6mm;border-top:.35mm solid ${ROJO};border-left:.35mm solid ${ROJO};border-right:.35mm solid ${ROJO}"><span style="position:absolute;left:50%;top:-6mm;transform:translateX(-50%);white-space:nowrap;font:600 4mm 'IBM Plex Mono';color:${ROJO}">${txt}</span></div>`;
const cm = (mm) => (mm / 10).toString() + ' cm';

for (const F of FICHAS) {
  let x = 0, hMax = 0; const pz = F.piezas.map((p) => {
    // con sangrado, el PNG trae 3 mm de más por lado: se recorta a la medida de corte
    const W = p.w * F.k, H = p.h * F.k, s = p.bleed ? (p.w + 2 * p.bleed) / p.w : 1;
    const html = `<div style="position:absolute;left:${x}mm;top:0;width:${W}mm;height:${H}mm">
      <div style="position:absolute;inset:0;overflow:hidden;border-radius:${p.bleed ? 4 * F.k : 0}mm;${F.transp ? `background:repeating-conic-gradient(${F.claro ? '#e4e4e4 0 25%,#ffffff 0 50%' : '#6e6e6e 0 25%,#858585 0 50%'}) 0 0/4mm 4mm;` : ''}outline:.3mm dashed #999;outline-offset:0">
        <img src="${F.transp ? 'file://' + TRANSP + '/' + p.img + '.png' : png(p.img)}" style="position:absolute;width:${W * s}mm;height:${H * s}mm;left:${-(W * s - W) / 2}mm;top:${-(H * s - H) / 2}mm"></div>
      ${cota(W, cm(p.w), false)}${cota(H, cm(p.h), true)}
      ${p.nombre ? `<div style="position:absolute;top:${H + 3}mm;width:${W}mm;text-align:center;font:600 4mm 'IBM Plex Mono';color:${VERDE}">${p.nombre}</div>` : ''}
      ${F.celda ? `<div style="position:absolute;left:${10 * F.k}mm;top:${16 * F.k}mm;width:${60 * F.k}mm;height:${40 * F.k}mm;outline:.5mm solid ${ROJO}"></div>
        <div style="position:absolute;left:${10 * F.k}mm;top:${16 * F.k - 6}mm;background:#fff;padding:0 1mm;font:600 3.6mm 'IBM Plex Mono';color:${ROJO}">cada una: 6 × 4 cm</div>` : ''}</div>`;
    x += W + 22; hMax = Math.max(hMax, H); return html; }).join('');
  const anchoArte = x - 22, ANCHO = Math.max(anchoArte + 50, 200);
  const datos = F.datos.map(([a, v]) => `<tr><td style="padding:1.2mm 4mm 1.2mm 0;font-weight:600;white-space:nowrap">${a}</td><td style="padding:1.2mm 0">${v}</td></tr>`).join('');
  const avisos = (F.avisos || []).map((t) => `<div style="margin-top:2.5mm;padding:2.5mm 3mm;border:.4mm solid ${ROJO};color:${ROJO};border-radius:2mm;font:600 3.6mm/1.35 Archivo">${t}</div>`).join('');
  const ALTO = 34 + hMax + 14 + 12 + F.datos.length * 8 + (F.avisos || []).length * 14 + (F.nota ? 8 : 0);
  const tmp = resolve(OUT, `.${F.f}.html`);
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:${ANCHO}mm;background:${CREMA};color:${VERDE}}</style></head><body>
    <div style="padding:10mm 12mm">
      <div style="font:600 3.4mm 'IBM Plex Mono';letter-spacing:.08em">SND//WCH</div>
      <div style="font:400 9mm/1.05 Anton;margin-top:2mm">${F.titulo}</div>
      <div style="position:relative;height:${hMax + 10}mm;margin:16mm 0 0 ${Math.max(16, (ANCHO - 24 - anchoArte) / 2 + 6)}mm">${pz}</div>
      <table style="margin-top:6mm;font:400 3.8mm/1.3 Archivo;border-collapse:collapse">${datos}</table>
      ${F.nota ? `<div style="margin-top:2mm;font:italic 3.4mm Archivo">${F.nota}</div>` : ''}${avisos}
      <div style="margin-top:4mm;font:400 3mm 'IBM Plex Mono'">Medidas en rojo: medida de corte.</div>
    </div></body></html>`);
  const p = await b.newPage({ viewport: { width: Math.ceil(ANCHO * 96 / 25.4), height: 400 }, deviceScaleFactor: 2.5 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.addStyleTag({ content: fuentes });
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  await p.screenshot({ path: `${OUT}/${F.f}.jpg`, fullPage: true, type: 'jpeg', quality: 88 });
  await p.close(); rmSync(tmp);
}
await b.close();
console.log('listo', OUT);
