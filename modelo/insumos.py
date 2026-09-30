# -*- coding: utf-8 -*-
"""
SND//WCH — LA FICHA DE INSUMOS. Un solo sitio donde vive cada costo, con su unidad.

POR QUÉ EXISTE (2026-09-23). El costeo del empaque estuvo el doble de caro durante dos meses
y nadie podía verlo, porque era esto:

    EMPAQUE = 1.30   # [COTIZADO] papel manteca brandeado + bolsa, punto medio S/1.10-1.50

Un float con un comentario. El comentario decía "COTIZADO" y no lo estaba; decía "papel +
bolsa" y el estimado del que salía incluía una CAJA de fibra de caña que el empaque real no
lleva; y venía de un documento que lo medía POR PEDIDO mientras acá se sumaba POR SÁNDWICH.
Tres errores distintos dentro de un número que se veía perfectamente normal.

Ninguno de los chequeos del repo podía cazarlo, y no por descuido: `npm run parity` compara
el cliente contra el servidor, `check:precios` mira los precios visibles, `test:api` prueba el
cálculo. **Todos verifican que dos copias del mismo número coincidan.** Un número que está
solo, y mal, coincide consigo mismo.

QUÉ CAMBIA ACÁ. Un costo deja de ser un float y pasa a ser una ficha con cinco campos
obligatorios. Los dos que faltaban son los que causaron el error:

  · UNIDAD — "por sándwich" y "por pedido" NO son la misma plata. `por_sandwich()` se niega
    a convertir un costo por pedido sin que le digas cuántos sándwiches trae. El error del
    empaque, escrito hoy, revienta en vez de costar S/0.78 en silencio.
  · ESTADO — COTIZADO / ESTIMADO / SIN_COTIZAR. Un comentario que dice "COTIZADO" no obliga
    a nada; un campo que el chequeo lee, sí. `npm run check:costos` falla si falta cualquiera
    de los cinco campos, y lista los SIN_COTIZAR para que no se olviden.

REGLA: **si un número entra a un cálculo de dinero, entra por acá.** Un literal suelto en un
script de `modelo/` es el defecto que este archivo existe para impedir.
"""

from typing import NamedTuple, Optional

# ── Unidades. La unidad NO es documentación: `por_sandwich` la lee y decide. ───────────
SANDWICH = "sandwich"      # se consume uno por cada sándwich
PEDIDO   = "pedido"        # se consume uno por PEDIDO, no importa cuántos sándwiches traiga
KG       = "kg"            # precio por kilo de insumo CRUDO, antes de merma
PORCION  = "porcion"       # (15CM, 30CM) ya con merma aplicada

# ── Estados. El que no está cotizado se dice, no se disimula. ─────────────────────────
COTIZADO    = "COTIZADO"       # precio real de un proveedor, confirmado por el dueño
ESTIMADO    = "ESTIMADO"       # investigado o derivado, sin proveedor que lo confirme
SIN_COTIZAR = "SIN_COTIZAR"    # no existe el dato y hay que salir a buscarlo


class Insumo(NamedTuple):
    valor: object          # float, o (float, float) cuando la unidad es PORCION
    unidad: str
    estado: str
    fuente: str
    fecha: str             # cuándo se confirmó ese valor, no cuándo se escribió la línea


def por_sandwich(ins: Insumo, sand_por_pedido: Optional[float] = None, i: int = 0) -> float:
    """El único camino de una ficha a un costo por sándwich.

    Se niega a convertir un costo POR PEDIDO sin saber cuántos sándwiches trae ese pedido.
    Ese `raise` es el archivo entero: es el error del empaque convertido en excepción."""
    if ins.unidad == SANDWICH:
        return float(ins.valor)
    if ins.unidad == PORCION:
        return float(ins.valor[i])
    if ins.unidad == PEDIDO:
        if sand_por_pedido is None:
            raise ValueError(
                f"'{ins.fuente}' se mide POR PEDIDO y lo estás sumando por sándwich sin "
                f"decir cuántos sándwiches trae el pedido. Ese es exactamente el error que "
                f"tuvo el empaque dos meses: pasa `sand_por_pedido=` o cambia la unidad.")
        if sand_por_pedido <= 0:
            raise ValueError("sand_por_pedido tiene que ser mayor que cero")
        return float(ins.valor) / sand_por_pedido
    raise ValueError(f"unidad desconocida: {ins.unidad!r}")


