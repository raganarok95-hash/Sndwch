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
| — | **El menú secreto** | «Aprobada, pero como que le falta algo» | se proponen tres formas de completarla |
| — | **Tarjeta de regalo** | «Regalo C me gusta… y ya estamos» | la tarjeta muestra comida bajo el velo de los dos colores, con el logo arriba a la derecha |

### Mundos y entrada — aprobadas antes, pendientes de re-confirmar

Estas se aprobaron en rondas anteriores, pero su captura quedó entre decenas de
versiones intermedias y **no puedo garantizar cuál es la versión exacta aprobada**. No
se dan por cerradas hasta que el dueño las vuelva a ver:

- **Entrada / acceso con correo y Google** — «ambas pantallas van aprobadas».
- **Mundo SANDO** (home del lado dorado, con el menú secreto) — «Queda de esa forma».
- **Mundo WICHO** (home del lado celeste) — «queda wicho solo falta imagenes».

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

## Sin diseñar todavía

Ninguna de estas se ha mostrado nunca. **No asumir que existen.**

- Bebidas (los dos lados) — la única rechazada que además sigue sin reemplazo
- Ficha de Signature, versión WICHO
- Detalle de un pedido pasado
- Perfil y datos de la cuenta
- Favoritos / pedido fijo
- Estados vacíos (sin pedidos, sin direcciones, sin favoritos)
- Textos legales (Términos, Privacidad, Cambios y Devoluciones)
- Menú secreto: la pantalla del propio SIG05 una vez desbloqueado
