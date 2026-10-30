// El Instagram de SND//WCH completo: foto de perfil, portadas de destacados, las publicaciones de la
// cuadrícula y la maqueta del perfil. Mismo sistema que scripts/piezas/anuncios.mjs (tinta, papel,
// Anton + Instrument Serif + IBM Plex Mono, el // solo en la marca).
const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, OUT = path.join(D, 'out'); fs.mkdirSync(OUT, { recursive: true });
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const img = (p) => 'file://' + path.resolve(p);
const C = { papel: '#EFE6D4', tinta: '#1E2B22', oro: '#CBA258', celeste: '#8CC8EC' };
const REPO = '/home/user/Sndwch';

const BASE = `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.9;letter-spacing:-.005em}
.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}
.wm{font:800 46px/1 Archivo,sans-serif;display:inline-flex;align-items:center;letter-spacing:.01em}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:${C.oro}}.mk i:last-child{background:${C.celeste}}`;
const marca = (color = C.papel, t = 46) => `<span class="wm" style="color:${color};font-size:${t}px">SND<span class="mk"><i></i><i></i></span>WCH</span>`;
const pagina = (w, h, cuerpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:${w}px;height:${h}px;overflow:hidden}${BASE}${extra}</style></head><body>${cuerpo}</body></html>`;

// ── 1. Foto de perfil: el // solo, sobre la tinta. Se lee a 32 px, donde «SND//WCH» ya no.
const perfil = pagina(1080, 1080, `<div style="width:1080px;height:1080px;background:${C.tinta};display:flex;align-items:center;justify-content:center">
  <span class="mk" style="font-size:560px;margin:0;transform:translateX(-14px)"><i></i><i></i></span></div>`);

// ── 2. Destacados: el ícono de la app en papel sobre tinta, dentro del círculo que recorta Instagram.
const ICON = {
  carta: '<path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><path d="M3 11h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/><path d="M4 15.5h16"/><path d="M8 7c.7-1.3 1.9-2 4-2s3.3.7 4 2"/>',
  pedir: '<path d="M4 5h2l2.3 11.4A2 2 0 0 0 10.3 18h7.4a2 2 0 0 0 2-1.6L21 9H7.2"/><circle cx="10.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>',
  bebidas: '<rect x="8" y="8" width="8" height="13" rx="2"/><path d="M10 8V5.5h4V8"/><path d="M9.6 3.8h4.8"/><path d="M8 12.5h8"/>',
  zonas: '<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>',
};
const DEST = [['carta', 'Carta'], ['pedir', 'Cómo pedir'], ['bebidas', 'Bebidas'], ['zonas', 'Zonas']];
const portada = (k) => pagina(1080, 1920, `<div style="width:1080px;height:1920px;background:${C.tinta};display:flex;align-items:center;justify-content:center">
  <svg width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="${C.papel}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg></div>`);

// ── 3. Las publicaciones (4:5). Todo lo importante dentro del recorte 3:4 de la cuadrícula.
const VELOS = `.foto{position:absolute;inset:0;background-size:cover;background-position:center}
.va{position:absolute;left:0;right:0;top:0;background:linear-gradient(180deg,rgba(14,20,16,.82) 0%,rgba(14,20,16,.55) 55%,rgba(14,20,16,0) 100%)}
.vb{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,rgba(14,20,16,.92) 0%,rgba(14,20,16,.6) 55%,rgba(14,20,16,0) 100%)}`;
const foto = ({ foto: f, titular, tam, voz }) => pagina(1080, 1350, `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:${C.tinta}">
  <div class="foto" style="background-image:url('${img(f)}')"></div><div class="va" style="height:620px"></div><div class="vb" style="height:400px"></div>
  <div style="position:absolute;left:84px;right:84px;top:72px">
    <div class="disp" style="font-size:${tam}px;color:${C.papel}">${titular}</div>
    <div class="voz" style="font-size:48px;line-height:1.12;margin-top:22px;color:${C.papel}">${voz}</div></div>
  <div style="position:absolute;left:84px;right:84px;bottom:64px;display:flex;justify-content:space-between;align-items:flex-end">
    <div class="mono" style="font-size:28px;color:${C.papel}">ABRIMOS EN NOVIEMBRE</div>${marca()}</div></div>`, VELOS);
