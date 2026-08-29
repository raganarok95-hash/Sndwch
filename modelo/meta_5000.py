# -*- coding: utf-8 -*-
"""¿Con cuánta publicidad se llega a S/5,000 netos EN EL MES 4 (diciembre 2026)?

Mes 1 = setiembre (abre el día 7). Mes 4 = diciembre.
Se resuelve el presupuesto B que hace neto[diciembre] >= 5000, por escenario y por
fracción de pedidos grupales. Se verifica además que quepa en el techo de cocina y
cuánto capital hace falta para financiarlo hasta que se paga solo.
"""
import numpy as np
from scipy import optimize
import importlib.util, sys
spec = importlib.util.spec_from_file_location('v8', 'modelo/escenarios_v8.py')
# Se reimplementa lo mínimo en vez de importar (el módulo imprime al cargarse).
from datetime import date, timedelta

CONTRIB_PEDIDO, CONTRIB_SW, FIJOS, CAP_DIA = 16.42, 16.16, 500.0, 40
COSTO_SW = 22.10 - CONTRIB_SW
DIAS_ENTRE, E_DADO_2, SW_GRUPAL = 33.0, 6.93, 6

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

def contrib_medio(g):
    return (1-g)*CONTRIB_PEDIDO + g*(SW_GRUPAL*CONTRIB_SW - COSTO_SW)

def cac_mix(cac, pr):
    return (1-pr)*cac + pr*7.65

def corrida(B, r1, cac, g, H=6):
    S = calibrar(r1); pf = perfil(S, H); c = contrib_medio(g)
    ped = np.zeros(H)
    for m in range(H):
        n = B/cac
        for k in range(H-m): ped[m+k] += n*pf[k]
    ped = np.minimum(ped, np.array(DIAS)*CAP_DIA)
    return ped, ped*c - FIJOS - B

ESC = [('Pesimista', 0.226, 19.00), ('Base', 0.280, 13.50), ('Optimista', 0.340, 11.00)]
MES4 = 3   # diciembre
META = 5000.0

print('='*96)
print('¿CON CUÁNTA PUBLICIDAD SE LLEGA A S/5,000 NETOS EN DICIEMBRE (MES 4)?'.center(96))
print('='*96)
print("""
  El mes 4 es diciembre. Para entonces ya vuelven clientes de las cohortes de setiembre,
  octubre y noviembre, así que cada sol de publicidad rinde más que en el mes 1.
""")

def presupuesto_para(meta, r1, cac, g):
    """Presupuesto MÍNIMO que hace neto[mes 4] >= meta.

    OJO: el neto NO crece indefinidamente con el presupuesto. El techo de cocina
    (40 pedidos/día) corta los pedidos, así que pasado cierto punto se sigue pagando
    publicidad que ya no puede convertirse en pedidos y el neto CAE. Por eso hay que
    barrer y buscar el máximo, no asumir monotonía — asumirla fue el error de la
    primera versión de este archivo, que devolvía "imposible" en todos los casos."""
    Bs = np.arange(100, 30_001, 50.0)
    netos = np.array([corrida(B, r1, cac, g)[1][MES4] for B in Bs])
    if netos.max() < meta:
        return None
    return float(Bs[np.argmax(netos >= meta)])

for pr in (0.0, 0.2, 0.4):
    print(f"\n  ── Con {int(pr*100)}% de clientes por referido ──")
    print(f"  {'Escenario':<13}{'CAC':>8}" + ''.join(f"{'grupal '+str(int(g*100))+'%':>16}" for g in (0.05,0.10,0.20)))
    print('  '+'-'*69)
    for nom, r1, cac in ESC:
        cm = cac_mix(cac, pr); fila = []
        for g in (0.05, 0.10, 0.20):
            B = presupuesto_para(META, r1, cm, g)
            if B is None: fila.append(f"{'imposible':>16}")
            else:
                ped, _ = corrida(B, r1, cm, g)
                tope = ped[MES4]/DIAS[MES4]/CAP_DIA*100
                fila.append(f"{('S/%s' % f'{B:,.0f}'):>16}" if tope <= 100 else f"{'>techo':>16}")
        print(f"  {nom:<13}{cm:>8.2f}" + ''.join(fila))

print("""
  (presupuesto MENSUAL de publicidad necesario para que diciembre cierre en +S/5,000)
""")

print('='*96)
print('EL CAMINO COMPLETO — ESCENARIO BASE, 10% GRUPALES, 20% REFERIDOS'.center(96))
print('='*96)
cm = cac_mix(13.50, 0.20)
B = presupuesto_para(META, 0.280, cm, 0.10)
assert B is not None, 'no hay presupuesto que alcance la meta en este escenario'
ped, neto = corrida(B, 0.280, cm, 0.10)
acum = np.cumsum(neto)
caja = 0.0; minimo = 0.0
for m in range(6):
    caja += neto[m]; minimo = min(minimo, caja)
print(f"\n  Publicidad: S/{B:,.0f}/mes · CAC mezclado S/{cm:.2f} · contribución S/{contrib_medio(0.10):.2f}/pedido\n")
print(f"  {'Mes':<12}{'pedidos':>10}{'ped/día':>10}{'% techo':>10}{'neto':>12}{'acumulado':>13}")
print('  '+'-'*67)
for m in range(6):
    print(f"  {ETIQ[m]:<12}{ped[m]:>10,.0f}{ped[m]/DIAS[m]:>10.1f}"
          f"{ped[m]/DIAS[m]/CAP_DIA*100:>9.0f}%{neto[m]:>12,.0f}{acum[m]:>13,.0f}")
print(f"""
  Capital de trabajo necesario: S/{abs(minimo):,.0f} (el punto más bajo de la caja).
  Mes en que se supera S/5,000 netos: {ETIQ[int(np.argmax(neto >= META))] if (neto >= META).any() else 'no se alcanza'}.
  Uso máximo del techo de cocina: {max(ped[m]/DIAS[m] for m in range(6))/CAP_DIA*100:.0f}%.""")
