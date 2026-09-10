# -*- coding: utf-8 -*-
"""
SND//WCH — ¿CÓMO SE LLEGA A S/5,000 NETOS SOSTENIDOS? (2026-09-06)

Pedido del dueño. El v11 ya contestó "¿se llega en el mes 6?" y la respuesta fue NO en toda
la rejilla de publicidad. Este archivo contesta la pregunta útil, que es otra:

    ¿QUÉ TIENE QUE PASAR, Y PARA CUÁNDO, PARA QUE EL NEGOCIO DEJE S/5,000 TODOS LOS MESES?

TRES DECISIONES DE MÉTODO, declaradas para que no se lean como resultado:

  1. "SOSTENIDO" ES UNA CONDICIÓN DURA: el neto tiene que quedar en S/5,000 o más en el mes
     M y en TODOS los que siguen hasta el final del horizonte. Un mes que toca la meta y cae
     al siguiente NO cuenta. Es la diferencia entre un pico y un piso, y el dueño pidió un
     piso.

  2. EL HORIZONTE SUBE A 24 MESES. El v11 mira 12 y por eso su respuesta a "¿cuándo?" es
     "nunca" — que en realidad significa "no dentro de la ventana que estoy mirando". Con la
     apertura movida a octubre de 2026, 12 meses terminan en septiembre de 2027, y el
     equilibrio recién llega en febrero. Preguntar "¿cuándo se llega a S/5,000?" con una
     ventana que termina a los 12 meses es preguntar mal.

  3. NO SE AFLOJA NINGÚN SUPUESTO DEL v11. Misma contribución, mismo CAC, mismo castigo por
     no salir de la fase de aprendizaje, mismo ruido. Lo único que se mueve son las palancas
     que se están evaluando, y cada una se nombra.

REGLA DE CONSTRUCCIÓN: [MEDIDO] [FUENTE] [AGENCIA] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import modelo_v11 as M  # noqa: E402

META = 5000.0          # [DECISIÓN] dueño 2026-09-06: S/5,000 netos, sostenidos
MESES = 24             # [MÉTODO] ver decisión 2 del encabezado
N = 3000               # corridas por celda

# Extender el horizonte del modelo. `corrida` lee estos globales en cada llamada, así que
# reemplazarlos acá cambia el horizonte sin tocar ni una línea del v11.
M.CAL = M._calendario(M.APERTURA, MESES)
M.ETIQ = [c[2] for c in M.CAL]
M.DIAS = [c[3] for c in M.CAL]
M.HORIZONTE = len(M.CAL)


def corridas(ads, viral, fcac=1.0, contrib=None, n=N):
    orig = M.cac_meta
    if fcac != 1.0:
        M.cac_meta = lambda cpm, _o=orig, _f=fcac: _o(cpm) * _f
    try:
        return [M.corrida(float(ads), 0.0, viral, contrib=contrib) for _ in range(n)]
    finally:
        M.cac_meta = orig


def mediana_mes(runs):
    return [M.pct([r['netos'][m] for r in runs], 0.50) for m in range(M.HORIZONTE)]


def primer_mes_sostenido(med, meta=META):
    """El primer mes desde el cual la mediana se queda en la meta HASTA EL FINAL.
    Se recorre desde atrás: así un pico aislado nunca cuenta como llegada."""
    corte = None
    for m in range(M.HORIZONTE - 1, -1, -1):
        if med[m] >= meta:
            corte = m
        else:
            break
    return corte


def p_sostiene_desde(runs, mes, meta=META):
    """Fracción de escenarios donde el neto se queda en la meta desde `mes` hasta el final.
    Es la pregunta del dueño medida escenario por escenario, no sobre la mediana."""
    if mes is None or mes >= M.HORIZONTE:
        return 0.0
    return sum(1 for r in runs
               if all(r['netos'][k] >= meta for k in range(mes, M.HORIZONTE))) / len(runs)


def etq(m):
    return M.ETIQ[m] if m is not None else 'no llega en 24 meses'


def pedidos_para(meta, contrib, ads, dias, personas=1):
    """Invierte la ecuación del neto: cuántos pedidos hacen falta para dejar `meta`.
    neto = ped·(contrib − overhead) − fijos − sueldos − ads   (los referidos se omiten:
    su costo va contra el mismo pedido que ya está contado, y omitirlos deja el número
    del lado exigente)."""
    return (meta + M.FIJOS_MES + (personas - 1) * M.SUELDO + ads) / (contrib - M.OVERHEAD_POR_PEDIDO)


def linea(c='='):
    print(c * 100)


def sep(t=''):
    print('\n' + '=' * 100)
    if t:
        print(t.center(100)); print('=' * 100)


if __name__ == "__main__":
    linea(); print("  SND//WCH — CÓMO LLEGAR A S/5,000 NETOS SOSTENIDOS".center(100)); linea()
    print(f"""
  Punto de partida, TODO del modelo v11 sin aflojar nada:

     contribución por pedido ... S/{M.CONTRIB_PEDIDO:.2f}   (mitad de los pedidos por ARMA EL TUYO)
     CAC limpio (CPM medio) .... S/{M.CAC_MEDIO:.2f}   [AGENCIA] — no es medición auditada
     costos fijos .............. S/{M.FIJOS_MES:,.0f}/mes   [MEDIDO] opera desde casa
     apertura .................. {M.APERTURA}   [MEDIDO] techo que puso el dueño
     horizonte ................. {MESES} meses ({M.ETIQ[0]} a {M.ETIQ[-1]})

  META: neto ≥ S/{META:,.0f} en un mes Y EN TODOS LOS SIGUIENTES. Un pico no cuenta.
