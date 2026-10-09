# -*- coding: utf-8 -*-
"""
SND//WCH — PROYECCIÓN DE OCTUBRE 2026 A MARZO 2027, HECHA DESDE CERO (2026-10-09)

Dueño: «Agrega Rappi y PedidosYa, pero mejor no te bases en modelos viejos: hazlo bien el
modelo». Y sobre la red: «Les informaré a mis conocidos, que probablemente sean 30, y
ninguno compre».

Nada de esto hereda de modelo_v7…v14. Solo se reutilizan los PRECIOS DE INSUMOS
(`insumos.py`, la regla del repo: todo costo sale de su ficha) y el costo de las bebidas
(`costo_bebidas.py`). Es una SIMULACIÓN: no hay un solo pedido real.

CÓMO FUNCIONA
  · Día por día, del martes 20 de octubre al 31 de marzo; los lunes no se atiende.
  · Cuatro fuentes de clientes nuevos: el canal propio (Google, Instagram, boca a boca),
    Rappi, PedidosYa y la prueba de Meta. Más los referidos, que salen de los pedidos propios.
  · Cada cliente vuelve con probabilidades encadenadas (2.º pedido, 3.º, los siguientes) y
    con un intervalo entre pedidos al azar. Una parte de los clientes de las apps pasa al
    canal propio por el QR de la bolsa.
  · Cada corrida sortea TODOS los supuestos dentro de su rango (la incertidumbre de verdad
    está en los supuestos, no en el día a día). 2,000 corridas.
  · Costos de la carta vigente, comisión de cada canal, impuestos (Nuevo RUS hasta S/8,000
    al mes; arriba, Régimen MYPE con IGV) y la capacidad de la cocina.

Uso: python3 modelo/proyeccion.py [--json]
"""
import contextlib
import io
import json
import os
import sys
from datetime import date, timedelta

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import insumos as I                                  # noqa: E402
with contextlib.redirect_stdout(io.StringIO()):
    import costo_bebidas as CB                       # noqa: E402  (imprime su tabla al importar)

CORRIDAS = 2000
INICIO, FIN = date(2026, 10, 20), date(2027, 3, 31)
DIAS = [INICIO + timedelta(days=i) for i in range((FIN - INICIO).days + 1)]
T = len(DIAS)
ABIERTO = np.array([d.weekday() != 0 for d in DIAS])          # [MEDIDO] lunes cerrado
MESES = sorted({(d.year, d.month) for d in DIAS})
MES_DE = np.array([MESES.index((d.year, d.month)) for d in DIAS])
NOMBRE_MES = {10: "oct", 11: "nov", 12: "dic", 1: "ene", 2: "feb", 3: "mar"}
dia = lambda d: (d - INICIO).days

# ═══════════════════════════════════════════════════════════════════════════════
# 1 · LO QUE DEJA UN PEDIDO (carta vigente, precios de la base al 2026-10-09)
# ═══════════════════════════════════════════════════════════════════════════════
G = 1 / 1000
QUESO = {"cheddar": I.queso_porcion(I.QUESO_CHEDDAR_KG), "americano": I.queso_porcion(I.QUESO_AMERICANO_KG)}
VEG_ESTANDAR = [(21, I.LECHUGA_KG), (35, I.TOMATE_KG), (10, I.CEBOLLA_KG), (7, I.PIMIENTO_KG)]  # 73 g
CARTA = {   # proteína, precio 15CM, precio 30CM, salsas, queso, vegetales (g, ficha)
    "Philly Cheesesteak": ("P09", 22.90, 33.90, 0, "cheddar", [(70, I.CEBOLLA_KG), (20, I.PIMIENTO_KG)]),
    "Meatball Marinara":  ("P06", 21.90, 32.90, 1, "americano", [(35, I.TOMATE_KG), (10, I.CEBOLLA_KG)]),
    "Turkey":             ("P08", 23.90, 34.90, 1, None, VEG_ESTANDAR),
    "Tuna Melt":          ("P04", 22.90, 33.90, 0, "cheddar", []),
    "Italian Hoagie":     ("P05", 23.90, 34.90, 1, "americano", VEG_ESTANDAR),
    "Classic Tuna":       ("P04", 20.90, 31.90, 0, None, []),
}
ARMADOR = {"P04": (22.90, 33.90), "P06": (21.90, 32.90), "P08": (23.90, 34.90), "P09": (22.90, 33.90)}


