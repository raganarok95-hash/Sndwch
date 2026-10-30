// El Instagram de SND//WCH, v3: los hermanos DESCOMPUESTOS, no dibujados en todo (dueño, 2026-10-30:
// «confundiste falta sando y wicho con ponlos en todo ig, ten creatividad, descompone, usa los
// colores»). Elementos de docs/LOS_DOS_HERMANOS.md:
//   SANDO: oliva de la casaca, verde casi negro, tan, el acanalado de puños y basta, el forro naranja
//          (franja lisa y VERTICAL, solo donde está su mundo).
//   WICHO: celeste del pelaje, durazno, la espiral lila de sus ojos (por cálculo), las curvas de nivel
//          de su polo (tono sobre tono), su tinta.
// La comida sigue limpia: la foto arriba, sin nada encima; el mundo del hermano va debajo, como la
// basta acanalada de la casaca de SANDO.
const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, OUT = path.join(D, process.env.SALIDA || 'out3'); fs.mkdirSync(OUT, { recursive: true });
const REPO = '/home/user/Sndwch';
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const FOTOS = process.env.FOTOS || `${REPO}/docs/marketing/anuncios/fotos`;
const img = (p) => 'file://' + path.resolve(p);
const S = { oliva: '#6C7860', verde: '#183024', tan: '#C9A87C', forro: '#D8823C', oro: '#CBA258' };
const W = { pelaje: '#90CCF0', curvas: '#7DB6DA', durazno: '#F0D8CC', lila: '#C3A6D2', lilaO: '#4A3D62', tinta: '#1E2F3A' };
const papel = '#EFE6D4', celeste = '#8CC8EC';

const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.9;letter-spacing:-.005em}
.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}
.wm{font:800 44px/1 Archivo,sans-serif;display:inline-flex;align-items:center;letter-spacing:.01em}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:${S.oro}}.mk i:last-child{background:${celeste}}
.rib{background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 7px,rgba(255,255,255,.045) 7px 14px)}`;
const marca = (c = papel, t = 44) => `<span class="wm" style="color:${c};font-size:${t}px">SND<span class="mk"><i></i><i></i></span>WCH</span>`;
const pagina = (w, h, cuerpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:${w}px;height:${h}px;overflow:hidden}${BASE}${extra}</style></head><body>${cuerpo}</body></html>`;

