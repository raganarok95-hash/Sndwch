# -*- coding: utf-8 -*-
"""
SND//WCH — Simulación a 3 meses para presentar a un inversionista (2026-09-30).

SIMULACIÓN, NO PRONÓSTICO: la tienda no ha abierto y no hay un solo pedido real. Cada supuesto
está escrito abajo con su estado (COTIZADO / ESTIMADO / SUPUESTO) para que el inversionista vea
qué es medido y qué no.

Parte de la carta vigente (modelo/carta.json, precios de hoy) y de los costos por sándwich de
modelo/rentabilidad_por_parte.py, con el cambio decidido por el dueño el 2026-09-30: los quesos y
vegetales pasan a ser los de Subway (americano y cheddar; lechuga, tomate, pepino, pimiento verde,
cebolla morada, aceituna, jalapeño, pepinillo).

Correr: python3 modelo/inversionista_3m.py  (imprime el informe en Markdown)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rentabilidad_por_parte as R

# ── CAMBIO DE QUESOS Y VEGETALES (dueño 2026-09-30) ──────────────────────────────────────────
# [ESTIMADO] queso americano / cheddar TAJADO ~S/52/kg en supermercado (Laive/Bonlé 200 g ≈ S/10–11).
# Sin cotización: el modelo anterior usaba S/35/kg. Porción 11 g (15CM) / 22 g (30CM).
R.QUESO = (0.011 * 52, 0.022 * 52)
# [ESTIMADO] el set de Subway suma encurtidos (pepinillo, jalapeño, aceituna ~S/20–25/kg) a lo
# fresco (~S/2.5–4.5/kg): el promedio ponderado sube de S/4.00 a S/5.00 por kg.
R.TOPS_KG = 5.00

# ── SUPUESTOS DE OPERACIÓN ───────────────────────────────────────────────────────────────────
DIAS_MES = 26                  # [HECHO] abre de martes a domingo (reglas.ts STORE_HOURS)
SAND_POR_PEDIDO = 1.15         # [SUPUESTO] sándwiches por pedido
MIX_SIG = 0.65                 # [SUPUESTO] 65% Signature / 35% ARMA EL TUYO (meta del negocio)
MIX15 = R.MIX15                # [HIPÓTESIS del dueño] 80% en 15CM
ATTACH = 0.30                  # [SUPUESTO] 30% de los pedidos lleva bebida
PAGO_TARJETA = 0.30            # [SUPUESTO] 30% paga con tarjeta (Yape por defecto)
RECOMPENSAS = 0.015            # [DERIVADO] puntos devuelven ~1.3–1.8% de lo gastado
FIJOS = 500                    # [HECHO del dueño] costos fijos mensuales
SUELDO = 1500                  # [HECHO del dueño] sueldo del dueño
PAUTA = (0, 300, 300)          # [SUPUESTO] sin anuncios al abrir; S/300/mes de prueba después
ESCENARIOS = {                 # [SUPUESTO] pedidos por día, meses 1–3; techo de cocina 40/día
    "Conservador": (5, 8, 11),
    "Base": (8, 12, 16),
    "Optimista": (12, 17, 22),
}

sigs = [s for s in R.SIG if not s.startswith("SIG05")]
def prom_sig(i):
    p = [R.SIG[s][6 + i] for s in sigs]; c = [R.costo_sig(s, i) for s in sigs]
    return sum(p) / len(p), sum(c) / len(c)
def prom_byo(i):
    ps = [p for p in R.BYO if p not in R.FUERA_DEL_ARMADOR]
    p = [R.BYO[x][i] + 0 for x in ps]; c = [R.costo_byo(x, i) for x in ps]
    return sum(p) / len(p), sum(c) / len(c)

def por_sandwich():
    precio = costo = 0.0
    for i, w in ((0, MIX15), (1, 1 - MIX15)):
        ps, cs = prom_sig(i); pb, cb = prom_byo(i)
        precio += w * (MIX_SIG * ps + (1 - MIX_SIG) * pb)
        costo += w * (MIX_SIG * cs + (1 - MIX_SIG) * cb)
    return precio, costo

bebidas = list(R.BEBIDA)
BEB_PRECIO = sum(R.BEBIDA[b][1] for b in bebidas) / len(bebidas)
BEB_COSTO = sum(R.costo_bebida(b) for b in bebidas) / len(bebidas)

def por_pedido():
    ps, cs = por_sandwich()
    venta = SAND_POR_PEDIDO * ps + ATTACH * (BEB_PRECIO - R.COMBO)
    costo = SAND_POR_PEDIDO * cs + ATTACH * BEB_COSTO
    comision = PAGO_TARJETA * R.CULQI * venta
    premios = RECOMPENSAS * venta
    return venta, costo, comision, premios, venta - costo - comision - premios

def S(x): return f"S/{x:,.0f}"

if __name__ == "__main__":
    venta, costo, com, prem, contrib = por_pedido()
    ps, cs = por_sandwich()
    print("# SND//WCH — Simulación de los primeros 3 meses\n")
    print("> **Simulación, no pronóstico.** La tienda aún no abre: no hay ventas reales. Los precios son los")
    print("> de la carta vigente; los costos, los del modelo de costos del negocio. Lo marcado [SUPUESTO] o")
    print("> [ESTIMADO] no está medido.\n")
    print("## Por pedido\n")
    print("| concepto | S/ |\n|---|---|")
    print(f"| Ticket de comida (sin envío; el envío va íntegro al motorizado) | {venta:.2f} |")
    print(f"| Insumos y empaque | −{costo:.2f} |")
    print(f"| Comisión de tarjeta | −{com:.2f} |")
    print(f"| Puntos y recompensas | −{prem:.2f} |")
    print(f"| **Contribución por pedido** | **{contrib:.2f}** ({contrib / venta:.0%} del ticket) |\n")
    print(f"Sándwich promedio: precio {ps:.2f}, costo {cs:.2f} ({cs / ps:.0%}).\n")
    equilibrio = (FIJOS + SUELDO) / (contrib * DIAS_MES)
    print(f"**Punto de equilibrio** (fijos + sueldo del dueño, sin pauta): **{equilibrio:.1f} pedidos al día**.\n")
    print("## Tres escenarios\n")
    for nombre, pd in ESCENARIOS.items():
        print(f"### {nombre}\n")
        print("| | Mes 1 | Mes 2 | Mes 3 | Total |\n|---|---|---|---|---|")
        filas = {"Pedidos al día": [], "Pedidos del mes": [], "Ventas": [], "Contribución": [],
                 "Fijos + sueldo": [], "Pauta": [], "Utilidad del mes": []}
        for m, d in enumerate(pd):
            n = d * DIAS_MES
            filas["Pedidos al día"].append(d); filas["Pedidos del mes"].append(n)
            filas["Ventas"].append(n * venta); filas["Contribución"].append(n * contrib)
            filas["Fijos + sueldo"].append(-(FIJOS + SUELDO)); filas["Pauta"].append(-PAUTA[m])
            filas["Utilidad del mes"].append(n * contrib - FIJOS - SUELDO - PAUTA[m])
        for k, v in filas.items():
            if k == "Pedidos al día":
                print(f"| {k} | " + " | ".join(str(x) for x in v) + " | — |")
            elif k == "Pedidos del mes":
                print(f"| {k} | " + " | ".join(f"{x:,}" for x in v) + f" | {sum(v):,} |")
            else:
                neg = k == "Utilidad del mes"
                print(f"| {'**'+k+'**' if neg else k} | " + " | ".join(S(x) for x in v) + f" | {'**'+S(sum(v))+'**' if neg else S(sum(v))} |")
        print()
    print("## Supuestos\n")
    print(f"- [HECHO] {DIAS_MES} días de atención al mes (martes a domingo); techo de cocina 40 pedidos/día.")
    print(f"- [HECHO del dueño] costos fijos {S(FIJOS)}/mes y sueldo del dueño {S(SUELDO)}/mes.")
    print(f"- [SUPUESTO] {SAND_POR_PEDIDO} sándwiches por pedido; {MIX_SIG:.0%} Signature; {MIX15:.0%} en 15CM; "
          f"{ATTACH:.0%} lleva bebida (con el combo de S/{R.COMBO:.0f}); {PAGO_TARJETA:.0%} paga con tarjeta.")
    print("- [SUPUESTO] pedidos por día de cada escenario; sin anuncios el primer mes y S/300/mes de prueba después.")
    print("- [ESTIMADO] quesos americano y cheddar a ~S/52/kg y vegetales al estilo Subway a ~S/5/kg promedio: sin cotizar.")
    print("- No incluye: inversión inicial ni su recuperación (dato del dueño), impuestos, ni el envío (pasa íntegro al motorizado).")
