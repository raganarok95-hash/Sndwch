// Siete versiones más del Instagram de SND//WCH (dueño, 2026-10-30: «dame 7 versiones más de todo lo
// que Instagram, con sando, wicho, sin, mezclados, descompuestos y en todas una idea de la foto de
// perfil»). Cada versión: foto de perfil, 4 destacados, 9 publicaciones y la maqueta del perfil.
// Reglas que no cambian en ninguna: la comida no se tapa ni se tiñe; las cifras y nombres salen de la
// carta; los elementos de cada hermano salen de docs/LOS_DOS_HERMANOS.md.
const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const fs = require('fs'), path = require('path');
const REPO = '/home/user/Sndwch', D = __dirname;
const OUT = path.join(D, process.env.SALIDA || 'siete'); fs.mkdirSync(OUT, { recursive: true });
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
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
  { n: '1-abrimos', f: 'foto-philly.jpg', tit: 'Hambre en serio.', voz: 'Philly Cheesesteak. Tan jugoso que no lleva salsa.', cita: 'Tan jugoso que no lleva salsa.', nombre: 'Philly Cheesesteak' },
  { n: '4-meatball', f: 'foto-meatball-lata.jpg', tit: 'Hoy no cocinas.', voz: 'Meatball Marinara. Albóndigas en su propia marinara.', cita: 'Albóndigas en su propia marinara.', nombre: 'Meatball Marinara' },
  { n: '5-turkey', f: 'foto-turkey-v4.jpg', tit: 'El almuerzo que no te tumba la tarde.', voz: 'Turkey. Llena sin pesar.', cita: 'Llena sin pesar.', nombre: 'Turkey' },
  { n: '6-tuna-melt', f: 'foto-tuna-melt.jpg', tit: 'Antojo de algo caliente.', voz: 'Tuna Melt. El cheddar se estira al primer mordisco.', cita: 'El cheddar se estira al primer mordisco.', nombre: 'Tuna Melt' },
  { n: '7-italian-hoagie', f: 'foto-italian-hoagie.jpg', tit: 'Cuando quieres de todo.', voz: 'Italian Hoagie. Cada capa suma y ninguna sobra.', cita: 'Cada capa suma y ninguna sobra.', nombre: 'Italian Hoagie' },
  { n: '8-classic-tuna', f: 'foto-classic-tuna.jpg', tit: 'Se come con una mano.', voz: 'Classic Tuna. Simple y bien hecho.', cita: 'Simple y bien hecho.', nombre: 'Classic Tuna' },
];
const SIGS = FOOD.map((x) => x.nombre);
const tam = (t, base = 112) => (t.length <= 16 ? base : t.length <= 24 ? Math.round(base * 0.88) : Math.round(base * 0.76));
const PASOS = ['Entras a sndwch.app', 'Eliges uno o armas el tuyo', 'Pagas con Yape o tarjeta', 'Te llega a la puerta'];
const MONO = 'ABRIMOS EN NOVIEMBRE';

// Un panel de texto de Signature (debajo de la foto): fondo, color del titular, de la voz y del resto.
const panelSig = (d, { fondo, clase = '', extra = '', tit, voz, resto, alto = 430, titular = d.tit }) => caja(1080, 1350, `background:${fondo}`, `
  <div class="full" style="bottom:${alto}px;${foto(d.f)}"></div>
  <div class="abs ${clase}" style="left:0;right:0;bottom:0;height:${alto}px;background-color:${fondo};overflow:hidden">${extra}
    <div class="abs" style="left:84px;right:84px;top:50px;bottom:52px;display:flex;flex-direction:column">
      <div class="disp" style="font-size:${tam(titular, 112)}px;color:${tit}">${titular}</div>
      <div class="voz" style="font-size:42px;line-height:1.12;margin-top:14px;color:${voz}">${d.voz}</div>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:26px;color:${resto}">${MONO}</div>${marca(resto, 38)}</div></div></div>`);
const listaCarta = (c, t = 92) => `<div class="disp" style="font-size:${t}px;line-height:1.03;color:${c}">${SIGS.join('<br>')}</div>`;

const V = [];

