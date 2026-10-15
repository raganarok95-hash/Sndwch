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
# `PROYECCION_HASTA` (2026-10-15): para mirar más allá de marzo (la meta de S/6,000 del dueño).
INICIO, FIN = date(2026, 10, 20), date.fromisoformat(os.environ.get("PROYECCION_HASTA", "2027-03-31"))
DIAS = [INICIO + timedelta(days=i) for i in range((FIN - INICIO).days + 1)]
T = len(DIAS)
ABIERTO = np.array([d.weekday() != 0 for d in DIAS])          # [MEDIDO] lunes cerrado
MESES = sorted({(d.year, d.month) for d in DIAS})
MES_DE = np.array([MESES.index((d.year, d.month)) for d in DIAS])
NOMBRE_MES = {1: "ene", 2: "feb", 3: "mar", 4: "abr", 5: "may", 6: "jun", 7: "jul", 8: "ago", 9: "set",
              10: "oct", 11: "nov", 12: "dic"}
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
    c = I.PORCION_EN_USO[prot][i] + I.por_sandwich(I.PAN_SUB, i=i) + I.por_sandwich(I.EMPAQUE_PEDIDO, sand_por_pedido=1)
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


SOBREPRECIO_APPS = 0.10   # [DECISIÓN del dueño 2026-10-09] la carta en Rappi y PedidosYa, 10% más cara


def pedido(mix15=0.80, bebida=0.25):
    """Ticket, costo de insumos y lo que deja un pedido PROPIO y uno por app (antes de comisión).

    mix15 0.80 [HIPÓTESIS del dueño] · bebida en 1 de cada 4 [SIN MEDIR] · 1 sándwich por pedido."""
    ps, cs = sandwich_medio(mix15)
    pb, cb = bebida_media()
    ticket = ps + bebida * (pb - COMBO)
    costo = cs + bebida * cb
    propio = ticket - costo - GASTO_PEDIDO - TARJETA * CULQI * ticket - RECOMPENSAS * ticket
    # En las apps la carta va SOBREPRECIO_APPS más cara; no hay tarjeta ni puntos. `app` es antes
    # de la comisión, que se cobra sobre `ticket_app`.
    ticket_app = ticket * (1 + SOBREPRECIO_APPS)
    app = ticket_app - costo - GASTO_PEDIDO
    return dict(ticket=ticket, ticket_app=ticket_app, costo=costo, propio=propio, app=app)


