// Semana del 16 de noviembre de 2026: la cuenta y el día (docs/marketing/APERTURA.md, semana 2). Maquetas con un
// recuadro donde va la imagen nueva: las imágenes se generan en Figma solo con el sí del dueño.
// Formato: el del anuncio directo aprobado (dueño, 2026-11-09), con el bloque de papel arriba y la imagen abajo.
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/semanas/2026-11-16/maquetas.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const D = __dirname, REPO = path.resolve(D, '../../../..');
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const P = { papel: '#EFE6D4', tinta: '#1E2B22', verde: '#183024', oro: '#CBA258', celeste: '#8CC8EC', tan: '#C9A87C' };
// El precio sale de la carta generada desde la base, nunca escrito a mano.
const PRECIO = (fs.readFileSync(`${REPO}/docs/hechos/CARTA.md`, 'utf8').match(/15CM S\/([0-9.]+)/) || [])[1];
if (!PRECIO) throw new Error('no encontré el precio del 15CM en docs/hechos/CARTA.md');
const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92}.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}.abs{position:absolute}
.marca{font:800 40px Archivo;display:flex;align-items:center}.marca .b{display:inline-flex;gap:.16em;margin:0 .1em}
.marca i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px}.g{background:${P.oro}}.c{background:${P.celeste}}
.hueco{position:absolute;left:0;right:0;bottom:0;background:repeating-linear-gradient(45deg,#c9c3b6 0 18px,#d6d0c3 18px 36px);display:flex;align-items:center;justify-content:center;padding:60px}
.hueco div{background:rgba(239,230,212,.94);border:3px dashed ${P.tinta};padding:28px 32px;font:600 24px/1.4 'IBM Plex Mono',monospace;color:${P.tinta};max-width:820px}`;
const marca = (c) => `<div class="marca" style="color:${c}">SND<span class="b"><i class="g"></i><i class="c"></i></span>WCH</div>`;
const hueco = (alto, texto) => `<div class="hueco" style="height:${alto}px"><div>IMAGEN NUEVA (Figma, espera tu sí)<br><br>${texto}</div></div>`;
const sello = (fondo, c) => `<div class="abs" style="right:70px;top:250px;width:200px;height:200px;border-radius:999px;background:${fondo};color:${c};display:flex;flex-direction:column;align-items:center;justify-content:center"><span class="mono" style="font-size:22px">DESDE</span><span class="disp" style="font-size:56px;margin-top:6px">S/${PRECIO}</span></div>`;
const caja = (fondo, dentro) => `<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:${fondo}">${dentro}</div>`;

const PIEZAS = {
  // Mar 17, 12:30 · «Faltan 3 días»: la carta en una sola imagen nueva, para guardar. El 3 gigante es la cuenta; la fila
  // de los seis, la decisión del viernes. Los nombres van debajo, fuera de la comida.
  '1-faltan-3-dias': caja(P.verde, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between;align-items:flex-start">
      <div class="mono" style="font-size:26px;color:${P.tan}">VIERNES 20 DE NOVIEMBRE · 11:00</div>${marca(P.papel)}</div>
    <div class="abs disp" style="left:62px;top:96px;font-size:420px;color:${P.oro}">3</div>
    <div class="abs disp" style="left:330px;top:150px;font-size:118px;color:${P.papel}">Faltan<br>3 días.</div>
    <div class="abs voz" style="left:330px;top:400px;width:660px;font-size:40px;line-height:1.12;color:${P.papel}">Mira la carta ahora y el viernes llegas decidido.</div>
    ${hueco(700, 'Cenital de los seis Signatures de 15 cm en fila sobre una tira larga de papel kraft, cada uno fiel a su receta: PHILLY CHEESESTEAK, MEATBALL MARINARA, TURKEY, TUNA MELT, ITALIAN HOAGIE (jamón ahumado, salame y pepperoni) y CLASSIC TUNA. Abajo, en mono, el nombre de cada uno.')}`),
  // Jue 19, 19:30 · «Mañana, 11:00»: cómo pedir en una pieza. El celular muestra la pantalla REAL de la app (se monta
  // encima de la imagen generada, que trae la pantalla en blanco).
  '2-manana-11': caja(P.papel, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between">${'<span></span>'}${marca(P.tinta)}</div>
    <div class="abs disp" style="left:70px;top:110px;font-size:150px;color:${P.tinta}">Mañana,<br>11:00.</div>
    <div class="abs voz" style="left:70px;top:400px;width:900px;font-size:40px;color:${P.tinta}">Todo en sndwch.app, desde el navegador: nada que instalar.</div>
    <div class="abs" style="left:70px;right:70px;top:480px;display:flex;gap:18px">
      ${['ELIGES', 'YAPE O TARJETA', 'TE LLEGA'].map((t, i) => `<div style="flex:1;display:flex;align-items:center;gap:12px"><span class="disp" style="font-size:54px;color:${P.oro}">${i + 1}</span><span class="mono" style="font-size:24px;color:${P.tinta}">${t}</span></div>`).join('')}</div>
    ${hueco(770, 'Cenital de un escritorio a media mañana: una mano sostiene un celular con la pantalla en blanco (ahí se monta la pantalla real de la app), al lado papel kraft y una laptop cerrada. Luz clara de mañana. Sin comida.')}`),
  // Vie 20, 10:30 · «Hoy abrimos»: la publicación del mes, fijada arriba. La primera bolsa saliendo; el sello oficial se
  // monta sobre la bolsa lisa generada (la IA no dibuja el logo). Desde hoy se puede decir «pide» y va el precio.
  '3-hoy-abrimos': caja(P.papel, `
    <div class="abs" style="left:70px;top:60px;right:70px;display:flex;justify-content:space-between">
      <div class="mono" style="font-size:26px;color:${P.tinta}">VIERNES 20 · 11:00</div>${marca(P.tinta)}</div>
    <div class="abs disp" style="left:70px;top:130px;font-size:170px;color:${P.tinta}">Hoy<br>abrimos.</div>
    <div class="abs voz" style="left:70px;top:470px;width:640px;font-size:40px;line-height:1.12;color:${P.tinta}">La plancha se prendió a las 11:00. Tu pedido, en sndwch.app.</div>
    ${sello(P.tinta, P.papel)}
    ${hueco(740, 'Una bolsa kraft lisa con asas planas pasando de una mano a otra en la puerta de la cocina, luz de mañana, la plancha encendida desenfocada al fondo. El logo oficial se monta como etiqueta sobre la bolsa. Manos sin rostro, sin alcohol.')}`),
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