// ── 1 · SANDO: su mundo no grita. Papel, tinta, el oliva de su casaca y el forro naranja vertical.
V.push({ id: '1-sando', nombre: 'SANDO', idea: 'SANDO sonriendo, de tres cuartos, sobre el oliva acanalado de su casaca',
  avatar: caja(1080, 1080, `background-color:${S.oliva};${centrado}`, `<div class="full rib"></div><img src="${PJ('sando2_sonrie')}" style="position:absolute;bottom:-40px;left:110px;height:1040px">`),
  dest: {
    carta: conCara(papel, 'sando2_frente', 1150, 40),
    pedir: portada(S.oliva, `<div class="full rib"></div><img src="${PJ('sando2_pulgar')}" style="position:relative;width:980px">`),
    bebidas: portada(S.verde, `<div class="abs" style="left:300px;top:0;bottom:0;width:60px;background:${S.forro}"></div>${ico('bebidas', S.tan)}`),
    zonas: conCara(papel, 'sando2_asoma', 1250, 80),
  },
  food: (d) => panelSig(d, { fondo: papel, tit: S.tinta, voz: S.oliva, resto: S.tinta, extra: `<div class="abs" style="left:0;top:0;bottom:0;width:22px;background:${S.forro}"></div>` }),
  carta: caja(1080, 1350, `background:${papel}`, `<img src="${PJ('sando2_cuerpo')}" class="abs" style="right:-6px;bottom:-60px;height:880px;clip-path:inset(0 0 0 7%)">
    <div class="abs" style="left:96px;top:92px;right:84px"><div class="mono" style="font-size:26px;color:${S.oliva}">LA CARTA · 15 CM Y 30 CM</div><div style="margin-top:40px">${listaCarta(S.tinta, 86)}</div>
    <div class="voz" style="font-size:54px;margin-top:36px;color:${S.oliva}">Y el que armas tú.</div></div>`),
  pasos: caja(1080, 1350, `background-color:${S.oliva}`, `<div class="full rib"></div><img src="${PJ('sando2_pulgar')}" class="abs" style="right:-40px;bottom:60px;width:560px">
    <div class="abs" style="left:96px;top:92px;right:96px;color:${papel}"><div class="mono" style="font-size:26px;color:${S.tan}">ASÍ DE FÁCIL</div><div class="disp" style="font-size:150px;margin-top:34px">Cuatro<br>pasos.</div>
    <div style="margin-top:50px;display:flex;flex-direction:column;gap:26px">${PASOS.map((t, i) => `<div style="display:flex;gap:28px;align-items:baseline"><span class="disp" style="font-size:78px;color:${S.tan};width:52px">${i + 1}</span><span class="voz" style="font-size:54px">${t}</span></div>`).join('')}</div></div>`),
  reel: caja(1080, 1350, `background-color:${S.verde};color:${papel};${centrado};flex-direction:column;gap:26px;text-align:center;padding:120px`, `<div class="full rib" style="opacity:.6"></div><div class="disp" style="font-size:110px;position:relative">Detrás<br>del pan</div><div class="voz" style="font-size:44px;color:${S.tan};position:relative">Aquí va tu video: el pan, la plancha y el armado.</div>`),
});

// ── 2 · WICHO: su mundo sí exclama. Celeste, durazno, curvas de nivel y la espiral.
V.push({ id: '2-wicho', nombre: 'WICHO', idea: 'WICHO riéndose, de frente, sobre su celeste con las curvas de nivel de su polo',
  avatar: caja(1080, 1080, `background:${W.pelaje};${centrado}`, `${curvas(1080, 1080, 540, 540, W.curvas, 12, 58, 3)}<img src="${PJ('wicho2_rie')}" style="position:relative;height:900px;transform:translateY(40px)">`),
  dest: {
    carta: conCara(W.durazno, 'wicho2_rie', 860, 30),
    pedir: portada(W.pelaje, `${curvas(1080, 1920, 540, 960, W.curvas, 16, 70, 2)}<img src="${PJ('wicho_pulgar')}" style="position:relative;width:980px">`),
    bebidas: portada(W.lilaO, `${svgEsp(1080, 1920, 540, 960, 470, W.lila, 26)}${ico('bebidas', W.durazno, 340)}`),
    zonas: conCara(W.pelaje, 'wicho_asoma', 960, 70),
  },
  food: (d) => panelSig(d, { fondo: W.pelaje, tit: W.tinta, voz: W.tinta, resto: W.tinta, titular: '¡' + d.tit.replace(/\.$/, '') + '!', extra: curvas(1080, 430, 900, 380, W.curvas, 10, 60, 4) }),
  carta: caja(1080, 1350, `background:${W.durazno}`, `${curvas(1080, 1350, 880, 1150, '#E6C6B7', 18, 66, 1)}<img src="${PJ('wicho2_celebra')}" class="abs" style="right:10px;bottom:30px;height:640px">
    <div class="abs" style="left:96px;top:92px;right:84px"><div class="mono" style="font-size:26px;color:${W.lilaO}">LA CARTA · 15 CM Y 30 CM</div><div style="margin-top:40px">${listaCarta(W.tinta, 86)}</div>
    <div class="voz" style="font-size:56px;margin-top:36px;color:${W.lilaO}">¡Y el que armas tú!</div></div>`),
  pasos: caja(1080, 1350, `background:${W.pelaje};color:${W.tinta}`, `${curvas(1080, 1350, 900, 1150, W.curvas, 18, 66, 1)}<img src="${PJ('wicho_saluda')}" class="abs" style="right:20px;bottom:30px;height:510px">
    <div class="abs" style="left:96px;top:92px;right:96px"><div class="mono" style="font-size:26px">ASÍ DE FÁCIL</div><div class="disp" style="font-size:150px;margin-top:34px">¡Cuatro<br>pasos!</div>
    <div style="margin-top:50px;display:flex;flex-direction:column;gap:28px">${PASOS.map((t) => `<div style="display:flex;gap:24px;align-items:center"><svg width="72" height="72"><circle cx="36" cy="36" r="36" fill="${W.lilaO}"/>${espiral(36, 36, 29, W.lila, 4)}</svg><span class="voz" style="font-size:54px">${t}</span></div>`).join('')}</div></div>`),
  reel: caja(1080, 1350, `background:${W.lilaO};color:${W.durazno};${centrado};flex-direction:column;gap:26px;text-align:center;padding:120px`, `${svgEsp(1080, 1350, 540, 675, 560, 'rgba(195,166,210,.13)', 18)}<div class="disp" style="font-size:110px;position:relative">¡Detrás<br>del pan!</div><div class="voz" style="font-size:44px;position:relative">Aquí va tu video: el pan, la plancha y el armado.</div>`),
});

