# Auditoría por clases de error (2026-09-23)

El dueño pidió, después de una sesión en la que se cometieron varios errores de cálculo y de
lógica: *«buscar y auditar el código y ver dónde más están ocurriendo estos errores, para que
la estructura del código esté bien mejorada y sana y construir sobre algo mejorado»*.

No se buscaron "bugs" en general. Se tomaron **los defectos concretos de esa sesión**, se
nombró la forma de cada uno, y se barrió el repo entero buscando esa misma forma en otros
lados. Cada hallazgo se verificó leyendo los dos lados (y la base real cuando hacía falta)
antes de afirmarlo, y cada prueba nueva se vio fallar con el defecto puesto antes de darla
por buena.

## Resumen

| # | Clase | Hallazgos reales | Arreglado | Qué lo vigila ahora |
|---|---|---|---|---|
| 1 | Tubería que se traga el código de salida | 1 (mío, al correr la suite) | sí | regla en `CLAUDE.md` §6 |
| 2 | Leer escribe | 0 nuevos (el grupo ya estaba) | — | — |
| 3 | Guard por estado que deja afuera un camino legítimo | **1 grave: el cobro con tarjeta** | sí | `tests-api/cobro-con-tarjeta.test.ts` |
| 4 | El cliente deduce qué se puede hacer desde un estado | 1: cancelados en «Activos» | sí | `tests/mis-pedidos-cancelado.spec.ts` |
| 5 | Aviso fuera del tope de uno por día | 2: resumen mensual, reposición | sí | `tests-api/resumen-mensual.test.ts` |
| 6 | `catch` que se traga un error de dinero | 0 (todos eran push de cortesía) | — | — |
| 7 | Cifra escrita a mano en un texto al cliente | 2: brief del grupo, «48 horas» | sí | `tests-api/promesas-del-brief.test.ts` |
| 8 | Lo mismo hecho en N lugares | 4: libro de crédito ×2, PIN ×2, reinicio del login ×3, INDEX.txt | sí | `npm run check:doble-escritura` |
| 9 | **Prueba que no vigila nada** (apareció durante la auditoría) | 3, las tres mías | sí | regla en `CLAUDE.md` |

Y de paso, defectos de hoy mismo en el login por correo, que se encontraron al revisar la
clase 8 (ver abajo).

## 1 · La tubería que se traga el código de salida

`cmd | tail -25` devuelve el código de salida de `tail`, no el de `cmd`. Así se reportó
«239 passed» de la suite completa cuando **42 fallaban**: la línea de fallos quedó fuera de
las 25 últimas y el `0` era de `tail`.

Barrido: los workflows de CI y los scripts de `package.json` no tienen ninguna tubería ni
`|| true` — estaban bien. Los dos `catch {}` vacíos de `check-backup.mjs` y `smoke-prod.mjs`
son legítimos (un `JSON.parse` de una respuesta que puede no ser JSON). El único caso era mi
propio comando. Quedó como regla en `CLAUDE.md` §6.

**Las 42.** Se separaron corriendo las mismas pruebas sobre `9d04454` (el código antes del
cambio de login): **36 ya fallaban antes**, 6 las rompí hoy. Las 6 están arregladas. Las 36
son deuda anterior y siguen en la tarea «Reparar las 42 pruebas».

## 2 · Leer que escribe

Con un extractor exacto de cuerpos de función (el primero, aproximado, daba falsos positivos
porque mezclaba funciones vecinas): las únicas acciones de lectura que escriben son
`get-group-order` (el cierre perezoso, que desde hoy no destruye nada porque un grupo cerrado
se sigue pudiendo pagar) y `prepare-weekly-plan` (escribe por diseño). En la base, las RPC de
lectura (`dashboard_aggregates`, `error_spike`, `retention_report`, etc.) se revisaron en
`pg_proc`: ninguna modifica. `mark_cron_alerted` sí modifica, pero solo la llama un cron
protegido por `verifyCronSecret` — es su trabajo.

## 3 · El guard que deja afuera un camino legítimo — el cobro con tarjeta

Es la forma del defecto del pedido grupal (el grupo vencido pasaba a `closed` y pagar exigía
`status=eq.open`). Buscando todos los `status=eq.X` en escrituras apareció el mismo patrón
en el lugar más caro posible:

- Tras cobrar en Culqi, `create-charge` devolvía la reserva de `charging` a **`pending`** —
  el estado que significa «todavía no pagó». Si la respuesta del cobro se perdía en la red,
  el cliente veía «Error de conexión. Intenta de nuevo», reintentaba con otra tarjeta, la
  reserva estaba otra vez `pending`… **y se le cobraba dos veces.**
- Ese PATCH de vuelta a `pending` se tragaba su propio error. Si fallaba, la reserva quedaba
  `charging` con el dinero cobrado: la confirmación respondía **«Este pedido ya fue
  procesado»** (falso) y el cron de expiración la trataba como abandonada.
- La confirmación miraba el vencimiento **antes** de verificar el cargo: un pago hecho en el
  último segundo recibía **«Tu reserva expiró. Vuelve a intentar tu pedido»**.
- El cron de expiración reponía el inventario **antes** de reclamar la fila.

⚠ **Corrección de lo que afirmé a mitad de camino.** Dije que un cobro sin pedido quedaba
«sin aviso al dueño». No es cierto: `reconcile-culqi-charges` corre cada hora, cruza los
cobros de Culqi contra los pedidos y avisa. Lo que sí faltaba es todo lo de arriba.

Arreglo (migraciones `cobro_registrado_en_la_reserva` y `plan_semanal_acepta_reserva_cobrada`):

- Nuevo estado **`charged`** con `charge_id`: «ya se cobró» es un dato de la base, no una
  suposición.
- `create-charge` es **idempotente**: sobre una reserva `charged` devuelve el mismo cargo
  sin llamar a Culqi.
- La confirmación **verifica el cargo primero** y acepta `pending`/`charging`/`charged`
  (`RESERVA_CONFIRMABLE`). Un reintento del mismo pago devuelve el pedido existente. Nunca
  más «vuelve a intentar» a quien ya pagó; si de verdad no se puede crear, avisa al dueño en
  el momento (con la misma llave de «una sola vez» que la conciliación horaria).
- El cron **reclama antes de reponer**, y además **crea el pedido** de un pago que nadie
  volvió a confirmar pasados 5 minutos (el cliente pagó y cerró la pestaña). El dueño recibe
  «Pedido recuperado».
- `create-credit-charge` comparte el código: su confirmación y su RPC aceptan el estado nuevo
  (hoy el Plan Semanal está retirado, pero el defecto quedaba dormido para el día que vuelva).

Las 9 pruebas de `cobro-con-tarjeta.test.ts` ejecutan el cobro real con Supabase y Culqi
simulados; con el comportamiento viejo, 4 fallan.

## 4 · El cliente deduciendo desde un estado

«Mis Pedidos» separaba activos de anteriores con `status !== 'ENTREGADO'`. Un pedido
**cancelado** caía para siempre bajo «● Activos», con un «Toca Actualizar» parpadeando en su
detalle, como si todavía pudiera llegar. Ahora «terminado» se deriva de la tabla `STATUSES`
(un estado sin paso siguiente), y el detalle dice «Este pedido se canceló.»

El resto de comparaciones con estados en el cliente son del panel (legítimas) o ya usan lo
que manda el servidor (`canPay` del grupo).

## 5 · Avisos fuera del tope de uno por día

De los ~20 envíos de push, los de marketing respetan `phonesTouchedToday()` y dejan rastro,
salvo dos:

- **Resumen mensual**: no consultaba el tope. Como corre del 1 al 5, ahora **cede** ante
  otro aviso del día y sale igual en su última corrida (perder el resumen del mes sería peor
  que dos avisos). El último día se lee del cron en la prueba: si alguien mueve el horario y
  no la constante, falla.
- **«¡Ya volvió!»** (reposición): le llega también a quien solo tenía el sabor en guardados, y
  no dejaba rastro. Ahora registra `restock`, como el pedido fijo: sale siempre, pero las
  promociones del día se corren.

Los demás (estado del pedido, cancelación, regalo recibido, referido, grupo) son
transaccionales: correcto que no pasen por el tope.

## 6 · `catch` que se traga un error de dinero

