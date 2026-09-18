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

### 30 · El carrito — mecanismo elegido, falta la piel

De las tres opciones ganó el mecanismo de **30A · El mostrador** («me agrada la idea»):
lo último que agregaste manda en foto grande y el resto se desliza en carrusel.
Pendiente: **el color** («se me hacen los colores feos»).

### 31 · El pago — funcionamiento elegido, falta la piel

**31A** quedó bien de funcionamiento («me agrada como pienso que funciona») y mal de
diseño: «el estilo es el de sando repetido». El **código de Yape es obligatorio** en la
pantalla («sí es necesario el código de yape»), pero la ejecución de 31B estaba mal
hecha y se descartó.

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

## Sin diseñar todavía

Ninguna de estas se ha mostrado nunca. **No asumir que existen.**

- Bebidas (los dos lados) — la única rechazada que además sigue sin reemplazo
- Ficha de Signature, versión WICHO
- Pedido grupal
- Tarjeta de regalo
- Plan Semanal
- Detalle de un pedido pasado
- Perfil y datos de la cuenta
- Favoritos / pedido fijo
- Estados vacíos (sin pedidos, sin direcciones, sin favoritos)
- Textos legales (Términos, Privacidad, Cambios y Devoluciones)
- Menú secreto: la pantalla del propio SIG05 una vez desbloqueado
