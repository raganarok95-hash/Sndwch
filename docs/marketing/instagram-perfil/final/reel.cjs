// La versión FINAL del Instagram de SND//WCH (2026-10-30), elegida de las 10 anteriores. Antes:
// siete versiones más del Instagram de SND//WCH (dueño, 2026-10-30: «dame 7 versiones más de todo lo
// que Instagram, con sando, wicho, sin, mezclados, descompuestos y en todas una idea de la foto de
// perfil»). Cada versión: foto de perfil, 4 destacados, 9 publicaciones y la maqueta del perfil.
// Reglas que no cambian en ninguna: la comida no se tapa ni se tiñe; las cifras y nombres salen de la
// carta; los elementos de cada hermano salen de docs/LOS_DOS_HERMANOS.md.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, REPO = path.resolve(D, '../../../..');
const OUT = process.env.SALIDA ? path.resolve(process.env.SALIDA) : D; fs.mkdirSync(OUT, { recursive: true });
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8'); // FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh)
const FOTOS = `${REPO}/docs/marketing/anuncios/fotos`;
const img = (p) => 'file://' + path.resolve(p);
const PJ = (n) => img(`${REPO}/img/${n}.png`);
const S = { oliva: '#6C7860', verde: '#183024', tan: '#C9A87C', forro: '#D8823C', oro: '#CBA258', tinta: '#1E2B22' };
const W = { pelaje: '#90CCF0', curvas: '#7DB6DA', durazno: '#F0D8CC', lila: '#C3A6D2', lilaO: '#4A3D62', tinta: '#1E2F3A' };
const papel = '#EFE6D4', celeste = '#8CC8EC';

const BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Archivo,sans-serif;-webkit-font-smoothing:antialiased}
.disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.92;letter-spacing:-.005em;text-wrap:balance}
.voz{font-family:'Instrument Serif',serif;font-style:italic}
.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}
.wm{font:800 42px/1 Archivo,sans-serif;display:inline-flex;align-items:center;letter-spacing:.01em}
.mk{display:inline-flex;gap:.16em;margin:0 .1em}.mk i{width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px;display:block}
.mk i:first-child{background:${S.oro}}.mk i:last-child{background:${celeste}}
.rib{background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.16) 0 7px,rgba(255,255,255,.045) 7px 14px)}
.abs{position:absolute}.full{position:absolute;inset:0}
.cruz{background-image:repeating-linear-gradient(45deg,rgba(144,204,240,.08) 0 2px,transparent 2px 22px),repeating-linear-gradient(-45deg,rgba(144,204,240,.08) 0 2px,transparent 2px 22px)}`;
const marca = (c = papel, t = 42) => `<span class="wm" style="color:${c};font-size:${t}px">SND<span class="mk"><i></i><i></i></span>WCH</span>`;
const barras = (alto) => `<span class="mk" style="font-size:${alto}px;margin:0"><i></i><i></i></span>`;
const pagina = (w, h, cuerpo, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}html,body{width:${w}px;height:${h}px;overflow:hidden}${BASE}${extra}</style></head><body>${cuerpo}</body></html>`;
const caja = (w, h, estilo, dentro) => `<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;${estilo}">${dentro}</div>`;

