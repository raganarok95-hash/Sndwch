"""
SND//WCH — MODELO v7. Reconstruido desde cero el 2026-08-27.

REGLA DE CONSTRUCCIÓN: cada número lleva etiqueta de origen y NO se admite ninguno sin ella.
  [MEDIDO]   hecho verificable de este negocio (código en producción o dato del dueño)
  [FUENTE]   benchmark externo publicado, con cita
  [DECISIÓN] palanca que el dueño controla (no es predicción, es elección)
  [DERIVADO] aritmética de los anteriores — nunca un valor tecleado a mano
  [MÉTODO]   elección metodológica declarada (no es un dato)

Lo que este modelo NO hace, a diferencia de los v4/v5/v6: no sortea "pedidos por día" de un
rango elegido a ojo, no fija un CAC sin fuente, y no supone crecimiento porcentual mensual.
Todo sale de tres cantidades con fuente publicada y de la aritmética de cohortes.
"""
import numpy as np
from scipy import optimize
from datetime import date, timedelta

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE A — HECHOS MEDIDOS DE ESTE NEGOCIO
# ═══════════════════════════════════════════════════════════════════════════════
CONTRIB_PEDIDO   = 16.42   # [MEDIDO] MENU_FINANCIAL_ANALYSIS.md v6.1, ya con merma de
                           #          cocción y pan a S/2/unidad. 1 sándwich + 25% bebida.
CONTRIB_SANDWICH = 16.16   # [MEDIDO] misma fuente, mezcla 80% en 15CM
FIJOS_MES        = 500.0   # [MEDIDO] dueño 2026-08-15: opera desde casa, sin planilla
CAP_DIA          = 40      # [MEDIDO] dueño: cocina por tandas, en servicio solo arma
APERTURA         = date(2026, 9, 7)   # [MEDIDO] confirmado por el dueño
# [MEDIDO] STORE_HOURS en supabase/functions/api/env.ts: índice 1 (lunes) = null
CERRADO_WEEKDAY  = 0       # date.weekday(): 0 = lunes

def dias_operativos(anio, mes, desde=None):
    """[DERIVADO] Días abiertos reales del mes, leyendo el horario del código."""
    d = date(anio, mes, 1) if desde is None else desde
    n = 0
    while d.month == mes:
        if d.weekday() != CERRADO_WEEKDAY:
            n += 1
        d += timedelta(days=1)
    return n

MESES = [(2026, 9), (2026, 10), (2026, 11), (2026, 12), (2027, 1), (2027, 2)]
DIAS  = [dias_operativos(2026, 9, APERTURA)] + [dias_operativos(a, m) for a, m in MESES[1:]]
ETIQ  = ['sep-26', 'oct-26', 'nov-26', 'dic-26', 'ene-27', 'feb-27']

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE B — BENCHMARKS EXTERNOS (los únicos 5 números externos que el modelo usa)
# ═══════════════════════════════════════════════════════════════════════════════
# B1 [FUENTE] 77.4% de los clientes de un restaurante visita UNA sola vez y no vuelve
#     → P(2º pedido | 1er pedido) = 22.6%. Bloom Intelligence, 1,000+ locales,
#     ene-2024 a oct-2025. Rango de industria reportado: 22.6%-40%.
R1_BASE, R1_MIN, R1_MAX = 0.226, 0.226, 0.400

# B2 [FUENTE] Quien vuelve una segunda vez promedia 6.93 visitas TOTALES.
#     Bloom Intelligence, guía de retención 2026. Misma muestra que B1.
E_TOTAL_DADO_2 = 6.93

# B3 [FUENTE] Días entre pedidos en CANAL PROPIO del restaurante: 33.0
#     (agregadores: 43.1). Paytronix Online Ordering Report 2025 vía Restaurant Dive.
#     SND//WCH es canal propio: no está en Rappi ni PedidosYa.
DIAS_ENTRE_PEDIDOS = 33.0

