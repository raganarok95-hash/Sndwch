// SND//WCH — piezas/maqueta: un HTML de maqueta a PNG, con las fuentes de la marca (2026-10-16).
//
// Para el Director de arte (Puerta 1) y cualquiera que bocete una pieza: abre el HTML desde un
// archivo (con `setContent` no cargan las fotos ni las fuentes locales), espera las fuentes que
// la marca usa y FALLA si alguna no cargó: una maqueta con la letra de respaldo engaña al que la
// aprueba. El tamaño sale de <body> (o de los argumentos).
//
// Uso: FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) \
//        node scripts/piezas/maqueta.mjs <entrada.html> <salida.png|salida.pdf> [ancho] [alto]
//      (en la nube: PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium)
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const [entrada, salida, ancho = '1080', alto = '1350'] = process.argv.slice(2);
if (!entrada || !salida) throw new Error('Uso: node scripts/piezas/maqueta.mjs <entrada.html> <salida.png> [ancho] [alto]');
const fuentes = process.env.FUENTES_CSS ? `<style>${readFileSync(process.env.FUENTES_CSS, 'utf8')}</style>` : '';
// Junto al HTML, para que sus rutas relativas (la foto) sigan valiendo.
const tmp = join(dirname(resolve(entrada)), `.maqueta-${process.pid}.html`);
const html = readFileSync(entrada, 'utf8');
writeFileSync(tmp, html.includes('</head>') ? html.replace('</head>', `${fuentes}</head>`) : fuentes + html);
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
try {
  const page = await browser.newPage({ viewport: { width: Number(ancho), height: Number(alto) } });
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  const faltan = await page.evaluate(async () => {
    const usadas = ['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'];
    await Promise.all(usadas.map((f) => document.fonts.load(f)));
    // Solo cuentan las familias que la maqueta de verdad usa.
    const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join(' ')
      + [...document.querySelectorAll('[style]')].map((e) => e.getAttribute('style')).join(' ');
    // `document.fonts.check` da verdadero si la fuente ni siquiera está declarada: se exige una
    // FontFace de esa familia realmente cargada.
    const cargada = (fam) => [...document.fonts].some((x) => x.family.replace(/["']/g, '') === fam && x.status === 'loaded');
    return usadas.filter((f) => css.includes(f.split('"')[1]) && !cargada(f.split('"')[1]));
  });
  if (faltan.length) throw new Error(`Faltan fuentes (${faltan.join(', ')}): corre scripts/piezas/fuentes-locales.sh y pasa FUENTES_CSS.`);
  // Una salida .pdf imprime todas las páginas del HTML (una presentación: cada lámina con su
  // salto de página); cualquier otra, la captura de la primera pantalla.
  if (salida.endsWith('.pdf')) await page.pdf({ path: salida, width: `${ancho}px`, height: `${alto}px`, printBackground: true });
  else await page.screenshot({ path: salida, fullPage: false });
  console.log(salida);
} finally {
  await browser.close();
  rmSync(tmp, { force: true });
}
