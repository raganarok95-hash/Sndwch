# El menú de clásicos de USA — viabilidad, costos y precios

> ⚠ **LA VERSIÓN VIGENTE ES LA v4, AL FINAL DE ESTE ARCHIVO.** Las tablas de las v1, v2 y v3
> quedaron **desactualizadas el 2026-09-23**: costeaban el empaque a S/1.10 cuando el análisis
> del repo usa S/1.30, y estimaban el pavo cuando ya estaba cotizado a S/44.20/kg. Se dejan
> porque muestran cómo se llegó acá, pero **ningún número de antes de la v4 sirve para decidir
> un precio.** Los de la v4 no están escritos a mano: salen de `modelo/menu_clasicos_usa.py`.


Propuesta del dueño (2026-09-23): reemplazar o ampliar la carta con seis clásicos
estadounidenses. Este documento la costea con el **mismo modelo de componentes** que ya usa
`MENU_FINANCIAL_ANALYSIS.md`, para que los números sean comparables con el menú de hoy y no
una cuenta nueva hecha aparte.

## Veredicto corto

**Sí es viable, y deja algo más que el menú actual.** Contribución media por sándwich:

| | 15 CM | 30 CM |
|---|---|---|
| Menú propuesto | **S/16.00** | **S/22.13** |
| Menú de hoy | S/15.74 | S/20.45 |

La diferencia es chica en 15 CM (+1.7%) y real en 30 CM (+8.2%). **El menú no se justifica
por margen: se justifica por ser más reconocible.** Un Philly Cheesesteak no hay que
explicarlo; "The Smoke" sí.

## Costos y precios sugeridos

Modelo: pan sub (S/1.00 / S/2.00) + empaque S/1.10 + salsas S/0.266 c/u + vegetales S/0.26 +
proteína con merma ya aplicada. Sin mano de obra, como todo el costeo de este repo.

| producto | costo 15 | precio | % | contrib | costo 30 | precio | % | contrib |
|---|---|---|---|---|---|---|---|---|
| Philly Cheesesteak | 6.88 | **21.90** | 31.4% | 15.02 | 12.13 | **31.90** | 38.0% | 19.77 |
| Turkey | 8.79 | **23.90** | 36.8% | 15.11 | 15.94 | **35.90** | **44.4%** ⚠ | 19.96 |
| Italian Hoagie | 7.66 | **23.90** | 32.0% | 16.24 | 13.69 | **33.90** | 40.4% | 20.21 |
| Meatball Marinara | 4.50 | 21.90 | 20.5% | 17.40 | 7.37 | 28.90 | 25.5% | 21.53 |
| Classic Tuna | 5.61 | 20.90 | 26.8% | 15.29 | 9.86 | 34.90 | 28.3% | 25.04 |
| Tuna Melt | 6.00 | **22.90** | 26.2% | 16.90 | 10.63 | **36.90** | 28.8% | 26.27 |

**El Tuna Melt se cobra +S/2.00 sobre el Tuna** y el cheddar cuesta S/0.39: ese upsell deja
S/1.61 limpios. Es el mejor negocio de toda la tabla por sol invertido.

⚠ **Turkey 30 CM queda en 44.4%, a seis décimas del techo de 45%.** Es el único que hay que
vigilar. Sube a 46.9% si el tocino cuesta 20% más de lo estimado — y el tocino es un insumo
**sin cotizar**.

## Lo que NO cuadra con decisiones ya tomadas

Tres choques, ninguno fatal, pero hay que resolverlos antes de escribir recetas:

1. **El Classic Tuna propuesto lleva apio.** El apio (T08) está **retirado del catálogo desde
   el 2026-09-12** por decisión del dueño ("chau apio"). O vuelve, o la receta va sin él.
2. **El Classic Tuna propuesto lleva lechuga y tomate.** THE FRESH se redefinió
   explícitamente **sin lechuga**: atún escurrido, mayonesa y pimienta. Son dos recetas
   distintas del mismo producto.
3. **El Philly necesita P07 (res laminada), retirada el 2026-08-22** cuando se fue SIG07, su
   único consumidor. Restaurarla está documentado en `catalog.ts` y es barato — pero es un
   paso, no un supuesto.

