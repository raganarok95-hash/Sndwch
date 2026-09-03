# -*- coding: utf-8 -*-
"""
SND//WCH — Menú costeado con los datos COTIZADOS del dueño (2026-09-03, v2)

CORRIGE la v1 (modelo/menu_desde_la_raiz.py) en tres cosas que el dueño aclaró:
  1. El EMPAQUE está cotizado: S/1.10 a S/1.50 en total. No era un dato faltante.
  2. Los TOPPINGS están cotizados: el S/4/kg es el precio real, no un proxy genérico.
  3. El gramaje por topping sale del RECETARIO (dato propio), no de un bloque de "65 g de
     vegetales" tomado de Subway que la v1 usaba y que el propio análisis marcaba débil.

Y agrega la comparación que el dueño pidió: ¿estamos al nivel de Subway en toppings y carne?
"""

# ── COMPONENTES ──────────────────────────────────────────────────────────────────────
PROT = {
    "P01": (3.15, 6.30, "FUENTE",   "Res mechada · rend. 0.54"),
    "P02": (2.47, 4.95, "FUENTE",   "Pollo teriyaki · rend. 0.69"),
    "P03": (2.49, 4.97, "FUENTE",   "Pollo cajún · rend. 0.644"),
    "P04": (4.82, 9.64, "ESTIMADO", "Atún · S/67/kg sin cotizar"),
    "P05": (4.29, 8.59, "ESTIMADO", "Embutido · S/48/kg real, rend. estimado"),
    "P06": (1.34, 2.68, "ESTIMADO", "Albóndiga · rend. estimado 0.75"),
}
PAN = {"B01": (1.00, 2.00), "B03": (1.30, 2.60)}            # [COTIZADO]
EMPAQUE_MIN, EMPAQUE_MAX = 1.10, 1.50                        # [COTIZADO] dueño 2026-09-03
SALSA  = (0.266, 0.532)                                      # S/19/kg × 14 g / 28 g
QUESO  = (0.385, 0.77)                                       # S/35/kg × 11 g / 22 g
TOPS_KG = 4.0                                                # [COTIZADO] dueño 2026-09-03

# Gramaje por topping en 15CM — RECETARIO.md, dato propio.
TOPS_G = {"T01": 25, "T02": 15, "T03": 12, "T04": 12, "T05": 12, "T06": 18, "T08": 12}
TOPS_PUBLICOS = ["T01", "T02", "T03", "T05", "T06", "T08"]   # T04 jalapeño = menú secreto
G_TODOS_PUBLICOS = sum(TOPS_G[t] for t in TOPS_PUBLICOS)     # lo máximo que un cliente carga

def veg(g_total, size):
    """Costo de los vegetales por su gramaje real, no por un bloque plano."""
    g = g_total if size == "15" else g_total * 2
    return g / 1000 * TOPS_KG

def costo(base, prot, n_salsas, queso, g_tops, size, empaque):
    i = 0 if size == "15" else 1
    c = PROT[prot][i] + PAN[base][i] + empaque + SALSA[i] * n_salsas + veg(g_tops, size)
    if queso: c += QUESO[i]
    return round(c, 3)

TECHO = 0.45

BYO = {
    "P01": dict(n="Res // Asado",        p15=14.90, p30=22.90),
    "P02": dict(n="Pollo // Teriyaki",   p15=13.90, p30=21.90),
    "P03": dict(n="Pollo // Cajún",      p15=13.90, p30=21.90),
    "P04": dict(n="Atún // House",       p15=16.90, p30=30.90),
    "P05": dict(n="Embutido // Premium", p15=16.90, p30=30.90),
    "P06": dict(n="Albóndiga // Casa",   p15=14.90, p30=24.90),
}
SIGS = {
    "SIG01": dict(n="The Original", base="B01", prot="P01", ns=2, q=False, tops=52, p15=20.90, p30=26.90),
    "SIG02": dict(n="The Marinara", base="B01", prot="P06", ns=1, q=True,  tops=49, p15=21.90, p30=28.90),
    "SIG03": dict(n="The Smoke",    base="B03", prot="P05", ns=1, q=True,  tops=52, p15=23.90, p30=34.90),
    "SIG04": dict(n="The Fresh",    base="B01", prot="P04", ns=1, q=False, tops=52, p15=20.90, p30=34.90),
    "SIG06": dict(n="The Teriyaki", base="B01", prot="P02", ns=2, q=False, tops=43, p15=19.90, p30=25.90),
    "SIG05": dict(n="Menú secreto", base="B03", prot="P03", ns=2, q=False, tops=42, p15=24.90, p30=30.90),
}

print("=" * 94)
print("ARMA EL TUYO — peor caso REAL: pan sub, 3 salsas, queso, y los 6 toppings públicos")
print(f"(los 6 toppings suman {G_TODOS_PUBLICOS} g en 15CM = S/{veg(G_TODOS_PUBLICOS,'15'):.2f} al precio cotizado)")
print("=" * 94)
print(f"{'':<26} {'precio':>7} {'emp 1.10':>9} {'%':>6}   {'emp 1.50':>9} {'%':>6}")
cruzan = {1.10: 0, 1.50: 0}
peor = []
for k, b in BYO.items():
    for size, p in (("15", b["p15"]), ("30", b["p30"])):
        cmin = costo("B01", k, 3, True, G_TODOS_PUBLICOS, size, EMPAQUE_MIN)
        cmax = costo("B01", k, 3, True, G_TODOS_PUBLICOS, size, EMPAQUE_MAX)
        for emp, c in ((1.10, cmin), (1.50, cmax)):
            if c / p > TECHO: cruzan[emp] += 1
        al = " ⚠" if cmax / p > TECHO else "  "
        print(f"{b['n']+' '+size+'CM':<26} {p:>7.2f} {cmin:>9.2f} {cmin/p*100:>5.1f}%   "
              f"{cmax:>9.2f} {cmax/p*100:>5.1f}%{al}")
        peor.append((cmax / p, f"{b['n']} {size}CM", p, cmax))
