# Automatizaciones para SND//WCH — 93 vigentes de 100 propuestas

Fecha: 2026-08-29 · Apertura: lunes 7 de septiembre de 2026

## Cómo leer esta lista

**Todo lo que está acá NO existe todavía.** Antes de escribirla hice inventario de lo que
ya corre: **30 cron jobs activos**, ~50 acciones de panel admin y ~42 acciones de cliente.
Nada de la lista repite eso. Lo que ya está hecho y por lo tanto NO aparece: recordatorios
de carrito abandonado, pago abandonado, segundo pedido, clientes dormidos, rango alto,
nunca pidió, aniversario, cumpleaños, reto sin reclamar, hora pico, crédito sin usar,
post-cancelación, alerta de calificación baja, pedido estancado, pedido programado por
empezar, stock bajo, reclamos por vencer, conciliación Culqi, expiración de cobros,
dead-man switch de crons, pico de errores, panel de salud, plan de tanda, guion de video,
publicación a Instagram/Facebook, resúmenes diario y semanal, y "repetir pedido".

Cada ítem lleva una etiqueta de qué necesita:

| Etiqueta | Significa |
|---|---|
| **HOY** | Se puede construir ya: los datos y el código necesarios existen |
| **DATOS** | Necesita historial real de ventas (3-4 semanas mínimo). Antes da números inventados con aspecto de dato |
| **DUEÑO** | Bloqueado por algo que solo tú puedes conseguir (una cuenta, un secret, una cotización) |
| **$** | Tiene costo real recurrente |

**7 descartados por el dueño el 2026-08-29:** 48, 49, 76, 80, 81, 82 y 85. Se dejan en la
lista tachados y con su número original, en vez de renumerar: así los números siguen
significando lo mismo en esta conversación y en los commits que los referencian. Quedan
**93 vigentes**.

**Advertencia honesta sobre el número 100.** Me pediste cien y hay cien, pero no son cien
cosas igual de buenas. Las de los bloques A-E son las que de verdad mueven la aguja de este
negocio. De ahí para abajo hay varias que solo valen la pena si el negocio crece bastante,
y unas cuantas que son higiene técnica más que negocio. Al final está la lista corta de las
12 que yo haría primero, y las que NO haría todavía aunque se puedan.

---

## A. Cocina y producción — el cuello de botella real

El techo de este negocio no es la demanda de la app, es que cocinas solo y por tandas. Este
bloque es el que más tiempo tuyo devuelve.

1. **Lista de compras automática** — del plan de tanda salen las cantidades; esto las
   agrupa por proveedor (carnicería, panadería, mercado) y arma la lista lista para salir.
   Hoy el plan dice cuánto cocinar pero no qué comprar. · **DATOS**
2. ✅ **Aviso de "toca cocinar"** — cruza stock actual contra pedidos ya programados y avisa
   cuándo se acaba, con margen para producir. Reemplaza acordarse. · **HOY**
3. ✅ **Temporizador de tanda por proteína** — los tiempos ya están en el RECETARIO; la app los
   dispara y avisa cada etapa mientras haces otra cosa. · **HOY**
4. ✅ **Etiquetas de tanda imprimibles** — insumo, fecha de producción, fecha límite de uso.
   Sin esto, en la refri no se distingue una tanda de otra. · **HOY**
5. **Alerta de caducidad de tanda** — proteína cocinada hace N días que sigue en stock. Es
   seguridad alimentaria, no solo merma. · **HECHO 2026-08-29** (`alert-batch-expiry`, señal
   en Salud del negocio, fecha de tanda y vida útil editable en Inventario)
6. **Merma real medida** — registras kg crudos que entraron y porciones que salieron; el
   sistema calcula el rendimiento verdadero por insumo. Hoy la merma es un supuesto
   (res 0.54, pollo 0.64-0.69) tomado de referencias, no de tu cocina. · **DATOS**
7. **Costo real por porción** — con la merma medida y el precio pagado de verdad, el costo
   deja de ser estimado. Esto es lo que destraba media docena de decisiones de precio. · **DATOS**