def costo_sandwich(prot, i, salsas, queso, veg, queso_frac=1.0):
    c = I.PORCION_EN_USO[prot][i] + I.por_sandwich(I.PAN_SUB, i=i) + I.por_sandwich(I.EMPAQUE_CONSERVADOR)
    c += salsas * I.por_sandwich(I.SALSA_PORCION, i=i)
    c += sum(g * G * (1 if i == 0 else 2) * f.valor for g, f in veg)
    if queso:
        c += queso_frac * (QUESO[queso][i] if isinstance(queso, str) else queso[i])
    return c


def sandwich_medio(mix15, frac_armador=0.5):
    """(precio, costo) medio de un sándwich con la mezcla de tamaños dada."""
    filas = [(p15, p30, costo_sandwich(pr, 0, s, q, v), costo_sandwich(pr, 1, s, q, v))
             for pr, p15, p30, s, q, v in CARTA.values()]
    queso_medio = tuple((QUESO["cheddar"][i] + QUESO["americano"][i]) / 2 for i in (0, 1))
    arm = [(p15, p30, costo_sandwich(pr, 0, 2, queso_medio, VEG_ESTANDAR, 0.6),
            costo_sandwich(pr, 1, 2, queso_medio, VEG_ESTANDAR, 0.6)) for pr, (p15, p30) in ARMADOR.items()]
    med = lambda xs: tuple(sum(x[k] for x in xs) / len(xs) for k in range(4))
    s, a = med(filas), med(arm)
    mezcla = lambda x: (mix15 * x[0] + (1 - mix15) * x[1], mix15 * x[2] + (1 - mix15) * x[3])
    (ps, cs), (pa, ca) = mezcla(s), mezcla(a)
    return (1 - frac_armador) * ps + frac_armador * pa, (1 - frac_armador) * cs + frac_armador * ca


def bebida_media():
    filas = [(precio, CB.costo_tanda(rec) / litros * CB.ML_BOTELLA / 1000 + CB.ENVASE)
             for _, precio, litros, rec in CB.BEBIDAS]
    return sum(p for p, _ in filas) / len(filas), sum(c for _, c in filas) / len(filas)


COMBO = 1.00          # [MEDIDO] COMBO_DISCOUNT_PER_PAIR: −S/1 por par sándwich + bebida
GASTO_PEDIDO = 0.50   # [SUPUESTO] gas, frío y coordinación por pedido
TARJETA, CULQI = 0.30, 0.055   # [SUPUESTO] 30% paga con tarjeta; [MEDIDO] CULQI_FEE_RATE
RECOMPENSAS = 0.014   # [DERIVADO] docs/hechos: las recompensas devuelven ~1.4% de lo gastado


def pedido(mix15=0.80, bebida=0.25):
    """Ticket, costo de insumos y lo que deja un pedido PROPIO y uno por app (antes de comisión).

    mix15 0.80 [HIPÓTESIS del dueño] · bebida en 1 de cada 4 [SIN MEDIR] · 1 sándwich por pedido."""
    ps, cs = sandwich_medio(mix15)
    pb, cb = bebida_media()
    ticket = ps + bebida * (pb - COMBO)
    costo = cs + bebida * cb
    app = ticket - costo - GASTO_PEDIDO                       # en la app no hay tarjeta ni puntos
    propio = app - TARJETA * CULQI * ticket - RECOMPENSAS * ticket
    return dict(ticket=ticket, costo=costo, propio=propio, app=app)


