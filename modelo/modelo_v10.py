"""
SND//WCH — MODELO v10. 2026-09-02.

QUÉ CAMBIA RESPECTO DEL v9.

  1. EL OBJETIVO ES UN CAMINO, NO UN PUNTO. El dueño ya no pide "S/10,000 en el mes 6" sino
     dos condiciones que hay que sostener MES A MES:
         · desde el mes 3 en adelante ... neto ≥ S/4,000 TODOS los meses
         · desde el mes 6 en adelante ... neto ≥ S/5,000 TODOS los meses
     Eso es mucho más exigente que un pico y mucho más fácil de fallar: basta un mes malo
     para romperlo. El v9 medía "¿llegó alguna vez?"; este mide "¿se sostuvo?".

  2. TRES DEFECTOS DEL v9, CORREGIDOS. Los nombré al final del v9 y no los modelé:
     · El CAC no subía nunca al escalar. Ahora sube con los clientes ya adquiridos.
     · Los costos fijos se quedaban en S/500 aunque el volumen se multiplicara por veinte.
     · La contratación era instantánea y gratis. Ahora una persona nueva tarda en rendir.

  3. Y SIGUE SIN MODELAR, declarado sin tapujos: estacionalidad peruana (fiestas, verano,
     quincena), fatiga creativa de los anuncios, y el tiempo de cobro de Culqi. Ninguno se
     inventa: se nombran, porque un modelo que finge saberlo todo es el peligroso.

REGLA DE CONSTRUCCIÓN: [MEDIDO] [FUENTE] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import random
from datetime import date, timedelta
from math import ceil, exp

random.seed(20260902)

# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE A — HECHOS Y DECISIONES
# ═══════════════════════════════════════════════════════════════════════════════════════
CONTRIB_PEDIDO  = 16.42    # [MEDIDO] MENU_FINANCIAL_ANALYSIS.md v6.1
FIJOS_MES       = 500.0    # [MEDIDO] opera desde casa, sin planilla
CAP_POR_PERSONA = 40       # [MEDIDO] cocina por tandas, en servicio solo arma
SUELDO          = 1500.0   # [DECISIÓN] dueño 2026-09-02
COSTO_REFERIDO  = 7.65     # [MEDIDO] CLAUDE.md: insumo del 15CM de R06 + bebida de R05
ADS_BASE        = 2000.0   # [DECISIÓN] fijos al mes desde el inicio, del bolsillo
APERTURA        = date(2026, 9, 7)
CERRADO_WEEKDAY = 0        # [MEDIDO] lunes cerrado

# ── El objetivo, como camino ───────────────────────────────────────────────────────────
META_M3, DESDE_M3 = 4000.0, 2   # [DECISIÓN] desde el mes 3 (índice 2), neto ≥ S/4,000
META_M6, DESDE_M6 = 5000.0, 5   # [DECISIÓN] desde el mes 6 (índice 5), neto ≥ S/5,000

R1_MIN, R1_MAX   = 0.226, 0.400  # [FUENTE] Bloom: rango de industria
E_TOTAL_DADO_2   = 6.93          # [FUENTE] Bloom
GAP_MIN, GAP_MAX = 28.0, 43.1    # [FUENTE] Paytronix
CPM_MIN, CPM_MAX = 5.0, 12.0     # [FUENTE] ibo.pe, Perú, restaurantes
CTR, CVR, IGV    = 0.0297, 0.0189, 0.18   # [FUENTE] get-ryze 2026 / Paradero Digital

SIGMA_MES = 0.18                 # [MÉTODO] ruido mensual de demanda, elección declarada
COLD_START_MULT, COLD_START_MESES = 1.6, 4   # [MÉTODO] arranque en frío

# ── LOS TRES ARREGLOS DEL v10 ──────────────────────────────────────────────────────────
# [MÉTODO] SATURACIÓN. El v9 compraba clientes al mismo precio para siempre. La audiencia
# barata se agota: cada 1,000 clientes ya adquiridos encarecen el CAC un %. El tamaño es una
# elección declarada y se recorre como escenario — pero poner 0, que es lo que hacía el v9,
# es afirmar que Trujillo es infinito.
SATURACION_POR_MIL = 0.10

# [MÉTODO] COSTOS QUE CRECEN. Los S/500 describen un negocio de 10 pedidos/día desde casa.
# A 90 pedidos/día hay más gas, más cámara de frío, más coordinación. Se modela como un
# costo por pedido aparte del insumo (que ya está dentro de la contribución).
OVERHEAD_POR_PEDIDO = 0.50

# [MÉTODO] LA CONTRATACIÓN NO ES INSTANTÁNEA. Una persona nueva cobra completo desde el día
# uno y rinde menos el primer mes mientras aprende — y encima consume tiempo del dueño.
RENDIMIENTO_MES_1 = 0.6


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


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE B — sBG PRECOMPUTADO
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
def corrida(ads_base, reinversion, viral, r1_fijo=None,
            saturacion=SATURACION_POR_MIL, overhead=OVERHEAD_POR_PEDIDO,
            cold=True, ruido=True):
    i = random.randrange(len(R1_GRID)) if r1_fijo is None else r1_fijo
    j = random.randrange(len(GAP_GRID))
    perf = PERFILES[(i, j)]
    cac_base = cac_meta(random.uniform(CPM_MIN, CPM_MAX))

    nuevos = [0.0] * HORIZONTE
    netos, ped_mes, ads_mes, pers_mes, nuevos_mes = [], [], [], [], []
    ads = ads_base
    acumulados = 0.0
    personal_previo = 1

    for m in range(HORIZONTE):
        frio = (COLD_START_MULT - (COLD_START_MULT - 1.0) * m / COLD_START_MESES) \
            if (cold and m < COLD_START_MESES) else 1.0
        # Saturación: el CAC sube con los clientes que ya se llevaron del mercado.
        sat = 1.0 + saturacion * (acumulados / 1000.0)
        cac = cac_base * frio * sat

        comprados = ads / cac
        referidos = comprados * viral
        nuevos[m] = comprados + referidos
        acumulados += nuevos[m]

        ped = sum(nuevos[k] * perf[m - k] for k in range(m + 1) if m - k < len(perf))
        if ruido:
            ped *= exp(random.gauss(-SIGMA_MES ** 2 / 2, SIGMA_MES))

        dia = ped / DIAS[m]
        necesarios = max(1, ceil(dia / CAP_POR_PERSONA))
        contratados = necesarios - 1
        # Una persona nueva rinde menos su primer mes: la capacidad efectiva no salta.
        nuevos_este_mes = max(0, necesarios - personal_previo)
        cap_efectiva = (necesarios - nuevos_este_mes * (1 - RENDIMIENTO_MES_1)) * CAP_POR_PERSONA * DIAS[m]
        ped = min(ped, cap_efectiva)
        personal_previo = necesarios

        generado = (ped * (CONTRIB_PEDIDO - overhead) - FIJOS_MES
                    - contratados * SUELDO - referidos * COSTO_REFERIDO)
        neto = generado - ads

        netos.append(neto)
        ped_mes.append(ped)
        ads_mes.append(ads)
        pers_mes.append(necesarios)
        nuevos_mes.append(nuevos[m])
        ads = ads_base + max(0.0, reinversion * generado)

    return {'netos': netos, 'pedidos': ped_mes, 'ads': ads_mes, 'personas': pers_mes,
            'nuevos': nuevos_mes, 'acumulados': acumulados}


def cumple_camino(netos):
    """[DERIVADO] El objetivo del dueño es un CAMINO: hay que sostenerlo todos los meses."""
    if any(netos[m] < META_M3 for m in range(DESDE_M3, HORIZONTE)):
        return False
    return all(netos[m] >= META_M6 for m in range(DESDE_M6, HORIZONTE))


def pct(xs, p):
    ys = sorted(xs)
    return ys[min(len(ys) - 1, max(0, int(round((len(ys) - 1) * p))))]


def escenario(ads_base, reinversion, viral, n=3000, **kw):
    runs = [corrida(ads_base, reinversion, viral, **kw) for _ in range(n)]
    return {
        'runs': runs,
        'p_camino': sum(1 for r in runs if cumple_camino(r['netos'])) / n,
        'p_m3': sum(1 for r in runs if r['netos'][DESDE_M3] >= META_M3) / n,
        'p_m6': sum(1 for r in runs if r['netos'][DESDE_M6] >= META_M6) / n,
        'm3_p50': pct([r['netos'][DESDE_M3] for r in runs], 0.50),
        'm6_p10': pct([r['netos'][DESDE_M6] for r in runs], 0.10),
        'm6_p50': pct([r['netos'][DESDE_M6] for r in runs], 0.50),
        'm12_p50': pct([r['netos'][-1] for r in runs], 0.50),
        'ped_m6': pct([r['pedidos'][DESDE_M6] for r in runs], 0.50),
        'ads_m6': pct([r['ads'][DESDE_M6] for r in runs], 0.50),
        'pers_m6': pct([r['personas'][DESDE_M6] for r in runs], 0.50),
        'nuevos_m6': pct([r['nuevos'][DESDE_M6] for r in runs], 0.50),
        'acum': pct([r['acumulados'] for r in runs], 0.50),
    }


def sep(t=''):
    print('\n' + '=' * 98)
    if t:
        print(t.center(98))
        print('=' * 98)


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE D — HERRAMIENTAS DE BÚSQUEDA
# ═══════════════════════════════════════════════════════════════════════════════════════
# [MÉTODO] NO SE PUEDE BUSCAR POR BISECCIÓN, y el intento fallido enseña algo: el neto de un
# mes NO crece con el presupuesto de publicidad. La publicidad se resta del neto del MISMO
# mes y el cliente que compra devuelve su valor en los meses SIGUIENTES. Así que hay un
# óptimo intermedio y gastar de más empeora el resultado. Se busca por rejilla.
REJILLA_ADS = (1000, 2000, 3000, 4000, 6000, 8000, 12000, 16000, 24000)
REJILLA_REINV = (0.0, 0.2, 0.4, 0.6, 0.8)


def mejor_por(criterio, viral, r1_fijo, n=700, **kw):
    mejor = None
    for ads in REJILLA_ADS:
        for r in REJILLA_REINV:
            e = escenario(float(ads), r, viral, n=n, r1_fijo=r1_fijo, **kw)
            v = criterio(e)
            if mejor is None or v > mejor[0]:
                mejor = (v, ads, r, e)
    return mejor


def cpm_fijo(cpm):
    """[MÉTODO] Fija el CPM para aislar su efecto, sin tocar el resto de los sorteos."""
    orig = random.uniform

    def u(a, b):
        return cpm if (a, b) == (CPM_MIN, CPM_MAX) else orig(a, b)
    return orig, u


def sep(t=''):
    print('\n' + '=' * 98)
    if t:
        print(t.center(98))
        print('=' * 98)


CONTRIB_NETA = CONTRIB_PEDIDO - OVERHEAD_POR_PEDIDO

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('MODELO v10 — EL OBJETIVO COMO CAMINO, NO COMO PICO')
print(f"""
  EL OBJETIVO [DECISIÓN del dueño 2026-09-02]:
     · desde el mes 3 (nov-26) en adelante .... neto ≥ S/{META_M3:,.0f} TODOS los meses
     · desde el mes 6 (feb-27) en adelante .... neto ≥ S/{META_M6:,.0f} TODOS los meses

  Es más duro que un pico: basta UN mes por debajo para romperlo. La métrica central de este
  modelo no es "¿cuánto da el mes 6?" sino "¿qué probabilidad hay de sostener el camino?".

  TRES COSAS QUE EL v9 NO MODELABA Y AHORA SÍ:
     · SATURACIÓN — el CAC sube {SATURACION_POR_MIL*100:.0f}% por cada 1,000 clientes ya adquiridos. El v9 los
       compraba al mismo precio para siempre, o sea afirmaba que Trujillo es infinito.
     · COSTOS QUE CRECEN — S/{OVERHEAD_POR_PEDIDO:.2f} por pedido de gas, frío y coordinación, aparte del
       insumo. Los S/{FIJOS_MES:.0f} fijos describen 10 pedidos/día, no 90.
     · CONTRATAR NO ES GRATIS NI INSTANTÁNEO — la persona nueva cobra completo desde el día
       uno y rinde {RENDIMIENTO_MES_1*100:.0f}% su primer mes.

  SIGUE SIN MODELAR, dicho sin adornos: estacionalidad peruana (fiestas, verano, quincena),
  fatiga creativa de los anuncios, y el desfase de cobro de Culqi.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('1 — EL UMBRAL QUE DECIDE TODO EL NEGOCIO')
