# -*- coding: utf-8 -*-
"""
SND//WCH — S/6,000 LÍQUIDOS AL MES, CON EL HORARIO REAL DEL DUEÑO (2026-10-15)

Dueño: «No haré volantes… La meta sería al menos 6000 líquidos al mes (incluyendo mi propio
sueldo)». Y después, sobre el primer plan (oficinas con ayudante): «Yo armo, pero primero revisa
la viabilidad de tu plan de oficina… Dame planes distintos con los cuales llegar a la meta,
mejores, más viables y con menos esfuerzo» · «mi sueldo es de 6000» · «RUC 10, puedo sacar RUC
20 cuando lleguemos a la meta» · «[a mi trabajo] solo ofrecerles informalmente, trabajo en un
banco» · degustaciones «luego del mes 6, cuando ya seamos rentables».

LO QUE ESO FIJA: arma él solo; de martes a viernes trabaja en el banco, así que de día no se
cocina (se atiende de noche y el fin de semana); sin ayudante, sin degustaciones, sin volantes,
sin tocar precios; RUC 10 en el Nuevo RUS hasta que convenga el Régimen MYPE.

«Líquidos» = ganancia del mes ANTES de su sueldo, después de impuestos, fijos y lo que cuesta
conseguir clientes. Mes = 30 días desde la apertura (el 1 va del 20-oct al 18-nov). Simulación
sobre `proyeccion.py`, a 12 meses: no hay un solo pedido real, y las bandejas, el banco y los
aliados se dan por vendidos (el modelo no sortea si se venden; eso es lo que hay que medir).

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

# ── Con el horario real [SUPUESTOS marcados] ──────────────────────────────────────────────
# De martes a viernes se abre solo de noche: se pierde el 40% de los clientes nuevos de esos días
# [SUPUESTO: la parte que pide al mediodía]. Capacidad 35 al día: una persona, en sus horas.
# Nuevo RUS hasta pasar S/8,000 de ventas en un mes; ahí Régimen MYPE con su RUC 10 (no hace
# falta el RUC 20), contador S/200, casi todas las compras con factura y el IGV de restaurante.
REAL = dict(PM.HOY_REAL, rappi_factor=1.3, gastos=[PM.PAN_ENVIO], almuerzo_cerrado=(0.4, None),
            capacidad=35, contador=200.0, compras_con_factura=0.9, igv_reducido=True)


# ── Los cuatro motores ───────────────────────────────────────────────────────────────────
# BANDEJA: 6 sándwiches de 30CM cortados en 4 (10-12 personas), por encargo, a precio de carta.
# Cada 30CM deja ~S/21. La comen 10-12 personas: deja 0.05 clientes nuevos por 30CM [SUPUESTO:
# ~2.5% de los que la prueban pide después]. Llega a `meta` bandejas al mes en 4 escalones, del
# 7-nov al 19-dic (las primeras se venden a tu gente; diciembre trae las reuniones de fin de año).
def bandejas(meta, desde=date(2026, 11, 7), hasta=date(2026, 12, 19)):
    paso = (hasta - desde) / 3
    return [(desde + paso * i, meta / 4, 6) for i in range(4)]


# TU BANCO, informal: ~8 compañeros por semana [SUPUESTO] con almuerzo frío que armas en la mañana
# y llevas tú (sin motorizado), en grupo (el 15CM más barato va gratis), + 2 bandejas al mes de
# cumpleaños del mes o despedidas, pagadas entre ellos (boleta).
BANCO = dict(oficina_fija=(8, date(2026, 11, 3)), descuento_grupo=20.90 / 8)
BANCO_BANDEJAS = [(date(2026, 11, 3), 2, 6)]
# ALIADOS: bares, cervecerías, salas de juego o coworkings SIN cocina que ponen el QR en sus mesas,
# con permiso: 10 puntos hacia el 19-dic, cada uno 0.1 clientes nuevos por día abierto [SUPUESTO].
ALIADOS = [(3, date(2026, 11, 7), 0.1), (4, date(2026, 11, 28), 0.1), (3, date(2026, 12, 19), 0.1)]
# PARA COMPARTIR: la cena para dos y el pack del finde: 1.3 sándwiches por pedido en vez de 1
# [SUPUESTO; el modelo suponía 1].
COMPARTIR = dict(sand_por_pedido=1.3)


def todo(n_bandejas, **extra):
    return dict(REAL, **BANCO, **COMPARTIR, aliados=ALIADOS, nuevos_por_30cm=0.05,
                eventos=bandejas(n_bandejas) + BANCO_BANDEJAS, **extra)


# POR ENCARGO (menos horas): todo se pide programado y se arma en tandas; delivery al momento (y
# las apps) solo el sábado y el domingo de noche. Se pierde la mitad de los clientes sueltos
# [SUPUESTO] y los aliados (su gente quiere comer ya). Se quedan las bandejas, el banco y «para
# compartir».
def encargo(n_bandejas):
    return dict(REAL, **BANCO, **COMPARTIR, nuevos_por_30cm=0.05, eventos=bandejas(n_bandejas) + BANCO_BANDEJAS,
                sueltos_factor=0.5, rappi_factor=1.3 * 0.5, encargo=True)


ESCENARIOS = [
    ("Así abres, con tu horario real", REAL),
    ("Solo bandejas: 20 al mes", dict(REAL, eventos=bandejas(20), nuevos_por_30cm=0.05)),
    ("Solo tu banco", dict(REAL, **BANCO, eventos=BANCO_BANDEJAS, nuevos_por_30cm=0.05)),
    ("Solo aliados: 10 bares o coworkings con tu QR", dict(REAL, aliados=ALIADOS)),
    ("Solo «para compartir»", dict(REAL, **COMPARTIR)),
    ("Los cuatro, con 12 bandejas al mes", todo(12)),
    ("Los cuatro, con 30 bandejas al mes", todo(30)),
    ("Los cuatro, con 40 bandejas al mes", todo(40)),
    ("  y si SUNAT trata la bandeja como delivery de restaurante", todo(40, bandeja_es_restaurante=True)),
    ("  cerrando martes y miércoles (menos horas)", todo(40, cerrado_extra=(2, 3))),
    ("Por encargo, 40 bandejas al mes: lo demás programado, apps solo el finde de noche", encargo(40)),
    ("Por encargo, 50 bandejas al mes", encargo(50)),
    ("Por encargo, 60 bandejas al mes", encargo(60)),
]


def horas_semana(ex, w):
    """Horas a la semana fuera del banco [SUPUESTOS]: de guardia 3 h cada noche de martes a viernes
    abierta (19-22) y 10 h el sábado y el domingo (12-22: el panel da una sola franja por día); 3 h
    de compras; 30 min de preparar y
    limpiar por día abierto; 25 min por bandeja y 5 min por almuerzo del banco. «Por encargo»
    solo hace guardia el sábado y el domingo de 18 a 22 (las apps); lo demás llega programado y
    se arma en tandas."""
    bandeja = w["ev30"] / 6 / 4.33 * 25 / 60
    banco = ex.get("oficina_fija", (0, None))[0] * 5 / 60
    if ex.get("encargo"):                        # por encargo: lo programado, 8 min por pedido, en tandas,
        sueltos = (w["pedidos"] - w["ev30"]) / 4.33 * 8 / 60     # y las apps solo sáb-dom 18-22
        return 8 + 3 + 0.5 * 4 + bandeja + banco + sueltos
    cerrados = ex.get("cerrado_extra", ())
    noches = sum(1 for wd in (1, 2, 3, 4) if wd not in cerrados)
    finde = sum(1 for wd in (5, 6) if wd not in cerrados)
    return 3 * noches + 10 * finde + 3 + 0.5 * (noches + finde) + bandeja + banco


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
              f"ventas {S(m3['ventas'])} · impuestos {S(m3['impuestos'])} · ~{horas_semana(ex, m3):.0f} h a la semana · "
              f"S/6,000 sostenidos desde el mes {llega or '— (no en 12 meses)'}\n")


if __name__ == "__main__":
    main()
