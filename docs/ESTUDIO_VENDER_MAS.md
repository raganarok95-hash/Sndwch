# Cómo vender más sin depender de la publicidad

Fecha: 2026-09-12. **Todo lo de acá está medido** — renderizando las pantallas reales o
corriendo `modelo/rentabilidad_por_parte.py` contra los precios de la base. Donde hay un
supuesto, lo digo.

La pregunta de fondo: *el negocio no puede depender de comprar clientes.* El CAC pagado más
bajo medido es **S/17.87** y el referido cuesta **S/7.65** — menos de la mitad. Pero el
referido no es gratis: depende de que el cliente vuelva, y para eso el pedido tiene que salir
bien y la app no puede perder gente por el camino.

Por eso el orden de este documento es el del embudo, no el del entusiasmo: **primero dejar de
perder, después vender más a quien ya está, y recién al final traer gente nueva.**

---

## 1 · Dejar de perder — lo que ya cuesta plata hoy

### 1.1 ⚠ El recibo mostraba S/8 que no salían de ninguna línea (CORREGIDO)

En pago rápido, el papel decía:

```
Signature   S/20.90 · The Original
Tamaño      15CM
TOTAL       S/28.90
```

**El 38% de más no estaba explicado en ninguna parte.** `payableTotal()` suma
`deliveryFeeAmount()` y el recibo no tenía línea de envío. Es la primera pantalla donde el
cliente ve un precio.

La evidencia externa es directa: **los costos inesperados son la causa nº1 de abandono de
carrito (39%)**. Acá ni siquiera aparecían al final — aparecían arriba y sin nombre.

Y el defecto era doble: **el recibo del CARRITO sí trae su línea de «Envío»**, así que los dos
papeles que el mismo cliente ve seguidos armaban el total de forma distinta. El comentario de
`PAPEL_ABRE` dice textualmente que eso no puede pasar: *«si la cuenta cambia de forma entre
una y otra, se revisa dos veces»*.

Ya está corregido, con el mismo texto y el mismo criterio que el recibo del carrito —incluido
el «se calcula con tu dirección» en gris cuando todavía no hay dirección, porque sin esa línea
el cliente no sabe si el envío ya está contado o falta sumarlo.

### 1.2 El botón principal aparece antes de que se pueda usar

En el checkout de pago rápido, la barra fija dice **«Ya realicé el pago //»** desde el primer
scroll — y está en la posición 10 de 23 bloques. Todo lo que hace falta para pedir (nombre,
teléfono, dirección, distrito, método de pago) está **debajo**.

No propongo esconderlo: la barra fija con el total es correcta. Lo que hay que decidir es qué
dice ese botón **antes** de que el pedido esté completo. Hoy promete una acción que todavía no
se puede hacer.

### 1.3 El checkout mide 3,5 pantallas

2 966 px en un viewport de 844. No es escandaloso para un checkout de invitado —hay 6 campos y
todos hacen falta— pero sí conviene saber que el QR de Yape y el número de cuenta se pintan
**siempre**, aunque el cliente todavía no eligió método. Es el bloque más alto de la pantalla.

---

## 2 · El menú — lo más rentable no es lo más visible

Los cinco Signatures, en el orden en que se muestran, contra lo que deja cada uno en 15CM
(que es ~80% del negocio):

| se muestra | Signature | precio | deja | costo % | puesto real |
|---|---|---|---|---|---|
| **1º + ⭐ recomendado** | The Original | 20.90 | S/14.70 | 29.7% | **4º de 5** |
| 2º | **The Marinara** | 21.90 | **S/17.43** | **20.4%** | **1º** |
| 3º | The Smoke | 23.90 | S/16.14 | 32.5% | 2º |
| 4º | The Fresh | 20.90 | S/15.35 | 26.6% | 3º |
| 5º | The Teriyaki | 19.90 | S/14.43 | 27.5% | 5º |

**La diferencia entre el primero de la lista y el más rentable es S/2.73 por pedido.** A 20
pedidos diarios son ~S/1 640 al mes, sin adquirir a un solo cliente más.

**The Marinara es el producto más rentable del catálogo entero**: 20.4% de costo contra un
techo de 45%, porque la albóndiga es la proteína más barata (S/1.34 la porción) y el plato se
vende a S/21.90.