8. **Alerta de desvío de costo de tanda** — avisa si una tanda salió más cara de lo normal
   (subió el insumo, salieron menos porciones). · **DATOS**
9. ✅ **Escalado de receta** — pones "quiero 40 porciones" y devuelve las cantidades exactas
   de cada ingrediente. · **HOY**
10. ✅ **Checklist de mise en place del día** — generado desde los pedidos programados de esa
    jornada, no desde una lista fija. · **HOY**
11. **Bloqueo preventivo de Signature** — si la proteína no alcanza para los pedidos ya
    comprometidos, el producto sale del catálogo antes de que alguien más lo pida. Hoy el
    stock se descuenta pero nadie mira la demanda ya vendida. · **HECHO 2026-08-29 (el defecto real era otro: la tarjeta miraba solo pan+proteína mientras el servidor reserva la receta completa — ver docs/ORDEN_DE_EJECUCION.md)**
12. ✅ **Orden de cocción sugerido** — qué preparar primero según las horas de entrega
    comprometidas. · **HOY**
13. **Recordatorio de pedido al proveedor** — con el lead time de cada uno (el pan y la
    giardiniera no se consiguen el mismo día). · **DUEÑO** (faltan los lead times reales)
14. **Historial de rendimiento por tanda** — cuántas porciones salieron de verdad cada vez,
    para ver si mejoras con la práctica. · **DATOS**
15. **Alerta de sobreproducción** — insumo con stock alto y rotación baja: plata parada que
    además se va a echar a perder. · **DATOS**

## B. Pedidos, despacho y reparto

16. **ETA ajustada por cola** — hoy el ETA sale de la zona; esto le suma cuántos pedidos
    tienes delante. Un ETA que miente es la causa directa de una calificación de 1 estrella. · **HECHO 2026-08-29 (`estimatedDeliveryRange()`: +5 min por pedido en cola)**
17. ✅ **Agrupación de pedidos por cercanía** — dos pedidos a la misma zona en la misma ventana
    salen en un viaje. Baja lo que le pagas al motorizado. · **HOY**
18. **Despacho al motorizado por WhatsApp** — mensaje con dirección, referencia, teléfono y
    link de mapa, sin que lo escribas. · **DUEÑO** (necesita WhatsApp Business API)
19. ✅ **Confirmación de entrega por link** — el motorizado toca un link único y el pedido pasa
    a ENTREGADO solo. Hoy lo marcas tú. · **HOY**
20. ✅ **Auto-cierre de pedidos sin calificar** — a los N días deja de pedir calificación en vez
    de arrastrar la tarjeta para siempre. · **HOY**
21. ✅ **Detección de dirección ambigua** — sin número, sin referencia, o repetida con otra
    distinta. Se pregunta ANTES de despachar, no cuando el motorizado está perdido. · **HOY**
22. ✅ **Aviso de dos pedidos a la misma dirección** — casi siempre es un pedido partido en dos;
    juntarlos ahorra un viaje. · **HOY**
23. **Auto-pausa al llenar la hora** — al llegar a `MAX_ORDERS_PER_HOUR` la tienda se pausa
    sola en vez de aceptar algo que no vas a poder cumplir. · **HECHO 2026-08-29 (reinterpretado: el cliente VE las franjas llenas; pausar la tienda entera habría bloqueado también las horas vacías)**
24. **Reapertura automática** — al bajar la cola, la tienda vuelve sola. Sin esto la pausa
    depende de que te acuerdes. · **HECHO 2026-08-29 (sale gratis: la capacidad se calcula en vivo, no hay estado que revertir)**
25. **Sugerencia de hora alternativa** — cuando la franja está llena, ofrecer la siguiente
    libre en vez de solo rechazar. · **HOY**
26. **Alerta de pedido programado sin insumo** — el pedido es para las 8pm y la proteína se
    acabó a las 5pm: avisar mientras todavía se puede cocinar o llamar al cliente. · **HECHO 2026-08-29 (`alert-scheduled-shortfall`, cada hora)**
