// Semana del 9 de noviembre, v2: la ejecución nueva (dueño, 2026-11-02: «están algo simples, no la idea, la ejecución»;
// «Primero 3 de prueba»). Una imagen nueva por pieza, generada en Figma (archivo 4zwn5ARvWwuiK5x9yHOaeQ), y ninguna foto del feed.
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

// 1 · ¿Qué es un Philly?: el despiece, rotulado como un plano técnico. Los rótulos salen de la receta (CARTA.md).
const rotulo = (y, lado, texto) => {
  const x0 = lado === 'izq' ? 70 : 1010, linea = lado === 'izq' ? `left:300px;width:${y < 400 ? 70 : 60}px` : `right:300px;width:60px`;
  return `<div class="abs mono" style="top:${y - 16}px;${lado === 'izq' ? 'left:70px;text-align:left' : 'right:70px;text-align:right'};width:220px;font-size:22px;line-height:1.25;color:${papel}">${texto}</div>
  <div class="abs" style="top:${y}px;${lado === 'izq' ? 'left:296px' : 'right:296px'};width:70px;height:2px;background:${S.tan}"></div>
  <div class="abs" style="top:${y - 5}px;${lado === 'izq' ? 'left:362px' : 'right:362px'};width:12px;height:12px;border-radius:99px;background:${S.tan}"></div>`;
};
const philly = caja(`background:#1d120b`, `
  <div class="full" style="bottom:430px;background:url('${img(`${NUEVAS}/v2-philly-despiece.png`)}') center -210px/1080px auto no-repeat"></div>
  ${rotulo(330, 'izq', 'CHEDDAR<br>FUNDIDO')}
  ${rotulo(470, 'der', 'RES LAMINADA<br>FINA')}
  ${rotulo(625, 'izq', 'CEBOLLA Y<br>PIMIENTO')}
  ${rotulo(805, 'der', 'PAN CLASSIC<br>DE 15 CM')}
  <div class="abs rib" style="left:0;right:0;bottom:0;height:430px;background-color:${S.oliva}"></div>
  <div class="abs" style="left:84px;right:84px;bottom:52px;height:326px;display:flex;flex-direction:column;color:${papel}">
    <div class="mono" style="font-size:26px;color:${S.tan}">PREGUNTAS DE TRUJILLO · 1</div>
    <div class="disp" style="font-size:104px;margin-top:12px">¿Qué es un Philly?</div>
    <div class="voz" style="font-size:42px;line-height:1.1;margin-top:10px">El sándwich más famoso de Filadelfia, capa por capa.</div>${pie(papel)}</div>`);

// 2 · ¿Frío o gratinado?: una sola mesa, dos luces. La foto ya trae el corte de luz al centro.
const atunes = caja(`background:${S.verde}`, `
  <div class="full" style="bottom:430px;background:url('${img(`${NUEVAS}/v2-atunes-dos-luces.png`)}') center 42%/1080px auto no-repeat"></div>
  <div class="abs mono" style="left:40px;top:40px;font-size:24px;background:rgba(24,48,36,.86);color:${papel};padding:10px 16px">CLASSIC TUNA · MEDIODÍA</div>
  <div class="abs mono" style="right:40px;top:40px;font-size:24px;background:rgba(30,47,58,.86);color:${papel};padding:10px 16px">TUNA MELT · NOCHE</div>
  <div class="abs rib" style="left:0;width:540px;bottom:130px;height:300px;background-color:${S.oliva}"></div>
  <div class="abs" style="right:0;width:540px;bottom:130px;height:300px;background:${W.pelaje};overflow:hidden">${curvas(540, 300, 420, 300, W.curvas, 7, 56, 4)}</div>
  <div class="abs disp" style="left:84px;bottom:290px;font-size:128px;color:${papel}">Frío</div>
  <div class="abs voz" style="left:84px;bottom:180px;width:400px;font-size:36px;line-height:1.1;color:${papel}">Atún en lascas, mayonesa y pimienta blanca.</div>
  <div class="abs disp" style="left:600px;bottom:290px;font-size:112px;color:${W.tinta}">Gratinado</div>
  <div class="abs voz" style="left:600px;bottom:180px;width:400px;font-size:36px;line-height:1.1;color:${W.tinta}">El mismo atún, bajo cheddar fundido.</div>
  <div class="abs" style="left:84px;right:84px;bottom:17px;height:96px;display:flex;justify-content:space-between;align-items:center;color:${papel}">
    <div style="display:flex;align-items:center;gap:16px">${icoWa(papel, 46)}<span class="mono" style="font-size:28px">PIDE POR WHATSAPP · ${WA_BONITO}</span></div>${sello(96)}</div>`);

// 3 · Cómo se dice: SUB, la palabra gigante y el objeto que la explica, sobre el celeste de WICHO (como las portadas
// de los destacados). El pan va recortado y entero, sin teñirse: la sombra la pone el CSS.
const sub = caja(`background:${W.pelaje}`, `${curvas(1080, 1350, 880, 300, W.curvas, 14, 70, 1)}
  <div class="abs" style="left:84px;right:84px;top:96px;bottom:52px;display:flex;flex-direction:column;color:${W.tinta}">
    <div class="mono" style="font-size:28px">CÓMO SE DICE · 1 DE 4</div>
    <div class="disp" style="font-size:330px;margin-top:40px">Sub</div>
    <img src="${img(`${NUEVAS}/v2-sub-regla-recorte.png`)}" style="width:1000px;margin:30px 0 0 -44px;transform:rotate(-4deg);filter:drop-shadow(0 26px 22px rgba(30,47,58,.35))">
    <div class="voz" style="font-size:58px;line-height:1.1;margin-top:40px;max-width:880px">El sándwich de pan largo, al estilo americano. De 15 o de 30 cm.</div>${pie(W.tinta)}</div>`);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(OUT, '.tmp.html');
  for (const [n, html] of [['maqueta-1-que-es-un-philly', philly], ['maqueta-2-frio-o-gratinado', atunes], ['maqueta-3-como-se-dice-sub', sub]]) {
    fs.writeFileSync(tmp, pagina(html));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const png = path.join(OUT, `${n}.png`), jpg = png.replace(/\.png$/, '.jpg');
    await pg.screenshot({ path: png, type: 'png' });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=95,subsampling=0)", png, jpg]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('listo', OUT);
})();
