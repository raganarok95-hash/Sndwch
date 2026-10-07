# El panel nuevo: propuesta (2026-10-01)

Dueño: «En cuestión del admin no nos debemos enfocar en que sea bonito sino funcional y
ordenado, contando con un modo de "Cocina abierta" donde se entre en ese modo y puedas ver
todo lo que necesites para ir operando: pedido, pedidos listos, en cola, etc.»

**Nada de esto está construido.** Es la dirección a cerrar antes de escribir código
(regla 3 de CLAUDE.md). Maqueta de las tres opciones: `docs/maquetas/propuestas/cocina-abierta.png`.

## La idea ordenada: dos modos, no 35 pantallas sueltas

Hoy el panel es un menú de 35 pantallas que se usan igual con la tienda abierta y cerrada.
Pero son dos trabajos distintos:

| | **Cocina abierta** | **Administrar** |
|---|---|---|
| cuándo | durante el servicio | antes o después, con calma |
| dónde | celular apoyado en la cocina, manos ocupadas | celular o laptop, sentado |
| qué | operar: qué armo, qué sale, qué cobro | decidir: carta, precios, marketing, números |
| cuánto se toca | botones grandes, un toque por paso | formularios, tablas |

**Entrar y salir:** con la tienda abierta, el panel abre directo en Cocina abierta. Con la
tienda cerrada, abre en Administrar, con un botón grande «Abrir cocina». Al salir de cocina se
suelta el bloqueo de pantalla (hoy ya se mantiene encendida en el modo cocina).

## 1 · Cocina abierta: qué tiene que mostrar

Lo que el dueño nombró, más lo que la operación ya pide hoy:

1. **Pago por confirmar**: Yape/Plin con su captura y la lectura del monto (ya existe).
2. **En cola**: pedidos pagados que nadie empezó, por hora prometida.
3. **Armando**: el pedido en preparación, con su receta para ir marcando.
4. **Listos**: armados, esperando al motorizado. ⚠ **Este estado hoy NO existe** (ver abajo).
5. **En camino**: salieron; se cierran como entregados.
6. **Programados**: aparecen en la cola recién cuando toca empezarlos.

Y cuatro cosas a mano, siempre:

- **Pausar pedidos** 30 min / 1 hora / 3 horas / resto del día (ya existe: la tienda se reabre sola).
- **Agotar** un ingrediente o un Signature en un toque, y reactivarlo.
- **Llamar o escribir** al cliente desde el pedido.
- **Un aviso que suena y vibra** cuando entra un pedido nuevo o un pago por confirmar (nuevo: hoy la cola se refresca cada 25 s, pero en silencio).

## 2 · Tres formas de dibujarla (la maqueta)

- **A · La riel**: una sola lista con todos los pedidos, el que vence primero arriba. Los
  contadores de arriba filtran. Cada pedido tiene un único botón: su siguiente paso. Tocarlo
  abre la receta.
- **B · El tablero**: columnas Cola · Armando · Listos · En camino, como una pizarra. En el
  celular se ve una columna por vez; en tablet o PC, las cuatro.
- **C · Un pedido a la vez**: la pantalla es el pedido que toca armar, con su receta para ir
  marcando. Es el modo cocina actual, rehecho.

**Recomendación: A como pantalla principal, y C al tocar un pedido.** A es la única que
muestra en el celular, a la vez, el pago que espera, el pedido listo que se enfría y la cola. C
es la mejor para armar sin equivocarse. B es la mejor en tablet; si cocinas con tablet, B en
pantalla ancha y A en el celular salen del mismo código.

## 3 · Administrar: las 35 pantallas en 5 cajones

Ninguna se borra. Se ordenan por la pregunta que responden:

| cajón | qué pantallas entran |
|---|---|
| **Hoy** | salud del negocio, cierre de caja, reporte del día, plan de tanda, inventario |
| **Carta** | Signatures, menú secreto, precios, recetas, compras de insumos |
| **Clientes** | buscar cliente, reclamos y Libro, reseñas, direcciones con problemas, lista de espera por zona |
| **Marketing** | calendario de contenido, promos, rendimiento de campañas, freno de CAC, palancas del modelo |
| **Sistema** | horario, cuentas admin, auditoría, salud técnica, cumplimiento, reporte de Culqi |

