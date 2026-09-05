"""
SND//WCH — MODELO v9. 2026-09-02.

QUÉ CORRIGE DEL v8 (tres defectos que el dueño encontró, y los tres eran reales):

  1. "Calculas como que todos los días son buenos, sin variantes, sin promedios."
     El v8 era DETERMINISTA: un número por mes, presentado como si fuera seguro. Ahora todo
     corre por Monte Carlo y la respuesta es una DISTRIBUCIÓN con probabilidad.

  2. "Calculas como que siempre deben ser clientes nuevos, sin retención, sin frecuentes."
     El v8 SÍ tenía retención, pero clavada en el 22.6% del benchmark de EE.UU. — que
     describe un restaurante SIN programa de fidelidad. SND//WCH tiene puntos, rangos, menú
     secreto, escalera de referidos y nueve recordatorios automáticos, todos construidos
     para batir ese número, y el modelo los ignoraba. Además suponía que el 100% de los
     clientes nuevos se COMPRAN con publicidad, ignorando el referido (S/7.65, ya en código).

  3. "Los S/2 por kilómetro no salen de mis ganancias, lo paga el cliente."
     Cierto. Salen del modelo de rentabilidad. Lo que sí quedó como hallazgo aparte es que
     la app NO cobra por distancia real, aunque el dueño creía que sí (ver el final).

PRESUPUESTO DE PUBLICIDAD [DECISIÓN del dueño, 2026-09-02]:
  · S/2,000 al mes FIJOS desde el inicio, que salen de su bolsillo.
  · MÁS una fracción de lo que el negocio genere, reinvertida encima de esos S/2,000.
  · Y se calcula aparte el escenario SIN LÍMITE de dinero para marketing.

REGLA DE CONSTRUCCIÓN:
  [MEDIDO] [FUENTE] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import random
from datetime import date, timedelta
from math import ceil, exp

random.seed(20260902)

# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE A — HECHOS
# ═══════════════════════════════════════════════════════════════════════════════════════
CONTRIB_PEDIDO  = 16.42    # [MEDIDO] MENU_FINANCIAL_ANALYSIS.md v6.1
FIJOS_MES       = 500.0    # [MEDIDO] opera desde casa, sin planilla
CAP_POR_PERSONA = 40       # [MEDIDO] cocina por tandas, en servicio solo arma
SUELDO          = 1500.0   # [DECISIÓN] dueño 2026-09-02
COSTO_REFERIDO  = 7.65     # [MEDIDO] CLAUDE.md: insumo del 15CM de R06 + la bebida de R05
OBJETIVO        = 10000.0  # [DECISIÓN] dueño 2026-09-02
ADS_BASE        = 2000.0   # [DECISIÓN] dueño 2026-09-02: fijos al mes desde el inicio
APERTURA        = date(2026, 9, 7)
CERRADO_WEEKDAY = 0        # [MEDIDO] lunes cerrado

R1_MIN, R1_MAX   = 0.226, 0.400  # [FUENTE] Bloom: 22.6% base; rango de industria hasta 40%
E_TOTAL_DADO_2   = 6.93          # [FUENTE] Bloom, misma muestra
GAP_MIN, GAP_MAX = 28.0, 43.1    # [FUENTE] Paytronix: 33.0 canal propio, 43.1 agregadores
CPM_MIN, CPM_MAX = 5.0, 12.0     # [FUENTE] ibo.pe, Perú, rubro restaurantes
CTR, CVR, IGV    = 0.0297, 0.0189, 0.18   # [FUENTE] get-ryze 2026 / Paradero Digital

# [MÉTODO] Ruido mensual de demanda. El v8 no tenía ninguno: cada mes valía exactamente su
# valor esperado, sin un solo día malo. Un mes real tiene lluvia, feriados y una semana
# floja. Multiplicador lognormal de mediana 1; el 0.18 es una ELECCIÓN, no un dato.
SIGMA_MES = 0.18

# [MÉTODO] Arranque en frío: una marca que nadie conoce y una cuenta de anuncios sin
# historial convierten peor. El CAC del mes 1 va x1.6 y mejora hasta el mes 4. El tamaño es
# una elección declarada — pero suponer que NO existe, como hacía el v8 sin decirlo, es el
# supuesto más optimista de los dos.
COLD_START_MULT, COLD_START_MESES = 1.6, 4


def dias_operativos(anio, mes_, desde=None):
    d = date(anio, mes_, 1) if desde is None else desde
    n = 0
    while d.month == mes_:
        if d.weekday() != CERRADO_WEEKDAY:
            n += 1
        d += timedelta(days=1)
    return n


MESES_CAL = [(2026, 9), (2026, 10), (2026, 11), (2026, 12), (2027, 1), (2027, 2),
             (2027, 3), (2027, 4), (2027, 5), (2027, 6), (2027, 7), (2027, 8)]
DIAS = [dias_operativos(2026, 9, APERTURA)] + [dias_operativos(a, m) for a, m in MESES_CAL[1:]]
ETIQ = ['sep-26', 'oct-26', 'nov-26', 'dic-26', 'ene-27', 'feb-27',
        'mar-27', 'abr-27', 'may-27', 'jun-27', 'jul-27', 'ago-27']
HORIZONTE = len(DIAS)
MES6 = 5


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE B — sBG PRECOMPUTADO EN REJILLA
# ═══════════════════════════════════════════════════════════════════════════════════════
def superviv(a, r1, n_max=400):
    b = r1 / (1 - r1) * a
    out, acc = [], 1.0
    for j in range(1, n_max + 1):
        acc *= (b + j - 1) / (a + b + j - 1)
        out.append(acc)
    return out


def calibrar(r1):
    def err(a):
        S = superviv(a, r1)
        return 1 + sum(S) / S[0] - E_TOTAL_DADO_2
    lo, hi = 1e-4, 200.0
    flo = err(lo)
    for _ in range(120):
        mid = (lo + hi) / 2
        fmid = err(mid)
        if (flo < 0) == (fmid < 0):
            lo, flo = mid, fmid
        else:
            hi = mid
    return superviv((lo + hi) / 2, r1)


def perfil(S, gap, horizonte=HORIZONTE):
    p = [0.0] * horizonte
    prob, n = 1.0, 1
    while n <= len(S) and prob > 1e-7:
        m = int(((n - 1) * gap) // 30.44)
        if m >= horizonte:
            break
        p[m] += prob
        prob *= S[n - 1] / (S[n - 2] if n >= 2 else 1.0)
        n += 1
    return p


R1_GRID = [R1_MIN + (R1_MAX - R1_MIN) * i / 19 for i in range(20)]
GAP_GRID = [GAP_MIN + (GAP_MAX - GAP_MIN) * i / 5 for i in range(6)]
_S = {r: calibrar(r) for r in R1_GRID}
PERFILES = {(i, j): perfil(_S[r], g) for i, r in enumerate(R1_GRID) for j, g in enumerate(GAP_GRID)}
PPC = {i: 1 + sum(_S[r]) for i, r in enumerate(R1_GRID)}
MEDIO, TOPE = len(R1_GRID) // 2, len(R1_GRID) - 1


def cac_meta(cpm):
    return cpm / (1000 * CTR * CVR) * (1 + IGV)


CAC_MEDIO = cac_meta((CPM_MIN + CPM_MAX) / 2)


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE C — UNA CORRIDA
# ═══════════════════════════════════════════════════════════════════════════════════════
def corrida(ads_base, reinversion, viral, r1_fijo=None, cold=True, ruido=True):
    """[DERIVADO] Una realización del negocio a 12 meses.

    ads_base     [DECISIÓN] publicidad fija mensual, del bolsillo del dueño
    reinversion  [DECISIÓN] fracción de lo generado que se SUMA a esa base
    viral        [SIN MEDIR] clientes extra por referido/boca a boca por cada cliente
                 comprado. Cuestan COSTO_REFERIDO, no el CAC de Meta.
    """
    i = random.randrange(len(R1_GRID)) if r1_fijo is None else r1_fijo
    j = random.randrange(len(GAP_GRID))
    perf = PERFILES[(i, j)]
    cac_base = cac_meta(random.uniform(CPM_MIN, CPM_MAX))

    nuevos = [0.0] * HORIZONTE
    netos, pedidos_mes, ads_mes, personas = [], [], [], []
    ads = ads_base

    for m in range(HORIZONTE):
        mult = (COLD_START_MULT - (COLD_START_MULT - 1.0) * m / COLD_START_MESES) \
            if (cold and m < COLD_START_MESES) else 1.0
        cac = cac_base * mult

        comprados = ads / cac
        referidos = comprados * viral
        nuevos[m] = comprados + referidos

        ped = sum(nuevos[k] * perf[m - k] for k in range(m + 1) if m - k < len(perf))
        if ruido:
            ped *= exp(random.gauss(-SIGMA_MES ** 2 / 2, SIGMA_MES))

        dia = ped / DIAS[m]
        contratados = max(0, ceil(dia / CAP_POR_PERSONA) - 1)
        generado = ped * CONTRIB_PEDIDO - FIJOS_MES - contratados * SUELDO - referidos * COSTO_REFERIDO
        neto = generado - ads

        netos.append(neto)
        pedidos_mes.append(ped)
        ads_mes.append(ads)
        personas.append(contratados + 1)
        ads = ads_base + max(0.0, reinversion * generado)

    return {'netos': netos, 'pedidos': pedidos_mes, 'ads': ads_mes, 'personas': personas,
            'nuevos': nuevos, 'cac': cac_base}


def pct(xs, p):
    ys = sorted(xs)
    return ys[min(len(ys) - 1, max(0, int(round((len(ys) - 1) * p))))]


def escenario(ads_base, reinversion, viral, n=4000, **kw):
    runs = [corrida(ads_base, reinversion, viral, **kw) for _ in range(n)]
    m6 = [r['netos'][MES6] for r in runs]
    m12 = [r['netos'][-1] for r in runs]

    def sostenido(r):
        for m in range(HORIZONTE - 2):
            if all(r['netos'][m + k] >= OBJETIVO for k in range(3)):
                return m + 1
        return None
    llegan = [x for x in (sostenido(r) for r in runs) if x is not None]
    return {
        'm6_p10': pct(m6, 0.10), 'm6_p50': pct(m6, 0.50), 'm6_p90': pct(m6, 0.90),
        'm12_p10': pct(m12, 0.10), 'm12_p50': pct(m12, 0.50),
        'p_m6': sum(1 for x in m6 if x >= OBJETIVO) / len(m6),
        'p_llega': len(llegan) / len(runs),
        'mes_sost': pct(llegan, 0.50) if llegan else None,
        'ped_m6': pct([r['pedidos'][MES6] for r in runs], 0.50),
        'ads_m6': pct([r['ads'][MES6] for r in runs], 0.50),
        'pers_m6': pct([r['personas'][MES6] for r in runs], 0.50),
        'nuevos_m6': pct([r['nuevos'][MES6] for r in runs], 0.50),
    }


def sep(t=''):
    print('\n' + '=' * 96)
    if t:
        print(t.center(96))
        print('=' * 96)


# ═══════════════════════════════════════════════════════════════════════════════════════
sep('MODELO v9 — CON VARIANZA, CON RETENCIÓN REAL Y CON REFERIDOS')
print(f"""
  PRESUPUESTO [DECISIÓN del dueño]: S/{ADS_BASE:,.0f}/mes fijos desde el inicio, de su bolsillo, MÁS una
  fracción de lo que el negocio genere, reinvertida encima. Y aparte, el escenario sin
  límite de dinero (sección 4).

  CADA ESCENARIO SON MILES DE CORRIDAS, no un número. Se sortean en cada una:
     · el CPM de Meta ................ S/{CPM_MIN:.0f} a S/{CPM_MAX:.0f}          [FUENTE]
     · la tasa de 2º pedido .......... {R1_MIN*100:.1f}% a {R1_MAX*100:.0f}%          [FUENTE, rango de industria]
     · los días entre pedidos ........ {GAP_MIN:.0f} a {GAP_MAX:.0f}            [FUENTE]
     · un ruido mensual de demanda ... sigma {SIGMA_MES}         [MÉTODO, elección declarada]
  Y se aplica un arranque en frío: CAC x{COLD_START_MULT} el primer mes, normalizando al mes {COLD_START_MESES}.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('1 — LA ARITMÉTICA QUE MANDA SOBRE TODO LO DEMÁS')
