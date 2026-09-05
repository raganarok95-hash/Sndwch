"""
SND//WCH — ¿ES RENTABLE CADA PARTE DEL NEGOCIO, UNA POR UNA?

El modelo v11 mide el negocio ENTERO y contesta "no se llega a la meta". Esta pregunta es
anterior y más útil: **¿qué partes ganan plata y cuáles la pierden?** Un promedio sano puede
estar tapando una parte que sangra, y ninguna cantidad de publicidad arregla eso — al revés,
la publicidad multiplica lo que ya está mal.

CÓMO SE LEE EL "COSTO %": es insumos + empaque como porcentaje del precio de venta. El TECHO
acordado con el dueño es 45%. Más alto es PEOR. No es margen: es lo que se va en costo.

TODOS LOS PRECIOS Y RECETAS SALEN DE LA BASE, no de los literales del código. `catalog_prices`
y `catalog_items` son la fuente de verdad en runtime, y este archivo se escribió después de
leerlas (2026-09-05). Los literales del código son semilla del primer arranque.

REGLA: [COTIZADO] precio real de proveedor · [ESTIMADO] investigado, sin proveedor ·
[SIN COTIZAR] no existe el dato y se dice
"""

TECHO = 0.45   # [DECISIÓN del dueño] insumos+empaque como % del precio

# ── COSTOS DE INSUMO ──────────────────────────────────────────────────────────────────
EMPAQUE = 1.30           # [COTIZADO] papel manteca brandeado + bolsa, punto medio S/1.10-1.50
SALSA   = (0.266, 0.532) # por porción, 15CM / 30CM
QUESO   = (0.385, 0.770) # [ESTIMADO] proxy S/35/kg; hay un dato de S/22.50/kg para mozzarella
TOPS_KG = 4.00           # [ESTIMADO] promedio ponderado de los toppings de frasco y frescos

PAN = {  # [COTIZADO por el dueño] sub S/2 la unidad (15CM usa medio); focaccia S/13 = 10x15CM
    "B01": (1.00, 2.00), "B02": (1.00, 2.00), "B03": (1.30, 2.60),
}
RECARGO_PAN = {"B03": (0.50, 1.00)}   # lo que SE COBRA por la focaccia

# Costo por porción YA CON MERMA DE COCCIÓN (res 0.54, pollo 0.64-0.69)
PROT = {
    "P01": (3.15, 6.30, "[COTIZADO] res ~S/20/kg, rendimiento 0.54"),
    "P02": (2.47, 4.95, "[COTIZADO] pollo ~S/17/kg, rendimiento 0.64-0.69"),
    "P03": (2.49, 4.97, "[COTIZADO] pollo cajún, mismo rendimiento"),
    "P04": (3.25, 6.50, "[COTIZADO 2026-09-04] atún S/4 la lata de 140 g neto = S/43.96/kg"),
    "P05": (4.29, 8.59, "[ESTIMADO] embutido S/48/kg confirmado por el dueño, porción sin cotizar"),
    "P06": (1.34, 2.68, "[ESTIMADO] albóndiga, carne molida ~S/10/kg — SIN COTIZAR"),
}
PROT_NOM = {"P01": "Res asada", "P02": "Pollo teriyaki", "P03": "Pollo cajún",
            "P04": "Atún", "P05": "Embutido", "P06": "Albóndiga"}

# Gramaje de toppings — estándar Subway desde 2026-09-04
TOPS_G = {"T01": 35, "T02": 12, "T03": 7, "T04": 7, "T05": 3, "T06": 7, "T08": 7, "T09": 21}