""")

    # ── 1. ¿ALCANZA CON PUBLICIDAD? ───────────────────────────────────────────────────
    sep('1 · SOLO CON PUBLICIDAD — ¿alcanza subiendo el presupuesto?')
    print("""
  La publicidad se resta del neto del mes y el cliente devuelve su valor después. Por eso
  más presupuesto no es más neto: hay un óptimo y pasarse EMPEORA. Acá se busca si alguna
  cantidad, sola, sostiene la meta.
""")
    print(f"  {'ads/mes':>9} {'neto m6':>9} {'neto m12':>9} {'neto m18':>9} {'neto m24':>9} "
          f"{'sostiene desde':>16} {'P(sostiene)':>12}")
    linea('-')
    mejor_solo = (None, -1e9)
    for ads in (2000, 4000, 6000, 8000, 10000, 14000, 20000):
        runs = corridas(ads, 0.06)
        med = mediana_mes(runs)
        ms = primer_mes_sostenido(med)
        p = p_sostiene_desde(runs, ms) if ms is not None else 0.0
        if med[-1] > mejor_solo[1]:
            mejor_solo = (ads, med[-1])
        print(f"  {ads:>9,} {med[5]:>9,.0f} {med[11]:>9,.0f} {med[17]:>9,.0f} {med[23]:>9,.0f} "
              f"{etq(ms):>16} {p*100:>11.1f}%")
    print(f"\n  El mejor neto al mes 24 con publicidad sola: S/{mejor_solo[1]:,.0f} a "
          f"S/{mejor_solo[0]:,}/mes de pauta.")
    print("  ⚠ La publicidad NO es la palanca: comprar más clientes al mismo CAC compra")
    print("     también más costo. Lo que falta no es volumen, es margen por cliente.")
    print("""
  ⚠⚠ LEER ESTA TABLA CON CUIDADO: EL NETO SUBE HASTA ~EL MES 12 Y DESPUÉS BAJA. Eso NO es
     una predicción del negocio, es la consecuencia de UN supuesto sin medir — `SATURACION_
     POR_MIL = 0.10`, o sea "el CAC sube 10% por cada 1,000 clientes ya captados". Medido:

         saturación   neto m6   neto m12   neto m18   neto m24
              0.00      1,599      3,337      3,464      3,429   <- se estabiliza
              0.05        930      1,903      1,477        963
              0.10        726      1,081        275       -332   <- el valor del modelo
              0.20         74         63     -1,018     -1,758

     Con el supuesto apagado la curva se APLANA en vez de caer. O sea que la caída del
     segundo año dice "si captar se encarece a ese ritmo, el negocio se apaga solo", y eso
     es una hipótesis sobre el mercado de Trujillo que NADIE ha medido. Es la primera cosa
     que hay que verificar con datos reales, porque decide si el año 2 existe.""")

    # ── 2. LAS TRES PALANCAS REALES ───────────────────────────────────────────────────
    sep('2 · LAS TRES PALANCAS QUE SÍ MUEVEN LA META')
    print("""
  Se mueve UNA sola y todo lo demás queda en su valor de hoy, con la pauta en el óptimo del
  v11 (S/6,000/mes). Sirve para separar lo alcanzable de la fantasía.
