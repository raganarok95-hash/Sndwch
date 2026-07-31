# SND//WCH — Análisis de menú + proyección financiera

Fecha: 2026-07-31. Versión 3 — reconciliada a pedido del dueño: la ronda "desde cero"
(versión 2) volvió a investigar precios de insumos de mercado y llegó a cifras que
divergían de las ya documentadas en CLAUDE.md (sobre todo atún y queso). El dueño aclaró
que el punto de "tratar lo anterior como erróneo" era forzar una investigación crítica,
no descartar los precios que ya se habían investigado antes. **Esta versión restaura los
precios de insumos ya documentados en CLAUDE.md** (§"Contexto de negocio", investigados
julio 2026) como la fuente de verdad, y mantiene las mejoras de metodología que sí valen
la pena de la v2: porciones reales por tamaño (no un COGS plano sin desglosar), y una
simulación Monte Carlo real en vez de 3 escenarios fijos.

**El negocio sigue sin haber abierto.** Todo lo financiero de este documento sigue siendo
una SIMULACIÓN, no un pronóstico con historial real.

## 0. Qué cambió entre v2 y v3

| | v2 (desde cero) | v3 (esta versión) |
|---|---|---|
| Precios de insumos | Re-investigados en esta sesión (WebSearch) | **Restaurados** — los ya documentados en CLAUDE.md |
| Res | S/22/kg | **S/20/kg** |
| Pollo | S/17/kg | S/17/kg (sin cambio) |
| Atún | S/67/kg (neto escurrido) | **S/38/kg** (tal cual documentado, sin conversión bruto/neto) |
| Embutido premium | S/50/kg | **S/38/kg** |
| Carne molida | S/21/kg | **S/10/kg** |
| Queso | S/12.50/kg | **S/35/kg** |
| Porciones (85g/170g proteína, etc.) | Investigadas (ficha Subway) | Se mantienen — no eran parte de lo que se pidió restaurar |
| Metodología financiera | Monte Carlo, 20,000 corridas | Se mantiene, misma metodología, recorrida con los precios restaurados |

## 1. Insumos: precios usados (restaurados de CLAUDE.md)

| Insumo | S//kg usado | Origen |
|---|---|---|
| Pan (proxy baguette) | S/11 (rango S/9-13) | CLAUDE.md, sin cambio |
| Res | S/20 | CLAUDE.md — restaurado (v2 había subido a S/22 con investigación nueva) |
| Pollo | S/17 | CLAUDE.md, sin cambio |
| Atún (en lata) | S/38 | CLAUDE.md — restaurado (v2 había investigado S/67/kg neto escurrido) |
| Embutido premium | S/38 | CLAUDE.md — restaurado (v2 había investigado S/50/kg) |
| Carne molida | S/10 | CLAUDE.md — restaurado (v2 había investigado S/21/kg) |
| Queso | S/35 | CLAUDE.md — restaurado (v2 había investigado S/12.50/kg, mucho más bajo) |
| Salsa (proxy mostaza) | S/19 | Sin precio documentado antes en CLAUDE.md — se mantiene el investigado en v2 |
| Vegetales/toppings (mezcla) | S/4/kg | Ídem — sin precio previo documentado, se mantiene el de v2 |
| Empaque/pedido | S/1.10 | Ídem — sin precio previo documentado, se mantiene el de v2 |

### 1.1 Porciones reales (gramaje), sin cambio respecto a v2

