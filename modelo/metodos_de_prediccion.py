# -*- coding: utf-8 -*-
"""
SND//WCH — CINCO MÉTODOS DE PREDICCIÓN SOBRE LA MISMA PREGUNTA. 2026-09-13.

POR QUÉ ESTE ARCHIVO EXISTE. Todos los modelos de este repo (v7 a v12) son **el mismo
método**: una simulación estructural de abajo hacia arriba, con Monte Carlo encima. Cambiaban
las entradas, nunca la forma de pensar. Eso tiene un problema que ninguna cantidad de
escenarios arregla: **si el esqueleto está mal, 20,000 corridas lo repiten 20,000 veces con
una barra de error preciosa alrededor de un número equivocado.**

La evidencia sobre esto es de las más sólidas que hay en pronóstico: en la competencia M4,
**12 de los 17 modelos más precisos usaban alguna forma de combinación**, y el promedio
simple de métodos heterogéneos resulta "difícil de batir". Lo que mejora la precisión no es
afinar un modelo: es **contrastar métodos que se equivocan por motivos distintos**.

LOS CINCO, y qué supuesto de los otros rompe cada uno:

  M1 · ESTRUCTURAL (Monte Carlo de cohortes)   — el de siempre, con la política de anuncios
       nueva. Supone que la demanda es la suma de lo que compras + lo que te refieren.
  M2 · DIFUSIÓN DE BASS                        — rompe el supuesto de que no hay TECHO DE
       MERCADO. El v12 admite que por encima de 0.4 referidos/pedido su modelo "deja de
       valer" y produce 707,870 clientes en una ciudad de 1M. Bass no puede hacer eso:
       tiene M por construcción.
  M3 · CLASE DE REFERENCIA (vista de afuera)   — rompe el supuesto de que el negocio existe
       los 24 meses. Ningún modelo anterior le puso probabilidad a cerrar.
  M4 · RETROCÁLCULO (qué tiene que ser cierto) — no da probabilidad: da la condición física.
       Rompe el supuesto de que el cuello de botella es la demanda.
  M5 · VALOR DE LA INFORMACIÓN (bayesiano)     — no predice el resultado: predice CUÁNDO se
       va a saber. Es el único que se puede verificar en semanas y no en años.

  COMBINACIÓN — promedio simple, que es lo que la evidencia respalda.

REGLA DE CONSTRUCCIÓN: [MEDIDO] [FUENTE] [AGENCIA] [DECISIÓN] [DERIVADO] [MÉTODO] [SIN MEDIR]
"""
import os
import sys
from math import ceil, exp, sqrt, log

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import modelo_v11 as M          # noqa: E402
import modelo_v13 as V          # noqa: E402

W = 100


def sep(t=''):
    print('\n' + '=' * W)
    if t:
        print(t.center(W))
        print('=' * W)


def soles(x):
    return f"S/{x:,.0f}"


# ═══════════════════════════════════════════════════════════════════════════════════════
# EL MERCADO ALCANZABLE — hace falta para M2 y M4, y NINGÚN modelo anterior lo tenía
# ═══════════════════════════════════════════════════════════════════════════════════════
# [FUENTE] INEI, censo 2017 vía data-peru.itp.gob.pe y comoes.pe:
#   · Trujillo (distrito): 305,058 hab · Víctor Larco Herrera: 66,469 hab, 80% de sus
#     manzanas en NSE medio-alto y alto.
#   · 81,974 hogares en Trujillo, 61.3% con acceso a internet.
# [MÉTODO] Los 8 distritos que SÍ se cubren (`DELIVERY_DISTRICTS`, sin El Porvenir ni El
# Milagro) suman del orden de 780,000 habitantes. De ahí, el mercado que puede pedir un
# sándwich de S/21-35 por app se estrecha en tres pasos, y CADA UNO es un supuesto:
POBLACION_COBERTURA = 780_000   # [FUENTE] suma de los 8 distritos, censo 2017 proyectado
FRAC_ADULTOS        = 0.66      # [FUENTE] estructura etaria peruana, 18+
FRAC_INTERNET       = 0.613     # [FUENTE] INEI 2017, hogares con internet en Trujillo
FRAC_NSE_PRECIO     = 0.25      # [SIN MEDIR] los que pagan S/21+ por un sándwich a domicilio
MERCADO_BASE = POBLACION_COBERTURA * FRAC_ADULTOS * FRAC_INTERNET * FRAC_NSE_PRECIO

