// Feed de la semana del 9 de noviembre de 2026 (preapertura). Primera semana de la agencia hecha en la nube
// (dueño, 2026-11-02: «Sí, pero hoy mismo», a pasar el lunes a la nube y armar ya esta semana).
// El mismo sistema que el perfil aprobado (instagram-perfil/final/final.cjs): foto limpia arriba y, abajo, la franja
// del hermano. El lado de SANDO es el acanalado oliva y el lado de WICHO, el celeste con sus curvas. Nada se monta
// sobre la comida, y todo lo que se dice sale de docs/hechos/CARTA.md.
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/semanas/2026-11-09/feed/feed.cjs
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

// Lámina del lado de SANDO: foto arriba (con su encuadre) y la basta acanalada con el texto.
const sando = ({ f, encuadre = 'center/cover', etiqueta, titulo, frase, t = 104 }) => caja(`background:${S.oliva}`, `
  <div class="full" style="bottom:430px;background:url('${img(`${FOTOS}/${f}`)}') ${encuadre} no-repeat;background-color:#2a2018"></div>
  <div class="abs rib" style="left:0;right:0;bottom:0;height:430px;background-color:${S.oliva}"></div>
  <div class="abs" style="left:84px;right:84px;bottom:52px;height:326px;display:flex;flex-direction:column;color:${papel}">
    <div class="mono" style="font-size:26px;color:${S.tan}">${etiqueta}</div>
    <div class="disp" style="font-size:${t}px;margin-top:12px">${titulo}</div>
    <div class="voz" style="font-size:42px;line-height:1.1;margin-top:10px">${frase}</div>${pie(papel)}</div>`);

// Lámina del lado de WICHO sin foto: una palabra grande sobre su celeste con las curvas de nivel.
const palabra = ({ etiqueta, titulo, frase, sem }) => caja(`background:${W.pelaje}`, `${curvas(1080, 1350, 880, 300, W.curvas, 14, 70, sem)}
  <div class="abs" style="left:84px;right:84px;top:96px;bottom:52px;display:flex;flex-direction:column;color:${W.tinta}">
    <div class="mono" style="font-size:28px">${etiqueta}</div>
    <div class="disp" style="font-size:${titulo.length > 7 ? 230 : 300}px;margin-top:250px">${titulo}</div>
    <div class="voz" style="font-size:58px;line-height:1.1;margin-top:34px;max-width:860px">${frase}</div>${pie(W.tinta)}</div>`);
const wichoFoto = ({ f, encuadre = 'center 36%/cover', etiqueta, titulo, frase }) => caja(`background:${W.pelaje}`, `
  <div class="full" style="bottom:460px;background:url('${img(`${FOTOS}/${f}`)}') ${encuadre} no-repeat;background-color:#2a2018"></div>
  <div class="abs" style="left:0;right:0;bottom:0;height:460px;background:${W.pelaje};overflow:hidden">${curvas(1080, 460, 900, 400, W.curvas, 10, 62, 2)}</div>
  <div class="abs" style="left:84px;right:84px;bottom:52px;height:356px;display:flex;flex-direction:column;color:${W.tinta}">
    <div class="mono" style="font-size:26px">${etiqueta}</div>
    <div class="disp" style="font-size:100px;margin-top:12px">${titulo}</div>
    <div class="voz" style="font-size:40px;line-height:1.1;margin-top:10px">${frase}</div>${pie(W.tinta)}</div>`);

// Los dos atunes, partidos como el logo: Classic Tuna del lado de SANDO y Tuna Melt del lado de WICHO.
// Cada mitad lleva su propio texto en su propio fondo (una línea que cruza los dos colores no se lee).
const mitad = (f, lado) => `<div class="abs" style="top:0;bottom:560px;${lado}:0;width:540px;background:url('${img(`${FOTOS}/${f}`)}') center 50%/auto 112% no-repeat;background-color:#2a2018"></div>`;
const lado = (x, fondo, c, etiqueta, titulo, frase, extra) => `<div class="abs ${x === 0 ? 'rib' : ''}" style="left:${x}px;width:540px;bottom:130px;height:430px;background-color:${fondo};overflow:hidden">${extra}
  <div class="abs" style="left:${x === 0 ? 84 : 56}px;right:${x === 0 ? 40 : 84}px;top:56px;color:${c}">
    <div class="mono" style="font-size:24px">${etiqueta}</div>
    <div class="disp" style="font-size:${titulo.length > 6 ? 96 : 132}px;margin-top:14px">${titulo}</div>
    <div class="voz" style="font-size:38px;line-height:1.12;margin-top:16px">${frase}</div></div></div>`;
