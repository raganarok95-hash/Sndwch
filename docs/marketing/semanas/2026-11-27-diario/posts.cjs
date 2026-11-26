// Posts diarios del 27-nov al 2-dic (Ezra, 2026-11-26: «3 que publique a diario, potencia todo para pedidos ya»).
// Un sándwich por día, foto nueva a sangre (Figma), sin precio (el de PedidosYa no es el de la app), y una sola
// acción: pedirlo en PedidosYa. Las frases salen de «Cómo se vende» en docs/hechos/CARTA.md.
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/semanas/2026-11-27-diario/posts.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const D = __dirname;
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const P = { papel: '#EFE6D4', tinta: '#1E2B22', oro: '#CBA258', celeste: '#8CC8EC', tan: '#C9A87C' };
const POSTS = [
  ['1-philly', 'Philly<br>Cheesesteak', 'La res se saltea en el momento.'],
  ['2-tunamelt', 'Tuna<br>Melt', 'Cheddar que se estira al primer mordisco.'],
  ['3-turkey', 'Turkey', 'El almuerzo que no te tumba la tarde.'],
  ['4-hoagie', 'Italian<br>Hoagie', 'Cada capa suma. Ninguna sobra.'],
  ['5-classictuna', 'Classic<br>Tuna', 'Atún en lascas gruesas. Nunca hecho pasta.'],
  ['6-philly30', 'Uno<br>para dos', 'El Philly en 30CM, partido al medio.'],
];
const marca = `<div style="font:800 40px Archivo;display:flex;align-items:center;color:${P.papel};text-shadow:0 2px 14px #0009">SND<span style="display:inline-flex;gap:.16em;margin:0 .1em"><i style="display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;background:${P.oro}"></i><i style="display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;background:${P.celeste}"></i></span>WCH</div>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(D, '.tmp.html');
  for (const [n, titulo, linea] of POSTS) {
    const foto = path.join(D, 'fotos', n + '.png');
    if (!fs.existsSync(foto)) { console.log('falta', foto); continue; }
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}*{margin:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden}body{background:url('file://${foto}') center/cover}
.g{position:absolute;left:0;right:0;bottom:0;height:640px;background:linear-gradient(#0d141000,#0d1410b0 45%,#0d1410e6)}
.m{position:absolute;right:64px;top:56px}.t{position:absolute;left:70px;right:70px;bottom:70px;color:${P.papel}}
.h{font:400 132px/.92 Anton;text-transform:uppercase}.l{font:italic 400 46px/1.12 'Instrument Serif';margin-top:20px}
.p{display:inline-block;margin-top:30px;background:${P.oro};color:${P.tinta};font:600 28px 'IBM Plex Mono';letter-spacing:.08em;padding:14px 22px;border-radius:8px}</style></head>
<body><div class="g"></div><div class="m">${marca}</div><div class="t"><div class="h">${titulo}</div><div class="l">${linea}</div><div class="p">PÍDELO EN PEDIDOSYA</div></div></body></html>`);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const png = path.join(D, `post-${n}.png`);
    await pg.screenshot({ path: png });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=92)", png, png.replace(/\.png$/, '.jpg')]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('listo');
})();
