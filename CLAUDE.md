# SND//WCH — guía para trabajar en este repo

Sandwichería con pedidos online (Trujillo, Perú). Cliente de una sola página + backend
en edge functions de Supabase. **Aún no ha abierto** — ver "Contexto de negocio" abajo,
afecta cualquier decisión de precio/margen.

## Estructura

- **Cliente**: `src/app.ts` (toda la lógica y el tipado, un solo archivo grande, sin
  framework) + `src/shell.html` (el resto del HTML/CSS, con el placeholder `__APP_JS__`
  donde se inyecta `app.ts` compilado). `npm run build` compila y regenera `index.html`
  en la raíz del repo — **ese archivo es el único artefacto servido**; nunca lo edites a
  mano, siempre edita `src/app.ts`/`src/shell.html` y recompila.
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
- **Migraciones DB**: `supabase/migrations/` tiene **el SQL real de las 109 migraciones**
  (un archivo `<version>_<nombre>.sql` cada una, extraído de
  `supabase_migrations.schema_migrations` el 2026-08-19 y verificado archivo por archivo
  con md5 contra la base), más `INDEX.txt` y un `README.md`. **4 archivos llevan el
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

## Checklist antes de dar por terminado un cambio en el cliente

1. `npm run typecheck` — cero errores (solo cubre `src/**`).
2. `npm run typecheck:api` — `deno check` sobre las 8 edge functions
   (`scripts/check-backend.mjs`). El backend NO tiene otra verificación estática: el CI
   despliega sin type-check, así que un error acá llega a producción.
3. `npm run parity` — compara las 28 constantes de dinero duplicadas entre `src/app.ts` y
   `supabase/functions/api/**` (`scripts/parity.mjs`). Si falla, el cliente mostraría un
   número y el servidor cobraría otro.
4. `npm run build` — regenera `index.html` desde `src/`.
5. `npm test` (o `npm run verify`, que encadena las cinco) — deben pasar TODOS (revisa el
   conteo real en la salida, ej. "19 passed", no un número fijo escrito aquí).
6. Si el cambio toca un flujo cubierto por `tests/` (checkout, pedido programado, cola
   admin, borrar cuenta, reclamos, tarjeta de regalo, Plan Semanal, pedido grupal,
   recompensas), revisa que el test siga representando el flujo real antes de asumir que
   "pasa" = "funciona".
7. Commit + push a la rama de trabajo, merge `--no-ff` a `main`, push `main`.

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

## Flujos y funcionalidades actuales del cliente

Catálogo (`catalog.ts`, `PROT_PRICE`/`SIG_DATA`/`SIDE_PRICE`/`REWARDS`): 7 Signatures
(6 públicos + `SIG05`, menú secreto de **rotación mensual** — ya no se llama "The Vault",
decisión del dueño 2026-08-10, ver detalle abajo), 6 proteínas build-your-own (una puede
quedar exclusiva del menú secreto según el ciclo vigente, no se puede armar por BYO), 4
bebidas de la casa (sin gaseosas de reventa, decisión de marca), tamaños 15CM/30CM, doble
proteína, salsa extra.

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
- **Combo + hora valle**: sándwich+bebida = -S/2 (una vez por par). Bebida gratis
  (hasta S/4) de 2pm-6pm hora Lima si el pedido se prepara en esa ventana (usa la hora de
  entrega si es programado, no la hora en que se arma el pedido). **Los dos nunca se
  suman** — solo se aplica el mayor de los dos.
- **Recompensas (R02-R06, puntos)**: 4ta salsa gratis, sube a 30CM gratis (tope plano
  S/8), doble proteína gratis, bebida gratis, sándwich 15CM gratis. Recalibradas contra
  el costo real de insumos (~45%, ver contexto de negocio).
- **Programa de puntos**: se ganan 1:1 por sol gastado (sin multiplicador VIP, retirado a
  propósito). Bono de bienvenida (registro), bono de referido (ambos lados), reto mensual
  (3 pedidos pagados = 50 pts), reto de descubrimiento (3 Signatures distintos = 50 pts).
- **Rangos** (`RANKS`, puramente de reconocimiento, nunca cambian precio/multiplicador):
  NUEVO → REGULAR (1) → INICIADO (5, desbloquea el menú secreto) → CÍRCULO INTERNO (15) →
  MESA FUNDADORA (30).
- **Crédito interno** (`credit_balance`, no retirable, no es dinero real):
  - Regalar saldo PROPIO a otro cliente (`credit-gift`, sin costo extra).
  - **Tarjeta de regalo** (`gift-card-purchase`): comprar crédito para OTRO cliente
    gastando PUNTOS propios (40 pts = S/1, sin cobro real — rediseñada en 2026-07 desde
    un cobro Culqi que no encajaba con la intención original).
  - **Plan Semanal** (`prepare-weekly-plan`+`confirm-weekly-plan`): paga S/95 hoy con
    tarjeta (Culqi vía `create-credit-charge`), recibe S/100 en saldo propio al instante.
