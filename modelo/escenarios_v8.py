# -*- coding: utf-8 -*-
"""SND//WCH — v8 (2026-08-27). Corrige el error del canal B2B del v7.

CAMBIO DE FONDO respecto del v7: el pedido grupal YA NO se adquiere aparte. El dueño no
hace venta B2B ni consigue oficinas (corregido por él mismo). Un pedido grupal es el pedido
de un cliente cualquiera, adquirido por la MISMA publicidad que todos los demás; lo único
que cambia es que trae varios sándwiches en vez de uno.

Consecuencia: la publicidad es prácticamente el único motor de adquisición, y por eso este
archivo se concentra en responder DOS preguntas concretas:
  1. ¿Qué hace falta para que CADA MES sea rentable, en cada escenario?
  2. ¿Cuál es el presupuesto ideal, y qué pasa con S/1,500?
"""
import numpy as np, json
from scipy import optimize
from datetime import date, timedelta

CONTRIB_PEDIDO, CONTRIB_SW, FIJOS, CAP_DIA = 16.42, 16.16, 500.0, 40
COSTO_SW = 22.10 - CONTRIB_SW          # insumo+empaque real de un 15CM = S/5.94
DIAS_ENTRE, E_DADO_2 = 33.0, 6.93
SW_GRUPAL = 6                          # tamaño típico de un pedido grupal (≥5 activa el regalo)

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
    """[DERIVADO] Contribución media por pedido si una fracción g de los pedidos es grupal.
    Un pedido grupal de 6 s.: 6 × contribución por sándwich, menos el 15CM regalado."""
    grupal = SW_GRUPAL*CONTRIB_SW - COSTO_SW
    return (1-g)*CONTRIB_PEDIDO + g*grupal

# nombre, P(2º pedido), CAC — el CAC ya NO baja por "conseguir grupos": es publicidad + referidos
ESC = [
    ('Muy pesimista', 0.226, 25.23),
    ('Pesimista',     0.226, 19.00),
    ('Base',          0.280, 13.50),
    ('Optimista',     0.340, 11.00),
    ('Muy optimista', 0.400, 10.51),
]
GRUPAL = [0.00, 0.05, 0.10, 0.20]      # sensibilidad: NO se predice, se muestra el efecto

print('='*94)
print('1 — LA CONDICIÓN DE RENTABILIDAD MENSUAL, EN UNA SOLA DESIGUALDAD'.center(94))
print('='*94)
print("""
  Un mes cualquiera:   neto = pedidos × contribución − S/500 de fijos − publicidad
  Y en régimen los pedidos los paga la publicidad:   pedidos ≈ presupuesto / CAC

  Sustituyendo:        neto = presupuesto × (contribución/CAC − 1) − 500

  De ahí salen las DOS condiciones, y la primera manda sobre todo lo demás:

    (A) La contribución por pedido tiene que ser MAYOR que el CAC.
        Si no, cada cliente nuevo nace perdiendo y gastar más solo pierde más rápido.
    (B) Cumplida (A), hace falta un mínimo de escala:
        presupuesto  >  500 × CAC / (contribución − CAC)
""")

print(f"  {'Escenario':<16}{'CAC':>8}{'contrib/pedido':>16}{'¿cumple (A)?':>14}{'presupuesto mínimo':>21}")
print('  '+'-'*75)
minimos = {}
for nom, r1, cac in ESC:
    c = contrib_medio(0.0)
    ok = c > cac
    pmin = FIJOS*cac/(c-cac) if ok else None
    minimos[nom] = pmin
    print(f"  {nom:<16}{cac:>8.2f}{c:>16.2f}{('sí' if ok else 'NO'):>14}"
          f"{(f'S/{pmin:,.0f}/mes' if ok else 'ningún monto alcanza'):>21}")

print("""
  ►► El "Muy pesimista" NO se arregla con presupuesto. Con CAC S/25.23 contra S/16.42 de
     contribución, cada cliente nuevo pierde S/8.81 el día que llega. Gastar más empeora el
     resultado. Ese escenario solo se arregla moviendo el CAC o la contribución.""")

print('\n'+'='*94)
print('2 — CÓMO SE ARREGLA EL ESCENARIO QUE NINGÚN PRESUPUESTO ARREGLA'.center(94))
print('='*94)
print(f"""
  Hay exactamente tres palancas, y dos están en tus manos hoy:

  (i)  SUBIR LA CONTRIBUCIÓN POR PEDIDO — pedidos grupales.
       Acá está el valor real del incentivo del organizador, ahora que sabemos que NO es un
       canal de venta: no trae clientes, pero hace que los pedidos que ya tienes valgan más.
""")
print(f"  {'% de pedidos que son grupales':<32}" + ''.join(f'{int(g*100):>10}%' for g in GRUPAL))
print('  '+'-'*74)
print(f"  {'Contribución media por pedido':<32}" + ''.join(f'{contrib_medio(g):>11.2f}' for g in GRUPAL))
for nom, r1, cac in ESC:
    fila = []
    for g in GRUPAL:
        c = contrib_medio(g)
        fila.append(f'{FIJOS*cac/(c-cac):>11,.0f}' if c > cac else f"{'—':>11}")
    print(f"  {'Presupuesto mínimo · '+nom:<32}" + ''.join(fila))
