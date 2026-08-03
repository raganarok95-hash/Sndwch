# SND//WCH — Análisis de menú + proyección financiera

Fecha: 2026-07-31. Versión 4 — punto medio pedido por el dueño: **se restauran todos los
precios de insumos ya documentados en CLAUDE.md, excepto atún y embutido premium**, que
usan los precios investigados online en la ronda "desde cero" (v2) — porque esos dos eran
justamente los insumos sin cotización propia confirmada. Se mantiene la metodología de v2
(porciones reales por tamaño, Monte Carlo) y la re-anclada en fuentes de Perú/Trujillo de
v3 (no de EE.UU.) para los benchmarks de demanda.

**El negocio sigue sin haber abierto.** Todo lo financiero de este documento sigue siendo
una SIMULACIÓN, no un pronóstico con historial real.

## 0. Historial de versiones (para no perder el hilo)

| Versión | Precios de insumos | Motivo |
|---|---|---|
| v1 | COGS plano 45%, sin desglose por insumo | Primera pasada, con demasiados supuestos sin declarar — el dueño la rechazó |
| v2 | Todo re-investigado online desde cero | El dueño pidió tratar v1 como errónea y partir de cero |
| v3 | Todo restaurado a CLAUDE.md | El dueño aclaró que solo quería una investigación crítica, no descartar los precios ya documentados |
| **v4 (esta)** | **Restaurado, EXCEPTO atún y embutido (online)** | Punto medio: confiar en los precios ya dados, pero usar el dato online para los dos insumos que no tenían cotización propia |
| **v4.1 (nota, sin recálculo)** | Embutido actualizado a S/48/kg real (2026-08-01), atún sigue online | El dueño confirmó el precio real de embutido — cambio de solo 4% vs. el S/50 usado en v4, **las cifras de este documento (COGS%, márgenes, utilidad) siguen siendo las de v4, no se recalcularon** — pendiente rehacer la simulación completa cuando también haya precio real de atún, para no correrla dos veces |

## 1. Insumos: precios usados en v4

