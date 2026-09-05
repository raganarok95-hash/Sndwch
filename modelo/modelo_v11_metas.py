"""
SND//WCH — v11, COMPLEMENTO: ¿QUÉ TENDRÍA QUE PASAR PARA LLEGAR A LAS METAS?

El modelo v11 contesta "¿se llega?" y la respuesta es NO: la probabilidad de sostener
S/4,000 desde el mes 3 y S/5,000 desde el mes 6 es 0.0% en toda la rejilla de publicidad.

Un modelo que solo dice "no se puede" no sirve para decidir. Este archivo contesta las tres
preguntas que sí sirven:

  A. CUÁNDO se llega, si no es en el mes 3 y el mes 6. La meta puede estar bien y la FECHA
     mal — es exactamente lo que pasó con la apertura, que se movió de septiembre a octubre.
  B. CUÁNTO tendría que moverse CADA palanca, ella sola, para que la meta del mes 6 sea
     una moneda al aire (50%). Sirve para ver cuáles son alcanzables y cuáles son fantasía.
  C. QUÉ COMBINACIÓN realista de palancas lo consigue, porque ninguna sola alcanza.

REGLA: los números de entrada son los mismos del v11. Acá no se afloja ningún supuesto para
que el resultado se vea mejor — si algo se cambia, se dice cuál y por qué.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import modelo_v11 as M  # noqa: E402

VIRAL = 0.06
N = 4000


def traj(ads, viral=VIRAL, n=6000, **kw):
    """Mediana del neto mes a mes, y el primer mes que cruza cada meta."""
    runs = [M.corrida(ads, 0.0, viral, **kw) for _ in range(n)]
    med = [M.pct([r['netos'][m] for r in runs], 0.50) for m in range(M.HORIZONTE)]
    p10 = [M.pct([r['netos'][m] for r in runs], 0.10) for m in range(M.HORIZONTE)]
    p90 = [M.pct([r['netos'][m] for r in runs], 0.90) for m in range(M.HORIZONTE)]
    ped = [M.pct([r['pedidos'][m] for r in runs], 0.50) for m in range(M.HORIZONTE)]
    def primero(meta):
        for m, v in enumerate(med):
            if v >= meta:
                return m
        return None
    return med, p10, p90, ped, primero(M.META_M3), primero(M.META_M6), primero(0.0)


def p_m6(ads, viral=VIRAL, n=N, **kw):
    runs = [M.corrida(ads, 0.0, viral, **kw) for _ in range(n)]
    return sum(1 for r in runs if r['netos'][M.DESDE_M6] >= M.META_M6) / n


def barrido(nombre, valores, hacer, objetivo=0.50):
    """Recorre una palanca sola y devuelve dónde cruza el objetivo."""
    print(f"\n  {nombre}")
    print(f"    {'valor':>14} {'P(mes 6 >= meta)':>18}")
    cruce = None
    for v in valores:
        p = hacer(v)
        marca = ''
        if cruce is None and p >= objetivo:
            cruce, marca = v, '   <-- cruza 50%'
        print(f"    {v:>14} {p*100:>17.1f}%{marca}")
    return cruce


def _con_cac(cac_objetivo, fn):
    """Escala cac_meta para que el CAC medio sea el pedido, y restaura al salir."""
    orig = M.cac_meta
    f = cac_objetivo / M.CAC_MEDIO
    M.cac_meta = lambda cpm, _o=orig, _f=f: _o(cpm) * _f
    try:
        return fn()
    finally:
        M.cac_meta = orig


def sep(t=''):
    print('\n' + '=' * 100)
    if t:
        print(t.center(100)); print('=' * 100)


if __name__ == "__main__":
    sep('COMPLEMENTO v11 — QUE TENDRIA QUE PASAR PARA LLEGAR A LAS METAS')
    print(f"""
  Punto de partida (todo del v11, sin aflojar nada):
     contribucion por pedido ... S/{M.CONTRIB_PEDIDO:.2f}   (mitad de los pedidos por ARMA EL TUYO)
     CAC limpio (CPM medio) .... S/{M.CAC_MEDIO:.2f}
     LTV / CAC ................. ~2.2   <- la unidad economica FUNCIONA; el problema es el plazo
     metas ..................... S/{M.META_M3:,.0f} desde el mes 3 ({M.ETIQ[M.DESDE_M3]}), S/{M.META_M6:,.0f} desde el mes 6 ({M.ETIQ[M.DESDE_M6]})
""")

    sep('A · CUANDO SE LLEGA, SI NO ES EN EL MES 3 Y EL MES 6')
    print("""
  Al mejor presupuesto que encontro el v11 (S/8,000/mes por neto del mes 6). Mediana y banda
  P10-P90 del neto mensual. La pregunta no es "se llega" sino "cuando".
