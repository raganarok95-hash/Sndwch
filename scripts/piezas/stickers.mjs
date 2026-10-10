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
const CODIGO = 'DIRECTO';
const URL_BOLSA = `https://sndwch.app/?src=bolsa&codigo=${CODIGO}`;
const URL_CALLE = `https://sndwch.app/?src=calle&codigo=${CODIGO}`;
const qr = (url, color) => QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'Q', color: { dark: color, light: '#0000' } });
const S = 3; // sangrado, mm
// El PNG del logo trae una mota suelta abajo a la izquierda (fuera del dibujo): se recorta ahí.
const SIN_MOTA = 'clip-path:polygon(0 0,100% 0,100% 100%,23% 100%,23% 84%,0 84%)';

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
//        `selloRedondo` lo dibuja con centro en (cx, cy) mm de su contenedor; lo usan el cierre
//        redondo y la tira larga.
function selloRedondo(cx, cy, id, abajo = 'SI LLEGA ABIERTO, AVÍSANOS', d = 50) {
  const rA = 20.9, rB = 22.9; // el texto queda a 2 mm del corte de un círculo de 50
  const barras = (x, y) => `<g transform="translate(${x} ${y})">${[[C.oro, -0.62], [C.celeste, 0.62]].map(([col, dx]) => `<rect x="${dx - 0.22}" y="-1.35" width="0.44" height="2.7" rx="0.12" fill="${col}" transform="skewX(-16)"/>`).join('')}</g>`;
  return `<svg style="position:absolute;left:${cx - d / 2}mm;top:${cy - d / 2}mm;overflow:visible" width="${d}mm" height="${d}mm" viewBox="${-25} ${-25} 50 50">
    <defs>
      <path id="${id}-a" d="M${-rA},0 A${rA},${rA} 0 0 1 ${rA},0"/>
      <path id="${id}-b" d="M${-rB},0 A${rB},${rB} 0 0 0 ${rB},0"/>
    </defs>
    <circle r="17.6" fill="${C.papel}"/>
    <circle r="17.6" fill="none" stroke="${C.oro}" stroke-width="0.35"/>
    <g font-family="IBM Plex Mono" font-weight="600" font-size="3.1" fill="${C.papel}" letter-spacing="0.35">
      <text text-anchor="middle"><textPath href="#${id}-a" startOffset="50%">ARMADO AL MOMENTO</textPath></text>
      <text text-anchor="middle"><textPath href="#${id}-b" startOffset="50%">${abajo}</textPath></text>
    </g>
    ${barras(-21.3, 0)}${barras(21.3, 0)}
  </svg>
  <img src="${img('img/marca/avatar-1024-transparente.png')}" style="${SIN_MOTA};position:absolute;left:${cx - 15.5 * d / 50}mm;top:${cy - 15.5 * d / 50}mm;width:${31 * d / 50}mm;height:${31 * d / 50}mm">`;
}
pieza('1-cierre', 50, 50, 'circulo', `<div style="position:absolute;inset:0;background:${C.tinta}"></div>${selloRedondo(S + 25, S + 25, 'c1')}`);

// ── 2 · QR de la bolsa 70×100: el mundo de WICHO (celeste, curvas de nivel, su círculo) ──────
//        `ladoQR(x0, y0, w, h, extra)` dibuja el contenido con su esquina en (x0, y0) mm; lo usan el
//        sticker suelto y la tira larga. `extra` agranda el fondo (el sangrado) sin mover nada.
async function ladoQR(x0, y0, w, h, extra = 0) {
  const X = x0 + 6;
  return `<div style="position:absolute;left:${x0 - extra}mm;top:${y0 - extra}mm;width:${w + 2 * extra}mm;height:${h + 2 * extra}mm;background:${C.celeste};overflow:hidden">${curvas(w + 2 * extra, h + 2 * extra, C.curva, Math.round(h / 4.8), 1.8, 0.3)}</div>
    <div style="position:absolute;left:${x0 - extra}mm;top:${y0 - extra}mm;width:${w + 2 * extra}mm;height:${h + 2 * extra}mm;overflow:hidden;color:${C.navy}">
      <div style="position:absolute;left:${X - x0 + extra}mm;top:${7 + extra}mm;font:800 4.6mm/1 Archivo,sans-serif">La próxima vez,</div>
      <div class="disp" style="position:absolute;left:${X - x0 + extra - 0.4}mm;top:${13 + extra}mm;font-size:16.5mm">Pide<br>directo</div>
      <div style="position:absolute;left:${X - x0 + extra}mm;top:${45 + extra}mm;font:800 4.7mm/1 Archivo,sans-serif;white-space:nowrap">y la bebida va <span style="position:relative;display:inline-block;padding:0 1.2mm;margin-left:1mm">gratis<span style="position:absolute;left:-1.6mm;right:-1.8mm;top:-2.4mm;bottom:-2.6mm">${circuloAMano(14.2, 9.4, C.navy)}</span></span></div>
      <img src="${img('img/wicho_rie.png')}" style="position:absolute;right:${extra - 10}mm;bottom:${extra - 5}mm;height:50mm">
      <div style="position:absolute;left:${X - x0 + extra}mm;top:${54 + extra}mm;width:33mm;padding:2.2mm;background:#fff;border-radius:3mm;box-shadow:0 0 0 0.5mm ${C.navy}">${await qr(URL_BOLSA, C.navy)}</div>
      <div class="mono" style="position:absolute;left:${X - x0 + extra}mm;top:${90.5 + extra}mm;font-size:3.5mm;letter-spacing:.06em">código <b style="background:${C.navy};color:${C.celeste};padding:0.3mm 1.2mm;border-radius:1mm">${CODIGO}</b></div>
    </div>`;
}
pieza('2-qr-bolsa', 70, 100, 'rect4', await ladoQR(S, S, 70, 100, S));
// El mismo lado del QR en 50 mm de ancho, para la tira ahorradora (dueño: «mejora más ahorrando
// precios»): todo se reacomoda en columna y WICHO asoma abajo, sin tapar el QR.
async function ladoQRAngosto(x0, y0, w, h, extra = 0) {
  const X = 4.5 + extra;
  return `<div style="position:absolute;left:${x0 - extra}mm;top:${y0 - extra}mm;width:${w + 2 * extra}mm;height:${h + 2 * extra}mm;background:${C.celeste};overflow:hidden">${curvas(w + 2 * extra, h + 2 * extra, C.curva, Math.round(h / 4.8), 1.5, 0.28)}</div>
    <div style="position:absolute;left:${x0 - extra}mm;top:${y0 - extra}mm;width:${w + 2 * extra}mm;height:${h + 2 * extra}mm;overflow:hidden;color:${C.navy}">
      <div style="position:absolute;left:${X}mm;top:${5.5 + extra}mm;font:800 3.3mm/1 Archivo,sans-serif">La próxima vez,</div>
      <div class="disp" style="position:absolute;left:${X - 0.3}mm;top:${9.6 + extra}mm;font-size:12mm">Pide<br>directo</div>
      <div style="position:absolute;left:${X}mm;top:${33.5 + extra}mm;font:800 3.4mm/1 Archivo,sans-serif;white-space:nowrap">y la bebida va <span style="position:relative;display:inline-block;padding:0 0.9mm;margin-left:0.7mm">gratis<span style="position:absolute;left:-1.2mm;right:-1.3mm;top:-1.8mm;bottom:-1.9mm">${circuloAMano(10.4, 7, C.navy)}</span></span></div>
      <div style="position:absolute;left:${X}mm;top:${41.5 + extra}mm;width:27mm;padding:1.8mm;background:#fff;border-radius:2.4mm;box-shadow:0 0 0 0.45mm ${C.navy}">${await qr(URL_BOLSA, C.navy)}</div>
      <div class="mono" style="position:absolute;left:${X}mm;top:${75 + extra}mm;font-size:2.8mm;letter-spacing:.05em">código <b style="background:${C.navy};color:${C.celeste};padding:0.25mm 1mm;border-radius:0.8mm">${CODIGO}</b></div>
      <img src="${img('img/wicho_rie.png')}" style="position:absolute;right:${extra - 8}mm;bottom:${extra - 4}mm;height:34mm">
      <div class="mono" style="position:absolute;left:${X}mm;bottom:${7 + extra}mm;font-size:2.6mm">sndwch.app</div>
    </div>`;
}

