# -*- coding: utf-8 -*-
"""
SND//WCH — MODELO v14. 2026-09-13. Parámetros propios, no heredados.

POR QUÉ SE REDERIVAN LOS NÚMEROS EN VEZ DE IMPORTARLOS (pedido del dueño, 2026-09-13:
"obtén los datos de tus propias conclusiones e investigaciones, no antiguas, para no caer en
vicios de modelos anteriores").

Los modelos v7 a v13 se importan entre sí. Eso hace que un número escrito una vez en julio
—y marcado `[SIN MEDIR]` en su propio comentario— siga gobernando la conclusión seis
versiones después, sin que nadie lo vuelva a mirar. Este archivo **re-deriva los tres
parámetros que deciden la respuesta** con investigación de esta sesión, y deja explícito qué
hereda y por qué.

QUÉ SE HEREDA, Y NO ES UN VICIO: los hechos del propio dueño — capacidad de 40 pedidos/día,
costos fijos de S/500, sueldo de S/1,500, calendario de apertura — y la contribución por
pedido, que se DERIVA del catálogo real (precios vigentes, merma medida, envase cotizado).
Esos no son supuestos de modelo: son mediciones del negocio.

QUÉ SE RE-DERIVA, porque decide la respuesta y venía de fuentes viejas:

  1. CUÁNTAS VECES PIDE UN CLIENTE. Es EL número del que depende si la publicidad se paga.
     El modelo heredado lo sacaba de un ajuste sBG calibrado con Bloom/Paytronix.
     [FUENTE propia, 2026-09-13] Genesys, vía grubpac: **solo el 45% de los clientes nuevos
     de delivery vuelve a pedir**; de los que hacen un segundo pedido, **~85% hace un
     tercero**; pasado el tercero, **60%+ sigue comprando**. De ahí sale una cadena explícita
     en vez de un ajuste opaco.

  2. EL CAC. El heredado usaba CTR 2.97% y CVR 1.89% como si fueran EL dato.
     [FUENTE propia, 2026-09-13] Los benchmarks 2026 dan **CTR de 1.85% (Alimentos y
     Bebidas) a 2.97% (Restaurantes)** y **CVR de 1.54% (Comida y Bebida, campañas de
     conversión) a 1.89%**. O sea que el modelo viejo tomó **el extremo optimista de los dos
     rangos a la vez** — y el CAC es inversamente proporcional a ambos, así que el error se
     multiplica.

  3. EL CPM. El heredado usaba S/5-12 de una agencia peruana. Mi búsqueda da
     **US$3-12 para mercados emergentes**, que a tipo de cambio son S/11-45 — un rango que
     no se superpone casi nada con el anterior. **No se elige uno: se recorren los dos**, y
     el resultado de eso es la conclusión más importante de este archivo.

REGLA DE CONSTRUCCIÓN: [MEDIDO] [FUENTE] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import os
import sys
import random
from math import ceil, exp

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comparativa_menu import contrib as _contrib_menu  # noqa: E402

random.seed(20260913)

# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE A — HECHOS DEL NEGOCIO (heredados a propósito: son mediciones, no supuestos)
# ═══════════════════════════════════════════════════════════════════════════════════════
FRAC_BYO        = 0.50     # [SIN MEDIR] mitad ARMA EL TUYO; se mide en el panel
CONTRIB_PEDIDO  = _contrib_menu("actual", FRAC_BYO)   # [DERIVADO] del catálogo vigente
OVERHEAD_PEDIDO = 0.50     # [MÉTODO] gas, frío, coordinación
FIJOS_MES       = 500.0    # [MEDIDO] opera desde casa, sin local
CAP_POR_PERSONA = 40       # [MEDIDO] cocina por tandas; en servicio solo arma
SUELDO          = 1500.0   # [DECISIÓN] dueño
COSTO_REFERIDO  = 7.65     # [MEDIDO] insumo del 15CM de R06 + bebida de R05
IGV             = 0.18
CONTRIB_NETA    = CONTRIB_PEDIDO - OVERHEAD_PEDIDO

from datetime import date, timedelta  # noqa: E402
APERTURA = date(2026, 10, 12)
CERRADO_WEEKDAY = 0        # [MEDIDO] lunes cerrado
MESES = 24


def _dias_op(anio, mes_, desde=None):
    d = date(anio, mes_, 1) if desde is None else desde
    n = 0
    while d.month == mes_:
        if d.weekday() != CERRADO_WEEKDAY:
            n += 1
        d += timedelta(days=1)
    return n


def _calendario(apertura, meses):
    ab = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    out, a, m = [], apertura.year, apertura.month
    for k in range(meses):
        out.append((f"{ab[m-1]}-{str(a)[2:]}", _dias_op(a, m, apertura if k == 0 else None)))
        m += 1
        if m == 13:
            a, m = a + 1, 1
    return out


CAL = _calendario(APERTURA, MESES)
ETIQ = [c[0] for c in CAL]
DIAS = [c[1] for c in CAL]
H = len(CAL)

META_M3 = 3000.0      # [DECISIÓN] dueño 2026-09-13: "es totalmente necesario"
META_5K, META_10K = 5000.0, 10000.0


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE B — RETENCIÓN, DERIVADA DE FUENTE PROPIA (2026-09-13)
# ═══════════════════════════════════════════════════════════════════════════════════════
# [FUENTE] Genesys vía grubpac, delivery de comida:
#   · solo el 45% de los clientes NUEVOS vuelve a pedir  ← "la brecha del segundo pedido"
#   · de los que hacen un 2.º, ~85% hace un 3.º
#   · pasado el 3.º, 60%+ sigue
# Es una cadena de probabilidades condicionales explícita: se puede leer, discutir y
# corregir número por número. Un ajuste sBG calibrado a una esperanza total no se puede.
P_SEGUNDO   = 0.45
P_TERCERO   = 0.85
P_SIGUIENTE = 0.60
# [FUENTE] Paytronix, días entre pedidos. Se conserva porque mi búsqueda no encontró un dato
# mejor, y va MARCADO: es el parámetro peor sostenido de este bloque.
BRECHA_DIAS_MIN, BRECHA_DIAS_MAX = 28.0, 43.1


def cadena_supervivencia(n_max=40):
    """Probabilidad de llegar al pedido n.º k, k = 1, 2, 3, ..."""
    probs = [1.0, P_SEGUNDO, P_SEGUNDO * P_TERCERO]
    while len(probs) < n_max:
        probs.append(probs[-1] * P_SIGUIENTE)
    return probs


def pedidos_por_cliente():
    """[DERIVADO] Esperanza de pedidos por cliente captado. Con las cifras de arriba da 2.41,
    y el modelo heredado daba 2.20 por un camino completamente distinto (ajuste sBG sobre
    otras fuentes). **Dos derivaciones independientes dentro del 10%** — es lo más cerca de
    una validación que se puede llegar sin datos propios."""
    return sum(cadena_supervivencia())


PEDIDOS_POR_CLIENTE = pedidos_por_cliente()


def perfil_pedidos(brecha_dias, horizonte=H):
    """Reparte los pedidos de un cliente en los meses siguientes a su captación."""
    p = [0.0] * horizonte
    for k, prob in enumerate(cadena_supervivencia(), start=1):
        m = int(((k - 1) * brecha_dias) // 30.44)
        if m >= horizonte:
            break
        p[m] += prob
    return p


BRECHA_GRID = [BRECHA_DIAS_MIN + (BRECHA_DIAS_MAX - BRECHA_DIAS_MIN) * i / 5 for i in range(6)]
PERFILES = [perfil_pedidos(g) for g in BRECHA_GRID]


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE C — CAC, DERIVADO DE FUENTE PROPIA (2026-09-13)
# ═══════════════════════════════════════════════════════════════════════════════════════
# ⚠ EL MODELO HEREDADO TOMÓ EL EXTREMO OPTIMISTA DE LOS DOS RANGOS A LA VEZ.
# [FUENTE] Benchmarks 2026 de Meta por industria:
#   · CTR: 1.85% en Alimentos y Bebidas · 2.97% en Restaurantes y Comida
#   · CVR: 1.54% en Comida y Bebida (campañas de conversión) · 1.89% el valor que usaba el v11
# El CAC es inversamente proporcional a los DOS, así que elegir el mejor de cada uno no
# suma el error: lo multiplica.
CTR_MIN, CTR_MAX = 0.0185, 0.0297
CVR_MIN, CVR_MAX = 0.0154, 0.0189

# ⚠ Y EL CPM ES LA INCERTIDUMBRE MÁS GRANDE DE TODO EL EXPEDIENTE.
# [FUENTE heredada] agencia peruana: S/5-12.
# [FUENTE propia 2026-09-13] mercados emergentes: US$3-12 → ~S/11-45 al tipo de cambio.
# Los dos rangos casi no se superponen. No se elige uno: se recorren los dos, y la
# conclusión que sale de eso es la más importante de este archivo.
CPM_ESCENARIOS = {
    'agencia peruana (S/5-12)': (5.0, 12.0),
    'mercados emergentes (S/11-45)': (11.0, 45.0),
    'union de ambos (S/5-45)': (5.0, 45.0),
}


def cac(cpm, ctr, cvr):
    return cpm / (1000 * ctr * cvr) * (1 + IGV)


def techo_cac(factor_confianza=1.0):
    """[DERIVADO] Lo que deja un cliente en TODA su vida, no en su primer pedido.

    ⚠ ESTE ES EL CAMBIO QUE PIDIÓ EL DUEÑO. El freno vigente usa S/13.63 = un solo pedido, y
    con eso apaga la publicidad siempre. Pero si la publicidad es REINVERSIÓN, el techo
    correcto es el del cliente completo: 2.41 pedidos × S/13.63 ≈ S/33.

    `factor_confianza` < 1 porque la repetición de ESTE negocio no está medida — 2.41 sale de
    fuentes de industria. Se recorre, nunca se fija."""
    return round(PEDIDOS_POR_CLIENTE * CONTRIB_NETA * factor_confianza, 2)


# ═══════════════════════════════════════════════════════════════════════════════════════
# BLOQUE D — UNA CORRIDA
# ═══════════════════════════════════════════════════════════════════════════════════════
SIGMA_MES = 0.18            # [MÉTODO] ruido mensual
COLD_MULT, COLD_MESES = 1.6, 4
SATURACION_POR_MIL = 0.10   # [SIN MEDIR] el CAC sube 10% por cada 1,000 captados
RENDIMIENTO_MES_1 = 0.6
CONV_APRENDIZAJE_MES = 50.0 * 30.44 / 7.0
PENAL_APRENDIZAJE = 1.30    # [SIN MEDIR] castigo por no salir de aprendizaje


def _comprados(ads, cac_limpio):
    if ads <= 0:
        return 0.0
    n = ads / (cac_limpio * PENAL_APRENDIZAJE)
    for _ in range(40):
        falta = max(0.0, 1.0 - n / CONV_APRENDIZAJE_MES)
        n = ads / (cac_limpio * (1.0 + (PENAL_APRENDIZAJE - 1.0) * falta))
    return n


def corrida(ads_lanzamiento, meses_lanzamiento, reinversion, viral, organico_dia,
            cpm_rango=(5.0, 12.0), sueldo_dueno=0.0, factor_confianza=1.0,
            contrib=None, tope_ads=None, cohorte_lanzamiento=0.0, decaimiento_organico=1.0):
    """`cohorte_lanzamiento`: clientes que entran de golpe el PRIMER mes y no se compran ni
    se refieren — la red personal del dueño, avisada a mano. Ningún modelo de este repo la
    tuvo, y es el único canal que ya existe el día 1 y no depende de ninguna subasta.

    `decaimiento_organico`: factor mensual sobre el ritmo orgánico. Un lanzamiento hace ruido
    y después baja; asumir el mismo ritmo 24 meses sería el optimismo que este archivo evita."""
    contrib = CONTRIB_PEDIDO if contrib is None else contrib
    cneta = contrib - OVERHEAD_PEDIDO
    perf = PERFILES[random.randrange(len(PERFILES))]
    cac_base = cac(random.uniform(*cpm_rango),
                   random.uniform(CTR_MIN, CTR_MAX),
                   random.uniform(CVR_MIN, CVR_MAX))
    techo = PEDIDOS_POR_CLIENTE * cneta * factor_confianza

    nuevos = [0.0] * H
    netos, ped_mes, ads_mes, pers_mes, caja = [], [], [], [], []
    acumulados, personal_previo, ped_prev, acum = 0.0, 1, 0.0, 0.0
    ads = ads_lanzamiento

    for m in range(H):
        frio = (COLD_MULT - (COLD_MULT - 1.0) * m / COLD_MESES) if m < COLD_MESES else 1.0
        sat = 1.0 + SATURACION_POR_MIL * (acumulados / 1000.0)
        cac_limpio = cac_base * frio * sat

        # El freno sigue existiendo, contra el techo del CLIENTE COMPLETO. Si ni el valor de
        # vida cubre lo que cuesta comprarlo, gastar más no es reinvertir: es perder más
        # rápido. Reinvertir no es gastar a ciegas.
        if cac_limpio > techo:
            ads = 0.0

        comprados = _comprados(ads, cac_limpio)
        referidos = ped_prev * viral
        organicos = organico_dia * (decaimiento_organico ** m) * DIAS[m]
        cohorte = cohorte_lanzamiento if m == 0 else 0.0
        nuevos[m] = comprados + referidos + organicos + cohorte
        acumulados += nuevos[m]

        ped = sum(nuevos[k] * perf[m - k] for k in range(m + 1) if m - k < len(perf))
        ped *= exp(random.gauss(-SIGMA_MES ** 2 / 2, SIGMA_MES))

        necesarios = max(1, ceil((ped / DIAS[m]) / CAP_POR_PERSONA))
        contratados = necesarios - 1
        nuevos_este = max(0, necesarios - personal_previo)
        cap_ef = (necesarios - nuevos_este * (1 - RENDIMIENTO_MES_1)) * CAP_POR_PERSONA * DIAS[m]
        ped = min(ped, cap_ef)
        personal_previo, ped_prev = necesarios, ped

        generado = (ped * cneta - FIJOS_MES - contratados * SUELDO
                    - referidos * COSTO_REFERIDO - sueldo_dueno)
        neto = generado - ads
        acum += neto

        netos.append(neto); ped_mes.append(ped); ads_mes.append(ads)
        pers_mes.append(necesarios); caja.append(acum)

        base = ads_lanzamiento if m + 1 < meses_lanzamiento else 0.0
        ads = base + max(0.0, reinversion * generado)
        if tope_ads is not None:
            ads = min(ads, tope_ads)

    return {'netos': netos, 'pedidos': ped_mes, 'ads': ads_mes, 'personas': pers_mes,
            'caja': caja, 'acumulados': acumulados}


def pct(xs, p):
    ys = sorted(xs)
    return ys[min(len(ys) - 1, max(0, int(round((len(ys) - 1) * p))))]


def sostiene_desde(netos, meta):
    for m in range(H):
        if all(netos[k] >= meta for k in range(m, H)):
            return m
    return None


def evaluar(runs):
    return {
        'p_m3': sum(1 for r in runs if r['netos'][2] >= META_M3) / len(runs),
        'p_5k': sum(1 for r in runs if sostiene_desde(r['netos'], META_5K) is not None) / len(runs),
        'p_10k': sum(1 for r in runs if sostiene_desde(r['netos'], META_10K) is not None) / len(runs),
        'm3': pct([r['netos'][2] for r in runs], 0.50),
        'm6': pct([r['netos'][5] for r in runs], 0.50),
        'm12': pct([r['netos'][11] for r in runs], 0.50),
        'm24': pct([r['netos'][23] for r in runs], 0.50),
        # ⚠ EL POZO DE CAJA: lo más negativo que llega a estar la caja acumulada. Con
        # reinversión es EL número que decide si el plan existe — es la plata que hay que
        # tener antes de empezar. Se reporta también el caso malo (p10), porque quedarse sin
        # caja no es un mal mes: es el final.
        'pozo_p50': pct([min(r['caja']) for r in runs], 0.50),
        'pozo_malo': pct([min(r['caja']) for r in runs], 0.10),
        'ped_m3': pct([r['pedidos'][2] / DIAS[2] for r in runs], 0.50),
        'ped_m24': pct([r['pedidos'][23] / DIAS[23] for r in runs], 0.50),
        'ads_m3': pct([r['ads'][2] for r in runs], 0.50),
    }
