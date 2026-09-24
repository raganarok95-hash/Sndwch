# SND//WCH — guía para trabajar en este repo

Sandwichería con pedidos online (Trujillo, Perú). Cliente de una sola página + backend en
edge functions de Supabase. **Aún no ha abierto** — abre a más tardar la segunda semana de
octubre de 2026, así que todo lo que hay en `orders`/`customers` es data de prueba y
cualquier proyección es simulación, nunca pronóstico.

## Cómo está organizada la documentación

Este archivo es el **manual de operación**: lo que necesitas saber ANTES de actuar para no
romper nada. Se lee entero, siempre. Lo demás vive al lado y se consulta cuando toca:

| archivo | qué tiene | cuándo leerlo |
|---|---|---|
| `docs/NEGOCIO.md` | costos, rendimientos, márgenes, CAC, el modelo | **antes de tocar cualquier precio, receta o recompensa** |
| `docs/DECISIONES.md` | por qué cada cosa está como está, en orden | cuando algo parezca arbitrario, o antes de "simplificarlo" |
| `docs/FUNCIONALIDADES.md` | qué existe hoy: flujos, crons, medición | antes de proponer algo que quizá ya está |
| `docs/ENTORNO.md` | qué bloquea el proxy, qué MCP responde, qué no | antes de concluir que algo "no se puede" |
| `docs/COMO_DISENAR_ACA.md` | ARREGLO vs REPENSAR, y el detector de rediseños falsos | **antes de rediseñar cualquier pantalla** |

⚠ **Este archivo se partió el 2026-09-17** porque había llegado a 2 473 líneas (~52 000
tokens) que se inyectaban íntegras en cada turno de cada sesión. No se borró nada: todo lo
que salió está en los cuatro archivos de arriba, verbatim. Lo que se quedó acá son las
REGLAS; el porqué de cada una está allá.

**Al agregar algo nuevo, pregúntate dónde va.** Una regla que hay que cumplir sin leer la
historia va acá, en dos líneas. El relato de cómo se descubrió va a `docs/DECISIONES.md`.
Si todo vuelve a este archivo, en tres meses volvemos a los 52 000 tokens.

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

## Las trampas vivas — lo que rompe sin avisar

Cada una de estas ya causó un defecto real en producción. El detalle está en
`docs/DECISIONES.md`; acá está lo que hay que cumplir.

- **El menú se edita desde el panel, no desde el código.** Los 5 Signatures públicos viven
  en `catalog_items` (append-only), SIG05 en `secret_signature`, y los precios de
  proteínas/bebidas/recompensas en `catalog_prices`. Los literales de `catalog.ts` y de
  `src/app/01-*` son **semilla**: el primer render y el respaldo si la base no responde.
  El precio de un Signature ya NO se toca desde `catalog_prices` —
  `admin-catalog-set-price` rechaza la categoría `sig`.
- **Registrar una acción es un paso APARTE de importarla.** `actAdminRetentionReport`
  estuvo importada y nunca registrada en `ACTIONS`: la app no podía abrirla y `deno check`
  no marca un import que sí se usa dentro de un objeto. Lo vigila `npm run check:acciones`.
- **Toda RPC `security definer` nueva necesita su `revoke execute ... from public, anon,
  authenticated`.** Fue el séptimo caso del mismo defecto en este repo. Lo vigila
  `npm run check:rpc`, que compara la ARIDAD de la firma — sin eso, un `drop function` de
  una sobrecarga vieja da por muerta a la que está viva.
- **Si un texto nombra un producto que el cliente va a poder canjear o no según un número
  editable, ese nombre también tiene que DERIVARSE**, no afirmarse. Interpolar la cifra no
  alcanza: `REFERRAL_BONUS_POINTS` prometió ocho días una bebida que ya no alcanzaba a
  pagar, en seis sitios a la vez, con la cifra bien interpolada. Ver `loQueGanaElInvitado()`
  y `etiquetaDeEscalon()` en `catalog.ts`.
- **Tampoco se puede nombrar un mecanismo apagado.** El brief semanal prometía la bebida
  gratis de hora valle cuando esa promo ya estaba retirada. Ver `offpeakActiva()`.
