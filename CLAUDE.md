# SND//WCH — guía para trabajar en este repo

Sandwichería con pedidos online (Trujillo, Perú). Cliente de una sola página + backend en edge
functions de Supabase. **Aún no ha abierto** (abre a más tardar la 2.ª semana de octubre de 2026):
todo lo que hay en `orders`/`customers` es data de prueba y toda proyección es simulación.

## Cómo está organizada la documentación

Este archivo son las **REGLAS**, cortas, porque se inyecta entero en cada turno (compactado el
2026-09-30 de 48 KB a ~16 KB para ahorrar créditos). **El porqué de cada regla, los ejemplos y los
relatos están en `docs/MANUAL_DETALLADO.md`** (copia íntegra del archivo anterior) y en
`docs/DECISIONES.md`. Una regla nueva va acá en dos líneas; su historia va allá.

| archivo | qué tiene | cuándo leerlo |
|---|---|---|
| `docs/MANUAL_DETALLADO.md` | el detalle de cada regla de este archivo | cuando una regla no se entienda |
| `docs/NEGOCIO.md` | costos, márgenes, CAC, el modelo | **antes de tocar precio, receta o recompensa** |
| `docs/DECISIONES.md` | por qué cada cosa está como está | antes de "simplificar" algo |
| `docs/FUNCIONALIDADES.md` | qué existe hoy | antes de proponer algo que quizá ya está |
| `docs/ENTORNO.md` | qué bloquea el proxy, qué MCP responde | antes de concluir que algo "no se puede" |
| `docs/COMO_DISENAR_ACA.md` | ARREGLO vs REPENSAR | **antes de rediseñar una pantalla** |
| `docs/LOS_DOS_HERMANOS.md` | SANDO y WICHO | antes de diseñar una pantalla del cliente |

## Ahorrar créditos (2026-09-30)

- Probar lo que se tocó con `npx playwright test tests/<archivo>`; la suite completa (≈1–2 min) va
  UNA vez, al final, antes de mergear, con `npm run test:estado` redirigido a un archivo.
- Leer rangos de archivos (`sed -n a,bp`, `grep -n`, `cut -c1-200`), nunca archivos enteros de
  miles de líneas; capturas de pantalla a la mitad de tamaño salvo que haga falta el detalle.
- No repetir un chequeo que ya pasó sin cambios de por medio; reindexar (`npm run indice`,
  por tandas, en segundo plano) solo tras commitear un bloque de docs o código.
- Un relato nuevo va a `docs/`, no a este archivo.
- **Buscar antes de leer** (flujo completo en `docs/COMO_USAR_EL_INDICE.md`):
  `npm run buscar -- --archivos "consulta"` dice QUÉ archivo responde; después se lee solo ese rango.
  Datos de carta, precios, reglas y cálculos: `--cat hechos` (`docs/hechos/`, generado con
  `npm run hechos`, que se corre tras tocar `_shared/carta|reglas|dinero.ts`). Precio real: la base.
- **La memoria vive en el repo, no en el chat.** Al cerrar un bloque de trabajo se escribe
  `docs/sesiones/AAAA-MM-DD.md` (hecho, decisiones del dueño con sus palabras, pendiente) y se
  commitea. Con el contexto sobre ~60%, se recomienda al dueño abrir sesión nueva. **Una sesión
  nueva empieza así**: `bash scripts/preparar-indice.sh` en segundo plano (el contenedor viene sin
  índice ni modelo) y, mientras tanto, leer la última `docs/sesiones/*.md`.

## Estructura

- **Cliente**: `src/app/NN-*.ts` (scripts globales, NO módulos: sin `import`/`export`, el orden
  importa) + `src/shell.html` (CSS/HTML con `__APP_JS__`). `npm run build` genera `index.html`,
  **único artefacto servido: nunca se edita a mano**. `check:bundle` exige prefijos consecutivos.
- **Backend**: 8 edge functions en `supabase/functions/` (`api` con sus `actions/*`,
  `create-charge`, `create-credit-charge`, `weekly-summary`, `daily-summary`, `birthday-bonus`,
  `winback-campaign`, `send-order-email`).
