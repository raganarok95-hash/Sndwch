# -*- coding: utf-8 -*-
"""SND//WCH — cuánto cuesta CADA MEDIO LITRO de bebida y a cuánto se vende.

POR QUE EXISTE ESTE ARCHIVO. Hasta hoy las bebidas se costeaban con UN número estimado por
vaso (~S/0.465 las infusiones, ~S/1.55 el chai) sobre un vaso de 350 ml que nunca se decidió.
El dueño compró el envase (S/138 / 200 unidades) y preguntó por MEDIO LITRO, que es 43% más
bebida que ese vaso. El insumo escala con el volumen; el envase NO. Costear los dos juntos
como un porcentaje plano esconde exactamente eso.

Las CANTIDADES son las del RECETARIO.md (reales, del dueño). Los PRECIOS POR KILO están
etiquetados uno por uno: [COTIZADO] = dato real, [WEB] = precio publicado en Perú,
[ESTIMADO] = supuesto de trabajo sin fuente. Ningún número entra sin etiqueta.
"""

ENVASE = 0.69          # [COTIZADO] dueño 2026-09-05: S/138 / 200 unidades.
ML_BOTELLA = 500       # medio litro

# precio por kilo (o por litro, la leche) del insumo tal como se compra
P = {
    "jamaica":     (97.00, "[WEB] Campo Grande Perú, 1 kg por mayor y menor"),
    "te_negro":    (97.00, "[WEB] Campo Grande Perú, presentación a granel"),
    "azucar":       (4.50, "[ESTIMADO] azúcar rubia, retail Perú"),
    "canela":      (60.00, "[ESTIMADO] canela en rama"),
    "hierba_luisa":(40.00, "[ESTIMADO] hierba luisa seca"),
    "menta":       (12.00, "[ESTIMADO] menta fresca de mercado"),
    "cardamomo":  (200.00, "[ESTIMADO] cardamomo en vaina, el insumo más caro del recetario"),
    "clavo":       (80.00, "[ESTIMADO] clavo de olor"),
    "jengibre":     (8.00, "[ESTIMADO] jengibre fresco"),
    "pimienta":    (60.00, "[ESTIMADO] pimienta negra en grano"),
    "leche":        (4.50, "[ESTIMADO] leche UHT, S/ por litro"),
}

# (nombre, precio de venta hoy, litros que rinde la tanda, {insumo: gramos})
BEBIDAS = [
    # RECETARIO.md PARTE 4. Tanda 3 L.
    ("D06  The Bloom // Hibiscus", 6.0, 3.0,
     {"jamaica": 60, "canela": 4, "azucar": 250}),
    # Azúcar "aparte, al gusto": se costean 100 g por tanda, no 0 — asumir cero sería
    # costear una bebida que en la práctica sale endulzada.
    ("D07  The Midnight // Brew",  5.0, 3.0,
     {"te_negro": 40, "azucar": 100}),
    ("D08  The Cool // Mint",      6.0, 3.0,
     {"hierba_luisa": 40, "menta": 30, "azucar": 200}),
]

# El chai va aparte: su tanda es CONCENTRADO de 1.5 L que al servir se corta 50/50 con leche,
# así que rinde 3 L de bebida pero la mitad de ese volumen es un insumo que se compra.
CHAI_CONCENTRADO_L = 1.5
CHAI = {"te_negro": 80, "canela": 12, "cardamomo": 6, "clavo": 2,
        "jengibre": 100, "pimienta": 1, "azucar": 300}

def costo_tanda(receta):
    return sum(P[k][0] * g / 1000.0 for k, g in receta.items())

print("=" * 78)
print(f"COSTO POR BOTELLA DE {ML_BOTELLA} ML — envase S/{ENVASE:.2f} [COTIZADO]")
print("=" * 78)
print(f"{'bebida':<30}{'precio':>8}{'insumo':>9}{'envase':>8}{'costo':>8}{'deja':>8}{'costo%':>8}")
print("-" * 78)

filas = []
for nombre, precio, litros, receta in BEBIDAS:
    por_litro = costo_tanda(receta) / litros
    insumo = por_litro * ML_BOTELLA / 1000.0
    costo = insumo + ENVASE
    filas.append((nombre, precio, insumo, costo, precio - costo, costo / precio * 100))

# chai
conc_por_litro = costo_tanda(CHAI) / CHAI_CONCENTRADO_L
ml_conc = ML_BOTELLA / 2
insumo_chai = conc_por_litro * ml_conc / 1000.0 + P["leche"][0] * (ML_BOTELLA / 2) / 1000.0
costo_chai = insumo_chai + ENVASE
filas.append(("D09  The Spice // Chai", 9.0, insumo_chai, costo_chai, 9.0 - costo_chai,
              costo_chai / 9.0 * 100))

for n, pr, ins, co, deja, pct in filas:
    print(f"{n:<30}{pr:>8.2f}{ins:>9.2f}{ENVASE:>8.2f}{co:>8.2f}{deja:>8.2f}{pct:>7.1f}%")

print("-" * 78)
print("\nEL MISMO CÁLCULO A 350 ML (el vaso que asumía el recetario), para comparar:")
print(f"{'bebida':<30}{'costo':>9}{'costo%':>9}   diferencia con 500 ml")
print("-" * 78)
for (nombre, precio, litros, receta), fila in zip(BEBIDAS, filas):
    c350 = costo_tanda(receta) / litros * 0.350 + ENVASE
    print(f"{nombre:<30}{c350:>9.2f}{c350/precio*100:>8.1f}%   +{fila[5]-c350/precio*100:.1f} pts al pasar a 500 ml")
c350_chai = conc_por_litro * 0.175 / 1.0 * 1 + P["leche"][0] * 0.175 + ENVASE
c350_chai = conc_por_litro * 0.175 + P["leche"][0] * 0.175 + ENVASE
print(f"{'D09  The Spice // Chai':<30}{c350_chai:>9.2f}{c350_chai/9*100:>8.1f}%   +{filas[3][5]-c350_chai/9*100:.1f} pts al pasar a 500 ml")

print("\n" + "=" * 78)
print("¿QUÉ PRECIO NECESITA CADA BOTELLA DE 500 ML PARA QUEDAR EN EL TECHO DE 45%?")
print("(y para quedar donde están hoy las bebidas, ~22% de costo)")
print("=" * 78)
for n, pr, ins, co, deja, pct in filas:
    print(f"{n:<30} techo 45%: S/{co/0.45:>5.2f}   ·   al 25% de costo: S/{co/0.25:>5.2f}   ·   hoy: S/{pr:.2f}")

print("\nPRECIOS USADOS (cada uno con su origen):")
for k, (v, fuente) in P.items():
    print(f"  {k:<14} S/{v:>7.2f}/kg  {fuente}")