""")
    for ads in (4000, 6000, 8000):
        med, p10, p90, ped, f3, f6, f0 = traj(float(ads))
        print(f"\n  ── publicidad S/{ads:,}/mes " + "─" * 60)
        print(f"    {'mes':>8} " + ''.join(f"{e:>9}" for e in M.ETIQ))
        print(f"    {'neto P50':>8} " + ''.join(f"{v:>9,.0f}" for v in med))
        print(f"    {'ped/dia':>8} " + ''.join(f"{v/d:>9,.1f}" for v, d in zip(ped, M.DIAS)))
        eq = M.ETIQ[f0] if f0 is not None else 'nunca en 12 meses'
        e3 = M.ETIQ[f3] if f3 is not None else 'nunca en 12 meses'
        e6 = M.ETIQ[f6] if f6 is not None else 'nunca en 12 meses'
        print(f"    equilibrio (neto >= 0) .... {eq}")
        print(f"    primer mes con S/{M.META_M3:,.0f} ...... {e3}")
        print(f"    primer mes con S/{M.META_M6:,.0f} ...... {e6}")

    sep('B · CUANTO TENDRIA QUE MOVERSE CADA PALANCA, ELLA SOLA')
    print("""
  Para que la meta del mes 6 (neto >= S/5,000) sea una moneda al aire. Se mueve UNA cosa y
  todo lo demas queda igual. Sirve para separar lo alcanzable de la fantasia.
""")
    barrido("CONTRIBUCION POR PEDIDO (subir precios o mejorar la mezcla)",
            [f"S/{c:.2f}" for c in (14.11, 16, 18, 20, 24, 28, 34)],
            lambda v: p_m6(6000.0, contrib=float(v[2:])))

    barrido("CAC (mejor creativo, mejor segmentacion, menor CPM)",
            [f"S/{c:.2f}" for c in (17.87, 14, 11, 8, 6, 4, 3)],
            lambda v: _con_cac(float(v[2:]), lambda: p_m6(6000.0)))

    barrido("VIRALIDAD (referidos por cada 100 pedidos servidos)",
            [0.06, 0.15, 0.25, 0.40, 0.60, 0.90],
            lambda v: p_m6(6000.0, viral=v))

    barrido("PUBLICIDAD AL MES",
            [2000, 4000, 6000, 8000, 12000, 20000],
            lambda v: p_m6(float(v)))

    sep('C · UNA COMBINACION REALISTA')
    print("""
  Ninguna palanca sola llega a 50% dentro de lo alcanzable. Aca se combinan las tres que SI
  se pueden mover sin inventar nada, y se mide el resultado junto.
""")
    COMBOS = [
        ("hoy", M.CONTRIB_PEDIDO, 1.00, 0.06, 6000),
        ("+ mezcla 65% Signature", M._contrib_menu("actual", 0.35), 1.00, 0.06, 6000),
        ("+ CAC un 30% mejor", M._contrib_menu("actual", 0.35), 0.70, 0.06, 6000),
        ("+ viralidad 25/100", M._contrib_menu("actual", 0.35), 0.70, 0.25, 6000),
        ("+ viralidad 40/100", M._contrib_menu("actual", 0.35), 0.70, 0.40, 6000),
        ("+ contribucion S/18", 18.0, 0.70, 0.40, 6000),
    ]
    print(f"  {'escenario':>26} {'contrib':>9} {'CAC':>8} {'viral':>7} {'ads':>8} "
          f"{'neto m6 P50':>12} {'P(mes6)':>9} {'P(camino)':>10}")
    print('  ' + '-' * 96)
    for nombre, c, fcac, v, ads in COMBOS:
        _orig = M.cac_meta
        M.cac_meta = lambda cpm, _o=_orig, f=fcac: _o(cpm) * f
        runs = [M.corrida(float(ads), 0.0, v, contrib=c) for _ in range(N)]
        M.cac_meta = _orig
        m6 = M.pct([r['netos'][M.DESDE_M6] for r in runs], 0.50)
        pm6 = sum(1 for r in runs if r['netos'][M.DESDE_M6] >= M.META_M6) / N
        pc = sum(1 for r in runs if M.cumple_camino(r['netos'])) / N
        print(f"  {nombre:>26} {c:>9.2f} {M.CAC_MEDIO*fcac:>8.2f} {v:>7.2f} {ads:>8,} "
              f"{m6:>12,.0f} {pm6*100:>8.1f}% {pc*100:>9.1f}%")
