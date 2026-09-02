# Orden de ejecución de las 93 automatizaciones vigentes

Fecha: 2026-08-29 · Aprobado por el dueño: "todos, en orden de prioridad de los que más
generan dinero y la prioridad que indicaste en el documento".

Los números son los de `docs/100_AUTOMATIZACIONES.md` y **no cambian nunca**, aunque se
hayan descartado 7 (48, 49, 76, 80, 81, 82, 85).

## Cómo se ordenó

Dos criterios combinados, como pidió el dueño:

1. **Cuánto dinero mueve** — primero lo que protege ingresos ya existentes o los recupera,
   después lo que los genera, después lo que ahorra costo, al final lo que solo informa.
2. **La prioridad del documento** — las 12 que marqué como "haría primero" suben, y lo que
   marqué "no haría todavía" baja al bloque que corresponde.

Un tercer criterio que no estaba en el pedido pero manda igual: **las dependencias**. El
#38 (precio de insumo por compra) va temprano no porque genere plata por sí solo, sino
porque sin él no se pueden hacer el #7, el #37, el #8 ni el #15.

---

## Lote E1 — Nada de esto puede esperar ✅ HECHO (2026-08-29)

Ordenado por consecuencia del peor caso, no por dinero.

| Orden | # | Qué | Estado |
|---|---|---|---|
| 1 | 83 | Respaldo de la base | ✅ `.github/workflows/backup-db.yml`, diario. Usa el `SUPABASE_ACCESS_TOKEN` que el repo ya tenía: **cero secrets nuevos, cero costo** |
| 2 | 100 | Restaurar el respaldo de prueba | ✅ El workflow restaura el volcado del día en un Postgres real (`scripts/verify-backup.mjs`) y compara. Además `npm run check:backup` prueba el mecanismo con datos hostiles en cada `verify` |
| 3 | 99 | Prueba de humo en producción tras deploy | ✅ `scripts/smoke-prod.mjs` al final de `deploy-api.yml`; `npm run check:smoke` comprueba que de verdad detecta las 12 formas de romperse |
| 4 | 5 | Alerta de caducidad de tanda | ✅ `alert-batch-expiry` (cron diario 08:12 Lima) + señal en Salud del negocio + fecha de tanda y vida útil editable en Inventario |

**Un defecto real encontrado al construirlo**, y por qué valió la pena probar en vez de
razonar: el volcado pasaba cada fila por `JSON.parse` de JavaScript, así que todo número
cruzaba un `double`. Un `numeric` largo volvía redondeado (`0.10000000000000000001` →
`0.1`) y un `bigint` sobre 2^53 se desbordaba **al restaurar**. Un respaldo con el dinero
cambiado, que solo se habría descubierto el día de usarlo. Ahora las filas viajan como
`row_to_json(t)::text` y JS nunca toca los números.

## Lote E2 — Protege ingresos que ya existen ✅ HECHO (2026-08-29)

Lo que evita perder ventas o clientes que ya tienes.