Y dos ya existen: **Meatball Marinara es SIG02** y **Classic Tuna es SIG04**. De seis
productos, **tres son nuevos de verdad**: Philly, Turkey e Italian Hoagie.

## El riesgo real no es el margen: son seis insumos nuevos sin cotizar

Todos los números de arriba dependen de estimaciones mías para insumos que **nadie ha
cotizado**: tocino ahumado, queso americano, provolone, salami, capicola y jamón de pierna.
El repo solo tiene precio real de res, pollo, atún y embutido premium (S/48/kg, confirmado
por el dueño).

Peor que la incertidumbre de precio es la **merma por caducidad, que este costeo NO incluye**
— solo cubre merma de cocción. Los embutidos laminados se oxidan en días una vez abiertos, y
el Italian Hoagie obliga a tener **tres** abiertos a la vez para un solo producto. Con la
tienda sin abrir y sin historial de rotación, ese es el producto que más puede sangrar sin
que nadie lo note, porque la merma no aparece en ningún cálculo de margen: aparece como
compras que no cuadran con las ventas.

**Mitigación concreta:** hacer el Italian Hoagie con **dos** embutidos (salami + jamón) en vez
de tres, o armarlo sobre el **P05 que ya está cotizado**. Baja el costo, baja el inventario
y el cliente no cuenta cuántos embutidos lleva — cuenta si está bueno.

## Complejidad: de 7 proteínas a 13 SKU

Hoy el catálogo mueve 6 proteínas + queso. El menú propuesto suma tocino, americano,
provolone, salami, capicola y jamón: **casi el doble de SKU perecibles**, para un negocio de
una sola persona que arma los pedidos a mano. Eso no sale en ninguna tabla de margen y es lo
que más se siente en la operación diaria.

## Recomendación

1. **Entrar con los tres nuevos de verdad** — Philly, Turkey e Italian Hoagie — y **dejar
   Meatball y Tuna como están**, renombrándolos si se quiere el naming gringo. Son los mismos
   productos.
2. **Cotizar los seis insumos antes de fijar precio.** Los precios de esta tabla son firmes
   solo para Philly (usa res, ya cotizada) y Meatball/Tuna (ya existen).
3. **Vigilar el Turkey 30 CM**, que nace a seis décimas del techo.
4. **Simplificar el Italian Hoagie a dos embutidos** mientras no haya historial de rotación.
5. **Sumar el Tuna Melt sí o sí**: +S/2.00 de precio por S/0.39 de costo es el mejor upsell
   que hay en la carta, y no agrega ningún insumo nuevo.


---

# v2 — con las tres correcciones del dueño (2026-09-23)

El dueño corrigió tres supuestos de la v1:

1. **El apio vuelve, pero SOLO para el Tuna** — no como ingrediente de ARMA EL TUYO. El
   mecanismo ya existe y no hay que inventarlo: `SIG_ONLY_TOPS`, el mismo conjunto por el
   que ya pasa el pepinillo. El apio entra ahí, no al catálogo abierto.
2. **El Tuna va sin lechuga ni tomate.** Atún, mayonesa y apio. Punto.
3. **El Philly no necesita el corte exclusivo (P07): se lamina en frío** y se saltea a la
   plancha. Eso cambia el costeo: no hay cocción larga, así que el rendimiento sube de 0.567
   a ~0.63 y la porción baja de S/3.00 a **S/2.70**. *(0.63 es supuesto: limpieza 10% +
   plancha 30%. Hay que medirlo en la primera tanda.)*
4. **La merma por caducidad de los embutidos es menor de lo que asumí** — bien cerrados
   duran. Aun así el Italian Hoagie va con **dos** embutidos, que era la recomendación.

## Cómo queda el menú, si REEMPLAZA al actual

