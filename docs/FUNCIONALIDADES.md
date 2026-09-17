# Qué hace la app hoy — flujos, medición y automatizaciones

Inventario de lo que existe. Salió de `CLAUDE.md` el 2026-09-17 por tamaño.

Sirve para dos cosas: saber si algo YA está construido antes de proponerlo de nuevo, y
encontrar dónde vive. Para el detalle real de una acción, la fuente es siempre el código
(`supabase/functions/api/index.ts` → `ACTIONS`) y los cron jobs de la base
(`select * from cron.job`), no este archivo.

---

## Flujos y funcionalidades actuales del cliente

Catálogo (`catalog.ts`, `PROT_PRICE`/`SIG_DATA`/`SIDE_PRICE`/`REWARDS`): 6 Signatures
(5 públicos + `SIG05`, menú secreto de **rotación mensual** — ya no se llama "The Vault",
decisión del dueño 2026-08-10, ver detalle abajo), 7 proteínas en el catálogo de las que
**4 se pueden armar en ARMA EL TUYO** (pollo teriyaki, atún, albóndiga y pavo — res y embutido
salieron por rentabilidad el 2026-09-05 y siguen vivas en sus Signatures; el pollo cajún es
exclusivo del menú secreto), **3 bebidas de la casa** (sin gaseosas de reventa, decisión de
marca — el chai salió el 2026-09-06 por costo), tamaños 15CM/30CM, doble proteína, salsa extra.

**THE CHICAGO (SIG07) está retirado del menú de apertura desde el 2026-08-22** (decisión
del dueño), junto con sus tres ingredientes exclusivos: `P07` (corte laminado), `T07`
(giardiniera) y `S13` (au jus). No fue por el producto — era el naming mejor resuelto del
catálogo y el único plato que nadie más vende en Trujillo — sino por costo de producción
para una persona sola: 3 días de calendario, corte propio a S/28-34/kg en tanda separada,
punto de cocción con margen de pocos grados, laminado que a cuchillo no llega al grosor
que pide la técnica, la giardiniera como único topping de producción propia (5 días de
anticipación) y el au jus en envase aparte con riesgo de derrame en moto. **La receta
completa quedó guardada en la PARTE 7 de `RECETARIO.md`**; lo que destraba su regreso es
rodaje + una rebanadora. En el código, cada punto donde se retiró tiene un comentario con
las instrucciones exactas para restaurarlo — buscar `SIG07`.

Consecuencia estructural a no olvidar: `SIG_ONLY_PROTS`/`SIG_ONLY_TOPS`/`SIG_ONLY_SAUCES`
quedaron **vacíos** (SIG07 era el único Signature público con ingredientes propios) y
`sigOnly` ya no aparece en ningún literal de `PROTS`/`TOPS`/`SAUCES`. El mecanismo sigue
vivo a propósito: en `src/app.ts` los tres arrays llevan **anotación de tipo explícita**
que declara `sigOnly?:boolean` justamente para que los filtros `!x.sigOnly` sigan
compilando sin inventar un dato falso. No borres esa anotación "porque nadie la usa".

**El menú secreto (SIG05) no se cocina hasta que alguien lo desbloquee** (decisión del
dueño, 2026-08-22): se abre a los 3 pedidos pagados (bajado de 5 el 2026-08-26), así que en la primera semana de
operación nadie puede pedirlo y preparar una tanda de `P03` sería cocinar algo que no se
puede vender. El Signature sigue en el catálogo; lo que cambia es solo cuándo se produce
su proteína. No es un cambio de código.

**Formato de pan (fotografía/generación de producto):** el sándwich SIEMPRE es un pan
tipo sub/hoagie alargado (formato "Subway"), sin importar el nombre del `BASES` elegido
(`CLASSIC // WHITE`, `HERBS // CHEESE`, o `FOCACCIA // ARTESANAL`) — esos nombres
describen sabor/textura de la masa, no la forma física del pan. Nunca usar pan de molde
en rebanadas ni ninguna otra forma al buscar/generar fotos de producto para cualquier
Signature o build.

- **Pedido normal**: build-your-own o Signature → carrito multi-ítem → checkout
  (nombre/dirección/teléfono, opcional cuenta) → pago Culqi (tarjeta, reserva atómica
  `prepare-order`+cobro+`place-order`), Yape/Plin (manual, queda `pending` hasta que un
  admin confirma), crédito propio, o recompensa que cubre el 100%. Puede programarse
  para más tarde (`scheduledFor`, dentro de horario de atención).
