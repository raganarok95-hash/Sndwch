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
