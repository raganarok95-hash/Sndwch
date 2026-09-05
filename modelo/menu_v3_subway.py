# -*- coding: utf-8 -*-
"""
SND//WCH — El menú con gramajes AL NIVEL DE SUBWAY (2026-09-03, v3)

Pedido del dueño: igualar los toppings al estándar de Subway (y la carne, que ya lo estaba)
y recalcular. Si a esos gramajes el margen no cierra, encontrar el camino que sí cierra.

Todo lo de costos es COTIZADO salvo donde diga ESTIMADO.
"""
PROT = {  # costo de la porción TERMINADA, ya con merma
    "P01": (3.15, 6.30, "res mechada"),
    "P02": (2.47, 4.95, "pollo teriyaki"),
    "P03": (2.49, 4.97, "pollo cajún"),
    "P04": (4.82, 9.64, "atún  [ESTIMADO]"),
    "P05": (4.29, 8.59, "embutido  [ESTIMADO]"),
    "P06": (1.34, 2.68, "albóndiga  [ESTIMADO]"),
}
PAN      = {"B01": (1.00, 2.00), "B03": (1.30, 2.60)}
SALSA    = (0.266, 0.532)
QUESO    = (0.385, 0.77)
TOPS_KG  = 4.0
TECHO    = 0.45

# ── LOS DOS ESQUEMAS DE TOPPINGS ─────────────────────────────────────────────────────
HOY = {"Tomate":25, "Pepinillo":15, "Cebolla":12, "Aceituna":12, "Pimiento":18, "Apio":12}
# Subway 6-inch, de su información nutricional. El apio no existe en Subway: se deja en el
# nivel de sus vegetales menores (7 g), que es el criterio equivalente.
SUBWAY = {"Lechuga":21, "Tomate":35, "Pepinillo":12, "Cebolla":7, "Pimiento":7,
          "Aceituna":3, "Apio":7}

def g(esq): return sum(esq.values())
def veg(esq, size):
    return (g(esq) if size == "15" else g(esq) * 2) / 1000 * TOPS_KG

print("=" * 88)
print("PASO 1 — ¿Cuánto cambia el costo al pasar a gramajes de Subway?")
print("=" * 88)
print(f"{'topping':<12} {'hoy':>7} {'Subway':>8} {'dif':>7}")
for t in ["Lechuga","Tomate","Pepinillo","Cebolla","Pimiento","Aceituna","Apio"]:
    h, s = HOY.get(t,0), SUBWAY[t]
    print(f"{t:<12} {h:>5} g {s:>6} g {s-h:>+5} g")
print(f"{'TOTAL':<12} {g(HOY):>5} g {g(SUBWAY):>6} g {g(SUBWAY)-g(HOY):>+5} g")
print()
print(f"  Costo de los toppings en 15CM:  hoy S/{veg(HOY,'15'):.3f}  →  Subway S/{veg(SUBWAY,'15'):.3f}"
      f"   (+S/{veg(SUBWAY,'15')-veg(HOY,'15'):.3f})")
print(f"  Costo de los toppings en 30CM:  hoy S/{veg(HOY,'30'):.3f}  →  Subway S/{veg(SUBWAY,'30'):.3f}"
      f"   (+S/{veg(SUBWAY,'30')-veg(HOY,'30'):.3f})")
print()
print("  → Subir a nivel Subway cuesta menos de 2 céntimos por sándwich.")
print("    No es un cambio de costo: es una REDISTRIBUCIÓN. Entra lechuga (21 g) y sube el")
print("    tomate (+10 g); bajan aceituna, pimiento y cebolla, que hoy están 2-4x por")
print("    encima de Subway y son los que vienen en frasco.")


def costo(base, prot, n_salsas, queso, esq, size, empaque):
    i = 0 if size == "15" else 1
    c = PROT[prot][i] + PAN[base][i] + empaque + SALSA[i]*n_salsas + veg(esq, size)
    if queso: c += QUESO[i]
    return round(c, 3)

BYO = {
    "P01": ("Res // Asado",        14.90, 22.90),
    "P02": ("Pollo // Teriyaki",   13.90, 21.90),
    "P03": ("Pollo // Cajún",      13.90, 21.90),
    "P04": ("Atún // House",       16.90, 30.90),
    "P05": ("Embutido // Premium", 16.90, 30.90),
    "P06": ("Albóndiga // Casa",   14.90, 24.90),
}
EMP = 1.30   # punto medio del rango cotizado S/1.10-1.50