// ── 3 · Calle 80×80: papel, tinta, el forro naranja vertical, el acanalado y el LOGO ────────────
// Dueño, 2026-10-10: «cambia a sando por el logo». En la calle nadie conoce a SANDO todavía; el logo
// es lo que va a volver a ver en la bolsa y en Instagram.
{
  // Dueño, 2026-10-10: «cámbialo un poco, más marketing». El orden de un aviso que se lee al paso:
  // gancho (la frase), qué es (sándwiches a domicilio), por qué ahora (bebida gratis en el primer
  // pedido: el código DIRECTO, una vez por celular, ya va puesto en el QR) y qué hacer (escanea).
  const w = 80, h = 80;
  pieza('3-calle', w, h, 'rect6', `<div style="position:absolute;inset:0;background:${C.papel};color:${C.tinta};overflow:hidden">
    <div style="position:absolute;right:0;top:0;bottom:0;width:${S + 5}mm;background:${C.naranja}"></div>
    <div style="position:absolute;left:0;right:${S + 5}mm;bottom:0;height:${S + 6}mm;background:${rib(C.oliva)}"></div>
    <div class="voz" style="position:absolute;left:${S + 5.5}mm;top:${S + 5}mm;font-size:8.6mm;line-height:.98">Si lees esto,<br>ya tienes<br>hambre.</div>
    <div class="disp" style="position:absolute;left:${S + 5.8}mm;top:${S + 31.6}mm;font-size:3.6mm;letter-spacing:.06em;color:${C.naranja};white-space:nowrap">Sándwiches a domicilio</div>
    <img src="${img('img/marca/avatar-1024-transparente.png')}" style="${SIN_MOTA};position:absolute;left:${S + 1.3}mm;top:${S + 34.6}mm;width:42mm;height:42mm">
    <div style="position:absolute;left:${S + 48.6}mm;top:${S + 5.5}mm;width:21mm;height:21mm;border-radius:50%;background:${C.naranja};color:${C.papel};transform:rotate(-10deg);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 0 0.7mm ${C.papel},0 0 0 1.2mm ${C.naranja}">
      <div class="disp" style="font-size:4.8mm;line-height:.95;text-align:center">Bebida<br>gratis</div>
      <div style="font:800 1.8mm/1.15 Archivo,sans-serif;margin-top:0.9mm;letter-spacing:.04em;text-transform:uppercase;text-align:center">en tu<br>1.er pedido</div></div>
    <div class="mono" style="position:absolute;right:${S + 9}mm;top:${S + 31}mm;width:24mm;text-align:center;font-size:2.5mm;letter-spacing:.02em;white-space:nowrap">escanea y pide ↓</div>
    <div style="position:absolute;right:${S + 9}mm;top:${S + 35}mm;width:24mm;height:24mm;padding:1.6mm;background:#fff;border-radius:2mm">${await qr(URL_CALLE, C.tinta)}</div>
    <div style="position:absolute;right:${S + 9}mm;top:${S + 61.2}mm;width:24mm;text-align:center">${marca(C.tinta, '4.1mm')}</div>
  </div>`);
}

// ── 4 · La tira de cierre larga 70×200 (opción B, dueño 2026-10-09: «que no sean dos sino uno
//        solo, el de cierre, largo, y contenga el QR»). Un solo sticker cruza la boca de la bolsa:
//        baja 75 mm por el FRENTE con el sello redondo (cruza el doblez: si llega abierto, se ve),
//        pasa 10 mm por arriba y baja 115 mm por el DORSO con el QR. En el pliego, el tramo del
//        frente va de cabeza: al doblarla, las dos caras quedan derechas.
//        Precorte (dueño: «usualmente se jode al sacar el sticker»): la tira NO se despega; se
//        rasga por una línea precortada justo en el borde del doblez. El kraft no se rompe, el QR
//        queda entero en el dorso para la próxima, y un precorte roto delata si la abrieron. La
//        frase que rota va impresa en la tira (tres versiones en el mismo tiraje): no cuesta sellos.
//        Ahorro (dueño: «mejora más ahorrando precios»): 50 mm de ancho en vez de 70. En una hoja
//        A3 (297 × 420) entran 10 tiras de 50 × 190 (5 × 2) y solo 4 o 5 de 70 × 215: cada tira
//        sale a menos de la mitad. Una sola versión; las frases quedan para más adelante
//        (FRASES_TIRA, dueño: «las frases, para el futuro mejor»).
const TIRA = { ancho: 50, frente: 72, boca: 8, dorso: 110, precorte: 24 };
const FRASES_TIRA = ['Hoy comes mejor que tu jefe.', 'Esto no se comparte.', 'Pediste bien. Cuéntalo.'];
let idTira = 0;
const tramoFrente = (x0, y0, frase = '') => `<div style="position:absolute;left:${x0}mm;top:${y0}mm;width:${TIRA.ancho}mm;height:${TIRA.frente}mm;background:${C.tinta}"></div>
  <div class="mono" style="position:absolute;left:${x0}mm;width:${TIRA.ancho}mm;top:${y0 + TIRA.precorte - 5.6}mm;text-align:center;font-size:2.1mm;letter-spacing:.1em;color:${C.papel}">↓ RASGA AQUÍ PARA ABRIR ↓</div>
  <div style="position:absolute;left:${x0 + 2}mm;width:${TIRA.ancho - 4}mm;top:${y0 + TIRA.precorte}mm;border-top:0.4mm dashed ${C.papel}"></div>
  ${selloRedondo(x0 + TIRA.ancho / 2, y0 + TIRA.precorte + 24, 'tira' + ++idTira, 'SI LLEGA RASGADO, AVÍSANOS', 40)}
  ${frase ? `<div style="position:absolute;left:${x0}mm;width:${TIRA.ancho}mm;top:${y0 + TIRA.frente - 6}mm;text-align:center;font:italic 500 3.2mm/1 Archivo,sans-serif;color:${C.papel};white-space:nowrap">«${frase}»</div>` : ''}`;
const tramoBoca = (x0, y0) => `<div style="position:absolute;left:${x0}mm;top:${y0}mm;width:${TIRA.ancho}mm;height:${TIRA.boca}mm;background:${C.tinta};display:flex;align-items:center;justify-content:center;gap:1mm">${[C.oro, C.celeste].map((col) => `<i style="display:block;width:0.8mm;height:4.4mm;border-radius:0.2mm;background:${col};transform:skewX(-16deg)"></i>`).join('')}</div>`;
const LARGO_TIRA = TIRA.frente + TIRA.boca + TIRA.dorso;
const ARCHIVO_TIRA = `4-tira-${TIRA.ancho}x${LARGO_TIRA}`;
piezas.push({ archivo: ARCHIVO_TIRA, w: TIRA.ancho, h: LARGO_TIRA, forma: 'rect4', cuerpo: `
  <div style="position:absolute;left:0;top:0;width:${TIRA.ancho + 2 * S}mm;height:${TIRA.frente + S}mm;transform:rotate(180deg);overflow:hidden">
    <div style="position:absolute;inset:0;background:${C.tinta}"></div>${tramoFrente(S, 0)}</div>
  <div style="position:absolute;left:0;top:${S + TIRA.frente}mm;width:${TIRA.ancho + 2 * S}mm;height:${TIRA.boca}mm;background:${C.tinta}"></div>${tramoBoca(S, S + TIRA.frente)}
  <div style="position:absolute;left:0;top:${S + TIRA.frente + TIRA.boca}mm;width:${TIRA.ancho + 2 * S}mm;height:${TIRA.dorso + S}mm;overflow:hidden">${await ladoQRAngosto(S, 0, TIRA.ancho, TIRA.dorso, S)}</div>` });