> ### ✅ HECHO el 2026-09-12 — y apareció algo peor de lo que este estudio había visto
>
> Se movió el ⭐ a **The Marinara** y se reordenó la lista. Pero al abrir el código para
> hacerlo, el orden del home resultó estar **mal anclado**, no solo desordenado:
> `SIG_HOME_ORDER` decía explícitamente ordenar por margen y se justificaba con números de
> **antes del recosteo con merma y de la subida de precios del 2026-08-22** — su comentario
> hablaba de *«SIG03 68% y SIG04 49% bruto»*, contra 32.5% y 26.6% reales. Con esos valores
> muertos ponía al **cuarto y al quinto** en contribución en las dos posiciones más miradas
> de la lista, y mandaba los dos mejores al final. Hacía lo contrario de lo que decía hacer.
>
> Orden nuevo, por **contribución en soles a 15CM** (el negocio deposita soles, no
> porcentajes; y el 15CM es el 80% del negocio):
> `SIG02 S/17.43 · SIG03 S/16.14 · SIG04 S/15.35 · SIG01 S/14.70 · SIG06 S/14.43`.
>
> Además, «Recomendado» era un sufijo de 11px en itálica del mismo color y tamaño que el
> badge de al lado: la recomendación existía en el código y no en la pantalla. Ahora es un
> sello con fondo propio.
>
> `tests/estrella-del-menu.spec.ts` (3) fija que los **tres** mecanismos que empujan un
> Signature —la bandera `recommended`, el orden de la lista y el puente desde ARMA EL TUYO—
> apunten al MISMO producto. Verificado inyectando los tres defectos por separado.

**Los dos motivos que este estudio dio para no reordenar, revisados:**

1. **«The Original es el ancla de la carta»** — su pitch decía *«el primero de la carta y el
   que manda la receta… empieza por acá»*. Al reescribir los pitches (§2.1) ese cierre se
   conservó (*«si es tu primera vez acá, empieza por este»*): **sigue siendo el punto de
   entrada, sin ocupar la primera fila.** El argumento era real y la solución no era elegir
   entre los dos.
2. **«No hay ni un dato de ventas»** — sigue en pie y no se resolvió. Ordenar por margen es
   lo único posible hoy; el orden correcto es **margen × popularidad** (Kasavana & Smith) y
   la popularidad se mide después de abrir. Está anotado en el propio código: un Signature
   que se venda el triple puede merecer la primera fila aunque deje S/1 menos.

**Recomendar The Marinara no es empujar al cliente hacia lo caro**: es el único producto que
gana en las dos dimensiones medibles hoy —el margen más alto y el precio casi más bajo— así
que lo empuja hacia lo que a él le sale barato y al negocio le deja más.

### 2.1 Los pitches: dos problemas concretos

Leídos los seis, hay un patrón: **cuatro de cinco terminan hablando del NEGOCIO, no del
cliente.**

| Signature | cómo cierra | qué le dice al cliente |
|---|---|---|
| The Original | *«Empieza por acá»* | ✅ le dice qué hacer |
| The Marinara | *«El clásico de toda la vida, hecho como se debe»* | habla de la receta |
| The Smoke | *«Nuestro build más premium»* | habla del catálogo |
| The Fresh | *«así es como se hace en Estados Unidos»* | habla de la receta |
| The Teriyaki | *«El sabor asiático que le faltaba al menú»* | **habla del MENÚ** |

*«El sabor asiático que le faltaba al menú»* es el caso más claro: al cliente no le falta nada
en tu menú — le falta almorzar. Ese cierre describe un hueco de tu catálogo, no un antojo suyo.

**El segundo problema es que ningún pitch dice CUÁNDO comerlo.** El repo ya adoptó el marco de
ocasiones para el calendario de marketing —*«nadie compra The Original: compra almuerzo de
oficina o antojo de noche»*— y esa misma idea no llegó a la carta, que es donde se decide.

> ### ✅ HECHO el 2026-09-12 — los cinco, publicados en la base
>
> Cada pitch nombra ahora **un momento**, no una receta:
>
> | Signature | la ocasión que nombra |
> |---|---|
> | The Original | *el almuerzo que tiene que aguantar hasta la noche* |
> | The Marinara | *la noche en que ya decidiste que no vas a cocinar* |
> | The Smoke | *el viernes, cuando el día se acabó y te lo estás cobrando* |
> | The Fresh | *comer en el escritorio con una mano* |
> | The Teriyaki | *cuando ya te aburriste de lo de siempre* |
>
> Se publicaron en `catalog_items` (append-only, migración `20260912204541`), **no solo en
> el literal del código**, que es semilla: un cambio que se queda en el código no cambia la
> carta. Las recetas, precios y quesos se copiaron de la fila vigente con un `SELECT` en vez
> de reescribirse a mano, para que ningún campo se pierda en silencio al republicar.
>
> **Ninguno hace una afirmación comparativa ni de precio, a propósito.** *«El más caro de la
> carta»* o *«el único sin toppings»* son ciertos hoy y falsos el día que el dueño mueva otra
> fila desde el panel, sin que nada avise — la misma trampa que los números escritos a mano
> en el contenido de marketing. Todo lo que afirman es sobre sí mismos.
>
> **Y apareció un badge falso**: THE FRESH decía **«Cítrico»** con una receta de atún,
> mayonesa y pimienta — **cero cítrico**. Era honesto cuando la receta llevaba dijon y limón
> (S11) y dejó de serlo el 2026-09-05, cuando el dueño la reescribió: el pitch se actualizó,
> el badge no. Pasa a **«Sin vueltas»**. Es la regla de los números escritos a mano aplicada
> a los rótulos de sabor: si la receta se mueve, el badge se revisa en la misma operación.
> Reversible desde Admin // Catálogo en un toque.

