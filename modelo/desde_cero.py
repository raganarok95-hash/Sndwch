# -*- coding: utf-8 -*-
"""
SND//WCH — MODELO DESDE CERO (2026-11-02)

Dueño: «Me gustaría que no te bases en lo ya existente sino que generes desde cero el modelo para
evitar vicios antiguos».

REGLAS DE ESTE ARCHIVO
- No importa NINGÚN modelo anterior (proyeccion, meta_6000, modelo_vXX). Es autónomo.
- Solo se conserva lo que el dueño MIDIÓ o COTIZÓ, o lo que dice la base: precios
  (catalog_items, revisado el 2026-11-02), el costo de cada sándwich armado con sus cotizaciones
  (pan S/2, empaque S/2.50 por pedido, proteínas con merma) y la botella de 500 ml.
- Todo lo demás (clientes nuevos, vuelta, costo por cliente) se re-investigó hoy y entra como
  RANGO, no como número: cada corrida sortea un valor dentro del rango. Si no hay dato, el rango
  es ancho y se dice [SIN DATO].
- Unidad: mes de 30 días desde la apertura (mes 1 = 20-nov a 19-dic). Abre 6 días a la semana.

Uso: python3 modelo/desde_cero.py [corridas]
"""
import sys
import random
import statistics as st

N = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
random.seed(20261120)
DIAS_ABIERTO = 26          # 6 días a la semana (lunes cerrado)
META = 5000.0

# ─── 1. LO MEDIDO (no se sortea) ──────────────────────────────────────────────────────────────
# Precio de la base (catalog_items, 2026-11-02): las 6 Signatures a S/19.90 (15CM) y S/30.90 (30CM).
P15, P30 = 19.90, 30.90
# Costo de cada Signature con las cotizaciones del dueño (incluye pan, proteína con merma, vegetales,
# salsa, queso y el empaque del pedido S/2.50). 15CM / 30CM.
COSTO = {
    "PHILLY CHEESESTEAK": (7.74, 12.97), "MEATBALL MARINARA": (7.96, 13.43),
    "TURKEY": (7.79, 13.08), "TUNA MELT": (7.65, 12.80),
    "ITALIAN HOAGIE": (9.42, 16.35), "CLASSIC TUNA": (6.75, 11.00),
}
C15 = sum(c[0] for c in COSTO.values()) / len(COSTO)
C30 = sum(c[1] for c in COSTO.values()) / len(COSTO)
# Bebida en botella de 500 ml (dueño, 2026-11-02): precio medio S/5.67; costo ~S/1.49 lleno
# (botella S/0.69 cotizada + ~S/0.80 de infusión a 500 ml). Combo: −S/1 por par.
P_BEB, C_BEB, COMBO = 5.67, 1.49, 1.00
SOBREPRECIO_APPS = 0.10    # decisión del dueño: en Rappi y PedidosYa la carta va 10% más cara
CULQI = 0.055              # comisión de tarjeta (Culqi), solo en la web
PUNTOS = 0.015             # los puntos de la web devuelven ~1.5% de lo gastado (recompensas de la carta)
FIJOS = 500.0              # dato del dueño: opera desde casa (gas, internet, varios)
PAN_ENVIO = 65.0           # S/15 por envío del pan, una vez por semana