# ═══════════════════════════════════════════════════════════════════════════════
# 2 · LOS SUPUESTOS, CADA UNO CON SU RANGO Y DE DÓNDE SALE
# ═══════════════════════════════════════════════════════════════════════════════
FIJOS_MES = 500.0          # [MEDIDO] opera desde casa, sin local (NEGOCIO.md)
CAPACIDAD_DIA = 40         # [MEDIDO] dueño: 40 pedidos por día por persona
COSTO_REFERIDO = 7.65      # [MEDIDO] el 15CM de R06 + la bebida de R05, a costo
SUPUESTOS = {
    # canal propio: Google listo; Instagram suma desde el 27 de octubre (dueño: «hay que esperar 7 días»)
    "google_dia":     (0.10, 0.40, "nuevos/día por Google. Un perfil promedio recibe ~20 clics al mes; uno nuevo, menos"),
    "instagram_dia":  (0.00, 0.40, "nuevos/día por Instagram desde el 27-oct, con una cuenta que arranca de cero"),
    "crecimiento":    (0.00, 0.15, "cuánto crece al mes el canal propio (reseñas, seguidores)"),
    "red_compra":     (0.00, 0.10, "de las ~30 personas de tu red, qué parte pide (dueño: «probablemente ninguno»)"),
    # apps
    "rappi_dia":      (0.30, 2.00, "nuevos/día por Rappi en Trujillo. Sin datos: se mide la 1.ª semana"),
    "rappi_comision": (0.20, 0.30, "comisión de Rappi desde el día 31 (el 1.er mes es 0%, acuerdo del dueño). Confírmala"),
    "pya_dia":        (0.20, 1.50, "nuevos/día por PedidosYa, desde el 3 de noviembre (alta). Sin datos"),
    "pya_comision":   (0.22, 0.30, "comisión de PedidosYa. No hay cifra pública en Perú; en Argentina ~26%"),
    "app_a_propio":   (0.03, 0.08, "de los pedidos repetidos de las apps, cuántos pasan al canal propio sin QR"),
    "qr_a_propio":    (0.10, 0.20, "lo mismo, con el QR en la bolsa (desde el 1 de noviembre)"),
    # recompra [FUENTE Genesys: 45% de los nuevos vuelve; 85% del 2.º hace un 3.º; 60% sigue]
    "p2":             (0.35, 0.55, "vuelve a pedir una 2.ª vez"),
    "p3":             (0.75, 0.90, "de los que hicieron 2, hace un 3.º"),
    "pn":             (0.50, 0.70, "de ahí en adelante, sigue pidiendo"),
    "brecha":         (14.0, 40.0, "días promedio entre un pedido y el siguiente"),
    "referidos":      (0.03, 0.08, "clientes nuevos que trae cada pedido propio"),
    # Meta: S/350 de prueba del 3 al 30 de noviembre
    "cpm":            (5.0, 45.0, "S/ por mil vistas: agencia peruana S/5-12, mercados emergentes S/11-45"),
    "ctr":            (0.0185, 0.0297, "clic: 1.85% alimentos y bebidas a 2.97% restaurantes (2026)"),
    "cvr":            (0.0154, 0.0189, "compra después del clic: 1.54% a 1.89% (2026)"),
}
PAUTA = 350.0              # [DECISIÓN del dueño]
APRENDIZAJE = 1.30         # [SUPUESTO] una cuenta nueva paga más mientras Meta aprende

# Las soluciones que pidió el dueño (3, 4 y 5): lo que cambian en el modelo.
SOLUCIONES = {
    "referidos": ("referidos", (0.08, 0.15), "invitar con un toque por WhatsApp al entregar"),
    "recompra":  ("p2_propio", 0.07, "que los avisos del día 1 y del día 7-10 lleguen también a quien pide sin cuenta"),
    "ticket":    ("ticket", dict(mix15=0.75, bebida=0.35), "bebida ofrecida en el carrito y 30CM mostrado como «el doble»"),
}


def sortear(rng, n):
    return {k: rng.uniform(a, b, n) for k, (a, b, _) in SUPUESTOS.items()}


# ═══════════════════════════════════════════════════════════════════════════════
# 3 · UNA CORRIDA, DÍA POR DÍA
# ═══════════════════════════════════════════════════════════════════════════════
MAXG = 120
K = np.arange(MAXG)


def nucleo(brecha):
    """Reparto de días hasta el siguiente pedido: gamma de forma 2 con media `brecha`."""
    th = brecha / 2.0
    f = K * np.exp(-K / th)
    f[0] = 0
    return f / f.sum()


