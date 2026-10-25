// Cuatro identidades para la primera pantalla del armador (el mundo de WICHO), cada una desde cero.
// 390 x 844. Tamaños de letra y radios del sistema (check:sistema). Precios de la carta vigente.
const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const CSS = 'file://' + path.join(DIR, '..', 'latas', 'fuentes', 'local.css');
const IMG = (f) => 'file:///home/user/Sndwch/img/' + f;
const C = { pelo: '#90CCF0', tinta: '#1E2F3A', lila: '#C3A6D2', lilaOsc: '#4A3D62', durazno: '#F0D8CC', papel: '#EAF5FC' };
const P15 = '19.90', P30 = '30.90';

const base = (extra) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${CSS}"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:390px;height:844px;overflow:hidden}
  .anton{font-family:'Anton';text-transform:uppercase;letter-spacing:.01em}
  .serif{font-family:'Instrument Serif';font-style:italic}
  .mono{font-family:'IBM Plex Mono';font-weight:600;text-transform:uppercase;letter-spacing:.12em}
  .arch{font-family:'Archivo'}
  .abs{position:absolute}
  ${extra}</style></head><body>`;

// Curvas de nivel (el estampado del polo de WICHO), calculadas.
function curvas(w, h, cx, cy, n, paso, color, ancho, seed) {
  let out = '';
  for (let k = 1; k <= n; k++) {
    const r0 = k * paso; let d = '';
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 2;
      const r = r0 * (1 + 0.10 * Math.sin(3 * t + seed + k * 0.35) + 0.06 * Math.sin(5 * t + seed * 2 - k * 0.2));
      const x = cx + r * Math.cos(t) * 1.15, y = cy + r * Math.sin(t);
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    out += `<path d="${d}Z" fill="none" stroke="${color}" stroke-width="${ancho}"/>`;
  }
  return `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${out}</svg>`;
}
// La espiral (los ojos de WICHO), calculada.
function espiral(cx, cy, vueltas, rMax, hecho, color, colorHecho, ancho) {
  const pts = [], N = vueltas * 90;
  for (let i = 0; i <= N; i++) { const t = (i / N) * vueltas * Math.PI * 2; const r = (i / N) * rMax; pts.push([cx + r * Math.cos(t - Math.PI / 2), cy + r * Math.sin(t - Math.PI / 2)]); }
  const path = (a, b) => pts.slice(a, b + 1).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const corte = Math.round(N * (1 - hecho));
  return `<path d="${path(0, corte)}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>
          <path d="${path(corte, N)}" fill="none" stroke="${colorHecho}" stroke-width="${ancho + 2}" stroke-linecap="round"/>`;
}
// Un pan sub dibujado a tinta, con trama cruzada abajo (el trazo de WICHO: grosor variable, se pasa).
function pan(x, y, largo, alto, tinta, relleno) {
  const id = 'tr' + Math.round(x + y + largo);
  const cortes = Array.from({ length: Math.max(2, Math.round(largo / 46)) }, (_, i) => {
    const cx = x + (largo / (Math.max(2, Math.round(largo / 46)) + 1)) * (i + 1);
    return `<path d="M${cx - 9} ${y + alto * 0.30} q9 -7 18 -3" fill="none" stroke="${tinta}" stroke-width="2.2" stroke-linecap="round"/>`;
  }).join('');
  return `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0 L0 6" stroke="${tinta}" stroke-width="1.1" opacity=".55"/></pattern>
          <clipPath id="c${id}"><rect x="${x}" y="${y + alto * 0.62}" width="${largo}" height="${alto * 0.38}"/></clipPath></defs>
    <rect x="${x}" y="${y}" width="${largo}" height="${alto}" rx="${alto / 2}" fill="${relleno}"/>
    <rect x="${x}" y="${y}" width="${largo}" height="${alto}" rx="${alto / 2}" fill="url(#${id})" clip-path="url(#c${id})"/>
    <path d="M${x + alto * 0.35} ${y + 1.5} H${x + largo - alto * 0.2}" stroke="${tinta}" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="${x}" y="${y}" width="${largo}" height="${alto}" rx="${alto / 2}" fill="none" stroke="${tinta}" stroke-width="2.4"/>
    <path d="M${x - 6} ${y + alto - 1} H${x + largo * 0.4}" stroke="${tinta}" stroke-width="1.6" stroke-linecap="round"/>
    ${cortes}`;
}
// El círculo de plumón que no cierra (lo elegido, en el mundo de WICHO).
const plumon = (cx, cy, rx, ry, color, ancho) => `<path d="M${cx + rx * 0.85} ${cy - ry * 0.55} C${cx + rx * 1.15} ${cy + ry * 0.4}, ${cx + rx * 0.3} ${cy + ry * 1.12}, ${cx - rx * 0.45} ${cy + ry * 0.95} C${cx - rx * 1.25} ${cy + ry * 0.7}, ${cx - rx * 1.1} ${cy - ry * 0.75}, ${cx - rx * 0.1} ${cy - ry * 1.02} C${cx + rx * 0.55} ${cy - ry * 1.18}, ${cx + rx * 1.12} ${cy - ry * 0.65}, ${cx + rx * 1.02} ${cy - ry * 0.05}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>`;

