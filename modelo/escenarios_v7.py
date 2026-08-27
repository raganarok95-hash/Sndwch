"""SND//WCH — 5 escenarios sobre el modelo v7 (2026-08-27), para la presentación.

Cada parámetro se mueve SOLO dentro de su rango documentado en modelo/FUENTES.md.
Ningún valor se eligió para hacer cuadrar un resultado. Las tres variables que separan
un escenario del siguiente son:
  · P(2º pedido)  — entre 22.6% (Bloom, valor central) y 40% (borde alto de la industria)
  · CAC           — entre S/25.23 (peor CPM de Perú) y S/10.51 (mejor CPM), vía mezcla
                    con referido (S/7.65) y pedido grupal (S/1.19)
  · presupuesto y cuentas de oficina — DECISIONES del dueño, no predicciones

El escenario más pesimista lleva además la corrección de optimismo de Flyvbjerg (÷2.06).
"""
import numpy as np, json
from scipy import optimize
from datetime import date, timedelta

CONTRIB_PEDIDO, CONTRIB_SANDWICH, FIJOS, CAP_DIA = 16.42, 16.16, 500.0, 40
DIAS_ENTRE_PEDIDOS, E_TOTAL_DADO_2 = 33.0, 6.93
COSTO_SW = 22.10 - CONTRIB_SANDWICH      # insumo+empaque real de un 15CM

def dias_op(a, m, desde=None):
    d = date(a, m, 1) if desde is None else desde; n = 0
    while d.month == m:
        if d.weekday() != 0: n += 1        # cerrado los lunes (STORE_HOURS en env.ts)
        d += timedelta(days=1)
    return n

MESES = [(2026,9),(2026,10),(2026,11),(2026,12),(2027,1),(2027,2)]
DIAS = [dias_op(2026,9,date(2026,9,7))] + [dias_op(a,m) for a,m in MESES[1:]]
ETIQ = ['Setiembre','Octubre','Noviembre','Diciembre','Enero','Febrero']

def calibrar(r1, n_max=500):
    boa = r1/(1-r1)
    def S(a):
        b = boa*a; j = np.arange(1, n_max+1)
        return np.cumprod((b+j-1)/(a+b+j-1))
    a = optimize.brentq(lambda x: 1 + S(x).sum()/S(x)[0] - E_TOTAL_DADO_2, 1e-4, 200)
    return S(a)

def perfil(S, H=6):
    """Pedidos que un cliente adquirido en el mes 0 hace en el mes k."""
    p = np.zeros(H); prob = 1.0; n = 1
    while n <= len(S) and prob > 1e-6:
        mes = int(((n-1)*DIAS_ENTRE_PEDIDOS)//30.44)
        if mes >= H: break
        p[mes] += prob
        prob *= S[n-1]/(S[n-2] if n >= 2 else 1.0); n += 1
    return p

# nombre, P(2º pedido), CAC, presupuesto/mes, oficinas al mes 6, corrección de optimismo
ESC = [
    ('Muy pesimista', 0.226, 25.23,  300, 0, True),
    ('Pesimista',     0.226, 19.00,  600, 1, False),
    ('Base',          0.280, 13.50, 1000, 2, False),
    ('Optimista',     0.340, 11.00, 1500, 4, False),
    ('Muy optimista', 0.400, 10.51, 2000, 8, False),
]

out = []
for nom, r1, cac, presu, oficinas, corregir in ESC:
    S = calibrar(r1); pf = perfil(S)
    nuevos = presu/cac*(1/2.06 if corregir else 1.0)
    ped = np.zeros(6)
    for m in range(6):
        for k in range(6-m): ped[m+k] += nuevos*pf[k]
    ped = np.minimum(ped, np.array(DIAS)*CAP_DIA)          # techo físico
    of = np.array([oficinas*(m+1)/6 for m in range(6)])     # entran linealmente
    contrib_of = of*(4*6*CONTRIB_SANDWICH - 4*COSTO_SW)     # 4 pedidos/mes de 6 sándwiches
    contrib = ped*CONTRIB_PEDIDO + contrib_of
    neto = contrib - FIJOS - presu
    ped_tot = ped + of*4
    out.append(dict(nombre=nom, r1=r1, cac=cac, presu=presu, oficinas=oficinas,
                    ltv=round((1+S.sum())*CONTRIB_PEDIDO,2), pxc=round(1+S.sum(),2),
                    nuevos=round(nuevos), corregido=corregir,
                    ped=[round(x) for x in ped_tot],
                    ped_dia=[round(ped_tot[i]/DIAS[i],1) for i in range(6)],
                    of=[round(x,1) for x in of],
                    contrib=[round(x) for x in contrib], neto=[round(x) for x in neto],
                    acum=[round(x) for x in np.cumsum(neto)],
                    techo=round(max(ped_tot[i]/DIAS[i] for i in range(6))/CAP_DIA*100)))

print(f"{'Escenario':<16}{'P(2º)':>7}{'CAC':>8}{'pauta':>7}{'ofic':>6}{'LTV':>7}"
      f"{'ped/día feb':>13}{'neto feb':>11}{'6 meses':>11}{'techo':>7}")
print('-'*93)
for e in out:
    print(f"{e['nombre']:<16}{e['r1']*100:>6.1f}%{e['cac']:>8.2f}{e['presu']:>7}{e['oficinas']:>6}"
          f"{e['ltv']:>7.0f}{e['ped_dia'][5]:>13}{e['neto'][5]:>11,}{e['acum'][5]:>11,}{e['techo']:>6}%")
json.dump({'esc': out, 'meses': ETIQ, 'dias': DIAS}, open('modelo/escenarios.json','w'))
