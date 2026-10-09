// SND//WCH — piezas/bolsa: la bolsa a una tinta (2026-10-08, docs/marketing/bolsa/) y, en
// `mas-adelante/`, las piezas que el dueño dejó para después.
// La tarjeta que va dentro (dos versiones), el arte de la bolsa, el sello del frente y el patrón
// del papel manteca, en PDF para imprenta (medidas reales en mm, con 3 mm de sangrado) y en PNG
// para verlas, más una maqueta de cómo llega todo junto.
//
// Los números salen del código (datos.json de scripts/piezas/datos.ts); los QR llevan su origen:
// `?grupo=1&src=bolsa` abre un pedido en grupo (el puente que ya existe en la app) y `?src=rappi`
// mide cuántos clientes de Rappi pasan a pedir directo.
//
// Uso: node scripts/piezas/bolsa.mjs datos.json [carpeta]   (FUENTES_CSS, PLAYWRIGHT_CHROMIUM_PATH)
// Necesita `npm install --no-save qrcode@1.5.4` (no está en package.json: solo lo usa este script).
import { chromium } from '@playwright/test';
import QRCode from 'qrcode';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [datosPath, OUT = 'docs/marketing/bolsa'] = process.argv.slice(2);
const D = JSON.parse(readFileSync(datosPath, 'utf8'));
mkdirSync(OUT, { recursive: true });
const img = (p) => 'file://' + resolve(p);
const C = { papel: '#EFE6D4', tinta: '#1E2B22', naranja: '#D8823C', oliva: '#6C7860', celeste: '#8CC8EC', navy: '#1E2F3A', lilaOsc: '#4A3D62', durazno: '#F0D8CC', oro: '#CBA258', kraft: '#B98B5E' };
const qr = (url, color = C.tinta) => QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: color, light: '#0000' } });
// El código del QR de la bolsa (migración 20261009025200: tipo «bebida», una vez por celular). El QR
// lo trae escrito (`?codigo=`) y el dorso lo nombra, para quien llega de Rappi o PedidosYa.
const CODIGO = 'WICHO';
const URL_GRUPO = `https://sndwch.app/?grupo=1&src=bolsa&codigo=${CODIGO}`;
const URL_RAPPI = 'https://sndwch.app/?src=rappi';
const marca = (col = C.tinta, size = '6mm') => `<span style="font:800 ${size}/1 Archivo,sans-serif;color:${col};display:inline-flex;align-items:center;letter-spacing:.01em">SND<span style="display:inline-flex;gap:.16em;margin:0 .1em"><i style="width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block;background:${C.oro}"></i><i style="width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block;background:${C.celeste}"></i></span>WCH</span>`;
function curvas(w, h, color = '#7DBBE0', n = 14, amp = 2.2, grosor = 0.35) {
  let p = '';
  for (let i = 0; i < n; i++) { const y0 = (i / (n - 1)) * h; let d = `M -2 ${y0.toFixed(2)}`; for (let x = 0; x <= w + 4; x += 2) d += ` L ${x} ${(y0 + amp * Math.sin(x / 9 + i * 0.7) + amp * 0.5 * Math.sin(x / 4 + i)).toFixed(2)}`; p += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${grosor}"/>`; }
  return `<svg style="position:absolute;inset:0" width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${p}</svg>`;
}
function espiral(size, color, grosor, vueltas = 3.6) {
  const c = size / 2, pts = [];
  for (let a = 0; a <= vueltas * 2 * Math.PI; a += 0.08) { const r = (a / (vueltas * 2 * Math.PI)) * (size / 2 - grosor); pts.push(`${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`); }
  return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 ${size} ${size}"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round"/></svg>`;
}
const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased;text-wrap:pretty}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92}.voz{font-family:'Instrument Serif',serif;font-style:italic}.mono{font-family:'IBM Plex Mono',monospace;font-weight:600}`;
// Cada pieza: ancho y alto FINALES en mm; se agrega 3 mm de sangrado por lado.
const piezas = [];
// Dueño, 2026-10-08: «No puedo mandar tarjetas por cada uno por ahora: debe ser todo en la bolsa,
// a una sola tinta». Lo de ahora es la bolsa; lo demás queda diseñado en `mas-adelante/`.
const pieza = (archivo, w, h, cuerpo, ahora = false) => piezas.push({ archivo, w, h, cuerpo, dir: ahora ? OUT : `${OUT}/mas-adelante` });
const S = 3; // sangrado

// ── 1 · Tarjeta de la bolsa: pedidos propios → pedido en grupo (mundo de WICHO) ──────────────
pieza('tarjeta-grupo-frente', 90, 55, `<div style="position:absolute;inset:0;background:${C.celeste};color:${C.navy};overflow:hidden">${curvas(96, 61)}
  <div style="position:absolute;left:${S + 5}mm;top:${S + 5}mm;width:52mm">
    <div class="disp" style="font-size:12.5mm">¿Y la<br>oficina?</div>
    <div style="font:800 3.3mm/1.15 Archivo,sans-serif;margin-top:3mm">«Somos seis.<br>Bueno, siete.»</div>
  </div>
  <img src="${img('img/wicho_asoma.png')}" style="position:absolute;right:${S + 1}mm;bottom:0;height:34mm">
  <div style="position:absolute;left:${S + 5}mm;bottom:${S + 4}mm">${marca(C.tinta, '3.2mm').replace(`color:${C.tinta}`, `color:${C.tinta};background:${C.papel};padding:1.2mm 1.8mm;border-radius:1mm`)}</div></div>`);
pieza('tarjeta-grupo-dorso', 90, 55, `<div style="position:absolute;inset:0;background:${C.papel};color:${C.tinta}">
  <div style="position:absolute;left:${S + 5}mm;top:${S + 5}mm;width:30mm;height:30mm">${await qr(URL_GRUPO)}</div>
  <div class="mono" style="position:absolute;left:${S + 5}mm;top:${S + 37}mm;font-size:2.3mm">sndwch.app</div>
  <div style="position:absolute;left:${S + 41}mm;top:${S + 5}mm;width:44mm">
    <div class="disp" style="font-size:7.5mm">Pide<br>en grupo</div>
    <div style="font-size:2.9mm;line-height:1.35;margin-top:2.5mm">Cada uno elige lo suyo desde su celular. Con ${D.organizadorDesde}, el más barato va gratis.</div>
  </div>
  <div style="position:absolute;left:${S}mm;right:${S}mm;bottom:${S}mm;height:3mm;background:repeating-linear-gradient(90deg,${C.oliva} 0 .5mm,transparent .5mm 1.3mm);opacity:.5"></div></div>`);

// ── 2 · Tarjeta de la bolsa: pedidos de Rappi → la próxima, directo (mundo de SANDO) ─────────
pieza('tarjeta-rappi-frente', 90, 55, `<div style="position:absolute;inset:0;background:${C.papel};color:${C.tinta};overflow:hidden">
  <div style="position:absolute;left:0;top:0;bottom:0;width:${S + 2.2}mm;background:${C.naranja}"></div>
  <div style="position:absolute;left:${S + 7}mm;top:${S + 5}mm;width:50mm">
    <div class="disp" style="font-size:10mm;white-space:nowrap">La próxima,<br>directo.</div>
    <div class="voz" style="font-size:4.4mm;margin-top:2.5mm;white-space:nowrap">Ya sabes dónde encontrarnos.</div>
  </div>
  <img src="${img('img/sando2_asoma.png')}" style="position:absolute;right:${S - 1}mm;bottom:-6mm;height:44mm">
  <div style="position:absolute;left:${S + 7}mm;bottom:${S + 4}mm">${marca(C.tinta, '3.2mm')}</div></div>`);
pieza('tarjeta-rappi-dorso', 90, 55, `<div style="position:absolute;inset:0;background:${C.papel};color:${C.tinta}">
  <div style="position:absolute;left:0;top:0;bottom:0;width:${S + 2.2}mm;background:${C.naranja}"></div>
  <div style="position:absolute;left:${S + 7}mm;top:${S + 5}mm;width:30mm;height:30mm">${await qr(URL_RAPPI)}</div>
  <div class="mono" style="position:absolute;left:${S + 7}mm;top:${S + 37}mm;font-size:2.3mm">sndwch.app</div>
  <div style="position:absolute;left:${S + 43}mm;top:${S + 5}mm;width:42mm">
    <div class="disp" style="font-size:7.5mm">En la app<br>hay más</div>
    <div style="font-size:2.9mm;line-height:1.35;margin-top:2.5mm">Armas el tuyo paso a paso, cada pedido suma puntos y, pidiendo, se abre el menú secreto.</div>
  </div></div>`);

// ── 3 · Sticker de cierre: redondo, cruza el doblez de la bolsa ──────────────────────────────

// ── 3b · Etiqueta de cada sándwich: en un pedido de grupo dice de quién es (cocina lo escribe) ─
pieza('etiqueta-sandwich', 50, 30, `<div style="position:absolute;inset:0;background:${C.papel};color:${C.tinta}">
  <div style="position:absolute;left:0;top:0;bottom:0;width:${S + 1.6}mm;background:${C.naranja}"></div>
  <div style="position:absolute;left:${S + 5}mm;right:${S + 3.5}mm;top:${S + 3.2}mm">
    <div style="display:flex;align-items:flex-end;gap:2mm"><span class="disp" style="font-size:5.4mm">Para</span><span style="flex:1;border-bottom:.3mm solid ${C.tinta};height:4.6mm"></span></div>
    <div class="mono" style="font-size:2.2mm;letter-spacing:.06em;margin-top:5.2mm;display:flex;align-items:flex-end;gap:1.4mm">ARMADO A LAS<span style="width:7mm;border-bottom:.3mm solid ${C.tinta};height:3mm"></span>:<span style="width:7mm;border-bottom:.3mm solid ${C.tinta};height:3mm"></span></div>
  </div>
  <div style="position:absolute;right:${S + 3.5}mm;bottom:${S + 2.6}mm">${marca(C.tinta, '2.4mm')}</div></div>`);

// ── 4 · La bolsa, a UNA tinta sobre kraft (lo que se imprime ahora) ───────────────────────────
//        El «//» va dorado y celeste o no va (CLAUDE.md, regla 10): a una tinta no se puede, así
//        que el nombre en la bolsa es sndwch.app, que además es donde se pide. La cara de los
//        hermanos ya va en el papel manteca. El dorso hace el trabajo de la tarjeta: el grupo.
const costillas = (alto) => `<div style="height:${alto}mm;background:repeating-linear-gradient(90deg,${C.tinta} 0 1.6mm,transparent 1.6mm 4.2mm)"></div>`;
const DOBLEZ = 60; // mm de arriba que quedan bajo la solapa al cerrar la bolsa: ahí no va nada
pieza('bolsa-frente', 240, 300, `<div style="position:absolute;inset:0;background:${C.kraft};color:${C.tinta};overflow:hidden">
  <div style="position:absolute;left:0;right:0;top:${S + DOBLEZ + 4}mm;height:40mm;overflow:hidden">${curvas(246, 40, C.tinta, 7, 2.6, 0.7)}</div>
  <div style="position:absolute;left:${S + 22}mm;right:${S + 22}mm;top:${S + DOBLEZ + 64}mm">
    <div class="voz" style="font-size:36mm;line-height:.98">Alguien<br>pidió bien.</div>
  </div>
  <div class="mono" style="position:absolute;left:${S + 22}mm;bottom:${S + 38}mm;font-size:12mm;letter-spacing:.03em">sndwch.app</div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:${S + 22}mm">${costillas(S + 22)}</div></div>`, true);
pieza('bolsa-dorso', 240, 300, `<div style="position:absolute;inset:0;background:${C.kraft};color:${C.tinta};overflow:hidden">
  <div style="position:absolute;left:${S + 22}mm;right:${S + 22}mm;top:${S + DOBLEZ + 10}mm">
    <div class="disp" style="font-size:30mm">¿Y la<br>oficina?</div>
    <div style="font:800 9mm/1.15 Archivo,sans-serif;margin-top:6mm">«Somos seis. Bueno, siete.»</div>
  </div>
  <div style="position:absolute;left:${S + 22}mm;top:${S + DOBLEZ + 112}mm;width:52mm;height:52mm">${await qr(URL_GRUPO)}</div>
  <div style="position:absolute;left:${S + 84}mm;right:${S + 20}mm;top:${S + DOBLEZ + 112}mm">
    <div class="disp" style="font-size:13mm">Pide<br>en grupo</div>
    <div style="font-size:6.2mm;line-height:1.3;margin-top:4mm">Cada uno elige lo suyo desde su celular. Con ${D.organizadorDesde}, el más barato va gratis.</div>
  </div>
  <div class="mono" style="position:absolute;left:${S + 22}mm;top:${S + DOBLEZ + 168}mm;font-size:6mm">sndwch.app</div>
  <div style="position:absolute;left:${S + 22}mm;right:${S + 20}mm;top:${S + DOBLEZ + 180}mm;font:800 6.6mm/1.25 Archivo,sans-serif">Tu primera vez en la web, la bebida va gratis: código ${CODIGO}.</div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:${S + 22}mm">${costillas(S + 22)}</div></div>`, true);

// ── 4b · Los stickers (cierre, QR de la bolsa y calle) viven en scripts/piezas/stickers.mjs ────

// ── 4c · El sello del frente (2026-10-09, dueño: «compre bolsas lisas y luego con sello le coloco
//        el frontal»). Arte en negro puro para la sellería, a tamaño real (12 × 9 cm). El QR NO va
//        en el sello: la tinta se corre en el kraft y deja de leerse; va en su propio sticker.
piezas.push({ archivo: 'sello-frente', w: 120, h: 90, dir: `${OUT}/opcion-barata`, cuerpo: `<div style="position:absolute;inset:0;background:#fff;color:#000">
  <div class="voz" style="position:absolute;left:${S + 8}mm;top:${S + 10}mm;font-size:27mm;line-height:.95">Alguien<br>pidió bien.</div>
  <div class="mono" style="position:absolute;left:${S + 9}mm;top:${S + 70}mm;font-size:8mm;letter-spacing:.03em">sndwch.app</div>
</div>` });

// ── 5 · Papel manteca: patrón a UNA tinta (así se imprime), sin el «//» que pide dos colores ──
//        La espiral es de WICHO, las costillas de SANDO; la frase es la promesa.
{
  const t = 50; let celdas = '';
  for (let y = 0; y < 300 / t; y++) for (let x = -1; x < 300 / t; x++) {
    const k = ((x + y) % 3 + 3) % 3;
    const cx = x * t + (y % 2 ? t / 2 : 0), cy = y * t;
    celdas += k === 0
      ? `<div style="position:absolute;left:${cx + 15}mm;top:${cy + 15}mm">${espiral(20, C.tinta, 1.1)}</div>`
      : k === 1
        ? `<div style="position:absolute;left:${cx + 14}mm;top:${cy + 17}mm;width:22mm;height:16mm;background:repeating-linear-gradient(90deg,${C.tinta} 0 1mm,transparent 1mm 2.6mm)"></div>`
        : `<div class="mono" style="position:absolute;left:${cx + 4}mm;top:${cy + 22}mm;font-size:4.2mm;color:${C.tinta};letter-spacing:.12em;white-space:nowrap;transform:rotate(-8deg)">ARMADO AL MOMENTO</div>`;
  }
  pieza('papel-manteca-patron', 300, 300, `<div style="position:absolute;inset:0;background:#F6F1E6;overflow:hidden">${celdas}</div>`);
}

// ── Render: PDF vectorial con sangrado (imprenta) + PNG para verlas ──────────────────────────
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const fuentes = process.env.FUENTES_CSS ? readFileSync(process.env.FUENTES_CSS, 'utf8') : null;
const MM = 96 / 25.4;
for (const x of piezas) {
  mkdirSync(x.dir, { recursive: true });
  const W = x.w + 2 * S, H = x.h + 2 * S;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${W}mm;height:${H}mm;overflow:hidden}@page{size:${W}mm ${H}mm;margin:0}</style></head><body><div style="position:relative;width:${W}mm;height:${H}mm;overflow:hidden">${x.cuerpo}</div></body></html>`;
  const tmp = resolve(x.dir, `.${x.archivo}.html`); writeFileSync(tmp, html);
  const p = await b.newPage({ viewport: { width: Math.ceil(W * MM), height: Math.ceil(H * MM) }, deviceScaleFactor: x.w > 100 ? 1.2 : 4 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  if (fuentes) await p.addStyleTag({ content: fuentes });
  else await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700;800&family=IBM+Plex+Mono:wght@600&family=Instrument+Serif:ital@1&display=block' });
  await p.evaluate(async () => { await Promise.all(['400 10px Anton', '800 10px Archivo', '600 10px "IBM Plex Mono"', 'italic 400 10px "Instrument Serif"'].map((f) => document.fonts.load(f))); await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
  await p.pdf({ path: `${x.dir}/${x.archivo}.pdf`, width: `${W}mm`, height: `${H}mm`, printBackground: true, pageRanges: '1' });
  await p.screenshot({ path: `${x.dir}/${x.archivo}.png`, clip: { x: 0, y: 0, width: W * MM, height: H * MM } });
  await p.close(); rmSync(tmp);
}
// ── Maqueta: la bolsa por sus dos caras, doblada (sin sticker: todo va impreso) ──────────────
{
  const MS = 3;
  const recorte = (archivo, fw, fh, wpx, estilo = '') => {
    const hpx = (wpx * fh) / fw, k = wpx / fw;
    return `<div style="position:absolute;width:${wpx}px;height:${hpx}px;overflow:hidden;${estilo}"><img src="${img(`${OUT}/${archivo}.png`)}" style="position:absolute;left:${-MS * k}px;top:${-MS * k}px;width:${(fw + 2 * MS) * k}px"></div>`;
  };
  const solapa = (w, alto) => `<div style="position:absolute;left:0;top:0;width:${w}px;height:${alto}px;background:linear-gradient(#A47650,#B08257);box-shadow:0 6px 8px -2px rgba(0,0,0,.35)"></div>`;
  const W = 440, Hb = 550, sol = Math.round((Hb * DOBLEZ) / 300) - 8;
  const bolsa = (x, cara) => `<div style="position:absolute;left:${x}px;top:110px;width:${W}px;height:${Hb}px;background:${C.kraft};box-shadow:0 26px 40px rgba(40,25,10,.35);overflow:hidden">
    ${recorte(cara, 240, 300, W, 'left:0;top:0')}${solapa(W, sol)}</div>`;
  const nota = (x, y, t) => `<div class="mono" style="position:absolute;left:${x}px;top:${y}px;font-size:15px;letter-spacing:.06em;color:#5A4E40">${t}</div>`;
  const escena = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 40% 30%,#E4DCCF,#C7BCAA)">
    ${bolsa(170, 'bolsa-frente')}${bolsa(700, 'bolsa-dorso')}
    ${nota(170, 690, 'FRENTE · UNA TINTA')}${nota(700, 690, 'DORSO · EL QR ABRE UN PEDIDO EN GRUPO')}
  </div>`;
  const tmp = resolve(OUT, '.maqueta.html');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}body{width:1310px;height:760px;overflow:hidden;position:relative}</style></head><body>${escena}</body></html>`);
  const p = await b.newPage({ viewport: { width: 1310, height: 760 }, deviceScaleFactor: 1.5 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  if (fuentes) await p.addStyleTag({ content: fuentes });
  await p.evaluate(async () => { await document.fonts.load('600 10px "IBM Plex Mono"'); await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
  await p.screenshot({ path: `${OUT}/maqueta-bolsa.png` });
  await p.close(); rmSync(tmp);
}
await b.close();
console.log(`✓ bolsa en ${OUT}, ${piezas.filter((x) => x.dir.endsWith('mas-adelante')).length} piezas en ${OUT}/mas-adelante y la opción barata en ${OUT}/opcion-barata (PDF con 3 mm de sangrado + PNG)`);