| producto | costo 15 | precio | % | margen | costo 30 | precio | % | margen |
|---|---|---|---|---|---|---|---|---|
| Philly Cheesesteak | 6.57 | **21.90** | 30.0% | 15.33 | 11.52 | **31.90** | 36.1% | 20.38 |
| Turkey | 8.79 | **23.90** | 36.8% | 15.11 | 15.94 | **35.90** | **44.4%** ⚠ | 19.96 |
| Italian Hoagie *(2 embutidos)* | 7.24 | **22.90** | 31.6% | 15.66 | 12.86 | **32.90** | 39.1% | 20.04 |
| Meatball Marinara | 4.50 | **21.90** | 20.5% | 17.40 | 7.37 | **28.90** | 25.5% | 21.53 |
| Classic Tuna | 5.65 | **20.90** | 27.0% | 15.25 | 9.94 | **34.90** | 28.5% | 24.96 |
| Tuna Melt | 6.04 | **22.90** | 26.4% | 16.86 | 10.71 | **36.90** | 29.0% | 26.19 |

## La diferencia de ingresos, sin adornos

| | menú actual | menú nuevo | |
|---|---|---|---|
| precio medio 15 CM | S/21.50 | S/22.40 | **+4.2%** |
| margen medio 15 CM | S/15.74 | S/15.94 | **+1.3%** |
| precio medio 30 CM | S/30.30 | S/33.57 | **+10.8%** |
| margen medio 30 CM | S/20.45 | S/22.18 | **+8.4%** |

Ponderado con la mezcla del modelo (70% de 15 CM):

| | actual | nuevo | diferencia |
|---|---|---|---|
| ingreso por sándwich | S/24.14 | S/25.75 | **+S/1.61** |
| margen por sándwich | S/17.15 | S/17.81 | **+S/0.66** |

| volumen | ingreso extra/mes | margen extra/mes |
|---|---|---|
| 300 sándwiches | +S/483 | +S/197 |
| 600 sándwiches | +S/966 | +S/394 |
| 1 000 sándwiches | +S/1 610 | +S/657 |

⚠ **El dato que importa: el ingreso sube 6.7% pero el margen solo 3.8%.** De cada sol extra
que cobras, te quedas con 41 céntimos — el resto se lo comen los insumos nuevos, que son más
caros. El menú nuevo **es más caro de producir**, no solo más caro de vender.

## Qué se pierde al reemplazar

No es neutro. Salen tres perfiles de sabor que hoy existen:

- **The Teriyaki** — el único perfil asiático. El menú nuevo es enteramente americano.
- **The Smoke** — el ahumado premium (P05, el insumo más caro del catálogo).
- **The Original** — la res mechada de cocción lenta, que es el producto que más se parece a
  «cocina de verdad» y no a ensamblaje.

Y hay costos operativos que no salen en ninguna tabla de margen:

- **Seis fotos de producto nuevas.** Las `img/sig0*.jpg` actuales no sirven para productos
  distintos, y `img/fuente/FUENTES.md` exige original y licencia de cada una.
- **Las recetas, los pitches y los badges se reescriben enteros** — y cada texto que nombre
  una cifra tiene que derivarla, nunca escribirla (regla de `CLAUDE.md`).
- **P01, P02, P03 y P05 quedan sin ningún Signature que las use.** Siguen vivas en ARMA EL
  TUYO, así que no se retiran, pero dejan de tener vitrina.
- **El menú secreto (SIG05) no se toca**: usa P03 y vive en su propia tabla.

## Opinión

**Reemplazar entero es la decisión correcta, pero no por el margen.** Los S/0.66 extra por
sándwich no pagan el trabajo de rehacer seis fotos, seis recetas y seis textos. Lo que sí lo
paga es que **el menú nuevo no hay que explicarlo**: un Philly Cheesesteak, un Italian Hoagie
y un Tuna Melt se entienden solos, y eso baja el costo de adquirir un cliente, que es la
única palanca que la proyección v11 identificó con recorrido real.

Dos condiciones antes de ejecutarlo:

1. **Cotizar los cinco insumos nuevos** — tocino, americano, provolone, salami, jamón. Los
   precios de esta tabla son firmes solo para Philly (res, ya cotizada), Meatball y Tuna.
2. **Medir el rendimiento real del laminado en frío** en la primera tanda. Si en vez de 0.63
   sale 0.55, el Philly 15 CM pasa de 30.0% a 32.8% — soportable, pero conviene saberlo.