- **Nunca uses `rankName()` para explicar el menú secreto.** Su umbral (3 pedidos) ya no
  coincide con ningún rango, así que sale "se desbloquea en REGULAR", que es un rango que
  se alcanza al primer pedido. Los textos hablan de PEDIDOS.
- **La paleta de la app ANTERIOR no puede volver a escribirse, ni como respaldo.** El
  front se rehízo desde cero; `#1E3932`/`#2D5246`/`#1A3028`/`#3A6B58`/`#A8C8B0`/`#F2F0EB`
  no existen más. Un `var(--sw-card,#2D5246)` significa que el día que el token falle
  reaparece la app vieja en vez de degradarse. Lo vigila `npm run check:colores`, que desde
  el 2026-09-17 también mira `src/shell.html` — ahí estaban los dos peores casos.
- **Toda barra fija se declara con la clase `sw-barra`.** El hueco al pie de `#app` lo mide
  `medirBarraFija()` (08-router) después de pintar; un número escrito a mano deja contenido
  debajo de una barra opaca en las pantallas cuya barra mide otra cosa.
- **`BYO_STEP_LABELS` es el ORDEN REAL de los pasos del armador, no una lista de nombres.**
  Cambiar qué pinta cada `if` sin cambiar ese array (ni los índices `i:` de
  `BYO_LOQUELLEVAS`) hace que el riel anuncie un paso y la pantalla muestre otro. Pasó, y
  duró doce días. Lo vigila `tests/armador-riel.spec.ts`, que compara el rótulo encendido
  contra la pregunta pintada y que cada parte de «lo que llevas» vuelva a su paso.
- **Un estado vacío del cliente se pinta con `VACIO()`**, que trae al hermano del lado en el
  que está. Dos pantallas se lo saltaron y quedaron con un rótulo suelto en medio de la nada.
- **UN SECRET NO SE DA POR AUSENTE MIRANDO EL CÓDIGO.** `GOOGLE_CLIENT_ID`, `META_PIXEL_ID` y
  compañía viven como **texto de relleno** en `src/app/01-*` **a propósito**: el valor real llega
  del servidor en `get-store-hours`, leyendo el secret de Supabase, y por eso se prenden sin
  redesplegar el cliente. Ver el marcador `REEMPLAZA_...` en el archivo **no prueba nada**, y que
  ninguna fila tenga `google_id` tampoco (puede estar configurado y sin usar: hoy hay 1 cliente de
  prueba). **El secret de Google SÍ está puesto desde el 2026-09 y el botón ya se dibuja en
  producción.** Antes de afirmar que falta un secret, verifícalo contra Supabase — nunca por
  inferencia. Error real cometido dos veces el 2026-09-17, la segunda después de que el dueño lo
  corrigiera.
- **Un costo no es un número: es una ficha con unidad.** Todo insumo que entre a un
  cálculo de dinero vive en `modelo/insumos.py` con cinco campos obligatorios —valor,
  **unidad**, **estado** (COTIZADO/ESTIMADO/SIN_COTIZAR), fuente y fecha— y se convierte a
  costo por sándwich SOLO por `por_sandwich()`, que **se niega** a repartir un costo *por
  pedido* sin que le digas cuántos sándwiches trae. Lo vigila `npm run check:costos`.
  El empaque se costeó al doble durante dos meses porque era un `float` con un comentario:
  el comentario decía COTIZADO y no lo estaba, y el número venía medido *por pedido* y se
  sumaba *por sándwich*. **Los doce chequeos anteriores comparan dos copias de un número;
  uno que está solo y mal coincide consigo mismo.**

- **Un guard atómico por estado (`status=eq.X`) tiene que admitir TODOS los estados desde
  los que el paso es legítimo**, no solo el del camino feliz. Dos veces el mismo defecto: el
  grupo vencido pasaba a `closed` y pagar exigía `open`; la reserva cobrada quedaba en
  `charging` y confirmar exigía `pending`. Ver `RESERVA_CONFIRMABLE` en `orders.ts`.
- **La carga de una hora se cuenta SOLO en `capacidad.ts`** (pedidos + lugares apartados por
  pedidos fijos). Rechazar (`assertHourCapacity`) y tachar horas (`get-store-hours`) preguntan
  ahí; una segunda copia de la cuenta deja al cliente viendo libre lo que el servidor rechaza.
