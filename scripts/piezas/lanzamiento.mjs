// SND//WCH — piezas/lanzamiento: las primeras 9 publicaciones de Instagram, las portadas de las
// destacadas y la maqueta del perfil (docs/marketing/LANZAMIENTO_INSTAGRAM.md).
//
// Todo texto con un número sale de scripts/piezas/datos.ts (la carta y las reglas); los colores y
// tipografías, de docs/LOS_DOS_HERMANOS.md (SANDO: papel, tinta verde, franja naranja; WICHO:
// celeste, curvas de nivel, espiral lila). La foto del sándwich es la real de img/ y va sin nada
// encima (sistema de SANDO aprobado el 2026-09-17).
//
// Uso: node scripts/piezas/lanzamiento.mjs datos.json horario.json [carpeta]
//   FUENTES_CSS=… (las sesiones de Claude no llegan a Google Fonts) · PLAYWRIGHT_CHROMIUM_PATH=…
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [datosPath, horarioPath, OUT = 'docs/marketing/lanzamiento'] = process.argv.slice(2);
const D = JSON.parse(readFileSync(datosPath, 'utf8'));
const H = JSON.parse(readFileSync(horarioPath, 'utf8')); // [{weekday, closed, open_hour, close_hour}] de store_hours
mkdirSync(OUT, { recursive: true });
const ROOT = resolve('.');
const img = (p) => 'file://' + resolve(ROOT, p);
const precio = (n) => 'S/' + Number(n).toFixed(2);
const ultimaFrase = (t) => t.split('.').map((x) => x.trim()).filter(Boolean).pop() + '.';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const abiertos = H.filter((d) => !d.closed).map((d) => d.weekday);
const cerrados = H.filter((d) => d.closed).map((d) => DIAS[d.weekday]);
const h0 = H.find((d) => !d.closed);
const horario = `Martes a domingo · ${h0.open_hour}:00–${h0.close_hour}:00`;
const cerradoTxt = cerrados.length ? `${cerrados.map((x) => x[0].toUpperCase() + x.slice(1)).join(', ')} cerrado` : '';
if (abiertos.length !== 6 || cerrados.join() !== 'lunes') throw new Error('El horario cambió: revisa el texto «Martes a domingo» antes de generar.');

