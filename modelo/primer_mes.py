# -*- coding: utf-8 -*-
"""
SND//WCH — ¿RENTABLES DESDE EL PRIMER MES? CADA PALANCA, MEDIDA (2026-10-15)

Dueño: «Busca puntos exactos donde mejorar para poder ser totalmente rentables desde el primer
mes, sino el negocio morirá, dame todas las formas. Repiénsalo y encuentra algo viable».

El PRIMER MES son los 30 días desde que se abre (20-oct a 18-nov), con los fijos de esos 30 días
y la cuota del Nuevo RUS. Usa el motor de `proyeccion.py` (mismos supuestos, mismas corridas) y le
suma lo que ese motor no veía: la comida que se vence a bajo volumen.

Uso: python3 modelo/primer_mes.py [corridas]
"""
import contextlib
import io
import os
import sys
from datetime import date

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
with contextlib.redirect_stdout(io.StringIO()):
    import proyeccion as P                     # noqa: E402
import insumos as I                            # noqa: E402

N = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 800
APERTURA = date(2026, 10, 20)

# [SUPUESTO] Lo que se vence en una semana si se tiene TODA la carta lista (pan sub comprado «por si
# acaso», verduras, dos quesos y dos fiambres abiertos, atún preparado, salsas): ~S/85 por semana.
# Con el control (pan por pedido o congelado, fiambres y carnes en porciones congeladas, verduras
# mínimas, «Abro con N porciones»): ~S/20. Cada pedido consume el 60% de su costo en perecibles.
MERMA_SIN_CONTROL = (85.0, 0.60)
MERMA_CON_CONTROL = (20.0, 0.60)
DESCUENTO_GRUPO = 20.90 / 5        # «con 5, el más barato va gratis»: un 15CM cada 5 pedidos
# [SUPUESTO] Lo que cuestan las palancas que salen a buscar clientes:
#  · muestras para oficinas: 2 oficinas al día, un 15CM partido en 6 bocados cada una (~S/7.50 de
#    insumos el 15CM), durante los primeros 15 días abiertos → S/15 al día;
#  · volantes A6 a una tinta: 1,000 a ~S/0.10 → S/100, repartidos en los primeros 5 días.
MUESTRAS = (15.0, 15)
VOLANTES = (20.0, 5)

BASE = dict(merma=MERMA_SIN_CONTROL)   # HOY, con la merma que el modelo no veía

PALANCAS = [
    # (nombre, sol, ex extra, qué hay que hacer)
    ("Bolsa lisa + sellos (S/0.50 por pedido)", (), dict(empaque=I.EMPAQUE_BOLSA_LISA),
     "comprar las bolsas kraft lisas y los 2 sellos (ya decidido)"),
    ("Sin la prueba de Meta en el primer mes", (), dict(sin_prueba=True),
     "mover los S/350 a cuando haya 2 pedidos al día o Instagram vinculado"),
    ("Merma controlada", (), dict(merma=MERMA_CON_CONTROL),
     "pan por pedido o congelado, fiambres y carnes en porciones congeladas, «Abro con N porciones»"),
    ("Oficinas desde el día 1 (+0.5 clientes/día)", (), dict(oficinas=0.5, oficinas_desde=APERTURA, gastos=[MUESTRAS]),
     "visitar 2 oficinas por día con un 15CM partido en bocados y el enlace del pedido en grupo (muestras ~S/225)"),
    ("Un pedido fijo de oficina (6 por semana desde la 2.ª semana)", (), dict(oficina_fija=(6, date(2026, 10, 27)), descuento_grupo=DESCUENTO_GRUPO),
     "cerrar con UNA oficina un almuerzo fijo semanal (pedido fijo del panel)"),
    ("Volanteo de lanzamiento (+0.3 clientes/día, 3 semanas)", (), dict(volanteo=(0.3, 18), gastos=[VOLANTES]),
     "1,000 volantes con QR y código DIRECTO en edificios y condominios a 2 km (~S/100)"),
    ("Rappi trabajado (+30%)", (), dict(rappi_factor=1.3),
     "fotos reales, combo y promo propia mientras la comisión es 0%"),
    ("PedidosYa desde el 3-nov", (), dict(pya_desde=date(2026, 11, 3)),
     "terminar el alta de PedidosYa esta semana"),
    ("Ticket: bebida ofrecida + 30CM como «el doble»", ("ticket",), {},
     "ya está en el carrito; reforzarlo en Rappi con combos"),
    ("Referidos con botón de WhatsApp", ("referidos",), {},
     "pedir el reenvío al entregar, con el enlace listo"),
    ("Fijos −S/100 al mes", (), dict(fijos=P.FIJOS_MES - 100),
     "revisar los S/500 (planes, suscripciones) y bajar lo que no se usa"),
    ("TikTok con los mismos videos (+0.2/día)", (), dict(tiktok=0.2),
     "abrir la cuenta y subir los mismos videos"),
]


