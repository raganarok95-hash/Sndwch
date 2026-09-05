"""
SND//WCH — MODELO v11. 2026-09-05. 20,000 escenarios.

QUÉ CAMBIA RESPECTO DEL v10, y por qué cada cambio mueve el resultado.

  1. ⚠ LA CONTRIBUCIÓN POR PEDIDO ESTABA INFLADA. El v10 usaba S/16.42, que es el promedio
     de los CINCO SIGNATURES y de ningún ARMA EL TUYO. Un BYO deja ~S/6 menos. Si la mitad
     de los pedidos son BYO —que es lo que hay que asumir mientras nadie mida la mezcla
     real— la contribución de verdad es ~S/14.1. Todo el v10 (y el v9, y el v8) proyectó
     sobre un número que ningún pedido promedio produce. Este modelo la calcula desde los
     componentes reutilizando `comparativa_menu.contrib`, para que no haya DOS fuentes.

  2. LA FASE DE APRENDIZAJE DE META, QUE NINGÚN MODELO ANTERIOR TENÍA. Es la respuesta a
     "¿cuánta publicidad hace falta?". Meta necesita ~50 conversiones por conjunto de
     anuncios cada 7 días para salir de la fase de aprendizaje. Por debajo de eso la entrega
     es más cara e inestable — o sea que el CAC no es una constante que se pueda pagar en
     cualquier cantidad: **hay un piso de presupuesto por debajo del cual el dinero rinde
     peor por sol gastado.** Un modelo sin esto contesta "gasta poquito" siempre, porque la
     publicidad se resta hoy y el cliente devuelve después.

  3. LOS REFERIDOS AHORA CUELGAN DE LA BASE DE CLIENTES, NO DE LAS COMPRAS DEL MES. El v10
     hacía `referidos = comprados × viral`: si dejabas de pagar publicidad, los referidos
     se iban a cero el mismo mes, aunque tuvieras mil clientes contentos. Eso hacía
     estructuralmente imposible que lo orgánico fuera el plan. Ahora los referidos salen de
     los PEDIDOS del mes, que es de donde salen en la vida real.

  4. LAS ETIQUETAS DE MES DEL v10 ESTABAN CORRIDAS UN MES. Su texto decía "mes 3 (nov-26)"
     y "mes 6 (feb-27)" mientras los índices 2 y 5 apuntan a dic-26 y mar-27. Los índices
     estaban bien y el texto mal, así que el modelo medía lo correcto y lo reportaba con el
     nombre equivocado. Acá se derivan del propio calendario y no se escriben a mano.

  SIGUE SIN MODELAR, declarado: estacionalidad peruana, fatiga creativa, tiempo de cobro de
  Culqi, y competencia que reacciona. Ninguno se inventa: se nombran.

REGLA DE CONSTRUCCIÓN: [MEDIDO] [FUENTE] [PLATAFORMA] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import os
import random
import sys
from datetime import date, timedelta
from math import ceil, exp

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comparativa_menu import contrib as _contrib_menu  # noqa: E402

random.seed(20260905)

N_ESCENARIOS = 20_000    # [DECISIÓN] pedido del dueño 2026-09-05

# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE A — HECHOS Y DECISIONES
# ═══════════════════════════════════════════════════════════════════════════════════════
# [DERIVADO] Se calcula desde los componentes del menú ACTUAL (atún cotizado, gramajes
# Subway, +S/2 en el 30CM, Yape por defecto → 30% con tarjeta), con la mitad de los pedidos
# por ARMA EL TUYO. NO es el 16.42 de los Signatures solos.
FRAC_BYO       = 0.50    # [MÉTODO] mitad ARMA EL TUYO. Ver sensibilidad al final.
CONTRIB_PEDIDO = _contrib_menu("actual", FRAC_BYO)
CONTRIB_V10    = 16.42   # el número viejo, solo para mostrar la diferencia

FIJOS_MES       = 500.0   # [MEDIDO] opera desde casa, sin planilla
CAP_POR_PERSONA = 40      # [MEDIDO] cocina por tandas; en servicio solo arma
SUELDO          = 1500.0  # [DECISIÓN] dueño 2026-09-02
COSTO_REFERIDO  = 7.65    # [MEDIDO] insumo del 15CM de R06 + bebida de R05
APERTURA        = date(2026, 10, 12)  # [MEDIDO] techo que puso el dueño; el 12 es lunes (cerrado)
CERRADO_WEEKDAY = 0       # [MEDIDO] lunes cerrado

META_M3, MES_M3 = 4000.0, 3   # [DECISIÓN] dueño 2026-09-02: desde el mes 3, neto ≥ S/4,000
META_M6, MES_M6 = 5000.0, 6   # [DECISIÓN] dueño 2026-09-02: desde el mes 6, neto ≥ S/5,000
DESDE_M3, DESDE_M6 = MES_M3 - 1, MES_M6 - 1   # a índice base 0

R1_MIN, R1_MAX   = 0.226, 0.400   # [FUENTE] Bloom: recompra al 1.er mes, rango de industria
E_TOTAL_DADO_2   = 6.93           # [FUENTE] Bloom
GAP_MIN, GAP_MAX = 28.0, 43.1     # [FUENTE] Paytronix: días entre pedidos
CPM_MIN, CPM_MAX = 5.0, 12.0      # [AGENCIA] ibo.pe, Perú, restaurantes — NO es medición auditada
CTR, CVR, IGV    = 0.0297, 0.0189, 0.18   # [AGENCIA] get-ryze / Two Minute Reports

SIGMA_MES = 0.18                  # [MÉTODO] ruido mensual de demanda
COLD_START_MULT, COLD_START_MESES = 1.6, 4   # [MÉTODO] arranque en frío
SATURACION_POR_MIL  = 0.10        # [MÉTODO] el CAC sube 10% por cada 1,000 clientes ya captados
OVERHEAD_POR_PEDIDO = 0.50        # [MÉTODO] gas, frío y coordinación, aparte del insumo
RENDIMIENTO_MES_1   = 0.6         # [MÉTODO] una persona nueva rinde menos su primer mes

# ── LA FASE DE APRENDIZAJE DE META ────────────────────────────────────────────────────
# [PLATAFORMA] Regla oficial de Meta: un CONJUNTO DE ANUNCIOS necesita ~50 conversiones cada
# 7 días para salir de la fase de aprendizaje. Se modela UN SOLO conjunto a propósito:
# repartir el presupuesto en varios multiplica el problema (varios aprendizajes que nunca se
# completan), y ésa es justamente la recomendación de FLUJO_VIDEO_ANUNCIOS.md.
CONV_APRENDIZAJE_7D  = 50.0
CONV_APRENDIZAJE_MES = CONV_APRENDIZAJE_7D * 30.44 / 7.0     # ≈ 217 conversiones/mes

# [MÉTODO — ASUNCIÓN, NO MEDICIÓN] Cuánto MÁS caro sale cada cliente cuando el conjunto no
# sale de aprendizaje. Meta dice que la entrega es "menos eficiente y más inestable" pero NO
# publica un número, y no encontré ninguna medición auditada. Es la palanca más incierta de
# todo el modelo y por eso se recorre entera abajo (bloque de sensibilidad): con 1.00 el
# mecanismo se apaga y el modelo vuelve a ser el v10.
PENAL_APRENDIZAJE = 1.30


def dias_operativos(anio, mes_, desde=None):
    d = date(anio, mes_, 1) if desde is None else desde
    n = 0
    while d.month == mes_:
        if d.weekday() != CERRADO_WEEKDAY:
            n += 1
        d += timedelta(days=1)
    return n


def _calendario(apertura, meses):
    """[DERIVADO] Etiquetas y días operativos salen del calendario, nunca escritos a mano —
    es lo que en el v10 quedó corrido un mes en el texto."""
    ab = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    out, a, m = [], apertura.year, apertura.month
    for k in range(meses):
        out.append((a, m, f"{ab[m-1]}-{str(a)[2:]}", dias_operativos(a, m, apertura if k == 0 else None)))
        m += 1
        if m == 13:
            a, m = a + 1, 1
    return out


CAL = _calendario(APERTURA, 12)
ETIQ = [c[2] for c in CAL]
DIAS = [c[3] for c in CAL]
HORIZONTE = len(CAL)


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE B — sBG PRECOMPUTADO (retención de clientes)
# ═══════════════════════════════════════════════════════════════════════════════════════
def superviv(a, r1, n_max=400):
    b = r1 / (1 - r1) * a
    out, acc = [], 1.0
    for _ in range(n_max):
        acc *= (b + len(out)) / (a + b + len(out))
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


def cac_meta(cpm):
    """[DERIVADO] CAC = CPM / (1000 · CTR · CVR) · (1+IGV). Las tres tasas son [AGENCIA]."""
    return cpm / (1000 * CTR * CVR) * (1 + IGV)


CAC_MEDIO = cac_meta((CPM_MIN + CPM_MAX) / 2)


def clientes_comprados(ads, cac_limpio, penal_max):
    """Resuelve el punto fijo: el CAC efectivo depende de cuántas conversiones compras, y
    cuántas compras depende del CAC. Se itera; converge en pocas vueltas porque es monótono.

    Devuelve (clientes, cac_efectivo, salio_de_aprendizaje)."""
    if penal_max <= 1.0:
        n = ads / cac_limpio
        return n, cac_limpio, n >= CONV_APRENDIZAJE_MES
    n = ads / (cac_limpio * penal_max)      # arranca por el caso pesimista
    for _ in range(40):
        falta = max(0.0, 1.0 - n / CONV_APRENDIZAJE_MES)
        cac_ef = cac_limpio * (1.0 + (penal_max - 1.0) * falta)
        n_nuevo = ads / cac_ef
        if abs(n_nuevo - n) < 1e-9:
            n = n_nuevo
            break
        n = n_nuevo
    falta = max(0.0, 1.0 - n / CONV_APRENDIZAJE_MES)
    cac_ef = cac_limpio * (1.0 + (penal_max - 1.0) * falta)
    return n, cac_ef, n >= CONV_APRENDIZAJE_MES


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE C — UNA CORRIDA
# ═══════════════════════════════════════════════════════════════════════════════════════
def corrida(ads_base, reinversion, viral, contrib=None, penal=PENAL_APRENDIZAJE,
            saturacion=SATURACION_POR_MIL, cold=True, ruido=True):
    """`viral` = referidos que trae cada PEDIDO servido (no cada cliente comprado)."""
    contrib = CONTRIB_PEDIDO if contrib is None else contrib
    perf = PERFILES[(random.randrange(len(R1_GRID)), random.randrange(len(GAP_GRID)))]
    cac_base = cac_meta(random.uniform(CPM_MIN, CPM_MAX))

    nuevos = [0.0] * HORIZONTE
    netos, ped_mes, ads_mes, pers_mes, nuevos_mes, aprend = [], [], [], [], [], []
    ads, acumulados, personal_previo, ped_prev = ads_base, 0.0, 1, 0.0

    for m in range(HORIZONTE):
        frio = (COLD_START_MULT - (COLD_START_MULT - 1.0) * m / COLD_START_MESES) \
            if (cold and m < COLD_START_MESES) else 1.0
        sat = 1.0 + saturacion * (acumulados / 1000.0)
        cac_limpio = cac_base * frio * sat

        comprados, _cac_ef, salio = clientes_comprados(ads, cac_limpio, penal)
        # Los referidos salen de los PEDIDOS del mes anterior: alguien recomienda porque ya
        # comió, no porque un anuncio lo captó. Es lo que permite que lo orgánico sostenga.
        referidos = ped_prev * viral
        nuevos[m] = comprados + referidos
        acumulados += nuevos[m]

        ped = sum(nuevos[k] * perf[m - k] for k in range(m + 1) if m - k < len(perf))
        if ruido:
            ped *= exp(random.gauss(-SIGMA_MES ** 2 / 2, SIGMA_MES))

        necesarios = max(1, ceil((ped / DIAS[m]) / CAP_POR_PERSONA))
        contratados = necesarios - 1
        nuevos_este_mes = max(0, necesarios - personal_previo)
        cap_ef = (necesarios - nuevos_este_mes * (1 - RENDIMIENTO_MES_1)) * CAP_POR_PERSONA * DIAS[m]
        ped = min(ped, cap_ef)
        personal_previo, ped_prev = necesarios, ped

        generado = (ped * (contrib - OVERHEAD_POR_PEDIDO) - FIJOS_MES
                    - contratados * SUELDO - referidos * COSTO_REFERIDO)
        neto = generado - ads

        netos.append(neto); ped_mes.append(ped); ads_mes.append(ads)
        pers_mes.append(necesarios); nuevos_mes.append(nuevos[m]); aprend.append(salio)
        ads = ads_base + max(0.0, reinversion * generado)

    return {'netos': netos, 'pedidos': ped_mes, 'ads': ads_mes, 'personas': pers_mes,
            'nuevos': nuevos_mes, 'aprendizaje': aprend, 'acumulados': acumulados}


def cumple_camino(netos):
    """[DERIVADO] El objetivo es un CAMINO: hay que sostenerlo TODOS los meses, no tocarlo
    una vez. Basta un mes por debajo para romperlo."""
    if any(netos[m] < META_M3 for m in range(DESDE_M3, HORIZONTE)):
        return False
    return all(netos[m] >= META_M6 for m in range(DESDE_M6, HORIZONTE))


def pct(xs, p):
    ys = sorted(xs)
    return ys[min(len(ys) - 1, max(0, int(round((len(ys) - 1) * p))))]


def escenario(ads_base, reinversion, viral, n=N_ESCENARIOS, **kw):
    runs = [corrida(ads_base, reinversion, viral, **kw) for _ in range(n)]
    g = lambda f: [f(r) for r in runs]  # noqa: E731
    return {
        'n': n, 'ads_base': ads_base, 'reinv': reinversion, 'viral': viral,
        'p_camino': sum(1 for r in runs if cumple_camino(r['netos'])) / n,
        'p_m3': sum(1 for r in runs if r['netos'][DESDE_M3] >= META_M3) / n,
        'p_m6': sum(1 for r in runs if r['netos'][DESDE_M6] >= META_M6) / n,
        'm3_p10': pct(g(lambda r: r['netos'][DESDE_M3]), 0.10),
        'm3_p50': pct(g(lambda r: r['netos'][DESDE_M3]), 0.50),
        'm3_p90': pct(g(lambda r: r['netos'][DESDE_M3]), 0.90),
        'm6_p10': pct(g(lambda r: r['netos'][DESDE_M6]), 0.10),
        'm6_p50': pct(g(lambda r: r['netos'][DESDE_M6]), 0.50),
        'm6_p90': pct(g(lambda r: r['netos'][DESDE_M6]), 0.90),
        'ped_m3': pct(g(lambda r: r['pedidos'][DESDE_M3]), 0.50),
        'ped_m6': pct(g(lambda r: r['pedidos'][DESDE_M6]), 0.50),
        'nuevos_m3': pct(g(lambda r: r['nuevos'][DESDE_M3]), 0.50),
        'nuevos_m6': pct(g(lambda r: r['nuevos'][DESDE_M6]), 0.50),
        'ads_m6': pct(g(lambda r: r['ads'][DESDE_M6]), 0.50),
        'pers_m6': pct(g(lambda r: r['personas'][DESDE_M6]), 0.50),
        'p_aprendizaje_m3': sum(1 for r in runs if r['aprendizaje'][DESDE_M3]) / n,
        'p_aprendizaje_m6': sum(1 for r in runs if r['aprendizaje'][DESDE_M6]) / n,
        'acum': pct(g(lambda r: r['acumulados']), 0.50),
        'caja_min': pct(g(lambda r: min(r['netos'])), 0.50),
    }


def sep(t=''):
    print('\n' + '=' * 100)
    if t:
        print(t.center(100)); print('=' * 100)


def s(x, d=0):
    return f"S/{x:,.{d}f}"


def pedidos_necesarios(neto_objetivo, ads, viral, contrib=None, dias=26):
    """[DERIVADO] Invierte la ecuación del neto: ¿cuántos pedidos al mes hacen falta para un
    neto dado? Se resuelve iterando porque el personal y los referidos dependen del volumen."""
    contrib = CONTRIB_PEDIDO if contrib is None else contrib
    ped = 1.0
    for _ in range(200):
        contratados = max(1, ceil((ped / dias) / CAP_POR_PERSONA)) - 1
        ref = ped * viral
        nuevo = (neto_objetivo + FIJOS_MES + ads + contratados * SUELDO + ref * COSTO_REFERIDO) \
            / (contrib - OVERHEAD_POR_PEDIDO)
        if abs(nuevo - ped) < 1e-6:
            break
        ped = nuevo
    return ped


# ═══════════════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    VIRAL = 0.06   # [MÉTODO] 6 referidos por cada 100 pedidos servidos

    sep('SND//WCH — MODELO v11 · PROYECCIÓN A 3 Y 6 MESES · 20,000 ESCENARIOS')
    print(f"""
  Apertura: {APERTURA:%d de %B de %Y} (el techo que puso el dueño). Lunes cerrado.
  Mes 3 = {ETIQ[DESDE_M3]}  ·  Mes 6 = {ETIQ[DESDE_M6]}   ← derivados del calendario, no escritos a mano
  Objetivo [DECISIÓN del dueño]: neto >= {s(META_M3)} desde el mes 3 y >= {s(META_M6)} desde el mes 6,
  TODOS los meses. No es un pico: basta un mes por debajo para romperlo.

  ⚠ CORRECCIÓN QUE CAMBIA TODAS LAS PROYECCIONES ANTERIORES
     El v8, v9 y v10 usaron una contribución por pedido de {s(CONTRIB_V10, 2)}, que es el promedio de
     los CINCO SIGNATURES y de ningun ARMA EL TUYO. Con la mitad de los pedidos por BYO
     —lo unico honesto mientras nadie mida la mezcla real— la contribucion es {s(CONTRIB_PEDIDO, 2)}.
     Son {s(CONTRIB_V10 - CONTRIB_PEDIDO, 2)} menos por pedido, un {(1-CONTRIB_PEDIDO/CONTRIB_V10)*100:.0f}% de sobrestimacion arrastrada por tres modelos.

  ⚠ MECANISMO NUEVO: LA FASE DE APRENDIZAJE DE META
     Meta necesita ~{CONV_APRENDIZAJE_7D:.0f} conversiones por conjunto de anuncios cada 7 dias
     (= {CONV_APRENDIZAJE_MES:.0f} al mes) para salir de la fase de aprendizaje. Por debajo, la entrega es
     mas cara. Con un CAC limpio de {s(CAC_MEDIO, 2)} (CPM medio), salir de aprendizaje cuesta
     {s(CAC_MEDIO * CONV_APRENDIZAJE_MES)}/mes. Ese es el piso real, y ningun modelo anterior lo tenia.
     El castigo por no salir ({(PENAL_APRENDIZAJE-1)*100:.0f}% mas caro) es una ASUNCION, no una medicion — se recorre abajo.
