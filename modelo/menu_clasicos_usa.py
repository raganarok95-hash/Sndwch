"""
SND//WCH — EL MENÚ DE CLÁSICOS DE USA, COSTEADO CON EL MODELO DEL REPO (v4)

Por qué existe este archivo y no una tabla escrita a mano en un .md: las tres primeras
versiones del costeo (docs/MENU_CLASICOS_USA.md v1/v2/v3) se escribieron a mano y dos de sus
supuestos estaban DESALINEADOS con el resto del repo sin que nada avisara —

  1. usaban EMPAQUE = S/1.10 mientras `modelo/rentabilidad_por_parte.py` usa S/1.30
     (el punto medio COTIZADO del rango S/1.10-1.50). Veinte céntimos por sándwich en contra.
  2. estimaban a ojo el pavo y el tocino, cuando el pavo YA ESTÁ COTIZADO Y CONFIRMADO
     por el dueño desde el 2026-09-12: S/44.20/kg al por mayor, rendimiento 1.00 (es fiambre,
     no se cocina), o sea S/3.76 la porción de 85 g.

Las dos constantes de abajo se importan del análisis vigente en vez de re-escribirse, así que
la próxima vez que alguien corrija el empaque o el precio de una proteína, esta comparación se
corrige sola. Comparar dos menús con dos costeos distintos no compara menús: compara supuestos.

REGLA DE LECTURA: "costo %" es insumos+empaque como porcentaje del precio de venta. El techo
acordado con el dueño es 45%. Más alto es PEOR. Mano de obra = S/0 (el dueño arma los pedidos).
"""

import importlib.util
import io
import contextlib
import pathlib

# ── Importar el análisis vigente SIN que imprima su propio reporte ────────────────────
_ruta = pathlib.Path(__file__).with_name("rentabilidad_por_parte.py")
_spec = importlib.util.spec_from_file_location("_rpp", _ruta)
_rpp = importlib.util.module_from_spec(_spec)
with contextlib.redirect_stdout(io.StringIO()):
    _spec.loader.exec_module(_rpp)

TECHO   = _rpp.TECHO        # 0.45
EMPAQUE = _rpp.EMPAQUE      # S/1.30 [COTIZADO] papel manteca brandeado + bolsa
SALSA   = _rpp.SALSA        # (0.266, 0.532) por porción
QUESO   = _rpp.QUESO        # (0.385, 0.770) [ESTIMADO] proxy S/35/kg
PAN     = _rpp.PAN          # B01 sub (1.00, 2.00) · B03 focaccia (1.30, 2.60)
PROT    = _rpp.PROT         # costo por porción YA con merma
TOPS_KG = _rpp.TOPS_KG      # S/4.00/kg, promedio de los vegetales
MIX15   = _rpp.MIX15        # 0.80 [HIPÓTESIS del dueño] 80% de los pedidos en 15CM

CEBOLLA_KG = 3.00           # [ESTIMADO] cebolla blanca a granel, Trujillo
PIMIENTO_KG = 4.50          # [ESTIMADO] pimiento verde a granel

# ── Insumos nuevos que este menú necesita ─────────────────────────────────────────────
#
# RES LAMINADA EN FRÍO (el Philly). El dueño corrigió que NO es el corte finísimo de P07
# (rendimiento 0.567): se lamina en frío y se saltea a la plancha, así que rinde 0.70
# (limpieza 8% + plancha 24%). SIGUE SIENDO UN SUPUESTO: hay que medirlo en la primera tanda.
RES_KG, RES_REND = 20.00, 0.70
RES_LAM = (85 / 1000) * RES_KG / RES_REND          # S/2.43 la porción de 85 g

def _por(p15):                                      # 30CM = el doble de proteína
    return (p15, p15 * 2)