- **Tests**: `tests/*.spec.ts` (Playwright, mockean `api` por `action` con `gotoApp`/`mockBackend`
  de `tests/helpers.ts`); una hora fija se pone con `page.clock.setFixedTime()` DENTRO del test.
- **Migraciones**: `supabase/migrations/<version>_<nombre>.sql` con la **`version` exacta
  registrada en la base**. Se aplican con `mcp__Supabase__apply_migration` y se escribe el mismo SQL
  en un archivo en la misma sesión. 4 archivos llevan el secreto de cron redactado a propósito.
- **`orders.id` es `text` con check de uuid, a propósito** (un id mal escrito da 404, no 500).

## ⚠ Precios

- **Cambiar un precio en `_shared/carta.ts` o `catalog.ts` NO cambia el precio real**: manda la
  tabla `catalog_prices`. Tras editar un precio, verificar con `execute_sql` si ese `code` tiene
  fila y actualizarla con `apply_migration` en la misma sesión (SIG05 vive en `secret_signature`).
- **Una cifra que el código conoce se interpola, nunca se escribe** en un texto al cliente (push,
  correo, caption, pantalla). Y si un texto nombra un producto canjeable según un número editable,
  ese nombre también se DERIVA (`loQueGanaElInvitado()`, `etiquetaDeEscalon()`).

## Las trampas vivas — lo que rompe sin avisar

- **La app abre SIEMPRE en la puerta y no pide cuenta antes de pagar.** La cuenta se ofrece UNA
  vez: en la losa de la 06A o desde la esquina de la puerta. Toda vinculación de un pedido de
  invitado pasa por `vincularPedidoDeInvitado()` (`api/actions/auth.ts`).
- **El menú se edita desde el panel**: Signatures en `catalog_items`, SIG05 en `secret_signature`,
  precios en `catalog_prices`. `_shared/carta.ts` es la semilla y la ÚNICA carta (cliente,
  servidor, modelo vía `check:carta`); la lógica pregunta por propiedades, nunca por códigos.
- **Registrar una acción es un paso aparte de importarla** (`check:acciones`). TODA acción tiene
  contrato en `_shared/contrato.ts` (las 155 desde el 2026-10-01; lo exige `test:api`) y declara
  cada campo que lee, incluidos los de sus auxiliares (`check:contrato-campos`): lo no declarado
  llega vacío. Lee la base con `leer()` (db.ts). El panel usa `crudo`: endurecerlo es pendiente.
- **Toda RPC `security definer` lleva su `revoke execute ... from public, anon, authenticated`**
  (`check:rpc`).
- **No se nombra un mecanismo apagado** (`offpeakActiva()`), ni se usa `rankName()` para el menú
  secreto: los textos hablan de PEDIDOS.
- **La paleta de la app anterior no vuelve, ni como respaldo** (`check:colores`).
- **Toda barra fija lleva la clase `sw-barra`** (la mide `medirBarraFija()`).
- **`BYO_STEP_LABELS` es el orden real de los pasos del armador** (`tests/armador-riel.spec.ts`).
- **Un estado vacío del cliente se pinta con `VACIO()`.**
- **Meta SÍ está conectado** (dueño, 2026-10-07): cuenta de anuncios **1488138326460689** (en el
  Business «Sndwch», desde el 2026-10-08; la vieja 221839797 no se usa) por el MCP `Meta_Ads`, y
  los secrets en Supabase. Píxel y CAPI: conjunto «SNDWCH.APP» `1410494047274081`. Si el filtro de permisos bloquea una llamada, NO es falta de
  acceso: se reintenta con la autorización del dueño. Nunca reportar «no tengo acceso a Meta».
- **Un secret no se da por ausente mirando el código**: llega del servidor en `get-store-hours`.
  El de Google SÍ está puesto. Verificar contra Supabase, nunca por inferencia.
- **Un costo es una ficha con unidad** en `modelo/insumos.py`, repartido solo por
  `por_sandwich()` (`check:costos`).