""")
    for nombre, valores, kw in (
        ("CAC — el precio de traer un cliente nuevo",
         [17.87, 15, 12, 10, 8, 6], 'cac'),
        ("VIRALIDAD — referidos por cada 100 pedidos servidos",
         [0.06, 0.15, 0.25, 0.40, 0.60, 0.90], 'viral'),
        ("CONTRIBUCIÓN — lo que deja cada pedido",
         [14.13, 16, 18, 20, 24, 28], 'contrib'),
    ):
        print(f"\n  {nombre}")
        print(f"    {'valor':>10} {'neto m12':>10} {'neto m24':>10} {'sostiene desde':>16} {'P(sostiene)':>12}")
        for v in valores:
            if kw == 'cac':
                runs = corridas(6000, 0.06, fcac=v / M.CAC_MEDIO)
            elif kw == 'viral':
                runs = corridas(6000, v)
            else:
                runs = corridas(6000, 0.06, contrib=v)
            med = mediana_mes(runs)
            ms = primer_mes_sostenido(med)
            p = p_sostiene_desde(runs, ms) if ms is not None else 0.0
            # Guardarraíl: si el escenario implica más clientes de los que el mercado puede
            # dar, el número no es un resultado, es el modelo compuesto sin freno. Trujillo
            # tiene ~1M de habitantes; una sandwichería de delivery con 50,000 clientes
            # captados en dos años no es optimismo, es una división por cero disfrazada.
            ac = M.pct([r['acumulados'] for r in runs], 0.50)
            aviso = '  <-- FUERA DE RANGO: %s clientes captados' % f"{ac:,.0f}" if ac > 20000 else ''
            print(f"    {v:>10} {med[11]:>10,.0f} {med[23]:>10,.0f} {etq(ms):>16} {p*100:>11.1f}%{aviso}")

    # ── 3. LA COMBINACIÓN MÍNIMA ──────────────────────────────────────────────────────
    sep('3 · LA COMBINACIÓN MÍNIMA QUE LLEGA — y cuándo llega')
    print("""
  Ninguna palanca sola alcanza dentro de lo realista, así que se apilan en el orden en que
  el negocio puede ejecutarlas. Cada fila AGREGA una cosa a la anterior, y ninguna inventa
  un número: cada una dice de dónde saldría.
