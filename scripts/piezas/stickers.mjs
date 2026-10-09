// SND//WCH — piezas/stickers: los tres stickers (2026-10-09, docs/marketing/stickers/).
// Dueño: «El QR no debe ir en el sticker de cierre sino un sticker de cierre y aparte el sticker
// del QR, diséñalo bonito. Hazlo bien con tamaños de cada sticker. Hay tres stickers: el de
// sellado de la bolsa, QR en la bolsa y un sticker interesante para poner en la calle como
// pequeña publicidad extra».
//
//   1 · cierre     Ø50 mm   cruza el doblez de la bolsa lisa; el logo de los dos
//   2 · qr-bolsa   70×100   en la bolsa; mundo de WICHO; lleva el código BOLSA
//   3 · calle      80×80    vinilo para exterior; mundo de SANDO y su frase firmada
//
// Cada uno sale en PDF (medida final + 3 mm de sangrado, para imprenta) y PNG, más una lámina
// con los tres a escala y cómo van en la bolsa.
//
// Uso: node scripts/piezas/stickers.mjs [carpeta]   (FUENTES_CSS, PLAYWRIGHT_CHROMIUM_PATH)
// Necesita `npm install --no-save qrcode@1.5.4` (igual que bolsa.mjs).
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [OUT = 'docs/marketing/stickers'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const img = (p) => 'file://' + resolve(p);
// Colores muestreados de los personajes (docs/LOS_DOS_HERMANOS.md), nunca «que combinen».
const C = {
  papel: '#EFE6D4', tinta: '#1E2B22', naranja: '#D8823C', oliva: '#6C7860', oro: '#CBA258',
  celeste: '#90CCF0', curva: '#7DBBE0', navy: '#1E2F3A', durazno: '#F0D8CC', lila: '#C3A6D2', lilaOsc: '#4A3D62',
};
// El código del QR de la bolsa (migración 20261009025200: tipo «bebida», una vez por celular).
const CODIGO = 'BOLSA';
const URL_BOLSA = `https://sndwch.app/?src=bolsa&codigo=${CODIGO}`;
const URL_CALLE = 'https://sndwch.app/?src=calle';
const qr = (url, color) => QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'Q', color: { dark: color, light: '#0000' } });
const S = 3; // sangrado, mm

// El wordmark con el «//» de la marca: dos barras iguales, dorada y celeste (CLAUDE.md, regla 10).
const marca = (col, size) => `<span style="font:800 ${size}/1 Archivo,sans-serif;color:${col};display:inline-flex;align-items:center;letter-spacing:.01em">SND<span style="display:inline-flex;gap:.16em;margin:0 .1em"><i style="width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block;background:${C.oro}"></i><i style="width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block;background:${C.celeste}"></i></span>WCH</span>`;

// Curvas de nivel: el estampado del polo de WICHO, tono sobre tono.
function curvas(w, h, color, n = 16, amp = 2.2, grosor = 0.35) {
  let p = '';
  for (let i = 0; i < n; i++) {
    const y0 = (i / (n - 1)) * h; let d = `M -2 ${y0.toFixed(2)}`;
    for (let x = 0; x <= w + 4; x += 2) d += ` L ${x} ${(y0 + amp * Math.sin(x / 9 + i * 0.7) + amp * 0.5 * Math.sin(x / 4 + i)).toFixed(2)}`;
    p += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${grosor}"/>`;
  }
  return `<svg style="position:absolute;inset:0" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${p}</svg>`;
}
// El círculo de plumón de WICHO: no cierra (se pasa) y su trazo engorda y adelgaza. Se calcula
// como un relleno entre dos curvas, así el grosor variable es real y no un efecto.
function circuloAMano(w, h, color) {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 0.8, ry = h / 2 - 0.8, a0 = -2.6, a1 = a0 + 2 * Math.PI + 0.55;
  const fuera = [], dentro = [];
  for (let a = a0; a <= a1; a += 0.05) {
    const t = (a - a0) / (a1 - a0);
    const g = 0.25 + 0.55 * Math.sin(Math.PI * t) ** 0.8; // fino en las puntas, gordo al medio
    const e = 1 + 0.06 * t;                                // se abre un poco: la punta se pasa
    const x = cx + rx * e * Math.cos(a), y = cy + ry * e * Math.sin(a), nx = Math.cos(a), ny = Math.sin(a);
    fuera.push(`${(x + nx * g / 2).toFixed(2)},${(y + ny * g / 2).toFixed(2)}`);
    dentro.unshift(`${(x - nx * g / 2).toFixed(2)},${(y - ny * g / 2).toFixed(2)}`);
  }
  return `<svg style="position:absolute;inset:0;overflow:visible" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="${fuera.concat(dentro).join(' ')}" fill="${color}"/></svg>`;
}
// El acanalado de los puños de SANDO: franjas verticales finas y regulares.
const rib = (color) => `repeating-linear-gradient(90deg,${color} 0 0.9mm,transparent 0.9mm 2.1mm)`;