| Insumo | S//kg usado | Origen |
|---|---|---|
| Pan (proxy baguette) | S/11 | CLAUDE.md |
| Res | S/20 | CLAUDE.md |
| Pollo | S/17 | CLAUDE.md |
| **Atún (en lata, neto escurrido)** | **S/67** | **Investigado online (v2)** — [Tottus, filete de atún](https://tottus.falabella.com.pe/tottus-pe/product/113709279/filete-de-atun-en-aceite-de-girasol-170g/113709281), conversión a neto escurrido |
| **Embutido premium** | ~~S/50~~ **S/48** | **Precio real confirmado por el dueño (2026-08-01)** — reemplaza el estimado online de v2/v4 (S/50, punto medio de un rango S/37-65). Diferencia de 4%, no recalculada en las cifras de este documento (ver nota abajo) |
| Carne molida | S/10 | CLAUDE.md |
| Queso | S/35 | CLAUDE.md |
| Salsa (proxy mostaza) | S/19 | Sin precio documentado antes — se mantiene el investigado en v2 |
| Vegetales/toppings (mezcla) | S/4/kg | Ídem |
| Empaque/pedido | S/1.10 | Ídem |

### 1.1 Porciones reales (gramaje), sin cambio desde v2

| Componente | 15CM | 30CM | Fuente |
|---|---|---|---|
| Proteína (declarado/target) | 85 g | 170 g | Subway — [Consumer Reports](https://www.consumerreports.org/fast-food-restaurants/consumer-reports-reviews-the-new-sandwich-on-subways-menu/) |
| Pan | 71 g | 142 g | [FastFoodNutrition](https://fastfoodnutrition.org/subway/6-9-grain-wheat-bread) |
| Queso | 11 g | 22 g | [FastFoodNutrition](https://fastfoodnutrition.org/subway/processed-american-cheese-2-triangles) |
| Salsa | 14 g | 28 g | [SnapCalorie](https://www.snapcalorie.com/nutrition/subway_mayonnaise_nutrition.html) |
| Vegetales/toppings | ~65 g | ~130 g | Estimación indirecta, dato débil |

---

## 2. Costeo real por producto

### 2.1 Signatures

| Signature | Proteína | Precio 15CM | Costo 15CM | Margen 15CM | Precio 30CM | Costo 30CM | Margen 30CM |
|---|---|---|---|---|---|---|---|
| THE VAULT (SIG05) | Pollo Cajún | S/24 | S/3.94 | **83.6%** | S/30 | S/6.77 | 77.4% |
| THE CHICAGO (SIG07) | Res corte Chicago | S/25 | S/4.36 | **82.6%** | S/25 | S/7.62 | 69.5% |
| THE MEATBALL (SIG02) | Albóndiga | S/19 | S/3.64 | **80.8%** | S/24 | S/6.18 | 74.2% |
| THE TERIYAKI (SIG06) | Pollo | S/17 | S/3.85 | 77.3% | S/21 | S/6.60 | 68.6% |
| THE ORIGINAL (SIG01) | Res asado | S/18 | S/4.11 | 77.2% | S/22 | S/7.11 | 67.7% |
| THE SMOKE (SIG03) | Embutido | S/21 | S/6.66 | 68.3% | S/30 | S/12.21 | 59.3% |
| **THE FRESH (SIG04)** | **Atún** | **S/16** | **S/8.10** | **49.4%** ⚠ | **S/30** | **S/15.10** | **49.7%** ⚠ |

**THE FRESH vuelve a ser el caso de menor margen del catálogo**, ahora sí porque su
insumo (atún) es el único de los dos "sin dato propio" que se está usando con el precio
investigado online (S/67/kg neto escurrido) — no por descuido, es la consecuencia directa
de la decisión de punto medio de esta versión. Mismo patrón que en v2: ~20-30 puntos
porcentuales por debajo del resto del catálogo público.

### 2.2 Build Your Own

| Proteína | Precio 15CM | Costo 15CM | Margen 15CM | Precio 30CM | Costo 30CM | Margen 30CM | Recargo doble | Costo doble | Margen doble |
|---|---|---|---|---|---|---|---|---|---|
| P06 Molida | S/14 | S/3.26 | 76.7% | S/24 | S/5.41 | 77.4% | S/6 | S/0.85 | 85.8% |
| P02 Pollo | S/13 | S/3.85 | 70.4% | S/21 | S/6.60 | 68.6% | S/6 | S/1.45 | 75.9% |
| P01 Res | S/14 | S/4.11 | 70.7% | S/22 | S/7.11 | 67.7% | S/6 | S/1.70 | 71.7% |
| P05 Embutido | S/16 | S/6.66 | 58.4% | S/30 | S/12.21 | 59.3% | S/9 | S/4.25 | 52.8% |
| **P04 Atún** | **S/16** | **S/8.10** | **49.4%** ⚠ | **S/30** | **S/15.10** | **49.7%** ⚠ | **S/9** | **S/5.70** | **36.7%** ⚠ |

La doble proteína de atún (36.7%) sigue siendo la operación individual de menor margen
de todo el catálogo — pagar S/9 extra por 85g más de atún cuesta S/5.70 de insumo real.

### 2.3 COGS real (bottom-up)

Promedio simple de margen a 15CM en Signatures: **25.8% de COGS** — cae dentro del rango
26-36% que CLAUDE.md ya documentaba como el cálculo real con precios de Perú (queda justo
en el borde bajo), reforzando que **el 45% de trabajo del negocio sigue siendo un colchón
deliberado, no el costo real** — con o sin el atún caro, la conclusión sobre el 45% no
cambia.

### 2.4 Recompensas (REWARDS) vs. el 45% de colchón — nota agregada en la re-auditoría de 10 agentes

Los topes planos de canje en `catalog.ts` (R03_FLAT_WAIVER=S/8, R04_FLAT_WAIVER=S/6,
R06=precio completo) se calibraron para que el costo real de honrar cada canje ronde el
45% de colchón (ver CLAUDE.md, "Programa de puntos"). Con los costos reales de este mismo
documento (§2.2), esa calibración se sostiene para res/pollo/molida (P01/P02/P06) pero NO
para atún/embutido (P04/P05), donde el costo real de honrar el canje es bastante más alto:

| Recompensa | Con P04 (atún) | Con P05 (embutido) | Con P01/P02/P06 |
|---|---|---|---|
| R03 (sube a 30CM gratis, tope S/8) | S/7.00 → **87.5%** | S/5.55 → 69.4% | 27-38% |
| R04 (doble proteína gratis, tope S/6) | ~S/3.80 → **63.3%** | dentro del tope, seguro | 14-28% |
| R06 (15CM gratis, waiver = precio completo) | S/8.10/S/16 → **50.6%** | 19-32% (según Signature) | 19-32% |

Esto **no es un bug** — `catalog.ts` (líneas ~552-559) ya documenta la decisión deliberada
de no subir estos topes para P04/P05 específicamente, por el riesgo de abrir una vía de
abuso más golosa. Queda anotado acá porque este documento usa exactamente los mismos datos
de costo y antes no cruzaba esta interacción — vale la pena revisarla junto con el punto 1
de la sección 4 (cotizar atún/embutido con proveedor real), ya que un precio de insumo más
bajo del que se confirme reduciría automáticamente estos porcentajes.

---

## 3. Proyección financiera — Simulación Monte Carlo (12 meses)

Misma metodología (Python, librería estándar, 20,000 corridas por horizonte).

### 3.1 Variables aleatorias del modelo

| Variable | Distribución | Rango/parámetros |
|---|---|---|
| Pedidos/día Mes 1 | Uniforme | 5 a 15 |
| Pedidos/día Mes 2 | Uniforme | 8.7 a 24.5 |
| Pedidos/día Mes 3 | Uniforme | 15 a 40 |
| Pedidos/día Meses 4-6 | Uniforme, creciente | 16-44 → 17-47 → 18-50 (extrapolación, sin benchmark — ver 3.1bis) |
| Pedidos/día Meses 7-12 | Uniforme | 18-50 (meseta asumida, sin benchmark) |
| Ticket promedio | Triangular | mín S/16, moda S/24, máx S/45 |
| % pagos con tarjeta | Uniforme | 35% a 70% |
| COGS real | Triangular | mín 20.8%, moda 25.8%, máx 33.8% — centrado en el 25.8% bottom-up de esta versión |
| Renta / Delivery / Marketing / Otros fijos / Días operando | Fijo | S/0 / neutral / S/300 / S/150 / 26 días — confirmados por el dueño |

### 3.1bis Benchmarks de demanda — Perú/Trujillo (no EE.UU.)

- **Tasa de fracaso de restaurantes en Perú: 60% cierra antes de cumplir 3 años**, sobre
  ~15,000 restaurantes nuevos al año — INEI/Cámara de Comercio de Lima
  ([revistahosteleria.com](https://www.revistahosteleria.com/texto-diario/mostrar/3841353/60-restaurantes-fracasan-primer-ano)).
  Refuerza mantener el piso conservador de 5 pedidos/día en Mes 1.
- **Crecimiento del sector delivery en Perú: ~30% en 2-3 meses** durante una fase de
  expansión ([Gestión.pe](https://gestion.pe/economia/empresas/servicio-de-delivery-llegaria-a-crecer-30-en-proximos-dos-a-tres-meses-noticia/))
  — mide el sector completo, no la curva de un negocio nuevo; solo contexto de mercado en
  expansión.
- **Trujillo es la 3ra ciudad de Perú en consumo de delivery de comida** (después de Lima
  y Arequipa), con Rappi y otras plataformas ya operando ahí.
- **Ticket real de delivery en Perú: S/35-55** — más alto que el ticket implícito del
  catálogo de SND//WCH (moda S/24 en este modelo), probablemente porque el benchmark
  mezcla pedidos familiares/multi-plato. Se mantiene el ticket del catálogo (más preciso
  para este negocio), con el benchmark documentado como posible palanca de upsell.
- **No existe, en ninguna ronda de búsqueda, un dato específico de "pedidos/día de un
  delivery nuevo en Perú/Trujillo en su primer mes"** — gap real de información pública.
  Por eso los rangos de pedidos/día no cambiaron entre v3 y v4 (esta versión solo cambió
  precios de insumos, no demanda).

### 3.2 Resultado de la simulación — ganancia bruta y neta, por mes (S/, mediana P50)

| Mes | Bruta (P50) | Neta (P50) | Confiabilidad de la demanda |
|---|---|---|---|
| 1 | 5,118 | 4,487 | Investigado (benchmarks Perú) |
| 2 | 8,522 | 7,765 | Investigado (interpolación 1→3) |
| 3 | 14,116 | 13,170 | Investigado (benchmarks Perú) |
| 4 | 15,405 | 14,399 | Extrapolación — sin benchmark |
| 5 | 16,432 | 15,397 | Extrapolación — sin benchmark |
| 6 | 17,528 | 16,439 | Extrapolación — sin benchmark |
| 7-12 | ~17,540 c/mes | ~16,460 c/mes | Meseta asumida — sin base real |

### 3.3 Acumulado (S/, P10 / P50 / P90 de 20,000 corridas)

| Horizonte | Bruta P10 | Bruta P50 | Bruta P90 | Neta P10 | Neta P50 | Neta P90 |
|---|---|---|---|---|---|---|
| **3 meses** | 21,095 | 28,554 | 37,766 | 18,979 | 26,178 | 35,077 |
| **6 meses** | 64,922 | 80,161 | 97,595 | 59,793 | 74,570 | 91,427 |
| **12 meses (1 año)** | 164,230 | 190,082 | 218,545 | 152,758 | 177,876 | 205,495 |

- Comparado con v3 (atún también restaurado a S/38/kg), la utilidad baja un poco en todos
  los horizontes (Neta 12 meses: S/177,876 aquí vs. una cifra más alta en v3) — es la
  consecuencia directa y esperada de usar el atún más caro (S/67 vs. S/38/kg) para el
  insumo de THE FRESH y su versión BYO.
- Comparado con v2 (todo online, incluyendo res/pollo/molida/queso re-investigados), la
  utilidad sube un poco — los precios restaurados de esta versión (res, molida sobre todo)
  son más bajos que los que se habían re-investigado en v2.

### 3.4 Advertencias que siguen aplicando (sin cambio desde v3)

- **Meses 4-12 son extrapolación, no investigación** — no hay ningún benchmark (peruano ni
  de ningún otro país) sobre el ritmo de crecimiento de un delivery nuevo más allá del
  tercer mes.
- **A partir de ~30-50 pedidos/día sostenidos**, la condición de "mano de obra S/0" puede
  dejar de ser realista — las cifras de Mes 6 en adelante probablemente sobreestiman la
  utilidad neta si el volumen real obliga a contratar ayuda.
- **El 0% de corridas en pérdida es honesto dentro de los rangos investigados, no una
  garantía** — no captura un escenario de demanda muy por debajo del piso, ni un costo de
  insumo real distinto al usado aquí si el dueño cotiza con un proveedor real (sobre todo
  para atún/embutido, que siguen siendo los dos insumos sin cotización propia confirmada).

---

## 4. Recomendaciones concretas

1. **Cotizar atún y embutido con un proveedor real es la prioridad más clara de este
   documento** — son los dos únicos insumos donde v4 usa un precio de investigación
   online en vez de uno ya confirmado, y son justo los que determinan si THE FRESH (y su
   doble proteína en BYO) tiene un problema de margen real o no. El resto de insumos
   (res, pollo, molida, queso) ya vienen de una fuente que el dueño confirmó como
   confiable.
2. **THE FRESH y la doble proteína de atún en BYO son, con este punto medio, el caso de
   menor margen del catálogo** — no ameritan un cambio de precio automático, pero sí
   vigilancia una vez haya ventas reales, y son el primer candidato a revisar en cuanto
   se tenga el precio real de proveedor del punto 1.
3. **Repetir la matriz de menu engineering con datos reales a las 4-6 semanas** de
   operación — sigue pendiente.
4. **Reforzar el upsell de bebidas y de pedidos multi-ítem** — el ticket real de mercado
   en Perú (S/35-55) es más alto que el ticket típico de SND//WCH en este modelo (~S/24),
   posible oportunidad no cuantificada en este documento.
5. **El 45% de COGS del negocio sigue siendo un colchón razonable** — el costeo bottom-up
   de esta versión (25.8%) cae dentro del rango 26-36% que CLAUDE.md ya documentaba,
   incluso con el atún caro incluido.

---

## 5. Inversión inicial para empezar

El dueño confirmó (2026-07-31) que **ya tiene el equipo básico de cocina** (refrigeradora/
congeladora, superficies de trabajo) y **ya tiene el setup digital** (celular dedicado,
cuentas de redes sociales) — así que la inversión real no incluye equipamiento ni
tecnología, solo trámites legales y capital de trabajo.

### 5.1 Trámites/permisos (Trujillo, Perú — investigado 2026-07-31)

| Trámite | Costo | Fuente/nota |
|---|---|---|
| Licencia de Funcionamiento Municipal | S/100-400 | [Municipalidad de Trujillo](https://www.munitrujillo.gob.pe/portal/Licencias_funcionamiento) — negocios de riesgo bajo se aprueban el mismo día por Decreto Legislativo 1497. Un delivery de sándwiches desde casa, sin atención al público en el local, probablemente cae en la categoría de riesgo bajo (S/100-400), no la de restaurante grande (S/400-1,500) |
| Inspección sanitaria (obligatoria) | S/150-350 | Emitida por una empresa autorizada por DIGESA, por servicio |
| Carné de sanidad (solo el dueño, sin personal) | S/15-30 | Municipal, por persona que manipula alimentos |
| **Registro Sanitario DIGESA** | **No aplica** | Ese trámite (~S/390/producto) es para productos envasados vendidos con marca propia (café molido, mermeladas, galletas) — no para comida preparada al pedido como un sándwich. Si en el futuro SND//WCH vende algo envasado con su marca (ej. una salsa embotellada), ahí sí aplicaría |
| **Total trámites** | **S/265-780** | Punto medio ≈ **S/520** |

### 5.2 Capital de trabajo inicial (insumos + empaque)

No hay fuente pública de "cuánto stock inicial comprar" — es una estimación derivada del
propio modelo de esta sección, no una investigación externa:

| Concepto | Estimado | Base del cálculo |
|---|---|---|
| Insumos (2 semanas de stock, ~130 pedidos a COGS S/6.19/pedido) | S/400-800 | Ritmo de Mes 1 (5-15 pedidos/día) × COGS real de la sección 2.3 |
| Empaque (compra inicial en lote) | S/300-500 | Estimación — el precio de empaque por pedido (sección 1) es de confianza "débil", ningún proveedor publicó precio de lote online |
| **Total capital de trabajo** | **S/700-1,300** | |

### 5.3 Colchón operativo recomendado (opcional, no un costo obligatorio)

Los gastos fijos mensuales ya establecidos (marketing S/300 + otros S/150 = S/450/mes,
sección 3.1) son el único costo que sigue corriendo aunque no entre ni un pedido. Tener
1-2 meses de eso como reserva (**S/450-900**) es una práctica estándar de colchón, no un
requisito legal ni un cálculo con fuente externa — es una recomendación, no una cifra
investigada.

### 5.4 Total estimado

| Componente | Rango |
|---|---|
| Trámites/permisos | S/265-780 |
| Capital de trabajo (insumos+empaque) | S/700-1,300 |
| Colchón operativo (1-2 meses de fijos, opcional) | S/450-900 |
| **Total** | **S/1,415-2,980** |

**Con el equipo de cocina y el setup digital ya resueltos, la inversión real para abrir es
baja** — el punto de equilibrio ya calculado en versiones anteriores de este documento
(~33 pedidos/mes solo para cubrir marketing+otros fijos) confirma que no hace falta un
capital grande para sostener las primeras semanas, siempre que el flujo de pedidos llegue
dentro del rango investigado (sección 3.1bis). El rango de S/1,415-2,980 es sobre todo
trámites legales y stock inicial, no equipamiento — la mayor incertidumbre real es el
costo de empaque en lote (confianza "débil", nadie publicó precio online) y el rango
amplio de trámites (depende de la categoría de riesgo exacta que la municipalidad asigne).

---

*Documento generado como simulación de apoyo a la decisión — versión 4 (2026-07-31),
punto medio entre los precios ya documentados y los investigados online, con demanda
anclada en fuentes de Perú/Trujillo. No reemplaza datos reales de venta ni un costeo de
recetas hecho por el dueño con sus proveedores reales, sobre todo para atún y embutido.*