""")
    ESCALONES = [
        ("hoy, tal como está",                      M.CONTRIB_PEDIDO, 1.00, 0.06, 6000,
         "el punto de partida"),
        ("+ mezcla 65% Signature",                  M._contrib_menu("actual", 0.35), 1.00, 0.06, 6000,
         "empujar la carta curada por encima del armador"),
        ("+ bebida en 40% de los pedidos",          None, 1.00, 0.06, 6000,
         "attach 25%→40%: la bebida deja S/4.18 y cuesta 19-32%"),
        ("+ CAC 30% mejor (S/12.51)",               None, 0.70, 0.06, 6000,
         "duplicar la conversión de la app; el CVR es lo único bajo control propio"),
        ("+ viralidad 25 por 100 pedidos",          None, 0.70, 0.25, 6000,
         "el referido cuesta S/7.65 contra S/17.87 de CAC pagado"),
        ("+ viralidad 40 por 100 pedidos",          None, 0.70, 0.40, 6000,
         "1 de cada 2.5 pedidos trae a alguien"),
    ]
    contrib_acum = None
    print(f"  {'escenario':>32} {'contrib':>8} {'CAC':>7} {'viral':>6} {'ads':>7} "
          f"{'neto m12':>9} {'neto m24':>9} {'sostiene':>10} {'P(sost)':>9}")
    linea('-')
    for nombre, c, fcac, viral, ads, _por_que in ESCALONES:
        if c is not None:
            contrib_acum = c
        if nombre.startswith("+ bebida"):
            # attach 25%→40%: +0.15 × (contribución de la bebida − el combo que arrastra)
            contrib_acum = contrib_acum + 0.15 * (4.177 - 1.0)
        runs = corridas(ads, viral, fcac=fcac, contrib=contrib_acum)
        med = mediana_mes(runs)
        ms = primer_mes_sostenido(med)
        p = p_sostiene_desde(runs, ms) if ms is not None else 0.0
        print(f"  {nombre:>32} {contrib_acum:>8.2f} {M.CAC_MEDIO*fcac:>7.2f} {viral:>6.2f} "
              f"{ads:>7,} {med[11]:>9,.0f} {med[23]:>9,.0f} {etq(ms):>10} {p*100:>8.1f}%")
    for nombre, *_r, por_que in ESCALONES:
        print(f"     {nombre:<34} {por_que}")

    # ── 4. LA META TRADUCIDA A OPERACIÓN ──────────────────────────────────────────────
    sep('4 · QUÉ SIGNIFICA S/5,000 EN PEDIDOS POR DÍA')
    print("""
  Esto no depende de ningún supuesto de marketing: es aritmética sobre la contribución y los
  costos fijos. Es el número que hay que mirar todos los días.
""")
    DIAS_MES = 26   # [DERIVADO] promedio de días operativos con lunes cerrado
    print(f"  {'contribución':>14} {'pauta S/0':>22} {'pauta S/3,000':>22} {'pauta S/6,000':>22}")
    print(f"  {'':>14} {'ped/mes   ped/día':>22} {'ped/mes   ped/día':>22} {'ped/mes   ped/día':>22}")
    linea('-')
    for c in (14.13, 16.0, 18.0, 20.0):
        fila = f"  {'S/%.2f' % c:>14}"
        for ads in (0, 3000, 6000):
            pm = pedidos_para(META, c, ads, DIAS_MES)
            fila += f" {pm:>13,.0f} {pm/DIAS_MES:>8.1f}"
        print(fila)
    cap = M.CAP_POR_PERSONA
    print(f"\n  ⚠ EL TECHO DE UNA PERSONA SOLA SON {cap} PEDIDOS/DÍA [MEDIDO: cocina por tandas,")
    print("     en servicio solo arma]. Por encima de eso hay que contratar, y cada persona")
    print(f"     nueva son S/{M.SUELDO:,.0f}/mes que salen del mismo neto — o sea que la meta sube sola.")

    # ── 5. LO QUE ESTE ANÁLISIS NO SABE ───────────────────────────────────────────────
    sep('5 · LO QUE ESTE ANÁLISIS NO SABE')
    print("""
  · EL CAC ES EL NÚMERO DEL QUE CUELGA TODO, y sale de blogs de agencia peruanos (CPM
    S/5-12, CTR 2.97%, CVR 1.89%), no de medición auditada. Medirlo la primera semana con
    el píxel no es una mejora del modelo: es lo único que convierte esto en un pronóstico.
  · La mezcla Signature / ARMA EL TUYO no está medida. Se asume mitad y mitad, y mover ese
    supuesto 15 puntos mueve la contribución casi un sol.
  · El attach de bebida (25%) tampoco está medido, y es de las palancas más baratas.
  · No hay estacionalidad peruana, ni fatiga creativa, ni competencia que reaccione.
  · No existe un solo dato público de una sandwichería o delivery en Trujillo.
  · ⚠ EL MODELO NO TIENE TECHO DE MERCADO. Compone referidos sin límite, así que por encima
    de ~0.4 referidos por pedido produce cifras imposibles (50,000 y hasta 683,000 clientes
    captados en dos años, en una ciudad de ~1M de habitantes). Esas filas están marcadas
    FUERA DE RANGO y no se deben leer como resultado: son el modelo componiendo sin freno.
    La conclusión que SÍ sobrevive es la dirección — la viralidad es la palanca más potente
    de las tres— no la magnitud.
""")