// Las dos fijadas de información: papel y tinta, sin foto (son la carta y los pasos, no un antojo).
const SIGS = ['Philly Cheesesteak', 'Meatball Marinara', 'Turkey', 'Tuna Melt', 'Italian Hoagie', 'Classic Tuna'];
const carta = pagina(1080, 1350, `<div style="width:1080px;height:1350px;background:${C.papel};color:${C.tinta};padding:96px 96px 80px;display:flex;flex-direction:column">
  <div class="mono" style="font-size:28px">LA CARTA · 15 CM Y 30 CM</div>
  <div class="disp" style="font-size:112px;margin-top:40px;line-height:1">${SIGS.join('<br>')}</div>
  <div class="voz" style="font-size:56px;margin-top:40px">Y el que armas tú.</div>
  <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:28px">DESLIZA →</div>${marca(C.tinta)}</div></div>`);
const pasos = [['1', 'Entras a sndwch.app'], ['2', 'Eliges uno o armas el tuyo'], ['3', 'Pagas con Yape o tarjeta'], ['4', 'Te llega a la puerta']];
const comoPedir = pagina(1080, 1350, `<div style="width:1080px;height:1350px;background:${C.tinta};color:${C.papel};padding:96px 96px 80px;display:flex;flex-direction:column">
  <div class="mono" style="font-size:28px">ASÍ DE FÁCIL</div>
  <div class="disp" style="font-size:150px;margin-top:36px">Cuatro<br>pasos.</div>
  <div style="margin-top:64px;display:flex;flex-direction:column;gap:34px">${pasos.map(([n, t]) => `<div style="display:flex;gap:34px;align-items:baseline"><span class="disp" style="font-size:84px;color:${C.papel};opacity:.45;width:60px">${n}</span><span class="voz" style="font-size:60px">${t}</span></div>`).join('')}</div>
  <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:28px">ABRIMOS EN NOVIEMBRE</div>${marca()}</div></div>`);
const reel = pagina(1080, 1350, `<div style="width:1080px;height:1350px;background:#2A332D;color:${C.papel};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center;padding:120px">
  <svg width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="${C.papel}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8h18M9 3l2.5 5M15 3l2.5 5"/><path d="M10.5 11.5v6l5-3z"/></svg>
  <div class="disp" style="font-size:96px">Detrás<br>del pan</div>
  <div class="voz" style="font-size:46px;opacity:.85">Aquí va tu video: cortando el pan, la plancha y el armado. 10 a 15 segundos.</div></div>`);