// ── 5 · Cierre con QR, cuadrado de 7 cm (opción C, 2026-10-09). Con la lista de precios que trajo
//        el dueño (stickers troquelados full color en papel adhesivo: 7 cm a S/150 el millar), un
//        cuadrado de MEDIDA DE LISTA hace lo de la tira por menos de la mitad: la franja de arriba
//        va sobre el doblez y se rasga por el precorte; abajo, el QR con DIRECTO. Va al frente,
//        arriba al centro: es lo primero que se ve.
// Como en la tira (dueño, 2026-10-10: «está al revés, mira lo que hiciste antes y las medidas»):
// ARRIBA del precorte, sobre la solapa, va solo «rasga aquí» (esa franja se va con la solapa al
// abrir). DEBAJO, en el cuerpo de la bolsa, va lo que se queda: el logo con SND//WCH y el QR.
const CUADRO = { lado: 70, franja: 11, marca: 15 };
async function cierreQR(x0, y0, extra = 0) {
  const L = CUADRO.lado, F = CUADRO.franja, M = CUADRO.marca, Q = F + M; // Q: donde empieza el celeste
  return `<div style="position:absolute;left:${x0 - extra}mm;top:${y0 - extra}mm;width:${L + 2 * extra}mm;height:${Q + extra}mm;background:${C.tinta}"></div>
  <div class="mono" style="position:absolute;left:${x0}mm;width:${L}mm;top:${y0 + F - 6.3}mm;text-align:center;font-size:2.4mm;letter-spacing:.12em;color:${C.oro}">↓ RASGA AQUÍ PARA ABRIR ↓</div>
  <div style="position:absolute;left:${x0 - extra}mm;width:${L + 2 * extra}mm;top:${y0 + F}mm;border-top:0.4mm dashed ${C.papel};z-index:2"></div>
  <div style="position:absolute;left:${x0 + 4.5}mm;top:${y0 + F + 1.6}mm;width:11.8mm;height:11.8mm;border-radius:50%;background:${C.papel};box-shadow:0 0 0 0.3mm ${C.oro}"></div>
  <img src="${img('img/marca/avatar-1024-transparente.png')}" style="${SIN_MOTA};position:absolute;left:${x0 + 4.95}mm;top:${y0 + F + 2.05}mm;width:10.9mm;height:10.9mm">
  <div style="position:absolute;left:${x0 + 19.5}mm;top:${y0 + F + 2.4}mm">${marca(C.papel, '6.2mm')}</div>
  <div class="mono" style="position:absolute;left:${x0 + 19.8}mm;top:${y0 + F + 9.8}mm;font-size:2.1mm;letter-spacing:.06em;color:${C.papel};white-space:nowrap">SI LLEGA RASGADO, AVÍSANOS</div>
  <div style="position:absolute;left:${x0 - extra}mm;top:${y0 + Q}mm;width:${L + 2 * extra}mm;height:${L - Q + extra}mm;background:${C.celeste};overflow:hidden">${curvas(L + 2 * extra, L - Q + extra, C.curva, 10, 1.4, 0.28)}</div>
  <div style="position:absolute;left:${x0 + 4}mm;top:${y0 + Q + 3}mm;width:28mm;padding:1.7mm;background:#fff;border-radius:2.3mm;box-shadow:0 0 0 0.45mm ${C.navy}">${await qr(URL_BOLSA, C.navy)}</div>
  <div style="position:absolute;left:${x0 + 36.5}mm;top:${y0 + Q + 2.6}mm;color:${C.navy}">
    <div style="font:800 2.8mm/1 Archivo,sans-serif">La próxima vez,</div>
    <div class="disp" style="font-size:8.6mm;margin-top:0.9mm">Pide<br>directo</div>
    <div style="font:800 2.9mm/1 Archivo,sans-serif;margin-top:1.3mm;white-space:nowrap">y la bebida va <span style="position:relative;display:inline-block;padding:0 0.8mm;margin-left:0.4mm">gratis<span style="position:absolute;left:-1.1mm;right:-1.2mm;top:-1.6mm;bottom:-1.7mm">${circuloAMano(9.4, 6.2, C.navy)}</span></span></div>
  </div>
  <div class="mono" style="position:absolute;left:${x0 + 4}mm;top:${y0 + Q + 36.6}mm;font-size:2.6mm;letter-spacing:.05em;color:${C.navy}">código <b style="background:${C.navy};color:${C.celeste};padding:0.25mm 1mm;border-radius:0.8mm">${CODIGO}</b></div>
  <div style="position:absolute;left:${x0 - extra}mm;top:${y0 + Q}mm;width:${L + 2 * extra}mm;height:${L - Q + extra}mm;overflow:hidden;pointer-events:none"><img src="${img('img/wicho_rie.png')}" style="position:absolute;right:${extra - 3.5}mm;bottom:${-2.5}mm;height:19.5mm"></div>`;
}
piezas.push({ archivo: '5-cierre-qr-70x70', w: CUADRO.lado, h: CUADRO.lado, forma: 'rect4', cuerpo: await cierreQR(S, S, S) });

