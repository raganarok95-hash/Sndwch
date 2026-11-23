// SND//WCH — la carta para PedidosYa (2026-11-12).
//
// PedidosYa pidió «una carta clara con todos los productos y precios». Este script la arma desde la
// carta única (`_shared/carta.ts`) y el recargo de apps (`_shared/reglas.ts`: web + 10%, decisión
// del dueño 2026-10-09), así que ningún precio ni ingrediente se escribe a mano. Antes de usarla,
// comparar con la base (manda `catalog_items`/`catalog_prices`, ver docs/hechos/CARTA.md).
//
// Uso: node --no-warnings scripts/carta-pedidosya.mjs  → docs/apps/pedidosya/carta.html y .csv
//      node scripts/carta-pedidosya.mjs --pdf <carpeta> → además carta.pdf y carta.png ahí
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CARTA, PORCION_PROTEINA_G, signaturesDeLaCarta } from '../supabase/functions/_shared/carta.ts';
import { RECARGO_APPS } from '../supabase/functions/_shared/reglas.ts';
import { REGLAS } from '../supabase/functions/_shared/dinero.ts';

// PAUSADOS (Ezra, 2026-11-17: «Por las primeras semanas quitemos de disponibilidad las albóndigas»).
// Se sacan por id; cuando vuelvan, se borra de esta lista.
const PAUSADOS = ['SIG02'];
// COMBOS (2026-11-17): PedidosYa pide 15 productos como mínimo. Cada Signature de 15CM con una bebida a
// elección, con el mismo descuento por par de la web (REGLAS.comboPorPar). --sin-combos los quita.

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(RAIZ, 'docs/apps/pedidosya');
mkdirSync(OUT, { recursive: true });

const app = (n) => Math.round(n * (1 + RECARGO_APPS) * 100) / 100;
// Propuesta de precio fijo para PedidosYa (comisión del 30% + S/50 al mes, 2026-11-12), mientras el
// dueño no la apruebe: --precios <15CM>,<30CM> y --bebidas <D06>,<D07>,<D08> pisan el web + 10%.
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1].split(',').map(Number) : null; };
// PRECIO APROBADO (Ezra, 2026-11-12, tarde: «quisiera algo alrededor de 20 soles»; eligió 20.90/32.90): PedidosYa cobra 30% por pedido más
// S/50 al mes, así que su carta deja de seguir el web + 10% y va con precio fijo.
const PEDIDOSYA = { precios: [20.9, 32.9], bebidas: [6.9, 5.9, 6.9] };
const FIJO = arg('--precios') ?? PEDIDOSYA.precios, BEB = arg('--bebidas') ?? PEDIDOSYA.bebidas;
const sol = (n) => `S/ ${n.toFixed(2)}`;
const por = (xs) => Object.fromEntries(xs.map((x) => [x.id, x]));
const P = por(CARTA.proteinas), V = por(CARTA.vegetales), S = por(CARTA.salsas), Q = por(CARTA.quesos), B = por(CARTA.panes);
const min = (s) => s.toLowerCase();

/** Lo que lleva, en orden de armado, sacado de la receta (nunca escrito a mano). */
function lleva(s) {
  const p = P[s.prot];
  const partes = [`${min(p.nombre)} ${min(p.sabor)}`];
  for (const v of s.vegetales) partes.push(`${min(V[v].nombre)} ${min(V[v].sabor)}`);
  if (s.queso) partes.push(`queso ${min(Q[s.queso].nombre)}`);
  for (const x of s.salsas) partes.push(min(S[x].nombre));
  return partes;
}

