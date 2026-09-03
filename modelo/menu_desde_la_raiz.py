# -*- coding: utf-8 -*-
"""
SND//WCH — Costeo del menú DESDE LA RAÍZ (2026-09-03)

No parte de ningún margen ya calculado: reconstruye el costo de cada ítem sumando
componentes con su gramaje y su precio por kilo, y recién al final lo compara contra el
precio de carta vigente (verificado contra catalog_prices/catalog_items en la base).

FUENTES DE CADA NÚMERO — etiquetadas, porque la mitad del catálogo se apoya en estimados
sin cotizar y un total que mezcla las dos cosas se lee como si estuviera todo medido.
  [MEDIDO]    dato real del dueño o de proveedor confirmado
  [FUENTE]    investigado con fuente citada en MENU_FINANCIAL_ANALYSIS.md
  [ESTIMADO]  sin cotización real — el número más frágil del modelo
"""

# ── COMPONENTES ──────────────────────────────────────────────────────────────────────
# Costo por PORCIÓN ya con merma de cocción (el error que este repo cometió hasta el
# 2026-08-22 fue costear gramos servidos × precio del insumo CRUDO).
PROT = {
    "P01": (3.15, 6.30, "FUENTE",   "Res mechada  · rend. 0.54"),
    "P02": (2.47, 4.95, "FUENTE",   "Pollo teriyaki · rend. 0.69"),
    "P03": (2.49, 4.97, "FUENTE",   "Pollo cajún · rend. 0.644"),
    "P04": (4.82, 9.64, "ESTIMADO", "Atún · S/67/kg sin cotizar"),
    "P05": (4.29, 8.59, "ESTIMADO", "Embutido · S/48/kg real, rend. estimado"),
    "P06": (1.34, 2.68, "ESTIMADO", "Albóndiga · rend. estimado 0.75"),
}
PAN = {"B01": (1.00, 2.00, "MEDIDO"), "B03": (1.30, 2.60, "MEDIDO")}
EMPAQUE  = 1.10   # [FUENTE] papel manteca brandeado + bolsa, por sándwich
SALSA    = (0.266, 0.532)   # [FUENTE] S/19/kg × 14 g / 28 g
VEGETAL  = (0.26,  0.52)    # [FUENTE] S/4/kg × 65 g / 130 g — el gramaje es dato DÉBIL
QUESO    = (0.385, 0.77)    # [FUENTE] S/35/kg × 11 g / 22 g

def costo(base, prot, n_salsas, queso, size):
    i = 0 if size == "15" else 1
    c  = PROT[prot][i]
    c += PAN[base][i]
    c += EMPAQUE
    c += SALSA[i] * n_salsas
    c += VEGETAL[i]
    if queso: c += QUESO[i]
    return round(c, 3)

def fuente(prot):
    return PROT[prot][2]

# ── CATÁLOGO VIGENTE (verificado contra la base el 2026-09-03) ───────────────────────
SIGS = {
    "SIG01": dict(n="The Original", base="B01", prot="P01", ns=2, q=False, p15=20.90, p30=26.90),
    "SIG02": dict(n="The Marinara", base="B01", prot="P06", ns=1, q=True,  p15=21.90, p30=28.90),
    "SIG03": dict(n="The Smoke",    base="B03", prot="P05", ns=1, q=True,  p15=23.90, p30=34.90),
    "SIG04": dict(n="The Fresh",    base="B01", prot="P04", ns=1, q=False, p15=20.90, p30=34.90),
    "SIG06": dict(n="The Teriyaki", base="B01", prot="P02", ns=2, q=False, p15=19.90, p30=25.90),
    "SIG05": dict(n="Menú secreto", base="B03", prot="P03", ns=2, q=False, p15=24.90, p30=30.90),
}
# ARMA EL TUYO: el cliente elige. Se costea el peor caso realista que el precio TIENE que
# cubrir — pan sub, queso puesto (es gratis) y 3 salsas (el máximo sin pagar extra).
BYO = {
    "P01": dict(n="Res // Asado",     p15=14.90, p30=22.90),
    "P02": dict(n="Pollo // Teriyaki",p15=13.90, p30=21.90),
    "P03": dict(n="Pollo // Cajún",   p15=13.90, p30=21.90),
    "P04": dict(n="Atún // House",    p15=16.90, p30=30.90),
    "P05": dict(n="Embutido // Premium", p15=16.90, p30=30.90),
    "P06": dict(n="Albóndiga // Casa",p15=14.90, p30=24.90),
}
BYO_SALSAS_INCLUIDAS = 3
TECHO = 0.45   # [DECISIÓN del dueño] insumos+empaque como % del precio de venta

def fila(nombre, precio, c, marca=""):
    pct = c / precio
    cruza = "  ⚠ CRUZA" if pct > TECHO else ""
    return f"{nombre:<26} {precio:>7.2f} {c:>7.2f} {pct*100:>6.1f}% {precio-c:>7.2f}{cruza}{marca}"

