const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const R = '/home/claude/sndwch/docs/marketing/piezas/2026-11-anuncio-directo/';
const css = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const marca = `<div class="marca">SND<span class="b"><i class="g"></i><i class="c"></i></span>WCH</div>`;
function pieza(d, W, H) {
  const v = H > 1500;
  const blk = v ? 900 : 600, pt = v ? 290 : 110, mt = v ? 290-60 : 70, st = v ? 560 : 300;
  return `<html><head><style>${css}
  *{margin:0;box-sizing:border-box} body{width:${W}px;height:${H}px;background:${d.fondo};overflow:hidden;position:relative}
  .top{position:absolute;top:0;left:0;right:0;height:${blk}px;padding:${pt}px 80px 0}
  h1{font-family:Anton;font-size:${d.fs||(v?150:140)}px;line-height:.95;color:${d.tinta};max-width:${v?900:700}px}
  p{font-family:'Instrument Serif';font-style:italic;font-size:44px;color:${d.tinta};margin-top:28px;max-width:${v?620:640}px;line-height:1.15}
  .marca{position:absolute;top:${mt}px;right:80px;font-family:Anton;font-size:46px;color:${d.tinta};display:flex;align-items:center}
  .b{display:inline-flex;gap:.16em;margin:0 .06em} .b i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px}
  .g{background:#CBA258}.c{background:#8CC8EC}
  .sello{position:absolute;top:${st}px;right:80px;width:250px;height:250px;border-radius:50%;background:${d.tinta};color:${d.fondo};display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg)}
  .sello small{font-family:'IBM Plex Mono';font-size:26px;letter-spacing:4px} .sello b{font-family:Anton;font-size:72px;font-weight:400}
  .foto{position:absolute;left:0;right:0;top:${blk}px;bottom:0;background:url(file://${R}fotos/${d.foto}) center/cover}
  </style></head><body><div class="foto"></div><div class="top">${marca}<h1>${d.titular}</h1><p>${d.linea}</p></div>
  <div class="sello"><small>DESDE</small><b>S/${d.precio}</b></div></body></html>`;
}
(async () => {
  const b = await chromium.launch(); const out = R + 'final/'; fs.mkdirSync(out, { recursive: true });
  const precio = process.env.PRECIO;
  const piezas = [
    ['philly', { fondo:'#EFE6D4', tinta:'#1E2B22', titular:'FILADELFIA,<br>A DOMICILIO.', linea:'Res laminada y salteada, cebolla, pimiento y cheddar. En sndwch.app.', foto:'ad-philly-manos.png' }],
    ['meatball', { fondo:'#1E2B22', tinta:'#EFE6D4', titular:'PRIMERA MORDIDA.<br>SILENCIO.', fs:108, linea:'Albóndigas en su marinara, queso americano encima. En sndwch.app.', foto:'ad-meatball-mordida.png' }],
    ['oficina', { fondo:'#EFE6D4', tinta:'#1E2B22', titular:'UN ENLACE.<br>CADA UNO<br>EL SUYO.', fs:108, linea:'Mandas el enlace al grupo y cada quien elige desde su celular. En sndwch.app.', foto:'ad-turkey-oficina.png' }],
  ];
  for (const [n, d] of piezas) for (const [W, H, suf] of [[1080,1350,'feed'],[1080,1920,'vertical']]) {
    const pg = await b.newPage({ viewport: { width: W, height: H } });
    const h = path.join('/tmp/claude-0/-home-claude-sndwch/2cb72d94-74b1-52cc-bea1-28aebedea5ef/scratchpad/anuncio', `${n}-${suf}.html`);
    fs.writeFileSync(h, pieza({ ...d, precio }, W, H)); await pg.goto('file://' + h, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: `${out}${n}-${suf}.jpg`, type: 'jpeg', quality: 90 }); await pg.close();
  }
  await b.close();
})();