""")

    sep('1 · EL ESCENARIO BASE — publicidad fija, sin reinversion')
    print(f"  {N_ESCENARIOS:,} escenarios por celda. Percentiles P10 / P50 / P90 del neto mensual.\n")
    print(f"  {'ads/mes':>9} {'neto mes 3':>28} {'neto mes 6':>28} {'P(mes3)':>9} {'P(mes6)':>9} {'P(camino)':>10}")
    print(f"  {'':>9} {'P10':>9}{'P50':>9}{'P90':>10} {'P10':>9}{'P50':>9}{'P90':>10}")
    print('  ' + '-' * 96)
    BASE = {}
    for ads in (0, 1000, 2000, 3000, 4000, 6000, 8000):
        e = escenario(float(ads), 0.0, VIRAL)
        BASE[ads] = e
        print(f"  {ads:>9,} {e['m3_p10']:>9,.0f}{e['m3_p50']:>9,.0f}{e['m3_p90']:>10,.0f} "
              f"{e['m6_p10']:>9,.0f}{e['m6_p50']:>9,.0f}{e['m6_p90']:>10,.0f} "
              f"{e['p_m3']*100:>8.1f}% {e['p_m6']*100:>8.1f}% {e['p_camino']*100:>9.1f}%")

    sep('2 · DONDE ESTA EL OPTIMO DE PUBLICIDAD')
    print("""
  La publicidad se RESTA del neto del mismo mes y el cliente devuelve su valor en los meses
  siguientes. Por eso no es cierto que "mas presupuesto = mas neto": hay un optimo intermedio
  y pasarse EMPEORA el resultado. Se busca por rejilla fina, no por biseccion.
