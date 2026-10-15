# -*- coding: utf-8 -*-
"""
SND//WCH — ¿S/6,000 LÍQUIDOS AL MES DESDE EL MES 3? (2026-10-15)

Dueño: «No haré volantes. Busquemos una alternativa. Busca en general en lo económico como al
menos igual mi sueldo de forma consistente, desde el mes 3. La meta sería al menos 6000 líquidos
al mes (incluyendo mi propio sueldo), si se puede desde el mes uno, mejor».

«Líquidos» = la ganancia del mes ANTES del sueldo del dueño y DESPUÉS de impuestos, fijos,
ayudante y lo que cuesta conseguir clientes. Cada MES se cuenta desde la apertura, en bloques de
30 días: el mes 1 va del 20-oct al 18-nov; el 3, del 19-dic al 17-ene. Es una SIMULACIÓN sobre el
motor de `proyeccion.py`: no hay un solo pedido real, y lo que se vende a oficinas y en bandejas
se da por CERRADO (la incertidumbre de esa parte es si se cierra, y eso no lo sortea el modelo).

Uso: python3 modelo/meta_6000.py [corridas]
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
    import primer_mes as PM                    # noqa: E402

N = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 600
META = 6000.0
SOL = ("ticket", "referidos", "recompra")      # bebida ofrecida y 30CM, referidos, recompra

# Lo que ya hay: el plan ajustado del primer mes (bolsa lisa, todo congelado, pan S/15 por envío,
# las tres apps desde el 20, la prueba de Meta al inicio, Rappi trabajado, oficinas por mensaje),
# SIN volantes (dueño: «no haré volantes»).
BASE = dict(PM.HOY_REAL, rappi_factor=1.3, oficinas=0.15, oficinas_desde=PM.APERTURA,
            gastos=[PM.PAN_ENVIO, (5.0, 10)])

# Consumo al máximo, sin volantes [SUPUESTOS]: TikTok con los mismos videos (+0.2 clientes al día);
# grupos del condominio y vecinales y canje con microinfluencers de Trujillo (+0.3 al día las 3
# primeras semanas, ~S/150 en producto); Meta S/1,000 al mes desde diciembre SOLO si la prueba
# midió un cliente a menos de S/40.
CONSUMO = dict(BASE, tiktok=0.2, volanteo=(0.3, 18), gastos=[PM.PAN_ENVIO, (5.0, 10), (150 / 18, 18)])

# Lo que se vende por volumen [SUPUESTOS, cada uno se mide en las 2 primeras semanas]:
#  · ALMUERZO DE EQUIPO: una oficina pide UNA vez por semana, en grupo, ~12 sándwiches, con el
#    enlace del pedido en grupo (el organizador recibe el 15CM más barato: 1 de cada 12) y como
#    pedido fijo del panel.
#  · BANDEJA: 6 sándwiches de 30CM cortados en 4 (24 bocados, 10-12 personas), pedida con 1-2 días
#    de anticipación, a precio de carta. Reuniones, capacitaciones, cumpleaños, fiestas de fin de año.
POR_OFICINA = 12
BANDEJA = 6
# El ayudante [SUPUESTO]: 4 horas, de martes a sábado, en planilla de microempresa. La RMV es
# S/1,230 desde el 1-oct-2026 (DS 015-2026-TR): media jornada ~S/615 + EsSalud ~S/111 + extras.
AYUDANTE = 800.0
# Degustación por delivery [SUPUESTO]: 2 sándwiches de 30CM en bocados (~S/23 de insumos) + el
# motorizado (~S/7) a la oficina que respondió el mensaje; 27 en las primeras 6-7 semanas.
DEGUSTACIONES = (30.0 * 27 / 40, 40)


def rampa(n, primero, ultimo):
    if n == 0:
        return []
    paso = (ultimo - primero) / max(n - 1, 1)
    return [primero + paso * i for i in range(n)]


def volumen(oficinas, bandejas_mes, of_hasta=date(2026, 12, 15), band_hasta=date(2026, 12, 5),
            ayudante=AYUDANTE, igv_reducido=True, a_empresas=True):
    """El plan de volumen: `oficinas` almuerzos de equipo que se van cerrando del 3-nov a
    `of_hasta`, y `bandejas_mes` bandejas al mes, que llegan a ese ritmo en 4 escalones hasta
    `band_hasta`. Con ayudante desde el 3-nov, Régimen MYPE desde el 3-nov (las empresas piden
    factura y el Nuevo RUS no la da), contador, y casi todas las compras con factura.
    `a_empresas=False`: las bandejas se venden a familias y grupos con boleta, sin degustaciones,
    y se sigue en el Nuevo RUS mientras no se pase de S/8,000 al mes."""
    ex = dict(BASE, gastos=[PM.PAN_ENVIO, (5.0, 10)] + ([DEGUSTACIONES] if a_empresas else []),
              oficinas_fijas=[(POR_OFICINA, d) for d in rampa(oficinas, date(2026, 11, 3), of_hasta)],
              descuento_grupo=20.90 / POR_OFICINA,
              eventos=[(d, bandejas_mes / 4, BANDEJA) for d in rampa(4, date(2026, 10, 24), band_hasta)] if bandejas_mes else [],
              contador=200.0, compras_con_factura=0.9, igv_reducido=igv_reducido)
    if a_empresas:
        ex["rmt_desde"] = date(2026, 11, 3)
    if ayudante:
        ex.update(ayudante=(ayudante, date(2026, 11, 3)), capacidad=60)
    return ex


ESCENARIOS = [
    ("Lo que ya hay, sin volantes", BASE, 0.0, None),
    ("Todo lo de consumo, sin volantes (TikTok, vecinos, canje, Meta desde dic)", CONSUMO, 1000.0, 40.0),
    ("20 bandejas al mes para familias y grupos, sin ayudante (las haces tú de noche y el fin de semana)",
     volumen(0, 20, ayudante=0, a_empresas=False), 0.0, None),
    ("4 almuerzos de equipo + 20 bandejas, con ayudante", volumen(4, 20), 0.0, None),
    ("META: 8 almuerzos de equipo + 20 bandejas, con ayudante", volumen(8, 20), 0.0, None),
    ("  la misma META si SUNAT no te reconoce el IGV de restaurante", volumen(8, 20, igv_reducido=False), 0.0, None),
    ("  la misma META con ayudante a tiempo completo (S/1,500)", volumen(8, 20, ayudante=1500.0), 0.0, None),
    ("  la misma META a medio ritmo (1 oficina cada 2 semanas, hasta feb)",
     volumen(8, 20, of_hasta=date(2027, 2, 2), band_hasta=date(2027, 1, 9)), 0.0, None),
    ("12 almuerzos de equipo, sin bandejas, con ayudante", volumen(12, 0), 0.0, None),
]

S = lambda v: ("−" if v < 0 else "") + f"S/{abs(v):,.0f}"


def main():
    print(f"¿S/6,000 LÍQUIDOS AL MES? · {N} corridas · mes = 30 días desde el 20-oct · mediana "
          f"(caso malo a bueno = 1 de 10 a 9 de 10) · % = casos que llegan a S/6,000\n")
    for titulo, ex, pauta, cac_max in ESCENARIOS:
        r = P.simular(SOL, n=N, ex=ex, pauta_mes=pauta, si_cac_menor=cac_max)
        w = r["ventanas"]
        print(titulo)
        print("  " + " · ".join(f"mes {k + 1} {S(x['p50'])} ({x['meta']:.0%})" for k, x in enumerate(w)))
        m3 = w[2]
        print(f"  mes 3: {S(m3['p10'])} a {S(m3['p90'])} · {m3['pedidos']:.1f} sándwiches al día "
              f"({m3['propio']:.1f} propios con oficinas + {m3['apps']:.1f} apps + {m3['ev30'] / 26:.1f} de bandeja) · ventas {S(m3['ventas'])} · impuestos {S(m3['impuestos'])}\n")


if __name__ == "__main__":
    main()