// ── 3 · SIN HERMANOS: «Lo que llega» puro. La comida manda; la marca es solo el //.
V.push({ id: '3-sin', nombre: 'Sin hermanos', idea: 'Solo el // (dorado y celeste) sobre el papel: la marca más simple, se lee a cualquier tamaño',
  avatar: caja(1080, 1080, `background:${papel};${centrado}`, barras(560)),
  dest: Object.fromEntries(['carta', 'pedir', 'bebidas', 'zonas'].map((k) => [k, portada(papel, ico(k, S.tinta, 520))])),
  food: (d) => caja(1080, 1350, `background:${S.tinta}`, `<div class="full" style="${foto(d.f, 'center')}"></div>
    <div class="abs" style="left:0;right:0;top:0;height:600px;background:linear-gradient(180deg,rgba(14,20,16,.82),rgba(14,20,16,.5) 55%,transparent)"></div>
    <div class="abs" style="left:0;right:0;bottom:0;height:300px;background:linear-gradient(0deg,rgba(14,20,16,.85),transparent)"></div>
    <div class="abs" style="left:84px;right:84px;top:76px"><div class="disp" style="font-size:${tam(d.tit, 130)}px;color:${papel}">${d.tit}</div><div class="voz" style="font-size:46px;margin-top:18px;color:${papel}">${d.voz}</div></div>
    <div class="abs" style="left:84px;right:84px;bottom:60px;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:26px;color:${papel}">${MONO}</div>${marca()}</div>`),
  carta: caja(1080, 1350, `background:${S.tinta}`, `<div class="abs" style="right:90px;bottom:70px">${barras(330)}</div>
    <div class="abs" style="left:96px;top:92px;right:84px"><div class="mono" style="font-size:26px;color:${papel}">LA CARTA · 15 CM Y 30 CM</div><div style="margin-top:40px">${listaCarta(papel, 92)}</div><div class="voz" style="font-size:54px;margin-top:36px;color:${papel}">Y el que armas tú.</div></div>`),
  pasos: caja(1080, 1350, `background:${papel};color:${S.tinta}`, `<div class="abs" style="left:96px;top:92px;right:96px"><div class="mono" style="font-size:26px">ASÍ DE FÁCIL</div><div class="disp" style="font-size:150px;margin-top:34px">Cuatro<br>pasos.</div>
    <div style="margin-top:56px;display:flex;flex-direction:column;gap:30px">${PASOS.map((t, i) => `<div style="display:flex;gap:30px;align-items:baseline"><span class="disp" style="font-size:84px;opacity:.35;width:56px">${i + 1}</span><span class="voz" style="font-size:58px">${t}</span></div>`).join('')}</div></div>
    <div class="abs" style="left:96px;right:96px;bottom:60px;display:flex;justify-content:space-between"><div class="mono" style="font-size:26px">${MONO}</div>${marca(S.tinta)}</div>`),
  reel: caja(1080, 1350, `background:${S.tinta};color:${papel};${centrado};flex-direction:column;gap:26px;text-align:center;padding:120px`, `<div class="disp" style="font-size:110px">Detrás<br>del pan</div><div class="voz" style="font-size:44px;opacity:.85">Aquí va tu video: el pan, la plancha y el armado.</div>`),
});