27. **Recordatorio al cliente 1h antes** — de su pedido programado, para que esté en casa.
    Reduce entregas fallidas. · **HECHO 2026-08-29 (segundo barrido en `alert-scheduled-orders`, 60 min antes)**
28. **Lectura del voucher de Yape** — OCR del comprobante que ya sube el cliente, para
    proponer la confirmación en vez de teclearla. · **$** (servicio de OCR)
29. ✅ **Detección de comprobante duplicado** — el mismo voucher usado en dos pedidos. · **HOY**
30. **Alerta de nota de cocina inusual** — "sin cebolla", "soy alérgico": se resalta en la
    comanda en vez de perderse en el texto. · **HECHO 2026-08-29 (lista compartida con parity + bloque rojo en la comanda)**

## C. Dinero, márgenes y cobros

31. **Reporte diario de conciliación** — el cron horario ya concilia cargos huérfanos; falta
    el resumen que te diga cuánto cobró Culqi vs. cuánto facturaste. · **HOY**
32. **Alerta de rechazo de tarjeta alto** — si de golpe la mitad de los cobros falla, algo se
    rompió (Culqi, el 3DS, tu cuenta). Hoy te enterarías por un cliente. · **HECHO 2026-08-29 (`alert-card-declines`, con mínimo de volumen)**
33. **Reintento de cobro fallido** — con aviso al cliente, en vez de perder la venta. · **PARCIAL 2026-08-29 — el reintento automático es IMPOSIBLE: el token de Culqi es de un solo uso y dura 5 min. Sí se construyó el aviso que dice que fue la tarjeta**
34. **Reporte mensual de comisiones Culqi** — cuánto te costó cobrar con tarjeta ese mes.
    Es un costo real que hoy no está en ningún reporte. · **HOY**
35. **Alerta de margen por pedido bajo el umbral** — un pedido que con combo + recompensa +
    zona cara queda por debajo del piso, avisado en el momento. · **HOY**
36. **Punto de equilibrio del mes en vivo** — cuántos pedidos te faltan para cubrir costos.
    Con costos fijos bajo S/500 es un número chico y muy motivador de ver. · **DATOS**
37. **Recosteo automático al subir un insumo** — registras que la res subió a S/23/kg y el
    sistema te dice qué productos cayeron bajo el 45%. · **DATOS**
38. **Precio de insumo por compra** — cada compra queda registrada; el costo del menú deja de
    ser un literal escrito a mano. Es la base del 37 y del 7. · **HOY**
39. **Pasivo de crédito emitido** — cuánto crédito interno hay vivo sin consumir (Plan
    Semanal, tarjetas de regalo). Es deuda tuya en comida, y hoy nadie la mira. · **HOY**
40. ✅ **Cierre de caja diario** — cuánto entró por tarjeta, cuánto por Yape/Plin, cuánto en
    crédito, cuadrado contra los pedidos del día. · **HOY**

## D. Marketing y adquisición

Sin B2B ni puerta a puerta, la publicidad pagada y los referidos son prácticamente el único
canal. Este bloque va sobre no desperdiciar esa plata.

41. **Pausar Meta Ads cuando no hay stock** — pagar por clics hacia un producto agotado es
    tirar plata. · **DUEÑO** (secrets de Meta) · **$**
42. **Subir presupuesto en hora valle** — concentrar el gasto donde tienes capacidad ociosa,
    que además es cuando regalas la bebida. · **DUEÑO** · **$**
43. **CAC real por canal** — ya existe el reporte de rendimiento de campañas; falta dividir
    gasto entre clientes nuevos y compararlo contra el techo. · **DUEÑO**
44. **Alerta de CAC sobre el techo** — el techo calculado es S/12.81 (LTV S/38.43 a 3:1).
    Si una campaña lo pasa, avisar antes de que se coma el mes. · **DATOS**
45. **Audiencia lookalike de tus mejores clientes** — Meta la construye desde la lista de
    quienes más piden. · **DUEÑO** · **$**