""")
    print(f"  {'ads/mes':>9} {'neto m3 (P50)':>15} {'neto m6 (P50)':>15} {'pedidos/dia m6':>15} "
          f"{'sale aprend. m6':>16} {'P(camino)':>10}")
    print('  ' + '-' * 96)
    REJILLA = (0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000, 14000)
    fino = {}
    for ads in REJILLA:
        e = escenario(float(ads), 0.0, VIRAL, n=4000)
        fino[ads] = e
        print(f"  {ads:>9,} {e['m3_p50']:>15,.0f} {e['m6_p50']:>15,.0f} "
              f"{e['ped_m6']/DIAS[DESDE_M6]:>15,.1f} {e['p_aprendizaje_m6']*100:>15.0f}% "
              f"{e['p_camino']*100:>9.1f}%")

    mejor_m6 = max(fino.items(), key=lambda kv: kv[1]['m6_p50'])
    mejor_cam = max(fino.items(), key=lambda kv: kv[1]['p_camino'])
    print(f"""
  OPTIMO por neto del mes 6 (mediana) ....... {s(float(mejor_m6[0]))}/mes  ->  neto {s(mejor_m6[1]['m6_p50'])}
  OPTIMO por probabilidad de sostener ....... {s(float(mejor_cam[0]))}/mes  ->  {mejor_cam[1]['p_camino']*100:.1f}% de exito
