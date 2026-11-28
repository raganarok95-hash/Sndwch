// Láminas del carrusel «arma tu Italian Hoagie» (referente @102.panaderia que mandó Ezra el 2026-11-28).
//   python3 docs/marketing/carrusel-hoagie/armar.py
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node docs/marketing/carrusel-hoagie/laminas.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const D = __dirname;
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const P = { papel: '#EFE6D4', tinta: '#1E2B22', oro: '#CBA258', celeste: '#8CC8EC' };
const barras = (h) => `<span style="display:inline-flex;gap:.16em;margin:0 .1em"><i style="display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;background:${P.oro}"></i><i style="display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;background:${P.celeste}"></i></span>`;
const marca = (c) => `<div style="font:800 34px Archivo;display:flex;align-items:center;color:${c}">SND${barras()}WCH</div>`;
const L = [
  ['l0', 'portada'],
  ['l1', 'Jamón ahumado'], ['l2', 'Salame'], ['l3', 'Pepperoni'], ['l4', 'Queso americano'],
  ['l5', 'Lechuga'], ['l6', 'Tomate'], ['l7', '<span style="font-size:62px">Cebolla morada, pimiento verde<br>y oil &amp; vinegar</span>'],
  ['capas/9-cerrado', 'final'],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(D, '.tmp.html');
  for (let i = 0; i < L.length; i++) {
    const [img, txt] = L[i];
    const foto = path.join(D, img + '.png');
    let cuerpo;
    if (txt === 'portada') cuerpo = `<div class="top" style="top:150px"><div class="k">Desliza y arma tu</div><div class="h" style="font-size:118px">Italian Hoagie</div><div class="k" style="margin-top:14px">capa por capa &rarr;</div></div>`;
    else if (txt === 'final') cuerpo = `<div class="top" style="top:160px"><div class="h" style="font-size:96px">Listo para pedir</div></div><div class="bot"><div class="p">PÍDELO EN PEDIDOSYA</div><div class="k" style="margin-top:16px">Búscanos como SND//WCH</div></div>`;
    else cuerpo = `<div class="top"><div class="n">${i} / 7</div><div class="h">${txt}</div></div>`;
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}*{margin:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden}body{background:url('file://${foto}') center/cover;color:${P.tinta}}
.top{position:absolute;left:90px;right:90px;top:175px;text-align:center}.h{font:400 84px/.95 Anton;text-transform:uppercase}
.n{font:600 26px 'IBM Plex Mono';letter-spacing:.1em;margin-bottom:14px;opacity:.75}.k{font:italic 400 48px/1.1 'Instrument Serif'}
.bot{position:absolute;left:0;right:0;bottom:290px;text-align:center}.m{position:absolute;left:0;right:0;bottom:62px;display:flex;justify-content:center}
.p{display:inline-block;background:${P.oro};color:${P.tinta};font:600 34px 'IBM Plex Mono';letter-spacing:.08em;padding:18px 28px;border-radius:10px}</style></head>
<body>${cuerpo}<div class="m">${marca(P.papel)}</div></body></html>`);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const png = path.join(D, `lamina-${i + 1}.png`);
    await pg.screenshot({ path: png });
    execFileSync('python3', ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=92)", png, png.replace(/\.png$/, '.jpg')]);
    fs.rmSync(png);
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('listo');
})();