46. **Excluir clientes activos de las campañas** — pagar por alguien que ya te compra todas
    las semanas es el desperdicio más común y más invisible. · **DUEÑO** · **$**
47. **Publicar el menú secreto del mes solo** — al publicarlo desde el panel, sale el post.
    Hoy sale el push al cliente pero no el contenido social. · **DUEÑO** (secrets de Meta)
48. ~~**Story de "quedan N"**~~ — **DESCARTADO por el dueño (2026-08-29).**
49. ~~**Post automático de hora valle**~~ — **DESCARTADO por el dueño (2026-08-29).**
50. ✅ **Generar el calendario de contenido, no solo recordarlo** — hoy el cron te avisa que
    toca; esto arma los borradores con el generador de guion que acabas de estrenar. · **HOY**
51. **Mejor horario de publicación** — medido con el engagement real de tus posts. · **DATOS**
52. **Reciclar el post que mejor rindió** — a los N meses, con foto distinta. · **DATOS**
53. **Alerta de campaña sin conversiones** — N días gastando sin un solo pedido atribuido. · **DUEÑO**
54. **Cupón de cumpleaños** — hoy das puntos; un cupón con vencimiento corto convierte más
    porque tiene urgencia. · **HOY**
55. ✅ **Referidos escalonados** — premio creciente al 3.º, 5.º y 10.º invitado, en vez de plano.
    Convierte a un cliente contento en un canal. · **HOY**

## E. Retención y ciclo de vida del cliente

56. **Predicción de fuga individual** — no "no pidió en 30 días" sino "este pedía cada 8 días
    y va 20". El patrón propio de cada cliente. · **DATOS**
57. **Detección de cambio de frecuencia** — pasó de semanal a quincenal: se está yendo, y
    todavía no cumple ningún umbral de inactividad. · **DATOS**
58. **Recordatorio en su día y hora** — si siempre pide viernes 8pm, escribirle viernes 7pm.
    · **DATOS**
59. **"Lo de siempre" en un toque** — existe "repetir pedido"; esto lo propone solo, sin
    buscarlo. · **HOY**
60. **Pedido recurrente programado** — el cliente lo deja armado todas las semanas. Es
    ingreso predecible, que es justo lo que le falta a un negocio nuevo. · **HOY**
61. **Aviso de favorito de vuelta en stock** — hoy funciona solo si el cliente pidió el aviso
    de un agotado; esto usa sus favoritos guardados. · **HOY**
62. **Detección de cazador de descuentos** — solo pide con promo. No para castigarlo: para no
    gastarle más promos. · **DATOS**
63. **Segmentación por ticket promedio** — quien pide 30CM para dos no recibe el mismo
    mensaje que quien pide un 15CM solo. · **DATOS**
64. **Aviso de "te faltan N puntos"** — cuando está cerca de una recompensa. Con la tasa ya
    pareja a 20 pts/sol, ahora sí tiene sentido empujarlo. · **HOY**
65. ✅ **Resumen mensual personal** — "este mes pediste 4 veces, tu favorito fue X". Barato de
    hacer y sorprendentemente bueno para la relación. · **HOY**

## F. Producto y menú

66. **Recordatorio + borrador de rotación del menú secreto** — cada mes, con una receta
    propuesta desde los ingredientes que tienes. · **HOY**
67. **Detección de Signature que no se vende** — a los N días sin una sola venta, avisar.
    Ocupar sitio en la carta tiene costo. · **DATOS**
68. **BYO popular → candidato a Signature** — si mucha gente arma la misma combinación, ya te
    dijeron qué quieren. · **DATOS**
69. **Alerta de ingrediente que nadie elige** — comprarlo y que se eche a perder es pérdida
    silenciosa. · **DATOS**
70. **A/B de pitch de producto** — dos textos para el mismo Signature, medido por conversión. · **DATOS**
71. **Badge según ventas reales** — "MÁS PEDIDO" solo cuando de verdad lo es. Ya hubo que
    retirar badges por prometer algo falso; esto impide que vuelva a pasar. · **DATOS**