# ─── 2. LO QUE SE SORTEA (rango bajo, probable, alto; distribución triangular) ────────────────
R = {
    # Mezcla del pedido [SIN DATO propio; rangos amplios]
    "pct_30cm":     (0.10, 0.20, 0.35),   # pedidos con 30CM
    "pct_bebida":   (0.15, 0.30, 0.45),   # pedidos con bebida
    "sand_x_ped":   (1.00, 1.15, 1.35),   # sándwiches por pedido (algunos piden para dos)
    "pct_tarjeta":  (0.20, 0.35, 0.50),   # el resto paga con Yape (sin comisión)
    "pct_apps":     (0.40, 0.60, 0.80),   # parte de los pedidos que llega por Rappi/PedidosYa al inicio
    "comision_app": (0.22, 0.27, 0.30),   # comisión de las apps sobre el precio de app
    # CLIENTES NUEVOS por día SIN publicidad pagada [SIN DATO: tienda nueva en Trujillo].
    # Contexto: 2.1 millones de usuarios activos de apps de reparto en el Perú y 3 de cada 4 servicios
    # en Lima (IPE vía Gestión, 2025); el ticket medio fuera de Lima es ~S/15 (Rappi vía Gestión,
    # 2023): SND//WCH, a ~S/24, es para una minoría. Por eso el rango es bajo y ancho.
    "nuevos_dia_m1": (0.8, 2.0, 4.0),     # mes 1 (tienda nueva, sin reseñas)
    "crec_mes":      (1.00, 1.25, 1.60),  # cuánto crece ese flujo cada mes (reseñas, boca a boca)
    # VUELTA: Bloom Intelligence (EE. UU., 2025, su plataforma): 25% de los que prueban vuelve en
    # 90 días (cohortes maduras 25–30%), y 40–45% de esas vueltas pasa en los primeros 30 días.
    # El delivery tiene más fricción baja que la mesa: se deja el tope en 40%.
    "vuelve_90":     (0.18, 0.27, 0.40),
    # Un cliente que ya volvió pide 1.23 veces al mes (Bloom, 2025) y se va una parte cada mes.
    "ped_mes_fiel":  (0.9, 1.23, 1.6),
    "fuga_mes":      (0.15, 0.25, 0.35),
}
# Costo por cliente con Meta, recalculado: CPM × 1000 / (CTR × conversión).
# CPM: S/18 en Lima (andreybusiness, 2025); Trujillo suele ser más barato → S/10–20.
# CTR 1–2.1% y conversión 1–2.5% (ContentStudio 2026, alimentos y bebidas: 2.1% y ~2%).
R_META = {"cpm": (10.0, 15.0, 20.0), "ctr": (0.010, 0.016, 0.021), "cvr": (0.010, 0.017, 0.025)}


def tri(t):
    lo, mo, hi = t
    return random.triangular(lo, hi, mo)


def impuesto(ventas, compras, util):
    """Nuevo RUS hasta S/8,000 de ventas al mes (cuota S/20 o S/50). Por encima, Régimen MYPE:
    IGV de restaurante MYPE 10.5% en 2026 y 15% en 2027 (Ley 31556 y prórrogas; confirmar con el
    contador), crédito por compras con factura (~80%), renta 10% y contador S/200."""
    if ventas <= 8000:
        return 20.0 if ventas <= 5000 else 50.0
    tasa = 0.105
    igv = max(0.0, tasa / (1 + tasa) * ventas - 0.18 / 1.18 * 0.8 * compras)
    return igv + 0.10 * max(0.0, util - igv) + 200.0


def corrida(meta_mes=0.0, embaj_mes=0, rappi_ads=0.0):
    x = {k: tri(v) for k, v in R.items()}
    cac_meta = tri(R_META["cpm"]) / (1000 * tri(R_META["ctr"]) * tri(R_META["cvr"]))
    # Ticket y costo de UN pedido
    sand = x["sand_x_ped"]
    p_s = (1 - x["pct_30cm"]) * P15 + x["pct_30cm"] * P30
    c_s = (1 - x["pct_30cm"]) * C15 + x["pct_30cm"] * C30
    ticket = sand * p_s + x["pct_bebida"] * (P_BEB - COMBO)
    costo = sand * c_s - (sand - 1) * 2.50 + x["pct_bebida"] * C_BEB   # el empaque (S/2.50) va una vez por pedido
    activos, meses = 0.0, []
    for m in range(3):
        nuevos = x["nuevos_dia_m1"] * x["crec_mes"] ** m * DIAS_ABIERTO
        nuevos += (meta_mes / cac_meta if m >= 1 else 0.0)        # Meta desde el mes 2, tras la prueba
        nuevos += embaj_mes * (min(m, 2) / 2)                      # embajadores: arrancan de a poco
        nuevos += rappi_ads / 25.0 if rappi_ads else 0.0          # [SIN DATO] ~S/25 por cliente
        # Los que vuelven este mes: los nuevos de este mes (45% de su vuelta cae en 30 días) y la base fiel
        vuelven = nuevos * x["vuelve_90"] * 0.45
        ped = nuevos + activos * x["ped_mes_fiel"] + vuelven
        activos = activos * (1 - x["fuga_mes"]) + nuevos * x["vuelve_90"]
        apps = x["pct_apps"] * (0.9 ** m)                          # cada mes, más pedidos por la web
        rappi_desc = 0.30 if m == 0 else 0.0                       # Rappi: 30% de descuento obligatorio el mes 1
        com = x["comision_app"] if m > 0 else x["comision_app"] / 2  # mes 1: Rappi 0%, PedidosYa normal
        t_app = ticket * (1 + SOBREPRECIO_APPS) * (1 - rappi_desc / 2)
        deja_web = ticket - costo - x["pct_tarjeta"] * CULQI * ticket - PUNTOS * ticket
        deja_app = t_app - costo - com * t_app
        ventas = ped * ((1 - apps) * ticket + apps * t_app)
        contrib = ped * ((1 - apps) * deja_web + apps * deja_app)
        gasto_pub = meta_mes * (m >= 1) + embaj_mes * (min(m, 2) / 2) * 8.0 + rappi_ads + (700 if meta_mes and m == 0 else 0)
        util = contrib - FIJOS - PAN_ENVIO - gasto_pub
        liquido = util - impuesto(ventas, ped * costo, util)
        meses.append(dict(liquido=liquido, ped_dia=ped / DIAS_ABIERTO, ventas=ventas, nuevos=nuevos,
                          deja_web=deja_web, deja_app=deja_app, ticket=ticket))
    return meses, cac_meta