La portada de Administrar es un solo resumen: lo que pide atención hoy (lo que ya calcula
`admin-health`) y los cinco cajones. Nada más.

## 4 · Lo que necesito que decidas

1. **¿A, B o C?** (o A+C, la recomendación).
2. **El estado «Listo»**: hoy un pedido va Recibido → Preparando → En camino → Entregado. Para
   tener «pedidos listos» hay que agregar un paso entre Preparando y En camino. El cliente lo
   vería como «Listo, esperando al motorizado». ¿Lo agrego?
3. **¿Con qué cocinas?** ¿Un celular, una tablet o una laptop en la cocina? Eso decide si
   priorizo A (celular) o B (pantalla ancha).
4. **¿El reparto lo haces tú o un motorizado aparte?** Si eres tú, «Listo» y «En camino» casi
   se tocan, y quizá sobra el estado nuevo.

## 5 · Lo que decidió el dueño (2026-10-01)

- **Pantalla: A como base, con la receta de C** al tocar un pedido.
- **Dos modos** (Cocina abierta / Administrar): aprobado.
- **Sin estado «Listo»** («el proceso de listo puede sobrar»): el reparto lo hace un tercero
  con 50+ motorizados avisado en un grupo de WhatsApp, así que Preparando pasa directo a En
  camino al entregarle la bolsa al motorizado. Lo útil es un botón que arme el mensaje para el
  grupo (dirección, referencia, monto a cobrar) y lo abra en WhatsApp.
- **Equipo**: primero el celular; la laptop cuando no se pueda. A se diseña para 360 px y se
  ensancha en la laptop.
- **Pruebas**: no se arreglan las viejas una por una («arreglar cada prueba puede generar más
  errores»): se rehacen para la app nueva.

## 6 · Construido (2026-10-01)

- **Cocina abierta** (`sAdminCocina`, 09-admin-operacion): una lista por urgencia, contadores que
  filtran (Pago · Cola · Armando · En camino · Programados), un botón por pedido con su siguiente
  paso, tocar el pedido abre la receta (el modo foco de siempre, que ahora vuelve a la lista).
  Pausar 30 min / 1 h / 3 h / resto del día arriba; abajo Pedidos · Agotar · Administrar.
- **Sin «Listo»**: un pedido en Armando ofrece **Pedir motorizado** (abre WhatsApp con el mensaje
  para el grupo: pedido, dirección, referencia, mapa, quién recibe y **COBRAR S/x** solo si es
  contra entrega sin pagar) y **Salió →** (EN CAMINO). En camino: link al motorizado y Entregado.
- **Aviso**: suena y vibra cuando entra un pedido o un pago pasa a esperar confirmación. Compara
  por id (antes por total: uno salía, otro entraba y no sonaba).
- **Administrar** (`sAdminHome`): botón grande a la cocina con lo que espera, y los 5 cajones.
- **Entrada**: con la tienda abierta el panel abre en Cocina; cerrada, en Administrar; después
  manda el último modo elegido en esa visita.
- **Anuncios de Meta** (Marketing → Anuncios de Meta): Apagar pausa todas las campañas activas
  de la cuenta 221839797 y anota cuáles; Prender reactiva solo esas. Las publicaciones
  programadas del calendario ya se publicaban solas (cron cada 15 min).
- Pruebas: `tests/cocina-abierta.spec.ts`, `tests-api/anuncios-boton.test.ts` (defectos inyectados).

## 7 · Pedido nuevo: remodelación TOTAL enfocada en productividad (2026-10-03) — CONSTRUIDO (ver §8)

Dueño, 2026-10-03: «el panel admin necesita una remodelación total para enfocarse en
productividad, lo habíamos hablado». Lo construido en §6 (Cocina abierta + 5 cajones) es el
primer paso; lo que pide ahora es repensarlo entero (**REPENSAR**, no ARREGLO: ver
`docs/COMO_DISENAR_ACA.md` — archivo nuevo, en blanco, tres respuestas estructuralmente
distintas antes de dibujar).