const duelo = caja(`background:${S.verde}`, `
  ${mitad('foto-classic-tuna-30.jpg', 'left')}${mitad('foto-tuna-melt-30.jpg', 'right')}
  <div class="abs" style="left:537px;top:0;bottom:130px;width:6px;background:${papel};z-index:2"></div>
  <div class="abs" style="left:50%;top:640px;transform:translate(-50%,-50%);z-index:3;background:${papel};color:${S.verde};border-radius:999px;padding:18px 34px" ><span class="disp" style="font-size:64px">¿Cuál?</span></div>
  ${lado(0, S.oliva, papel, 'CLASSIC TUNA', 'Frío', 'Atún en lascas, mayonesa y pimienta blanca.', '')}
  ${lado(540, W.pelaje, W.tinta, 'TUNA MELT', 'Gratinado', 'El mismo atún, bajo cheddar fundido.', curvas(540, 430, 420, 380, W.curvas, 8, 60, 4))}
  <div class="abs" style="left:84px;right:84px;bottom:17px;height:96px;display:flex;justify-content:space-between;align-items:center;color:${papel}">
    <div style="display:flex;align-items:center;gap:16px">${icoWa(papel, 46)}<span class="mono" style="font-size:28px">PIDE POR WHATSAPP · ${WA_BONITO}</span></div>${sello(96)}</div>`);

const PIEZAS = {
  // Lunes 10: «¿Qué es un Philly?». Dueño, 2026-11-02: «Nadie conoce qué es un Philly, entonces debemos venderlo como
  // sándwich de estilo Filadelfia». Un carrusel que se guarda y se manda: explica el plato capa por capa.
  '1-que-es-un-philly': [
    sando({ f: 'foto-philly-30.jpg', encuadre: 'center 47%/104% auto', etiqueta: 'PREGUNTAS DE TRUJILLO · 1', titulo: '¿Qué es un Philly?', frase: 'El sándwich más famoso de Filadelfia. Desliza y te lo explicamos.' }),
    sando({ f: 'foto-philly.jpg', encuadre: 'center 58%/150% auto', etiqueta: 'EL PHILLY · 1 DE 3', titulo: 'La res', frase: 'Laminada fina y salteada en el momento. Nada de carne molida.' }),
    sando({ f: 'foto-philly-30.jpg', encuadre: '30% 52%/190% auto', etiqueta: 'EL PHILLY · 2 DE 3', titulo: 'Cebolla y pimiento', frase: 'Se saltean junto con la res, en la misma plancha.' }),
    sando({ f: 'foto-philly.jpg', encuadre: '62% 30%/210% auto', etiqueta: 'EL PHILLY · 3 DE 3', titulo: 'Cheddar fundido', frase: 'Se funde encima hasta amarrarlo todo. Tan jugoso que no lleva salsa.' }),
  ],
  // Miércoles 12: «¿Frío o gratinado?». Una pregunta que se contesta en los comentarios, con dos de la carta.
  '2-frio-o-gratinado': [duelo],
  // Viernes 14: «Cómo se dice». Las palabras de la carta que en Trujillo nadie usa todavía (aprendizaje del Redactor,
  // 2026-11-02: «revisar lo mismo con Hoagie y Tuna Melt»).
  '3-como-se-dice': [
    wichoFoto({ f: 'foto-arma-capas.jpg', etiqueta: 'CÓMO SE DICE', titulo: 'Sub, hoagie, melt', frase: 'Las palabras de la carta, en simple. Desliza.' }),
    palabra({ etiqueta: 'CÓMO SE DICE · 1 DE 4', titulo: 'Sub', frase: 'El sándwich de pan largo, al estilo americano. De 15 o de 30 cm.', sem: 1 }),
    palabra({ etiqueta: 'CÓMO SE DICE · 2 DE 4', titulo: 'Hoagie', frase: 'Así le dicen al sub en Filadelfia. El nuestro va con tres embutidos italianos.', sem: 2 }),
    palabra({ etiqueta: 'CÓMO SE DICE · 3 DE 4', titulo: 'Melt', frase: 'Cuando el queso va fundido encima. El Tuna Melt lleva cheddar que se estira.', sem: 3 }),
    palabra({ etiqueta: 'CÓMO SE DICE · 4 DE 4', titulo: 'Arma el tuyo', frase: 'Cuando el que decide eres tú: el pan, la proteína y lo de encima.', sem: 4 }),
  ],
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(OUT, '.tmp.html');
  for (const [n, laminas] of Object.entries(PIEZAS)) for (const [i, html] of laminas.entries()) {
    fs.writeFileSync(tmp, pagina(html));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const faltan = await pg.evaluate(() => ['Anton', 'Archivo', 'IBM Plex Mono', 'Instrument Serif'].filter((f) => ![...document.fonts].some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded')));
    if (faltan.length) throw new Error('faltan fuentes: ' + faltan);
    const png = path.join(OUT, `${n}-${i + 1}.png`), jpg = png.replace(/\.png$/, '.jpg');
    await pg.screenshot({ path: png, type: 'png' });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=95,subsampling=0)", png, jpg]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close();
  console.log('listo', OUT);
})();
