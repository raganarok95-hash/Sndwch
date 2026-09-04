# -*- coding: utf-8 -*-
"""
SND//WCH — COMPARATIVA DE LAS TRES VERSIONES DEL MENÚ (2026-09-04)

Corre el modelo v10 REAL tres veces, cambiando UNA sola cosa: la contribución por pedido
de cada versión del menú. No reimplementa la simulación — carga las funciones de
`modelo_v10.py` tal cual y solo sustituye CONTRIB_PEDIDO.

  1. ANTERIOR  el menú de antes del 2026-09-03: sin recargo de focaccia, toppings viejos,
               atún a S/67/kg (investigado, sin proveedor), 30CM sin el +S/2, tarjeta como
               método por defecto.
  2. ACTUAL    lo que está desplegado hoy: focaccia cobrada, gramajes Subway con lechuga,
               atún cotizado a S/43.96/kg, +S/2 en el 30CM, Yape/Plin por defecto.
  3. SUBWAY    la actual + los tres vegetales que faltan para igualar a Subway Perú
               (pepino 17 g, espinaca 7 g, ají banana 4 g), GRATIS como el resto.

⚠ DOS CORRECCIONES AL NÚMERO QUE EL MODELO VENÍA USANDO (CONTRIB_PEDIDO = 16.42):
  · Ese número promedia SOLO los Signatures. El ARMA EL TUYO, que deja ~S/6 menos por
    sándwich, no entraba. O sea que el modelo asumía que todos los pedidos son Signature.
  · Usaba el empaque a S/1.10; el rango cotizado por el dueño es S/1.10-1.50 y acá se toma
    el punto medio, S/1.30.
  El caso central de este script declara 50% de pedidos por ARMA EL TUYO. No hay dato real
  todavía — por eso se recorre la sensibilidad completa antes de simular.
"""
import io, sys, os

RAIZ = os.path.dirname(os.path.abspath(__file__))

# ── BLOQUE 1 — CONTRIBUCIÓN POR PEDIDO DE CADA VERSIÓN ────────────────────────────────
EMP = 1.30                       # [COTIZADO] punto medio del rango S/1.10-1.50
SALSA = (0.266, 0.532); QUESO = (0.385, 0.77); TOPS_KG = 4.0
PAN = {"B01": (1.00, 2.00), "B03": (1.30, 2.60)}
MIX15 = 0.80                     # [HIPÓTESIS del dueño] 80% de los pedidos en 15CM
DRINK_ATTACH, DRINK_CONTRIB = 0.25, 3.79
CULQI, TICKET = 0.055, 22.0
NS_BYO, FQ_BYO = 2, 0.60         # [MÉTODO] el cliente medio pone 2 salsas y 60% pone queso
FRAC_BYO = 0.50                  # [MÉTODO] mitad de los pedidos por ARMA EL TUYO

def veg(g, s): return (g if s == "15" else g * 2) / 1000 * TOPS_KG

PROT_V = {"P01":(3.15,6.30),"P02":(2.47,4.95),"P04":(4.82,9.64),"P05":(4.29,8.59),"P06":(1.34,2.68)}
PROT_N = {**PROT_V, "P04": (3.25, 6.50)}          # atún cotizado
BYO_V = {"P01":(14.90,22.90),"P02":(13.90,21.90),"P04":(16.90,30.90),"P05":(16.90,30.90),"P06":(14.90,24.90)}
BYO_N = {"P01":(14.90,24.90),"P02":(13.90,23.90),"P04":(16.90,32.90),"P05":(16.90,32.90),"P06":(14.90,26.90)}
SIGS = {"SIG01":("B01","P01",2,False,20.90,26.90),"SIG02":("B01","P06",1,True,21.90,28.90),
        "SIG03":("B03","P05",1,True,23.90,34.90),"SIG04":("B01","P04",1,False,20.90,34.90),
        "SIG06":("B01","P02",2,False,19.90,25.90)}
SIG_TOPS = {"anterior":{"SIG01":52,"SIG02":49,"SIG03":52,"SIG04":52,"SIG06":43},
            "actual":  {"SIG01":54,"SIG02":45,"SIG03":54,"SIG04":54,"SIG06":42},
            "subway":  {"SIG01":54,"SIG02":45,"SIG03":54,"SIG04":54,"SIG06":42}}
VER = {"anterior": (PROT_V, BYO_V,  94, 0.60),
       "actual":   (PROT_N, BYO_N,  92, 0.30),
       "subway":   (PROT_N, BYO_N, 120, 0.30)}
NOMBRE = {"anterior":"MENÚ ANTERIOR","actual":"MENÚ ACTUAL","subway":"MÁS CERCA DE SUBWAY"}

def partes(ver):
    prot, byo, tg, card = VER[ver]
    sig = []
    for k,(base,p,ns,q,p15,p30) in SIGS.items():
        v = 0
        for size,pr in (("15",p15),("30",p30)):
            i = 0 if size=="15" else 1
            c = prot[p][i]+PAN[base][i]+EMP+SALSA[i]*ns+veg(SIG_TOPS[ver][k],size)
            if q: c += QUESO[i]
            v += (MIX15 if size=="15" else 1-MIX15)*(pr-c)
        sig.append(v)
    b = []
    for k,(p15,p30) in byo.items():
        v = 0
        for size,pr in (("15",p15),("30",p30)):
            i = 0 if size=="15" else 1
            c = prot[k][i]+PAN["B01"][i]+EMP+SALSA[i]*NS_BYO+veg(tg,size)+QUESO[i]*FQ_BYO
            v += (MIX15 if size=="15" else 1-MIX15)*(pr-c)
        b.append(v)
    return sum(sig)/len(sig), sum(b)/len(b), card