| Orden | # | Qué | Estado |
|---|---|---|---|
| 5 | 11 | Bloqueo preventivo de Signature | ✅ **La premisa del documento era falsa y el defecto real era otro** — ver abajo |
| 6 | 26 | Alerta de pedido programado sin insumo | ✅ `alert-scheduled-shortfall`, cada hora. El cálculo ya existía en la pantalla de preparación; lo que faltaba era que avisara sin que nadie la abriera |
| 7 | 23 | Auto-pausa al llenar la hora | ✅ **Reinterpretado**: pausar la tienda ENTERA habría bloqueado también las horas vacías. El cliente ahora VE las franjas llenas antes de elegir |
| 8 | 24 | Reapertura automática | ✅ Sale gratis por construcción: la capacidad se calcula en vivo contra la hora actual, así que una franja deja de estar llena sola. No hay estado que revertir |
| 9 | 16 | ETA ajustada por cola | ✅ El estimado que se ve ANTES de pagar suma 5 min por pedido en cola, en vez del rango fijo 25-40 ciego |
| 10 | 79 | Alerta de pedido que pasó el ETA | ✅ Tercer barrido en `alert-stuck-orders`, contra la promesa hecha a ESE cliente (±5 min), no contra el reloj de la cocina |
| 11 | 32 | Alerta de rechazo de tarjeta alto | ✅ `alert-card-declines`, cada hora, con mínimo de volumen para que 1 rechazo de 1 no dispare nada |
| 12 | 33 | Reintento de cobro fallido | ⚠️ **Hecho hasta donde Culqi lo permite** — ver abajo |
| 13 | 27 | Recordatorio al cliente 1h antes | ✅ Segundo barrido en `alert-scheduled-orders`, con bandera propia: el aviso al negocio va 20 min antes, el del cliente 60 |
| 14 | 30 | Alerta de nota de cocina inusual | ✅ Lista compartida cliente↔servidor (con parity), bloque rojo en la comanda y "⚠️ ALERGIA" en el título del push |

### Dos correcciones a lo que decía el documento

**El #11 no era lo que decía.** La lista afirmaba que "el stock se descuenta pero nadie mira la
demanda ya vendida". Falso: `reserve_inventory` descuenta AL RESERVAR, así que la demanda ya
vendida sí está restada. El defecto real, verificado leyendo el código, era otro y peor: la
tarjeta de un Signature comprobaba `isAvail(base) && isAvail(prot)` mientras el servidor
reserva la receta COMPLETA (base + proteína + toppings + salsas + queso fijo). Si se acababa
un topping, una salsa o el queso, el Signature se seguía ofreciendo y el cliente se enteraba
al tocar PAGAR — el mismo patrón que ya obligó a poner el selector de distrito. Ahora
`sigInStock()` mira la receta entera.

**De paso apareció un segundo defecto real**: el servidor MANDA `fixedCheese`/`cheeseOptional`
en `sigItems`, pero el cliente no los volcaba sobre `SIGS`. Cambiar el queso fijo de un
Signature desde el panel no llegaba nunca al cliente.

**El #33 no se puede hacer entero, y no por falta de tiempo.** El token de tarjeta de Culqi es
de **un solo uso y vive 5 minutos**, así que el servidor no puede reintentar un cobro sin que
el cliente vuelva a poner una tarjeta. Un reintento automático exigiría guardar la tarjeta en
Culqi (One Click), o sea decidir guardar medios de pago de los clientes — decisión del dueño,
no un detalle de implementación. Lo que sí se construyó: el rechazo queda anotado en la
reserva, y el mensaje de recuperación dice "tu tarjeta no pasó, prueba con otra o con
Yape/Plin" en vez del genérico "se te quedó a medias", que hacía reintentar con la misma
tarjeta rechazada.

## Lote E3 — Genera ingresos nuevos ✅ HECHO (2026-08-30)

| Orden | # | Qué | Estado |
|---|---|---|---|
| 15 | 60 | Pedido recurrente programado | ✅ Tabla `recurring_orders`, cron `remind-recurring-orders`, pantalla propia y bloque en el carrito. **NO cobra solo y la app lo dice** — ver abajo |
| 16 | 55 | Referidos escalonados | ✅ Premio extra al 3.º (bebida), 5.º (15CM) y 10.º (dos 15CM), encima de los 400 pts por cada uno. La escalera se VE en el perfil antes de invitar |
| 17 | 59 | "Lo de siempre" propuesto solo | ✅ **YA EXISTÍA** — verificado, no se duplicó. Ver abajo |
| 18 | 64 | Aviso de "te faltan N puntos" | ✅ `remind-points-nudge`, semanal los jueves. La pantalla ya mostraba "+N pts para X"; lo que faltaba era el empujón proactivo |
| 19 | 54 | Cupón de cumpleaños con vencimiento | ✅ S/6 que vence en 7 días, en vez de 100 puntos que no vencen. **Cambia lo que recibe el cliente** — anotado como P18 para que el dueño confirme |
| 20 | 61 | Aviso de favorito de vuelta en stock | ✅ Extendido a favoritos, **y de paso corregido un defecto real** — ver abajo |
| 21 | 25 | Sugerencia de hora alternativa | ✅ Se nombra la siguiente franja libre y se ofrece a un toque, en vez de solo rechazar |
| 22 | 65 | Resumen mensual personal | ✅ `remind-monthly-recap`, días 1-5 de cada mes. Cinco días y no uno: el tope de 200 envíos por corrida dejaría sin resumen a todos los demás hasta el mes siguiente |
| 23 | 50 | Generar el calendario de contenido | ✅ El cron semanal deja los borradores escritos (caption, WhatsApp, idea de foto) + botón en el panel. **Y tres números públicos estaban mal** — ver abajo |

