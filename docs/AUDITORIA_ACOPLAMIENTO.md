# Auditoría: código que depende de un texto en vez de un objeto (2026-09-24)

Pedido del dueño, después de que la carta v4 rompiera decenas de pruebas y chequeos sin que
ninguna regla del negocio hubiera cambiado: *«no solo la carta, debes verificar todo el código
donde hay estos temas, generan errores como los de antes en los cuales perdimos mucho tiempo»*.

## La clase de defecto

Un dato del negocio —un producto, un precio, un umbral, una decisión— escrito como **texto
suelto** en más de un sitio, o una lógica que pregunta por **un código concreto** en vez de por
una **propiedad**. Nada revienta cuando se desalinea: el compilador no lo ve porque para él son
cadenas. Se descubre tarde, y siempre de la misma forma: una prueba o un chequeo que falla por
algo que no cambió, o —peor— un cliente que ve una cosa y paga otra.

Lo que se hizo en esta sesión y hay que dejar de hacer: buscar el daño contando cadenas
(`grep "SIG01"`), arreglarlo reemplazando frases exactas en los archivos, y tomar una oración de
un documento como si fuera un dato (así se escribió «a la plancha» sin que nadie lo hubiera
decidido: no hay plancha).

## Lo medido

| # | Qué | Cuánto | Riesgo |
|---|---|---|---|
| 1 | **Datos del negocio copiados entre cliente y servidor**, sincronizados solo por `parity.mjs`, que lee los dos archivos con 45 expresiones regulares | ~40 clases: carta (proteínas, Signatures, bebidas, nombres, exclusividad, doble), zonas y tarifa de envío, coordenadas de la tienda, horario, rangos, puntos de referido y su escalera, retos, tarjeta de regalo, cola, tope por hora, ventana de entrega, palabras de alerta, comisión de Culqi, bono de bienvenida | Alto: es exactamente lo que rompió la v4 |
| 2 | **La misma carta en una tercera copia**: el modelo en Python (`rentabilidad_por_parte.py`), que `check_costos.py` compara contra `catalog.ts` leyéndolo con regex | 1 copia entera | Alto |
| 3 | **Lógica que pregunta por un código** en vez de por una propiedad | El menú secreto se reconoce por `'SIG05'` en 5 sitios; las recompensas por `'R02'…'R06'` en 3 sitios; el orden de la carta es una lista de códigos | Medio |
| 4 | **Reglas de dinero escritas dos veces**: `rewardWaiver` y `findRewardTargetIndex` de `catalog.ts` repiten lo que ya hace `_shared/dinero.ts` | 2 funciones | Alto (dinero) |
| 5 | **Promesas al cliente con la cifra escrita**: «¡Reto completado! +50 pts» (×2) junto a `CHALLENGE_BONUS_POINTS`, «(S/2)» junto a `REGLAS.salsaExtra`; y en el panel, cifras del modelo («S/5.50», «S/0.48», «S/7.65», «S/17.87») | 4 al cliente, 4 al dueño | Medio: coinciden HOY; se rompen al primer cambio |
| 6 | **Ids que viajan por el HTML como texto** (`onclick="…'"+id+"'…"`), la clase del defecto de `mismoId` | 119 de 225 `onclick`; 59 comparaciones `.id ===` contra 9 `mismoId()` | Medio |
| 7 | **Chequeos de la base que leen SQL con regex** (`check-rpc`, `check-doble-escritura`) teniendo ya un Postgres local con el esquema real, donde `pg_proc` responde lo mismo como objeto | 2 chequeos | Medio: `check-rpc` ya tuvo un punto ciego por esto |
| 8 | **Pruebas con códigos de producto o precios escritos** | ~60 códigos en 20 archivos; 8 precios en 4 | Medio |
| 9 | **Documentos tomados como dato** | `RECETARIO.md` da por hecha la plancha (3 pasos) y sigue nombrando Signatures retirados | Bajo en código, alto en operación |

Defecto vivo encontrado y ya corregido: el panel de video caía a `'SIG01'` si no había Signature
elegido — un producto que la carta v4 retiró.

## El plan, en orden

Cada paso reemplaza una copia por **un objeto con tipo** que importan los dos lados, igual que
se hizo con el dinero (`_shared/dinero.ts`, paso 3 de la revisión de la base). El compilador
pasa a ser el chequeo; `parity.mjs` se achica a medida que sus comparaciones dejan de tener dos
lados que comparar.

1. **La carta única** (aprobada): `supabase/functions/_shared/carta.ts` con proteínas, panes,
   vegetales, quesos, salsas, bebidas y Signatures, cada uno con sus propiedades (`secreto`,
   `soloEnSignature`, `estrella`, `orden`, `sinDoble`…). La usan `catalog.ts`, el cliente (por la
   base nueva, como el dinero) y las pruebas; el modelo en Python lee una exportación a JSON que
   un chequeo mantiene al día. Resuelve 1 (la parte de carta), 2 y 3 (secreto y orden). Encima
   se carga la v4 en la base.
2. **Las recompensas como objeto**: cada una con su `tipo` (salsa, subir a 30, doble, bebida,
   sándwich). El dinero decide por el tipo, no por el código; se borran las dos funciones
   duplicadas de `catalog.ts`. Resuelve 3 (recompensas) y 4.
3. **Las reglas del negocio compartidas** (`_shared/reglas.ts`): envío, tienda, horario, rangos,
   referidos, retos, tarjeta de regalo, cola, entrega. Los textos interpolan de ahí. Resuelve el
   resto de 1 y 5.
4. **Los chequeos de la base contra la base**: `check-rpc` y `check-doble-escritura` preguntan
   a `pg_proc` del Postgres local en vez de leer migraciones con regex. Resuelve 7.
