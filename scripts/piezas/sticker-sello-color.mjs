// SND//WCH — el frente de la bolsa como sticker A COLOR, 10 × 10 cm (dueño, 2026-11-11: «¿Por qué sin color o a una
// tinta y es un sticker?»). Es la distribución de los dos sellos (7-cabecera + 7-pie de scripts/piezas/stickers.mjs),
// pero a color: crema de fondo, verde de la marca, el // dorado y celeste, el logo a color y la pastilla celeste.
// Uso: FUENTES_CSS=… node scripts/piezas/sticker-sello-color.mjs [carpeta]
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [OUT = 'docs/marketing/stickers-apertura'] = process.argv.slice(2);
const CREMA = '#F2F0EB', VERDE = '#1E3932', ORO = '#CBA258', CELESTE = '#8CC8EC';
const L = 100, S = 3, R = 4;  // corte, sangrado, esquina (mm)
const IG = '@snd__wch';
const WSP = (() => { const n = /var WA='(\d+)'/.exec(readFileSync('src/app/01-catalogo-y-estado.ts', 'utf8'))[1].replace(/^51/, '');
  return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`; })();
const SIN_MOTA = 'clip-path:polygon(0 0,100% 0,100% 100%,23% 100%,23% 84%,0 84%)';
const icono = (tipo) => { const a = `fill="none" stroke="${CREMA}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"`;
  const d = { web: `<circle cx="12" cy="12" r="6.6" ${a}/><ellipse cx="12" cy="12" rx="2.8" ry="6.6" ${a}/><path d="M5.4 12h13.2" ${a}/>`,
    wsp: `<path d="M12 5.6a6.4 6.4 0 0 0-5.5 9.7L5.8 18.4l3.2-.8A6.4 6.4 0 1 0 12 5.6z" ${a}/><path d="M10 9.3c.3-.3.7-.3.9.1l.5 1c.1.3 0 .6-.2.8l-.3.3c.4.9 1.1 1.6 2 2l.3-.3c.2-.2.5-.3.8-.2l1 .5c.4.2.4.6.1.9l-.5.5c-.4.4-1.1.5-1.7.2-1.6-.8-2.9-2-3.6-3.6-.3-.6-.2-1.3.2-1.7z" fill="${CREMA}"/>` }[tipo];
  return `<svg width="4.4mm" height="4.4mm" viewBox="0 0 24 24" style="flex:none"><circle cx="12" cy="12" r="12" fill="${VERDE}"/>${d}</svg>`; };
const dato = (t, a, b) => `<div style="display:flex;gap:1.6mm;align-items:center">${icono(t)}<div style="font:800 2.15mm/1.25 Archivo;letter-spacing:.06em;color:${VERDE};white-space:nowrap">${a}<br>${b}</div></div>`;
const etiqueta = (a, b) => `<div style="font:800 1.75mm/1.2 Archivo;letter-spacing:.1em;text-align:center;color:${VERDE}">${a}<br>${b}</div>`;
const barra = (c) => `<i style="display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;background:${c}"></i>`;
const T = L + 2 * S;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:${T}mm;height:${T}mm;overflow:hidden}@page{size:${T}mm ${T}mm;margin:0}</style></head><body>
<div id="v" style="position:relative;width:${T}mm;height:${T}mm;background:${CREMA};overflow:hidden">
  <div style="position:absolute;left:${S + 5}mm;right:${S + 5}mm;top:${S + 6}mm;display:flex;align-items:center;justify-content:space-between">
    ${etiqueta('DESDE', '2026')}
    <div id="nombre" style="font:900 14mm/1 Archivo;color:${VERDE};display:inline-flex;align-items:center;letter-spacing:.01em;white-space:nowrap">SND<span style="display:inline-flex;gap:.16em;margin:0 .1em">${barra(ORO)}${barra(CELESTE)}</span>WCH</div>
    ${etiqueta('15·30', 'CM')}</div>
  <div style="position:absolute;left:0;right:0;top:${S + 21.5}mm;text-align:center;font:italic 500 4.7mm/1 Archivo;color:${VERDE}">«Alguien pidió bien.»</div>
  <img src="file://${resolve('img/marca/avatar-1024-transparente.png')}" style="${SIN_MOTA};position:absolute;right:${S + 3}mm;top:${S + 30}mm;width:56mm;height:56mm">
  <div style="position:absolute;left:${S + 7}mm;top:${S + 52}mm;display:flex;flex-direction:column;gap:2.6mm">${dato('web', 'PIDE EN', 'SNDWCH.APP')}${dato('wsp', 'WSP', WSP)}</div>
  <div style="position:absolute;left:0;right:0;bottom:${S + 5}mm;display:flex;justify-content:center">
    <div style="height:8mm;display:inline-flex;align-items:center;gap:1.9mm;background:${CELESTE};border-radius:99mm;padding:0 3.6mm;color:${VERDE};white-space:nowrap">
      <span style="font:800 2.1mm/1.1 Archivo;letter-spacing:.07em;text-align:right">SÚBELA Y<br>ETIQUÉTANOS</span>
      <span style="font:900 4.4mm/1 Archivo">${IG}</span></div></div>
</div></body></html>`;
const tmp = resolve(OUT, '.sello-color.html'); writeFileSync(tmp, html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: Math.ceil(T * 96 / 25.4), height: Math.ceil(T * 96 / 25.4) }, deviceScaleFactor: 6 });
await p.goto('file://' + tmp, { waitUntil: 'load' });
await p.addStyleTag({ content: readFileSync(process.env.FUENTES_CSS, 'utf8') });
await p.evaluate(async () => { await Promise.all(['900 10px Archivo', '800 10px Archivo', 'italic 500 10px Archivo'].map((f) => document.fonts.load(f))); await document.fonts.ready;
  const n = document.getElementById('nombre'); const w = n.getBoundingClientRect().width, mm = 96 / 25.4; // el nombre llena 64 mm
  n.style.fontSize = (14 * (64 * mm) / w) + 'mm'; });
await p.pdf({ path: `${OUT}/sticker-sello-10x10cm.pdf`, width: `${T}mm`, height: `${T}mm`, printBackground: true, pageRanges: '1' });
const k = 96 / 25.4;
await p.screenshot({ path: `${OUT}/.sello-full.png`, clip: { x: S * k, y: S * k, width: L * k, height: L * k } });
await b.close(); rmSync(tmp);
console.log('listo', OUT);