// ── El sistema ───────────────────────────────────────────────────────────────────────────────
const C = { papel: '#EFE6D4', tinta: '#1E2B22', naranja: '#D8823C', oliva: '#6C7860', tan: '#C9A87C', celeste: '#8CC8EC', navy: '#1E2F3A', lila: '#C3A6D2', lilaOsc: '#4A3D62', durazno: '#F0D8CC', oro: '#CBA258' };
// La espiral de WICHO se calcula, nunca se dibuja a mano (LOS_DOS_HERMANOS.md).
function espiral(size, color, grosor = 6, vueltas = 3.6) {
  const c = size / 2, pts = [];
  for (let a = 0; a <= vueltas * 2 * Math.PI; a += 0.08) { const r = (a / (vueltas * 2 * Math.PI)) * (size / 2 - grosor); pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`); }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round"/></svg>`;
}
// Las curvas de nivel del polo de WICHO: el fondo de su mundo, tono sobre tono.
function curvas(w, h, color = '#7DBBE0') {
  let p = '';
  for (let i = 0; i < 22; i++) {
    const y0 = (i / 21) * h; let d = `M -20 ${y0.toFixed(0)}`;
    for (let x = 0; x <= w + 40; x += 40) { const y = y0 + 26 * Math.sin(x / 140 + i * 0.7) + 14 * Math.sin(x / 61 + i); d += ` L ${x} ${y.toFixed(1)}`; }
    p += `<path d="${d}" fill="none" stroke="${color}" stroke-width="3"/>`;
  }
  return `<svg class="curvas" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${p}</svg>`;
}
// Sobre el celeste de WICHO, la barra celeste del «//» desaparece: ahí la marca va sobre papel.
const marca = (col = C.tinta) => col === C.navy
  ? `<span class="wm" style="color:${C.tinta};background:${C.papel};padding:10px 16px;border-radius:10px">SND<span class="mk"><i></i><i></i></span>WCH</span>`
  : `<span class="wm" style="color:${col}">SND<span class="mk"><i></i><i></i></span>WCH</span>`;

const BASE = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden}
body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.p{position:relative;width:1080px;height:1350px;overflow:hidden}
.sando{background:${C.papel};color:${C.tinta}}
.sando .forro{position:absolute;left:0;top:0;bottom:0;width:22px;background:${C.naranja}}
.wicho{background:${C.celeste};color:${C.navy}}
.curvas{position:absolute;inset:0;opacity:.55}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92;letter-spacing:-.005em}
.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600}
.wm{font:800 44px/1 Archivo,sans-serif;display:inline-flex;align-items:center;letter-spacing:.01em}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:${C.oro}}.mk i:last-child{background:${C.celeste}}
.pie{position:absolute;left:96px;right:84px;bottom:64px;display:flex;justify-content:space-between;align-items:center}
.rib{background:repeating-linear-gradient(90deg,${C.oliva} 0 4px,transparent 4px 10px);height:22px;opacity:.55}
.globo{position:absolute;background:#fff;border:5px solid ${C.navy};border-radius:28px;padding:22px 30px;font:700 46px/1.05 Archivo,sans-serif}
`;
const pagina = (cuerpo, css = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}${css}</style></head><body>${cuerpo}</body></html>`;

// ── Las piezas ───────────────────────────────────────────────────────────────────────────────
const P = [];
const pieza = (archivo, html) => P.push({ archivo, html });

// 1 · CÓMO SE PIDE (carrusel, fijada) — mundo de SANDO: tres pasos, en orden.
const pasosPedido = [
  ['Entra a sndwch.app', 'Desde el celular. No hay app que descargar.'],
  ['Elige o arma', 'Un Signature de la carta, o el tuyo paso a paso.'],
  ['Paga y listo', 'Yape o tarjeta. Te llega a donde estés.'],
];
pieza('01-como-se-pide-1', pagina(`<div class="p sando"><div class="forro"></div>
  <div style="position:absolute;left:96px;top:120px;right:84px">
    <div class="mono" style="font-size:28px;letter-spacing:.18em;color:${C.oliva}">CÓMO SE PIDE</div>
    <div class="disp" style="font-size:190px;margin-top:28px">Tres<br>pasos.</div>
    <div class="voz" style="font-size:64px;margin-top:36px;line-height:1.1">Sin descargar nada.</div>
    <div class="mono" style="font-size:26px;margin-top:14px;color:${C.oliva}">— SANDO</div>
  </div>
  <img src="${img('img/sando2_mira.png')}" style="position:absolute;right:-30px;bottom:150px;height:640px">
  <div class="pie"><div class="rib" style="width:420px"></div>${marca()}</div></div>`));
pasosPedido.forEach(([t, s], i) => pieza(`01-como-se-pide-${i + 2}`, pagina(`<div class="p sando"><div class="forro"></div>
  <div style="position:absolute;left:96px;top:120px;right:84px">
    <div class="disp" style="font-size:420px;color:${C.naranja};line-height:.8">${i + 1}</div>
    <div class="disp" style="font-size:120px;margin-top:40px">${t}</div>
    <div style="font-size:46px;line-height:1.25;margin-top:30px;max-width:820px">${s}</div>
    ${i === 2 ? `<div class="voz" style="font-size:64px;line-height:1.1;margin-top:60px">Y hoy ya no cocinas.</div>` : ''}
  </div>
  <div class="pie"><div class="mono" style="font-size:26px;color:${C.oliva}">${i + 1} / 3</div>${marca()}</div></div>`)));

// 2 · LA CARTA (carrusel, fijada) — la foto real grande y limpia; el texto, debajo, sobre papel.
pieza('02-la-carta-1', pagina(`<div class="p sando"><div class="forro"></div>
  <div style="position:absolute;left:96px;top:120px;right:84px">
    <div class="mono" style="font-size:28px;letter-spacing:.18em;color:${C.oliva}">LA CARTA</div>
    <div class="disp" style="font-size:170px;margin-top:24px">${D.sigs.length} Signatures.</div>
    <div class="voz" style="font-size:60px;margin-top:30px;line-height:1.1">Cada uno, como tiene que ser.</div>
    <div class="mono" style="font-size:26px;margin-top:14px;color:${C.oliva}">— SANDO</div>
    <div style="margin-top:50px;display:flex;flex-direction:column;gap:12px">${D.sigs.map((s, i) => `<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px solid ${C.tinta}22;padding-bottom:10px"><span class="disp" style="font-size:46px"><span class="mono" style="font-size:24px;color:${C.oliva};margin-right:18px">${String(i + 1).padStart(2, '0')}</span>${s.nombre}</span><span class="mono" style="font-size:30px">${precio(s.p15)}</span></div>`).join('')}</div>
  </div>
  <div class="pie"><div class="mono" style="font-size:24px;color:${C.oliva}">15CM · desliza →</div>${marca()}</div></div>`));
D.sigs.forEach((s, i) => pieza(`02-la-carta-${i + 2}`, pagina(`<div class="p sando"><div class="forro"></div>
  <div style="position:absolute;left:22px;right:0;top:0;height:760px;background:url('${img(s.foto)}') center/cover"></div>
  <div style="position:absolute;left:96px;right:84px;top:810px">
    <div class="disp" style="font-size:${s.nombre.length > 14 ? 96 : 120}px">${s.nombre}</div>
    <div class="voz" style="font-size:48px;line-height:1.1;margin-top:18px">${ultimaFrase(s.pitch)}</div>
    <div class="mono" style="font-size:24px;margin-top:22px;color:${C.oliva}">${s.ingredientes.join(' · ')}</div>
  </div>
  <div class="pie"><div class="mono" style="font-size:34px">15CM ${precio(s.p15)}  ·  30CM ${precio(s.p30)}</div>${marca()}</div></div>`)));

// 3 · LOS HERMANOS (carrusel, fijada) — cada uno en su mundo; no se parecen en nada.
pieza('03-los-hermanos-1', pagina(`<div class="p" style="display:flex">
  <div class="sando" style="position:relative;width:50%;height:100%;overflow:hidden"><div class="forro"></div><img src="${img('img/sando2_mira.png')}" style="position:absolute;left:30px;bottom:230px;height:560px"></div>
  <div class="wicho" style="position:relative;width:50%;height:100%;overflow:hidden">${curvas(540, 1350)}<img src="${img('img/wicho2_celebra.png')}" style="position:absolute;right:20px;bottom:230px;height:600px"></div>
  <div style="position:absolute;left:96px;right:84px;top:110px">
    <div class="disp" style="font-size:150px;color:${C.tinta}">Son hermanos.</div>
    <div class="disp" style="font-size:72px;margin-top:20px;color:${C.navy}">No se parecen en nada.</div>
  </div>
  <div class="pie"><div class="mono" style="font-size:26px;color:${C.tinta}">desliza →</div>${marca(C.navy)}</div></div>`));
pieza('03-los-hermanos-2', pagina(`<div class="p sando"><div class="forro"></div>
  <img src="${img('img/sando2_cuerpo.png')}" style="position:absolute;right:40px;bottom:130px;height:1060px;clip-path:inset(0 0 0 12%)"><!-- el PNG trae restos de otra figura en el borde izquierdo -->
  <div style="position:absolute;left:96px;top:120px;width:560px">
    <div class="mono" style="font-size:28px;letter-spacing:.18em;color:${C.oliva}">EL CURADOR</div>
    <div class="disp" style="font-size:170px;margin-top:20px">Sando</div>
  </div>
  <div style="position:absolute;left:96px;width:520px;top:760px">
    <div class="voz" style="font-size:110px;line-height:1">«Uno.»</div>
    <div style="font-size:40px;line-height:1.35;margin-top:24px">Una salsa, la justa.<br>Sus Signatures no se tocan: pruébalos y lo entiendes.</div>
  </div>
  <div class="pie"><div class="rib" style="width:420px"></div>${marca()}</div></div>`));
pieza('03-los-hermanos-3', pagina(`<div class="p wicho">${curvas(1080, 1350)}
  <img src="${img('img/wicho_cuerpo_sinsombra.png')}" style="position:absolute;right:20px;bottom:130px;height:760px">
  <div style="position:absolute;left:84px;top:120px;width:560px">
    <div class="mono" style="font-size:28px;letter-spacing:.18em;color:${C.lilaOsc}">EL QUE ARMA</div>
    <div class="disp" style="font-size:170px;margin-top:20px">Wicho</div>
  </div>
  <div style="position:absolute;left:84px;width:470px;top:740px">
    <div style="font:800 72px/1.05 Archivo,sans-serif">«¿Y si le ponemos…?»</div>
    <div style="font-size:40px;line-height:1.35;margin-top:24px">Con él armas el tuyo.<br>Las reglas las pones tú.</div>
  </div>
  <div class="pie">${espiral(70, C.lilaOsc, 6)}${marca(C.navy)}</div></div>`));

// 4 · ARMA EL TUYO (carrusel) — mundo de WICHO: los pasos reales del armador.
pieza('04-arma-el-tuyo-1', pagina(`<div class="p wicho">${curvas(1080, 1350)}
  <div style="position:absolute;left:84px;top:110px;right:84px">
    <div class="disp" style="font-size:230px">Arma<br>el tuyo.</div>
    <div style="font:800 54px/1.1 Archivo,sans-serif;margin-top:30px;max-width:620px">${D.pasos.length} pasos. Las reglas las pones tú.</div>
  </div>
  <img src="${img('img/wicho2_celebra.png')}" style="position:absolute;right:20px;bottom:130px;height:540px">
  <div class="pie">${espiral(70, C.lilaOsc, 6)}${marca(C.navy)}</div></div>`));
pieza('04-arma-el-tuyo-2', pagina(`<div class="p wicho">${curvas(1080, 1350)}
  <div style="position:absolute;left:84px;top:110px;right:84px">
    <div class="mono" style="font-size:28px;letter-spacing:.18em;color:${C.lilaOsc}">TÚ DECIDES CADA CAPA</div>
    <div style="margin-top:40px;display:flex;flex-direction:column;gap:26px">${D.pasos.map((p, i) => `<div style="display:flex;align-items:center;gap:30px"><div style="width:110px;height:110px;border-radius:999px;background:${C.durazno};border:5px solid ${C.navy};display:grid;place-items:center" class="disp"><span style="font-size:64px">${i + 1}</span></div><div class="disp" style="font-size:96px">${p.toLowerCase()}</div></div>`).join('')}</div>
  </div>
  <div class="pie"><div style="font:800 40px/1 Archivo,sans-serif">sndwch.app → Arma el tuyo</div>${marca(C.navy)}</div></div>`));

// 5 · PHILLY — producto: la foto real y su situación.
const sigPorId = (id) => D.sigs.find((s) => s.id === id);
// La versión vertical de la foto (la genera scripts/tratar_fotos.py) encuadra el relleno, no el pan.
const fotoVertical = (s) => { const v = s.foto.replace(/\.jpg$/, '_v.webp'); return existsSync(resolve(ROOT, v)) ? v : s.foto; };
const fotoSola = (archivo, s) => pieza(archivo, pagina(`<div class="p sando"><div class="forro"></div>
  <div style="position:absolute;left:22px;right:0;top:0;height:900px;background:url('${img(fotoVertical(s))}') center/cover"></div>
  <div style="position:absolute;left:96px;right:84px;top:950px">
    <div class="voz" style="font-size:76px;line-height:1">${ultimaFrase(s.pitch)}</div>
    <div class="disp" style="font-size:64px;margin-top:22px">${s.nombre}</div>
  </div>
  <div class="pie"><div class="mono" style="font-size:32px">15CM ${precio(s.p15)}  ·  30CM ${precio(s.p30)}</div>${marca()}</div></div>`));
fotoSola('05-philly', D.sigs.find((s) => s.estrella) || D.sigs[0]);

// 6 · LA TIRA N.º 1: «La sexta salsa» — cuatro viñetas, cada hermano en su mundo.
const vineta = (mundo, pose, texto, lado, alto = 470, extra = '') => `<div class="${mundo}" style="position:relative;overflow:hidden;border:6px solid ${C.navy};border-radius:10px">
  ${mundo === 'wicho' ? curvas(500, 600) : `<div class="forro" style="width:14px"></div>`}
  <img src="${img(pose)}" style="position:absolute;${lado}:-10px;bottom:-10px;height:${alto}px">
  <div class="globo" style="top:28px;${lado === 'right' ? 'left' : 'right'}:24px;max-width:300px;${mundo === 'sando' ? `font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;font-size:62px;border-color:${C.tinta}` : ''}${extra}">${texto}</div></div>`;
pieza('06-tira-la-sexta-salsa', pagina(`<div class="p" style="background:${C.papel};padding:60px 50px 150px">
  <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:26px;height:100%">
    ${vineta('wicho', 'img/wicho2_celebra.png', '¡Le pongo todas las salsas!', 'right')}
    ${vineta('sando', 'img/sando2_mira.png', '…', 'left')}
    ${vineta('wicho', 'img/wicho2_grita.png', '¡TODAS!', 'right', 500)}
    ${vineta('sando', 'img/sando2_frente.png', 'Una.', 'left', 480)}
  </div>
  <div class="pie" style="bottom:52px"><div class="mono" style="font-size:26px;color:${C.oliva}">LA TIRA · N.º 1 · LA SEXTA SALSA</div>${marca()}</div></div>`));

// 7 · ABRIMOS EL MARTES 13 — el aviso que se ve de lejos.
pieza('07-abrimos', pagina(`<div class="p" style="display:flex">
  <div class="sando" style="position:relative;width:50%;height:100%"><div class="forro"></div></div>
  <div class="wicho" style="position:relative;width:50%;height:100%;overflow:hidden">${curvas(540, 1350)}</div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
    <div class="mono" style="font-size:34px;letter-spacing:.2em;color:${C.tinta}">ABRIMOS EL</div>
    <div class="disp" style="font-size:330px;margin-top:10px;color:${C.tinta}">Martes<br><span style="color:${C.naranja}">13</span></div>
    <div class="mono" style="font-size:32px;letter-spacing:.16em;margin-top:30px;color:${C.tinta};background:${C.papel};padding:10px 22px;border-radius:8px">DE OCTUBRE · DESDE LAS ${String(h0.open_hour).padStart(2, '0')}:00</div>
  </div>
  <img src="${img('img/sando2_asoma.png')}" style="position:absolute;left:30px;bottom:30px;height:230px">
  <img src="${img('img/wicho_asoma.png')}" style="position:absolute;right:30px;bottom:30px;height:230px">
  <div class="pie" style="justify-content:center"><div style="background:${C.tinta};color:${C.papel};padding:18px 34px;border-radius:12px" class="mono"><span style="font-size:36px">sndwch.app</span></div></div></div>`));

// 8 · TURKEY — producto: la foto real y su situación.
fotoSola('08-turkey', sigPorId('SIG10') || D.sigs[2]);

// 9 · PARA LA OFICINA — la regla real del pedido en grupo.
pieza('09-para-la-oficina', pagina(`<div class="p wicho">${curvas(1080, 1350)}
  <div style="position:absolute;left:84px;top:110px;right:84px">
    <div style="font:800 64px/1.05 Archivo,sans-serif">«Somos seis.<br>Bueno, siete.»</div>
    <div class="disp" style="font-size:150px;margin-top:40px">¿Pides para<br>la oficina?</div>
  </div>
  <div style="position:absolute;left:84px;width:600px;top:800px;background:${C.papel};color:${C.tinta};border:6px solid ${C.navy};border-radius:16px;padding:34px 38px">
    <div style="font-size:42px;line-height:1.25">Desde <b>${D.organizadorDesde} sándwiches</b>, quien organiza el pedido en grupo se lleva <b>gratis el 15CM más barato</b>.</div>
  </div>
  <img src="${img('img/wicho_saluda.png')}" style="position:absolute;right:20px;bottom:130px;height:560px">
  <div class="pie"><div style="font:800 36px/1 Archivo,sans-serif">sndwch.app → Pedir en grupo</div>${marca(C.navy)}</div></div>`));

// ── Las portadas de las destacadas (1080×1920; Instagram muestra el círculo del centro) ─────
const iconos = {
  pide: `<svg width="420" height="420" viewBox="0 0 100 100"><path d="M22 34h56l-5 52H27z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="M36 34v-6a14 14 0 0 1 28 0v6" fill="none" stroke="currentColor" stroke-width="6"/></svg>`,
  carta: `<svg width="440" height="440" viewBox="0 0 100 100"><path d="M12 56c0-12 16-20 38-20s38 8 38 20v6H12z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><path d="M12 70h76" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`,
  arma: espiral(400, C.lilaOsc, 22),
  grupo: `<svg width="420" height="420" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M28 26h52M28 46h52M28 66h52M28 86h34"/><circle cx="16" cy="26" r="3"/><circle cx="16" cy="46" r="3"/><circle cx="16" cy="66" r="3"/><circle cx="16" cy="86" r="3"/></g></svg>`,
  zonas: `<svg width="400" height="400" viewBox="0 0 100 100"><path d="M50 92S20 60 20 40a30 30 0 0 1 60 0c0 20-30 52-30 52z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="40" r="10" fill="none" stroke="currentColor" stroke-width="6"/></svg>`,
  // El «//» de la marca: dorado (SANDO) y celeste (WICHO), por eso va sobre papel.
  ellos: `<svg width="440" height="440" viewBox="0 0 100 100"><rect x="30" y="18" width="10" height="64" rx="1" fill="${C.oro}" transform="skewX(-16) translate(14 0)"/><rect x="52" y="18" width="10" height="64" rx="1" fill="${C.celeste}" transform="skewX(-16) translate(14 0)"/></svg>`,
};
const destacadas = [['pide', 'sando'], ['carta', 'sando'], ['arma', 'wicho'], ['grupo', 'wicho'], ['zonas', 'sando'], ['ellos', 'sando']];
const DEST = destacadas.map(([n, mundo]) => ({ archivo: `destacada-${n}`, ancho: 1080, alto: 1920, html: `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}html,body{height:1920px}</style></head><body>
  <div class="${mundo}" style="position:relative;width:1080px;height:1920px;display:grid;place-items:center;overflow:hidden;color:${mundo === 'sando' ? C.tinta : C.navy}">
  ${mundo === 'wicho' ? curvas(1080, 1920) : ''}
  <div style="position:relative;transform:scale(1.45)">${iconos[n]}</div></div></body></html>` }));

// ── Render ───────────────────────────────────────────────────────────────────────────────────
const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const fuentes = process.env.FUENTES_CSS ? readFileSync(process.env.FUENTES_CSS, 'utf8') : null;
async function render(x, w = 1080, h = 1350) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  // Desde un archivo y no con setContent: una página en blanco no puede cargar fotos ni fuentes locales.
  const tmp = resolve(OUT, `.${x.archivo}.html`);
  writeFileSync(tmp, x.html);
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  if (fuentes) await p.addStyleTag({ content: fuentes });
  else await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;700;800&family=IBM+Plex+Mono:wght@600&family=Instrument+Serif:ital@1&display=block' });
  const faltan = await p.evaluate(async () => {
    const f = ['400 100px Anton', '800 40px Archivo', '600 30px "IBM Plex Mono"', 'italic 400 60px "Instrument Serif"'];
    const caras = await Promise.all(f.map((x) => document.fonts.load(x)));
    await Promise.all([...document.images].map((i) => i.decode().catch(() => 0)));
    return f.filter((_, i) => !caras[i].length);
  });
  if (faltan.length) throw new Error(`${x.archivo}: no cargaron ${faltan.join(', ')}`);
  // Nada se sale del lienzo ni del margen (lo que se corta en la cuadrícula 3:4 queda fuera de 48 px por lado).
  const fuera = await p.evaluate(() => [...document.querySelectorAll('.disp,.voz,.mono,.globo')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth - 30 || r.left < 30); }).map((e) => e.textContent.slice(0, 30)));
  if (fuera.length) console.warn(`⚠ ${x.archivo}: se acerca al borde: ${fuera.join(' | ')}`);
  await p.screenshot({ path: `${OUT}/${x.archivo}.jpg`, type: 'jpeg', quality: 88 });
  await p.close();
  rmSync(tmp);
}
for (const x of P) await render(x);
for (const x of DEST) await render(x, x.ancho, x.alto);

