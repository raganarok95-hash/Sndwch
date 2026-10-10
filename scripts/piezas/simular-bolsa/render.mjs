// SND//WCH — simulación 3D de la bolsa cerrada (2026-10-10). Dueño: «el sticker de la bolsa,
// simúlalo en bolsa, tal vez allí veas el error de diseño». La maqueta plana suponía que la boca
// se dobla siempre igual; en 3D, con lo que de verdad va adentro, se ve dónde cae el sticker.
//
// Uso:
//   npm install --no-save three@0.170.0
//   python3 scripts/piezas/simular-bolsa/texturas.py . <tex>      (lee los sellos y el sticker)
//   node scripts/piezas/simular-bolsa/render.mjs <tex> salida.png "inicio=240" [salida2.png "…"]
// Parámetros (mm): inicio = altura donde la boca empieza a aplastarse (lo que va adentro, o la
// regla de cierre); dobleces (2); abre = grados que se levanta la solapa; pie = dónde termina el
// sello de abajo; cam / mira / fov / w / h = la cámara. PLAYWRIGHT_CHROMIUM_PATH si hace falta.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../../..');
const [TEX, ...resto] = process.argv.slice(2);
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const trabajos = [];
for (let i = 0; i < resto.length; i += 2) trabajos.push([resto[i], resto[i + 1] || '']);
const b = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const [salida, query] of trabajos) {
  const u = new URLSearchParams(query);
  const p = await b.newPage({ viewport: { width: +(u.get('w') || 1100), height: +(u.get('h') || 1300) } });
  p.on('pageerror', (e) => console.log('[error]', e.message));
  await p.route('http://sim.local/**', (ruta) => {
    const ruta_ = new URL(ruta.request().url()).pathname;
    const archivo = ruta_.startsWith('/node_modules/') ? resolve(RAIZ, ruta_.slice(1))
      : ruta_.startsWith('/tex/') ? resolve(TEX, ruta_.slice(5)) : resolve(AQUI, ruta_.slice(1));
    ruta.fulfill({ body: readFileSync(archivo), contentType: tipos[extname(archivo)] || 'application/octet-stream' });
  });
  await p.goto('http://sim.local/escena.html?' + query);
  await p.waitForFunction(() => window.LISTO === true, null, { timeout: 120000 });
  console.log(salida, JSON.stringify(await p.evaluate(() => window.MEDIDAS)));
  await p.locator('canvas').screenshot({ path: salida });
  await p.close();
}
await b.close();