### 2.2 Dónde está el margen que no se está cobrando

Medido, no estimado:

- **Los Signatures tienen 18 puntos de holgura** contra el techo (promedian 27% en 15CM). Eso
  NO dice «sube precios»: dice que **cada Signature vendido en lugar de un armado deja ~S/5.50
  más**, y que la palanca es la mezcla.
- **La bebida es lo más barato que puedes vender.** The Cool deja **S/4.83 sobre S/6** (19.5%
  de costo). Subir el *attach* del 25% al 40% vale ~S/0.48 por pedido sin adquirir a nadie.
- **El combo sale del producto equivocado.** El −S/1 se descuenta del precio de la BEBIDA, que
  la manda de 19–31% a 23–38% de costo. Moverlo al sándwich —que tiene 18 puntos de holgura—
  es invisible para el cliente y te devuelve esos puntos. **Es la mejora de margen más barata
  que queda pendiente.**
- **El doble de proteína es el upsell más rentable y el menos visible.** Albóndiga doble: 22.3%
  de costo. Atún doble: 29.8%. Hoy aparece como una tarjeta más entre los extras.

---

## 3 · Vender más a quien ya está

Ordenado por lo que cada uno vale, no por lo que cuesta hacerlo.

### 3.1 El referido es el único canal más barato que la publicidad

**S/7.65 contra S/17.87.** El modelo v12 dice que es *la ÚNICA palanca que convierte «no llega
nunca» en «sostiene desde feb-27»*. Ya se empujó: la invitación aparece en los tres estados de
un pedido entregado, debajo de la calificación.

Lo que **no** está hecho y vale más que cualquier ajuste de pantalla: **el QR de la bolsa**
(`?grupo=1`). Es promoción pasiva dentro de un pedido que ya entregaste, no exige trabajo de
venta, y abre un pedido grupal — que trae más sándwiches por pedido. **Hoy el código existe y
la tarjeta física no.** Es imprimir un papel.

### 3.2 El pedido grupal sube el ticket sin subir el CAC

No es B2B y nadie sale a conseguir oficinas. Es **el mismo cliente comprando para varios**, y
llega por la app como cualquier otro pedido. Lo que cambia es que reparte el costo de
adquisición entre más gente alcanzada. Ya tiene incentivo propio: a partir de 5 sándwiches, el
15CM más barato va gratis.

### 3.3 Google Business Profile: gratis, y no pasa por la subasta

+1 estrella = **+5–9% de ingresos**, causal y medido específicamente en independientes. No baja
el CPM: trae pedidos que nunca pasan por Meta. `docs/` ya tiene el perfil listo para pegar.

---

## 4 · Lo que decide más que todo lo anterior, y sigue sin medirse

**El CAC real.** El S/17.87 sale de blogs de agencia (CPM S/5-12 + CTR 2.97% + CVR 1.89% +
IGV), no de medición propia, y **todo el modelo cuelga de él**. La aritmética:

```
CAC = CPM / (1000 × CTR × CVR) × 1.18
```

El CAC es **inversamente proporcional al CVR**, y el CVR es **la única de las tres variables
que el negocio controla** — las otras dos las fija la subasta de Meta. Duplicar la conversión
de la app lleva el CAC a **S/8.94**, que es justo el umbral donde la meta del mes 6 deja de ser
imposible.

Por eso el punto 1 de este documento no es cosmética: **cada punto de conversión vale más que
un sol de publicidad.**

Se mide poniendo los tres secrets de Meta. Es el bloqueo número uno del negocio.

---

## 5 · Qué haría yo, en orden

| # | qué | cuánto vale | quién decide |
|---|---|---|---|
| 1 | ~~Línea de envío en el recibo~~ | abandono nº1 | **hecho** |
| 2 | Secrets de Meta | desbloquea medir todo lo demás | dueño |
| 3 | Mover el combo al sándwich | ~4-8 puntos de margen en cada bebida | dueño |
| 4 | ⭐ recomendado a The Marinara | ~S/2.73 por pedido | dueño |
| 5 | Imprimir la tarjeta QR de la bolsa | referidos, el canal más barato | dueño |
| 6 | Google Business Profile | +5–9% de ingresos, gratis | dueño |
| 7 | Reescribir los 5 pitches por ocasión | conversión en la carta | dueño aprueba, yo redacto |
| 8 | Qué dice el botón antes de poder pagar | conversión en el checkout | dueño |

**Nada de esto depende de gastar más en publicidad.** Los puntos 3, 4 y 7 no cuestan un sol.