- **Combo + hora valle**: sándwich+bebida = **-S/1** (una vez por par; bajado de S/2 el
  2026-08-22, ver abajo). Bebida gratis (**hasta S/6**, subido de S/4 en la misma ronda)
  de 3pm-6pm hora Lima si el pedido se prepara en esa ventana (usa la hora de entrega si
  es programado, no la hora en que se arma el pedido). **Los dos nunca se suman** — solo
  se aplica el mayor de los dos.
- **Recompensas (R02-R06, puntos)**: 4ta salsa gratis, sube a 30CM gratis (tope plano
  S/8), doble proteína gratis, bebida gratis, sándwich 15CM gratis. Recalibradas contra
  el costo real de insumos (~45%, ver contexto de negocio).
- **Programa de puntos**: se ganan 1:1 por sol gastado (sin multiplicador VIP, retirado a
  propósito). Bono de bienvenida (registro), bono de referido (ambos lados), reto mensual
  (3 pedidos pagados = 50 pts), reto de descubrimiento (3 Signatures distintos = 50 pts).
- **Rangos** (`RANKS`, puramente de reconocimiento, nunca cambian precio/multiplicador):
  NUEVO → REGULAR (1) → INICIADO (5) → CÍRCULO INTERNO (15) →
  MESA FUNDADORA (30).
  **El menú secreto YA NO cuelga de los rangos** (2026-08-26): su umbral bajó a 3 pedidos y
  dejó de coincidir con INICIADO. Antes la tarjeta bloqueada decía "Se desbloquea en
  <RANGO>" derivando el nombre con `rankName(minOrders)` y la celebración post-pedido se
  disparaba con `rankUp==='INICIADO'` — con el umbral en 3 eso habría dicho "se desbloquea
  en REGULAR" (rango que se alcanza al primer pedido, o sea contradictorio) y habría avisado
  dos pedidos tarde. Ahora los dos textos hablan de PEDIDOS y el desbloqueo es un evento
  propio (`_lSecretUnlock`), así que el umbral se puede mover desde el panel admin a
  cualquier valor sin volver a tocar código.
- **Crédito interno** (`credit_balance`, no retirable, no es dinero real):
  - Regalar saldo PROPIO a otro cliente (`credit-gift`, sin costo extra).
  - **Tarjeta de regalo** (`gift-card-purchase`): comprar crédito para OTRO cliente
    gastando PUNTOS propios (40 pts = S/1, sin cobro real — rediseñada en 2026-07 desde
    un cobro Culqi que no encajaba con la intención original).
  - **Plan Semanal** (`prepare-weekly-plan`+`confirm-weekly-plan`): paga S/95 hoy con
    tarjeta (Culqi vía `create-credit-charge`), recibe S/100 en saldo propio al instante.