// ── Los sellos de la bolsa lisa (2026-10-09, dueño: «rediséñala bien, dame ejemplos») ──────
//    Arte en NEGRO sobre blanco, a tamaño real, para la sellería: uno por cada ejemplo de bolsa.
//    El logo a una tinta lo hace scripts/piezas/logo_a_sello.py (umbral sobre el logo).
const SELLOS = 'docs/marketing/bolsa/sellos';
const LOGO_TINTA = 'docs/marketing/bolsa/sellos/logo-tinta.png';
const LOGO_PROP = (() => { const b = readFileSync(LOGO_TINTA); return b.readUInt32BE(20) / b.readUInt32BE(16); })(); // alto / ancho, del PNG
// Negro para la sellería; verde casi negro (la tinta) para las maquetas.
const logoTinta = (ancho, color) => `<img src="${img(color === '#000' ? LOGO_TINTA : LOGO_TINTA.replace('.png', '-verde.png'))}" style="display:block;width:${ancho}mm;height:${(ancho * LOGO_PROP).toFixed(2)}mm">`;
const frase = (tam, color, alinear = 'left') => `<div class="voz" style="font-size:${tam}mm;line-height:.95;color:${color};text-align:${alinear};white-space:nowrap">Alguien<br>pidió bien.</div>`;
const web = (tam, color) => `<div class="mono" style="font-size:${tam}mm;letter-spacing:.03em;color:${color}">sndwch.app</div>`;
const costado = (largo, alto, color) => `<svg width="${largo}mm" height="${alto}mm" viewBox="0 0 ${largo} ${alto}"><text x="0" y="${alto - 2.4}" font-family="Anton" font-size="${alto * 0.95}" fill="${color}" textLength="${largo}" lengthAdjust="spacingAndGlyphs">ALGUIEN PIDIÓ BIEN.</text></svg>`;
// La mezcla (dueño, 2026-10-09: «me gusta la idea del sello con el logo, me encantó. Mezcla 1, 2 y
// 3, estructúralo bonito»): una cinta vertical con sndwch.app (de la 3) y, a su lado, una columna
// con la cara de los hermanos (de la 2) y la frase (de la 1). Cinta y columna miden lo mismo de
// alto, así todo cuadra en un bloque. Va en UN solo sello: nada que alinear al sellar.
const MEZCLA = { cinta: 19, hueco: 16, logo: 78, gap: 7, frase: 24 };
MEZCLA.alto = MEZCLA.logo * LOGO_PROP + MEZCLA.gap + MEZCLA.frase * 0.95 * 2;
MEZCLA.ancho = MEZCLA.cinta + MEZCLA.hueco + 112;
const cintaVertical = (texto, largo, ancho, color) => `<div style="width:${ancho}mm;height:${largo}mm;position:relative"><svg style="position:absolute;left:0;top:0;transform:translateY(${largo}mm) rotate(-90deg);transform-origin:0 0" width="${largo}mm" height="${ancho}mm" viewBox="0 0 ${largo} ${ancho}"><text x="0" y="${ancho - 1.2}" font-family="Anton" font-size="${ancho * 1.02}" fill="${color}" textLength="${largo}" lengthAdjust="spacingAndGlyphs">${texto}</text></svg></div>`;
const mezcla = (color) => `<div style="display:flex;gap:${MEZCLA.hueco}mm;align-items:stretch">
  ${cintaVertical('SNDWCH.APP', MEZCLA.alto, MEZCLA.cinta, color)}
  <div style="display:flex;flex-direction:column;gap:${MEZCLA.gap}mm">${logoTinta(MEZCLA.logo, color)}${frase(MEZCLA.frase, color)}</div></div>`;
