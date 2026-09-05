"""
SND//WCH — MODELO v8 (segunda versión, 2026-09-02).

POR QUÉ HAY UNA SEGUNDA VERSIÓN. La primera respondía "sí se puede: con 1.25 sándwiches por
pedido el mes 6 da S/10,571". El dueño preguntó lo único que había que preguntar: *¿estás
asumiendo que esa idea sí o sí dará resultados?* La respuesta era que sí, y estaba mal.

Ese 1.25 no era un dato ni un pronóstico: era un número que YO despejé hacia atrás para que
la cuenta cerrara, y después lo presenté como plan. Es exactamente el defecto que este
repositorio ya pagó dos veces —el CAC de S/134 y el "S/128-141 por publicidad", ambos
escritos sin fuente y usados después como si fueran medición.

Esta versión hace tres cosas distintas:
  1. AUDITA sus propios supuestos antes de calcular nada, y separa lo medido de lo inventado.
  2. Calcula el caso base SOLO con lo medido. Ninguna palanca sin evidencia entra al número.
  3. LIBERA la capacidad de producción [DECISIÓN del dueño, 2026-09-02: "la producción no es
     una traba, solo toma en cuenta la capacidad por persona y asume que si hace falta
     contrataremos más"], y con eso descubre que la restricción real nunca estuvo en la cocina.

REGLA DE CONSTRUCCIÓN:
  [MEDIDO]    hecho verificable de este negocio
  [FUENTE]    benchmark externo publicado, con cita
  [DECISIÓN]  palanca que el dueño controla — no es predicción, es elección
  [DERIVADO]  aritmética de los anteriores
  [SIN MEDIR] declarado como tal. NO entra al caso base; solo aparece como sensibilidad.

Python puro, sin numpy ni scipy: un modelo que no se puede correr no se vuelve a correr.
"""
from datetime import date, timedelta
from math import ceil

# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE A — HECHOS
# ═══════════════════════════════════════════════════════════════════════════════════════
CONTRIB_PEDIDO   = 16.42   # [MEDIDO] MENU_FINANCIAL_ANALYSIS.md v6.1 — 1 sándwich + 25% de
                           #          bebida, con merma de cocción y pan a S/2/unidad
CONTRIB_SANDWICH = 16.16   # [MEDIDO] contribución MEDIA por sándwich, mezcla 80% en 15CM
FIJOS_MES        = 500.0   # [MEDIDO] dueño 2026-08-15: opera desde casa, sin planilla
CAP_POR_PERSONA  = 40      # [MEDIDO] dueño: cocina por tandas, en servicio solo arma
SUELDO           = 1500.0  # [DECISIÓN] dueño 2026-09-02
APERTURA         = date(2026, 9, 7)
CERRADO_WEEKDAY  = 0       # [MEDIDO] STORE_HOURS: lunes cerrado
OBJETIVO         = 10000.0 # [DECISIÓN] dueño 2026-09-02: netos al mes, máximo desde el mes 6
COSTO_KM_MOTO    = 2.0     # [MEDIDO] dueño 2026-09-02
TARIFAS_ZONA     = {'cerca': 6, 'media': 8, 'lejos': 12, 'muy_lejos': 15}   # [MEDIDO] env.ts

R1_BASE            = 0.226 # [FUENTE] Bloom Intelligence, 1,000+ locales, ene-24 a oct-25
E_TOTAL_DADO_2     = 6.93  # [FUENTE] misma muestra
DIAS_ENTRE_PEDIDOS = 33.0  # [FUENTE] Paytronix 2025, canal propio
CPM_MIN, CPM_MAX   = 5.0, 12.0            # [FUENTE] ibo.pe, Perú, rubro restaurantes
CTR, CVR, IGV      = 0.0297, 0.0189, 0.18 # [FUENTE] get-ryze 2026 / Paradero Digital
FACTOR_OPTIMISMO   = 1 / 2.06             # [FUENTE] Flyvbjerg, Holm & Buhl, JAPA 71(2)