Y una advertencia que ya se cumplió una vez en este repo: **cambiar el precio en el código no
cambia el precio real.** Todo esto termina en `catalog_items` y `catalog_prices`, o no existe.


---

# v3 — la cebolla, el rendimiento real y los precios ajustados (2026-09-23)

Tres correcciones más del dueño, y la consigna: **el menú nuevo tiene que igualar o mejorar
la ganancia del actual**, apretando los que menos dejan.

## 1 · Faltaba la cebolla, y es la palanca

La receta real del Philly lleva **cebolla blanca salteada**, y yo no la estaba contando.
Importa más de lo que parece: **70 g de cebolla cruesta S/0.21** y al saltearse quedan ~40 g
que dan volumen de verdad dentro del pan. Además **reemplaza al set de vegetales** (S/0.26),
así que el sándwich sale **más lleno y más barato al mismo tiempo** — cinco céntimos menos.

Es el mejor cambio de toda la revisión: volumen percibido por casi nada. Vale mirar dónde más
aplica el mismo principio.

## 2 · El laminado en frío rinde más

No son láminas finísimas, así que no hay la merma del corte exclusivo. Rendimiento **0.70**
(limpieza 8% + plancha 24%) contra el 0.567 de P07:

| supuesto | S/kg terminado | porción 85 g |
|---|---|---|
| P07, corte exclusivo (0.567) | S/35.27 | S/3.00 |
| v2, laminado genérico (0.63) | S/31.75 | S/2.70 |
| **v3, laminado en frío (0.70)** | **S/28.57** | **S/2.43** |

*Sigue siendo un supuesto: hay que medirlo en la primera tanda.*

## 3 · Precios ajustados donde menos dejaba

Los dos peores de la v2 eran **Turkey** y **Classic Tuna**. Se corrigieron así:

- **Turkey** → S/24.90 / S/36.90, y el tocino baja de 20 g a 15 g terminados. Pasa de
  44.4% a **41.5%** en 30 CM, el único que estaba cerca del techo.
- **Classic Tuna** → S/21.90, y sin lechuga ni tomate se ahorra el set de vegetales.
- **Tuna Melt** → S/23.90 / S/36.90.

## Cómo queda

| producto | costo 15 | precio | % | margen | costo 30 | precio | % | margen |
|---|---|---|---|---|---|---|---|---|
| Philly Cheesesteak | 6.25 | **21.90** | 28.6% | 15.65 | 11.14 | **31.90** | 34.9% | 20.76 |
| Turkey | 8.47 | **24.90** | 34.0% | 16.43 | 15.30 | **36.90** | 41.5% | 21.60 |
| Italian Hoagie | 7.24 | **22.90** | 31.6% | 15.66 | 12.86 | **32.90** | 39.1% | 20.04 |
| Meatball Marinara | 4.50 | **21.90** | 20.5% | 17.40 | 7.37 | **28.90** | 25.5% | 21.53 |
| Classic Tuna | 5.39 | **21.90** | 24.6% | 16.51 | 9.68 | **34.90** | 27.7% | 25.22 |
| Tuna Melt | 5.78 | **23.90** | 24.2% | 18.12 | 10.45 | **36.90** | 28.3% | 26.45 |

**Ninguno cruza el techo de 45%.** El peor es Turkey 30 CM, a 41.5%.

## La ganancia, que era la consigna

| | actual | nuevo v3 | |
|---|---|---|---|
| margen medio 15 CM | S/15.74 | **S/16.63** | **+5.7%** |
| margen medio 30 CM | S/20.45 | **S/22.60** | **+10.5%** |

Ponderado 70/30: **+S/2.01 de ingreso y +S/1.27 de margen por sándwich** — casi el doble del
+S/0.66 de la v2.

| volumen | ingreso extra/mes | margen extra/mes |
|---|---|---|
| 300 sándwiches | +S/603 | +S/381 |
| 600 | +S/1 206 | +S/762 |
| 1 000 | +S/2 010 | +S/1 270 |

**El menú nuevo ya no solo iguala: mejora la ganancia en los dos tamaños.**

## Lo que se deja de cocinar