// ── 4 · MEZCLADOS: por turnos. Cada Signature alterna el mundo de uno y del otro, en damero.
const turno = (i) => (i % 2 === 0
  ? { fondo: S.oliva, clase: 'rib', tit: papel, voz: papel, resto: papel, extra: '' }
  : { fondo: W.pelaje, tit: W.tinta, voz: W.tinta, resto: W.tinta, extra: curvas(1080, 430, 880, 400, W.curvas, 10, 60, 4) });
V.push({ id: '4-mezclados', nombre: 'Mezclados', idea: 'Los dos juntos: SANDO a la izquierda sobre su oliva y WICHO a la derecha sobre su celeste, partidos al medio como el logo',
  avatar: caja(1080, 1080, '', `<div class="abs rib" style="left:0;top:0;bottom:0;width:540px;background-color:${S.oliva}"></div><div class="abs" style="right:0;top:0;bottom:0;width:540px;background:${W.pelaje}"></div>
    <img src="${PJ('sando2_sonrie')}" class="abs" style="left:-10px;bottom:-30px;height:760px"><img src="${PJ('wicho2_rie')}" class="abs" style="right:-20px;bottom:40px;height:640px">`),
  dest: {
    carta: conCara(S.oliva, 'sando2_frente', 1100, 40, 'rib'),
    pedir: conCara(W.pelaje, 'wicho2_rie', 860, 30),
    bebidas: conCara(W.durazno, 'wicho_asoma', 960, 70),
    zonas: conCara(S.verde, 'sando2_asoma', 1250, 80),
  },
  food: (d) => { const i = FOOD.indexOf(d); return panelSig(d, turno(i)); },
  carta: caja(1080, 1350, `background:${papel}`, `<img src="${PJ('sando2_cuerpo')}" class="abs" style="right:150px;bottom:-60px;height:780px;clip-path:inset(0 0 0 7%)"><img src="${PJ('wicho_saluda')}" class="abs" style="right:-30px;bottom:20px;height:430px">
    <div class="abs" style="left:96px;top:92px;right:84px"><div class="mono" style="font-size:26px;color:${S.oliva}">LA CARTA · 15 CM Y 30 CM</div><div style="margin-top:40px">${listaCarta(S.tinta, 84)}</div>
    <div class="voz" style="font-size:54px;margin-top:32px;color:#3F86B5">Y el que armas tú.</div></div>`),
  pasos: V[1] ? null : null,
  reel: null,
});
V[3].pasos = V[1].pasos; V[3].reel = V[0].reel;

// ── 5 · DESCOMPUESTOS: marcos. Ningún hermano dibujado; sus texturas enmarcan la foto.
const marco = (d, i) => { const s = i % 2 === 0; return caja(1080, 1350, `background-color:${s ? S.oliva : W.pelaje}`, `${s ? '<div class="full rib"></div>' : curvas(1080, 1350, 540, 1200, W.curvas, 16, 70, i)}
  <div class="abs" style="left:48px;right:48px;top:48px;height:860px;${foto(d.f)};border-radius:4px"></div>
  <div class="abs" style="left:84px;right:84px;top:950px;bottom:56px;display:flex;flex-direction:column;color:${s ? papel : W.tinta}">
    <div class="disp" style="font-size:${tam(d.tit, 100)}px">${d.tit}</div><div class="voz" style="font-size:40px;margin-top:12px">${d.voz}</div>
    <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:24px">${MONO}</div>${marca(s ? papel : W.tinta, 36)}</div></div>`); };