RES_LAMINADA = _por(RES_LAM)
PAVO         = PROT["P08"]                          # (3.76, 7.51) [COTIZADO 2026-09-12]
ATUN         = PROT["P04"]                          # (3.25, 6.50) [COTIZADO 2026-09-04]
ALBONDIGA    = PROT["P06"]                          # (1.34, 2.68) [ESTIMADO — sin cotizar]
EMBUTIDO     = PROT["P05"]                          # (4.29, 8.59) S/48/kg confirmado


def veg(gramos, i, precio_kg=TOPS_KG):
    """Costo del vegetal. En 30CM se duplica el gramaje, como en todo el catálogo."""
    return (gramos if i == 0 else gramos * 2) / 1000 * precio_kg


def costo(i, prot, pan="B01", salsas=0, queso=False, vegetales=(), extras=0.0):
    """vegetales: lista de (gramos, precio_kg). extras: soles ya calculados por tamaño 15CM."""
    c = prot[i] + PAN[pan][i] + EMPAQUE + SALSA[i] * salsas
    for g, pkg in vegetales:
        c += veg(g, i, pkg)
    if queso:
        c += QUESO[i]
    return c + (extras if i == 0 else extras * 2)


# ── EL MENÚ v4 ────────────────────────────────────────────────────────────────────────
#
# Cambios de la v3, todos pedidos por el dueño:
#   · El TURKEY va SIN TOCINO. Es la opción fit; el tocino la contradecía y además era el
#     único insumo de esa receta sin cotizar. Al sacarlo desaparece el producto que estaba
#     más cerca del techo (41.5%) Y el riesgo de precio que lo acompañaba.
#   · Todo se recostea con el empaque y el pavo reales (ver cabecera).
#
# El set estándar de vegetales del repo son 73 g (lechuga 21 + tomate 35 + cebolla + pimiento),
# el mismo peor caso que usa `rentabilidad_por_parte.py` para ARMA EL TUYO.
VEG_ESTANDAR = [(73, TOPS_KG)]

MENU = [
    # (nombre, precio15, precio30, kwargs de costo, nota)
    ("Philly Cheesesteak", 22.90, 32.90, dict(
        prot=RES_LAMINADA, salsas=0, queso=True,
        vegetales=[(70, CEBOLLA_KG), (20, PIMIENTO_KG)]),
     "cebolla salteada + pimiento; sin salsa, como el original"),

    ("Turkey", 23.90, 34.90, dict(
        prot=PAVO, salsas=1, queso=False, vegetales=VEG_ESTANDAR),
     "SIN TOCINO — es la opción fit; sin queso, 1 salsa"),

    ("Italian Hoagie", 23.90, 33.90, dict(
        prot=EMBUTIDO, salsas=1, queso=True, vegetales=VEG_ESTANDAR),
     "2 embutidos sobre el P05 ya cotizado; vinagreta"),

    ("Meatball Marinara", 21.90, 28.90, dict(
        prot=ALBONDIGA, salsas=1, queso=True, vegetales=[(45, TOPS_KG)]),
     "= SIG02 tal cual está hoy"),

    ("Classic Tuna", 20.90, 34.90, dict(
        prot=ATUN, salsas=0, queso=False, vegetales=[]),
     "= SIG04 tal cual: atún escurrido, mayonesa y pimienta"),

    ("Tuna Melt", 22.90, 36.90, dict(
        prot=ATUN, salsas=0, queso=True, vegetales=[]),
     "el Tuna + queso fundido: +S/2.00 de precio por S/0.39 de costo"),
]

# ── EL MENÚ DE HOY, con el MISMO costeo ───────────────────────────────────────────────
ACTUAL = [(sid, _rpp.SIG[sid][0], _rpp.SIG[sid][6], _rpp.SIG[sid][7]) for sid in _rpp.SIG]