72. **Topping que siempre se quita** — si el 40% escribe "sin cebolla", la receta está mal,
    no el cliente. · **DATOS**
73. **Elasticidad de precio observada** — qué pasó con el volumen cuando subiste S/2. · **DATOS**
74. **Alerta de canibalización** — un Signature nuevo que se come las ventas de otro en vez
    de traer clientes. · **DATOS**
75. **Attach rate de bebidas** — qué porcentaje de pedidos lleva bebida, por producto y por
    hora. Las bebidas tienen mejor margen que los sándwiches. · **DATOS**

## G. Calidad y reputación

76. ~~**Seguimiento tras 1-2 estrellas**~~ — **DESCARTADO por el dueño (2026-08-29).**
77. **Detección de queja repetida** — el mismo cliente reclamando dos veces es un problema de
    proceso, no un cliente difícil. · **HOY**
78. **Tiempo real de entrega vs. prometido** — la columna `delivered_at` ya se llena; falta el
    reporte. Es el dato que dice si tu ETA miente. · **HOY**
79. **Alerta de pedido que pasó el ETA** — mientras todavía puedes avisarle al cliente, que es
    lo que evita la mala calificación. · **HECHO 2026-08-29 (tercer barrido en `alert-stuck-orders`, contra la promesa hecha al cliente)**
80. ~~**Encuesta de por qué no volvió**~~ — **DESCARTADO por el dueño (2026-08-29).**
81. ~~**Foto del pedido antes de salir**~~ — **DESCARTADO por el dueño (2026-08-29).**
82. ~~**Recordatorio de vencimiento de licencias**~~ — **DESCARTADO por el dueño (2026-08-29).**
83. **Respaldo automático de la base** — **hoy no existe ninguno.** Toda la operación vive en
    un proyecto de Supabase sin copia propia. · **HECHO 2026-08-29**
    (`.github/workflows/backup-db.yml`, diario, con el `SUPABASE_ACCESS_TOKEN` que el repo
    ya tenía: sin secrets nuevos y sin costo. El plan de la organización es `free`, que no
    trae respaldos de ninguna clase)
84. **Exportación mensual para el contador** — ventas del mes en el formato que te pida. · **DUEÑO**
85. ~~**Recordatorio de declaración de impuestos**~~ — **DESCARTADO por el dueño (2026-08-29).**
86. **Reporte del Libro de Reclamaciones** — consolidado para Indecopi si lo piden. · **HOY**
87. **Rotación del secreto de cron** — el valor sigue en texto plano en el historial de
    migraciones dentro de Supabase. Está pendiente desde hace tiempo. · **DUEÑO**
88. **Auditoría de cuentas admin inactivas** — hoy hay una sola, pero el día que haya más. · **HOY**
89. **Alerta de intentos de acceso admin fallidos** — repetidos desde la misma IP. · **HOY**
90. **Verificación de que el shell se actualizó** — tras cada deploy, confirmar que el service
    worker sirvió la versión nueva. Ya hubo un caso de shell viejo sobreviviendo. · **HOY**

## I. Datos y decisión

91. **Hipótesis vs. realidad** — la mezcla 15CM/30CM se asumió en 75-85% sin dato. El reporte
    ya devuelve `attach.size30Pct`: falta contrastarlo y avisarte cuando la realidad se
    aleje del supuesto. **Si el 15CM es el 80% del negocio, el precio del 15CM ES el precio
    del negocio** — y esa suposición gobierna casi todas las decisiones de margen. · **DATOS**
92. **Recalcular el modelo financiero cada mes** — con ventas reales en vez de simulación. · **DATOS**
93. **Alerta de supuesto roto** — cuando un número del modelo deja de parecerse a la
    realidad, avisar en vez de seguir decidiendo con él. · **DATOS**
94. **Envío automático del reporte de cohortes** — el RPC ya existe, nadie lo lee. · **HOY**
95. **Qué día y hora deja más margen** — no más ventas: más margen. No son lo mismo. · **DATOS**
96. **Detección de estacionalidad** — quincena, feriados, clima. · **DATOS** (mucho historial)