V.push({ id: '5-descompuestos', nombre: 'Descompuestos', idea: 'Un círculo partido por el //: la mitad acanalada de SANDO y la mitad de curvas de nivel de WICHO, sin dibujo',
  avatar: caja(1080, 1080, '', `<div class="abs rib" style="left:0;top:0;bottom:0;width:540px;background-color:${S.oliva}"></div><div class="abs" style="right:0;top:0;bottom:0;width:540px;background:${W.pelaje}">${curvas(540, 1080, 400, 540, W.curvas, 12, 56, 2)}</div>
    <div class="abs" style="left:0;right:0;top:0;bottom:0;${centrado}"><div style="width:150px;height:1200px;background:${papel};transform:skewX(-16deg)"></div></div><div class="abs" style="left:0;right:0;top:0;bottom:0;${centrado}">${barras(470)}</div>`),
  dest: {
    carta: portada(S.oliva, `<div class="full rib"></div>${ico('carta', papel)}`),
    pedir: portada(W.pelaje, `${curvas(1080, 1920, 540, 960, W.curvas, 16, 70, 2)}${ico('pedir', W.tinta)}`),
    bebidas: portada(W.lilaO, `${svgEsp(1080, 1920, 540, 960, 470, W.lila, 26)}${ico('bebidas', W.durazno, 340)}`),
    zonas: portada(S.verde, `<div class="abs" style="left:300px;top:0;bottom:0;width:60px;background:${S.forro}"></div>${ico('zonas', S.tan)}`),
  },
  food: (d) => marco(d, FOOD.indexOf(d)),
  carta: caja(1080, 1350, `background:${S.verde};color:${papel}`, `<div class="abs" style="left:0;top:0;bottom:0;width:26px;background:${S.forro}"></div><div class="abs rib" style="left:26px;right:0;bottom:0;height:150px;background-color:${S.oliva}"></div>
    <div class="abs" style="left:110px;right:84px;top:92px"><div class="mono" style="font-size:26px;color:${S.tan}">LA CARTA · 15 CM Y 30 CM</div><div style="margin-top:40px">${listaCarta(papel, 96)}</div>
    <div style="display:flex;align-items:center;gap:22px;margin-top:40px"><svg width="70" height="70">${espiral(35, 35, 31, W.lila, 5)}</svg><span class="voz" style="font-size:58px;color:${W.pelaje}">Y el que armas tú.</span></div></div>`),
  pasos: caja(1080, 1350, `background:${W.pelaje};color:${W.tinta}`, `${curvas(1080, 1350, 900, 1150, W.curvas, 18, 66, 1)}
    <div class="abs" style="left:96px;top:92px;right:96px"><div class="mono" style="font-size:26px">ASÍ DE FÁCIL</div><div class="disp" style="font-size:150px;margin-top:34px">Cuatro<br>pasos.</div>
    <div style="margin-top:56px;display:flex;flex-direction:column;gap:30px">${PASOS.map((t) => `<div style="display:flex;gap:26px;align-items:center"><svg width="76" height="76"><circle cx="38" cy="38" r="38" fill="${W.lilaO}"/>${espiral(38, 38, 30, W.lila, 4)}</svg><span class="voz" style="font-size:56px">${t}</span></div>`).join('')}</div></div>
    <div class="abs" style="left:96px;right:96px;bottom:56px;display:flex;justify-content:space-between"><div class="mono" style="font-size:26px">${MONO}</div>${marca(W.tinta, 40)}</div>`),
  reel: caja(1080, 1350, `background:${W.tinta};color:${papel};${centrado};flex-direction:column;gap:26px;text-align:center;padding:120px`, `<div class="full cruz"></div><div class="disp" style="font-size:110px;position:relative">Detrás<br>del pan</div><div class="voz" style="font-size:44px;color:${W.durazno};position:relative">Aquí va tu video: el pan, la plancha y el armado.</div>`),
});

// ── 6 · EL CORTE: el // como el corte del pan. La foto a la derecha; a la izquierda, el texto; entre
// los dos, las dos barras inclinadas.
const corte = (izq, colIzq, derecha, texto) => caja(1080, 1350, `background:${izq}`, `
  <div class="abs" style="left:300px;right:0;top:0;bottom:0;${derecha}"></div>
  <div class="abs" style="left:0;top:0;bottom:0;width:1080px;background:${izq};clip-path:polygon(0 0,600px 0,362px 1350px,0 1350px)"></div>
  <div class="abs" style="left:0;top:0;bottom:0;width:1080px;background:${S.oro};clip-path:polygon(612px 0,636px 0,398px 1350px,374px 1350px)"></div>
  <div class="abs" style="left:0;top:0;bottom:0;width:1080px;background:${celeste};clip-path:polygon(650px 0,674px 0,436px 1350px,412px 1350px)"></div>
  <div class="abs" style="left:72px;top:72px;width:420px;bottom:60px;display:flex;flex-direction:column;color:${colIzq}">${texto}</div>`);
