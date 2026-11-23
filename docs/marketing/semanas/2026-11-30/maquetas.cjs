// Semana del 30 de noviembre de 2026: diciembre en la oficina (docs/marketing/APERTURA.md, semana 4). Maquetas con un
// recuadro donde va la imagen nueva: las imágenes se generan en Figma solo con el sí del dueño.
// Formato: el del anuncio directo aprobado (dueño, 2026-11-09), con el bloque de papel arriba y la imagen abajo.
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/semanas/2026-11-30/maquetas.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const D = __dirname, REPO = path.resolve(D, '../../../..');
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const P = { papel: '#EFE6D4', tinta: '#1E2B22', verde: '#183024', oro: '#CBA258', celeste: '#8CC8EC', tan: '#C9A87C' };
// El precio sale de la carta generada desde la base, nunca escrito a mano.
const PRECIO = (fs.readFileSync(`${REPO}/docs/hechos/CARTA.md`, 'utf8').match(/15CM S\/([0-9.]+)/) || [])[1];
if (!PRECIO) throw new Error('no encontré el precio del 15CM en docs/hechos/CARTA.md');
const CARTA = fs.readFileSync(`${REPO}/docs/hechos/CARTA.md`, 'utf8');
// El 30CM más barato de los Signatures; y las cifras de grupo y referidos, de REGLAS.md (nunca a mano).
const P30 = Math.min(...[...CARTA.matchAll(/30CM S\/([0-9]+\.[0-9]+)/g)].map((m) => +m[1])).toFixed(2);
const REGLAS = fs.readFileSync(`${REPO}/docs/hechos/REGLAS.md`, 'utf8');
const GRUPO = (REGLAS.match(/desde \*\*(\d+) s/) || [])[1];
const COMBO = (REGLAS.match(/Combo: −S\/(\d+)/) || [])[1];
if (!GRUPO || !COMBO || !isFinite(P30)) throw new Error('faltan cifras de CARTA.md o REGLAS.md');
const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92}.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}.abs{position:absolute}
.marca{font:800 40px Archivo;display:flex;align-items:center}.marca .b{display:inline-flex;gap:.16em;margin:0 .1em}
.marca i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px}.g{background:${P.oro}}.c{background:${P.celeste}}
.hueco{position:absolute;left:0;right:0;bottom:0;background:repeating-linear-gradient(45deg,#c9c3b6 0 18px,#d6d0c3 18px 36px);display:flex;align-items:center;justify-content:center;padding:60px}
.hueco div{background:rgba(239,230,212,.94);border:3px dashed ${P.tinta};padding:28px 32px;font:600 24px/1.4 'IBM Plex Mono',monospace;color:${P.tinta};max-width:820px}`;
const marca = (c) => `<div class="marca" style="color:${c}">SND<span class="b"><i class="g"></i><i class="c"></i></span>WCH</div>`;
// Con FINAL=1 el recuadro se reemplaza por la imagen nueva aprobada (cuando Ezra dé el sí), en el orden de PIEZAS.
const FINAL = !!process.env.FINAL, FOTOS = ['s30-hora.png', 's30-fin-de-año.png', 's30-el-par.png'];
let iFoto = 0;
const hueco = (alto, texto) => FINAL ? `<div class="abs" style="left:0;right:0;bottom:0;height:${alto}px;background:url('file://${D}/fotos/${FOTOS[iFoto++]}') center/cover"></div>` : huecoMaqueta(alto, texto);
const huecoMaqueta = (alto, texto) => `<div class="hueco" style="height:${alto}px"><div>IMAGEN NUEVA (Figma, espera tu sí)<br><br>${texto}</div></div>`;
const sello = (fondo, c, arriba = 'DESDE', cifra = `S/${PRECIO}`, top = 250) => `<div class="abs" style="right:70px;top:${top}px;width:200px;height:200px;border-radius:999px;background:${fondo};color:${c};display:flex;flex-direction:column;align-items:center;justify-content:center"><span class="mono" style="font-size:22px">${arriba}</span><span class="disp" style="font-size:56px;margin-top:6px">${cifra}</span></div>`;
const caja = (fondo, dentro) => `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:${fondo}">${dentro}</div>`;

const PIEZAS = {
  // Mar 1 dic, 12:00 · El pedido programado: el almuerzo llega a la hora que eliges. El feed no tiene todavía ni un reloj
  // ni la hora como protagonista.
  '1-la-hora': caja(P.papel, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between">
      <div class="mono" style="font-size:26px;color:${P.tinta}">PEDIDO PROGRAMADO</div>${marca(P.tinta)}</div>
    <div class="abs disp" style="left:70px;top:120px;font-size:150px;color:${P.tinta}">Pídelo a las 11.<br><span style="color:#6C7860">Llega a la 1.</span></div>
    <div class="abs voz" style="left:70px;top:450px;width:900px;font-size:38px;line-height:1.12;color:${P.tinta}">Al pedir en sndwch.app eliges la hora, y tu almuerzo llega cuando tú dices.</div>
    ${hueco(760, 'Un reloj de pared redondo, sencillo y sin marca, marcando la 1:00, en la pared clara de una oficina con luz de mediodía. Debajo, en el borde de un escritorio, una bolsa kraft lisa recién llegada (el sticker oficial se monta después). Sin personas, sin texto.')}`),
  // Jue 3 dic, 12:30 · El almuerzo de fin de año de la oficina (pedido en grupo, ahora con fecha). De frente y a la altura
  // de la mesa larga, no cenital: la semana del 23 ya usó la mesa vista desde arriba.
  '2-fin-de-año': caja(P.verde, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between;align-items:flex-start">
      <div class="mono" style="font-size:26px;color:${P.tan}">DICIEMBRE · PEDIDO EN GRUPO</div>${marca(P.papel)}</div>
    <div class="abs disp" style="left:70px;top:120px;font-size:140px;color:${P.papel}">Fin de año<br>en la oficina.<br><span style="color:${P.oro}">Nadie cocina.</span></div>
    <div class="abs voz" style="left:70px;top:560px;width:900px;font-size:38px;line-height:1.12;color:${P.papel}">Uno organiza en sndwch.app, cada uno elige el suyo y, desde ${GRUPO} sándwiches, el 15CM más barato va gratis.</div>
    ${hueco(660, 'Mesa larga de oficina vista de frente, a la altura de la mesa, con luz de mediodía: sándwiches de 15 cm de la carta cortados al medio sobre tablas de madera, vasos, servilletas y una guirnalda sencilla de papel kraft colgada al fondo. Personas desenfocadas al fondo, sin caras reconocibles. Nada navideño de marca.')}`),
  // Sáb 5 dic, 11:00 · El combo: cada par sándwich + bebida, S/${COMBO} menos. Las tres bebidas de la carta juntas por
  // primera vez en el feed.
  '3-el-par': caja('#6C7860', `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between">
      <div class="mono" style="font-size:26px;color:${P.tan}">SÁNDWICH + BEBIDA</div>${marca(P.papel)}</div>
    <div class="abs disp" style="left:70px;top:120px;font-size:150px;color:${P.papel}">El par sale<br>S/${COMBO} menos.</div>
    <div class="abs voz" style="left:70px;top:450px;width:900px;font-size:38px;line-height:1.12;color:${P.papel}">Cada sándwich con su bebida te ahorra S/${COMBO}. Hay tres, bien heladas: hibisco, té en frío y menta.</div>
    ${hueco(760, 'Las tres bebidas de la carta en botellas lisas de 500 ml, en fila y con gotas de frío: rojo rubí (THE BLOOM, hibisco), ámbar (COLD BREW, té negro) y verde muy claro (THE COOL, hierba luisa y menta). Delante, un PHILLY CHEESESTEAK de 15 cm en su kraft. Luz de día. Sin marcas ni texto.')}`),
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(D, '.tmp.html');
  for (const [n, html] of Object.entries(PIEZAS)) {
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:1080px;height:1350px;overflow:hidden}${BASE}</style></head><body>${html}</body></html>`);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const png = path.join(D, FINAL ? `final-${n}.png` : `maqueta-${n}.png`);
    await pg.screenshot({ path: png });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=92)", png, png.replace(/\.png$/, '.jpg')]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('listo');
})();