def correr(s, i, eco, sol=()):
    """Una corrida con los supuestos s[*][i]. Devuelve totales por mes."""
    x = {k: v[i] for k, v in s.items()}
    if "referidos" in sol:
        x["referidos"] = SOLUCIONES["referidos"][1][0] + (x["referidos"] - 0.03) / 0.05 * 0.07
    p2_propio = x["p2"] + (SOLUCIONES["recompra"][1] if "recompra" in sol else 0.0)
    f = nucleo(x["brecha"])
    ig, qr, pya, nov30, = dia(date(2026, 10, 27)), dia(date(2026, 11, 1)), dia(date(2026, 11, 3)), dia(date(2026, 11, 30))
    mes_frac = np.array([m for m in MES_DE], float)

    # tres canales × tres estados (falta el 2.º, falta el 3.º, ya es habitual)
    pend = {c: np.zeros((3, T + MAXG)) for c in ("propio", "rappi", "pya")}
    ped = {c: np.zeros(T) for c in pend}
    nuevos_ref = np.zeros(T + 8)
    cac = x["cpm"] / (1000 * x["ctr"] * x["cvr"]) * 1.18 * APRENDIZAJE
    dias_pauta = [t for t in range(pya, nov30 + 1) if ABIERTO[t]]
    meta_dia = (PAUTA / cac) / len(dias_pauta)
    red = 30 * x["red_compra"] / 6
    primeros = [t for t in range(T) if ABIERTO[t]][:6]

    for t in range(T):
        if not ABIERTO[t]:        # lo que caía en lunes pasa al martes
            for c in pend:
                pend[c][:, t + 1] += pend[c][:, t]
            nuevos_ref[t + 1] += nuevos_ref[t]
            continue
        crece = (1 + x["crecimiento"]) ** (t / 30.4)
        nuevos = {
            "propio": (x["google_dia"] + (x["instagram_dia"] if t >= ig else 0)) * crece
                      + (meta_dia if t in dias_pauta else 0) + (red if t in primeros else 0) + nuevos_ref[t],
            "rappi": x["rappi_dia"],
            "pya": x["pya_dia"] if t >= pya else 0.0,
        }
        migra = x["qr_a_propio"] if t >= qr else x["app_a_propio"]
        for c in pend:
            p2 = p2_propio if c == "propio" else x["p2"]
            repite = pend[c][:, t]
            hoy = nuevos[c] + repite.sum()
            if c != "propio":       # una parte de los que repiten en la app ya pide directo
                pasa = repite.sum() * migra
                hoy -= pasa
                ped["propio"][t] += pasa
            ped[c][t] += hoy
            # quién vuelve, y cuándo
            pend[c][0, t:t + MAXG] += nuevos[c] * p2 * f
            pend[c][1, t:t + MAXG] += repite[0] * x["p3"] * f
            pend[c][2, t:t + MAXG] += (repite[1] + repite[2]) * x["pn"] * f
        nuevos_ref[t + 7] += ped["propio"][t] * x["referidos"]

    # capacidad: lo que pasa de 40 al día no se cocina
    total = ped["propio"] + ped["rappi"] + ped["pya"]
    escala = np.where(total > CAPACIDAD_DIA, CAPACIDAD_DIA / np.maximum(total, 1e-9), 1.0)
    for c in ped:
        ped[c] *= escala

    com_rappi = np.where(np.arange(T) < 30, 0.0, x["rappi_comision"])
    deja = (ped["propio"] * eco["propio"] + ped["rappi"] * (eco["app"] - com_rappi * eco["ticket"])
            + ped["pya"] * (eco["app"] - x["pya_comision"] * eco["ticket"]))
    ventas = total * escala * eco["ticket"]
    compras = total * escala * eco["costo"]
    refer = nuevos_ref[:T]

    out = []
    rmt = False
    for m in range(len(MESES)):
        sel = MES_DE == m
        v, c = ventas[sel].sum(), compras[sel].sum()
        util = deja[sel].sum() - FIJOS_MES - refer[sel].sum() * COSTO_REFERIDO - (PAUTA if m == 1 else 0)
        if not rmt and max(v, c) > 8000:
            rmt = True       # el Nuevo RUS acaba en S/8,000 al mes: se pasa al Régimen MYPE
        if rmt:
            igv = max(0.0, 18 / 118 * (v - 0.5 * c))      # [SUPUESTO] la mitad de las compras, con factura
            imp = igv + 0.10 * max(0.0, util - igv)       # renta MYPE: 10% hasta 15 UIT
        else:
            imp = 20.0 if max(v, c) <= 5000 else 50.0     # cuotas del Nuevo RUS
        n_abiertos = int((ABIERTO & sel).sum())
        out.append(dict(ganancia=util - imp, impuestos=imp, ventas=v,
                        propio=ped["propio"][sel].sum() / n_abiertos, rappi=ped["rappi"][sel].sum() / n_abiertos,
                        pya=ped["pya"][sel].sum() / n_abiertos))
    return out, cac