def dias_operativos(anio, mes_, desde=None):
    d = date(anio, mes_, 1) if desde is None else desde
    n = 0
    while d.month == mes_:
        if d.weekday() != CERRADO_WEEKDAY:
            n += 1
        d += timedelta(days=1)
    return n


MESES = [(2026, 9), (2026, 10), (2026, 11), (2026, 12), (2027, 1), (2027, 2)]
DIAS = [dias_operativos(2026, 9, APERTURA)] + [dias_operativos(a, m) for a, m in MESES[1:]]
ETIQ = ['sep-26', 'oct-26', 'nov-26', 'dic-26', 'ene-27', 'feb-27']
MES6 = 5


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE B — CALIBRACIÓN sBG (Fader & Hardie)
# ═══════════════════════════════════════════════════════════════════════════════════════
def superviv(a, r1, n_max=500):
    b = r1 / (1 - r1) * a
    out, acc = [], 1.0
    for j in range(1, n_max + 1):
        acc *= (b + j - 1) / (a + b + j - 1)
        out.append(acc)
    return out


def calibrar(r1, e_dado_2=E_TOTAL_DADO_2):
    def err(a):
        S = superviv(a, r1)
        return 1 + sum(S) / S[0] - e_dado_2
    lo, hi = 1e-4, 200.0
    flo = err(lo)
    for _ in range(200):
        mid = (lo + hi) / 2
        fmid = err(mid)
        if (flo < 0) == (fmid < 0):
            lo, flo = mid, fmid
        else:
            hi = mid
    return superviv((lo + hi) / 2, r1)


S_BASE = calibrar(R1_BASE)
PEDIDOS_POR_CLIENTE = 1 + sum(S_BASE)