### Lo que no era como el plan lo decía

**#59 ya estaba construido.** La tarjeta "↻ Repetir pedido" aparece sola en el home Y en la
pantalla de Signatures ("↻ Tu de siempre"), y reconstruye el carrito anterior completo de un
toque — que es exactamente lo que el ítem pedía. Se verificó leyendo el código antes de
tocar nada, en vez de construir un duplicado.

**El #60 no puede cobrar solo.** El token de tarjeta de Culqi es de un solo uso y vive 5
minutos ([documentación de Culqi](https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens/)),
así que el servidor no puede volver a cobrar sin que el cliente ponga una tarjeta otra vez.
Tampoco cobra contra el crédito interno aunque técnicamente se podría: sacarle plata a
alguien sin una decisión fresca suya es la clase de sorpresa que cuesta el cliente entero.
Lo que hace es avisar una hora antes con el carrito ya armado, y **la app dice explícitamente
"no te cobramos sin que confirmes"** — hay un test que lo protege, porque si alguien
"mejora" ese texto a "se cobra solo", la promesa se vuelve falsa.

**El #50 destapó tres promesas públicas falsas.** El texto de marketing que el dueño COPIA Y
PEGA a Instagram/WhatsApp tenía números escritos a mano que se quedaron viejos: decía que
referir daba "50 puntos a ambos" (son 400 al que invita y 120 al invitado desde el
2026-08-15 — prometía menos de la décima parte), que el menú secreto se abre "desde tu 5to
pedido" (son 3 desde el 2026-08-26) y repetía "S/95 → S/100" al lado de las constantes
reales. Ninguno iba a avisar nunca, porque son texto y no cálculo. Ahora ese contenido es
una FUNCIÓN que interpola `REFERRER_REWARD_POINTS`, `SIG_GATES.SIG05.minOrders` y
`WEEKLY_PLAN_PRICE` en el momento de armarlo — el umbral del secreto además es editable
desde el panel, así que un literal se habría desincronizado otra vez.

**El #55 destapó un tercer camino de referido que nunca avisaba.** Vincular un pedido de
invitado al crear la cuenta (`auth.ts`) otorgaba el bono pero no mandaba ningún push: el
referidor ganaba su sándwich y solo se enteraba si abría la app y miraba sus puntos. Los
otros dos caminos sí avisaban desde hace semanas.

**Al hacer el #61 apareció el mismo defecto del #11 en otro sitio.**
`notifyRestockedSignatures` comprobaba solo pan y proteína antes de anunciar "¡Ya volvió!",
mientras el servidor reserva la receta completa: podía mandar a un cliente a un producto con
un topping todavía agotado, que el checkout iba a rechazar. Ahora mira la receta entera.

## Lote E4 — Devuelve tu tiempo (el cuello real) ✅ HECHO (2026-08-30)