def contrib(ver, frac_byo=FRAC_BYO):
    s, b, card = partes(ver)
    return (1-frac_byo)*s + frac_byo*b + DRINK_ATTACH*DRINK_CONTRIB - card*CULQI*TICKET

# ── BLOQUE 2 — CARGAR EL MODELO v10 SIN SU SALIDA ─────────────────────────────────────
_src = io.open(os.path.join(RAIZ, "modelo_v10.py"), encoding="utf-8").read()
_pre = _src[:_src.rindex('\n# ═', 0, _src.index("sep('MODELO v10"))]

def cargar(contrib_pedido):
    """Ejecuta SOLO las definiciones del v10, con la contribución sustituida."""
    ns = {"__name__": "v10"}
    exec(compile(_pre.replace("CONTRIB_PEDIDO  = 16.42",
                              f"CONTRIB_PEDIDO  = {contrib_pedido:.4f}", 1),
                 "modelo_v10(prefijo)", "exec"), ns)
    return ns

def linea(c='='): print(c*94)

# ═══════════════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    linea(); print("  SND//WCH — LAS TRES VERSIONES DEL MENÚ, CONTRA EL MISMO MODELO".center(94)); linea()

    print("\n### 1 · POR QUÉ EL NÚMERO DEL MODELO ESTABA INFLADO\n")
    print(f"  {'versión':<12} {'Signature':>11} {'ARMA TUYO':>11} {'brecha':>9}")
    for v in ("anterior","actual","subway"):
        s,b,_ = partes(v); print(f"  {v:<12} {s:>11.2f} {b:>11.2f} {s-b:>9.2f}")
    print("\n  Un Signature deja ~S/6 más que un ARMA EL TUYO. El CONTRIB_PEDIDO = 16.42 que")
    print("  usaba el modelo promedia SOLO Signatures: asumía que ningún cliente arma el suyo.")

    print("\n### 2 · CONTRIBUCIÓN POR PEDIDO SEGÚN CUÁNTOS PEDIDOS SEAN ARMA EL TUYO\n")
    print(f"  {'% ARMA EL TUYO':<16}" + "".join(f"{NOMBRE[v].split()[-1]:>13}" for v in ("anterior","actual","subway")))
    linea('-')
    for f in (0.0, 0.25, 0.50, 0.75, 1.0):
        marca = "  ← lo que asumía el v10" if f==0 else ("  ← caso central de este análisis" if f==0.5 else "")
        print(f"  {f*100:>13.0f}% " + "".join(f"{contrib(v,f):>13.2f}" for v in ("anterior","actual","subway")) + marca)

    C = {v: contrib(v) for v in ("anterior","actual","subway")}
    print(f"\n  Caso central:  anterior S/{C['anterior']:.2f}  ·  actual S/{C['actual']:.2f}  ·  subway S/{C['subway']:.2f}")

    print("\n\n### 3 · LA SIMULACIÓN — TRES MENÚS x TRES ESCENARIOS\n")
    print("  Mismo modelo v10 y LA MISMA semilla en cada celda, así que las tres versiones")
    print("  enfrentan exactamente los mismos sorteos. Lo único que cambia es la contribución.\n")
    print("  · optimista  CPM en el mejor caso, cada cliente trae uno (viral 1.0)")
    print("  · central    CPM sorteado en todo el rango, viral 0.6")
    print("  · duro       CPM en el peor caso, viral 0.3\n")

    import random
    C = {v: contrib(v) for v in ("anterior", "actual", "subway")}
    NS = {v: cargar(C[v]) for v in C}
    base = NS["actual"]
    ESCEN = [("optimista", base["CPM_MIN"], 1.0, 0.4),
             ("central",   None,            0.6, 0.4),
             ("duro",      base["CPM_MAX"], 0.3, 0.2)]

    for etq, cpm, viral, reinv in ESCEN:
        print(f"  -- escenario {etq.upper()} · S/6,000/mes de publicidad · reinversión {reinv*100:.0f}%")
        print(f"     {'versión':<22}{'contrib':>9}{'mes 6 P50':>12}{'mes 6 P10':>12}"
              f"{'P(mes 6)':>10}{'P(camino)':>11}")
        print("     " + "-" * 76)
        for v in ("anterior", "actual", "subway"):
            ns = NS[v]
            orig = random.uniform
            if cpm is not None:
                orig, u = ns["cpm_fijo"](cpm); random.uniform = u
            random.seed(20260904)
            e = ns["escenario"](6000.0, reinv, viral, n=900, r1_fijo=ns["MEDIO"])
            random.uniform = orig
            print(f"     {NOMBRE[v]:<22}{C[v]:>9.2f}{e['m6_p50']:>12,.0f}{e['m6_p10']:>12,.0f}"
                  f"{e['p_m6']*100:>9.0f}%{e['p_camino']*100:>10.0f}%")
        print()

    print("\n### 4 · LO QUE LA COMPARACIÓN DICE\n")
    print("  · El menú ACTUAL le gana al anterior en los tres escenarios. La subida no es")
    print("    grande en porcentaje (+7%) pero se compone mes a mes con la reinversión.")
    print("  · Acercarse a SUBWAY cuesta S/0.07 por pedido, medio punto porcentual. El modelo")
    print("    ve el costo y NO PUEDE VER EL BENEFICIO: no sabe si un sándwich más lleno")
    print("    convierte mejor o hace volver antes. Esa parte hay que medirla, no simularla.")
    print("  · Lo que de verdad mueve la aguja no es ninguna de las tres versiones del menú:")
    print("    es el CAC y la viralidad. La distancia entre el escenario optimista y el duro")
    print("    es de otro orden de magnitud que la distancia entre los tres menús.")
