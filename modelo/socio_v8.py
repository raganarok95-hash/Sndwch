# -*- coding: utf-8 -*-
"""¿Conviene el trato del amigo? — RECALCULADO con el modelo v8.

TRATO PROPUESTO: aporta S/5,000 a cambio del 5% de la GANANCIA NETA de los primeros
24 meses. No es capital accionario: es participación en utilidades, con vencimiento.

POR QUÉ SE REHACE: el análisis anterior usaba un CAC de S/134 que NUNCA tuvo fuente, y
además contaba "cuentas de oficina" como canal B2B que el dueño no hace. Con esos dos
errores, aquel análisis concluía que el trato perdía plata en 4 de 5 escenarios. Ninguna
de las dos premisas era cierta.

LA PREGUNTA CORRECTA no es "¿cuánto gana el amigo?" sino "¿qué compra ese dinero?".
El dinero solo vale si permite gastar en publicidad ANTES de que el negocio lo genere.
"""
import numpy as np
from scipy import optimize
from datetime import date, timedelta

CONTRIB_SW, FIJOS, CAP_DIA = 16.16, 500.0, 40
CONTRIB_PEDIDO = 16.42
COSTO_SW = 22.10 - CONTRIB_SW
DIAS_ENTRE, E_DADO_2, SW_GRUPAL = 33.0, 6.93, 6
APORTE, PARTICIP, MESES = 5000.0, 0.05, 24

def calibrar(r1, n=900):
    boa = r1/(1-r1)
    def S(a):
        b = boa*a; j = np.arange(1, n+1)
        return np.cumprod((b+j-1)/(a+b+j-1))
    return S(optimize.brentq(lambda x: 1 + S(x).sum()/S(x)[0] - E_DADO_2, 1e-4, 200))

