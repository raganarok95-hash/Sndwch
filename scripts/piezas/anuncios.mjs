// SND//WCH — piezas/anuncios: los anuncios de Meta (2026-10-16).
//
// Dueño, sobre los primeros (las láminas del lanzamiento con la foto de stock): «ya lo vi y no me
// gusta, mejóralo» · «genera imágenes fieles». Sistema nuevo, hecho para frenar el dedo en el feed:
// la comida a sangre ocupando todo, un titular corto en grande, el precio y la marca. Nada más.
//
// Las fotos son GENERADAS fieles a la receta y a la porción (docs/marketing/anuncios/README.md: el
// prompt de cada una; CLAUDE.md, «el sándwich generado con IA SÍ se permite en el contenido de
// marketing, fiel a la receta y la porción reales»). Todo número sale de datos.json (la carta y las
// reglas, scripts/piezas/datos.ts): ninguno se escribe a mano.
//
// Uso: node scripts/piezas/anuncios.mjs datos.json docs/marketing/anuncios/fotos [salida]
//   FUENTES_CSS=… (scripts/piezas/fuentes-locales.sh) · PLAYWRIGHT_CHROMIUM_PATH=…
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const [datosPath, fotos, OUT = 'docs/marketing/anuncios'] = process.argv.slice(2);
const D = JSON.parse(readFileSync(datosPath, 'utf8'));
mkdirSync(OUT, { recursive: true });
const img = (p) => 'file://' + resolve(p);
const precio = (n) => 'S/' + Number(n).toFixed(2);
const sig = (nombre) => {
  const s = D.sigs.find((x) => x.nombre === nombre);
  if (!s) throw new Error(`${nombre} ya no está en la carta: revisa el anuncio antes de generar.`);
  return s;
};

const C = { papel: '#EFE6D4', tinta: '#1E2B22', naranja: '#D8823C', oro: '#CBA258', celeste: '#8CC8EC', navy: '#1E2F3A' };
const BASE = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased;background:${C.tinta}}
.p{position:relative;overflow:hidden;background:${C.tinta}}
.foto{position:absolute;left:0;right:0;background-size:cover;background-position:center}
.velo-arriba{position:absolute;left:0;right:0;top:0;background:linear-gradient(180deg,rgba(14,20,16,.82) 0%,rgba(14,20,16,.55) 55%,rgba(14,20,16,0) 100%)}
.velo-abajo{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,rgba(14,20,16,.92) 0%,rgba(14,20,16,.6) 55%,rgba(14,20,16,0) 100%)}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.9;letter-spacing:-.005em;color:${C.papel}}
.voz{font-family:'Instrument Serif',serif;font-style:italic;color:${C.papel}}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600}
.wm{font:800 46px/1 Archivo,sans-serif;display:inline-flex;align-items:center;letter-spacing:.01em;color:${C.papel}}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:${C.oro}}.mk i:last-child{background:${C.celeste}}
.chip{display:inline-flex;align-items:baseline;gap:14px;background:${C.papel};color:${C.tinta};border-radius:12px;padding:14px 22px}
.chip b{font:400 64px/1 Anton,sans-serif}
.chip span{font:600 26px/1 'IBM Plex Mono',monospace;letter-spacing:.06em}
.cta{font:600 28px/1 'IBM Plex Mono',monospace;color:${C.papel};letter-spacing:.06em}
.forro{position:absolute;left:0;top:0;bottom:0;width:18px;background:${C.naranja}}
`;
const marca = `<span class="wm">SND<span class="mk"><i></i><i></i></span>WCH</span>`;
const pagina = (w, h, cuerpo) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{width:${w}px;height:${h}px;overflow:hidden}${BASE}</style></head><body><div class="p" style="width:${w}px;height:${h}px">${cuerpo}</div></body></html>`;

