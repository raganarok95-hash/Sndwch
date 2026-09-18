# Estado real de cada pantalla del cliente (rediseño desde cero)

Este archivo existe para que **no haya que acordarse de nada**. Cada pantalla del
rediseño aparece acá con su estado textual y, cuando está aprobada, con la frase exacta
con la que el dueño la aprobó. Si una pantalla no está en esta lista, **no está
aprobada** — aunque se haya mostrado alguna vez.

Se actualiza **en la misma sesión** en que el dueño aprueba o rechaza algo. Una
aprobación que solo vive en el chat se pierde cuando se corta el contexto, y entonces la
siguiente sesión vuelve a preguntar lo mismo o —peor— asume.

Regla: **nada de esto está programado todavía.** Todo vive como maqueta. El código del
cliente (`src/app/*`) no se toca hasta que el dueño lo autorice explícitamente.

---

## Aprobadas

| # | pantalla | con qué palabras quedó | nota pendiente |
|---|---|---|---|
| 01 | **Ficha de un Signature** (mundo SANDO) | «La pantalla de la ficha, me agrada para sando» | **falta la versión de WICHO** |
| 06 | **Pedido enviado** — "Ya está en la cocina" | «Pedido ya está en la cocina, esa pantalla bien» | «hay que mejorar la imagen de sando» — hoy su figura tapa las filas de PEDIDO y LLEGA |
| 23 | **La comanda** (pantalla de cocina) | «La comanda me gusta» | — |
| 29 | **Tus puntos** — el hermano ES el estado | «Ok listo esa queda» | las tres poses de estado todavía no existen como imagen |
| 32 | **En camino** | «22, aprobada» — confirmado por el dueño que se refería a la 32 | — |
| 35 | **Algo salió mal** (reclamo) | «25 también» — confirmado que se refería a la 35 | — |
| 30 | **El carrito** — papel de estraza | «Me encantó la pantalla 30 G» | falta la franja de los rostros que asoman |
| 31 | **El pago con tarjeta** — el traspaso | «las instrucciones de la tarjeta igual, están bien» | resuelta: lleva el pulgar de SANDO |
| — | **Pedido grupal** | «El pedido grupal, hermoso. Queda» | lleva el logo arriba y en marca de agua |
| — | **Plan semanal** | «Plan semanal muy bien» | — |
| — | **Tu cuenta** | «Pantalla de tu cuenta, se aprueba» | — |
| — | **Estado vacío** (el patrón) | «aprobada, pero sin logo» | **esta va sin logo** |
| — | **Ficha de Signature · versión WICHO** | «Ficha versión wicho, aprobada» | — |
| — | **Detalle de un pedido** | «me agradan, aprobadas» | — |
| — | **Tu pedido fijo** | «me agradan, aprobadas» | — |
| — | **Lo legal** | «me agradan, aprobadas» | las fechas y los datos fiscales los pone el dueño |
| 34 | **Dónde te lo dejamos** (etiquetas de bolsa) | «34 y bebidas de wicho aprobadas» | — |
| — | **Bebidas · lado WICHO** (tres franjas a sangre) | ídem | — |
| — | **Mundo WICHO** | «M22 wicho aprobada» | captura `M22-wicho` |
| — | **Mundo SANDO** | «m15 sando» | captura `M15-sando-plato` |
| — | **La puerta** (la cara partida) | «m2 puerta» | captura `M2-puerta` |
| — | **El menú secreto** | estructura: «perfecta»; fondo: «Secret 3 me gusta» | cerrada — ver abajo |
| — | **Tus pedidos** (la grilla de sellos) | «Tus pedidos me suena bien» | tercer intento: lista → pincho → sellos |
| — | **Tarjeta de regalo** | «Regalo C me gusta… y ya estamos» | la tarjeta muestra comida bajo el velo de los dos colores, con el logo arriba a la derecha |

### Las tres dudosas quedaron identificadas (2026-09-18)

Se le mostró al dueño una hoja de contacto con las veinte capturas intermedias y señaló
cuáles eran: **`M22-wicho`**, **`M15-sando-plato`** y **`M2-puerta`**. Las demás quedan
descartadas. **La pantalla de entrada con correo y Google no apareció en ninguna captura**
— hay que diseñarla de nuevo, no adivinarla.

---

## Rechazadas (y por qué, en las palabras del dueño)

| # | pantalla | motivo |
|---|---|---|
| 02 / 03 | Bebidas · SANDO y · WICHO | «Las bebidas, no me gustan para nada» |
| 04 / 05 | Carrito y Pago (1ra vuelta) | «¿por qué usaste el molde de sando para todo aún en pantallas que no le pertenecen?» |
| 08–15 | Carrito / Pago / Puntos, vueltas 2 y 3 | «todo está muy cuadriculado»; «sigues con la misma lógica» |
| 16–19 | La bolsa · La confirmación · El premio · El objeto | «Sigue con esas pantallas rediseñalas ninguna me gustó» (sobrevivió solo la confirmación) |
| 20 / 21 / 22 | La hoja · Manda el mapa · La escalera | «La comanda me gusta. Las demás a rehacer» |
| 24 | El deslizador | «Deslizador no va» |
| 25 | La cuenta en la mano | «La 25 no va es horrible» |
| 26 | Elige tu meta | **el contenido se conserva** («me encanta el contenido no quisiera cambiarlo»), el diseño no: «la parte de abajo es otra vez un recolor» → rehecha como la 29 |
| 27 | La bolsa | «La bolsa, horrible» |
| 28 | La cartilla | «la cartilla la odié» |
| 31 | El pago (versión con SANDO al lado) | «es un reeskin con personaje» |
| 34 | Dónde te lo dejamos | «no me convence» |

