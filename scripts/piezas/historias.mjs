// SND//WCH — piezas/historias: monta las historias de una semana (docs/marketing/AGENCIA.md).
// Lee `semanas/<lunes>/historias.json` (lo escribe Creatividad) y compone cada cuadro a 1080×1920:
// la imagen de Flow si el Estudio ya la dejó en `estudio/hecho/<encargo>/v1.*`, o un BOCETO (un
// esquema con la escena encargada) mientras tanto. Nunca recicla las imágenes de img/. El texto lo pone el código con las fuentes de la
// marca y los datos vivos (horario, regla del grupo, pasos del armador): nunca va en la imagen.
//
// Los stickers (enlace, encuesta, cuenta regresiva, pregunta) se DIBUJAN solo para ver dónde
// van: la API de Instagram no publica stickers, así que se ponen en la app al subir la historia.
// Cada cuadro sale también SIN el sticker dibujado, que es el archivo que se sube.
//
// Uso: node scripts/piezas/historias.mjs <semana> datos.json   (HORARIO="11-22", FUENTES_CSS,
//      PLAYWRIGHT_CHROMIUM_PATH). Deja en semanas/<semana>/historias/ los PNG y `tablero.png`.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { APERTURA } from '../video-auto/reglas-del-revisor.mjs';

