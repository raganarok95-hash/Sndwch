const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const path = require('path');
const DIR = __dirname;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, recordVideo: { dir: path.join(DIR, 'video'), size: { width: 390, height: 844 } } });
  const p = await ctx.newPage();
  const errores = []; p.on('pageerror', (e) => errores.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await p.goto('file://' + path.join(DIR, 'armador-espiral.html')); await p.evaluate(() => document.fonts.ready);
  const espera = (ms) => p.waitForTimeout(ms);
  const foto = async (n) => { await espera(2200); await p.screenshot({ path: path.join(DIR, `ae-${n}.png`) }); };
  await foto('1-tamano');
  await p.evaluate(() => window.__elegir('15')); await foto('2-pan');
  await p.evaluate(() => window.__elegir('B01')); await foto('3-proteina');
  await p.evaluate(() => window.__elegir('P09')); await foto('4-queso');
  await p.evaluate(() => window.__elegir('C02')); await foto('5-vegetales');
  for (const id of ['T10', 'T06', 'T09']) { await p.evaluate((i) => window.__elegir(i), id); await espera(700); }
  await foto('5b-vegetales-elegidos');
  await p.click('#cta'); await foto('6-salsas');
  await p.evaluate(() => window.__elegir('S09')); await espera(700); await foto('6b-salsa-elegida');
  await p.click('#cta'); await espera(800); await foto('7-listo');
  await p.click('#mProt'); await foto('7b-listo-doble');
  console.log('errores:', JSON.stringify(errores));
  await ctx.close(); await b.close();
})();
