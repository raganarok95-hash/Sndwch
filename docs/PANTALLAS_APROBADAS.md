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
| 32 | **En camino** | «22, aprobada» *(ver duda abajo)* | — |
| 35 | **Algo salió mal** (reclamo) | «25 también» *(ver duda abajo)* | — |

**⚠ Duda abierta, sin asumir:** el mensaje decía literalmente «22, aprobada y 25 también»
y llegó respondiendo al lote de las pantallas 30–35. Las únicas dos de ese lote que no
recibieron comentario en el mismo mensaje son la **32** y la **35**, así que se
interpretó que faltó el 3 al tipear. **Las pantallas 22 y 25 originales están
rechazadas** («la 25 no va es horrible»), así que si de verdad se referían a esas, hay
que corregir esta tabla.

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

### 30 · El carrito — en elección

La primera versión quedó como «puede ser»; el dueño pidió **más opciones**. Hay tres
propuestas nuevas sin decidir: *El mostrador*, *El cartel* y *La cuadrícula*.

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