- **Pedido grupal** (`create-group-order`/`add-group-item`/`close-group-order`): un
  organizador crea un código, cualquiera con el link agrega su propio sándwich sin necesitar
  cuenta, el organizador cierra y paga todo junto por el checkout normal.
  **NO es un canal B2B y el dueño NO sale a conseguir cuentas** (corregido explícitamente por
  el dueño 2026-08-27, ver la advertencia de más abajo): es **el pedido de cualquier cliente**
  que compra para varias personas — una oficina, un grupo de amigos, una familia. Llega por la
  app como cualquier otro pedido y ese cliente se adquiere por la misma vía que todos los
  demás. **Nunca proyectes "N oficinas conseguidas al mes"**: nadie las va a conseguir.
  Lo que sí es cierto y medible: un pedido grupal trae **más sándwiches en un solo pedido**,
  así que sube la contribución por pedido y reparte el costo de adquisición entre más gente
  alcanzada. Desde el 2026-08-22 tiene incentivo propio: a partir de
  `ORGANIZER_FREE_MIN_SANDWICHES` (5) sándwiches, el **15CM más barato del grupo va gratis**.
  Detalles que no hay que romper: se perdona el **más barato del carrito, no "el del
  organizador"** (él paga la cuenta completa, así que es lo mismo, y en el carrito cerrado las
  líneas vienen mezcladas con nota "De: <nombre>"); usa la **misma elegibilidad que R06**
  (`eligibleR06`: 15CM y no RESERVE) para que no se gamee con el menú secreto; y el sándwich
  regalado **se excluye del conteo de combo**, igual que R06 — si no, el combo regalaría
  también la bebida emparejada con algo que ya es gratis. El servidor lo verifica entero
  contra la base (`organizerFreeSandwichApplies` en `actions/group.ts`): código válido, quien
  paga es quien organizó, 5+ sándwiches, y **ningún pedido cobrado ya con ese código de
  grupo** (sin eso se podía pasar el mismo carrito por el checkout varias veces). El
  `groupCode` que manda el cliente es solo atribución, nunca autorización.
  **⚠ DOS ERRORES REALES COMETIDOS SOBRE ESTE CANAL — no los repitas.**
  1. **El marco "canal de oficinas" / "comprar una cuenta de oficina entera" que este archivo
     usó hasta el 2026-08-27 era falso.** Daba por hecho una venta B2B que el dueño nunca dijo
     que haría, y que además contradice el hecho ya documentado de que sus mañanas están
     cocinando. Sobre ese marco se construyó un titular de "10 oficinas dejan S/3,000 netos al
     mes" que hubo que retirar entero. Un pedido grupal se modela como **más sándwiches en una
     fracción de los pedidos normales**, nunca como cuentas que se adquieren aparte.
  2. **El "~S/128-141 por publicidad" que decía este archivo NUNCA tuvo fuente.** Era una
     estimación interna escrita como si fuera dato, y después se usó en dos modelos
     financieros como si estuviera medida — con ella cualquier modelo concluye que la
     publicidad destruye valor, que es lo contrario de lo que dicen los datos con fuente. El
     CAC real de Meta Ads en Perú para rubro restaurantes (CPM S/5-12 + CTR 2.97% + CVR 1.89%
     + IGV 18%) es de **S/10.51 a S/25.23**, entre 5 y 13 veces menor. El referido cuesta
     **S/7.65** (el insumo del 15CM de R06 + la bebida de R05, no su precio de carta). Ver
     `PREDICCION_V7.md`, `modelo/modelo_v7.py` y `modelo/FUENTES.md`, donde cada número lleva
     etiqueta de origen y está la lista de lo que NO se pudo fundamentar.
  **Sin B2B ni puerta a puerta, la publicidad pagada es prácticamente el único canal de
  adquisición**, junto con los referidos de clientes que ya existen. Cualquier plan de
  crecimiento parte de ahí.
- **`?grupo=1` — el QR de la tarjeta de la bolsa** (2026-08-22). Promoción **pasiva** dentro
  de un pedido que ya entregaste: la tarjeta va en la bolsa y quien la escanea abre un pedido
  grupal directo. No exige ningún trabajo de venta del dueño — por eso sigue vigente aunque
  no exista canal B2B. Pide sesión, porque el servidor necesita saber a quién cobrarle al
  cerrar; si no hay, se anota la intención y `resumeWantedGroup()` la retoma tras el
  login/registro. Distinto de `?group=CODE`, que es unirse a uno existente y NO pide cuenta.
- **Cuenta**: registro (DNI obligatorio por el formulario normal), login, Google Sign-In
  (`actGoogleAuth` + `actRegister` con `googleIdToken` — **desde el 2026-09-12 SÍ crea
  cuenta, en un solo campo**, ver la sección propia más abajo), recuperación de PIN
  (DNI+fecha nacimiento),
  cerrar sesión en todos los dispositivos, borrar cuenta (anonimiza pedidos/ratings,
  borra datos estrictamente personales).
- **Otros**: direcciones guardadas, favoritos, calificación post-entrega, "avísame cuando
  vuelva" para un Signature agotado, Libro de Reclamaciones Virtual (público, exigido por
  ley — nunca modificar su texto legal), notificaciones push (Web Push/VAPID) para
  cambios de estado de pedido.