const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.9}.voz{font-family:'Instrument Serif',serif;font-style:italic}.mono{font-family:'IBM Plex Mono',monospace;font-weight:600}`;

const piezas = [];
// `forma`: el troquel (corte) que se dibuja en la lámina; el PDF lleva el arte con sangrado.
const pieza = (archivo, w, h, forma, cuerpo) => piezas.push({ archivo, w, h, forma, cuerpo });

// ── 1 · Cierre Ø50 mm: el logo de los dos y, alrededor, lo que promete el cierre ─────────────
//        Dos arcos que se leen derechos (arriba y abajo) y el «//» de la marca a cada costado.
{
  const d = 50, c = S + d / 2, rA = 20.9, rB = 22.9; // el texto queda a 2 mm del corte
  const barras = (x, y, giro) => `<g transform="translate(${x} ${y}) rotate(${giro})">${[[C.oro, -0.62], [C.celeste, 0.62]].map(([col, dx]) => `<rect x="${dx - 0.22}" y="-1.35" width="0.44" height="2.7" rx="0.12" fill="${col}" transform="skewX(-16)"/>`).join('')}</g>`;
  pieza('1-cierre', d, d, 'circulo', `<div style="position:absolute;inset:0;background:${C.tinta}"></div>
  <svg style="position:absolute;left:0;top:0" width="${d + 2 * S}mm" height="${d + 2 * S}mm" viewBox="0 0 ${d + 2 * S} ${d + 2 * S}">
    <defs>
      <path id="arriba" d="M${c - rA},${c} A${rA},${rA} 0 0 1 ${c + rA},${c}"/>
      <path id="abajo" d="M${c - rB},${c} A${rB},${rB} 0 0 0 ${c + rB},${c}"/>
    </defs>
    <circle cx="${c}" cy="${c}" r="17.6" fill="${C.papel}"/>
    <circle cx="${c}" cy="${c}" r="17.6" fill="none" stroke="${C.oro}" stroke-width="0.35"/>
    <g font-family="IBM Plex Mono" font-weight="600" font-size="3.1" fill="${C.papel}" letter-spacing="0.35">
      <text text-anchor="middle"><textPath href="#arriba" startOffset="50%">ARMADO AL MOMENTO</textPath></text>
      <text text-anchor="middle"><textPath href="#abajo" startOffset="50%">SI LLEGA ABIERTO, AVÍSANOS</textPath></text>
    </g>
    ${barras(c - 21.3, c, 0)}${barras(c + 21.3, c, 0)}
  </svg>
  <img src="${img('img/marca/avatar-1024-transparente.png')}" style="position:absolute;left:${c - 15.5}mm;top:${c - 15.5}mm;width:31mm;height:31mm">`);
}

// ── 2 · QR de la bolsa 70×100: el mundo de WICHO (celeste, curvas de nivel, su círculo) ──────
{
  const w = 70, h = 100, X = S + 6;
  pieza('2-qr-bolsa', w, h, 'rect4', `<div style="position:absolute;inset:0;background:${C.celeste};color:${C.navy};overflow:hidden">
    ${curvas(w + 2 * S, h + 2 * S, C.curva, 22, 1.8, 0.3)}
    <div style="position:absolute;left:${X}mm;top:${S + 7}mm;font:800 4.6mm/1 Archivo,sans-serif">La próxima vez,</div>
    <div class="disp" style="position:absolute;left:${X - 0.4}mm;top:${S + 13}mm;font-size:16.5mm">Pide<br>directo</div>
    <div style="position:absolute;left:${X}mm;top:${S + 45}mm;font:800 4.7mm/1 Archivo,sans-serif;white-space:nowrap">y la bebida va <span style="position:relative;display:inline-block;padding:0 1.2mm;margin-left:1mm">gratis<span style="position:absolute;left:-1.6mm;right:-1.8mm;top:-2.4mm;bottom:-2.6mm">${circuloAMano(14.2, 9.4, C.navy)}</span></span></div>
    <img src="${img('img/wicho_rie.png')}" style="position:absolute;right:${S - 10}mm;bottom:${S - 5}mm;height:50mm">
    <div style="position:absolute;left:${X}mm;top:${S + 54}mm;width:33mm;padding:2.2mm;background:#fff;border-radius:3mm;box-shadow:0 0 0 0.5mm ${C.navy}">${await qr(URL_BOLSA, C.navy)}</div>
    <div class="mono" style="position:absolute;left:${X}mm;top:${S + 90.5}mm;font-size:3.5mm;letter-spacing:.06em">código <b style="background:${C.navy};color:${C.celeste};padding:0.3mm 1.2mm;border-radius:1mm">${CODIGO}</b></div>
  </div>`);
}

// ── 3 · Calle 80×80: el mundo de SANDO (papel, tinta, el forro naranja vertical, el acanalado) ─
{
  const w = 80, h = 80;
  pieza('3-calle', w, h, 'rect6', `<div style="position:absolute;inset:0;background:${C.papel};color:${C.tinta};overflow:hidden">
    <div style="position:absolute;right:0;top:0;bottom:0;width:${S + 5}mm;background:${C.naranja}"></div>
    <div style="position:absolute;left:0;right:${S + 5}mm;bottom:0;height:${S + 7}mm;background:${rib(C.oliva)}"></div>
    <div class="voz" style="position:absolute;left:${S + 6}mm;top:${S + 6}mm;font-size:9.6mm;line-height:.98">Si lees esto,<br>ya tienes<br>hambre.</div>
    <div class="disp" style="position:absolute;left:${S + 6.3}mm;top:${S + 35.5}mm;font-size:3.6mm;letter-spacing:.08em">— Sando</div>
    <img src="${img('img/sando2_asoma.png')}" style="position:absolute;left:${S + 1}mm;bottom:${S + 7}mm;height:33mm">
    <div style="position:absolute;right:${S + 9}mm;bottom:${S + 15}mm;width:24mm;height:24mm;padding:1.6mm;background:#fff;border-radius:2mm">${await qr(URL_CALLE, C.tinta)}</div>
    <div style="position:absolute;right:${S + 9}mm;bottom:${S + 9.5}mm;width:24mm;text-align:center">${marca(C.tinta, '4.1mm')}</div>
  </div>`);
}

// ── Render: PDF con sangrado (imprenta) + PNG para verlas ─────────────────────────────────────
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const fuentes = process.env.FUENTES_CSS ? readFileSync(process.env.FUENTES_CSS, 'utf8') : null;
const MM = 96 / 25.4;
const cargar = async (p) => {
  if (fuentes) await p.addStyleTag({ content: fuentes });
  else await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700;800&family=IBM+Plex+Mono:wght@600&family=Instrument+Serif:ital@1&display=block' });
  await p.evaluate(async () => { await Promise.all(['400 10px Anton', '800 10px Archivo', '600 10px "IBM Plex Mono"', 'italic 400 10px "Instrument Serif"'].map((f) => document.fonts.load(f))); await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
};
for (const x of piezas) {
  const W = x.w + 2 * S, H = x.h + 2 * S;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${W}mm;height:${H}mm;overflow:hidden}@page{size:${W}mm ${H}mm;margin:0}</style></head><body><div style="position:relative;width:${W}mm;height:${H}mm;overflow:hidden">${x.cuerpo}</div></body></html>`;
  const tmp = resolve(OUT, `.${x.archivo}.html`); writeFileSync(tmp, html);
  const p = await b.newPage({ viewport: { width: Math.ceil(W * MM), height: Math.ceil(H * MM) }, deviceScaleFactor: 6 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.pdf({ path: `${OUT}/${x.archivo}.pdf`, width: `${W}mm`, height: `${H}mm`, printBackground: true, pageRanges: '1' });
  await p.screenshot({ path: `${OUT}/${x.archivo}.png`, clip: { x: 0, y: 0, width: W * MM, height: H * MM } });
  await p.close(); rmSync(tmp);
}

// ── Lámina: los tres a la misma escala, con su troquel y su medida, y cómo va la bolsa ────────
{
  const k = 4.2; // px por mm en la lámina
  const recorte = (x) => {
    const r = x.forma === 'circulo' ? '50%' : x.forma === 'rect4' ? `${4 * k}px` : `${6 * k}px`;
    return `<div style="position:relative;width:${x.w * k}px;height:${x.h * k}px;border-radius:${r};overflow:hidden;box-shadow:0 10px 24px rgba(30,30,20,.28)"><img src="${img(`${OUT}/${x.archivo}.png`)}" style="position:absolute;left:${-S * k}px;top:${-S * k}px;width:${(x.w + 2 * S) * k}px"></div>`;
  };
  const ficha = (x, titulo, medida, material, va) => `<div style="display:flex;flex-direction:column;gap:14px;width:${Math.max(x.w * k, 300)}px">
    <div style="height:${100 * k}px;display:flex;align-items:flex-end">${recorte(x)}</div>
    <div class="disp" style="font-size:26px;color:${C.tinta}">${titulo}</div>
    <div class="mono" style="font-size:15px;color:${C.tinta}">${medida}</div>
    <div style="font:400 15px/1.4 Archivo,sans-serif;color:#4A4A40">${material}<br>${va}</div></div>`;
  const [c1, c2, c3] = piezas;
  // La bolsa lisa #20 (21 × 40 × 12.5) con su doblez, el sello del frente, el QR y el cierre.
  const kb = 2.1, bw = 210 * kb, bh = 330 * kb, doblez = 40 * kb;
  const bolsa = `<div style="position:relative;width:${bw}px;height:${bh}px;background:linear-gradient(90deg,#B4875B,#BE9165 50%,#B4875B);box-shadow:0 26px 40px rgba(40,25,10,.35)">
    <div style="position:absolute;left:0;right:0;top:0;height:${doblez}px;background:linear-gradient(#A47650,#AD7F57);box-shadow:0 6px 8px -2px rgba(0,0,0,.35)"></div>
    <div style="position:absolute;left:${(bw - 120 * kb) / 2}px;top:${doblez + 30 * kb}px;width:${120 * kb}px;height:${90 * kb}px;background:url('${img('docs/marketing/bolsa/opcion-barata/sello-frente.png')}') center/cover;mix-blend-mode:multiply;opacity:.88"></div>
    <div style="position:absolute;left:${(bw - 50 * kb) / 2}px;top:${doblez - 25 * kb}px;width:${50 * kb}px;height:${50 * kb}px;border-radius:50%;overflow:hidden;box-shadow:0 3px 6px rgba(0,0,0,.3)"><img src="${img(`${OUT}/${c1.archivo}.png`)}" style="position:absolute;left:${-S * kb}px;top:${-S * kb}px;width:${(50 + 2 * S) * kb}px"></div>
    <div style="position:absolute;left:${(bw - 70 * kb) / 2}px;top:${doblez + 135 * kb}px;width:${70 * kb}px;height:${100 * kb}px;border-radius:${4 * kb}px;overflow:hidden;box-shadow:0 3px 6px rgba(0,0,0,.25)"><img src="${img(`${OUT}/${c2.archivo}.png`)}" style="position:absolute;left:${-S * kb}px;top:${-S * kb}px;width:${(70 + 2 * S) * kb}px"></div>
  </div>`;
  const escena = `<div style="position:absolute;inset:0;background:${C.papel};padding:60px 70px;display:flex;gap:80px">
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva}">LOS TRES STICKERS · A ESCALA</div>
      <div style="display:flex;gap:56px;align-items:flex-start">
        ${ficha(c1, '1 · Cierre', 'Ø 50 mm · troquel circular', 'Papel adhesivo couché, full color.', 'Cruza el doblez: si llega roto, se abrió.')}
        ${ficha(c2, '2 · QR de la bolsa', '70 × 100 mm · esquinas 4 mm', 'Papel adhesivo couché MATE (el brillo tapa el QR).', 'Al centro de la bolsa, bajo el sello.')}
        ${ficha(c3, '3 · Calle', '80 × 80 mm · esquinas 6 mm', 'Vinilo blanco + laminado mate UV (sol y lluvia).', 'Donde te dejen pegarlo.')}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva}">ASÍ VA LA BOLSA LISA #20</div>
      ${bolsa}
    </div></div>`;
  const W = 1900, H = 960;
  const tmp = resolve(OUT, '.lamina.html');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}body{width:${W}px;height:${H}px;overflow:hidden;position:relative}</style></head><body>${escena}</body></html>`);
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.screenshot({ path: `${OUT}/lamina-stickers.png` });
  await p.close(); rmSync(tmp);
}
await b.close();
console.log(`✓ ${piezas.length} stickers y la lámina en ${OUT}`);
