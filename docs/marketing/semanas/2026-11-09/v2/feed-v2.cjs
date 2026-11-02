// Semana del 9 de noviembre, v2: la ejecución nueva (dueño, 2026-11-02: «están algo simples, no la idea, la ejecución»;
// «Primero 3 de prueba» y, tras verlas, «ya todo aprobado»). Todas las imágenes son nuevas, generadas en Figma (archivo
// 4zwn5ARvWwuiK5x9yHOaeQ); ninguna foto del feed.
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/semanas/2026-11-09/v2/feed-v2.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const D = __dirname, REPO = path.resolve(D, '../../../../..');
const OUT = process.env.SALIDA ? path.resolve(process.env.SALIDA) : D; fs.mkdirSync(OUT, { recursive: true });
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const FOTOS = `${REPO}/docs/marketing/anuncios/fotos`;
const img = (p) => 'file://' + path.resolve(p);
const S = { oliva: '#6C7860', verde: '#183024', tan: '#C9A87C', forro: '#D8823C' };
const W = { pelaje: '#90CCF0', curvas: '#7DB6DA', lila: '#C3A6D2', tinta: '#1E2F3A' };
const papel = '#EFE6D4';
const LOGO = img(`${REPO}/img/marca/avatar-1024-transparente.png`);
const WA = (fs.readFileSync(`${REPO}/src/app/01-catalogo-y-estado.ts`, 'utf8').match(/var WA='(\d+)'/) || [])[1];
if (!WA) throw new Error('no encontré el número de WhatsApp en 01-catalogo-y-estado.ts');
const WA_BONITO = WA.replace(/^51/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');

const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;text-wrap:balance}
.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}
.rib{background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 7px,rgba(255,255,255,.045) 7px 14px)}
.abs{position:absolute}.full{position:absolute;inset:0}`;
const pagina = (cuerpo) => `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:1080px;height:1350px;overflow:hidden}${BASE}</style></head><body>${cuerpo}</body></html>`;
const caja = (estilo, dentro) => `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;${estilo}">${dentro}</div>`;
function curvas(w, h, cx, cy, color, n = 10, paso = 62, sem = 1) {
  let s = '';
  for (let k = 1; k <= n; k++) {
    const p = [];
    for (let i = 0; i <= 180; i++) { const t = (i / 180) * 2 * Math.PI; const r = k * paso * (1 + 0.09 * Math.sin(3 * t + k * 0.35 + sem) + 0.05 * Math.sin(5 * t + 1.7 * sem) + 0.03 * Math.sin(2 * t - k * 0.2)); p.push(`${(cx + r * Math.cos(t) * 1.15).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
    s += `<polygon points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
  }
  return `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}">${s}</svg>`;
}
const icoWa = (c, t) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M9 8.6c.3-.6.8-.6 1.1 0l.6 1.4c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.4.6c.6.3.6.8 0 1.1-.8.6-1.8.8-2.8.4a8.4 8.4 0 0 1-4.3-4.3c-.4-1-.2-2 .6-2.6z"/></svg>`;
const sello = (t) => `<div style="width:${t}px;height:${t}px;border-radius:999px;background:${papel};display:flex;align-items:center;justify-content:center;flex:none"><img src="${LOGO}" style="width:${t * 0.92}px;height:${t * 0.92}px"></div>`;
const pie = (c) => `<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
  <div style="display:flex;align-items:center;gap:16px">${icoWa(c, 46)}<span class="mono" style="font-size:28px">PIDE POR WHATSAPP · ${WA_BONITO}</span></div>${sello(96)}</div>`;

const NUEVAS = `${D}/fotos`;
const foto = (f) => img(`${NUEVAS}/${f}`);
const banda = (etiqueta, titulo, frase, t = 104) => `
  <div class="abs rib" style="left:0;right:0;bottom:0;height:430px;background-color:${S.oliva}"></div>
  <div class="abs" style="left:84px;right:84px;bottom:52px;height:326px;display:flex;flex-direction:column;color:${papel}">
    <div class="mono" style="font-size:26px;color:${S.tan}">${etiqueta}</div>
    <div class="disp" style="font-size:${t}px;margin-top:12px">${titulo}</div>
    <div class="voz" style="font-size:42px;line-height:1.1;margin-top:10px">${frase}</div>${pie(papel)}</div>`;

// ── 1 · ¿Qué es un Philly? ──────────────────────────────────────────────────────────────────────────────
// Portada: el despiece de costado (el pan largo se ve largo), con la leyenda arriba y un número junto a cada capa,
// fuera de la comida. Después, tres acercamientos del proceso en la plancha. Todo sale de CARTA.md.
const capas = [[460, 'Cheddar fundido'], [576, 'Res laminada fina'], [724, 'Cebolla y pimiento'], [871, 'Pan Classic de 15 cm']];
const num = (k, c = S.verde) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:99px;background:${S.tan};color:${c};font:600 24px 'IBM Plex Mono',monospace;flex:none">${k}</span>`;
const philly1 = caja(`background:#1d120b`, `
  <div class="full" style="bottom:430px;background:url('${foto('v2-philly-despiece-costado.png')}') center -120px/1080px auto no-repeat"></div>
  <div class="abs" style="left:70px;right:70px;top:46px;display:grid;grid-template-columns:1fr 1fr;gap:14px 30px">
    ${capas.map(([, t], i) => `<div style="display:flex;align-items:center;gap:14px">${num(i + 1)}<span class="mono" style="font-size:24px;color:${papel}">${t.toUpperCase()}</span></div>`).join('')}</div>
  ${capas.map(([y], i) => `<div class="abs" style="right:22px;top:${y - 22}px">${num(i + 1)}</div>`).join('')}
  ${banda('PREGUNTAS DE TRUJILLO · 1', '¿Qué es un Philly?', 'El sándwich más famoso de Filadelfia, capa por capa.')}`);
const proceso = (f, k, titulo, frase) => caja(`background:#1d120b`, `
  <div class="full" style="bottom:430px;background:url('${foto(f)}') center 45%/cover no-repeat"></div>
  ${banda(`EL PHILLY · ${k} DE 3`, titulo, frase)}`);
const PHILLY = [
  philly1,
  proceso('v2-res-plancha.png', 1, 'La res', 'Laminada fina y salteada en el momento. Nada de carne molida.'),
  proceso('v2-cebolla-pimiento.png', 2, 'Cebolla y pimiento', 'Se saltean en la misma plancha, junto con la res.'),
  proceso('v2-cheddar-fundido.png', 3, 'Cheddar fundido', 'Se funde encima hasta amarrarlo todo. Tan jugoso que no lleva salsa.'),
];

// ── 2 · ¿Frío o gratinado? ──────────────────────────────────────────────────────────────────────────────
const ATUNES = [caja(`background:${S.verde}`, `
  <div class="full" style="bottom:430px;background:url('${foto('v2-atunes-dos-luces.png')}') center 42%/1080px auto no-repeat"></div>
  <div class="abs mono" style="left:40px;top:40px;font-size:24px;background:rgba(24,48,36,.86);color:${papel};padding:10px 16px">CLASSIC TUNA · MEDIODÍA</div>
  <div class="abs mono" style="right:40px;top:40px;font-size:24px;background:rgba(30,47,58,.86);color:${papel};padding:10px 16px">TUNA MELT · NOCHE</div>
  <div class="abs rib" style="left:0;width:540px;bottom:130px;height:300px;background-color:${S.oliva}"></div>
  <div class="abs" style="right:0;width:540px;bottom:130px;height:300px;background:${W.pelaje};overflow:hidden">${curvas(540, 300, 420, 300, W.curvas, 7, 56, 4)}</div>
  <div class="abs disp" style="left:84px;bottom:290px;font-size:128px;color:${papel}">Frío</div>
  <div class="abs voz" style="left:84px;bottom:180px;width:400px;font-size:36px;line-height:1.1;color:${papel}">Atún en lascas, mayonesa y pimienta blanca.</div>
  <div class="abs disp" style="left:600px;bottom:290px;font-size:112px;color:${W.tinta}">Gratinado</div>
  <div class="abs voz" style="left:600px;bottom:180px;width:400px;font-size:36px;line-height:1.1;color:${W.tinta}">El mismo atún, bajo cheddar fundido.</div>
  <div class="abs" style="left:84px;right:84px;bottom:17px;height:96px;display:flex;justify-content:space-between;align-items:center;color:${papel}">
    <div style="display:flex;align-items:center;gap:16px">${icoWa(papel, 46)}<span class="mono" style="font-size:28px">PIDE POR WHATSAPP · ${WA_BONITO}</span></div>${sello(96)}</div>`)];

// ── 3 · Cómo se dice ────────────────────────────────────────────────────────────────────────────────────
// La palabra gigante y el objeto que la explica, sobre el celeste de WICHO. Los objetos van recortados y sin teñir; los
// cuencos van en su tarjeta blanca (son blancos y no se pueden recortar del fondo sin comerse el borde).
const palabraObjeto = (k, titulo, objeto, frase, sem, t = 330) => caja(`background:${W.pelaje}`, `${curvas(1080, 1350, 880, 300, W.curvas, 14, 70, sem)}
  <div class="abs" style="left:84px;right:84px;top:96px;bottom:52px;display:flex;flex-direction:column;color:${W.tinta}">
    <div class="mono" style="font-size:28px">CÓMO SE DICE · ${k} DE 4</div>
    <div class="disp" style="font-size:${t}px;margin-top:40px">${titulo}</div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center">${objeto}</div>
    <div class="voz" style="font-size:54px;line-height:1.1;max-width:880px;margin-bottom:34px">${frase}</div>${pie(W.tinta)}</div>`);
const sombra = 'filter:drop-shadow(0 26px 22px rgba(30,47,58,.35))';
const portadaDice = caja(`background:${W.pelaje}`, `${curvas(1080, 1350, 880, 300, W.curvas, 14, 70, 5)}
  <div class="abs" style="left:84px;right:84px;top:96px;bottom:52px;display:flex;flex-direction:column;color:${W.tinta}">
    <div class="mono" style="font-size:28px">CÓMO SE DICE</div>
    <div class="disp" style="font-size:250px;line-height:.9;margin-top:60px">Sub<br>Hoagie<br>Melt</div>
    <div class="voz" style="font-size:58px;line-height:1.1;margin-top:40px;max-width:860px">Las palabras de nuestra carta, en simple. Desliza.</div>${pie(W.tinta)}</div>`);
const DICE = [
  portadaDice,
  palabraObjeto(1, 'Sub', `<img src="${foto('v2-sub-regla-recorte.png')}" style="width:1000px;transform:rotate(-4deg);${sombra}">`, 'El sándwich de pan largo, al estilo americano. De 15 o de 30 cm.', 1),
  palabraObjeto(2, 'Hoagie', `<img src="${foto('v2-embutidos-recorte.png')}" style="width:860px;${sombra}">`, 'Así le dicen al sub en Filadelfia. El nuestro va con tres embutidos italianos.', 2, 280),
  palabraObjeto(3, 'Melt', `<img src="${foto('v2-melt-estira-recorte.png')}" style="width:900px;${sombra}">`, 'Cuando el queso va fundido encima. El del Tuna Melt se estira.', 3),
  palabraObjeto(4, 'Arma el tuyo', `<div style="background:#fff;border-radius:20px;padding:10px;${sombra}"><img src="${foto('v2-cuencos.png')}" style="width:760px;display:block;border-radius:12px"></div>`, 'Cuando el que decide eres tú: el pan, la proteína y lo de encima.', 4, 170),
];

const PIEZAS = { '1-que-es-un-philly': PHILLY, '2-frio-o-gratinado': ATUNES, '3-como-se-dice': DICE };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(OUT, '.tmp.html'), dir = path.join(OUT, 'final'); fs.mkdirSync(dir, { recursive: true });
  for (const [n, laminas] of Object.entries(PIEZAS)) for (const [i, html] of laminas.entries()) {
    fs.writeFileSync(tmp, pagina(html));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const faltan = await pg.evaluate(() => ['Anton', 'Archivo', 'IBM Plex Mono', 'Instrument Serif'].filter((f) => ![...document.fonts].some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded')));
    if (faltan.length) throw new Error('faltan fuentes: ' + faltan);
    const png = path.join(dir, `${n}-${i + 1}.png`), jpg = png.replace(/\.png$/, '.jpg');
    await pg.screenshot({ path: png, type: 'png' });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=95,subsampling=0)", png, jpg]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('listo', dir);
})();
