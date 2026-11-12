# Las herramientas propias: cuáles se usan, cómo se dan a conocer y cómo se miden (2026-11-12)

Ezra, 2026-11-12: «de todas las herramientas que tenemos nadie las conoce, hay que analizarlas y ver cuáles podemos
usar, medir y estudiar cómo usarlas y cómo nos potenciaría». Lista completa: `HERRAMIENTAS_NATIVAS.md`.
Cifras del código (`docs/hechos/REGLAS.md`); en una pieza se interpolan, nunca se escriben a mano.

**Sin datos propios todavía** (no hemos abierto): todo lo de abajo es una hipótesis que se mide desde el 20. Donde
hay un dato externo, va con su fuente; donde no, se dice.

## La regla para elegir

Una herramienta se comunica si cumple las tres: (1) le da algo al cliente que entiende en una frase, (2) no le cuesta
trabajo extra a la cocina ni a Ezra, (3) se puede medir con lo que ya registra la app. Se da a conocer **una por
pieza**, nunca todas juntas: un post con cinco beneficios no se recuerda.

## Prioridad 1: se dan a conocer desde la apertura

| herramienta | qué le ofrece al cliente (una frase) | por qué nos potencia | cómo se mide | cuándo se muestra |
|---|---|---|---|---|
| **Referidos** | «Invita a alguien: él gana una bebida, tú un sándwich» (puntos que valen eso) | sin pauta, es el único canal de adquisición junto con Meta (`FUNCIONALIDADES.md`); el referido cuesta menos que un cliente de Meta (`modelo/FUENTES.md`: S/7.65 contra S/10.51–25.23) | referidos con primer pedido por semana; % de clientes que invitan | después de cada primer pedido (pantalla de gracias) + 1 historia fija semanal + post de la semana 2 |
| **Pedido grupal** | «Pide para la oficina: desde 5 sándwiches, el más barato va gratis» | más sándwiches en un solo pedido y un solo envío: sube la ganancia por pedido | pedidos grupales por semana y sándwiches por grupo | reel de la semana del 23 + el QR de la bolsa |
| **Menú secreto a los 3 pedidos** | «Hay un sándwich que no está en la carta. Se abre a tu tercer pedido» (sin decir cuál) | da una razón para el 2.º y 3.er pedido: la recompra es lo que más pesa en la meta | % de clientes que llegan a 3 pedidos en 30 días | historia del 22 y post de la semana 2; nunca se revela qué es |
| **Combo con bebida** | «Con bebida, S/1 menos» | sube el ticket con una bebida de margen alto | % de pedidos con bebida | ya está en la app; 1 historia el día de apertura |

## Prioridad 2: funcionan solas; solo hay que confirmar que están prendidas y medir

| herramienta | qué hace | cómo se mide | qué falta |
|---|---|---|---|
| Avisos push (carrito y pago sin terminar, segundo pedido, quien nunca pidió, quien dejó de pedir, resumen del mes) | recuperan pedidos sin pauta | % de clientes que aceptan avisos; pedidos que llegan dentro de 24 h de un aviso | ver con Automatizaciones que todos los crons estén activos el 20 |
| Cumpleaños | regalo en su día | pedidos con el bono de cumpleaños | pedir la fecha al registrarse ya existe |
| Puntos y bono de bienvenida | dan una razón para crear cuenta | % de pedidos con cuenta | se nombran en la pantalla de gracias, no en redes |
| «Avísame cuando vuelva» | recupera al que encontró agotado | avisos enviados contra pedidos después | nada |

## Prioridad 3: después de la semana 3

- **Embajadores pagados por resultado**: encaja con los creadores de comida que Ezra quiere 3 a 4 semanas después de
  abrir. Cada uno con su enlace `?src=emb-<codigo>`; se paga solo por primer y segundo pedido traídos.
- **Retos del mes y de descubrimiento** y **rangos**: refuerzan a quien ya pide; se comunican dentro de la app.
- **QR de las latas**: cuando existan las latas.

## No se comunican en la apertura

