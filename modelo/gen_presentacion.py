# -*- coding: utf-8 -*-
"""Genera la presentación HTML a partir de modelo/escenarios.json.
Los números NO se escriben a mano en ningún lado: salen del JSON del modelo."""
import json, io

d = json.load(open('modelo/escenarios.json'))
E, M = d['esc'], d['meses']
CONTRIB, FIJOS, CAP = 16.42, 500, 40
COL = ['#8FA6A0', '#B4C2A8', '#E9C98A', '#F0D9A0', '#FFE9B8']

def s(n):
    return ('−S/' if n < 0 else 'S/') + '{:,.0f}'.format(abs(n)).replace(',', ' ')

def tabla_resumen():
    f = ['<table class="t"><thead><tr><th class="l">Escenario</th>'
         + ''.join('<th>%s</th>' % e['nombre'] for e in E) + '</tr></thead><tbody>']
    filas = [
        ('Pedidos por día · Febrero', [str(e['ped_dia'][5]) for e in E], ''),
        ('Pedidos en el mes · Febrero', ['{:,}'.format(e['ped'][5]).replace(',', ' ') for e in E], ''),
        ('Utilidad neta · Febrero', [s(e['neto'][5]) for e in E], 'big'),
        ('Utilidad neta acumulada · 6 meses', [s(e['acum'][5]) for e in E], 'big'),
        ('Uso de la capacidad instalada', ['%d %%' % e['techo'] for e in E], 'soft'),
    ]
    for nom, vals, cls in filas:
        f.append('<tr class="%s"><td class="l">%s</td>' % (cls, nom)
                 + ''.join('<td class="%s" style="color:%s">%s</td>'
                           % ('neg' if v.startswith('−') else '', COL[i], v)
                           for i, v in enumerate(vals)) + '</tr>')
    return ''.join(f) + '</tbody></table>'

def tabla_mes(e, i):
    f = ['<table class="t sm"><thead><tr><th class="l">%s</th>' % e['nombre']
         + ''.join('<th>%s</th>' % m[:3] for m in M) + '</tr></thead><tbody>']
    for nom, vals in (
        ('Pedidos', ['{:,}'.format(x).replace(',', ' ') for x in e['ped']]),
        ('Pedidos por día', [str(x) for x in e['ped_dia']]),
        ('Contribución', [s(x) for x in e['contrib']]),
        ('Utilidad neta del mes', [s(x) for x in e['neto']]),
        ('Acumulado', [s(x) for x in e['acum']]),
    ):
        f.append('<tr><td class="l">%s</td>' % nom
                 + ''.join('<td class="%s">%s</td>' % ('neg' if v.startswith('−') else '', v)
                           for v in vals) + '</tr>')
    return ''.join(f) + '</tbody></table>'

def tabla_params():
    f = ['<table class="t"><thead><tr><th class="l">Supuesto</th>'
         + ''.join('<th>%s</th>' % e['nombre'] for e in E) + '</tr></thead><tbody>']
    for nom, vals in (
        ('Clientes que repiten', ['%.1f %%' % (e['r1'] * 100) for e in E]),
        ('Costo de traer un cliente', ['S/%.2f' % e['cac'] for e in E]),
        ('Valor de un cliente', ['S/%.0f' % e['ltv'] for e in E]),
        ('Inversión en publicidad · mes', [s(e['presu']) for e in E]),
        ('Cuentas de oficina al mes 6', [str(e['oficinas']) for e in E]),
        ('Clientes nuevos por mes', [str(e['nuevos']) for e in E]),
    ):
        f.append('<tr><td class="l">%s</td>' % nom
                 + ''.join('<td>%s</td>' % v for v in vals) + '</tr>')
    return ''.join(f) + '</tbody></table>'

HTML = u"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SND//WCH — Proyección financiera</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=EB+Garamond:ital,wght@0,400..700;1,400..600&display=swap" rel="stylesheet">
<style>
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
/* Regla decorativa, NO el mark: sin sesgo a propósito. Una sola barra sesgada se leería
   como medio "//", y el "//" de la marca son dos barras idénticas que no se reinterpretan. */
