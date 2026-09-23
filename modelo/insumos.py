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
    "P06": (Insumo(10.00, KG, SIN_COTIZAR, "carne molida ~S/10/kg — nunca se cotizó",
                   "2026-08-04"), None),
    "P08": (Insumo(44.20, KG, COTIZADO, "pavo S/44.20/kg al por mayor — el mismo que el "
                                        "retail de Braedt", "2026-09-12"), 1.00),
}
# Rendimientos documentados: res 0.54 (limpieza 10% + cocción 40%), pollo 0.64-0.69 (se usa
# el punto medio 0.665), res laminada 0.567. El atún y el pavo rinden 1.00 porque no se
# cocinan. De P05 y P06 NUNCA se documentó ninguno.
# Res laminada en frío: el corte del Philly. El rendimiento es SUPUESTO y hay que medirlo en
# la primera tanda — con 0.55 en vez de 0.70 el Philly 15CM pasa de 23.6% a 27.9% de costo.
RES_LAMINADA_KG = (Insumo(20.00, KG, COTIZADO, "res ~S/20/kg, laminada en frío", "2026-08-01"),
                   0.70)

# Lo que el modelo usa HOY, escrito a mano en su día. `check:costos` lo compara contra la
# derivación de arriba; las cuatro que no reconcilian salen nombradas en su salida.
PORCION_EN_USO = {
    "P01": (3.15, 6.30), "P02": (2.47, 4.95), "P03": (2.49, 4.97), "P04": (3.25, 6.50),
    "P05": (4.29, 8.59), "P06": (1.34, 2.68), "P08": (3.76, 7.51),
}
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


TODAS = {
    "PAPEL_MANTECA": PAPEL_MANTECA, "BOLSA_KRAFT": BOLSA_KRAFT, "STICKER": STICKER,
    "EMPAQUE_CONSERVADOR": EMPAQUE_CONSERVADOR, "PAN_SUB": PAN_SUB,
    "PAN_FOCACCIA": PAN_FOCACCIA, "SALSA_PORCION": SALSA_PORCION,
    "QUESO_PORCION": QUESO_PORCION, "VEGETALES_KG": VEGETALES_KG, "CEBOLLA_KG": CEBOLLA_KG,
    "PIMIENTO_KG": PIMIENTO_KG, "RES_LAMINADA_KG": RES_LAMINADA_KG[0],
    **{f"PROTEINA_{k}": v[0] for k, v in PROTEINA_KG.items()},
}
