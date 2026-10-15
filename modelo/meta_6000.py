# -*- coding: utf-8 -*-
"""
SND//WCH — S/6,000 LÍQUIDOS AL MES, CON EL HORARIO REAL DEL DUEÑO (2026-10-15)

Dueño: «No haré volantes… La meta sería al menos 6000 líquidos al mes (incluyendo mi propio
sueldo)». Y después, sobre el primer plan (oficinas con ayudante): «Yo armo, pero primero revisa
la viabilidad de tu plan de oficina… Dame planes distintos con los cuales llegar a la meta,
mejores, más viables y con menos esfuerzo» · «mi sueldo es de 6000» · «RUC 10, puedo sacar RUC
20 cuando lleguemos a la meta» · «[a mi trabajo] solo ofrecerles informalmente, trabajo en un
banco» · degustaciones «luego del mes 6, cuando ya seamos rentables».

LO QUE ESO FIJA: arma él solo, desde su casa (home office de 8:50 a 18:00, sábados y domingos
rotativos) y con la app abierta todo el día; ayudante desde diciembre si en noviembre se venden 8
o más bandejas; sin degustaciones, sin volantes, sin tocar precios; RUC 10 en el Nuevo RUS hasta
que convenga el Régimen MYPE.

«Líquidos» = ganancia del mes ANTES de su sueldo, después de impuestos, fijos y lo que cuesta
conseguir clientes. Mes = 30 días desde la apertura (el 1 va del 20-oct al 18-nov). Simulación
sobre `proyeccion.py`, a 12 meses: no hay un solo pedido real, y las bandejas y los aliados se
dan por vendidos (el modelo no sortea si se venden; eso es lo que hay que medir).

Uso: python3 modelo/meta_6000.py [corridas]
"""
import contextlib
import io
import os
import sys
from datetime import date

os.environ.setdefault("PROYECCION_HASTA", "2027-10-19")       # 12 meses de 30 días
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
with contextlib.redirect_stdout(io.StringIO()):
    import proyeccion as P                     # noqa: E402
    import primer_mes as PM                    # noqa: E402

N = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 400
SOL = ("ticket", "referidos", "recompra")      # bebida ofrecida y 30CM, referidos, recompra

# ── Con su horario real (2026-10-15, noche) ─────────────────────────────────────────────
# «Todos los días al momento que sea. Pero mi horario laboral es de 8.50 hasta las 6 pm» (home
# office) · Rappi y PedidosYa «abiertos siempre, puedo armar todo». La app sigue abierta de 11 a
# 22 y él arma entre reuniones: no se pierde el mediodía. Capacidad 35 al día [SUPUESTO: una
# persona que además trabaja]. Nuevo RUS hasta pasar S/8,000 de ventas en un mes; ahí Régimen MYPE
# con su RUC 10 (no hace falta el RUC 20), contador S/200, casi todas las compras con factura y el
# IGV de restaurante MYPE.
REAL = dict(PM.HOY_REAL, rappi_factor=1.3, gastos=[PM.PAN_ENVIO], capacidad=35, contador=200.0,
            compras_con_factura=0.9, igv_reducido=True)


# ── Los tres motores ─────────────────────────────────────────────────────────────────────
# BANDEJA: 6 sándwiches de 30CM cortados en 4 (10-12 personas), por encargo, a precio de carta.
# Cada 30CM deja ~S/21. La comen 10-12 personas: deja 0.05 clientes nuevos por 30CM [SUPUESTO:
# ~2.5% de los que la prueban pide después]. Llega a `meta` bandejas al mes en 4 escalones, del
# 7-nov al 19-dic (las primeras se venden a su gente; diciembre trae las reuniones de fin de año).
# Incluye las de su red del banco (cumpleaños del mes, despedidas; él es home office: no lleva
# nada en mano, piden por la app como cualquiera).
def bandejas(meta, desde=date(2026, 11, 7), hasta=date(2026, 12, 19)):
    paso = (hasta - desde) / 3
    return [(desde + paso * i, meta / 4, 6) for i in range(4)]