### 33 · Tus pedidos — mitad aprobada

- **Arriba sí**: el último pedido en foto grande + el botón *Pedir lo mismo*.
- **Abajo no**: «la lista ya no me gusta solo repetiste pantalla».

### Cómo se llegó al carrito aprobado

Costó seis rondas y la lección quedó: **mezclar dos pantallas que gustaron da algo tibio.**
La versión 30D promediaba el fondo de una con el bloque de otra y el dueño la rechazó
entera («perdiste la creatividad al intentar mezclarlo»). Lo que sí funcionó fue quedarse
con **la base que tiene carácter propio** —el papel de estraza, que es el material real del
envoltorio— y traerle una sola pieza de la otra: el titular estampado. Promediar no es
combinar.

### 31 · El pago con Yape — sigue pendiente

El código de Yape es **obligatorio** en esa pantalla («sí es necesario el código de yape»).
La versión con el visor sobre morado gustó («me encantó»), con una corrección aplicada: al
elegir tarjeta **cambia la pantalla entera**, porque el morado es de Yape.

### ⚠ El recargo por tarjeta estaba mal escrito en las maquetas

Las maquetas decían «+S/2.79», que es el 5.5% del total. **Falso.** El código no recarga el
total: recupera la comisión de Culqi **engordando solo la tarifa de envío**
(`feeBase/(1-CULQI_FEE_RATE)`). Con envío de S/7.00 el extra real es **S/0.41**, y sin envío
no hay extra. Es exactamente el defecto que CLAUDE.md ya prohíbe: una cifra escrita a mano
en un texto para el cliente. Cualquier pantalla que lo mencione tiene que **derivarlo**.

---

## ⚠ Las pantallas que no son de un hermano necesitan sistema propio (2026-09-18)

Error de raíz, detectado por el dueño: yo estaba usando **el sistema de SANDO** —crema,
verde profundo, naranja— como si fuera el sistema neutral de la app. **No lo es: es el
de SANDO.** Por eso el carrito y el pago le parecían «el estilo de sando repetido», y
por eso antes había dicho «¿por qué usaste el molde de sando para todo aún en pantallas
que no le pertenecen?».

Regla: **carrito, pago, pedidos, direcciones, reclamo y cualquier pantalla que no
pertenezca a un hermano llevan un tratamiento propio, hecho de los dos.** Los hermanos
entran como acento —dorado `#CBA258` y celeste `#8CC8EC`, siempre los dos juntos, nunca
uno solo— y el «//» aparece con una barra de cada color. Nunca el crema de SANDO ni el
celeste de pelaje de WICHO como fondo.

---

## EL LOGO TIENE TRES FORMAS, Y NO VA EN TODAS (2026-09-18)

El dueño lo pidió así: **«para las capturas de pantalla siempre salga el logo»**. Un cliente
que comparte la captura de su pedido está repartiendo publicidad gratis, y hasta hoy esa
captura no decía de quién era.

⚠ **Pero no es en todas.** Al aprobar el estado vacío lo acotó: «sin logo, no necesitas
ponerlo siempre». Va donde suma; una pantalla que ya respira apretada no lo necesita.

**Las tres formas, las tres válidas:**

1. **El isotipo** — la cara partida SANDO/WICHO mordiendo el sándwich:
   `img/marca/avatar-1024-transparente.png`, ya en el repo recortado y reescalado.
2. **El wordmark** — `SND//WCH` con el par de barras. Las dos conservan su especificación
   exacta (`width:.10em; height:.88em; skewX(-16deg); gap:.16em`, idénticas entre sí) y su
   bicolor: una barra por hermano.
3. **El conjunto** — isotipo + wordmark uno al lado del otro. Es el que llevan el pedido
   grupal y la tarjeta de regalo.

Cuando se usa, va **arriba a la derecha**, chico y sin competir con el contenido.

**Sobre fondo claro el par de barras cambia de tono, no de identidad**: `#A8791E` y
`#2E7FA8` en vez de `#CBA258` y `#8CC8EC`, por la misma razón por la que el panel admin
tiene su propio par — el celeste del cliente sobre papel claro no se ve.

Donde la pantalla tenga sitio de sobra, además puede ir **grande y en marca de agua**: el
pedido grupal lo tiene así en el hueco entre la lista y la cuenta, que es espacio muerto
porque ahí es donde van entrando los que faltan.