Lo que ya está decidido y NO se reabre (§5): dos modos (operar / administrar), celular primero
(360 px) y laptop después, sin estado «Listo», el reparto lo hace un tercero avisado por WhatsApp
(«Pedir motorizado»), el motorizado NO toca links (`IDEAS_A_FUTURO.md`), «no bonito sino
funcional y ordenado».

Lo que hay que resolver en la propuesta (concepto antes que código, regla 3):
1. **Productividad = menos toques por pedido.** Contar hoy los toques de punta a punta (entra →
   pago confirmado → armando → pedir motorizado → salió → entregado) y proponer cómo bajarlos.
   Yape ya se confirma solo cuando la captura cuadra (lector en el celular del cliente).
2. **Qué ve el dueño al abrir el panel** en cada momento del día (antes de abrir, servicio,
   cierre) sin navegar: lo que pide acción arriba, todo lo demás a un toque.
3. **Administrar**: las ~35 pantallas en 5 cajones siguen siendo muchas. Medir cuáles se usan
   (no hay datos de uso: proponer cómo medirlo o decidir con el dueño) y cuáles sobran.
4. **«Abro con N porciones»** (stock del día) debería ser parte natural de abrir la cocina, no
   una hoja aparte: hoy la tabla `inventory` está vacía y el cliente no ve «Quedan N».
5. Entregable: lámina con 3 opciones estructurales (como `propuestas/cocina-abierta.html`), hoy
   del panel actual con capturas, y una recomendación. Nada se construye sin aprobación.

Código actual: `src/app/09-admin-operacion.ts` (cocina, `sAdminCocina`), `10-admin-negocio.ts`
(administrar), auditoría previa en `docs/AUDITORIA_PANEL_ADMIN.md`.

**2026-10-07 · lámina entregada:** `docs/maquetas/propuestas/panel-productivo.html` (+ `.png`, capturas
de hoy en `propuestas/hoy-panel/`). Toques por pedido contados: 10 hoy → 6 (tocar el pedido = receta +
Armando; motorizado por la hoja de compartir; Entregado se cierra solo a hora prometida + 30 min);
dos a la misma zona en un mensaje: 20 → 8. Tres esqueletos: **A** lista de lo que te toca (recomendada),
**B** tres momentos del día, **C** el pedido que toca + «Tu semana». Administrar 36 → 20 pantallas
juntando, sin borrar; medir aperturas 4 semanas (hoy `admin_action_log` solo tiene 4 cambios).
Preguntas abiertas al dueño: A/B/C o mezcla; ¿Entregado automático?; ¿juntar y medir?

## 8 · Lo que decidió el dueño y lo que se construyó (2026-10-07)

Dueño, sobre la lámina: «una mezcla . 2 decide tu lo mejor basado en datos siempre analizalo y
piensalo bien y 3 sí. Adicional esto, puedes rediseñar el panel, para el modo trabajo y el otro
pero simplifica totalmente el como se acceden a las opciones cuales son mas útiles y que mas
necesito agregar o quitar. Hazlo, decide y avanza».

**La mezcla:** A (una lista de lo que te toca) como esqueleto; de B, abrir y cerrar el día entran
como tareas de esa lista; de C, la receta a pantalla completa al tocar un pedido, ahora con
«Mandar al motorizado» en la misma receta.

### Modo trabajo: «Te toca» (`sAdminCocina`, 09-admin-operacion)
- **Abrir el día es contar porciones**: la hoja «¿Con cuántas abres hoy?» está abierta arriba
  hasta que se guarda o se toca «Hoy no cuento» (antes era un botón que nadie tocaba: `inventory`
  vacía).
- **Avisos del negocio intercalados**: lo que `admin-health` marca y no es un pedido (reclamos con
  plazo, agotados, tandas vencidas, procesos caídos) aparece como tarea con «Ver». Se piden al
  entrar y cada 5 min. «Qué pide atención» dejó de ser un botón en Administrar.