- **Admin**: cola de pedidos (avanzar estado uno a uno, confirmar pago manual, cancelar
  con/sin reembolso reconocido, y desde 2026-08-30 **tres señales sobre las direcciones que
  la cola ya tenía y no decía** — `queueAddressFlags` en `actions/orders.ts`: dos pedidos a
  la misma puerta (#22, con normalización real: "Av. España 123" y "av espana 123" son la
  misma), dos pedidos a la misma zona dentro de 45 min (#17 — la cercanía SIN ventana de
  tiempo es el consejo que hace llegar tarde a uno de los dos), y una dirección que el
  motorizado no va a encontrar (#21, con los motivos por separado porque "sin número" y "sin
  referencia" se preguntan distinto). Se calculan sobre los pedidos ya leídos: cero consultas
  extra y no pueden contradecir a la lista de al lado), dashboard de negocio (ingresos, tendencia 14 días, top
  productos, clientes en riesgo de fuga, reporte por rango de fechas, lista de
  preparación anticipada, rendimiento por franja horaria, direcciones problemáticas),
  gestión de inventario/cuentas admin/horario editable (con **modo tanda**: se escribe
  cuánto se PRODUJO y `admin-inventory-restock` lo SUMA server-side a lo que quedaba, en
  una sola llamada — el modo normal sigue fijando el valor absoluto), exportar CSV, log de
  auditoría,
  contenido de marketing semanal listo para copiar, **Salud del negocio**
  (`admin-health`: una sola pantalla con lo que hay que atender HOY — pagos por confirmar,
  pedidos parados, insumos agotados/por acabarse, reclamos cerca del plazo legal, crons
  caídos y picos de error; el VEREDICTO de cada señal lo calcula el servidor, la pantalla
  solo lo pinta), **Plan de tanda** (`admin-batch-plan`: cuánto cocinar de cada insumo para
  cubrir N días, con `reliable:false` mientras no haya ~14 días y 20 pedidos de historial —
  la pantalla muestra el motivo ANTES que las cantidades), **Salud técnica**
  (`admin-tech-health`: espacio en la base contra el tope de 500 MB, p95 de latencia, cuentas
  admin abandonadas) y **Cumplimiento** (`admin-compliance`: entrega real contra la prometida,
  quién reclamó más de una vez, y el consolidado del Libro de Reclamaciones descargable),
  y desde 2026-08-10 **Menú secreto**
  (publicar el sándwich secreto del mes — nombre/pan/proteína/toppings/salsas/precio/
  pedidos mínimos/foto/qué ingredientes quedan exclusivos ese ciclo — sin depender de una
  sesión de código, ver detalle técnico abajo).
- **Menú secreto con rotación mensual** (decisión del dueño, 2026-08-10 — reemplaza "The
  Vault" fijo que existió hasta esa fecha; SIG05 sigue siendo su id interno, el concepto
  "menú secreto/desbloqueo por rango/composición nunca revelada al cliente" no cambió,
  solo dejó de tener un nombre/receta fijos). Tabla `secret_signature` en Supabase
  (append-only: publicar SIEMPRE inserta una fila nueva, nunca actualiza in-place — la
  fila de mayor id es la vigente, así el historial de sándwiches secretos anteriores
  queda gratis). `loadSecretSignature()` (`supabase/functions/api/catalog.ts`) refresca
  `SIG_DATA.SIG05`/`SIG_LABEL.SIG05`/`SIG_GATES.SIG05`/`VAULT_ONLY_PROTS`/
  `VAULT_ONLY_TOPS`/`VAULT_ONLY_SAUCES` desde esa fila en cada `loadCatalogPrices()`
  (mismo patrón ya usado para precios editables, ver `catalog_prices`). El cliente
  (`src/app.ts`, `loadCatalogBackground()`) recibe la composición vigente vía la acción
  pública `get-catalog` (`secretSignature` en la respuesta) y sobreescribe la entrada
  SIG05 del array `SIGS` en memoria — el literal de `SIGS`/`SIG_DATA` en código es solo
  el respaldo/semilla del primer render, nunca la fuente real una vez que el fetch
  resuelve. Panel de edición: Admin // Catálogo // Menú secreto
  (`sAdminSecretSignature()`/`admin-secret-signature-get`/`admin-secret-signature-set`).

## Medición de campañas — Meta Pixel + Conversions API (2026-08-20)

Apagado por completo mientras no existan los secrets, y sin ningún id hardcodeado en el
repo: `supabase secrets set META_PIXEL_ID=... META_CAPI_TOKEN=...`. El `META_PIXEL_ID`
viaja al cliente dentro de `get-store-hours` (es público por diseño), así que **el píxel
se prende sin redesplegar el cliente**; el `META_CAPI_TOKEN` nunca sale del servidor.

- **Navegador** (`src/app.ts`): `initMetaPixel()` inyecta el snippet solo si llegó un id,
  y todo evento pasa por `fbTrack()`, que es un no-op si el píxel no existe. Se reportan
  PageView, AddToCart, CompleteRegistration, Lead (lista de espera) y Purchase.
- **Servidor** (`supabase/functions/api/meta-capi.ts`): manda la misma compra por
  Conversions API, que no la pueden bloquear los bloqueadores de anuncios. Los dos lados
  usan el MISMO `event_id` (la referencia del pedido) — así Meta deduplica en vez de
  contar la venta dos veces.
- **El valor reportado excluye el delivery** (pass-through al motorizado): incluirlo
  inflaría el ROAS con plata que nunca fue del negocio.
- **Un pedido Yape/Plin se reporta recién cuando el admin confirma el pago**, no cuando el
  cliente dice "ya pagué" — si no, Meta optimizaría hacia pedidos que nadie pagó.
- **PRIVACIDAD**: los datos personales van siempre hasheados con SHA-256 (nunca en claro),
  pero aun así se comparten identificadores de clientes con Meta. **La Política de
  Privacidad debería mencionarlo antes de activar los secrets en producción** — no se
  tocó el texto legal porque eso requiere pedido explícito del dueño.

## Automatizaciones (crons, todas en `api`, protegidas por `verifyCronSecret`)

Recordatorios al cliente: reto mensual sin reclamar, hora pico sin pedir, carrito
abandonado, **pago abandonado** (llegó a la pantalla de Culqi y no terminó — la abandonada
de mayor intención del embudo, y la única que no tenía seguimiento), segundo pedido,
re-enganche de rango alto, nunca ha pedido (3 etapas), aniversario de cuenta,
**resumen mensual personal** (#65, días 1-5 de cada mes: "pediste N veces, tu favorito fue
X" — corre CINCO días y no uno porque `MAX_PUSH_PER_RUN` corta en 200 por corrida y una sola
corrida dejaría sin resumen a todo cliente por encima de ese número hasta el mes siguiente,
cuando la ventana ya se movió; la marca `customers.monthly_recap_ym` hace que cada corrida
siga por donde quedó la anterior),
**crédito sin usar** (dinero que el negocio YA cobró: Plan Semanal, tarjetas de regalo,
crédito regalado), **post-cancelación** (a las 24 h, no al toque: en el momento la persona
está molesta), reclamos por vencer (plazo legal).
**Todos los crons de push tienen un tope de `MAX_PUSH_PER_RUN` (200, en `env.ts`) por corrida**: leían
hasta 20 000 clientes y enviaban en serie dentro de una sola invocación, así que con varios
cientos la función se cortaba a mitad por tiempo y la cola no recibía nada ese día, en
silencio. Lo que sobra se atiende en la siguiente corrida (las ventanas de elegibilidad son
de varios días) y llegar al tope queda en `debug_logs`, así que lo ve `error_spike()`. Recordatorios/alertas al
negocio: pedido estancado, pedido programado por empezar, stock bajo (cruce + diario),
**toca cocinar** (`alert-cook-now`, 08:15 hora Lima — NO es la alerta de stock bajo, que ya
existe: esta compara el ritmo real de consumo contra lo que queda y avisa cuando quedan
menos días de los que tarda producir una tanda (`COOK_LEAD_DAYS`). Enterarse a las 8pm no se
arregla con una compra rápida: hay que descongelar, cocinar y enfriar. El cálculo puro es
`batchPlanItems`/`cookNowItems`, compartido con la pantalla del plan de tanda para que las
dos no puedan decir cosas distintas),
**pedido programado sin insumo** (`alert-scheduled-shortfall`, cada hora en :22 — el cálculo
ya existía en la pantalla de preparación anticipada, pero solo lo veía quien la abría; el caso
que importa es el contrario: el pedido es para las 8pm, algo se marcó agotado a las 5pm y
nadie va a abrir esa pantalla en el medio. Reutiliza `prepShortfall`, probado en
`tests-api/faltante.test.ts`), **rechazo de tarjeta alto** (`alert-card-declines`, cada hora
en :47 — cruza los eventos `culqi-rejected`/`charge-succeeded` que `claimAndChargeCulqi` ya
escribía en `debug_logs` y nadie miraba. Exige un MÍNIMO DE VOLUMEN: 1 rechazo de 1 intento es
100% y casi siempre es una tarjeta sin fondos, y una alarma que suena por eso deja de mirarse
antes del día que importa. Un `culqi-fetch-failed` NO cuenta como rechazo: es la red, no la
tarjeta, y mezclarlos manda a revisar el lugar equivocado), **caducidad de tanda**
(`alert-batch-expiry`, 08:12 hora Lima, antes de la hora de servicio
— es SEGURIDAD ALIMENTARIA, no merma: el dueño cocina por tandas y en servicio solo arma,
así que hay proteína cocida esperando en frío durante días. `inventory.batch_cooked_at` la
escribe **solo** `admin-inventory-restock`; la edición normal de stock NO la toca, porque
corregir un número a mano es una corrección y no cocinar de nuevo. `shelf_life_days` arranca
en 3 —extremo conservador de la guía USDA/foodsafety.gov para carne y pollo cocidos a ≤4 °C,
que da 3-4 días— y **es editable por insumo desde el panel de Inventario**, para que mover el
umbral no exija una sesión de código. El cálculo puro vive en `batchExpiryStatus`
(`actions/orders.ts`) y está probado en `tests-api/caducidad.test.ts`: su modo de fallo no es
un error, es SILENCIO —la alerta que no sale— así que no alcanza con el typecheck),
contenido de marketing semanal (**que desde #50 no solo avisa: deja los borradores
escritos** en `marketing_calendar` para las próximas 4 semanas, saltándose toda fecha que ya
tenga entrada — el dueño edita en vez de escribir desde cero, y tocar el botón dos veces no
duplica nada), **intentos de acceso a tu panel** (`alert-admin-access`, horario en :53 — ver la sección de
E6: el bloqueo por intentos ya existía, lo que faltaba era que alguien SE ENTERE), **reporte de
cohortes al correo** (`send-retention-report`, día 1 de cada mes),
y **salud del sistema** (`alert-system-health`, horario:
crons caídos vía `dead_cron_jobs()` + pico de errores vía `error_spike()`; el job
`sndwch-alert-system-health` corre en el minuto :37 a propósito — 20 de los 26 jobs
disparan en :00 y este LEE el resultado de los otros, así que le conviene correr después).
**Dead-man switch de crons (2026-08-28)**: `api` anota un latido por cada corrida de cron
que llega (`record_cron_heartbeat`, en `index.ts`, best-effort). Existe porque pg_cron
guarda si DISPARÓ el job, pero `net.http_post()` vuelve al instante: "succeeded" ahí
significa "se encoló la petición", no "la edge function hizo su trabajo" — si el secreto de
cron rota o `api` responde 500, los 20 jobs siguen en verde para siempre mientras nada
ocurre. `dead_cron_jobs()` cruza las dos fuentes y avisa a los 3 disparos sin latido.
**Las 4 RPC del latido llevan `revoke execute ... from public, anon, authenticated`** — se
crearon sin él y `record_cron_heartbeat` quedó llamable con la anon key, o sea que
cualquiera podía escribir un latido falso y DEJAR MUDA la alarma justo mientras la
automatización estaba caída. Toda RPC `security definer` nueva necesita ese revoke: fue el
sexto caso del mismo defecto en este repo, y por eso desde el 2026-09-13 lo mira
`npm run check:rpc` en vez de la memoria de quien escriba la próxima migración. Cubre
solo los 20 jobs que llaman a `api` con un `action`; los otros 6 (4 edge functions aparte +
2 de SQL puro) quedan fuera a propósito y documentados en la migración.
Limpieza/expiración: pagos manuales sin confirmar,
cargos Culqi pendientes, Plan Semanal sin confirmar, conciliación de cargos Culqi
huérfanos (cobro real sin pedido/Plan Semanal detrás). Ver el mapa completo de acciones
en `supabase/functions/api/index.ts` (`ACTIONS`) y los cron jobs en Supabase
(`select * from cron.job` vía `execute_sql`) para horarios exactos.