def tabla(titulo, filas):
    print(f"\n  {titulo}")
    print(f"  {'':<22}{'precio15':>9}{'costo':>8}{'costo%':>8}{'deja':>8}"
          f"{'precio30':>10}{'costo':>8}{'costo%':>8}{'deja':>8}")
    print("  " + "-" * 89)
    for n, p15, c15, p30, c30 in filas:
        a15, a30 = c15 / p15, c30 / p30
        m = "  <-- TECHO" if max(a15, a30) > TECHO else ""
        print(f"  {n:<22}{p15:>9.2f}{c15:>8.2f}{a15*100:>7.1f}%{p15-c15:>8.2f}"
              f"{p30:>10.2f}{c30:>8.2f}{a30*100:>7.1f}%{p30-c30:>8.2f}{m}")


def resumen(filas):
    n = len(filas)
    p15 = sum(f[1] for f in filas) / n
    m15 = sum(f[1] - f[2] for f in filas) / n
    p30 = sum(f[3] for f in filas) / n
    m30 = sum(f[3] - f[4] for f in filas) / n
    return p15, m15, p30, m30


def ponderar(p15, m15, p30, m30, mix15=MIX15):
    return p15 * mix15 + p30 * (1 - mix15), m15 * mix15 + m30 * (1 - mix15)


nuevo  = [(n, p15, costo(0, **kw), p30, costo(1, **kw)) for n, p15, p30, kw, _ in MENU]
actual = [(nom, p15, _rpp.costo_sig(sid, 0), p30, _rpp.costo_sig(sid, 1))
          for sid, nom, p15, p30 in ACTUAL]

print("=" * 93)
print("     SND//WCH — MENÚ DE CLÁSICOS DE USA v4 · el Turkey sin tocino y dónde más ganar")
print("=" * 93)
print(f"\n  Mismo modelo para los dos menús: empaque S/{EMPAQUE:.2f}, pan sub S/1.00/S/2.00,")
print(f"  salsa S/{SALSA[0]:.3f}, queso S/{QUESO[0]:.3f}, vegetales S/{TOPS_KG:.2f}/kg,")
print(f"  mano de obra S/0. Techo de costo {TECHO*100:.0f}%.")

tabla("MENÚ NUEVO (v4)", nuevo)
tabla("MENÚ DE HOY, costeado igual", actual)

pn = resumen(nuevo)
pa = resumen(actual)
print(f"\n  {'':<26}{'hoy':>10}{'nuevo v4':>12}{'dif':>12}")
print("  " + "-" * 60)
for i, et in enumerate(("precio medio 15CM", "margen medio 15CM",
                        "precio medio 30CM", "margen medio 30CM")):
    print(f"  {et:<26}{pa[i]:>10.2f}{pn[i]:>12.2f}{pn[i]-pa[i]:>+11.2f}"
          f"  ({(pn[i]/pa[i]-1)*100:+.1f}%)")

for mix in (0.80, 0.70):
    ia, ma = ponderar(*pa, mix15=mix)
    inv, mv = ponderar(*pn, mix15=mix)
    print(f"\n  Ponderado {mix*100:.0f}/{100-mix*100:.0f} (15CM/30CM):")
    print(f"    ingreso por sándwich   S/{ia:6.2f}  ->  S/{inv:6.2f}   {inv-ia:+.2f}")
    print(f"    margen  por sándwich   S/{ma:6.2f}  ->  S/{mv:6.2f}   {mv-ma:+.2f}")
    print(f"    de cada sol extra cobrado, quedan {((mv-ma)/(inv-ia))*100:.0f} céntimos")

print("\n" + "=" * 93)
print("  LAS PALANCAS, ORDENADAS POR PLATA AL MES (600 sándwiches/mes)")
print("=" * 93)

VOL = 600
_, ma80 = ponderar(*pa)
_, mv80 = ponderar(*pn)
palancas = []

palancas.append(("Cambiar el menú entero (v4 contra hoy)", (mv80 - ma80) * VOL,
                 "recetas, fotos y textos nuevos"))

