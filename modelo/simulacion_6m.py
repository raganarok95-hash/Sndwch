# -*- coding: utf-8 -*-
"""
SND//WCH — SIMULACIÓN DE GANANCIAS, OCTUBRE 2026 A MARZO 2027 (2026-10-09)

Pedido del dueño: «Hazme una simulación de ganancias, analiza qué nos frena, cómo atacar eso y
mejorarlo en cada aspecto. Proyección de ganancia en los próximos 6 meses, cada mes, por qué y
cómo corregirlo».

ES UNA SIMULACIÓN, NO UN PRONÓSTICO: todavía no hay un solo pedido real. El motor es
`modelo_v14.corrida` (Montecarlo: CPM, CTR, CVR, frecuencia de recompra y ruido mensual al
azar en cada corrida). Lo nuevo de este archivo:

  1. LO QUE DEJA UN PEDIDO, recalculado con la CARTA VIGENTE (v4: seis Signatures) y los precios
     de la base al 2026-10-09. modelo_v14 lo sacaba de `comparativa_menu` (la carta de
     septiembre, con SIG01-SIG06), que ya no existe.
  2. EL PLAN DE PAUTA REAL: los S/350 aprobados, después de 14 días sin pauta (NEGOCIO.md: la
     línea base orgánica se mide una sola vez). La apertura pasó al 20, así que la pauta pasa al
     3 de noviembre.
  3. Escenarios que SUMAN una palanca a la vez, y lo que mueve cada palanca SOLA.

Uso: python3 modelo/simulacion_6m.py            (informe en texto)
     python3 modelo/simulacion_6m.py --json     (los números, para el gráfico)
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import modelo_v14 as M                      # noqa: E402
import rentabilidad_por_parte as R          # noqa: E402  costos vigentes (insumos.py)
import comparativa_menu as C                # noqa: E402  bebidas, combo y tarjeta

N = 4000
MESES = 6

# ══════════════════════════════════════════════════════════════════
# 1 · LO QUE DEJA UN PEDIDO, CON LA CARTA DE HOY
# ══════════════════════════════════════════════════════════════════
# [MEDIDO en la base, 2026-10-09] Signatures: catalog_items (verificado por «Estado para abrir»);
# ARMA EL TUYO: catalog_prices (P04 atún, P06 albóndiga, P08 pavo, P09 res laminada).
# Receta: docs/hechos/CARTA.md. Vegetales en gramos y su precio por kilo.
CEB, PIM = 3.00, 4.50                       # [ESTIMADO] cebolla y pimiento a granel (insumos.py)
SIGNATURES = {
    # nombre: (proteína, precio15, precio30, salsas, queso, vegetales [(g, S/kg)])
    "Philly Cheesesteak": ("P09", 22.90, 33.90, 0, "cheddar", [(70, CEB), (20, PIM)]),
    "Meatball Marinara":  ("P06", 21.90, 32.90, 1, "americano", [(45, R.TOPS_KG)]),
    "Turkey":             ("P08", 23.90, 34.90, 1, None, [(73, R.TOPS_KG)]),
    "Tuna Melt":          ("P04", 22.90, 33.90, 0, "cheddar", []),
    "Italian Hoagie":     ("P05", 23.90, 34.90, 1, "americano", [(73, R.TOPS_KG)]),
    "Classic Tuna":       ("P04", 20.90, 31.90, 0, None, []),
}
ARMADOR = {"P04": (22.90, 33.90), "P06": (21.90, 32.90), "P08": (23.90, 34.90), "P09": (22.90, 33.90)}
QUESO = {"cheddar": R.QUESO_POR["C02"], "americano": R.QUESO_AMER}
SALSAS_ARMADOR, QUESO_ARMADOR, VEG_ARMADOR = 2, 0.60, 73   # [MÉTODO] el cliente medio
TARJETA = 0.30                  # [MÉTODO] 30% paga con tarjeta (comisión C.CULQI); el resto, Yape
RECOMPENSAS = 0.014             # [DERIVADO] docs/hechos: todas devuelven ~1.3–1.5% de lo gastado


def costo(prot, i, salsas, queso, vegetales):
    c = R.PROT[prot][i] + R.PAN["B01"][i] + R.EMPAQUE + R.SALSA[i] * salsas
    c += sum((g if i == 0 else 2 * g) / 1000 * kg for g, kg in vegetales)
    if queso:
        c += QUESO[queso][i] if isinstance(queso, str) else queso
    return c


def por_sandwich(mix15):
    """(precio medio, margen medio) de un Signature y de un ARMA EL TUYO, con la mezcla de tamaños."""
    def mezcla(p15, p30, c15, c30):
        return mix15 * p15 + (1 - mix15) * p30, mix15 * (p15 - c15) + (1 - mix15) * (p30 - c30)
    sig = [mezcla(p15, p30, costo(pr, 0, s, q, v), costo(pr, 1, s, q, v))
           for pr, p15, p30, s, q, v in SIGNATURES.values()]
    queso_medio = [QUESO_ARMADOR * (QUESO["cheddar"][i] + QUESO["americano"][i]) / 2 for i in (0, 1)]
    arm = [mezcla(p15, p30,
                  costo(pr, 0, SALSAS_ARMADOR, queso_medio[0], [(VEG_ARMADOR, R.TOPS_KG)]),
                  costo(pr, 1, SALSAS_ARMADOR, queso_medio[1], [(VEG_ARMADOR, R.TOPS_KG)]))
           for pr, (p15, p30) in ARMADOR.items()]
    prom = lambda xs, k: sum(x[k] for x in xs) / len(xs)
    return (prom(sig, 0), prom(sig, 1)), (prom(arm, 0), prom(arm, 1))


def pedido(frac_armador=0.50, mix15=C.MIX15, bebida=C.DRINK_ATTACH, sand_por_pedido=1.0):
    """Ticket (sin el envío, que pasa directo al motorizado) y lo que deja UN pedido.

    El empaque C.EMP/R.EMPAQUE (S/1.30) es por sándwich y ya incluye la bolsa: conservador."""
    (ps, ms), (pa, ma) = por_sandwich(mix15)
    precio = (1 - frac_armador) * ps + frac_armador * pa
    margen = (1 - frac_armador) * ms + frac_armador * ma
    precio_bebida = sum(C.DRINK_PRICES) / len(C.DRINK_PRICES)
    ticket = sand_por_pedido * precio + bebida * (precio_bebida - C.COMBO_DISCOUNT)
    deja = (sand_por_pedido * margen + bebida * (C.DRINK_CONTRIB - C.COMBO_DISCOUNT)
            - TARJETA * C.CULQI * ticket - RECOMPENSAS * ticket)
    return round(ticket, 2), round(deja, 2)


TICKET, DEJA = pedido()

# ══════════════════════════════════════════════════════════════════
# 2 · LOS ESCENARIOS
# ══════════════════════════════════════════════════════════════════
# Cada palanca, con su número y de dónde sale. Todas son SUPUESTOS hasta que haya pedidos.
BASE = dict(
    organico_dia=1.0,     # [SUPUESTO] clientes nuevos/día sin pauta ni referido: boca a boca e
                          # Instagram a mano. PREDICCION_V14 sumaba +2/día por Google y QR.
    viral=0.06,           # [SUPUESTO] 6 referidos por cada 100 pedidos (lo que asumía el modelo)
    cohorte=0.0,          # clientes de tu red que piden el primer mes
    plan_ads=[0, 350],    # [DECISIÓN del dueño] S/350, desde el 3 de noviembre
    reinversion=0.0,
    deja=DEJA,
    p_segundo=M.P_SEGUNDO,  # [FUENTE] 45% de los clientes nuevos vuelve a pedir (Genesys)
)
RED_AVISADA, RED_PIDE = 300, 0.30   # [SUPUESTO] P0a: 300 avisados; 30% pide (PREDICCION asumía 100%)

PALANCAS = [
    ("Abrir y nada más", {}),
    ("+ avisar a 300 de tu red (30% pide)", dict(cohorte=RED_AVISADA * RED_PIDE)),
    ("+ Google Business, QR en la bolsa e Instagram diario (3 nuevos/día)", dict(organico_dia=3.0)),
    ("+ referidos: 25 por cada 100 pedidos", dict(viral=0.25)),
    ("+ ticket: bebida en 40% y 30CM en 30%", dict(deja=pedido(mix15=0.70, bebida=0.40)[1])),
    ("+ que vuelva a pedir el 55% (no el 45%)", dict(p_segundo=0.55)),
    ("+ reinvertir 35% de la ganancia en pauta", dict(reinversion=0.35)),
]


def correr(p, n=N, semilla=20261009):
    random.seed(semilla)
    # La recompra cambia la cadena de supervivencia: se recalculan los perfiles del modelo.
    guardado = (M.P_SEGUNDO, M.PERFILES, M.PEDIDOS_POR_CLIENTE)
    M.P_SEGUNDO = p["p_segundo"]
    M.PERFILES = [M.perfil_pedidos(g) for g in M.BRECHA_GRID]
    M.PEDIDOS_POR_CLIENTE = M.pedidos_por_cliente()
    try:
        runs = [M.corrida(0.0, 1, p["reinversion"], p["viral"], p["organico_dia"],
                          cpm_rango=M.CPM_ESCENARIOS['union de ambos (S/5-45)'],
                          factor_confianza=0.75, contrib=p["deja"] + M.OVERHEAD_PEDIDO,
                          cohorte_lanzamiento=p["cohorte"], decaimiento_organico=0.97,
                          plan_ads=p["plan_ads"], forzar_plan=True) for _ in range(n)]
    finally:
        M.P_SEGUNDO, M.PERFILES, M.PEDIDOS_POR_CLIENTE = guardado
    meses = []
    for m in range(MESES):
        netos = [r["netos"][m] for r in runs]
        ped = [r["pedidos"][m] / M.DIAS[m] for r in runs]
        meses.append(dict(mes=M.ETIQ[m], dias=M.DIAS[m],
                          p10=M.pct(netos, 0.10), p50=M.pct(netos, 0.50), p90=M.pct(netos, 0.90),
                          pedidos_dia=M.pct(ped, 0.50),
                          ventas=M.pct([r["pedidos"][m] * TICKET for r in runs], 0.50),
                          pauta=M.pct([r["ads"][m] for r in runs], 0.50),
                          pauta_gasta=sum(1 for r in runs if r["ads"][m] > 0) / len(runs),
                          personas=M.pct([r["personas"][m] for r in runs], 0.50)))
    total = [sum(r["netos"][:MESES]) for r in runs]
    return dict(meses=meses, total_p10=M.pct(total, 0.10), total_p50=M.pct(total, 0.50),
                total_p90=M.pct(total, 0.90),
                pozo=M.pct([min(r["caja"][:MESES]) for r in runs], 0.10))


def acumulado():
    """Cada escenario suma su palanca a las anteriores."""
    p, out = dict(BASE), []
    for nombre, cambio in PALANCAS:
        p.update(cambio)
        out.append((nombre, correr(p)))
    return out


def solas():
    """Cada palanca SOLA sobre «abrir y nada más»: cuánto mueve los 6 meses por sí misma."""
    base = correr(BASE)["total_p50"]
    out = []
    for nombre, cambio in PALANCAS[1:]:
        q = dict(BASE); q.update(cambio)
        out.append((nombre.lstrip("+ "), correr(q)["total_p50"] - base))
    return sorted(out, key=lambda x: -x[1])


def quitando():
    """Lo que pierdes en 6 meses si QUITAS una palanca del plan completo. Las palancas se
    multiplican entre sí (más clientes × más recompra × más margen), así que medida sola sobre
    un negocio chico una palanca parece menor de lo que vale dentro del plan."""
    completo = dict(BASE)
    for _, cambio in PALANCAS[1:]:
        completo.update(cambio)
    total = correr(completo)["total_p50"]
    out = []
    for nombre, cambio in PALANCAS[1:]:
        q = dict(completo)
        for k in cambio:
            q[k] = BASE[k]
        out.append((nombre.lstrip("+ "), total - correr(q)["total_p50"]))
    return sorted(out, key=lambda x: -x[1])


def pauta(monto=350.0, mes=1, n=N, semilla=20261009):
    """Cuánto cuesta un cliente por Meta el mes de la prueba (con la cuenta «en frío») y cuántos
    compran `monto`, con cada rango de CPM. El techo es lo que deja un cliente en toda su vida."""
    random.seed(semilla)
    frio = M.COLD_MULT - (M.COLD_MULT - 1.0) * mes / M.COLD_MESES
    techo = M.PEDIDOS_POR_CLIENTE * DEJA * 0.75
    out = {}
    for nombre, rango in M.CPM_ESCENARIOS.items():
        cacs = [M.cac(random.uniform(*rango), random.uniform(M.CTR_MIN, M.CTR_MAX),
                      random.uniform(M.CVR_MIN, M.CVR_MAX)) * frio for _ in range(n)]
        out[nombre] = dict(cac_p50=M.pct(cacs, 0.5), cac_p10=M.pct(cacs, 0.1), cac_p90=M.pct(cacs, 0.9),
                           clientes_p50=monto / (M.pct(cacs, 0.5) * M.PENAL_APRENDIZAJE),
                           paga=sum(1 for c in cacs if c <= techo) / n, techo=techo)
    return out


def equilibrio(meta, deja=DEJA, dias=26):
    """Pedidos por día para que te queden `meta` soles al mes, sin contratar a nadie."""
    return (meta + M.FIJOS_MES) / ((deja) * dias)


if __name__ == "__main__":
    esc = acumulado()
    sol = solas()
    qui = quitando()
    if "--json" in sys.argv:
        print(json.dumps(dict(ticket=TICKET, deja=DEJA, escenarios=esc, solas=sol, quitando=qui, pauta=pauta(),
                              equilibrio={m: round(equilibrio(m), 1) for m in (0, 1500, 3000, 5000)}),
                         ensure_ascii=False))
        sys.exit(0)
    (ps, ms), (pa, ma) = por_sandwich(C.MIX15)
    print(f"Lo que deja un pedido con la carta de hoy: ticket S/{TICKET:.2f}, deja S/{DEJA:.2f}")
    print(f"  Signature: cobra S/{ps:.2f}, deja S/{ms:.2f} · Arma el tuyo: cobra S/{pa:.2f}, deja S/{ma:.2f}")
    print(f"  (modelo_v14 usaba S/{M.CONTRIB_PEDIDO - M.OVERHEAD_PEDIDO:.2f}, de la carta de septiembre)")
    for meta in (0, 1500, 3000, 5000):
        print(f"  pedidos/día para llevarte S/{meta:,}: {equilibrio(meta):.1f}")
    for nombre, r in esc:
        print(f"\n{nombre}")
        for x in r["meses"]:
            print(f"  {x['mes']}  {x['pedidos_dia']:5.1f} ped/día  ventas S/{x['ventas']:7,.0f}  "
                  f"pauta S/{x['pauta']:5,.0f} ({x['pauta_gasta']:.0%})  ganancia S/{x['p50']:7,.0f}  (S/{x['p10']:,.0f} a S/{x['p90']:,.0f})")
        print(f"  6 meses: S/{r['total_p50']:,.0f} (S/{r['total_p10']:,.0f} a S/{r['total_p90']:,.0f}) · "
              f"caja mínima en el caso malo: S/{r['pozo']:,.0f}")
    print("\nCada palanca sola, sobre «abrir y nada más» (ganancia de 6 meses, mediana):")
    for nombre, d in sol:
        print(f"  +S/{d:7,.0f}  {nombre}")
    print("\nLa prueba de S/350 en noviembre, según cuánto cobre Meta por mil vistas (CPM):")
    for nombre, x in pauta().items():
        print(f"  {nombre}: un cliente cuesta S/{x['cac_p50']:.0f} (S/{x['cac_p10']:.0f} a S/{x['cac_p90']:.0f}); "
              f"S/350 compran ~{x['clientes_p50']:.0f}; paga (CAC <= S/{x['techo']:.0f}) en {x['paga']:.0%}")
    print("\nLo que pierdes si la quitas del plan completo (ganancia de 6 meses, mediana):")
    for nombre, d in qui:
        print(f"  -S/{d:7,.0f}  {nombre}")