print("=" * 92)
print("SIGNATURES — costo reconstruido desde componentes")
print("=" * 92)
print(f"{'':<26} {'precio':>7} {'costo':>7} {'insumo':>7} {'deja':>7}")
for k, s in SIGS.items():
    for size, p in (("15", s["p15"]), ("30", s["p30"])):
        c = costo(s["base"], s["prot"], s["ns"], s["q"], size)
        marca = "" if fuente(s["prot"]) != "ESTIMADO" else "  [costo ESTIMADO]"
        print(fila(f"{s['n']} {size}CM", p, c, marca))
    print()

print("=" * 92)
print(f"ARMA EL TUYO — peor caso que el precio debe cubrir (pan sub, queso, {BYO_SALSAS_INCLUIDAS} salsas)")
print("=" * 92)
peores = []
for k, b in BYO.items():
    for size, p in (("15", b["p15"]), ("30", b["p30"])):
        c = costo("B01", k, BYO_SALSAS_INCLUIDAS, True, size)
        marca = "" if fuente(k) != "ESTIMADO" else "  [costo ESTIMADO]"
        print(fila(f"{b['n']} {size}CM", p, c, marca))
        peores.append((c / p, f"{b['n']} {size}CM", p, c))
    print()

print("=" * 92)
print("LO QUE CRUZA EL TECHO DE 45%, de peor a mejor")
print("=" * 92)
for pct, nom, p, c in sorted(peores, reverse=True):
    if pct > TECHO:
        # Cuánto habría que subir el precio para volver justo al techo.
        necesario = c / TECHO
        print(f"{nom:<26} {pct*100:>6.1f}%   precio {p:>6.2f} → necesita {necesario:>6.2f}  (+{necesario-p:>4.2f})")


# ══════════════════════════════════════════════════════════════════════════════════════
# LA RAÍZ: el precio se fijó contra una CONFIGURACIÓN DE MUESTRA, no contra lo que el
# cliente puede pedir de verdad.
# ══════════════════════════════════════════════════════════════════════════════════════
# En ARMA EL TUYO son gratis: hasta 3 salsas, el queso, y los toppings SIN LÍMITE
# ("Sin límite, elige los que quieras" en el builder; el servidor solo impide repetir el
# mismo). Un precio tiene que cubrir el peor pedido posible, no el pedido promedio.
N_TOPS = 7                    # T01..T06, T08 — todos elegibles a la vez, todos gratis
TOPS_EN_LA_MUESTRA = 3        # lo que asume el gramaje de 65 g del modelo original

def costo_config(base, prot, n_salsas, queso, n_tops, size):
    i = 0 if size == "15" else 1
    veg = VEGETAL[i] * (n_tops / TOPS_EN_LA_MUESTRA)   # el gramaje escala con los toppings
    c = PROT[prot][i] + PAN[base][i] + EMPAQUE + SALSA[i] * n_salsas + veg
    if queso: c += QUESO[i]
    return round(c, 3)

print()
print("=" * 92)
print("EL HUECO ENTRE 'LA MUESTRA' Y 'LO QUE SE PUEDE PEDIR' — ARMA EL TUYO")
print("=" * 92)
print(f"{'':<26} {'precio':>7} {'muestra':>8} {'peor':>7} {'muestra':>8} {'peor':>7}")
print(f"{'':<26} {'':>7} {'2sls sq':>8} {'3sls+q':>7} {'%':>8} {'%':>7}")
for k, b in BYO.items():
    for size, p in (("15", b["p15"]), ("30", b["p30"])):
        muestra = costo_config("B01", k, 2, False, TOPS_EN_LA_MUESTRA, size)
        peor    = costo_config("B01", k, 3, True,  N_TOPS,             size)
        al = "  ⚠" if peor / p > TECHO else "   "
        print(f"{b['n']+' '+size+'CM':<26} {p:>7.2f} {muestra:>8.2f} {peor:>7.2f} "
              f"{muestra/p*100:>7.1f}% {peor/p*100:>6.1f}%{al}")

print()
print("=" * 92)
print("EL PISO FIJO: lo que cuesta un sándwich ANTES de la proteína")
print("=" * 92)
for size in ("15", "30"):
    i = 0 if size == "15" else 1
    pan = PAN["B01"][i]
    sls = SALSA[i] * 3
    veg = VEGETAL[i] * (N_TOPS / TOPS_EN_LA_MUESTRA)
    q   = QUESO[i]
    piso = pan + EMPAQUE + sls + veg + q
    print(f"  {size}CM: pan {pan:.2f} + empaque {EMPAQUE:.2f} + 3 salsas {sls:.2f} "
          f"+ {N_TOPS} toppings {veg:.2f} + queso {q:.2f} = S/{piso:.2f}")
    print(f"        → al techo del 45%, ese piso solo ya exige cobrar S/{piso/TECHO:.2f} "
          f"antes de poner UN GRAMO de proteína")