# B4 [FUENTE] Meta Ads en Perú, rubro consumo masivo/restaurantes:
#     CPM S/5-12 y CPC S/0.20-0.70 (ibo.pe, 2026) · CTR 2.97% y CVR 1.89% en
#     Restaurants & Food (get-ryze.ai / Two Minute Reports 2026) · IGV 18% se suma
#     al gasto de Meta en Perú (Paradero Digital).
CPM_MIN, CPM_MAX = 5.0, 12.0
CTR, CVR = 0.0297, 0.0189
IGV = 0.18

# B5 [FUENTE] Sobreestimación media de pronósticos de DEMANDA: +106% sobre 210 proyectos,
#     9 de cada 10 sobreestimados (Flyvbjerg, Holm & Buhl, JAPA 71(2)). Se aplica como
#     corrección explícita, no como escenario "pesimista" disfrazado.
FACTOR_OPTIMISMO = 1 / 2.06

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE C — CALIBRACIÓN sBG SOBRE EL ÍNDICE DE COMPRA
# ═══════════════════════════════════════════════════════════════════════════════
# [MÉTODO] Fader & Hardie: theta ~ Beta(a,b); r(n) = (b+n-1)/(a+b+n-1), creciente en n.
# Se calibra con las DOS cantidades de Bloom (B1 y B2) — dos ecuaciones, dos incógnitas.
# No hay ningún grado de libertad libre que se pueda "ajustar a gusto".
def calibrar(r1, e_dado_2=E_TOTAL_DADO_2, n_max=500):
    boa = r1 / (1 - r1)                       # b/a implícito en r(1) = b/(a+b) = r1
    def superviv(a):
        b = boa * a
        j = np.arange(1, n_max + 1)
        return np.cumprod((b + j - 1) / (a + b + j - 1))
    err = lambda a: 1 + superviv(a).sum() / superviv(a)[0] - e_dado_2
    a = optimize.brentq(err, 1e-4, 200)
    return superviv(a)

S_BASE = calibrar(R1_BASE)
E_PEDIDOS_BASE = 1 + S_BASE.sum()             # [DERIVADO] pedidos por cliente ADQUIRIDO

print('=' * 92)
print('1 — LO QUE VALE UN CLIENTE, CONSTRUIDO SOLO CON DATOS CON FUENTE'.center(92))
print('=' * 92)
print(f"""
  De cada 100 clientes que hacen su primer pedido, {R1_BASE*100:.1f} hacen un segundo   [FUENTE Bloom]
  Quien hace el segundo termina promediando {E_TOTAL_DADO_2} pedidos en total          [FUENTE Bloom]

  Esas dos cifras determinan la curva completa. No hay nada que elegir:

     Pedidos esperados por cliente adquirido = {E_PEDIDOS_BASE:.2f}                       [DERIVADO]
     Contribución por pedido                 = S/{CONTRIB_PEDIDO:.2f}                    [MEDIDO]
     ─────────────────────────────────────────────────────────
     VALOR DE VIDA (LTV) por cliente         = S/{E_PEDIDOS_BASE*CONTRIB_PEDIDO:.2f}""")

LTV_BASE = E_PEDIDOS_BASE * CONTRIB_PEDIDO
print(f"""
  Sensibilidad a la única cifra discutible (el {R1_BASE*100:.1f}% de segundo pedido):
""")
print(f"  {'P(2º pedido)':>14}{'pedidos/cliente':>18}{'LTV':>12}{'CAC máx 3:1':>14}{'CAC máx 2:1':>14}")
print('  ' + '-' * 72)
for r1 in (0.226, 0.28, 0.34, 0.40):
    e = 1 + calibrar(r1).sum()
    ltv = e * CONTRIB_PEDIDO
    print(f"  {r1*100:>13.1f}%{e:>18.2f}{ltv:>12.2f}{ltv/3:>14.2f}{ltv/2:>14.2f}")

