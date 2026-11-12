#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SND//WCH — margen_por_canal: lo que deja CADA sándwich vendido en la web contra Rappi y PedidosYa.

Responde «¿dónde me conviene vender cada cosa?» con lo que ya está en el repo, sin ventas:
- precio web: la carta (modelo/carta.json; en producción manda catalog_prices: verificar ahí
  antes de decidir nada de precio, que además es decisión del dueño)
- costo: supabase/functions/_shared/costos.ts, el mismo que usan los correos (exportar_costos.py)
- apps: carta 10% más cara [DECISIÓN 2026-10-09]; Rappi 26% desde el mes 2 [OFERTA 2026-10-16,
  falta saber si es + IGV] y el mes 1 0% de comisión con 30% de descuento obligatorio;
  PedidosYa 22–30% [SIN DATO en Perú: se muestra el rango].

Uso: python3 modelo/margen_por_canal.py
"""
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import exportar_costos as E  # noqa: E402
import proyeccion as P  # noqa: E402
import rentabilidad_por_parte as R  # noqa: E402

CULQI = R.CULQI
RAPPI = 0.26
PYA = (0.22, 0.30)
PYA_FIJO_MES = 50.0   # [DUEÑO 2026-11-12] PedidosYa cobra S/50 al mes fijos, además de su comisión


def deja(precio, costo, comision):
    return precio * (1 - comision) - costo


def filas():
    c = E.construir()
    for sid, s in c["sig"].items():
        fila = E.SIG_TODOS[sid]
        for i, t in enumerate(E.TAM):
            precio = fila[6 + i]
            yield (f"{fila[0]} {t}CM", precio, s["costo"][t])


def main():
    print(f"\n  {'producto':<26} {'web':>6} {'costo':>6} │ {'yape':>6} {'tarj.':>6} │ {'rappi m1':>8} {'rappi':>6} │ {'pya':>12}")
    print("  " + "─" * 92)
    for nombre, precio, costo in filas():
        app = precio * (1 + P.SOBREPRECIO_APPS)
        m1 = app * (1 - P.RAPPI_DESCUENTO_MES1) - costo
        print(f"  {nombre:<26} {precio:>6.2f} {costo:>6.2f} │ {deja(precio, costo, 0):>6.2f} {deja(precio, costo, CULQI):>6.2f} │"
              f" {m1:>8.2f} {deja(app, costo, RAPPI):>6.2f} │ {deja(app, costo, PYA[1]):>5.2f}–{deja(app, costo, PYA[0]):<5.2f}")
    print("""
  Soles que deja UN sándwich con insumos y empaque ya restados (empaque conservador), antes de fijos.
  Tarjeta: −5.5% de Culqi. Precios de la semilla de la carta: el real está en catalog_prices.
  rappi m1 = el primer mes (sin comisión, con 30% de descuento obligatorio). pya = rango sin dato.
""")
    peor = min(deja(precio * (1 + P.SOBREPRECIO_APPS), costo, PYA[1]) for _n, precio, costo in filas() if "15CM" in _n)
    print(f"  PedidosYa además cobra S/{PYA_FIJO_MES:.0f} al mes fijos: se cubren con {-(-PYA_FIJO_MES // peor):.0f} sándwiches 15CM al mes"
          f" (peor caso, S/{peor:.2f} c/u). Por pedido: S/{PYA_FIJO_MES/30:.2f} con 1 al día, S/{PYA_FIJO_MES/90:.2f} con 3.\n")


if __name__ == "__main__":
    main()