| Orden | # | Qué | Estado |
|---|---|---|---|
| 24 | 2 | Aviso de "toca cocinar" | ✅ `alert-cook-now`, diario 08:15 Lima. No avisa "te quedaste sin stock" (eso ya existe) sino "al ritmo actual te queda menos de lo que tardas en producir" |
| 25 | 10 | Checklist de mise en place del día | ✅ Los mismos ingredientes de la lista de preparación, agrupados por dónde está cada cosa. La lista plana era correcta para leer e inservible para trabajar |
| 26 | 12 | Orden de cocción sugerido | ✅ Reinterpretado a **orden de ARMADO**: el dueño cocina por tandas y en servicio solo arma. Dice a qué hora EMPEZAR cada pedido, restando el tiempo acumulado |
| 27 | 9 | Escalado de receta | ✅ "Quiero 40 porciones" → cantidades exactas, con la base al lado para poder notar si el factor está mal |
| 28 | 3 | Temporizador de tanda | ✅ Cronómetro por etapa, con sonido y vibración: la app está en segundo plano mientras se cocina. **Los tiempos NO se escalan** — duplicar la tanda no duplica el braseado |
| 29 | 4 | Etiquetas de tanda imprimibles | ✅ Una por porción, con código, gramaje, fecha de producción y fecha límite. La vida útil viene del **inventario**, no de la receta |
| 30 | 40 | Cierre de caja diario | ✅ **El "ingreso del día" mentía por omisión de tres formas a la vez** — ver abajo |
| 31 | 19 | Confirmación de entrega por link | ✅ El motorizado abre un link y el pedido se cierra con la hora REAL. Token de un solo uso: se quema al confirmar |
| 32 | 17 | Agrupación de pedidos por cercanía | ✅ Misma zona + misma ventana de 45 min. La cercanía SIN la ventana de tiempo es el consejo que hace llegar tarde a uno de los dos |
| 33 | 22 | Aviso de dos pedidos a la misma dirección | ✅ Con normalización real: "Av. España 123" y "av espana 123" son la misma puerta |
| 34 | 21 | Detección de dirección ambigua | ✅ Con los motivos por separado — "sin número" y "sin referencia" se arreglan con preguntas distintas |
| 35 | 29 | Detección de comprobante duplicado | ✅ **Era más grave que el título**: el comprobante es una captura que el admin aprueba mirándola, y nada comparaba una contra las anteriores. La misma imagen respaldaba tres pedidos |
| 36 | 20 | Auto-cierre de pedidos sin calificar | ✅ A los 14 días deja de pedirla. El servidor **sigue aceptándola**: una reseña tardía es igual de válida y rechazarla sería tirar información real |

### El cierre de caja destapó tres formas de mentir con el mismo número

El resumen diario ya mandaba "ingresos del día", y para ESTE negocio ese número está mal
por omisión en tres direcciones que se acumulan:

1. **El delivery no es plata del negocio.** Es pass-through: el cliente lo paga dentro del
   mismo cobro y el dueño se lo entrega al motorizado. Sumarlo hace creer que se ganaron
   entre S/6 y S/15 más por pedido.
2. **Un pedido pagado con crédito interno no trajo plata hoy.** Ese dinero entró cuando se
   vendió el Plan Semanal o la tarjeta de regalo, quizá semanas antes. Contarlo hoy lo
   cuenta dos veces.
3. **La tarjeta no llega entera.** Culqi se queda 5.5%.

Un defecto que cometí y corregí en el mismo cambio: la primera versión descontaba solo el
reparto de los pedidos que trajeron efectivo. **Al motorizado se le paga igual aunque el
pedido se haya pagado con crédito**, así que eso dejaba fuera una salida de caja real y el
número salía optimista — la única dirección en la que un cierre de caja no se puede
equivocar. Hay un test que fija que un día de puro crédito da caja NEGATIVA por el monto del
reparto, porque eso es exactamente lo que pasa.

Lo sin confirmar (Yape/Plin donde el cliente dijo que pagó y nadie miró la cuenta) va aparte
y **no suma**: el día que sume una vez, la pantalla deja de servir para cuadrar contra el
banco.

### La decisión de fondo del bloque de cocina

