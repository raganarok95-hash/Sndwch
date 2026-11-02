// Renderiza cada texto (o SVG) en blanco sobre transparente, girado -90° (se lee de abajo hacia arriba).
// Uso: node texto.cjs items.json carpeta
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [items, dir] = [JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), process.argv[3]];
const F = fs.readFileSync(process.env.FUENTES_CSS, 'utf8'); // FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh)
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 3000, height: 3000 } });
  for (const it of items) {
    const giro = it.giro === false ? '' : 'transform:rotate(-90deg);';
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${F}
      html,body{margin:0;background:transparent;width:3000px;height:3000px;overflow:hidden}
      #t{position:absolute;left:1500px;top:1500px;transform-origin:0 0;${giro}white-space:nowrap;color:#fff;line-height:1;${it.css || ''}}</style></head>
      <body><div id="t">${it.html}</div></body></html>`;
    fs.writeFileSync(path.join(dir, '.t.html'), html);
    await pg.goto('file://' + path.join(dir, '.t.html'));
    await pg.evaluate(async () => { await document.fonts.ready; });
    await pg.screenshot({ path: path.join(dir, `${it.id}.png`), omitBackground: true });
  }
  await b.close();
})();