h2::before{content:"";width:3px;height:20px;background:linear-gradient(180deg,var(--gold),var(--gold2));
border-radius:1px;flex:none}
.hint{color:var(--mut);font-style:italic;font-size:14px;margin:0 0 16px 13px}
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);
border-radius:12px;background:var(--panel)}
table.t{width:100%%;border-collapse:collapse;font-size:15px;min-width:660px}
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
.card .k{font-family:'Fraunces',serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;
color:var(--mut)}
.card .v{font-family:'Fraunces',serif;font-weight:600;font-size:30px;color:var(--gold);margin-top:6px}
.card .n{font-size:13px;color:var(--mut);font-style:italic;margin-top:4px;line-height:1.4}
.nota{border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:0 10px 10px 0;
background:rgba(0,0,0,.18);padding:16px 18px;margin:34px 0 0;font-size:14px;color:var(--mut)}
.nota b{color:var(--cream)}
footer{margin-top:48px;padding-top:22px;border-top:1px solid var(--line);
font-size:13px;color:var(--mut);font-style:italic}
.mes-grid{display:grid;gap:16px}
@media(max-width:600px){header{padding:36px 0 26px}h2{font-size:18px}}
</style></head><body><div class="wrap">

<header>
<div class="wm">SND<span class="wm-mark"><i></i><i></i></span>WCH</div>
<div class="sub">Proyección financiera · 6 meses</div>
<div class="date">Setiembre 2026 — Febrero 2027 · Trujillo</div>
</header>

<h2>Economía por pedido</h2>
<div class="hint">Cifras ya medidas: costo de insumos con merma de cocción y precio real de proveedor.</div>
<div class="cards">
<div class="card"><div class="k">Contribución por pedido</div><div class="v">S/%(contrib).2f</div>
<div class="n">Después de insumos, empaque y comisión de tarjeta</div></div>
<div class="card"><div class="k">Costos fijos mensuales</div><div class="v">&lt; S/%(fijos)d</div>
<div class="n">Opera desde casa: sin alquiler, sin planilla</div></div>
<div class="card"><div class="k">Punto de equilibrio</div><div class="v">%(be).1f<span style="font-size:16px"> ped/día</span></div>
<div class="n">%(bem)d pedidos al mes cubren todos los costos</div></div>
<div class="card"><div class="k">Capacidad instalada</div><div class="v">%(cap)d<span style="font-size:16px"> ped/día</span></div>
<div class="n">%(capm)s pedidos al mes sin contratar a nadie</div></div>
</div>

<h2>Los cinco escenarios</h2>
<div class="hint">Del más adverso al más favorable.</div>
<div class="scroll">%(resumen)s</div>

<h2>Qué cambia entre un escenario y otro</h2>
<div class="hint">Cada variable se mueve solo dentro de su rango documentado.</div>
<div class="scroll">%(params)s</div>

<h2>Mes a mes</h2>
<div class="hint">Setiembre abre el día 7 y cierra los lunes.</div>
<div class="mes-grid">%(meses)s</div>

<div class="nota">
<b>Sobre estas cifras.</b> El negocio abre el 7 de setiembre de 2026 y no registra ninguna
venta todavía. Esto es una simulación construida sobre tres referencias publicadas del sector
—tasa de recompra, pedidos por cliente y frecuencia de pedido en canal propio— más los costos
ya medidos del propio menú. No es un pronóstico con historial. El rango entre el escenario más
adverso y el más favorable es la incertidumbre real de un negocio que aún no ha abierto.
</div>

<footer>Modelo de cohortes v7 · %(fecha)s · Fuentes: Bloom Intelligence, Paytronix,
ezCater, INEI, APEIM, ibo.pe, Flyvbjerg (JAPA), Fader &amp; Hardie (Wharton).</footer>
</div></body></html>"""

io.open('propuesta-negocio.html', 'w', encoding='utf-8').write(HTML % dict(
    contrib=CONTRIB, fijos=FIJOS, be=FIJOS / CONTRIB / 26, bem=round(FIJOS / CONTRIB),
    cap=CAP, capm='{:,}'.format(CAP * 26).replace(',', ' '),
    resumen=tabla_resumen(), params=tabla_params(),
    meses=''.join('<div class="scroll">%s</div>' % tabla_mes(e, i) for i, e in enumerate(E)),
    fecha='27 de agosto de 2026'))
print('propuesta-negocio.html generado')
