// Arma las historias de la guía «Cómo pedir» con las capturas reales de capturas.spec.ts.
// Cada historia (1080 × 1920): arriba la instrucción; a la izquierda el celular con la pantalla real y un aro en lo que
// hay que tocar; a la derecha una lupa que amplía esa zona. Todo queda entre los 250 px de arriba y los 270 de abajo,
// que en una historia tapan el nombre de la cuenta y la barra de «Enviar mensaje». Colores del destacado «Cómo pedir».
//   ./node_modules/.bin/playwright test -c scripts/guia-pedir/playwright.config.ts   (las capturas: no se commitean)
//   FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) node scripts/guia-pedir/componer.cjs
// Sale en docs/marketing/instagram-perfil/final/historias/historia-como-pedir-paso-NN.jpg (y en publicar.json).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const D = __dirname, REPO = path.resolve(D, '../..');
const CAP = path.join(D, 'capturas'), OUT = path.join(D, 'historias');
// Las historias que se suben: JPEG a calidad 95 sin submuestreo de color, junto a las demás historias del perfil.
const FINAL = path.join(REPO, 'docs/marketing/instagram-perfil/final/historias');
const PY_PIL = ['python3', '/usr/bin/python3', 'python3.13', 'python3.12'].find((p) => { try { execFileSync(p, ['-c', 'from PIL import Image'], { stdio: 'ignore' }); return true; } catch (e) { return false; } });
if (!PY_PIL) throw new Error('no hay un python con PIL para pasar las historias a JPEG');
fs.mkdirSync(OUT, { recursive: true });
const FUENTES = fs.readFileSync(process.env.FUENTES_CSS, 'utf8');
const pasos = JSON.parse(fs.readFileSync(path.join(CAP, 'pasos.json'), 'utf8'));
// El número de Yape sale del código, no se escribe (reglas.ts).
const YAPE = (fs.readFileSync(path.join(REPO, 'supabase/functions/_shared/reglas.ts'), 'utf8').match(/YAPE_NUMERO_COBRO = "(\d+)"/) || [])[1];
if (!YAPE) throw new Error('no encontré YAPE_NUMERO_COBRO en reglas.ts');
const yape = YAPE.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');

const C = { pelaje: '#90CCF0', curvas: '#7DB6DA', tinta: '#1E2F3A', forro: '#D8823C', papel: '#EFE6D4', oro: '#CBA258', celeste: '#8CC8EC' };
const TEXTO = {
  '01-puerta': ['Entra a sndwch.app', 'Toca «Ya está resuelto» para ver los de la casa. Si prefieres armar el tuyo, toca «Tú decides».'],
  '02-carta': ['Elige tu carta', 'Desliza para ver los seis y toca el que se te antoje.'],
  '03-platos': ['Toca «Lo quiero»', 'Aquí ves qué lleva y cuánto cuesta.'],
  '04-tamano': ['Elige el tamaño', '15 cm o 30 cm. El de 15 es la mitad del de 30.'],
  '05-agregar': ['Toca «Lo quiero»', 'Si algo no te gusta, quítalo antes en «¿Le quitas algo?».'],
  '06-bebida': ['¿Algo para tomar?', 'Agrega una bebida a precio de combo, o toca «Sigo sin bebida».'],
  '07-resumen': ['¿A nombre de quién?', 'En tu pedido, toca «Poner» al lado de «¿A nombre de quién?».'],
  '08-recibe': ['Tu nombre y tu celular', 'Escríbelos: son solo para avisarte y para que el motorizado te ubique. Después, toca «Listo».'],
  '09-direccion': ['¿Dónde te lo dejamos?', 'Toca «Elegir» al lado de «¿Dónde te lo dejamos?».'],
  '09b-mapa': ['Marca tu puerta en el mapa', 'Toca «Marcar en el mapa», mueve el pin hasta tu puerta y confirma. El envío se calcula por distancia.'],
  '10-pagar': ['Revisa y toca «Pagar»', 'Ves el total con el envío antes de pagar.'],
  '11-yape': ['Paga con Yape', `Escanea el QR o yapea al ${yape}: tócalo para copiarlo. ¿Prefieres tarjeta? Toca «Prefiero tarjeta».`],
  '12-ya-pague': ['Toca «Ya pagué»', 'Cuando confirmamos tu Yape, tu pedido entra a la cocina.'],
  '13-listo': ['¡Listo, ya está en la cocina!', 'Toca «Seguir el pedido» para ver cuándo llega.'],
};