- **Pedido grupal** (`create-group-order`/`add-group-item`/`close-group-order`): un
  organizador crea un código, cualquiera con el link agrega su propio sándwich sin
  necesitar cuenta, el organizador cierra y paga todo junto por el checkout normal.
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
  con/sin reembolso reconocido), dashboard de negocio (ingresos, tendencia 14 días, top
  productos, clientes en riesgo de fuga, reporte por rango de fechas, lista de
  preparación anticipada, rendimiento por franja horaria, direcciones problemáticas),
  gestión de inventario/cuentas admin/horario editable, exportar CSV, log de auditoría,
  contenido de marketing semanal listo para copiar, y desde 2026-08-10 **Menú secreto**
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
abandonado, segundo pedido, re-enganche de rango alto, nunca ha pedido (3 etapas),
aniversario de cuenta, reclamos por vencer (plazo legal). Recordatorios/alertas al
negocio: pedido estancado, pedido programado por empezar, stock bajo (cruce + diario),
contenido de marketing semanal. Limpieza/expiración: pagos manuales sin confirmar,
cargos Culqi pendientes, Plan Semanal sin confirmar, conciliación de cargos Culqi
huérfanos (cobro real sin pedido/Plan Semanal detrás). Ver el mapa completo de acciones
en `supabase/functions/api/index.ts` (`ACTIONS`) y los cron jobs en Supabase
(`select * from cron.job` vía `execute_sql`) para horarios exactos.

## Contexto de negocio (mantener actualizado — afecta toda decisión de precio/margen)

- **El negocio aún NO ha abierto** — fecha de apertura confirmada por el dueño 2026-08-01:
  **lunes 7 de septiembre de 2026**. Todo lo que hay hoy en `orders`/`customers` en
  Supabase es data de prueba (unos 10 pedidos, 2 clientes) — NO representa ventas reales.
  Cualquier proyección financiera hecha antes del lanzamiento es una SIMULACIÓN basada en
  referencias/benchmarks, nunca un pronóstico con historial real — debe reconstruirse con
  datos reales apenas el negocio esté operando y haya volumen real que medir.
- **Margen de insumos+empaque**: base de trabajo acordada con el dueño de 45% del precio
  de venta — deliberadamente conservador/alto a propósito. Un cálculo directo con precios
  reales de Perú investigados dio ~26-36% según el producto; el dueño pidió trabajar con
  45% dejando margen extra reservado para mejorar el empaque más adelante. Mano de obra =
  S/0 en los cálculos (el dueño arma los pedidos él mismo, sin planilla, mientras el
  volumen lo permita — esto deja de ser válido si el volumen crece lo suficiente como
  para necesitar contratar).
- **Precios de insumos (Perú, julio-agosto 2026)**: res ~S/20/kg, pollo ~S/17/kg,
  **embutido premium (jamón/paté/cabanossi) S/48/kg — precio real confirmado por el dueño
  2026-08-01** (reemplaza el estimado investigado online de S/50/kg usado hasta la v4 de
  `MENU_FINANCIAL_ANALYSIS.md`; la simulación financiera sigue sin recalcular con este
  número, ver ese documento), carne molida ~S/10/kg, queso ~S/35/kg, pan ~S/9-13/kg según
  tipo. **Atún en lata sigue siendo el único insumo sin cotización propia confirmada** —
  el análisis financiero usa ~S/67/kg (investigado online, Tottus) como estimado
  conservador mientras el dueño cotiza con un proveedor real. Las bebidas caseras (infusiones)
  tienen margen bruto real 61-84%, mucho mejor que los sándwiches — no conviene agregar
  gaseosas embotelladas de reventa (peor margen a precios de delivery creíbles, además de
  diluir la diferenciación de marca que ya se buscó al retirar D01-D05 del catálogo).
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
  SIG07 THE CHICAGO, que cobraba S/25 en 15CM y 30CM (el cliente pedía el doble sin pagar
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
- **El delivery lo paga el CLIENTE y es pass-through puro — el motorizado NO es un costo
  fijo del negocio.** El cliente elige zona en el checkout (S/6 cerca · S/8 media · S/12
  lejos · S/15 muy lejos, `DELIVERY_ZONE_FEES` en `env.ts` y `DELIVERY_PRICE_ZONES` en
  `src/app.ts`, deben coincidir) y ese monto se cobra dentro del mismo pago del pedido;
  el dueño le paga al motorizado con ese dinero. El negocio no gana ni subsidia el
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