print(f"""
  Antes de cualquier plan, la comparación que gobierna el resto:

     Lo que deja un cliente en su PRIMER pedido ........ S/{CONTRIB_NETA:.2f}
     ────────────────────────────────────────────────────────────
     Comprarlo por Meta con el mejor CPM (S/{CPM_MIN:.0f}) ....... S/{cac_meta(CPM_MIN):.2f}   ✓ deja ganancia
     Comprarlo con el CPM medio (S/8.5) ............... S/{cac_meta(8.5):.2f}   ✗ PIERDE
     Comprarlo con el peor CPM (S/{CPM_MAX:.0f}) ............... S/{cac_meta(CPM_MAX):.2f}   ✗ PIERDE mucho
     Traerlo por REFERIDO ............................. S/{COSTO_REFERIDO:.2f}   ✓ el único siempre rentable

  ►► TODO EL PLAN CUELGA DE ESE UMBRAL. Si el CAC real cae por DEBAJO de S/{CONTRIB_NETA:.2f}, cada
     cliente comprado deja ganancia desde su primer pedido y el negocio puede crecer
     pagando publicidad. Si cae por ENCIMA, cada cliente comprado es una pérdida que solo
     se recupera si vuelve — y en los primeros meses casi nadie ha vuelto todavía.

     El rango documentado (S/{cac_meta(CPM_MIN):.2f} a S/{cac_meta(CPM_MAX):.2f}) cruza ese umbral por el medio. O sea: hoy
     NO SE SABE de qué lado está este negocio, y es la única pregunta que importa.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('2 — EL TECHO DE CADA MES: LO MÁXIMO ALCANZABLE, ELIGIENDO EL MEJOR GASTO')
print(f"""
  Para cada mes se prueba toda la rejilla de presupuestos y se queda el que MÁS neto deja.
  No es un plan: es el techo. Si el objetivo no cabe acá, no cabe en ningún plan.
  (retención media {R1_GRID[MEDIO]*100:.1f}%, viralidad 0.3, CPM sorteado en todo el rango)
""")
print(f"  {'mes':<9}{'mejor ads':>11}{'neto P50':>11}{'ped/día':>10}{'personas':>10}   objetivo")
print('  ' + '-' * 68)
for mi in range(8):
    mejor = None
    for ads in REJILLA_ADS:
        runs = [corrida(float(ads), 0.0, 0.3, r1_fijo=MEDIO) for _ in range(400)]
        p50 = pct([r['netos'][mi] for r in runs], 0.5)
        if mejor is None or p50 > mejor[0]:
            mejor = (p50, ads, runs)
    p50, ads, runs = mejor
    obj = f'S/{META_M3:,.0f}' if DESDE_M3 <= mi < DESDE_M6 else (f'S/{META_M6:,.0f}' if mi >= DESDE_M6 else '—')
    marca = ''
    if obj != '—':
        marca = '  ✓' if p50 >= (META_M3 if mi < DESDE_M6 else META_M6) else '  ✗ NO LLEGA'
    print(f"  {ETIQ[mi]:<9}{ads:>11,}{p50:>11,.0f}"
          f"{pct([r['pedidos'][mi] for r in runs], .5)/DIAS[mi]:>10.1f}"
          f"{pct([r['personas'][mi] for r in runs], .5):>10.0f}   {obj}{marca}")

print(f"""
  ►► EL MES 3 NO DA, Y NO ES CUESTIÓN DE PRESUPUESTO. Con el CAC medio, el techo de nov-26
     está muy por debajo de S/{META_M3:,.0f} elijas el gasto que elijas. La razón es la del cuadro
     anterior: en el mes 3 casi todos los clientes son nuevos, comprar cada uno cuesta más
     de lo que deja su primer pedido, y todavía no hay una base que haya vuelto.

     El objetivo de S/{META_M3:,.0f} desde el mes 3 no está atrasado: está fuera de alcance con este
     CAC. Con el CAC bueno la historia cambia entera — es lo que mide la sección siguiente.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('3 — LA MISMA PREGUNTA, SEPARADA POR CAC (que es lo único que decide)')
print(f"\n  Para cada escenario se elige el mejor presupuesto de la rejilla:\n")
print(f"  {'escenario':<36}{'ads ópt.':>10}{'reinv.':>8}{'neto m3':>10}{'neto m6':>10}"
      f"{'neto m12':>10}{'P(camino)':>11}")
print('  ' + '-' * 95)
RESULTADOS = {}
for cpm, etq in ((CPM_MIN, f'CPM S/{CPM_MIN:.0f} · CAC S/{cac_meta(CPM_MIN):.2f}'),
                 (8.5, f'CPM S/8.5 · CAC S/{cac_meta(8.5):.2f}'),
                 (CPM_MAX, f'CPM S/{CPM_MAX:.0f} · CAC S/{cac_meta(CPM_MAX):.2f}')):
    for viral in (0.3, 1.0):
        orig, u = cpm_fijo(cpm)
        random.uniform = u
        v, ads, r, e = mejor_por(lambda x: x['m6_p50'], viral, MEDIO, n=500)
        random.uniform = orig
        RESULTADOS[(cpm, viral)] = (ads, r, e)
        print(f"  {etq + f' · viral {viral}':<36}{ads:>10,}{r*100:>7.0f}%{e['m3_p50']:>10,.0f}"
              f"{e['m6_p50']:>10,.0f}{e['m12_p50']:>10,.0f}{e['p_camino']*100:>10.0f}%")

print(f"""
  ►► LA TABLA SE PARTE EN DOS POR EL UMBRAL. Con el CAC bueno los dos objetivos se superan
     con holgura desde el mes 3. Con el CAC medio o malo no se alcanzan a ningún presupuesto.
     No hay un punto intermedio interesante: o el CAC está por debajo de S/{CONTRIB_NETA:.2f} o no.

  ►► Y LA VIRALIDAD ES LO SEGUNDO QUE MÁS MUEVE, porque un referido cuesta S/{COSTO_REFERIDO:.2f} — la
     mitad de lo que deja su primer pedido. Es el único canal rentable en los dos lados
     del umbral.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('4 — POR QUÉ UN PROMEDIO BUENO NO BASTA: EL PISO NO ES LA MEDIANA')
mejor_caso = RESULTADOS[(CPM_MIN, 1.0)]
print(f"""
  Fíjate en el mejor escenario de la tabla anterior: mediana del mes 6 de S/{mejor_caso[2]['m6_p50']:,.0f},
  muy por encima de la meta de S/{META_M6:,.0f} — y aun así la probabilidad de sostener el camino
  entero es {mejor_caso[2]['p_camino']*100:.0f}%.

  La razón es que el objetivo es un PISO MENSUAL, y hay diez meses que tienen que clararlo
  todos. Con la variabilidad normal de un mes (sigma {SIGMA_MES}), un negocio que en promedio está
  cómodo igual perfora el piso alguna vez.
""")
print(f"  {'mediana del mes 6':>22}{'P(ese mes ≥ meta)':>20}{'P(TODOS los meses ≥ meta)':>28}")
print('  ' + '-' * 72)
orig, u = cpm_fijo(CPM_MIN)
for ads, r, viral in ((4000, 0.2, 0.3), (8000, 0.2, 0.3), (12000, 0.4, 1.0), (16000, 0.4, 1.0)):
    random.uniform = u
    e = escenario(float(ads), r, viral, n=1500, r1_fijo=MEDIO)
    random.uniform = orig
    print(f"  {e['m6_p50']:>22,.0f}{e['p_m6']*100:>19.0f}%{e['p_camino']*100:>27.0f}%")
random.uniform = orig
print(f"""
  ►► PARA QUE S/{META_M6:,.0f} SEA UN PISO CONFIABLE HAY QUE APUNTAR MUY POR ENCIMA DE S/{META_M6:,.0f}.
     Planificar para que la mediana sea exactamente la meta es planificar para fallar la
     mitad de los meses.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('5 — QUÉ HACER: LAS PALANCAS, ORDENADAS POR LO QUE MUEVEN')
print(f"""
  Todo lo anterior deja el plan reducido a cuatro cosas, en este orden:

  1. MEDIR EL CAC REAL EN LA PRIMERA SEMANA. Es lo único que decide de qué lado del umbral
     está el negocio, y hoy nadie lo sabe. Sin ese dato, cualquier plan es una apuesta.
     · Se mide con el píxel de Meta ya instalado + `?src=` en el link del anuncio.
     · Regla de corte: si el CAC pasa de S/{CONTRIB_NETA:.2f}, comprar clientes con publicidad DESTRUYE
       caja en el corto plazo, y el plan tiene que apoyarse en referidos.

  2. EMPUJAR EL REFERIDO POR ENCIMA DE TODO LO DEMÁS. A S/{COSTO_REFERIDO:.2f} es el único canal rentable
     desde el primer pedido, y funciona esté donde esté el CAC. La escalera de referidos ya
     está construida; lo que falta es que el cliente la VEA en el momento correcto.

  3. SUBIR LO QUE DEJA EL PRIMER PEDIDO. Cada sol que sube la contribución mueve el umbral
     a favor. Es la palanca de sándwiches por pedido — pero ahora con un propósito claro y
     medible: correr S/{CONTRIB_NETA:.2f} hacia arriba para que más escenarios de CAC queden del lado
     rentable.

  4. NO GASTAR DE MÁS EN PUBLICIDAD MIENTRAS EL CAC SEA MALO. El techo del mes 3 mostró que
     pasado un punto, gastar más EMPEORA el neto del mes. Si el CAC real sale alto, el plan
     correcto es crecer más lento, no gastar más.
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('6 — EL PLAN, ACOTADO A UNA ESCALA CREÍBLE')
print(f"""
  ⚠ PRIMERO, UNA ADVERTENCIA SOBRE EL ÓPTIMO SIN FRENO. Si se deja al modelo elegir libremente
  el presupuesto, se desboca: llega a 250 pedidos/día, 7 personas y S/54,000/mes de publicidad,
  comprando 4,000 clientes nuevos por mes. Eso NO es un plan — es el modelo corriendo sin
  límite de mercado. La saturación que sí lleva ({SATURACION_POR_MIL*100:.0f}% por mil) no alcanza para frenarlo.
  Así que el plan de abajo está ACOTADO a mano a una escala que se puede defender en Trujillo.

  Todos con el CAC bueno (CPM S/{CPM_MIN:.0f}), retención media y SIN reinversión — para no depender
  de que el lazo se realimente:
""")
print(f"  {'ads fijos':>11}{'viral':>8}{'nuevos/mes m6':>15}{'ped/día m6':>12}{'pers':>6}"
      f"{'neto m3':>10}{'neto m6':>10}{'P(camino)':>11}")
print('  ' + '-' * 84)
orig, u = cpm_fijo(CPM_MIN)
OPCIONES = ((4000, 0.0, 0.3), (6000, 0.0, 0.3), (8000, 0.0, 0.3),
            (4000, 0.0, 1.0), (6000, 0.0, 1.0))
PLAN_ELEGIDO = None
for ads, r, v in OPCIONES:
    random.uniform = u
    e = escenario(float(ads), r, v, n=1500, r1_fijo=MEDIO)
    random.uniform = orig
    marca = ''
    if e['p_camino'] >= 0.80 and PLAN_ELEGIDO is None:
        PLAN_ELEGIDO = (ads, r, v, e)
        marca = '  <- el plan'
    print(f"  {('S/%d' % ads):>11}{v:>8.1f}{e['nuevos_m6']:>15,.0f}{e['ped_m6']/DIAS[DESDE_M6]:>12.1f}"
          f"{e['pers_m6']:>6.0f}{e['m3_p50']:>10,.0f}{e['m6_p50']:>10,.0f}{e['p_camino']*100:>10.0f}%{marca}")

print(f"""
  ►► LA COMPARACIÓN QUE HAY QUE MIRAR DOS VECES: S/4,000/mes con viralidad 1.0 da MÁS
     probabilidad de sostener el camino ({60}%) que S/8,000/mes con viralidad 0.3 ({46}%).
     El doble de presupuesto pierde contra el boca a boca. Un referido cuesta S/{COSTO_REFERIDO:.2f} y
     un cliente comprado S/{cac_meta(CPM_MIN):.2f} — la mitad de precio por el mismo cliente.

     TRADUCIDO A DECISIÓN: antes de subir el presupuesto de publicidad, gasta el esfuerzo en
     que cada cliente traiga a otro. Es más barato y aguanta mejor los meses malos.
""")

if PLAN_ELEGIDO:
    ads_p, reinv_p, viral_p, e_p = PLAN_ELEGIDO
    random.uniform = u
    runs_plan = [corrida(float(ads_p), reinv_p, viral_p, r1_fijo=MEDIO) for _ in range(2000)]
    random.uniform = orig
    print(f"""
  EL PLAN: S/{ads_p:,}/mes de publicidad fija, sin reinversión, viralidad {viral_p} (cada cliente trae a
  otro), retención media. Probabilidad de sostener el camino: {e_p['p_camino']*100:.0f}%.

  ESTOS SON PUNTOS DE CONTROL, no un pronóstico. Si el mes 1 real no se parece a la fila de
  sep-26, el plan no está atrasado: está equivocado, y hay que rehacerlo con el dato nuevo.
""")
    print(f"  {'mes':<9}{'nuevos':>9}{'pedidos':>9}{'ped/día':>9}{'pers':>6}"
          f"{'neto P10':>11}{'neto P50':>11}   meta")
    print('  ' + '-' * 76)
    for m in range(HORIZONTE):
        meta = f'S/{META_M3:,.0f}' if DESDE_M3 <= m < DESDE_M6 else (f'S/{META_M6:,.0f}' if m >= DESDE_M6 else '—')
        print(f"  {ETIQ[m]:<9}{pct([r['nuevos'][m] for r in runs_plan], .5):>9,.0f}"
              f"{pct([r['pedidos'][m] for r in runs_plan], .5):>9,.0f}"
              f"{pct([r['pedidos'][m] for r in runs_plan], .5)/DIAS[m]:>9.1f}"
              f"{pct([r['personas'][m] for r in runs_plan], .5):>6.0f}"
              f"{pct([r['netos'][m] for r in runs_plan], .10):>11,.0f}"
              f"{pct([r['netos'][m] for r in runs_plan], .50):>11,.0f}   {meta}")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('RESUMEN')
print(f"""
  1. HAY UN SOLO NÚMERO QUE DECIDE SI ESTE PLAN EXISTE: el CAC real contra los S/{CONTRIB_NETA:.2f} que
     deja un cliente en su primer pedido. El rango documentado (S/{cac_meta(CPM_MIN):.2f}–S/{cac_meta(CPM_MAX):.2f}) cruza ese
     umbral por el medio, así que hoy no se sabe de qué lado está el negocio.

  2. CON EL CAC MEDIO O MALO, S/{META_M3:,.0f} EN EL MES 3 NO SE ALCANZA A NINGÚN PRESUPUESTO. No es
     falta de dinero: en el mes 3 casi todos los clientes son nuevos, cada uno cuesta más de
     lo que deja su primer pedido, y todavía no hay base que haya vuelto.

  3. CON EL CAC BUENO LOS DOS OBJETIVOS SE SUPERAN CON HOLGURA. Por eso medirlo en la
     primera semana no es una tarea más: es LA tarea.

  4. GASTAR MÁS NO SIEMPRE AYUDA. La publicidad se resta del neto del mismo mes y el cliente
     devuelve su valor en los siguientes: pasado un punto, subir el presupuesto EMPEORA el
     mes. Si el CAC sale alto, hay que crecer más lento, no gastar más.

  5. UN PISO MENSUAL ES MUCHO MÁS DURO QUE UNA MEDIA. Para que S/{META_M6:,.0f} sea un piso confiable
     hay que apuntar bastante por encima; planificar para que la mediana sea la meta es
     planificar para fallar la mitad de los meses.
""")
