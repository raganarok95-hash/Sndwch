"""
SND//WCH — v6b. El v6 dio meseta en ~3 pedidos/día y nunca llegaba a S/10k. Antes de
reportar eso hay que entender POR QUÉ y si es un artefacto del modelo o un hecho real.

La respuesta está en una sola fórmula. Con retención mensual `r` y `n` clientes nuevos
por mes, la base de clientes activos NO crece para siempre: converge a

        activos* = n / (1 - r)

Con n=37 y r=0.38 eso da 60 clientes → ~81 pedidos/mes → 3 pedidos/día. La meseta no es
un supuesto: es aritmética. Y el marketing con presupuesto FIJO no la rompe, solo la sube
un escalón, porque n deja de crecer.

Lo que sí la rompe es reinvertir: si el marketing es un % de lo que el negocio genera,
n crece con el negocio y hay compuesto de verdad. Eso es lo que hace un negocio que
crece, y es lo que el v6 no modelaba.
"""
import random

random.seed(20260822)


def tri(a, b, c):
    return random.triangular(a, b, c)


FIJOS, CAP_DIA, META = 500, 40, 10_000
MESES = 30
DIAS = [21] + [26] * (MESES - 1)
etiq = []
_m, _y = 9, 2026
for _ in range(MESES):
    etiq.append(f"{['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][_m-1]}-{str(_y)[2:]}")
    _m += 1
    if _m == 13:
        _m, _y = 1, _y + 1


def pct(v, p):
    v = sorted(v)
    return v[int(p / 100 * (len(v) - 1))]


print("=" * 88)
print("PARTE 1 — LA MESETA ES ARITMÉTICA, NO UN SUPUESTO")
print("=" * 88)
print("  activos* = nuevos_por_mes / (1 - retención)     ·  pedidos = activos × 1.35\n")
print(f"  {'':>10}" + "".join(f"{('r='+str(r)):>12}" for r in (0.25, 0.38, 0.50, 0.65, 0.75)))
for n in (37, 60, 100, 150, 250, 300):
    fila = f"  n={n:<8}"
    for r in (0.25, 0.38, 0.50, 0.65, 0.75):
        act = n / (1 - r)
        ped = act * 1.35
        fila += f"{ped/26:>11.1f}/d"
    print(fila)
print(f"\n  Para netear S/10,000/mes hacen falta ~25 pedidos/día. Mira la tabla: ninguna")
print(f"  combinación con menos de ~150 clientes nuevos al mes llega, por buena que sea")
print(f"  la retención.")

print("\n" + "=" * 88)
print("PARTE 2 — CON REINVERSIÓN: el marketing crece con el negocio")
print("=" * 88)

N = 20_000


def corrida(reinv, mkt_min=300):
    ret_ini, ret_fin = tri(0.16, 0.24, 0.34), tri(0.30, 0.38, 0.48)
    nuevos_m1 = tri(10, 28, 55)
    cac = tri(8, 16, 30)
    k_ref = tri(0.04, 0.11, 0.22)
    organico = tri(4, 11, 24)
    ppc = tri(1.05, 1.35, 1.95)
    contrib = tri(14.20, 16.68, 18.60)
    activos, mkt = 0.0, mkt_min
    out = []
    for m in range(MESES):
        t = min(m, 6) / 6
        ret = ret_ini + (ret_fin - ret_ini) * t
        nuevos = nuevos_m1 if m == 0 else (mkt / cac + k_ref * activos + organico)
        activos = activos * ret + nuevos
        pedidos = min(activos * ppc, CAP_DIA * DIAS[m])
        bruto = pedidos * contrib
        neto = bruto - FIJOS - mkt
        out.append((pedidos, neto, mkt))
        mkt = max(mkt_min, bruto * reinv)      # reinversión del mes siguiente
    return out


for reinv, lbl in ((0.0, 'Sin reinvertir (S/300 fijos)'), (0.20, 'Reinvertir 20%'),
                   (0.35, 'Reinvertir 35%'), (0.50, 'Reinvertir 50%')):
    random.seed(20260822)
    sims = [corrida(reinv) for _ in range(N)]
    first = []
    for s in sims:
        idx = next((i for i, (p, n, k) in enumerate(s) if n >= META), None)
        first.append(idx)
    ok = [i for i in first if i is not None]
    m24 = [s[23][1] for s in sims]
    print(f"\n  {lbl}")
    print(f"    Llega a S/10k netos en 30 meses: {len(ok)/N*100:>3.0f}%"
          f"   ·  neto P50 en el mes 24: S/{pct(m24,50):>7,.0f}")
    if len(ok) / N > 0.10:
        print(f"    Primer mes que lo logra:  P25 → {etiq[pct(ok,25)]}   "
              f"P50 → {etiq[pct(ok,50)]}   P75 → {etiq[pct(ok,75)]}")

print("\n" + "=" * 88)
print("PARTE 3 — ESCENARIO REALISTA MES A MES (reinvertir 35%)")
print("=" * 88)
random.seed(20260822)
sims = [corrida(0.35) for _ in range(N)]
print(f"{'Mes':<10}{'ped/día':>9}{'pedidos':>9}{'mkt':>8}{'neto P10':>11}{'neto P50':>11}"
      f"{'neto P90':>11}{'P(>0)':>8}{'P(>=10k)':>10}")
print("-" * 88)
for m in range(MESES):
    peds = [s[m][0] for s in sims]
    nets = [s[m][1] for s in sims]
    mkts = [s[m][2] for s in sims]
    pp = sum(1 for x in nets if x > 0) / N * 100
    pm = sum(1 for x in nets if x >= META) / N * 100
    if m < 24:
        print(f"{etiq[m]:<10}{pct(peds,50)/DIAS[m]:>9.1f}{pct(peds,50):>9.0f}{pct(mkts,50):>8.0f}"
              f"{pct(nets,10):>11,.0f}{pct(nets,50):>11,.0f}{pct(nets,90):>11,.0f}"
              f"{pp:>7.0f}%{pm:>9.0f}%")

print("\n" + "=" * 88)
print("PARTE 4 — EL TECHO DE UNA SOLA PERSONA")
print("=" * 88)
c = 16.68
for d in (25, 30, 40):
    ped = d * 26
    print(f"  {d} pedidos/día = {ped} al mes → contribución S/{ped*c:,.0f}  "
          f"neto (fijos+mkt variable) ≈ S/{ped*c - 500 - ped*c*0.35:,.0f} reinvirtiendo 35%")
print(f"\n  Techo físico declarado: 40 pedidos/día (cocina por tandas, en servicio solo arma).")
print(f"  A 40/día el negocio deja ~S/16,500 de contribución al mes ANTES de marketing.")
print(f"  O sea: S/10,000 netos es alcanzable SIN contratar a nadie, pero exige operar")
print(f"  al 62% del techo todos los días del mes.")