print()
print(f"  Cruzan el techo de 45%:  con empaque S/1.10 → {cruzan[1.10]}/12 · con S/1.50 → {cruzan[1.50]}/12")

print()
print("=" * 94)
print("SIGNATURES — con el gramaje real de toppings de cada receta")
print("=" * 94)
print(f"{'':<26} {'precio':>7} {'emp 1.10':>9} {'%':>6}   {'emp 1.50':>9} {'%':>6}")
csig = {1.10: 0, 1.50: 0}
for k, s in SIGS.items():
    for size, p in (("15", s["p15"]), ("30", s["p30"])):
        cmin = costo(s["base"], s["prot"], s["ns"], s["q"], s["tops"], size, EMPAQUE_MIN)
        cmax = costo(s["base"], s["prot"], s["ns"], s["q"], s["tops"], size, EMPAQUE_MAX)
        for emp, c in ((1.10, cmin), (1.50, cmax)):
            if c / p > TECHO: csig[emp] += 1
        al = " ⚠" if cmax / p > TECHO else "  "
        print(f"{s['n']+' '+size+'CM':<26} {p:>7.2f} {cmin:>9.2f} {cmin/p*100:>5.1f}%   "
              f"{cmax:>9.2f} {cmax/p*100:>5.1f}%{al}")
print()
print(f"  Cruzan el techo de 45%:  con empaque S/1.10 → {csig[1.10]}/12 · con S/1.50 → {csig[1.50]}/12")

print()
print("=" * 94)
print("LO QUE CRUZA (peor caso, empaque S/1.50), de peor a mejor")
print("=" * 94)
for pct, nom, p, c in sorted(peor, reverse=True):
    if pct > TECHO:
        print(f"{nom:<26} {pct*100:>6.1f}%   precio {p:>6.2f} → necesita {c/TECHO:>6.2f}  (+{c/TECHO-p:>5.2f})")


# ══════════════════════════════════════════════════════════════════════════════════════
# ¿ESTAMOS AL NIVEL DE SUBWAY? — toppings y carne
# ══════════════════════════════════════════════════════════════════════════════════════
# Porciones estándar de Subway en el 6-inch (= nuestro 15CM), de su propia información
# nutricional. Ver fuentes en INGREDIENTES_DETALLE.md.
SUBWAY_6IN = {
    "Lechuga":   21,
    "Tomate":    35,   # 3 wheels
    "Pepinillo": 12,   # 3 chips
    "Cebolla":    7,
    "Pimiento":   7,   # green pepper
    "Aceituna":   3,   # 3 rings
}
NUESTRO_15 = {
    "Tomate":    25,
    "Pepinillo": 15,
    "Cebolla":   12,
    "Aceituna":  12,
    "Pimiento":  18,
    "Apio":      12,
    "Lechuga":    0,   # NO ESTÁ EN EL CATÁLOGO
}

print()
print("=" * 94)
print("NIVEL SUBWAY — toppings, gramaje en 15CM contra el 6-inch de Subway")
print("=" * 94)
print(f"{'topping':<14} {'nuestro':>9} {'Subway':>9} {'dif':>9}   {'':<24}")
falta_g = 0
for t in ["Lechuga", "Tomate", "Pepinillo", "Cebolla", "Pimiento", "Aceituna", "Apio"]:
    n = NUESTRO_15.get(t, 0)
    s = SUBWAY_6IN.get(t)
    if s is None:
        print(f"{t:<14} {n:>8} g {'—':>9} {'—':>9}   Subway no lo tiene")
        continue
    d = n - s
    if d < 0: falta_g += -d
    nota = ("⚠ FALTA — no está en el catálogo" if n == 0
            else f"{'+' if d>0 else ''}{d/s*100:.0f}%")
    print(f"{t:<14} {n:>8} g {s:>8} g {d:>+8} g   {nota}")
tot_n = sum(NUESTRO_15.values())
tot_s = sum(SUBWAY_6IN.values())
print(f"{'TOTAL':<14} {tot_n:>8} g {tot_s:>8} g {tot_n-tot_s:>+8} g")
print()
print(f"  En GRAMOS TOTALES estamos por encima ({tot_n} vs {tot_s}).")
print(f"  Pero el reparto está invertido: pesados en lo caro de frasco, y sin lechuga,")
print(f"  que es el mayor volumen del estándar de Subway.")
print()
costo_igualar = falta_g / 1000 * TOPS_KG
print(f"  Igualar a Subway donde estamos por debajo = +{falta_g} g "
      f"(lechuga 21 + tomate 10) = S/{costo_igualar:.2f} por 15CM.")
print(f"  Sobre el peor caso de Res 15CM eso mueve el insumo de 48.4% a "
      f"{(costo('B01','P01',3,True,G_TODOS_PUBLICOS,'15',EMPAQUE_MAX)+costo_igualar)/14.90*100:.1f}%.")

print()
print("=" * 94)
print("NIVEL SUBWAY — carne")
print("=" * 94)
print("  Nuestra porción: 85 g (15CM) · 170 g (30CM).")
print("  Subway 6-inch declara 24 g de proteína en roast beef y 26 g en pavo.")
print("  A ~28-30 g de proteína por 100 g de carne cocida, eso son ~80-90 g de carne.")
print("  → La carne YA está al nivel de Subway. No hay hueco que cerrar ahí.")