- **Un id que pasó por el HTML se compara con `mismoId()`, nunca con `===`.** Los ids de
  dirección son números y el onclick los devuelve como texto: `12 === '12'` es falso y el
  botón no hace nada. Las pruebas simulan ids numéricos, como la base.
- **Una acción que se escribe o se toca se declara en `supabase/functions/_shared/contrato.ts`**
  (entrada con esquema, salida con tipo) y lee la base con `leer()` (db.ts), no con `sbGet` y un
  select a mano: así un campo o una columna mal escrita no compila. Tras cada migración se
  regeneran los tipos (`_shared/base.ts`); lo vigila `npm run check:tipos-base`.
- **El dinero se calcula en UN solo sitio: `supabase/functions/_shared/dinero.ts`.** El servidor
  cobra con él (`deriveCart`) y el cliente muestra el total con él (`cartDesglose()` en 03-*).
  Una regla nueva de precio va AHÍ, nunca como segunda copia en `src/app` o en `catalog.ts`:
  `parity` falla si una regla vuelve a escribirse como número en un lado.
- **Tras cada migración se saca de nuevo la foto del esquema**: correr
  `scripts/pg-local/foto-del-esquema.sql` contra la base y guardar el resultado en
  `supabase/esquema-actual.sql` (con su marca `foto-tomada-tras-migracion`). `npm run check:pg`
  falla si está vieja, y es la base con la que corren las pruebas de `tests-db/` en un Postgres
  local. Una función nueva de la base se prueba AHÍ, no contra producción.
- **Una tabla la escribe UNO por operación.** Si la RPC ya inserta en el libro, el código no
  vuelve a insertar al volver de ella. Lo vigila `npm run check:doble-escritura`.
