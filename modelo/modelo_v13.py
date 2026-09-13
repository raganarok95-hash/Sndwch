# -*- coding: utf-8 -*-
"""
SND//WCH — MODELO v13. 2026-09-13. El camino a S/5,000 (mes 3) y a S/10,000 sostenidos.

QUÉ CAMBIA RESPECTO DEL v12, y por qué cada cambio mueve el resultado.

  1. ⚠ LA META SUBIÓ, Y HAY QUE DECIRLO ANTES DE DAR NINGÚN NÚMERO. El v11/v12 medían
     "S/4,000 desde el mes 3 y S/5,000 desde el mes 6" (decisión del dueño 2026-09-02). El
     pedido de hoy es **S/5,000 desde el mes 3** y **S/10,000 sostenidos** más adelante. No
     es el mismo objetivo movido un poco: el mes 3 pide 25% más sobre un mes que el v12
     proyectaba en NEGATIVO. Comparar las probabilidades de este archivo con las del v12 sin
     notar eso llevaría a leer una caída de probabilidad como un empeoramiento del negocio.

  2. LA PUBLICIDAD DEJA DE SER UN GASTO FIJO MENSUAL Y PASA A SER UNA DECISIÓN. Todos los
     modelos anteriores recorrían "¿y si gasto S/X todos los meses?". El plan aprobado el
     2026-09-13 no es eso: son **S/300 con tope duro para MEDIR**, y recién después se
     decide escalar, cortar, o quedarse. Esto no es un detalle de presupuesto — cambia la
     FORMA de la distribución: le corta la cola izquierda, porque el escenario "el CAC era
     malísimo y gasté S/6,000/mes durante un año" deja de existir.

  3. ⚠ EL MOTOR NO TIENE CANAL ORGÁNICO, Y ESO NO SE HABÍA DICHO NUNCA. En el v11
     `nuevos = comprados + referidos`: todo cliente del mundo o se compró con publicidad o
     lo trajo un referido. Nadie encuentra el negocio por Google, por el QR de la bolsa, por
     pasar por la puerta o porque un amigo le contó SIN usar el código. Eso es un supuesto
     fortísimo y **pesimista**, y estaba invisible.
     Acá entra como parámetro explícito y se RECORRE, nunca se fija: es justo lo que la
     ventana sin publicidad de las primeras dos semanas va a medir (ver `lineaBaseOrganica`
     en el servidor). Así la simulación dice cuánto VALE esa medición antes de tomarla.

  4. LA CAPACIDAD PASA A SER PROTAGONISTA. A S/5,000 nadie la toca. A S/10,000 sí, y el
     resultado no es el que uno espera — ver el bloque final.

REGLA DE CONSTRUCCIÓN: [MEDIDO] [FUENTE] [AGENCIA] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import os
import sys
from math import ceil, exp, sqrt
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import modelo_v11 as M  # noqa: E402

random.seed(20260913)

MESES = 24                 # [MÉTODO] igual que meta_5000_sostenido: 12 es una ventana que corta
N = 4000                   # corridas por celda

META_M3 = 5000.0           # [DECISIÓN] dueño 2026-09-13
META_SOST_A = 5000.0
META_SOST_B = 10000.0      # [DECISIÓN] dueño 2026-09-13

# Extender el horizonte del motor. `corrida` y sus auxiliares leen estos globales.
M.CAL = M._calendario(M.APERTURA, MESES)
M.ETIQ = [c[2] for c in M.CAL]
M.DIAS = [c[3] for c in M.CAL]
M.HORIZONTE = len(M.CAL)
ETIQ, DIAS, H = M.ETIQ, M.DIAS, M.HORIZONTE

TECHO_CAC = 13.63          # [DERIVADO] `cacTechoPrimerPedido()` en el servidor


# ═══════════════════════════════════════════════════════════════════════════════════════
# LA POLÍTICA DE PUBLICIDAD — medir, y recién después decidir
# ═══════════════════════════════════════════════════════════════════════════════════════
# [DECISIÓN] Plan aprobado 2026-09-13 (`docs/CAMPANA_DE_ANUNCIOS.md`):
#   · meses 1-2: CERO publicidad. Es la ventana de la línea base orgánica, que solo se puede
#     levantar una vez y no se puede reconstruir después.
#   · mes 3: S/300 con tope duro, para MEDIR el CAC.
#   · mes 4 en adelante: se decide con el intervalo 1/√n contra el techo.
#
# El dueño NO ve el CAC verdadero: ve uno medido, con dos sesgos que empujan en direcciones
# opuestas y que el modelo reproduce por separado.
MES_MEDICION = 2           # índice base 0 → el tercer mes
PRESUPUESTO_MEDICION = 300.0


def cac_observado(cac_real, conv, organicos_atribuidos, gasto, corregido):
    """Lo que el dueño LEE en el panel, que no es el CAC verdadero.

    [MÉTODO] Dos sesgos, y el orden importa:
      · ATRIBUCIÓN: los clientes orgánicos entran al denominador porque no traen referidor.
        Abarata el número. Es la dirección peligrosa —hace escalar un canal que pierde— y es
        la que Gordon, Zettelmeyer, Bhargava y Chapsky midieron en Facebook: la atribución
        observacional exagera el efecto de la publicidad.
      · RUIDO DE CONTEO: con pocas conversiones el número baila ±1/√n (Poisson).

    `corregido=True` modela la línea base orgánica ya construida en el servidor: se resta el
    ritmo orgánico antes de dividir, así que el sesgo de atribución desaparece y queda solo
    el ruido. Es exactamente lo que separa a este modelo del v12.
    """
    denom = conv + (0.0 if corregido else organicos_atribuidos)
    if denom <= 0:
        return None, None
    medido = gasto / denom
    n_efectivo = max(1.0, denom)
    margen = 1.0 / sqrt(n_efectivo)
    # El ruido se aplica al número medido, no al real: es lo que el dueño ve.
    medido *= exp(random.gauss(-margen ** 2 / 2, margen))
    return medido, margen


def decision_publicidad(medido, margen, pauta_si_sirve):
    """[DECISIÓN] La regla del freno, tal cual quedó en el panel: se actúa solo cuando el
    intervalo cae ENTERO de un lado del techo. En la banda de empate NO se escala — se
    mantiene el gasto de medición, que es lo que el documento llama 'ese ES el veredicto'."""
    if medido is None:
        return 0.0
    lo, hi = medido * (1 - margen), medido * (1 + margen)
    if hi < TECHO_CAC:
        return pauta_si_sirve      # el intervalo entero por debajo: escalar
    if lo > TECHO_CAC:
        return 0.0                 # el intervalo entero por encima: cortar
    return PRESUPUESTO_MEDICION    # empate: ni escalar ni apagar


# ═══════════════════════════════════════════════════════════════════════════════════════
# UNA CORRIDA
# ═══════════════════════════════════════════════════════════════════════════════════════
def corrida(organico_dia, viral, contrib=None, pauta_si_sirve=3000.0,
            corregido=True, fcac=1.0, saturacion=M.SATURACION_POR_MIL):
    """`organico_dia` = clientes NUEVOS por día que llegan sin publicidad y sin referido.
    Es el parámetro que la ventana sin gasto va a medir; acá se recorre, no se fija."""
    contrib = M.CONTRIB_PEDIDO if contrib is None else contrib
    perf = M.PERFILES[(random.randrange(len(M.R1_GRID)), random.randrange(len(M.GAP_GRID)))]
    cac_base = M.cac_meta(random.uniform(M.CPM_MIN, M.CPM_MAX)) * fcac

    nuevos = [0.0] * H
    netos, ped_mes, ads_mes, pers_mes = [], [], [], []
    acumulados, personal_previo, ped_prev = 0.0, 1, 0.0
    ads, decidido = 0.0, False

    for m in range(H):
        if m == MES_MEDICION:
            ads = PRESUPUESTO_MEDICION
        frio = (M.COLD_START_MULT - (M.COLD_START_MULT - 1.0) * m / M.COLD_START_MESES) \
            if m < M.COLD_START_MESES else 1.0
        sat = 1.0 + saturacion * (acumulados / 1000.0)
        cac_limpio = cac_base * frio * sat

        comprados, _cac_ef, _salio = M.clientes_comprados(ads, cac_limpio, M.PENAL_APRENDIZAJE) \
            if ads > 0 else (0.0, cac_limpio, False)
        referidos = ped_prev * viral
        organicos = organico_dia * DIAS[m]
        nuevos[m] = comprados + referidos + organicos
        acumulados += nuevos[m]

        # La decisión se toma con lo medido en el mes de medición, no con la verdad.
        if m == MES_MEDICION and not decidido:
            medido, margen = cac_observado(cac_limpio, comprados, organicos, ads, corregido)
            ads_siguiente = decision_publicidad(medido, margen, pauta_si_sirve)
            decidido = True

        ped = sum(nuevos[k] * perf[m - k] for k in range(m + 1) if m - k < len(perf))
        ped *= exp(random.gauss(-M.SIGMA_MES ** 2 / 2, M.SIGMA_MES))

        necesarios = max(1, ceil((ped / DIAS[m]) / M.CAP_POR_PERSONA))
        contratados = necesarios - 1
        nuevos_este_mes = max(0, necesarios - personal_previo)
        cap_ef = (necesarios - nuevos_este_mes * (1 - M.RENDIMIENTO_MES_1)) * M.CAP_POR_PERSONA * DIAS[m]
        ped = min(ped, cap_ef)
        personal_previo, ped_prev = necesarios, ped

        generado = (ped * (contrib - M.OVERHEAD_POR_PEDIDO) - M.FIJOS_MES
                    - contratados * M.SUELDO - referidos * M.COSTO_REFERIDO)
        neto = generado - ads

        netos.append(neto); ped_mes.append(ped); ads_mes.append(ads); pers_mes.append(necesarios)
        if m >= MES_MEDICION and decidido:
            ads = ads_siguiente

    return {'netos': netos, 'pedidos': ped_mes, 'ads': ads_mes, 'personas': pers_mes,
            'acumulados': acumulados}


def sostiene_desde(netos, meta):
    """[DERIVADO] El primer mes a partir del cual el neto queda en `meta` o más TODOS los
    meses que siguen. Un pico no cuenta: el dueño pidió un piso."""
    for m in range(H):
        if all(netos[k] >= meta for k in range(m, H)):
            return m
    return None


def evaluar(runs, meta_sost):
    p = M.pct
    return {
        'p_m3': sum(1 for r in runs if r['netos'][2] >= META_M3) / len(runs),
        'p_sost': sum(1 for r in runs if sostiene_desde(r['netos'], meta_sost) is not None) / len(runs),
        'm3': p([r['netos'][2] for r in runs], 0.50),
        'm6': p([r['netos'][5] for r in runs], 0.50),
        'm12': p([r['netos'][11] for r in runs], 0.50),
        'm24': p([r['netos'][23] for r in runs], 0.50),
        'peor': p([min(r['netos']) for r in runs], 0.50),
        'ads24': p([r['ads'][23] for r in runs], 0.50),
        'ped24': p([r['pedidos'][23] / DIAS[23] for r in runs], 0.50),
        'pers24': p([r['personas'][23] for r in runs], 0.50),
        'sost': [sostiene_desde(r['netos'], meta_sost) for r in runs],
    }


def mediana_mes_sostiene(ev):
    ok = [s for s in ev['sost'] if s is not None]
    if not ok:
        return '—'
    return ETIQ[sorted(ok)[len(ok) // 2]]