// El «cartel» (dueño, 2026-10-09, con la foto de una bolsa de referencia: «probemos un diseño
// parecido a este»): el nombre grande arriba, la frase debajo, el personaje grande abajo a la
// derecha y una columna de datos con íconos a la izquierda. Con lo nuestro: SNDWCH (a una tinta
// el «//» no va: CLAUDE.md, regla 10), la frase de SANDO y la cara de los hermanos. Los datos son
// solo los reales: sin dirección (no hay local) ni teléfono (no hay uno público).
const IG = '@snd__wch';
// El WhatsApp público es el mismo que muestra la app (botón de soporte y comprobantes): se lee de
// ahí, nunca se escribe a mano. 51930957640 → +51 930 957 640.
const WSP = (() => {
  const m = /var WA='(\d+)'/.exec(readFileSync('src/app/01-catalogo-y-estado.ts', 'utf8'));
  if (!m) throw new Error('no encontré el WhatsApp (var WA) en src/app/01-catalogo-y-estado.ts');
  const n = m[1].replace(/^51/, '');
  return `+51 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
})();
// Íconos como en la referencia: círculo lleno y el dibujo calado (se ve el kraft a través).
let idIcono = 0;
const icono = (tipo, color) => {
  const a = 'stroke="#000" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const dibujo = {
    web: `<circle cx="12" cy="12" r="6.6" ${a}/><ellipse cx="12" cy="12" rx="2.8" ry="6.6" ${a}/><path d="M5.4 12h13.2" ${a}/>`,
    ig: `<rect x="6" y="6" width="12" height="12" rx="3.6" ${a}/><circle cx="12" cy="12" r="2.9" ${a}/><circle cx="15.6" cy="8.4" r="0.9" fill="#000"/>`,
    wsp: `<path d="M12 5.6a6.4 6.4 0 0 0-5.5 9.7L5.8 18.4l3.2-.8A6.4 6.4 0 1 0 12 5.6z" ${a}/><path d="M10 9.3c.3-.3.7-.3.9.1l.5 1c.1.3 0 .6-.2.8l-.3.3c.4.9 1.1 1.6 2 2l.3-.3c.2-.2.5-.3.8-.2l1 .5c.4.2.4.6.1.9l-.5.5c-.4.4-1.1.5-1.7.2-1.6-.8-2.9-2-3.6-3.6-.3-.6-.2-1.3.2-1.7z" fill="#000"/>`,
  }[tipo];
  const id = `ic${++idIcono}`;
  return `<svg width="6.4mm" height="6.4mm" viewBox="0 0 24 24" style="flex:none"><defs><mask id="${id}"><rect width="24" height="24" fill="#fff"/>${dibujo}</mask></defs><circle cx="12" cy="12" r="12" fill="${color}" mask="url(#${id})"/></svg>`;
};
const dato = (tipo, a, b, color) => `<div style="display:flex;gap:2.4mm;align-items:center">${icono(tipo, color)}<div style="font:800 3.2mm/1.25 Archivo,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${color};white-space:nowrap">${a}<br>${b}</div></div>`;
// La distribución de la referencia (dueño: «el dibujo con líneas no me gusta, es más la
// distribución en la bolsa»): nombre ancho y centrado con dos etiquetas chicas a los costados, la
// frase justo debajo, la cara grande abajo a la derecha y los datos abajo a la izquierda.
// La bolsa para que la suban (dueño, 2026-10-09: «basándote en marketing, en que la bolsa sea
// viral, en ganar más clientes» → «listo, trabajemos en eso, hazlo»):
//   1 · pide la historia: una pastilla grande con @snd__wch («súbela y etiquétanos»);
//   2 · frases coleccionables: van IMPRESAS en la tira (FRASES_TIRA), no en sellos;
//   3 · el dorso le habla a la oficina, con la regla del pedido de grupo leída del código.
//   (Dueño: «cada sello cuesta dinero» → tres sellos: cabecera, pie y dorso. La sorpresa adentro
//   del doblez se quitó: al abrir se rompía con el sticker.)
const GRUPO = (() => {
  const m = /organizadorDesde:\s*(\d+)/.exec(readFileSync('supabase/functions/_shared/dinero.ts', 'utf8'));
  if (!m) throw new Error('no encontré organizadorDesde en _shared/dinero.ts');
  return Number(m[1]);
})();
const CARTEL = { ancho: 150, nombre: 120, alto: 17.4, logo: 96, frase: 7, pastilla: 11.5 };
CARTEL.cara = CARTEL.logo * LOGO_PROP;
CARTEL.pie = CARTEL.cara + 5 + CARTEL.pastilla;
const etiqueta = (a, b, color) => `<div style="font:800 2.5mm/1.2 Archivo,sans-serif;letter-spacing:.1em;text-align:center;text-transform:uppercase;color:${color}">${a}<br>${b}</div>`;
const nombreCartel = (color) => `<div style="width:${CARTEL.ancho}mm;display:flex;align-items:center;justify-content:center;gap:3.2mm">
    ${etiqueta('Desde', '2026', color)}
    <svg width="${CARTEL.nombre}mm" height="${CARTEL.alto}mm" viewBox="0 0 ${CARTEL.nombre} ${CARTEL.alto}" style="overflow:visible"><text x="0" y="${CARTEL.alto}" style="font-family:Archivo;font-weight:900;font-stretch:125%" font-size="${CARTEL.alto * 1.38}" fill="${color}" textLength="${CARTEL.nombre}" lengthAdjust="spacingAndGlyphs">SNDWCH</text></svg>
    ${etiqueta('15·30', 'cm', color)}</div>`;
const fraseCartel = (texto, color) => `<div style="font:italic 500 ${CARTEL.frase}mm/1 Archivo,sans-serif;color:${color};white-space:nowrap">«${texto}»</div>`;
const pastilla = (color) => `<div style="height:${CARTEL.pastilla}mm;display:inline-flex;align-items:center;gap:2.6mm;border:0.75mm solid ${color};border-radius:99mm;padding:0 4.6mm;color:${color};white-space:nowrap">
    <span style="font:800 3.2mm/1.1 Archivo,sans-serif;letter-spacing:.07em;text-transform:uppercase;text-align:right">Súbela y<br>etiquétanos</span>
    <span style="font:900 6.2mm/1 Archivo,sans-serif;font-stretch:125%">${IG}</span></div>`;
const pie = (color) => `<div style="width:${CARTEL.ancho}mm;height:${CARTEL.pie.toFixed(1)}mm;position:relative">
  <div style="position:absolute;right:0;top:0">${logoTinta(CARTEL.logo, color)}</div>
  <div style="position:absolute;left:4mm;top:${(CARTEL.cara * 0.48).toFixed(1)}mm;display:flex;flex-direction:column;gap:3.6mm">
    ${dato('web', 'Pide en', 'sndwch.app', color)}${dato('wsp', 'WSP', WSP, color)}</div>
  <div style="position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center">${pastilla(color)}</div></div>`;
// El dorso: lo lee el de al lado. La regla es la de la app: con GRUPO sándwiches, quien organiza
// se lleva el 15CM más barato (REGLAS.organizadorDesde y la elegibilidad de dinero.ts).
const oficina = (color) => `<div style="width:166mm;display:flex;flex-direction:column;align-items:center;gap:3.6mm;color:${color}">
  <svg width="146mm" height="15mm" viewBox="0 0 146 15" style="overflow:visible"><text x="0" y="15" style="font-family:Archivo;font-weight:900;font-stretch:125%" font-size="20.6" fill="${color}" textLength="146" lengthAdjust="spacingAndGlyphs">¿Y LA OFICINA?</text></svg>
  <div style="font:italic 500 6.2mm/1.3 Archivo,sans-serif;text-align:center">Pidan juntos en sndwch.app. Con ${GRUPO} sándwiches,<br>quien organiza se lleva gratis el 15CM más barato.</div></div>`;
const sello = (archivo, w, h, cuerpo) => piezas.push({ archivo, w, h, forma: 'rect', dir: SELLOS, sinSangrado: true, cuerpo: `<div style="position:absolute;inset:0;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4mm">${cuerpo}</div>` });
sello('6-mezcla-150x130', 150, 130, mezcla('#000'));
// Dos sellos (dueño: «mejora más ahorrando precios»): ~210 cm² en vez de ~410. El del dorso
// («¿Y la oficina?», `oficina()`) queda para cuando la bolsa demuestre que trae pedidos.
sello(`7-cabecera-${CARTEL.ancho + 6}x32`, CARTEL.ancho + 6, 32, `${nombreCartel('#000')}${fraseCartel('Alguien pidió bien.', '#000')}`);
sello(`7-pie-${CARTEL.ancho + 6}x${Math.ceil(CARTEL.pie + 6)}`, CARTEL.ancho + 6, Math.ceil(CARTEL.pie + 6), pie('#000'));
sello('1-letrero-120x90', 120, 90, `<div style="width:112mm;display:flex;flex-direction:column;gap:6mm">${frase(27, '#000')}${web(8, '#000')}</div>`);
sello('2-cara-90x115', 90, 115, `${logoTinta(86, '#000')}${web(8, '#000')}`);
sello('3-costado-160x22', 160, 22, costado(156, 20, '#000'));
sello('3-costado-logo-50x60', 50, 60, `${logoTinta(46, '#000')}${web(4.6, '#000')}`);
sello('5-firma-110x140', 110, 140, `${logoTinta(70, '#000')}<div class="voz" style="font-size:15mm;line-height:1;color:#000;white-space:nowrap">Alguien pidió bien.</div>${web(6, '#000')}`);
sello('4-minima-100x30', 100, 30, `<div class="voz" style="font-size:11mm;line-height:1;color:#000">Alguien pidió bien.</div>${web(4.6, '#000')}`);

// ── Render: PDF con sangrado (imprenta) + PNG para verlas ─────────────────────────────────────
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const fuentes = process.env.FUENTES_CSS ? readFileSync(process.env.FUENTES_CSS, 'utf8') : null;
const MM = 96 / 25.4;
const cargar = async (p) => {
  if (fuentes) await p.addStyleTag({ content: fuentes });
  else await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=IBM+Plex+Mono:wght@600&family=Instrument+Serif:ital@1&display=block' });
  await p.evaluate(async () => { await Promise.all(['400 10px Anton', '800 10px Archivo', '900 extra-expanded 10px Archivo', 'italic 500 10px Archivo', '600 10px "IBM Plex Mono"', 'italic 400 10px "Instrument Serif"'].map((f) => document.fonts.load(f))); await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
};
for (const x of piezas) {
  const dir = x.dir || OUT; mkdirSync(dir, { recursive: true });
  const SS = x.sinSangrado ? 0 : S, W = x.w + 2 * SS, H = x.h + 2 * SS;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{width:${W}mm;height:${H}mm;overflow:hidden}@page{size:${W}mm ${H}mm;margin:0}</style></head><body><div style="position:relative;width:${W}mm;height:${H}mm;overflow:hidden">${x.cuerpo}</div></body></html>`;
  const tmp = resolve(dir, `.${x.archivo}.html`); writeFileSync(tmp, html);
  const p = await b.newPage({ viewport: { width: Math.ceil(W * MM), height: Math.ceil(H * MM) }, deviceScaleFactor: 6 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.pdf({ path: `${dir}/${x.archivo}.pdf`, width: `${W}mm`, height: `${H}mm`, printBackground: true, pageRanges: '1' });
  await p.screenshot({ path: `${dir}/${x.archivo}.png`, clip: { x: 0, y: 0, width: W * MM, height: H * MM } });
  await p.close(); rmSync(tmp);
}

// ── Lámina: los tres a la misma escala, con su troquel y su medida ───────────────────────────
const foto = async (archivo, W, H, escena) => {
  const tmp = resolve(OUT, '.foto.html');
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}body{width:${W}px;height:${H}px;overflow:hidden;position:relative}</style></head><body>${escena}</body></html>`);
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await cargar(p);
  await p.screenshot({ path: archivo });
  await p.close(); rmSync(tmp);
};
const recorte = (x, k, sombra = '0 10px 24px rgba(30,30,20,.28)') => {
  const r = x.forma === 'circulo' ? '50%' : x.forma === 'rect4' ? `${4 * k}px` : `${6 * k}px`;
  return `<div style="position:relative;width:${x.w * k}px;height:${x.h * k}px;border-radius:${r};overflow:hidden;box-shadow:${sombra}"><img src="${img(`${OUT}/${x.archivo}.png`)}" style="position:absolute;left:${-S * k}px;top:${-S * k}px;width:${(x.w + 2 * S) * k}px"></div>`;
};
const [c1, c2, c3] = piezas;
{
  const k = 4.2; // px por mm
  const ficha = (x, titulo, medida, material, va) => `<div style="display:flex;flex-direction:column;gap:14px;width:${Math.max(x.w * k, 300)}px">
    <div style="height:${100 * k}px;display:flex;align-items:flex-end">${recorte(x, k)}</div>
    <div class="disp" style="font-size:26px;color:${C.tinta}">${titulo}</div>
    <div class="mono" style="font-size:15px;color:${C.tinta}">${medida}</div>
    <div style="font:400 15px/1.4 Archivo,sans-serif;color:#4A4A40">${material}<br>${va}</div></div>`;
  await foto(`${OUT}/lamina-stickers.png`, 1240, 760, `<div style="position:absolute;inset:0;background:${C.papel};padding:56px 64px;display:flex;flex-direction:column;gap:18px">
    <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva}">LOS TRES STICKERS · A ESCALA</div>
    <div style="display:flex;gap:56px;align-items:flex-start">
      ${ficha(c1, '1 · Cierre', 'Ø 50 mm · troquel circular', 'Papel adhesivo couché, full color.', 'Cruza el doblez: si llega roto, se abrió.')}
      ${ficha(c2, '2 · QR de la bolsa', '70 × 100 mm · esquinas 4 mm', 'Papel adhesivo couché MATE (el brillo tapa el QR).', 'En el dorso de la bolsa.')}
      ${ficha(c3, '3 · Calle', '80 × 80 mm · esquinas 6 mm', 'Vinilo blanco + laminado mate UV (sol y lluvia).', 'Donde te dejen pegarlo.')}
    </div></div>`);
}

// ── La bolsa lisa #20 (21 × 40 × 12.5 cm) ───────────────────────────────────────────────────────
//    Cada cara hace UN trabajo. Frente: el letrero que ven todos (el sello) y el cierre. Dorso: lo
//    que le habla a quien la recibe (el sticker del QR). El sello y el QR se ponen en tanda antes
//    del servicio; al despachar solo se dobla y se pega el cierre.
const DEFS = `<svg width="0" height="0" style="position:absolute"><defs>
  <filter id="fibra" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 0 0.10  0 0 0 0.22 0"/></filter>
  <filter id="tinta" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" result="r"/><feDisplacementMap in="SourceGraphic" in2="r" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="11" result="m"/><feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="mm"/><feComposite in="d" in2="mm" operator="in"/></filter>
</defs></svg>`;
const AN = 210, AL = 345, SOLAPA = 26, FUELLE = 11; // mm de la cara, ya doblada
function kitBolsa(kb) {
  const px = (mm) => (mm * kb).toFixed(1) + 'px';
  // Papel kraft: fibra con ruido calculado, nunca una foto.
  const papel = `<div style="position:absolute;inset:0;background:linear-gradient(90deg,#A97C52 0,#B98B5E ${px(FUELLE)},#C29468 50%,#B98B5E calc(100% - ${px(FUELLE)}),#A97C52 100%)"></div>
    <svg style="position:absolute;inset:0;mix-blend-mode:multiply" width="100%" height="100%"><rect width="100%" height="100%" filter="url(#fibra)"/></svg>
    <div style="position:absolute;top:0;bottom:0;left:${px(FUELLE)};width:1px;background:rgba(70,45,20,.35)"></div>
    <div style="position:absolute;top:0;bottom:0;right:${px(FUELLE)};width:1px;background:rgba(70,45,20,.35)"></div>
    <div style="position:absolute;left:0;right:0;bottom:${px(16)};height:1px;background:rgba(70,45,20,.3)"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:${px(16)};background:linear-gradient(rgba(60,35,15,.10),rgba(60,35,15,.22))"></div>`;
  // El borde dentado de la boca, doblado dos veces sobre el frente.
  const dientes = Array.from({ length: Math.ceil(AN / 4) + 1 }, (_, i) => `${i * 4},${SOLAPA} ${i * 4 + 2},${SOLAPA + 1.6}`).join(' ');
  const solapa = `<svg style="position:absolute;left:0;top:0;filter:drop-shadow(0 ${px(1.4)} ${px(1.6)} rgba(40,22,8,.45))" width="${px(AN)}" height="${px(SOLAPA + 3)}" viewBox="0 0 ${AN} ${SOLAPA + 3}">
    <polygon points="0,0 ${AN},0 ${AN},${SOLAPA} ${dientes} 0,${SOLAPA}" fill="#B08257"/>
    <line x1="0" y1="${SOLAPA * 0.48}" x2="${AN}" y2="${SOLAPA * 0.48}" stroke="rgba(60,35,15,.35)" stroke-width="0.4"/></svg>`;
  const cierre = `<div style="position:absolute;left:${px((AN - 50) / 2)};top:${px(SOLAPA - 25)}">${recorte(c1, kb, '0 2px 4px rgba(40,22,8,.35)')}</div>`;
  const qrDorso = `<div style="position:absolute;left:${px((AN - 70) / 2)};top:${px(AL * 0.42 - 50)}">${recorte(c2, kb, '0 2px 4px rgba(40,22,8,.3)')}</div>`;
  // Lo sellado: en la tinta del sello (verde casi negro), con la textura de tinta sobre kraft.
  // `x`,`y` en mm desde la esquina de la cara; `contenido` medido en mm (se escala con `zoom`).
  const sellado = (x, y, contenido) => `<div style="position:absolute;left:${px(x)};top:${px(y)};mix-blend-mode:multiply;opacity:.94"><div style="zoom:${(kb * 25.4 / 96).toFixed(4)};filter:url(#tinta)">${contenido}</div></div>`;
  const pegado = (x, y, w, h, html) => `<div style="position:absolute;left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)};box-shadow:0 2px 5px rgba(40,22,8,.32);border-radius:${px(1.5)};overflow:hidden"><div style="zoom:${(kb * 25.4 / 96).toFixed(4)};position:relative;width:${w}mm;height:${h}mm">${html}</div></div>`;
  const cara = (titulo, notas, cuerpo, conSolapa = true, conCierre = conSolapa) => `<div style="display:flex;flex-direction:column;gap:12px;width:${px(AN)}">
    <div style="position:relative;width:${px(AN)};height:${px(AL)};box-shadow:0 26px 40px -10px rgba(40,25,10,.45);border-radius:2px 2px 4px 4px;overflow:hidden">
      ${papel}${conSolapa ? solapa : `<div style="position:absolute;left:0;right:0;top:0;height:${px(5)};background:linear-gradient(rgba(60,35,15,.28),transparent)"></div>`}${cuerpo}${conCierre ? cierre : ''}
    </div>
    <div class="disp" style="font-size:22px;color:${C.tinta}">${titulo}</div>${notas}</div>`;
  return { px, cara, sellado, qrDorso, pegado };
}
const T = C.tinta;
// Los cuatro frentes: lo que cambia es SOLO lo sellado. Medidas en mm de la bolsa.
const FRENTES = [
  { t: '1 · El letrero', sellos: '1 sello · 12 × 9 cm', por: 'La frase grande, a la izquierda. Se lee de lejos y suena a la marca.',
    c: (k) => k.sellado(22, AL * 0.43 - 42, `<div style="width:112mm;display:flex;flex-direction:column;gap:6mm">${frase(27, T)}${web(8, T)}</div>`) },
  { t: '2 · La cara', sellos: '1 sello · 9 × 11.5 cm', por: 'Los dos hermanos al centro, como un escudo. Es lo más reconocible a 10 metros.',
    c: (k) => k.sellado((AN - 90) / 2, AL * 0.40 - 50, `<div style="width:90mm;display:flex;flex-direction:column;align-items:center;gap:4mm">${logoTinta(86, T)}${web(8, T)}</div>`) },
  { t: '3 · De costado', sellos: '2 sellos · 16 × 2.2 cm y 5 × 6 cm', por: 'La frase sube por el borde, como cinta; la cara chica abajo. La más «de diseño».',
    c: (k) => k.sellado(19, SOLAPA + 14, `<div style="width:20mm;height:156mm"><div style="width:156mm;transform:translateY(156mm) rotate(-90deg);transform-origin:0 0">${costado(156, 20, T)}</div></div>`) +
      k.sellado(AN - 22 - 50, AL - 34 - 60, `<div style="width:50mm;display:flex;flex-direction:column;align-items:center;gap:2.5mm">${logoTinta(46, T)}${web(4.6, T)}</div>`) },
  { t: '4 · Mínima', sellos: '1 sello · 10 × 3 cm (el más barato)', por: 'Casi nada: el cierre hace de marca. Se ve cara y limpia, pero dice poco.',
    c: (k) => k.sellado((AN - 100) / 2, AL * 0.70, `<div style="width:100mm;display:flex;flex-direction:column;align-items:center;gap:3mm"><div class="voz" style="font-size:11mm;line-height:1;color:${T}">Alguien pidió bien.</div>${web(4.6, T)}</div>`) },
  { t: '5 · La firma', sellos: '1 sello · 11 × 14 cm', por: 'La cara y, debajo, la frase: el escudo y lo que dice. Es la más completa.',
    c: (k) => k.sellado((AN - 110) / 2, AL * 0.40 - 62, `<div style="width:110mm;display:flex;flex-direction:column;align-items:center;gap:4mm">${logoTinta(70, T)}<div class="voz" style="font-size:15mm;line-height:1;color:${T};white-space:nowrap">Alguien pidió bien.</div>${web(6, T)}</div>`) },
  { t: '6 · La mezcla (1 + 2 + 3)', sellos: '1 sello · 15 × 13 cm', por: 'La cara y la frase en columna, y sndwch.app como cinta al costado. Un solo sello: nada que alinear.',
    c: (k) => k.sellado((AN - MEZCLA.ancho) / 2, AL * 0.42 - MEZCLA.alto / 2, mezcla(T)) },
];
const nota = (sellos, por) => `<div class="mono" style="font-size:13px;color:${C.oliva}">${sellos}</div><div style="font:400 14px/1.4 Archivo,sans-serif;color:#4A4A40">${por}</div>`;
{
  // Los cuatro ejemplos, lado a lado (el dorso es igual en todos: el sticker del QR).
  const k = kitBolsa(1.55);
  await foto('docs/marketing/bolsa/ejemplos-bolsa.png', 1940, 840, `${DEFS}<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 35% 20%,#F3ECDF,#DCD0BC);padding:44px 60px">
    <div class="mono" style="font-size:14px;letter-spacing:.08em;color:${C.oliva};margin-bottom:20px">CINCO FRENTES PARA LA BOLSA LISA #20 · EL DORSO ES IGUAL EN TODOS: EL STICKER DEL QR</div>
    <div style="display:flex;gap:40px">${FRENTES.slice(0, 5).map((f) => k.cara(f.t, nota(f.sellos, f.por), f.c(k))).join('')}</div></div>`);
}
{
  // La maqueta de dos caras, con el frente elegido (por ahora, el 1).
  const k = kitBolsa(2.3), f = FRENTES[5];
  await foto('docs/marketing/bolsa/maqueta-bolsa-lisa.png', 1260, 1100, `${DEFS}<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 35% 25%,#F3ECDF,#DCD0BC);padding:54px 70px">
    <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva};margin-bottom:22px">LA BOLSA · KRAFT LISA #20 · 21 × 40 × 12.5 CM</div>
    <div style="display:flex;gap:90px">
      ${k.cara('Frente', nota(f.sellos, 'Un solo sello, centrado a media altura: la cara y la frase en columna y sndwch.app como cinta al costado. La boca se dobla dos veces y el cierre cruza el doblez.'), f.c(k))}
      ${k.cara('Dorso', nota('1 sticker · 70 × 100 mm', 'Solo el sticker del QR, centrado y a la misma altura que el sello del frente: al girar la bolsa, todo cae en el mismo lugar.'), k.qrDorso, false)}
    </div></div>`);
}
{
  // Opción B: la bolsa con UNA tira (cierre + QR). A la izquierda, la tira extendida con sus dos
  // dobleces; al centro el frente y a la derecha el dorso.
  const k = kitBolsa(2.3), px = k.px, f = FRENTES[5];
  const frenteTira = k.pegado((AN - TIRA.ancho) / 2, 0, TIRA.ancho, TIRA.frente, tramoFrente(0, 0));
  const dorsoTira = k.pegado((AN - TIRA.ancho) / 2, 0, TIRA.ancho, TIRA.dorso, await ladoQRAngosto(0, 0, TIRA.ancho, TIRA.dorso));
  const largo = TIRA.frente + TIRA.boca + TIRA.dorso, L = `${(TIRA.ancho * 2.3 + 18).toFixed(0)}px`;
  const marca = (y, texto) => `<div style="position:absolute;left:-6px;width:calc(${px(TIRA.ancho)} + 12px);top:${px(y)};border-top:2px dashed ${C.naranja}"></div><div class="mono" style="position:absolute;left:${L};top:calc(${px(y)} - 9px);font-size:13px;color:${C.naranja};white-space:nowrap">${texto}</div>`;
  const plana = `<div style="display:flex;flex-direction:column;gap:12px;flex:none;width:${(TIRA.ancho * 2.3 + 150).toFixed(0)}px">
    <div style="position:relative;width:${px(TIRA.ancho)};height:${px(largo)}">
      <img src="${img(`${OUT}/${ARCHIVO_TIRA}.png`)}" style="position:absolute;left:${-S * 2.3}px;top:${-S * 2.3}px;width:${(TIRA.ancho + 2 * S) * 2.3}px;clip-path:inset(${S * 2.3}px round 6px)">
      ${marca(TIRA.frente - TIRA.precorte, 'precorte: se rasga aquí')}${marca(TIRA.frente, 'doblez')}${marca(TIRA.frente + TIRA.boca, 'doblez')}
      <div class="mono" style="position:absolute;left:${L};top:calc(${px(TIRA.frente / 2)} - 16px);font-size:13px;color:${C.tinta};white-space:nowrap">↑ FRENTE<br><span style="color:${C.oliva}">(va de cabeza)</span></div>
      <div class="mono" style="position:absolute;left:${L};top:calc(${px(TIRA.frente + TIRA.boca + TIRA.dorso / 2)} - 8px);font-size:13px;color:${C.tinta};white-space:nowrap">↓ DORSO</div>
    </div>
    <div class="disp" style="font-size:22px;color:${C.tinta}">La tira, extendida</div>
    <div class="mono" style="font-size:13px;color:${C.oliva}">70 × ${largo} mm<br>un solo sticker</div></div>`;
  await foto('docs/marketing/bolsa/maqueta-bolsa-tira.png', 1600, 1120, `${DEFS}<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 35% 25%,#F3ECDF,#DCD0BC);padding:54px 60px">
    <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva};margin-bottom:22px">OPCIÓN B · UN SOLO STICKER: CIERRA LA BOLSA Y LLEVA EL QR</div>
    <div style="display:flex;gap:56px;align-items:flex-start">
      ${plana}
      ${k.cara('Frente', nota('1 sello + la tira', 'La tira baja 7 cm: el precorte cae justo en el borde del doblez y se rasga para abrir; si llega rasgada, la abrieron.'), frenteTira + f.c(k).replace(`top:${px(AL * 0.42 - MEZCLA.alto / 2)}`, `top:${px(AL * 0.56 - MEZCLA.alto / 2)}`), true, false)}
      ${k.cara('Dorso', nota('la misma tira', 'Sigue por arriba y baja 11 cm con el QR: lo primero que ve quien la recibe al girarla.'), dorsoTira, false)}
    </div></div>`);
}
{
  // La bolsa para que la suban, versión ahorro: la tira extendida (con el precorte), el frente y el dorso.
  const k = kitBolsa(2.0), px = k.px;
  const frenteTira = k.pegado((AN - TIRA.ancho) / 2, 0, TIRA.ancho, TIRA.frente, tramoFrente(0, 0));
  const dorsoTira = k.pegado((AN - TIRA.ancho) / 2, 0, TIRA.ancho, TIRA.dorso, await ladoQRAngosto(0, 0, TIRA.ancho, TIRA.dorso));
  const X = (AN - CARTEL.ancho) / 2;
  const bloque = CARTEL.alto + 5 + CARTEL.frase + 8 + CARTEL.pie;
  const y0 = TIRA.frente + (AL - 16 - TIRA.frente - bloque) / 2;
  const frente = frenteTira + k.sellado(X, y0, `<div style="width:${CARTEL.ancho}mm;display:flex;flex-direction:column;align-items:center;gap:5mm">${nombreCartel(T)}${fraseCartel('Alguien pidió bien.', T)}</div>`) +
    k.sellado(X, y0 + CARTEL.alto + 5 + CARTEL.frase + 8, pie(T));
  const dorso = dorsoTira;
  const largo = TIRA.frente + TIRA.boca + TIRA.dorso, L = `${(TIRA.ancho * 2.0 + 16).toFixed(0)}px`;
  const marca = (y, texto, col = C.naranja) => `<div style="position:absolute;left:-6px;width:calc(${px(TIRA.ancho)} + 12px);top:${px(y)};border-top:2px dashed ${col}"></div><div class="mono" style="position:absolute;left:${L};top:calc(${px(y)} - 9px);font-size:12.5px;color:${col};white-space:nowrap">${texto}</div>`;
  const plana = `<div style="display:flex;flex-direction:column;gap:12px;flex:none;width:${(TIRA.ancho * 2.0 + 175).toFixed(0)}px">
    <div style="position:relative;width:${px(TIRA.ancho)};height:${px(largo)}">
      <img src="${img(`${OUT}/${ARCHIVO_TIRA}.png`)}" style="position:absolute;left:${-S * 2.0}px;top:${-S * 2.0}px;width:${(TIRA.ancho + 2 * S) * 2.0}px;clip-path:inset(${S * 2.0}px round 6px)">
      ${marca(TIRA.frente - TIRA.precorte, 'PRECORTE · se rasga aquí', '#B4441E')}${marca(TIRA.frente, 'doblez')}${marca(TIRA.frente + TIRA.boca, 'doblez')}
      <div class="mono" style="position:absolute;left:${L};top:calc(${px((TIRA.frente - TIRA.precorte) / 2)} - 16px);font-size:12.5px;color:${C.tinta};white-space:nowrap">↑ FRENTE<br><span style="color:${C.oliva}">(va de cabeza)</span></div>
      <div class="mono" style="position:absolute;left:${L};top:calc(${px(TIRA.frente + TIRA.boca + TIRA.dorso / 2)} - 8px);font-size:12.5px;color:${C.tinta};white-space:nowrap">↓ DORSO</div>
    </div>
    <div class="disp" style="font-size:22px;color:${C.tinta}">La tira</div>
    <div style="font:400 14px/1.4 Archivo,sans-serif;color:#4A4A40">${TIRA.ancho} × ${largo} mm, 10 por hoja A3. No se despega: se rasga por el precorte, en el borde del doblez. El QR queda entero atrás.</div></div>`;
  await foto('docs/marketing/bolsa/maqueta-bolsa-cartel.png', 1460, 1020, `${DEFS}<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 35% 25%,#F3ECDF,#DCD0BC);padding:48px 60px">
    <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva};margin-bottom:20px">LA BOLSA PARA QUE LA SUBAN · VERSIÓN AHORRO · 2 SELLOS Y 1 STICKER</div>
    <div style="display:flex;gap:48px;align-items:flex-start">
      ${plana}
      ${k.cara('Frente', nota(`2 sellos: ${CARTEL.ancho / 10 + 0.6} × 3.2 cm y ${CARTEL.ancho / 10 + 0.6} × ${(Math.ceil(CARTEL.pie + 6) / 10).toFixed(1)} cm`, 'La pastilla pide la historia con @snd__wch, legible en una foto.'), frente, true, false)}
      ${k.cara('Dorso', nota('solo la tira', 'El QR con el código DIRECTO. El sello «¿Y la oficina?» queda para cuando la bolsa traiga pedidos.'), dorso, false)}
    </div></div>`);
}
{
  // Opción C: el cuadrado de 7 cm al frente, arriba al centro, con el precorte en el borde del
  // doblez. El dorso queda limpio (el sello de la oficina, para más adelante).
  const k = kitBolsa(2.3), px = k.px;
  const X = (AN - CARTEL.ancho) / 2;
  const y0 = 4 + CUADRO.lado + (AL - 16 - 4 - CUADRO.lado - (CARTEL.alto + 5 + CARTEL.frase + 8 + CARTEL.pie)) / 2;
  const cuadro = k.pegado((AN - CUADRO.lado) / 2, SOLAPA - CUADRO.franja, CUADRO.lado, CUADRO.lado, await cierreQR(0, 0));
  const frente = cuadro + k.sellado(X, y0, `<div style="width:${CARTEL.ancho}mm;display:flex;flex-direction:column;align-items:center;gap:5mm">${nombreCartel(T)}${fraseCartel('Alguien pidió bien.', T)}</div>`) +
    k.sellado(X, y0 + CARTEL.alto + 5 + CARTEL.frase + 8, pie(T));
  const suelto = `<div style="display:flex;flex-direction:column;gap:12px;flex:none;width:${px(CUADRO.lado + 30)}">
    <div style="position:relative;width:${px(CUADRO.lado)};height:${px(CUADRO.lado)}">${recorte(piezas.find((x) => x.archivo === '5-cierre-qr-70x70'), 2.3)}
      <div style="position:absolute;left:-6px;width:calc(${px(CUADRO.lado)} + 12px);top:${px(CUADRO.franja)};border-top:2px dashed #B4441E"></div></div>
    <div class="disp" style="font-size:22px;color:${C.tinta}">El sticker</div>
    <div style="font:400 14px/1.4 Archivo,sans-serif;color:#4A4A40">7 × 7 cm, medida de lista: S/150 el millar (S/0.15 cada uno). La línea roja es el precorte, a 1.1 cm del borde de arriba: va justo en el borde del doblez. Arriba de ella solo «rasga aquí»; abajo, lo que se queda en la bolsa.</div></div>`;
  await foto('docs/marketing/bolsa/maqueta-bolsa-ahorro.png', 1500, 1100, `${DEFS}<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 35% 25%,#F3ECDF,#DCD0BC);padding:54px 60px">
    <div class="mono" style="font-size:15px;letter-spacing:.08em;color:${C.oliva};margin-bottom:22px">OPCIÓN C · LA MÁS BARATA · 2 SELLOS Y 1 STICKER DE 7 CM</div>
    <div style="display:flex;gap:56px;align-items:flex-start">
      ${suelto}
      ${k.cara('Frente', nota('2 sellos + el sticker de 7 cm', 'El sticker cierra (la franja va sobre el doblez y se rasga por el precorte) y lleva el QR con DIRECTO. Es lo primero que se ve.'), frente, true, false)}
      ${k.cara('Dorso', nota('limpio', 'Sin nada por ahora. Más adelante, el sello «¿Y la oficina?».'), '', false)}
    </div></div>`);
}
await b.close();
console.log(`✓ stickers y lámina en ${OUT}; sellos en docs/marketing/bolsa/sellos; la bolsa y sus ejemplos en docs/marketing/bolsa/`);