def simular(sol=(), semilla=20261009, n=CORRIDAS):
    rng = np.random.default_rng(semilla)
    s = sortear(rng, n)
    eco = pedido(**SOLUCIONES["ticket"][1]) if "ticket" in sol else pedido()
    runs = [correr(s, i, eco, sol) for i in range(n)]
    gan = np.array([[m["ganancia"] for m in r[0]] for r in runs])
    res = dict(meses=[], s=s, total=gan.sum(1), cac=np.array([r[1] for r in runs]))
    for m, (a, mm) in enumerate(MESES):
        col = lambda k: np.array([r[0][m][k] for r in runs])
        res["meses"].append(dict(
            mes=NOMBRE_MES[mm], p10=float(np.percentile(gan[:, m], 10)), p50=float(np.median(gan[:, m])),
            p90=float(np.percentile(gan[:, m], 90)), ventas=float(np.median(col("ventas"))),
            impuestos=float(np.median(col("impuestos"))), propio=float(np.median(col("propio"))),
            rappi=float(np.median(col("rappi"))), pya=float(np.median(col("pya")))))
    res["caja_min_p10"] = float(np.percentile(np.minimum.accumulate(np.cumsum(gan, 1), 1)[:, -1], 10))
    return res


def que_pesa(res):
    """Qué supuesto explica más la ganancia de los 6 meses (correlación de rangos)."""
    rk = lambda a: np.argsort(np.argsort(a))
    y = rk(res["total"])
    out = [(k, float(np.corrcoef(rk(v), y)[0, 1])) for k, v in res["s"].items()]
    return sorted(out, key=lambda x: -abs(x[1]))


def equilibrio(meta, canal="propio", comision=0.0):
    e = pedido()
    deja = e["propio"] if canal == "propio" else e["app"] - comision * e["ticket"]
    return (meta + FIJOS_MES + 20) / (deja * 25.5)


if __name__ == "__main__":
    e = pedido()
    hoy = simular()
    con = simular(("referidos", "recompra", "ticket"))
    solas = {k: simular((k,))["total"] for k in SOLUCIONES}
    S = lambda v: ("−" if v < 0 else "") + f"S/{abs(v):,.0f}"
    if "--json" in sys.argv:
        limpio = lambda r: dict(meses=r["meses"], total_p10=float(np.percentile(r["total"], 10)),
                                total_p50=float(np.median(r["total"])), total_p90=float(np.percentile(r["total"], 90)),
                                caja_min_p10=r["caja_min_p10"])
        print(json.dumps(dict(pedido=e, hoy=limpio(hoy), con=limpio(con), que_pesa=que_pesa(hoy),
                              solas={k: float(np.median(v - hoy["total"])) for k, v in solas.items()},
                              cac_p50=float(np.median(hoy["cac"])),
                              equilibrio={"propio": equilibrio(0), "rappi_25": equilibrio(0, "app", .25)}),
                         ensure_ascii=False))
        sys.exit(0)
    print(f"Un pedido: ticket S/{e['ticket']:.2f}, insumos S/{e['costo']:.2f}. Deja S/{e['propio']:.2f} propio; "
          f"por app S/{e['app']:.2f} menos la comisión (con 25%: S/{e['app'] - .25 * e['ticket']:.2f}).")
    print(f"Pedidos/día para cubrir costos: {equilibrio(0):.1f} propios, o {equilibrio(0, 'app', .25):.1f} por app al 25%.")
    print(f"Un cliente por Meta (mediana): S/{np.median(hoy['cac']):.0f}")
    for nombre, r in (("HOY, con lo que ya hay", hoy), ("CON LAS SOLUCIONES 3, 4 y 5", con)):
        print(f"\n{nombre}")
        for m in r["meses"]:
            print(f"  {m['mes']}  propio {m['propio']:4.1f} + rappi {m['rappi']:4.1f} + pya {m['pya']:4.1f} ped/día · "
                  f"ventas {S(m['ventas'])} · impuestos {S(m['impuestos'])} · ganancia {S(m['p50'])} "
                  f"({S(m['p10'])} a {S(m['p90'])})")
        print(f"  6 meses: {S(np.median(r['total']))} ({S(np.percentile(r['total'], 10))} a "
              f"{S(np.percentile(r['total'], 90))}) · caja más baja (caso malo): {S(r['caja_min_p10'])}")
    print("\nCada solución sola, sobre HOY (6 meses, mediana):")
    for k, v in solas.items():
        print(f"  +{S(np.median(v - hoy['total']))}  {k}: {SOLUCIONES[k][2]}")
    print("\nQué supuesto decide más el resultado (correlación con la ganancia de 6 meses):")
    for k, c in que_pesa(hoy)[:8]:
        print(f"  {c:+.2f}  {k}: {SUPUESTOS[k][2]}")
