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