const sigs = signaturesDeLaCarta().filter((s) => !PAUSADOS.includes(s.id)).map((s) => ({
  nombre: s.nombre.toUpperCase(),
  pan: `${B[s.pan].nombre} // ${B[s.pan].sabor}`,
  lleva: lleva(s),
  frase: s.pitch.split(/(?<=\.)\s/)[0],
  p15: FIJO ? FIJO[0] : app(s.p15),
  p30: FIJO ? FIJO[1] : app(s.p30),
}));
const bebidas = CARTA.bebidas.map((b) => ({ nombre: `${b.nombre} // ${b.sabor}`.toUpperCase(), desc: b.desc.split(/(?<=\.)\s/)[0], precio: BEB ? BEB[CARTA.bebidas.indexOf(b)] : app(b.precio) }));
// LAS DOS BEBIDAS QUE FALTABAN (Ezra, 2026-11-17: «incluye por favor en bebidas las dos que faltan»).
// Todavía no están en carta.ts ni en la base: vienen de las latas (docs/BEBIDAS_PRODUCTO.md §18 y
// /mnt/project-files/latas/). En botella de 500 ml, su costo es ESTIMADO a partir de lo que deja cada lata
// (§13): LEMON TEA ~S/2.50 y THE CHAI ~S/2.95, contra S/1.17–1.89 de las otras. El precio sigue el de las
// demás bebidas en PedidosYa; THE CHAI va S/1 arriba porque cuesta más. Al cargarlas en carta.ts, se borran de acá.
const BEBIDAS_NUEVAS = [
  { nombre: 'LEMON TEA', desc: 'Té negro helado con limón: el té manda y el limón lo refresca.', precio: 6.9 },
  { nombre: 'THE CHAI', desc: 'Chai especiado y aromático, bien helado.', precio: 7.9 },
];
const bebMaxCombo = Math.max(...bebidas.map((b) => b.precio)); // el combo se calcula con las tres de siempre
bebidas.push(...BEBIDAS_NUEVAS);
const CON_COMBOS = !process.argv.includes('--sin-combos');
const combos = CON_COMBOS ? sigs.map((s) => ({ nombre: `COMBO ${s.nombre}`, precio: Math.round((s.p15 + bebMaxCombo - REGLAS.comboPorPar) * 100) / 100 })) : [];
const panes = [...new Set(sigs.map((s) => s.pan))];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const marca = (t) => esc(t).replace(/\s?\/\/\s?/g, '<b class="sl">//</b>');