- **Un guard atómico por estado admite TODOS los estados legítimos** (`RESERVA_CONFIRMABLE`).
- **La carga de una hora se cuenta solo en `capacidad.ts`.**
- **Un id que pasó por el HTML se compara con `mismoId()`**, nunca con `===`.
- **El dinero se calcula en UN sitio: `_shared/dinero.ts`** (`parity`).
- **Tras cada migración**: nueva foto del esquema en `supabase/esquema-actual.sql` (`check:pg`) y
  tipos regenerados (`check:tipos-base`).
- **Una tabla la escribe UNO por operación** (`check:doble-escritura`).
- **Una prueba no nombra un producto: lo pide a la carta** (`tests/carta.ts`; inventados, serie 9x).
- **Una prueba que no se vio fallar no prueba nada**: inyectar el defecto antes de darla por buena.
- **Solo se escribe una prueba si el error sería SILENCIOSO y costaría dinero, datos, lo legal o el
  acceso** (dueño, 2026-10-01). Lo visual se revisa en el celular y en `scripts/sitio-real.mjs`
  (corre en GitHub contra sndwch.app tras cada publicación); no se fija con una prueba por error.
- **El modo de fallo que importa es el SILENCIO.**
- **Una prueba busca por FUNCIÓN, nunca por texto**: `data-accion="…"` en el botón, id del campo
  o rol sin nombre; afirma el EFECTO (la llamada, el estado, la pantalla siguiente), no el copy;
  nunca `waitForTimeout`. Trinquete: `check:pruebas-por-funcion` (lo heredado solo baja; al tocar
  una prueba vieja, se migra). Si se rompe por un texto, se arregla el selector, no el texto.
- **Cada prueba abre con su promesa y su modo de fallo**; un error que reporta el dueño se
  REPRODUCE antes de arreglarlo. Detalle y lista completa: `docs/COMO_PROBAR.md`.
- **La laptop del dueño corre sola el Estudio (Flow) y el lunes de la agencia** (`scripts/estudio/`,
  autorizado 2026-10-08); sube a la rama `estudio` y `historias.yml` lo une a main y lo programa.
- **El dueño NO reparte**: lo hace un tercero (50+ motorizados) avisado en un grupo de WhatsApp
  (`docs/NEGOCIO.md`). No se le pregunta otra vez: se lee antes de diseñar entrega o cocina.

## Checklist antes de dar por terminado un cambio

`npm run typecheck` · `typecheck:api` · `test:api` · `parity` · `build` · `check:backup` ·
`check:smoke` · `check:shell` · `check:acciones` · `check:costos` · `check:rpc` · `check:e2e`
(un flujo de dinero nuevo va ahí) · `check:columnas` · `check:doble-escritura` · y al final
`npm run test:estado` (compara contra `tests/ROJAS_CONOCIDAS.txt`). **Nunca a través de `| tail`
ni `| grep`**: redirigir a un archivo y guardar `$?`. Si el cambio toca un flujo cubierto por
`tests/`, revisar que la prueba siga representando el flujo real. Después: commit + push a la
rama, merge `--no-ff` a `main`, push `main`; si existe `supabase/migrations-al-mergear/`, se aplica
justo después del deploy de `main`.

## Fotos

`scripts/tratar_fotos.py` lee de `img/fuente/` y escribe en `img/`, nunca al revés. Toda foto nueva
se anota en `img/fuente/FUENTES.md` el mismo día (`check:fotos`).

## Desplegar el backend

**Automático por CI** (`.github/workflows/deploy-api.yml`, en cada push a `main` que toque
`supabase/functions/**`, con prueba de humo contra producción). **Nunca desplegar a mano** con
`mcp__Supabase__deploy_edge_function` salvo que el CI esté roto. Verificar con
`mcp__github__actions_list` contra el SHA del merge. Una función nueva entra al workflow el mismo
día. Las migraciones van ANTES del push si el código depende de ellas.

## Respaldo de la base

Plan `free`, sin respaldos de Supabase: `.github/workflows/backup-db.yml` respalda y RESTAURA a
diario. Restaurar = cargar `supabase/esquema-actual.sql` y después los datos. Las filas viajan
como `row_to_json(t)::text`; la lista de tablas se descubre en cada corrida. Detalle en el manual.

## Sistema visual