// Las curvas de nivel de WICHO (las mismas de los destacados), tono sobre tono.
function curvas(w, h, cx, cy, color, n = 22, paso = 70, sem = 2) {
  let s = '';
  for (let k = 1; k <= n; k++) {
    const p = [];
    for (let i = 0; i <= 180; i++) { const t = (i / 180) * 2 * Math.PI; const r = k * paso * (1 + 0.09 * Math.sin(3 * t + k * 0.35 + sem) + 0.05 * Math.sin(5 * t + 1.7 * sem) + 0.03 * Math.sin(2 * t - k * 0.2)); p.push(`${(cx + r * Math.cos(t) * 1.15).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`); }
    s += `<polygon points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
  }
  return `<svg style="position:absolute;left:0;top:0" width="${w}" height="${h}">${s}</svg>`;
}

// El celular: la captura a escala K, con su marco.
const VW = 390, VH = 844, K = 1.13, PX = 64, PY = 690;
const TELW = VW * K, TELH = VH * K;
function historia(p, i, total) {
  // Anton no trae «»: en el titular el nombre del botón va sin comillas.
  const [titulo0, frase] = TEXTO[p.n];
  const titulo = titulo0.replace(/[«»]/g, '');
  const png = 'file://' + path.join(CAP, p.n + '.png');
  const c = p.caja;
  // El aro sobre el celular.
  const pad = 6;
  const aro = c && { x: PX + (c.x - pad) * K, y: PY + (c.y - pad) * K, w: (c.width + pad * 2) * K, h: (c.height + pad * 2) * K };
  // La lupa: la zona del objetivo, con margen, ampliada hasta 480 px de ancho (como mucho 2.6×). Si el paso trae
  // `zona` (lo que hay que llenar, distinto de lo que se toca), la lupa amplía esa zona y la marca con una línea punteada.
  let lupa = '';
  if (c) {
    const m = 18;
    const zona = p.zona;
    // Un objetivo muy alto (la mitad de la puerta) se amplía solo en su parte de abajo, donde está el texto del botón.
    const z = zona || (c.height > 400 ? { x: c.x, y: c.y + c.height - 200, width: c.width, height: 200 } : c);
    const zx = Math.max(0, z.x - m), zy = Math.max(0, z.y - m);
    const zw = Math.min(VW - zx, z.width + m * 2), zh = Math.min(VH - zy, z.height + m * 2);
    const esc = Math.min(2.6, 480 / zw, 560 / zh);
    const lw = zw * esc, lh = zh * esc;
    const lx = 1080 - 56 - lw;
    const centro = zona || c.height > 400 ? PY + (z.y + z.height / 2) * K : aro.y + aro.h / 2;
    const desde = zona ? PX + (z.x + z.width) * K : aro.x + aro.w;
    const ly = Math.min(Math.max(centro - lh / 2, 700), 1640 - lh);
    const marcaZona = zona ? `<div style="position:absolute;left:${PX + z.x * K}px;top:${PY + z.y * K}px;width:${z.width * K}px;height:${z.height * K}px;border:5px dashed ${C.forro};border-radius:14px"></div>` : '';
    lupa = `${marcaZona}<svg style="position:absolute;left:0;top:0" width="1080" height="1920"><path d="M${desde},${centro} C${(desde + lx) / 2},${centro} ${(desde + lx) / 2},${ly + lh / 2} ${lx},${ly + lh / 2}" fill="none" stroke="${C.forro}" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"/></svg>
      <div style="position:absolute;left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px;border-radius:18px;overflow:hidden;border:6px solid ${C.forro};box-shadow:0 24px 50px rgba(30,47,58,.35);background:url('${png}') ${-zx * esc}px ${-zy * esc}px/${VW * esc}px ${VH * esc}px no-repeat"></div>
      <div style="position:absolute;left:${lx}px;top:${ly + lh + 14}px;width:${lw}px;text-align:center;font:600 24px 'IBM Plex Mono';letter-spacing:.08em;color:${C.tinta}">${zona ? 'LLENA ESTO' : 'AQUÍ'}</div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}
    *{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1920px;overflow:hidden;background:${C.pelaje}}
    .mono{font-family:'IBM Plex Mono',monospace;font-weight:600;letter-spacing:.06em}
    .disp{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.95;text-wrap:balance}
    .voz{font-family:'Instrument Serif',serif;font-style:italic}</style></head><body>
    ${curvas(1080, 1920, 540, 1500, C.curvas)}
    <div style="position:absolute;left:72px;right:72px;top:250px;color:${C.tinta}">
      <div class="mono" style="font-size:28px">CÓMO PEDIR · PASO ${i + 1} DE ${total}</div>
      <div class="disp" style="font-size:${titulo.length > 22 ? 84 : 100}px;margin-top:16px">${titulo}</div>
      <div class="voz" style="font-size:44px;line-height:1.15;margin-top:16px">${frase}</div></div>
    <div style="position:absolute;left:${PX - 14}px;top:${PY - 14}px;width:${TELW + 28}px;height:${TELH + 28}px;border-radius:52px;background:${C.tinta};box-shadow:0 30px 60px rgba(30,47,58,.35)"></div>
    <div style="position:absolute;left:${PX}px;top:${PY}px;width:${TELW}px;height:${TELH}px;border-radius:40px;overflow:hidden;background:url('${png}') 0 0/${TELW}px ${TELH}px no-repeat"></div>
    ${aro ? `<div style="position:absolute;left:${aro.x}px;top:${aro.y}px;width:${aro.w}px;height:${aro.h}px;border:7px solid ${C.forro};border-radius:16px;box-shadow:0 0 0 6px rgba(216,130,60,.28)"></div>
      <div style="position:absolute;left:${Math.max(16, aro.x - 30)}px;top:${Math.max(PY - 20, aro.y - 30)}px;width:60px;height:60px;border-radius:999px;background:${C.forro};color:#fff;display:flex;align-items:center;justify-content:center;font:400 34px Anton">${i + 1}</div>` : ''}
    ${lupa}
  </body></html>`;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const tmp = path.join(OUT, '.h.html');
  for (const [i, p] of pasos.entries()) {
    fs.writeFileSync(tmp, historia(p, i, pasos.length));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(async () => { await Promise.all(['400 40px "Anton"', '600 40px "IBM Plex Mono"', 'italic 400 40px "Instrument Serif"'].map((f) => document.fonts.load(f))); });
    const nn = String(i + 1).padStart(2, '0'), png = path.join(OUT, `paso-${nn}.png`);
    await pg.screenshot({ path: png });
    execFileSync(PY_PIL, ['-c', "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=95,subsampling=0)", png, path.join(FINAL, `historia-como-pedir-paso-${nn}.jpg`)]);
  }
  fs.rmSync(tmp, { force: true }); await b.close();
  console.log('historias', pasos.length);
})();