V.push({ id: '6-el-corte', nombre: 'El corte', idea: 'La comida misma: un primer plano del Philly. En el feed se entiende al instante que vendemos sándwiches',
  avatar: caja(1080, 1080, `${foto('foto-philly.jpg', '42% 66%')};background-size:210%`, ''),
  dest: {
    carta: portada(S.tinta, `<div class="full" style="${foto('foto-philly.jpg', '40% 66%')};background-size:auto 150%"></div>`),
    pedir: portada(S.tinta, `<div class="full" style="${foto('foto-classic-tuna.jpg', '55% 40%')};background-size:auto 130%"></div>`),
    bebidas: portada(S.tinta, `<div class="full" style="${foto('foto-meatball-lata.jpg', '76% 30%')};background-size:auto 165%"></div>`),
    zonas: portada(S.tinta, `<div class="full" style="${foto('foto-turkey-v4.jpg', '50% 60%')};background-size:auto 130%"></div>`),
  },
  food: (d) => corte(S.verde, papel, foto(d.f, '58% 62%'), `<div class="disp" style="font-size:${Math.min(tam(d.tit, 104), 96)}px">${d.tit}</div><div class="voz" style="font-size:40px;margin-top:16px;color:${S.tan}">${d.voz}</div>
    <div style="margin-top:auto"><div class="mono" style="font-size:22px;margin-bottom:18px">${MONO}</div>${marca(papel, 34)}</div>`),
  carta: corte(S.verde, papel, `background:${papel}`, `<div class="mono" style="font-size:24px;color:${S.tan}">LA CARTA · 15 Y 30 CM</div><div style="margin-top:36px">${listaCarta(papel, 64)}</div><div class="voz" style="font-size:44px;margin-top:30px;color:${W.pelaje}">Y el que armas tú.</div><div style="margin-top:auto">${marca(papel, 34)}</div>`),
  pasos: corte(W.pelaje, W.tinta, foto('foto-classic-tuna.jpg', '62% 50%'), `<div class="mono" style="font-size:24px">ASÍ DE FÁCIL</div><div class="disp" style="font-size:104px;margin-top:28px">Cuatro<br>pasos.</div>
    <div style="margin-top:40px;display:flex;flex-direction:column;gap:20px">${PASOS.map((t, i) => `<div class="voz" style="font-size:40px"><b class="disp" style="font-weight:400;opacity:.5;margin-right:14px">${i + 1}</b>${t}</div>`).join('')}</div><div style="margin-top:auto">${marca(W.tinta, 34)}</div>`),
  reel: corte(S.verde, papel, `background:#2A332D`, `<div class="disp" style="font-size:96px">Detrás<br>del pan</div><div class="voz" style="font-size:40px;margin-top:20px;color:${S.tan}">Aquí va tu video: el pan, la plancha y el armado.</div>`),
});

// ── 7 · CON VOZ: ellos te lo recomiendan. La foto entera y una frase firmada por el hermano.
const firmada = (d, quien, color) => caja(1080, 1350, `background:${S.tinta}`, `<div class="full" style="${foto(d.f, 'center')}"></div>
  <div class="abs" style="left:0;right:0;top:0;height:620px;background:linear-gradient(180deg,rgba(14,20,16,.85),rgba(14,20,16,.5) 55%,transparent)"></div>
  <div class="abs" style="left:0;right:0;bottom:0;height:300px;background:linear-gradient(0deg,rgba(14,20,16,.85),transparent)"></div>
  <div class="abs" style="left:84px;right:84px;top:76px"><div class="disp" style="font-size:${tam(d.tit, 124)}px;color:${papel}">${d.tit}</div>
    <div class="voz" style="font-size:48px;margin-top:18px;color:${papel}">«${d.cita}»</div><div class="mono" style="font-size:26px;margin-top:12px;color:${color}">— ${quien} · ${d.nombre.toUpperCase()}</div></div>
  <div class="abs" style="left:84px;right:84px;bottom:60px;display:flex;justify-content:space-between;align-items:flex-end"><div class="mono" style="font-size:26px;color:${papel}">${MONO}</div>${marca()}</div>`);