Todos los `catch` vacíos cerca de dinero envuelven **avisos push** después de una operación
ya hecha — correcto que no la bloqueen. Revisando uno de ellos (`actCreditGift`) apareció el
hallazgo de la clase 8.

## 7 · Cifras escritas a mano

- **El contenido que el dueño publica** (`marketingContent`, tema PEDIDOS GRUPALES) decía
  «Desde 5 sándwiches» escrito a mano en los dos textos para WhatsApp e Instagram, mientras la
  idea de video del mismo objeto ya interpolaba `ORGANIZER_FREE_MIN_SANDWICHES`.
- El error de pedidos programados decía «48 horas» al lado de `MAX_SCHEDULE_AHEAD_HOURS`.

En el cliente, las únicas cifras escritas en texto visible son del texto legal (plazos de
ley), que no se toca. La prueba nueva mira el **fuente** de `marketingContent`, no su salida:
con el umbral en 5, un «5» escrito y uno interpolado se ven iguales.

## 8 · Lo mismo hecho en varios lugares

- **Libro de crédito escrito dos veces.** `gift_credit` y `redeem_points_for_gift_credit` ya
  anotaban en `credit_ledger` dentro de la transacción, y `actCreditGift` /
  `actGiftCardPurchase` volvían a anotar al volver. Cada regalo quedaba dos veces en el
  historial que el dueño ve en el detalle del cliente, y la segunda escritura iba fuera de la
  transacción: si fallaba, error con el saldo ya movido, y reintentar era regalar dos veces.
  Ahora escribe solo la RPC (migración `libro_de_credito_se_escribe_una_sola_vez`), y
  **`npm run check:doble-escritura`** cruza cada RPC (su última definición en las
  migraciones) con las funciones que la llaman. Contra el código viejo encuentra los 3 casos.
- **PIN automático** con `Math.random`, en dos copias (registro con Google y con correo),
  cuando el mismo archivo ya tenía el generador criptográfico del código de 6 dígitos.
- **`INDEX.txt` de migraciones** se había quedado en 161 de 172, y el README repetía el conteo.
  Regenerado; el README ya no lleva números.

## Defectos del login por correo (míos, de hoy)

Aparecieron revisando la clase 8 y no tenían ninguna prueba de navegador:

- **Cerrar sesión no reiniciaba el login por correo**, y dejaba viva en memoria la prueba de
  correo verificado. El registro la manda: la siguiente cuenta creada en el mismo equipo se
  quedaba con el correo de otra persona. El registro exitoso tampoco la gastaba. Ahora las
  tres salidas pasan por `limpiarLoginPorCorreo()`.
- **El registro con correo verificado pedía PIN** («mínimo 4 dígitos»), contra el «No hay
  contraseña» de la pantalla anterior, y mostraba un campo de correo vacío que el servidor
  ignoraba. Ahora muestra el correo verificado y no pide PIN; el DNI sigue obligatorio.

`tests/login-por-correo.spec.ts` cubre los tres; cada uno se vio fallar con su defecto.

## 9 · Pruebas que no vigilaban nada

La clase que no estaba en la lista y resultó la más incómoda, porque las tres eran mías:

- Las de «la cuenta no ofrece la tarjeta de regalo / el Plan Semanal» **pasaban con la oferta
  prendida**: miraban la pantalla de puntos, y la oferta vive en «Mi perfil».
- La de cifras en el brief quitaba comentarios con `//…` y **se comía todo lo que seguía a
  «SND//WCH»** — justo donde estaba el «5». El mismo error estaba en `check:doble-escritura`.
  Los chequeos anteriores del repo ya quitaban solo comentarios de línea completa.

Por eso la regla en `CLAUDE.md`: una prueba que no se vio fallar no prueba nada.

## Lo que quedó sin tocar, a propósito

- La confirmación del Plan Semanal responde «ya fue procesado» a una reserva **vencida** con
  cobro real. El Plan Semanal está retirado y su confirmación cortada por bandera; se arregla
  el día que vuelva.
- `tests/account-deletion.spec.ts` acepta `#r-phone` como señal de «volvió al login», que se
  ve igual con o sin el arreglo del cierre de sesión. No se cambió: lo cubre ahora la prueba
  específica.
- Las 36 pruebas que ya fallaban antes de hoy: tarea aparte.
