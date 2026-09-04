# SND//WCH — guía para trabajar en este repo

Sandwichería con pedidos online (Trujillo, Perú). Cliente de una sola página + backend
en edge functions de Supabase. **Aún no ha abierto** — ver "Contexto de negocio" abajo,
afecta cualquier decisión de precio/margen.

## Estructura

- **Cliente**: `src/app/NN-*.ts` (toda la lógica y el tipado, sin framework) +
  `src/shell.html` (el resto del HTML/CSS, con el placeholder `__APP_JS__` donde se
  inyecta el JS compilado). `npm run build` compila cada parte y las **concatena por orden
  alfabético** para regenerar `index.html` en la raíz — **ese archivo es el único artefacto
  servido**; nunca lo edites a mano.
  Las 9 partes salieron de un único `src/app.ts` de 8 125 líneas (dividido el 2026-08-29).
  Son **scripts globales, NO módulos**: no llevan `import`/`export`, comparten un mismo
  ámbito y se ejecutan de arriba a abajo, así que **el orden importa** — hay estado
  (catálogo, constantes de dinero, helpers) que tiene que existir antes de lo de abajo. Por
  eso el prefijo numérico no es cosmético. `npm run check:bundle` (dentro de `verify`) exige
  prefijos `01..NN` consecutivos y sin `import`/`export` de nivel superior; sin eso,
  reordenar una parte no rompe la compilación, rompe la app en runtime.
  La división se verificó comparando el JS emitido **byte a byte** contra el del archivo
  único: idéntico. Lo único que hubo que resolver es que `tsc` antepone su propio
  `"use strict";` a cada archivo, y los 8 sobrantes caen a mitad del bundle donde la
  directiva no hace nada — `build.mjs` los quita al concatenar.
- **Backend**: 8 edge functions en `supabase/functions/`:
  - **`api`** — la principal, un solo entrypoint con un action por operación (login,
    catálogo, pedidos, admin, dashboard, etc.), dividida en módulos:
    `index.ts` (entrypoint + tabla de acciones), `catalog.ts` (precios/tasación),
    `db.ts` (PostgREST/RPC), `env.ts` (constantes/env vars), `session.ts` (tokens HMAC),
    `logging.ts`, `push.ts` (Web Push), `email.ts` (Resend), `types.ts`, y
    `actions/{admin,auth,catalog,complaints,customer,group,health,hours,orders}.ts`.
  - **`create-charge`** — cobro Culqi de un pedido (reclama contra `pending_charges`).
  - **`create-credit-charge`** — cobro Culqi del Plan Semanal (reclama contra
    `pending_weekly_plans`; NO lo usa la tarjeta de regalo, que ya no cobra con Culqi).
  - **`weekly-summary`**, **`daily-summary`** — resúmenes automáticos al dueño.
  - **`birthday-bonus`**, **`winback-campaign`**, **`send-order-email`** — funciones más
    viejas, de menor cambio.
- **Tests**: `tests/*.spec.ts` (Playwright, 20 archivos / 32 tests hoy — el número crece,
  no lo tomes como techo) — mockean el endpoint `api` por `action` (ver `tests/helpers.ts`
  → `gotoApp`/`mockBackend`) en vez de depender de red real. Nunca usan un reloj real
  fijado globalmente (rompe timestamps "realistas" de otros mocks) — si un test necesita
  una hora específica (ej. evitar la promo de hora valle), usa `page.clock.setFixedTime()`
  **dentro de ese test**, no en `helpers.ts`.
- **Migraciones DB**: `supabase/migrations/` tiene **el SQL real de las 122 migraciones**
  (un archivo `<version>_<nombre>.sql` cada una, extraído de
  `supabase_migrations.schema_migrations` el 2026-08-19 y verificado archivo por archivo
  con md5 contra la base; reconciliado de nuevo el 2026-08-28 — **el nombre del archivo
  DEBE llevar la `version` exacta que quedó registrada en la base, no la hora en que lo
  escribiste**: al aplicar con `apply_migration` y escribir el archivo unos minutos
  después se habían colado 8 desfases y 2 migraciones sin archivo. Verificar con
  `select version from supabase_migrations.schema_migrations` contra `ls` antes de dar por
  cerrada una sesión que aplicó migraciones), más `INDEX.txt` y un `README.md`. **4 archivos llevan el
  secreto de cron redactado a propósito** (`<CRON_SECRET_REDACTADO>`) — el valor sigue en
  texto plano en el historial dentro de Supabase, rotarlo es tarea pendiente del dueño.
  Una migración nueva se sigue aplicando con `mcp__Supabase__apply_migration`; para que
  quede versionada, escribe el mismo SQL en un archivo de esa carpeta en la misma sesión.
  Para el schema vigente de una tabla sigue siendo más confiable `mcp__Supabase__execute_sql`
  contra `information_schema` que leer el historial.

## El menú se edita desde el panel, no desde el código (2026-08-27)

Los 5 Signatures públicos viven en la tabla **`catalog_items`** (append-only: publicar
inserta fila nueva, la de mayor `id` por `item_id` es la vigente — historial gratis, igual
que `secret_signature`). `loadCatalogItems()` en `catalog.ts` sobreescribe en cada refresco
`SIG_DATA`, `SIG_LABEL` y el nuevo `SIG_CONTENT` (nombre, subtítulo, badge, pitch, foto,
activo). El cliente lo recibe resuelto por `get-catalog` (campo `sigItems`) y lo vuelca
sobre `SIGS`.

**Los literales de `SIGS` (src/app.ts) y `SIG_DATA`/`SIG_LABEL`/`SIG_CONTENT` (catalog.ts)
son SEMILLA**: el primer render antes de que resuelva el fetch, y el respaldo si la base no
responde. Editarlos no cambia el menú.

Qué se puede hacer ahora sin desplegar: renombrar, cambiar badge/pitch/foto, cambiar
composición (pan, proteína, toppings, salsas, queso fijo), cambiar precio, y **retirar un
Signature** publicando `active=false` — lo que con THE CHICAGO costó una sesión de código
entera, conservando la receta en la tabla para cuando vuelva.

**El precio de un Signature ya NO se toca desde `catalog_prices`.** Las filas de categoría
`sig` se borraron en la migración y `admin-catalog-set-price` rechaza esa categoría con un
error que apunta al panel nuevo. Si no, habría dos sitios fijando el mismo número y uno
ganando en silencio — el mismo defecto que costó 3 semanas de precios fantasma. Para
proteínas, bebidas y recompensas `catalog_prices` sigue siendo la fuente (ver la sección de
abajo, que sigue vigente para ellas).

SIG05 no está en `catalog_items`: el menú secreto tiene su propia tabla y su propio panel.
`loadCatalogItems()` ignora ese id explícitamente.

## ⚠ UN NÚMERO ESCRITO A MANO EN UN TEXTO ES UNA PROMESA QUE SE VA A ROMPER (2026-08-30)

El contenido semanal de marketing (`marketingContent()` en `actions/admin.ts`) es lo que el
dueño **copia y pega a Instagram y WhatsApp**: una promesa pública. Tenía TRES números
desactualizados a la vez y ninguno iba a avisar jamás, porque son texto y no cálculo:
"ambos ganan 50 puntos" por referir (son 400 y 120 desde el 2026-08-15 — prometía menos de
la décima parte de lo real), "se desbloquea desde tu 5to pedido" para el menú secreto (son 3
desde el 2026-08-26), y "S/95 → S/100" escrito al lado de las constantes que lo mandan.

Ahora esos textos son plantillas que interpolan la constante real en el momento de armarse.
**Regla para cualquier texto nuevo dirigido al cliente —push, correo, caption, pantalla—:
si menciona una cifra que el código ya conoce, interpólala; nunca la escribas.** El umbral
del menú secreto es el caso más claro: es editable desde el panel, así que un literal se
desincroniza el día que el dueño lo mueva, sin tocar una línea de código.

## ⚠ CAMBIAR UN PRECIO EN EL CÓDIGO NO CAMBIA EL PRECIO REAL

**Los literales de precio de `catalog.ts` (`PROT_PRICE`, `SIG_DATA`, `SIDE_PRICE`,
`REWARDS`) son SOLO la semilla del primer arranque. La fuente de verdad en runtime es la
tabla `catalog_prices`**, que `loadCatalogPrices()` carga encima de esos literales en cada
llamada. Si un código tiene fila en esa tabla, el literal del archivo NUNCA se usa para
cobrar.

Error real cometido y detectado recién el 2026-08-13: entre el 8 y el 9 de agosto se
escribieron en código 7 decisiones de precio aprobadas por el dueño (el "+S/2 de curaduría"
para que un Signature no cueste igual que armarlo en BYO, la corrección del precio del atún
marcada CRÍTICO en su propio comentario, el ajuste de R03, el pDbl de P06) — y **ninguna
tuvo efecto**, porque nadie tocó `catalog_prices`, que seguía con los valores del 8-23 de
julio. Durante ~3 semanas el código y la producción dijeron cosas distintas, y producción
ganaba. El caso más grave: SIG04 30CM se cobraba S/25 mientras la MISMA receta armada en
BYO costaba S/30 — el producto curado salía más barato que su propio build, con margen real
~39% contra el 55% objetivo. Ya sincronizado, pero la trampa sigue ahí para el próximo
cambio.

**Regla para cualquier sesión futura**: después de editar un precio en `catalog.ts`,
verificar con `execute_sql` si ese `code` tiene fila en `catalog_prices` y, si la tiene,
actualizarla en la misma sesión con `apply_migration`. Un cambio de precio no está
terminado hasta que la tabla lo refleje. (SIG05 es la excepción: su precio vive en
`secret_signature` y `loadSecretSignature()` corre DESPUÉS de `loadCatalogPrices()`, así
que una fila en `catalog_prices` para SIG05 sería ignorada.)

## Leer el comprobante NO es confirmar el pago (#28, 2026-08-30)

El OCR del comprobante de Yape/Plin corre con **Tesseract.js en el navegador del admin**:
sin cuenta, sin API key, sin servicio externo y sin costo por uso. Se carga bajo demanda
(`loadTesseract()` en `src/app/07-*`) y solo al abrir un comprobante, así que los ~3 MB del
motor no los descarga ningún cliente. Si el CDN no responde, el comprobante se abre igual —
el OCR es un extra y hay un test que lo fija.

**Una captura se edita en dos minutos, así que esto nunca confirma un pago.** El veredicto
verde dice explícitamente "igual confirma contra tu cuenta" y `tests/comprobante-ocr.spec.ts`
falla si ese texto desaparece. El estado "no se pudo leer" se muestra igual que los demás a
propósito: callarlo haría que la ausencia de aviso pareciera aprobación.