// La espiral de WICHO, por cálculo (~3.6 vueltas). Las curvas de nivel de su polo, tono sobre tono.
function espiral(cx, cy, rmax, color, ancho) {
  const v = 3.6, n = 420, p = [];
  for (let i = 0; i <= n; i++) { const t = (i / n) * v * 2 * Math.PI, r = (t / (v * 2 * Math.PI)) * rmax; p.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
  return `<polyline points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>`;
}
const svgEsp = (w, h, cx, cy, r, c, a) => `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}">${espiral(cx, cy, r, c, a)}</svg>`;
function curvas(w, h, cx, cy, color, n = 18, paso = 66, sem = 1) {
  let s = '';
  for (let k = 1; k <= n; k++) {
    const p = [];
    for (let i = 0; i <= 180; i++) { const t = (i / 180) * 2 * Math.PI; const r = k * paso * (1 + 0.09 * Math.sin(3 * t + k * 0.35 + sem) + 0.05 * Math.sin(5 * t + 1.7 * sem) + 0.03 * Math.sin(2 * t - k * 0.2)); p.push(`${(cx + r * Math.cos(t) * 1.15).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
    s += `<polygon points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
  }
  return `<svg class="abs" style="left:0;top:0" width="${w}" height="${h}">${s}</svg>`;
}
const ICON = {
  carta: '<path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><path d="M3 11h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/><path d="M4 15.5h16"/><path d="M8 7c.7-1.3 1.9-2 4-2s3.3.7 4 2"/>',
  pedir: '<path d="M4 5h2l2.3 11.4A2 2 0 0 0 10.3 18h7.4a2 2 0 0 0 2-1.6L21 9H7.2"/><circle cx="10.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>',
  bebidas: '<rect x="8" y="8" width="8" height="13" rx="2"/><path d="M10 8V5.5h4V8"/><path d="M9.6 3.8h4.8"/><path d="M8 12.5h8"/>',
  zonas: '<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>',
};
const ico = (k, c, t = 480) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position:relative">${ICON[k]}</svg>`;
const centrado = 'display:flex;align-items:center;justify-content:center';
// Portada de destacado: 1080 × 1920, lo importante dentro del círculo central.
const portada = (fondo, dentro) => caja(1080, 1920, `background:${fondo};${centrado}`, dentro);
const conCara = (fondo, pose, alto, dy = 0, clase = '') => portada(fondo, `<div class="full ${clase}"></div><img src="${PJ(pose)}" style="position:relative;height:${alto}px;transform:translateY(${dy}px)">`);
const foto = (n, pos = 'center 62%') => `background:url('${img(`${FOTOS}/${n}`)}') ${pos}/cover`;

const FOOD = [
  { n: '1-philly', f: 'foto-philly.jpg', tit: 'Hambre en serio.', voz: 'Philly Cheesesteak. Tan jugoso que no lleva salsa.', cita: 'Tan jugoso que no lleva salsa.', nombre: 'Philly Cheesesteak' },
  { n: '4-meatball', f: 'foto-meatball-lata.jpg', tit: 'Hoy no cocinas.', voz: 'Meatball Marinara. Albóndigas en su propia marinara.', cita: 'Albóndigas en su propia marinara.', nombre: 'Meatball Marinara' },
  { n: '5-turkey', f: 'foto-turkey-v4.jpg', tit: 'El almuerzo que no te tumba la tarde.', voz: 'Turkey. Llena sin pesar.', cita: 'Llena sin pesar.', nombre: 'Turkey' },
  { n: '6-tuna-melt', f: 'foto-tuna-melt.jpg', tit: 'Antojo de algo caliente.', voz: 'Tuna Melt. El cheddar se estira al primer mordisco.', cita: 'El cheddar se estira al primer mordisco.', nombre: 'Tuna Melt' },
  { n: '7-italian-hoagie', f: 'foto-italian-hoagie.jpg', tit: 'Cuando quieres de todo.', voz: 'Italian Hoagie. Cada capa suma y ninguna sobra.', cita: 'Cada capa suma y ninguna sobra.', nombre: 'Italian Hoagie' },
  { n: '8-classic-tuna', f: 'foto-classic-tuna.jpg', tit: 'Se come con una mano.', voz: 'Classic Tuna. Simple y bien hecho.', cita: 'Simple y bien hecho.', nombre: 'Classic Tuna' },
];
const SIGS = FOOD.map((x) => x.nombre);
const tam = (t, base = 112) => (t.length <= 16 ? base : t.length <= 24 ? Math.round(base * 0.88) : Math.round(base * 0.76));
const PASOS = ['Entras a sndwch.app', 'Eliges uno o armas el tuyo', 'Pagas con Yape o tarjeta', 'Te llega a la puerta'];
const MONO = 'SNDWCH.APP';

// Un panel de texto de Signature (debajo de la foto): fondo, color del titular, de la voz y del resto.
const panelSig = (d, { fondo, clase = '', extra = '', tit, voz, resto, alto = 430, titular = d.tit }) => caja(1080, 1350, `background:${fondo}`, `
  <div class="full" style="bottom:${alto}px;${foto(d.f)}"></div>
  <div class="abs ${clase}" style="left:0;right:0;bottom:0;height:${alto}px;background-color:${fondo};overflow:hidden">${extra}
    <div class="abs" style="left:84px;right:84px;top:50px;bottom:52px;display:flex;flex-direction:column">
      <div class="disp" style="font-size:${tam(titular, 112)}px;color:${tit}">${titular}</div>
      <div class="voz" style="font-size:42px;line-height:1.12;margin-top:14px;color:${voz}">${d.voz}</div>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:26px;color:${resto}">${MONO}</div>${marca(resto, 38)}</div></div></div>`);
const listaCarta = (c, t = 92) => `<div class="disp" style="font-size:${t}px;line-height:1.03;color:${c}">${SIGS.join('<br>')}</div>`;

// ════════════════════════════════════════════════════════════════════════════════════════════════
// EL REEL «Los seis de la casa» (2026-10-30, dueño: «generame todas las imágenes que necesito para el
// feed y el video también»). 1080 × 1920, 30 cuadros por segundo, sin audio (la música la pone el dueño en
// la app de Instagram, que trae las licencias). El guion repite el concepto del perfil, «Dos formas de comer
// SND//WCH»:
//  0,0 s  la portada: los seis en mosaico. Es el primer cuadro, y la API toma el primer cuadro como portada
//         (thumb_offset 0). La comida está en el primer segundo.
//  0,8 s  los seis Signatures, 1,6 s cada uno: la foto entera abajo y el texto en la basta acanalada de SANDO,
//         arriba, nunca sobre la comida. El texto queda fuera de la franja que tapan los botones y el caption.
// 10,4 s  el corte: las dos barras del logo cruzan la pantalla y abren el lado de WICHO. Es el único // del
//         video, y significa lo que siempre significó: el corte del pan.
// 10,8 s  «O arma el tuyo», con lo que la app ya ofrece (carta.ts).
// 13,4 s  el logo oficial sobre el fondo partido, y sndwch.app.
// ════════════════════════════════════════════════════════════════════════════════════════════════
const { execFileSync } = require('child_process');
const LOGO = img(`${REPO}/img/marca/avatar-1024-transparente.png`);
const FPS = 30;
const T = { portada: 0.8, sig: 1.6, corte: 0.4, arma: 2.6, cierre: 2.2 };
const T_SIGS = T.portada, T_CORTE = T_SIGS + FOOD.length * T.sig, T_ARMA = T_CORTE + T.corte, T_CIERRE = T_ARMA + T.arma;
const DURA = T_CIERRE + T.cierre;
const PROT = ['Res', 'Atún', 'Albóndiga', 'Pavo'];
const FILAS = [['Pan', 'Classic o Focaccia'], ['Proteína', PROT.join(' · ')], ['Encima', 'verduras y hasta 3 salsas incluidas']];

const mosaico = FOOD.map((d) => `<div style="${foto(d.f, 'center 60%')};border-radius:8px"></div>`).join('');
const escenas = `
<div id="portada" class="full" style="background:${S.verde}">
  <div class="abs" style="left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div>
  <div class="abs" style="left:96px;right:84px;top:300px"><div class="mono" style="font-size:30px;color:${S.tan}">LOS DE LA CASA · 15 CM Y 30 CM</div>
    <div class="disp" style="font-size:150px;color:${papel};margin-top:24px">Los seis<br>de la casa.</div></div>
  <div class="abs" style="left:96px;right:84px;top:760px;height:840px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:14px">${mosaico}</div>
</div>
${FOOD.map((d, i) => `<div id="sig${i}" class="full" style="background:${S.oliva};display:none">
  <div class="abs" style="left:0;right:0;top:580px;bottom:0;overflow:hidden"><div class="sigfoto full" style="${foto(d.f, 'center 62%')};transform-origin:50% 62%"></div></div>
  <div class="abs rib" style="left:0;right:0;top:0;height:580px;background-color:${S.oliva}"></div>
  <div class="sigtexto abs" style="left:84px;right:84px;top:248px;color:${papel}">
    <div class="mono" style="font-size:28px">LOS DE LA CASA · ${i + 1} DE ${FOOD.length}</div>
    <div class="disp" style="font-size:${tam(d.nombre, 120)}px;margin-top:16px">${d.nombre}</div>
    <div class="voz" style="font-size:50px;line-height:1.1;margin-top:12px">${d.cita}</div></div>
</div>`).join('')}
<div id="arma" class="full" style="background:${W.pelaje};color:${W.tinta};display:none">
  <div id="curvas" class="full"></div>
  <img id="wicho" src="${PJ('wicho2_celebra')}" class="abs" style="left:170px;top:1170px;height:620px">
  <div class="abs" style="left:96px;right:150px;top:270px">
    <div class="mono" style="font-size:30px">EL OTRO LADO</div>
    <div class="disp" style="font-size:150px;margin-top:22px">O arma<br>el tuyo.</div>
    <div style="margin-top:44px;display:flex;flex-direction:column;gap:26px">${FILAS.map(([a, b], i) => `<div class="fila" data-i="${i}" style="display:flex;gap:22px;align-items:center">
      <svg width="62" height="62" style="flex:none"><circle cx="31" cy="31" r="31" fill="${W.lilaO}"/>${espiral(31, 31, 24, W.lila, 3.5)}</svg>
      <span class="mono" style="font-size:26px;width:190px;flex:none">${a.toUpperCase()}</span><span class="voz" style="font-size:44px">${b}</span></div>`).join('')}</div></div>
</div>
<div id="corte" class="full" style="display:none;pointer-events:none">
  <div id="barras" class="abs" style="top:-200px;bottom:-200px;display:flex;gap:40px;transform:skewX(-16deg)"><i style="display:block;width:110px;background:${S.oro}"></i><i style="display:block;width:110px;background:${celeste}"></i></div>
</div>
<div id="cierre" class="full" style="display:none">
  <div class="abs rib" style="left:0;top:0;bottom:0;width:540px;background-color:${S.oliva}"></div>
  <div class="abs" style="right:0;top:0;bottom:0;width:540px;background:${W.pelaje}"></div>
  <img id="logo" src="${LOGO}" class="abs" style="left:140px;top:420px;width:800px;height:800px">
  <div class="abs" style="left:0;right:0;top:1290px;display:flex;justify-content:center"><div id="url" class="mono" style="font-size:52px;background:${papel};color:${S.tinta};padding:20px 40px;border-radius:999px">sndwch.app</div></div>
</div>`;

// El cuadro de cada instante. Corre dentro de la página.
function pintar(t, c) {
  const $ = (id) => document.getElementById(id);
  const ver = (id, si) => { $(id).style.display = si ? 'block' : 'none'; };
  const suave = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  ver('portada', t < c.T_SIGS);
  for (let i = 0; i < c.n; i++) {
    const t0 = c.T_SIGS + i * c.sig, dentro = t >= t0 && t < t0 + c.sig;
    ver('sig' + i, dentro);
    if (!dentro) continue;
    const e = $('sig' + i), x = (t - t0) / c.sig;
    e.querySelector('.sigfoto').style.transform = `scale(${1 + 0.06 * x})`;
    const k = suave((t - t0) / 0.22);
    const tx = e.querySelector('.sigtexto'); tx.style.opacity = k; tx.style.transform = `translateY(${(1 - k) * 26}px)`;
  }
  // El lado de WICHO aparece detrás del corte y se queda.
  const enArma = t >= c.T_CORTE && t < c.T_CIERRE;
  ver('arma', enArma);
  if (enArma) {
    const corte = Math.min(1, (t - c.T_CORTE) / c.corte);
    // Durante el corte, el lado de WICHO se ve solo a la izquierda del borde de las barras.
    const borde = -260 + corte * 1700;
    $('arma').style.clipPath = t < c.T_ARMA ? `polygon(0 0, ${borde + 300}px 0, ${borde - 250}px 100%, 0 100%)` : 'none';
    $('curvas').innerHTML = window.curvasEn(t);
    const a = (t - c.T_ARMA) / 0.5;
    $('wicho').style.transform = `translateY(${(1 - suave(a)) * 260}px)`;
    document.querySelectorAll('.fila').forEach((f) => { const k = suave((t - c.T_ARMA - 0.35 - 0.28 * +f.dataset.i) / 0.3); f.style.opacity = k; f.style.transform = `translateX(${(1 - k) * -30}px)`; });
  }
  ver('corte', t >= c.T_CORTE && t < c.T_ARMA);
  if (t >= c.T_CORTE && t < c.T_ARMA) $('barras').style.left = (-260 + ((t - c.T_CORTE) / c.corte) * 1700) + 'px';
  // Mientras corre el corte, el último Signature sigue debajo.
  if (t >= c.T_CORTE && t < c.T_ARMA) { ver('sig' + (c.n - 1), true); }
  ver('cierre', t >= c.T_CIERRE);
  if (t >= c.T_CIERRE) {
    const k = suave((t - c.T_CIERRE) / 0.45);
    $('logo').style.transform = `scale(${0.9 + 0.1 * k})`; $('logo').style.opacity = k;
    const u = suave((t - c.T_CIERRE - 0.3) / 0.35); $('url').style.opacity = u; $('url').style.transform = `translateY(${(1 - u) * 20}px)`;
  }
}

(async () => {
  const FFMPEG = process.env.FFMPEG || 'ffmpeg';
  const dir = path.join(require('os').tmpdir(), 'sndwch-cuadros-reel'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const tmp = path.join(OUT, '.reel.html');
  fs.writeFileSync(tmp, pagina(1080, 1920, `<div class="full" style="overflow:hidden">${escenas}</div>`));
  await pg.goto('file://' + tmp, { waitUntil: 'load' });
  await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
  // Las curvas de nivel de WICHO se mueven despacio: cambia la semilla con el tiempo.
  await pg.addScriptTag({ content: `${curvas.toString()}\nwindow.curvasEn = (t) => curvas(1080, 1920, 860, 1500, '${W.curvas}', 22, 70, 3 + t * 0.35);` });
  await pg.addScriptTag({ content: `window.pintar = ${pintar.toString()};` });
  const c = { T_SIGS, T_CORTE, T_ARMA, T_CIERRE, sig: T.sig, corte: T.corte, n: FOOD.length };
  const total = Math.round(DURA * FPS);
  for (let i = 0; i < total; i++) {
    await pg.evaluate(([t, c]) => window.pintar(t, c), [i / FPS, c]);
    await pg.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close(); fs.rmSync(tmp, { force: true });
  const mp4 = path.join(OUT, 'reel-los-seis-de-la-casa.mp4');
  // Con una pista de audio en silencio: la API de Instagram pide AAC en los Reels, y así no hay sorpresa.
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', mp4]);
  // La portada en la cuadrícula: el primer cuadro (el mosaico de los seis).
  fs.copyFileSync(path.join(dir, '0000.jpg'), path.join(OUT, 'reel-portada.jpg'));
  console.log('reel', mp4, `${DURA.toFixed(1)} s, ${total} cuadros`);
})();
