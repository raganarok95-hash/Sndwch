# SND//WCH — Análisis de menú + proyección financiera, reconstruido desde cero

Fecha: 2026-07-30. **Versión 2 — reconstrucción completa a pedido explícito del dueño**,
que pidió tratar la versión anterior (y cualquier auditoría de precios/márgenes previa
del proyecto) **como errónea** y rehacer todo sin reutilizar ningún precio de insumo,
supuesto de costeo o cifra de demanda ya mencionada antes. Todo número de este documento
viene de (a) investigación de mercado real con fuente citada, (b) el catálogo real del
código (`catalog.ts`, precios de venta que sí están en producción), o (c) una simulación
Monte Carlo corrida en Python sobre esos datos — nunca de una cifra recordada de una
sesión anterior.

**El negocio sigue sin haber abierto.** Todo lo financiero de este documento sigue siendo
una SIMULACIÓN, no un pronóstico con historial real.

## 0. Qué se descartó y por qué

A pedido explícito: se ignoraron por completo los precios de insumos de CLAUDE.md (res
S/20/kg, pollo S/17/kg, atún S/38/kg, queso S/35/kg, etc.), el COGS plano del 45%, el
ticket promedio de S/26 y el ramp de pedidos/día (8→14→20) de la versión 1 de este
documento. Se investigó todo de nuevo. Donde el número nuevo coincide con el viejo es
coincidencia real (mercado estable), no reciclaje.

**Preguntas que se le hicieron al dueño antes de investigar** (respuestas reales,
2026-07-30): no tiene cotización real de insumos con proveedores todavía, no tiene
definido el gramaje de proteína por sándwich, no tiene costeado pan/queso/salsas/empaque,
y no tiene ningún dato real de demanda (seguidores, lista de espera, compromisos). Es
decir: **este documento parte de cero de verdad**, investigado con `WebSearch` en 3
frentes paralelos, no completado con criterio propio donde faltaba un dato.

**Skill de simulación avanzada**: se buscó explícitamente una skill de matemáticas
avanzadas/simulación/Monte Carlo antes de construir esto a mano — `npx skills search`
con "monte carlo", "simulation", "statistics", "probabilistic forecasting": 0 resultados
en las ~90 skills instaladas. Es el mismo tipo de gap que ya documentado para "chef" —
no existe en esta cuenta. La simulación Monte Carlo de la sección 3 se construyó con
Python puro (librería estándar `random`, sin necesidad de numpy/scipy, que tampoco están
instalados en este entorno) — 20,000 corridas, no 3 escenarios fijos como la versión 1.

---

## 1. Insumos: precios reales investigados (Perú, 2026)