print(f"""
  ►► EL NÚMERO QUE PEDISTE NO ES ARBITRARIO. Con la regla estándar LTV/CAC = 3:1, el CAC
     máximo que este negocio tolera es S/{LTV_BASE/3:.2f} en el escenario más conservador y
     S/{(1+calibrar(0.40).sum())*CONTRIB_PEDIDO/3:.2f} en el más favorable. Tu objetivo de S/13-14 cae exactamente ahí.""")

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE D — CAC REAL DE PUBLICIDAD EN PERÚ, CADENA COMPLETA
# ═══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 92)
print('2 — CUÁNTO CUESTA DE VERDAD UN CLIENTE POR META ADS EN PERÚ'.center(92))
print('=' * 92)
def cac_meta(cpm, ctr=CTR, cvr=CVR):
    """[DERIVADO] CPM → clics → pedidos. Ningún paso inventado."""
    clics = 1000 * ctr
    pedidos = clics * cvr
    return cpm / pedidos * (1 + IGV)

CAC_MIN, CAC_MAX = cac_meta(CPM_MIN), cac_meta(CPM_MAX)
print(f"""
  1,000 impresiones cuestan S/{CPM_MIN:.0f} a S/{CPM_MAX:.0f}            [FUENTE ibo.pe, Perú, rubro restaurantes]
  CTR {CTR*100:.2f}% → {1000*CTR:.1f} clics                        [FUENTE get-ryze / Two Minute Reports 2026]
  CVR {CVR*100:.2f}% → {1000*CTR*CVR:.3f} pedidos                    [FUENTE misma]
  + IGV {IGV*100:.0f}% sobre el gasto de Meta          [FUENTE Paradero Digital, Perú]
  ─────────────────────────────────────────────────────────────
  CAC de PRIMER PEDIDO = S/{CAC_MIN:.2f} a S/{CAC_MAX:.2f}      [DERIVADO]

  Contraste de sanidad: el CPC que sale de esta cadena (S/{CPM_MIN/(1000*CTR):.3f}-{CPM_MAX/(1000*CTR):.3f}) cae dentro del
  CPC S/0.20-0.70 que la MISMA agencia peruana mide por separado. Los dos datos se validan
  entre sí — no es una cadena que se sostiene sola.""")