Decisión del dueño: las proteínas que salen del menú **ya no se preparan**, ni siquiera para
ARMA EL TUYO. Salen **P01 res mechada, P02 pollo teriyaki y P05 embutido premium**; P03 pollo
cajún se queda solo mientras el menú secreto la use.

Eso no es solo menos SKU: **cada una era una cocción distinta**. La res mechada es cocción
lenta y el teriyaki una marinada de una noche. El menú nuevo es casi todo **plancha y
ensamblado**, que para una sola persona armando pedidos es una diferencia enorme de tiempo —
y ese tiempo no aparece en ninguna tabla de margen porque la mano de obra se cuenta como S/0.

⚠ **Hay que rehacer el costeo de ARMA EL TUYO**: sus proteínas cambian por completo y varias
de sus combinaciones estaban calibradas contra las que salen.


---

# v4 — el Turkey sin tocino, y de dónde sale de verdad la plata (2026-09-23)

**Los números de esta versión ya no se escriben a mano.** Salen de
`modelo/menu_clasicos_usa.py`, que importa sus constantes de `modelo/rentabilidad_por_parte.py`
en vez de repetirlas. Se hizo así porque al recostear aparecieron **dos errores de base en las
v1, v2 y v3** — los dos por copiar un número en lugar de derivarlo, que es exactamente el
defecto que este repo ya tiene documentado tres veces.

## ⚠ Dos correcciones que mueven todo lo anterior

**1. El empaque cuesta S/1.30, no S/1.10.** El análisis vigente del repo
(`rentabilidad_por_parte.py`, con el que se mide el menú de hoy) usa el punto medio cotizado
del rango S/1.10–1.50. Mis tres versiones anteriores usaron el extremo bajo. Son **veinte
céntimos por sándwich** costeados de menos, en los dos menús a la vez — o sea que la
comparación no estaba rota, pero los porcentajes de costo sí estaban optimistas.

**2. El pavo YA ESTABA COTIZADO, y yo lo estaba estimando.** Desde el 2026-09-12:
**S/44.20/kg al por mayor, confirmado por el dueño**, con rendimiento 1.00 porque es fiambre y
no pasa por la olla. La porción de 85 g cuesta **S/3.76** y no lo que yo supuse. Es P08, ya
vive en ARMA EL TUYO desde el 2026-09-06. El Turkey no era el producto más frágil del menú
nuevo: era el único con la proteína **completamente cotizada**.

## 1 · El Turkey sin tocino

Sale el tocino. Era el único insumo de esa receta sin cotizar y contradecía lo que el producto
dice ser. Queda **pavo, vegetales del set estándar (73 g) y una salsa. Sin queso.**

| | con tocino (v3) | sin tocino (v4) |
|---|---|---|
| costo 15 CM | S/8.47 | **S/6.62** |
| costo 30 CM | S/15.30 | **S/11.93** |
| % de costo 30 CM | 41.5% ⚠ el peor del menú | **34.2%** |
| insumos sin cotizar | 1 (el tocino) | **0** |

**El producto que estaba más cerca del techo pasó a ser uno de los sanos, y quitándole algo.**
Parte de la mejora es el pavo real; el resto es el tocino que se fue.

## 2 · El menú v4 completo

Mismo costeo que el menú de hoy: empaque S/1.30 · pan sub S/1.00/S/2.00 · salsa S/0.266 ·
queso S/0.385 · vegetales S/4.00/kg · mano de obra S/0.

| producto | 15 CM | costo | % | deja | 30 CM | costo | % | deja |
|---|---|---|---|---|---|---|---|---|
| Philly Cheesesteak | **22.90** | 5.41 | 23.6% | 17.49 | **32.90** | 9.53 | 29.0% | 23.37 |
| Turkey | **23.90** | 6.62 | 27.7% | 17.28 | **34.90** | 11.93 | 34.2% | 22.97 |
| Italian Hoagie | **23.90** | 7.53 | 31.5% | 16.37 | **33.90** | 13.78 | 40.6% | 20.12 |
| Meatball Marinara | 21.90 | 4.47 | 20.4% | 17.43 | 28.90 | 7.64 | 26.4% | 21.26 |
| Classic Tuna | 20.90 | 5.55 | 26.6% | 15.35 | 34.90 | 9.80 | 28.1% | 25.10 |
| Tuna Melt | **22.90** | 5.93 | 25.9% | 16.96 | **36.90** | 10.57 | 28.6% | 26.33 |