# ALIADOS: bares, cervecerías, salas de juego o coworkings SIN cocina que ponen el QR en sus mesas,
# con permiso: 10 puntos hacia el 19-dic, cada uno 0.1 clientes nuevos por día abierto [SUPUESTO].
ALIADOS = [(3, date(2026, 11, 7), 0.1), (4, date(2026, 11, 28), 0.1), (3, date(2026, 12, 19), 0.1)]
# PARA COMPARTIR: la cena para dos y el pack del finde: 1.3 sándwiches por pedido en vez de 1
# [SUPUESTO; el modelo suponía 1].
COMPARTIR = dict(sand_por_pedido=1.3)
# AYUDANTE desde diciembre (dueño: «sí, desde diciembre», si en noviembre se venden 8 o más
# bandejas): cocina en su casa mientras él hace home office. Tiempo completo en microempresa: RMV
# S/1,230 + EsSalud + vacaciones ≈ S/1,400 [SUPUESTO]. Con dos personas, capacidad 60.
AYUDANTE = dict(ayudante=(1400.0, date(2026, 12, 1)), capacidad=60)


def motores(n_bandejas, **extra):
    return dict(REAL, **COMPARTIR, aliados=ALIADOS, nuevos_por_30cm=0.05, eventos=bandejas(n_bandejas), **extra)


ESCENARIOS = [
    ("Así abres: todo el día, tú solo", REAL),
    ("El piso: 20 bandejas al mes, en el Nuevo RUS", dict(REAL, eventos=bandejas(20), nuevos_por_30cm=0.05)),
    ("Solo aliados: 10 bares o coworkings con tu QR", dict(REAL, aliados=ALIADOS)),
    ("Solo «para compartir»", dict(REAL, **COMPARTIR)),
    ("Los tres motores, 30 bandejas al mes, tú solo", motores(30)),
    ("Los tres motores, 40 bandejas al mes, tú solo", motores(40)),
    ("  y si SUNAT trata la bandeja como delivery de restaurante", motores(40, bandeja_es_restaurante=True)),
    ("Los tres motores, 40 bandejas, con ayudante desde diciembre", motores(40, **AYUDANTE)),
    ("Los tres motores, 60 bandejas, con ayudante desde diciembre", motores(60, **AYUDANTE)),
]


def horas_semana(ex, w):
    """Horas de trabajo a la semana para el dueño [SUPUESTOS]: 8 min por pedido suelto, 25 min por
    bandeja, 3 h de compras y 30 min de preparar y limpiar por día abierto. Con ayudante, él solo
    compra y lleva el panel (~5 h); el ayudante arma."""
    if ex.get("ayudante"):
        return 5.0
    sueltos = (w["pedidos"] - w["ev30"]) / 4.33 * 8 / 60
    return sueltos + w["ev30"] / 6 / 4.33 * 25 / 60 + 3 + 0.5 * 6


S = lambda v: ("−" if v < 0 else "") + f"S/{abs(v):,.0f}"


def main():
    print(f"S/6,000 LÍQUIDOS AL MES, CON TU HORARIO REAL · {N} corridas · mes = 30 días desde el 20-oct")
    print("mediana (y % de casos que llegan a S/6,000) en los meses 1, 3, 6, 9 y 12\n")
    for titulo, ex in ESCENARIOS:
        r = P.simular(SOL, n=N, ex=ex)
        w = r["ventanas"]
        llega = next((k + 1 for k in range(len(w)) if all(y["p50"] >= 6000 for y in w[k:])), None)
        print(titulo)
        print("  " + " · ".join(f"mes {k + 1} {S(w[k]['p50'])} ({w[k]['meta']:.0%})" for k in (0, 2, 5, 8, 11)))
        m3 = w[2]
        print(f"  mes 3: {S(m3['p10'])} a {S(m3['p90'])} · {m3['pedidos'] / 26:.1f} al día · {m3['ev30'] / 6:.0f} bandejas · "
              f"ventas {S(m3['ventas'])} · impuestos {S(m3['impuestos'])} · ~{horas_semana(ex, m3):.0f} h tuyas a la semana · "
              f"S/6,000 sostenidos desde el mes {llega or '— (no en 12 meses)'}\n")


if __name__ == "__main__":
    main()
