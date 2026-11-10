// SND//WCH — reels/montar: arma un reel vertical 1080×1920 con las tomas de Flow, la foto real y el cierre.
// Uso: FUENTES_CSS=… node scripts/reels/montar.mjs docs/marketing/reels/<id>/reel.json salida.mp4
// reel.json: { "tramos": [ { "video"|"imagen": ruta, "dura": s, "quien": "WICHO"|"SANDO"|null,
//   "titular": "…", "linea": "…" } ], "cierre": { "titular": "…", "linea": "…", "dura": s } }
// Las cifras y la fecha las pone quien escribe reel.json leyendo docs/hechos/ (nunca a mano).
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const [reelPath, salida = 'reel.mp4'] = process.argv.slice(2);
if (!reelPath) throw new Error('Uso: node scripts/reels/montar.mjs reel.json salida.mp4');
const base = dirname(resolve(reelPath));
const reel = JSON.parse(readFileSync(reelPath, 'utf8'));
const FF = process.env.FFMPEG || 'ffmpeg';
const dir = join(tmpdir(), 'sndwch-reel-' + Date.now());
mkdirSync(dir, { recursive: true });
const ruta = (p) => (p.startsWith('/') ? p : existsSync(join(base, p)) ? join(base, p) : resolve(p));
const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fuentes = process.env.FUENTES_CSS ? `<link rel="stylesheet" href="file://${process.env.FUENTES_CSS}">`
  : '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital@1&family=IBM+Plex+Mono:wght@600&display=block">';
const marca = `<div class="m">SND<span class="b"><i></i><i></i></span>WCH</div>`;
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:transparent;font-family:Anton}
.m{position:absolute;right:64px;top:300px;font:400 44px Anton;color:#EFE6D4;display:flex;align-items:center;text-shadow:0 2px 12px #0008}
.b{display:inline-flex;gap:.16em;margin:0 .1em}.b i{display:block;width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;background:#CBA258}.b i+i{background:#8CC8EC}
.t{position:absolute;left:64px;right:64px;top:400px;color:#EFE6D4;text-shadow:0 4px 24px #000c}
.q{font:600 30px 'IBM Plex Mono';letter-spacing:.12em;margin-bottom:14px}
.h{font:400 112px/0.98 Anton;text-transform:uppercase}
.l{font:italic 400 50px/1.15 'Instrument Serif';margin-top:22px}
.g{position:absolute;left:0;right:0;top:0;height:1100px;background:linear-gradient(#0d1410d9,#0d141099 55%,#0d141000)}
.c{position:absolute;inset:0;background:#EFE6D4;color:#1E2B22;padding:420px 80px 0}
.c .h{font-size:120px}.c .m{color:#1E2B22;text-shadow:none;top:300px}`;

const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
async function capa(html, archivo, transparente = true) {
  const f = join(dir, archivo + '.html');
  writeFileSync(f, `<!doctype html><meta charset="utf-8">${fuentes}<style>${css}</style><body>${html}</body>`);
  await pg.goto('file://' + f);
  await pg.evaluate(async () => { await document.fonts.ready; });
  const falta = await pg.evaluate(() => !document.fonts.check('400 100px Anton'));
  if (falta) throw new Error('No cargó Anton: pasa FUENTES_CSS (scripts/piezas/fuentes-locales.sh)');
  const png = join(dir, archivo + '.png');
  await pg.screenshot({ path: png, omitBackground: transparente });
  return png;
}

const partes = [];
for (const [i, t] of reel.tramos.entries()) {
  const texto = `<div class="g"></div>${marca}<div class="t">${t.quien ? `<div class="q">${esc(t.quien)}</div>` : ''}<div class="h">${esc(t.titular)}</div>${t.linea ? `<div class="l">${esc(t.linea)}</div>` : ''}</div>`;
  const over = await capa(texto, 'capa' + i);
  const out = join(dir, `p${i}.mp4`);
  const fondo = '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30';
  const entrada = t.video
    ? ['-i', ruta(t.video)]
    : ['-loop', '1', '-framerate', '30', '-i', ruta(t.imagen)];
  const zoom = t.imagen ? `,zoompan=z='1+0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30` : '';
  execFileSync(FF, ['-y', '-loglevel', 'error', ...entrada, '-i', over, '-t', String(t.dura),
    '-filter_complex', `${fondo}${zoom}[f];[f][1:v]overlay=0:0,format=yuv420p[v]`, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', out]);
  partes.push(out);
}
if (reel.cierre) {
  const c = reel.cierre;
  const png = await capa(`<div class="c">${marca}<div class="h">${esc(c.titular)}</div><div class="l">${esc(c.linea || '')}</div></div>`, 'cierre', false);
  const out = join(dir, 'pc.mp4');
  execFileSync(FF, ['-y', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-i', png, '-t', String(c.dura || 2.5),
    '-vf', 'format=yuv420p', '-an', '-c:v', 'libx264', '-crf', '20', out]);
  partes.push(out);
}
await b.close();
const lista = join(dir, 'lista.txt');
writeFileSync(lista, partes.map((p) => `file '${p}'`).join('\n'));
// Audio: silencio (los hermanos no hablan; la música la pone Instagram al publicar).
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista,
  '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest', '-c:v', 'copy', '-c:a', 'aac', '-movflags', '+faststart', salida]);
console.log('reel listo:', salida);