**Las recetas pasaron de markdown a dato** (`production_recipes`, append-only como
`catalog_items`). Markdown no se puede escalar a 40 porciones ni disparar un temporizador.
`RECETARIO.md` NO se reemplaza: sigue siendo el porqué de cada decisión —por qué punta de
pecho y no lomo, qué pasa si sobrecargas la sartén— y ahí se queda; en la tabla vive solo lo
que hay que poder calcular.

Se sembraron **solo las tres recetas que el recetario documenta con cantidades y tiempos
reales** (P01 res, P02 pollo teriyaki, P06 albóndiga + marinara). Las otras las carga el
dueño desde el panel: el propio recetario marca cuáles están investigadas a fondo y cuáles
son propuesta sin cotizar, y transcribir una cantidad que nadie midió la convertiría en un
dato con aspecto de medición — en una pantalla que va a servir para comprar y cocinar.

**La vida útil NO se duplicó en la receta.** Ya vive en `inventory.shelf_life_days` (#5,
editable en el panel de Inventario) y es la que usa la alerta de caducidad. Las etiquetas la
leen de ahí. Dos números para la misma cosa terminan en que uno gana en silencio, que es
exactamente el defecto que costó tres semanas de precios fantasma.

### Lo que cambió respecto al plan

**El #12 decía "orden de cocción" y eso no describe este negocio.** El dueño cocina por
tandas 1-2 veces por semana; en hora de servicio solo arma. Decirle "cocina esto primero"
sería un consejo para una cocina que no existe. Lo que sí le falta y no tenía es a qué hora
EMPEZAR cada pedido — y con una sola persona los tiempos se acumulan, así que tres pedidos
para las 8pm no se empiezan todos a las 7:55. Ese era el defecto real.

**El #29 protegía menos de lo que parecía.** El comprobante se guardaba por pedido y nadie
comparaba si era el MISMO archivo que otro. Con dos pedidos seguidos del mismo cliente, el
único filtro era que el dueño se acordara de la captura. Ahora se guarda el SHA-256 de los
bytes y el aviso al admin NOMBRA el otro pedido. No bloquea la subida a propósito: un pedido
grupal pagado con una sola transferencia es legítimo, y rechazarlo dejaría sin avisar a
alguien que sí pagó.

## Lote E5 — Base de datos de costo ✅ HECHO (2026-08-30)

| Orden | # | Qué | Estado |
|---|---|---|---|
| 37 | 38 | Precio de insumo por compra | ✅ Tabla `ingredient_purchases` (cada compra es un hecho con fecha) + costo por porción derivado de las recetas. **Si falta el precio de UN ingrediente no se muestra total** |
| 38 | 31 | Reporte diario de conciliación | ✅ Dentro de `admin-culqi-report`: lo facturado contra lo que debería depositarse, más rechazos y cargos huérfanos |
| 39 | 34 | Reporte mensual de comisiones Culqi | ✅ Mismo reporte. A 5.5% sobre un mes de S/6 000 en tarjeta son S/330 — más que los costos fijos del negocio |
| 40 | 39 | Pasivo de crédito emitido | ✅ En el cierre de caja, **separado y etiquetado como acumulado**: mezclarlo con el día sería el mismo error que ese cierre vino a arreglar |
| 41 | 35 | Alerta de margen por pedido bajo el umbral | ✅ Al crear el pedido, con freno de 6 h. **La primera versión no habría saltado nunca** — ver abajo |

### El #35 casi queda como código muerto

Mi primera versión calculaba el costo como el 45% del precio **ya descontado**. Con eso el
margen da 55% por construcción y `belowFloor` no sería `true` jamás: una alerta viva en el
código y muerta en la práctica, que además da la falsa sensación de estar vigilado. Lo
detectó una prueba que escribí esperando que saltara y no saltó.