// ── La maqueta del perfil, como se ve en el celular ─────────────────────────────────────────
// La cuadrícula se ordena por COLUMNAS: a la izquierda lo útil, al centro el producto, a la
// derecha los personajes. Las tres de arriba van fijadas.
const PERFIL = {
  usuario: 'snd__wch',
  nombre: 'SND//WCH · Sándwiches a domicilio',
  categoria: 'Tienda de sándwiches',
  bio: ['Sándwiches armados al momento. Delivery en Trujillo.', 'Elige un Signature o arma el tuyo.', `Mar a dom ${h0.open_hour}:00–${h0.close_hour}:00 · Yape o tarjeta`, 'Pide aquí ↓'],
  enlace: 'sndwch.app/?src=ig-bio',
  cuadricula: ['01-como-se-pide-1', '02-la-carta-1', '03-los-hermanos-1', '07-abrimos', '05-philly', '09-para-la-oficina', '04-arma-el-tuyo-1', '08-turkey', '06-tira-la-sexta-salsa'],
  destacadas: [['pide', 'Pide'], ['carta', 'Carta'], ['arma', 'Arma'], ['grupo', 'Grupo'], ['zonas', 'Zonas'], ['ellos', 'Ellos']],
};
const bioLen = PERFIL.bio.join('\n').length;
if (bioLen > 150) throw new Error(`La bio tiene ${bioLen} caracteres; Instagram acepta 150.`);
{
  const f = (x) => 'file://' + resolve(OUT, x + '.jpg');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}body{width:430px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fff;color:#000;font-size:14px}
  .top{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;font-weight:700;font-size:20px}
  .hd{display:flex;align-items:center;gap:24px;padding:4px 16px 12px}.av{width:86px;height:86px;border-radius:50%;overflow:hidden;border:1px solid #ddd}.av img{width:100%;height:100%;object-fit:cover}
  .st{display:flex;gap:22px;text-align:center}.st b{display:block;font-size:17px}
  .bio{padding:0 16px;line-height:1.35}.bio .n{font-weight:700}.bio .c{color:#737373}.bio a{color:#00376b;font-weight:600;text-decoration:none}
  .bt{display:flex;gap:6px;padding:12px 16px}.bt div{flex:1;background:#efefef;border-radius:8px;padding:8px;text-align:center;font-weight:600}.bt .s{background:#0095f6;color:#fff}
  .hl{display:flex;gap:14px;padding:6px 16px 14px;overflow:hidden}.hl div{text-align:center;font-size:12px}.hl span{display:block;width:64px;height:64px;border-radius:50%;border:1px solid #dbdbdb;padding:3px;margin-bottom:4px}.hl img{width:100%;height:100%;border-radius:50%;object-fit:cover}
  .tabs{display:flex;border-top:1px solid #dbdbdb}.tabs div{flex:1;text-align:center;padding:10px;font-size:12px;color:#737373}.tabs div:first-child{border-top:1px solid #000;color:#000;margin-top:-1px}
  .g{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.g div{aspect-ratio:3/4;background-size:cover;background-position:center;position:relative}.g .pin::after{content:'📌';position:absolute;top:6px;right:6px;font-size:13px}
  </style></head><body>
  <div class="top"><span>${PERFIL.usuario}</span><span>≡</span></div>
  <div class="hd"><div class="av"><img src="${img('img/marca/avatar-640.png')}"></div><div class="st"><div><b>${PERFIL.cuadricula.length}</b>publicaciones</div><div><b>—</b>seguidores</div><div><b>—</b>seguidos</div></div></div>
  <div class="bio"><div class="n">${PERFIL.nombre}</div><div class="c">${PERFIL.categoria}</div>${PERFIL.bio.map((l) => `<div>${l}</div>`).join('')}<a>${PERFIL.enlace}</a></div>
  <div class="bt"><div class="s">Seguir</div><div>Mensaje</div><div>Pedir comida</div></div>
  <div class="hl">${PERFIL.destacadas.map(([a, t]) => `<div><span><img src="${f('destacada-' + a)}" style="object-position:center 50%"></span>${t}</div>`).join('')}</div>
  <div class="tabs"><div>▦</div><div>▷</div><div>☺</div></div>
  <div class="g">${PERFIL.cuadricula.map((x, i) => `<div class="${i < 3 ? 'pin' : ''}" style="background-image:url('${f(x)}')"></div>`).join('')}</div>
  </body></html>`;
  const p = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  const tmp = resolve(OUT, '.perfil.html'); writeFileSync(tmp, html);
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.screenshot({ path: `${OUT}/perfil-maqueta.png`, fullPage: true });
  await p.close(); rmSync(tmp);
}

// ── Los textos: el perfil para pegar, el orden de publicación y el texto de cada publicación ──
// Los enlaces del texto de una publicación no se pueden tocar en Instagram: el texto manda al perfil
// y el `src` de cada pieza se guarda aparte (para cuando se pauta o se comparte con enlace).
const link = () => 'Pide en sndwch.app · enlace en el perfil.';
const philly = D.sigs.find((s) => s.estrella) || D.sigs[0];
const turkey = sigPorId('SIG10') || D.sigs[2];
const TEXTOS = {
  '01-como-se-pide': ['Tres pasos y hoy ya no cocinas.', '1. Entra a sndwch.app desde el celular, sin descargar nada.', '2. Elige un Signature o arma el tuyo.', '3. Paga con Yape o tarjeta y te llega a donde estés.', link('ig-como')],
  '02-la-carta': [`La carta: ${D.sigs.length} Signatures. Cada uno, como tiene que ser. — SANDO`, '', ...D.sigs.map((x) => `${x.nombre} · 15CM ${precio(x.p15)} · 30CM ${precio(x.p30)}`), '', link('ig-carta')],
  '03-los-hermanos': ['Son hermanos. No se parecen en nada.', 'SANDO hace la carta. WICHO te deja armar el tuyo.', '¿De qué lado estás?', link('ig-hermanos')],
  '07-abrimos': [`Abrimos el martes 13 de octubre, desde las ${h0.open_hour}:00.`, 'Sándwiches armados al momento, directo a tu puerta. ¿Ya sabes cuál vas a pedir?', link('ig-abrimos')],
  '05-philly': [`${ultimaFrase(philly.pitch)}`, `${philly.nombre}: ${philly.ingredientes.join(', ').toLowerCase()}.`, link('ig-philly')],
  '09-para-la-oficina': ['«Somos seis. Bueno, siete.» — WICHO', `Organiza el almuerzo de la oficina y el tuyo sale gratis: desde ${D.organizadorDesde} sándwiches, quien organiza se lleva el 15CM más barato.`, 'No aplica al menú secreto.', link('ig-grupo')],
  '04-arma-el-tuyo': ['Tu sándwich, como nadie más lo pide.', 'Las reglas las pones tú. — WICHO', link('ig-arma')],
  '08-turkey': [`${ultimaFrase(turkey.pitch)}`, `${turkey.nombre}: ${turkey.ingredientes.join(', ').toLowerCase()}.`, link('ig-turkey')],
  '06-tira-la-sexta-salsa': ['La tira n.º 1: la sexta salsa.', '¿Quién tiene razón? Te leemos.', link('ig-tira-1')],
};
const SRCDE = { '01-como-se-pide': 'ig-como', '02-la-carta': 'ig-carta', '03-los-hermanos': 'ig-hermanos', '07-abrimos': 'ig-abrimos', '05-philly': 'ig-philly', '09-para-la-oficina': 'ig-grupo', '04-arma-el-tuyo': 'ig-arma', '08-turkey': 'ig-turkey', '06-tira-la-sexta-salsa': 'ig-tira-1' };
const laminas = (pref) => P.map((x) => x.archivo).filter((x) => x.startsWith(pref));
const orden = [...PERFIL.cuadricula.slice(3)].reverse().concat(PERFIL.cuadricula.slice(0, 3).reverse());
const md = [
  '# Lanzamiento de Instagram — lo que se pega y lo que se sube', '',
  '> Generado por `scripts/piezas/lanzamiento.mjs`. No se edita a mano: los números salen de la carta y las reglas.', '',
  '## El perfil', '', `- **Nombre**: ${PERFIL.nombre}`, `- **Categoría**: ${PERFIL.categoria}`, `- **Bio** (${bioLen}/150):`, '', '```', ...PERFIL.bio, '```', '', `- **Enlace**: https://${PERFIL.enlace}`, '- **Botón de acción**: «Pedir comida» → el mismo enlace, si Instagram lo ofrece para la cuenta.', '',
  '## Orden de publicación', '', 'Instagram pone lo último arriba a la izquierda. Para que la cuadrícula quede por columnas (útil · producto · personajes), se publica en este orden y al final se fijan las tres primeras de la cuadrícula:', '',
  ...orden.map((x, i) => { const pref = x.replace(/-1$/, ''); const l = laminas(pref); return `${i + 1}. **${pref}** — ${l.length > 1 ? `carrusel de ${l.length} láminas` : 'una imagen'}${PERFIL.cuadricula.slice(0, 3).includes(x) ? ' · **fijar**' : ''}`; }), '',
  '## Las destacadas', '', 'Cada una con su portada (`destacada-*.jpg`) y, para empezar, estas láminas como historias:', '',
  '- **Pide**: las 4 de «cómo se pide» · **Carta**: las 7 de «la carta» · **Arma**: las 2 de «arma el tuyo» · **Grupo**: «para la oficina» · **Zonas**: una historia «¿Llegamos a tu casa? Pon tu dirección en sndwch.app y ves el envío al instante» · **Ellos**: las 3 de «los hermanos».', '',
  '## El texto de cada publicación', '',
  ...Object.entries(TEXTOS).flatMap(([k, v]) => [`### ${k}`, '', '```', ...v, '```', '']),
].join('\n');
writeFileSync(`${OUT}/TEXTOS.md`, md);
// Lo que lee scripts/piezas/subir.mjs para cargar el calendario, en el orden de publicación.
writeFileSync(`${OUT}/publicaciones.json`, JSON.stringify(orden.map((x) => {
  const pref = x.replace(/-1$/, '');
  return { pieza: pref, laminas: laminas(pref).map((l) => `${l}.jpg`), texto: TEXTOS[pref].join('\n'), src: SRCDE[pref], fijar: PERFIL.cuadricula.slice(0, 3).includes(x) };
}), null, 2));
await b.close();
writeFileSync(`${OUT}/piezas.json`, JSON.stringify({ piezas: P.map((x) => x.archivo), destacadas: DEST.map((x) => x.archivo) }, null, 2));
console.log(`✓ ${P.length} láminas y ${DEST.length} portadas en ${OUT}`);