def resumen(nombre, **kw):
    runs = [corrida(**kw) for _ in range(N)]
    print(nombre)
    for m in range(3):
        liq = sorted(r[0][m]["liquido"] for r in runs)
        ped = st.median(r[0][m]["ped_dia"] for r in runs)
        ven = st.median(r[0][m]["ventas"] for r in runs)
        p = sum(1 for v in liq if v >= META) / N
        print(f"  mes {m+1}: líquido p10 {liq[N//10]:>7,.0f} · mediana {liq[N//2]:>7,.0f} · p90 {liq[9*N//10]:>7,.0f}"
              f" · {ped:4.1f} pedidos/día · ventas {ven:>7,.0f} · llega a 5,000: {p:.0%}")
    return runs


if __name__ == "__main__":
    print(f"MODELO DESDE CERO · {N} corridas · mes = 30 días desde el 20-nov\n")
    base = resumen("A. Solo la app y las apps, sin publicidad")
    m0 = [r[0][0] for r in base]
    print(f"  un pedido: ticket {st.median(x['ticket'] for x in m0):.2f} · deja web {st.median(x['deja_web'] for x in m0):.2f}"
          f" · deja app (desde el mes 2) {st.median(r[0][1]['deja_app'] for r in base):.2f}")
    cac = sorted(r[1] for r in base)
    print(f"  costo por cliente con Meta recalculado: p10 {cac[N//10]:.0f} · mediana {cac[N//2]:.0f} · p90 {cac[9*N//10]:.0f}\n")
    resumen("B. A + embajadores (30 clientes nuevos al mes cuando están andando, S/8 c/u)", embaj_mes=30)
    resumen("C. B + anuncios dentro de Rappi/PedidosYa (S/300 al mes)", embaj_mes=30, rappi_ads=300)
    resumen("D. C + Meta S/1,500 al mes desde el mes 2 (prueba de S/700 en el mes 1)", embaj_mes=30, rappi_ads=300, meta_mes=1500)
    # ¿Cuántos clientes nuevos al día hacen falta para 5,000 en el mes 3?
    print("\n¿Cuántos clientes nuevos al día (mes 1) hacen falta para que la MEDIANA del mes 3 llegue a 5,000, sin publicidad?")
    orig = R["nuevos_dia_m1"]
    for n in (3, 5, 7, 9, 11, 13):
        R["nuevos_dia_m1"] = (n * 0.8, n, n * 1.2)
        rr = [corrida()[0][2] for _ in range(1500)]
        liq = sorted(r["liquido"] for r in rr)
        print(f"  {n:>2} nuevos/día en el mes 1 → mes 3 mediana {liq[750]:>7,.0f} · {st.median(r['ped_dia'] for r in rr):.1f} pedidos/día · ventas {st.median(r['ventas'] for r in rr):,.0f}")
    R["nuevos_dia_m1"] = orig