El defecto real que el ítem describe es justo el contrario: **el cliente paga menos y el
costo no baja**. La proteína, el pan y la salsa son los mismos con combo o sin él. Ahora el
costo se ancla al **precio de carta** de lo que se armó (`priceCartItem` sobre los ítems del
pedido) y el descuento sale entero del margen, que es lo que pasa de verdad. Hay una prueba
que compara los dos cálculos y falla si alguien "simplifica" quitando el precio de carta.

## Lote E6 — Higiene técnica y cumplimiento

| Orden | # | Qué |
|---|---|---|
| 42 | 97 | Alerta de crecimiento de la base |
| 43 | 98 | Alerta de latencia de la edge function |
| 44 | 90 | Verificación de que el shell se actualizó |
| 45 | 89 | Alerta de intentos de acceso admin fallidos |
| 46 | 88 | Auditoría de cuentas admin inactivas |
| 47 | 86 | Reporte del Libro de Reclamaciones |
| 48 | 77 | Detección de queja repetida |
| 49 | 78 | Tiempo real de entrega vs. prometido |
| 50 | 94 | Envío automático del reporte de cohortes |

## Lote E7 — Necesitan historial real (después de abrir)

**31 ítems.** Se construyen igual, pero cada uno con la salvaguarda de fiabilidad que ya
usa el plan de tanda (`reliable:false` mientras no haya suficiente historial, y el motivo
mostrado ANTES que las cifras). Sin esa salvaguarda producen números con aspecto de dato,
y el aspecto de dato es exactamente lo que hace que se les crea.

Números: 1, 6, 7, 8, 14, 15, 36, 37, 44, 51, 52, 56, 57, 58, 62, 63, 67, 68, 69, 70, 71,
72, 73, 74, 75, 91, 92, 93, 95, 96.

Recomendación: **empezar la semana del 28 de septiembre**, con ~3 semanas de ventas.

## Lote E8 — Bloqueados por el dueño

Ver `docs/PENDIENTE_DEL_DUENO.md`. Números: 13, 18, 41, 42, 43, 45, 46, 47, 53, 84, 87.

Casi todos cuelgan de una sola cosa: **los secrets de Meta**.

## Fuera de lote — resuelto SIN COSTO ✅ (2026-08-30)

- **28** (lectura del comprobante de Yape). Estaba archivado por costo; el dueño pidió
  buscar una opción gratuita y la hay: **Tesseract.js**, OCR en el navegador — sin cuenta,
  sin API key, sin servicio externo y sin costo por uso. Corre SOLO en el panel del dueño y
  SOLO al abrir un comprobante, así que los ~3 MB del motor no los descarga ningún cliente.

  **Lo que NO hace, y no puede hacer: confirmar el pago.** Una captura se edita en dos
  minutos, así que leerla automáticamente solo confirmaría una falsificación más rápido. El
  veredicto verde dice explícitamente "igual confirma contra tu cuenta", y hay un test que
  falla si ese texto desaparece.

  **Lo que sí hace** son los tres chequeos que el dueño haría a ojo: el monto contra el
  total del pedido, la fecha, y el **número de operación** — que detecta la MISMA
  transferencia usada en dos pedidos. Eso es estrictamente más fuerte que el hash de la
  imagen (#29): recapturar la pantalla cambia el hash y no el número.

  **Lo que quedó sin verificar**: los rótulos que busca el parser ("N° de operación",
  "Monto"...) se escribieron sin poder contrastarlos contra una constancia real de Yape —
  se acabó el límite de búsquedas web a mitad de la investigación. El parser acepta varias
  formas de decir lo mismo y **nunca inventa un dato**: lo que no reconoce vuelve `null` y
  la pantalla lo dice. Anotado como P20 para afinarlo con una captura real.

---

## Nota sobre el tamaño de esto

Son 50 automatizaciones en los lotes E1-E6 que se pueden construir ya, más 31 que esperan
datos y 11 que te esperan a ti. **No entra en una sesión.** Se va por lotes, cada uno con
sus pruebas y su `npm run verify` en verde antes de pasar al siguiente, y cada lote se
mergea a `main` para que se despliegue solo.