def correr(sol, ex):
    r = P.simular(sol, n=N, ex=ex)
    pm = r["primer_mes"]
    return pm, float(np.median(r["total"])), r


S = lambda v: ("−" if v < 0 else "+" if v > 0 else "") + f"S/{abs(v):,.0f}"

if __name__ == "__main__" and "--ajustado" not in sys.argv:
    base_pm, base_6, _ = correr((), BASE)
    hoy_pm, _, _ = correr((), {})
    print(f"PRIMER MES (20-oct a 18-nov) · {N} corridas · caso malo / medio / bueno = 1 de 10 / mitad / 9 de 10\n")
    print(f"Como está el modelo (sin merma):  {S(hoy_pm['p50'])}  ({S(hoy_pm['p10'])} a {S(hoy_pm['p90'])}) · gana en {hoy_pm['positivo']:.0%} de los casos")
    print(f"HOY con la merma real:            {S(base_pm['p50'])}  ({S(base_pm['p10'])} a {S(base_pm['p90'])}) · gana en {base_pm['positivo']:.0%} · "
          f"{base_pm['pedidos']:.0f} pedidos · merma {S(base_pm['merma'])} · 6 meses {S(base_6)}\n")
    print("Cada palanca SOLA, sobre HOY con merma (cambio en el primer mes · cambio en 6 meses):")
    filas = []
    for nombre, sol, extra, como in PALANCAS:
        ex = dict(BASE, **extra)
        pm, t6, _ = correr(sol, ex)
        filas.append((pm["p50"] - base_pm["p50"], nombre, pm, t6 - base_6, como))
    for d, nombre, pm, d6, como in sorted(filas, key=lambda x: -x[0]):
        print(f"  {S(d):>8} · 6m {S(d6):>8}  {nombre}  → {como}")

    # EL PLAN: lo que no toca precios ni pide plata, y lo que depende solo del dueño
    plan_sol = ("ticket", "referidos", "recompra")
    plan_ex = dict(merma=MERMA_CON_CONTROL, empaque=I.EMPAQUE_BOLSA_LISA, sin_prueba=True,
                   oficinas=0.5, oficinas_desde=APERTURA, oficina_fija=(6, date(2026, 10, 27)),
                   descuento_grupo=DESCUENTO_GRUPO, volanteo=(0.3, 18), rappi_factor=1.3,
                   pya_desde=date(2026, 11, 3), gastos=[MUESTRAS, VOLANTES])
    for titulo, sol, ex in (
        ("PLAN VIABLE (todo lo de arriba menos fijos y TikTok)", plan_sol, plan_ex),
        ("PLAN sin el pedido fijo de oficina", plan_sol, {k: v for k, v in plan_ex.items() if k not in ("oficina_fija", "descuento_grupo")}),
        ("PLAN sin oficinas (ni visitas ni pedido fijo)", plan_sol, dict({k: v for k, v in plan_ex.items() if k not in ("oficina_fija", "descuento_grupo", "oficinas", "oficinas_desde")}, gastos=[VOLANTES])),
        ("SOLO lo que no depende de vender más (empaque, sin prueba, merma)", (), dict(merma=MERMA_CON_CONTROL, empaque=I.EMPAQUE_BOLSA_LISA, sin_prueba=True)),
    ):
        pm, t6, r = correr(sol, ex)
        print(f"\n{titulo}")
        print(f"  primer mes {S(pm['p50'])} ({S(pm['p10'])} a {S(pm['p90'])}) · gana en {pm['positivo']:.0%} de los casos · "
              f"{pm['pedidos']:.0f} pedidos ({pm['pedidos'] / 26:.1f} al día) · ventas {S(pm['ventas'])} · merma {S(pm['merma'])}")
        print("  " + " · ".join(f"{m['mes']} {S(m['p50'])}" for m in r["meses"]) + f" · 6 meses {S(t6)}")

    # Cuánto hace falta: pedidos al día en el primer mes para no perder (con el plan de costos)
    e = P.pedido()
    deja = e["propio"] + (I.por_sandwich(I.EMPAQUE_PEDIDO, sand_por_pedido=1) - I.por_sandwich(I.EMPAQUE_BOLSA_LISA, sand_por_pedido=1))
    print(f"\nEquilibrio del primer mes con bolsa lisa y sin prueba: {(P.FIJOS_MES * 30 / 30.4 + 20 + MERMA_CON_CONTROL[0] * 30 / 7) / deja / 26:.1f} pedidos propios al día "
          f"(cada uno deja S/{deja:.2f})")