V.push({ id: '7-con-voz', nombre: 'Con voz', idea: 'Los dos asomándose al círculo, uno por cada lado, con el // en medio: como si te miraran desde la puerta',
  avatar: caja(1080, 1080, `background:${papel}`, `<img src="${PJ('sando2_asoma')}" class="abs" style="left:-60px;bottom:-40px;height:900px"><img src="${PJ('wicho_asoma')}" class="abs" style="right:-70px;bottom:-20px;height:720px">
    <div class="abs" style="left:0;right:0;top:120px;${centrado}">${barras(170)}</div>`),
  dest: {
    carta: conCara(papel, 'sando2_frente', 1150, 40),
    pedir: conCara(W.pelaje, 'wicho2_rie', 860, 30),
    bebidas: conCara(W.lila, 'wicho_asoma', 960, 70),
    zonas: conCara(S.oliva, 'sando2_sonrie', 1150, 60, 'rib'),
  },
  food: (d) => firmada(d, 'SANDO', S.tan),
  carta: caja(1080, 1350, `background:${papel}`, `<img src="${PJ('sando2_cuerpo')}" class="abs" style="right:-6px;bottom:-60px;height:820px;clip-path:inset(0 0 0 7%)">
    <div class="abs" style="left:96px;top:92px;right:84px"><div class="mono" style="font-size:26px;color:${S.oliva}">LA CARTA · 15 CM Y 30 CM</div><div style="margin-top:36px">${listaCarta(S.tinta, 80)}</div>
    <div class="voz" style="font-size:46px;margin-top:30px;color:${S.oliva}">«Estos seis los cuido yo.» <span class="mono" style="font-size:24px">— SANDO</span></div>
    <div class="voz" style="font-size:46px;margin-top:10px;color:#3F86B5">«¡El séptimo lo armas tú!» <span class="mono" style="font-size:24px">— WICHO</span></div></div>`),
  pasos: caja(1080, 1350, `background:${W.pelaje};color:${W.tinta}`, `${curvas(1080, 1350, 900, 1150, W.curvas, 18, 66, 1)}<img src="${PJ('wicho_saluda')}" class="abs" style="right:20px;bottom:30px;height:510px">
    <div class="abs" style="left:96px;top:92px;right:96px"><div class="mono" style="font-size:26px">— WICHO</div><div class="disp" style="font-size:140px;margin-top:30px">Cuatro pasos<br>y listo.</div>
    <div style="margin-top:46px;display:flex;flex-direction:column;gap:26px">${PASOS.map((t, i) => `<div style="display:flex;gap:26px;align-items:baseline"><span class="disp" style="font-size:76px;color:${W.lilaO};width:52px">${i + 1}</span><span class="voz" style="font-size:54px">${t}</span></div>`).join('')}</div></div>`),
  reel: caja(1080, 1350, `background-color:${S.verde};color:${papel};${centrado};flex-direction:column;gap:26px;text-align:center;padding:120px`, `<div class="full rib" style="opacity:.6"></div><div class="disp" style="font-size:110px;position:relative">Detrás<br>del pan</div><div class="voz" style="font-size:46px;color:${S.tan};position:relative">«Así se hace.» — SANDO</div>`),
});

// ── Render
const ui = (dir) => `body{background:#fff;font-family:Archivo,sans-serif;color:#0B0B0B}
  .t{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px;font:800 19px Archivo}
  .cab{display:flex;align-items:center;gap:22px;padding:8px 16px}.av{width:86px;height:86px;border-radius:50%;background:url('${img(path.join(dir, 'foto-de-perfil.jpg'))}') center/cover;flex:none}
  .num{display:flex;flex:1;justify-content:space-around;text-align:center;font:700 16px Archivo}.num span{display:block;font:400 13px Archivo;color:#333}
  .bio{padding:4px 16px 0;font:400 14px/1.35 Archivo}.bio b{font-weight:800}.bio .cat{color:#737373}.bio a{color:#00376B;font-weight:600}
  .bt{display:flex;gap:6px;padding:12px 16px}.bt div{flex:1;height:32px;border-radius:8px;background:#EFEFEF;display:flex;align-items:center;justify-content:center;font:700 13px Archivo}.bt .az{background:#0095F6;color:#fff}
  .hl{display:flex;gap:16px;padding:4px 16px 12px}.h{width:66px;text-align:center;font:400 12px Archivo}
  .h i{display:block;width:66px;height:66px;border-radius:50%;border:1px solid #DBDBDB;padding:3px;margin-bottom:5px}.h i b{display:block;width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center}
  .tabs{display:flex;border-top:1px solid #DBDBDB}.tabs div{flex:1;height:44px;display:flex;align-items:center;justify-content:center}.tabs div:first-child{border-bottom:1.5px solid #0B0B0B}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.g{position:relative;aspect-ratio:3/4;background-size:cover;background-position:center}
  .g svg{position:absolute;top:7px;right:7px;filter:drop-shadow(0 0 2px rgba(0,0,0,.6))}`;
