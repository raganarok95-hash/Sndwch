# -*- coding: utf-8 -*-
"""Genera los DOS documentos desde el modelo v8. Ningún número se escribe a mano.

  propuesta-negocio.html  → para el amigo: 5 escenarios, solo tablas, sin términos de trato
  analisis-6-meses.html   → para el dueño: 3 escenarios + el camino a S/5,000 netos

Los 5 escenarios usan el MISMO presupuesto (S/1,500) a propósito: así lo único que los
separa es lo que de verdad es incierto (repetición, CAC, % de pedidos grupales), y no una
decisión del dueño disfrazada de escenario.
"""
import numpy as np, io
from scipy import optimize
from datetime import date, timedelta

CONTRIB_PEDIDO, CONTRIB_SW, FIJOS, CAP_DIA = 16.42, 16.16, 500.0, 40
COSTO_SW = 22.10 - CONTRIB_SW
DIAS_ENTRE, E_DADO_2, SW_GRUPAL = 33.0, 6.93, 6
PRESU = 1500.0
META = 5000.0

def dias_op(a, m, desde=None):
    d = date(a, m, 1) if desde is None else desde; n = 0
    while d.month == m:
        if d.weekday() != 0: n += 1
        d += timedelta(days=1)
    return n
MESES = [(2026,9),(2026,10),(2026,11),(2026,12),(2027,1),(2027,2)]
DIAS = [dias_op(2026,9,date(2026,9,7))] + [dias_op(a,m) for a,m in MESES[1:]]
ETIQ = ['Setiembre','Octubre','Noviembre','Diciembre','Enero','Febrero']

def calibrar(r1, n=500):
    boa = r1/(1-r1)
    def S(a):
        b = boa*a; j = np.arange(1, n+1)
        return np.cumprod((b+j-1)/(a+b+j-1))
    return S(optimize.brentq(lambda x: 1 + S(x).sum()/S(x)[0] - E_DADO_2, 1e-4, 200))