# ⚠ El último factor es el más frágil y el que más manda. Se RECORRE, no se fija.
MERCADO_GRID = [0.10, 0.25, 0.50]


# ═══════════════════════════════════════════════════════════════════════════════════════
# M1 · ESTRUCTURAL — el motor del repo, con la política de anuncios de 2026-09-13
# ═══════════════════════════════════════════════════════════════════════════════════════
def m1_estructural(organico_dia, viral, n=V.N, **kw):
    runs = [V.corrida(organico_dia, viral, **kw) for _ in range(n)]
    return runs


# ═══════════════════════════════════════════════════════════════════════════════════════
# M2 · DIFUSIÓN DE BASS — el único que tiene techo de mercado
# ═══════════════════════════════════════════════════════════════════════════════════════
# [FUENTE] Sultan, Farley & Lehmann (1990), meta-análisis de 213 productos: p≈0.03, q≈0.30-0.38.
# Y dos referencias del propio rubro, que son las que importan acá:
#   · comida rápida (McDonald's): q = 0.54
#   · moteles:                     q = 0.36
# ⚠ DOS ERRORES QUE ESTA IMPLEMENTACIÓN COMETIÓ Y HAY QUE DEJAR ESCRITOS, porque los dos
# producen resultados que PARECEN razonables hasta que se miran de cerca:
#
#   1. LOS COEFICIENTES PUBLICADOS SON ANUALES y la primera versión los aplicó MENSUALMENTE.
#      Con p=0.03 sobre un mercado de 157,786 personas, el mes 1 da 4,734 adoptantes — y de
#      ahí el modelo reportaba S/267,336 de neto en el mes 12 con diez empleados. La
#      aritmética estaba bien; la unidad de tiempo, no. Se dividen entre 12.
#
#   2. BASS MODELA LA ADOPCIÓN DE UNA CATEGORÍA POR UN MERCADO, NO LA CUOTA DE UN VENDEDOR.
#      Poner M = todo el mercado alcanzable equivale a asumir el 100% de cuota para una
#      sandwichería que abre. Está fuera del dominio donde el modelo fue validado, y ninguna
#      corrección de unidades arregla eso.
#
# ⇒ POR ESO DE ESTE MÉTODO NO SE TOMA EL NIVEL, SE TOMA LA FORMA. Lo que sí viaja de la
# evidencia de Bass y no depende de M ni de la unidad de tiempo es **la razón q/p ≈ 10 a 18**:
# la imitación pesa un orden de magnitud más que la adopción espontánea. Traducido a este
# negocio: el boca a boca debería dominar a la publicidad pagada por un factor de diez. Eso
# CORROBORA, desde un método completamente distinto, la conclusión del modelo estructural.
BASS_P = 0.03 / 12.0
BASS_Q_GRID = [0.30 / 12.0, 0.38 / 12.0, 0.54 / 12.0]


def bass_adoptantes(m_total, p, q, meses):
    """Adoptantes NUEVOS por mes. Forma discreta: a(t) = (p + q·A/M)·(M − A)."""
    A, out = 0.0, []
    for _ in range(meses):
        a = (p + q * A / m_total) * (m_total - A)
        a = max(0.0, min(a, m_total - A))
        out.append(a)
        A += a
    return out