Lo que sí aporta es el **número de operación**: detecta la misma transferencia usada en dos
pedidos, y eso el hash de la imagen (#29) no lo puede ver, porque recapturar la pantalla
cambia el hash y no el número.

**Los rótulos del parser son best-effort y están sin verificar** contra una constancia real
(se acabó el límite de búsquedas web a mitad de la investigación). `parseTransferReceipt`
acepta varias formas de cada rótulo y **nunca inventa**: lo que no reconoce vuelve `null`.
Ajustar la lista con una captura real es P20 en `docs/PENDIENTE_DEL_DUENO.md`.

## El costo del menú deja de ser un literal de markdown (#38, 2026-08-30)

`ingredient_purchases` guarda **cada compra como un hecho con fecha** (cantidad, unidad, lo
pagado en total), no un catálogo de precios que se sobrescribe. El precio unitario se deriva:
`ingredientCosts()` da la última compra y el promedio **ponderado por cantidad** de las
últimas 3 — ponderado y no simple, porque 6 kg a S/20 y 0.5 kg a S/30 no cuestan S/25 el kilo.

Cruzado con `production_recipes` (#9), `recipeCost()` da el costo por porción. **Si falta el
precio de UN solo ingrediente, devuelve `null`** y la pantalla dice cuál falta: un total
parcial que se ve completo es un dato con aspecto de medición, y sobre un costo por porción
se fija el precio de venta. Las unidades tienen que coincidir entre receta y compra —
comprar en kg y pedir en g daría un costo mil veces menor sin ningún error visible.

Esto NO reemplaza `MENU_FINANCIAL_ANALYSIS.md` todavía: ese documento sigue siendo la única
fuente hasta que haya compras reales cargadas. Y **la merma sigue sin medir** (#6): el costo
por porción que calcula esta pantalla es el del insumo CRUDO por la cantidad de la receta,
no el de la porción terminada. Los rendimientos (res 0.54, pollo 0.64-0.69) siguen siendo
referencias, no medición propia.

## Una alerta de margen mal anclada nunca suena (#35, 2026-08-30)

`orderMargin()` calcula el costo estimado sobre el **precio de carta** de lo que se armó, no
sobre el total ya descontado. La primera versión hacía lo segundo, y con un costo plano del
45% eso da 55% de margen SIEMPRE, por construcción: la alerta habría quedado viva en el
código y muerta en la práctica, dando además la falsa sensación de estar vigilado.

El defecto que el ítem describe es justo el contrario: el cliente paga menos (combo +
recompensa + promo apilados) y **el costo no baja**. Por eso el descuento sale entero del
margen. Hay una prueba en `tests-api/costo-y-margen.test.ts` que compara los dos cálculos y
falla si alguien "simplifica" quitando el precio de carta.

## El "ingreso del día" no es lo que le queda al negocio (2026-08-30)

`cashClose()` (`actions/admin.ts`, pantalla Admin // Cierre de caja) existe porque el
ingreso bruto miente por omisión de tres formas a la vez en este negocio:

1. **El delivery es pass-through**: lo cobra el pedido y se lo lleva el motorizado.
2. **Un pedido pagado con crédito interno no trajo plata hoy** — entró cuando se vendió el
   Plan Semanal o la tarjeta de regalo.
3. **La tarjeta no llega entera**: `CULQI_FEE_RATE` (5.5%) se queda en el camino.

**El reparto se descuenta ENTERO, incluido el de los pedidos pagados con crédito**: al
motorizado se le paga igual. Descontar solo el de los que trajeron efectivo deja fuera una
salida de caja real y el número sale optimista — la única dirección en la que un cierre de
caja no se puede equivocar. Un día de puro crédito da caja negativa, y eso es correcto.

Lo pendiente de confirmar (Yape/Plin donde el cliente dijo que pagó y nadie miró la cuenta)
va aparte y **no suma**. El día que sume una vez, la pantalla deja de servir para cuadrar.

## Confirmación de entrega por link (#19, 2026-08-30)

`orders.delivery_token` se genera al pasar el pedido a EN CAMINO y **se borra al confirmar**:
el link es de un solo uso, así que reenviarlo por WhatsApp no puede recerrar el pedido más
tarde. La acción `confirm-delivery` es PÚBLICA a propósito — quien reparte no tiene cuenta, y
el token no adivinable es la autorización, mismo criterio que `ref` para un invitado.

Un token inexistente y uno ya usado responden **lo mismo**: distinguirlos le diría a
cualquiera si un link existió alguna vez. Lo que sí gana el negocio es que `delivered_at` por
fin lo escribe quien entrega y no quien se acuerda de tocar el botón un rato después — de esa
hora dependen la alerta de pedido estancado y la comparación contra la promesa de entrega.

## Las recetas de producción viven en la base, no en el markdown (2026-08-30)

`production_recipes` (append-only: publicar inserta fila nueva, la de mayor `id` por
`recipe_code` es la vigente — mismo patrón que `catalog_items` y `secret_signature`) guarda
lo que la app necesita CALCULAR de cada receta: ingredientes con cantidad numérica,
rendimiento en porciones, gramaje y etapas con minutos. De ahí salen el escalado (#9), el
temporizador por etapa (#3) y las etiquetas de tanda (#4), en Admin // Recetas.

**`RECETARIO.md` no se reemplaza y no es la fuente de estos números.** Sigue siendo la
explicación —por qué punta de pecho y no lomo, por qué la panade, qué pasa si sobrecargas la
sartén— y ahí se queda. Markdown no se puede escalar a 40 porciones ni disparar un
cronómetro; eso es lo único que se movió.

Solo están sembradas **P01, P02 y P06**, que son las que el recetario documenta con
cantidades y tiempos reales. Las demás las carga el dueño desde el panel: el propio recetario
marca cuáles están investigadas a fondo y cuáles son propuesta sin cotizar, y transcribir una
cantidad que nadie midió la convertiría en un dato con aspecto de medición.

**La vida útil NO está en la receta, a propósito.** Vive en `inventory.shelf_life_days`
(editable en el panel de Inventario) y es la que usa la alerta de caducidad (#5); las
etiquetas la leen de ahí. Dos números para la misma cosa terminan en que uno gana en
silencio. **Y los tiempos de las etapas NO se escalan con las porciones**: duplicar la tanda
no duplica el braseado, y escalarlos haría planificar la jornada contra un número falso.

## Lo que no produce ningún error es lo que hay que vigilar (lote E6, 2026-09-02)

Nueve automatizaciones que comparten un solo modo de fallo: **silencio**. Ninguna avisa de
algo que lance una excepción, así que ni el typecheck ni un catch las ven.

- **La base tiene 500 MB y el plan `free` no degrada con aviso**: al topar pasa a solo
  lectura y el negocio deja de tomar pedidos. `dbGrowth()` avisa al 70% (`db_size_bytes()` y
  `table_sizes()`, las dos `security definer` **con su `revoke`** — es el séptimo caso del
  mismo defecto en este repo).
- **La latencia se mide con p95, nunca con el promedio**, y solo se anotan las peticiones
  LENTAS (`recordSlowRequest` en `index.ts`, ≥1200 ms, `stage: "request-timing"` en
  `debug_logs`). Escribir una fila por request duplicaría el tráfico a la base para medir
  sobre todo peticiones sanas. Una petición de 8 s entre 99 rápidas no mueve el promedio y es
  justo la que hace abandonar un carrito.
- **#78 se mide con p90 por lo mismo**: nueve entregas de 30 min y una de tres horas dan un
  promedio de 45 que suena bien. Y **sin `delivered_at` no hay porcentaje**: rellenar los
  pedidos sin hora daría un "100% a tiempo" sobre cero entregas medidas.
- **#77 agrupa por TELÉFONO, no por nombre.** Dos "Juan Pérez" distintos saldrían como un
  reincidente y mandarían a buscar un problema de proceso que no existe.

### #89 — la alerta de acceso admin NO se ancla en la IP, aunque el ítem lo pedía

Rotar de IP es trivial; lo que un atacante no puede rotar es **a quién ataca**. Se registra el
intento fallido cuando el teléfono es de una cuenta admin — dato que `actLogin` ya tenía en la
mano (`fetchIsAdmin` se pide en paralelo), así que no cuesta una consulta. La IP entra solo
como **huella hasheada**, para separar "muchos intentos desde una conexión" de "pocos desde
muchas"; guardar la dirección real convertiría un registro técnico en uno de datos personales
sin ganar nada.

**Y el rastro va a `debug_logs`, no a `login_attempts`.** Esa tabla se BORRA al primer login
correcto (`reset_login_attempts`), así que el caso que más importa —probaron veinte veces y a
la veintiuna entraron— no dejaba ni una huella.

**Exige un mínimo**, igual que la alerta de rechazos de tarjeta: el bloqueo ya corta a los 5
intentos, así que avisar a los 5 sonaría cada vez que el dueño se equivoca de PIN. Son 10 en
una hora (dos bloqueos enteros a propósito) **o** 3 conexiones distintas — tres y no dos,
porque salir de casa con el celular ya cambia de wifi a datos y produce dos huellas.

`admin_accounts.last_login_at` (#88) se escribe **en el login y no en cada petición admin**:
el dato se mira una vez al mes y un write por request sería un costo permanente por nada. Un
`last_login_at` nulo es la señal **más fuerte**, no la más débil — es la cuenta que nadie
recuerda haber creado.

### #90 — verificar el shell desplegado compara CONTENIDO, no el código de estado

El fallo real del 2026-08-21 (shell viejo pegado a la vez en la app instalada, el celular y la
PC) respondía 200 en todo. `scripts/shell-live.mjs` compara dos sellos que ya existían contra
lo que hay en el repo: el `APP_BUILD` de `index.html` (hash del JS compilado, lo pone
`build.mjs`) y la `VERSION` de `sw.js`. **Son dos fallos distintos** — un index nuevo servido
por un service worker viejo es exactamente lo que ocurrió.

**Reintenta con espera creciente hasta 5 minutos** porque Vercel publica de forma asíncrona
tras el push: preguntar una sola vez mediría la carrera y no el resultado, y un chequeo que
falla en falso se apaga a la semana. Corre en `.github/workflows/verify-shell.yml` (push a
`main` que toque `index.html`/`sw.js`) — sin `npm ci`, no usa ninguna dependencia.

**`sndwch.app` está bloqueado por el proxy de este sandbox** (403 en el CONNECT, igual que el
host de Supabase), así que desde una sesión no se puede correr contra producción: para probar
cambios al script está `npm run check:shell`, que le sirve 6 formas de estar desactualizado y
exige que señale cada una. Va DESPUÉS de `build` en `verify`, porque compara contra el
`index.html` recién construido.

### #94 — el reporte de cohortes se manda solo, mensual, y avisa cuando no hay que creerle

`retention_report` existía desde hace tiempo y es el mejor dato del panel; el problema nunca
fue el cálculo sino que **hay que acordarse de abrir la pantalla**. Ahora `send-retention-report`
(cron, día 1 de cada mes) manda el correo con el detalle y un push con solo el titular.

**Mensual y no semanal**: una cohorte se mueve en meses, y un correo semanal con el mismo
número movido dos décimas se deja de abrir — y con él se pierde el mes en que sí cambió.

**La salvaguarda de fiabilidad va ARRIBA de las cifras, no al pie** (`retentionDigest`, mínimo
30 clientes): con 12 clientes "el 33% volvió" son 4 personas, y mover una cambia el número 8
puntos. Al pie se lee después de haberles creído. Mismo criterio que el plan de tanda. Y donde
no hay dato va un guion, nunca un 0: un 0 se lee como "medimos y dio cero".

## Checklist antes de dar por terminado un cambio en el cliente

1. `npm run typecheck` — cero errores (solo cubre `src/**`).
2. `npm run typecheck:api` — `deno check` sobre las 8 edge functions
   (`scripts/check-backend.mjs`). El backend NO tiene otra verificación estática: el CI
   despliega sin type-check, así que un error acá llega a producción.
3. `npm run test:api` — pruebas de COMPORTAMIENTO del backend, ejecutando el código real
   (`tests-api/`, corridas por `scripts/check-money.mjs`). Existe porque había un hueco
   estructural: los specs de Playwright mockean el endpoint `api` entero y nunca ejecutan
   una línea del servidor, y `typecheck:api` solo mira tipos. Por ese hueco pasaron dos
   defectos reales a producción con todo en verde — `pointsFor` devolviendo decimales
   contra una columna `integer` (reventaba DESPUÉS del cobro de Culqi) y
   `assertHourCapacity` consultando una columna inexistente cuyo error se tragaba un catch.
   **Cualquier función nueva que toque dinero va acá**, no solo al typecheck. No uses
   `jsr:@std/assert`: jsr.io está bloqueado por el proxy, cada archivo trae su propio assert.
   Hoy son 3 archivos / 23 pruebas: `dinero.test.ts` (`pointsFor`), `carrito.test.ts`
   (`deriveCart` — combo vs. hora valle, recompensas, sándwich del organizador) y
   `cancelacion.test.ts` (`cancellationDeltas`, la reversión al cancelar). El patrón para
   que algo sea probable acá es extraer el CÁLCULO puro de la acción que toca la base:
   `cancellationDeltas` salió así de las dos cancelaciones, que además lo tenían duplicado
   palabra por palabra.
4. `npm run parity` — compara las constantes de dinero duplicadas entre `src/app.ts` y
   `supabase/functions/api/**` (`scripts/parity.mjs`, 88 comprobaciones hoy). Si falla, el
   cliente mostraría un número y el servidor cobraría otro. Cubre precios, topes de
   recompensa, umbrales, zonas de delivery (con precio y excluidas), tarifa por distancia
   (`DELIVERY_KM_RATE`/`ROAD_FACTOR`/`MIN_FEE`/`MAX_KM` + `STORE_LAT`/`STORE_LON`), nombres, y
   los DOS precios del catálogo que NO viven en `catalog_prices` —`EXTRA_SAUCE_PRICE` y
   `BASE_SURCHARGE` (el recargo del pan de focaccia)—, para los que esta comparación es la
   única defensa.
5. `npm run build` — regenera `index.html` desde `src/`.
5b. `npm run check:backup` — viaje completo del respaldo (volcar → SQL → cargar en un
   Postgres real → comparar fila por fila) con datos hostiles a propósito. Levanta su
   propio Postgres, no hace falta configurar nada. Ver "Respaldo de la base".
5c. `npm run check:smoke` — comprueba que la prueba de humo de producción
   (`scripts/smoke-prod.mjs`, que corre tras cada deploy) de verdad SE DA CUENTA cuando
   producción está rota: se le sirven 12 formas de romperse y tiene que señalar cada una.
   Un chequeo de salud que siempre pasa es peor que no tener ninguno.
5d. `npm run check:shell` — comprueba que la verificación del shell desplegado
   (`scripts/shell-live.mjs`, la que corre en `verify-shell.yml` tras cada push que toca el
   cliente) de verdad SE DA CUENTA cuando producción sirve una versión vieja: se le sirven 6
   formas de estar desactualizada y tiene que señalar cada una. Va DESPUÉS de `build` porque
   compara contra el `index.html` recién construido.
6. `npm test` (o `npm run verify`, que ahora encadena diez) — deben pasar TODOS (revisa el
   conteo real en la salida, ej. "19 passed", no un número fijo escrito aquí).
7. Si el cambio toca un flujo cubierto por `tests/` (checkout, pedido programado, cola
   admin, borrar cuenta, reclamos, tarjeta de regalo, Plan Semanal, pedido grupal,
   recompensas), revisa que el test siga representando el flujo real antes de asumir que
   "pasa" = "funciona".
8. Commit + push a la rama de trabajo, merge `--no-ff` a `main`, push `main`.

## Respaldo de la base (2026-08-29)

**El plan de Supabase de esta cuenta es `free`, que NO tiene respaldos automáticos de
ninguna clase.** Hasta esta fecha la base no tenía ni un solo respaldo: un `delete` sin
`where`, una migración mal escrita o una cuenta comprometida borraban pedidos, clientes,
puntos y saldo de crédito sin vuelta atrás.

`.github/workflows/backup-db.yml` corre a diario (03:10 hora Lima, tienda cerrada) y **no
necesita ningún secret nuevo**: usa `SUPABASE_ACCESS_TOKEN`, el mismo que ya usa
`deploy-api.yml`, contra la Management API. Por eso no depende de nada del dueño.

- **Respalda DATOS, no esquema.** El esquema ya está versionado en `supabase/migrations/`;
  duplicarlo sería una segunda fuente de verdad, el mismo defecto que costó tres semanas de
  precios fantasma. **Restaurar de verdad = aplicar las migraciones y después cargar los
  datos** (`node scripts/backup-to-sql.mjs backup > datos.sql`).
- **La lista de tablas se descubre en cada corrida** (`pg_class`), nunca está escrita a
  mano: una lista fija dejaría fuera en silencio cualquier tabla nueva, y el día que eso
  importe es el día del desastre.
- **El comando de los cron jobs se guarda REDACTADO**: lleva el secreto de cron y el
  respaldo termina como artefacto de GitHub.
- **Las filas viajan como `row_to_json(t)::text`, no como objeto.** Si se parsean en JS,
  todo número pasa por un `double`: un `numeric` largo o un `bigint` sobre 2^53 vuelven
  CAMBIADOS. Probado — con la versión que parseaba, `0.10000000000000000001` se volvía
  `0.1` y el id `9223372036854775807` se desbordaba al restaurar.
- **El respaldo se RESTAURA en cada corrida**, no solo se guarda: el workflow levanta un
  Postgres, carga el volcado del día (`scripts/verify-backup.mjs`) y compara conteos y
  contenido contra el manifiesto. Un archivo que nunca se cargó no es un respaldo.
- `npm run check:backup` (dentro de `verify`) prueba el MECANISMO con datos hostiles a
  propósito —comillas, `$$`, saltos de línea, emoji, jsonb anidado, `text[]`, nulos, y una
  tabla con más filas que el tamaño de página— levantando **su propio Postgres**. Los dos
  chequeos hacen falta: el mecanismo puede estar bien y el volcado del martes venir cortado.
- Retención de los artefactos: **90 días**, el techo del plan gratuito de GitHub.

## Cómo desplegar el backend

**El despliegue de `api`, `create-charge`, `create-credit-charge` y `weekly-summary` es
automático vía CI — NUNCA lo hagas llamando a `mcp__Supabase__deploy_edge_function` a
mano para estas 4.** `.github/workflows/deploy-api.yml` corre en cada push a `main` que
toque `supabase/functions/**` y ejecuta `supabase functions deploy` para esas 4 funciones
directo desde el checkout del repo, sin costo de tokens.

`daily-summary`, `birthday-bonus`, `winback-campaign` y `send-order-email` **NO están en
ese workflow** (sus `entrypoint_path` en `list_edge_functions` apuntan a `/tmp/user_fn_.../
source/`, no al runner de GitHub Actions — señal de que la última vez que cambiaron fue
con un deploy manual). Si alguna vez tocas una de estas 4, sí necesitas
`mcp__Supabase__deploy_edge_function` a mano para esa función específica (son de un solo
archivo cada una, mucho más barato que `api`) — o mejor, agrégala al workflow.

Esto quedó documentado aquí después de que una sesión entera (2026-07-18/19) se gastó el
límite de varias sesiones intentando desplegar `api` a mano — leyendo y reincrustando sus
~18 archivos completos en cada intento — sin darse cuenta de que el push a `main` ya había
disparado el CI y el deploy YA estaba hecho, con éxito, minutos después del push.
`mcp__Supabase__deploy_edge_function` requiere el contenido completo de TODOS los
archivos de la función en una sola llamada (el bundler de Deno resuelve el grafo de
imports completo y falla con `Module not found` si falta uno) — eso es lo que hace que un
intento manual sea carísimo en tokens y fácil de arruinar a medias.

**Desde 2026-08-29 el workflow termina con una prueba de humo contra producción**
(`scripts/smoke-prod.mjs`): pide `ping`, `get-catalog` y `get-store-hours` al endpoint YA
desplegado y falla el workflow si algo no cuadra. Comprueba CONTENIDO, no solo el 200 — un
`get-catalog` que responde 200 con el catálogo vacío es una app sin menú, y para un chequeo
que solo mire el código de estado, un éxito. No necesita ningún secret (usa el mismo camino
público que un cliente). **Ese host está bloqueado por el proxy de este sandbox**, así que
desde una sesión no se puede correr contra producción: para probar cambios al script está
`npm run check:smoke`, que lo ejerce contra respuestas simuladas.

1. Después de pushear `main`, simplemente **verifica** con
   `mcp__Supabase__list_edge_functions` (barato) que `version`/`updated_at` de la función
   que tocaste avanzó. Si tienes dudas de que el CI corrió, revisa
   `mcp__github__actions_list` (`list_workflow_runs`, workflow `deploy-api.yml`) contra el
   SHA del merge commit — no releas ni reintentes el deploy solo porque el número "se ve
   igual" al que viste antes de pushear; puede que ya sea el post-CI y estés comparándolo
   contra sí mismo.
2. Solo usa `mcp__Supabase__deploy_edge_function` manualmente si el CI está roto/no
   disponible, o para una de las 4 funciones fuera del workflow. En ese caso sí exige los
   archivos completos de la función tal cual están en disco (nunca reconstruidos de
   memoria) y compara después con `mcp__Supabase__get_edge_function` contra git antes de
   confiar en que coinciden.
3. Cualquier migración de base de datos nueva (`mcp__Supabase__apply_migration`) va antes
   del push si el código nuevo depende de ella (columnas, RPCs, cron jobs) — las
   migraciones nunca pasan por este CI, se aplican aparte.

## Pedido fijo (recurrente) — NO cobra solo, y no puede (2026-08-29)

`recurring_orders` guarda día de la semana + franja + el carrito completo, y el cron
`remind-recurring-orders` (cada media hora, :05 y :35) avisa una hora antes con el carrito
armado. El cliente lo gestiona desde PUNTOS → "Mi Pedido Fijo" y lo crea desde el carrito.

**El límite es de Culqi, no del código**: el token de tarjeta es de **un solo uso y vive 5
minutos**, así que el servidor no puede volver a cobrar sin que el cliente ponga una tarjeta
otra vez. Un cobro automático exigiría guardar la tarjeta (Culqi One Click), o sea decidir
guardar medios de pago de los clientes — **decisión del dueño, no un detalle de
implementación**. Tampoco se cobra contra el crédito interno aunque técnicamente se podría:
sacarle plata a alguien sin una decisión fresca suya es la clase de sorpresa que cuesta el
cliente entero.

Por eso la app dice explícitamente "**no te cobramos sin que confirmes**" en las dos
pantallas, y `tests/pedido-fijo.spec.ts` lo protege: si alguien "mejora" ese texto a "se
cobra solo cada semana", la promesa se vuelve falsa y el cliente se entera el día que
esperaba su sándwich. Misma clase de promesa que ya obligó a retirar los badges MÁS PEDIDO y
EDICIÓN LIMITADA.

**Nunca se guarda el total** de la recurrencia, solo los ítems: el precio se re-tasa el día
del aviso. Congelarlo sería una segunda fuente de verdad, el defecto que ya costó tres
semanas de precios fantasma.

## Capacidad por hora, cola y ETA (2026-08-29)

`MAX_ORDERS_PER_HOUR` (10) y `QUEUE_MINUTES_PER_ORDER` (5) viven en **`env.ts`**, no en
`orders.ts`: `get-store-hours` también los necesita y `hours.ts` no puede importar de
`orders.ts` sin crear un ciclo (orders ya importa `storePausedUntil` de hours). `npm run
parity` compara los dos contra los valores por defecto del cliente.

- **El tope por hora ya existía, pero solo en el servidor.** `assertHourCapacity` rechazaba
  con 409 al pagar, así que el cliente armaba el sándwich entero, escribía la dirección y
  recién ahí se enteraba. Mismo defecto que ya obligó a poner el selector de distrito.
  Ahora `get-store-hours` devuelve `fullHours` (inicios de hora que llegaron al tope, 48 h
  hacia adelante) y el selector las pinta **tachadas y sin onclick** — se muestran, no se
  esconden: un hueco en la lista de horas no se explica solo.
- **La "auto-pausa" del plan (#23) se reinterpretó a propósito.** Pausar la TIENDA ENTERA al
  llenarse una hora habría bloqueado también las horas vacías: peor que lo que ya había. Lo
  que faltaba no era otro interruptor, era que el cliente lo viera antes de elegir.
- **La "reapertura automática" (#24) no existe como mecanismo y no debe construirse.** La
  capacidad se calcula en vivo contra la hora actual, así que una franja deja de estar llena
  sola cuando el reloj la pasa. Mismo criterio que la pausa temporal, que se reanuda
  comparando contra la hora en vez de guardando un "cerrado" que después hay que apagar.
- **El estimado de entrega ya no es ciego a la cola** (`estimatedDeliveryRange()`): suma
  `queueAhead × 5 min` al rango base de 25-40. `queueAhead` son los pedidos en
  RECIBIDO/PREPARANDO; los que ya salieron EN CAMINO no compiten por el tiempo de armado.
  Si el fetch de capacidad falla, `queueAhead` es 0 y el rango vuelve a ser exactamente el
  de antes — el peor caso es el comportamiento anterior, nunca una demora inventada.

## Flujos y funcionalidades actuales del cliente

Catálogo (`catalog.ts`, `PROT_PRICE`/`SIG_DATA`/`SIDE_PRICE`/`REWARDS`): 6 Signatures
(5 públicos + `SIG05`, menú secreto de **rotación mensual** — ya no se llama "The Vault",
decisión del dueño 2026-08-10, ver detalle abajo), 6 proteínas build-your-own (una puede
quedar exclusiva del menú secreto según el ciclo vigente, no se puede armar por BYO), 4
bebidas de la casa (sin gaseosas de reventa, decisión de marca), tamaños 15CM/30CM, doble
proteína, salsa extra.

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
- **Cuenta**: registro (DNI obligatorio, nunca opcional), login, Google Sign-In
  (`actGoogleAuth`, solo inicia sesión si el `google_id` ya está vinculado — nunca crea
  cuenta sin pasar por el registro normal), recuperación de PIN (DNI+fecha nacimiento),
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
automatización estaba caída. Toda RPC `security definer` nueva necesita ese revoke: es el
sexto caso del mismo defecto en este repo. Cubre
solo los 20 jobs que llaman a `api` con un `action`; los otros 6 (4 edge functions aparte +
2 de SQL puro) quedan fuera a propósito y documentados en la migración.
Limpieza/expiración: pagos manuales sin confirmar,
cargos Culqi pendientes, Plan Semanal sin confirmar, conciliación de cargos Culqi
huérfanos (cobro real sin pedido/Plan Semanal detrás). Ver el mapa completo de acciones
en `supabase/functions/api/index.ts` (`ACTIONS`) y los cron jobs en Supabase
(`select * from cron.job` vía `execute_sql`) para horarios exactos.

## Contexto de negocio (mantener actualizado — afecta toda decisión de precio/margen)

- **El negocio aún NO ha abierto** — fecha de apertura confirmada por el dueño 2026-08-01:
  **a más tardar la segunda semana de octubre de 2026** (movida desde el 7 de septiembre por
  trámites de permisos, confirmado por el dueño 2026-09-02 — los modelos de `modelo/` que
  arrancan en `date(2026, 9, 7)` quedan desfasados y hay que re-correrlos con la fecha nueva:
  el "mes 3" y el "mes 6" se mueven con ella). Todo lo que hay hoy en `orders`/`customers` en
  Supabase es data de prueba (unos 10 pedidos, 2 clientes) — NO representa ventas reales.
  Cualquier proyección financiera hecha antes del lanzamiento es una SIMULACIÓN basada en
  referencias/benchmarks, nunca un pronóstico con historial real — debe reconstruirse con
  datos reales apenas el negocio esté operando y haya volumen real que medir.
- **⚠ EL COSTEO IGNORABA LA MERMA DE COCCIÓN HASTA EL 2026-08-22 — no repitas el error.**
  Cuando compras 1 kg de carne cruda NO salen 1 kg de porciones. Rendimientos reales
  medidos contra referencias (ver `recetas/detalle-res.md` y `recetas/detalle-pollo.md`,
  con fuentes): **res 0.54** (limpieza 10% + cocción 40%), **pollo 0.64-0.69**,
  **res del corte laminado 0.567**. El costo real de la proteína terminada es **~1.85x**
  el que daba el cálculo anterior (85 g × precio/kg del insumo crudo). Costos por porción
  YA con merma: P01 S/3.15/S/6.30 · P02 S/2.47/S/4.95 · P03 S/2.49/S/4.97. Los de P04
  (atún ~S/4.82/S/9.64), P05 (embutido ~S/4.29/S/8.59) y P06 (albóndiga ~S/1.34/S/2.68)
  son **estimados sin cotizar**. Cualquier cálculo de margen parte de estos números, no
  del precio del insumo crudo.
  **⚠ El atún YA ESTÁ COTIZADO desde el 2026-09-04: S/4 la lata de 140 g, al por mayor**
  (dato del dueño). Eso es **S/43.96/kg escurrido** con la lectura conservadora (140 g de
  contenido neto, 65% de rendimiento al escurrir), contra los **S/67/kg investigados online**
  que usaba el modelo. La porción de 85 g de ensalada (68 g de atún + 17 g de mayonesa) pasa
  de **S/4.82 a S/3.25**, y la de 170 g de S/9.64 a S/6.50. **El atún deja de ser la proteína
  de peor margen del catálogo y pasa a estar sana en los dos tamaños** (42.0% y 41.7% contra
  51.3% y 51.9%). Su precio de venta NO se tocó: lo que cambió es el costo.
  ⚠ **Falta confirmar si los 140 g son peso ESCURRIDO o contenido neto.** Si fueran
  escurrido, el kilo sale a S/28.57 y la porción a S/2.20 — todavía mejor. La conclusión no
  cambia en ninguna lectura, por eso se usa la conservadora.
- **Margen de insumos+empaque**: base de trabajo acordada con el dueño de 45% del precio
  de venta — deliberadamente conservador/alto a propósito. Un cálculo directo con precios
  reales de Perú investigados dio ~26-36% según el producto; el dueño pidió trabajar con
  45% dejando margen extra reservado para mejorar el empaque más adelante. Mano de obra =
  S/0 en los cálculos (el dueño arma los pedidos él mismo, sin planilla, mientras el
  volumen lo permita — esto deja de ser válido si el volumen crece lo suficiente como
  para necesitar contratar).
- **⚠ EL PAN SE COTIZA POR UNIDAD, NO POR KILO — precio real del proveedor confirmado por
  el dueño 2026-08-22.** **Pan sub S/2 la unidad**, y **el 15CM usa MEDIO pan** → S/1.00 el
  15CM, S/2.00 el 30CM. El análisis financiero venía usando un proxy de S/11/kg × 71 g =
  S/0.78 (15CM) / S/1.56 (30CM), o sea el pan estaba **28% subcosteado**. Ya recalculado en
  `MENU_FINANCIAL_ANALYSIS.md`. Efecto: contribución por pedido S/16.68 → **S/16.42**, y
  **BYO 30CM de res cruzó el techo de 45%** (43.7% → 45.6%), la única combinación del
  catálogo que lo hace. Los 5 Signatures siguen holgados en los dos tamaños.
  **Focaccia: S/13 la entera → 10 porciones de 15CM o 5 de 30CM** (medido por el dueño
  2026-09-03; hasta esa fecha el rendimiento faltaba y la focaccia no se podía costear).
  Costo del pan: **S/1.30 el 15CM y S/2.60 el 30CM**, contra S/1.00 y S/2.00 del pan sub →
  sobrecosto real **+S/0.30 y +S/0.60**. Quedó del lado malo de la sensibilidad que este
  archivo tenía anotada (empataba recién a 13 porciones).
  **El tipo de pan ya NO es una elección gratuita**: `BASE_SURCHARGE` (duplicado en
  `env.ts` y `src/app/01-*`, comparado por `npm run parity`) cobra **S/0.50 y S/1.00** por
  la focaccia — se cobra más que el sobrecosto a propósito, porque el error nunca puede
  caer del lado de subsidiar el pan. Tres detalles que no hay que romper, todos con prueba
  en `tests-api/recargo-pan.test.ts`:
  el recargo va **DENTRO de `basePrice`**, para que **R06** (15CM gratis) lo perdone entero
  en vez de dejar al cliente pagando S/0.50 por un sándwich anunciado como gratis;
  `sizeUpgradeDiff` incluye el salto de pan, para que **R03** (subir a 30CM gratis) también
  lo perdone; y **un pan sin fila en `BASE_SURCHARGE` cobra 0**, nunca un recargo inventado.
  Un **Signature no lleva recargo**: ahí la receta fija el pan, el cliente no lo elige.
  El monto se muestra en la tarjeta del pan **antes** de elegirlo, no en el carrito.
  ⚠ Esto NO cierra el hueco de margen del BYO: **BYO 30CM de res sigue en 45.6%** con pan
  sub, que es donde la focaccia nunca entró. Ese caso se arregla subiendo el BYO, decisión
  que el dueño todavía no ha tomado.
- **Precios de insumos (Perú, julio-agosto 2026)**: res ~S/20/kg, pollo ~S/17/kg,
  **embutido premium (jamón/paté/cabanossi) S/48/kg — precio real confirmado por el dueño
  2026-08-01** (reemplaza el estimado investigado online de S/50/kg usado hasta la v4 de
  `MENU_FINANCIAL_ANALYSIS.md`; la simulación financiera sigue sin recalcular con este
  número, ver ese documento), carne molida ~S/10/kg, queso ~S/35/kg.
  **Atún en lata sigue siendo el único insumo sin cotización propia confirmada** —
  el análisis financiero usa ~S/67/kg (investigado online, Tottus) como estimado
  conservador mientras el dueño cotiza con un proveedor real. Las bebidas caseras (infusiones)
  tienen margen bruto real 61-84%, mucho mejor que los sándwiches — no conviene agregar
  gaseosas embotelladas de reventa (peor margen a precios de delivery creíbles, además de
  diluir la diferenciación de marca que ya se buscó al retirar D01-D05 del catálogo).
- **Gramajes de toppings al estándar de Subway desde el 2026-09-04** (decisión del dueño).
  Entró **T09 Lechuga** (21 g), que era el único ingrediente del set estándar de Subway que no
  existía en el catálogo — y el de mayor volumen al menor costo por gramo, o sea lo que más
  hace que un sándwich se vea lleno por lo que menos cuesta. Tomate subió de 25 a 35 g;
  aceituna, pimiento, cebolla y apio bajaron a su nivel de Subway. **Total 92 g contra 94 g
  antes: el cambio cuesta dos céntimos MENOS.** No fue una decisión de costo sino de reparto.
  La carne ya estaba al nivel (85 g/170 g contra los ~80-90 g que implican los 24-26 g de
  proteína del 6-inch de Subway). **La lechuga NO se agregó a ninguna receta de Signature** —
  entró solo al catálogo de ARMA EL TUYO, donde el cliente elige; meterla en una receta
  cerrada es una decisión de producto que el dueño no ha tomado.
  ⚠ **Subway no cobra las salsas: son gratis e ilimitadas.** Nosotros incluimos 3 y cobramos
  la 4ta a S/2. Cualquier propuesta de cortar la 3ra salsa va EN CONTRA de la paridad con
  Subway, no a favor — decidirlo es del dueño, pero no se puede presentar como "igualar".
- **NO habrá acompañamientos de comida — decisión del dueño 2026-08-15.** Nada de papas
  fritas, nachos, ni ningún side sólido. El único "acompañamiento" del catálogo son las 4
  bebidas de la casa (que en el código viven bajo `SIDES`/`SIDE_PRICE` por razones
  históricas — ese nombre NO significa que exista o vaya a existir comida de
  acompañamiento). Cualquier análisis futuro que proponga subir el ticket con un side de
  comida está proponiendo algo ya descartado: la palanca equivalente es la bebida, que
  además tiene mejor margen.
- **Empaque: papel manteca brandeado premium + bolsa — confirmado por el dueño
  2026-08-15.** NO se presupuesta aparte ni se suma al costo: el 45% de insumos+empaque
  se fijó deliberadamente por encima del costo real calculado (~26-36%) justamente para
  financiar esto. Ya está dentro del número.
- **Hipótesis (del dueño, 2026-08-15, explícitamente NO una decisión): el 15CM sería el
  tamaño dominante.** Analizada con el modelo v5 y respaldada por el propio producto (la
  app etiqueta 30CM como "Para compartir" y 15CM como "Para uno"; el delivery individual
  es un comensal). Estimación de trabajo: 75-85% de los pedidos en 15CM. Consecuencia
  práctica para cualquier decisión de precio: **si el 15CM es el 80% del negocio, el
  precio de 15CM ES el precio del negocio** — SIG06 a S/17 y las proteínas BYO a S/13-14
  gobiernan la caja mucho más que los precios de 30CM. Rango de sensibilidad medido:
  90% en 15CM → contribución S/10.27/pedido; 60% en 15CM → S/11.71 (21% de diferencia).
  No dar por sentado el número: reemplazarlo con la mezcla real apenas haya ventas
  (`retention_report` ya devuelve `attach.size30Pct`).
- **Precios con DECIMALES desde 2026-08-15 (.90) — la app se construyó asumiendo enteros.**
  Decisión del dueño: +S/0.90 plano sobre cada precio de sándwich (Signatures y proteínas
  BYO); bebidas y adicionales (pDbl, salsa extra) sin cambio. Excepción decidida aparte:
  SIG07 THE CHICAGO (ya retirado, ver arriba), que cobraba S/25 en 15CM y 30CM (el cliente pedía el doble sin pagar
  extra) → **15CM S/22 · 30CM S/29.90**. Consecuencia técnica: la aritmética de punto
  flotante empezó a producir basura visible (18.90 − 3 + 8.47 = 24.369999999999997, y ese
  número se le mostraba al cliente y se mandaba al servidor). Se agregaron `money()` y
  `pz()` en `src/app.ts`: **todo cálculo de dinero pasa por `money()` y todo total visible
  por `pz()`**. Si agregas un cálculo o un display de precio nuevo, úsalos — el servidor
  compara con `Math.round(total*100)` y tolera el ruido, pero el cliente no.
- **Bono de referido asimétrico (decisión del dueño 2026-08-15, recalibrado 2026-08-20)**:
  quien INVITA recibe `REFERRER_REWARD_POINTS = 400` (= un 15CM gratis: DEBE valer siempre
  lo mismo que R06 en `REWARDS`, y el chequeo `npm run parity` ahora lo verifica). El
  invitado recibe `REFERRAL_BONUS_POINTS = 120` (= una bebida gratis, R05), subido desde 50
  el 2026-08-20 porque él es quien tiene que decidir comprar y S/1.25 no le dicen nada a
  alguien que nunca pidió. Antes ambos recibían 50 (≈S/1.25, el 5% del ticket, muy debajo
  del 10-25% que mueve la aguja). **Los 720/50 que decía esta sección hasta el 2026-08-20
  eran valores muertos**: R06 bajó a 400 el 2026-08-15 y el doc no lo siguió. Las RPC
  `finalize_order_customer_update` y `reverse_referral_bonus` recibieron un parámetro nuevo
  `p_referrer_bonus` para esto — **la reversión por cancelación tiene que descontar el monto
  de cada lado por separado**, con el parámetro único anterior se devolvían 50 de los 400
  otorgados y quedaban 350 puntos regalados por un pedido que nunca existió.
  **Escalera de referidos (#55, 2026-08-30)**: encima de los 400 planos por CADA referido
  convertido, hay un premio extra al 3.º (120 pts = bebida), 5.º (400 = otro 15CM) y 10.º
  (800 = dos 15CM). Los escalones viven en `REFERRAL_MILESTONES` (`env.ts`) y **están
  duplicados en `src/app/01-*` solo para pintarlos**, con `npm run parity` verificando los
  dos lados — el cliente nunca suma puntos. Quién decide qué escalón toca es
  `nextReferralMilestone()` (cálculo puro, probado en `tests-api/escalera-referidos.test.ts`,
  incluido un test que falla si la escalera llega a costar más que el CAC más bajo medido de
  Meta); quién lo escribe es la RPC `grant_referral_milestone`, cuyo
  `referral_milestone_granted < p_tier` en el WHERE es lo que impide pagarlo dos veces si dos
  referidos convierten en el mismo segundo. Esa columna es **monotónica a propósito**: una
  cancelación baja `total_referrals` pero NO devuelve el escalón, porque los puntos pueden
  estar ya canjeados y quitarlos dejaría el saldo en negativo; lo que sí impide es volver a
  cobrarlo al recuperar el conteo.
- **Método de trabajo real del dueño (confirmado 2026-08-15) — no asumir otro.** (1) **Nunca
  reparte**: el motorizado siempre es aparte y lo paga el cliente (ver punto siguiente).
  (2) **Cocina por TANDAS 1-2 veces por semana** — proteínas, salsas y vegetales quedan
  listos; en hora de servicio cada pedido es solo **armar** el sándwich (~4-5 min con todo
  en mise en place), no cocinar desde cero. (3) Cocina **solo**, sin ayudante.
  Consecuencia: el techo de capacidad NO es el de "una persona cocinando cada pedido"
  (~9/día) sino mucho más alto (~40+/día); el cuello de botella real es la demanda, no la
  cocina. `MAX_ORDERS_PER_HOUR` en `orders.ts` se subió de 6 a 10 por esto. Cualquier
  modelo de capacidad futuro parte de acá.
- **Costos fijos mensuales: menos de S/500 — opera desde casa** (confirmado por el dueño
  2026-08-15). Sin alquiler de local. Los S/950 que usó el modelo v5 eran una estimación a
  ojo y estaban altos por casi el doble.
- **Distrito y zona de precio son DOS cosas distintas en el checkout (desde 2026-08-28).**
  El **distrito** (`DELIVERY_DISTRICTS` en `src/app.ts`) es obligatorio y decide si el
  pedido se puede entregar: los que están fuera de cobertura salen listados pero
  deshabilitados ("todavía no llegamos aquí"), y el distrito elegido se ADJUNTA al texto de
  la dirección que va al servidor (no hay columna propia; el motorizado igual lo necesita
  impreso). La **zona de precio ya no existe desde el 2026-09-02** — el envío se cobra por
  distancia real (ver abajo); `DELIVERY_PRICE_ZONES`/`DELIVERY_ZONE_FEES` sobreviven SOLO
  como respaldo del servidor para un cliente sin coordenadas. Antes la cobertura se adivinaba buscando el nombre del distrito dentro del
  texto libre de la dirección: quien no lo escribía pasaba sin querer y quien sí lo escribía
  se enteraba recién al tocar PAGAR. Ese substring (`DELIVERY_EXCLUDED_ZONES`, duplicado en
  `src/app.ts` y `env.ts`) sigue siendo **la única defensa real** — `assertAddressAllowed`
  en el servidor no ve el selector — así que recortar cobertura exige tocar los DOS lados,
  no solo marcar `out:true` en la lista de distritos.
- **El delivery se cobra por DISTANCIA REAL desde el 2026-09-02, no por zona.** El reparto
  lo hace un tercero con 50+ motorizados, coordinado por un grupo de WhatsApp, que cobra
  **S/2 por kilómetro** (dato del dueño). Hasta esa fecha la app cobraba un monto plano por
  ZONA **que elegía el propio cliente** en un desplegable, con `media` (S/8) por defecto: el
  cliente elegía su propio precio de envío y elegir el más barato no le costaba nada. El pin
  del mapa existía pero **solo AVISABA** del desajuste, y su texto llegaba a decir "puede que
  el motorizado te pida la diferencia al llegar" — una promesa sobre lo que haría un tercero.
  El dueño creía que la app ya cobraba por distancia; no lo hacía.
  Ahora: `km cobrables = haversine(pin, local) × DELIVERY_ROAD_FACTOR` y
  `tarifa = techo(max(DELIVERY_MIN_FEE, km × DELIVERY_KM_RATE) al medio sol)`. Las cuatro
  constantes más `STORE_LAT`/`STORE_LON` están duplicadas cliente/servidor y las compara
  `npm run parity` — si se desajustan, el cliente muestra un monto y el servidor cobra otro,
  y la diferencia sale del bolsillo del dueño al pagarle al motorizado.
  Detalles que no hay que romper: **el redondeo va hacia ARRIBA** (el error nunca puede caer
  del lado de quedarse corto, porque el delivery no tiene margen del que salga la
  diferencia); **`billableKm` devuelve `null` y nunca 0** cuando no puede medir (un 0 le
  cobraría el mínimo a alguien a 10 km); **el pin se pide una sola vez por dirección**
  (`saved_addresses.lat/lon` ya existían y `pickAddr` las restaura — si la dirección guardada
  no las tiene, se LIMPIAN, porque cobrar la distancia de la dirección anterior es el peor
  error posible acá); y **el servidor cae al cobro por zona si no recibe coordenadas**, a
  propósito, para que un shell viejo servido por un service worker desactualizado pueda pagar
  igual en vez de encontrarse el checkout roto.
  **`DELIVERY_MIN_FEE = 5`** es el mínimo real que el grupo de motorizados le cobra al dueño
  por un viaje corto (confirmado 2026-09-02): por debajo de 2.5 km la tarifa la fija ese piso
  y no los kilómetros. `orders.delivery_km` guarda los km cobrados para poder comparar contra lo que
  el motorizado cobró ese día.
  El monto se cobra dentro del mismo pago del pedido; el dueño le paga al motorizado con ese
  dinero. El negocio no gana ni subsidia el
  reparto. En pagos con tarjeta el fee se "engorda" por `CULQI_FEE_RATE` para que la
  comisión de Culqi no se coma el pass-through. **Error real cometido 2026-08-15**: el
  modelo financiero v5 metió al motorizado como costo fijo de S/1,100/mes y al reparto
  como pérdida de S/0.60/pedido, tomando eso de la sección "opciones de reparto" del
  informe de un agente en vez de leer `env.ts` donde ya estaba resuelto. Eso inventó un
  "valle del motorizado" inexistente y convirtió una meta alcanzable (S/3,000 netos en el
  mes 6, 74% de probabilidad) en imposible (mes 8). Corregido en v5.1. Antes de modelar
  cualquier costo operativo, revisar si el código ya lo resuelve.
- **Comisión de pago (Culqi/tarjeta)**: nunca se restaba del margen antes de esta sesión
  de análisis — estimar ~4-5.5% efectivo sobre pagos con tarjeta en cualquier cálculo de
  rentabilidad. Yape/Plin manual no paga esta comisión — es ahorro real, no solo
  preferencia operativa.
- **Yape/Plin es el MÉTODO DE PAGO POR DEFECTO desde el 2026-09-03** (`manualPayMethod`
  arranca en `'yape'`, no en `null`). Antes arrancaba en null, que es TARJETA: quien no
  tocaba el selector terminaba en Culqi pagando 5.5%. **El default no es un detalle de
  interfaz — es el que elige la mayoría, porque la mayoría no elige.** Al volumen del plan,
  mover el reparto tarjeta/Yape del 60% al 30% vale ~S/487/mes sin adquirir a nadie, y es
  la única de las tres fugas de margen que además le cuesta MENOS al cliente: el recargo de
  delivery engordado (`deliveryFeeAmount`) desaparece. Es un default, no un embudo: la
  tarjeta sigue a un tap, con su razón escrita al lado ("Automático") y el aviso del
  recargo. Lo que hay que cuidar al tocar esto (todo con prueba en
  `tests/yape-por-defecto.spec.ts`, cuyo modo de fallo es **silencio**: si alguien devuelve
  el estado inicial a `null` nada revienta, el negocio solo vuelve a pagar comisión):
  el botón de Yape muestra el ahorro **hipotético** de la tarjeta y por eso NO puede
  calcularse con `deliveryFeeAmount()`, que ya no engorda nada cuando Yape está elegido;
  y prender/apagar el crédito interno pasa por `toggleCredit()`, que **devuelve** el default
  al apagarse — el `manualPayMethod=null` que había escrito dentro del `onclick` dejaba al
  cliente en tarjeta después de dos taps en una casilla que quedó desmarcada.
  El costo real de este default lo paga el dueño en tiempo: cada pago manual hay que
  confirmarlo contra la cuenta (abaratado por el lector de comprobantes #28 —que NO confirma
  el pago, solo lo lee— y la confirmación por lotes del panel).
- **Subida de margen del 2026-08-22 (decisión del dueño, ya aplicada en código Y en
  `catalog_prices`).** Se hizo DESPUÉS de recostear todo el menú con la merma real; los 5
  Signatures ya cumplían el techo de 45% y esta subida es para ganar margen, no para tapar
  un hueco. Cuatro cambios:
  1. **+S/2 en los 5 Signatures**, en AMBOS tamaños (subir solo uno habría cambiado el
     valor de R03, que perdona la diferencia p30-p15). Quedan: The Original 20.90/26.90 ·
     The Marinara 21.90/28.90 · The Smoke 23.90/34.90 · The Fresh 20.90/34.90 ·
     The Teriyaki 19.90/25.90. **Las proteínas de ARMA EL TUYO NO se tocaron** — el dueño
     autorizó los Signatures, no el BYO. Consecuencia a vigilar: las combinaciones más
     ajustadas del catálogo ahora son BYO 30CM de res (43.7%) y de atún (43.2%).
  2. **`pDbl` deja de ser plano**: ahora hay `pDbl` (15CM) y `pDbl30` (30CM). El recargo
     no escalaba con la porción que agrega, así que en 30CM costaba más de lo que cobraba
     en 3 de 4 proteínas (res 105%, embutido 95%, pollo 83% del precio). Es el MISMO
     defecto que ya había obligado a apagar el doble de atún (`noDouble`), solo que ahí se
     apagó el producto en vez de corregir la estructura. Se subió solo donde pasaba el 45%.
  3. **Bebidas +S/2 (y +S/3 el chai)**: 6/5/6/9. El margen de 61-84% que se venía usando
     costeaba SOLO el insumo, nunca el envase — con botella con tapa a rosca a ~S/1
     (estimado, **falta cotizar**) el margen real era 56-66%.
  4. **Combo bajado de S/2 a S/1** y **topes de bebida gratis (R05_FLAT_WAIVER y
     OFFPEAK_DRINK_PROMO_CAP) subidos de 4 a 6**. Lo primero porque a S/2 el combo se comía
     del 58% al 118% de lo que deja una bebida (THE MIDNIGHT en combo dejaba −S/0.31); lo
     segundo porque con bebidas a S/5-9 un tope de S/4 dejaba "BEBIDA // GRATIS" sin cubrir
     una sola bebida del catálogo — promesa falsa, la misma clase que ya obligó a retirar
     los badges MÁS PEDIDO y EDICIÓN LIMITADA. Los puntos de R05 NO cambian (120): a S/6 de
     tope quedan en 20 pts/sol, justo donde ya está R06.
  **Efecto medido**: contribución neta por pedido **S/13.82 → S/16.68** (+21%), asumiendo
  mezcla 80% en 15CM, 25% de pedidos con bebida y 60% pagando con tarjeta.
  **Pendiente detectado y NO resuelto**: la "tasa de cambio" del programa de puntos quedó
  invertida — R03 cuesta 40 pts/sol y R04 53 pts/sol, contra 20 pts/sol de R05 y R06. Las
  recompensas caras salen más baratas en puntos que las baratas. Revisar con datos reales.
- **Programa de puntos**: recompensas (R02-R06 en `catalog.ts`) recalibradas para que el
  costo real de honrar cada canje sea consistente con el 45% de insumos de arriba — si
  ese % cambia de nuevo (ej. con datos reales de proveedor), estos puntos deberían
  revisarse también. La tarjeta de regalo (`GIFT_CARD_POINTS_PER_SOL` en
  `customer.ts`/`app.ts`) usa el mismo criterio (40 pts/sol) y debe recalibrarse junto.

## Restricciones permanentes (no negociables sin pedido explícito del usuario)

- **Nunca modifiques el texto legal** de Términos/Política de Privacidad/Cambios y
  Devoluciones (incluida la sección de CANCELACIONES) sin que el usuario lo pida
  explícitamente.
- **El DNI es obligatorio en el registro** — nunca lo vuelvas opcional ni lo quites.
- **Nunca inventes datos legales del negocio** (RUC, razón social, dirección) ni fotos
  de producto reales — si falta un dato real, pregunta antes de rellenarlo.
- **Operaciones git destructivas** (force-push, reset --hard, eliminar ramas) requieren
  confirmación explícita del usuario, incluso si el resto del flujo se hace "de manera
  directa".

1. **Responde siempre en español**, salvo que el usuario pida explícitamente lo
   contrario. Esto cubre TODO texto visible: el mensaje de cierre, pero también
   descripciones de tool calls, captions de archivos, nombres de tareas del checklist,
   preguntas de `AskUserQuestion`. Revisar cada uno antes de enviarlo, no solo el mensaje
   principal. **Español con "tú", nunca voseo argentino ("vos", "tenés", "sabés",
   "andá")** — corregido explícitamente por el usuario 2026-08-11, DOS VECES en la misma
   conversación (la sesión aceptó la corrección la primera vez y volvió a usar "vos" en
   el siguiente mensaje sin darse cuenta — no basta con aceptar la corrección una vez, hay
   que revisar el propio texto de salida contra esta regla antes de cada envío, no solo
   la primera vez que se corrige).
2. **"Primero muéstrame/hagamos X antes de Y" es un punto de parada real para avanzar de
   verdad** (comitear, pushear, mergear, expandir el cambio a otras pantallas, gastar algo
   real) — eso espera confirmación explícita antes de tocar Y. Verificación interna sin
   efecto visible para el usuario (typecheck, build, capturas tomadas para revisión
   propia) NO requiere esperar — no confundir diligencia propia con avanzar de verdad. Si
   se queda sin ningún paso productivo posible dentro de lo pedido (esperando una
   decisión que no llega), pedir permiso explícito para continuar en vez de asumirlo o
   quedarse detenido sin decir nada.
3. **Separa la fase de concepto de la fase de implementación.** Mientras se define una
   dirección (diseño, arquitectura, alcance de una feature), esa conversación se cierra
   explícitamente (el usuario elige) ANTES de escribir o modificar código de producción.
   No adelantar código de una opción todavía no elegida.
4. **No generes Artifacts (`Artifact` tool) salvo que el usuario los pida
   explícitamente.** Para mostrar resultados (capturas, comparaciones, propuestas
   visuales) usar `SendUserFile` en vez de publicar una página interactiva, salvo pedido
   explícito de algo interactivo/navegable.
5. **Antes de decir "no se puede" o "no tengo esa herramienta", revisa si ya se hizo
   antes** en este proyecto/sesión y busca la vía real (otras herramientas, `ToolSearch`,
   alternativas) antes de concluir que es imposible. No rendirse en el primer intento
   fallido.
6. **Mantén el checklist de tareas actualizado y honesto** (`TaskCreate`/`TaskUpdate`) —
   que refleje el estado real de lo pendiente; no marcar "completado" lo que quedó a
   medias esperando aprobación.
7. **Busca y usa proactivamente TODAS las herramientas disponibles, incluidas las
   diferidas** (vía `ToolSearch`) antes de asumir que algo no se puede o conformarse con
   una solución de segunda — muchas herramientas (búsqueda de stock, edición de imágenes,
   generación de diseño) no aparecen en la lista visible por defecto, solo se cargan si
   se buscan.
8. **Gastos reales (upgrades de plan, cualquier costo efectivo) requieren confirmación
   explícita previa** — confirmar el costo/tier antes de ejecutar. Excepción ya aclarada
   por el usuario: licencias de Adobe Stock en la categoría gratuita (`pricing:"free"`)
   se pueden aprobar directamente sin pedir permiso cada vez, siempre que se confirme que
   son gratuitas antes de licenciar.
9. **Documentar en este archivo las capacidades/limitaciones técnicas reales que se vayan
   descubriendo** (qué modelo de generación de imágenes funciona en este plan y cuál no,
   qué dominios bloquea el proxy de red, qué vías sí funcionan para descargar assets) para
   que la siguiente sesión no tenga que redescubrirlas desde cero. Ver "Capacidades y
   limitaciones técnicas descubiertas" más abajo.
10. **El "//" es la identidad de marca permanente — pero solo como concepto/ícono, no
    atado a ninguna estética específica.** Se mantiene siempre como símbolo de marca, pero
    NO está ligado a la paleta actual, a la tipografía actual, ni a ninguna connotación
    "tech/terminal" — esas son libres de cambiar y proponer. Las decisiones de identidad
    visual (paleta, tipografía, tratamiento del ícono) siguen la regla del punto 3
    ("concepto antes que código"): mostrar una propuesta concreta y esperar que se cierre
    la dirección explícitamente antes de tocar código — lo único no negociable es que el
    "//" en sí siga existiendo como marca. **SND//WCH NO tiene una identidad
    trujillana/regional** (confirmado explícitamente por el usuario 2026-07-29, al
    descartar una dirección "Chan Chan" inspirada en la ciudadela Chimú) — no proponer
    ni asumir referencias a Trujillo, cultura Chimú/Moche, o cualquier otro anclaje
    geográfico/regional específico en paleta, iconografía o naming, salvo que el usuario
    lo pida explícitamente en el futuro. **El "//" SIEMPRE representó el corte del
    pan/sándwich — nunca tuvo intención tech/terminal** (corregido explícitamente por el
    usuario 2026-08-08, tras una sesión de LLM Council que asumió mal que el "//" partía
    de una connotación de código que había que "reinterpretar" alejándose de ella). No es
    una reinterpretación ni un cambio de dirección: es el significado real desde el
    origen. El riesgo real señalado por esa sesión (alguien sin contexto puede leer "//"
    como sintaxis de código/ruta de archivo la primera vez que lo ve) sigue siendo válido
    como dato de percepción externa a reforzar visualmente — pero no asumir de nuevo que
    el propio proyecto/dueño alguna vez tuvo esa intención o que hace falta "corregirla".
    **"El '//' en sí" significa la FORMA — dos barras/trazos diagonales paralelos
    reconocibles como el glifo "//" — no solo el concepto abstracto de "corte".**
    Error real cometido 2026-08-11: al pedir "20 modelos creativos desde cero con el //
    como principal", se generaron 20 variantes que reinterpretaban el propio glifo en
    otras formas (puntos, hexágonos, espirales, red de nodos, chevrons) conectadas al
    concepto de "corte" pero ya no reconocibles como dos barras paralelas — el dueño lo
    rechazó explícitamente: "no vamos a cambiar nunca el //". Segundo error, mismo día,
    en la ronda de corrección inmediata: las 9 variantes que sí mantuvieron dos barras
    paralelas las dibujaron de ALTURA DISTINTA entre sí (una más larga, una más corta,
    "asimetría" que nunca fue parte del glifo real) — el dueño corrigió de nuevo: **"Son
    dos del mismo tamaño"**. Especificación exacta del "//" real, tomada literal de
    `.wm-mark`/`.wm-mark i` en `src/shell.html` (producción): dos barras **idénticas**
    (misma regla CSS compartida por ambas, no dos reglas distintas) — cada una
    `width:.15em;height:.82em` (proporción ancho:alto ≈ 1:5.5), `transform:skewX(-16deg)`,
    `border-radius:1px`, separadas por `gap:.13em`. Lo que sí puede/debe variar en una
    ronda "creativa" es todo lo DEMÁS alrededor de este par fijo: color, fondo,
    marco/contenedor, acabado (plano/degradado/sombra/metálico) — nunca el tamaño
    relativo entre las dos barras, ni la identidad estructural del par. Antes de generar
    cualquier variante nueva del ícono, partir de esta especificación exacta (o de
    `wordmark-official-source.html` en el scratchpad, que ya la replica correctamente)
    en vez de reconstruir el mark de memoria/aproximado.

## Capacidades y limitaciones técnicas descubiertas (mantener actualizado)

- **El service worker sirve el shell desde caché (stale-while-revalidate) desde
  2026-08-19** — `sw.js`. Dos trampas que lo hacían fallar en silencio y que ya están
  resueltas, pero conviene no reintroducir: sin `event.waitUntil()` el navegador apaga el
  service worker apenas responde con la copia en caché y la revalidación queda a medias
  (el shell viejo sobrevive a los deploys), y sin `cache:'no-cache'` en ese fetch la caché
  HTTP del navegador contesta sola con la misma copia vieja. Cuando detecta un shell
  distinto deja una marca en la caché (`__shell-update-pending`) y la app levanta la barra
  de "nueva versión disponible" — **el aviso no puede depender solo de `postMessage`**:
  la revalidación termina después de que la navegación ocurrió y la pestaña recién cargada
  todavía no tiene listener.
- **Deno está disponible como devDependency (`deno` en npm) y `deno check` sí funciona**
  para type-checkear las edge functions, que antes no tenían ninguna verificación
  estática. Dos detalles del entorno: `jsr.io` está bloqueado por el proxy (el import de
  tipos de ambiente del entrypoint falla, por eso `scripts/check-backend.mjs` reintenta sin
  esa línea), y **el check debe correrse sobre una copia temporal**: Deno crea su propio
  `node_modules/.deno` al resolver `npm:web-push` y eso dejó dos copias de
  `@playwright/test` en el árbol, con lo que el runner de tests dejó de arrancar.

- **Subagentes que mezclan WebSearch con lectura de código pueden equivocarse en la parte
  de código — verificar antes de implementar, no confiar ciego.** Descubierto 2026-08-04
  en una ronda de 10 subagentes de investigación de mercado: dos hallazgos ("el combo no
  muestra el ahorro", "no hay estimado de tiempo de entrega en el checkout") resultaron
  ser falsos — ambos ya existían en `src/app.ts` desde el commit `390de6a`, confirmado con
  `git blame` antes de "corregirlos". Un tercer caso similar ya había pasado antes en la
  misma sesión con un hallazgo de contraste de badges (el agente no rastreó un swap
  dinámico de color en `render()`). Patrón: cuando un agente de investigación reporta un
  hallazgo de código (no solo de mercado/tendencias), verificar con `git blame`/lectura
  directa del archivo real ANTES de implementar el "fix" — el costo de verificar es bajo,
  el costo de "arreglar" algo que ya funcionaba (o peor, revertirlo sin querer) no lo es.
  No invalida el valor real de las partes de WebSearch puro de esos mismos reportes, que
  sí fueron precisas — el punto débil específico es la lectura de código dentro de una
  tarea mayormente orientada a búsqueda externa.
- **Generación de imágenes AI**: no hay una herramienta directa de texto-a-imagen
  disponible. La única vía encontrada es a través de `mcp__Gamma__generate` (genera un
  documento/presentación completo, no solo una foto) — y en el plan actual de la cuenta,
  todo modelo fotorrealista (`imagen-4-ultra`, `gpt-image-1-high`, `flux-2-pro`,
  `dall-e-3`, `recraft-v4-pro`) está bloqueado por tier ("not available on plan"). Omitir
  el campo `model` deja que Gamma elija su propio default, que cayó en `flux-2-klein` con
  `stylePreset:"illustration"` — NO fotorrealista, ignorando el `stylePreset` pedido.
  Tampoco respeta pedidos de "una sola tarjeta full-bleed sin texto" (usa su template
  normal de imagen+cuerpo). Conclusión: generación de fotos ultra-realistas de producto
  NO es viable hoy con las herramientas de esta cuenta.
- **Fotos de stock reales (alternativa que sí funciona)**: `asset_search` con
  `entityScope:"StockAsset"` + `asset_license_and_download_stock` (Adobe Stock) sí
  funciona para conseguir fotografía real de comida cuando hay un match razonable para el
  plato — licenciar primero, no usar la URL de preview/rendition directo. Recortar con
  `image_crop_and_resize`/`image_crop_to_bounds` para ajustar composición (ej. quitar
  elementos que no correspondan al menú, como papas fritas que no vendemos).
- **Descarga de archivos vía `curl`**: el proxy de red de este entorno bloquea (403)
  varios dominios usados por herramientas Adobe/Gamma —
  `*.private.adobe.io`, `t3/t4.ftcdn.net` (thumbnails de Stock), `photoshop-api.adobe.io`
  (salida de herramientas de edición de imagen), `assets.api.gamma.app` — pero SÍ permite
  `*.s3.*.amazonaws.com` (la URL de descarga que da `asset_license_and_download_stock`
  tras licenciar). Cuando una herramienta de edición Adobe (crop, resize, etc.) devuelve
  un `outputUrl` en un dominio bloqueado, usar `asset_inline_preview` sobre esa URL para
  verla (ese sí funciona, corre server-side), pero para GUARDAR el archivo localmente hay
  que replicar la edición con una librería local (`PIL`/Pillow en Python ya está
  disponible) sobre el archivo original ya descargado, en vez de intentar descargar el
  `outputUrl` directo.
- **`WebFetch` sigue bloqueado** para dominios externos arbitrarios (confirmado de nuevo
  con `subway.com`, `subway.com/en-US`, y hasta `web.archive.org` — 403 o "unable to
  fetch"). `WebSearch` sí funciona y debe usarse para cualquier investigación externa,
  citando fuentes.
- **`docs.culqi.com`/`apidocs.culqi.com` bloqueados también por `curl`** (igual que por
  `WebFetch`) — timeout total, sin respuesta HTTP. **`github.com` y `api.github.com`
  también están bloqueados por `curl`/`WebFetch` para repos fuera del scope de esta
  sesión** (devuelven 403 con el mismo mensaje de scoping que el MCP de GitHub: "sessions
  are bound to their configured repositories") — no es un bloqueo de red genérico, es el
  mismo mecanismo de scope del MCP interceptando tráfico HTTP normal a esos dos dominios.
  **Pero `raw.githubusercontent.com` NO está bloqueado** y sirve contenido real (probado
  con el README de un repo público arbitrario) — útil para leer el código fuente de un
  SDK/librería pública cuando ya se conoce la ruta exacta del archivo (no sirve para
  *descubrir* qué repos existen, solo para leer uno ya identificado por otra vía como
  `WebSearch`).
- **`Read` sobre varias imágenes en una sola llamada puede desalinear los metadatos de
  dimensión** (`[Image: original WxH]`) entre archivos — visto al leer 5 fotos de
  proteína seguidas para verificarlas antes de integrarlas a `PROT_IMG`. La imagen en sí
  se lee bien (el contenido visual mostrado es correcto), pero el WxH reportado junto a
  cada una puede corresponder al archivo anterior/siguiente del lote, no al que
  acompaña. Para verificar dimensiones reales de forma confiable, o pedir una imagen por
  llamada, o no confiar en el WxH del batch y calcularlo aparte (ej. `PIL`/`Image.size`).
- **Publicación automática real en Instagram/Facebook: implementada 2026-07-29/30**
  (investigada primero, aplicada después de que el usuario confirmó que ya tenía Página
  de Facebook + Instagram Business + Meta Business Manager creados). Ver
  `supabase/functions/api/actions/social.ts` (`actAdminPublishSocial`,
  `actAdminCalendarUploadImage`) y las 3 env vars opcionales en `env.ts`
  (`META_PAGE_ACCESS_TOKEN`/`META_PAGE_ID`/`META_IG_USER_ID`, `supabase secrets set`).
  No es un conector de este entorno (ver más arriba, "no hay
  conector real a redes sociales") — es código nuevo en `api` (o una función aparte)
  llamando directo a `graph.facebook.com` por HTTP. Resumen de lo investigado:
  - **Instagram** (Content Publishing API, vía Instagram Graph API): exige (1) cuenta
    Instagram Business/Creator vinculada a (2) una Página de Facebook, (3) una app de
    Meta for Developers con el permiso `instagram_business_content_publish` aprobado por
    **App Review de Meta** (revisión manual, ~2-4 semanas), y (4) un flujo de 2 pasos —
    `POST /{ig-user-id}/media` (crea el contenedor) y luego `POST
    /{ig-user-id}/media_publish`. Solo publica imagen/video/carrusel/reel — no existe un
    post de solo texto vía API.
  - **Facebook (Página)**: mismo tipo de exigencia — permiso `pages_manage_posts` +
    dependencias, también sujeto a App Review y a verificación de negocio (Business
    Verification) de Meta. Un token de Página de larga duración (o de un System User de
    Business Manager) no expira por tiempo, pero conseguirlo igual pasa por el proceso de
    revisión si la app va a publicar en producción.
  - **Costo**: la API en sí es gratuita (sin cobro por Meta) — el costo real es el tiempo
    de configuración (crear Business Manager, Página, cuenta Instagram Business, app de
    developers, pasar App Review) y que requiere activos reales del negocio (no se pueden
    inventar, mismo criterio que RUC/razón social — bloqueado hasta que el dueño tenga
    Página/Instagram Business reales, cosa que probablemente no pase antes del
    lanzamiento en septiembre 2026).
  - **Conclusión**: el dueño confirmó que ya completó el setup de negocio en Meta
    (Business Manager + Página + Instagram Business), así que se implementó el código de
    integración — probablemente SIN necesitar App Review, porque publica solo hacia
    activos que el dueño administra personalmente (App Review es obligatorio para apps
    que publican en cuentas de terceros, no para el dueño de la propia cuenta usando su
    propio token de larga duración). Falta correr `supabase secrets set` con las 3 env
    vars reales para que funcione en producción — sin ellas, `actAdminPublishSocial`
    devuelve un error 503 claro en vez de fallar en silencio.

  Fuentes: [Instagram Graph API: Complete Developer Guide for 2026](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/),
  [Content Publishing - Meta for Developers](https://developers.facebook.com/docs/instagram-platform/content-publishing/),
  [Instagram Graph API in 2026: Versions, Rate Limits & Content Publishing](https://www.netrows.com/blog/instagram-graph-api-guide-2026),
  [Facebook Graph API Posting: Developer Guide](https://postproxy.dev/blog/facebook-graph-api-posting-guide/),
  [Access Tokens for Meta Technologies - Meta for Developers](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens).
- **Playwright en este sandbox: disponible vía npm global, NO vía pip.** Un subagente
  que necesitaba renderizar HTML/tomar screenshots fuera de este repo (sin `node_modules`
  propio disponible) encontró el paquete ya instalado en
  `/opt/node22/lib/node_modules/playwright` (usable con `NODE_PATH` apuntando ahí, o
  `node -e "require('/opt/node22/lib/node_modules/playwright')..."`) — pero
  `pip install playwright`/`python3 -m playwright` no tiene el navegador disponible en
  este entorno. Para cualquier tarea de captura de pantalla fuera del repo (mockups
  sueltos en el scratchpad, por ejemplo), usar la vía Node, no Python.
- **Asistente de IA para WhatsApp (skill `asistente-whatsapp`, subida por el usuario
  2026-07-30): instalada, deliberadamente NO activada.** El WhatsApp del negocio hoy es
  solo click-to-chat (`wa.me`, sin API oficial) — un asistente de IA real requiere
  conectar una plataforma externa que hoy no existe en el proyecto (ManyChat, Typebot,
  Botpress, o n8n + Z-API, todas con algún costo/cuenta propia) más un LLM detrás. Se
  presentaron 2 rutas reales al usuario, que eligió explícitamente NO activar ninguna
  todavía (negocio aún no abre):
  - **n8n + Z-API**: más barato, pero Z-API es un wrapper NO oficial de WhatsApp —
    riesgo real de que Meta banee el número si detecta automatización agresiva.
  - **ManyChat/Typebot sobre WhatsApp Business API oficial** (vía Twilio/360dialog u
    otro BSP): sin riesgo de baneo, pero trámite de aprobación más largo.
  Si se retoma esto en el futuro, empezar por confirmar presupuesto/plataforma con el
  usuario (regla de gastos reales del CLAUDE.md) antes de escribir cualquier
  integración — no asumir la ruta más barata solo por serlo, dado el riesgo de baneo.
- **OTP de recuperación de cuenta por WhatsApp — investigado 2026-08-07, decisión
  explícita del dueño: esperar a tener volumen real del negocio antes de implementar**
  ("dejemoslo para el futuro midiendo realmente como va el negocio"). Contexto: una
  auditoría de autenticación encontró que la recuperación de PIN (DNI+fecha de
  nacimiento) es débil como único factor, y que sin correo registrado el PIN nuevo se
  devuelve en texto plano en la misma respuesta — la propuesta era agregar un código de
  6 dígitos por WhatsApp (categoría "Authentication" de Meta) como segundo factor
  universal, reemplazando el camino de reenviar el PIN en la respuesta HTTP. Investigación
  ya hecha, reutilizable sin rehacer la búsqueda:
  - **Costo real**: Meta cobra por mensaje de plantilla "Authentication" entregado, tarifa
    por país — banda global ~US$0.004–0.046/mensaje. No se encontró la tarifa exacta de
    Perú por búsqueda (se confirma en la calculadora de Meta al configurar la cuenta) —
    de todos modos es un gasto real y recurrente, aunque mínimo dado que la recuperación
    de cuenta es infrecuente.
  - **No hace falta un número nuevo**: desde mayo 2025 Meta permite "Coexistence" — el
    mismo número de WhatsApp Business ya usado para click-to-chat (`wa.me`) puede quedar
    activo en la app normal Y en la Cloud API a la vez, sin perder chats/contactos. Perú
    no está en la lista de países excluidos (solo Nigeria/Sudáfrica). Fuentes:
    [Authentication templates — Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/authentication-templates),
    [WhatsApp API Pricing Explained 2026 — Authgear](https://www.authgear.com/post/whatsapp-api-pricing/),
    [What is WhatsApp Business App Coexistence? — YCloud](https://www.ycloud.com/blog/whatsapp-business-app-coexistence-meta-update).
  - **Diseño propuesto (no implementado)**: DNI+fecha sigue siendo el primer paso, pero
    se agregaría un código de 6 dígitos vía WhatsApp que TODOS los clientes (con o sin
    correo) deban confirmar antes de fijar un PIN nuevo — reemplazo universal del camino
    actual de correo/texto-plano, un solo flujo más seguro para el 100% de las cuentas.
  - Retomar cuando haya volumen real de recuperaciones de cuenta que justifique el costo
    y la fricción de configurar el número en Meta Business Platform — no antes.
- **Producción de video para marketing: el dueño ya tiene su propio proceso con Google
  Flow (generación de video con IA), confirmado 2026-08-10** — no es una integración de
  este repo ni de este entorno, el dueño genera y carga los videos por su cuenta fuera de
  esta sesión. No asumir que hace falta resolver generación de video como capacidad
  pendiente de este proyecto; si se pide ayuda con guiones/prompts para esos videos, es
  contenido de apoyo al proceso ya existente del dueño, no una integración técnica nueva.
- **No existe ningún MCP dedicado a "diseño de logos" — confirmado 2026-08-11 con
  `SearchMcpRegistry` en 2 tandas de keywords distintas** (logo design/maker/brand
  identity/vector logo/generator, y logo/icon design/brand mark/svg design/graphic design
  tool) — el único resultado relacionado (Brandfetch) sirve para traer logos de marcas
  YA existentes, no para diseñar uno nuevo, y no está conectado en esta cuenta. La vía
  real para un logo/wordmark vector "oficial" es **Figma** (ya conectado): `use_figma`
  (Plugin API) permite construir texto real con fuente real (`figma.loadFontAsync` +
  `figma.createText`) y formas vectoriales propias (`figma.createVector` con
  `vectorPaths`/gradientes) — no hace falta ninguna herramienta de "generar logo", con
  la Plugin API alcanza para reconstruir un wordmark existente como vector real 1:1
  (probado reconstruyendo el wordmark de producción de SND//WCH: texto "SND"/"WCH" en
  Fraunces SemiBold + 2 paralelogramos con gradiente dorado como el "//", ver
  `wordmark-official-source.html` en el scratchpad como referencia visual usada). El
  seat de Figma de esta cuenta aparece como `"seat":"View"` en `whoami` pero
  `create_new_file`/`use_figma` funcionaron igual — no asumir de la etiqueta del seat que
  faltan permisos de escritura, probar directo. **Adobe for Creativity también tiene
  `image_vectorize`** (raster→SVG, pensado para logos) como alternativa si ya se tiene un
  PNG bien resuelto y se prefiere trazado automático en vez de reconstrucción vectorial
  manual — no probado a fondo esta sesión por el bloqueo de red de abajo.
- **Sí existe una skill externa real de logos, fuera de los 2 registros ya buscados
  (`SearchSkills`/`npx skills search`) — el usuario la encontró por su cuenta
  (`op7418/logo-generator-skill` en GitHub) y se instaló con éxito 2026-08-11 vía
  `npx skills add <url-de-github>`.** Confirma que "0 resultados en los registros
  buscados" no equivale a "no existe en absoluto" — un repo de GitHub cualquiera
  instalable por URL directa nunca aparecerá en esos 2 registros salvo que su autor lo
  haya publicado ahí. Queda instalada en `.agents/skills/logo-generator/` (symlink en
  `.claude/skills/`), **local a este entorno** (excluida de git a propósito, ver
  `.gitignore` — mismo criterio que cualquier skill instalada por sesión). Aporta un
  documento real de principios de diseño de logo (`references/design_patterns.md`:
  simplicidad extrema, espacio negativo generoso 40-50%, cortes con esquinas SIEMPRE
  redondeadas nunca afiladas, asimetría intencional, estabilidad estructural, un solo
  punto focal) — útil como checklist de calidad aun sin usar sus scripts. Su fase de
  generación de imágenes de showcase (`scripts/generate_showcase.py`, fondos
  profesionales) usa la API de Gemini ("Nano Banana") y SÍ tiene costo real/requiere
  `GEMINI_API_KEY` propia — no configurada, no usada esta sesión (regla de gastos
  reales del punto 8 de abajo). Las fases 1-3 (generar variantes SVG con principios de
  diseño, sin IA de imagen) no tienen ningún costo ni dependencia externa — son las que
  sí se usaron para generar 6 variantes nuevas del "//" (`logo-skill-variants.html` en
  el scratchpad).
- **`SearchMcpRegistry` solo cubre el directorio curado de Anthropic — un resultado
  vacío ahí NO es evidencia de que un MCP no exista, sobre todo para empresas grandes
  que ahora publican su propio servidor MCP oficial de primera mano fuera de ese
  directorio.** Error real cometido 2026-08-11, la MISMA sesión que ya había dejado
  escrita la lección equivalente para la skill de logos un rato antes (línea de arriba)
  y aun así la repitió: al preguntar por un MCP oficial de "Meta Ads" y de "Higgsfield",
  `SearchMcpRegistry` con varias tandas de keywords dio 0 resultados relevantes y se
  concluyó (mal) "no existen". Ambos SÍ existen y son oficiales: **Meta Ads AI
  Connectors** (`mcp.facebook.com/ads`, beta abierta desde el 29 de abril de 2026, 29
  herramientas de campañas/reportes/catálogo vía OAuth de Meta Business) y **Higgsfield
  MCP** (`mcp.higgsfield.ai/mcp`, oficial desde el 30 de abril de 2026, 30+ modelos de
  imagen/video). Recién se encontraron cuando el usuario insistió en volver a buscar y
  después pasó el link directo de la documentación de Meta. Causa raíz identificada:
  (1) `SearchMcpRegistry` nunca iba a encontrarlos por diseño — es un directorio curado,
  no un buscador de internet, y ninguno de los dos estaba dado de alta ahí todavía por
  ser muy recientes; (2) el primer `WebSearch` de respaldo se sesgó con la palabra
  "github" en la query ("Meta Ads MCP server github 'model context protocol'"), lo que
  prioriza wrappers de terceros en GitHub sobre la página oficial de producto del propio
  Meta/Higgsfield. **Corrección para la próxima vez**: ante "¿existe un MCP oficial de
  X?", además de `SearchMcpRegistry`, correr un `WebSearch` SIN sesgo de "github" (ej.
  "X official MCP server", "X model context protocol announcement") y probar el patrón
  de dominio `mcp.<empresa>.com` o `<empresa>.com/mcp` directo — las empresas grandes
  cada vez más hostean su propio servidor MCP de primera mano en vez de publicarlo como
  repo de GitHub. Ninguno de los dos quedó conectado en esta sesión (no existe una
  herramienta para registrar un MCP remoto por URL desde acá — requiere que el usuario
  lo agregue desde Ajustes de conectores de claude.ai con su propia cuenta/OAuth).
- **Descarga directa de assets de Figma (`www.figma.com`) y subida de archivos a Adobe
  (`at.adobe.com`) bloqueadas por el proxy de este entorno — mismo patrón que
  `checkout.culqi.com`/`docs.culqi.com`/dominios de Adobe ya documentados arriba, no es
  un caso nuevo de política de red, es la misma restricción general.** `curl` a
  `www.figma.com` y `at.adobe.com` devuelve 403 en el CONNECT (confirmado con
  `curl -sS "$HTTPS_PROXY/__agentproxy/status"`, que lista los rechazos recientes).
  Consecuencia práctica: `asset_initialize_file_upload` de Adobe (subir un PNG local para
  vectorizar) y `download_assets`/`get_screenshot` con URL de Figma (bajar el SVG/PNG
  exportado a este sandbox) NO funcionan — el archivo QUEDA CREADO/EDITABLE del lado del
  servicio (Figma/Adobe), pero no se puede traer una copia local para mandarla por
  `SendUserFile`. La única vía real de imagen que sí llega a este sandbox es la que ya
  documentada arriba (S3 de Adobe Stock tras licenciar). Para casos como este, entregar al
  dueño el link directo al archivo (ej. URL de Figma `figma.com/design/<fileKey>`) para
  que lo abra/exporte con su propio navegador (sin la restricción de red de este
  sandbox), en vez de insistir en traerlo localmente.
- **No existe ninguna skill de cocina/restaurantes ("chef", menu engineering, costeo de
  recetas) en esta cuenta — confirmado de nuevo 2026-07-30 con 6 términos de búsqueda
  distintos** (chef, menu, restaurant, culinary, recipe, food cost) tanto en
  `SearchSkills` (claude.ai) como en `npx skills search` (registro de Vercel Labs) contra
  las ~90 skills ya instaladas en `.claude/skills/` — 0 resultados en todos los casos. Es
  un gap real, no un fallo de búsqueda. Las más cercanas que sí existen y sirven como
  sustituto parcial: `financial-analyst` (su `ratio_calculator.py` sirve para validar
  márgenes/rentabilidad, pero su `forecast_builder.py` de crecimiento driver-based asume
  una sola tasa de crecimiento constante por escenario — no sirve tal cual para un ramp
  de lanzamiento con tasas de crecimiento mes a mes distintas, hay que construir esa
  parte del modelo a mano) y `pricing` (enfocada en SaaS/tiers, su marco de "precio entre
  costo de servir y valor percibido" es reutilizable en concepto, no sus scripts). El
  análisis de menú (matriz de popularidad × margen de contribución) se hizo a mano con
  metodología estándar de menu engineering (Kasavana & Smith) — ver
  `MENU_FINANCIAL_ANALYSIS.md`.
- **No existe ninguna skill "selectora de MCP"/optimización de tokens de herramientas en
  esta cuenta — buscado 2026-07-31** (`npx skills search` con "mcp", "token", "context
  management": 0 resultados). El mecanismo real que ya cumple ese rol en este entorno es
  el listado de tools diferidas (`ToolSearch`): los MCP conectados no cargan su schema
  completo hasta que se buscan por nombre, solo aparece el nombre en el listado — ya es
  optimización de tokens por diseño del harness, no algo que falte configurar. Lo que sí
  es un gasto real de tokens evitable: conectores habilitados en el chat
  (`enabledInChat:true` en `ListConnectors`) que son irrelevantes para este proyecto
  (AgentMail, Airtable, Asana, Gmail, Google Calendar/Drive, HubSpot, Notion, PayPal,
  Postman, Replit, SlidesGPT, Stripe, Windsor.ai) — cada uno agrega su nombre+descripción
  al listado de cada turno aunque nunca se use. Esto **no se puede desactivar desde una
  sesión** (ni con herramientas MCP ni con hooks) — se apaga en Ajustes de conectores de
  claude.ai, fuera de esta conversación. Conectores que sí tienen uso real en este
  proyecto y conviene dejar prendidos: Adobe for Creativity (fotos de stock), Supabase,
  GitHub (vía MCP dedicado, no listado en `ListConnectors`), Context7 (docs de librerías).
- **No existe ninguna skill de "automatización de procesos de negocio" (restaurante,
  delivery, WhatsApp Business, marketing/CRM) en esta cuenta — buscado 2026-08-08 con 3
  vías distintas** (`SuggestSkills` con 8 keywords de negocio, `SearchSkills` con 2 tandas
  de 8 keywords c/u — operaciones de restaurante, delivery, WhatsApp, email marketing,
  CRM, contabilidad, reseñas, SEO local — y `npx skills search` con 5 términos): **0
  resultados en las 3**. Mismo patrón que el gap de skill de cocina/menu engineering
  (2026-07-30) y el de "selectora de MCP" (2026-07-31) — no es fallo de búsqueda, es un
  gap real de esta categoría en los 3 registros disponibles hoy. Conclusión: "automatizar
  todos los procesos" de este negocio NO es un problema de buscar la skill correcta — el
  95% de la automatización real ya vive en el propio código de este repo (crons de
  marketing/retención en `supabase/functions/api`, dashboard admin, programa de
  fidelidad) y lo que falta NO son skills sino trabajo real del dueño (configurar los 3
  secrets de Meta para publicación automática, decidir sobre WhatsApp Business API si
  algún día se retoma — ver entradas de arriba). Antes de volver a buscar "skill de
  automatización" para este proyecto, revisar primero qué de "todos los procesos" ya está
  automatizado en código (bastante) vs. qué depende de una integración externa real
  todavía sin configurar (poco, y ya identificado).
- **Automatizaciones de sesión configuradas 2026-07-31**: `.claude/settings.json` (nuevo,
  commiteado en el repo — afecta a cualquier sesión futura que trabaje aquí) tiene (1) un
  allowlist de ~22 comandos/tools de solo lectura de uso frecuente (extraído del propio
  historial de la sesión, ver `fewer-permission-prompts`) y (2) un hook `PreToolUse` que
  corre `npm run verify` (typecheck+build+test, ~4 min) antes de cualquier `git commit` y
  bloquea el commit si falla — probado en vivo (disparo confirmado con un commit
  `--dry-run` antes de dejarlo con el comando real). **Costo real a tener en cuenta**:
  como es un hook de proyecto commiteado, cualquier sesión futura (no solo esta) pagará
  esos ~4 minutos extra en CADA commit, incluso commits triviales — si en el futuro esto
  resulta más molesto que útil, el hook se quita editando/borrando la sección `hooks` de
  `.claude/settings.json`, no hace falta tocar nada más.