| Insumo | S//kg (o unidad) usado | Confianza | Fuente |
|---|---|---|---|
| Pan tipo sub (proxy baguette) | S/11 (rango S/9-13) | Moderada — no existe formato "sub" en el mercado peruano, se usa baguette como proxy | [Bonpan Perú](https://bonpanperu.com/producto/pan-baguette/) |
| Res (corte económico, asado) | S/22 (rango S/20-24) | Moderada — precio productor/mercado, no necesariamente el corte exacto | [Selina Wamucii](https://www.selinawamucii.com/insights/prices/peru/beef/) |
| Pollo (pechuga, estimado) | S/17 (rango S/16-18) | Moderada — pechuga deshuesada no se cotiza aparte, estimado con premium sobre pollo entero | [Infobae mar 2026](https://www.infobae.com/peru/2026/03/28/precio-del-pollo-en-lima-y-callao-hoy-cuanto-cuesta-el-kilo-y-por-que-esta-subiendo-en-2026/) |
| Atún (neto escurrido) | S/67 (rango S/61-73) | Moderada — precio de lata real, conversión a neto es cálculo propio | [Tottus](https://tottus.falabella.com.pe/tottus-pe/product/113709279/filete-de-atun-en-aceite-de-girasol-170g/113709281) |
| Embutido premium (jamón/salame) | S/50 (rango amplio S/37-65) | Débil — cada producto tiene presentación distinta, sin fiambre a granel real | [Metro — Jamón Inglés Braedt](https://www.metro.pe/jamon-ingles-braedt-x-kg-2/p) |
| Carne molida | S/21 (rango S/17-25) | **Sólida** — precio "por kg" explícito de 2 fuentes | [Metro](https://www.metro.pe/carne-molida-especial-nacional-x-kg-109178/p), [Carnicentro](https://carnicentro.com.pe/producto/carne-molida-economica/) |
| Queso mozzarella | S/12.50 (rango S/11.90-13) | **Sólida** | [Makro/plazaVea](https://www.makro.plazavea.com.pe/quesos-y-fiambres/quesos-semiduros/queso-mozzarella) |
| Salsa (proxy mostaza) | S/19 (rango S/15-23.50) | Moderada — mayonesa a granel no tiene precio público, se usa mostaza como proxy | [Makro — Mostaza Alpesa 4kg](https://www.makro.plazavea.com.pe/mostaza-alpesa-caja-4kg/p) |
| Vegetales/toppings (mezcla) | S/4/kg (blend lechuga S/1.20-3.01, tomate S/2.59, cebolla S/1.78, pepinillo S/24-26, jalapeño ~S/40) | Débil-moderada — tomate/cebolla sólidos (mayorista GMML), pepinillo/jalapeño son precio retail, no mayorista | [Infobae 15 jul 2026](https://www.infobae.com/peru/2026/07/15/conoce-los-precios-de-las-frutas-verduras-papas-y-otros-alimentos-en-los-mercados-de-lima/) |
| Empaque (caja+bolsa+servilletas)/pedido | S/1.10 (rango S/0.70-1.50) | **Débil, gap real de mercado** — ningún proveedor peruano publica precio unitario online (cotizan por WhatsApp) | [cajas.pe](https://cajas.pe/comida-rapida/caja-para-sandwich/) |

**Nota importante sobre confiabilidad**: 4 de 9 insumos tienen precio "sólido" (fuente
mayorista/retail explícita en S//kg, dato reciente). El resto son estimaciones
razonables pero no cotizaciones reales del negocio — **la recomendación más accionable de
todo este documento es que el dueño cotice directamente con 2-3 proveedores reales**
(especialmente proteínas y empaque, que dominan el costo) antes de fijar cualquier
precio de venta definitivo sobre esta base.

**Bebidas: no investigadas en esta ronda.** El margen 61-84% que citaba CLAUDE.md viene
de la auditoría que el dueño pidió tratar como errónea — no se reinvestigó el costo real
de las infusiones (hibiscus, menta, chai, brew) en esta pasada por alcance de tiempo. Se
deja marcado como pendiente, no como dato vigente.

### 1.1 Porciones reales (gramaje), estándar de industria investigado

| Componente | 15CM | 30CM | Fuente |
|---|---|---|---|
| Proteína (declarado/target) | 85 g | 170 g | Subway lo confirmó a medios — [Consumer Reports](https://www.consumerreports.org/fast-food-restaurants/consumer-reports-reviews-the-new-sandwich-on-subways-menu/) |
| Pan | 71 g | 142 g (extrapolado) | [FastFoodNutrition](https://fastfoodnutrition.org/subway/6-9-grain-wheat-bread) |
| Queso (porción) | 11 g | 22 g (extrapolado) | [FastFoodNutrition](https://fastfoodnutrition.org/subway/processed-american-cheese-2-triangles) |
| Salsa | 14 g | 28 g (extrapolado) | [SnapCalorie](https://www.snapcalorie.com/nutrition/subway_mayonnaise_nutrition.html) |
| Vegetales/toppings (combinado) | ~65 g | ~130 g (extrapolado) | **Dato débil** — estimación indirecta por resta (peso total 233g menos otros componentes), sin ficha oficial que lo desglose |

**Advertencia real encontrada en la investigación**: Consumer Reports pesó sándwiches
reales de Subway y encontró que la proteína entregada es 18-27% MENOR a la declarada
(62g reales vs 85g declarados a 15CM). Este documento usa el gramaje **declarado/objetivo
de receta** (85g/170g), no el "real promedio de ejecución" — es la base correcta para
diseñar una receta, aunque vale la pena que SND//WCH pese su propia ejecución real una
vez abra, porque la brecha entre receta y ejecución real es justo lo que decide si el
margen calculado en la sección 2 se cumple en la práctica o no.

---

## 2. Costeo real por producto (bottom-up, sin COGS plano asumido)

Con los precios y porciones de la sección 1, el costo de cada sándwich se calculó
ingrediente por ingrediente (pan + proteína + vegetales + salsa + empaque + queso si
aplica) — no como un 45% plano del precio de venta. Los precios de venta son los reales
del catálogo en producción (`catalog.ts`).

### 2.1 Signatures

| Signature | Proteína | Precio 15CM | Costo 15CM | Margen 15CM | Precio 30CM | Costo 30CM | Margen 30CM |
|---|---|---|---|---|---|---|---|
| THE VAULT (SIG05) | Pollo Cajún | S/24 | S/3.94 | **83.6%** | S/30 | S/6.77 | 77.4% |
| THE CHICAGO (SIG07) | Res corte Chicago | S/25 | S/4.56 | **81.8%** | S/25 | S/8.01 | 67.9% |
| THE TERIYAKI (SIG06) | Pollo | S/17 | S/3.85 | 77.3% | S/21 | S/6.60 | 68.6% |
| THE MEATBALL (SIG02) | Albóndiga | S/19 | S/4.33 | 77.2% | S/24 | S/7.56 | 68.5% |
| THE ORIGINAL (SIG01) | Res asado | S/18 | S/4.28 | 76.2% | S/22 | S/7.45 | 66.1% |
| THE SMOKE (SIG03) | Embutido | S/21 | S/6.66 | 68.3% | S/30 | S/12.21 | 59.3% |
| **THE FRESH (SIG04)** | **Atún** | **S/16** | **S/8.10** | **49.4%** ⚠ | **S/30** | **S/15.10** | **49.7%** ⚠ |

**Hallazgo principal de esta reconstrucción**: con precio real de atún investigado hoy
(S/67/kg neto escurrido — considerablemente más caro que cualquier cifra usada antes),
THE FRESH tiene un margen de ~49-50%, claramente el más bajo del catálogo público y por
debajo de los demás (59-84%). Esto es más marcado que lo que sugería la versión anterior
de este documento (que estimaba 57.5% con un precio de atún mucho más bajo, ~S/38/kg, ya
descartado). **Es el hallazgo con más consecuencia real de todo este análisis**: si el
costo real de atún se confirma cerca de este rango, THE FRESH a S/16/S/30 vale la pena
revisarlo — pero la decisión es del dueño, no una corrección automática de este
documento (ver recomendaciones).

### 2.2 Build Your Own (proteínas sueltas)

| Proteína | Precio 15CM | Costo 15CM | Margen 15CM | Precio 30CM | Costo 30CM | Margen 30CM | Recargo doble | Costo doble | Margen doble |
|---|---|---|---|---|---|---|---|---|---|
| P02 Pollo | S/13 | S/3.85 | 70.4% | S/21 | S/6.60 | 68.6% | S/6 | S/1.45 | 75.9% |
| P06 Molida | S/14 | S/4.19 | 70.1% | S/24 | S/7.28 | 69.7% | S/6 | S/1.79 | 70.2% |
| P01 Res | S/14 | S/4.28 | 69.5% | S/22 | S/7.45 | 66.1% | S/6 | S/1.87 | 68.8% |
| P05 Embutido | S/16 | S/6.66 | 58.4% | S/30 | S/12.21 | 59.3% | S/9 | S/4.25 | 52.8% |
| **P04 Atún** | **S/16** | **S/8.10** | **49.4%** ⚠ | **S/30** | **S/15.10** | **49.7%** ⚠ | **S/9** | **S/5.70** | **36.7%** ⚠ |

El mismo patrón se repite en Build Your Own: atún tiene el margen más bajo, y la doble
proteína de atún (36.7%) es la operación individual de menor margen de todo el
catálogo — pagar S/9 extra por 85g más de atún cuesta S/5.70 de insumo real, dejando
solo S/3.30 de margen bruto por ese extra.

### 2.3 Matriz de menu engineering (con costeo real, sin popularidad real todavía)

La popularidad real sigue sin existir (negocio no ha abierto) — pero a diferencia de la
versión 1, el eje de margen ahora sí viene de un costeo real, no de un COGS plano
asumido:

- **Márgenes reales van de 49% a 84%**, un rango mucho más amplio que el 57-80% de la
  versión anterior — la estrategia de precios del negocio NO fuerza un piso de margen
  tan parejo como se pensaba antes.
- THE VAULT y THE CHICAGO (los dos RESERVE) tienen, por lejos, los mejores márgenes del
  catálogo (78-84%) — consistente con su posicionamiento premium.
- THE FRESH y el atún en BYO son un caso aparte real, no una hipótesis — están 20-30
  puntos porcentuales por debajo del resto, con datos de precio de mercado de hoy, no
  con una suposición.
- Sin datos reales de venta, no se puede completar el eje de popularidad — eso sigue
  pendiente de datos reales post-lanzamiento (ver recomendaciones).

---

## 3. Proyección financiera — Simulación Monte Carlo (3 meses)

A diferencia de la versión 1 (3 escenarios fijos: conservador/base/optimista), esta
versión corre una simulación Monte Carlo de **20,000 corridas** en Python (script en
`/tmp/.../scratchpad/montecarlo.py` de esta sesión, reproducible), donde cada corrida
sortea al azar, dentro de rangos investigados con fuente real, el volumen de pedidos, el
ticket promedio y la mezcla de método de pago — en vez de fijar un número único por
supuesto.

### 3.1 Variables aleatorias del modelo (todas con fuente)

| Variable | Distribución | Rango/parámetros | Fuente |
|---|---|---|---|
| Pedidos/día Mes 1 | Uniforme | 5 a 15 | Investigación de benchmarks de lanzamiento (ver 3.2) |
| Pedidos/día Mes 2 | Uniforme | 8.7 a 24.5 | Interpolación log-lineal entre Mes 1 y Mes 3 |
| Pedidos/día Mes 3 | Uniforme | 15 a 40 | Investigación de benchmarks de lanzamiento (ver 3.2) |
| Ticket promedio | Triangular | mín S/16, moda S/24, máx S/45 | Rango real de precios del catálogo (`SIG_DATA`), sin bebidas costeadas (ver 1) |
| % pagos con tarjeta | Uniforme | 35% a 70% | Sin dato real todavía — rango amplio a propósito |
| Comisión Culqi | Fija | 5% sobre la porción con tarjeta | Ya confirmado en código (`CULQI_FEE_RATE`) |
| COGS real | Triangular | mín 20%, moda 27%, máx 35% | Costeo bottom-up de la sección 2 (26.6% promedio simple de Signatures a 15CM), banda por incertidumbre de empaque/vegetales/mermas |
| Renta | Fija | S/0 | Confirmado por el dueño — cocina propia |
| Delivery | Fija, neutral | S/0 de efecto neto | Confirmado por diseño ya implementado (`DELIVERY_ZONE_FEES`, pass-through puro) |
| Marketing | Fija | S/300/mes | Confirmado por el dueño |
| Otros fijos | Fija | S/150/mes | **Único supuesto sin confirmar que queda** (gas/luz de cocina propia + hosting) |
| Días operando | Fija | 26/mes | Confirmado por el dueño (6 días/semana) |

### 3.2 Benchmarks de demanda usados (con fuente real, no estimación propia)

No existe dato específico de Perú/LatAm para delivery de comida con app propia (sin
agregador) — se investigó y no se encontró, así que se usa benchmark internacional,
explícitamente marcado como tal:

- **Chicago Booth Review** — advierte que el "ramp hockey-stick" que casi todo
  emprendedor espera casi nunca ocurre así de rápido en la realidad — sostiene el
  extremo bajo del rango de Mes 1 (5/día), no un arranque optimista.
- **Toast (encuesta, n=43 restaurantes nuevos)** — ingreso mensual promedio ~US$111,860
  en el primer año completo, con local físico — se usa con fuerte descuento como techo
  referencial del Mes 3 (40/día), nunca como piso de Mes 1 (SND//WCH no tiene local
  físico ni historial).
- **Databox** — cuentas de Instagram &lt;10K seguidores convierten ~1-1.3% — con
  presupuesto de marketing de S/300/mes y una cuenta nueva, sostiene un rango bajo de
  captación por redes sola.
- **Ohio State (Parsa et al.) / NRA / BLS** — tasa real de cierre de restaurantes en el
  primer año entre 17-30% (no el mito del 90%, pero tampoco trivial) — refuerza no
  asumir un ramp optimista por defecto.
- **Peru Retail** — 70% de cevicherías peruanas ya usan reparto propio en vez de
  Rappi/PedidosYa por las comisiones (20-35% del pedido) — valida la estrategia de
  SND//WCH de app propia con delivery contratado directo, no un dato de volumen.

### 3.3 Resultado de la simulación (S/, percentiles sobre 20,000 corridas)

| | P10 | P50 (mediana) | P90 |
|---|---|---|---|
| **Ingresos totales (3 meses)** | 29,134 | 39,204 | 51,410 |
| **Utilidad neta (3 meses)** | 18,916 | 26,094 | 34,804 |
| Utilidad Mes 1 | 2,395 | 4,492 | 7,385 |
| Utilidad Mes 2 | 4,393 | 7,706 | 12,456 |
| Utilidad Mes 3 | 7,814 | 13,119 | 20,601 |

- **Probabilidad de pérdida en Mes 1, dentro de este modelo: 0.0%** (0 de 20,000
  corridas). La peor corrida individual observada en Mes 1 fue +S/1,013 — sigue siendo
  positiva.
- **Probabilidad de pérdida acumulada a 3 meses: 0.0%**. Peor corrida observada a 3
  meses: +S/9,596.
- **Rango P5-P95 de utilidad a 3 meses: S/17,322 a S/37,480.**

### 3.4 Qué significa el 0% de probabilidad de pérdida (y qué NO significa)

Esto **no es una garantía de que el negocio no pueda perder dinero** — es el resultado
honesto de que, dentro de los rangos investigados (5-40 pedidos/día, COGS 20-35%,
renta/delivery ya confirmados en S/0 de efecto neto), no hay combinación que cruce a
pérdida. Lo que el modelo **no captura**:

- Un escenario de demanda por debajo de 5 pedidos/día sostenido — el piso de la
  investigación de benchmarks, no un mínimo absoluto imposible de cruzar en la realidad.
  La tasa real de cierre de restaurantes (17-30% en el primer año, sección 3.2) es la
  señal más honesta de que "no hay corrida con pérdida en el modelo" no equivale a
  "el negocio no puede fracasar".
- Costos reales de insumos por debajo del rango investigado (sección 1) — si el dueño
  cotiza con proveedores reales y el costo real resulta más alto de lo que se investigó
  (posible, varios insumos son de confianza "moderada" o "débil"), el margen baja.
- El overhead de gas/luz de cocina (S/150/mes) sigue sin confirmar — es chico frente al
  resto del modelo, pero no es cero.

---

## 4. Recomendaciones concretas

1. **Cotizar con proveedores reales, no con precios de mercado investigados.** Es la
   brecha más grande que queda: 5 de 9 insumos tienen confianza "moderada" o "débil".
   Las proteínas (mayor costo) y el empaque (gap real de mercado, sin precio público)
   son la prioridad.
2. **Revisar THE FRESH (SIG04) y la doble proteína de atún en BYO específicamente** —
   con precio real de atún investigado hoy, son los dos productos de menor margen del
   catálogo por un margen amplio (~30 puntos porcentuales por debajo del resto). No es
   una corrección automática de este documento — es una decisión del dueño una vez
   confirme el costo real de su proveedor de atún.
3. **Pesar la ejecución real de cocina una vez el negocio abra** — la investigación
   encontró que Subway entrega 18-27% menos proteína de lo que declara su propia receta.
   Vale la pena que SND//WCH verifique que su ejecución real coincide con la receta de
   85g/170g usada en este costeo, en cualquier dirección.
4. **Costear bebidas con el mismo rigor** — quedó fuera de esta ronda por alcance de
   tiempo. El margen de bebidas de la versión anterior (61-84%) viene de la auditoría
   que se pidió descartar, así que hoy no hay ningún número vigente de margen de bebidas.
5. **Tratar el 0% de probabilidad de pérdida de la simulación con la advertencia de la
   sección 3.4** — es honesto dentro de los rangos investigados, no es una garantía.

---

*Documento generado como simulación de apoyo a la decisión — reconstruido desde cero el
2026-07-30 a pedido explícito del dueño, sin reutilizar ningún precio/supuesto de
versiones anteriores. No reemplaza cotizaciones reales de proveedores ni datos reales
de venta una vez el negocio abra.*