- Plan semanal y tarjeta de regalo (existen, la apertura no los ofrece).
- La bebida gratis de hora valle (retirada: no se nombra).
- Regalar saldo: sirve poco sin clientes con saldo.

## Cómo se estudia

Cada domingo, `datos-semana.yml` ya escribe pedidos por origen. Se le suman 4 números: referidos con primer pedido,
pedidos grupales, % que llega al tercer pedido y % de pedidos con bebida. A las 4 semanas se compara cada herramienta
contra lo que costó (puntos regalados, sándwich gratis) y se decide cuál se empuja más. Si una no mueve nada en 4
semanas, se deja de comunicar.

## Lo que se agrega al calendario

- 20-nov: historia del combo.
- 22-nov: historia del menú secreto («se abre a tu tercer pedido»).
- Semana del 23: un reel del pedido grupal y un post de referidos; historia fija semanal de referidos.

## Lo que agregó Crecimiento (2026-11-12, hilo «Aprovechar las herramientas de retención y marketing»)

**Dónde estamos hoy (base real, 12-nov):** 2 cuentas, 3 celulares con avisos (los de Ezra), 0 referidos, 0 pedidos
grupales, 0 pedidos fijos, 0 canjes de DIRECTO y de BIENVENIDA. Todo arranca en cero el 20: no hay nada que comparar
todavía, y por eso la medición tenía que quedar lista antes.

**La medición ya es código, no una tarea a mano.** `scripts/datos/resumen.mjs` (lo corre `datos-semana.yml` cada
domingo) suma un bloque `herramientas` al `DATOS-base.json` de la semana, con prueba en
`tests-api/datos-de-la-semana.test.ts` (vista fallar):

| número | qué herramienta mide | la señal para seguir comunicándola (a las 4 semanas) |
|---|---|---|
| `nuevosPorReferido` | referidos | sube semana a semana; si sigue en 0 con la historia fija, cambiar el mensaje antes que el premio |
| `clientesQueLleganAlTercerPedido` | menú secreto al 3.er pedido | crece con los clientes; es la recompra, lo que más pesa en la meta |
| `enGrupo` (ya existía) | pedido grupal | al menos 1 por semana desde la semana del 23 |
| `pctPedidosConBebida` | combo | se compara con la semana anterior a cada pieza del combo |
| `pedidosConPremioDePuntos` | puntos | que se canjeen: un punto que nadie canjea no trae a nadie de vuelta |
| `pctNuevosQueCreanCuenta` y `pctPedidosConCuenta` | puntos y bono de bienvenida | sin cuenta no hay puntos, referidos ni menú secreto |
| `pctClientesDeLaSemanaConAvisos` | todos los avisos automáticos | **la llave de la prioridad 2**: un aviso solo llega a quien activó las notificaciones o dejó su correo |
| `canjesPorCodigo` | QR de la bolsa (DIRECTO) | canjes de DIRECTO contra pedidos con `origen = bolsa` |

Solo salen conteos y porcentajes: ningún teléfono ni monto (el repo es público; la prueba lo vigila).

**Lo que encontré al revisar:**
- **Los avisos dependen de un permiso.** De las 15 automáticas, ninguna le llega a un cliente que no activó las
  notificaciones ni dejó correo. La app ya lo pide en la pantalla de gracias; por eso `pctClientesDeLaSemanaConAvisos`
  es el primer número que hay que mirar el domingo 23. Si sale bajo, el arreglo es de la app (cuándo y cómo se pide),
  no de redes.
- **BIENVENIDA (S/5) no se nombra en ningún lado**, y está bien así: para el primer pedido ya está DIRECTO (una
  bebida, en la bolsa), que cuesta menos. Dos ganchos para lo mismo confunden. Se deja callado.
- **La app no necesita cambios para la apertura**: referidos, avisos y pedido fijo ya se ofrecen solos en la pantalla
  de gracias, y la cuenta se ofrece una vez (CLAUDE.md). El trabajo es darlas a conocer fuera de la app.