# ═══ EMPAQUE ═══════════════════════════════════════════════════════════════════════════
PAPEL_MANTECA = Insumo(0.075, SANDWICH, COTIZADO,
                       "papel manteca brandeado — S/150 los 2 millares (S/85 el millar)",
                       "2026-09-23")
BOLSA_KRAFT   = Insumo(0.350, PEDIDO, ESTIMADO,
                       "bolsa kraft delivery — cotizada a Bio Pack (Lima); el dueño la está "
                       "recotizando en Trujillo", "2026-08-04")
STICKER       = Insumo(0.100, PEDIDO, SIN_COTIZAR,
                       "sticker de sellado — el dueño lo está cotizando; rango normal "
                       "S/0.04-0.15", "2026-09-23")

# El número CONSERVADOR con el que sigue costeando el repo mientras falten dos cotizaciones.
# Equivocarse hacia arriba en un costo es seguro; hacia abajo no. Cuando el dueño cierre
# sticker y bolsa, esta ficha se borra y se usa la suma real de las tres de arriba.
EMPAQUE_CONSERVADOR = Insumo(1.30, SANDWICH, ESTIMADO,
                             "techo deliberado mientras faltan sticker y bolsa — ver las "
                             "tres fichas de arriba", "2026-09-23")

# ═══ PAN ═══════════════════════════════════════════════════════════════════════════════
PAN_SUB      = Insumo((1.00, 2.00), PORCION, COTIZADO,
                      "pan sub S/2 la unidad; el 15CM usa medio", "2026-08-22")
PAN_FOCACCIA = Insumo((1.30, 2.60), PORCION, COTIZADO,
                      "focaccia S/13 la entera = 10 porciones de 15CM (medido por el dueño)",
                      "2026-09-03")

# ═══ COMPONENTES ═══════════════════════════════════════════════════════════════════════
SALSA_PORCION = Insumo((0.266, 0.532), PORCION, ESTIMADO,
                       "proxy mostaza S/19/kg — sin proveedor; viene de la v2 de "
                       "MENU_FINANCIAL_ANALYSIS.md", "2026-08-04")
QUESO_PORCION = Insumo((0.385, 0.770), PORCION, ESTIMADO,
                       "proxy queso S/35/kg — hay un dato suelto de S/22.50/kg para mozzarella",
                       "2026-08-04")
VEGETALES_KG  = Insumo(4.00, KG, ESTIMADO,
                       "promedio ponderado de los toppings de frasco y frescos", "2026-08-04")
CEBOLLA_KG    = Insumo(3.00, KG, ESTIMADO, "cebolla blanca a granel, Trujillo", "2026-09-23")
PIMIENTO_KG   = Insumo(4.50, KG, ESTIMADO, "pimiento verde a granel, Trujillo", "2026-09-23")

# ═══ PROTEÍNAS ═════════════════════════════════════════════════════════════════════════
# El precio por kilo no dice nada hasta dividirlo por el rendimiento: el pavo cuesta más del
# doble por kilo que la res y sale más barato por sándwich, porque no pasa por la olla.
# El costo de la porción se DERIVA de (precio/kg × gramaje ÷ rendimiento) en vez de
# escribirse — `check:costos` compara lo derivado contra lo que usa el modelo y falla si se
# separan. Cuatro proteínas no reconcilian hoy y están marcadas abajo.
GRAMAJE = (0.085, 0.170)     # kg de proteína por sándwich, estándar Subway

