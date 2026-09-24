# Volver cada semana sin que sea una suscripción

Decisión del dueño (2026-09-23): **el pedido que se repite NO es una suscripción.** Es un
aviso que le recuerda pedir otra vez el jueves, con la opción de repetir la misma compra o
programarla. Nada se manda ni se cobra solo.

Este documento es la parte de "pensemos lo óptimo": qué ya existe, qué está roto en silencio,
y qué conviene hacer además del aviso.

---

## 1 · Por qué la decisión es correcta, más allá de la intuición

Una suscripción no vende comida: vende **no tener que decidir**. El problema es lo que
compra el negocio a cambio.

- **Crea una obligación de entrega en un día fijo para una cocina de una sola persona.** Hoy
  un mal día es una venta perdida. Con suscripción, un mal día es un contrato roto con cinco
  personas a la vez, el mismo día, todas esperando a la misma hora.
- **La plata prepagada es un pasivo, no un ingreso.** Entra al banco y sale del inventario
  semanas después. Un negocio sin historial que arranca con obligaciones prepagadas empieza
  debiendo comida.
- **Y el cobro automático es exactamente lo que este repo decidió no hacer**, con una prueba
  que lo protege: *«sacarle plata a alguien sin una decisión fresca suya es la clase de
  sorpresa que cuesta el cliente entero»* (`docs/DECISIONES.md`).

---

## 2 · Lo que YA existe, y es exactamente la forma correcta

**No hay que construir el mecanismo: está hecho.** `recurring_orders` guarda el pedido de
siempre con su **día** y su **franja**; el cron `remind-recurring-orders` avisa una hora antes
—*«¿Va lo de siempre? Tu pedido fijo para las 19:30 — ya está armado, confirmas en un
toque»*— y el cliente confirma. Nunca se cobra sin esa confirmación.

**Lo único que hay que cambiar es el texto de la pantalla.** La maqueta aprobada dice
«LO MANDAMOS SOLO, A LA HORA DE SIEMPRE», que es lo contrario de lo que el producto hace y de
lo que el dueño quiere. Eso ya está anotado como A4 en `docs/PROMESAS_SIN_RESPALDO.md`.

---

## 3 · Los dos huecos del mecanismo, los dos silenciosos

### 3.1 · El aviso no mira si la hora está llena

`remind-recurring-orders` manda «ya está armado, confirmas en un toque» **sin consultar el
tope por hora**. Ese tope existe y funciona: `assertHourCapacity` (`actions/orders.ts`)
rechaza al confirmar si la franja se llenó.

O sea que el cliente puede recibir una promesa a las 11:30, tocar el botón a las 11:32, y
encontrarse con que no hay lugar. **Es la peor forma de romper una promesa: se la hacemos
justo cuando la persona ya decidió.**

**Qué hacer:** que el aviso consulte la capacidad ANTES de salir. Si la franja de siempre
está llena, el aviso cambia de texto en vez de no salir — *«hoy las 12:30 ya se nos llenó;
¿lo dejamos 13:00?»*. Un problema se convierte en un rescate, y el cliente se entera cuando
todavía puede hacer algo.

### 3.2 · Es el único aviso fuera del sistema de fatiga

El cliente puede recibir **quince avisos distintos** (`remind-*`, `bounce-back-first-order`,
`anniversary-greeting`). Existe un tope de **uno por día** —`marketing_touches` +
`phonesTouchedToday()`— que **ocho de ellos respetan**.

El del pedido fijo **ni lo respeta ni lo alimenta**, y esas dos mitades no se juzgan igual:

- **Que no lo respete está bien.** No es marketing: es un servicio que el cliente pidió. Debe
  salir siempre, y con prioridad sobre cualquier promoción.
- **Que no lo alimente está mal.** Como no deja registro, ese mismo jueves le puede llegar
  además «te faltan 30 puntos» o «hace mucho que no pides». **El único aviso que el cliente
  pidió termina compitiendo con los que no pidió.**