""")

    sep('3 · SENSIBILIDAD AL CASTIGO POR NO SALIR DE APRENDIZAJE (la palanca mas incierta)')
    print("""
  Con 1.00 el mecanismo se APAGA y el modelo vuelve a ser el v10. Cuanto mas alto el castigo,
  mas obligatorio es concentrar el presupuesto en un solo conjunto y superar el piso.
""")
    print(f"  {'castigo':>8} " + ''.join(f"{a:>12,}" for a in (1000, 2000, 3000, 4000, 6000)))
    print('  ' + '-' * 70)
    for p in (1.00, 1.15, 1.30, 1.50, 1.80):
        fila = []
        for ads in (1000, 2000, 3000, 4000, 6000):
            e = escenario(float(ads), 0.0, VIRAL, n=2500, penal=p)
            fila.append(f"{e['m6_p50']:>12,.0f}")
        print(f"  {p:>8.2f} " + ''.join(fila))
    print("\n  (neto mediano del mes 6, en soles, para cada combinacion)")

    sep('4 · CUANTO HAY QUE VENDER — la meta traducida a pedidos')
    print(f"""
  Invirtiendo la ecuacion del neto, con la contribucion real de {s(CONTRIB_PEDIDO, 2)}:
""")
    print(f"  {'meta':>22} {'ads/mes':>10} {'pedidos/mes':>13} {'pedidos/dia':>13} {'clientes nuevos/mes':>21}")
    print('  ' + '-' * 84)
    for etiqueta, meta, mi in ((f"mes 3 ({ETIQ[DESDE_M3]})", META_M3, DESDE_M3),
                               (f"mes 6 ({ETIQ[DESDE_M6]})", META_M6, DESDE_M6)):
        for ads in (2000, 3000, 4000):
            ped = pedidos_necesarios(meta, ads, VIRAL, dias=DIAS[mi])
            nuevos = ads / CAC_MEDIO + ped * VIRAL
            print(f"  {etiqueta:>22} {ads:>10,} {ped:>13,.0f} {ped/DIAS[mi]:>13,.1f} {nuevos:>21,.0f}")

    sep('5 · SENSIBILIDAD A LA MEZCLA DE MENU (cuantos pedidos son ARMA EL TUYO)')
    print("""
  Es la incertidumbre mas grande del lado del producto, y nadie la ha medido todavia:
  `retention_report` ya devuelve `attach.size30Pct`, asi que se reemplaza con dato real
  apenas haya ventas. Un Signature deja ~S/6 mas que un ARMA EL TUYO.