const pin = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M15 3l6 6-3 1-4 4 1 4-2 2-4-4-5 5-1-1 5-5-4-4 2-2 4 1 4-4z"/></svg>';
const rl = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
const DEST = [['carta', 'Carta'], ['pedir', 'Cómo pedir'], ['bebidas', 'Bebidas'], ['zonas', 'Zonas']];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage();
  const sacar = async (html, w, h, salida) => {
    await pg.setViewportSize({ width: w, height: h });
    const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, html);
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '800 40px "Archivo"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const faltan = await pg.evaluate(() => ['Anton', 'Archivo', 'IBM Plex Mono', 'Instrument Serif'].filter((f) => ![...document.fonts].some((x) => x.family.replace(/["']/g, '') === f && x.status === 'loaded')));
    if (faltan.length) throw new Error('faltan fuentes: ' + faltan);
    await pg.screenshot({ path: salida, type: 'jpeg', quality: 90 });
  };
  const soloV = process.env.SOLO ? process.env.SOLO.split(',') : null;
  for (const v of V) {
    if (soloV && !soloV.includes(v.id)) continue;
    const dir = path.join(OUT, v.id); fs.mkdirSync(dir, { recursive: true });
    await sacar(pagina(1080, 1080, v.avatar), 1080, 1080, path.join(dir, 'foto-de-perfil.jpg'));
    for (const [k] of DEST) await sacar(pagina(1080, 1920, v.dest[k]), 1080, 1920, path.join(dir, `destacado-${k}.jpg`));
    const posts = [
      { n: FOOD[0].n, html: v.food(FOOD[0]), fijada: true }, { n: '2-carta', html: v.carta, fijada: true }, { n: '3-como-pedir', html: v.pasos, fijada: true },
      ...FOOD.slice(1).map((d) => ({ n: d.n, html: v.food(d) })), { n: '9-reel-detras', html: v.reel, reel: true },
    ];
    for (const p of posts) { p.jpg = path.join(dir, `publicacion-${p.n}.jpg`); await sacar(pagina(1080, 1350, p.html), 1080, 1350, p.jpg); }
    const cuerpo = `<div style="width:390px"><div class="t"><span>snd__wch</span><span style="font-weight:400">≡</span></div>
      <div class="cab"><div class="av"></div><div class="num"><div>9<span>publicaciones</span></div><div>—<span>seguidores</span></div><div>—<span>seguidos</span></div></div></div>
      <div class="bio"><b>SND//WCH · Sándwiches</b><br><span class="cat">Restaurante de sándwiches</span><br>Sándwiches de pan largo, al estilo americano.<br>Armados al momento, a domicilio.<br>Abrimos en noviembre.<br><a>sndwch.app</a></div>
      <div class="bt"><div class="az">Seguir</div><div>Mensaje</div><div>WhatsApp</div></div>
      <div class="hl">${DEST.map(([k, t]) => `<div class="h"><i><b style="background-image:url('${img(path.join(dir, `destacado-${k}.jpg`))}')"></b></i>${t}</div>`).join('')}</div>
      <div class="tabs"><div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" stroke-width="1.8"><rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg></div><div>${rl.replace('#fff', '#737373')}</div><div></div></div>
      <div class="grid">${posts.map((p) => `<div class="g" style="background-image:url('${img(p.jpg)}')">${p.fijada ? pin : p.reel ? rl : ''}</div>`).join('')}</div></div>`;
    const tmp = path.join(OUT, '.tmp.html'); fs.writeFileSync(tmp, pagina(390, 1200, cuerpo, ui(dir)).replace('html,body{width:390px;height:1200px;overflow:hidden}', 'html,body{width:390px}'));
    await pg.setViewportSize({ width: 390, height: 1200 }); await pg.goto('file://' + tmp, { waitUntil: 'load' });
    const alto = await pg.evaluate(() => document.body.scrollHeight);
    const pg2 = await b.newPage({ viewport: { width: 390, height: alto }, deviceScaleFactor: 2 });
    await pg2.goto('file://' + tmp, { waitUntil: 'load' }); await pg2.evaluate(() => document.fonts.ready);
    await pg2.screenshot({ path: path.join(OUT, `perfil-${v.id}.jpg`), type: 'jpeg', quality: 88, fullPage: true }); await pg2.close();
    console.log('ok', v.id);
  }
  // Las 7 fotos de perfil juntas, como se ven en un círculo grande y uno chico.
  const fotos = V.map((v) => `<div style="width:250px;text-align:center;font:600 22px Archivo;color:#1E2B22">
    <div style="width:210px;height:210px;margin:0 auto 14px;border-radius:50%;background:url('${img(path.join(OUT, v.id, 'foto-de-perfil.jpg'))}') center/cover;border:1px solid #ddd"></div>
    <div style="width:40px;height:40px;margin:0 auto 14px;border-radius:50%;background:url('${img(path.join(OUT, v.id, 'foto-de-perfil.jpg'))}') center/cover"></div>${v.id.split('-')[0]} · ${v.nombre}</div>`).join('');
  await sacar(pagina(1820, 420, `<div style="width:1820px;height:420px;background:#fff;display:flex;justify-content:center;align-items:center;gap:6px">${fotos}</div>`), 1820, 420, path.join(OUT, 'fotos-de-perfil-7.jpg'));
  fs.rmSync(path.join(OUT, '.tmp.html'), { force: true }); await b.close();
  fs.writeFileSync(path.join(OUT, 'ideas.json'), JSON.stringify(V.map((v) => ({ id: v.id, nombre: v.nombre, idea: v.idea })), null, 1));
})();