let n = 0;
const n0 = sigs.length * 2 + combos.length + bebidas.length;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>SND//WCH · Carta</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600&family=Archivo:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--verde:#1E3932;--oro:#CBA258;--crema:#F2F0EB;--celeste:#8CC8EC}
html,body{background:var(--crema)}
.hoja{width:210mm;height:296mm;overflow:hidden;padding:9mm 14mm 8mm;color:var(--verde);font-family:Archivo,sans-serif;display:flex;flex-direction:column}
header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--verde);padding-bottom:3mm}
.logo{font-family:Anton,sans-serif;font-size:38px;letter-spacing:.02em;line-height:1;display:flex;align-items:center}
.wm-mark{display:inline-flex;gap:.16em;margin:0 .12em;align-items:center}
.wm-mark i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px}
.wm-mark i:first-child{background:var(--oro)}.wm-mark i:last-child{background:var(--celeste)}
.cab{font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:right;line-height:1.5;text-transform:uppercase;letter-spacing:.06em}
h2{font-family:Anton,sans-serif;font-size:22px;letter-spacing:.04em;margin:2.5mm 0 .5mm;display:flex;justify-content:space-between;align-items:baseline}
h2 .tam{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;display:flex;gap:0}
h2 .tam span{text-align:right}
.nota{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.04em;text-transform:uppercase;opacity:.75;margin-bottom:1mm}
.item{display:flex;justify-content:space-between;gap:6mm;padding:1.3mm 0;border-bottom:1px solid rgba(30,57,50,.18)}
.item:last-child{border-bottom:0}
.nom{font-family:Anton,sans-serif;font-size:17px;letter-spacing:.03em;line-height:1.1}
.sl{color:var(--oro);font-weight:400;margin:0 .15em}
.fr{font-size:10.5px;line-height:1.3;margin-top:.5mm}
.ll{font-size:9px;line-height:1.3;margin-top:.5mm;opacity:.8}
.pr{flex-shrink:0;white-space:nowrap;font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600}
.fila{display:flex;gap:3mm;align-items:flex-start}
.n{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;background:var(--verde);color:var(--crema);border-radius:999px;min-width:5.5mm;height:5.5mm;display:inline-flex;align-items:center;justify-content:center;margin-top:.8mm;flex-shrink:0}
.chico{font-size:15px}
.grid{display:grid;grid-template-columns:1fr 1fr;column-gap:8mm}
.grid .item{border-bottom:1px solid rgba(30,57,50,.18)}
footer{margin-top:auto;border-top:2px solid var(--verde);padding-top:3mm;font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.5;display:flex;justify-content:space-between;gap:8mm}
</style></head><body><div class="hoja">
<header><div class="logo">SND<span class="wm-mark"><i></i><i></i></span>WCH</div>
<div class="cab">Carta · Trujillo<br>${n0} productos · precios en soles</div></header>
<h2>SIGNATURES 15CM <span class="tam"><span></span><span>${PORCION_PROTEINA_G.p15} G DE PROTEÍNA</span></span></h2>
<p class="nota">Todos en pan ${esc(panes.join(' · '))}</p>
${sigs.map((s) => `<div class="item"><div class="fila"><i class="n">${++n}</i><div><div class="nom">${esc(s.nombre)} 15CM</div><p class="fr">${esc(s.frase)}</p><p class="ll">Lleva: ${esc(s.lleva.join(' · '))}.</p></div></div>
<div class="pr">${sol(s.p15)}</div></div>`).join('\n')}
<h2>SIGNATURES 30CM <span class="tam"><span></span><span>${PORCION_PROTEINA_G.p30} G DE PROTEÍNA · EL MISMO ARMADO</span></span></h2>
<div class="grid">${sigs.map((s) => `<div class="item"><div class="fila"><i class="n">${++n}</i><div class="nom chico">${esc(s.nombre)} 30CM</div></div><div class="pr">${sol(s.p30)}</div></div>`).join('\n')}</div>
${combos.length ? `<h2>COMBOS <span class="tam"><span></span><span>15CM + BEBIDA</span></span></h2>
<p class="nota">Un Signature de 15CM y la bebida de 500 ml que quieras · ahorras desde S/ ${REGLAS.comboPorPar.toFixed(2)}</p>
<div class="grid">${combos.map((c) => `<div class="item"><div class="fila"><i class="n">${++n}</i><div class="nom chico">${esc(c.nombre)}</div></div><div class="pr">${sol(c.precio)}</div></div>`).join('\n')}</div>` : ''}
<h2>BEBIDAS <span class="tam"><span></span><span>500 ML</span></span></h2>
<div class="grid">${bebidas.map((b) => `<div class="item"><div class="fila"><i class="n">${++n}</i><div><div class="nom chico">${marca(b.nombre)}</div><p class="ll">${esc(b.desc)}</p></div></div>
<div class="pr">${sol(b.precio)}</div></div>`).join('\n')}</div>
<footer><span>Delivery en Trujillo.</span><span>@snd__wch · sndwch.app</span></footer>
</div></body></html>`;
writeFileSync(join(OUT, 'carta.html'), html);

const csv = [['categoria', 'producto', 'descripcion', 'precio'].join(';')];
for (const s of sigs) for (const [t, p] of [['15CM', s.p15], ['30CM', s.p30]])
  csv.push(['Signatures', `${s.nombre} ${t}`, `${t} · ${t === '15CM' ? PORCION_PROTEINA_G.p15 : PORCION_PROTEINA_G.p30} g de proteína. ${s.frase} Lleva: ${s.lleva.join(', ')}.`, p.toFixed(2)].join(';'));
for (const c of combos) csv.push(['Combos', c.nombre, `${c.nombre.replace('COMBO ', '')} de 15CM y una bebida de 500 ml a elección (${bebidas.map((b) => b.nombre).join(', ')}).`, c.precio.toFixed(2)].join(';'));
for (const b of bebidas) csv.push(['Bebidas', `${b.nombre} 500 ML`, b.desc, b.precio.toFixed(2)].join(';'));
writeFileSync(join(OUT, 'carta.csv'), '﻿' + csv.join('\n') + '\n');

const i = process.argv.indexOf('--pdf');
if (i > 0) {
  const dest = process.argv[i + 1];
  const { chromium } = createRequire(import.meta.url)('playwright');
  const br = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  const pg = await br.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await pg.goto('file://' + join(OUT, 'carta.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: join(dest, 'carta.pdf'), format: 'A4', printBackground: true });
  await pg.screenshot({ path: join(dest, 'carta.png'), fullPage: true });
  await br.close();
}
console.log(`carta lista: ${n0} productos (${sigs.length} Signatures x2, ${combos.length} combos, ${bebidas.length} bebidas) (${FIJO ? `precio fijo ${FIJO.join(' / ')}` : `precio de app = web + ${Math.round(RECARGO_APPS * 100)}%`})`);
