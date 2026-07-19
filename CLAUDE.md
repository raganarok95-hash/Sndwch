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
- **Tests**: `tests/*.spec.ts` (Playwright, 12 archivos / 19 tests hoy — el número crece,
  no lo tomes como techo) — mockean el endpoint `api` por `action` (ver `tests/helpers.ts`
  → `gotoApp`/`mockBackend`) en vez de depender de red real. Nunca usan un reloj real
  fijado globalmente (rompe timestamps "realistas" de otros mocks) — si un test necesita
  una hora específica (ej. evitar la promo de hora valle), usa `page.clock.setFixedTime()`
  **dentro de ese test**, no en `helpers.ts`.
- **Migraciones DB**: no hay carpeta `supabase/migrations/` trackeada en git — todas se
  aplican directo con `mcp__Supabase__apply_migration` y solo quedan registradas en
  Supabase (`mcp__Supabase__list_migrations`). Si necesitas ver el schema de una tabla,
  consúltalo con `mcp__Supabase__execute_sql` contra `information_schema`, no busques un
  archivo `.sql` en el repo.

## Checklist antes de dar por terminado un cambio en el cliente

1. `npm run typecheck` — cero errores.
2. `npm run build` — regenera `index.html` desde `src/`.
3. `npm test` (o `npm run verify`, que encadena las tres) — deben pasar TODOS (revisa el
   conteo real en la salida, ej. "19 passed", no un número fijo escrito aquí).
4. Si el cambio toca un flujo cubierto por `tests/` (checkout, pedido programado, cola
   admin, borrar cuenta, reclamos, tarjeta de regalo, Plan Semanal, pedido grupal,
   recompensas), revisa que el test siga representando el flujo real antes de asumir que
   "pasa" = "funciona".
5. Commit + push a la rama de trabajo, merge `--no-ff` a `main`, push `main`.

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
(6 públicos + `SIG05` THE VAULT, menú secreto), 6 proteínas build-your-own (`P03` es
exclusiva del VAULT, no se puede armar por BYO), 4 bebidas de la casa (sin gaseosas de
reventa, decisión de marca), tamaños 15CM/30CM, doble proteína, salsa extra.

- **Pedido normal**: build-your-own o Signature → carrito multi-ítem → checkout
  (nombre/dirección/teléfono, opcional cuenta) → pago Culqi (tarjeta, reserva atómica
  `prepare-order`+cobro+`place-order`), Yape/Plin (manual, queda `pending` hasta que un
  admin confirma), crédito propio, o recompensa que cubre el 100%. Puede programarse
  para más tarde (`scheduledFor`, dentro de horario de atención).
- **Combo + hora valle**: sándwich+bebida = -S/3 (una vez por par). Bebida gratis
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
  NUEVO → REGULAR (1) → DE LA CASA (5, desbloquea THE VAULT) → CÍRCULO INTERNO (15) →
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
  contenido de marketing semanal listo para copiar.

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

- **El negocio aún NO ha abierto** — el plan del dueño es lanzar en ~2 meses desde julio
  2026 (aprox. septiembre 2026). Todo lo que hay hoy en `orders`/`customers` en Supabase
  es data de prueba (unos 10 pedidos, 2 clientes) — NO representa ventas reales. Cualquier
  proyección financiera hecha antes del lanzamiento es una SIMULACIÓN basada en
  referencias/benchmarks, nunca un pronóstico con historial real — debe reconstruirse con
  datos reales apenas el negocio esté operando y haya volumen real que medir.
- **Margen de insumos+empaque**: base de trabajo acordada con el dueño de 45% del precio
  de venta — deliberadamente conservador/alto a propósito. Un cálculo directo con precios
  reales de Perú investigados dio ~26-36% según el producto; el dueño pidió trabajar con
  45% dejando margen extra reservado para mejorar el empaque más adelante. Mano de obra =
  S/0 en los cálculos (el dueño arma los pedidos él mismo, sin planilla, mientras el
  volumen lo permita — esto deja de ser válido si el volumen crece lo suficiente como
  para necesitar contratar).
- **Precios de insumos investigados (Perú, julio 2026)**: res ~S/20/kg, pollo ~S/17/kg,
  atún en lata ~S/38/kg, embutido premium (jamón/paté/cabanossi) ~S/38/kg, carne molida
  ~S/10/kg, queso ~S/35/kg, pan ~S/9-13/kg según tipo. Las bebidas caseras (infusiones)
  tienen margen bruto real 61-84%, mucho mejor que los sándwiches — no conviene agregar
  gaseosas embotelladas de reventa (peor margen a precios de delivery creíbles, además de
  diluir la diferenciación de marca que ya se buscó al retirar D01-D05 del catálogo).
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