- **Tocar un pedido en cola lo empieza** (abre la receta y lo pasa a Armando: 1 toque, eran 2).
  Uno que espera pago o está programado solo se abre.
- **Mandar al motorizado** usa la hoja de compartir del celular (el grupo sale primero) y, sin
  ella, wa.me. Si hay otro pedido Armando a la misma puerta o zona en la misma ventana (la señal
  «agrupable» que ya calculaba el servidor), sale **un solo mensaje** con los dos, cada uno con su
  propio COBRAR o «ya pagado». La tarjeta dice a qué hora se avisó.
- **En camino va abajo, en filas**, sin botón grande. «Link al motorizado» salió (no toca links).
- **Al cerrar**: con la tienda cerrada, «N pedidos pagados siguen en camino → Cerrarlos» (solo
  pagados) y «Cuadra la caja de hoy».

### La pregunta 2: ¿«Entregado» se cierra solo? — NO por reloj; lo cierra el cliente
Datos revisados el 2026-10-07:
- **No hay ni una entrega real en la base** (los únicos pedidos de 120 días son 4 cancelados de
  prueba): no hay con qué calibrar «hora prometida + N min».
- **ENTREGADO mueve plata**: en un contra entrega sin cobrar, marcarlo es lo que registra el cobro
  (`confirmManualPayment`) y suma los puntos. Un cierre por reloj daría por cobrada plata que
  nadie contó.
- **ENTREGADO le avisa al cliente** («¡Pedido entregado!») y abre la calificación y «Algo salió
  mal». Por reloj, se lo diría a quien todavía espera.
- **`delivered_at`** alimenta la comparación contra la promesa (weekly-summary): una hora
  inventada la ensucia.

Decisión: **lo cierra el cliente con «Ya me llegó»** (acción nueva `confirm-my-delivery`, botón en
su pedido), que escribe la hora REAL. Nunca un contra entrega sin cobrar (lo cierra el dueño con
«Cobró S/x ✓»; prueba `tests-api/ya-me-llego.test.ts`). Al cerrar la tienda, lo pagado que
quedó en camino se cierra de un toque (prueba `tests/cocina-abierta.spec.ts`). **Revisar a las 4
semanas de abrir**: qué % de pedidos cerró el cliente y cuánto tardan; con eso sí se puede decidir
un cierre por tiempo para los pagados.

Toques por pedido (Yape que se confirmó solo, mirando la receta): **10 → 6** (tocar = receta +
Armando · mandar al motorizado · grupo · enviar · volver a la app · Salió; Entregado lo hace el
cliente). Dos a la misma zona: 20 → 8.

### Administrar: una sola lista (`PANEL_OPCIONES`, 09-admin-operacion)
- **36 botones → 21 entradas** (20 + «Este celular»), sin borrar ninguna pantalla: las que
  contestan lo mismo se juntaron y adentro se cambia con pestañas (`chipsDelGrupo`, las pinta
  `H()` en todas las del grupo). Tabla de qué se juntó: lámina `propuestas/panel-productivo.html` §4.
- **Buscador** arriba (filtra por nombre, descripción y pantallas de adentro) y **«Lo que más
  usas»**: 4 fijadas que aprenden del uso de ese celular (empiezan en Cierre de caja, Números, La
  carta, Avísale a tu gente).
- **El cajón lateral sale de la misma lista** (`adminToolsSections()` la deriva): ya no puede
  divergir. Sonido, notificaciones y modo claro pasaron a «Este celular»; el botón de tema salió
  de la cabecera.
- **Se mide**: cada pantalla del panel que se pinta deja una fila en `admin_action_log`
  (`action='abrir-pantalla'`, `target`=pantalla; acción `admin-abrir-pantalla`). La Auditoría las
  filtra. **A las 4 semanas de abrir**:
  `select target, count(*) from admin_action_log where action='abrir-pantalla' group by 1 order by 2;`
  — lo que nadie abrió se discute con el dueño.