def perfil(S, H=6):
    p = np.zeros(H); prob = 1.0; k = 1
    while k <= len(S) and prob > 1e-6:
        m = int(((k-1)*DIAS_ENTRE)//30.44)
        if m >= H: break
        p[m] += prob; prob *= S[k-1]/(S[k-2] if k >= 2 else 1.0); k += 1
    return p

def contrib_medio(g): return (1-g)*CONTRIB_PEDIDO + g*(SW_GRUPAL*CONTRIB_SW - COSTO_SW)
def cac_mix(cac, pr): return (1-pr)*cac + pr*7.65

def corrida(B, r1, cac, g, H=6):
    S = calibrar(r1); pf = perfil(S, H); c = contrib_medio(g)
    ped = np.zeros(H)
    for m in range(H):
        for k in range(H-m): ped[m+k] += (B/cac)*pf[k]
    ped = np.minimum(ped, np.array(DIAS)*CAP_DIA)
    return ped, ped*c - FIJOS - B

def presu_para(meta, r1, cac, g, mes=3):
    Bs = np.arange(100, 30_001, 50.0)
    n = np.array([corrida(B, r1, cac, g)[1][mes] for B in Bs])
    return None if n.max() < meta else float(Bs[np.argmax(n >= meta)])

# nombre, P(2º pedido), CAC publicidad, % pedidos grupales, % clientes por referido
ESC5 = [
    ('Muy pesimista', 0.226, 25.23, 0.00, 0.00),
    ('Pesimista',     0.226, 19.00, 0.05, 0.20),
    ('Base',          0.280, 13.50, 0.10, 0.20),
    ('Optimista',     0.340, 11.00, 0.15, 0.40),
    ('Muy optimista', 0.400, 10.51, 0.20, 0.40),
]
ESC3 = [ESC5[1], ESC5[2], ESC5[3]]

def calc(esc, B=PRESU):
    out = []
    for nom, r1, cac, g, pr in esc:
        cm = cac_mix(cac, pr)
        ped, neto = corrida(B, r1, cm, g)
        S = calibrar(r1)
        out.append(dict(nombre=nom, r1=r1, cac=cac, cm=cm, g=g, pr=pr, presu=B,
                        contrib=contrib_medio(g), ltv=(1+S.sum())*contrib_medio(g),
                        pxc=1+S.sum(), ped=ped, neto=neto, acum=np.cumsum(neto),
                        techo=max(ped[i]/DIAS[i] for i in range(6))/CAP_DIA*100,
                        b5000=presu_para(META, r1, cm, g)))
    return out

E5, E3 = calc(ESC5), calc(ESC3)

def s(n): return ('−S/' if n < 0 else 'S/') + '{:,.0f}'.format(abs(n)).replace(',', ' ')
COL = ['#8FA6A0', '#B4C2A8', '#E9C98A', '#F0D9A0', '#FFE9B8']

def t_resumen(E, cols):
    h = ['<table class="t"><thead><tr><th class="l">Escenario</th>'
         + ''.join('<th>%s</th>' % e['nombre'] for e in E) + '</tr></thead><tbody>']
    for nom, vals, cls in [
        ('Pedidos por día · Febrero', ['%.1f' % (e['ped'][5]/DIAS[5]) for e in E], ''),
        ('Pedidos en el mes · Febrero', ['{:,.0f}'.format(e['ped'][5]).replace(',', ' ') for e in E], ''),
        ('Utilidad neta · Febrero', [s(e['neto'][5]) for e in E], 'big'),
        ('Utilidad neta acumulada · 6 meses', [s(e['acum'][5]) for e in E], 'big'),
        ('Uso de la capacidad instalada', ['%.0f %%' % e['techo'] for e in E], 'soft'),
    ]:
        h.append('<tr class="%s"><td class="l">%s</td>' % (cls, nom)
                 + ''.join('<td class="%s" style="color:%s">%s</td>'
                           % ('neg' if v.startswith('−') else '', cols[i], v)
                           for i, v in enumerate(vals)) + '</tr>')
    return ''.join(h) + '</tbody></table>'

def t_params(E):
    h = ['<table class="t"><thead><tr><th class="l">Supuesto</th>'
         + ''.join('<th>%s</th>' % e['nombre'] for e in E) + '</tr></thead><tbody>']
    for nom, vals in [
        ('Clientes que repiten', ['%.1f %%' % (e['r1']*100) for e in E]),
        ('Pedidos por cliente', ['%.2f' % e['pxc'] for e in E]),
        ('Pedidos grupales', ['%.0f %%' % (e['g']*100) for e in E]),
        ('Contribución por pedido', ['S/%.2f' % e['contrib'] for e in E]),
        ('Clientes por referido', ['%.0f %%' % (e['pr']*100) for e in E]),
        ('Costo de traer un cliente', ['S/%.2f' % e['cm'] for e in E]),
        ('Valor de un cliente', ['S/%.0f' % e['ltv'] for e in E]),
        ('Inversión en publicidad · mes', [s(e['presu']) for e in E]),
    ]:
        h.append('<tr><td class="l">%s</td>' % nom + ''.join('<td>%s</td>' % v for v in vals) + '</tr>')
    return ''.join(h) + '</tbody></table>'

def t_mes(e):
    h = ['<table class="t sm"><thead><tr><th class="l">%s</th>' % e['nombre']
         + ''.join('<th>%s</th>' % m[:3] for m in ETIQ) + '</tr></thead><tbody>']
    for nom, vals in [
        ('Pedidos', ['{:,.0f}'.format(x).replace(',', ' ') for x in e['ped']]),
        ('Pedidos por día', ['%.1f' % (e['ped'][i]/DIAS[i]) for i in range(6)]),
        ('Utilidad neta del mes', [s(x) for x in e['neto']]),
        ('Acumulado', [s(x) for x in e['acum']]),
    ]:
        h.append('<tr><td class="l">%s</td>' % nom
                 + ''.join('<td class="%s">%s</td>' % ('neg' if v.startswith('−') else '', v)
                           for v in vals) + '</tr>')
    return ''.join(h) + '</tbody></table>'

CSS = u"""
:root{--bg:#1E3932;--panel:#2D5246;--line:#3A6B58;--gold:#E9C98A;--gold2:#CBA258;
--cream:#F2F0EB;--mut:#A8C8B0;--neg:#E58B7B}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--cream);font-family:'EB Garamond',Georgia,serif;
font-variant-numeric:lining-nums tabular-nums;line-height:1.55;padding:0 0 64px}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{padding:56px 0 36px;border-bottom:1px solid var(--line);margin-bottom:40px}
.wm{font-family:'Fraunces',serif;font-weight:620;font-size:clamp(34px,7vw,54px);
letter-spacing:.01em;display:inline-flex;align-items:center;color:#fff}
.wm-mark{display:inline-flex;align-items:center;gap:.13em;margin:0 .08em;vertical-align:-.04em}
.wm-mark i{display:inline-block;width:.15em;height:.82em;
background:linear-gradient(180deg,var(--gold),var(--gold2));transform:skewX(-16deg);border-radius:1px}
.sub{font-family:'Fraunces',serif;font-size:13px;letter-spacing:.2em;text-transform:uppercase;
color:var(--gold);margin-top:14px}
.date{color:var(--mut);font-style:italic;font-size:15px;margin-top:6px}
h2{font-family:'Fraunces',serif;font-weight:600;font-size:20px;letter-spacing:.02em;
color:#fff;margin:44px 0 4px;display:flex;align-items:center;gap:10px}
/* Regla decorativa, NO el mark: sin sesgo a propósito — una sola barra sesgada se leería
   como medio "//", y el "//" de la marca son dos barras idénticas que no se reinterpretan. */
h2::before{content:"";width:3px;height:20px;background:linear-gradient(180deg,var(--gold),var(--gold2));
border-radius:1px;flex:none}
.hint{color:var(--mut);font-style:italic;font-size:14px;margin:0 0 16px 13px}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);
border-radius:12px;background:var(--panel);margin-bottom:16px}
table.t{width:100%;border-collapse:collapse;font-size:15px;min-width:660px}
table.t.sm{font-size:14px;min-width:600px}
table.t th,table.t td{padding:11px 14px;text-align:right;white-space:nowrap;
border-bottom:1px solid rgba(58,107,88,.55)}
table.t tbody tr:last-child td{border-bottom:none}
table.t th{font-family:'Fraunces',serif;font-weight:600;font-size:12px;letter-spacing:.12em;
text-transform:uppercase;color:var(--gold);background:rgba(0,0,0,.16)}
table.t .l{text-align:left;color:var(--cream);font-weight:600}
table.t th.l{color:var(--gold)}
table.t tr.big td{font-size:19px;font-weight:600;padding-top:15px;padding-bottom:15px}
table.t tr.big{background:rgba(233,201,138,.06)}
table.t tr.soft td{color:var(--mut);font-size:14px}
table.t td.neg{color:var(--neg)!important}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:8px 0 4px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px}
.card .k{font-family:'Fraunces',serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}
.card .v{font-family:'Fraunces',serif;font-weight:600;font-size:30px;color:var(--gold);margin-top:6px}
.card .n{font-size:13px;color:var(--mut);font-style:italic;margin-top:4px;line-height:1.4}
.nota{border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:0 10px 10px 0;
background:rgba(0,0,0,.18);padding:16px 18px;margin:34px 0 0;font-size:14px;color:var(--mut)}
.nota b{color:var(--cream)}
footer{margin-top:48px;padding-top:22px;border-top:1px solid var(--line);
font-size:13px;color:var(--mut);font-style:italic}
@media(max-width:600px){header{padding:36px 0 26px}h2{font-size:18px}}
"""

def doc(titulo, sub, cuerpo, pie):
    return (u"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=EB+Garamond:ital,wght@0,400..700;1,400..600&display=swap" rel="stylesheet">
<style>%s</style></head><body><div class="wrap">
<header><div class="wm">SND<span class="wm-mark"><i></i><i></i></span>WCH</div>
<div class="sub">%s</div>
<div class="date">Setiembre 2026 — Febrero 2027 · Trujillo</div></header>
%s<footer>%s</footer></div></body></html>""" % (titulo, CSS, sub, cuerpo, pie))

# ── DOCUMENTO 1 — para el amigo ────────────────────────────────────────────────
c1 = u"""
<h2>Economía por pedido</h2>
<div class="hint">Cifras ya medidas: insumos con merma de cocción y precio real de proveedor.</div>
<div class="cards">
<div class="card"><div class="k">Contribución por pedido</div><div class="v">S/%.2f</div>
<div class="n">Después de insumos, empaque y comisión de tarjeta</div></div>
<div class="card"><div class="k">Costos fijos mensuales</div><div class="v">&lt; S/%d</div>
<div class="n">Opera desde casa: sin alquiler, sin planilla</div></div>
<div class="card"><div class="k">Punto de equilibrio</div><div class="v">%.1f<span style="font-size:16px"> ped/día</span></div>
<div class="n">%d pedidos al mes cubren todos los costos</div></div>
<div class="card"><div class="k">Capacidad instalada</div><div class="v">%d<span style="font-size:16px"> ped/día</span></div>
<div class="n">%s pedidos al mes sin contratar a nadie</div></div>
</div>

<h2>Los cinco escenarios</h2>
<div class="hint">Todos con la misma inversión en publicidad (S/1 500 al mes): lo único que
cambia entre ellos es lo que de verdad es incierto.</div>
<div class="scroll">%s</div>

<h2>Qué cambia entre un escenario y otro</h2>
<div class="hint">Cada variable se mueve solo dentro de su rango documentado.</div>
<div class="scroll">%s</div>

<h2>Mes a mes</h2>
<div class="hint">Setiembre abre el día 7 y cierra los lunes.</div>
%s
<div class="nota"><b>Sobre estas cifras.</b> El negocio abre el 7 de setiembre de 2026 y no
registra ninguna venta todavía. Esto es una simulación construida sobre tres referencias
publicadas del sector —tasa de recompra, pedidos por cliente y frecuencia de pedido en canal
propio— más los costos ya medidos del propio menú. No es un pronóstico con historial. El rango
entre el escenario más adverso y el más favorable es la incertidumbre real de un negocio que
aún no ha abierto.</div>
""" % (CONTRIB_PEDIDO, FIJOS, FIJOS/CONTRIB_PEDIDO/26, round(FIJOS/CONTRIB_PEDIDO), CAP_DIA,
       '{:,}'.format(CAP_DIA*26).replace(',', ' '),
       t_resumen(E5, COL), t_params(E5),
       ''.join('<div class="scroll">%s</div>' % t_mes(e) for e in E5))

io.open('propuesta-negocio.html', 'w', encoding='utf-8').write(doc(
    u'SND//WCH — Proyección financiera', u'Proyección financiera · 6 meses', c1,
    u'Modelo de cohortes v8 · 27 de agosto de 2026 · Fuentes: Bloom Intelligence, Paytronix, '
    u'INEI, APEIM, ibo.pe, Flyvbjerg (JAPA), Fader &amp; Hardie (Wharton).'))

# ── DOCUMENTO 2 — para el dueño ────────────────────────────────────────────────
base = E3[1]
filas5000 = []
for e in E3:
    B = e['b5000']
    if B is None:
        filas5000.append((e['nombre'], None, None, None, None))
    else:
        ped, neto = corrida(B, e['r1'], e['cm'], e['g'])
        caja = np.cumsum(neto)
        filas5000.append((e['nombre'], B, neto[3], ped[3]/DIAS[3]/CAP_DIA*100, min(0.0, caja.min())))

t5000 = ['<table class="t"><thead><tr><th class="l">Escenario</th>'
         '<th>Publicidad al mes</th><th>Neto en diciembre</th>'
         '<th>Uso del techo</th><th>Capital necesario</th></tr></thead><tbody>']
for nom, B, n4, tch, caja in filas5000:
    if B is None:
        t5000.append('<tr><td class="l">%s</td><td colspan="4" style="color:var(--neg)">'
                     'No alcanza: el techo de cocina se llena antes</td></tr>' % nom)
    else:
        t5000.append('<tr><td class="l">%s</td><td>%s</td><td style="color:var(--gold)">%s</td>'
                     '<td>%.0f %%</td><td>%s</td></tr>' % (nom, s(B), s(n4), tch, s(abs(caja))))
t5000 = ''.join(t5000) + '</tbody></table>'

ped_b, neto_b = corrida(base['b5000'], base['r1'], base['cm'], base['g'])
acum_b = np.cumsum(neto_b)
tcamino = ['<table class="t"><thead><tr><th class="l">Mes</th>'
           + ''.join('<th>%s</th>' % m[:3] for m in ETIQ) + '</tr></thead><tbody>']
for nom, vals in [
    ('Pedidos', ['{:,.0f}'.format(x).replace(',', ' ') for x in ped_b]),
    ('Pedidos por día', ['%.1f' % (ped_b[i]/DIAS[i]) for i in range(6)]),
    ('Uso del techo', ['%.0f %%' % (ped_b[i]/DIAS[i]/CAP_DIA*100) for i in range(6)]),
    ('Utilidad neta del mes', [s(x) for x in neto_b]),
    ('Acumulado', [s(x) for x in acum_b]),
]:
    tcamino.append('<tr><td class="l">%s</td>' % nom
                   + ''.join('<td class="%s">%s</td>' % ('neg' if v.startswith('−') else '', v)
                             for v in vals) + '</tr>')
tcamino = ''.join(tcamino) + '</tbody></table>'

c2 = u"""
<h2>La condición de rentabilidad, en una desigualdad</h2>
<div class="hint">De aquí sale todo lo demás.</div>
<div class="cards">
<div class="card"><div class="k">Regla</div>
<div class="v" style="font-size:19px;line-height:1.35">contribución &gt; CAC</div>
<div class="n">Si el costo de traer un cliente supera lo que deja su primer pedido, cada
cliente nace perdiendo y gastar más pierde más rápido. Ningún presupuesto lo arregla.</div></div>
<div class="card"><div class="k">Escala mínima, cumplida la regla</div>
<div class="v" style="font-size:17px;line-height:1.35">500 × CAC<br>÷ (contrib − CAC)</div>
<div class="n">Recién entonces el presupuesto decide el resultado.</div></div>
<div class="card"><div class="k">Contribución si nada es grupal</div><div class="v">S/%.2f</div>
<div class="n">Un pedido, un sándwich, 25%% con bebida</div></div>
<div class="card"><div class="k">Contribución con 10%% grupales</div><div class="v">S/%.2f</div>
<div class="n">El pedido grupal no trae clientes: hace que los que ya tienes valgan más</div></div>
</div>

<h2>Los tres escenarios, con S/1 500 al mes</h2>
<div class="hint">Mismo presupuesto en los tres: lo que cambia es lo incierto.</div>
<div class="scroll">%s</div>
<div class="scroll">%s</div>

<h2>Mes a mes</h2>
%s

<h2>Llegar a S/5 000 netos en diciembre</h2>
<div class="hint">Diciembre es el mes 4. Para entonces ya vuelven clientes de setiembre,
octubre y noviembre, así que cada sol de publicidad rinde más que en el mes 1.</div>
<div class="scroll">%s</div>

<h2>El camino, escenario Base</h2>
<div class="hint">S/%s al mes de publicidad · %d%% de pedidos grupales · %d%% de clientes por
referido · CAC mezclado S/%.2f</div>
<div class="scroll">%s</div>

<div class="nota"><b>Lo que este documento no puede decirte.</b> No hay una sola venta real
todavía: los tres números externos del modelo (22,6%% de recompra, 6,93 pedidos por cliente
que vuelve, 33 días entre pedidos) están tomados de estudios del sector, no de tu negocio.
El más frágil de todos es el CAC: el rango de S/10,51 a S/25,23 sale de los CPM publicados
para Perú, y tu ticket está por encima del único ticket de delivery con fuente para provincia
peruana (S/15). Si la conversión real fuera la mitad del benchmark, el CAC se duplica y el
escenario Pesimista pasa a ser el realista. Todo esto se mide en la primera semana de campaña
con el Pixel que ya está programado.</div>
""" % (contrib_medio(0.0), contrib_medio(0.10), t_resumen(E3, COL[1:4]), t_params(E3),
       ''.join('<div class="scroll">%s</div>' % t_mes(e) for e in E3),
       t5000, '{:,.0f}'.format(base['b5000']).replace(',', ' '),
       int(base['g']*100), int(base['pr']*100), base['cm'], tcamino)

io.open('analisis-6-meses.html', 'w', encoding='utf-8').write(doc(
    u'SND//WCH — Análisis a 6 meses', u'Análisis interno · 3 escenarios', c2,
    u'Modelo de cohortes v8 · 27 de agosto de 2026 · modelo/escenarios_v8.py y modelo/FUENTES.md'))

print('propuesta-negocio.html + analisis-6-meses.html generados')
print('\nS/5,000 en diciembre — presupuesto necesario:')
for nom, B, n4, tch, caja in filas5000:
    print(f"  {nom:<12} " + ('no alcanza' if B is None else
          f"S/{B:>6,.0f}/mes → neto dic S/{n4:,.0f} · {tch:.0f}% del techo · capital S/{abs(caja):,.0f}"))