// ── A · LA LIBRETA ─────────────────────────────────────────────────────────────
const A = base(`body{background:${C.papel};color:${C.tinta}}`) + `
  ${curvas(390, 844, 330, 760, 14, 34, '#C9E4F5', 1.4, 1.3)}
  <div class="abs" style="left:20px;top:22px;display:flex;align-items:center;gap:12px">
    <svg width="28" height="18" viewBox="0 0 28 18"><path d="M27 9 H3 M10 2 L2 9 L10 16" fill="none" stroke="${C.tinta}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="serif" style="font-size:18px">paso 1 de 6</span></div>
  <svg class="abs" style="left:150px;top:24px" width="220" height="22" viewBox="0 0 220 22">
    <path d="M6 11 H214" stroke="${C.tinta}" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${12 + i * 39}" cy="11" r="${i ? 4 : 5}" fill="${i ? C.papel : C.tinta}" stroke="${C.tinta}" stroke-width="1.8"/>`).join('')}
    ${plumon(12, 11, 11, 9, C.lilaOsc, 2.2)}</svg>
  <div class="abs serif" style="left:20px;top:78px;font-size:56px;line-height:.95;width:260px">¿De qué<br>tamaño?</div>
  <svg class="abs" style="left:14px;top:186px" width="240" height="16" viewBox="0 0 240 16"><path d="M2 9 C60 3, 140 13, 236 5" fill="none" stroke="${C.lilaOsc}" stroke-width="3.4" stroke-linecap="round"/><path d="M40 12 C100 8, 170 12, 210 9" fill="none" stroke="${C.lilaOsc}" stroke-width="1.4" stroke-linecap="round"/></svg>
  <img class="abs" src="${IMG('wicho_asoma.png')}" style="right:-34px;top:70px;width:170px;transform:scaleX(-1)">
  <div class="abs serif" style="left:20px;top:214px;font-size:18px;width:230px;line-height:1.25">Va primero porque cambia el precio de todo lo demás.</div>

  <svg class="abs" style="left:0;top:300px" width="390" height="330" viewBox="0 0 390 330">
    ${pan(28, 26, 167, 54, C.tinta, '#F6E7CF')}
    ${plumon(111, 53, 108, 48, C.lilaOsc, 3)}
    <path d="M28 104 H195" stroke="${C.tinta}" stroke-width="1.4"/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${28 + i * 11.13} 104 v${i % 5 === 0 ? 9 : 5}" stroke="${C.tinta}" stroke-width="1.2"/>`).join('')}
    <text x="28" y="126" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.tinta}">0</text>
    <text x="183" y="126" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.tinta}">15</text>
    ${pan(28, 176, 334, 54, C.tinta, '#F6E7CF')}
    <path d="M28 254 H362" stroke="${C.tinta}" stroke-width="1.4"/>
    ${Array.from({ length: 31 }, (_, i) => `<path d="M${28 + i * 11.13} 254 v${i % 5 === 0 ? 9 : 5}" stroke="${C.tinta}" stroke-width="1.2"/>`).join('')}
    <text x="28" y="276" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.tinta}">0</text>
    <text x="347" y="276" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.tinta}">30</text>
    <path d="M232 46 C262 30, 280 44, 292 64" fill="none" stroke="${C.tinta}" stroke-width="1.6" stroke-linecap="round"/><path d="M286 56 L292 64 L282 66" fill="none" stroke="${C.tinta}" stroke-width="1.6" stroke-linecap="round"/>
  </svg>
  <div class="abs" style="left:228px;top:302px;width:150px"><div class="anton" style="font-size:28px">15 cm</div>
    <div class="serif" style="font-size:18px;line-height:1.1">el de siempre</div><div class="mono" style="font-size:11px;margin-top:4px">desde s/${P15}</div></div>
  <div class="abs" style="left:28px;top:592px;width:340px;display:flex;align-items:baseline;gap:10px"><span class="anton" style="font-size:28px">30 cm</span>
    <span class="serif" style="font-size:18px">el doble de todo</span><span class="mono" style="font-size:11px;margin-left:auto">desde s/${P30}</span></div>

  <div class="abs serif" style="left:20px;top:668px;font-size:18px;display:flex;align-items:center;gap:8px">¿Son varios? Cada uno arma el suyo
    <svg width="30" height="14" viewBox="0 0 30 14"><path d="M1 8 C10 4, 20 10, 28 6 M22 1 L28 6 L21 11" fill="none" stroke="${C.tinta}" stroke-width="1.8" stroke-linecap="round"/></svg></div>
  <div class="abs" style="left:20px;right:20px;bottom:24px;height:56px;border-radius:999px;background:${C.tinta};color:${C.papel};display:flex;align-items:center;justify-content:space-between;padding:0 24px">
    <span class="mono" style="font-size:11px;color:${C.pelo}">15 cm · s/${P15}</span><span class="serif" style="font-size:22px">Sigue: el pan →</span></div>