# ══════════════════════════════════════════════════════════════════════════════════════
# LECTURA CONSERVADORA: sin escalar el peso de vegetales
# ══════════════════════════════════════════════════════════════════════════════════════
# El gramaje de 65 g está marcado "dato débil" en el propio análisis, y es discutible que
# elegir 7 toppings en vez de 3 triplique el relleno (probablemente reparte el mismo
# volumen entre más tipos). Esta lectura NO escala nada: solo cuenta lo que es
# indiscutiblemente gratis y adicional — la 3ra salsa y el queso.
print()
print("=" * 92)
print("LECTURA CONSERVADORA — vegetales FIJOS, solo se suma lo indiscutible (3ra salsa + queso)")
print("=" * 92)
cruzan_cons = 0
for k, b in BYO.items():
    for size, p in (("15", b["p15"]), ("30", b["p30"])):
        c = costo("B01", k, 3, True, size)
        if c / p > TECHO: cruzan_cons += 1
print(f"  Cruzan el techo de 45%: {cruzan_cons} de 12 combinaciones")
cruzan_agr = sum(1 for k,b in BYO.items() for size,p in (("15",b["p15"]),("30",b["p30"]))
                 if costo_config("B01",k,3,True,N_TOPS,size)/p > TECHO)
print(f"  Con toppings escalados : {cruzan_agr} de 12")
print("  → El hallazgo NO depende del supuesto débil: aguanta en la lectura conservadora.")

# ══════════════════════════════════════════════════════════════════════════════════════
# CUÁNTO CUESTA DE VERDAD HONRAR CADA RECOMPENSA
# ══════════════════════════════════════════════════════════════════════════════════════
# Los puntos se ganan 1:1 por sol gastado. La pregunta correcta no es "cuántos puntos
# cuesta" sino "cuánto MARGEN entrega cada canje", porque el descuento sale entero del
# margen (el costo del insumo no baja).
print()
print("=" * 92)
print("RECOMPENSAS — puntos exigidos contra COSTO REAL de honrarlas")
print("=" * 92)
# Peor caso de cada una, que es el que el cliente racional va a elegir.
r02 = SALSA[1]                                             # 4ta salsa, en 30CM
r03 = costo("B01","P01",3,True,"30") - costo("B01","P01",3,True,"15")  # subir a 30CM
r04 = PROT["P01"][1]                                       # doble proteína en 30CM
r05 = 6 * 0.44                                             # bebida más cara cubierta por el tope
r06 = costo("B01","P01",3,True,"15")                       # 15CM gratis, el más caro elegible
for nom, pts, costo_real, valor_carta in (
    ("R02 4ta salsa",     40,  r02, 2.00),
    ("R03 subir a 30CM",  160, r03, 8.00),
    ("R04 doble proteína",120, r04, 14.00),
    ("R05 bebida gratis", 120, r05, 6.00),
    ("R06 15CM gratis",   400, r06, 14.90),
):
    print(f"{nom:<22} {pts:>4} pts   cuesta S/{costo_real:>5.2f}   vale S/{valor_carta:>5.2f} "
          f"→ {pts/valor_carta:>5.1f} pts/sol de carta · {pts/costo_real:>5.1f} pts/sol de COSTO")
print()
print("  La tasa que importa es la de COSTO: es la plata que de verdad sale del negocio.")


# ══════════════════════════════════════════════════════════════════════════════════════
# SENSIBILIDAD AL EMPAQUE — el número que estás por convertir en una compra real
# ══════════════════════════════════════════════════════════════════════════════════════
# S/1.10 viene de una investigación online de la v2, NO de una cotización. Y describe un
# empaque genérico; el confirmado es "papel manteca brandeado premium + bolsa". Es el
# único costo del modelo que está a punto de volverse un hecho, así que conviene saber
# cuánto aguanta el menú antes de que importe.
print()
print("=" * 92)
print("SENSIBILIDAD AL EMPAQUE — cuántas combinaciones BYO cruzan el 45%")
print("=" * 92)
orig = EMPAQUE
for emp in (1.10, 1.50, 2.00, 2.50, 3.00):
    globals()["EMPAQUE"] = emp
    cons = sum(1 for k,b in BYO.items() for size,p in (("15",b["p15"]),("30",b["p30"]))
               if costo("B01",k,3,True,size)/p > TECHO)
    sigs = sum(1 for k,s in SIGS.items() for size,p in (("15",s["p15"]),("30",s["p30"]))
               if costo(s["base"],s["prot"],s["ns"],s["q"],size)/p > TECHO)
    marca = "  ← el supuesto actual, SIN cotizar" if emp == 1.10 else ""
    print(f"  empaque S/{emp:.2f}   BYO: {cons:>2}/12 cruzan   Signatures: {sigs:>2}/12 cruzan{marca}")
globals()["EMPAQUE"] = orig
print()
print("  Los Signatures aguantan hasta empaque caro; el BYO ya está roto con el barato.")
print("  ⚠ Además el modelo cobra el empaque por SÁNDWICH y la fuente lo dice por PEDIDO:")
print("    en un pedido de 2+ sándwiches el costo real es menor. Error hacia lo conservador.")