print()
print("=" * 88)
print(f"PASO 2 — ARMA EL TUYO con gramajes Subway, peor caso (3 salsas + queso), empaque S/{EMP:.2f}")
print("=" * 88)
print(f"{'':<24} {'precio':>7} {'costo':>7} {'insumo':>7} {'deja':>7}")
filas = []
for k,(n,p15,p30) in BYO.items():
    for size, p in (("15",p15), ("30",p30)):
        c = costo("B01", k, 3, True, SUBWAY, size, EMP)
        al = " ⚠" if c/p > TECHO else "  "
        print(f"{n+' '+size+'CM':<24} {p:>7.2f} {c:>7.2f} {c/p*100:>6.1f}% {p-c:>7.2f}{al}")
        filas.append((k, n, size, p, c))
    print()
cruzan = [f for f in filas if f[4]/f[3] > TECHO]
print(f"  Cruzan el techo de 45%: {len(cruzan)} de 12.")

print()
print("=" * 88)
print("PASO 3 — Por qué cruza: de dónde sale cada sol del costo")
print("=" * 88)
for size in ("15","30"):
    i = 0 if size=="15" else 1
    pan, sls, vg, q = PAN["B01"][i], SALSA[i]*3, veg(SUBWAY,size), QUESO[i]
    piso = pan + EMP + sls + vg + q
    print(f"\n  {size}CM — piso fijo (todo lo que NO es proteína):")
    print(f"    pan {pan:.2f} · empaque {EMP:.2f} · 3 salsas {sls:.2f} · toppings {vg:.2f} · queso {q:.2f}"
          f"  =  S/{piso:.2f}")
    print(f"    Los toppings son solo el {vg/piso*100:.0f}% de ese piso. El empaque y el pan son el "
          f"{(pan+EMP)/piso*100:.0f}%.")
    print(f"    Al techo del 45%, ese piso EXIGE cobrar S/{piso/TECHO:.2f} antes de la proteína.")
print()
print("  → El problema NO son los toppings (5-6% del costo). Son el piso fijo y la proteína.")


print()
print("=" * 88)
print("PASO 4 — LOS CAMINOS QUE SÍ CIERRAN")
print("=" * 88)

def tabla(nombre, n_salsas, queso, subida, nota):
    print(f"\n### {nombre}")
    print(f"    {nota}")
    print(f"    {'':<24} {'precio':>7} {'costo':>7} {'insumo':>7} {'deja':>7}")
    n_cruzan, deja_total = 0, 0
    for k,(n,p15,p30) in BYO.items():
        for size, p0 in (("15",p15), ("30",p30)):
            p = p0 + subida.get(size, 0)
            c = costo("B01", k, n_salsas, queso, SUBWAY, size, EMP)
            if c/p > TECHO: n_cruzan += 1
            deja_total += p - c
            al = " ⚠" if c/p > TECHO else "  "
            print(f"    {n+' '+size+'CM':<24} {p:>7.2f} {c:>7.2f} {c/p*100:>6.1f}% {p-c:>7.2f}{al}")
    print(f"    → cruzan {n_cruzan}/12 · contribución media S/{deja_total/12:.2f}")
    return n_cruzan, deja_total/12

base_cruzan, base_deja = 10, sum(p-costo("B01",k,3,True,SUBWAY,s,EMP)
                                 for k,(n,a,b) in BYO.items()
                                 for s,p in (("15",a),("30",b)))/12

print(f"\n### PUNTO DE PARTIDA (hoy, con gramajes Subway)")
print(f"    cruzan 10/12 · contribución media S/{base_deja:.2f}")

# A) Cortar lo que hoy es gratis y nadie paga.
tabla("CAMINO A — cortar lo gratis: 2 salsas incluidas (la 3ra a S/2) y el queso a S/1",
      2, False, {},
      "El queso pasa a cobrarse aparte (no entra al costo del build) y la 3ra salsa sale del paquete.")

# B) Solo subir el precio, sin tocar nada de lo que el cliente recibe.
print("\n### CAMINO B — solo subir precio, sin quitarle nada al cliente")
print("    Lo mínimo que cada uno necesita para quedar justo en 45%:")
tot = 0
for k,(n,p15,p30) in BYO.items():
    for size, p in (("15",p15), ("30",p30)):
        c = costo("B01", k, 3, True, SUBWAY, size, EMP)
        need = c / TECHO
        sube = max(0, need - p)
        tot += sube
        if sube > 0:
            print(f"    {n+' '+size+'CM':<24} {p:>7.2f} → {need:>6.2f}   (+{sube:>4.2f})")