# ── PRECIOS REALES, leídos de la base 2026-09-05 ──────────────────────────────────────
BYO = {  # catalog_prices, category='protein'
    "P01": (14.90, 24.90, 7.00, 14.00), "P02": (13.90, 23.90, 6.00, 11.00),
    "P03": (13.90, 23.90, 6.00, 11.00), "P04": (16.90, 32.90, 10.90, 21.90),
    "P05": (16.90, 32.90, 9.90, 19.90), "P06": (14.90, 26.90, 6.00, 6.00),
}
SIG = {  # catalog_items, fila vigente por item_id
    "SIG01": ("The Original", "B01", "P01", ["T01", "T02", "T03"], 2, None, 20.90, 26.90),
    "SIG02": ("The Marinara", "B01", "P06", ["T01", "T03", "T05"], 1, "C01", 21.90, 28.90),
    "SIG03": ("The Smoke",    "B03", "P05", ["T03", "T02", "T01"], 1, "C02", 23.90, 34.90),
    # Receta rehecha 2026-09-05: original de USA — atún escurrido, mayonesa y pimienta.
    "SIG04": ("The Fresh",    "B01", "P04", [],                     0, None, 20.90, 34.90),
    "SIG06": ("The Teriyaki", "B01", "P02", ["T01", "T06"],        2, None, 19.90, 25.90),
}
BEBIDA = {  # catalog_prices, category='side'
    "D06": ("The Bloom // Hibiscus", 6.0), "D07": ("The Midnight // Brew", 5.0),
    "D08": ("The Cool // Mint", 6.0),      "D09": ("The Spice // Chai", 9.0),
}
# ── COSTO DE LAS BEBIDAS ──────────────────────────────────────────────────────────────
#
# ENVASE: [COTIZADO por el dueño 2026-09-05] S/138 por 200 unidades = **S/0.69 la botella**.
# Era el número que faltaba, y estaba estimado en ~S/1 — o sea 31% más caro de lo real.
#
# INSUMO por vaso: [ESTIMADO, sigue sin cotizar] ~S/0.31-0.62 las tres infusiones (se toma el
# punto medio) y ~S/1.55 el chai, que es el único con costo alto de verdad (leche, cardamomo,
# jengibre). Salen de las tandas del RECETARIO.md, no de facturas de proveedor.
#
# Se costea POR BEBIDA y no con un porcentaje plano: el chai cuesta 3x lo que una infusión y
# se vende a 1.5x, así que un promedio esconde justo la que peor rinde.
ENVASE_BEBIDA = 0.69     # [COTIZADO] S/138 / 200 unidades
BEBIDA_INSUMO = {        # [ESTIMADO] por vaso, sin el envase
    "D06": 0.465, "D07": 0.465, "D08": 0.465, "D09": 1.55,
}
def costo_bebida(code):
    return BEBIDA_INSUMO[code] + ENVASE_BEBIDA
BEBIDA_COSTO_PCT = (sum(costo_bebida(c) for c in BEBIDA_INSUMO)
                    / sum(p for _n, p in [("", 6.0), ("", 5.0), ("", 6.0), ("", 9.0)]))

RECOMPENSA = {  # catalog_prices, category='reward' — recalibradas el 2026-09-05
    "R02": (20,  "4ta salsa gratis"),
    "R03": (320, "sube a 30CM gratis (tope S/8)"),
    "R04": (160, "doble proteína gratis"),
    "R05": (160, "bebida gratis (tope S/6)"),
    "R06": (400, "sándwich 15CM gratis"),
}

NS_BYO, FQ_BYO = 2, 0.60   # [MÉTODO] el cliente medio pone 2 salsas y 60% pone queso
# 73 g y no 92: salieron el apio (7 g, sin consumidor) y el pepinillo (12 g, cambiado por
# lechuga). El cliente puede llevárselos TODOS, así que esto es el peor caso de costo.
TOPS_BYO_G = 73
MIX15 = 0.80               # [HIPÓTESIS del dueño] 80% de los pedidos en 15CM
CULQI = 0.055
COMBO = 1.00               # descuento sándwich+bebida
OFFPEAK_CAP = 6.00         # tope de la bebida gratis de hora valle
R05_CAP, R03_CAP = 6.00, 8.00
GIFT_PTS_POR_SOL = 40
PLAN_PAGA, PLAN_RECIBE = 95.0, 100.0
COSTO_REFERIDO = 7.65
REF_INVITA, REF_INVITADO = 400, 120


def veg(gramos, i):
    return (gramos if i == 0 else gramos * 2) / 1000 * TOPS_KG


def costo_sig(sid, i):
    _n, base, p, tops, ns, queso, _p15, _p30 = SIG[sid]
    c = PROT[p][i] + PAN[base][i] + EMPAQUE + SALSA[i] * ns + veg(sum(TOPS_G[t] for t in tops), i)
    if queso:
        c += QUESO[i]
    return c


def costo_byo(p, i, pan="B01"):
    return (PROT[p][i] + PAN[pan][i] + EMPAQUE + SALSA[i] * NS_BYO
            + veg(TOPS_BYO_G, i) + QUESO[i] * FQ_BYO)


def fila(nombre, precio, costo, nota=""):
    pct = costo / precio if precio else float('inf')
    marca = "  <-- PASA EL TECHO" if pct > TECHO else ""
    return (f"  {nombre:<34} {precio:>7.2f} {costo:>7.2f} {precio-costo:>8.2f} "
            f"{pct*100:>7.1f}%{marca}{nota}"), pct


def cab(t):
    print(f"\n  {t}")
    print(f"  {'':<34} {'precio':>7} {'costo':>7} {'deja':>8} {'costo %':>8}")
    print("  " + "-" * 76)