# El rendimiento es el DOCUMENTADO en docs/NEGOCIO.md y recetas/, no uno despejado desde el
# costo que ya estaba escrito. Esa distinción es el punto: si se despeja, siempre reconcilia
# y la comparación no sirve para nada. `None` = nunca se documentó ninguno.
PROTEINA_KG = {
    "P01": (Insumo(20.00, KG, COTIZADO, "res ~S/20/kg", "2026-08-01"), 0.54),
    "P02": (Insumo(17.00, KG, COTIZADO, "pollo ~S/17/kg", "2026-08-01"), 0.665),
    "P03": (Insumo(17.00, KG, COTIZADO, "pollo cajún, mismo insumo", "2026-08-01"), 0.665),
    "P04": (Insumo(43.96, KG, COTIZADO, "atún S/4 la lata de 140 g neto = S/43.96/kg "
                                        "escurrido", "2026-09-04"), 1.00),
    "P05": (Insumo(48.00, KG, COTIZADO, "embutido premium S/48/kg", "2026-08-01"), None),
    "P06": (Insumo(15.00, KG, COTIZADO, "carne molida S/15/kg, cotizada por el dueño el 2026-09-30 "
                                        "(online: Tottus S/23.50, Metro S/24.90)", "2026-09-30"), None),
    "P08": (Insumo(44.20, KG, COTIZADO, "pavo S/44.20/kg al por mayor — el mismo que el "
                                        "retail de Braedt", "2026-09-12"), 1.00),
}
# Rendimientos documentados: res 0.54 (limpieza 10% + cocción 40%), pollo 0.64-0.69 (se usa
# el punto medio 0.665), res laminada 0.567. El atún y el pavo rinden 1.00 porque no se
# cocinan. De P05 y P06 NUNCA se documentó ninguno.
# Res laminada en frío: el corte del Philly. El rendimiento es SUPUESTO y hay que medirlo en
# la primera tanda — con 0.55 en vez de 0.70 el Philly 15CM pasa de 23.6% a 27.9% de costo.
RES_LAMINADA_KG = (Insumo(25.00, KG, COTIZADO, "aguja de res S/25/kg (dueño, 2026-09-30), laminada en frío", "2026-09-30"),
                   0.70)
# Carta v4 (2026-09-24): la res laminada ES una proteína del catálogo (P09, Philly y armador).
PROTEINA_KG["P09"] = RES_LAMINADA_KG

# Lo que el modelo usa HOY, escrito a mano en su día. `check:costos` lo compara contra la
# derivación de arriba; las cuatro que no reconcilian salen nombradas en su salida.
PORCION_EN_USO = {
    "P01": (3.15, 6.30), "P02": (2.47, 4.95), "P03": (2.49, 4.97), "P04": (3.25, 6.50),
    "P05": (4.29, 8.59), "P06": (2.95, 5.90), "P08": (3.76, 7.51), "P09": (3.04, 6.07),
}
# P01 y P02 salieron de la carta con la v4 (2026-09-24). Siguen acá porque el modelo todavía
# costea la carta de apertura para compararla (SIG_APERTURA en rentabilidad_por_parte.py).
# El atún no es proteína pura: la porción son 68 g de atún + 17 g de mayonesa.
EXTRA_PORCION = {"P04": (0.26, 0.52)}   # mayonesa, [ESTIMADO] ~S/15/kg


def porcion_derivada(code: str):
    """None cuando no hay rendimiento documentado: no se inventa uno para que cuadre."""
    ins, rend = PROTEINA_KG[code]
    if rend is None:
        return None
    extra = EXTRA_PORCION.get(code, (0.0, 0.0))
    if code == "P04":      # 80% del gramaje es atún, el resto mayonesa
        return tuple(round(ins.valor * g * 0.8 / rend + extra[i], 4)
                     for i, g in enumerate(GRAMAJE))
    return tuple(round(ins.valor * g / rend, 4) for g in GRAMAJE)


# ═══ CARTA AL ESTILO SUBWAY (dueño, 2026-09-30) ═════════════════════════════════════════
# Quesos: americano y cheddar tajados, 2 tajadas por sándwich (receta del dueño: «Queso: 2
# tajadas»). Precios de góndola online; en Makro al por mayor suelen bajar: confirmar ahí.
QUESO_AMERICANO_KG = Insumo(64.41, KG, COTIZADO,
                            "queso americano fundido tajado Lunchitas 170 g S/10.95 (Tottus online)", "2026-09-30")
QUESO_CHEDDAR_KG   = Insumo(52.94, KG, COTIZADO,
                            "queso cheddar fundido en tajadas Gloria 136 g S/7.20 (Tottus online)", "2026-09-30")
TAJADA_G = 17          # g por tajada: 170 g / 10 tajadas (Lunchitas), 136 g / 8 (Gloria)
TAJADAS_POR_SANDWICH = (1, 2)   # 15CM / 30CM — igual que Subway (dueño 2026-09-30): 1 tajada por 15CM
# Nombres del dueño (2026-09-30): PICKLES = pepinillo encurtido; PEPINILLO = pepino fresco en rodajas.
PICKLES_KG   = Insumo(40.00, KG, COTIZADO, "pickles (pepinillo encurtido) S/10 los 250 g escurridos (dueño)", "2026-09-30")
JALAPENO_KG  = Insumo(39.56, KG, COTIZADO,
                      "jalapeños en rodajas Valle Fértil frasco (225 g escurridos) S/8.90 Tottus; S/9.50 Vivanda",
                      "2026-09-30")