def perfil_mensual(S, horizonte=60):
    perfil = [0.0] * horizonte
    prob, n = 1.0, 1
    while n <= len(S) and prob > 1e-6:
        m = int(((n - 1) * DIAS_ENTRE_PEDIDOS) // 30.44)
        if m >= horizonte:
            break
        perfil[m] += prob
        prob *= S[n - 1] / (S[n - 2] if n >= 2 else 1.0)
        n += 1
    return perfil


PERFIL = perfil_mensual(S_BASE)


def cac_meta(cpm):
    return cpm / (1000 * CTR * CVR) * (1 + IGV)


CAC_MIN, CAC_MAX = cac_meta(CPM_MIN), cac_meta(CPM_MAX)
CAC_CENTRAL = 13.50


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE C — EL MODELO, CON LA CAPACIDAD LIBERADA
# ═══════════════════════════════════════════════════════════════════════════════════════
# [DECISIÓN dueño 2026-09-02] La producción deja de ser un tope y pasa a ser un COSTO: cada
# CAP_POR_PERSONA pedidos/día extra cuestan un sueldo. El dueño es la persona 1 y no cobra
# sueldo — su pago es el neto.
def personal(pedidos_dia):
    return max(0, ceil(pedidos_dia / CAP_POR_PERSONA) - 1)


def mes(gasto, contrib, cac, idx=MES6, optimismo=1.0):
    """[DERIVADO] Estado del mes `idx` con `gasto` de publicidad sostenido desde el mes 1."""
    nuevos = gasto / cac * optimismo
    pedidos = sum(nuevos * PERFIL[idx - m] for m in range(idx + 1) if idx - m < len(PERFIL))
    dia = pedidos / DIAS[idx]
    contratados = personal(dia)
    neto = pedidos * contrib - FIJOS_MES - contratados * SUELDO - gasto
    return {'pedidos': pedidos, 'dia': dia, 'contratados': contratados, 'neto': neto,
            'nuevos_mes': nuevos, 'gasto': gasto}


def gasto_minimo(objetivo, contrib, cac, idx=MES6, optimismo=1.0, tope=500000.0):
    """[DERIVADO] Sin techo de producción el neto crece con el gasto, así que hay una
    respuesta única. Devuelve None si ni con el tope de búsqueda se llega."""
    if mes(tope, contrib, cac, idx, optimismo)['neto'] < objetivo:
        return None
    lo, hi = 0.0, tope
    for _ in range(80):
        mid = (lo + hi) / 2
        if mes(mid, contrib, cac, idx, optimismo)['neto'] >= objetivo:
            hi = mid
        else:
            lo = mid
    return hi


def sep(t=''):
    print('\n' + '=' * 94)
    if t:
        print(t.center(94))
        print('=' * 94)


# ═══════════════════════════════════════════════════════════════════════════════════════
sep('MODELO v8 (2ª versión) — AUDITORÍA DE SUPUESTOS ANTES DE CALCULAR NADA')
print("""
  Cada número que entra a un modelo es una promesa sobre el mundo. Estos son los de este
  modelo, con lo que de verdad se sabe de cada uno:

  -- LO QUE ESTÁ MEDIDO Y SE PUEDE USAR ------------------------------------------------
  · Contribución por pedido S/16.42        MENU_FINANCIAL_ANALYSIS.md, con merma y pan real
  · Costos fijos < S/500/mes               opera desde casa, sin planilla
  · 40 pedidos/día por persona             cocina por tandas, en servicio solo arma
  · Comisión Culqi, tarifas de zona, horario   todo en el código, en producción

  -- LO QUE ES BENCHMARK PRESTADO (de EE.UU., no de Trujillo) --------------------------
  · 22.6% hace un 2º pedido -> 2.34 pedidos/cliente     Bloom Intelligence
  · 33 días entre pedidos                              Paytronix
  · CAC Meta Perú S/10.51 - S/25.23                    ibo.pe + get-ryze + IGV

  -- LO QUE YO INVENTÉ EN LA PRIMERA VERSIÓN Y NO DEBIÓ ENTRAR --------------------------
  X "1.25 sándwiches por pedido". NO es un dato ni un pronóstico: lo despejé hacia atrás
    para que la cuenta cerrara y después lo presenté como plan. No existe una sola fuente
    —ni interna ni externa— de cuánto sube el attach un cambio en el carrito.
  X "1.00 sándwiches por pedido" como punto de partida. Tampoco está medido: el negocio no
    ha abierto. Los DOS extremos de mi palanca eran inventados.
  X Aplicar los S/16.16 de contribución MEDIA al sándwich MARGINAL. El segundo sándwich de
    un pedido no tiene por qué ser el promedio del catálogo, y si se lo empuja con un combo
    o un descuento, contribuye menos.
  X Presentar como "plan" un escenario que corría al 100% de la capacidad de una persona
    todos los días del mes. Eso no es un plan: es un mes sin un solo día malo.

  -- LO QUE SIGUE SIN MODELAR, Y AHORA IMPORTA MÁS QUE TODO LO DEMÁS -------------------
  ! El CAC se supone CONSTANTE a cualquier nivel de gasto. Es falso y se sabe que es falso:
    la audiencia barata se agota y el costo sube. Sin esto, el modelo cree que se puede
    comprar cualquier cantidad de clientes al mismo precio.
  ! No hay tamaño de mercado. El modelo adquiriría 50,000 clientes en Trujillo sin
    inmutarse. Abajo se calcula CUÁNTOS hacen falta, para que el número se pueda contrastar
    contra la realidad — pero no se inventa un mercado direccionable.
  ! Los fijos se quedan en S/500 aunque el volumen se multiplique por veinte.
  ! El reparto se supone neutro. Cobras por zona y te cobran por kilómetro (ver el final).
""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('1 — EL CASO BASE: SOLO CON LO MEDIDO, Y SIN TECHO DE PRODUCCIÓN')
print(f"""
  Sin ninguna palanca inventada: cada pedido lleva lo que hoy lleva (S/{CONTRIB_PEDIDO:.2f} de
  contribución). La producción deja de ser un tope y pasa a ser un COSTO — cada {CAP_POR_PERSONA} pedidos/día
  extra son un sueldo de S/{SUELDO:.0f}. El dueño es la persona 1 y no cobra sueldo.

  Pregunta: ¿qué hace falta para S/{OBJETIVO:,.0f} netos en el mes 6 (feb-27, {DIAS[MES6]} días abiertos)?
""")
print(f"  {'CAC':>10}{'ads/mes':>12}{'pedidos':>10}{'ped/día':>10}{'personas':>10}{'nuevos/mes':>13}{'neto':>11}")
print('  ' + '-' * 78)
BASE = {}
for cac in (CAC_MIN, CAC_CENTRAL, 18.0, CAC_MAX):
    g = gasto_minimo(OBJETIVO, CONTRIB_PEDIDO, cac)
    BASE[cac] = None if g is None else mes(g, CONTRIB_PEDIDO, cac)
    if g is None:
        print(f"  {('S/%.2f' % cac):>10}{'—':>12}{'—':>10}{'—':>10}{'—':>10}{'—':>13}  imposible")
        continue
    r = BASE[cac]
    print(f"  {('S/%.2f' % cac):>10}{('S/%.0f' % g):>12}{r['pedidos']:>10.0f}{r['dia']:>10.1f}"
          f"{r['contratados']+1:>10.0f}{r['nuevos_mes']:>13.0f}{r['neto']:>11,.0f}")

print(f"""
  ►► LA RESTRICCIÓN NUNCA ESTUVO EN LA COCINA. Liberada la producción, el objetivo se
     alcanza con {BASE[CAC_MIN]['contratados']+1:.0f} personas y sin inventar ninguna palanca de producto — SI el CAC
     se porta como su mejor valor documentado. Lo que decide todo es el CAC, y el CAC es
     justo el número que nadie ha medido todavía.

     De S/{CAC_MIN:.2f} a S/{CAC_CENTRAL:.2f} de CAC el gasto necesario pasa de S/{BASE[CAC_MIN]['gasto']:,.0f} a S/{BASE[CAC_CENTRAL]['gasto']:,.0f}/mes.
     A S/18.00 ya son S/{BASE[18.0]['gasto']:,.0f}/mes y {BASE[18.0]['contratados']+1:.0f} personas. En el peor extremo documentado
     (S/{CAC_MAX:.2f}) el objetivo del mes 6 es inalcanzable a cualquier gasto.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('2 — LA PREGUNTA QUE EL MODELO NO PUEDE RESPONDER: ¿HAY TANTA GENTE?')
print("""
  El modelo compra clientes al mismo precio sin importar cuántos lleve. Eso es falso, y es
  la debilidad más grande que le queda. No voy a inventar un mercado direccionable de
  Trujillo para taparlo — pongo el número que hay que contrastar contra la realidad:
""")
print(f"  {'CAC':>10}{'nuevos/mes':>14}{'nuevos por día abierto':>26}{'clientes distintos en 6 meses':>32}")
print('  ' + '-' * 84)
for cac in (CAC_MIN, CAC_CENTRAL, 18.0):
    r = BASE[cac]
    if r is None:
        continue
    print(f"  {('S/%.2f' % cac):>10}{r['nuevos_mes']:>14.0f}{r['nuevos_mes']/DIAS[MES6]:>26.0f}"
          f"{r['nuevos_mes']*6:>32,.0f}")
print(f"""
  ►► ESTE ES EL NÚMERO QUE HAY QUE MIRAR A LOS OJOS. Sostener el objetivo exige conseguir
     entre {BASE[CAC_MIN]['nuevos_mes']:.0f} y {BASE[CAC_CENTRAL]['nuevos_mes']:.0f} clientes NUEVOS cada mes, todos los meses — unas {BASE[CAC_MIN]['nuevos_mes']/DIAS[MES6]:.0f} a {BASE[CAC_CENTRAL]['nuevos_mes']/DIAS[MES6]:.0f}
     personas distintas por día abierto, sin repetir.

     No sé si Trujillo da eso a ese precio, y cualquiera que te dé una cifra hoy la está
     inventando. Es LA incógnita del plan, y se despeja midiendo el CAC real en la primera
     semana de publicidad — no discutiéndola ahora.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('3 — QUÉ APORTARÍA LA PALANCA DE SÁNDWICHES POR PEDIDO (SI EXISTIERA)')
MARGINAL = CONTRIB_SANDWICH * 0.75
print(f"""
  [SIN MEDIR] Nadie sabe si un cambio en el carrito sube los sándwiches por pedido, ni
  cuánto. Por eso NO está en el caso base. Lo que sí se puede decir con honestidad es
  cuánto VALDRÍA si se lograra — y así se decide si vale la pena intentarlo.

  Se usa una contribución marginal CASTIGADA: S/{MARGINAL:.2f} en vez de los S/{CONTRIB_SANDWICH:.2f} del promedio
  (−25%), porque un segundo sándwich empujado con combo o descuento contribuye menos que el
  promedio del catálogo. Ese castigo es una elección a ojo, y va declarada como tal.
""")
print(f"  {'sándwiches/pedido':>19}{'contrib':>10}{'ads/mes (CAC S/13.50)':>24}{'ahorro vs 1.00':>17}{'personas':>10}")
print('  ' + '-' * 82)
g100 = BASE[CAC_CENTRAL]['gasto']
for s in (1.00, 1.05, 1.10, 1.25, 1.50):
    c = CONTRIB_PEDIDO + (s - 1) * MARGINAL
    g = gasto_minimo(OBJETIVO, c, CAC_CENTRAL)
    r = mes(g, c, CAC_CENTRAL)
    print(f"  {s:>19.2f}{c:>10.2f}{('S/%.0f' % g):>24}{('S/%.0f' % (g100 - g)):>17}{r['contratados']+1:>10.0f}")
print("""
  ►► LA PALANCA ES REAL PERO NO ES EL PLAN. Un +5% de sándwiches por pedido —objetivo
     modesto y medible— ahorra publicidad todos los meses sin cambiar nada más. Pero el
     objetivo NO depende de ella: el caso base ya llega sin inventar nada, y esta palanca
     solo lo abarata. Ese es el lugar correcto para una idea sin evidencia.

     Y lo primero no es construirla: es MEDIR cuánto vale hoy. `retention_report` ya
     devuelve `attach.avgUnits`. El día 1 de ventas reales ese número existe, y recién ahí
     se sabe si hay algo que mover.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('4 — EL PISO HONESTO')
print("""
  Flyvbjerg, Holm & Buhl (JAPA 71(2), 210 proyectos): los pronósticos de demanda se
  sobreestiman +106% en promedio, y 9 de cada 10 se sobreestiman. Es una corrección al
  PRONOSTICADOR, no al negocio: castiga dar por hecho que la gente pedirá al ritmo del
  benchmark estadounidense.
""")
print(f"  {'CAC':>10}{'ads/mes':>14}{'ped/día':>10}{'personas':>10}   ¿llega al mes 6?")
print('  ' + '-' * 70)
for cac in (CAC_MIN, CAC_CENTRAL, CAC_MAX):
    g = gasto_minimo(OBJETIVO, CONTRIB_PEDIDO, cac, optimismo=FACTOR_OPTIMISMO)
    if g is None:
        print(f"  {('S/%.2f' % cac):>10}{'—':>14}{'—':>10}{'—':>10}   NO, a ningún gasto")
        continue
    r = mes(g, CONTRIB_PEDIDO, cac, optimismo=FACTOR_OPTIMISMO)
    print(f"  {('S/%.2f' % cac):>10}{('S/%.0f' % g):>14}{r['dia']:>10.1f}{r['contratados']+1:>10.0f}   sí, pero mira el gasto")
print("""
  ►► Con la corrección aplicada, el objetivo del mes 6 exige gastos que no tienen sentido o
     directamente no se alcanza. Las dos tablas juntas son el resultado honesto: el mes 6
     depende por completo de que el CAC real de Trujillo caiga en el BUEN extremo de un
     rango prestado Y de que la demanda se parezca al benchmark. Ninguna de las dos está
     medida, y son independientes: pueden fallar las dos a la vez.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('5 — LA FUGA QUE SÍ ESTÁ MEDIDA Y NADIE MIRA: EL REPARTO')
print(f"""
  [MEDIDO 2026-09-02] El reparto lo hace un tercero con 50+ motorizados que cobra
  S/{COSTO_KM_MOTO:.0f} POR KILÓMETRO. La app cobra por ZONA, un monto plano que elige el cliente.
""")
for z, t in TARIFAS_ZONA.items():
    print(f"    {z:<12} cobra S/{t:<4} -> cubre {t/COSTO_KM_MOTO:.1f} km a S/{COSTO_KM_MOTO:.0f}/km")
PED_OBJ = BASE[CAC_CENTRAL]['pedidos']
print(f"""
  CLAUDE.md afirma que "el negocio no gana ni subsidia el reparto". Eso solo es cierto si la
  zona coincide con los kilómetros reales, y NADIE lo ha comprobado.

  Al volumen del objetivo ({PED_OBJ:,.0f} pedidos/mes):
""")
print(f"  {'descuadre por pedido':>24}{'pérdida/mes':>15}{'% del objetivo':>17}")
print('  ' + '-' * 56)
for d in (0.5, 1.0, 2.0, 3.0):
    print(f"  {('S/%.2f' % d):>24}{d*PED_OBJ:>15,.0f}{d*PED_OBJ/OBJETIVO*100:>16.1f}%")
print("""
  ►► A diferencia de todo lo demás de este modelo, esto NO es un pronóstico: es una fuga que
     o existe o no existe HOY, y se resuelve con una libreta y dos semanas de anotar
     kilómetros. Es el dato más barato de conseguir de toda la lista.""")

# ═══════════════════════════════════════════════════════════════════════════════════════
sep('RESUMEN')
print(f"""
  1. RETIRO LA RESPUESTA ANTERIOR. El "sí se puede con 1.25 sándwiches por pedido" estaba
     construido sobre un número que despejé hacia atrás y presenté como plan.

  2. LIBERADA LA PRODUCCIÓN, EL OBJETIVO NO NECESITA NINGUNA PALANCA INVENTADA. Con lo
     medido y nada más, el mes 6 llega a S/{OBJETIVO:,.0f} con S/{BASE[CAC_MIN]['gasto']:,.0f}/mes de publicidad y
     {BASE[CAC_MIN]['contratados']+1:.0f} personas — si el CAC es S/{CAC_MIN:.2f}. A CAC S/{CAC_CENTRAL:.2f} son S/{BASE[CAC_CENTRAL]['gasto']:,.0f}/mes y {BASE[CAC_CENTRAL]['contratados']+1:.0f} personas.

  3. LA RESTRICCIÓN SE MUDÓ DE LA COCINA AL MERCADO. Ya no es cuántos sándwiches puedes
     armar: es si Trujillo tiene {BASE[CAC_MIN]['nuevos_mes']:.0f}-{BASE[CAC_CENTRAL]['nuevos_mes']:.0f} clientes nuevos cada mes a ese precio.
     Ningún modelo puede responder eso. Lo responde la primera semana de publicidad real.

  4. EL CAC ES AHORA EL ÚNICO NÚMERO QUE IMPORTA. Todo el plan vive o muere ahí, y hoy es un
     rango prestado de {CAC_MAX/CAC_MIN:.1f}x de ancho. Medirlo es la primera tarea, no la última.

  5. LA PALANCA DE SÁNDWICHES POR PEDIDO SIGUE VALIENDO LA PENA — pero como AHORRO, no como
     plan, y primero se MIDE (`attach.avgUnits` ya existe) antes de construir nada.

  6. EL REPARTO ES LO ÚNICO ACCIONABLE HOY, y no depende de ningún pronóstico.
""")