## J. Infraestructura

97. **Alerta de crecimiento de la base** — antes de topar el plan de Supabase. · **HOY**
98. **Alerta de latencia de la edge function** — si `api` empieza a responder lento, se nota
    en la conversión antes que en cualquier otro sitio. · **HOY**
99. **Prueba de humo en producción tras cada deploy** — pedir el catálogo y verificar que
    responde. Hoy el CI verifica antes de desplegar, nadie verifica después.
    · **HECHO 2026-08-29** (`scripts/smoke-prod.mjs` al final de `deploy-api.yml`)
100. **Restauración de prueba del respaldo** — un backup que nunca se restauró no es un
     backup. Es el complemento obligatorio del 83. · **HECHO 2026-08-29** (el workflow
     restaura el volcado del día en un Postgres real y compara; `npm run check:backup`
     prueba el mecanismo con datos hostiles en cada `verify`)

---

## Las 12 que yo haría primero

En este orden, y con este razonamiento:

| # | Automatización | Por qué esta |
|---|---|---|
| 83 | Respaldo de la base | **No existe ninguno.** Todo el negocio en un solo proyecto sin copia. Es el único de la lista donde el peor caso es "se perdió todo" |
| 100 | Restaurar el respaldo de prueba | Sin esto el 83 es fe, no respaldo |
| 2 | Aviso de "toca cocinar" | Ataca el cuello de botella real: tú |
| 11 | Bloqueo preventivo de Signature | Impide vender lo que no vas a poder entregar |
| 23+24 | Auto-pausa y reapertura | Lo mismo, del lado de la capacidad por hora |
| 16 | ETA ajustada por cola | Un ETA que miente es la causa directa de la mala calificación |
| 38 | Precio de insumo por compra | Desbloquea el 7, el 37 y todo el bloque de margen. Es la pieza base |
| 99 | Humo en producción tras deploy | El CI verifica antes; nadie verifica después |
| 60 | Pedido recurrente | Ingreso predecible, que es lo que más le falta a un negocio nuevo |
| 55 | Referidos escalonados | El canal más barato que tienes (S/7.65 contra S/10-25 de Meta) |
| 5 | Caducidad de tanda | Seguridad alimentaria, no optimización |
| 40 | Cierre de caja diario | Diez minutos diarios que desaparecen |

## Las que NO haría todavía

- **Todo el bloque marcado DATOS antes de octubre.** Son ~35 ítems. Con 3 semanas de
  ventas producen números con aspecto de dato, y el aspecto de dato es lo que hace que se
  les crea. El plan de tanda ya tiene esa salvaguarda incorporada (`reliable:false`); el
  resto la necesitaría igual.
- **41, 42, 45, 46 (Meta Ads automatizado).** Automatizar el gasto publicitario antes de
  saber tu CAC real es acelerar sin saber hacia dónde. Primero mide, después automatiza.
- **28 (OCR de vouchers).** Con el volumen de la primera semana, confirmar a mano es más
  rápido que integrar un servicio y pagarlo.
- **18 (WhatsApp al motorizado).** Necesita la API oficial y ya está la decisión tomada de
  esperar a tener volumen antes de meterse en eso.

## Lo que hace falta de tu lado

Varios ítems están bloqueados por datos que solo tú tienes y que **no voy a inventar**:

- Los 3 secrets de Meta (`META_PIXEL_ID`, `META_CAPI_TOKEN`, y los de publicación) — sin
  ellos, todo el bloque D de publicidad no se puede ni empezar.
- Lead times reales de cada proveedor (#13).
- Fechas de vencimiento de licencias y certificados (#82).
- Régimen tributario y qué formato pide tu contador (#84, #85).
- Cotizaciones reales de insumos para reemplazar los estimados de atún, embutido y envase.
- Cuántas porciones de 15CM salen de una focaccia entera — sigue pendiente y sin ese dato
  no se puede costear ese pan, que además el cliente elige gratis.