| Componente | 15CM | 30CM | Fuente |
|---|---|---|---|
| Proteína (declarado/target) | 85 g | 170 g | Subway, confirmado a prensa — [Consumer Reports](https://www.consumerreports.org/fast-food-restaurants/consumer-reports-reviews-the-new-sandwich-on-subways-menu/) |
| Pan | 71 g | 142 g | [FastFoodNutrition](https://fastfoodnutrition.org/subway/6-9-grain-wheat-bread) |
| Queso | 11 g | 22 g | [FastFoodNutrition](https://fastfoodnutrition.org/subway/processed-american-cheese-2-triangles) |
| Salsa | 14 g | 28 g | [SnapCalorie](https://www.snapcalorie.com/nutrition/subway_mayonnaise_nutrition.html) |
| Vegetales/toppings | ~65 g | ~130 g | Estimación indirecta, dato débil (ver v2 para el detalle) |

---

## 2. Costeo real por producto (con precios restaurados)

### 2.1 Signatures

| Signature | Proteína | Precio 15CM | Costo 15CM | Margen 15CM | Precio 30CM | Costo 30CM | Margen 30CM |
|---|---|---|---|---|---|---|---|
| THE VAULT (SIG05) | Pollo Cajún | S/24 | S/3.94 | **83.6%** | S/30 | S/6.77 | 77.4% |
| THE CHICAGO (SIG07) | Res corte Chicago | S/25 | S/4.36 | **82.6%** | S/25 | S/7.62 | 69.5% |
| THE MEATBALL (SIG02) | Albóndiga | S/19 | S/3.64 | **80.8%** | S/24 | S/6.18 | 74.2% |
| THE TERIYAKI (SIG06) | Pollo | S/17 | S/3.85 | 77.3% | S/21 | S/6.60 | 68.6% |
| THE ORIGINAL (SIG01) | Res asado | S/18 | S/4.11 | 77.2% | S/22 | S/7.11 | 67.7% |
| THE SMOKE (SIG03) | Embutido | S/21 | S/5.64 | 73.2% | S/30 | S/10.17 | 66.1% |
| **THE FRESH (SIG04)** | **Atún** | **S/16** | **S/5.64** | **64.8%** | **S/30** | **S/10.17** | **66.1%** |

**Con los precios restaurados, THE FRESH deja de ser un caso aparte marcado (⚠) como en
v2** — con atún a S/38/kg (no S/67/kg), su margen (64.8%/66.1%) queda cerca del resto del
catálogo, incluso empatado exactamente con THE SMOKE a 30CM (ambas proteínas cuestan
S/38/kg en este set de precios). Sigue siendo, junto con THE SMOKE, el par de Signatures
con el margen más ajustado del catálogo público — pero ya no hay una brecha grande de
~20-30 puntos como salía con el atún a S/67/kg. **Esto confirma que la conclusión previa
de "THE FRESH necesita revisión urgente" dependía enteramente de qué precio de atún se
use** — con el precio ya documentado, no hay una señal fuerte de alarma.

### 2.2 Build Your Own

| Proteína | Precio 15CM | Costo 15CM | Margen 15CM | Precio 30CM | Costo 30CM | Margen 30CM | Recargo doble | Costo doble | Margen doble |
|---|---|---|---|---|---|---|---|---|---|
| P06 Molida | S/14 | S/3.26 | 76.7% | S/24 | S/5.41 | 77.4% | S/6 | S/0.85 | 85.8% |
| P02 Pollo | S/13 | S/3.85 | 70.4% | S/21 | S/6.60 | 68.6% | S/6 | S/1.45 | 75.9% |
| P01 Res | S/14 | S/4.11 | 70.7% | S/22 | S/7.11 | 67.7% | S/6 | S/1.70 | 71.7% |
| P04 Atún | S/16 | S/5.64 | 64.8% | S/30 | S/10.17 | 66.1% | S/9 | S/3.23 | 64.1% |
| P05 Embutido | S/16 | S/5.64 | 64.8% | S/30 | S/10.17 | 66.1% | S/9 | S/3.23 | 64.1% |

Atún y embutido quedan empatados en costo real (mismo precio de insumo, S/38/kg) — ambos
son el par de menor margen de BYO, pero de forma pareja y esperable (proteínas más caras
por kilo que pollo/res/molida), no como una anomalía aislada.

### 2.3 COGS real (bottom-up) vs. el 45% de trabajo del negocio

Promedio simple de margen a 15CM en Signatures: **22.9% de COGS** — más bajo que el 45%
que el negocio usa como base de trabajo, pero **consistente con lo que CLAUDE.md ya
documentaba**: "Un cálculo directo con precios reales de Perú investigados dio ~26-36%
según el producto; el dueño pidió trabajar con 45% dejando margen extra reservado para
mejorar el empaque más adelante." El 22.9% de este costeo queda un poco por debajo de ese
rango 26-36% — la diferencia más probable es que el costeo de esta sesión no incluye
absolutamente todos los ítems que sí pudo incluir el cálculo original (sazones, mermas de
cocción, variación real de porción) — pero la dirección coincide: **el 45% sigue siendo,
como ya estaba documentado, un colchón deliberadamente conservador, no el costo real**.

---

## 3. Proyección financiera — Simulación Monte Carlo (3 meses)

Misma metodología que v2 (Python, librería estándar, 20,000 corridas) — recorrida con los
precios de insumos restaurados.

### 3.1 Variables aleatorias del modelo

| Variable | Distribución | Rango/parámetros | Cambio vs. v2 |
|---|---|---|---|
| Pedidos/día Mes 1 | Uniforme | 5 a 15 | Sin cambio (benchmarks de demanda, no de precio) |
| Pedidos/día Mes 2 | Uniforme | 8.7 a 24.5 | Sin cambio |
| Pedidos/día Mes 3 | Uniforme | 15 a 40 | Sin cambio |
| Ticket promedio | Triangular | mín S/16, moda S/24, máx S/45 | Sin cambio (precios de venta del catálogo, no de insumos) |
| % pagos con tarjeta | Uniforme | 35% a 70% | Sin cambio |
| COGS real | Triangular | mín 20%, moda 24%, máx 32% | **Recalibrado** — centrado en el 22.9% bottom-up de esta versión, con la banda alta llegando al 32% para cubrir el extremo superior del rango 26-36% ya documentado en CLAUDE.md |
| Renta / Delivery / Marketing / Otros fijos / Días operando | Igual que v2 | S/0 / neutral / S/300 / S/150 / 26 días | Confirmados por el dueño, sin cambio |

### 3.2 Resultado de la simulación (S/, percentiles sobre 20,000 corridas)

| | P10 | P50 (mediana) | P90 |
|---|---|---|---|
| **Ingresos totales (3 meses)** | 29,103 | 39,135 | 51,406 |
| **Utilidad neta (3 meses)** | 19,503 | 26,876 | 35,736 |
| Utilidad Mes 1 | 2,486 | 4,633 | 7,608 |
| Utilidad Mes 2 | 4,545 | 7,996 | 12,680 |
| Utilidad Mes 3 | 8,070 | 13,439 | 21,062 |

- Peor corrida observada en Mes 1 (de 20,000): **+S/1,072** — sigue positiva.
- Peor corrida observada a 3 meses: **+S/10,263**.
- Comparado con v2 (precios de atún/embutido más altos, molida/queso mezclados distinto),
  la utilidad mediana a 3 meses sube ligeramente (S/26,876 vs. S/26,094 en v2) — el COGS
  real bottom-up bajó un poco al restaurar los precios documentados (22.9% vs. 26.6% en
  v2), principalmente porque atún y embutido volvieron a costar menos por kilo.

**La misma advertencia de v2 sigue aplicando**: el 0% de corridas en pérdida es un
resultado honesto dentro de los rangos investigados (demanda, COGS, ticket), no una
garantía — no captura un escenario de demanda muy por debajo del piso investigado (17-30%
de restaurantes nuevos cierran en su primer año, según Ohio State/NRA/BLS, citado en la
sección de benchmarks de v2) ni un costo real de insumo que resulte más alto de lo que
CLAUDE.md tiene documentado si el dueño cotiza con un proveedor real y sale distinto.

---

## 4. Recomendaciones concretas (actualizadas)

1. **THE FRESH ya no necesita revisión urgente** con los precios de insumo restaurados —
   la recomendación de v2 de "vigilarla apenas haya ventas reales" dependía del precio de
   atún investigado ahí (S/67/kg), que ya no es el que se está usando. Sigue siendo,
   junto con THE SMOKE, el par de menor margen del catálogo, pero de forma esperable, no
   alarmante.
2. **Cotizar con proveedores reales sigue siendo la recomendación más valiosa** — tanto
   los precios de CLAUDE.md como los de la investigación de v2 son estimaciones de
   mercado, ninguno es una cotización real del negocio. La diferencia entre ambas rondas
   (sobre todo en atún/queso) es justamente la prueba de cuánto puede moverse la
   conclusión según qué fuente de precio se use — un dato real del propio proveedor
   cierra esa incertidumbre de raíz.
3. **Repetir la matriz de menu engineering con datos reales a las 4-6 semanas** de
   operación — sigue pendiente, sin cambios respecto a v2.
4. **Reforzar el upsell de bebidas** — sigue sin costearse con rigor en ninguna versión
   (fuera de alcance ambas veces), sigue siendo una palanca de margen no cuantificada.
5. **El 45% de COGS del negocio sigue siendo un colchón razonable, no un error** — ambas
   rondas de costeo bottom-up (22.9% en esta versión, 26.6% en v2) caen por debajo de esa
   cifra, consistente con lo que CLAUDE.md ya documentaba antes de esta sesión.

---

*Documento generado como simulación de apoyo a la decisión — reconciliado el 2026-07-31
con los precios de insumos ya documentados en CLAUDE.md, después de que la versión 2
(investigación desde cero) produjera cifras divergentes en algunos insumos. No reemplaza
datos reales de venta ni un costeo de recetas hecho por el dueño con sus proveedores
reales.*