print(f"    → subida media sobre las 12: +S/{tot/12:.2f}")

# C) Mixto: cortar lo gratis + subida chica pareja.
for sube in (1.0, 2.0):
    tabla(f"CAMINO C — cortar lo gratis Y subir +S/{sube:.0f} en 30CM",
          2, False, {"30": sube},
          f"Combina A con una subida solo en el 30CM, que es donde se rompe.")


print()
print("=" * 88)
print("PASO 5 — ⚠ EL 45% CASTIGA JUSTO AL PRODUCTO QUE MÁS DEJA")
print("=" * 88)
print("  El techo del 45% es un PORCENTAJE. Lo que paga las cuentas son SOLES.\n")
print(f"  {'':<24} {'insumo':>8} {'deja S/':>9}")
for k in ("P01","P04"):
    n,p15,p30 = BYO[k]
    for size,p in (("15",p15),("30",p30)):
        c = costo("B01",k,3,True,SUBWAY,size,EMP)
        print(f"  {n+' '+size+'CM':<24} {c/p*100:>7.1f}% {p-c:>9.2f}")
c15 = costo("B01","P01",3,True,SUBWAY,"15",EMP); c30 = costo("B01","P01",3,True,SUBWAY,"30",EMP)
print(f"\n  Res 30CM tiene PEOR porcentaje (55.5% vs 47.0%) y deja S/{(22.90-c30)-(14.90-c15):.2f} MÁS por pedido.")
print("  CLAUDE.md ya documenta que el cuello de botella de este negocio es la DEMANDA, no la")
print("  cocina (~40 pedidos/día de capacidad). Con la demanda como límite, lo que importa es")
print("  cuánto deja CADA pedido, no qué porcentaje del precio se fue en insumo.")
print("\n  El 45% sirve para no vender por debajo del costo y para comparar productos entre sí.")
print("  NO sirve como regla para decidir si el 30CM debe existir: por esa regla habría que")
print("  empujar al cliente al 15CM, que deja S/2.30 MENOS por pedido.")

# Mezcla del plan: 80% en 15CM.
print()
print("=" * 88)
print("PASO 6 — Qué pasa con la caja, a la mezcla del plan (80% en 15CM)")
print("=" * 88)
MIX15 = 0.80
def contrib_media(n_salsas, queso, subida, extra_cobrado=0.0):
    """Contribución media ponderada por la mezcla, sobre las 5 proteínas públicas."""
    tot = 0; n = 0
    for k,(nom,p15,p30) in BYO.items():
        if k == "P03": continue           # menú secreto, no es BYO público
        c15 = costo("B01",k,n_salsas,queso,SUBWAY,"15",EMP)
        c30 = costo("B01",k,n_salsas,queso,SUBWAY,"30",EMP)
        d = MIX15*((p15+subida.get("15",0))-c15) + (1-MIX15)*((p30+subida.get("30",0))-c30)
        tot += d + extra_cobrado; n += 1
    return tot/n

hoy   = contrib_media(3, True, {})
camA  = contrib_media(2, False, {}, extra_cobrado=0.30)   # ~30% pide queso a S/1
camC1 = contrib_media(2, False, {"30":1.0}, extra_cobrado=0.30)
camC2 = contrib_media(2, False, {"30":2.0}, extra_cobrado=0.30)
print(f"  Hoy (gramajes Subway, todo gratis)          S/{hoy:.2f} por sándwich")
print(f"  Camino A (cortar lo gratis)                 S/{camA:.2f}   (+S/{camA-hoy:.2f})")
print(f"  Camino C (+S/1 en 30CM)                     S/{camC1:.2f}   (+S/{camC1-hoy:.2f})")
print(f"  Camino C (+S/2 en 30CM)                     S/{camC2:.2f}   (+S/{camC2-hoy:.2f})")
print()
print("  A 1,411 pedidos/mes (el mes 6 del plan), cada S/1 de contribución = S/1,411/mes.")
for nom, v in (("Camino A", camA-hoy), ("Camino C +S/1", camC1-hoy), ("Camino C +S/2", camC2-hoy)):
    print(f"    {nom:<16} → S/{v*1411:>8,.0f}/mes")