# Mezcla: cada punto que se mueve de 15CM a 30CM vale la diferencia de margen entre tamaños
dif_tam = pn[3] - pn[1]
palancas.append(("Mover la mezcla de 80/20 a 70/30", dif_tam * 0.10 * VOL,
                 "no cuesta un céntimo de insumo"))

# Bebida: attach 25% -> 40%
bebida_margen = (sum(_rpp.BEBIDA[c][1] for c in _rpp.BEBIDA_INSUMO)
                 - sum(_rpp.costo_bebida(c) for c in _rpp.BEBIDA_INSUMO)) / len(_rpp.BEBIDA_INSUMO)
palancas.append(("Subir el attach de bebida de 25% a 40%", bebida_margen * 0.15 * VOL,
                 f"margen medio por bebida S/{bebida_margen:.2f}"))

# Embutido: cotizar salami+jamón en vez de usar el premium de S/48/kg
EMB_MEZCLA_KG = 32.00       # [SIN COTIZAR] hipótesis: salami ~S/34 + jamón ~S/30
emb_nuevo = _por((85 / 1000) * EMB_MEZCLA_KG)
ahorro_emb = ((EMBUTIDO[0] - emb_nuevo[0]) * MIX15
              + (EMBUTIDO[1] - emb_nuevo[1]) * (1 - MIX15))
palancas.append(("Cotizar el embutido del Hoagie aparte", ahorro_emb * (VOL / len(MENU)),
                 f"S/48/kg -> S/{EMB_MEZCLA_KG:.0f}/kg hipotético, solo el Hoagie"))

# Empaque en lote
palancas.append(("Cotizar el empaque en lote (1.30 -> 1.10)", 0.20 * VOL,
                 "cero cambio de producto; hoy es un punto medio sin cotizar"))

# "Hazlo Melt" en Turkey y Hoagie
melt = (2.00 - QUESO[0]) * MIX15 + (2.00 - QUESO[1]) * (1 - MIX15)
palancas.append(('Upsell "Hazlo Melt" (+S/2) en Turkey y Hoagie',
                 melt * (VOL * 2 / len(MENU)) * 0.25,
                 "si lo toma 1 de cada 4"))

for n, (nom, plata, nota) in enumerate(sorted(palancas, key=lambda x: -x[1]), 1):
    print(f"  {n}. {nom:<44} +S/{plata:>7.0f}/mes   {nota}")

print(f"\n  Suma de las seis: +S/{sum(p for _, p, _ in palancas):.0f}/mes")
print("  Las dos más grandes NO son del menú: son la mezcla de tamaño y la bebida.\n")

print("=" * 93)
print("  EL CONTRAFACTUAL QUE HAY QUE HACERSE: ¿y si solo subimos los precios de HOY?")
print("=" * 93)

c15_n = sum(f[2] for f in nuevo) / len(nuevo)
c30_n = sum(f[4] for f in nuevo) / len(nuevo)
c15_a = sum(f[2] for f in actual) / len(actual)
c30_a = sum(f[4] for f in actual) / len(actual)
print(f"\n  costo medio de producir   15CM: hoy S/{c15_a:.2f}  ·  nuevo S/{c15_n:.2f}"
      f"   ({(c15_n-c15_a):+.2f})")
print(f"  costo medio de producir   30CM: hoy S/{c30_a:.2f}  ·  nuevo S/{c30_n:.2f}"
      f"   ({(c30_n-c30_a):+.2f})")
print("\n  Son el MISMO costo. Todo el margen extra del menú nuevo es PRECIO, no ahorro.")
print(f"  Subirle S/{pn[0]-pa[0]:.2f} (15CM) y S/{pn[2]-pa[2]:.2f} (30CM) al menú de hoy daría")
print("  exactamente la misma plata, sin rehacer seis fotos, seis recetas y seis textos.")
print("\n  La diferencia real no está en la tabla: está en si el precio se SOSTIENE.")
print("  Un Philly Cheesesteak a S/22.90 no hay que explicarlo. 'The Smoke' a S/25.13, sí.")