PEPINILLO_KG = Insumo(1.85, KG, COTIZADO, "pepinillo fresco (pepino) Tottus S/1.85/kg online; en mercado suele bajar", "2026-09-30")
LECHUGA_KG   = Insumo(4.00, KG, ESTIMADO, "lechuga a granel, Trujillo — cotizar en mercado", "2026-09-30")
TOMATE_KG    = Insumo(3.50, KG, ESTIMADO, "tomate a granel, Trujillo — cotizar en mercado", "2026-09-30")

def queso_porcion(ficha: Insumo):
    """(15CM, 30CM) en soles: tajadas × gramos × precio del kilo."""
    return tuple(round(n * TAJADA_G / 1000 * ficha.valor, 4) for n in TAJADAS_POR_SANDWICH)

# ── LA ALBÓNDIGA SE COSTEA DESDE SU RECETA (production_recipes id 3, la del panel) ──────────
# Tanda de 2 kg de carne → 90 albóndigas de 25 g → 30 porciones de 15CM (3 albóndigas), con su
# marinara. Cada ingrediente con su estado; el que pesa y no está cotizado es la lata de tomate.
ALBONDIGA_TANDA = [
    ("carne molida 15-20% grasa", 2.0,  PROTEINA_KG["P06"][0]),
    ("pan del día (200 g)",       1.0,  Insumo(2.67, PEDIDO, ESTIMADO, "200 g de pan sub a S/2 la unidad de ~150 g", "2026-09-30")),
    ("leche 220 ml",              1.0,  Insumo(1.06, PEDIDO, ESTIMADO, "leche ~S/4.80 el litro", "2026-09-30")),
    ("huevo ×2",                  1.0,  Insumo(1.00, PEDIDO, ESTIMADO, "huevo ~S/0.50 la unidad", "2026-09-30")),
    ("queso rallado 100 g",       0.10, Insumo(72.47, KG, COTIZADO, "parmesano granulado 454 g S/32.90 (Tottus online)", "2026-09-30")),
    ("ajo, perejil, sal, pimienta, orégano", 1.0, Insumo(1.82, PEDIDO, ESTIMADO, "condimentos de la tanda", "2026-09-30")),
    ("tomate pelado en lata 2.5 kg", 2.5, Insumo(16.25, KG, SIN_COTIZAR, "~S/6.50 la lata de 400 g — sin precio online", "2026-09-30")),
    ("aceite de oliva 100 ml",    1.0,  Insumo(3.50, PEDIDO, ESTIMADO, "aceite de oliva ~S/35 el litro", "2026-09-30")),
    ("cebolla 200 g",             0.2,  CEBOLLA_KG),
]
ALBONDIGA_PORCIONES = 30
def albondiga_porcion():
    tanda = sum(q * float(f.valor) for _, q, f in ALBONDIGA_TANDA)
    return round(tanda / ALBONDIGA_PORCIONES, 4), round(2 * tanda / ALBONDIGA_PORCIONES, 4)

TODAS = {
    "PAPEL_MANTECA": PAPEL_MANTECA, "BOLSA_KRAFT": BOLSA_KRAFT, "STICKER": STICKER,
    "EMPAQUE_CONSERVADOR": EMPAQUE_CONSERVADOR, "PAN_SUB": PAN_SUB,
    "PAN_FOCACCIA": PAN_FOCACCIA, "SALSA_PORCION": SALSA_PORCION,
    "QUESO_PORCION": QUESO_PORCION, "VEGETALES_KG": VEGETALES_KG, "CEBOLLA_KG": CEBOLLA_KG,
    "PIMIENTO_KG": PIMIENTO_KG, "RES_LAMINADA_KG": RES_LAMINADA_KG[0],
    "QUESO_AMERICANO_KG": QUESO_AMERICANO_KG, "QUESO_CHEDDAR_KG": QUESO_CHEDDAR_KG,
    "PICKLES_KG": PICKLES_KG, "JALAPENO_KG": JALAPENO_KG, "PEPINILLO_KG": PEPINILLO_KG,
    "LECHUGA_KG": LECHUGA_KG, "TOMATE_KG": TOMATE_KG,
    **{f"ALBONDIGA_{i}": f for i, (_, _, f) in enumerate(ALBONDIGA_TANDA)},
    **{f"PROTEINA_{k}": v[0] for k, v in PROTEINA_KG.items()},
}