const P = 'docs/marketing/instagram-preapertura/';
const POSTS = [
  { n: '1-abrimos', archivo: `${REPO}/${P}philly-feed.jpg`, fijada: true },
  { n: '2-carta', html: carta, fijada: true, carrusel: true },
  { n: '3-como-pedir', html: comoPedir, fijada: true, carrusel: true },
  { n: '4-meatball', archivo: `${REPO}/${P}meatball-feed.jpg` },
  { n: '5-turkey', html: foto({ foto: `${REPO}/docs/marketing/anuncios/fotos/foto-turkey-v4.jpg`, titular: 'El almuerzo<br>que no te tumba<br>la tarde.', tam: 112, voz: 'Turkey. Llena sin pesar.' }) },
  { n: '6-tuna-melt', html: foto({ foto: `${REPO}/docs/marketing/anuncios/fotos/foto-tuna-melt.jpg`, titular: 'Antojo de<br>algo caliente.', tam: 150, voz: 'Tuna Melt. El cheddar se estira al primer mordisco.' }) },
  { n: '7-italian-hoagie', html: foto({ foto: `${REPO}/docs/marketing/anuncios/fotos/foto-italian-hoagie.jpg`, titular: 'Cuando quieres<br>de todo.', tam: 150, voz: 'Italian Hoagie. Cada capa suma y ninguna sobra.' }) },
  { n: '8-classic-tuna', html: foto({ foto: `${REPO}/docs/marketing/anuncios/fotos/foto-classic-tuna.jpg`, titular: 'Se come con<br>una mano.', tam: 150, voz: 'Classic Tuna. Simple y bien hecho.' }) },
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
  for (const [k, t] of DEST) await sacar(portada(k), 1080, 1920, path.join(OUT, `destacado-${k}.jpg`));
  for (const p of POSTS) {
    const salida = path.join(OUT, `publicacion-${p.n}.jpg`);
    if (p.archivo) fs.copyFileSync(p.archivo, salida); else await sacar(p.html, 1080, 1350, salida);
    p.jpg = salida;
  }

  // ── 4. La maqueta del perfil, como se ve en el celular (Instagram recorta la cuadrícula a 3:4).
  const ui = `body{background:#fff;font-family:Archivo,sans-serif;color:#0B0B0B}
  .t{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px;font:800 19px Archivo}
  .cab{display:flex;align-items:center;gap:22px;padding:8px 16px}
  .av{width:86px;height:86px;border-radius:50%;background-image:url('${img(path.join(OUT, 'foto-de-perfil.jpg'))}');background-size:cover;flex:none}
  .num{display:flex;flex:1;justify-content:space-around;text-align:center;font:700 16px Archivo}.num span{display:block;font:400 13px Archivo;color:#333}
  .bio{padding:4px 16px 0;font:400 14px/1.35 Archivo}.bio b{font-weight:800}.bio .cat{color:#737373}.bio a{color:#00376B;font-weight:600;text-decoration:none}
  .bt{display:flex;gap:6px;padding:12px 16px}.bt div{flex:1;height:32px;border-radius:8px;background:#EFEFEF;display:flex;align-items:center;justify-content:center;font:700 13px Archivo}
  .bt .az{background:#0095F6;color:#fff}
  .hl{display:flex;gap:16px;padding:4px 16px 12px}.h{width:66px;text-align:center;font:400 12px Archivo}
  .h i{display:block;width:66px;height:66px;border-radius:50%;border:1px solid #DBDBDB;padding:3px;margin-bottom:5px}
  .h i b{display:block;width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center}
  .tabs{display:flex;border-top:1px solid #DBDBDB}.tabs div{flex:1;height:44px;display:flex;align-items:center;justify-content:center}.tabs div:first-child{border-bottom:1.5px solid #0B0B0B}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
  .g{position:relative;aspect-ratio:3/4;background-size:cover;background-position:center}
  .g svg{position:absolute;top:7px;right:7px;filter:drop-shadow(0 0 2px rgba(0,0,0,.6))}`;
  const pin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15 3l6 6-3 1-4 4 1 4-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4 1 4-4z"/></svg>';
  const car = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></svg>';
  const rl = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  const cuerpo = `<div style="width:390px">
    <div class="t"><span>snd__wch</span><span style="font-weight:400">≡</span></div>
    <div class="cab"><div class="av"></div><div class="num"><div>9<span>publicaciones</span></div><div>—<span>seguidores</span></div><div>—<span>seguidos</span></div></div></div>
    <div class="bio"><b>SND//WCH · Sándwiches</b><br><span class="cat">Restaurante de sándwiches</span><br>
      Sándwiches de pan largo, al estilo americano.<br>Armados al momento, a domicilio.<br>Abrimos en noviembre.<br><a>sndwch.app</a></div>
    <div class="bt"><div class="az">Seguir</div><div>Mensaje</div><div>WhatsApp</div></div>
    <div class="hl">${DEST.map(([k, t]) => `<div class="h"><i><b style="background-image:url('${img(path.join(OUT, `destacado-${k}.jpg`))}')"></b></i>${t}</div>`).join('')}</div>
    <div class="tabs"><div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" stroke-width="1.8"><rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></div><div>${rl.replace('#fff', '#737373')}</div><div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#737373" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M6 20c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5"/></svg></div></div>
    <div class="grid">${POSTS.map((p) => `<div class="g" style="background-image:url('${img(p.jpg)}')">${p.fijada ? pin : p.carrusel ? car : p.reel ? rl : ''}</div>`).join('')}</div></div>`;
  await pg.setViewportSize({ width: 390, height: 1200 });
  const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, pagina(390, 1200, cuerpo, ui).replace('html,body{width:390px;height:1200px;overflow:hidden}', 'html,body{width:390px}'));
  await pg.goto('file://' + tmp, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
  await pg.setViewportSize({ width: 390, height: await pg.evaluate(() => document.body.scrollHeight) });
  // Al doble de resolución, como se ve en un celular.
  const pg2 = await b.newPage({ viewport: { width: 390, height: await pg.evaluate(() => document.body.scrollHeight) }, deviceScaleFactor: 2 });
  await pg2.goto('file://' + tmp, { waitUntil: 'load' }); await pg2.evaluate(() => document.fonts.ready);
  await pg2.screenshot({ path: path.join(OUT, 'perfil-maqueta.jpg'), type: 'jpeg', quality: 90, fullPage: true });
  fs.rmSync(tmp);
  await b.close();
  console.log(fs.readdirSync(OUT).join('\n'));
})();