// La espiral de WICHO, por cálculo (radio que crece con el ángulo, ~3.6 vueltas): a mano sale un trébol.
function espiral(cx, cy, rmax, color, ancho) {
  const vueltas = 3.6, n = 400, pts = [];
  for (let i = 0; i <= n; i++) { const t = (i / n) * vueltas * 2 * Math.PI; const r = (t / (vueltas * 2 * Math.PI)) * rmax; pts.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// Las curvas de nivel de su polo: anillos deformados, tono sobre tono, finos.
function curvas(w, h, cx, cy, color, n = 16, paso = 70, semilla = 1) {
  let s = '';
  for (let k = 1; k <= n; k++) {
    const pts = [];
    for (let i = 0; i <= 180; i++) {
      const t = (i / 180) * 2 * Math.PI;
      const r = k * paso * (1 + 0.09 * Math.sin(3 * t + k * 0.35 + semilla) + 0.05 * Math.sin(5 * t + 1.7 * semilla) + 0.03 * Math.sin(2 * t - k * 0.2));
      pts.push(`${(cx + r * Math.cos(t) * 1.15).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
    }
    s += `<polygon points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
  }
  return `<svg width="${w}" height="${h}" style="position:absolute;inset:0">${s}</svg>`;
}

// ── Foto de perfil: el logo (los dos hermanos), como en la v2.
const perfil = pagina(1080, 1080, `<div style="width:1080px;height:1080px;background:${papel};display:flex;align-items:center;justify-content:center">
  <img src="${img(`${REPO}/img/logo-avatar-640.webp`)}" style="width:900px;height:900px"></div>`);

// ── Destacados: cada uno es un pedazo de un hermano, con el ícono de la app encima.
const ICON = {
  carta: '<path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><path d="M3 11h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/><path d="M4 15.5h16"/><path d="M8 7c.7-1.3 1.9-2 4-2s3.3.7 4 2"/>',
  pedir: '<path d="M4 5h2l2.3 11.4A2 2 0 0 0 10.3 18h7.4a2 2 0 0 0 2-1.6L21 9H7.2"/><circle cx="10.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>',
  bebidas: '<rect x="8" y="8" width="8" height="13" rx="2"/><path d="M10 8V5.5h4V8"/><path d="M9.6 3.8h4.8"/><path d="M8 12.5h8"/>',
  zonas: '<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>',
};
const ico = (k, c, t = 520) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position:relative">${ICON[k]}</svg>`;
const centro = 'width:1080px;height:1920px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center';
const DEST = [
  ['carta', 'Carta', `<div class="rib" style="${centro};background-color:${S.oliva}">${ico('carta', papel)}</div>`],
  ['pedir', 'Cómo pedir', `<div style="${centro};background:${W.pelaje}">${curvas(1080, 1920, 540, 960, W.curvas, 16, 70, 2)}${ico('pedir', W.tinta)}</div>`],
  ['bebidas', 'Bebidas', `<div style="${centro};background:${W.lilaO}"><svg width="1080" height="1920" style="position:absolute;inset:0">${espiral(540, 960, 470, W.lila, 26)}</svg>${ico('bebidas', W.durazno, 360)}</div>`],
  ['zonas', 'Zonas', `<div style="${centro};background:${S.verde}"><div style="position:absolute;left:300px;top:0;bottom:0;width:70px;background:${S.forro}"></div>${ico('zonas', S.tan)}</div>`],
];

// ── Los Signatures: la foto limpia arriba y, abajo, la basta acanalada de la casaca de SANDO con el texto.
const sig = ({ foto, titular, tam = 120, voz, alto = 470 }) => pagina(1080, 1350, `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:${S.oliva}">
  <div style="position:absolute;left:0;right:0;top:0;height:${1350 - alto}px;background:url('${img(foto)}') center 62%/cover"></div>
  <div class="rib" style="position:absolute;left:0;right:0;bottom:0;height:${alto}px;background-color:${S.oliva};padding:52px 84px 56px;display:flex;flex-direction:column">
    <div class="disp" style="font-size:${tam}px;color:${papel}">${titular}</div>
    <div class="voz" style="font-size:44px;line-height:1.12;margin-top:16px;color:${papel}">${voz}</div>
    <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:26px;color:${papel}">ABRIMOS EN NOVIEMBRE</div>${marca(papel, 40)}</div></div></div>`);

// ── La carta: el mundo de SANDO (su verde, la basta acanalada, el forro vertical) y una línea de WICHO.
const SIGS = ['Philly Cheesesteak', 'Meatball Marinara', 'Turkey', 'Tuna Melt', 'Italian Hoagie', 'Classic Tuna'];
const carta = pagina(1080, 1350, `<div style="position:relative;width:1080px;height:1350px;background:${S.verde};color:${papel};overflow:hidden">
  <div style="position:absolute;left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div>
  <div class="rib" style="position:absolute;left:26px;right:0;bottom:0;height:150px;background-color:${S.oliva}"></div>
  <div style="position:absolute;left:110px;right:84px;top:92px">
    <div class="mono" style="font-size:26px;color:${S.tan}">LA CARTA · 15 CM Y 30 CM</div>
    <div class="disp" style="font-size:96px;line-height:1.03;margin-top:40px">${SIGS.join('<br>')}</div>
    <div style="display:flex;align-items:center;gap:22px;margin-top:40px"><svg width="70" height="70">${espiral(35, 35, 31, W.lila, 5)}</svg>
      <span class="voz" style="font-size:58px;color:${W.pelaje}">Y el que armas tú.</span></div></div>
  <div style="position:absolute;left:110px;right:84px;bottom:52px;display:flex;justify-content:space-between;align-items:center"><div class="mono" style="font-size:26px">DESLIZA →</div>${marca(papel, 40)}</div></div>`);

// ── Cómo se pide: el mundo de WICHO (su celeste, sus curvas de nivel, la espiral en cada paso).
const pasos = ['Entras a sndwch.app', 'Eliges uno o armas el tuyo', 'Pagas con Yape o tarjeta', 'Te llega a la puerta'];
const comoPedir = pagina(1080, 1350, `<div style="position:relative;width:1080px;height:1350px;background:${W.pelaje};color:${W.tinta};overflow:hidden">
  ${curvas(1080, 1350, 900, 1150, W.curvas, 18, 66, 1)}
  <div style="position:absolute;left:96px;right:96px;top:92px">
    <div class="mono" style="font-size:26px">ASÍ DE FÁCIL</div>
    <div class="disp" style="font-size:150px;margin-top:34px">Cuatro<br>pasos.</div>
    <div style="margin-top:56px;display:flex;flex-direction:column;gap:30px">${pasos.map((t) => `<div style="display:flex;gap:26px;align-items:center">
      <span style="position:relative;width:76px;height:76px;flex:none"><svg width="76" height="76" style="position:absolute;inset:0"><circle cx="38" cy="38" r="38" fill="${W.lilaO}"/>${espiral(38, 38, 30, W.lila, 4)}</svg>
</span>
      <span class="voz" style="font-size:56px">${t}</span></div>`).join('')}</div></div>
  <div style="position:absolute;left:96px;right:96px;bottom:56px;display:flex;justify-content:space-between;align-items:center"><div class="mono" style="font-size:26px">ABRIMOS EN NOVIEMBRE</div>${marca(W.tinta, 40)}</div></div>`);

// ── El Reel que graba el dueño: su portada, en la tinta de WICHO con su trama cruzada.
const reel = pagina(1080, 1350, `<div style="position:relative;width:1080px;height:1350px;background:${W.tinta};color:${papel};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center;padding:120px;
  background-image:repeating-linear-gradient(45deg,rgba(144,204,240,.07) 0 2px,transparent 2px 22px),repeating-linear-gradient(-45deg,rgba(144,204,240,.07) 0 2px,transparent 2px 22px)">
  <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="${W.pelaje}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8h18M9 3l2.5 5M15 3l2.5 5"/><path d="M10.5 11.5v6l5-3z"/></svg>
  <div class="disp" style="font-size:110px">Detrás<br>del pan</div>
  <div class="voz" style="font-size:46px;color:${W.durazno}">Aquí va tu video: cortando el pan, la plancha y el armado. 10 a 15 segundos.</div></div>`);

const POSTS = [
  { n: '1-abrimos', html: sig({ foto: `${FOTOS}/foto-philly.jpg`, titular: 'Hambre en serio.', voz: 'Philly Cheesesteak. Tan jugoso que no lleva salsa.' }), fijada: true },
  { n: '2-carta', html: carta, fijada: true },
  { n: '3-como-pedir', html: comoPedir, fijada: true },
  { n: '4-meatball', html: sig({ foto: `${FOTOS}/foto-meatball-lata.jpg`, titular: 'Hoy no cocinas.', voz: 'Meatball Marinara. Albóndigas en su propia marinara.' }) },
  { n: '5-turkey', html: sig({ foto: `${FOTOS}/foto-turkey-v4.jpg`, titular: 'El almuerzo que no<br>te tumba la tarde.', tam: 100, voz: 'Turkey. Llena sin pesar.' }) },
  { n: '6-tuna-melt', html: sig({ foto: `${FOTOS}/foto-tuna-melt.jpg`, titular: 'Antojo de algo<br>caliente.', tam: 104, voz: 'Tuna Melt. El cheddar se estira al primer mordisco.' }) },
  { n: '7-italian-hoagie', html: sig({ foto: `${FOTOS}/foto-italian-hoagie.jpg`, titular: 'Cuando quieres<br>de todo.', tam: 104, voz: 'Italian Hoagie. Cada capa suma y ninguna sobra.' }) },
  { n: '8-classic-tuna', html: sig({ foto: `${FOTOS}/foto-classic-tuna.jpg`, titular: 'Se come con<br>una mano.', tam: 104, voz: 'Classic Tuna. Simple y bien hecho.' }) },
  { n: '9-reel-detras', html: reel, reel: true },
];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage();
  const sacar = async (html, w, h, salida) => {
    await pg.setViewportSize({ width: w, height: h });
    const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const faltan = await pg.evaluate(() => ['Anton', 'Archivo', 'IBM Plex Mono', 'Instrument Serif'].filter((f) => ![...document.fonts].some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded')));
    if (faltan.length) throw new Error('faltan fuentes: ' + faltan);
    await pg.screenshot({ path: salida, type: 'jpeg', quality: 92 });
  };
  await sacar(perfil, 1080, 1080, path.join(OUT, 'foto-de-perfil.jpg'));
  for (const [k, , html] of DEST) await sacar(pagina(1080, 1920, html), 1080, 1920, path.join(OUT, `destacado-${k}.jpg`));
  for (const p of POSTS) { p.jpg = path.join(OUT, `publicacion-${p.n}.jpg`); await sacar(p.html, 1080, 1350, p.jpg); }

  // La maqueta del perfil (Instagram recorta la cuadrícula a 3:4).
  const ui = `body{background:#fff;font-family:Archivo,sans-serif;color:#0B0B0B}
  .t{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px;font:800 19px Archivo}
  .cab{display:flex;align-items:center;gap:22px;padding:8px 16px}
  .av{width:86px;height:86px;border-radius:50%;background:url('${img(path.join(OUT, 'foto-de-perfil.jpg'))}') center/cover;flex:none}
  .num{display:flex;flex:1;justify-content:space-around;text-align:center;font:700 16px Archivo}.num span{display:block;font:400 13px Archivo;color:#333}
  .bio{padding:4px 16px 0;font:400 14px/1.35 Archivo}.bio b{font-weight:800}.bio .cat{color:#737373}.bio a{color:#00376B;font-weight:600}
  .bt{display:flex;gap:6px;padding:12px 16px}.bt div{flex:1;height:32px;border-radius:8px;background:#EFEFEF;display:flex;align-items:center;justify-content:center;font:700 13px Archivo}.bt .az{background:#0095F6;color:#fff}
  .hl{display:flex;gap:16px;padding:4px 16px 12px}.h{width:66px;text-align:center;font:400 12px Archivo}
  .h i{display:block;width:66px;height:66px;border-radius:50%;border:1px solid #DBDBDB;padding:3px;margin-bottom:5px}.h i b{display:block;width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center}
  .tabs{display:flex;border-top:1px solid #DBDBDB}.tabs div{flex:1;height:44px;display:flex;align-items:center;justify-content:center}.tabs div:first-child{border-bottom:1.5px solid #0B0B0B}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.g{position:relative;aspect-ratio:3/4;background-size:cover;background-position:center}
  .g svg{position:absolute;top:7px;right:7px;filter:drop-shadow(0 0 2px rgba(0,0,0,.6))}`;
  const pin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15 3l6 6-3 1-4 4 1 4-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4 1 4-4z"/></svg>';
  const rl = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  const cuerpo = `<div style="width:390px"><div class="t"><span>snd__wch</span><span style="font-weight:400">≡</span></div>
    <div class="cab"><div class="av"></div><div class="num"><div>9<span>publicaciones</span></div><div>—<span>seguidores</span></div><div>—<span>seguidos</span></div></div></div>
    <div class="bio"><b>SND//WCH · Sándwiches</b><br><span class="cat">Restaurante de sándwiches</span><br>Sándwiches de pan largo, al estilo americano.<br>Armados al momento, a domicilio.<br>Abrimos en noviembre.<br><a>sndwch.app</a></div>
    <div class="bt"><div class="az">Seguir</div><div>Mensaje</div><div>WhatsApp</div></div>
    <div class="hl">${DEST.map(([k, t]) => `<div class="h"><i><b style="background-image:url('${img(path.join(OUT, `destacado-${k}.jpg`))}')"></b></i>${t}</div>`).join('')}</div>
    <div class="tabs"><div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" stroke-width="1.8"><rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></div><div>${rl.replace('#fff', '#737373')}</div><div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#737373" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M6 20c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5"/></svg></div></div>
    <div class="grid">${POSTS.map((p) => `<div class="g" style="background-image:url('${img(p.jpg)}')">${p.fijada ? pin : p.reel ? rl : ''}</div>`).join('')}</div></div>`;
  const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, pagina(390, 1200, cuerpo, ui).replace('html,body{width:390px;height:1200px;overflow:hidden}', 'html,body{width:390px}'));
  await pg.setViewportSize({ width: 390, height: 1200 }); await pg.goto('file://' + tmp, { waitUntil: 'load' });
  const alto = await pg.evaluate(() => document.body.scrollHeight);
  const pg2 = await b.newPage({ viewport: { width: 390, height: alto }, deviceScaleFactor: 2 });
  await pg2.goto('file://' + tmp, { waitUntil: 'load' }); await pg2.evaluate(() => document.fonts.ready);
  await pg2.screenshot({ path: path.join(OUT, 'perfil-maqueta.jpg'), type: 'jpeg', quality: 90, fullPage: true });
  fs.rmSync(tmp); await b.close();
  console.log('listo', OUT);
})();