const [semana, datosPath] = process.argv.slice(2);
const BASE_DIR = `docs/marketing/semanas/${semana}`;
const H = JSON.parse(readFileSync(`${BASE_DIR}/historias.json`, 'utf8')).historias;
const D = JSON.parse(readFileSync(datosPath, 'utf8'));
const [abreH, cierraH] = (process.env.HORARIO || '').split('-').map(Number);
if (!abreH || !cierraH) throw new Error('Falta HORARIO="abre-cierra" (de get-store-hours)');
const OUT = `${BASE_DIR}/historias`;
mkdirSync(OUT, { recursive: true });
const img = (p) => 'file://' + resolve(p);
const C = { papel: '#EFE6D4', tinta: '#1E2B22', naranja: '#D8823C', celeste: '#8CC8EC', navy: '#1E2F3A', oro: '#CBA258' };
const hh = (h) => `${String(h).padStart(2, '0')}:00`;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pasosLista = D.pasos.map((p) => cap(p.toLowerCase())).join('. ') + '.';
const VAR = {
  abre: hh(abreH), cierra: hh(cierraH), organizadorDesde: String(D.organizadorDesde), pasos_lista: pasosLista,
  dia_abre: cap(DIAS[new Date(`${APERTURA}T12:00:00`).getDay()]),
};
const interpola = (t) => t.replace(/\{(\w+)\}/g, (_, k) => { if (!(k in VAR)) throw new Error(`Sin dato para {${k}}`); return VAR[k]; });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function flowDe(encargo) {
  const dir = `docs/marketing/estudio/hecho/${encargo}`;
  if (!encargo || !existsSync(`${dir}/estado.json`)) return null;
  const e = JSON.parse(readFileSync(`${dir}/estado.json`, 'utf8'));
  if (e.estado !== 'listo') return null;
  const f = readdirSync(dir).find((x) => /^v1\.(png|jpe?g|webp)$/i.test(x));
  return f ? `${dir}/${f}` : null;
}
function curvas(color) {
  let p = '';
  for (let i = 0; i < 22; i++) { const y0 = (i / 21) * 1920; let d = `M -10 ${y0}`; for (let x = 0; x <= 1100; x += 10) d += ` L ${x} ${(y0 + 14 * Math.sin(x / 70 + i * 0.7) + 6 * Math.sin(x / 31 + i)).toFixed(1)}`; p += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2"/>`; }
  return `<svg style="position:absolute;inset:0" width="1080" height="1920">${p}</svg>`;
}
function fondo(c, h) {
  const flow = flowDe(c.encargo);
  if (flow) return { html: `<img src="${img(flow)}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),transparent 32%,transparent 70%,rgba(0,0,0,.45))"></div>`, oscuro: true, boceto: false };
  // Boceto: un ESQUEMA, nunca una imagen que ya existe (dueño, 2026-10-08: «no tiene sentido que
  // la agencia recicle las imágenes que ya tenemos cuando puede generar gratis en Flow»).
  const mundo = c.personaje === 'WICHO' ? `<div style="position:absolute;inset:0;background:${C.celeste}">${curvas('#7DBBE0')}</div>`
    : c.personaje === 'SANDO' ? `<div style="position:absolute;inset:0;background:${C.papel}"></div><div style="position:absolute;left:0;top:0;bottom:0;width:34px;background:${C.naranja}"></div>`
    : `<div style="position:absolute;inset:0;background:${C.tinta}"></div>`;
  const oscuro = !c.personaje;
  const tinta = oscuro ? 'rgba(239,230,212,.75)' : c.personaje === 'WICHO' ? 'rgba(30,47,58,.75)' : 'rgba(30,43,34,.7)';
  return { html: `${mundo}<div style="position:absolute;left:90px;right:90px;top:620px;bottom:560px;border:4px dashed ${tinta};border-radius:24px;padding:48px;font:500 30px/1.45 'IBM Plex Mono',monospace;color:${tinta}">FLOW${c.personaje ? ` · ${c.personaje}` : ''}<br><br>${esc(c.escena.split('. ')[0])}.</div>`, oscuro, boceto: true };
}
function texto(c, oscuro) {
  const t = esc(interpola(c.texto));
  const col = oscuro ? C.papel : c.personaje === 'WICHO' ? C.navy : C.tinta;
  const sombra = oscuro ? 'text-shadow:0 2px 18px rgba(0,0,0,.45);' : '';
  if (c.voz === 'sando') return `<div style="position:absolute;left:90px;right:90px;top:250px;font:italic 400 104px/1.05 'Instrument Serif',serif;color:${col};${sombra}text-wrap:balance">${t}</div>`;
  const size = t.length > 30 ? 92 : 132;
  return `<div style="position:absolute;left:90px;right:90px;top:240px;font:400 ${size}px/.95 Anton,sans-serif;text-transform:uppercase;color:${col};${sombra}text-wrap:balance">${t}</div>`;
}
const nombre = (c, oscuro) => c.personaje ? `<div style="position:absolute;left:90px;top:150px;font:600 26px 'IBM Plex Mono',monospace;letter-spacing:.2em;color:${oscuro ? 'rgba(239,230,212,.85)' : 'rgba(30,43,34,.6)'}">${c.personaje}</div>` : '';
function sticker(s) {
  if (!s) return '';
  const caja = 'position:absolute;left:50%;transform:translateX(-50%);bottom:330px;background:#fff;color:#111;box-shadow:0 8px 30px rgba(0,0,0,.25);font-family:Archivo,sans-serif';
  if (s.tipo === 'enlace') return `<div style="${caja};border-radius:16px;padding:22px 34px;font-weight:800;font-size:38px;color:#2563EB;letter-spacing:.02em;display:flex;gap:16px;align-items:center"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.4" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>${esc(s.texto)}</div>`;
  if (s.tipo === 'encuesta') return `<div style="${caja};border-radius:24px;width:640px;padding:30px;text-align:center"><div style="font-weight:800;font-size:40px;margin-bottom:22px">${esc(s.pregunta)}</div>${s.opciones.map((o) => `<div style="border:2px solid #ddd;border-radius:14px;padding:18px;margin-top:12px;font-weight:700;font-size:34px">${esc(o)}</div>`).join('')}</div>`;
  if (s.tipo === 'cuenta regresiva') return `<div style="${caja};border-radius:24px;width:600px;padding:30px;text-align:center"><div style="font-weight:800;font-size:40px">${esc(s.texto)}</div><div style="font:600 34px 'IBM Plex Mono',monospace;margin-top:14px">${esc(interpola(s.fin))}</div><div style="margin-top:18px;font-weight:700;font-size:28px;color:#2563EB">Recordarme</div></div>`;
  if (s.tipo === 'pregunta') return `<div style="${caja};border-radius:24px;width:620px;overflow:hidden;text-align:center"><div style="background:${C.navy};color:#fff;font-weight:800;font-size:38px;padding:28px">${esc(s.pregunta)}</div><div style="padding:26px;font-size:30px;color:#999">Escribe algo…</div></div>`;
  return '';
}
const etiquetaBoceto = (c) => `<div style="position:absolute;left:0;right:0;top:0;background:${C.naranja};color:#fff;font:600 24px 'IBM Plex Mono',monospace;padding:14px 30px;letter-spacing:.06em">BOCETO · falta la imagen de Flow${c.encargo ? ` (${c.encargo})` : ''}</div>`;

const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const fuentes = process.env.FUENTES_CSS ? readFileSync(process.env.FUENTES_CSS, 'utf8') : '';
async function foto(html, archivo, w, h, scale = 1) {
  const tmp = resolve(OUT, `.tmp.html`);
  writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fuentes}*{box-sizing:border-box;margin:0;padding:0}body{width:${w}px;height:${h}px;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}</style></head><body>${html}</body></html>`);
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.evaluate(async () => { await Promise.all(['400 10px Anton', '800 10px Archivo', '600 10px "IBM Plex Mono"', 'italic 400 10px "Instrument Serif"'].map((f) => document.fonts.load(f))); await Promise.all([...document.images].map((i) => i.decode().catch(() => 0))); });
  await p.screenshot({ path: archivo });
  await p.close(); rmSync(tmp);
}

const filas = [];
let bocetos = 0, total = 0;
for (const h of H) {
  const miniaturas = [];
  for (const [i, c] of h.cuadros.entries()) {
    const f = fondo(c, h);
    if (f.boceto) bocetos++;
    total++;
    const base = f.html + nombre(c, f.oscuro) + texto(c, f.oscuro) + (f.boceto ? etiquetaBoceto(c) : '');
    const nombreArchivo = `${h.dia}-${h.id}-${i + 1}`;
    await foto(base, `${OUT}/${nombreArchivo}.png`, 1080, 1920);
    await foto(base + sticker(c.sticker), `${OUT}/${nombreArchivo}-con-sticker.png`, 1080, 1920);
    miniaturas.push(`${nombreArchivo}-con-sticker.png`);
  }
  filas.push({ h, miniaturas });
}
// El tablero: una fila por historia, para aprobar la semana de un vistazo.
const tablero = filas.map(({ h, miniaturas }) => `<div style="display:flex;gap:28px;padding:34px 40px;border-bottom:2px solid #d9cfbd;align-items:flex-start">
  <div style="width:360px;flex:none"><div style="font:600 20px 'IBM Plex Mono',monospace;color:${C.naranja};letter-spacing:.08em">${esc(h.dia)} · ${esc(h.hora)}</div>
  <div style="font:400 54px/1 Anton,sans-serif;text-transform:uppercase;margin:10px 0 12px;color:${C.tinta}">${esc(h.titulo)}</div>
  <div style="font:600 18px 'IBM Plex Mono',monospace;color:#6C7860;margin-bottom:12px">${esc(h.momento)} · ${esc(h.nivel)}</div>
  <div style="font:400 21px/1.4 Archivo,sans-serif;color:${C.tinta}">${esc(h.por_que)}</div></div>
  ${miniaturas.map((m) => `<img src="${img(`${OUT}/${m}`)}" style="width:250px;height:444px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.18)">`).join('')}</div>`).join('');
const alto = filas.length * 512 + 150;
await foto(`<div style="position:absolute;inset:0;background:${C.papel}"><div style="padding:40px 40px 10px;font:400 64px Anton,sans-serif;text-transform:uppercase;color:${C.tinta}">Historias · semana del ${semana}</div>${tablero}</div>`, `${OUT}/tablero.png`, 1640, alto);
await b.close();
console.log(`✓ ${total} cuadros (${bocetos} en boceto, esperando Flow) + tablero en ${OUT}`);