# ══════════════════════════════════════════════════════════════════
# AJUSTADO CON LAS RESPUESTAS DEL DUEÑO (2026-10-15, tarde)
# ══════════════════════════════════════════════════════════════════
# «Compra de bolsas lisas y sellos ya está realizado» · «todo se congela» · «me cobran 15 soles
# por el envío del pan» · «todos abren juntos PedidosYa, Rappi y la web» · «movemos la prueba al
# inicio» · «no puedo ofrecer a 2 oficinas al día, tengo un trabajo fijo formal».
PAN_ENVIO = (15.0 / 6, 10_000)     # S/15 por envío, un envío por semana (el pan se congela)
HOY_REAL = dict(
    empaque=I.EMPAQUE_BOLSA_LISA, merma=MERMA_CON_CONTROL, gastos=[PAN_ENVIO],
    pya_desde=APERTURA, prueba_desde=APERTURA, prueba_hasta=date(2026, 11, 16),
)
# Oficinas sin visitas diarias: mensajes a las 10 de la lista y una visita al paso por semana
# [SUPUESTO] +0.15 clientes al día, ~S/50 de muestras en total.
OFICINAS_LIGERO = dict(oficinas=0.15, oficinas_desde=APERTURA, gastos=[PAN_ENVIO, (5.0, 10)])
OFICINA_FIJA = dict(oficina_fija=(6, date(2026, 11, 3)), descuento_grupo=DESCUENTO_GRUPO)
VOLANTEO = dict(volanteo=(0.3, 18))


def ajustado():
    print("\n\n══ AJUSTADO CON TUS RESPUESTAS (bolsa lisa comprada, todo congelado, pan S/15 por envío,")
    print("   PedidosYa desde el 20, prueba de Meta del 20-oct al 16-nov, sin visitas diarias) ══")
    escenarios = [
        ("Así abre hoy", (), HOY_REAL),
        ("+ Rappi trabajado", (), dict(HOY_REAL, rappi_factor=1.3)),
        ("+ volantes o stickers (~S/100)", (), dict(HOY_REAL, rappi_factor=1.3, **VOLANTEO, gastos=[PAN_ENVIO, VOLANTES])),
        ("+ bebida, 30CM, referidos y recompra", ("ticket", "referidos", "recompra"), dict(HOY_REAL, rappi_factor=1.3, **VOLANTEO, gastos=[PAN_ENVIO, VOLANTES])),
        ("+ oficinas por mensaje y al paso", ("ticket", "referidos", "recompra"), dict(HOY_REAL, rappi_factor=1.3, **VOLANTEO, **{k: v for k, v in OFICINAS_LIGERO.items() if k != "gastos"}, gastos=[PAN_ENVIO, VOLANTES, (5.0, 10)])),
        ("+ UN almuerzo fijo de oficina desde el 3-nov", ("ticket", "referidos", "recompra"), dict(HOY_REAL, rappi_factor=1.3, **VOLANTEO, **{k: v for k, v in OFICINAS_LIGERO.items() if k != "gastos"}, **OFICINA_FIJA, gastos=[PAN_ENVIO, VOLANTES, (5.0, 10)])),
        ("Lo mismo, pero la prueba de Meta después (dic)", ("ticket", "referidos", "recompra"), dict(HOY_REAL, rappi_factor=1.3, **VOLANTEO, **{k: v for k, v in OFICINAS_LIGERO.items() if k != "gastos"}, **OFICINA_FIJA, gastos=[PAN_ENVIO, VOLANTES, (5.0, 10)], sin_prueba=True)),
    ]
    for titulo, sol, ex in escenarios:
        pm, t6, r = correr(sol, ex)
        print(f"\n{titulo}")
        print(f"  primer mes {S(pm['p50'])} ({S(pm['p10'])} a {S(pm['p90'])}) · gana en {pm['positivo']:.0%} · "
              f"{pm['pedidos']:.0f} pedidos ({pm['pedidos'] / 26:.1f} al día) · ventas {S(pm['ventas'])}")
        print("  " + " · ".join(f"{m['mes']} {S(m['p50'])}" for m in r["meses"]) + f" · 6 meses {S(t6)}")


if __name__ == "__main__" and "--ajustado" in sys.argv:
    ajustado()