- **Una prueba que no se vio fallar no prueba nada.** Tres pruebas escritas el 2026-09-23
  pasaban con el defecto puesto (una miraba otra pantalla; otra quitaba comentarios con
  `//…` y se comía todo lo que seguía a «SND//WCH»). Inyecta el defecto antes de darla por buena.

- **El modo de fallo que importa es el SILENCIO.** Casi todo lo listado acá no lanza
  ninguna excepción: solo deja de hacer lo que prometía. Por eso hay tantos chequeos en
  `verify` y por eso cada uno se verifica inyectándole el defecto que caza.

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
   Empezó con `dinero.test.ts` (`pointsFor`), `carrito.test.ts` (`deriveCart`) y
   `cancelacion.test.ts` (`cancellationDeltas`); hoy son decenas — el conteo está en la
   salida, no acá (este párrafo dijo «3 archivos / 23 pruebas» cuando ya eran 36). El patrón para
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
5e. `npm run check:acciones` — que ninguna acción quede escrita y muerta, ni registrada e
   inalcanzable. Cierra un defecto real (el relato completo en `docs/DECISIONES.md`):
   `actAdminRetentionReport` estaba IMPORTADA y nunca REGISTRADA en `ACTIONS`, así que la app
   no podía abrirla y nada avisaba — `deno check` no marca un import que sí se usa dentro de un
   objeto. Cruza tres fuentes independientes (lo que el servidor exporta, lo que registra, y
   quién lo llama desde `src/app` o `scripts/`), y reconoce un cron por estructura —que su
   cuerpo llame a `verifyCronSecret`— en vez de por una lista de nombres que se desactualiza.
   **Registrar una acción es un paso APARTE de importarla.**
5f-bis. `npm run check:costos` — que ningún número de dinero entre al modelo sin unidad,
   sin origen y sin estado, y que un costo *por pedido* no se pueda sumar *por sándwich*.
   `npm run check:costos:probar` le inyecta los siete defectos que dice cazar y falla si
   alguno pasa. Es el único chequeo del repo que no compara dos copias de un número sino que
   pregunta si un número **puede justificarse** — la clase de error que el empaque tuvo dos
   meses sin que nada lo notara.
5f. `npm run check:rpc` — que ninguna función `security definer` quede llamable con la anon key.
   Fue el séptimo caso del mismo defecto en este repo; ahora hay algo que lo mira. Lee las migraciones en orden, y **compara la ARIDAD de la firma**: el patrón
   normal para cambiar una firma es `drop function vieja(...)` + `create or replace nueva(...)`,
   y sin comparar la firma el drop de la sobrecarga vieja daba por muerta a la que está viva —
   cuatro funciones desaparecían del chequeo en silencio. Se encontró **cruzando el conteo del
   script contra `pg_proc` de la base real**; sin ese cruce habría pasado. Un punto ciego en una
   verificación de seguridad es peor que no tenerla: da confianza falsa justo donde no la hay.
5h. `npm run check:e2e` — flujos de punta a punta contra el backend REAL levantado en local:
   el `api` en Deno + PostgREST + Postgres con el esquema real (`scripts/e2e/servidor-local.mjs`).
   Cada flujo (`tests-e2e/flujos.mjs`) entra por la API y después mira la base. Es lo único que
   ejecuta el servidor y la base juntos: un flujo de dinero nuevo (cobrar, devolver, confirmar)
   se agrega acá. ~4 s.
5i. `npm run check:columnas` — que toda columna que el servidor nombra en un
   `sbGet/sbUpdate/sbDelete` escrito como texto exista en `supabase/esquema-actual.sql`. Es la
   clase de defecto de `assertHourCapacity` (columna inexistente, error tragado por un catch).
   Antes de quitar una columna de la base, este chequeo dice quién la sigue pidiendo.
5g. `tests/panel-todas-las-herramientas.spec.ts` abre las 30 herramientas del panel una
   por una y comprueba que ninguna reviente, se quede en "No se pudo cargar" con una
   respuesta válida, ni se pinte con la piel del cliente. La lista sale de
   `adminToolsSections()`, no del test: una herramienta nueva entra sola. Corre dentro de
   `npm test`.
5f-ter. `npm run check:doble-escritura` — que ninguna función inserte en una tabla que la RPC
   que llama ya inserta (lee la última definición de cada RPC de las migraciones). Cada regalo
   de crédito quedaba anotado dos veces en `credit_ledger`. `-- --probar` le inyecta ese caso.
6. `npm run test:estado` — la suite entera comparada contra `tests/ROJAS_CONOCIDAS.txt`: falla
   si aparece una roja NUEVA o si una conocida ya pasa (hay que borrarla de la lista). Mientras
   haya rojas conocidas, es ESTO lo que dice si un cambio rompió algo, no el conteo a ojo.
   `npm test` (o `npm run verify`) — deben pasar TODOS (revisa el conteo real en la salida,
   ej. "19 passed", no un número fijo escrito aquí). **Nunca a través de `| tail` ni `| grep`**:
   el código de salida pasa a ser el del filtro y la línea de fallos puede quedar cortada. El
   2026-09-23 se reportó «239 passed» con 42 fallando por eso. Redirige a un archivo y guarda
   `$?` (`... > log 2>&1; echo EXIT=$? >> log`).
7. Si el cambio toca un flujo cubierto por `tests/` (checkout, pedido programado, cola
   admin, borrar cuenta, reclamos, tarjeta de regalo, Plan Semanal, pedido grupal,
   recompensas), revisa que el test siga representando el flujo real antes de asumir que
   "pasa" = "funciona".
8. Commit + push a la rama de trabajo, merge `--no-ff` a `main`, push `main`.
   **Si existe `supabase/migrations-al-mergear/`**, lo que hay ahí se aplica JUSTO DESPUÉS de que el
   deploy de `main` termine (quita columnas que la versión anterior todavía escribía), se mueve a
   `supabase/migrations/` con su versión real, y se regeneran foto y tipos
   (`scripts/pg-local/guardar-foto.mjs`, `guardar-tipos.mjs`). `check:pg` lo recuerda mientras exista.
- **`orders.id` es `text` con un check de formato uuid, a propósito**: cambiar el tipo a `uuid` haría
  que un id mal escrito en la URL diera 500 en vez de 404.

## Fotos de producto

`scripts/tratar_fotos.py` lee de `img/fuente/` y escribe en `img/` — nunca al revés, porque
aplicar viñeta y grano sobre una foto que ya los tiene la degrada un poco más en cada
corrida, sin dar ningún error. Tiene dos perfiles: los **Signatures** salen en `.jpg` con el
encuadre de su tarjeta, y las **proteínas** en `.webp` CUADRADAS, porque el mismo archivo se
usa en la miniatura de 56×56 del armador y en el hero de 190 px de la confirmación.

**Toda foto nueva se anota en `img/fuente/FUENTES.md`** el mismo día que entra: de dónde
salió, con qué licencia y con qué recorte. Antes del 2026-09-17 no había forma de saberlo
para ninguna foto del repo. Lo vigila `npm run check:fotos`, que además comprueba que
ninguna foto servida se quede sin original y que no sobreviva un archivo del formato viejo.

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

## Respaldo de la base (2026-08-29)

**El plan de Supabase de esta cuenta es `free`, que NO tiene respaldos automáticos de
ninguna clase.** Hasta esta fecha la base no tenía ni un solo respaldo: un `delete` sin
`where`, una migración mal escrita o una cuenta comprometida borraban pedidos, clientes,
puntos y saldo de crédito sin vuelta atrás.

`.github/workflows/backup-db.yml` corre a diario (03:10 hora Lima, tienda cerrada) y **no
necesita ningún secret nuevo**: usa `SUPABASE_ACCESS_TOKEN`, el mismo que ya usa
`deploy-api.yml`, contra la Management API. Por eso no depende de nada del dueño.

- **⚠ LAS MIGRACIONES NO RECONSTRUYEN LA BASE** (descubierto el 2026-09-24): la primera ya
  altera `customers`, que ninguna migración crea — las tablas originales nacieron desde el panel.
  **Restaurar de verdad = cargar `supabase/esquema-actual.sql` (la foto completa del esquema) y
  después los datos** (`node scripts/backup-to-sql.mjs backup > datos.sql`). El respaldo diario
  saca también esa foto (`backup/esquema.sql`) y el workflow falla si la base se alejó de la del
  repo (`scripts/comparar-esquema.mjs`): o se cambió desde el panel sin migración, o falta
  actualizar la foto.
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

## `check:sistema` — el sistema visual no puede crecer por acumulación (2026-09-10)

Una medición del código encontró **34 tamaños de letra distintos y 13 radios de borde**, con
**once valores usados una sola vez**. Eso no es una escala: es sedimento. Tener 20, 21 y 22 px
a la vez no comunica jerarquía, la enturbia.

**Consolidado el 2026-09-11 a 11 tamaños y 6 radios**, migrando 522 usos. La escala es
`8 · 9 · 11 · 13 · 15 · 18 · 22 · 28` de texto, más `40 · 56 · 72` de display (el hero del
wordmark, el número de puntos, el check de entrega), y `4 · 8 · 10 · 12 · 20 · 999` de radio.

**⚠ SE CONSTRUYÓ SOBRE EL USO REAL, no sobre un ratio elegido a ojo**: los valores con
cientos de usos son anclas y arrastran a sus vecinos, no al revés.

**⚠ Y EN EMPATE, SUBE.** Un valor a la misma distancia de dos pasos va al MAYOR. La primera
versión hacía lo contrario y el cuerpo de texto bajaba de 12 a 11px — consistencia ganada a
cambio de legibilidad, en una app de comida que se usa en un celular. Con la regla correcta
**415 usos suben de tamaño y solo 74 bajan**. *El texto que lee el cliente nunca puede
achicarse por un refactor interno.*

Se verificó **capturando las 20 pantallas antes y después** y comparándolas: ninguna creció
más de 80px y ninguna se rompió. Un refactor de tipografía sin esa comparación es fe.

`check:sistema` lo sostiene: un valor fuera de la escala falla, señalado por su nombre y su
archivo, **con el vecino sugerido** («¿puede ser 13px, que ya se usa 242 veces?»). Sin eso la
escala vuelve a 34 valores en unos meses — nadie agrega un tamaño nuevo a propósito, se
agrega porque en ese momento "se veía mejor así".

Ver `docs/REVISION_ESTETICA.md` para la medición completa, lo que está bien, lo que falta y
lo que **no** es un problema aunque lo parezca.

## SANDO SE REDIBUJÓ — Y NO COMPARTE TRAZO CON WICHO (dueño, 2026-09-18)

**El dueño rehízo a SANDO y su dibujo nuevo es el bueno.** Es de **línea negra limpia de
grosor parejo y sombreado plano**, sin pinceladas ni textura. WICHO sigue con su trazo
pintado. **Que no compartan tipo de dibujo ya no es un defecto que haya que corregir: es
como quedó.** No intentes acercar uno al otro, en ninguna dirección.

⚠ Lo que decía esta sección hasta hoy —que sí compartían trazo y que SANDO debía acercarse
a WICHO— **quedó sin efecto**. Cuidado al leer sesiones o commits viejos: esa regla vivió un
solo día y ya no aplica.

⚠ **EL LOGO NO SE MIGRA. Se queda con el SANDO anterior y ya está aprobado así**
(dueño, 2026-09-18): «Ese logo no se cambia, ya está aprobado. Su rostro no cambió.»
Vale para `img/marca/avatar-1024-transparente.png`, los demás `img/marca/avatar-*` y
`logo-hermanos.png`, y para **la pantalla de la puerta**, que usa esa misma ilustración a
pantalla completa. No es un descuido ni una inconsistencia que haya que arreglar: es una
decisión. Si una sesión futura ve "el SANDO viejo" en el logo, **lo deja como está**.

**El SANDO actual son nueve archivos: `img/sando2_frente`, `_sonrie`, `_mira`, `_perfil`,
`_ladea`, `_asoma`, `_pulgar`, `_cuerpo` y `_cuerpo_forro`.** El 2026-09-24 se borraron los
del dibujo viejo, incluidos cinco que llevaban «2» sin ser el actual (`cuerpo_b`, `come`,
`come_b`, `grita`, `piensa`) y que se usaron por error. Donde una pantalla aprobada lo
dibujaba comiendo va `sando2_cuerpo_forro` (manos en los bolsillos, sin sándwich): aprobado
así por el dueño. **No lo cambies por un busto**: se probó y rompía las pantallas aprobadas.
Los nombres de pose se escriben ENTEROS en `POSES` (02-*), nunca armados por partes: así se
escondió el viejo en los estados vacíos. Lo vigila `npm run check:maquetas`.

**Lo que los distingue no es la mano: es cada personaje.** De SANDO son el **acanalado** de
puños y basta, el **forro naranja** de su bomber —el único naranja de toda la marca, franja
lisa y vertical, NO una cremallera a rayas—, el `//` bordado al pecho, el oliva salvia, el
tan cálido y el ojo almendrado de párpado pesado. De WICHO son la **espiral** de sus ojos,
las **curvas de nivel** estampadas en su polo, el rosa durazno, el lila y la sonrisa
abierta. **Puestas en blanco y negro, sus dos pantallas se tienen que seguir distinguiendo.**
Todo en `docs/LOS_DOS_HERMANOS.md`, que se lee antes de diseñar cualquier pantalla del
cliente — se escribió después de que el dueño corrigiera tres rondas seguidas con la misma
frase, «no es solo un color».

Cada hermano se regenera contra SU PROPIA referencia — hoy `img/sando2_frente.png` y
`img/wicho_rie.png`, **nunca la del otro**. Ver `docs/POSES_QUE_TE_TOCAN.md` para las poses
que faltan.

⚠ **Y las referencias para Flow se mandan SIN transparencia.** Un PNG con alfa se aplana
contra negro al cargarlo como referencia, y ese negro sale como manchas en lo generado.
Fondo blanco plano y al doble de tamaño.

## LAS MAQUETAS APROBADAS SON LA ESPECIFICACIÓN EXACTA (dueño, 2026-09-24)

«Las maquetas no son referencias sino como debe quedar exactamente.» Viven en
`docs/maquetas/` (PNG en `aprobadas/`, HTML en `fuentes/`, índice en su README) y una
pantalla aprobada se construye **hasta que se vea como su PNG**. Toda aprobación nueva se
guarda ahí **el mismo día** — antes vivían en `/tmp` y cinco fuentes se perdieron. Lo vigila
`npm run check:maquetas`. Los datos de muestra dentro de la maqueta (nombres, precios) no se
copian: salen del código.

## PEDIR LA IMAGEN QUE FALTA ES PARTE DEL DISEÑO (2026-09-18)

**No diseñes contra el inventario de `img/`.** Las imágenes son **ilimitadas** en Flow y el
dueño las genera el mismo día que se las pides. Elegir una pose que ya existe «porque es la
que hay» es la trampa de buscar lo más fácil: la pantalla sale peor y encima los hermanos
terminan siempre parados y siempre iguales, de adorno.

Regla: cuando una pantalla quede mejor con una pose, un encuadre o un gesto que no existe,
**pídelo** —con su prompt escrito en `docs/POSES_QUE_TE_TOCAN.md`— y muestra la maqueta
avisando que esa figura es una aproximación. Nunca al revés: que el archivo disponible
nunca decida la composición.

Corolario que el dueño ha tenido que repetir en varias formas distintas: **en diseño, la
respuesta más fácil casi nunca es la correcta.** Si la primera solución que se te ocurre es
reusar lo que ya está a mano, esa misma es la señal de que hay que buscar otra.

## Restricciones permanentes (no negociables sin pedido explícito del usuario)

- **Nunca modifiques el texto legal** de Términos/Política de Privacidad/Cambios y
  Devoluciones (incluida la sección de CANCELACIONES) sin que el usuario lo pida
  explícitamente.
- **El DNI es obligatorio en el registro por el formulario normal** — nunca lo vuelvas
  opcional ni lo quites de ahí. **Única excepción, autorizada explícitamente por el dueño el
  2026-09-12: el registro con Google no lo pide.** Ahí la recuperación de acceso es volver a
  entrar con Google, así que el DNI no sostiene nada. La base lo sigue exigiendo por su
  cuenta con el constraint `customers_dni_o_google` (`dni is not null or google_id is not
  null`), o sea que la garantía no quedó viviendo solo en el código del servidor. Ampliar
  esa excepción a otro camino requiere pedido explícito del dueño otra vez.
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
9. **Documentar en `docs/ENTORNO.md` las capacidades/limitaciones técnicas reales que se
   vayan descubriendo** (qué modelo de generación de imágenes funciona en este plan y cuál
   no, qué dominios bloquea el proxy de red, qué vías sí funcionan para descargar assets)
   para que la siguiente sesión no tenga que redescubrirlas desde cero. Va ahí y no acá:
   son consultas puntuales, no reglas que haya que leer antes de cada turno.
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
    `.wm-mark`/`.wm-mark i` en `src/shell.html` (producción, **actualizada 2026-09-10**):
    dos barras **idénticas en forma** — `width`/`height`/`transform`/`border-radius` viven
    en UNA sola regla compartida por las dos, nunca en dos reglas distintas — cada una
    `width:.10em;height:.88em` (proporción ancho:alto ≈ 1:8.8), `transform:skewX(-16deg)`,
    `border-radius:1px`, separadas por `gap:.16em`.
    **UNA BARRA POR HERMANO (variante C, decisión del dueño 2026-09-10)**: la izquierda
    dorada `#CBA258` (SANDO), la derecha celeste `#8CC8EC` (WICHO), las dos en **color
    plano, sin degradado**. Antes eran dos barras doradas con degradado a `.15em` de ancho
    y el dueño lo rechazó como "dorado grueso": a ese grosor no se lee como corte sino como
    dos bloques que empujan las letras. El "//" siempre fue el corte del pan; ahora además
    dice **quién** lo hace, y el logo cuenta lo mismo que el producto. El panel admin tiene
    su propio par por tema (`.admin-dark`/`.admin-light`) porque sobre fondo claro el
    celeste del cliente sería invisible — el bicolor se conserva, no se vuelve monocromo.
    Lo que sí puede/debe variar en una ronda "creativa" es todo lo DEMÁS alrededor de este
    par fijo: fondo, marco/contenedor, acabado — nunca el tamaño relativo entre las dos
    barras, ni la identidad estructural del par. Antes de generar
    cualquier variante nueva del ícono, partir de esta especificación exacta (o de
    `wordmark-official-source.html` en el scratchpad, que ya la replica correctamente)
    en vez de reconstruir el mark de memoria/aproximado.