⚠ **Al meter el isotipo dentro de una tarjeta con foto de fondo, ojo con el selector.** La
regla `card img{width:100%;height:100%}` de la foto también capturaba al logo y lo hacía
ocupar la tarjeta entera. Se arregló dándole clase propia a la foto. Lo mismo pasó con la
clase `.tx`, compartida sin querer entre el wordmark y el bloque de texto del estado vacío:
el logo se iba fuera de la pantalla. **Ninguna de las dos lanza error: solo se ven mal.**

### Cómo quedó el menú secreto, y las nueve que se descartaron

La estructura se cerró rápido: **las tres pistas del mes arriba** (cómo pega, nunca qué
lleva) y **los que ya no vuelven abajo**, con el contador de días al costado del nombre.
Eso el dueño lo aprobó como «perfecta».

El fondo costó **nueve intentos**, y el patrón del fracaso vale más que las pantallas:
las seis primeras eran **maneras de pintar** —acentos chicos, color de fondo pleno, corte
en diagonal, color en las reglas, degradado vertical, textura de los dos hermanos— y todas
se rechazaron. Las tres siguientes ya eran **conceptos** —la espiral de WICHO por cálculo,
bloques de color por sabor, aurora— y también.

Ganó el décimo: **un macro tan cerrado de la foto del sándwich que no se reconoce nada,
pero el color y la textura de la comida están enteros.** Ni desenfoque ni censura: acercarse
tanto que deja de ser información y pasa a ser apetito.

**Y se renueva sola**: la foto ampliada es la del secreto del mes, así que el color de la
pantalla cambia cada vez que el dueño publica uno nuevo, sin tocar una línea.

Lo que hay que recordar de esas nueve rondas: **cuando el dueño pide "más color", casi
nunca está pidiendo otra paleta — está pidiendo que el color venga de algún lado.** Mientras
el color fue una decisión de diseño, no funcionó ni una vez.

## ⚠ EL MENÚ SECRETO NO SE LLAMA "THE VAULT" Y ROTA CADA MES (2026-09-18)

Defecto real cometido en la maqueta de esa pantalla, cazado antes de mostrarla dos veces:

- Escribí **"THE VAULT"** como nombre. Ese nombre **se retiró el 2026-08-10**. El nombre
  vigente vive en `secret_signature.name` y llega a `SECRET_SIGNATURE_NAME`, porque **el
  dueño lo publica desde el panel cada vez que cambia el sándwich**. Un literal se
  desincroniza el primer mes.
- Escribí **"cambia cada semana"** y **"se va en 4 días"**. La rotación es **MENSUAL**
  (decisión del dueño, 2026-08-10, en `docs/FUNCIONALIDADES.md`).

Es exactamente la trampa que CLAUDE.md ya describe: un nombre y una cifra escritos a mano en
un texto que lee el cliente. **Los dos tienen que derivarse**, nunca afirmarse.

## Lo que falta para cerrar la fase de diseño

**Ninguna pantalla del recorrido del cliente quedó sin diseñar.** Lo que falta es
decidir, no dibujar:

### A rediseñar (rechazadas)
- **Bebidas · lado SANDO** — van **dos** rechazos: la que iba junto al sándwich con el
  precio en combo, y la carta tipográfica con el vaso al costado. El lado WICHO sí quedó,
  así que la de SANDO no puede ser su reflejo — necesita su propia manera de elegir.
- **Entrar** — el primer intento (un campo de correo, Google y los tres pasos de después)
  también se cae. Va de nuevo.

**Tus pedidos SÍ cerró**, al tercer intento: lista → pincho → **sellos**. Lo que siempre
estuvo bien era el hero de arriba con *Pedir lo mismo*; lo que fallaba era cómo mostrar los
viejos.

### Esperan imágenes del dueño
- Las tres **poses de estado** de la pantalla 29 (lejos / cerca / logrado) por hermano.
- `sando_asoma` y `wicho_asoma`, y las dos manos, **en PNG con alfa real**: los que hay se
  reconstruyeron desde `.jpg` y los bordes quedaron duros.

### Aprobadas antes, pero sin poder señalar cuál versión
- **Entrada / acceso** con correo y Google, **mundo SANDO** y **mundo WICHO**. Se
  aprobaron en rondas anteriores, pero su captura quedó entre decenas de intermedias.
  **No se dan por cerradas hasta que el dueño las vuelva a ver.**

### La deuda que deja el SANDO nuevo
Los `img/sando_*.png` viejos siguen referenciados por el cliente. Cambiarlos a `sando2_*`
es una tarea aparte **y tiene que hacerse completa**: un SANDO nuevo junto a uno viejo en
dos pantallas distintas se ve peor que dejar todo viejo.

⚠ **El logo queda FUERA de esa migración.** Decisión del dueño: «Ese logo no se cambia, ya
está aprobado. Su rostro no cambió.» Aplica a `img/marca/avatar-*`, a `logo-hermanos.png`
y a **la pantalla de la puerta**, que usa esa ilustración a pantalla completa. No hay nada
que corregir ahí.
