#!/usr/bin/env node
// Vuelve a generar docs/maquetas/aprobadas/*.png desde sus fuentes HTML, panel por panel.
//
// Las maquetas aprobadas NO son referencia: son cómo debe quedar la pantalla, exactamente
// (dueño, 2026-09-24). Por eso se guardan la fuente y su render, y el render sale de la
// fuente — renderizar de nuevo da la misma imagen píxel por píxel (verificado contra las
// capturas originales de M2, M15 y M22: diferencia 0).
//
// Correr con: node scripts/render-maquetas.mjs
// Las cinco sin fuente (01, 23, 32, 33, 35) se recortaron de capturas; su fuente se perdió
// antes de que existiera esta carpeta. Ver docs/maquetas/README.md.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FUENTES = join(RAIZ, 'docs/maquetas/fuentes');
const SALIDA = join(RAIZ, 'docs/maquetas/aprobadas');

// [archivo de salida, fuente, índice del panel .f (desde 0)]
export const MAPA = [
  ['06-pedido-enviado', 'p2.html', 2],
  ['06A-pedido-enviado-la-losa', 'y1.html', 0],
  ['06B-pedido-enviado-la-ventana', 'y1.html', 1],
  ['29-tus-puntos', 'v1.html', 0],
  ['29-estado-a-entra', 'w1.html', 0],
  ['29-estado-b-el-llega', 'w1.html', 1],
  ['29-estado-c-sellada', 'w1.html', 2],
  ['30G-el-carrito', 'h1.html', 0],
  ['30G2-el-carrito-con-la-franja', 'y1.html', 2],
  ['31-pago-con-tarjeta', 'y1.html', 3],
  ['34-donde-te-lo-dejamos', 'i1.html', 1],
  ['bebidas-lado-wicho', 'i1.html', 2],
  ['bebidas-lado-sando', 'w2.html', 5],
  ['entrar', 'w2.html', 1],
  ['tus-pedidos-los-sellos', 'v2.html', 1],
  ['pedido-grupal', 'k1.html', 0],
  ['tarjeta-de-regalo', 'k1.html', 3],
  ['plan-semanal', 'j1.html', 3],
  ['ficha-version-wicho', 'l1.html', 0],
  ['menu-secreto-estructura', 'n2.html', 0],
  ['menu-secreto-fondo', 't2.html', 2],
  ['tu-cuenta', 'l1.html', 2],
  ['estado-vacio', 'l1.html', 3],
  ['detalle-de-un-pedido', 'u2.html', 0],
  ['tu-pedido-fijo', 'u2.html', 1],
  ['lo-legal', 'u2.html', 2],
  ['mundo-wicho-M22', 'm14.html', 1],
  ['mundo-wicho-M22-con-puente', 'm22-con-puente.html', 1],
  ['mundo-sando-M15', 'm8.html', 0],
  ['la-puerta-M2', 'm.html', 1],
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
  let actual = '';
  for (const [nombre, fuente, i] of MAPA) {
    if (fuente !== actual) { await p.goto('file://' + join(FUENTES, fuente)); await p.waitForTimeout(400); actual = fuente; }
    await p.locator('.f').nth(i).screenshot({ path: join(SALIDA, nombre + '.png') });
    console.log('✓', nombre, '←', fuente, '#' + (i + 1));
  }
  await b.close();
}
