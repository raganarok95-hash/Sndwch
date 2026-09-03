# SND//WCH — Análisis de menú + proyección financiera

> # ⚠ VERSIÓN 6 — LEE ESTO ANTES QUE NADA (2026-08-22)
>
> **Todas las cifras de margen, COGS y utilidad de las secciones de abajo (v1 a v5.1) están
> SUPERADAS y son OPTIMISTAS.** Costeaban la proteína como `gramos servidos × precio/kg del
> insumo crudo`, lo que ignora la merma de cocción: de 1 kg de res cruda salen 540 g de
> mechado, no 1 kg. **El costo real de la proteína terminada es ~1.85x** el que usan esas
> tablas. Por eso ahí aparecen márgenes de 77-84% que no existen.
>
> Se conservan sin borrar porque la metodología (Monte Carlo, porciones por tamaño,
> benchmarks de demanda anclados en Perú) sigue siendo válida — lo que hay que reemplazar
> son los costos de proteína de entrada. **No cites un número de las secciones 2 a 11 sin
> recalcularlo con los rendimientos de abajo.**
>
> ## Rendimientos reales (con fuentes en `recetas/detalle-res.md` y `recetas/detalle-pollo.md`)
>
> | Proteína | Limpieza | Cocción | Rendimiento | Costo/porción 85 g | 170 g |
> |---|---|---|---|---|---|
> | P01 res mechada | 10% | 40% | **0.54** | S/3.15 | S/6.30 |
> | P02 pollo teriyaki | 8% | 25% | **0.690** | S/2.47 | S/4.95 |
> | P03 pollo cajún | 8% | 30% | **0.644** | S/2.49 | S/4.97 |
> | P04 atún *(estimado)* | — | — | — | S/4.82 | S/9.64 |
> | P05 embutido *(estimado)* | 5% laminado | — | 0.95 | S/4.29 | S/8.59 |
> | P06 albóndiga *(estimado)* | — | 25% | 0.75 | S/1.34 | S/2.68 |
>
> P01/P02/P03 vienen de investigación con fuentes citadas. **P04/P05/P06 son estimación
> sin cotizar** — el atún es el más débil (usa ~S/67/kg investigado online, sin cotización
> real de proveedor).
>
> ## ⚠ El pan estaba subcosteado un 28% — corregido con precio real (2026-08-22)
>
> El modelo usaba un proxy de **S/11/kg × 71 g = S/0.781** el 15CM y **142 g = S/1.562** el
> 30CM. El pan **no se compra por kilo, se compra por unidad**: precio real del proveedor
> confirmado por el dueño, **S/2 el pan sub**, y **el 15CM se hace con medio pan**.
>
> | | proxy anterior | real | diferencia |
> |---|---|---|---|
> | Pan 15CM (medio) | S/0.781 | **S/1.00** | +S/0.219 (+28%) |
> | Pan 30CM (entero) | S/1.562 | **S/2.00** | +S/0.438 (+28%) |
>
> El recargo es idéntico para todos los ítems, así que se suma directo a cada costo de la
> tabla de abajo sin recalcular el resto del modelo de componentes. Ese modelo se validó
> antes de usarlo: The Original 15CM = P01 3.15 + pan 0.781 + empaque 1.10 + 2 salsas 0.532
> + vegetales 0.26 = **S/5.823**, contra los S/5.82 que ya decía la tabla. Coincide.
>
> **La focaccia ya está medida (dueño, 2026-09-03): S/13 la entera → 10 porciones de 15CM
> o 5 de 30CM.** O sea **S/1.30 el 15CM y S/2.60 el 30CM**, contra S/1.00 y S/2.00 del pan
> sub: **+S/0.30 y +S/0.60 de sobrecosto**. Cayó del lado malo de la sensibilidad que esta
> nota tenía escrita — empataba con el pan sub recién a 13 porciones, y salen 10.
>
> **Y desde esa fecha el tipo de pan dejó de ser una elección gratuita**: se cobra
> **S/0.50 (15CM) y S/1.00 (30CM)** por la focaccia (`BASE_SURCHARGE`, duplicado
> cliente/servidor y comparado por `npm run parity`). Se cobra por encima del sobrecosto a
> propósito: el error de un cargo así no puede caer del lado de subsidiar el pan, que es
> exactamente lo que venía pasando.
>
> ⚠ **Esto no arregla el hueco de margen del BYO.** La combinación que cruza el techo de
> 45% —BYO 30CM de res, 45.6%— lo cruza con **pan sub**, donde la focaccia nunca entró.
> Cobrar la focaccia recupera lo que se estaba regalando; no sube el BYO. Ese caso sigue
> abierto y depende de una decisión de precio del dueño.
>
> ## Margen real por Signature, con los precios del 2026-08-22 y el pan real
>
> | Signature | 15CM | costo | % | contribuye | 30CM | costo | % | contribuye |
> |---|---|---|---|---|---|---|---|---|
> | The Original | 20.90 | 6.04 | 28.9% | 14.86 | 26.90 | 10.99 | 40.8% | 15.91 |
> | The Marinara | 21.90 | 4.35 | 19.9% | 17.55 | 28.90 | 7.60 | 26.3% | 21.30 |
> | The Smoke ⁽¹⁾ | 23.90 | 7.60 | 31.8% | 16.30 | 34.90 | 14.11 | 40.4% | 20.79 |
> | The Fresh | 20.90 | 7.45 | 35.6% | 13.45 | 34.90 | 13.79 | 39.5% | 21.11 |
> | The Teriyaki | 19.90 | 5.36 | 26.9% | 14.54 | 25.90 | 9.64 | 37.2% | 16.26 |
>
> ⁽¹⁾ **THE SMOKE es el único Signature que se arma sobre focaccia** (`base: "B03"`, tanto en
> la semilla del código como en la fila vigente de `catalog_items` — verificado contra la base
> el 2026-09-03). Su costo estaba calculado con pan sub; con el rendimiento medido de la
> focaccia sube **+S/0.30 (15CM) y +S/0.60 (30CM)**, que es lo que corrige esta fila.
>
> ⚠ **Y ese sobrecosto es permanente**: el recargo de `BASE_SURCHARGE` solo aplica a ARMA EL
> TUYO, donde el pan es una elección del cliente. En un Signature el pan lo fija la receta, así
> que no hay nada que recargarle — sale del margen y ahí se queda. Con holgura de sobra (31.8%
> y 40.4% contra un techo de 45%), así que no pide ninguna decisión; pero si algún día se
> publica otro Signature sobre focaccia, este es el número que hay que volver a mirar.
>
> **El menú secreto (SIG05) también va sobre focaccia** (`base: "B03"`, S/24.90 / S/30.90,
> fila vigente de `secret_signature` verificada el 2026-09-03) y le pasa lo mismo. Su
> proteína es la más barata de las cocidas (P03, pollo cajún, S/2.49 la porción de 15CM), así
> que aun con el pan caro queda en ~23% de insumos — el producto más rentable del catálogo,
> que es justamente lo que se busca de un menú secreto.
>
> Los diez siguen pasando el techo de 45% de insumos+empaque, con holgura. THE CHICAGO
> (SIG07) salió del catálogo el 2026-08-22 por costo de producción, no por margen.
>
> **Donde sí muerde es en ARMA EL TUYO de 30CM**, que ya venía siendo lo más ajustado del
> catálogo:
>
> | BYO 30CM | precio | antes | con pan real |
> |---|---|---|---|
> | Res (P01) | 22.90 | 43.7% | **45.6% — cruza el techo de 45%** |
> | Atún (P04) | 30.90 | 43.2% | 44.6% |
>
> Es la única combinación del catálogo que se pasa. Sigue el mismo patrón ya visto con el
> `pDbl` plano: el precio del BYO no se tocó en la subida de margen del 2026-08-22 (el dueño
> autorizó los Signatures, no el BYO), así que absorbe entero cualquier encarecimiento de
> insumo.
>
> ## Contribución por pedido y punto de equilibrio
>
> - Contribución media por sándwich (mezcla 80% en 15CM): **S/16.16** — no se mueve de forma
>   apreciable al corregir THE SMOKE: es 1 de 5 Signatures y el ajuste es de S/0.30-0.60
> - Bebida: contribución media **S/4.79**; en combo (−S/1) deja **S/3.79**
> - Comisión Culqi estimada: **−S/0.69/pedido** (60% paga con tarjeta, ~5%)
> - **Contribución neta por pedido: S/16.42** (asumiendo 25% de pedidos con bebida) — bajó
>   S/0.26 (−1.6%) respecto de los S/16.68 que se calcularon con el pan subcosteado
> - Costos fijos < S/500/mes → **punto de equilibrio ~31 pedidos/mes = 1.2 al día**
>
> ## Rentabilidad mes a mes — modelo de cohortes v7 (2026-08-22)
>
> **Los tres escenarios a 3 meses que estuvieron acá antes quedaron ANULADOS.** Sorteaban
> pedidos/día de rangos elegidos a mano (el "optimista" asumía 28 pedidos/día en el mes 3),
> que es el mismo defecto que este documento le critica a las versiones v1-v5. Reemplazados
> por un modelo de cohortes de 40,000 corridas donde los pedidos **se derivan de clientes**:
>
> ```
> activos_m = activos_(m-1) × retención + nuevos_m
> pedidos_m = activos_m × pedidos_por_cliente_activo
> ```
>
> ### El hallazgo estructural: la meseta es aritmética
>
> Una base de clientes con retención `r` y `n` clientes nuevos por mes **no crece para
> siempre**: converge a `activos* = n / (1 − r)`. No es un supuesto del modelo, es álgebra.
>
> | nuevos/mes | r=0.25 | r=0.38 | r=0.50 | r=0.65 | r=0.75 |
> |---|---|---|---|---|---|
> | 37 | 2.6/día | 3.1/día | 3.8/día | 5.5/día | 7.7/día |
> | 100 | 6.9/día | 8.4/día | 10.4/día | 14.8/día | 20.8/día |
> | 150 | 10.4/día | 12.6/día | 15.6/día | 22.3/día | 31.2/día |
> | 250 | 17.3/día | 20.9/día | 26.0/día | 37.1/día | 51.9/día |
>
> Con marketing FIJO de S/300/mes el negocio produce ~37 clientes nuevos al mes y **se
> estanca en ~3 pedidos/día para siempre** — 99% de probabilidad de ser rentable, pero
> rentable en ~S/550/mes. Subir el presupuesto a S/800 fijos tampoco lo rompe: mueve la
> meseta, no la elimina. Lo único que produce crecimiento compuesto es que el marketing
> **crezca con el negocio** (reinversión de un % de la contribución).
>
> ### Escenario base: reinvertir 35% de la contribución en adquisición
>
> | Mes | ped/día (P50) | neto P10 | neto P50 | neto P90 | P(neto>0) |
> |---|---|---|---|---|---|
> | sep-26 | 2.0 | −374 | **−125** | 77 | **23%** |
> | oct-26 | 2.2 | −55 | 137 | 361 | 82% |
> | nov-26 | 2.6 | 35 | 270 | 625 | 93% |
> | dic-26 | 3.0 | 87 | 378 | 924 | 96% |
> | mar-27 | 4.3 | 232 | 785 | 2,302 | 99% |
> | jun-27 | 5.8 | 339 | 1,174 | 4,562 | 99% |
> | dic-27 | 8.2 | 450 | 1,840 | 10,334 | 99% |
> | jun-28 | 10.2 | 498 | 2,360 | 10,830 | 99% |
> | ago-28 | 10.8 | 506 | **2,514** | 10,885 | 99% |
>
> **El mes de lanzamiento pierde plata en 3 de cada 4 corridas** (mediana −S/125). Es
> normal y no es una señal de alarma: son S/125, no S/12,000.
>
> ### Llegar a S/10,000 NETOS en un solo mes
>
> Requiere **~647 pedidos al mes = 25 pedidos/día = ~480 clientes activos**, sostenidos.
> Eso es el **62% del techo físico** del dueño (40 pedidos/día), así que es alcanzable sin
> contratar a nadie — pero no es un problema de cocina, es un problema de adquisición:
> exige **~250 clientes nuevos por mes de forma sostenida**, contra los ~37 que produce el
> plan de marketing actual.
>
> | Política de marketing | Llega a S/10k en 30 meses | Primer mes (P50) |
> |---|---|---|
> | S/300 fijos | **0%** | nunca |
> | Reinvertir 20% | 1% | — |
> | Reinvertir 35% | **27%** | ene-28 |
> | Reinvertir 50% | 15% | may-27 |
>
> La fila del 50% muestra la tensión real: reinvertir más hace el negocio **más grande y
> más rápido** (mediana may-27 contra ene-28), pero **menos corridas llegan a S/10k netos**,
> porque esa plata se está gastando en crecer en vez de quedarse en el bolsillo. Los
> S/10,000 de utilidad y el crecimiento máximo son objetivos que compiten entre sí.
>
> ### El canal de oficinas: la única vía que acerca los S/10,000 (2026-08-22)
>
> Pregunta del dueño: "¿cómo llego a los 10 mil en 3 meses?". Respuesta corta: **en 3 meses
> no se llega**, pero el canal equivocado es lo que hacía la meta imposible, no la meta.
>
> **El cambio de unidad que lo decide: la contribución es POR SÁNDWICH, no por pedido.**
> Un pedido de oficina de 6 sándwiches contribuye casi lo mismo que 6 pedidos individuales,
> pero cuesta UN cliente en vez de seis. Y el cuello de botella no es la cocina (techo 40/día)
> ni el mercado (Trujillo tiene 1.1M): es adquirir clientes.
>
> Para S/10,000 netos con S/1,500 de marketing hacen falta **731 sándwiches/mes** (28/día,
> 70% del techo). Los mismos 731 sándwiches, según el canal:
>
> | Canal | sw/pedido | pedidos/día | clientes activos | nuevos/mes por 3 meses |
> |---|---|---|---|---|
> | Solo individuales | 1.0 | 28.1 | 541 | **408** (15.7/día, S/19,573 de ads) |
> | Mixto 70/30 oficinas | 2.1 | 13.4 | 258 | ~195 |
> | **Mixto 50/50 oficinas** | **3.5** | **8.0** | **155** | **117** (4.5/día, S/5,592 de ads) |
> | Mayoría oficinas | 5.0 | 5.6 | 108 | ~82 |
>
> Convencer a 1,223 individuos en 3 meses no es realista para una persona sola sin marca.
> Convencer a 350 oficinas es un trabajo de puerta, medible y concentrado geográficamente.
>
> **Probabilidad de llegar a S/10,000 en nov-26 (mes 3), 20,000 corridas:**
>
> | Escenario | neto P50 nov-26 | P(≥10k) |
> |---|---|---|
> | Solo individuales, marketing S/300 (plan actual) | S/314 | **0%** |
> | Solo individuales, marketing S/3,000/mes | S/2,221 | 0% |
> | Oficinas 50/50, 40 clientes nuevos/mes | S/2,112 | 0% |
> | Oficinas 50/50, 80 clientes nuevos/mes | S/6,223 | 8% |
> | **Oficinas mayoría, 60 clientes nuevos/mes** | **S/6,585** | **13%** |
>
> Con el canal de oficinas la meta se corre de "mes 24+ o nunca" a **P25 nov-26 · P50 ene-27**,
> y llega el 54% de las corridas. El mes 3 da ~S/6,600 de mediana: no son 10,000, pero son
> **24x** los S/270 que da el plan actual.
>
> **La restricción real es el tiempo del dueño, no el mercado.** 60 oficinas nuevas al mes
> son 2.3 cierres por día operativo; a 20% de tasa de cierre, ~12 visitas de puerta al día.
> Eso es media jornada de ventas, y sus mañanas ya están comprometidas cocinando (14-16 h
> semanales solo de preparación, según el recetario). **El plan de 3 meses no falla por
> demanda: falla porque una sola persona no puede cocinar y vender puerta a puerta a la vez.**
>
> El canal ya está construido en el producto (`actCreateGroupOrder`/`add-group-item`/
> `close-group-order`, y el código lo llama "el canal con mejor economía del negocio"). Lo
> que falta no es software: es que alguien salga a vender.
>
> ### Qué mueve la aguja, en orden
>
> 1. **Retención.** En la tabla de arriba, a 150 clientes nuevos/mes, pasar de r=0.38 a
>    r=0.65 lleva de 12.6 a 22.3 pedidos/día. Ninguna otra palanca da ese salto. Es la
>    razón de ser del programa de puntos, los rangos y el menú secreto — ya construidos.
> 2. **Volumen de adquisición.** No el CAC: el volumen. 250 nuevos/mes es el número.
> 3. **Contribución por pedido.** +S/2 mueve poco comparado con las dos de arriba.
>
> ### Anclas externas usadas (no hay datos de este negocio, no existe aún)
>
> - **~70% de los clientes primerizos de un restaurante nunca vuelven**; recompra en
>   delivery 30-40% a 30-90 días ([Restroworks](https://www.restroworks.com/blog/customer-retention-statistics-restaurants/),
>   [Propel](https://www.trypropel.ai/resources/blogs/retention-benchmarks-by-vertical-2026)).
> - **Un comercio nuevo en DoorDash tiene >20% de pedidos de repetidores el mes 1 y ~40%
>   al mes 3** ([DoorDash](https://merchants.doordash.com/en-us/blog/restaurant-customer-retention))
>   — por eso la retención del modelo mejora con el tiempo en vez de ser plana.
> - **2-5% de los seguidores de un negocio de comida casero se vuelven clientes**
>   ([Truffle Nation](https://trufflenationonline.com/blog/instagram-for-home-bakers/)).
> - **Los benchmarks de "15-25 pedidos/día el mes 1" de una dark kitchen NO aplican acá**
>   ([DoorDash](https://merchants.doordash.com/en-us/blog/ghost-kitchen)): son de negocios
>   enchufados a un marketplace que ya trae el tráfico. SND//WCH no está en Rappi ni
>   PedidosYa — cada pedido hay que traerlo desde cero. Este es el supuesto que más
>   inflaba los modelos anteriores.
> - Trujillo metropolitano ~1.1M de habitantes, 89% de manzanas en NSE medio-alto/alto
>   ([comoes.pe](https://comoes.pe/trujillo/trujillo/)). Los 480 clientes activos que exige
>   la meta son el **0.04% de la ciudad**: el mercado no es la restricción.
>
> **Mano de obra = S/0**: el dueño cocina y arma él mismo. Eso no es un hecho, es una
> decisión contable — el recetario estima 14-16 h semanales solo de preparación, antes de
> atender un pedido.
>
> ## Lo que falta para que esto deje de ser una simulación
>
> 1. Cotizar de verdad: atún, embutido (los tres por separado), envase de bebida, pan.
> 2. Pesar crudo vs. cocido en la primera tanda real y validar los rendimientos de arriba.
> 3. Medir la mezcla real 15CM/30CM (`retention_report` ya devuelve `attach.size30Pct`).
> 4. Medir la tasa real de bebida por pedido — es la palanca más grande sin usar.

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

### 3.5 Piso realista para la Semana 1 específicamente (no la mediana de Mes 1)

Agregado 2026-08-03 a pedido del dueño: la mediana de Mes 1 (§3.2, uniforme 5-15
pedidos/día desde el primer día) asume que ya hay algo de demanda "tibia" esperando desde
el día 1 — pero **`waitlist_signups` tiene 0 inscritos hoy** (consultado en vivo), y el
calendario de contenido de pre-lanzamiento de `MARKETING_PLAN.md` apenas está arrancando.
Es realista que varios de los primeros 7 días de operación real tengan muy poca o ninguna
venta mientras el contenido/boca-a-boca recién agarra tracción.

| Escenario | Pedidos semana 1 | Bruta | Insumos (escalados a esa demanda) | Neta |
|---|---|---|---|---|
| **Piso realista** (días 1-3: 0-3 pedidos/día · días 4-7: 3-8 pedidos/día) | ~27 | S/648 | ~S/208 | **≈ S/361** |
| Mediana de Mes 1 (§3.2), prorrateada a 7 de 26 días | ~65 | S/1,378 | ~S/500 | ≈ S/1,208 |

**Los rangos "0-3" y "3-8" del piso realista son una decisión editorial, no investigada**
(mismo motivo que Meses 4-12 arriba: no existe ese dato público para un delivery nuevo en
Trujillo) — ilustran el riesgo de arranque lento, no un pronóstico. Ambos escenarios dan
neta positiva porque los insumos se escalan junto con la demanda (comprar por rondas, no
los S/500 completos del §5.2 de una sola vez el día 1) — el riesgo real de un arranque
lento no es pérdida, es una ganancia absoluta menor mientras el contenido de pre-
lanzamiento (todavía sin ejecutar) empieza a convertir.

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

## 6. Investigación adicional — financiero, insumos y empaque (agregado 2026-08-04)

10 investigaciones paralelas con WebSearch. Resumen accionable, fuentes en el detalle
completo de la sesión.

**6.1 Atún/embutido — primera referencia real de mayorista.** Precio caja x48 latas
(canal B2B, más cercano a mayorista que retail): Arica ~S/19.71/kg escurrido, San Jorge
~S/46.85/kg, A-1 ~S/53.31/kg — **las tres por debajo o cerca del S/67/kg usado hoy**,
confirmando que la cifra actual es conservadora, no que haya que bajarla ya (el rango
entre marcas es amplio, ~2.7x, así que no reemplaza una cotización real). Embutido sigue
sin cifra numérica — vía concreta identificada: **Mercado Zonal Palermo** (mayorista físico
de Trujillo, con Facebook activo) o el canal de ventas institucionales de San Fernando.

**6.2 Unit economics — SND//WCH está mejor que el benchmark, no peor.** CAC de industria
US$30-120/cliente; con CAC≈S/0 hoy (sin ads), cualquier segundo pedido ya pone el ratio
CAC:LTV muy por encima del 2:1-4:1 saludable para food & beverage. El margen de
contribución real (~55-74%, incluso con el 45% conservador de trabajo) supera el prime
cost sano de industria (60-65%). El punto débil real de la industria — y por extensión,
el mayor apalancamiento disponible — es retención: 70-78% de clientes de restaurante
nunca vuelven a nivel benchmark, no la adquisición.

**6.3 Flujo de caja — colchón recomendado más alto de lo estimado.** El estándar de
industria es 3-6 meses de fijos, más alto que el S/450-900 (1-2 meses) ya estimado en
§5.3 — para un negocio sin historial de ventas, apuntar al extremo alto (2-3 meses) es
más prudente que al mínimo. Recomendación práctica agregada: cuenta Yape/BCP separada
del negocio desde el primer pedido, comprar insumos según venta real de la semana
anterior (no en bulto), revisar saldo cada 2-3 días.

**6.4 Empaque — primera cotización real encontrada.** Bolsa kraft delivery: **S/0.35/unidad**
confirmado (proveedor Bio Pack, Lima). Envase biodegradable fibra de caña: S/0.48-0.605/
unidad. Sumando caja+bolsa+servilleta+sticker, el set completo cae en el mismo rango o
ligeramente por debajo del S/1.10 ya estimado — **la cifra actual no está disparatada**,
aunque sigue sin cotización exacta de la caja de sándwich en sí. Distribuidoras físicas en
Trujillo identificadas para cotizar directo sin flete: Interplast, Multienvases, Mayplast,
Truplast.

**6.5 Precios dinámicos — no expandir hacia recargos.** La asimetría ya usada por
SND//WCH (descuento en valle, nunca recargo en pico) es la que la evidencia recomienda —
el caso Wendy's (2024, boicot real por mencionar "dynamic pricing") confirma el riesgo
reputacional real de cualquier recargo por demanda, desproporcionado para una marca que
recién abre. Única extensión de bajo riesgo dentro de la misma familia (descuento, nunca
recargo): un combo tipo "última llamada" cerca del cierre para mover insumos frescos con
vencimiento corto, sin construir nada nuevo de pricing.

## 7. Investigación de sabores, recetas y menú (agregado 2026-08-04)

**7.1 Tendencias de sabor 2026 — 2 huecos reales identificados.** "Swicy" (dulce+picante)
ya domina y el catálogo actual ya lo cubre bien (THE VAULT, Spicy Mayo, Picante-Miel). Los
dos huecos reales frente a la tendencia 2026 son **coreano** (gochujang/kimchi — top
protein seasoning en el forecast 2026 de la NRA, 72% de interés Gen Z) y **mexicano**
(chipotle/chamoy/tajín) — ninguna de las 7 Signatures ni las 12 salsas los nombra hoy.

**7.2 Ciencia de maridaje — 2 combinaciones reales para revisar.** SIG02 THE MEATBALL
apila ácido/umami (marinara+vinagre+aceituna) sin ningún elemento graso/cremoso por
defecto (el queso queda opcional) — el sub de albóndiga clásico usa mozzarella justo para
ese contraste. SIG06 THE TERIYAKI apila 2 salsas dulce-umami (teriyaki+satay) en el mismo
eje sin un ácido fuerte que corte — riesgo real de sabor plano. SIG01 y SIG05 sí están
bien balanceados según los mismos principios (grasa+ácido, dulce+picante).

**7.3 Costo de receta sin perder calidad.** Técnica recomendada: plegado de proteína/
embutido en vez de capas planas (más volumen percibido, mismo gramaje) y relleno de aire
con vegetales entre capas. **No perseguir sustituciones tipo soya texturizada/extensores**
— contradice la curaduría de marca y el riesgo reputacional (caso Chipotle
"shrinkflation" 2024-2025, 16M+ vistas virales) supera el ahorro marginal dado que el COGS
actual (25.8%) ya está lejos del 45% de colchón.

**7.4 Opción vegetariana — no agregar al lanzamiento.** Solo 2% de los pedidos en Rappi
Perú son vegetarianos (dato directo de delivery, no proxy) pese a que Rappi ya tiene
filtro dedicado. Recomendación: medir demanda real post-lanzamiento (reclamos, "avísame
cuando vuelva") antes de invertir en desarrollo de receta; si se agrega después, tofu
(~S/5-6/kg) es la proteína más barata de las evaluadas.

**7.5 Salsa de autor nueva — hueco de categoría.** Fermentado/umami (miso, gochujang) es
la tendencia 2025-2026 más citada y el catálogo no tiene ninguna salsa en esa categoría
(sí cubre ahumado, fruta, satay). Idea concreta: `Miso // Gochujang`, mismo patrón de
naming ya usado (`Smoke BBQ`, `SNDWCH Special`).

**7.6 Bebida de autor nueva — idea concreta.** `// LUISA` (hierba luisa + maracuyá),
preparada por flash-infusión (agua caliente 3-5 min + dilución en frío) en vez de
infusión larga — evita el tiempo de reposo de 8-12h que no calza con un operador único
armando todo el mismo día.

**7.7 Naming "THE X" — validado, sin cambio necesario.** Wendy's, Arby's y Capriotti's
usan el mismo patrón con éxito — no está "quemado". El estudio de referencia sobre
descripciones evocadoras (+27% en ventas, Wansink 2001) debe tratarse como direccional,
no como cifra dura: su autor tiene 13+ papers retractados por conducta científica
cuestionable en otros trabajos (no este específico, pero amerita cautela).

## 8. Auditoría del menú real — ronda 3 (agregado 2026-08-05)

**8.1 Nombre de THE MIDNIGHT // BREW — riesgo real, pero menor de lo reportado; sigue
pendiente de decisión de marca.** El producto es té negro reposado en frío toda la noche
(cold brew tea), no café. **Verificación 2026-08-05**: el agente no revisó que la tarjeta
del menú (`src/app.ts`, función de render de bebidas) ya muestra la descripción completa
("Té negro reposado en frío toda la noche...") justo debajo del nombre en el único lugar
donde el cliente elige la bebida — el riesgo de confusión en el momento de compra es
menor al descrito. Sigue existiendo en contextos de solo texto (resumen de pedido,
WhatsApp) donde puede aparecer sin la descripción. Cambiar el nombre visible ("Brew" →
algo que nombre "té") es una decisión de identidad de marca (rompe el patrón de dos
palabras que comparten las otras 3 bebidas: Bloom/Hibiscus, Cool/Mint, Spice/Chai), no
solo una corrección de copy — **queda pendiente de que el dueño decida un nuevo subtítulo
antes de tocar el código**, no implementado.

**8.2 Precio de THE SPICE // CHAI (S/6 vs. S/3-4 del resto) — justificado, sin cambio.**
El chai lleva leche + especias importadas (canela, cardamomo, clavo, jengibre) frente a
una infusión de solo agua+hierba; el diferencial de insumo respalda el diferencial de
precio aunque no se halló una cifra directa S/-por-taza comparada.

**8.3 Riesgo de seguridad del lácteo del chai — ya bien cubierto, sin vacío.**
`RECIPE_RATIONALE.md` §4 ya identifica correctamente la base láctea como el ambiente de
mayor riesgo microbiológico (zona de peligro 5°C-60°C) con la mitigación correcta
(preparar solo la cantidad a usar). No requiere cambio.

**8.4 Alineación de las 4 bebidas con tendencias 2026 — confirmada.** Cold brew (café o
té) crece ~20%/año y domina la franja de tarde; té ya supera a café entre Gen Z, con auge
de botánicos/infusiones funcionales (THE BLOOM, THE COOL) y bebidas de inspiración global
tipo chai/horchata (THE SPICE). THE MIDNIGHT ya es objetivamente un cold brew de té — el
problema no es el producto, es que el nombre no lo comunica (ver 8.1).

**8.5 Riesgo combinatorio en Build Your Own — 3 combinaciones reales de sabor a evitar.**
Verificado en el código real (`src/app.ts`) contra los propios Signatures como referencia
de maridaje ya endosado por el dueño:
- Pollo Teriyaki (P02) + Teriyaki Glaze (S08) + Honey Mustard/Peanut Satay: apila
  dulce-soya sobre una proteína ya glaseada dulce sin ácido/picor que corte — el propio
  SIG06 nunca usa Teriyaki Glaze encima, solo Satay+SNDWCH Special.
- Atún House (P04, ya cremoso) + Smoke BBQ (S03, ahumado-dulce, salsa "pesada"): enmascara
  el sabor delicado del atún — el propio SIG04 empareja atún con Aioli+Dijon (salsas
  ligeras).
- Albóndiga Marinara (P06, ya ácida) + Oil & Vinegar (S06) + Mostaza Dijon (S11): triple
  fuente de acidez sin grasa/dulce que equilibre — SIG02 usa solo vinagreta sobre marinara.

**8.6 Tope de 3 salsas en BYO — ya existe, confirmado correcto, no tocar.** El código
(`src/app.ts` línea 1979) ya limita a 3 salsas seleccionables gratis en BYO, con una 4ta
opcional de pago (gratis vía recompensa R02). La ciencia sensorial confirma que sin ácido
que "resetee" el paladar entre bocados, salsas apiladas producen fatiga antes de llegar a
4-5 — el tope actual ya es razonable, no requiere ajuste.

**8.7 Toppings húmedos en conflicto — riesgo real para delivery/pedido programado.**
Tomate (T01) + Pepinillo (T02) + Pimiento (T06) son los 3 toppings más húmedos/en salmuera
del catálogo — combinados con 2-3 salsas, ablandan el pan (especialmente Focaccia sin
tostar) antes de la entrega en pedidos de trayecto largo.

**8.8 Propuesta de UX derivada — IMPLEMENTADO 2026-08-05.** Tag "Sugerida" (no exclusivo,
no bloquea otras opciones) en el paso de salsas de BYO, anclado a las combinaciones que ya
usan los propios Signatures: Atún→Aioli/Dijon, Pollo Teriyaki→Satay/SNDWCH Special,
Albóndiga→Oil&Vinegar. `src/app.ts`, función de render de salsas del paso 4 de BYO
(`sauceSuggest` + tag "Sugerida" en `sauceCard`). Subway y
guías de menú similares publican "mejores parejas" por proteína como contenido curado de
marketing/UX — no se halló evidencia de que lo implementen como sugerencia algorítmica en
vivo dentro del flujo de pedido, así que el precedente es de buenas prácticas de copy, no
un patrón de UI ya probado en producción por un competidor directo.

Fuentes: [Cold Brew Tea vs. Iced Tea](https://www.foodnhotelasia.com/blog/horeca/cold-brew-tea-vs-iced-tea/),
[Iced Tea vs. Cold Brew Tea — Ahista Tea](https://ahistatea.com/blogs/journal/iced-tea-vs-cold-brew-tea-its-not-the-same),
[Iced Chai vs Iced Chai Latte — Majesty Coffee](https://majestycoffee.com/blogs/posts/iced-chai-vs-iced-chai-latte),
[Coffee & Tea Trends for 2026 — WebstaurantStore](https://www.webstaurantstore.com/blog/2356/top-coffee-trends.html),
[How to Pair Sauces with Foods Without Clashing Flavors](https://www.imlsupplier.com/how-to-pair-sauces-with-foods-without-clashing-flavors/),
[The Science of Food Pairing — Flavoreer](https://www.flavoreer.com/the-science-of-food-pairing-why-certain-ingredients-work-together),
[Subway Sauces List & Best Flavor Pairings](https://subwaymenu.co.uk/subway-sauces/),
[Sauce it up — condiment properties on sensory perception (ResearchGate)](https://www.researchgate.net/publication/342235032_Sauce_it_up_Influence_of_condiment_properties_on_oral_processing_behavior_bolus_formation_and_sensory_perception_of_solid_foods),
[Filling forensics — the science behind the perfect sandwich](https://tasteat55.co.uk/2021/05/19/filling-forensics-the-science-behind-the-perfect-sandwich-and-how-to-stop-the-sog/).

**8.9 Maridaje de SIG03/SIG04/SIG07 — verificado, sin hallazgo accionable.** Los tres ya
están bien resueltos gastronómicamente con el catálogo actual:
- THE SMOKE (embutido ahumado + Smoke BBQ) no es redundante ni le falta ácido: T02
  Pepinillo Encurtido ya cumple el rol de cortar la grasa de curados, y ahumado+miel sobre
  fiambre es una combinación clásica, no repetitiva.
- THE FRESH (Atún + Aioli + Dijon) replica el maridaje clásico francés pan bagnat/tuna
  niçoise (atún+mayo+dijon+limón) — el Aioli ya es el componente graso que equilibra la
  acidez de la Dijon, no falta un tercer elemento.
- THE CHICAGO (giardiniera + au jus) es fiel a la receta pública del Italian Beef de
  Chicago; el queso provolone es una adición no tradicional en la receta real, así que su
  ausencia es una omisión válida de negocio, no un vacío. Dato aparte sin acción requerida:
  en la tradición de Chicago un "combo" agrega salchicha italiana entera, no queso — solo
  relevante si algún día se evalúa una variante "Chicago Combo".

**8.10 RECIPE_RATIONALE.md vs. ingredientes reales — 2 hallazgos de seguridad
alimentaria, requieren confirmación del dueño.** La mayoría del catálogo (proteínas
cocidas, encurtidos, frescos, quesos) está correctamente clasificado en las 4 categorías
de `RECIPE_RATIONALE.md`. Dos puntos reales sí requieren atención:
- **P05 Embutido/Italiano** ("Paté peperoncino, jamón ahumado, cabanossi") se trata hoy
  como un solo SKU en la categoría "dura la semana" (curado industrial) — pero el paté
  específicamente es una preparación cocida untable de alta humedad, sin el curado que
  reduce actividad de agua en jamón/cabanossi (dura 3-5 días una vez abierto, no semanas).
  Jamón y cabanossi sí encajan en esa categoría; el paté dentro de la mezcla es el eslabón
  débil si se le aplica la misma ventana de una semana.
- **S02 Spicy Mayo** es mayonesa confirmada por nombre/descripción ("cremoso") — hoy cae
  en el bucket genérico de salsas de una semana sin el mismo carve-out que ya recibió el
  atún-mayo (refresco 2x/semana). **S01 Aioli** es candidato probable al mismo tratamiento
  (el "aioli" cremoso comercial suele llevar huevo, a diferencia del allioli catalán
  tradicional sin huevo) pero depende de la receta real del negocio, no documentada en el
  código — igual que **S05 SNDWCH Special** (receta no revelada) y, con menor certeza,
  **S10 Peanut Satay** (si lleva leche de coco). Ninguna de estas 4 está confirmada con
  certeza salvo S02; requieren que el dueño confirme la receta real antes de reclasificar.
- El placeholder de RECIPE_RATIONALE.md §3 (razón de negocio para domingo+miércoles como
  días de refresco) sigue vacío — confirmado, sin llenar (decisión del dueño).

*Queda 1 agente de esta misma ronda en investigación (gramaje/porciones) — se agrega aquí
cuando termine.*

## 9. Costo real de permisos y licencias para abrir en Trujillo (agregado 2026-08-05)

Vacío real detectado: la sección 5 (inversión inicial) cubre equipo/insumos/empaque pero
no el costo de operar legalmente. Estimado con cautela — algunos montos son confirmados
para Trujillo, otros son extrapolación nacional peruana marcada explícitamente.

**9.1 Licencia de Funcionamiento (Municipalidad Provincial de Trujillo) — confirmado.**
La Subgerencia de Defensa Civil de la MPT cobra S/247.70 (riesgo alto) o S/457.10 (riesgo
muy alto) — un restaurante con cocina/gas probablemente cae en ese rango, no en el mínimo.
Multa por operar sin licencia: 2 UIT (~S/11,000 en 2026).

**9.2 Carnet sanitario — confirmado a nivel nacional, costo recurrente.** S/10-20 por
persona, **vigente solo 6 meses** (no es un costo único de apertura, se repite cada
semestre) — como mínimo el dueño necesita el suyo al armar los pedidos él mismo.

**9.3 DIGESA/Registro Sanitario — aclaración importante, no aplica como tal.** El Registro
Sanitario de DIGESA es para alimentos envasados/industrializados, NO para restaurantes que
preparan comida fresca para delivery. Lo que sí exige la norma real (R.M. 822-2018/MINSA)
es un **Plan de Higiene y Saneamiento (PHS)** aprobado por certificadora + **certificado de
fumigación/desratización vigente (máx. 3 meses, recurrente trimestral)**. **Sin cifra de
precio confiable encontrada** — es el hueco más real de esta investigación, recomienda
cotizar directo con una certificadora en Trujillo antes de presupuestar (estimado de
mercado sin fuente confirmada: S/300-800 inicial).

**9.4 ITSE/Defensa Civil — posible duplicado con 9.1, sin confirmar.** Ambigüedad real sin
resolver: los montos de riesgo alto/muy alto de la MPT (9.1) podrían ser el mismo trámite
ITSE visto desde otro ángulo, no un costo adicional — solo se resuelve consultando el TUPA
de la MPT o la Gerencia de Desarrollo Económico Local (Av. España 746/792, tel.
932287295).

**9.5 RUC y régimen tributario — decisión estructural, no solo trámite.** RUC en SUNAT es
gratis. Nuevo RUS: cuota fija S/20 o S/50/mes según categoría, tope anual S/96,000, solo
boletas (no facturas). Dado el margen de insumos ya calculado (45%), conviene decidir entre
NRUS/RER (1.5% de ingresos brutos)/MYPE Tributario con un contador local considerando el
margen neto real después de todos los gastos operativos — no solo el % de insumos.

**9.6 Estimado total de puesta en regla (aparte de equipo/insumos/empaque): S/460 –
S/1,530 antes de abrir**, más recurrentes no incluidos en ese rango (carnet sanitario cada
6 meses, fumigación trimestral, cuota tributaria mensual S/20-50 si es NRUS). El rango
depende sobre todo de si Trujillo cobra el ITSE aparte de la licencia (9.4, sin confirmar)
y de cuánto cueste realmente el PHS/fumigación (9.3, sin cifra confirmada).

Fuentes: [tramitoarq-trujillo.org.pe — Licencia de Funcionamiento Trujillo](https://tramitoarq-trujillo.org.pe/como-obtener-tu-licencia-de-funcionamiento-en-trujillo-paso-a-paso/),
[trujilloenlinea.pe — licencias en una hora MPT 2026](https://trujilloenlinea.pe/noticias/locales/06/05/2026/la-municipalidad-de-trujillo-entregara-licencias-de-funcionamiento-en-una-hora),
[infobae — carnet de sanidad](https://www.infobae.com/peru/2026/01/22/conoce-como-tramitar-tu-carne-de-sanidad-en-lima-requisitos-precio-vigencia-y-donde-obtenerlo/),
[panca.pe — normas sanitarias restaurantes Perú/DIGESA](https://www.panca.pe/blog/normas-sanitarias-restaurantes-peru-digesa/),
[noticierocontable.com — Nuevo RUS](https://noticierocontable.com/nuevo-rus/),
[panca.pe — régimen tributario ideal](https://www.panca.pe/blog/regimen-tributario-ideal-para-mi-negocio-en-peru/).

**9.7 Economía real del reparto — CORRECCIÓN 2026-08-05: el hallazgo original estaba mal
planteado, el reparto ya es pass-through al cliente, no un costo del negocio.** ~~El
análisis financiero no modela el costo de reparto, asume S/0~~ — falso: verificado en
`src/app.ts` (`deliveryFeeAmount()`) y `supabase/functions/api/env.ts`
(`DELIVERY_ZONE_FEES = {cerca: 6, media: 8, lejos: 12, muy_lejos: 15}`), el cliente YA paga
el costo de reparto completo, por zona, en cada pedido — el negocio no lo absorbe. Más
aún: cuando el pedido se paga con tarjeta, `deliveryFeeForZoneCard()` en
`actions/orders.ts` ya "engorda" ese monto con la tasa alta de comisión Culqi (5.5%) para
que ni ahí el negocio termine recibiendo menos de lo que le paga al motorizado — un ajuste
que el propio código documenta como corrección de una auditoría financiera previa. El
agente que investigó esto no revisó el código existente antes de reportarlo como vacío —
mismo patrón de falso positivo ya documentado en `CLAUDE.md` (verificar hallazgos de
código contra el repo real antes de "corregir" algo que ya funciona).

**Lo que sigue siendo información real y útil de esta investigación** (no descartar todo):
los rangos de costo real de un motorizado en Trujillo (S/6-10/pedido bajo demanda,
consistente con el S/6-15 ya cobrado por `DELIVERY_ZONE_FEES`) sirven para verificar que
las tarifas actuales por zona no estén desactualizadas frente al costo real de mercado —
y la opción de Uber Direct (sin comisión de marketplace, confirmado disponible en Perú,
tarifa exacta no encontrada) queda como alternativa a cotizar si el dueño alguna vez
necesita tercerizar el reparto en vez de asumirlo él mismo o contratar un motorizado fijo.
El resto del análisis (reparto propio como cuello de botella de capacidad de un operador
único, radio realista ~2-3 km) sigue siendo válido como consideración OPERATIVA (tiempos,
capacidad), solo no aplica como hallazgo FINANCIERO de margen — el costo de mano de obra
de reparto sigue siendo S/0 para el negocio tal como ya asumía el documento, simplemente
porque no es el negocio quien paga.

Fuentes (9.7, contexto de mercado aún útil): [PANCA — comisiones apps de delivery Perú 2026](https://www.panca.pe/blog/comisiones-apps-delivery-peru-comparativa),
[inDrive Delivery Perú](https://indrive.com/es-pe/delivery),
[Uber Direct — merchants.uber.com](https://merchants.uber.com/uber-direct.html).

---

### Cierre de la ronda 3-4 de investigación de menú/financiero (2026-08-05)

Las 8 investigaciones de menú/financiero lanzadas en esta sesión (maridaje SIG03/04/07,
RECIPE_RATIONALE vs. ingredientes, gramaje/porciones — *aún pendiente, no se relanzó en
esta ronda, ver nota abajo*, 4 bebidas, riesgo combinatorio BYO, permisos/licencias,
economía del reparto) están compiladas en §8-9. **Cambios de código/negocio pendientes de
aprobación, ninguno implementado todavía:**
- Ajustar el nombre visible de D07 THE MIDNIGHT//BREW para nombrar "té"/"cold brew de té"
  explícitamente (§8.1).
- 2-3 chips de "sugerido" por proteína en el paso de salsas de BYO (§8.8).
- Confirmar con el dueño la receta real de S01 Aioli/S05 SNDWCH Special/S10 Peanut Satay
  (¿llevan huevo/lácteo?) para decidir si necesitan el mismo refresco 2x/semana que S02
  Spicy Mayo, ya confirmada como mayonesa (§8.10).
- Cotizar el PHS + fumigación con una certificadora real en Trujillo (§9.3, sin cifra
  confirmada) y confirmar con la MPT si el ITSE es un pago aparte de la licencia (§9.4).

*El reparto (§9.7) ya no requiere ningún cambio de costeo — es pass-through al cliente
desde antes de esta ronda de investigación, corregido arriba.*

*Nota: el agente de "gramaje/porciones por Signature" de la ronda original (10 agentes)
no llegó a relanzarse en esta ronda de continuación — sigue pendiente si se retoma esta
línea de investigación más adelante.*

## 10. Análisis profundo de receta/textura/sabor — ronda 5 (agregado 2026-08-07)

20 agentes: 7 proteínas individuales, panes, toppings, quesos, 12 salsas (3 lotes),
textura de los 7 Signatures (4 lotes), coherencia de THE VAULT, idioma en todo el
catálogo, gap vs. competencia, calidad de descripciones, perfil de picor. Todo pendiente
de aprobación — nada implementado en esta sección salvo lo ya marcado como IMPLEMENTADO.

### 10.1 Proteínas — hallazgos por ítem

- **P01 Res//Asado**: técnica correcta (cocción lenta→mechado es el método real de la
  industria para este corte). Único vacío: es la única proteína del catálogo cuya
  descripción no nombra su sazón/especias — el resto sí (Cajún, teriyaki, mayonesa,
  marinara, sazón italiana). Requiere que el dueño confirme qué especias usa realmente
  antes de escribir algo — no inventar.
- **P02 Pollo//Teriyaki**: sin error objetivo. Dos vacíos de información bloquean un
  veredicto firme: (1) no se sabe si el pan se tuesta antes de armar, (2) la receta de S05
  SNDWCH Special es secreta — sin saber si aporta acidez, no se puede confirmar si el
  perfil dulce-sobre-dulce (teriyaki+satay+especial) queda plano. El pepinillo (T02) ya
  aporta algo de corte ácido parcial.
- **P03 Pollo//Cajún (VAULT)**: técnica real confirmada (pechuga cocida en líquido +
  deshilachado + reincorporación de sazón, no sellado en seco). El perfil de picor de
  THE VAULT (4 elementos picantes, sin tomate ni salsa neutra) es plausiblemente
  intencional ("para valientes"), pero sin ninguna válvula de escape — riesgo real de
  quemazón plana en vez de picante complejo hacia el final del sándwich. Decisión de
  concepto: ¿el Vault busca desafío puro o picante disfrutable?
- **P04 Atún//House**: sin error, maridaje con Aioli+Dijon confirmado como intencional
  (replica pan bagnat/tuna niçoise clásico). Dato nuevo de referencia: proporción
  atún:mayo ~1:10 en peso para textura óptima, insumo en aceite (no agua) rinde mejor.
- **P05 Embutido//Italiano**: mezcla paté+jamón+cabanossi es atípica frente al sub
  italiano clásico (que nunca mezcla paté untable con fiambres en lonja) — el único
  precedente real es el bánh mì vietnamita, que compensa con mucha más acidez fresca de
  la que tiene SIG03. THE SMOKE tiene un solo elemento realmente ácido (pepinillo) — le
  falta un ácido más distribuido. S06 Oil & Vinegar (ya en el catálogo, sin usar acá)
  encajaría de nombre y función.
- **P06 Albóndiga//Marinara**: **confirma y agrava** el hallazgo previo (§7.2) — el queso
  opcional NO mitiga el problema porque no está activado por defecto, y el chip
  "Sugerida" que ya implementé en BYO (§8.8) refuerza Oil & Vinegar sobre marinara sin
  agregar el contraste graso que le falta. El pitch de SIG02 no menciona el queso como
  opción. Cocinar directo en la marinara (sin etapa seca) ya es la técnica correcta y
  coincide con cómo `RECIPE_RATIONALE.md` dice que se guarda (con su au jus).
- **P07 Res//Chicago**: técnica, corte y au jus aparte ya están bien resueltos y
  confirmados como decisión correcta para delivery. **Bug real encontrado**: el `pitch`
  de SIG07 en `src/app.ts` todavía dice "res mechada" — la palabra exacta que
  `RECIPE_RATIONALE.md` y el propio comentario de código dicen que NO aplica a P07 (es
  "corte fino laminado"). Sobrevivió a la auditoría que separó P07 de P01. Corrección
  simple: cambiar a "res laminada" o similar en el pitch.

### 10.2 Panes, toppings, quesos

- **Panes (B01/B03)**: confirma con fuente independiente que Focaccia sin tostar es más
  vulnerable a humedad que Classic — refuerza §8.7. Descripciones actuales ("Masa suave
  básica"/"Masa de focaccia artesanal") son las más genéricas de todo el catálogo.
- **Toppings (7)**: **ninguno** tiene descripción (corrijo mi supuesto inicial de que 4 sí
  tenían — 0/7). Ausencia real: ningún vegetal de hoja (lechuga/espinaca) en todo el
  catálogo — desviación notable frente a la convención del formato sub (Subway/Jersey
  Mike's/Firehouse/Potbelly la tienen las 4, gratis, como base). Defendible por 2 razones
  operativas reales: mayor riesgo de inocuidad (categoría de producto más vinculada a
  brotes de Listeria/E.coli por no tener "kill step") y mal comportamiento en 25-40 min de
  delivery (se marchita/suelta agua). Confirmado independientemente por el agente de gap
  analysis: es la única ausencia que un cliente "extrañaría" de verdad (estructural, no
  discrecional como las gaseosas).
- **Quesos (3)**: ninguno tiene descripción. **Pregunta abierta que bloquea varias
  decisiones**: ¿el sándwich se sirve frío o con el queso derretido? El copy de venta
  (`d:'Cheddar derretido, opcional y gratis'` en el flujo de recompensas) asume calor,
  pero `RECIPE_RATIONALE.md` trata el queso como insumo de refrigerador sin mención de
  equipo de calentamiento. Si es frío: Americano (elegido por sus propiedades de fusión)
  queda redundante frente a Cheddar/Edam. Si es caliente: los 3 cubren un rango real. Edam
  es además el "queso amarillo" default reconocido en supermercados peruanos (Laive/Gloria).

### 10.3 Salsas — hallazgos técnicos y de idioma

- **S01-S04**: descripciones son copy de menú, no fichas de receta reproducible
  (subjetivas: "suave", "equilibrado") — normal para un catálogo público, S05 ya modela
  el patrón correcto de no revelar receta interna si se quiere consistencia real. **S01
  Aioli casi con certeza lleva huevo** (inferencia técnica, no declarada en el texto) —
  mismo tratamiento que S02 en `RECIPE_RATIONALE.md`, pendiente de confirmación real.
- **S05, S06, S08, S09**: S05 está bien ejecutada como "salsa secreta de marca" (ancla en
  SIG06, no da pistas) pero le falta el *relato* que sí construyeron Big Mac/In-N-Out
  (jingle, mito, décadas de continuidad) — hoy es solo una línea de copy funcional. S09
  Chimichurri+Piña asada es combinación real y documentada (no un choque inventado).
  **S06/S08 confirmadas como inconsistencia de idioma real** (ver 10.5).
- **S10-S13**: Peanut Satay le falta leche de coco (ingrediente clave de una satay
  auténtica) — hoy describe más una salsa de maní simplificada que una satay real; no es
  bug de idioma, es de receta (evaluación del dueño). S11/S12/S13 técnicamente correctas,
  sin cambios necesarios.

### 10.4 Textura de los 7 Signatures — riesgo de humedad en delivery (25-40 min)

Ranking de riesgo confirmado por 3 agentes independientes cruzando ingredientes reales
contra principios de arquitectura de sándwich (barrera grasa contra el pan, núcleo húmedo
protegido, tostado como defensa):

1. **SIG03 THE SMOKE — el de mayor riesgo**: único con 4 factores húmedos simultáneos
   (focaccia porosa + paté untable + BBQ líquida-azucarada + tomate fresco). Mitigación
   de bajo costo sin tocar receta: tostar la focaccia, tomate al centro nunca contra el
   pan.
2. **SIG02 THE MEATBALL — rival cercano**: albóndigas en marinara líquida, sin barrera de
   queso por defecto (mismo hallazgo que 10.1) — además vapor condensado en empaque
   cerrado ya es suficiente para ablandar pan en la ventana de 25-40 min, sin necesitar
   contacto directo con salsa.
3. **SIG06 THE TERIYAKI**: 3 fuentes de líquido apiladas (proteína pre-salseada + 2 salsas
   + pepinillo), más que cualquier otro Signature — riesgo acumulativo, no catastrófico.
4. **SIG01, SIG04, SIG07**: sin problema real. SIG04 no tiene problema de pan sino de
   relleno — recomienda escurrir bien el atún antes de mezclar con mayo. SIG07 confirma
   que el au jus aparte es la decisión correcta (un "dipped" real desintegraría el pan en
   el trayecto), reforzado por un dato nuevo: B01 no tiene la corteza dura que el roll
   tradicional de Chicago usa como escudo — por lo que servir aparte es aún más necesario
   acá que en un local de Chicago.

### 10.5 Idioma/naming — inventario completo (reemplaza el hallazgo parcial anterior)

**Corrección de escala importante**: no son 3-4 nombres sueltos. De 42 ítems del catálogo,
**11 tienen una inconsistencia real de idioma** (inglés genérico con equivalente español
que además ya se usa en otra parte del mismo archivo — la evidencia más fuerte de
inconsistencia, no solo preferencia de estilo):

| Ítem | Actual | Evidencia de inconsistencia | Propuesta |
|---|---|---|---|
| B01 | Classic // White | "Clásico" ya es el badge de SIG01 | Clásico // Blanco |
| P04 | Atún // House | S05 ya se autodescribe "de la casa" | Atún // Casa |
| S02 | Spicy // Mayo | S12 ya usa "Picante" en la misma lista | Picante // Mayonesa |
| S03 | Smoke // BBQ | El propio `d` de S03 dice "Ahumado"; badge de SIG03 también | Ahumado // BBQ |
| S04 | Honey // Mustard | S11 ya dice "Mostaza // Dijon" en la misma lista | Miel // Mostaza |
| S05 | SNDWCH // Special | Sin razón culinaria para "Special" | SNDWCH // Especial |
| S06 | Oil & Vinegar // Classic | `d` ya dice "estilo italiano" en español | Vinagreta // Italiana |
| S08 | Teriyaki // Glaze | "Glaseado" ya aparece en el pitch de SIG03 | Teriyaki // Glaseado |
| S10 | Peanut // Satay | El propio `d` de S10 ya dice "Maní" | Maní // Satay |
| D06 | The Bloom // Hibiscus | El propio `d` dice "flor de jamaica" | The Bloom // Jamaica |
| D08 | The Cool // Mint | El propio `d` dice "menta fresca" | The Cool // Menta |

Caso de menor confianza: **S01 Aioli//Signature** — "Signature" es también el tag de marca
deliberado de la línea de 7 Signatures (`sigTypeTag`); no está claro si reusarlo en una
salsa es descuido o eco de marca intencional. Si se decide tocar: `Aioli // Especial`.

**Términos culinarios que NO deben tocarse** (préstamos internacionales sin traducción
corta natural, usados así en cualquier carta en español): Teriyaki, Cajún, Marinara,
Satay, Giardiniera, Cheddar, Edam, Focaccia, Au Jus, BBQ, Chai, Chimichurri, Dijon,
Chicago.

**Nota de marca, no de idioma**: los 7 nombres "The X" de Signatures y los 4 "The X" de
bebidas son un device de marca 100% consistente (11/11) — no es el mismo tipo de
inconsistencia, tocarlo sería decisión de identidad, no corrección de copy. Se había
señalado una disonancia puntual: SIG02 se llamaba "The Meatball" en inglés mientras su
propia proteína interna (P06) ya se corrigió a "Albóndiga" — la tarjeta mostraba el mismo
ingrediente en dos idiomas distintos en el mismo lugar. **RESUELTO 2026-08-08** (LLM
Council de naming/sabor, ver §13.1): renombrado a "The Marinara" — préstamo que ya se usa
igual en español e inglés, sin traducción duplicada.

### 10.6 THE VAULT — coherencia interna

Solo 4 de 7 componentes son genuinamente exclusivos (proteína + 2 salsas + 1 topping); la
base (ya asociada a THE SMOKE) y 2 de 3 toppings se repiten en otros Signatures públicos.
No es descalificante (In-N-Out Animal Style tampoco usa ingredientes 100% exclusivos, el
mecanismo real es la técnica de preparación distinta + el misterio del pitch, ambos ya
presentes) pero el margen de "sensación de secreto" es más delgado de lo ideal. El perfil
de picor sí tiene contraste real (dulce vía miel picante, ácido vía jalapeño encurtido) —
no es picor plano — pero depende de esos 2 elementos solamente, sin nada fresco/frío.

### 10.7 Perfil de picor — vacío real en BYO

**BYO no tiene ninguna opción picante para ningún cliente, en ningún rango, nunca** — las
2 únicas salsas `spicy:true` (S02, S12) son ambas `vaultOnly`, y el propio código ya
documenta que sin ese guard el encabezado "Picantes //" quedaría huérfano. La única opción
picante pública (THE CHICAGO) es receta fija, sin descuento de 15CM, y obliga a querer
específicamente res estilo Chicago. Con 65% de consumidores reportando preferencia por
comida picante y crecimiento sostenido de la categoría en menús (Datassential 2025), y el
ají como ingrediente transversal en la cocina peruana, vale la pena evaluar sacar S12
Picante-Miel de `vaultOnly` para dejar al menos 1 salsa con calor moderado disponible en
BYO desde el día 1 — dejando S02+T04+P03 (cajún) como el gancho exclusivo real de VAULT.

### 10.8 Gap vs. competencia (Subway/Jersey Mike's/Firehouse/Potbelly)

Confirma 10.2: **lechuga/vegetal de hoja es la única ausencia que trasciende "la
competencia la tiene"** — es estructural al formato sub (no un extra discrecional), con
costo de agregarla bajo si se decide. Prioridad si se quisiera sumar algo, de menor a
mayor costo operativo: queso más intenso tipo provolone/pepper jack (SKU nueva, sin
cambiar flujo) > proteína vegetariana (nicho real pero ni el líder lo garantiza siempre) >
pan integral/multigrano (mayor carga operativa para un operador único, dejar para después).

### 10.9 Calidad de descripciones — 13 ítems sin descripción o genéricos, con propuesta lista

Inventario completo con propuesta de copy (mismo tono del resto del catálogo, sin inventar
nada no confirmado):

| Ítem | Estado | Propuesta |
|---|---|---|
| B01 | Genérica | Pan blanco clásico, miga suave, sabor neutro y directo |
| B03 | Genérica | Corteza dorada y miga esponjosa — más textura que la clásica |
| S05 | Genérica | Nuestra receta secreta de la casa — no revelamos qué lleva |
| S11 | Floja ("con carácter") | Mostaza dijon intensa y clásica, con un punto picante |
| T01 Tomate | Sin `d` | Tomate fresco en rodajas, jugoso y ácido |
| T02 Pepinillo | Sin `d` | Pepinillo encurtido, crocante y ácido, corte fino |
| T03 Cebolla | Sin `d` | Cebolla morada en juliana fina, dulce y crocante |
| T04 Jalapeño | Sin `d` | Jalapeño encurtido, picante fresco y crocante |
| T05 Aceituna | Sin `d` | Aceituna negra en rodajas, salada e intensa |
| T06 Pimiento | Sin `d` | Pimiento curado, dulce y suave, con textura tierna |
| T07 Giardiniera | Sin `d` | Mezcla de vegetales encurtidos y picantes, al estilo Chicago |
| C01 Americano | Sin `d` | Queso americano, suave y cremoso, se derrite fácil |
| C02 Cheddar | Sin `d` | Queso cheddar, sabor intenso y textura firme |
| C03 Edam | Sin `d`, sin fuente propia confirmada | Pendiente — no hay dato real del perfil de este queso específico en el negocio, confirmar con el dueño antes de escribir |

**Nota técnica**: agregar `d` a los quesos no alcanza por sí solo — el paso de Queso de
BYO (`byoStep===3` en `src/app.ts`) hoy solo pinta `c.l`, ni siquiera el separador `//`
con `c.s` como sí hacen Toppings y el resto — habría que tocar también esa tarjeta.

### Resumen de decisiones pendientes de esta ronda (nada implementado)

**Bug objetivo, bajo riesgo, listo para corregir en cuanto apruebes:**
- Pitch de SIG07 dice "res mechada", debe decir algo como "res laminada" (10.1).

**Preguntas reales que solo el dueño puede responder:**
- ¿El sándwich se sirve frío o con el queso derretido? (10.2 — bloquea varias decisiones)
- ¿Qué especias lleva realmente el asado de P01? (10.1)
- ¿S01 Aioli / S05 SNDWCH Special / S10 Peanut Satay llevan huevo/leche de coco? (10.1, 10.3)
- Receta real de C03 Edam para poder describirlo con el mismo nivel de confianza que C01/C02 (10.9)

**Decisiones de concepto/dirección (no de código):**
- Alcance de la limpieza de idioma: ¿solo los 4 ya discutidos o los 11 de la tabla 10.5?
- ¿Abrir BYO a 1 salsa picante pública (sacar S12 de vaultOnly)? (10.7)
- ¿THE VAULT busca desafío puro o picante disfrutable? ¿vale agregar algo fresco/frío? (10.6)
- ¿Reforzar el pitch de SIG02 para mencionar el queso opcional, dado que el chip
  "Sugerida" de BYO ya reproduce el mismo problema de falta de grasa? (10.1)
- ¿Agregar lechuga/vegetal de hoja pese al riesgo de inocuidad y mal comportamiento en
  delivery? (10.2, 10.8)
- ¿Vale la pena escribir las 13 descripciones propuestas en 10.9?

## 11. Técnica de cocina, naming por sabor y financiero profundo — ronda 6 (agregado 2026-08-07)

20 agentes: batch-prep, producción de salsas, coreografía de armado, QC, empaque por
riesgo; naming de Signatures/proteínas/salsas/badges según sabor real; impacto financiero
de los 4 cambios de §10, elasticidad de precios, combo, gramaje (ambigüedad cerrada),
tarjeta de regalo/Plan Semanal; octógonos, psicología de menú, upsell, variantes
estacionales, fotografía, claridad de menú, consistencia BYO vs. Signatures. Nada
implementado — pendiente de aprobación.

### 11.1 Técnica de cocina — batch-prep, salsas, armado, QC, empaque

**El cuello de botella real de las proteínas es ENFRIAR, no cocinar.** El tiempo de
cocción casi no cambia con el tamaño del lote; lo que sí importa es enfriar de zona de
peligro (5-60°C) rápido: porcionar EN CALIENTE a bolsas planas delgadas (2-3cm) y
sumergir en baño de hielo agitado, no enfriar el lote grande entero. Solo 5 de las 7
proteínas son "cocinar y congelar" real (P01, P02, P03, P06, P07) — P05 es
porcionar/rebanar producto curado comprado, P04 nunca se congela (ciclo dom/mié ya
fijado). P07 (Chicago) necesita 2 sesiones separadas: rostizar/enfriar un día, rebanar
frío al siguiente (laminar en caliente desgarra). Calendario semanal propuesto: lunes P01,
martes P07 (rostizar), miércoles rebanar P07 + refresco de atún, jueves P02+P03, viernes
P06, domingo refresco de atún + revisión de P05.

**Las 12 salsas no son un solo grupo de riesgo al escalar en lote.** 3 emulsiones con
huevo (S01 Aioli, S02 Spicy Mayo, S05 SNDWCH Special probable) son las delicadas —
técnica: batidora de inmersión, huevo pasteurizado para extender vida útil, temperatura
pareja. Vida útil real más corta de lo que trata hoy `RECIPE_RATIONALE.md` §2: 3-5 días
para las emulsiones con huevo (no una semana completa como encurtidos/curados), 1-2
semanas para BBQ/Teriyaki cocidas, 2 semanas-meses para Honey Mustard/Dijon, vida
larguísima para Picante-Miel (la miel casi conserva sola). Calendario propuesto: domingo
lote grande de las cocidas + tanda CHICA de las 3 con huevo, miércoles segunda tanda chica
de las 3 con huevo (mismo día que el refresco de atún ya fijado) — no agrega carga nueva,
reutiliza el ciclo existente.

**Coreografía de armado**: orden físico recomendado pan→proteína→queso→toppings→salsas
(distinto del orden de selección en pantalla del cliente, que no tiene por qué coincidir).
Para pedidos con varios ítems (grupal), la técnica real es "recorrido por lote" — agregar
proteína a TODOS los sándwiches antes de pasar a queso, etc. — reduce de 5×N a solo 5
pasadas totales.

**Control de calidad sin manual formal**: dishers/cucharas de porción por color (uno por
proteína, calibrado una vez), botellas dosificadoras calibradas por salsa ("N apretones =
X gramos"), tarjeta de receta + foto de referencia real por Signature pegada en la
estación (nunca comparar contra la memoria propia, que también deriva). Auto-auditoría por
muestreo: pesar 1 de cada 10 sándwiches contra el objetivo escrito.

**Empaque por riesgo**: la bolsa kraft exterior ya usada alcanza para los 7 Signatures por
igual — el punto débil es qué papel toca el pan directamente. Para los 3 de mayor riesgo
de humedad (SIG02/03/06, identificados en §10.4): cambiar el envoltorio de contacto
directo a papel graso-resistente/encerado (costo marginal bajo, mismo formato de hoja) y
nunca sellar hermético (doblez suelto o un sticker, nunca cinta perimetral) — el vapor
condensado es tan dañino como el contacto directo con salsa.

### 11.2 Naming ligado a sabor real (distinto de la auditoría de idioma de §10.5)

**6 de 7 Signatures están bien resueltos** — el nombre/badge no promete algo que el
producto no entrega. THE CHICAGO es el mejor caso (naming por procedencia real, refuerza
la expectativa correcta). Dos tensiones reales, confirmadas por 3 agentes independientes
desde ángulos distintos (naming sensorial, badges, Signatures):

- **THE FRESH — badge "Ligero" choca con su propia proteína.** Atún con mayonesa + Aioli
  (otra base cremosa) es lo opuesto de "ligero" en boca. Evidencia científica real (no
  solo opinión): un estudio con queso idéntico mostró que la etiqueta "light" por sí sola
  **reduce** la percepción real de sabor — el efecto "health halo" trabaja en contra del
  producto, no a favor. El nombre "Fresh" sí se sostiene parcialmente por los toppings
  crocantes y la Dijon.
- **THE MEATBALL — badge "Premium" contradice su propio pitch.** Es la proteína más
  barata del catálogo (carne molida ~S/10/kg) y el propio pitch se describe a sí mismo
  como "el clásico de toda la vida" — comfort food casero, no algo elevado. "Casero" o
  "Tradicional" encajarían mejor con lo que el producto y su propio copy ya dicen de sí.

**Ninguna proteína ni 6 de 9 salsas de BYO usan una palabra de intensidad de sabor**
(suave/equilibrado/intenso) — el cliente no tiene pista de qué tan fuerte es cada
combinación antes de armarla. **Bug de código confirmado**: el sistema de ícono de ají
para agrupar "Picantes //" en BYO (`src/app.ts`, sección de salsas) es código muerto en la
práctica — las 2 únicas salsas `spicy:true` (S02, S12) son ambas `vaultOnly` desde una
sesión posterior, así que `spicySauces.length` es siempre 0 en BYO y esa sección nunca
se renderiza, aunque el código siga ahí (mismo hallazgo, dos ángulos: confirma también
§10.7).

### 11.3 Financiero profundo

**Los 4 cambios propuestos en §10 son financieramente triviales.** Lechuga cuesta
centavos por sándwich (S/0.08-0.29, no cotización mayorista real todavía) y no mueve el
colchón del 45% en más de 1 punto porcentual; sacar S12 de `vaultOnly` cuesta S/0 (misma
salsa, mismo costo); las 13 descripciones y el fix del pitch SIG07 son solo texto. Las
decisiones reales pendientes en estos 4 son operativas (inocuidad/humedad de lechuga) y
estratégicas (diluir el gancho de fidelidad de THE VAULT), no de presupuesto.

**Ambigüedad de gramaje de salsa — CERRADA.** El propio código ya resuelve esto
internamente: `SALSA EXTRA` (S/2) se define como "una porción doble de una salsa ya
incluida" — es decir, el modelo mental del código ya trata 1 salsa = 1 porción completa.
Un Signature con 2 salsas (SIG01, SIG04, SIG05 VAULT, SIG06 — 4 de 7, no 3 como se
estimaba) son 2 porciones, no una repartida. El costeo actual **subestima** esos 4
Signatures en S/0.27 (15CM) / S/0.53 (30CM), bajando el margen real 1-2.6 puntos
porcentuales — dirección contraria y parcialmente compensada por el hallazgo de toppings.

**Gramaje de toppings — recalibrado con datos reales de Subway (UK, sept-2025).** El flat
actual de 65g/130g coincide casi exacto con el máximo teórico de BYO (las 6 toppings
juntas = 67g) — parece calibrado sobre ese máximo, no sobre los 3 toppings típicos de un
Signature (~43g de promedio real). El costeo actual **sobreestima** el costo de toppings
en los Signatures en S/0.09 (15CM) / S/0.17 (30CM) — compensa parcialmente el error de
salsas de arriba. Neto combinado por Signature con 2 salsas: entre +S/0.07 y +S/0.18 por
unidad. **Ninguna conclusión gruesa del documento cambia** (THE FRESH sigue el peor
margen, COGS bottom-up sigue ~26%, 45% sigue de colchón) — vale la pena aplicar junto con
el ajuste pendiente de embutido a S/48 si se recalcula v4.1, no antes.

**Elasticidad de precios**: el catálogo (S/16-25 por Signature) coincide casi exacto con
sangucherías icónicas de Lima (S/16-25.50) — pero Trujillo corre ~24-25% más barato que
Lima en costo de vida (Expatistan), así que los precios parecen anclados a referencia
limeña sin ese ajuste. THE CHICAGO (S/25 fijo) y THE VAULT son el tramo con más riesgo
real de fricción — no necesariamente mal, ambos son productos premium/exclusivos por
diseño, pero vale validar con datos reales de Trujillo tras el lanzamiento.

**Combo de -S/2: sano, no tocar todavía.** Solo se acerca al límite del 45% en el peor
caso ya conocido (embutido/atún + bebida cara). S/2 está por debajo del rango de industria
(12-18% de descuento vs. el 9-12.5% real de SND//WCH), pero subirlo ahora reabriría el
problema ya resuelto de "bebida gratis fuera de hora valle" con THE MIDNIGHT (la más
barata) — si se ajusta en el futuro con datos reales, mejor un % con tope que un monto
fijo mayor.

**Tarjeta de regalo y Plan Semanal: ambos sanos, sin ajuste necesario.** Tarjeta de
regalo cuesta ~1.1 céntimos por punto canjeado (conservador). Plan Semanal gana
~S/44.78-46.20 netos por activación en términos absolutos — el único "costo" es ~9-10%
de dilución de margen relativo frente a una venta a precio completo, el trade-off esperado
de cualquier instrumento de caja anticipada, no una pérdida real.

**Verificación cruzada BYO vs. Signatures — hallazgo real, requiere tu decisión.** 5 de
7 Signatures cuestan EXACTAMENTE igual que armarlos por BYO en 30CM (SIG01, SIG02, SIG03,
SIG04, SIG06) — y SIG04 THE FRESH está igualado también en 15CM (arrastre del aumento de
precio de P04 en una sesión anterior que no se propagó al Signature). No es
automáticamente un bug — podría ser una decisión válida de "curaduría = comodidad, no
sobreprecio" — pero si la intención original era que un Signature tuviera premio real,
hoy no lo tiene en 5 de 7 casos.

### 11.4 Otros aspectos — regulación, UX, contenido

**Octógonos de la Ley 30021 — NO aplican.** Confirmado con múltiples fuentes legales
independientes y un antecedente real: Indecopi archivó en 2019 un intento de extender la
obligación a comida rápida. La ley regula alimentos procesados/envasados industrialmente,
con exclusión explícita para "preparación culinaria" — exactamente la categoría de
SND//WCH. Sin obligación de advertencias en menú ni empaque.

**Bug de código real y verificado — descripciones no llegan a la vista previa de
Signature.** La función `fn()` que arma el desglose de ingredientes en
`sigPreviewOverlayHTML()`/`sOItemConfirm()` descarta el campo `d` (descripción). Para
THE CHICAGO esto importa: Giardiniera y Au Jus son `sigOnly` (nunca aparecen en BYO, el
único lugar donde `d` sí se muestra) — un cliente nuevo no tiene ningún punto de la
interfaz donde vea qué son esos ingredientes antes de pedir. Fix simple: mostrar `item.d`
también en esas dos pantallas.

**Psicología de orden del menú**: el orden actual de los 7 Signatures es histórico (orden
de cuándo se agregaron), no diseñado por conversión — pero por suerte no hace daño (el
peor margen, THE FRESH, cae en la posición 4, la zona "muerta" del medio según el efecto
de posición serial). 6 públicos + 1 oculto coincide con el punto óptimo documentado en la
literatura de "choice overload" (Iyengar & Lepper). Hipótesis de bajo riesgo si se quiere
optimizar: subir THE CHICAGO (mejor margen público) a 2da posición — validar con datos
reales, no implementar a ciegas.

**Upsell de bebida — el único mecanismo sin botón de un tap.** A diferencia de "sube a
30CM" y los chips de salsa sugerida (ambos clicables), el aviso de "agrega una bebida y
ahorra S/2" es solo texto sin CTA, y no aparece en el flujo normal de compra (solo en pago
directo de un solo ítem). Propuesta: tarjeta con imagen+nombre+botón "+Agregar" en el
mismo punto donde ya funcionan los otros upsells.

**Variante estacional — propuesta concreta y honesta.** S08 (Teriyaki Glaze) y S09
(Chimichurri Piña Asada) son las únicas 2 salsas del catálogo sin ninguna receta fija
detrás. Propuesta: Focaccia + Res Asado (misma proteína de SIG01, cero fricción de
producción) + Cebolla + Pimiento + S09 sola, con fecha real de expiración en código (mismo
patrón `newUntil` que ya usa SIG06) ligada al mes de apertura — nunca un badge de escasez
sin mecanismo real detrás, coherente con por qué se retiró "EDICIÓN LIMITADA" antes.
Lanzar solo 1 variante, no 2 (menor carga operativa).

**Dirección de fotografía** (para cuando se consiga fotografía real, vía Adobe Stock
licenciada — no generación IA, no disponible en este plan): corte transversal como toma
por defecto para 6 de 7 Signatures. THE CHICAGO necesita el vasito de Au Jus en cuadro
(es literalmente lo que define el nombre del producto). THE VAULT debe fotografiarse
deliberadamente más oscuro/ambiguo — el objetivo ahí no es máxima claridad de
ingredientes, es preservar el misterio del menú secreto.

### Resumen de decisiones pendientes de esta ronda

**Resueltas e IMPLEMENTADAS 2026-08-07** (respuesta del dueño a las 4 decisiones + fix del
bug):
- Bug de `fn()`/`item.d` en la vista previa de Signature — corregido en
  `sigPreviewOverlayHTML()` (`src/app.ts`), muestra descripción cuando existe.
- Badge "Premium" (THE MEATBALL) → **"Italiano"** — explícitamente NO "Casero"/
  "Tradicional"/homemade (decisión del dueño: la marca se posiciona como compañía
  consolidada, no como negocio local).
- Badge "Ligero" (THE FRESH) → **"Cítrico"** (referencia honesta al toque de limón del
  aioli, ya nombrado en el pitch).
- Bug adicional encontrado al implementar: el pitch de SIG07 seguía diciendo "res
  mechada" — corregido a "res laminada" (ya identificado en §10.1, quedó pendiente,
  corregido junto con lo demás).
- Palabra de intensidad de sabor en proteínas/salsas de BYO y el sistema de ícono
  picante — **aprobado, pendiente de implementar** (siguiente ronda de código).
- 5 Signatures igualados en precio a BYO — **confirmado intencional por el dueño**: la
  curaduría es un extra para motivar el consumo, no un mecanismo de sobreprecio. Sin
  cambio necesario.
- **Variante estacional lanzada**: THE EMBER (SIG08) — Focaccia + Res Asado (P01) +
  Cebolla + Pimiento + Chimichurri Piña Asada (S09), S/14/22, badge "Edición de
  Apertura", disponible hasta el 2026-10-07. Expira de verdad (no solo el badge): ver
  `sigAvailable()` en `src/app.ts` y `SIG_AVAILABILITY`/`sigAvailabilityError()` en
  `catalog.ts` — el servidor rechaza el pedido aunque alguien arme el request a mano
  después de la fecha, no solo se oculta en la UI.

**Aún pendiente (no resuelto en esta ronda):**
- ¿Reordenar THE CHICAGO a 2da posición? (esperar datos reales, no urgente) (11.4)

**Listo para implementar sin más discusión (validado financiera y técnicamente):**
- Recalibrar gramaje de salsa (1 salsa = 1 porción completa) y de toppings (según datos
  reales de Subway) en el próximo recálculo de v4.1, junto con el ajuste de embutido a
  S/48 ya pendiente.
- Tarjeta con botón de un tap para el upsell de bebida (11.4).

## 12. Curaduría de chef + auditoría técnica completa — ronda 7 (agregado 2026-08-07)

Segunda tanda de esta sesión: 10 agentes de curaduría de chef (sabor/venta) + 20 agentes de
auditoría técnica (requisitos no funcionales pedidos explícitamente por el dueño:
seguridad, infraestructura, pagos, observabilidad, legal, costos). No todos los 30
terminaron — ver "Pendiente" al final. Dos hallazgos de seguridad (uno crítico) se
corrigieron directo en código, no solo se documentan aquí.

### 12.1 Curaduría de chef

- **Queso ausente en 6 de 7 Signatures públicos — RESUELTO 2026-08-08 para THE SMOKE y
  THE MARINARA (antes THE MEATBALL) tras el LLM Council de menú completo** (ver §13.2):
  investigación real de comparables exitosos confirmó que el queso derretido es
  estructural en esas dos categorías de sándwich, no un extra opcional. THE MARINARA pasa
  de `cheeseOptional:true` (gratis, a elección) a `fixedCheese:'C01'` (Mozzarella, fijo,
  sin costo extra al cliente). THE SMOKE pasa de sin queso a `fixedCheese:'C02'`
  (Cheddar, fijo). Sin cambio de precio (costo real calculado ~S/0.39-0.77/unidad,
  confirmado por el dueño que no amerita subirlo). THE ORIGINAL (roast-beef/cheesesteak)
  queda sin queso — no fue parte de esta decisión, el hallazgo del council se limitó a
  THE MARINARA/THE SMOKE, los dos con comparable exitoso confirmado.
- **Construcción física para el momento de abrir el pedido en casa** (distinto de humedad
  §10.4/11.1 y de foto de marketing §11.4): dos riesgos nuevos de **forma** del relleno,
  no de humedad — THE MEATBALL (las albóndigas sueltas ruedan dentro del empaque durante
  el trayecto, se amontonan en una punta) y THE FRESH (mezcla de atún tipo pasta se
  aplasta bajo el peso de encima, sin cuerpo propio). Recomendaciones de técnica de
  armado/corte, sin costo de insumo: extender relleno hasta el borde del pan (no
  concentrar al centro), abanicar proteínas en fetas/laminadas de punta a punta, formar un
  lomo/cresta en proteínas deshilachadas, y — el cambio de mayor impacto en el "reveal" —
  envolver apretado primero y cortar en diagonal a través del papel ya envuelto, nunca
  servir entero ni cortar suelto antes de envolver.
- **Riesgo combinatorio en Build Your Own**: el tope de 3 salsas ya existe en código
  (`sL>=3`, contrario a lo que asumía el enunciado de la tarea) y es correcto según la
  ciencia de fatiga del paladar — no tocar. Combinaciones de riesgo real identificadas
  (proteína+salsa que ningún Signature endosa): Pollo Teriyaki + Teriyaki Glaze (dulce
  sobre dulce, sin ácido), Atún House + Smoke BBQ (salsa pesada enmascara proteína
  delicada), Albóndiga Marinara + Oil&Vinegar+Dijon (triple ácido sin grasa que equilibre).
  Propuesta de bajo costo: 2-3 chips de "sugerido" (no bloqueantes) por proteína en el paso
  de salsas, anclados a los pairings que ya usan los propios Signatures.
- **Ranking de venta esperada** (margen real combinado con atractivo de venta): THE
  CHICAGO en el tope, THE FRESH en el último lugar — coincide con el hallazgo ya
  documentado en §11.2/11.4 sobre THE FRESH necesitando o bien atún con cotización real
  (mismo patrón que el embutido) o reposicionamiento de marketing lejos del eje
  salud/ligereza que generó el problema original de "Ligero" (ya corregido a "Cítrico").

### 12.2 Auditoría técnica — hallazgos por severidad

**CRÍTICO — corregido en esta sesión.** XSS almacenado en el dashboard admin
(`waRiskContact`, panel "Clientes en riesgo de fuga"): `name`/`phone` de un cliente
(texto libre, sin restricción de charset en el registro) se interpolaban directo dentro
de un atributo `onclick` inline. `esc()` protege contexto de atributo HTML pero no
contexto de string JS dentro de un handler inline — un cliente podía registrarse con un
`name` que rompiera el string JS y ejecutara código arbitrario en la sesión del admin
que abre el dashboard, robando el token de `localStorage` (mismo origen que sirve cliente
y admin). **Corregido**: `waRiskContact` ahora recibe solo el índice numérico dentro del
array ya en memoria (mismo patrón ya usado por `waAdmin(ordId)` en otra parte del
archivo) — nunca se vuelve a interpolar texto libre del cliente en un atributo `onclick`.
Ver `src/app.ts` (`waRiskContact`, línea ~4672, y el `map` que la llama en el dashboard).

**MEDIO — corregido en esta sesión.** Filtros `in.(...)` de PostgREST construidos
concatenando `phone` sin escapar comillas/backslash, en 4 crons de marketing/retención
(`actRemindUnclaimedChallenge`, `actRemindSecondOrder`, `actRemindHighRankWinback` en
`customer.ts`; el cálculo de conversión de campañas en `admin.ts`). Como el registro no
restringe el charset del teléfono, un valor con comillas internas podía romper fuera del
literal de PostgREST y alterar el filtro. **Corregido**: se escapan `\` y `"` antes de
interpolar en los 4 sitios — no requiere cambiar la validación de registro.

**ALTO — reportado, no corregido (decisión de producto, no bug puntual).** Recuperación
de PIN por DNI+fecha de nacimiento sin correo registrado devuelve el PIN nuevo en texto
plano en la misma respuesta JSON (`auth.ts` `actRecover`) — toma de cuenta completa en una
sola petición no autenticada si el atacante ya conoce ambos datos (realista: ex-pareja,
familiar, compañero de trabajo — NIST 800-63B desaconseja KBA como único factor de
recuperación). Mitigado parcialmente por el lockout de 5 intentos/15 min, pero eso protege
contra fuerza bruta ciega, no contra alguien que ya sabe los dos datos del objetivo
específico. Recomendación: exigir un canal secundario (SMS/WhatsApp OTP, el negocio ya usa
mucho WhatsApp) antes de completar el reset sin correo — requiere decisión del dueño antes
de implementar, no es un fix mecánico.

**Autenticación/sesiones — resto de hallazgos (severidad media/baja), no urgentes:**
PIN hasheado con bcrypt real (`pgcrypto`, correcto) pero `gen_salt('bf')` sin cost factor
explícito usa el default (6), bajo para el estándar actual — mitigado porque el PIN es de
4 dígitos y la defensa real es el lockout, no el costo del hash. No existe "cerrar sesión"
de un solo dispositivo (solo `logout-everywhere`), y el TTL de sesión es 30 días sin
rotación — si un token se filtra, la ventana de exposición puede llegar a 30 días
completos porque un logout normal no lo revoca en servidor. `actRegister` no tiene
rate-limit (a diferencia de login/recover) y sus mensajes de error permiten enumerar qué
teléfonos/DNIs ya están registrados. Google Sign-In sí valida server-side correctamente
(nunca crea cuenta sin pasar por registro), pero usa el endpoint `tokeninfo` de Google,
que el propio Google desaconseja para producción por riesgo de *throttling* — no es un
hueco de seguridad, es una dependencia de red frágil en el camino crítico de login.

**Secretos/credenciales/cifrado**: todas las claves privadas (Culqi secret, session
secret, VAPID private, Resend, Meta) vienen de env vars, nunca hardcodeadas, y nunca
llegan al cliente — confirmado con grep en todo el repo. El secreto de los crons vive en
Supabase Vault, no en `cron.job` ni en código. PIN con hash bcrypt correcto, nunca
comparado en texto plano. **Hallazgo real, sin corregir**: `customers.dni` y
`customers.birthday` viven en texto plano en la base de datos, sin cifrado a nivel de
aplicación (más allá del cifrado de disco de infraestructura) — dato sensible en Perú,
usado además como parte del mecanismo de recuperación de cuenta. RLS confirmado
correctamente denegando por defecto en `customers`/`orders`/etc. (RLS activo, cero
políticas) — la anon key pública del cliente solo puede leer `inventory` (única política
RLS que existe), así que la falta de cifrado de columna no es explotable vía la API
pública hoy, pero sigue siendo un gap real si alguna vez hay una fuga de la base completa.

**Pagos (Culqi) — sólido, con más capas de idempotencia de las que el enunciado de la
tarea asumía.** No hay webhook de Culqi en absoluto (confirmado por grep) — el diseño
evita ese vector completo con verificación síncrona (`verifyCulqiCharge` reconsulta
Culqi directo) + polling activo cada 3 min (`actExpirePendingCharges`/`actExpirePendingWeeklyPlans`,
liberan reservas huérfanas) + conciliación horaria real (`actReconcileCulqiCharges`,
cron confirmado en `cron.job`, detecta cargos reales sin pedido asociado y alerta al
admin por push — nunca crea el pedido solo, es detección+alerta). Reembolso es 100%
manual por diseño explícito en el código (siempre termina en notificación push al dueño
para que lo haga a mano en el dashboard de Culqi) — no hay riesgo de doble-reembolso
automatizado porque simplemente no existe reembolso automatizado. Bugs previos ya
corregidos y verificados contra el código actual (no solo contra el comentario): orden de
validación cobro/inventario, reutilización de un `chargeId` legítimo contra una `ref`
ajena, bloqueo de reserva concurrente saltado por invitados.

**Observabilidad — gap real, sin costo para resolver.** Si `api` empieza a fallar hoy
(ej. 500 en checkout), el dueño NO se entera de forma automática — no hay alertas en
tiempo real, `debug_logs` es un basurero de solo-escritura (nada lo consulta ni agrega,
solo se purga a los 30 días) y el dashboard de negocio no tiene ninguna métrica técnica
(tasa de error, latencia). El único modo real de enterarse hoy sería que un cliente se
queje. Recomendación de costo cero: agregar un cron más siguiendo el mismo patrón ya
probado en producción (`alert-stuck-orders`: cron + `sendPushToAdmins` vía Web
Push/VAPID, ya gratis en el plan actual) que consulte `debug_logs` por `stage:'exception'`
y avise al admin si cruza un umbral bajo — no requiere Sentry/Datadog ni ningún tier pago.

**Caché/colas/tareas en segundo plano.** No hay caché de catálogo/precios (decisión
deliberada y documentada en el propio código — aceptable a esta escala, aunque agrega 2
round-trips extra en el hot path de checkout). No hay ninguna cola real (`pgmq` o
similar) para email/push — todo corre síncrono dentro del request, con `try/catch` local
que nunca bloquea la respuesta principal si falla. La idempotencia ante una caída a medias
se logra con un patrón artesanal (flags puestos post-éxito + rate-limit atómico +
claim/release), sólido para los crons frecuentes (3-30 min, por descarte natural de
filtro) pero más débil para los diarios/semanales (sin reintento hasta la próxima
corrida). Bug de documentación encontrado (no de comportamiento): el comentario en
`social.ts` sobre `actAutoPublishCalendar` afirma que un fallo queda registrado en
`debug_logs` vía el catch de nivel superior — el catch real es local y nunca re-lanza, así
que una entrada de calendario que falle repetido en Meta reintenta cada 15 min
indefinidamente sin dejar ningún rastro persistido.

**Infraestructura cloud — Supabase confirmado, Vercel NO se pudo confirmar.** Supabase:
proyecto `rjosezuoyngiadunfzyn`, plan Free, región us-east-2, `ACTIVE_HEALTHY`. Vercel: el
MCP conectado a esta sesión no devuelve ningún team accesible (`list_teams` → `{"teams":
[]}`), y todas las demás tools de Vercel exigen `teamId` — no se pudo confirmar dominio
propio, SSL, ni protección de despliegue. El conector en sí funciona (otra tool sin
dependencia de team respondió bien), así que el problema es de autorización/alcance, no
un fallo genérico — requiere que el dueño reconecte/autorice el conector de Vercel con la
cuenta/equipo real, o indique el `teamId` manualmente.

**Costos de infraestructura — hoy $0/mes** (Supabase Free confirmado por herramienta;
Vercel probablemente Hobby, no confirmado — ver arriba; Resend probablemente Free por
volumen de prueba). **Hallazgo importante no ligado a volumen**: los Términos de Servicio
de Vercel prohíben uso comercial en el plan Hobby por contrato (no solo por límite
técnico) — cualquier sitio que cobre pagos requiere Pro ($20/mes). El trigger real para
subir de plan en Vercel es la fecha de apertura (7 de septiembre de 2026), no el tráfico.
Señal de volumen para Supabase Pro ($25/mes): egress (5GB/mes incluidos en Free) con
tráfico diario sostenido — más urgente que el tamaño de DB (109MB de 500MB hoy, con solo
data de prueba). Riesgo operativo aparte de volumen: un proyecto Supabase Free se pausa
automáticamente tras 1 semana de inactividad — relevante ahora, antes de abrir, si hay
tramos sin actividad de prueba. Señal de volumen para Resend Pro ($20/mes, 50k emails):
con ~3 emails/pedido (confirmación + recordatorios) entre 1,000 pedidos/mes ya supera el
límite Free de 3,000/mes.

**Privacidad/Ley N° 29733 (Perú)**: inscripción en el RNPDP (Registro Nacional de
Protección de Datos Personales) es obligatoria sin excepción por tamaño de negocio, y
desde el reglamento 2025 es gratuita y 100% en línea (SIPDP). Oficial de Protección de
Datos NO es urgente (escalonado por ingresos anuales en UIT; el negocio probablemente no
alcanza ni el umbral de "pequeña empresa", y aun así el plazo más cercano es noviembre
2027). La Política de Privacidad ya existe (`sPLegal()` en `src/app.ts`) y en su momento
el propio código la marcaba como borrador pendiente de revisión legal — le faltaban plazo
de conservación explícito, base legal del tratamiento, mención de transferencia a
proveedores externos (Culqi/Resend) y enumeración explícita de derechos ARCO-PD
(ampliados en el reglamento 2025 con Portabilidad y Desindexación). El flujo de borrar
cuenta SÍ es consistente con el derecho de Cancelación (anonimiza en vez de borrar donde
hay interés legítimo de conservar cifras agregadas del negocio, patrón que la ley
permite). **Actualización 2026-08-07**: el dueño confirmó que la inscripción en el RNPDP
y la actualización del texto de la Política de Privacidad ya están resueltas (gestión
real fuera de este repo — no verificado con herramienta, es un trámite/revisión legal del
dueño, no algo que el código pueda confirmar por sí solo).

### 12.3 Los 5 audits relanzados (rendimiento, modelo de datos, autorización, escalabilidad, API)

Relanzados y completados: los 5 que no llegaron a ejecutarse por límite de concurrencia sí
corrieron esta vez.

**Rendimiento del frontend — sin problemas graves.** `render()` reconstruye todo el árbol
vía `innerHTML=` en cada cambio de estado (255 sitios lo llaman), pero los puntos donde
ese patrón sí duele ya están resueltos: inputs de formulario son "no controlados" (no
disparan `render()` por tecla), overlays/toasts viven en un contenedor separado, el
polling de la cola admin compara una firma antes de re-renderizar, y todas las listas
server-side están topadas (30 pedidos activos, 20-50 en historiales). `index.html`: 623 KB
sin comprimir / 161 KB gzip — aceptable en 4G, algo pesado en 3G rural. Único ajuste con
buena relación costo/beneficio, no aplicado: minificar el JS compilado como paso extra
después de `tsc` (sin tocar la legibilidad de `src/app.ts` en el repo).

**Modelo de datos — bien diseñado, con un hallazgo real ALTO ya corregido.**
`customers.dni` no tenía restricción `UNIQUE` (aunque sí un índice normal) — dos registros
concurrentes con el mismo DNI podían insertarse ambos con éxito, mismo patrón que
`google_id` ya tenía bien resuelto. **Corregido**: se confirmó que no había duplicados
existentes y se aplicó `ALTER TABLE customers ADD CONSTRAINT customers_dni_key UNIQUE
(dni)` directo en Supabase. El resto del schema está sólido: FKs reales en las relaciones
que importan, tipos monetarios `numeric` (nunca `float`) en todos los campos de dinero,
índices parciales inteligentes ya alineados con los patrones de query reales. Hallazgos
menores sin corregir (no urgentes): `ratings.order_ref`/`promo_code_redemptions.order_ref`
son solo convención de texto sin FK real a `orders.ref`; columnas vestigiales
(`orders.mode/product_key/size/build`, ya no leídas por ningún handler) siguen en el
schema y se siguen trayendo en algunos `select=` de admin.

**Autorización admin vs. cliente — sin hallazgos graves.** Se recorrieron las 104 acciones
reales de `ACTIONS`: cada una que toca un recurso de cliente filtra por
`customer_phone=eq.session.phone` (nunca confía en un ID del body sin cruzar contra la
sesión), el claim `isAdmin` del token sigue sin usarse para autorizar en ninguna de las 39
acciones `admin-*` (`requireAdmin` siempre re-consulta `admin_accounts` en vivo), y el
código de pedido grupal solo autoriza leer/agregar — cerrar o cancelar exige sesión +
`organizer_phone===s.phone` explícito. Único punto de riesgo bajo, no nuevo: `submit-rating`
solo se protege por `ref` no adivinable, mismo patrón ya aceptado para invitados en el
resto del sistema.

**Escalabilidad con más volumen — inventario sólido, crons con hallazgo real ya
corregido.** `reserve_inventory` (RPC) usa `SELECT ... FOR UPDATE` en una sola transacción
— dos clientes peleando por la última unidad no pueden ambos "ganar", el segundo rechaza
limpio. **Corregido**: el orden de `codes` que se pasa a esa RPC ahora se ordena
determinísticamente (`.sort()`) antes de bloquear filas, en `actPrepareOrder` y
`actPlaceOrder` — sin esto, dos pedidos concurrentes que comparten 2+ ingredientes en
orden distinto podían en teoría deadlockear entre sí (Postgres lo detecta y aborta una
transacción sin corromper datos, pero es un error evitable). **Corregido también**:
varios crons de marketing/retención (`birthday-bonus`, `winback-campaign`,
`actRemindSecondOrder`, `actRemindHighRankWinback`, `actRemindUnclaimedChallenge`,
`actRemindPeakHour`) hacían `sbGet` sin `limit` explícito — PostgREST trunca en silencio a
1000 filas por defecto. El caso más serio era `winback-campaign`: con suficiente volumen
(~300+ pedidos/día), los 2000 pedidos más recientes del negocio dejaban de cubrir 30 días
completos, y un cliente que SÍ pidió recientemente podía caer al fallback de fecha de
registro y recibir el correo de "te extrañamos" por error. Se reescribió esa query para
filtrar por fecha (solo importa si el cliente pidió dentro de la ventana de inactividad,
no cuántas filas trajo la consulta) en vez de por cantidad fija de filas — resuelve la
corrección sin importar el volumen futuro. Los demás crons recibieron un `limit=20000`
explícito como cap de seguridad (mismo criterio que ya usaba `actAnniversaryGreeting`).
Confirmado sin problema real: `loadCatalogPrices` sin caché (ya documentado) no es cuello
de botella a esta escala; edge functions de Supabase no tienen límite duro de concurrencia
relevante aquí (solo cuota mensual y CPU/wall-time por invocación, lejos de tocarse).
Observación de arquitectura, no bug: el modelo de datos no tiene ningún concepto de
sucursal/`store_id` — coherente con un solo local hoy, sería un rediseño estructural real
si el dueño abriera un segundo local en el futuro.

**Diseño de la API — razonable para el tamaño del proyecto, sin hallazgos ALTO/CRÍTICO.**
El patrón "un entrypoint + tabla de acciones" (en vez de REST) es una decisión defendible
para un solo dev con ~90 operaciones de negocio heterogéneas — se pierde cacheable-por-URL
y herramientas REST estándar, se gana un solo punto para razonar sobre CORS/auth/logging y
cero fricción para agregar acciones nuevas muy específicas del dominio (tarjeta de regalo,
Plan Semanal, pedido grupal). No migrar sin una razón de negocio concreta (ej. un tercer
consumidor externo). Hallazgos menores, todos de pulido: 4 convenciones distintas de
"flag de éxito" (`success`/`valid`/`ok`/ninguno) conviviendo sin documentarse — sin
impacto real hoy porque el cliente decide éxito/error solo por status HTTP, nunca lee esos
campos; nomenclatura de acciones mezclando verbo-antes/verbo-después dentro del mismo
namespace `admin-`; sin versionado de contrato cliente-servidor (mitigado por CI que
despliega backend y frontend juntos, y un service worker network-first); validación de
campos requeridos duplicada ad-hoc en ~11 lugares sin un helper compartido.

### 12.4 Resumen de lo corregido en código esta ronda (2026-08-07)

- XSS crítico en dashboard admin (`waRiskContact`) — commit `dc54c8a`.
- Filtros PostgREST `in.()` sin escapar en 4 crons — commit `dc54c8a`.
- `customers.dni` sin `UNIQUE` (condición de carrera de registro) — migración aplicada
  directo en Supabase, sin duplicados previos confirmados antes de aplicar.
- Orden no determinístico de bloqueo en `reserve_inventory` (riesgo teórico de deadlock)
  — `.sort()` en `actPrepareOrder`/`actPlaceOrder`.
- 6 crons sin `limit` explícito (PostgREST trunca en silencio a 1000 filas) —
  `birthday-bonus`, `winback-campaign` (+ fix real de lógica: filtrar por fecha, no por
  cantidad de filas), `actRemindSecondOrder`, `actRemindHighRankWinback`,
  `actRemindUnclaimedChallenge`, `actRemindPeakHour`.

Verificado con `npm run typecheck && npm run build && npm test` (32/32) antes de cada
commit.

**Actualización 2026-08-07 (mismo día, después de compilar lo de arriba)**: el dueño
confirmó que los temas legales de §12.2 (inscripción en el RNPDP, actualización del texto
de Política de Privacidad) **ya están resueltos** — hechos fuera de esta sesión, no
verificados aquí con herramienta (son trámites/acciones reales del dueño, no algo que este
proyecto pueda confirmar por sí mismo). El OTP de recuperación por WhatsApp (§12.2, H1/H2)
se investigó (costo real, requisitos de Meta Cloud API, ver `CLAUDE.md`) pero el dueño
decidió explícitamente **esperar a tener volumen real del negocio** antes de
implementarlo — no es un hallazgo abandonado, es una decisión de priorización tomada con
la información completa sobre la mesa.

Quedan como decisiones pendientes del dueño (no bugs mecánicos): las mejoras de pulido de
bajo impacto listadas en 12.3 (minificación de JS, FK reales en `ratings`/
`promo_code_redemptions`, limpieza de columnas vestigiales, convención única de "flag de
éxito").

## 13. LLM Council sobre rentabilidad + decisiones del dueño (2026-08-08)

Se corrió la skill `llm-council` (5 asesores independientes + revisión anónima entre
pares + síntesis) sobre "cómo hacer más rentable el negocio con el menor dinero posible,
con exactitud". Veredicto completo en `council-report-2026-08-08.html` /
`council-transcript-2026-08-08.md` (entregados al dueño, no versionados en este repo).
Resumen de lo accionado:

**Precio de curaduría — IMPLEMENTADO.** Hallazgo confirmado por el consejo: `itemUnitPrice()`
(cliente) y `priceByoBuild` (servidor) cobran BUILD YOUR OWN directo al precio de la
proteína (`PROT_PRICE[prot].p15/p30`), sin sumar nada por curaduría — 5 Signatures
(SIG01/02/03/04/06) tenían premio S/0 exacto frente a armarlos por BYO en 30CM (SIG04
también en 15CM), reflejo de un criterio de diseño explícito documentado en comentarios
previos del código ("mantiene el criterio de premio S/0 a 30CM"). El dueño confirmó
2026-08-08 que la curaduría sí puede llevar algo de precio — se revierte ese criterio con
**+S/2 en cada punto exacto de paridad** (nunca donde ya había premio):
SIG01 p30 22→24, SIG02 p30 24→26, SIG03 p30 30→32, SIG04 p15 16→18 y p30 30→32, SIG06
p30 21→23. Aplicado en `src/app.ts` (`SIGS`) y `supabase/functions/api/catalog.ts`
(`SIG_DATA`), verificado con `npm run typecheck && npm run build && npm test` (32/32).

**Proveedor real de atún — investigado, sin cotizar todavía.** No hay proveedor mayorista
confirmado por caja/kg específico para Trujillo (el ~S/67/kg de Tottus sigue siendo
retail, no mayorista). Vías reales identificadas para que el dueño cotice él mismo:
- **MAKRO Trujillo** (Av. Industrial cruce Av. Federico Villareal, El Bosque — tel. tienda
  (044) 458-020) — la opción más directa: supermayorista HORECA con tienda física ya
  operando en la ciudad, alta probabilidad de tener atún en lata en caja a precio
  mayorista.
- **San Jorge** — ya cotizado por catálogo web (~S/53.31/kg, caja x48, §6.1), y tiene
  tienda física en Trujillo (Av. Teodoro Valcárcel 950, Santa Leonor) — vale confirmar
  presencialmente si venden ahí al por mayor a precio distinto del online.
- **Mercado Zonal Palermo** (Jr. Sinchi Roca s/n, km 0) — mismo mercado ya usado como
  canal físico para embutido; no hay puesto de atún confirmado públicamente, hay que
  recorrerlo en persona como se hizo con el embutido.
- Respaldo escrito: Atunruna Perú (+51 995 157 674) y Conservas.pe
  (ventas@conservas.pe) — ninguno confirma despacho a Trujillo todavía, preguntar
  explícitamente.
Ningún precio se cambió en el catálogo todavía — el estimado de S/67/kg se mantiene hasta
tener una cotización real de alguna de estas vías.

**Trámites legales/sanitarios — confirmados resueltos por el dueño** (mismo estado que
§12.2/§12.4, sin cambio).

### 13.1 Segundo council — sabores del menú vs. nombres reales (2026-08-08) — IMPLEMENTADO

Tercera sesión de la skill `llm-council` esta misma fecha, sobre si el trabajo de "el
nombre coincide con el sabor real" (badges Premium→Italiano, Ligero→Cítrico, ya aplicados
antes de este council) quedaba genuinamente cerrado. Veredicto completo en
`council-report-2026-08-08-menu-naming.html` / `council-transcript-2026-08-08-menu-naming.md`
(entregados al dueño, no versionados en este repo). Convergencia de 5/5 asesores y 5/5
rondas de revisión por pares: **no estaba cerrado** — el badge de SIG04 se había corregido
pero el nombre del producto y el pitch quedaron intactos, "Ligero" seguía escrito
literalmente en el pitch, prometiendo algo que la receta real (dos bases cremosas:
mayonesa de P04 + Aioli) no entregaba. Segunda tensión, de menor peso: SIG02 "The
Meatball" (inglés) repetía en la misma tarjeta el mismo ingrediente que su propia proteína
interna ya mostraba en español ("Albóndiga").

**Decisiones del dueño, ambas IMPLEMENTADAS:**

- **SIG04 "The Fresh"** — el dueño eligió arreglar la *receta*, no renombrar el producto
  (evita el costo en cascada de un rename que el propio consejo señaló como blind spot:
  SKU en favoritos/"avísame cuando vuelva"/puntos, contenido de marketing). Se quita el
  Aioli (S01, duplicaba la mayonesa que P04 ya trae) y se agrega un chorrito de limón real
  — el badge CÍTRICO ahora se sostiene con un ingrediente directo en vez de heredarlo del
  Aioli retirado. Mantiene la mostaza Dijon (S11). Pitch reescrito quitando "Ligero" del
  cuerpo del texto. **El limón es un ingrediente de preparación, no una salsa** — primer
  intento de implementación lo modeló como salsa nueva (S14, `sigOnly`) sin preguntar,
  corregido 2026-08-08 tras el usuario aclarar que nunca pidió eso; el limón vive solo
  como texto en el pitch, sin entidad propia en el catálogo. Aplicado en `src/app.ts`
  (`SIGS.SIG04`) y `supabase/functions/api/catalog.ts` (`SIG_DATA.SIG04`).
- **SIG02 "The Meatball" → "The Marinara"** — resuelve el bilingüismo de la nota de §10.5
  (marcada entonces "para tu decisión, no corregido"). "Marinara" es un préstamo que ya se
  usa igual en español e inglés (no requiere traducción, a diferencia de "Meatball" vs.
  "Albóndiga"), y sigue encajando con el badge "Italiano" y con la convención "The X" del
  resto de Signatures. Aplicado en `src/app.ts` (`SIGS.SIG02`) y
  `supabase/functions/api/catalog.ts` (`SIG_LABEL.SIG02`).

El vacío de picante en Build Your Own (§10.7, propuesto por el Expansionist como posible
segunda tensión) el consejo lo descartó por 5/5 de este cierre — es oportunidad de
catálogo/expansión, no un caso de nombre que traiciona sabor real. Sigue documentado en
§10.7 como pendiente, sin decisión tomada todavía.

### 13.2 Cuarto council — menú completo (sabores, recetas, pitch) con investigación real de
chef y comparables exitosos (2026-08-08) — IMPLEMENTADO

El dueño pidió un análisis completo del menú ("no creo que sean para nada los adecuados")
con investigación real (WebSearch: fuentes de chef, comparables de cadena — Firehouse
Subs, Jersey Mike's, Potbelly) antes de responder. Veredicto completo en
`council-report-2026-08-08-menu-completo.html` / `council-transcript-2026-08-08-menu-completo.md`
(entregados al dueño, no versionados en este repo). Convergencia de 5/5 asesores y 5/5
rondas de revisión por pares: la desconfianza total NO tenía sustento — 6 de 8 recetas
están validadas ingrediente por ingrediente contra fuente de chef o comparable exitoso
(THE ORIGINAL, THE FRESH, THE VAULT, THE CHICAGO con validación fuerte; THE TERIYAKI con
riesgo real de "doble dulce" mitigado sin querer por su propio pepinillo). El único
hallazgo real y accionable: ausencia de queso derretido estructural en THE MARINARA y THE
SMOKE, confirmado por dos comparables independientes (ver §12.1, ya corregido).

**Decisiones del dueño, todas IMPLEMENTADAS** (no fueron parte del council — el dueño las
dio como resultado ya decidido del veredicto, para ejecutar directo):

- **Queso fijo en THE MARINARA (Mozzarella) y THE SMOKE (Cheddar)** — ver detalle en
  §12.1. Cheese C01 renombrado de Americano a Mozzarella (precio real investigado, Braedt
  ~S/22.50/kg, similar o menor al proxy genérico de S/35/kg ya usado en este documento, y
  mejor derretido que el Americano procesado que reemplaza) — se eligió reemplazar
  Americano en vez de Edam/Cheddar por ser el queso más genérico del catálogo, sin
  ninguna receta que lo usara por nombre, y el que peor derrite de los tres.
- **Pitches reescritos**: THE MARINARA ("Albóndigas caseras bañadas en marinara, con
  mozzarella derretida hasta el borde y aceituna negra sobre una vinagreta al estilo
  italiano. El clásico de toda la vida, hecho como se debe: con queso de verdad."), THE
  SMOKE (agrega "y cheddar derretido" para reflejar la receta real), THE TERIYAKI
  ("Pollo teriyaki caramelizado con salsa satay de maní y nuestra salsa de la casa —
  dulce, tostado, con la firma SND//WCH en cada bocado. El sabor asiático que le faltaba
  al menú.").
- **THE TERIYAKI sin Pepinillo** — decisión explícita del dueño, contraria a la
  recomendación del council de poner el pepinillo en foco en el pitch (ese ingrediente
  cortaba sin querer el riesgo de "doble dulce" teriyaki+satay). Quitado igual: queda
  Tomate+Pimiento. El riesgo de doble dulce queda sin ningún elemento ácido que lo corte
  — documentado a propósito, sin reemplazo agregado sin pedido explícito del dueño.

Aplicado en `src/app.ts` (`CHEESE`, `SIGS.SIG02/SIG03/SIG06`) y
`supabase/functions/api/catalog.ts` (`VALID_CHEESE`, `SIG_DATA.SIG02/SIG03/SIG06`,
mecanismo nuevo `fixedCheese` en `priceSigBuild`). Verificado con
`npm run typecheck && npm run build && npm test` (32/32).

### 13.3 Quinto council — lógica de ingredientes y palatabilidad, a total profundidad
(2026-08-08) — SOLO HALLAZGOS, NADA IMPLEMENTADO TODAVÍA

A pedido del dueño, análisis ingrediente-por-ingrediente de las 8 Signatures (no solo si
el pairing general funciona, ya validado en §13.2, sino textura/balance de 5
sabores/riesgo de humedad de cada elemento), con investigación real de principios de
contraste de textura, balance de sabor y manejo de humedad. Veredicto completo en
`council-report-2026-08-08-ingredientes.html` / `council-transcript-2026-08-08-ingredientes.md`
(entregados al dueño, no versionados en este repo). A diferencia de los councils
anteriores, **ningún cambio de receta se implementó esta ronda** — son hallazgos
pendientes de decisión del dueño.

**Hallazgos confirmados 5/5 asesores:**
- **THE FRESH (SIG04)** roto en dos ejes: fatiga de paladar (solo el pepinillo aporta
  crocancia real; atún+mayo, tomate y pimiento curado son todos blandos/cremosos) y
  desbalance de sabor (Dijon + limón apilan ácido sobre la misma nota, sin ningún
  elemento dulce — el único Signature de los 8 sin dulzor).
- **THE TERIYAKI (SIG06) sin pepinillo** (ver §13.2) es el caso más grave del menú: se
  perdieron simultáneamente el único elemento crocante Y el único ácido de la receta —
  dos roles distintos que cubría un solo ingrediente, ninguno reemplazado. Ningún asesor
  propone devolver el pepinillo (respeta la decisión ya tomada del dueño); todos
  convergen en un encurtido *distinto* que cubra ambos roles, sin acuerdo sobre cuál:
  cebolla morada encurtida (sin sourcing nuevo) vs. daikon/zanahoria estilo asiático
  (identidad propia, pero sourcing nuevo).

**Hallazgos en disputa dentro del propio consejo (sin resolver):**
- **THE MARINARA (SIG02)**: ¿el queso fijo agregado en §13.2 lo mejoró, o es ahora el
  mayor riesgo de pan mojado de los 8 (albóndiga en salsa + tomate + oil&vinegar = tres
  fuentes de humedad)? El consejo se contradice a sí mismo, no hay veredicto cerrado.
- **THE SMOKE (SIG03)** y **THE EMBER (SIG08)**: 2 de 5 asesores, de forma independiente,
  encontraron riesgo real de pan mojado (SIG03: BBQ+queso+tomate, tres elementos húmedos
  sin nada seco; SIG08: cero componente cremoso/graso en toda la receta, el chimichurri
  es aceite, no una barrera). Un tercer asesor había declarado estos dos "ya balanceados,
  no tocar" — la revisión por pares marcó esa declaración como el punto ciego más grave
  de las cinco respuestas (señalado en 3 de 5 rondas).

**Cobertura incompleta, sin auditar por nadie:** THE ORIGINAL (SIG01), THE VAULT (SIG05)
y THE CHICAGO (SIG07) nunca se revisaron ingrediente por ingrediente pese a que la
pregunta pedía las 8 recetas "a total profundidad". El eje de sabor "amargo" tampoco lo
tocó ningún asesor.

**Pendiente de decisión del dueño antes de tocar código** (ninguno implementado):
1. Ingrediente de reemplazo para SIG06 (cebolla encurtida vs. daikon/zanahoria asiática) —
   requiere primero documentar el perfil real de "Salsa SNDWCH de la casa" (S05, hoy sin
   `d` descriptivo en `src/app.ts`, un agujero real señalado por 2 de 5 asesores).
2. Ingrediente crocante + fuente de dulzor para SIG04 (candidatos sin sourcing nuevo: apio
   picado, cebolla morada cruda, pimiento fresco en vez del curado).
3. Auditoría real (no solo inspección) de si SIG02 necesita una barrera de humedad
   (tostar el pan, o un elemento cremoso adicional) antes de darlo por cerrado.
4. Auditoría de SIG03 y SIG08 con el mismo rigor que se aplicó a SIG04/SIG06.
5. Auditoría de los 3 Signatures que quedaron completamente sin revisar (SIG01/SIG05/SIG07).

### 13.4 Sexto council — Signatures restantes + las 12 salsas + concepto de marca
(2026-08-08) — SOLO HALLAZGOS, NADA IMPLEMENTADO

Continuación directa de §13.3: completa la auditoría de los 6 Signatures que habían
quedado sin revisar, agrega análisis de sabor de las 12 salsas del catálogo (¿reducir a
10?) y abre la conversación de concepto/look-and-feel de marca. Veredicto completo en
`council-report-2026-08-08-salsas-marca.html` / `council-transcript-2026-08-08-salsas-marca.md`
(entregados al dueño, no versionados en este repo).

**Hallazgo más importante de la sesión** (señalado de forma independiente en las 5 rondas
de revisión por pares): un asesor propuso arreglar la inconsistencia real de que
**SIG06 "The Teriyaki" no lleva ninguna salsa Teriyaki** (usa S05+S10, no S08 Teriyaki
Glaze) devolviéndole S08. Pero S08 es "dulce, soja, jengibre" — y §13.3 ya había
confirmado con 5/5 asesores que SIG06 tiene un problema de "doble dulce" (teriyaki+satay,
sin nada ácido) sin resolver. Nadie cruzó ambos hallazgos: el fix de naming podría agravar
el problema de sabor ya documentado. **No implementado** hasta documentar el perfil real
de S08 y S05 y verificar la interacción antes de decidir.

**Signatures — veredictos del consejo (en disputa/pendiente, no ejecutados):**
- **THE ORIGINAL (SIG01)** y **THE CHICAGO (SIG07)**: sin objeciones reales, consenso de
  "no tocar" (el segundo ya validado en §13.2/13.3 como el mejor resuelto del catálogo).
- **THE VAULT (SIG05)**: sin objeciones reales; único pendiente menor — confirmar que la
  cantidad de Picante Miel no se vuelva una cuarta fuente de humedad.
- **THE MARINARA (SIG02)**: la contradicción de §13.3 se profundiza — un asesor cuenta
  ahora CUATRO fuentes de humedad (marinara+tomate+oil&vinegar+mozzarella, no tres) y
  propone cortar Oil & Vinegar por redundante con el ácido de la marinara; otro propone
  en cambio cambiar el ORDEN de armado (queso tocando el pan como barrera, no mezclado con
  la salsa). Ninguna de las dos vías está probada ni decidida.
- **THE SMOKE (SIG03)**: confirma el riesgo ya señalado en §13.3 — mismo problema, sin
  resolver.
- **THE EMBER (SIG08)**: confirma la falta de barrera cremosa/grasa de §13.3. Tres
  propuestas sin resolver: agregar aioli neutro opcional (barato), construirle un
  Signature nuevo de línea "asiática" para S08 (caro, I+D contra el lanzamiento), o
  dejarlo para después.
- **Riesgo operativo nuevo, no relacionado con receta**: el Au Jus de THE CHICAGO se sirve
  aparte para evitar pan mojado — funciona en una mesa, pero en delivery en moto es un
  vaso que se puede derramar o que el cliente simplemente no usa. Decisión operativa
  (empaque, instrucción al cliente), no de receta.

**Salsas (12 total) — hallazgos:**
- **No reducir a 10** — 12-14 salsas es el rango normal de la industria (Subway ofrece
  12-14 en EE.UU., investigado por WebSearch). La pregunta original del dueño queda
  respondida: no hace falta, y "cantidad" no era el problema real.
- **Redundancia real identificada**: S04 (Honey Mustard) vs. S11 (Mostaza Dijon) — dos
  mostazas en el catálogo, sin diferenciar. Pendiente de decisión (¿se queda una, o se
  diferencian mejor?).
- **S05 "Salsa SNDWCH de la casa" sigue sin perfil de sabor documentado** (ya señalado en
  §13.3) — bloquea evaluar redundancia real contra S04/S11 y decidir sobre S08/SIG06.
- **S08 (Teriyaki Glaze) sigue huérfana** (ningún Signature la usa hoy) — su destino
  (volver a SIG06, Signature nuevo, quedarse en BYO) depende de la verificación de sabor
  pendiente arriba.

**Concepto y look-and-feel de marca** — conversación de DIRECCIÓN, nada decidido ni
propuesto visualmente todavía (regla del proyecto: concepto antes que código). El consejo
identificó la pregunta que hay que cerrar primero, no una paleta: **¿qué comunica
SND//WCH que no sea "trujillano" (ya descartado explícitamente) ni "genérico fast-casual
2026" (blanco-y-negro alto contraste + tipografía expresiva — tendencia real investigada,
pero describe toda la categoría, no una marca propia)?** Hallazgo convergente real (4 de
5 asesores, de forma independiente): reinterpretar el "//" como el **corte diagonal del
pan** (elemento visual propio del producto) en vez de su lectura por defecto como sintaxis
de código/terminal — el propio "//" sin dirección clara lee hoy como ruta de archivo o
comentario de código para alguien sin contexto previo del proyecto (hallazgo del
Outsider, coincide con lo ya documentado en el punto 10 de las "Restricciones permanentes"
de CLAUDE.md sobre que el "//" no está atado a ninguna estética específica). Próximo paso
acotado propuesto por el consejo: 2 mockups del ícono "//" solo (no el sitio completo) en
dos direcciones contrastantes, para que el dueño elija dirección antes de tocar
`shell.html` — no implementado, pendiente de que el dueño confirme que quiere avanzar con
esta conversación.

---

### 13.5 Decisiones del dueño sobre §13.4, ejecutadas (2026-08-08)

Resultado real de preguntarle al dueño cada pendiente de §13.4, uno por uno:

**Implementado en código:**
- **SIG08 "The Ember"**: se agregó Aioli (S01) como segunda salsa fija — resuelve la
  falta de barrera cremosa/grasa. Pitch actualizado.
- **SIG04 "The Fresh"**: Pimiento (T06) reemplazado por **Apio picado (T08, nuevo
  topping)** — resuelve la fatiga de paladar (antes un solo elemento crocante real). T08
  también disponible en BUILD YOUR OWN. **Sigue pendiente sin resolver**: la falta de
  dulzor (Dijon+limón apilan ácido) — el dueño solo confirmó el fix de crocancia.
- **S05 "Salsa SNDWCH de la casa"**: perfil de sabor documentado por el dueño —
  **salada/umami, no dulce**. Esto resuelve dos cosas a la vez: (1) confirma que SIG06
  tiene 2 fuentes dulces reales (proteína marinada + satay), no 3 como se temía; (2)
  destraba la pregunta de redundancia de §13.4 (S05 no es redundante con S04/S11, son
  ejes de sabor distintos).
- **SIG06 "The Teriyaki" — naming resuelto sin reactivar S08**: el dueño decidió NO
  devolver Teriyaki Glaze (S08) a la receta (habría sumado una tercera fuente dulce al
  doble dulce ya documentado). El nombre queda igual — "Teriyaki" describe la proteína
  (Pollo//Teriyaki, marinado real), no una salsa, y el pitch ya lidera con "Pollo teriyaki
  caramelizado" sin prometer una salsa que no está. **S08 sigue huérfana** (sin
  Signature), sin decisión tomada sobre su destino final.
- **Mostazas S04/S11**: el dueño pidió diferenciarlas mejor en el copy en vez de cortar
  una. S04 Honey Mustard: "Dulce, mostaza suave". S11 Dijon: "Ácida y filosa, sin dulzor"
  (se evitó la palabra "picante" — no es exacta para Dijon y rompía un test que la usa
  como proxy de salsas vaultOnly).

Aplicado en `src/app.ts` (`TOPS` nuevo T08, `SIGS.SIG04/SIG06/SIG08`, `SAUCES.S04/S05/S11`)
y `supabase/functions/api/catalog.ts` (`VALID_TOPS`, `SIG_DATA.SIG04/SIG08`). Verificado
con `npm run typecheck && npm run build && npm test` (32/32 — un test
—`menu-exclusivity-toppings-sauces.spec.ts`— falló en el primer intento porque la
descripción nueva de Dijon decía "picante", corregido a "filosa").

**Decisiones operativas (no de código, no hay dónde reflejarlas en `catalog.ts`/`app.ts`):**
- **SIG02 "The Marinara" — pan mojado**: el dueño eligió **reordenar el armado** (queso
  Mozzarella tocando el pan directo, debajo de la proteína, en vez de mezclado arriba con
  la marinara+tomate) en vez de cortar Oil & Vinegar. Es una instrucción de cocina, no un
  cambio de receta/ingredientes — anotar en la coreografía de armado del negocio (ver
  §10.4, "orden físico recomendado pan→proteína→queso→toppings→salsas").
- **SIG07 "The Chicago" — au jus en delivery**: el dueño eligió **mejorar el empaque**
  (vaso con tapa hermética/sellado) en vez de aceptar el riesgo o solo agregar una nota.
  Acción real pendiente del dueño: cotizar/conseguir un vaso con tapa sellada para el au
  jus en los pedidos de THE CHICAGO — no es algo que este repo pueda resolver en código.

**Concepto de marca — aprobado avanzar** (ver §13.6, mockups del ícono "//" entregados
por separado, no en este documento).

### 13.6 Mockups del ícono "//" (2026-08-08)

Primer paso acotado del concepto de marca, per la recomendación del sexto council: 2
mockups del ícono "//" solo (no el sitio completo), reforzando visualmente el corte del
pan/sándwich. **Corrección del dueño (2026-08-08): el "//" SIEMPRE representó ese corte —
nunca tuvo intención tech/terminal.** El sexto council había asumido que hacía falta
"reinterpretar" el ícono alejándolo de una lectura de código, cuando esa lectura nunca fue
el origen real, solo un riesgo de percepción externa (alguien sin contexto del proyecto
puede leer "//" como sintaxis de código la primera vez que lo ve) — ver el mismo hallazgo
ya corregido en CLAUDE.md, punto 10. Los 2 mockups siguen siendo válidos como propuesta
visual (dueño respondió "me gustan los mockups"), entregados para elegir dirección antes
de tocar `shell.html`. Nada implementado en producto todavía; es una conversación de
dirección, no de ejecución (regla del proyecto). Ver los archivos entregados (no
versionados en este repo) para el detalle visual — este documento no reproduce imágenes.

### 13.7 Séptimo council — el "//" y el look-and-feel de la marca (2026-08-08)

El dueño pidió un council dedicado a evaluar los 2 mockups de §13.6 y el look-and-feel en
general. Veredicto completo en `council-report-2026-08-08-marca-corte.html` /
`council-transcript-2026-08-08-marca-corte.md` (entregados al dueño, no versionados en
este repo). **Nada decidido ni implementado** — sigue siendo conversación de dirección.

**Hallazgo principal, 5/5 asesores**: Mockup A y B no son dos direcciones de marca
distintas — son el mismo gesto de corte decorativo entre bloques tipográficos bold, con
paleta invertida (negro/dorado vs. crema/gris). Que al dueño le gustaran los dos es señal
de que aprobó un TONO (bold, alto contraste), no de que comparó dos hipótesis reales.

**Tensión real señalada por 3 de 5 asesores**: ninguno de los dos mockups tiene textura
física (borde irregular, sombra, un asomo de color cálido) — se leen como diseño gráfico
limpio, no como pan real. Uno de los asesores fue explícito: "ninguno me da hambre".

**Punto ciego señalado en las 5 rondas de revisión sin excepción**: la propuesta de
convertir el corte en sistema de movimiento/empaque/fotografía (animaciones de tracking,
troquel físico en la caja, firma fotográfica por Signature) es prematura — no resuelve si
el símbolo base se lee como corte de pan, y viola la regla de "concepto antes que
implementación" del proyecto. Queda archivada para retomar después de elegir dirección,
no descartada.

**Recomendación del consejo — 5 pruebas antes de elegir A o B**, ninguna ejecutada
todavía:
1. Legibilidad del "//" aislado a tamaño real (favicon 32px, ícono de app, miniatura de
   listado de delivery 24-32px).
2. Si el corte necesita textura física (borde irregular, sombra, color de relleno
   asomando).
3. Costo real de producción con el proveedor de empaque (tinta blanca sobre negro vs.
   negro sobre crema/kraft).
4. Test de percepción con 5-8 personas reales de Trujillo (3 segundos, "¿qué venden
   acá?") — resuelve si el riesgo de leerse como código (§13.6) es real para el cliente
   real o una proyección de diseño internacional, señalado explícitamente como hipótesis
   sin testear, no como hecho confirmado.
5. Si el "//" necesita verse cortado (imperfecto) o le basta con verse ordenado (limpio,
   de sistema) — pregunta conceptual en paralelo, no una tercera paleta.

Puntos ciegos adicionales sin resolver: nadie evaluó el costo de migrar desde la
identidad visual YA en producción (`shell.html`/`app.ts`, paleta verde/dorado actual) ni
la accesibilidad/contraste para baja visión; nadie probó el lockup completo "SND//WCH" a
tamaño de handle de red social o rótulo de bolsa.

### 13.8 Octavo council — el "//" y el look-and-feel, sin literalizar en pan (2026-08-10)

Después de §13.7, se generó un tercer mockup ("Mockup C") que convertía las dos barras
del "//" en una textura literal de pan (gradiente corteza-migas, bordes irregulares,
sombra de profundidad) como respuesta directa al hallazgo #4 de §13.7 (ningún mockup
evocó comida en el test real). **El dueño rechazó esta dirección explícitamente**: "No me
gusta para nada que cambies a algo como pan o comida el //" — el "//" debe seguir siendo
signo gráfico/tipográfico, nunca una ilustración/textura literal de comida. Pidió un
council dedicado con esa restricción explícita, más comparación con negocios/marcas
reales funcionando. Veredicto completo en
`council-report-2026-08-10-look-and-feel-8.html` /
`council-transcript-2026-08-10-look-and-feel-8.md` (entregados al dueño, no versionados
en este repo). **Nada decidido ni implementado.**

**Hallazgo principal, 5/5 asesores**: el test de §13.7 (mostrar el "//" aislado, sin
wordmark, sin color de marca, sin contexto, y preguntar "¿qué venden acá?") midió la
pieza equivocada. Bajo ese mismo estándar fallarían casi todos los íconos abstractos de
marcas reales (swoosh de Nike, puntos de Domino's, flecha oculta de FedEx, pimiento de
Chipotle, "1" de F1). Ningún ícono de restaurante carga solo el peso semántico de "esto
es comida" — lo hace el sistema completo (color + tipografía + wordmark + contexto +
repetición). El Mockup C fue la solución equivocada (problema de sistema disfrazado de
problema de glifo) — y cualquier variante "suavizada" de la misma idea (fondo color-pan,
sombra que insinúa migas) sigue rozando la restricción explícita del dueño.

**Punto ciego más señalado, 4/5 revisores**: la propuesta de escalar el "//" a sistema de
movimiento (animación en carga de app/confirmación de pedido) y lenguaje gráfico completo
(separadores de menú, cinta de empaque, recibos) es una dirección válida a mediano plazo,
pero ignora el plazo de 27 días hasta el lanzamiento y tiene una contradicción interna
(afirma "todo vive en pantalla, sin restricción de señalética" y en el mismo aliento
propone cinta de empaque y recibos térmicos, que son superficies físicas). Queda
archivada para retomar después de elegir dirección, no descartada — mismo tratamiento que
recibió la propuesta equivalente del Expansionist en §13.7.

**Hueco más grave y repetido, 4-5 de 5 revisores**: cero benchmarks locales. El dueño
pidió explícitamente comparar con "negocios/marcas reales funcionando" — los 5 asesores
solo nombraron gigantes globales (Nike, FedEx, Domino's, Chipotle, F1, Cash App, Chick-
fil-A, Häagen-Dazs, Robinhood, Slack), ninguno una marca de delivery/fast-casual operando
hoy en Trujillo o Perú, que es la comparación real que el dueño pidió y que más importa
porque es contra eso que un cliente compara el ícono en un scroll real de Rappi/PedidosYa.
Segundo hueco: nadie propuso simplemente re-testear los Mockups A/B **completos** (con
wordmark y color) contra el mismo panel antes de generar algo nuevo — la validación más
barata y directa disponible, y nadie la puso como primer paso.

**Recomendación del consejo**: no generar un cuarto mockup del glifo todavía. Antes: (1)
re-testear los Mockups A/B completos — wordmark "SND//WCH" entero, color de marca,
simulados dentro de una miniatura de listado de delivery — contra un panel similar de 5-8
personas, misma pregunta ("¿qué venden acá?"); (2) investigar 3-5 competidores reales de
delivery/fast-casual en Trujillo/Perú (capturas de su ícono/logo en listados reales de
Rappi/PedidosYa) como referencia de contraste — directamente lo que el dueño pidió y
ningún asesor hizo con profundidad esta vez; (3) la idea del Outsider — favicon = "//"
sobre una forma/fondo que sugiere comida, sin que el glifo mismo se vuelva ilustrativo (ej.
un óvalo color-pan como FONDO detrás del glifo tipográfico, no el glifo convertido en
pan) — es la única propuesta que resuelve la tensión "necesita evocar comida" vs. "no debe
volverse pan" sin rozar la restricción del dueño; vale maquetarla como variante adicional,
no como reemplazo del glifo.

**Lo primero que hay que hacer**: re-testear el Mockup A (o B) completo — wordmark entero,
color de marca, dentro de una miniatura de listado de delivery — contra el mismo tipo de
panel de 5-8 personas, misma pregunta. Si en ese contexto real el "//" sí lee como corte/
comida, el glifo nunca fue el problema y el consejo se ahorra generar más variantes de un
símbolo que no era la variable rota.

Puntos ciegos adicionales sin resolver (heredados de §13.7, todavía sin cerrar): el
thumbnail de listado de delivery nunca se definió como spec de diseño real (tamaño en
píxeles, comportamiento de recorte, chrome de la plataforma); nadie propuso un plan de
contingencia si el retest con wordmark+contexto también falla, a menos de un mes del
lanzamiento; el color #1E3932 (verde oscuro, producción actual) contra la convención
cálida del rubro delivery se mencionó pero no se llevó a una decisión ni se verificó si
sigue en juego o es una decisión ya cerrada fuera de alcance de este council.

**Investigación de competidores reales, ejecutada 2026-08-10** (`WebSearch`, sin acceso a
capturas reales de Rappi/PedidosYa — herramientas de este entorno no llegan a esos
dominios directamente, ver "Capacidades y limitaciones" en `CLAUDE.md`): la categoría
"Sándwiches" de Rappi en Trujillo lista 48-50 restaurantes, todos negocios pequeños con
naming 100% literal/descriptivo (Sanguchería Don Pacho, Sanguchería Montero, San
Agustín) — ninguno usa un signo abstracto ni sistema de marca deliberado; SND//WCH ya se
diferencia de esa categoría local solo por tener identidad de marca, el "//" no compite
contra otro signo abstracto local porque no existe ninguno. Las cadenas peruanas de fast-
casual (Bembos —confirmado con fuente dedicada: rojo/amarillo diagonal, pop-art de alto
contraste—, Norkys, China Wok, Otto Grill, Popeyes) coinciden en paleta cálida/saturada
(rojo-amarillo-naranja); ninguna referencia usa verde oscuro — confirma con datos reales,
no solo teoría, que el #1E3932 actual rompe la convención de categoría que el Executor
señaló sin dato local en el council. Estructuralmente, las tarjetas de listado de
Rappi/PedidosYa se arman alrededor de una foto de producto grande con el logo como avatar
circular pequeño superpuesto — el logo nunca carga solo el peso de comunicar "comida" en
el uso real de la app, lo que respalda con evidencia de mercado (no solo argumento
teórico) la posición del First Principles Thinker y el Contrarian en el Council #8: el
test que aisló el "//" sin foto de producto ni contexto no representa cómo se usa la app
realmente. Reporte completo en
`investigacion-competidores-reales-2026-08-10.md` (entregado al dueño, no versionado en
este repo).

**Mockups de contexto para el retest, generados 2026-08-10** (`retest-context-card-a.html`
/ `-b.html`, entregados como PNG, no versionados en este repo): siguiendo el hallazgo de
arriba, se construyó el avatar "//" (dos barras diagonales dentro de un círculo — mismo
motivo de corte de los Mockups A/B, nunca literalizado en pan) y se simuló dentro de una
tarjeta de listado de delivery real (foto de portada + avatar superpuesto + nombre +
rating/tiempo), usando la foto de producto real de SIG01 (`img/sig01.jpg`, ya en
producción) en vez de un mockup aislado — exactamente lo que el council recomendó como
"lo primero que hay que hacer". Variante A (avatar negro con anillo dorado #CBA258)
mantiene mucho más contraste contra el chrome blanco de la app que la variante B (avatar
crema con borde fino oscuro, casi se funde con el fondo blanco de la tarjeta a 24px) —
hallazgo visual nuevo, no anticipado por ningún asesor del council, a favor de la
variante A específicamente para el uso de avatar de listado (no necesariamente para el
resto del sistema). Cada archivo incluye además el avatar aislado a 64/44/32/24px sobre
fondo blanco, cubriendo también la prueba de legibilidad a tamaño real pendiente de
§13.7. Pendiente: correr esto con el panel real de 5-8 personas.

**Corrección de contexto del dueño (2026-08-10)**: el dueño eligió la variante A (avatar
negro/anillo dorado) como la mejor de las dos, pero corrigió una asunción de este consejo
y de las sesiones previas — el canal principal de venta NO es un listado tipo
Rappi/PedidosYa (nunca confirmado como canal real de este negocio, ver estructura del
proyecto en `CLAUDE.md`: cliente de una sola página + backend propio, sin integración de
marketplace documentada), sino **redes sociales y la web propia**. También pidió no
seguir generando mockups que impliquen retests formales repetidos con personas reales
("mucho trabajo sin privilegios"). En respuesta, se generó
`retest-context-social-a.html` (PNG entregado): la variante A aplicada a los contextos
reales (foto de perfil de Instagram/Facebook/WhatsApp Business 1080×1080, cómo se ve en
una lista de chats de WhatsApp junto a otros contactos, comparación directa contra el
ícono de app YA en producción `icon-192.png`, y crops a 56px/32px) — sin pedir un nuevo
test formal, solo para revisión directa del dueño. Pendiente: el dueño decide si esto
cierra la dirección del ícono o si sigue en exploración.

### 13.9 "The Vault" pasa a rotación mensual (2026-08-10) — implementado

El dueño, en el mismo mensaje que rechazó el logo (§13 arriba), pidió además: (1) "muchas
más opciones" de logo (ver §13.8/investigación de competidores — no aplica acá) y (2)
**"el sandwich secreto ya no se llamará the vault sino que rotará todos los meses"**.
Todas las menciones a "THE VAULT" en las secciones §1-12 de este documento (análisis de
costeo, coherencia de receta, feedback de chef) describen el estado histórico — Pollo
Cajún + Spicy Mayo + Picante-Miel como receta FIJA — vigente hasta esta fecha. No se
reescriben esas secciones (son el registro de lo que se analizó en su momento); esta
entrada documenta el cambio real de mecanismo desde acá en adelante.

**Decisiones tomadas vía `AskUserQuestion` antes de implementar** (4 preguntas, todas
respondidas explícitamente por el dueño):
1. Mecanismo de actualización: **panel en el admin** (no editar código cada mes).
2. El concepto "menú secreto" (desbloqueo por rango, composición nunca revelada al
   cliente) **se mantiene igual** — solo deja de tener nombre/receta fijos.
3. La proteína/salsas exclusivas (hoy Pollo Cajún/Jalapeño/Spicy Mayo/Picante-Miel)
   **también rotan** — no quedan ancladas para siempre.
4. Prioridad: **implementar ya** (no esperar a cerrar primero la dirección de marca).

**Lo implementado** (código + infraestructura, ver detalle técnico en `CLAUDE.md` bajo
"Menú secreto con rotación mensual"): tabla `secret_signature` en Supabase (append-only,
semillada con la receta que hasta hoy era "The Vault" — Pollo Cajún/B03/T04+T06+T03/
S02+S12/S/24-S/30/5 pedidos mínimos — como punto de partida editable, ya renombrada a
"Menú secreto" como placeholder neutro hasta que el dueño publique un nombre real desde
el panel); `loadSecretSignature()` server-side que reemplaza los literales fijos
`SIG_DATA.SIG05`/`SIG_GATES.SIG05`/`VAULT_ONLY_PROTS`/`VAULT_ONLY_TOPS`/
`VAULT_ONLY_SAUCES` con la fila vigente en cada refresco (mismo patrón que
`catalog_prices` ya usa para precios editables); el cliente recibe la composición vigente
vía `get-catalog` y ya no tiene "The Vault" hardcodeado en ningún string visible (barrido
completo de `src/app.ts`/tests — la única referencia real de usuario, "Ya puedes ver The
Vault" al subir a INICIADO, ahora dice "Ya puedes ver el menú secreto"); pantalla nueva
Admin // Catálogo // Menú secreto para publicar el sándwich del mes (nombre, pan,
proteína, hasta 3 toppings, hasta 2 salsas, qué ingredientes de esos quedan exclusivos
este ciclo, precio 15CM/30CM, pedidos mínimos para desbloquear, foto opcional), con
historial de meses anteriores visible debajo. `npm run verify` completo (typecheck+build+
32/32 tests) pasa con estos cambios.

**Sin resolver, no pedido por el dueño todavía**: qué nombre real usar para el primer mes
publicado (queda "Menú secreto" de placeholder hasta que el dueño lo edite); si el
mecanismo de foto (campo de texto con ruta/URL) es suficiente o conviene una subida de
archivo real desde el panel (se dejó texto simple a propósito, más barato de construir,
iterable después si resulta incómodo); coherencia de sabor/costeo real del PRIMER
sándwich que el dueño publique con este mecanismo (cada mes que se recalibre, revisar
igual que se hizo con Pollo Cajún en §10.6/§15).

---

*Documento generado como simulación de apoyo a la decisión — versión 4 (2026-07-31),
punto medio entre los precios ya documentados y los investigados online, con demanda
anclada en fuentes de Perú/Trujillo. No reemplaza datos reales de venta ni un costeo de
recetas hecho por el dueño con sus proveedores reales, sobre todo para atún y embutido.*
