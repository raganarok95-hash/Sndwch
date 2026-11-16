// Semana del 23 de noviembre de 2026: que vuelvan (docs/marketing/APERTURA.md, semana 3). Maquetas con un
// recuadro donde va la imagen nueva: las imágenes se generan en Figma solo con el sí del dueño.
// Formato: el del anuncio directo aprobado (dueño, 2026-11-09), con el bloque de papel arriba y la imagen abajo.
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/semanas/2026-11-23/maquetas.cjs
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
if (!GRUPO || !isFinite(P30)) throw new Error('faltan cifras de CARTA.md o REGLAS.md');
const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92}.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}.abs{position:absolute}
.marca{font:800 40px Archivo;display:flex;align-items:center}.marca .b{display:inline-flex;gap:.16em;margin:0 .1em}
.marca i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px}.g{background:${P.oro}}.c{background:${P.celeste}}
.hueco{position:absolute;left:0;right:0;bottom:0;background:repeating-linear-gradient(45deg,#c9c3b6 0 18px,#d6d0c3 18px 36px);display:flex;align-items:center;justify-content:center;padding:60px}
.hueco div{background:rgba(239,230,212,.94);border:3px dashed ${P.tinta};padding:28px 32px;font:600 24px/1.4 'IBM Plex Mono',monospace;color:${P.tinta};max-width:820px}`;
const marca = (c) => `<div class="marca" style="color:${c}">SND<span class="b"><i class="g"></i><i class="c"></i></span>WCH</div>`;
const hueco = (alto, texto) => `<div class="hueco" style="height:${alto}px"><div>IMAGEN NUEVA (Figma, espera tu sí)<br><br>${texto}</div></div>`;
const sello = (fondo, c, arriba = 'DESDE', cifra = `S/${PRECIO}`, top = 250) => `<div class="abs" style="right:70px;top:${top}px;width:200px;height:200px;border-radius:999px;background:${fondo};color:${c};display:flex;flex-direction:column;align-items:center;justify-content:center"><span class="mono" style="font-size:22px">${arriba}</span><span class="disp" style="font-size:56px;margin-top:6px">${cifra}</span></div>`;
const caja = (fondo, dentro) => `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:${fondo}">${dentro}</div>`;

const PIEZAS = {
  // Mar 24, 12:00 · El almuerzo de la oficina (pedido grupal). La mesa vista desde arriba con las manos de todos: el
  // feed todavía no tiene gente ni grupo. Una herramienta por pieza, con su ?src= propio.
  '1-la-oficina': caja(P.verde, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between;align-items:flex-start">
      <div class="mono" style="font-size:26px;color:${P.tan}">PEDIDO EN GRUPO</div>${marca(P.papel)}</div>
    <div class="abs disp" style="left:70px;top:130px;font-size:150px;color:${P.papel}">Junta a ${GRUPO}.<br><span style="color:${P.oro}">Uno va<br>por la casa.</span></div>
    <div class="abs voz" style="left:70px;top:560px;width:900px;font-size:38px;line-height:1.12;color:${P.papel}">Organizas el almuerzo de la oficina en sndwch.app y, desde ${GRUPO} sándwiches, el 15CM más barato va gratis.</div>
    ${hueco(660, `Cenital de una mesa de oficina a la hora del almuerzo: ${GRUPO} sándwiches de 15 cm en su papel kraft abierto, ${GRUPO} manos distintas tomando cada uno, vasos y una libreta al borde. Uno de los sándwiches lleva una notita amarilla que dice «el mío». Sin caras.`)}`),
  // Jue 26, 12:30 · El 30CM. Un solo sándwich largo, cortado al medio en la tabla, y dos manos que se llevan cada mitad:
  // se ve el tamaño sin regla (la regla ya salió en «Cómo se dice»). El sello sale del 30CM más barato de la carta.
  '2-el-30cm': caja(P.papel, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between">
      <div class="mono" style="font-size:26px;color:${P.tinta}">30CM</div>${marca(P.tinta)}</div>
    <div class="abs disp" style="left:70px;top:120px;font-size:150px;color:${P.tinta}">El mismo,<br>el doble<br>de largo.</div>
    <div class="abs voz" style="left:70px;top:590px;width:640px;font-size:38px;line-height:1.12;color:${P.tinta}">Para uno con hambre o para partirlo entre dos.</div>
    ${sello(P.tinta, P.papel, 'DESDE', `S/${P30}`, 330)}
    ${hueco(620, 'Un PHILLY CHEESESTEAK de 30 cm, fiel a la receta (pan Classic, res laminada, cebolla salteada, pimiento verde y cheddar), recién cortado al medio sobre una tabla larga de madera, de costado, a la altura de la mesa. Dos manos, una de cada lado, se llevan cada mitad. Luz de día.')}`),
  // Sáb 28, 11:00 · Invita a alguien (referidos). Dos objetos con su etiqueta: la bebida para el invitado y el 15CM para ti.
  // Los puntos se nombran por lo que valen, como dice la app; las cifras salen de REGLAS.md.
  '3-invita': caja(P.tan, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between">
      <div class="mono" style="font-size:26px;color:${P.tinta}">INVITA A ALGUIEN</div>${marca(P.tinta)}</div>
    <div class="abs disp" style="left:70px;top:120px;font-size:150px;color:${P.tinta}">Uno invita.<br>Comen<br>los dos.</div>
    <div class="abs voz" style="left:70px;top:590px;width:900px;font-size:38px;line-height:1.12;color:${P.tinta}">Tu invitado gana lo que cuesta una bebida; tú, lo que cuesta un 15CM. Tu enlace está en la app.</div>
    <div class="abs mono" style="left:70px;top:700px;font-size:20px;color:${P.tinta}">EN PUNTOS · ${REGLAS.match(/El invitado recibe \*\*(\d+) puntos/)[1]} Y ${REGLAS.match(/quien invita \*\*(\d+)\*\*/)[1]} · CONDICIONES EN LA APP</div>
    ${hueco(600, 'Sobre una mesa clara, dos cosas una al lado de la otra con una etiqueta de papel colgada de un cordel: a la izquierda una botella de 500 ml (sin marca), etiqueta «para quien invitas»; a la derecha un sándwich de 15 cm en su kraft, etiqueta «para ti». Las etiquetas se montan después, en blanco en la imagen.')}`),
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(D, '.tmp.html');
  for (const [n, html] of Object.entries(PIEZAS)) {
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:1080px;height:1350px;overflow:hidden}${BASE}</style></head><body>${html}</body></html>`);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const png = path.join(D, `maqueta-${n}.png`);
    await pg.screenshot({ path: png });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=92)", png, png.replace(/\.png$/, '.jpg')]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('listo');
})();