</body></html>`;

// ── B · LOS STICKERS ───────────────────────────────────────────────────────────
const B = base(`body{background:${C.pelo};color:${C.tinta}}
  .st{position:absolute;border:6px solid #fff;border-radius:20px;box-shadow:0 10px 0 rgba(30,47,58,.18)}`) + `
  <svg class="abs" style="left:0;top:0" width="390" height="844" viewBox="0 0 390 844">${espiral(330, 150, 5, 260, 0, '#A9D8F4', '#A9D8F4', 10)}</svg>
  <div class="abs" style="left:16px;top:18px;display:flex;gap:8px;align-items:center">
    <div style="width:40px;height:40px;border-radius:999px;background:#fff;display:flex;align-items:center;justify-content:center"><svg width="18" height="14" viewBox="0 0 18 14"><path d="M17 7 H2 M7 1 L1 7 L7 13" fill="none" stroke="${C.tinta}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="mono" style="font-size:11px;background:${C.tinta};color:#fff;border-radius:999px;padding:8px 12px">Paso 1/6 · Tamaño</div></div>
  <div class="abs mono" style="right:16px;top:24px;font-size:11px;background:#fff;border-radius:999px;padding:8px 12px">Y además ↓</div>
  <div class="abs" style="left:16px;top:92px;transform:rotate(-4deg);transform-origin:left;display:flex;align-items:baseline;gap:10px"><span class="anton" style="font-size:72px;line-height:.92">¿15</span><span class="serif" style="font-size:56px;line-height:.92">o</span><span class="anton" style="font-size:72px;line-height:.92">30?</span></div>
  <div class="abs serif" style="left:22px;top:192px;font-size:18px;width:220px;transform:rotate(-2deg)">Va primero: cambia el precio de todo lo demás.</div>

  <div class="st" style="left:18px;top:262px;width:236px;height:150px;background:${C.durazno};transform:rotate(-5deg);padding:16px 18px">
    <div class="anton" style="font-size:56px;line-height:1">15CM</div>
    <div class="mono" style="font-size:11px;margin-top:6px">El de siempre</div>
    <div class="serif" style="font-size:22px;margin-top:2px">desde s/${P15}</div>
    <div class="abs mono" style="right:-14px;top:-16px;font-size:9px;background:${C.tinta};color:#fff;border-radius:999px;padding:6px 10px;transform:rotate(8deg)">Elegido</div></div>
  <div class="st" style="left:118px;top:430px;width:252px;height:160px;background:${C.lilaOsc};color:#fff;transform:rotate(4deg);padding:16px 18px">
    <div class="anton" style="font-size:56px;line-height:1">30CM</div>
    <div class="mono" style="font-size:11px;margin-top:6px;color:${C.lila}">El doble de todo</div>
    <div class="serif" style="font-size:22px;margin-top:2px">desde s/${P30}</div></div>
  <img class="abs" src="${IMG('wicho2_come.png')}" style="left:-46px;top:470px;width:200px;transform:rotate(-6deg)">
  <div class="abs" style="left:150px;top:624px;width:226px;background:#fff;border-radius:12px;padding:10px 14px;transform:rotate(-2deg)">
    <div class="anton" style="font-size:22px">¿Son varios?</div><div class="serif" style="font-size:15px">Cada uno arma el suyo →</div></div>
  <div class="abs anton" style="left:16px;right:16px;bottom:22px;height:60px;border-radius:999px;background:${C.tinta};color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center;letter-spacing:.04em">Sigue →</div>
</body></html>`;

// ── C · LA ESPIRAL ─────────────────────────────────────────────────────────────
const C3 = base(`body{background:${C.tinta};color:#fff}`) + `
  ${curvas(390, 844, 60, 120, 16, 30, '#263B49', 1.2, 2.1)}
  <div class="abs" style="left:20px;top:24px"><svg width="22" height="16" viewBox="0 0 22 16"><path d="M21 8 H2 M8 1 L1 8 L8 15" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
  <div class="abs mono" style="right:20px;top:26px;font-size:11px;color:${C.lila}">Y además ↓</div>
  <svg class="abs" style="left:0;top:56px" width="390" height="330" viewBox="0 0 390 330">
    <defs><radialGradient id="gl"><stop offset="0" stop-color="${C.lila}" stop-opacity=".35"/><stop offset="1" stop-color="${C.lila}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="195" cy="160" r="170" fill="url(#gl)"/>
    ${espiral(195, 160, 6, 148, 1 / 6, '#3A4F60', C.lila, 7)}
    <circle cx="195" cy="160" r="30" fill="${C.lilaOsc}"/>
    <text x="195" y="170" text-anchor="middle" font-family="Anton" font-size="28" fill="#fff">1/6</text>
  </svg>
  <div class="abs mono" style="left:0;right:0;top:404px;text-align:center;font-size:9px;letter-spacing:.08em;color:${C.lila}">Tamaño · pan · proteína · queso · vegetales · salsas</div>
  <div class="abs serif" style="left:0;right:0;top:428px;text-align:center;font-size:40px">¿De qué tamaño?</div>
  <div class="abs" style="left:24px;right:24px;top:500px;display:flex;justify-content:space-between">
    <div style="width:160px;height:160px;border-radius:999px;background:${C.lila};color:${C.tinta};display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div class="anton" style="font-size:56px;line-height:1">15</div><div class="mono" style="font-size:11px">cm · el de siempre</div><div class="serif" style="font-size:18px;margin-top:4px">desde s/${P15}</div></div>
    <div style="width:160px;height:160px;border-radius:999px;border:2px solid ${C.lila};display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div class="anton" style="font-size:56px;line-height:1">30</div><div class="mono" style="font-size:11px;color:${C.lila}">cm · el doble</div><div class="serif" style="font-size:18px;margin-top:4px">desde s/${P30}</div></div></div>
  <img class="abs" src="${IMG('wicho_asoma.png')}" style="left:-30px;top:640px;width:120px">
  <div class="abs" style="left:96px;right:20px;top:692px;display:flex;align-items:center;gap:8px;border-top:1px solid #33495A;padding-top:12px">
    <span class="serif" style="font-size:18px">¿Son varios?</span><span class="mono" style="font-size:9px;color:${C.lila}">cada uno arma el suyo</span><span style="margin-left:auto;font-size:18px">→</span></div>
  <div class="abs" style="left:20px;right:20px;bottom:22px;height:56px;border-radius:999px;background:${C.lila};color:${C.tinta};display:flex;align-items:center;justify-content:center" ><span class="arch" style="font-size:18px;font-weight:700">Sigue: el pan</span></div>
</body></html>`;

// ── D · LA CINTA MÉTRICA ───────────────────────────────────────────────────────
const tramo = 330 / 30; // px por cm
const D = base(`body{background:${C.pelo};color:${C.tinta}}`) + `
  <div class="abs" style="left:20px;top:22px;right:20px;display:flex;align-items:center;justify-content:space-between">
    <svg width="22" height="16" viewBox="0 0 22 16"><path d="M21 8 H2 M8 1 L1 8 L8 15" fill="none" stroke="${C.tinta}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span class="mono" style="font-size:11px">Y además ↓</span></div>
  <div class="abs" style="left:20px;right:20px;top:62px;display:flex;justify-content:space-between">
    ${['Tamaño', 'Pan', 'Proteína', 'Queso', 'Verdes', 'Salsas'].map((s, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:999px;${i ? `border:2px solid ${C.tinta}` : `background:${C.tinta}`}"></div><span class="mono" style="font-size:8px">${s}</span></div>`).join('')}</div>
  <div class="abs" style="left:26px;right:26px;top:68px;height:2px;background:${C.tinta};opacity:.35;z-index:-1"></div>
  <div class="abs anton" style="left:20px;top:112px;font-size:56px;line-height:.95;width:250px">¿Cuánto<br>sándwich?</div>
  <div class="abs serif" style="left:20px;top:232px;font-size:18px;width:230px">Míralo a escala: el de 30 es el doble de pan y el doble de relleno.</div>
  <img class="abs" src="${IMG('wicho_saluda.png')}" style="right:-18px;top:150px;width:128px">

  <div class="abs" style="left:0;right:0;top:330px;height:250px;background:${C.durazno};border-top:3px solid ${C.tinta};border-bottom:3px solid ${C.tinta}"></div>
  <svg class="abs" style="left:0;top:330px" width="390" height="250" viewBox="0 0 390 250">
    ${pan(30, 58, 15 * tramo, 62, C.tinta, '#F6E7CF')}
    <rect x="${30 + 15 * tramo + 4}" y="58" width="${15 * tramo - 4}" height="62" rx="31" fill="none" stroke="${C.tinta}" stroke-width="2" stroke-dasharray="6 6" opacity=".55"/>
    <text x="${30 + 22.5 * tramo}" y="95" text-anchor="middle" font-family="Instrument Serif" font-style="italic" font-size="18" fill="${C.tinta}">+15 cm</text>
    <rect x="30" y="150" width="330" height="34" fill="${C.pelo}" stroke="${C.tinta}" stroke-width="2"/>
    ${Array.from({ length: 31 }, (_, i) => `<path d="M${30 + i * tramo} 150 v${i % 5 === 0 ? 16 : 8}" stroke="${C.tinta}" stroke-width="${i % 5 === 0 ? 2 : 1.2}"/>`).join('')}
    ${[0, 5, 10, 15, 20, 25, 30].map((n) => `<text x="${30 + n * tramo}" y="180" text-anchor="middle" font-family="IBM Plex Mono" font-weight="600" font-size="9" fill="${C.tinta}">${n}</text>`).join('')}
    <path d="M${30 + 15 * tramo} 40 V196" stroke="${C.lilaOsc}" stroke-width="3"/>
    <circle cx="${30 + 15 * tramo}" cy="40" r="7" fill="${C.lilaOsc}"/>
    <text x="30" y="226" font-family="IBM Plex Mono" font-weight="600" font-size="11" fill="${C.tinta}">ARRASTRA O TOCA</text>
  </svg>
  <div class="abs" style="left:20px;right:20px;top:600px;display:flex;gap:12px">
    <div style="flex:1;border-radius:12px;background:${C.tinta};color:#fff;padding:12px 14px"><div class="anton" style="font-size:28px">15 cm</div><div class="mono" style="font-size:9px;color:${C.pelo}">El de siempre</div><div class="serif" style="font-size:18px">desde s/${P15}</div></div>
    <div style="flex:1;border-radius:12px;border:2px solid ${C.tinta};padding:12px 14px"><div class="anton" style="font-size:28px">30 cm</div><div class="mono" style="font-size:9px">El doble de todo</div><div class="serif" style="font-size:18px">desde s/${P30}</div></div></div>
  <div class="abs serif" style="left:20px;top:716px;font-size:18px">¿Son varios? Cada uno arma el suyo →</div>
  <div class="abs" style="left:20px;right:20px;bottom:22px;height:56px;border-radius:999px;background:${C.lilaOsc};color:#fff;display:flex;align-items:center;justify-content:center"><span class="arch" style="font-size:18px;font-weight:700">Sigue: el pan</span></div>
</body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const [k, html] of [['A', A], ['B', B], ['C', C3], ['D', D]]) {
    const f = path.join(DIR, `id-${k}.html`); fs.writeFileSync(f, html);
    await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(DIR, `id-${k}.png`) });
    console.log('ok', k);
  }
  await b.close();
})();