def perfil(S, H):
    p = np.zeros(H); prob = 1.0; k = 1
    while k <= len(S) and prob > 1e-6:
        m = int(((k-1)*DIAS_ENTRE)//30.44)
        if m >= H: break
        p[m] += prob; prob *= S[k-1]/(S[k-2] if k >= 2 else 1.0); k += 1
    return p

def contrib(g): return (1-g)*CONTRIB_PEDIDO + g*(SW_GRUPAL*CONTRIB_SW - COSTO_SW)
def cacmix(cac, pr): return (1-pr)*cac + pr*7.65

DIAS_MES = 26   # 6 días por semana; se simplifica a 26 para el horizonte largo

def correr(objetivo, r1, cac, g, capital, H=MESES):
    """Gasta `objetivo` al mes en publicidad, PERO solo lo que la caja permite.
    La caja arranca en `capital` y se alimenta de lo que el negocio genera.
    Esto es lo que hace que el aporte del amigo importe o no."""
    S = calibrar(r1); pf = perfil(S, H); c = contrib(g)
    ped = np.zeros(H); neto = np.zeros(H); caja = float(capital)
    for m in range(H):
        gasto = max(0.0, min(objetivo, caja))
        n = gasto/cac
        for k in range(H-m): ped[m+k] += n*pf[k]
        p = min(ped[m], DIAS_MES*CAP_DIA)
        neto[m] = p*c - FIJOS - gasto
        caja += neto[m]
    return ped, neto, np.cumsum(neto)

# nombre, P(2º pedido), CAC publicidad, % grupales, % referidos
ESC = [
    ('Muy pesimista', 0.226, 25.23, 0.00, 0.00),
    ('Pesimista',     0.226, 19.00, 0.05, 0.20),
    ('Base',          0.280, 13.50, 0.10, 0.20),
    ('Optimista',     0.340, 11.00, 0.15, 0.40),
    ('Muy optimista', 0.400, 10.51, 0.20, 0.40),
]
OBJ = 2800.0   # el presupuesto que el propio modelo señaló para llegar a S/5,000 netos

print('='*98)
print('1 — QUÉ COMPRA EL APORTE: LO MISMO CON Y SIN LOS S/5,000'.center(98))
print('='*98)
print(f"""
  Se corre cada escenario dos veces con el MISMO objetivo de publicidad (S/{OBJ:,.0f}/mes):
  una arrancando solo con capital propio (S/1,000) y otra con ese capital más el aporte.
  La diferencia entre las dos columnas es TODO lo que el dinero del amigo produce.
""")
print(f"  {'Escenario':<16}{'sin aporte':>14}{'con aporte':>14}{'diferencia':>14}{'5% del amigo':>15}{'¿recupera?':>13}")
print('  '+'-'*88)
res = []
for nom, r1, cac, g, pr in ESC:
    cm = cacmix(cac, pr)
    _, _, a_sin = correr(OBJ, r1, cm, g, 1000.0)
    _, _, a_con = correr(OBJ, r1, cm, g, 1000.0 + APORTE)
    dif = a_con[-1] - a_sin[-1]
    amigo = max(0.0, a_con[-1]*PARTICIP)
    rec = f'sí ×{amigo/APORTE:.2f}' if amigo >= APORTE else f'no ({amigo/APORTE:.0%})'
    res.append((nom, a_sin[-1], a_con[-1], dif, amigo))
    print(f"  {nom:<16}{a_sin[-1]:>14,.0f}{a_con[-1]:>14,.0f}{dif:>14,.0f}{amigo:>15,.0f}{rec:>13}")
print("\n  (utilidad neta acumulada a 24 meses, en soles)")

print('\n'+'='*98)
print('2 — LO QUE EL TRATO LE CUESTA AL DUEÑO POR CADA SOL QUE LE APORTA'.center(98))
print('='*98)
print(f"\n  {'Escenario':<16}{'aporta':>10}{'se lleva':>12}{'costo neto':>14}{'por cada S/1 aportado':>24}")
print('  '+'-'*76)
for nom, sin_a, con_a, dif, amigo in res:
    costo = amigo - dif          # lo que se lleva menos lo que su plata generó
    print(f"  {nom:<16}{APORTE:>10,.0f}{amigo:>12,.0f}{costo:>14,.0f}{amigo/APORTE:>23.2f}x")
print("""
  "Costo neto" = lo que el amigo se lleva MENOS el valor que su dinero generó de verdad.
  Si sale positivo, el dueño paga más de lo que el aporte produjo.""")

print('\n'+'='*98)
print('3 — LA PREGUNTA QUE NADIE HIZO: ¿HACE FALTA EL DINERO?'.center(98))
print('='*98)
print(f"\n  {'Capital propio inicial':<26}{'neto 24m (Base)':>20}{'vs. con aporte':>18}")
print('  '+'-'*64)
nom, r1, cac, g, pr = ESC[2]
cm = cacmix(cac, pr)
_, _, ref = correr(OBJ, r1, cm, g, 1000.0 + APORTE)
for cap in (500, 1000, 2000, 3000, 5000, 6000):
    _, _, a = correr(OBJ, r1, cm, g, float(cap))
    print(f"  S/{cap:<24,}{a[-1]:>20,.0f}{(a[-1]/ref[-1]-1)*100:>17.1f}%")
print(f"""
  El negocio es rentable desde el primer mes en el escenario Base, así que la caja se
  alimenta sola muy rápido. El aporte solo acelera los primeros meses — y a partir de
  cierto capital propio, deja de cambiar nada.""")

print('\n'+'='*98)
print('4 — ADVERTENCIA: ¿EL TECHO DE COCINA SE LLENA?'.center(98))
print('='*98)
print(f"""
  Si el techo de {CAP_DIA} pedidos/día se llena, el dueño está PAGANDO publicidad para traer
  clientes que después no puede atender. Eso no es crecimiento: es tirar plata y quemar
  reputación. Se revisa mes por mes.
""")
print(f"  {'Escenario':<16}{'mes en que se llena':>22}{'demanda pico vs techo':>24}")
print('  '+'-'*62)
for nom, r1, cac, g, pr in ESC:
    ped, _, _ = correr(OBJ, r1, cacmix(cac, pr), g, 1000.0 + APORTE)
    techo = DIAS_MES*CAP_DIA
    llena = next((m+1 for m in range(MESES) if ped[m] >= techo), None)
    print(f"  {nom:<16}{(str(llena) if llena else 'nunca'):>22}{ped.max()/techo*100:>23.0f}%")

print('\n'+'='*98)
print('5 — ESTRUCTURAS ALTERNATIVAS, MISMO APORTE DE S/5,000'.center(98))
print('='*98)
print("""
  El problema del trato propuesto no es que sea abusivo: es que NO TIENE TOPE. El aporte
  del amigo es fijo (S/5,000) pero su participación crece sin límite. Por eso sale barato
  si al negocio le va mal y caro si le va bien — exactamente al revés de lo que uno quiere.
""")
base_neto = dict((n, c) for n, s_, c, d, a in res)
print(f"  {'Estructura':<38}" + ''.join(f"{n[:11]:>13}" for n,_,_,_,_ in ESC))
print('  '+'-'*103)
def fila(nom, f):
    print(f"  {nom:<38}" + ''.join(f"{f(c):>13,.0f}" for _, _, c, _, _ in res))
fila('A) 5% de 24 meses (lo propuesto)', lambda c: max(0.0, c*0.05))
fila('B) 5% con tope de 2x (S/10,000)',  lambda c: min(10000.0, max(0.0, c*0.05)))
fila('C) 5% de 12 meses en vez de 24',   lambda c: max(0.0, c*0.05*0.35))
fila('D) Préstamo 20% anual a 24 meses', lambda c: 5000*0.44)
fila('E) 3% de 24 meses con tope de 3x', lambda c: min(15000.0, max(0.0, c*0.03)))
print("""
  (lo que se lleva el amigo en cada escenario, en soles)

  La opción C es aproximada: usa el 35% del neto de 24 meses como proxy de los primeros 12,
  porque el negocio crece — no es la mitad. Es una estimación, no un cálculo exacto.
""")