print(f"""
  Antes de cualquier tabla, el número que explica el resto:

     Un cliente recién comprado entrega UN pedido en el mes en que lo compras.
     Ese pedido deja ................................. S/{CONTRIB_PEDIDO:.2f}
     Comprarlo cuesta (CAC medio, cuenta madura) ..... S/{CAC_MEDIO:.2f}
     Comprarlo cuesta en el arranque en frío ......... S/{CAC_MEDIO*COLD_START_MULT:.2f}
     El resto de sus pedidos llegan en los MESES SIGUIENTES.

  ►► DE AHÍ SALE TODO. La publicidad casi no se paga sola dentro del mes en que se gasta:
     se paga con los pedidos que ese cliente hace DESPUÉS. Por eso reinvertir solo lo
     generado no arranca ningún motor, y por eso la retención no es "una palanca más" —
     es lo único que convierte publicidad en negocio.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep(f'2 — EL PLAN REAL: S/{ADS_BASE:,.0f}/MES FIJOS + REINVERSIÓN ENCIMA')
print(f"""
  Retención sorteada en todo el rango de industria, viralidad 0.3 [SIN MEDIR, escenario]:
""")
print(f"  {'reinversión':>12}{'ads mes 6':>12}{'ped/día m6':>12}{'pers':>6}"
      f"{'neto mes 6 (P10/P50/P90)':>34}{'P(≥10k m6)':>12}{'P(llega 12m)':>14}")
print('  ' + '-' * 104)
for r in (0.0, 0.3, 0.6, 0.9):
    e = escenario(ADS_BASE, r, 0.3)
    rango = f"{e['m6_p10']:>9,.0f}/{e['m6_p50']:>9,.0f}/{e['m6_p90']:>9,.0f}"
    print(f"  {r*100:>10.0f}%{e['ads_m6']:>12,.0f}{e['ped_m6']/DIAS[MES6]:>12.1f}{e['pers_m6']:>6.0f}"
          f"{rango:>34}{e['p_m6']*100:>11.0f}%{e['p_llega']*100:>13.0f}%")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('3 — LAS DOS PALANCAS QUE EL v8 TENÍA APAGADAS')
print(f"\n  Con S/{ADS_BASE:,.0f}/mes fijos y reinversión al 60%:\n")
print(f"  {'retención 2º pedido':>22}{'viral':>8}{'ped/cliente':>13}"
      f"{'neto m6 P50':>14}{'neto m12 P50':>15}{'P(≥10k m6)':>12}{'P(llega 12m)':>14}")
print('  ' + '-' * 98)
for idx, etq in ((0, f'{R1_MIN*100:.1f}% (piso)'), (MEDIO, f'{R1_GRID[MEDIO]*100:.1f}% (medio)'), (TOPE, f'{R1_MAX*100:.0f}% (tope)')):
    for viral in (0.0, 0.3, 0.6):
        e = escenario(ADS_BASE, 0.6, viral, n=2500, r1_fijo=idx)
        print(f"  {etq:>22}{viral:>8.1f}{PPC[idx]:>13.2f}{e['m6_p50']:>14,.0f}"
              f"{e['m12_p50']:>15,.0f}{e['p_m6']*100:>11.0f}%{e['p_llega']*100:>13.0f}%")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('4 — SIN LÍMITE DE DINERO PARA MARKETING: ¿CUÁNTO HARÍA FALTA?')
print("""
  Acá el presupuesto deja de ser una restricción y se convierte en la incógnita: ¿cuánta
  publicidad mensual pone la MEDIANA del mes 6 en S/10,000? Se busca por bisección sobre
  miles de corridas, con reinversión del 60% encima de esa base.
""")


def base_necesaria(viral, r1_fijo, objetivo=OBJETIVO, n=1200):
    lo, hi = 0.0, 400000.0
    if escenario(hi, 0.6, viral, n=400, r1_fijo=r1_fijo)['m6_p50'] < objetivo:
        return None
    for _ in range(18):
        mid = (lo + hi) / 2
        if escenario(mid, 0.6, viral, n=n, r1_fijo=r1_fijo)['m6_p50'] >= objetivo:
            hi = mid
        else:
            lo = mid
    return hi


print(f"  {'retención':>14}{'viral':>8}{'ads/mes necesarios':>21}{'ped/día m6':>13}{'personas':>10}"
      f"{'clientes nuevos/mes':>21}")
print('  ' + '-' * 88)
SIN_LIMITE = {}
for idx, etq in ((0, f'{R1_MIN*100:.1f}% piso'), (MEDIO, f'{R1_GRID[MEDIO]*100:.1f}% medio'), (TOPE, f'{R1_MAX*100:.0f}% tope')):
    for viral in (0.0, 0.3):
        g = base_necesaria(viral, idx)
        if g is None:
            print(f"  {etq:>14}{viral:>8.1f}{'—':>21}{'—':>13}{'—':>10}{'no se alcanza':>21}")
            continue
        e = escenario(g, 0.6, viral, n=2500, r1_fijo=idx)
        SIN_LIMITE[(idx, viral)] = (g, e)
        print(f"  {etq:>14}{viral:>8.1f}{('S/%.0f' % g):>21}{e['ped_m6']/DIAS[MES6]:>13.1f}"
              f"{e['pers_m6']:>10.0f}{e['nuevos_m6']:>21,.0f}")

print("""
  ►► SIN LÍMITE DE DINERO EL OBJETIVO SÍ SE ALCANZA EN EL MES 6 — pero mira las dos últimas
     columnas antes de celebrarlo. Esa es la cantidad de personas DISTINTAS que hay que
     conseguir en Trujillo cada mes, y de gente que hay que contratar. El modelo compra
     clientes sin que suba el precio y sin que se acabe el mercado: ninguna de las dos cosas
     es cierta en la vida real, así que estos números son un PISO de dificultad, no un plan.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('5 — ¿QUÉ DECIDE MÁS? (una variable a la vez)')
BASE = escenario(ADS_BASE, 0.6, 0.3, n=2500, r1_fijo=MEDIO)
print(f"\n  Caso medio: S/{ADS_BASE:,.0f}/mes + 60% de reinversión, viral 0.3, retención {R1_GRID[MEDIO]*100:.1f}%")
print(f"  Neto mes 6 P50 = S/{BASE['m6_p50']:,.0f}   ·   Neto mes 12 P50 = S/{BASE['m12_p50']:,.0f}\n")
print(f"  {'cambio':>46}{'neto m6 P50':>14}{'efecto m6':>12}{'neto m12 P50':>15}{'efecto m12':>13}")
print('  ' + '-' * 100)
VAR = [
    ('retención al piso (22.6%)', escenario(ADS_BASE, 0.6, 0.3, n=2500, r1_fijo=0)),
    ('retención al tope (40%)', escenario(ADS_BASE, 0.6, 0.3, n=2500, r1_fijo=TOPE)),
    ('sin viralidad (0)', escenario(ADS_BASE, 0.6, 0.0, n=2500, r1_fijo=MEDIO)),
    ('viralidad alta (0.6)', escenario(ADS_BASE, 0.6, 0.6, n=2500, r1_fijo=MEDIO)),
    ('publicidad fija S/5,000 en vez de S/2,000', escenario(5000.0, 0.6, 0.3, n=2500, r1_fijo=MEDIO)),
    ('publicidad fija S/10,000 en vez de S/2,000', escenario(10000.0, 0.6, 0.3, n=2500, r1_fijo=MEDIO)),
    ('sin reinversión (solo los fijos)', escenario(ADS_BASE, 0.0, 0.3, n=2500, r1_fijo=MEDIO)),
    ('reinversión 90%', escenario(ADS_BASE, 0.9, 0.3, n=2500, r1_fijo=MEDIO)),
    ('sin arranque en frío (lo que suponía el v8)', escenario(ADS_BASE, 0.6, 0.3, n=2500, r1_fijo=MEDIO, cold=False)),
]
for nombre, e in VAR:
    print(f"  {nombre:>46}{e['m6_p50']:>14,.0f}{e['m6_p50']-BASE['m6_p50']:>+12,.0f}"
          f"{e['m12_p50']:>15,.0f}{e['m12_p50']-BASE['m12_p50']:>+13,.0f}")

print("""
  ►► EL ORDEN CAMBIA SEGÚN EL HORIZONTE, y eso es lo importante de este cuadro: en el mes 6
     manda lo que empuja al principio (cuánta publicidad se pone). A 12 meses la retención
     y la viralidad se pagan solas y pasan al frente. Un plan optimizado solo para el mes 6
     compra crecimiento caro; uno que además mueve la retención lo compra una vez.

  ►► Y EL EXTREMO ALTO DE TODAS ESTAS DISTRIBUCIONES NO ES CREÍBLE. Este modelo no tiene
     tamaño de mercado ni encarecimiento del CAC al escalar, así que en las corridas
     afortunadas compra clientes sin límite y sin que suba el precio. La mediana y el P10
     son los números que sirven; el P90 es un artefacto de lo que al modelo le falta.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('RESUMEN')
e_plan = escenario(ADS_BASE, 0.6, 0.3, n=4000)
print(f"""
  1. CON EL PLAN REAL (S/{ADS_BASE:,.0f}/mes + 60% de reinversión, retención sorteada en todo el rango,
     viralidad 0.3): el mes 6 queda en S/{e_plan['m6_p50']:,.0f} de mediana, con un {e_plan['p_m6']*100:.0f}% de
     probabilidad de llegar a S/10,000 y un {e_plan['p_llega']*100:.0f}% de llegar en algún momento de los 12
     meses. El rango del mes 6 va de S/{e_plan['m6_p10']:,.0f} (P10) a S/{e_plan['m6_p90']:,.0f} (P90).

  2. LA PUBLICIDAD NO SE PAGA DENTRO DEL MES. Un cliente comprado deja S/{CONTRIB_PEDIDO:.2f} en su primer
     pedido y cuesta S/{CAC_MEDIO:.2f}-{CAC_MEDIO*COLD_START_MULT:.2f}. El negocio se hace con el que VUELVE, no con el que
     compras. Por eso la retención es el motor y no un adorno.

  3. SIN LÍMITE DE DINERO EL MES 6 SE ALCANZA, pero exige una cantidad de clientes nuevos
     por mes que ningún modelo puede validar. Ese número hay que contrastarlo con Trujillo.

  4. LO QUE ESTE MODELO SIGUE SIN SABER, y no se despeja discutiendo: el CAC real de
     Trujillo, cuánto sube al escalar, cuánta viralidad hay, y si el mercado alcanza. Las
     cuatro se miden en las primeras semanas de venta.
""")