// Un anuncio: la foto, el titular, una línea de voz, el precio (o un dato del pedido en grupo) y la
// marca. `extra` es lo que va encima de la foto (un personaje). En 9:16 el texto queda dentro de la
// zona segura de Reels e Historias: libre el 14% de arriba y el 35% de abajo (los botones de la app).
function anuncio({ archivo, foto, titular, tam = 150, voz, pie, extra = '' }) {
  const feed = pagina(1080, 1350, `
    <div class="foto" style="top:0;height:1350px;background-image:url('${img(foto)}')"></div>
    <div class="velo-arriba" style="height:620px"></div><div class="velo-abajo" style="height:430px"></div>
    <div class="forro"></div>${extra}
    <div style="position:absolute;left:72px;right:72px;top:70px">
      <div class="disp" style="font-size:${tam}px">${titular}</div>
      <div class="voz" style="font-size:50px;line-height:1.12;margin-top:22px;max-width:900px">${voz}</div>
    </div>
    <div style="position:absolute;left:72px;right:72px;bottom:64px;display:flex;justify-content:space-between;align-items:flex-end">
      <div style="display:flex;flex-direction:column;gap:18px">${pie}<div class="cta">PIDE EN SNDWCH.APP · TRUJILLO</div></div>${marca}
    </div>`);
  // 9:16: titular, voz y precio arriba (sobre el fondo de la foto, nunca sobre el sándwich), la
  // comida libre en el centro y la marca abajo. Libre el 14% de arriba (nombre y barra de la app).
  const vertical = pagina(1080, 1920, `
    <div class="foto" style="top:0;height:1920px;background-image:url('${img(foto)}');filter:blur(28px) brightness(.55);transform:scale(1.15)"></div>
    <div class="foto" style="top:420px;height:1341px;background-image:url('${img(foto)}');-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 220px,#000 1120px,transparent 1341px)"></div>
    <div class="velo-arriba" style="top:0;height:1060px"></div><div class="velo-abajo" style="height:420px"></div>
    <div class="forro"></div>${extra.replace(/bottom:\d+px/, 'bottom:330px')}
    <div style="position:absolute;left:72px;right:72px;top:290px;display:flex;flex-direction:column;gap:26px">
      <div class="disp" style="font-size:${tam}px">${titular}</div>
      <div class="voz" style="font-size:50px;line-height:1.12;max-width:900px">${voz}</div>
      <div>${pie}</div>
    </div>
    <div style="position:absolute;left:72px;right:72px;bottom:150px;display:flex;justify-content:space-between;align-items:center">
      <div class="cta">PIDE EN SNDWCH.APP · TRUJILLO</div>${marca}
    </div>`);
  return [{ archivo: `${archivo}-feed`, html: feed, w: 1080, h: 1350 }, { archivo: `${archivo}-vertical`, html: vertical, w: 1080, h: 1920 }];
}
const chipPrecio = (s) => `<div style="display:flex;gap:14px;align-items:center"><div class="chip"><span>15CM</span><b>${precio(s.p15)}</b></div><div class="mono" style="font-size:28px;color:${C.papel}">30CM ${precio(s.p30)}</div></div>`;

const philly = sig('Philly Cheesesteak'), meatball = sig('Meatball Marinara'), turkey = sig('Turkey');
const P = [
  ...anuncio({ archivo: 'philly', foto: `${fotos}/foto-philly.jpg`, titular: 'Hambre<br>en serio.', tam: 190,
    voz: `${philly.nombre}, armado al momento.`, pie: chipPrecio(philly) }),
  ...anuncio({ archivo: 'meatball', foto: `${fotos}/foto-meatball.jpg`, titular: 'Hoy no<br>cocinas.', tam: 190,
    voz: `${meatball.nombre}: albóndigas en su marinara y queso fundido.`, pie: chipPrecio(meatball) }),
  ...anuncio({ archivo: 'turkey', foto: `${fotos}/foto-turkey.jpg`, titular: 'El almuerzo<br>que no te tumba<br>la tarde.', tam: 118,
    voz: `${turkey.nombre}: pavo, lechuga, tomate, cebolla y pimiento.`, pie: chipPrecio(turkey) }),
  ...anuncio({ archivo: 'oficina', foto: `${fotos}/foto-oficina.jpg`, titular: '¿Pides para<br>la oficina?', tam: 150,
    voz: `Desde ${D.organizadorDesde} sándwiches, quien organiza se lleva gratis el 15CM más barato.`,
    pie: `<div class="chip"><b style="font-size:46px">PEDIR EN GRUPO</b></div>`,
    extra: `<img src="${img('img/wicho2_celebra.png')}" style="position:absolute;right:30px;bottom:300px;height:430px">` }),
];

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const page = await browser.newPage();
const fuentes = process.env.FUENTES_CSS ? `<style>${readFileSync(process.env.FUENTES_CSS, 'utf8')}</style>` : '';
for (const p of P) {
  await page.setViewportSize({ width: p.w, height: p.h });
  // Desde un archivo y no con setContent: una página en blanco no carga fotos ni fuentes locales.
  const tmp = resolve(OUT, `.${p.archivo}.html`);
  writeFileSync(tmp, p.html.replace('</head>', `${fuentes}</head>`));
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  rmSync(tmp);
  // Los pesos que de verdad se usan: se piden y se comprueba que cargaron (sin esto, una letra de
  // respaldo sale en el anuncio sin que nadie lo note).
  const faltan = await page.evaluate(async () => {
    const usadas = ['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'];
    await Promise.all(usadas.map((f) => document.fonts.load(f)));
    return usadas.filter((f) => !document.fonts.check(f));
  });
  if (faltan.length) throw new Error(`Faltan fuentes (${faltan.join(', ')}): corre scripts/piezas/fuentes-locales.sh y pasa FUENTES_CSS.`);
  await page.screenshot({ path: `${OUT}/${p.archivo}.jpg`, type: 'jpeg', quality: 92 });
  console.log(`${OUT}/${p.archivo}.jpg`);
}
await browser.close();