**Ninguno pasa el techo de 45%.** El peor es el Hoagie 30 CM a 40.6%, y es el único que
depende de un insumo caro (el embutido premium de S/48/kg).

| | hoy | nuevo v4 | |
|---|---|---|---|
| margen medio 15 CM | S/15.61 | **S/16.81** | +7.7% |
| margen medio 30 CM | S/19.82 | **S/23.19** | +17.0% |
| margen por sándwich (mezcla 80/20) | S/16.45 | **S/18.09** | **+S/1.64** |

A 600 sándwiches/mes: **+S/982 de margen**.

## 3 · El dato incómodo: el menú nuevo cuesta EXACTAMENTE lo mismo

| | hoy | nuevo v4 |
|---|---|---|
| costo medio de producir un 15 CM | S/5.89 | S/5.92 |
| costo medio de producir un 30 CM | S/10.48 | S/10.54 |

**Todo el margen extra es precio, no ahorro.** De cada sol extra que se cobra quedan 98
céntimos, y eso suena espectacular hasta que se ve por qué: no es que los insumos sean más
baratos, es que el precio sube y el costo se queda igual.

Lo que obliga a preguntar: **subirle S/1.23 al 15 CM y S/3.43 al 30 CM al menú de HOY daría
la misma plata**, sin rehacer seis fotos, seis recetas y seis textos.

La diferencia real no está en ninguna tabla: **está en si el precio se sostiene.** Un Philly
Cheesesteak a S/22.90 no hay que explicarlo — el cliente ya sabe qué es y cuánto vale en otros
lados. «The Smoke» a S/25.13 sí hay que explicarlo, y explicar un precio es perderlo.

**Ese es el argumento honesto del menú nuevo: no produce más barato, permite cobrar más.**

## 4 · Cómo ganamos más — las seis palancas, ordenadas por plata

A 600 sándwiches/mes:

| # | palanca | +S/ al mes | qué cuesta |
|---|---|---|---|
| 1 | **Cambiar el menú entero** (v4 contra hoy) | **+982** | 6 fotos, 6 recetas, 6 textos |
| 2 | **Mover la mezcla de 80/20 a 70/30** | **+383** | ni un céntimo de insumo |
| 3 | **Subir el attach de bebida de 25% a 40%** | **+376** | ni un céntimo de insumo |
| 4 | **Cotizar el embutido del Hoagie aparte** | +189 | una llamada a un proveedor |
| 5 | **Cotizar el empaque en lote** (1.30 → 1.10) | +120 | una llamada a un proveedor |
| 6 | **Upsell "Hazlo Melt" (+S/2)** en Turkey y Hoagie | +77 | una línea en la ficha |
| | **suma** | **+S/2 126/mes** | |

**Las dos palancas que siguen al menú no son del menú.** El 30 CM deja S/6.38 más que el
15 CM; cada diez puntos de mezcla que se muevan hacia el grande valen S/383 al mes sin cambiar
un solo ingrediente. Y la bebida deja S/4.18 de margen medio — subir el attach quince puntos
vale casi lo mismo.

Detalle de las que sí son del menú:

- **El embutido es el único insumo caro que queda.** El Hoagie usa P05 a S/48/kg porque es lo
  que está cotizado. Salami y jamón por separado deberían salir cerca de S/32/kg: eso baja el
  Hoagie de 31.5% a 26.3% y **es la cotización de mayor valor de todo el menú**.
- **El empaque es la única palanca que no toca el producto.** Hoy es el punto medio de un
  rango que nadie cotizó en lote. Veinte céntimos por sándwich, cero riesgo.
- **El "Hazlo Melt" ya está probado en el propio menú**: el Tuna Melt cobra +S/2.00 por
  S/0.39 de queso. Lo mismo aplica al Turkey y al Hoagie sin agregar un solo insumo nuevo.

## 5 · Dónde queda precio sin cobrar

