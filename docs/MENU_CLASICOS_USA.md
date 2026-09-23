# El menú de clásicos de USA — viabilidad, costos y precios

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
