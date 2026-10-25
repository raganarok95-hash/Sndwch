// Tres lenguajes nuevos para «Arma el tuyo» (empieza con todo). Nada del sistema actual, ni el //.
const { chromium } = require('/home/user/Sndwch/node_modules/playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname;
const I = (f) => 'file:///home/user/Sndwch/img/' + f;
const FOTO = I('sig09_v.webp');
const PROT = [['Res', 'prot_p09.webp', true], ['Atún', 'prot_p04.webp'], ['Albóndiga', 'prot_p06.webp'], ['Pavo', 'prot_p08.webp'], ['Embutido', 'prot_p05.webp']];
const LLEVA = [['Pan Classic', 1], ['Cheddar', 1], ['Tomate', 1], ['Lechuga', 1], ['Cebolla morada', 0], ['Pepinillo', 1], ['Pickles', 1], ['Pimiento', 1], ['Mayonesa', 1], ['Honey mustard', 1]];
const head = (css) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="f3/f3.css"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:390px;height:844px;overflow:hidden}${css}</style></head><body>`;

// ── 1 · EL JUEGO ──────────────────────────────────────────────────────────────
const juego = head(`
body{background:#FFF6E5;color:#2B2247;font-family:'Nunito';font-weight:800}
.top{display:flex;align-items:center;gap:12px;padding:16px 18px 0}
.x{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-size:22px;color:#9C93B8}
.meter{flex:1;height:18px;border-radius:999px;background:#EDE3CF;position:relative;overflow:hidden}
.meter i{position:absolute;inset:0 4% 0 0;border-radius:999px;background:linear-gradient(180deg,#FFA24D,#FF7A1A);box-shadow:inset 0 -4px 0 rgba(0,0,0,.12)}
.meter i::after{content:"";position:absolute;left:10px;right:10px;top:4px;height:4px;border-radius:999px;background:rgba(255,255,255,.55)}
.lvl{font-weight:900;font-size:13px;color:#FF7A1A;white-space:nowrap}
.card{margin:16px 18px 0;height:268px;border-radius:24px;border:3px solid #2B2247;box-shadow:0 6px 0 #2B2247;background:url('${FOTO}') center 35%/cover;position:relative}
.badge{position:absolute;right:-8px;top:-12px;background:#FFD84D;border:3px solid #2B2247;border-radius:14px;padding:6px 12px;font-weight:900;font-size:15px;transform:rotate(6deg);box-shadow:0 4px 0 #2B2247}
.ej{position:absolute;left:10px;bottom:10px;background:rgba(43,34,71,.75);color:#fff;font-size:9px;letter-spacing:.06em;border-radius:8px;padding:4px 8px}
.say{margin:18px 18px 0;font-weight:900;font-size:22px;line-height:1.15}
.say span{color:#7B4DFF}
.rail{display:flex;gap:10px;padding:14px 18px 0}
.p{flex:none;width:64px;text-align:center;font-size:11px}
.p div{width:64px;height:64px;border-radius:16px;border:3px solid #E4DAC6;box-shadow:0 4px 0 #E4DAC6;background-size:cover;background-position:center;margin-bottom:6px}
.p.on div{border-color:#7B4DFF;box-shadow:0 4px 0 #5A31D6}
.grid{display:flex;flex-wrap:wrap;gap:8px;padding:16px 18px 0}
.t{height:40px;padding:0 14px;border-radius:14px;display:flex;align-items:center;gap:6px;font-size:13px;border:2.5px solid #2B2247;box-shadow:0 4px 0 #2B2247;background:#fff}
.t.on::before{content:"✓";color:#20C997;font-weight:900}
.t.off{border-color:#D9CFBB;box-shadow:0 4px 0 #D9CFBB;color:#B3A98F;text-decoration:line-through}
.cta{position:absolute;left:18px;right:18px;bottom:22px;display:flex;gap:10px}
.sz{width:96px;height:62px;border-radius:18px;border:3px solid #2B2247;box-shadow:0 5px 0 #2B2247;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:18px;font-weight:900}
.sz small{font-size:11px;color:#9C93B8}
.go{flex:1;height:62px;border-radius:18px;background:#20C997;border:3px solid #2B2247;box-shadow:0 5px 0 #2B2247;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-weight:900;font-size:20px;text-shadow:0 2px 0 rgba(0,0,0,.18)}
.fade{position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(180deg,rgba(255,246,229,0),#FFF6E5 45%)}
`) + `
<div class="top"><div class="x">✕</div><div class="meter"><i></i></div><div class="lvl">ANTOJO 96%</div></div>
<div class="card"><div class="badge">¡CON TODO!</div><div class="ej">FOTO DE EJEMPLO</div></div>
<div class="say">Te lo armé con todo.<br><span>Toca lo que no quieras y se va.</span></div>
<div class="rail">${PROT.map(([n, f, on]) => `<div class="p${on ? ' on' : ''}"><div style="background-image:url('${I(f)}')"></div>${n}</div>`).join('')}</div>
<div class="grid">${LLEVA.map(([n, on]) => `<div class="t ${on ? 'on' : 'off'}">${n}</div>`).join('')}</div>
<div class="fade"></div>
<div class="cta"><div class="sz">15 cm<small>30 cm →</small></div><div class="go"><span>¡LO QUIERO!</span><span>S/19.90</span></div></div>
</body></html>`;

// ── 2 · STREETWEAR / REVISTA ─────────────────────────────────────────────────
const calle = head(`
body{background:#0B0B0B;color:#F2F0EB;font-family:'Barlow';font-weight:500}
.cond{font-family:'Barlow Condensed';font-style:italic;font-weight:900;text-transform:uppercase;letter-spacing:-.01em}
.hero{position:absolute;left:0;top:0;width:390px;height:470px;background:url('${FOTO}') center 30%/cover;filter:contrast(1.12) saturate(1.05)}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,11,.5) 0%,rgba(11,11,11,0) 25%,rgba(11,11,11,0) 60%,#0B0B0B 100%)}
.top{position:absolute;left:18px;right:18px;top:16px;display:flex;justify-content:space-between;font-family:'Barlow';font-weight:700;font-size:11px;letter-spacing:.18em;text-transform:uppercase;z-index:2}
.big{position:absolute;left:14px;top:330px;font-size:112px;line-height:.82;z-index:2}
.big span{color:#FF3B1F}
.kick{position:absolute;left:18px;top:300px;font-family:'Barlow';font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;background:#FF3B1F;color:#0B0B0B;padding:5px 9px;z-index:2}
.ej{position:absolute;right:18px;top:300px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#9A968F;z-index:2}
.tabs{position:absolute;left:18px;right:0;top:534px;display:flex;gap:18px;font-size:28px;white-space:nowrap}
.tabs .off{color:#4A4844}.tabs .on{border-bottom:5px solid #FF3B1F;padding-bottom:2px}
.lista{position:absolute;left:18px;right:18px;top:592px;font-size:22px;line-height:1.08;column-count:2;column-gap:14px}
.lista div{break-inside:avoid}
.lista .off{color:#4A4844;text-decoration:line-through;text-decoration-thickness:4px;text-decoration-color:#FF3B1F}
.nota{position:absolute;left:18px;top:722px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9A968F}
.bar{position:absolute;left:0;right:0;bottom:0;height:78px;display:flex}
.sz{width:150px;display:flex;align-items:center;justify-content:center;gap:12px;border-top:1px solid #2A2826}
.sz .n{font-size:40px}.sz .o{font-size:40px;color:transparent;-webkit-text-stroke:1.5px #6A6762}
.go{flex:1;background:#FF3B1F;color:#0B0B0B;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:26px;white-space:nowrap}
`) + `
<div class="hero"></div>
<div class="top"><span>← Volver</span><span>Arma el tuyo</span><span>Y además</span></div>
<div class="kick">Edición: la tuya</div><div class="ej">foto de ejemplo</div>
<div class="big cond">Con<br>todo<span>.</span></div>
<div class="tabs cond">${PROT.map(([n, , on]) => `<span class="${on ? 'on' : 'off'}">${n}</span>`).join('')}</div>
<div class="lista cond">${LLEVA.map(([n, on]) => `<div class="${on ? '' : 'off'}">${n}</div>`).join('')}</div>
<div class="nota">Tacha lo que no quieras · lo picante va aparte</div>
<div class="bar cond"><div class="sz"><span class="n">15</span><span class="o">30</span></div><div class="go"><span>Lo quiero</span><span>S/19.90 →</span></div></div>
</body></html>`;

// ── 3 · JUGUETE 3D ───────────────────────────────────────────────────────────
const toy = head(`
body{background:linear-gradient(165deg,#FFD9CC 0%,#FFC9E3 48%,#FFF0B8 100%);color:#5B2340;font-family:'Fredoka';font-weight:600}
.top{display:flex;justify-content:space-between;align-items:center;padding:16px 18px 0;font-size:15px}
.bt{width:40px;height:40px;border-radius:14px;background:#fff;box-shadow:0 6px 14px rgba(160,60,100,.18),inset 0 -3px 0 #FFD3E6;display:grid;place-items:center}
.box{margin:14px 26px 0;height:400px;border-radius:36px;position:relative;
  background:linear-gradient(160deg,#FF8FC2 0%,#FF6FAE 55%,#F0559A 100%);
  box-shadow:0 26px 40px rgba(200,60,120,.35),inset 0 6px 0 rgba(255,255,255,.45),inset 0 -10px 0 rgba(150,20,80,.25)}
.lab{position:absolute;left:22px;right:22px;top:18px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:13px;letter-spacing:.04em}
.lab b{background:#FFF0B8;color:#C2185B;border-radius:999px;padding:4px 10px;font-size:11px}
.win{position:absolute;left:22px;right:22px;top:54px;height:250px;border-radius:26px;background:url('${FOTO}') center 35%/cover;
  box-shadow:inset 0 0 0 6px rgba(255,255,255,.55),inset 0 14px 30px rgba(255,255,255,.35),0 8px 0 rgba(150,20,80,.25)}
.win::after{content:"";position:absolute;left:18px;top:14px;width:120px;height:46px;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0));transform:rotate(-12deg)}
.ej{position:absolute;right:30px;top:276px;font-size:9px;color:#fff;background:rgba(91,35,64,.55);border-radius:999px;padding:3px 8px}
.nom{position:absolute;left:22px;right:22px;bottom:20px;color:#fff}
.nom h1{font-weight:700;font-size:28px;line-height:1}.nom p{font-weight:500;font-size:13px;opacity:.9;margin-top:4px}
.caps{display:flex;flex-wrap:wrap;gap:8px;padding:20px 22px 0}
.c{height:38px;padding:0 14px;border-radius:999px;display:flex;align-items:center;font-size:13px;color:#fff;
  box-shadow:inset 0 3px 0 rgba(255,255,255,.5),inset 0 -4px 0 rgba(0,0,0,.12),0 6px 12px rgba(160,60,100,.18)}
.c.off{background:rgba(255,255,255,.45)!important;color:#C9A0B5;box-shadow:inset 0 0 0 2px rgba(255,255,255,.8);text-decoration:line-through}
.cta{position:absolute;left:22px;right:22px;bottom:22px;display:flex;gap:10px}
.sz{display:flex;background:#fff;border-radius:22px;padding:5px;box-shadow:0 8px 16px rgba(160,60,100,.18)}
.sz div{width:56px;height:52px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:15px}
.sz .on{background:#FFF0B8;color:#C2185B;box-shadow:inset 0 -3px 0 #F5D46A}
.sz small{font-size:9px;font-weight:500}
.go{flex:1;border-radius:22px;background:linear-gradient(180deg,#7EE8C6,#3CCB9C);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:18px;
  box-shadow:inset 0 4px 0 rgba(255,255,255,.5),inset 0 -5px 0 rgba(0,90,60,.25),0 10px 18px rgba(40,160,120,.35)}
`) + `
<div class="top"><div class="bt">‹</div><span>Arma el tuyo</span><div class="bt">⋯</div></div>
<div class="box"><div class="lab"><span>SERIE ARMA EL TUYO</span><b>ÚNICO · 1 DE 1</b></div><div class="win"></div><div class="ej">foto de ejemplo</div>
  <div class="nom"><h1>Con todo, de fábrica</h1><p>Res laminada · 15 cm · quítale lo que no quieras</p></div></div>
<div class="caps">${LLEVA.map(([n, on], i) => `<div class="c ${on ? '' : 'off'}" style="background:${['#FFB35C', '#FF8A3D', '#FF6B6B', '#5FD38D', '#B57BDB', '#8FD16A', '#6CC18A', '#46B37A', '#F2C14E', '#E7A72A'][i]}">${n}</div>`).join('')}</div>
<div class="cta"><div class="sz"><div class="on">15<small>cm</small></div><div>30<small>cm</small></div></div><div class="go"><span>¡Lo quiero!</span><span>S/19.90</span></div></div>
</body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const [k, html] of [['juego', juego], ['calle', calle], ['juguete', toy]]) {
    const f = path.join(DIR, `tres-${k}.html`); fs.writeFileSync(f, html);
    await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(DIR, `tres-${k}.png`) });
  }
  await b.close();
})();