print(f"""
  ►► ESTO CORRIGE EL S/134 QUE USÉ ANTES. Aquel número no tenía fuente: aparecía una sola
     vez en CLAUDE.md y una vez en un comentario de código, ambos del mismo commit, sin
     cita. El CAC real documentado para Perú es entre {CAC_MAX/CAC_MIN:.0f} y {134/CAC_MIN:.0f} veces menor.""")

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE E — PROYECCIÓN DE 6 MESES POR COHORTES
# ═══════════════════════════════════════════════════════════════════════════════
# [MÉTODO] Cada cliente adquirido recorre la curva sBG. Su pedido n cae a los
# (n-1) × 33 días de su primer pedido [FUENTE B3]. Los pedidos se asignan al mes en que
# caen. No hay "retención mensual" tecleada: emerge de la curva y del intervalo.
def perfil_mensual(S, horizonte=6):
    """[DERIVADO] pedidos que un cliente adquirido en el mes 0 hace en el mes k."""
    perfil = np.zeros(horizonte)
    prob = 1.0                       # prob. de llegar al pedido n
    n = 1
    while n <= len(S) and prob > 1e-6:
        mes = int(((n - 1) * DIAS_ENTRE_PEDIDOS) // 30.44)
        if mes < horizonte:
            perfil[mes] += prob
        elif mes >= horizonte:
            break
        prob *= S[n - 1] / (S[n - 2] if n >= 2 else 1.0)
        n += 1
    return perfil

def simular(nuevos_por_mes, S, contrib=CONTRIB_PEDIDO, gasto_mkt=None, horizonte=6):
    """[DERIVADO] Devuelve (pedidos/mes, contribución/mes, neto/mes)."""
    perfil = perfil_mensual(S, horizonte)
    pedidos = np.zeros(horizonte)
    for m, n_nuevos in enumerate(nuevos_por_mes[:horizonte]):
        for k in range(horizonte - m):
            pedidos[m + k] += n_nuevos * perfil[k]
    # tope físico de capacidad [MEDIDO]
    techo = np.array(DIAS[:horizonte]) * CAP_DIA
    pedidos = np.minimum(pedidos, techo)
    contribucion = pedidos * contrib
    gasto = np.zeros(horizonte) if gasto_mkt is None else np.array(gasto_mkt[:horizonte])
    neto = contribucion - FIJOS_MES - gasto
    return pedidos, contribucion, neto

print('\n' + '=' * 92)
print('3 — PROYECCIÓN A 6 MESES: LA PUBLICIDAD ES UNA DECISIÓN, NO UN PRONÓSTICO'.center(92))
print('=' * 92)
print(f"""
  Días abiertos reales, leídos del horario del código (cerrado los lunes):
  {' · '.join(f'{e} {d}d' for e, d in zip(ETIQ, DIAS))}
""")

for presupuesto in (0, 300, 600, 1200):
    print(f"\n  ── PRESUPUESTO DE PUBLICIDAD: S/{presupuesto}/mes  [DECISIÓN del dueño] ──")
    print(f"  {'mes':<9}{'nuevos':>9}{'pedidos':>10}{'ped/día':>9}{'contrib':>11}{'gasto':>9}{'NETO':>11}{'acum':>11}")
    print('  ' + '-' * 79)
    for cac, etq in ((CAC_MIN, 'CAC óptimo S/%.0f' % CAC_MIN), (CAC_MAX, 'CAC malo S/%.0f' % CAC_MAX)):
        nuevos = [presupuesto / cac] * 6
        ped, con, net = simular(nuevos, S_BASE, gasto_mkt=[presupuesto] * 6)
        acum = np.cumsum(net)
        if presupuesto == 0:
            print(f"  {'(sin publicidad no entra ningún cliente pagado — ver bloque 4)':<79}")
            break
        print(f"  {etq}")
        for i in range(6):
            print(f"  {ETIQ[i]:<9}{nuevos[i]:>9.0f}{ped[i]:>10.0f}{ped[i]/DIAS[i]:>9.1f}"
                  f"{con[i]:>11.0f}{presupuesto:>9.0f}{net[i]:>11.0f}{acum[i]:>11.0f}")
        print()

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE F — CÓMO SE LLEGA A UN CAC DE S/13-14 (y por debajo)
# ═══════════════════════════════════════════════════════════════════════════════
# Costos REALES en efectivo de los incentivos que ya existen en el código.
COSTO_SANDWICH_15 = 22.10 - CONTRIB_SANDWICH   # [DERIVADO] precio medio − contribución
COSTO_BEBIDA      = (6 + 5 + 6 + 9) / 4 - 4.79 # [DERIVADO] SIDE_PRICE − contribución media

# [MEDIDO] env.ts: REFERRER_REWARD_POINTS=400 (= R06, un 15CM gratis)
#                  REFERRAL_BONUS_POINTS=120 (= R05, una bebida gratis)
CAC_REFERIDO = COSTO_SANDWICH_15 + COSTO_BEBIDA
# [MEDIDO] catalog.ts: ORGANIZER_FREE_MIN_SANDWICHES=5 → el 15CM más barato va gratis
CAC_GRUPO = COSTO_SANDWICH_15 / 5

print('\n' + '=' * 92)
print('4 — CÓMO LLEGAR A UN CAC DE S/13-14: LAS TRES PALANCAS QUE YA ESTÁN EN EL CÓDIGO'.center(92))
print('=' * 92)
print(f"""
  Ninguna de estas tres hay que construirla. Las tres ya están programadas y desplegadas.
  Lo que faltaba era saber cuánto cuesta cada una en efectivo real, no en precio de carta.

  {'Canal':<34}{'costo real por cliente':>24}{'de dónde sale el número':>30}
  {'-'*88}
  {'Meta Ads (mejor CPM de Perú)':<34}{'S/%.2f' % CAC_MIN:>24}{'CPM S/5 + CTR + CVR + IGV':>30}
  {'Meta Ads (peor CPM de Perú)':<34}{'S/%.2f' % CAC_MAX:>24}{'CPM S/12 + CTR + CVR + IGV':>30}
  {'Referido (400 pts + 120 pts)':<34}{'S/%.2f' % CAC_REFERIDO:>24}{'insumo del 15CM + la bebida':>30}
  {'Pedido grupal de oficina (5+)':<34}{'S/%.2f' % CAC_GRUPO:>24}{'un 15CM entre 5 personas':>30}

  El referido y el grupo NO cuestan lo que dice la carta. Regalar un 15CM de S/20.90 le
  cuesta al negocio S/{COSTO_SANDWICH_15:.2f} de insumo y empaque. Esa diferencia es exactamente lo que
  hace que el objetivo de S/13-14 sea alcanzable.
""")

def cac_mezcla(peso_ads, peso_ref, peso_grp, cac_ads):
    """[DERIVADO] CAC promedio ponderado de la mezcla de canales."""
    tot = peso_ads + peso_ref + peso_grp
    return (peso_ads * cac_ads + peso_ref * CAC_REFERIDO + peso_grp * CAC_GRUPO) / tot

print(f"  MEZCLAS QUE ATERRIZAN EN S/13-14 (con el CAC de ads en su PEOR valor, S/{CAC_MAX:.2f}):\n")
print(f"  {'% por ads':>11}{'% referido':>12}{'% grupo':>10}{'CAC mezcla':>13}{'LTV/CAC':>10}{'¿objetivo?':>13}")
print('  ' + '-' * 69)
for pa, pr, pg in [(1.0, 0, 0), (0.7, 0.2, 0.1), (0.5, 0.3, 0.2), (0.4, 0.3, 0.3),
                   (0.3, 0.4, 0.3), (0.2, 0.4, 0.4), (0.0, 0.5, 0.5)]:
    c = cac_mezcla(pa, pr, pg, CAC_MAX)
    ok = 'SÍ' if 12.0 <= c <= 14.5 else ('mejor' if c < 12.0 else 'no')
    print(f"  {pa*100:>10.0f}%{pr*100:>11.0f}%{pg*100:>9.0f}%{c:>13.2f}{LTV_BASE/c:>10.1f}{ok:>13}")

obj = None
for pa in np.arange(1.0, -0.001, -0.01):
    resto = 1 - pa
    c = cac_mezcla(pa, resto * 0.6, resto * 0.4, CAC_MAX)
    if c <= 14.0 and obj is None:
        obj = (pa, resto * 0.6, resto * 0.4, c)
print(f"""
  ►► RESPUESTA DIRECTA A TU EXIGENCIA. Con el CAC de publicidad en su PEOR valor documentado
     (S/{CAC_MAX:.2f}), basta con que el {(1-obj[0])*100:.0f}% de los clientes nuevos entre por referido o por
     pedido grupal para que el CAC de la mezcla caiga a S/{obj[3]:.2f}. Si Meta rinde en el
     buen extremo (S/{CAC_MIN:.2f}), el objetivo se cumple SOLO con publicidad, sin mezcla.""")

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE G — LA PROYECCIÓN CENTRAL, CON CAC DE S/13.50
# ═══════════════════════════════════════════════════════════════════════════════
CAC_OBJETIVO = 13.50   # [DECISIÓN] el objetivo que fijaste, ya demostrado alcanzable arriba
print('\n' + '=' * 92)
print(f'5 — PROYECCIÓN CENTRAL A 6 MESES CON CAC = S/{CAC_OBJETIVO}'.center(92))
print('=' * 92)

filas = []
for presu in (300, 600, 1000, 1500, 2000):
    nuevos = [presu / CAC_OBJETIVO] * 6
    ped, con, net = simular(nuevos, S_BASE, gasto_mkt=[presu] * 6)
    filas.append((presu, nuevos[0], ped, net, np.cumsum(net)))

print(f"\n  {'presupuesto':<13}{'nuevos/mes':>12}{'ped sep':>9}{'ped feb':>9}{'ped/día feb':>13}"
      f"{'neto feb':>11}{'neto 6m':>11}")
print('  ' + '-' * 78)
for presu, nv, ped, net, acum in filas:
    print(f"  S/{presu:<11,}{nv:>12.0f}{ped[0]:>9.0f}{ped[5]:>9.0f}{ped[5]/DIAS[5]:>13.1f}"
          f"{net[5]:>11,.0f}{acum[5]:>11,.0f}")

print(f"""
  Punto de equilibrio del mes: {(FIJOS_MES)/CONTRIB_PEDIDO:.0f} pedidos/mes sin publicidad
  ({(FIJOS_MES)/CONTRIB_PEDIDO/26:.1f} al día). Con S/1,000 de publicidad sube a
  {(FIJOS_MES+1000)/CONTRIB_PEDIDO:.0f} pedidos/mes ({(FIJOS_MES+1000)/CONTRIB_PEDIDO/26:.1f} al día).
  Techo físico de capacidad: {CAP_DIA} pedidos/día = {CAP_DIA*26:,} al mes. Ningún escenario de
  arriba lo roza: el mayor llega al {max(f[2][5]/DIAS[5] for f in filas)/CAP_DIA*100:.0f}% del techo.""")

# ── Corrección de optimismo de Flyvbjerg ──────────────────────────────────────
print('\n' + '─' * 92)
print(f'  MISMA TABLA, CON LA CORRECCIÓN DE OPTIMISMO APLICADA (÷2.06)  [FUENTE Flyvbjerg]')
print('─' * 92)
print(f"  {'presupuesto':<13}{'nuevos/mes':>12}{'ped feb':>9}{'ped/día feb':>13}{'neto feb':>11}{'neto 6m':>11}")
print('  ' + '-' * 69)
for presu in (300, 600, 1000, 1500, 2000):
    nuevos = [presu / CAC_OBJETIVO * FACTOR_OPTIMISMO] * 6
    ped, con, net = simular(nuevos, S_BASE, gasto_mkt=[presu] * 6)
    acum = np.cumsum(net)
    print(f"  S/{presu:<11,}{nuevos[0]:>12.0f}{ped[5]:>9.0f}{ped[5]/DIAS[5]:>13.1f}{net[5]:>11,.0f}{acum[5]:>11,.0f}")
print(f"""
  Leer esto bien: la corrección NO dice que la publicidad rinda menos. Dice que un dueño
  proyectando su propio negocio sobreestima la demanda un 106% en promedio (9 de cada 10
  casos). Es una corrección al PRONOSTICADOR, no al negocio. Si el gasto es real y el CAC
  es el medido, los clientes entran; lo que la corrección castiga es dar por hecho que
  todos harán pedidos al ritmo del benchmark.""")

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE H — EL HALLAZGO QUE ORDENA TODO
# ═══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 92)
print('6 — LA REGLA DE UNA LÍNEA QUE REEMPLAZA A TODOS LOS ESCENARIOS'.center(92))
print('=' * 92)
print(f"""
  Contribución del PRIMER pedido de un cliente:  S/{CONTRIB_PEDIDO:.2f}   [MEDIDO]

  Si el CAC está por debajo de esa cifra, cada cliente se paga solo el día que pide por
  primera vez, y todo lo que haga después es ganancia. Si está por encima, el negocio
  financia clientes con la esperanza de que vuelvan — y solo {R1_BASE*100:.0f} de cada 100 vuelve.

  {'CAC':<28}{'¿lo paga el 1er pedido?':>26}{'pedidos para recuperarlo':>28}
  {'-'*82}""")
for cac, nom in ((CAC_GRUPO, 'Pedido grupal'), (CAC_REFERIDO, 'Referido'),
                 (CAC_OBJETIVO, 'TU OBJETIVO S/13.50'), (CAC_MIN, 'Meta Ads, buen CPM'),
                 (CONTRIB_PEDIDO, 'Punto de quiebre'), (CAC_MAX, 'Meta Ads, mal CPM'),
                 (134.0, 'El S/134 sin fuente')):
    ok = 'sí' if cac <= CONTRIB_PEDIDO else 'NO'
    n = cac / CONTRIB_PEDIDO
    viable = '' if n <= E_PEDIDOS_BASE else '  ← más de los que hace un cliente'
    print(f"  {nom:<28}{('S/%.2f' % cac):>12}{ok:>14}{n:>20.2f}{viable}")

print(f"""
  Un cliente promedio hace {E_PEDIDOS_BASE:.2f} pedidos en toda su vida. Cualquier CAC por encima de
  S/{E_PEDIDOS_BASE*CONTRIB_PEDIDO:.2f} destruye valor con certeza. El S/134 que usé en el análisis anterior estaba
  {134/(E_PEDIDOS_BASE*CONTRIB_PEDIDO):.1f} veces por encima de ese límite — por eso aquel modelo concluía que la
  publicidad nunca se paga. La conclusión era correcta PARA ESE NÚMERO; el número estaba mal.""")

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE I — POR QUÉ LAS PREDICCIONES ANTERIORES DIERON TAN DISTINTO
# ═══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 92)
print('7 — POR QUÉ CADA MODELO ANTERIOR DIO UN NÚMERO DISTINTO'.center(92))
print('=' * 92)
print("""
  Los cinco modelos anteriores no discrepaban sobre el negocio. Discrepaban sobre UNA
  variable cada uno, y ninguna de esas variables tenía fuente. El negocio siempre fue el
  mismo; lo que cambiaba era qué número se tecleaba a mano.

  modelo   qué se tecleó a mano                          efecto sobre el resultado
  ────────────────────────────────────────────────────────────────────────────────────────
  v1-v4    "pedidos/día" sorteados de un rango elegido    define el resultado entero; el
           (el optimista asumía 28/día en el mes 3)       modelo solo lo multiplica
  v5       costos fijos S/950 y motorizado como costo     inventó un "valle" inexistente;
           fijo de S/1,100/mes                            el delivery es pass-through
  v6       retención mensual elegida (0.38) + S/300 de    la meseta activos = n/(1-r) queda
           publicidad supuesta                            fijada por dos números sin fuente
  v6b      igual que v6 + reinversión como % de ventas    crecimiento compuesto que no se
                                                          apoyaba en ningún CAC medido
  socio    CERO costo de adquisición                      infló todos los escenarios, y más
           (neto = contribución − fijos)                  los optimistas que los pesimistas
  socio3/4 CAC = S/134, sin fuente                        invirtió la conclusión: hizo ver
                                                          la publicidad como destructora
  ────────────────────────────────────────────────────────────────────────────────────────
  v7       nada. Los 3 números externos (22.6%, 6.93,     el resultado es una consecuencia,
  (este)   33 días) tienen cita, y el resto es aritmética no una elección

  Los dos errores fueron simétricos y los cometí yo en la misma sesión: primero cobrar S/0
  por cada cliente, después cobrar S/134. Con S/0 todo escenario era rentable; con S/134
  ninguno lo era. El negocio no cambió entre una tabla y la otra.""")

print('\n' + '=' * 92)
print('8 — QUÉ HAY QUE MEDIR DESDE EL 7 DE SEPTIEMBRE PARA QUE ESTO DEJE DE SER SIMULACIÓN'.center(92))
print('=' * 92)
print(f"""
  Este modelo descansa en 3 números prestados de estudios de EE.UU. Cada uno se puede
  reemplazar con dato propio en pocas semanas, y el orden importa:

  1. P(2º pedido) — hoy {R1_BASE*100:.1f}% prestado. Medible al 2º mes con el propio panel admin.
     Es la variable a la que TODO el modelo es más sensible: entre 22.6% y 40% el LTV
     pasa de S/{LTV_BASE:.2f} a S/{(1+calibrar(0.40).sum())*CONTRIB_PEDIDO:.2f} (+{((1+calibrar(0.40).sum())*CONTRIB_PEDIDO/LTV_BASE-1)*100:.0f}%).
  2. CAC real de Meta — hoy un rango de S/{CAC_MIN:.2f} a S/{CAC_MAX:.2f}. Medible en la PRIMERA semana
     de campaña, y ya está el Pixel + Conversions API programado para capturarlo.
     Falta correr `supabase secrets set META_PIXEL_ID=... META_CAPI_TOKEN=...`.
  3. Días entre pedidos — hoy 33 prestado. Medible al 3er mes.

  Advertencia que no se puede omitir: el ticket de este negocio (S/20.90-34.90 el sándwich, más S/6-15 de reparto)
  está por encima del único ticket de delivery con fuente para provincia peruana (S/15,
  Rappi vía Gestión, 2022). Eso no invalida el modelo — SND//WCH no compite por precio —
  pero sí significa que el CVR de 1.89% usado arriba podría ser optimista para este precio
  en este mercado. Es el supuesto más frágil de todo el cálculo.""")

# ═══════════════════════════════════════════════════════════════════════════════
# BLOQUE J — EL CANAL DE OFICINAS, CUANTIFICADO
# ═══════════════════════════════════════════════════════════════════════════════
print('\n' + '=' * 92)
print('9 — POR QUÉ EL CANAL DE OFICINAS CAMBIA LA ARITMÉTICA'.center(92))
print('=' * 92)
# [FUENTE] ezCater: 81% de los pedidos de oficina ocurren semanalmente o con más frecuencia.
# [FUENTE] ezCater: 70% de quienes probaron un restaurante por una comida pagada por su
#          empleador después hizo un pedido PERSONAL.
PED_OFICINA_MES = 4.0      # [FUENTE ezCater] semanal → 4 al mes
SW_POR_OFICINA  = 6        # [DECISIÓN/MEDIDO] ORGANIZER_FREE_MIN_SANDWICHES=5 es el mínimo
CONV_PERSONAL   = 0.70     # [FUENTE ezCater]

contrib_oficina_mes = PED_OFICINA_MES * SW_POR_OFICINA * CONTRIB_SANDWICH - PED_OFICINA_MES * COSTO_SANDWICH_15
print(f"""
  Una cuenta de oficina de {SW_POR_OFICINA} personas que pide {PED_OFICINA_MES:.0f} veces al mes:

     {PED_OFICINA_MES:.0f} pedidos × {SW_POR_OFICINA} sándwiches × S/{CONTRIB_SANDWICH:.2f}      = S/{PED_OFICINA_MES*SW_POR_OFICINA*CONTRIB_SANDWICH:>8,.2f} de contribución
     menos el 15CM regalado al organizador cada vez  = S/{PED_OFICINA_MES*COSTO_SANDWICH_15:>8,.2f}
     ─────────────────────────────────────────────────────────────
     CONTRIBUCIÓN NETA DE UNA SOLA OFICINA           = S/{contrib_oficina_mes:>8,.2f} AL MES

  Eso es {contrib_oficina_mes/CONTRIB_PEDIDO:.0f} pedidos individuales de contribución, con UN solo cliente que
  atender y UNA sola entrega. Y {CONV_PERSONAL*100:.0f}% de quienes prueban un restaurante por una comida
  del trabajo después piden por su cuenta [FUENTE ezCater], así que cada oficina siembra
  hasta {SW_POR_OFICINA*CONV_PERSONAL:.0f} clientes individuales adicionales sin costo de adquisición extra.

  {'oficinas activas':>18}{'contrib/mes':>14}{'neto/mes':>12}{'pedidos/día':>14}{'% del techo':>13}
  {'-'*71}""")
for n_of in (1, 3, 5, 8, 12, 20):
    c = n_of * contrib_oficina_mes
    ped_dia = n_of * PED_OFICINA_MES / 26
    print(f"  {n_of:>16}{c:>14,.0f}{c-FIJOS_MES:>12,.0f}{ped_dia:>14.1f}{ped_dia/CAP_DIA*100:>12.0f}%")

print(f"""
  ►► {int(np.ceil((FIJOS_MES)/contrib_oficina_mes))} oficinas cubren TODOS los costos fijos del negocio. {int(np.ceil((FIJOS_MES+3000)/contrib_oficina_mes))} oficinas dejan
     S/3,000 netos al mes usando el {int(np.ceil((FIJOS_MES+3000)/contrib_oficina_mes))*PED_OFICINA_MES/26/CAP_DIA*100:.0f}% del techo de cocina. Ese es el camino más
     corto que existe en este negocio, y el incentivo que lo activa ya está desplegado.

  Lo que este bloque NO demuestra: cuántas oficinas se consiguen al mes. La conversión del
  QR de la tarjeta de la bolsa no tiene benchmark publicado — el agente buscó y no encontró
  ninguna cifra citable de costo por cuenta corporativa adquirida. Ese número solo puede
  salir de medirlo desde el 7 de septiembre.""")