""")
    print(f"  {'% ARMA EL TUYO':>15} {'contribucion':>14} {'neto m3 (P50)':>15} {'neto m6 (P50)':>15} {'P(camino)':>11}")
    print('  ' + '-' * 74)
    for fb in (0.20, 0.35, 0.50, 0.65, 0.80):
        c = _contrib_menu("actual", fb)
        e = escenario(3000.0, 0.0, VIRAL, n=4000, contrib=c)
        print(f"  {fb*100:>14.0f}% {s(c,2):>14} {e['m3_p50']:>15,.0f} {e['m6_p50']:>15,.0f} {e['p_camino']*100:>10.1f}%")

    sep('6 · QUE PASA SI LO ORGANICO FUNCIONA (referidos por pedido servido)')
    print("""
  Si el presupuesto no alcanza para comprar volumen —que es lo que dice MARKETING_HALLAZGOS—
  lo organico deja de ser complemento. Aca se ve cuanto vale cada punto de viralidad.
""")
    print(f"  {'referidos/100 pedidos':>22} {'neto m3 (P50)':>15} {'neto m6 (P50)':>15} {'P(camino)':>11}")
    print('  ' + '-' * 66)
    for v in (0.0, 0.03, 0.06, 0.10, 0.15, 0.25):
        e = escenario(3000.0, 0.0, v, n=4000)
        print(f"  {v*100:>21.0f}  {e['m3_p50']:>15,.0f} {e['m6_p50']:>15,.0f} {e['p_camino']*100:>10.1f}%")

    sep('7 · LO QUE ESTE MODELO NO SABE')
    print("""
  · El CPM, CTR y CVR salen de blogs de agencia, no de medicion auditada (ver
    MARKETING_HALLAZGOS.md). Todo el CAC —y por lo tanto el optimo de publicidad— cuelga de
    ahi. Medir el CAC real la primera semana no es una mejora: es lo unico que convierte
    esto en un pronostico.
  · El castigo por no salir de aprendizaje es una asuncion declarada, no un dato.
  · No hay estacionalidad peruana, ni fatiga creativa, ni tiempo de cobro de Culqi, ni
    competencia que reaccione.
  · La mezcla Signature/ARMA EL TUYO no esta medida; se asume mitad y mitad.
  · No existe ni un solo dato publico de una sandwicheria o delivery en Trujillo.
""")