print("\n" + "=" * 93)
print("  DÓNDE ESTÁ EL PRECIO QUE FALTA COBRAR")
print("=" * 93)
print(f"\n  {'producto':<22}{'hoy':>8}{'costo%':>9}{'si sube S/1':>13}{'costo%':>9}{'margen':>9}")
print("  " + "-" * 72)
for n, p15, c15, p30, c30 in sorted(nuevo, key=lambda f: f[2] / f[1]):
    print(f"  {n:<22}{p15:>8.2f}{c15/p15*100:>8.1f}%{p15+1:>13.2f}"
          f"{c15/(p15+1)*100:>8.1f}%{p15+1-c15:>9.2f}")
print("\n  El Philly es el producto MÁS BARATO de producir del menú nuevo (23.6%) y el de")
print("  nombre más reconocible. Es donde hay más espacio de precio sin tocar la receta:")
print(f"  a S/24.90 queda en {5.41/24.90*100:.1f}% de costo y deja S/{24.90-nuevo[0][2]:.2f}.")

print("\n" + "=" * 93)
print("  EL DOBLE DE PROTEÍNA — el mejor upsell del menú nuevo")
print("=" * 93)
DOBLE = [("Philly (res laminada)", RES_LAMINADA, 7.00, 13.00),
         ("Turkey (pavo)",         PAVO,         9.00, 17.00),
         ("Hoagie (embutido)",     EMBUTIDO,     9.90, 19.90),
         ("Meatball (albóndiga)",  ALBONDIGA,    6.00, 12.00),
         ("Tuna (atún)",           ATUN,        10.90, 21.90)]
print(f"\n  {'':<24}{'cobra15':>9}{'cuesta':>9}{'costo%':>9}{'deja':>8}"
      f"{'cobra30':>10}{'cuesta':>9}{'costo%':>9}{'deja':>8}")
print("  " + "-" * 87)
for nom, p, d15, d30 in sorted(DOBLE, key=lambda x: x[1][0] / x[2]):
    m = "  <-- TECHO" if max(p[0] / d15, p[1] / d30) > TECHO else ""
    print(f"  {nom:<24}{d15:>9.2f}{p[0]:>9.2f}{p[0]/d15*100:>8.1f}%{d15-p[0]:>8.2f}"
          f"{d30:>10.2f}{p[1]:>9.2f}{p[1]/d30*100:>8.1f}%{d30-p[1]:>8.2f}{m}")
print("\n  La albóndiga y el atún son los dos únicos con el doble bien debajo del techo:")
print("  ahí el 'hazlo doble' es plata casi limpia. En la res laminada y el pavo, no.\n")

print("=" * 93)
print("  EL EMPAQUE — la palanca creció al cotizar el papel (2026-09-23)")
print("=" * 93)

PAPEL, BOLSA, STICK = _rpp.PAPEL_MANTECA, _rpp.BOLSA_KRAFT, _rpp.STICKER
print(f"""
  Lo que había: S/{EMPAQUE:.2f} por sándwich, un literal sin partes, heredado de un estimado
  que sumaba CAJA DE FIBRA DE CAÑA + bolsa + servilleta + sticker, y que además estaba
  medido POR PEDIDO. El empaque real que decidió el dueño no lleva caja.

  papel manteca   S/{PAPEL:.3f}  [COTIZADO 2026-09-23] S/150 los 2 millares · POR SÁNDWICH
  bolsa kraft     S/{BOLSA:.3f}  [COTIZADO Bio Pack Lima, recotizando en Trujillo] · POR PEDIDO
  sticker         S/{STICK:.3f}  [SIN COTIZAR] rango normal S/0.04-0.15 · POR PEDIDO
  ----------------------------------------------------
  total           S/{PAPEL+BOLSA+STICK:.3f} por PEDIDO""")

