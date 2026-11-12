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

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(RAIZ, 'docs/apps/pedidosya');
mkdirSync(OUT, { recursive: true });

const app = (n) => Math.round(n * (1 + RECARGO_APPS) * 100) / 100;
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

const sigs = signaturesDeLaCarta().map((s) => ({
  nombre: s.nombre.toUpperCase(),
  pan: `${B[s.pan].nombre} // ${B[s.pan].sabor}`,
  lleva: lleva(s),
  frase: s.pitch.split(/(?<=\.)\s/)[0],
  p15: app(s.p15),
  p30: app(s.p30),
}));
const bebidas = CARTA.bebidas.map((b) => ({ nombre: `${b.nombre} // ${b.sabor}`.toUpperCase(), desc: b.desc.split(/(?<=\.)\s/)[0], precio: app(b.precio) }));
const panes = [...new Set(sigs.map((s) => s.pan))];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const marca = (t) => esc(t).replace(/\s?\/\/\s?/g, '<b class="sl">//</b>');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>SND//WCH · Carta</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;500;600&family=Archivo:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--verde:#1E3932;--oro:#CBA258;--crema:#F2F0EB;--celeste:#8CC8EC}
html,body{background:var(--crema)}
.hoja{width:210mm;height:297mm;padding:13mm 14mm 11mm;color:var(--verde);font-family:Archivo,sans-serif;display:flex;flex-direction:column}
header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid var(--verde);padding-bottom:5mm}
.logo{font-family:Anton,sans-serif;font-size:44px;letter-spacing:.02em;line-height:1;display:flex;align-items:center}
.wm-mark{display:inline-flex;gap:.16em;margin:0 .12em;align-items:center}
.wm-mark i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px}
.wm-mark i:first-child{background:var(--oro)}.wm-mark i:last-child{background:var(--celeste)}
.cab{font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:right;line-height:1.5;text-transform:uppercase;letter-spacing:.06em}
h2{font-family:Anton,sans-serif;font-size:22px;letter-spacing:.04em;margin:6mm 0 1mm;display:flex;justify-content:space-between;align-items:baseline}
h2 .tam{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;display:flex;gap:0}
h2 .tam span{width:24mm;text-align:right}
.nota{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.04em;text-transform:uppercase;opacity:.75;margin-bottom:2mm}
.item{display:flex;justify-content:space-between;gap:6mm;padding:3.1mm 0;border-bottom:1px solid rgba(30,57,50,.18)}
.item:last-child{border-bottom:0}
.nom{font-family:Anton,sans-serif;font-size:19px;letter-spacing:.03em;line-height:1.1}
.sl{color:var(--oro);font-weight:400;margin:0 .15em}
.fr{font-size:11px;line-height:1.35;margin-top:1mm}
.ll{font-size:9.5px;line-height:1.4;margin-top:1mm;opacity:.8}
.pr{display:flex;flex-shrink:0;font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600}
.pr span{width:24mm;text-align:right}
footer{margin-top:auto;border-top:2px solid var(--verde);padding-top:3mm;font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.5;display:flex;justify-content:space-between;gap:8mm}
</style></head><body><div class="hoja">
<header><div class="logo">SND<span class="wm-mark"><i></i><i></i></span>WCH</div>
<div class="cab">Carta · Trujillo<br>Precios en soles</div></header>
<h2>SIGNATURES <span class="tam"><span>15CM</span><span>30CM</span></span></h2>
<p class="nota">Todos en pan ${esc(panes.join(' · '))} · 15CM: ${PORCION_PROTEINA_G.p15} g de proteína · 30CM: ${PORCION_PROTEINA_G.p30} g</p>
${sigs.map((s) => `<div class="item"><div><div class="nom">${esc(s.nombre)}</div><p class="fr">${esc(s.frase)}</p><p class="ll">Lleva: ${esc(s.lleva.join(' · '))}.</p></div>
<div class="pr"><span>${sol(s.p15)}</span><span>${sol(s.p30)}</span></div></div>`).join('\n')}
<h2>BEBIDAS <span class="tam"><span></span><span>500 ML</span></span></h2>
${bebidas.map((b) => `<div class="item"><div><div class="nom">${marca(b.nombre)}</div><p class="fr">${esc(b.desc)}</p></div>
<div class="pr"><span></span><span>${sol(b.precio)}</span></div></div>`).join('\n')}
<footer><span>Delivery en Trujillo.</span><span>@snd__wch · sndwch.app</span></footer>
</div></body></html>`;
writeFileSync(join(OUT, 'carta.html'), html);

const csv = [['categoria', 'producto', 'descripcion', 'precio'].join(';')];
for (const s of sigs) for (const [t, p] of [['15CM', s.p15], ['30CM', s.p30]])
  csv.push(['Signatures', `${s.nombre} ${t}`, `${t} · ${t === '15CM' ? PORCION_PROTEINA_G.p15 : PORCION_PROTEINA_G.p30} g de proteína. ${s.frase} Lleva: ${s.lleva.join(', ')}.`, p.toFixed(2)].join(';'));
for (const b of bebidas) csv.push(['Bebidas', `${b.nombre} 500 ML`, b.desc, b.precio.toFixed(2)].join(';'));
writeFileSync(join(OUT, 'carta.csv'), '﻿' + csv.join('\n') + '\n');

const i = process.argv.indexOf('--pdf');
if (i > 0) {
  const dest = process.argv[i + 1];
  const { chromium } = createRequire(import.meta.url)('playwright');
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await pg.goto('file://' + join(OUT, 'carta.html'));
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: join(dest, 'carta.pdf'), format: 'A4', printBackground: true });
  await pg.screenshot({ path: join(dest, 'carta.png'), fullPage: true });
  await br.close();
}
console.log(`carta lista: ${sigs.length} Signatures, ${bebidas.length} bebidas (precio de app = web + ${Math.round(RECARGO_APPS * 100)}%)`);