5. **Las pruebas que quedan**: códigos y precios a `cartaDeLaApp()` / `tests-api/carta.ts`.
   Resuelve 8.
6. **Los ids por HTML** se resuelven solos al migrar cada pantalla a la base nueva (lit-html
   pasa el objeto, no el texto: ver `src/nuevo/pantallas/fijo.ts`). Hasta entonces, `mismoId()`.
7. **Los documentos**: `RECETARIO.md` sin plancha y sin productos retirados. Regla nueva: una
   decisión del dueño entra al código solo si está anotada en `docs/DECISIONES.md` con su fecha;
   una frase en otro documento no es una decisión.

---

# Segunda pasada: otros defectos y problemas futuros (2026-09-24)

Pedido del dueño: *«¿qué más puedes encontrar de errores o futuros problemas de código?»*. Se
buscaron las clases que ya costaron caro en este proyecto: errores que se tragan en silencio,
escrituras que no son atómicas, dinero fuera del módulo de dinero, fechas en la zona equivocada,
permisos, validación y código muerto.

## Defectos vivos (van primero)

| # | Qué | Dónde | Qué pasa |
|---|---|---|---|
| A1 | **Registrar una tanda pisa el stock** | `actAdminInventoryRestock` (admin.ts) | Lee el stock, suma la tanda y escribe el total. Un pedido que reserva entre la lectura y la escritura queda borrado del stock: se vende lo que ya no hay. `restock_inventory` suma bien pero no anota la fecha de la tanda ni crea el insumo, por eso no se usa ahí. |
| A2 | **Vincular el pedido de invitado al crear la cuenta** no pasa por `aplicar_pedido_a_la_cuenta` | `actRegister` (auth.ts) | Tres pasos sin transacción (cuenta, historial, bono), con la regla del referido copiada y el mismo defecto de clave foránea que el paso 5 arregló en crear y confirmar: si quien invitó borró su cuenta, falla a medias. |
| A3 | **Cancelar un pedido pagado** (cliente y dueño) devuelve crédito y quita puntos en llamadas sueltas | `actCancelMyOrder`, cancelación admin (orders.ts) | Estado, cuenta e historial en pasos separados: si uno falla, el pedido queda cancelado con el saldo sin devolver, o devuelto sin anotar. Es lo único del dinero de la cuenta que no quedó en una transacción. |
| A4 | **«Cerrar sesión en todos los dispositivos» se traga el error** | `doLogoutEverywhere` (07-*) | Si la llamada falla, cierra la sesión local y el cliente cree que cerró todas: un teléfono perdido sigue con la sesión abierta. |
| A5 | **La hora programada se interpreta en la zona del teléfono** | `schedInputValue`/`effectiveOrderDate` (01-*) | Las horas son de la tienda en Lima, pero se arman con `setHours` y `new Date("AAAA-MM-DDTHH:mm")`, que usan la zona del dispositivo. Quien pide desde un teléfono con otra zona (un familiar desde el extranjero) programa corrido por la diferencia. |
| A6 | **El correo al cliente usa la paleta retirada** | `email.ts` (21 usos de `#A8C8B0`/`#1E3932`…) | `check:colores` no mira ese archivo. |

### Cerrados

- **A4** (2026-09-24): si el servidor falla, la sesión local queda abierta y el cliente ve el
  motivo. `tests/cerrar-todas-las-sesiones.spec.ts`, vista fallar sin el arreglo.
- **A6** (2026-09-24): era más grande de lo medido. Los correos de las **siete** funciones, el
  prompt de video y la página legal estática seguían en la paleta anterior, y `check:colores`
  tenía además un punto ciego propio: daba por comentario cualquier línea con un `//` antes del
  color — o sea todo HTML que dijera «SND//WCH» o «ALERTAS //». Detrás de ese punto ciego había
  139 respaldos y colores sueltos de la paleta vieja en el propio cliente. Ahora los correos leen
  `_shared/paleta.ts`, el chequeo la compara token por token contra el `:root` de `shell.html`,
  mira `supabase/functions/**` y el generador legal, y solo cuenta como comentario el `//` que
  abre la línea o sigue a código. Visto fallar con los dos defectos inyectados.
  ⚠ `send-order-email`, `daily-summary`, `birthday-bonus` y `winback-campaign` no están en el
  deploy automático: sus correos siguen viejos en producción hasta desplegarlas a mano.

## Problemas futuros (no rompen hoy)

- **157 de 163 acciones sin contrato** (`b: any`): la entrada no se valida por esquema y la salida
  no tiene tipo. Se cierran a medida que cada pantalla migra a la base nueva.
- **Comentario desactualizado** en orders.ts sobre «dos versiones vivas» de
  `finalize_order_customer_update`: el esquema real tiene una sola. Engaña al próximo que lo lea.
- **Tres exportaciones sin uso** (`BUSINESS_CITY`, `Constants`, `sbRpc`).

## Lo que se revisó y está bien

- Todas las acciones del panel exigen sesión de dueño (`requireAdmin` o secreto de cron).
- El dinero fuera de `dinero.ts` es solo formato de montos y reportes, no cobros.
- De los 40 `catch` vacíos del cliente, 37 son del navegador (almacenamiento local, service
  worker, vibración) donde ignorar el error es correcto; los 3 que tragan una llamada al servidor
  son A4 y dos recargas de direcciones que degradan a lista vacía.
- No quedan funciones de la base con varias versiones vivas.

## Orden de trabajo

A1 → A6 primero (defectos vivos, cada uno con su prueba vista fallar), después el plan de la
primera pasada empezando por la carta única.