# ¿A partir de qué % de pedidos grupales cada escenario deja de ser imposible?
print()
for nom, r1, cac in ESC:
    g = next((x for x in np.arange(0, .51, .01) if contrib_medio(x) > cac), None)
    if g is None: continue
    if g <= 0: continue
    print(f"  Para que \"{nom}\" deje de ser imposible hacen falta {g*100:.0f}% de pedidos grupales "
          f"(contribución sube a S/{contrib_medio(g):.2f} y supera el CAC de S/{cac:.2f}).")
print("""
  Ese es el hallazgo de esta tabla: el pedido grupal NO trae clientes, pero es lo que decide
  si los dos peores escenarios son viables o no. Sube la contribución sin subir el CAC.

  (ii) BAJAR EL CAC — referidos. Cuestan S/7.65 (el insumo del 15CM de R06 más la bebida
       de R05), no su precio de carta. Ya están programados.
""")
print(f"  {'% de clientes que llegan por referido':<38}" + ''.join(f'{p:>10}%' for p in (0,20,40,60)))
print('  '+'-'*78)
for nom, r1, cac in ESC:
    fila = [f'{(1-p/100)*cac + (p/100)*7.65:>11.2f}' for p in (0,20,40,60)]
    print(f"  {'CAC mezclado · '+nom:<38}" + ''.join(fila))
print("""
  (iii) BAJAR LOS FIJOS — ya están por debajo de S/500 y sin local. No hay mucho que sacar.""")

# ═══════════════════════════════════════════════════════════════════════════════
# 3 — EL PRESUPUESTO: SIMULACIÓN COMPLETA POR COHORTES (no la fórmula aproximada)
# ═══════════════════════════════════════════════════════════════════════════════
def simular(presu, r1, cac, g, H=6, capital=None):
    """Cohortes reales: cada cliente adquirido recorre la curva sBG. Si se pasa `capital`,
    el gasto se limita a lo que la caja permite — no se puede gastar plata que no existe."""
    S = calibrar(r1); pf = perfil(S, H); c = contrib_medio(g)
    ped = np.zeros(H); gasto = np.zeros(H); caja = capital
    for m in range(H):
        p = presu if capital is None else max(0.0, min(presu, caja))
        gasto[m] = p
        n = p/cac
        for k in range(H-m): ped[m+k] += n*pf[k]
        if capital is not None:
            caja += min(ped[m], DIAS[m]*CAP_DIA)*c - FIJOS - p
    ped = np.minimum(ped, np.array(DIAS)*CAP_DIA)
    neto = ped*c - FIJOS - gasto
    return ped, neto, np.cumsum(neto)

print('\n'+'='*94)
print('3 — ¿S/1,500 AL MES? BARRIDO DE PRESUPUESTOS, SIN LÍMITE DE CAJA'.center(94))
print('='*94)
print("""
  La fórmula de arriba era conservadora: solo contaba el PRIMER pedido de cada cliente. Acá
  cada cohorte recorre su curva completa, así que los meses posteriores acumulan a los que
  vuelven. Con 5% de pedidos grupales (contribución S/20.15).
""")
G = 0.05
print(f"  {'Presupuesto':<14}" + ''.join(f"{n[:13]:>15}" for n,_,_ in ESC))
print('  '+'-'*89)
for presu in (500, 1000, 1500, 2000, 3000, 4000):
    fila = []
    for nom, r1, cac in ESC:
        _, neto, acum = simular(presu, r1, cac, G)
        fila.append(f"{acum[5]:>15,.0f}")
    print(f"  S/{presu:<12,}" + ''.join(fila))
print("  " + "·"*89)
print(f"  {'(neto acumulado a 6 meses)':<14}")

print('\n' + '─'*94)
print('  ¿RENTABLE TODOS LOS MESES? — mes a mes con S/1,500 y 5% de pedidos grupales')
print('─'*94)
print(f"  {'Escenario':<16}" + ''.join(f"{m[:3]:>11}" for m in ETIQ) + f"{'6 meses':>12}")
print('  '+'-'*89)
for nom, r1, cac in ESC:
    ped, neto, acum = simular(1500, r1, cac, G)
    print(f"  {nom:<16}" + ''.join(f"{x:>11,.0f}" for x in neto) + f"{acum[5]:>12,.0f}")