**Qué hacer:** que registre su toque. El aviso sigue saliendo siempre; lo que cambia es que
los quince de marketing se corren ese día.

---

## 4 · La pregunta que vale la pena: ¿alcanza con avisar?

Un recordatorio es **pasivo**. A las 11:30 compite con todo lo demás que hay en el teléfono.

Lo que una suscripción vende de verdad son dos cosas: no decidir, y **que tu lugar es tuyo**.
La primera no la queremos. **La segunda sí se puede dar sin ninguna suscripción.**

### La propuesta: APARTAR LA FRANJA, no cobrarla

Cuando alguien tiene su pedido fijo, su franja **le guarda un lugar** en el tope de esa hora
desde el día antes. El aviso pasa a poder decir algo que hoy sería mentira:

> **«Tu jueves está guardado hasta las 12:00.»**

Y si no confirma, **se suelta solo** y el lugar vuelve al resto. No paga nada, no se
compromete a nada, y aun así tiene el beneficio que la suscripción vendía.

**Lo que cuesta:** capacidad apartada que puede quedar sin usar. Dos frenos:

1. **Se suelta temprano** — 90 minutos antes, no a la hora de la entrega. La franja vuelve al
   pool con tiempo de venderse.
2. **Solo para quien ya volvió.** Se aparta a partir del segundo o tercer pedido fijo
   confirmado, nunca al que recién lo configuró. Un hábito probado aparta lugar; una
   intención, no.

Es la única versión en la que el aviso puede prometer algo que hoy no puede.

---

## 5 · Y entonces, ¿qué pasa con el Plan Semanal?

Hoy el Plan Semanal **no son cinco almuerzos**: es **pagas S/95 y recibes S/100 de crédito**.
Un prepago con 5% de bonificación. La pantalla aprobada prometía otra cosa entera (días,
horario, envío incluido, elegir cada noche).

Mirado de frente, como producto es flojo:

- **El 5% se paga por un flote muy corto.** El crédito se gasta en semanas, no en meses.
- **Le pide dinero por adelantado a alguien que todavía no confía en el negocio.** Antes de
  abrir, eso convierte mal.
- **Y ya hay un cron que delata el problema: `remind-unused-credit`.** Existe porque el
  crédito se queda sin usar. Un prepago que hay que recordarle a la gente que gaste no está
  reteniendo a nadie: está durmiendo.

**Recomendación: no sale para la apertura.** Lo que el Plan Semanal prometía emocionalmente
—«mis almuerzos de la semana resueltos»— lo da mejor el pedido fijo con la franja apartada, y
sin pedir un sol por adelantado. El prepago puede volver después, cuando haya clientes que
repitan y a los que sí les convenga.

**Es una decisión del dueño, no mía.** Si se queda, lo único obligatorio es que la pantalla
diga lo que es: crédito, no almuerzos.

---

## 6 · Qué hacer, en orden

| # | qué | estado |
|---|---|---|
| 1 | La pantalla del pedido fijo deja de decir «lo mandamos solo» y dice lo que pasa: avisamos y confirmas | ✅ 2026-09-24 |
| 2 | El aviso registra su toque, para que las promociones no se le encimen ese día | ✅ 2026-09-23 |
| 3 | El aviso consulta la capacidad y, si la franja está llena, ofrece la siguiente | ✅ 2026-09-24 |
| 4 | Apartar la franja del pedido fijo, con suelta a los 90 min y solo desde el 2º confirmado | ✅ 2026-09-24 (`franja.ts`, `capacidad.ts`) |
| 5 | Decidir el Plan Semanal: se retira, o la pantalla pasa a decir «crédito» | ✅ se retira para la apertura |

Los puntos 1 y 2 son los que hay que hacer sí o sí antes de abrir. El 3 y el 4 valen mucho más
que cualquier suscripción y no comprometen al negocio con nadie.