`check:sistema`: texto `8·9·11·13·15·18·22·28` (+ `40·56·72` display), radios
`4·8·10·12·20·999`. En empate, SUBE: el texto que lee el cliente nunca se achica por un refactor.

## Maquetas, SANDO y WICHO

- **Las maquetas aprobadas son la especificación exacta** (`docs/maquetas/`: PNG en `aprobadas/`,
  HTML en `fuentes/`, índice en el README). Toda aprobación se guarda ahí el mismo día
  (`check:maquetas`). Los datos de muestra no se copian: salen del código.
- **SANDO se redibujó** (línea limpia, sombreado plano) y NO comparte trazo con WICHO: así quedó.
  Sus 9 archivos son `img/sando2_{frente,sonrie,mira,perfil,ladea,asoma,pulgar,cuerpo,cuerpo_forro}`.
  Las poses se escriben ENTERAS en `POSES` (02-*). **El logo y la puerta se quedan con el SANDO
  anterior, aprobado así: no se migran.** Lo que los distingue es cada personaje, no el color (ver
  `docs/LOS_DOS_HERMANOS.md`). Cada uno se regenera contra SU referencia (`img/sando2_frente.png`,
  `img/wicho_rie.png`); las referencias para Flow van sin transparencia, fondo blanco, al doble.
- **Pedir la imagen que falta es parte del diseño**: si una pose no existe, se pide con su prompt
  en `docs/POSES_QUE_TE_TOCAN.md`. La respuesta más fácil casi nunca es la correcta.

## Restricciones permanentes

- **Nunca modificar el texto legal** (Términos, Privacidad, Cambios y Devoluciones, Cancelaciones)
  sin pedido explícito.
- **El DNI es obligatorio en el registro normal.** Única excepción: el registro con Google (y la
  base lo exige igual con `customers_dni_o_google`). Ampliarla requiere pedido explícito.
- **Nunca inventar datos legales del negocio** (RUC, razón social, dirección).
- **El sándwich generado con IA SÍ se permite en el contenido de marketing** (dueño, 2026-10-07:
  «quita la restricción de no poder hacer el sándwich»), **fiel a la receta y la porción reales**:
  INDECOPI sanciona la imagen que promete más relleno del que llega. Las fotos de la app siguen
  siendo las reales de `img/` (`check:fotos`).
- **Git destructivo** (force-push, reset --hard, borrar ramas) requiere confirmación explícita.

1. **Responder siempre en español, con "tú", nunca voseo** — en TODO texto visible (mensajes,
   descripciones de herramientas, captions, tareas, preguntas). Revisar antes de cada envío.
2. **"Primero muéstrame X antes de Y" es una parada real** para comitear, pushear, mergear,
   expandir o gastar. La verificación interna no espera.
3. **Concepto antes que código**: una dirección se cierra con el dueño antes de tocar producción.
4. **No generar Artifacts** salvo pedido explícito: mostrar con `SendUserFile`.
5. **Antes de decir "no se puede", buscar la vía** (lo ya hecho, `ToolSearch`, alternativas).
6. **Checklist de tareas honesto**: nada "completado" a medias.
7. **Usar las herramientas diferidas** (vía `ToolSearch`) antes de conformarse.
8. **Gastos reales requieren confirmación previa** (excepción: Adobe Stock `pricing:"free"`).
9. **Documentar en `docs/ENTORNO.md`** las capacidades y límites técnicos que se descubran.
10. **El "//" es la marca permanente: dos barras idénticas y paralelas** (`.wm-mark`: una regla
    compartida, `width:.10em;height:.88em;transform:skewX(-16deg);border-radius:1px`,
    `gap:.16em`), **la izquierda dorada `#CBA258` (SANDO), la derecha celeste `#8CC8EC` (WICHO),
    planas**. Siempre significó el corte del pan, nunca algo "tech". Todo lo demás (paleta,
    tipografía, marco) es libre de proponer con concepto antes que código. **SND//WCH no tiene
    identidad trujillana ni regional.** Detalle e historia en el manual. **En el contenido
    (videos, posts) el `//` NO es obligatorio ni es la base del concepto creativo** (dueño,
    2026-10-07): se usa donde sume, no como muletilla.