print('\n' + '─'*94)
print('  LO QUE DE VERDAD LIMITA EL PRESUPUESTO: LA CAJA, NO EL ÓPTIMO')
print('─'*94)
print("""
  Cumplida la condición (A), la ganancia CRECE de forma lineal con el presupuesto: no existe
  un "monto ideal" interior donde la curva dé la vuelta. Más publicidad es siempre mejor
  hasta que choca con una de tres paredes: la caja que tienes, el techo de 40 pedidos/día, o
  la saturación de la audiencia local (que encarece el CAC — y para eso NO hay dato con
  fuente, hay que medirlo).

  Por eso la pregunta correcta no es "cuánto es lo ideal" sino "cuánto puedo sostener".
  Escenario Base, 5% grupales, arrancando con distinto capital propio:
""")
print(f"  {'Capital inicial':<18}{'presupuesto objetivo':>22}{'neto 6 meses':>16}{'ped/día en feb':>18}")
print('  '+'-'*74)
for cap in (1000, 3000, 5000, 10000):
    for presu in (1500,):
        ped, neto, acum = simular(presu, 0.28, 13.50, G, capital=float(cap))
        print(f"  S/{cap:<16,}{('S/%s' % f'{presu:,}'):>22}{acum[5]:>16,.0f}{ped[5]/DIAS[5]:>18.1f}")

# ═══════════════════════════════════════════════════════════════════════════════
# 4 — LA COMBINACIÓN QUE HACE RENTABLE **TODOS** LOS MESES EN **TODOS** LOS ESCENARIOS
# ═══════════════════════════════════════════════════════════════════════════════
print('\n'+'='*94)
print('4 — LA RECETA PARA QUE NINGÚN MES CIERRE EN ROJO, NI EN EL PEOR ESCENARIO'.center(94))
print('='*94)

def cac_mix(cac, pct_ref):
    return (1-pct_ref)*cac + pct_ref*7.65

def todos_positivos(presu, g, pct_ref):
    peor = []
    for nom, r1, cac in ESC:
        _, neto, acum = simular(presu, r1, cac_mix(cac, pct_ref), g)
        peor.append(min(neto))
    return min(peor)

print("""
  Se buscan las dos palancas mínimas —% de pedidos grupales y % de clientes por referido—
  que dejan a los CINCO escenarios en positivo TODOS los meses, con S/1,500 de publicidad.
""")
print(f"  {'grupales →':<14}" + ''.join(f"{int(g*100):>10}%" for g in (0.05,0.10,0.15,0.20)))
print('  '+'-'*56)
mejor = None
for pr in (0.0, 0.2, 0.4, 0.6):
    fila = []
    for g in (0.05, 0.10, 0.15, 0.20):
        v = todos_positivos(1500, g, pr)
        fila.append(f"{v:>11,.0f}")
        if v > 0 and mejor is None: mejor = (pr, g, v)
    print(f"  referidos {int(pr*100):>3}%" + ''.join(fila))
print("  (peor mes del peor escenario, en soles)")

if mejor:
    pr, g, v = mejor
    print(f"""
  ►► NO HAY UN ÚNICO PUNTO MÍNIMO: la tabla de arriba es una FRONTERA. Todo lo que esté en
     positivo sirve, y se puede llegar por más grupales o por más referidos. Abajo se
     desarrolla una combinación equilibrada: {int(g*100)}% de pedidos grupales + {int(pr*100)}% de clientes por
     referido, con S/1,500/mes de publicidad — el peor mes del PEOR escenario cierra en
     +S/{v:,.0f}. Otra ruta igual de válida es 60% de referidos con solo 5% de grupales.
""")
    print(f"  {'Escenario':<16}" + ''.join(f"{m[:3]:>11}" for m in ETIQ) + f"{'6 meses':>12}")
    print('  '+'-'*89)
    for nom, r1, cac in ESC:
        ped, neto, acum = simular(1500, r1, cac_mix(cac, pr), g)
        print(f"  {nom:<16}" + ''.join(f"{x:>11,.0f}" for x in neto) + f"{acum[5]:>12,.0f}")
    print(f"""
  Las dos palancas ya están construidas y desplegadas: el sándwich gratis al organizador a
  partir de 5 (`ORGANIZER_FREE_MIN_SANDWICHES`) y el bono de referido de 400+120 puntos
  (`REFERRER_REWARD_POINTS`/`REFERRAL_BONUS_POINTS`). No hay que programar nada: hay que
  lograr que se usen. Y ninguna de las dos exige que salgas a vender.""")