# ═══════════════════════════════════════════════════════════════════════════════
# 2 · LOS SUPUESTOS, CADA UNO CON SU RANGO Y DE DÓNDE SALE
# ═══════════════════════════════════════════════════════════════════════════════
FIJOS_MES = 500.0          # [MEDIDO] opera desde casa, sin local (NEGOCIO.md)
CAPACIDAD_DIA = 40         # [MEDIDO] dueño: 40 pedidos por día por persona
COSTO_REFERIDO = 7.65      # [MEDIDO] el 15CM de R06 + la bebida de R05, a costo
SUPUESTOS = {
    # canal propio: Google listo; Instagram suma desde el 27 de octubre (dueño: «hay que esperar 7 días»)
    "google_dia":     (0.02, 0.15, "nuevos/día por Google. En Perú la comida se descubre en Instagram y TikTok; un solo-delivery casi no sale en Maps"),
    "instagram_dia":  (0.00, 0.40, "nuevos/día por Instagram desde el 27-oct, con una cuenta que arranca de cero"),
    "crecimiento":    (0.00, 0.15, "cuánto crece al mes el canal propio (reseñas, seguidores)"),
    "red_compra":     (0.00, 0.10, "de las ~30 personas de tu red, qué parte pide (dueño: «probablemente ninguno»)"),
    # apps
    "rappi_dia":      (0.15, 1.00, "nuevos/día por Rappi en Trujillo, local nuevo y sin calificaciones (conservador; dueño: «sé realista»)"),
    "rappi_comision": (0.20, 0.30, "comisión de Rappi desde el día 31 (el 1.er mes es 0%, acuerdo del dueño). Confírmala"),
    "pya_dia":        (0.10, 0.60, "nuevos/día por PedidosYa, desde el 17 de noviembre (alta pendiente). Conservador"),
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
    "cpm":            (5.0, 14.0, "S/ por mil vistas en Perú 2026: restaurantes S/5-12 (Ads Academy); promedio país US$2.1-3.7"),
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


def impuesto(v, c, util, rmt, ex, anio=2026, v_encargo=0.0):
    """Lo que se paga en un mes con ventas `v` y compras `c`. `rmt`: ya se pasó al Régimen MYPE
    (el Nuevo RUS acaba en S/8,000 al mes de ventas o de compras, y no se vuelve).
    `compras_con_factura` [SUPUESTO 0.5]: la parte de las compras que da crédito de IGV.
    `contador` (S/ al mes): el Régimen MYPE lleva libros y factura electrónica.
    `igv_reducido` (2026-10-15): la tasa especial de la MYPE de restaurantes (Ley 31556 y sus
    prórrogas; SUNAT: 8% + 2.5% de IPM = 10.5% en 2026; 12% de IGV en 2027 [+3% de IPM, SIN
    CONFIRMAR]). Solo si el 70% de los ingresos es de restaurante: las bandejas por encargo
    (`v_encargo`, CIIU 5621) no entran y, si pasan del 30%, se pierde para todo."""
    if not rmt:
        return 20.0 if max(v, c) <= 5000 else 50.0     # cuotas del Nuevo RUS
    if ex.get("bandeja_es_restaurante"):     # si SUNAT la trata como delivery de restaurante
        v_encargo = 0.0
    tasa = (0.105 if anio <= 2026 else 0.15) if ex.get("igv_reducido") and v_encargo <= 0.30 * v else 0.18
    debito = tasa / (1 + tasa) * (v - v_encargo) + 18 / 118 * v_encargo
    igv = max(0.0, debito - 18 / 118 * ex.get("compras_con_factura", 0.5) * c)
    return igv + 0.10 * max(0.0, util - igv) + ex.get("contador", 0.0)    # renta MYPE: 10% hasta 15 UIT


def correr(s, i, eco, sol=(), pauta_mes=0.0, si_cac_menor=None, ex=None):
    ex = ex or {}
    """Una corrida con los supuestos s[*][i]. Devuelve totales por mes."""
    # `cerrado_extra` (2026-10-15, «con menos esfuerzo»): días que se cierran además del lunes
    # (0 = lunes … 6 = domingo). Lo que caía ese día pasa al siguiente abierto.
    AB = ABIERTO & np.array([d.weekday() not in ex.get("cerrado_extra", ()) for d in DIAS])
    habiles = max(1, sum(1 for wd in (1, 2, 3, 4) if wd not in ex.get("cerrado_extra", ())))
    x = {k: v[i] for k, v in s.items()}
    # Recompra movida a mano (2026-10-15, la meta de S/6,000 con el negocio principal): `p2_extra`
    # y `pn_extra` suben la probabilidad de volver (todos los canales); `brecha_factor` acorta (o
    # alarga) el tiempo entre pedidos. Para medir cuánto pesa la recompra, no son datos.
    x["p2"] = min(0.95, x["p2"] + ex.get("p2_extra", 0.0))
    x["pn"] = min(0.95, x["pn"] + ex.get("pn_extra", 0.0))
    x["brecha"] = x["brecha"] * ex.get("brecha_factor", 1.0)
    if "referidos" in sol:
        x["referidos"] = SOLUCIONES["referidos"][1][0] + (x["referidos"] - 0.03) / 0.05 * 0.07
    p2_propio = x["p2"] + (SOLUCIONES["recompra"][1] if "recompra" in sol else 0.0)
    f = nucleo(x["brecha"])
    ig, qr, pya, nov30, = dia(ex.get("ig_desde", date(2026, 10, 27))), dia(date(2026, 11, 1)), dia(date(2026, 11, 17)), dia(ex.get("prueba_hasta", date(2026, 11, 30)))
    mes_frac = np.array([m for m in MES_DE], float)

    # tres canales × tres estados (falta el 2.º, falta el 3.º, ya es habitual)
    pend = {c: np.zeros((3, T + MAXG)) for c in ("propio", "rappi", "pya")}
    ped = {c: np.zeros(T) for c in pend}
    nuevos_ref = np.zeros(T + 8)
    nuevos_dia = np.zeros(T)     # clientes que piden por PRIMERA vez (2026-10-15: «empezaremos con 0 clientes»)
    cac = x["cpm"] / (1000 * x["ctr"] * x["cvr"]) * 1.18 * APRENDIZAJE
    cac *= ex.get("cac_factor", 1.0)
    desde = ex.get("prueba_desde", date(2026, 11, 3))
    dias_pauta = [t for t in range(dia(desde), nov30 + 1) if AB[t]]
    prueba = 0.0 if ex.get("sin_prueba") else ex.get("prueba_monto", PAUTA)   # 2026-10-15: `prueba_monto`, una prueba más grande
    meta_dia = (prueba / cac) / len(dias_pauta)
    # Pauta mensual desde diciembre (2026-10-09: «¿con cuánto de publicidad funcionaría?»).
    # [SUPUESTO] Trujillo es chico: cada S/1,000 al mes encarece el cliente un 15%; después de la
    # prueba, Meta ya aprendió algo (×1.15 en vez de ×1.30). `si_cac_menor`: solo se gasta si la
    # prueba de noviembre midió un costo por cliente menor a ese.
    gasta = pauta_mes > 0 and (si_cac_menor is None or cac <= si_cac_menor)
    cac_mes = cac / APRENDIZAJE * 1.15 * (1 + 0.15 * pauta_mes / 1000)
    # `pauta_desde` (2026-10-15): escalar el día que se decide (el 17-nov) y no el 1 del mes
    # siguiente; el primer mes se paga y rinde en proporción a los días abiertos que quedan.
    pauta_dia, pauta_frac = np.zeros(T), np.zeros(len(MESES))
    t_pauta = dia(ex["pauta_desde"]) if "pauta_desde" in ex else None
    if gasta:
        for m in range(MES_DE[t_pauta] if t_pauta is not None else ex.get("pauta_desde_mes", 2), len(MESES)):
            sel = np.where((MES_DE == m) & AB)[0]
            van = sel[sel >= t_pauta] if t_pauta is not None else sel
            pauta_dia[van] = (pauta_mes / cac_mes) / len(sel)
            pauta_frac[m] = len(van) / len(sel)
    red = 30 * x["red_compra"] / 6
    abiertos = [t for t in range(T) if AB[t]]
    primeros = abiertos[:6]

    # `eventos` (2026-10-15): bandejas para reuniones, capacitaciones y celebraciones, pedidas con
    # días de anticipación. Una lista de (desde, eventos al mes, sándwiches de 30CM por evento),
    # repartidos en los días abiertos. Cada 30CM deja su precio de carta menos su costo, la tarjeta
    # y los puntos, y menos `descuento_evento` (S/ por 30CM). No tienen recompra propia, pero cada
    # bandeja la comen 10-12 personas: `nuevos_por_30cm` son los clientes nuevos que deja cada 30CM
    # servido, una semana después (una degustación que paga el cliente).
    ev30 = np.zeros(T)
    for desde_ev, por_mes, n30 in ex.get("eventos", []):
        dias_ev = [t for t in range(T) if AB[t] and t >= dia(desde_ev)]
        ev30[dias_ev] += por_mes * n30 / (25.5 * AB.sum() / ABIERTO.sum())   # ~25.5 días abiertos al mes
    ev_nuevos = np.zeros(T)
    ev_nuevos[7:] = ev30[:-7] * ex.get("nuevos_por_30cm", 0.0)
    # `aliados` = [(puntos, desde, clientes nuevos por punto y día abierto)] (2026-10-15): bares,
    # cervecerías, salas de juego o coworkings SIN cocina que ponen el QR de SND//WCH en sus mesas,
    # con permiso. Su gente pide de noche y el fin de semana, que es cuando el dueño cocina.
    # `almuerzo_cerrado` = (parte, hasta) (2026-10-15: el dueño trabaja en un banco y arma él solo):
    # de martes a viernes se atiende solo de noche; se pierde esa parte de los clientes nuevos de
    # esos días (los que ya son clientes piden en otro momento). `hasta`: None = siempre.
    corte_alm, hasta_alm = ex.get("almuerzo_cerrado", (0.0, None))
    t_alm = dia(hasta_alm) if hasta_alm else T
    # `canales` = [(canal, S/ al mes, S/ por cliente nuevo, desde)] (2026-10-15: «publicidad de
    # otros tipos»): anuncios dentro de Rappi y PedidosYa, Google, TikTok, publicaciones pagadas.
    # Cada sol trae 1/costo clientes nuevos en ese canal ("propio", "rappi" o "pya"), repartidos en
    # los días abiertos desde `desde`; el gasto corre todos los días. [SUPUESTO] Como en Meta,
    # Trujillo es chico: cada S/1,000 al mes encarece el cliente un 15%.
    pagados = {c: np.zeros(T) for c in ("propio", "rappi", "pya")}
    for canal, monto, costo_cli, desde_c in ex.get("canales", []):
        dias_c = [t for t in range(T) if AB[t] and t >= dia(desde_c)]
        pagados[canal][dias_c] += monto / (costo_cli * (1 + 0.15 * monto / 1000)) / (25.5 * AB.sum() / ABIERTO.sum())

    for t in range(T):
        if not AB[t]:        # lo que caía en lunes pasa al martes
            for c in pend:
                pend[c][:, t + 1] += pend[c][:, t]
            nuevos_ref[t + 1] += nuevos_ref[t]
            continue
        crece = (1 + x["crecimiento"]) ** (t / 30.4)
        if DIAS[t].weekday() < 5 and t < t_alm:
            crece *= 1 - corte_alm
        crece *= ex.get("sueltos_factor", 1.0)    # 2026-10-15: «por encargo», sin delivery al momento
        nuevos = {
            "propio": (x["google_dia"] + (x["instagram_dia"] if t >= ig else 0) + (ex.get("tiktok", 0.0) if t >= ig else 0)) * crece
                      + ev_nuevos[t] + sum(n * k for n, desde_al, k in ex.get("aliados", []) if t >= dia(desde_al))
                      + (ex.get("oficinas", 0.0) if t >= dia(ex.get("oficinas_desde", date(2026, 11, 3))) else 0)
                      + (ex["volanteo"][0] if "volanteo" in ex and t in abiertos[:ex["volanteo"][1]] else 0)
                      + (meta_dia if t in dias_pauta else 0) + pauta_dia[t] + (red if t in primeros else 0) + nuevos_ref[t]
                      + pagados["propio"][t],
            "rappi": x["rappi_dia"] * ex.get("rappi_factor", 1.0) * (1 - corte_alm if DIAS[t].weekday() < 5 and t < t_alm else 1)
                     + pagados["rappi"][t],
            "pya": (x["pya_dia"] if t >= dia(ex.get("pya_desde", date(2026, 11, 17))) else 0.0)
                   * (1 - corte_alm if DIAS[t].weekday() < 5 and t < t_alm else 1) * ex.get("sueltos_factor", 1.0)
                   * ex.get("pya_factor", 1.0) + pagados["pya"][t],
        }
        nuevos_dia[t] = sum(nuevos.values())
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

    # Pedido fijo de una oficina (2026-10-15): `oficina_fija` = (pedidos por semana, desde). Una
    # oficina que pide el mismo día cada semana; no suma clientes nuevos, suma pedidos propios. El
    # descuento del grupo (`descuento_grupo`, S/ por pedido) se resta de lo que deja.
    desc_dia = np.zeros(T)
    # `oficinas_fijas` (2026-10-15, meta de S/6,000): varias oficinas, cada una (pedidos por semana,
    # desde). Solo de lunes a viernes: el almuerzo de oficina no existe el fin de semana.
    fijas = list(ex.get("oficinas_fijas", [])) + ([ex["oficina_fija"]] if "oficina_fija" in ex else [])
    for n_sem, desde_of in fijas:
        dias_of = [t for t in range(T) if AB[t] and t >= dia(desde_of) and DIAS[t].weekday() < 5]
        ped["propio"][dias_of] += n_sem / habiles       # martes a viernes: los días hábiles abiertos
        desc_dia[dias_of] += n_sem / habiles * ex.get("descuento_grupo", 0.0)

    # capacidad: lo que pasa de 40 al día no se cocina (`capacidad`: con un ayudante, más). Un 30CM
    # de bandeja cuenta como un pedido.
    cap = ex.get("capacidad", CAPACIDAD_DIA)
    total = ped["propio"] + ped["rappi"] + ped["pya"] + ev30
    escala = np.where(total > cap, cap / np.maximum(total, 1e-9), 1.0)
    for c in ped:
        ped[c] *= escala
    ev30 = ev30 * escala

    com_rappi = np.where(np.arange(T) < 30, 0.0, x["rappi_comision"])
    deja = (ped["propio"] * eco["propio"] + ped["rappi"] * (eco["app"] - com_rappi * eco["ticket_app"])
            + ped["pya"] * (eco["app"] - x["pya_comision"] * eco["ticket_app"])
            + ev30 * (eco["p30"] * (1 - TARJETA * CULQI - RECOMPENSAS) - eco["c30"] - ex.get("descuento_evento", 0.0)))
    ventas = ped["propio"] * eco["ticket"] + (ped["rappi"] + ped["pya"]) * eco["ticket_app"] + ev30 * eco["p30"]
    compras = (total * escala - ev30) * eco["costo"] + ev30 * eco["c30"]
    refer = nuevos_ref[:T]

    # MERMA POR CADUCIDAD (2026-10-15). El costeo cuenta la merma de cocción, no la comida que se
    # vence sin venderse. Con la carta entera disponible hay un mínimo de perecibles abiertos por
    # semana (pan, verduras, quesos y fiambres abiertos, salsas): `merma` = (S/ mínimos por
    # semana, parte del costo de un pedido que es perecible). Lo que la semana no consume, se bota.
    merma_dia = np.zeros(T)
    if "merma" in ex:
        minimo, frac = ex["merma"]
        for a in range(0, T, 7):
            consumo = frac * eco["costo"] * total[a:a + 7].sum() * escala[a:a + 7].mean()
            merma_dia[a:a + 7] = max(0.0, minimo - consumo) / 7.0
    fijos = ex.get("fijos", FIJOS_MES)
    # `ayudante` = (S/ al mes, desde): alguien que arma y despacha mientras el dueño trabaja.
    ayud_mes, ayud_dia = np.zeros(len(MESES)), np.zeros(T)
    if "ayudante" in ex:
        sueldo, desde_ay = ex["ayudante"]
        ayud_dia[dia(desde_ay):] = sueldo / 30.4
        for m in range(len(MESES)):
            dias_m = [t for t in range(T) if MES_DE[t] == m]
            ayud_mes[m] = sueldo * sum(1 for t in dias_m if t >= dia(desde_ay)) / len(dias_m)
    # Lo que cuesta salir a buscar clientes (2026-10-15): `gastos` = [(S/ por día, primeros N días
    # abiertos)], p. ej. las muestras para las oficinas o la imprenta de los volantes.
    gasto_dia = np.zeros(T)
    for monto, n_dias in ex.get("gastos", []):
        gasto_dia[abiertos[:n_dias]] += monto
    for _canal, monto, _costo, desde_c in ex.get("canales", []):
        gasto_dia[dia(desde_c):] += monto / 30.4

    out = []
    rmt = False
    for m in range(len(MESES)):
        sel = MES_DE == m
        v, c = ventas[sel].sum(), compras[sel].sum()
        util = (deja[sel].sum() - fijos - ayud_mes[m] - refer[sel].sum() * COSTO_REFERIDO - (prueba if m == MES_DE[dias_pauta[0]] else 0)
                - merma_dia[sel].sum() - desc_dia[sel].sum() - gasto_dia[sel].sum()
                - pauta_mes * pauta_frac[m]
                - ex.get("oferta_costo", 0.0) * (prueba / cac if m == MES_DE[dias_pauta[0]] else pauta_mes * pauta_frac[m] / cac_mes))
        # `rmt_desde` (2026-10-15): el Nuevo RUS no da factura, y una empresa que paga una bandeja
        # la pide; desde esa fecha se está en el Régimen MYPE aunque se venda poco.
        rmt = rmt or max(v, c) > 8000 or ("rmt_desde" in ex and DIAS[np.where(sel)[0][-1]] >= ex["rmt_desde"])
        imp = impuesto(v, c, util, rmt, ex, MESES[m][0], (ev30[sel] * eco["p30"]).sum())
        n_abiertos = int((AB & sel).sum())
        out.append(dict(ganancia=util - imp, impuestos=imp, ventas=v, nuevos=nuevos_dia[sel].sum() * escala[sel].mean(),
                        pedidos=sum(ped[c][sel].sum() for c in ped) / n_abiertos,
                        propio=ped["propio"][sel].sum() / n_abiertos, rappi=ped["rappi"][sel].sum() / n_abiertos,
                        pya=ped["pya"][sel].sum() / n_abiertos))
    # Lo de cada día, para medir el PRIMER MES (los primeros 30 días desde que se abre).
    prueba_dia = np.zeros(T)
    if prueba:
        prueba_dia[dias_pauta] = prueba / len(dias_pauta)
    neto = (deja - refer * COSTO_REFERIDO - merma_dia - desc_dia - gasto_dia - prueba_dia - ayud_dia
            - (pauta_dia * cac_mes if gasta else 0))
    return out, cac, dict(neto=neto, ventas=ventas, compras=compras, pedidos=total * escala, nuevos=nuevos_dia,
                          merma=merma_dia, fijos=fijos, ev30=ev30, propio=ped["propio"], apps=ped["rappi"] + ped["pya"])


def simular(sol=(), semilla=20261009, n=CORRIDAS, pauta_mes=0.0, si_cac_menor=None, ex=None):
    rng = np.random.default_rng(semilla)
    s = sortear(rng, n)
    eco = pedido(**SOLUCIONES["ticket"][1]) if "ticket" in sol else pedido()
    if ex and "empaque" in ex:      # otra ficha de empaque (2026-10-15: la bolsa lisa con sello)
        d = I.por_sandwich(I.EMPAQUE_PEDIDO, sand_por_pedido=1) - I.por_sandwich(ex["empaque"], sand_por_pedido=1)
        eco = dict(eco, costo=eco["costo"] - d, propio=eco["propio"] + d, app=eco["app"] + d)
    # `sand_por_pedido` (2026-10-15): pedidos para compartir (cena para dos, el pack del finde). El
    # modelo suponía 1 sándwich por pedido; con f, el pedido trae f veces el ticket y el costo, y
    # el gasto por pedido (gas, coordinación) se paga una sola vez.
    f = (ex or {}).get("sand_por_pedido", 1.0)
    if f != 1.0:
        eco = dict(eco, ticket=eco["ticket"] * f, ticket_app=eco["ticket_app"] * f, costo=eco["costo"] * f,
                   propio=(eco["propio"] + GASTO_PEDIDO) * f - GASTO_PEDIDO, app=(eco["app"] + GASTO_PEDIDO) * f - GASTO_PEDIDO)
    p30, c30 = sandwich_medio(0.0)      # el 30CM medio, para las bandejas de los eventos
    eco = dict(eco, p30=p30, c30=c30)
    if ex and "empaque" in ex:
        eco["c30"] -= I.por_sandwich(I.EMPAQUE_PEDIDO, sand_por_pedido=1) - I.por_sandwich(ex["empaque"], sand_por_pedido=1)
    runs = [correr(s, i, eco, sol, pauta_mes, si_cac_menor, ex) for i in range(n)]
    gan = np.array([[m["ganancia"] for m in r[0]] for r in runs])
    res = dict(meses=[], s=s, total=gan.sum(1), cac=np.array([r[1] for r in runs]))
    acum = np.cumsum(np.array([[m["nuevos"] for m in r[0]] for r in runs]), 1)
    for m, (a, mm) in enumerate(MESES):
        col = lambda k: np.array([r[0][m][k] for r in runs])
        res["meses"].append(dict(
            mes=NOMBRE_MES[mm], p10=float(np.percentile(gan[:, m], 10)), p50=float(np.median(gan[:, m])),
            p90=float(np.percentile(gan[:, m], 90)), ventas=float(np.median(col("ventas"))),
            impuestos=float(np.median(col("impuestos"))), propio=float(np.median(col("propio"))),
            rappi=float(np.median(col("rappi"))), pya=float(np.median(col("pya"))),
            ventas_p10=float(np.percentile(col("ventas"), 10)), ventas_p90=float(np.percentile(col("ventas"), 90)),
            pedidos=float(np.median(col("pedidos"))), pedidos_p10=float(np.percentile(col("pedidos"), 10)),
            pedidos_p90=float(np.percentile(col("pedidos"), 90)), nuevos=float(np.median(col("nuevos"))),
            clientes=float(np.median(acum[:, m])), clientes_p10=float(np.percentile(acum[:, m], 10)),
            clientes_p90=float(np.percentile(acum[:, m], 90))))
    # El primer mes: los 30 días desde que se abre (20-oct a 18-nov), con los fijos de 30 días y
    # la cuota del Nuevo RUS.
    pm = np.array([r[2]["neto"][:30].sum() - r[2]["fijos"] * 30 / 30.4 - 20.0 for r in runs])
    res["primer_mes"] = dict(
        p10=float(np.percentile(pm, 10)), p50=float(np.median(pm)), p90=float(np.percentile(pm, 90)),
        positivo=float((pm > 0).mean()),
        pedidos=float(np.median([r[2]["pedidos"][:30].sum() for r in runs])),
        ventas=float(np.median([r[2]["ventas"][:30].sum() for r in runs])),
        merma=float(np.median([r[2]["merma"][:30].sum() for r in runs])))
    # Cada MES DESDE LA APERTURA (bloques de 30 días: el 1 es del 20-oct al 18-nov, el 3 del 19-dic al
    # 17-ene), con sus fijos y sus impuestos. Para la meta del dueño (2026-10-15: «al menos 6000
    # líquidos al mes… desde el mes 3»): ganancia ANTES del sueldo del dueño, después de impuestos.
    res["ventanas"] = []
    for k in range(T // 30):
        sel = slice(30 * k, 30 * k + 30)
        g, ped_d, ven, imps = [], [], [], []
        for r in runs:
            d = r[2]
            antes = [(d["ventas"][30 * j:30 * j + 30].sum(), d["compras"][30 * j:30 * j + 30].sum()) for j in range(k + 1)]
            rmt = any(max(v, c) > 8000 for v, c in antes) or ("rmt_desde" in (ex or {}) and DIAS[30 * k + 29] >= ex["rmt_desde"])
            v, c = antes[-1]
            util = d["neto"][sel].sum() - d["fijos"] * 30 / 30.4
            imp = impuesto(v, c, util, rmt, ex or {}, DIAS[30 * k + 15].year, d["ev30"][sel].sum() * eco["p30"])
            g.append(util - imp)
            imps.append(imp)
            ped_d.append(d["pedidos"][sel].sum())
            ven.append(v)
        g = np.array(g)
        res["ventanas"].append(dict(p10=float(np.percentile(g, 10)), p50=float(np.median(g)), p90=float(np.percentile(g, 90)),
                                    meta=float((g >= 6000).mean()), impuestos=float(np.median(imps)), pedidos=float(np.median(ped_d)), ventas=float(np.median(ven)),
                                    propio=float(np.median([r[2]["propio"][sel].sum() for r in runs])),
                                    apps=float(np.median([r[2]["apps"][sel].sum() for r in runs])),
                                    ev30=float(np.median([r[2]["ev30"][sel].sum() for r in runs]))))
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
    deja = e["propio"] if canal == "propio" else e["app"] - comision * e["ticket_app"]
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
          f"por app S/{e['app']:.2f} menos la comisión (con 25%: S/{e['app'] - .25 * e['ticket_app']:.2f}).")
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
    print("\nDESDE CERO CLIENTES (HOY; caso malo · medio · bueno = 1 de cada 10 · mitad · 9 de cada 10)")
    for m in hoy["meses"]:
        print(f"  {m['mes']}  clientes nuevos {m['nuevos']:4.0f} · acumulados {m['clientes']:4.0f} ({m['clientes_p10']:.0f}-{m['clientes_p90']:.0f})"
              f" · pedidos/día {m['pedidos']:.1f} ({m['pedidos_p10']:.1f}-{m['pedidos_p90']:.1f})"
              f" · ventas {S(m['ventas'])} ({S(m['ventas_p10'])}-{S(m['ventas_p90'])})")
    print("\nCada solución sola, sobre HOY (6 meses, mediana):")
    for k, v in solas.items():
        print(f"  +{S(np.median(v - hoy['total']))}  {k}: {SOLUCIONES[k][2]}")
    print("\nQué supuesto decide más el resultado (correlación con la ganancia de 6 meses):")
    for k, c in que_pesa(hoy)[:8]:
        print(f"  {c:+.2f}  {k}: {SUPUESTOS[k][2]}")