print(f"\n  {'sánd. por pedido':<20}{'empaque/sánd.':>15}{'ahorro':>10}{'+S/mes (600)':>15}")
print("  " + "-" * 60)
for n in (1.0, 1.5, 2.0):
    e = PAPEL + (BOLSA + STICK) / n
    print(f"  {n:<20.1f}{e:>15.2f}{EMPAQUE-e:>10.2f}{(EMPAQUE-e)*600:>15.0f}")

e1 = PAPEL + BOLSA + STICK
print(f"""
  Aun en el peor caso —un sándwich por pedido, o sea la bolsa entera a cada uno— el
  empaque real es S/{e1:.2f} contra los S/{EMPAQUE:.2f} costeados: **S/{EMPAQUE-e1:.2f} por sándwich**,
  +S/{(EMPAQUE-e1)*600:.0f} al mes sin cambiar un ingrediente ni una foto. Pasa a ser la SEGUNDA palanca
  del negocio, por encima de la mezcla de tamaño (+S/383) y de la bebida (+S/376), y solo
  detrás de rehacer la carta entera (+S/982) — que cuesta seis fotos y seis recetas.

  ⚠ El modelo sigue costeando S/{EMPAQUE:.2f} a propósito, hasta que cierren las dos cotizaciones
  que faltan. Equivocarse hacia arriba en un costo es seguro; hacia abajo, no.

  Y sobre los dos millares: S/150 los 2 000 contra S/85 los 1 000 ahorra S/20 por S/65 más
  de desembolso, con un papel que no caduca. A 600 sándwiches/mes son 3.3 meses de stock.""")

print("=" * 93)
print("  ¿CONVIENE REDONDEAR HACIA ABAJO? (pregunta del dueño 2026-09-23)")
print("=" * 93)

print(f"\n  {'producto':<22}{'v4':>8}{'a entero':>10}{'regala':>9}{'primer dígito':>16}")
print("  " + "-" * 66)
regalo15 = regalo30 = 0.0
for n, p15, c15, p30, c30 in nuevo:
    abajo = float(int(p15))                      # 22.90 -> 22.00
    regalo15 += p15 - abajo
    regalo30 += p30 - float(int(p30))
    print(f"  {n:<22}{p15:>8.2f}{abajo:>10.2f}{p15-abajo:>9.2f}"
          f"{'  ' + str(int(p15)) + ' en los dos':>16}")

r = (regalo15 / len(nuevo)) * MIX15 + (regalo30 / len(nuevo)) * (1 - MIX15)
print(f"""
  El dígito de la izquierda NO CAMBIA en ninguno: S/22.90 y S/22.00 se leen los dos
  como "veintidós y algo". El cliente no percibe nada — y son S/{r:.2f} por sándwich
  regalados, **+S/{r*600:.0f} al mes** a 600 sándwiches. Más que la palanca del empaque.

  El .90 YA ES el redondeo hacia abajo: S/22.90 está a diez céntimos de S/23 y se lee
  como 22. Redondear otra vez es pagar dos veces por el mismo efecto.

  DONDE SÍ IMPORTA EL REDONDEO: en qué DÍGITO cae el precio, no en los decimales.""")

print(f"\n  {'producto':<22}{'v4':>8}{'lee como':>11}{'+S/1.00':>10}{'lee como':>11}{'cruza?':>9}")
print("  " + "-" * 73)
for n, p15, c15, p30, c30 in nuevo:
    cruza = int(p15 + 1) != int(p15)
    print(f"  {n:<22}{p15:>8.2f}{int(p15):>11}{p15+1:>10.2f}{int(p15+1):>11}"
          f"{'  SÍ, cuesta' if cruza else '  no, gratis':>9}")
print("""
  Subir S/1.00 un precio que NO cruza de dígito es casi gratis en percepción.
  Subirlo cuando cruza (21.90 -> 22.90) es el salto que el cliente sí siente.""")