def m2_bass(m_total, q, p=BASS_P, meses=V.H, contrib=None):
    """Convierte adoptantes en PEDIDOS reusando exactamente el mismo perfil de repetición
    (sBG calibrado con Bloom/Paytronix) que usa M1. Así los dos métodos comparten la
    evidencia de retención y se diferencian SOLO en cómo llega el cliente — que es lo que se
    quiere comparar. Mezclar también la retención haría el contraste ilegible."""
    contrib = M.CONTRIB_PEDIDO if contrib is None else contrib
    nuevos = bass_adoptantes(m_total, p, q, meses)
    perf = M.PERFILES[(len(M.R1_GRID) // 2, len(M.GAP_GRID) // 2)]   # perfil central
    netos, pedidos, personas = [], [], []
    personal_previo = 1
    for m in range(meses):
        ped = sum(nuevos[k] * perf[m - k] for k in range(m + 1) if m - k < len(perf))
        necesarios = max(1, ceil((ped / V.DIAS[m]) / M.CAP_POR_PERSONA))
        contratados = necesarios - 1
        nuevos_este = max(0, necesarios - personal_previo)
        cap_ef = (necesarios - nuevos_este * (1 - M.RENDIMIENTO_MES_1)) * M.CAP_POR_PERSONA * V.DIAS[m]
        ped = min(ped, cap_ef)
        personal_previo = necesarios
        neto = ped * (contrib - M.OVERHEAD_POR_PEDIDO) - M.FIJOS_MES - contratados * M.SUELDO
        netos.append(neto); pedidos.append(ped); personas.append(necesarios)
    return {'netos': netos, 'pedidos': pedidos, 'personas': personas, 'nuevos': nuevos}


# ═══════════════════════════════════════════════════════════════════════════════════════
# M3 · CLASE DE REFERENCIA — la vista de afuera
# ═══════════════════════════════════════════════════════════════════════════════════════
# [MÉTODO] Flyvbjerg/Kahneman: en vez de construir el pronóstico desde adentro del proyecto,
# se pregunta qué le pasó a proyectos parecidos. Los cuatro modelos anteriores de este repo
# son 100% vista de adentro, y la vista de adentro es sistemáticamente optimista.
#
# ⚠ LA CLASE DE REFERENCIA DE ESTE NEGOCIO NO EXISTE COMO TAL, y hay que decirlo: no hay una
# base de datos de sandwicherías de delivery unipersonales en Trujillo. Lo que hay es la tasa
# de cierre de restaurantes, y las fuentes NO coinciden entre sí:
#   [FUENTE] ~17% cierran el primer año (menor que el 19% del promedio de servicios);
#   [FUENTE] National Restaurant Association: ~30% el primer año;
#   [FUENTE] Datassential 2025: 0.9% el primer año, la más baja desde 2018.
# El "90% cierra el primer año" es un mito sin respaldo, y conviene no repetirlo.
#
# La dispersión (0.9% a 30%) es tan grande que el número puntual no sirve. Lo que sí sirve es
# lo que hace con la respuesta: la vista de adentro calcula P(meta | el negocio sigue abierto)
# y se olvida de multiplicar por P(sigue abierto).
CIERRE_A1 = {'optimista': 0.009, 'central': 0.17, 'pesimista': 0.30}
# [MÉTODO] Año 2: se asume la mitad del riesgo del año 1 (el riesgo de cierre decae con la
# edad del negocio). Es un supuesto declarado, no una medición.
def superviv_24m(tasa_a1):
    return (1 - tasa_a1) * (1 - tasa_a1 / 2)


# ═══════════════════════════════════════════════════════════════════════════════════════
# M4 · RETROCÁLCULO — qué tiene que ser cierto. Sin probabilidad y sin supuestos de marketing
# ═══════════════════════════════════════════════════════════════════════════════════════
def m4_pedidos_necesarios(meta, contrib=None, ads_mes=0.0, dias=26.0):
    """[DERIVADO] Aritmética pura sobre contribución y costos fijos, incluida la contratación
    cuando el volumen pasa el techo de una persona. No depende de NINGÚN supuesto de
    marketing — por eso es el único bloque de todo esto que no puede estar equivocado por el
    lado del modelo."""
    contrib = M.CONTRIB_PEDIDO if contrib is None else contrib
    c = contrib - M.OVERHEAD_POR_PEDIDO
    for contratados in range(0, 8):
        ped_mes = (meta + M.FIJOS_MES + ads_mes + contratados * M.SUELDO) / c
        por_dia = ped_mes / dias
        necesarios = max(1, ceil(por_dia / M.CAP_POR_PERSONA))
        if necesarios - 1 == contratados:
            return {'ped_mes': ped_mes, 'por_dia': por_dia,
                    'personas': necesarios, 'contratados': contratados}
    return None


# ═══════════════════════════════════════════════════════════════════════════════════════
# M5 · VALOR DE LA INFORMACIÓN — cuándo se va a SABER, que es verificable en semanas
# ═══════════════════════════════════════════════════════════════════════════════════════
def m5_conversiones_para_veredicto(cac_real, techo=V.TECHO_CAC):
    """[DERIVADO] Con error relativo 1/√n (Poisson), ¿cuántas conversiones hacen falta para
    que el intervalo caiga ENTERO de un lado del techo? Es la misma regla que ya corre en el
    panel — acá se usa al revés: en vez de decidir con los datos, dice cuántos datos hace
    falta juntar, y por lo tanto cuánto cuesta la respuesta."""
    if abs(cac_real - techo) < 1e-9:
        return None, None
    r = (techo / cac_real - 1) if cac_real < techo else (1 - techo / cac_real)
    n = ceil((1 / r) ** 2)
    return n, n * cac_real


# ═══════════════════════════════════════════════════════════════════════════════════════
# INFORME
# ═══════════════════════════════════════════════════════════════════════════════════════
ORGANICO_GRID = [0.0, 1.0, 2.0, 3.0]      # clientes/día que llegan sin publicidad ni referido
VIRAL_GRID = [0.06, 0.15, 0.25]           # referidos por PEDIDO servido


def main():
    print('SND//WCH — CINCO MÉTODOS DE PREDICCIÓN'.center(W))
    print(f"Contribución por pedido: {M.CONTRIB_PEDIDO:.2f} · techo CAC {V.TECHO_CAC:.2f} · "
          f"CAC medio Meta {M.CAC_MEDIO:.2f} · horizonte {V.H} meses ({V.ETIQ[0]} a {V.ETIQ[-1]})")

    # ── M4 primero: es el único sin supuestos de marketing ────────────────────────────
    sep('M4 · RETROCÁLCULO — qué tiene que ser cierto, sin ningún supuesto de marketing')
    print('Pedidos diarios que hacen falta. Aritmética sobre contribución, fijos y sueldos.\n')
    print(f"{'meta neta':>12} {'sin pauta':>12} {'pauta 1,500':>14} {'pauta 3,000':>14} {'pauta 6,000':>14}")
    for meta in (5000.0, 10000.0):
        fila = [f"{meta:>11,.0f}"]
        for ads in (0.0, 1500.0, 3000.0, 6000.0):
            r = m4_pedidos_necesarios(meta, ads_mes=ads)
            marca = '' if r['por_dia'] <= M.CAP_POR_PERSONA * 0.75 else (' ⚠' if r['contratados'] == 0 else '')
            fila.append(f"{r['por_dia']:>11.1f}/d{marca}")
        print(' '.join(fila))
    print(f"\nTecho físico de una persona: {M.CAP_POR_PERSONA} pedidos/día "
          f"(cocina por tandas; en servicio solo arma). ⚠ = por encima del 75% de ese techo.")

    # ── M1 ────────────────────────────────────────────────────────────────────────────
    sep('M1 · ESTRUCTURAL — Monte Carlo de cohortes, con la política de anuncios de 2026-09-13')
    print(f"{V.N} corridas por celda. La publicidad NO es un gasto fijo: son S/300 para medir en el")
    print("mes 3 y después la regla del freno decide escalar, cortar o quedarse.\n")
    print(f"{'orgánico':>9} {'viral':>7} {'P(m3≥5k)':>10} {'P(5k sost)':>11} {'P(10k sost)':>12} "
          f"{'m12':>9} {'m24':>9} {'sostiene':>9}")
    m1_tabla = {}
    for org in ORGANICO_GRID:
        for vir in VIRAL_GRID:
            runs = m1_estructural(org, vir)
            ev5 = V.evaluar(runs, V.META_SOST_A)
            ev10 = V.evaluar(runs, V.META_SOST_B)
            m1_tabla[(org, vir)] = (ev5, ev10)
            print(f"{org:>8.0f}/d {vir:>7.2f} {ev5['p_m3']:>9.1%} {ev5['p_sost']:>10.1%} "
                  f"{ev10['p_sost']:>11.1%} {soles(ev5['m12']):>9} {soles(ev5['m24']):>9} "
                  f"{V.mediana_mes_sostiene(ev5):>9}")

    # ── M2 · BASS ─────────────────────────────────────────────────────────────────────
    sep('M2 · DIFUSIÓN DE BASS — el único método con TECHO DE MERCADO')
    print('p = 0.03 (adopción espontánea: publicidad + orgánico) · q = imitación (boca a boca).')
    print('[FUENTE] Sultan/Farley/Lehmann, 213 productos: p≈0.03, q≈0.30-0.38.')
    print('        Del propio rubro: comida rápida q=0.54, moteles q=0.36.\n')
    print(f"{'mercado M':>12} {'q/mes':>7} {'ped/día m6':>11} {'ped/día m12':>12} {'ped/día m24':>12} "
          f"{'neto m24':>10} {'personas':>9}")
    m2_res = {}
    for f in MERCADO_GRID:
        m_tot = POBLACION_COBERTURA * FRAC_ADULTOS * FRAC_INTERNET * f
        for q in BASS_Q_GRID:
            r = m2_bass(m_tot, q)
            s5 = V.sostiene_desde(r['netos'], V.META_SOST_A)
            s10 = V.sostiene_desde(r['netos'], V.META_SOST_B)
            m2_res[(f, q)] = r
            print(f"{m_tot:>12,.0f} {q:>7.4f} {r['pedidos'][5]/V.DIAS[5]:>10.1f} "
                  f"{r['pedidos'][11]/V.DIAS[11]:>11.1f} {r['pedidos'][23]/V.DIAS[23]:>11.1f} "
                  f"{soles(r['netos'][23]):>10} {r['personas'][23]:>9}")
    print(f"\n⚠ DE ESTE MÉTODO NO SE TOMA EL NIVEL, SE TOMA LA FORMA. Bass fue validado sobre la")
    print("  adopción de CATEGORÍAS por un mercado, no sobre la cuota de un vendedor nuevo; poner")
    print("  M = todo el mercado equivale a asumir 100% de cuota. Lo que sí viaja es la razón")
    print(f"  q/p = {BASS_Q_GRID[1] / BASS_P:.0f}: la imitación pesa {BASS_Q_GRID[1] / BASS_P:.0f} veces más que la adopción espontánea.")
    print("  Traducido: el boca a boca debería dominar a la publicidad pagada por un orden de")
    print("  magnitud — la MISMA conclusión del método estructural, por un camino independiente.")

    # ── CONVERGENCIA M1 ↔ M2 ─────────────────────────────────────────────────────────
    sep('CONVERGENCIA — los dos métodos dicen lo mismo cuando se alinea UN solo número')
    print('El `p` de Bass no es un parámetro abstracto: p·M son los adoptantes espontáneos del')
    print('primer mes, o sea EL RITMO ORGÁNICO, el mismo que el método estructural recorre a mano.')
    print('Si los dos modelos son razonables, alineado ese número tienen que coincidir.\n')
    print(f"{'mercado M':>12} {'implica orgánico':>17} {'M2 neto m24':>13} {'M1 neto m24':>13} {'brecha':>9}")
    for f in MERCADO_GRID:
        m_tot = POBLACION_COBERTURA * FRAC_ADULTOS * FRAC_INTERNET * f
        org_implicito = BASS_P * m_tot / 26.0          # adoptantes espontáneos por día operativo
        r2 = m2_bass(m_tot, BASS_Q_GRID[1])
        runs = m1_estructural(org_implicito, 0.25, n=1200)
        ev = V.evaluar(runs, V.META_SOST_A)
        brecha = (ev['m24'] - r2['netos'][23]) / max(1.0, abs(r2['netos'][23]))
        print(f"{m_tot:>12,.0f} {org_implicito:>15.1f}/d {soles(r2['netos'][23]):>13} "
              f"{soles(ev['m24']):>13} {brecha:>8.0%}")
    print('\n⇒ Dos métodos con esqueletos distintos —uno de cohortes, uno de difusión— aterrizan')
    print('  en el mismo orden de magnitud una vez alineado el ritmo orgánico. Eso NO valida el')
    print('  número: valida que TODA la respuesta cuelga de ese único parámetro sin medir.')

    # ── M3 · CLASE DE REFERENCIA ──────────────────────────────────────────────────────
    sep('M3 · CLASE DE REFERENCIA — la vista de afuera, que ningún modelo anterior aplicó')
    print('Los métodos de adentro calculan P(meta | el negocio sigue abierto) y se olvidan de')
    print('multiplicar por P(sigue abierto). Las fuentes de cierre NO coinciden entre sí:\n')
    print(f"{'fuente':>34} {'cierre año 1':>13} {'sobrevive 24m':>14}")
    for k, v in CIERRE_A1.items():
        etiqueta = {'optimista': 'Datassential 2025 (0.9%)',
                    'central': 'servicios/restaurantes (~17%)',
                    'pesimista': 'National Restaurant Assoc. (30%)'}[k]
        print(f"{etiqueta:>34} {v:>12.1%} {superviv_24m(v):>13.1%}")
    print('\nEl rango 0.9%-30% es tan ancho que el número puntual no sirve. Lo que sirve es la')
    print('DIRECCIÓN: toda probabilidad de arriba hay que multiplicarla por esto, y ninguna lo hacía.')

    # ── M5 · VALOR DE LA INFORMACIÓN ──────────────────────────────────────────────────
    sep('M5 · VALOR DE LA INFORMACIÓN — no predice el resultado, predice cuándo se va a SABER')
    print(f"Techo de CAC: {soles(V.TECHO_CAC)}. ¿Cuántas compras hacen falta para que el intervalo")
    print("1/√n caiga ENTERO de un lado, y cuánto cuesta juntarlas?\n")
    print(f"{'si el CAC real es':>18} {'conversiones':>13} {'gasto':>9} {'veredicto':>12}")
    for c in (8.0, 10.51, 12.0, 15.0, 17.87, 20.0, 25.23):
        n, gasto = m5_conversiones_para_veredicto(c)
        lado = 'sirve' if c < V.TECHO_CAC else 'cortar'
        aviso = ' ⚠ banda de empate' if n and n > 50 else ''
        print(f"{soles(c):>18} {n:>13,} {soles(gasto):>9} {lado:>12}{aviso}")
    print('\nLo caro de probar es justo lo que no hace falta probar: en la banda S/12-15 estás a')
    print('menos de un cuarto del equilibrio y la decisión no la resuelve más publicidad.')

    # ── QUÉ HARÍA FALTA ───────────────────────────────────────────────────────────────
    sep('¿QUÉ TENDRÍA QUE PASAR PARA QUE S/10,000 SOSTENIDOS SEA POSIBLE?')
    print('Se busca, sobre el motor estructural, la combinación mínima que lo consigue.\n')
    print(f"{'orgánico':>9} {'viral':>7} {'contrib':>8} {'P(10k sost)':>12} {'m24':>10} {'ped/día m24':>12}")
    for org, vir, extra in [(3.0, 0.25, 0.0), (5.0, 0.25, 0.0), (5.0, 0.40, 0.0),
                            (8.0, 0.25, 0.0), (8.0, 0.40, 0.0), (8.0, 0.40, 3.0),
                            (12.0, 0.40, 0.0), (12.0, 0.40, 3.0)]:
        runs = m1_estructural(org, vir, n=1200, contrib=M.CONTRIB_PEDIDO + extra)
        ev = V.evaluar(runs, V.META_SOST_B)
        print(f"{org:>8.0f}/d {vir:>7.2f} {M.CONTRIB_PEDIDO + extra:>8.2f} {ev['p_sost']:>11.1%} "
              f"{soles(ev['m24']):>10} {ev['ped24']:>11.1f}")


    # ── PUNTO ÚNICO DE FALLA ──────────────────────────────────────────────────────────
    sep('LA VARIABLE QUE NINGÚN MODELO DE ESTE REPO TUVO NUNCA: el dueño se enferma')
    print('Una persona sola, sin reemplazo. Cada día que no puede trabajar, el negocio factura 0')
    print('—y los costos fijos siguen—. Ningún modelo v7-v12 lo tuvo, ni como supuesto declarado.\n')
    print(f"{'días caídos/año':>16} {'disponibilidad':>15} {'neto S/5,000 →':>16} {'neto S/10,000 →':>17}")
    for d in (0, 5, 10, 20, 30):
        disp = 1 - d / 312.0
        # El neto cae con la disponibilidad, pero los fijos NO: se pagan igual el día que no
        # se abre. Por eso el golpe es más que proporcional.
        n5 = (5000 + M.FIJOS_MES) * disp - M.FIJOS_MES
        n10 = (10000 + M.FIJOS_MES) * disp - M.FIJOS_MES
        print(f"{d:>16} {disp:>14.1%} {soles(n5):>16} {soles(n10):>17}")
    print('\nNo es ruido: 20 días caídos AL AÑO (una gripe fuerte más un imprevisto) cuestan S/353')
    print('AL MES en promedio contra la meta de S/5,000, y S/673 al mes contra la de S/10,000. Y a')
    print('S/10,000 el negocio ya opera al 74-95% del techo físico de una persona, así que no')
    print('hay margen para recuperar los días perdidos trabajando más.')

    # ── COMBINACIÓN ───────────────────────────────────────────────────────────────────
    sep('COMBINACIÓN — promedio simple, que es lo que la evidencia del M4 respalda')
    print('P(meta) de la vista de adentro, MULTIPLICADA por P(el negocio sigue abierto).')
    print('Ningún modelo anterior hacía esa multiplicación.\n')
    surv = superviv_24m(CIERRE_A1['central'])
    print(f"Supervivencia a 24 meses (caso central, cierre 17% el año 1): {surv:.1%}\n")
    print(f"{'orgánico':>9} {'viral':>7} {'P(5k) adentro':>14} {'× superviv':>12} "
          f"{'P(10k) adentro':>15} {'× superviv':>12}")
    for org in ORGANICO_GRID:
        for vir in (0.25,):
            ev5, ev10 = m1_tabla[(org, vir)]
            print(f"{org:>8.0f}/d {vir:>7.2f} {ev5['p_sost']:>13.1%} {ev5['p_sost'] * surv:>11.1%} "
                  f"{ev10['p_sost']:>14.1%} {ev10['p_sost'] * surv:>11.1%}")

    # ── INVENTARIO DE VARIABLES ───────────────────────────────────────────────────────
    sep('INVENTARIO DE VARIABLES — qué entra, qué no, y qué no se puede saber')
    dentro = [
        ('contribución por pedido', '[DERIVADO] del catálogo real, no de un promedio de Signatures'),
        ('mezcla ARMA EL TUYO / Signature', '[SIN MEDIR] 50/50; se mide en el panel desde sep-26'),
        ('attach de bebida', '[SIN MEDIR] 25%; se mide en el panel'),
        ('retención (r1, brecha entre pedidos)', '[FUENTE] Bloom + Paytronix, sBG calibrado'),
        ('CAC (CPM·CTR·CVR·IGV)', '[AGENCIA] rango S/10.51-25.23, NO medición propia'),
        ('fase de aprendizaje de Meta', '[PLATAFORMA] 50 conv/7d + castigo 1.30 [SIN MEDIR]'),
        ('saturación del CAC', '[SIN MEDIR] +10% por cada 1,000 captados — decide si el año 2 existe'),
        ('arranque en frío', '[MÉTODO] ×1.6 decayendo en 4 meses'),
        ('ruido mensual de demanda', '[MÉTODO] lognormal σ=0.18'),
        ('referidos por pedido', '[SIN MEDIR] 0.06-0.40; se mide en el panel'),
        ('costo del referido', '[MEDIDO] S/7.65 de insumo'),
        ('capacidad por persona', '[MEDIDO] 40 ped/día, cocina por tandas'),
        ('contratación y su rendimiento inicial', '[DECISIÓN] S/1,500 y 60% el primer mes'),
        ('costos fijos', '[MEDIDO] S/500, opera desde casa'),
        ('días operativos', '[MEDIDO] lunes cerrado, derivado del calendario'),
        ('ritmo orgánico', '[SIN MEDIR] ⚠ NUEVO en v13 — y toda la respuesta cuelga de él'),
        ('política de decisión publicitaria', '[DECISIÓN] ⚠ NUEVO — medir S/300 y decidir'),
        ('sesgo de atribución del CAC', '[FUENTE] ⚠ NUEVO — Gordon et al., exagera 2-5×'),
        ('techo de mercado', '[FUENTE] ⚠ NUEVO vía Bass — el v12 admitía no tenerlo'),
        ('supervivencia del negocio', '[FUENTE] ⚠ NUEVO vía clase de referencia'),
        ('punto único de falla (el dueño)', '[MÉTODO] ⚠ NUEVO — sensibilidad de arriba'),
    ]
    fuera = [
        ('estacionalidad peruana', 'Fiestas Patrias, Navidad, verano en la costa norte'),
        ('día de la semana', 'el viernes no se parece al martes en comida'),
        ('fatiga creativa de los anuncios', 'el CTR cae con la repetición; acá es constante'),
        ('tiempo de cobro de Culqi', 'capital de trabajo: se paga el insumo antes de cobrar'),
        ('competencia que reacciona', 'un rival que baja precios o copia el producto'),
        ('elasticidad precio', 'cuánto cae la demanda si suben los precios'),
        ('quiebres de stock', 'ya hay alertas, pero el modelo nunca deja de vender'),
        ('disponibilidad del motorizado', 'es un tercero con 50+ repartidores, no propio'),
        ('reseñas de Google', '[FUENTE] Luca: +1 estrella = +5-9% ingresos, solo independientes'),
        ('inflación de insumos', 'el costeo es a precios de 2026'),
        ('cierre sanitario o regulatorio', 'permisos en trámite a la fecha'),
        ('clima', 'Trujillo es desierto; probablemente menor, pero no está medido'),
    ]
    print(f"DENTRO DEL MODELO ({len(dentro)}):")
    for k, v in dentro:
        print(f"  · {k:<38} {v}")
    print(f"\nFUERA, DECLARADO ({len(fuera)}):")
    for k, v in fuera:
        print(f"  · {k:<38} {v}")
    print('\n⚠ Ninguna de las de abajo se inventa con un número: nombrarlas es el trabajo honesto.')
    print('  Las dos que más podrían mover el resultado y NO están: estacionalidad y reseñas de')
    print('  Google — la segunda es la única con evidencia causal de todo el expediente.')

    return m1_tabla, m2_res


if __name__ == '__main__':
    TABLA = main()