def sep(t=''):
    print('\n' + '=' * 92)
    if t:
        print(t.center(92)); print('=' * 92)


if __name__ == "__main__":
    sep('SND//WCH — RENTABILIDAD DE CADA PARTE DEL NEGOCIO')
    print(f"""
  Precios y recetas leidos de `catalog_prices` y `catalog_items` (la base) el 2026-09-05,
  no de los literales del codigo. Techo acordado con el dueno: costo de insumos+empaque
  <= {TECHO*100:.0f}% del precio. Mas alto es PEOR.
""")

    malos = []

    # ── 1. SIGNATURES ─────────────────────────────────────────────────────────────────
    sep('1 · LOS 5 SIGNATURES')
    cab("15CM")
    for sid in SIG:
        n, _b, _p, _t, _ns, _q, p15, _p30 = SIG[sid]
        ln, pct = fila(f"{sid} {n}", p15, costo_sig(sid, 0))
        print(ln)
        if pct > TECHO:
            malos.append((f"{sid} {n} 15CM", pct))
    cab("30CM")
    for sid in SIG:
        n, _b, _p, _t, _ns, _q, _p15, p30 = SIG[sid]
        ln, pct = fila(f"{sid} {n}", p30, costo_sig(sid, 1))
        print(ln)
        if pct > TECHO:
            malos.append((f"{sid} {n} 30CM", pct))

    # ── 2. ARMA EL TUYO ───────────────────────────────────────────────────────────────
    sep('2 · ARMA EL TUYO — las 6 proteinas')
    cab("15CM")
    for p in BYO:
        ln, pct = fila(PROT_NOM[p], BYO[p][0], costo_byo(p, 0))
        print(ln)
        if pct > TECHO:
            malos.append((f"BYO {PROT_NOM[p]} 15CM", pct))
    cab("30CM")
    for p in BYO:
        ln, pct = fila(PROT_NOM[p], BYO[p][1], costo_byo(p, 1))
        print(ln)
        if pct > TECHO:
            malos.append((f"BYO {PROT_NOM[p]} 30CM", pct))

    cab("DOBLE PROTEINA (el recargo contra lo que cuesta la porcion extra)")
    for p in BYO:
        for i, et in ((0, "15CM"), (1, "30CM")):
            precio = BYO[p][2 + i]
            ln, pct = fila(f"{PROT_NOM[p]} {et}", precio, PROT[p][i])
            print(ln)
            if pct > TECHO:
                malos.append((f"doble {PROT_NOM[p]} {et}", pct))

    # ── 3. BEBIDAS ────────────────────────────────────────────────────────────────────
    sep('3 · LAS 4 BEBIDAS')
    print(f"""
  ⚠ EL COSTO DE LAS BEBIDAS NO ESTA COTIZADO. No existe el dato. CLAUDE.md dice que el
  margen real es 56-66% "con botella con tapa a rosca a ~S/1 (estimado, falta cotizar)".
  Aca se toma el punto medio ({(1-BEBIDA_COSTO_PCT)*100:.0f}% de margen) y se dice que es una suposicion, no una
  medicion. Cotizar el envase es lo unico que convierte esta tabla en un dato.
""")
    cab("a precio de carta")
    for d, (n, pr) in BEBIDA.items():
        ln, _ = fila(n, pr, costo_bebida(d))
        print(ln)
    cab(f"en combo (-S/{COMBO:.0f})")
    for d, (n, pr) in BEBIDA.items():
        ln, pct = fila(n, pr - COMBO, costo_bebida(d))
        print(ln)
        if pct > TECHO:
            malos.append((f"{n} en combo", pct))

    # ── 4. LOS MECANISMOS QUE REGALAN ─────────────────────────────────────────────────
    sep('4 · LOS MECANISMOS QUE REGALAN — cuanto cuesta cada uno de verdad')
    print(f"""
  Un punto se gana 1:1 por sol gastado. Asi que "cuantos soles hay que gastar para ganarse
  esto" es el descuento efectivo que el programa entrega. Se compara contra lo que a nosotros
  nos CUESTA honrarlo, que es lo unico que sale del bolsillo.
""")
    print(f"  {'recompensa':<34} {'puntos':>7} {'nos cuesta':>11} {'= descuento':>12} {'pts/sol':>9}")
    print("  " + "-" * 78)

    costo_r = {
        "R02": SALSA[0],
        "R03": costo_byo("P01", 1) - costo_byo("P01", 0),
        "R04": PROT["P01"][0],
        "R05": costo_bebida("D06"),   # el tope de S/6 cubre entero a D06/D08
        "R06": costo_byo("P02", 0),
    }
    for r, (pts, desc) in RECOMPENSA.items():
        c = costo_r[r]
        print(f"  {desc:<34} {pts:>7} {c:>11.2f} {c/pts*100:>11.2f}% {pts/max(c,0.01):>9.1f}")
    print(f"""
  La ultima columna es la "tasa de cambio" del programa: cuantos puntos cuesta cada sol de
  costo real. Si dos recompensas tienen tasas muy distintas, el cliente racional canjea
  siempre la mas barata y las otras son decorado.
""")

    # ── 5. LOS MECANISMOS QUE MUEVEN DINERO ──────────────────────────────────────────
    sep('5 · CREDITO, PLAN SEMANAL Y TARJETA DE REGALO')
    culqi_plan = PLAN_PAGA * CULQI
    print(f"""
  PLAN SEMANAL — paga S/{PLAN_PAGA:.0f} hoy, recibe S/{PLAN_RECIBE:.0f} de saldo.
     Entra ............ S/{PLAN_PAGA:>7.2f}
     Comision Culqi ... S/{culqi_plan:>7.2f}   (se cobra SIEMPRE con tarjeta)
     Entra limpio ..... S/{PLAN_PAGA-culqi_plan:>7.2f}
     Compromiso ....... S/{PLAN_RECIBE:>7.2f} de consumo futuro
     Descuento real ... {(1-(PLAN_PAGA-culqi_plan)/PLAN_RECIBE)*100:>7.1f}%  sobre todo lo que compre con ese saldo

     Es un descuento del {(1-(PLAN_PAGA-culqi_plan)/PLAN_RECIBE)*100:.1f}% a cambio de cobrar por adelantado. Con el costo de
     insumos al {TECHO*100:.0f}%, el pedido pagado con ese saldo sigue dejando margen — pero el descuento
     sale ENTERO de la contribucion, igual que cualquier promo.

  TARJETA DE REGALO — {GIFT_PTS_POR_SOL} puntos = S/1 de saldo para otro cliente.
     No entra plata: se convierten puntos ya ganados en credito. Cuesta {100/GIFT_PTS_POR_SOL:.1f}% de lo
     que el cliente gasto para ganar esos puntos. Es la misma tasa que R05 y R06, o sea
     coherente — y es la unica recompensa que ademas TRAE un cliente nuevo.

  CREDITO REGALADO — mueve saldo entre clientes, sin costo extra. Neutro.

  REFERIDO — {REF_INVITA} pts a quien invita + {REF_INVITADO} al invitado = S/{COSTO_REFERIDO:.2f} de costo real.
     Contra un CAC pagado de ~S/17.87, el referido cuesta 43% de lo que cuesta comprar el
     mismo cliente en Meta. Es el canal mas barato que tiene el negocio.
""")

    # ── 6. DELIVERY ──────────────────────────────────────────────────────────────────
    sep('6 · DELIVERY — pass-through, verificado')
    print("""
  El cliente paga el envio y el dueno se lo paga al motorizado. El negocio no gana ni
  subsidia. Dos detalles que lo mantienen en cero y que NO hay que romper:
     · En pago con tarjeta la tarifa se "engorda" por la comision de Culqi, para que el 5.5%
       no se coma el pass-through. Sin eso, cada envio con tarjeta perderia ~5.5% del flete.
     · El redondeo va hacia ARRIBA y `billableKm` devuelve null (nunca 0) cuando no puede
       medir: un 0 le cobraria el minimo a alguien a 10 km y esa diferencia la paga el dueno.

  CONCLUSION: el delivery esta bien construido y no es donde se pierde plata. Lo que SI hay
  que vigilar es que `orders.delivery_km` se compare de verdad contra lo que el motorizado
  cobro ese dia — la columna existe justo para eso y nadie la ha mirado todavia.
""")

    # ── 7. LO QUE SANGRA ─────────────────────────────────────────────────────────────
    sep('7 · LO QUE PASA EL TECHO, EN ORDEN')
    if not malos:
        print("\n  Nada pasa el techo.\n")
    else:
        print(f"\n  {'parte':<40} {'costo %':>9}  {'cuanto se pasa':>15}")
        print("  " + "-" * 70)
        for n, p in sorted(malos, key=lambda x: -x[1]):
            print(f"  {n:<40} {p*100:>8.1f}% {(p-TECHO)*100:>14.1f} pts")
    print(f"""
  ⚠ NADA DE ESTO SE ARREGLA CON PUBLICIDAD. Al contrario: la publicidad multiplica el
  volumen de lo que ya esta mal. Por eso hacer rentable cada parte va ANTES de gastar en
  captar, y no despues.
""")
