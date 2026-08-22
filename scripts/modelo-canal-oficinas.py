"""
¿Cómo se llega a S/10,000 netos en el mes 3 (nov-26)? Trabajo hacia atrás desde la meta.

El cambio de unidad que lo decide: la contribución es POR SÁNDWICH, no por pedido. Un
pedido de oficina de 6 sándwiches contribuye casi lo mismo que 6 pedidos individuales,
pero cuesta UN cliente en vez de seis. Y el cuello de botella del negocio no es la
cocina (techo 40/día) ni el mercado (Trujillo tiene 1.1M): es adquirir clientes.
"""
import random

random.seed(20260822)

CONTRIB_SW = 16.42     # contribución por sándwich (v6, mezcla 80% en 15CM)
CONTRIB_BEB = 4.79     # contribución por bebida
FIJOS = 500
META = 10_000
DIAS = 26
CAP_DIA = 40           # techo físico del dueño
MAX_HORA = 10          # MAX_ORDERS_PER_HOUR en orders.ts

print("=" * 90)
print("PASO 1 — CUÁNTOS SÁNDWICHES HACEN FALTA (esto no cambia, es la meta)")
print("=" * 90)
for mkt in (500, 1500, 3000):
    need = (META + FIJOS + mkt) / CONTRIB_SW
    print(f"  Con S/{mkt:>5,} de marketing ese mes → {need:>5.0f} sándwiches/mes = "
          f"{need/DIAS:>4.1f} sándwiches/día  ({need/DIAS/CAP_DIA*100:.0f}% del techo)")

MKT = 1500
NEED_SW = (META + FIJOS + MKT) / CONTRIB_SW
print(f"\n  Trabajo con S/{MKT:,} de marketing → objetivo {NEED_SW:.0f} sándwiches/mes.")

print("\n" + "=" * 90)
print("PASO 2 — LA MISMA META, DOS NEGOCIOS DISTINTOS")
print("=" * 90)
print(f"  {'Canal':<34}{'sw/pedido':>11}{'pedidos/mes':>13}{'pedidos/día':>13}{'clientes activos':>18}")
print("  " + "-" * 87)
for nombre, swp in (('Solo individuales', 1.0), ('Mixto 70/30 con oficinas', 2.1),
                    ('Mixto 50/50 con oficinas', 3.5), ('Mayoría oficinas', 5.0)):
    ped = NEED_SW / swp
    # 1.35 pedidos por cliente activo al mes (benchmark de recompra en delivery)
    act = ped / 1.35
    print(f"  {nombre:<34}{swp:>11.1f}{ped:>13.0f}{ped/DIAS:>13.1f}{act:>18.0f}")

print("""
  Los sándwiches son los mismos en las cuatro filas. Lo que cambia es a cuánta gente
  hay que convencer: 480 personas distintas, o 96 oficinas. Ese es todo el problema.""")

print("\n" + "=" * 90)
print("PASO 3 — ¿ES ALCANZABLE EN 3 MESES? CUENTA DE ADQUISICIÓN HACIA ATRÁS")
print("=" * 90)
# activos_3 = n1*r² + n2*r + n3   (con r de retención temprana, baja)
r = 0.26
for nombre, swp in (('Solo individuales', 1.0), ('Mixto 50/50 con oficinas', 3.5)):
    ped = NEED_SW / swp
    act = ped / 1.35
    n = act / (1 + r + r * r)          # si adquiere lo mismo los 3 meses
    print(f"\n  {nombre}: hacen falta {act:.0f} clientes activos en nov-26")
    print(f"    → {n:.0f} clientes NUEVOS por mes, los tres meses, desde el día 1")
    print(f"    → {n/DIAS:.1f} clientes nuevos por día operativo")
    print(f"    → {n*3:.0f} personas convencidas en total en 3 meses")
    print(f"    → a CAC S/16: S/{n*16:,.0f}/mes de publicidad = S/{n*3*16:,.0f} en los 3 meses")
    print(f"    → a 2-5% de conversión de seguidores: harían falta "
          f"{n/0.05:,.0f}-{n/0.02:,.0f} seguidores comprometidos")

print("\n" + "=" * 90)
print("PASO 4 — EL PROBLEMA DE HORA PICO QUE NADIE MIRÓ")
print("=" * 90)
ped_of = NEED_SW / 3.5 / DIAS
print(f"  En el escenario mixto 50/50: {ped_of:.1f} pedidos/día, pero las oficinas piden")
print(f"  TODAS entre 12:00 y 14:00. Si el 60% cae en esa ventana de 2 horas:")
pico = ped_of * 0.6 / 2
print(f"    {pico:.1f} pedidos/hora contra MAX_ORDERS_PER_HOUR = {MAX_HORA} → "
      f"{'OK' if pico <= MAX_HORA else 'SE PASA DEL TOPE'}")
sw_pico = NEED_SW / DIAS * 0.6 / 2
print(f"    {sw_pico:.0f} sándwiches/hora a armar. A 4-5 min cada uno, una persona sola")
print(f"    arma {60/4.5:.0f}/hora → {'alcanza' if sw_pico <= 60/4.5 else 'NO ALCANZA: hace falta ayuda o pre-armado'}")

print("\n" + "=" * 90)
print("PASO 5 — PROBABILIDAD REAL DE LLEGAR EN 3 MESES")
print("=" * 90)
N = 20_000


def corrida(swp_moda, nuevos_moda, mkt):
    """3 meses. nuevos_moda = clientes nuevos/mes que el dueño realmente consigue."""
    r_early = random.triangular(0.16, 0.26, 0.36)
    ppc = random.triangular(1.05, 1.35, 1.95)
    swp = random.triangular(1.0, swp_moda, swp_moda * 1.6)
    contrib = random.triangular(14.0, CONTRIB_SW, 18.0)
    act = 0.0
    for m in range(3):
        nuevos = random.triangular(nuevos_moda * 0.4, nuevos_moda, nuevos_moda * 1.8)
        act = act * r_early + nuevos
    ped = min(act * ppc, CAP_DIA / swp * DIAS)
    sw = ped * swp
    return sw * contrib - FIJOS - mkt


esc = [
    ('A. Solo individuales, marketing S/300', 1.0, 37, 300),
    ('B. Solo individuales, marketing S/3,000/mes', 1.0, 190, 3000),
    ('C. Oficinas 50/50, 15 clientes nuevos/mes', 3.5, 15, 800),
    ('D. Oficinas 50/50, 40 clientes nuevos/mes', 3.5, 40, 1500),
    ('E. Oficinas 50/50, 80 clientes nuevos/mes', 3.5, 80, 1500),
    ('F. Oficinas mayoría, 60 nuevos/mes', 5.0, 60, 1500),
]
print(f"  {'Escenario':<46}{'neto P50 nov-26':>17}{'P(>=10k)':>12}")
print("  " + "-" * 75)
for nombre, swp, nue, mkt in esc:
    random.seed(20260822)
    res = sorted(corrida(swp, nue, mkt) for _ in range(N))
    p50 = res[N // 2]
    pm = sum(1 for x in res if x >= META) / N * 100
    print(f"  {nombre:<46}{p50:>17,.0f}{pm:>11.0f}%")