| producto | precio | % de costo |
|---|---|---|
| Meatball Marinara | 21.90 | 20.4% |
| **Philly Cheesesteak** | **22.90** | **23.6%** |
| Tuna Melt | 22.90 | 25.9% |
| Classic Tuna | 20.90 | 26.6% |
| Turkey | 23.90 | 27.7% |
| Italian Hoagie | 23.90 | 31.5% |

**El Philly es el producto más barato de producir del menú y el de nombre más reconocible.**
A S/24.90 queda en 21.7% de costo y deja S/19.49 — dos soles más por sándwich, sin tocar la
receta. Si el Philly va a ser el más vendido (y por nombre lo será), ahí hay más plata que en
cualquier ajuste de gramaje.

El Meatball está aún más barato (20.4%), pero ahí el precio bajo es **a propósito**: es el
producto gancho y el que más margen deja en soles absolutos. No se toca.

## 6 · El doble de proteína: solo dos valen la pena

| doble de | cobra 15 | cuesta | % | cobra 30 | cuesta | % |
|---|---|---|---|---|---|---|
| **Albóndiga** | 6.00 | 1.34 | **22.3%** | 12.00 | 2.68 | **22.3%** |
| **Atún** | 10.90 | 3.25 | **29.8%** | 21.90 | 6.50 | **29.7%** |
| Res laminada | 7.00 | 2.43 | 34.7% | 13.00 | 4.86 | 37.4% |
| Pavo | 9.00 | 3.76 | 41.8% | 17.00 | 7.51 | 44.2% |
| Embutido | 9.90 | 4.29 | 43.3% | 19.90 | 8.59 | 43.2% |

En albóndiga y atún el «hazlo doble» es plata casi limpia. En pavo y embutido está a un par de
puntos del techo: ofrecerlo igual, pero **no empujarlo desde la ficha**.

## 7 · Entonces, ¿el menú nuevo es mucho mejor?

**Mejor sí. Mucho mejor, no — y no por donde parecía.**

Lo que es verdad:
- Deja **+S/1.64 por sándwich** (+10% de margen) y **ninguno de los seis pasa el techo**.
- Saca de la carta los dos productos que hoy están al filo: The Original 30 CM (41.2%) y
  The Smoke 30 CM (40.8%).
- Es casi todo **plancha y ensamblado**. Se van la cocción lenta de la res mechada y la
  marinada de una noche del teriyaki. Para una sola persona armando pedidos eso no aparece en
  ninguna tabla de margen, pero es la diferencia más grande de todas — y además baja la merma
  por tanda, que tampoco aparece en ninguna tabla.
- Deja el catálogo con **menos insumos sin cotizar**, no más: el pavo está cotizado, el atún
  está cotizado, la res está cotizada. Queda la albóndiga (estimada) y el embutido del Hoagie.

Lo que no es verdad:
- **No produce más barato.** Cuesta lo mismo, al céntimo.
- **No es la palanca más grande que tiene el negocio.** Sumadas, la mezcla de tamaño y la
  bebida valen S/759/mes sin cambiar un ingrediente, contra los S/982 de rehacer la carta
  entera. Si hay que elegir el orden, esas dos van primero porque son gratis.

**Recomendación: sí, cámbialo** — pero por el precio que sostiene y por la operación que
simplifica, no por un ahorro de insumos que no existe. Y hazlo **después** de mover la mezcla
y la bebida, que no cuestan nada.

## 8 · Lo que falta antes de escribir una sola línea de esto

1. **Cotizar salami y jamón** (la de mayor valor: S/189/mes).
2. **Cotizar el empaque en lote** (S/120/mes, cero riesgo).
3. **Medir el rendimiento real del laminado en frío.** El 0.70 sigue siendo supuesto. Si sale
   0.55, el Philly 15 CM pasa de 23.6% a 27.9% — soportable, pero conviene saberlo.
4. **Cotizar la carne molida de la albóndiga**, que es el producto más rentable del menú y el
   único cuyo costo sigue siendo un estimado sin proveedor.
5. Y lo de siempre: **esto termina en `catalog_items` y `catalog_prices`, o no existe.**
   Cambiar el precio en el código no cambia el precio real.
