// Identidad C «La espiral», elegida por el dueño (2026-10-25), extendida a todo el armador.
// 390 x 844 por pantalla. Letra y radios del sistema (check:sistema). Datos de la carta de hoy.
const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const CSS = 'file://' + path.join(DIR, '..', 'latas', 'fuentes', 'local.css');
const IMG = (f) => 'file:///home/user/Sndwch/' + f;
const K = { tinta: '#1E2F3A', fondo2: '#263B49', linea: '#33495A', lila: '#C3A6D2', lilaOsc: '#4A3D62', pelo: '#90CCF0', durazno: '#F0D8CC', blanco: '#F4F7FA', apagado: '#8FA3B3' };

const PASOS = ['Tamaño', 'Pan', 'Proteína', 'Queso', 'Vegetales', 'Salsas'];

const base = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${CSS}"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:390px;height:844px;overflow:hidden;background:${K.tinta};color:${K.blanco}}
  .anton{font-family:'Anton';text-transform:uppercase;letter-spacing:.01em}
  .serif{font-family:'Instrument Serif';font-style:italic}
  .mono{font-family:'IBM Plex Mono';font-weight:600;text-transform:uppercase;letter-spacing:.1em}
  .arch{font-family:'Archivo';font-weight:700}
  .abs{position:absolute}
  .ficha{border-radius:999px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .on{background:${K.lila};color:${K.tinta}}
  .off{border:2px solid ${K.lila};color:${K.blanco}}
  .chip{border-radius:999px;padding:10px 14px;display:inline-flex;flex-direction:column;line-height:1.1}
  </style></head><body>`;

function curvas(cx, cy, n, paso, seed) {
  let out = '';
  for (let k = 1; k <= n; k++) {
    const r0 = k * paso; let d = '';
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 2;
      const r = r0 * (1 + 0.10 * Math.sin(3 * t + seed + k * 0.35) + 0.06 * Math.sin(5 * t + seed * 2 - k * 0.2));
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(t) * 1.15).toFixed(1) + ' ' + (cy + r * Math.sin(t)).toFixed(1);
    }
    out += `<path d="${d}Z" fill="none" stroke="${K.fondo2}" stroke-width="1.2"/>`;
  }
  return `<svg class="abs" style="left:0;top:0" width="390" height="844">${out}</svg>`;
}
// La espiral se cierra de afuera hacia adentro: lo hecho es el tramo exterior, y crece hacia el centro.
function espiral(cx, cy, vueltas, rMin, rMax, hecho, ancho) {
  const pts = [], N = vueltas * 90;
  for (let i = 0; i <= N; i++) { const t = (i / N) * vueltas * Math.PI * 2; const r = rMin + (i / N) * (rMax - rMin); pts.push([cx + r * Math.cos(t - Math.PI / 2), cy + r * Math.sin(t - Math.PI / 2)]); }
  const tramo = (a, b) => pts.slice(a, b + 1).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const corte = Math.round(N * (1 - hecho));
  return `<path d="${tramo(0, corte)}" fill="none" stroke="#3A4F60" stroke-width="${ancho}" stroke-linecap="round"/>
          ${hecho > 0 ? `<path d="${tramo(corte, N)}" fill="none" stroke="${K.lila}" stroke-width="${ancho + 1.5}" stroke-linecap="round"/>` : ''}`;
}
const flecha = `<svg width="22" height="16" viewBox="0 0 22 16"><path d="M21 8 H2 M8 1 L1 8 L8 15" fill="none" stroke="${K.blanco}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Cabecera compacta (pasos 2 a 6): la espiral chica con el número del paso.
function cabecera(n) {
  return `<div class="abs" style="left:20px;top:22px">${flecha}</div>
  <div class="abs mono" style="right:20px;top:24px;font-size:11px;color:${K.lila}">Y además ↓</div>
  <svg class="abs" style="left:16px;top:56px" width="76" height="76">${espiral(38, 38, 3, 4, 34, n / 6, 4)}
    <circle cx="38" cy="38" r="15" fill="${K.lilaOsc}"/><text x="38" y="44" text-anchor="middle" font-family="Anton" font-size="15" fill="#fff">${n}/6</text></svg>
  <div class="abs" style="left:104px;top:62px;display:flex;align-items:baseline;gap:8px"><span class="mono" style="font-size:11px;color:${K.blanco}">${PASOS[n - 1]}</span>${n < 6 ? `<span class="mono" style="font-size:9px;color:${K.apagado}">luego: ${PASOS[n].toLowerCase()}</span>` : `<span class="mono" style="font-size:9px;color:${K.apagado}">el último</span>`}</div>`;
}
// El corte: el sándwich que se va armando, capa por capa (lo aprobado de «El corte de WICHO»).
function corte(capas) {
  const filas = capas.map((c) => `<div style="height:${c.h || 10}px;background:${c.col};display:flex;align-items:center;padding-left:12px"><span class="mono" style="font-size:8px;color:${c.txt || K.tinta}">${c.n}</span></div>`).join('');
  return `<div class="abs" style="left:104px;right:20px;top:84px;border:2px solid ${K.blanco};border-radius:20px;overflow:hidden;background:#E9C98F">
    <div style="height:10px"></div>${filas}<div style="height:10px"></div></div>`;
}
const PAN = [{ n: 'Classic', col: '#E9C98F', h: 0 }];
const CAPAS = {
  res: { n: 'Res laminada', col: '#7A4A2B', txt: '#F4E6D6', h: 14 },
  cheddar: { n: 'Cheddar', col: '#E8A33D', h: 9 },
  cebolla: { n: 'Cebolla salteada', col: '#D9B98A', h: 8 },
  pimiento: { n: 'Pimiento', col: '#6E9C45', txt: '#F4F7FA', h: 8 },
  lechuga: { n: 'Lechuga', col: '#8CBF5A', h: 8 },
  chimi: { n: 'Chimichurri', col: '#B5552F', txt: '#F4E6D6', h: 8 },
};
function pie(precio, resumen, cta) {
  return `<div class="abs" style="left:0;right:0;bottom:0;height:104px;background:${K.tinta};border-top:1px solid ${K.linea}"></div>
  <div class="abs" style="left:20px;bottom:44px"><div class="anton" style="font-size:28px;color:${K.blanco}">${precio}</div></div>
  <div class="abs mono" style="left:20px;bottom:26px;font-size:9px;color:${K.apagado};max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${resumen}</div>
  <div class="abs" style="right:20px;bottom:30px;height:52px;padding:0 22px;border-radius:999px;background:${K.lila};color:${K.tinta};display:flex;align-items:center"><span class="arch" style="font-size:15px">${cta}</span></div>`;
}
const wichoAsoma = (top, w) => `<img class="abs" src="${IMG('img/wicho_asoma.png')}" style="right:-26px;top:${top}px;width:${w}px;transform:scaleX(-1)">`;
const pregunta = (t, top, sub) => `<div class="abs serif" style="left:20px;top:${top}px;font-size:40px;line-height:1;width:300px">${t}</div>
  ${sub ? `<div class="abs serif" style="left:20px;top:${top + (t.includes('<br>') ? 86 : 48)}px;font-size:18px;color:${K.apagado};width:280px">${sub}</div>` : ''}`;

const pantallas = {};

// 1 · Tamaño (la espiral grande)
pantallas['1-tamano'] = base + curvas(60, 120, 16, 30, 2.1) + `
  <div class="abs" style="left:20px;top:22px">${flecha}</div>
  <div class="abs mono" style="right:20px;top:24px;font-size:11px;color:${K.lila}">Y además ↓</div>
  <svg class="abs" style="left:0;top:50px" width="390" height="330">
    <defs><radialGradient id="gl"><stop offset="0" stop-color="${K.lila}" stop-opacity=".30"/><stop offset="1" stop-color="${K.lila}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="195" cy="160" r="170" fill="url(#gl)"/>${espiral(195, 160, 6, 34, 148, 1 / 6, 7)}
    <circle cx="195" cy="160" r="30" fill="${K.lilaOsc}"/><text x="195" y="170" text-anchor="middle" font-family="Anton" font-size="28" fill="#fff">1/6</text></svg>
  <div class="abs mono" style="left:0;right:0;top:398px;text-align:center;font-size:9px;color:${K.lila}"><span style="color:${K.blanco}">Tamaño</span> · pan · proteína · queso · vegetales · salsas</div>
  <div class="abs serif" style="left:0;right:0;top:422px;text-align:center;font-size:40px">¿De qué tamaño?</div>
  <div class="abs serif" style="left:0;right:0;top:470px;text-align:center;font-size:15px;color:${K.apagado}">Va primero: cambia el precio de todo lo demás.</div>
  <div class="abs" style="left:28px;right:28px;top:506px;display:flex;justify-content:space-between">
    <div class="ficha on" style="width:150px;height:150px"><div class="anton" style="font-size:56px;line-height:1">15</div><div class="mono" style="font-size:9px">cm · el de siempre</div><div class="serif" style="font-size:18px;margin-top:2px">desde s/19.90</div></div>
    <div class="ficha off" style="width:150px;height:150px"><div class="anton" style="font-size:56px;line-height:1">30</div><div class="mono" style="font-size:9px;color:${K.lila}">cm · el doble</div><div class="serif" style="font-size:18px;margin-top:2px">desde s/30.90</div></div></div>
  <img class="abs" src="${IMG('img/wicho_asoma.png')}" style="left:-30px;top:636px;width:112px">
  <div class="abs" style="left:96px;right:20px;top:672px;display:flex;align-items:center;gap:8px;border-top:1px solid ${K.linea};padding-top:10px">
    <span class="serif" style="font-size:18px">¿Son varios?</span><span class="mono" style="font-size:9px;color:${K.lila}">cada uno arma el suyo</span><span style="margin-left:auto">→</span></div>
  <div class="abs" style="left:20px;right:20px;bottom:24px;height:56px;border-radius:999px;background:${K.lila};color:${K.tinta};display:flex;align-items:center;justify-content:center"><span class="arch" style="font-size:18px">Sigue: el pan</span></div>
</body></html>`;

// 2 · Pan
pantallas['2-pan'] = base + curvas(330, 760, 16, 30, 1.2) + cabecera(2) + corte([]) + pregunta('¿Sobre qué pan?', 176, 'Los dos se hornean acá.') + wichoAsoma(150, 96) + `
  <div class="abs" style="left:28px;right:28px;top:300px;display:flex;justify-content:space-between">
    <div class="ficha on" style="width:156px;height:156px;padding:12px"><div class="anton" style="font-size:28px">Classic</div><div class="mono" style="font-size:9px">white</div><div class="serif" style="font-size:15px;margin-top:6px;line-height:1.1">Miga suave, corteza fina</div><div class="mono" style="font-size:9px;margin-top:6px">sin recargo</div></div>
    <div class="ficha off" style="width:156px;height:156px;padding:12px"><div class="anton" style="font-size:28px">Focaccia</div><div class="mono" style="font-size:9px;color:${K.lila}">artesanal</div><div class="serif" style="font-size:15px;margin-top:6px;line-height:1.1">Aceite de oliva y sal gruesa</div><div class="mono" style="font-size:9px;margin-top:6px;color:${K.lila}">+s/0.50</div></div></div>
` + pie('s/19.90', '15cm · classic', 'Sigue: la proteína') + '</body></html>';

// 3 · Proteína (arriba)
const PROT = [['Res', 'Laminada', 'Laminada fina y salteada al momento.', '19.90', 'img/prot_p09.webp', true],
  ['Atún', 'House', 'En lascas gruesas, nunca hecho pasta.', '19.90', 'img/prot_p04.webp'],
  ['Albóndiga', 'Marinara', 'Chicas, hechas acá, en su propia marinara.', '19.90', 'img/prot_p06.webp'],
  ['Pavo', 'Horneado', 'Lonjas de un milímetro, en pliegues.', '19.90', 'img/prot_p08.webp'],
  ['Embutido', 'Italiano', 'Tres fiambres ahumados, en pliegues.', '16.90', 'img/prot_p05.webp']];
const filaProt = ([n, s, d, p, f, sel]) => `<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid ${K.linea}">
  <div style="width:76px;height:76px;border-radius:999px;flex:none;background:url('${IMG(f)}') center/cover;${sel ? `box-shadow:0 0 0 3px ${K.tinta},0 0 0 6px ${K.lila}` : ''}"></div>
  <div style="flex:1"><div><span class="anton" style="font-size:22px;${sel ? `color:${K.lila}` : ''}">${n}</span> <span class="mono" style="font-size:9px;color:${K.pelo}">${s}</span></div>
  <div class="serif" style="font-size:15px;color:${K.apagado};line-height:1.15">${d}</div></div>
  <div class="serif" style="font-size:18px">s/${p}</div></div>`;
pantallas['3-proteina'] = base + curvas(330, 760, 16, 30, 0.7) + cabecera(3) + corte([CAPAS.res]) + pregunta('¿Qué va adentro?', 176, 'Lo que elijas acá es el sándwich.') + wichoAsoma(150, 96) + `
  <div class="abs" style="left:20px;right:20px;top:272px">${PROT.map(filaProt).join('')}</div>
` + pie('s/19.90', '15cm · classic · res', 'Sigue: el queso') + '</body></html>';

// 3 · Proteína (abajo: doble, el puente a SANDO y el secreto)
pantallas['3-proteina-abajo'] = base + curvas(330, 760, 16, 30, 0.7) + cabecera(3) + corte([CAPAS.res]) + `
  <div class="abs" style="left:20px;right:20px;top:176px">${PROT.slice(3).map(filaProt).join('')}</div>
  <div class="abs" style="left:20px;top:392px;display:flex;gap:10px">
    <div class="chip" style="border:2px solid ${K.lila}"><span class="arch" style="font-size:15px">Doble de res</span><span class="mono" style="font-size:9px;color:${K.lila}">+s/7.00</span></div></div>
  <div class="abs" style="left:20px;right:20px;top:470px;border-top:1px dashed ${K.linea};border-bottom:1px dashed ${K.linea};padding:14px 0;display:flex;align-items:center;gap:12px">
    <img src="${IMG('img/logo-avatar-96.png')}" style="width:44px;height:44px;border-radius:999px">
    <div style="flex:1"><div class="serif" style="font-size:22px">¿Prefieres que ya esté resuelto?</div><div class="mono" style="font-size:9px;color:${K.apagado}">Philly Cheesesteak, la estrella de SANDO</div></div><span>→</span></div>
  <div class="abs" style="left:20px;right:20px;top:566px;padding:10px 0;display:flex;align-items:center;gap:12px">
    <svg width="44" height="44">${espiral(22, 22, 3, 2, 20, 1, 2.5)}</svg>
    <div style="flex:1"><div class="serif" style="font-size:22px">El sándwich secreto</div><div class="mono" style="font-size:9px;color:${K.lila}">Ya se te abrió. No preguntes qué lleva.</div></div><span>→</span></div>
` + pie('s/19.90', '15cm · classic · res', 'Sigue: el queso') + '</body></html>';

// 4 · Queso
pantallas['4-queso'] = base + curvas(60, 780, 16, 30, 1.9) + cabecera(4) + corte([CAPAS.res, CAPAS.cheddar]) + pregunta('¿Con queso?', 196, 'Va incluido, no cuesta nada.') + wichoAsoma(170, 96) + `
  <div class="abs" style="left:20px;right:20px;top:320px;display:flex;justify-content:space-between">
    <div class="ficha off" style="width:108px;height:108px"><div class="anton" style="font-size:18px">Americano</div><div class="serif" style="font-size:15px;color:${K.lila}">se funde parejo</div></div>
    <div class="ficha on" style="width:108px;height:108px"><div class="anton" style="font-size:18px">Cheddar</div><div class="serif" style="font-size:15px">curado y salado</div></div>
    <div class="ficha off" style="width:108px;height:108px;border-style:dashed"><div class="anton" style="font-size:18px">Sin queso</div></div></div>
` + pie('s/19.90', '15cm · classic · res · cheddar', 'Sigue: vegetales') + '</body></html>';

// 5 · Vegetales
const VEG = [['Todos', 'los 8', false], ['Tomate', 'fresco', false], ['Cebolla', 'morada juliana', false], ['Jalapeño', 'encurtido', false], ['Pickles', 'encurtidos', false], ['Pepinillo', 'fresco', false], ['Pimiento', 'verde', true], ['Lechuga', 'fresca', true], ['Cebolla', 'salteada', true]];
pantallas['5-vegetales'] = base + curvas(330, 760, 16, 30, 2.6) + cabecera(5) + corte([CAPAS.res, CAPAS.cheddar, CAPAS.cebolla, CAPAS.pimiento, CAPAS.lechuga]) + pregunta('¿Qué le pones<br>encima?', 226, 'Todos los que quieras, y ninguno cuesta.') + wichoAsoma(206, 90) + `
  <div class="abs" style="left:20px;right:20px;top:376px;display:flex;flex-wrap:wrap;gap:10px">
    ${VEG.map(([n, s, on]) => `<div class="chip ${on ? 'on' : 'off'}"><span class="arch" style="font-size:15px">${on ? '✓ ' : '+ '}${n}</span><span class="mono" style="font-size:8px;${on ? '' : `color:${K.lila}`}">${s}</span></div>`).join('')}</div>
` + pie('s/19.90', '15cm · classic · res · cheddar · 3 vegetales', 'Sigue: salsas') + '</body></html>';

// 6 · Salsas
const SAL = [['Mayonesa', 'americana', false], ['Mayonesa', 'light', false], ['Ketchup', 'americano', false], ['Honey', 'mustard', false], ['Oil & Vinegar', 'classic', false], ['Chimichurri', 'piña y ají', true]];
pantallas['6-salsas'] = base + curvas(60, 780, 16, 30, 3.3) + cabecera(6) + corte([CAPAS.res, CAPAS.cheddar, CAPAS.cebolla, CAPAS.pimiento, CAPAS.lechuga, CAPAS.chimi]) + pregunta('¿Y de salsa?', 236, 'Hasta 3 incluidas. Llevas 1.') + wichoAsoma(216, 90) + `
  <div class="abs" style="left:20px;right:20px;top:350px;display:flex;flex-wrap:wrap;gap:10px">
    ${SAL.map(([n, s, on]) => `<div class="chip ${on ? 'on' : 'off'}"><span class="arch" style="font-size:15px">${on ? '✓ ' : '+ '}${n}</span><span class="mono" style="font-size:8px;${on ? '' : `color:${K.lila}`}">${s}</span></div>`).join('')}
    <div class="chip" style="border:2px dashed ${K.apagado}"><span class="arch" style="font-size:15px">Doble de la última</span><span class="mono" style="font-size:8px;color:${K.apagado}">+s/2</span></div></div>
` + pie('s/19.90', '15cm · classic · res · cheddar · 3 vegetales · 1 salsa', 'Listo') + '</body></html>';

// 7 · Listo: la espiral cerrada, con el corte en el centro
pantallas['7-listo'] = base + curvas(195, 300, 18, 28, 1.1) + `
  <div class="abs" style="left:20px;top:22px">${flecha}</div>
  <svg class="abs" style="left:0;top:40px" width="390" height="380">
    <defs><radialGradient id="g2"><stop offset="0" stop-color="${K.lila}" stop-opacity=".40"/><stop offset="1" stop-color="${K.lila}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="195" cy="185" r="185" fill="url(#g2)"/>${espiral(195, 185, 6, 70, 168, 1, 7)}</svg>
  <div class="abs" style="left:117px;top:188px;width:156px;border:2px solid ${K.blanco};border-radius:20px;overflow:hidden;background:#E9C98F">
    <div style="height:14px"></div>${[CAPAS.res, CAPAS.cheddar, CAPAS.cebolla, CAPAS.pimiento, CAPAS.lechuga, CAPAS.chimi].map((c) => `<div style="height:${(c.h || 10) + 2}px;background:${c.col}"></div>`).join('')}<div style="height:14px"></div></div>
  <img class="abs" src="${IMG('img/wicho2_celebra.png')}" style="right:-10px;top:300px;width:150px">
  <div class="abs serif" style="left:20px;top:446px;font-size:40px;line-height:1;width:250px">¡Ese es tuyo!</div>
  <div class="abs serif" style="left:20px;top:494px;font-size:18px;color:${K.apagado};width:240px">Nadie más lo tiene igual.</div>
  <div class="abs" style="left:20px;right:20px;top:548px;border-top:1px solid ${K.linea};padding-top:14px">
    <div class="anton" style="font-size:22px">Tu res laminada</div>
    <div class="mono" style="font-size:9px;color:${K.lila};margin-top:6px;line-height:1.5">15cm · classic · cheddar · cebolla salteada · pimiento · lechuga · chimichurri</div>
    <div class="serif" style="font-size:15px;color:${K.apagado};margin-top:8px">Toca una capa del corte para cambiarla.</div></div>
` + pie('s/19.90', 'listo para pedir', 'Lo quiero') + '</body></html>';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const [k, html] of Object.entries(pantallas)) {
    const f = path.join(DIR, `esp-${k}.html`); fs.writeFileSync(f, html);
    await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(DIR, `esp-${k}.png`) });
    console.log('ok', k);
  }
  await b.close();
})();
