# Qué funciona y qué no en este entorno

Capacidades y limitaciones descubiertas al trabajar en este sandbox: qué dominios bloquea
el proxy, qué MCP responde, qué herramienta de generación sirve y cuál no. Salió de
`CLAUDE.md` el 2026-09-17 por tamaño.

**Consúltalo antes de concluir que algo "no se puede".** Está escrito justamente para que
cada sesión no vuelva a descubrir desde cero lo mismo — y varias entradas documentan
sesiones enteras gastadas en un camino que no existía.

Mantenerlo al día es parte del trabajo: si descubres una capacidad o un bloqueo nuevo,
anótalo acá.

---

## Capacidades y limitaciones técnicas descubiertas (mantener actualizado)

- **Las descargas de GitHub Releases SÍ pasan el proxy** (comprobado el 2026-09-24): así se baja
  PostgREST para `npm run check:e2e` (`scripts/e2e/servidor-local.mjs` lo guarda en `.cache/`,
  fuera de git). Si algún día deja de pasar, el chequeo lo DICE en vez de saltarse.
- **Postgres 16 está instalado** (`/usr/lib/postgresql/16/bin`) y las pruebas levantan uno propio
  (`scripts/pg-local/postgres.mjs`). La base real es Postgres 17: el cargador local quita el
  permiso `MAINTAIN`, que el 16 no conoce.
- **Node 22 corre TypeScript sin compilar** con `--experimental-strip-types`: así los flujos de
  punta a punta usan el mismo `_shared/dinero.ts` que el servidor.

- **HuggingFace (`huggingface.co`) está BLOQUEADO por el proxy: responde 403** (comprobado
  el 2026-09-24). Toda librería que baje modelos de ahí por defecto (fastembed,
  sentence-transformers, `knowledge-rag`) falla al arrancar. No se reintenta: se baja el
  modelo de otro origen y se le impide a la librería llamar a HuggingFace.
  - **Google Cloud Storage sí responde.** fastembed publica ahí sus modelos:
    `https://storage.googleapis.com/qdrant-fastembed/fast-multilingual-e5-large.tar.gz`
    (el que usa `knowledge-rag`). Se descarga con `curl` y se extrae en
    `.knowledge-rag/models_cache/` (ignorado por git).
  - **Se corre con `HF_HUB_OFFLINE=1`** (más `KNOWLEDGE_RAG_DIR=/home/user/Sndwch/.knowledge-rag`).
    "Sin conexión" significa **sin conexión a HuggingFace**, no sin red: obliga a la librería a
    usar el modelo ya bajado en vez de intentar llegar a un host que el proxy rechaza.
  - **`knowledge-rag` se instala con `pip install --ignore-installed PyYAML knowledge-rag`**:
    el PyYAML del sistema (paquete de Debian) no se deja desinstalar.
  - **No hay GPU**: el indexado corre en CPU con un modelo de 1024 dimensiones sobre ~456
    archivos, y tarda: el 2026-09-24 llevaba **más de 19 minutos sin terminar** y se detuvo a
    pedido del dueño. **No lanzarlo dentro de una sesión** sin preguntar antes: ocupa la CPU del
    contenedor (las pruebas corren más lentas mientras tanto) y la tarea queda a la vista como
    «en ejecución». Si hace falta, con un modelo más chico o solo sobre `docs/`.

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
- ⚠ **LAS IMÁGENES NO SON UN LÍMITE: el dueño las genera en Flow, sin tope** (confirmado por
  él, 2026-09-17, con estas palabras: «LAS IMÁGENES SON ILIMITADAS EN FLOW, PUEDO GENERAR LAS
  QUE SEA, QUE NADA LIMITE TU CREATIVIDAD POR LO QUE TENEMOS»). **Nunca recortes un pedazo de
  una pose existente para fabricar otra** —se intentó sacar el brazo de `wicho_saluda.png` para
  simular una mano que agarra y salió un parche— ni descartes una idea de diseño porque el asset
  no existe todavía. Lo que se hace es **escribir el prompt** siguiendo `docs/PROMPTS_PERSONAJES.md`
  y pedírselo. Si hay una vía mejor y más fácil sin perder calidad, se usa esa.
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
- **Todo Culqi y Yape bloqueado por `WebFetch` (2026-09-23)**: `culqi.com`,
  `ayuda.culqi.com`, `docs.culqi.com` y `www.yape.com.pe` devuelven `EGRESS_BLOCKED`. Para
  comisiones y condiciones, `WebSearch` con `allowed_domains` en esos dominios devuelve
  fragmentos de sus propias páginas — sirve, pero no reemplaza al CulqiPanel del dueño para
  la cifra definitiva de su cuenta. Ver `docs/COBRO_YAPE.md`.
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
- **Conectarse a Google Flow desde una sesión: NO se puede desde acá, y el motivo no es que no
  exista la herramienta — es dónde vive (investigado 2026-09-11).** Tres datos:
  1. **Flow no tiene API pública.** El acceso programático a sus mismos modelos va por la
     **Gemini API / Vertex AI**, o sea **Veo** — exactamente lo que se retiró el 2026-09-10 por
     costar US$0.10-0.15 por segundo y duplicar el proceso que el dueño ya tiene. "Conectarse a
     Flow por API" y "volver a poner Veo" son la misma cosa con otro nombre.
  2. **Sí existen MCP de Flow, pero son LOCALES y de terceros** (`hitjcl/google-flow-mcp`,
     `Mitanshp5/Google-Flow_MCP`, `gabrielgargiulodev/google-flow-mcp`). Funcionan manejando un
     Chrome **ya logueado en la cuenta del dueño** por CDP — o sea que necesitan su máquina y su
     sesión de Google. En un contenedor remoto y efímero como este no hay ninguna de las dos. Y
     conviene decirlo: son paquetes de la comunidad a los que se les entrega el control de un
     navegador con la cuenta de Google abierta.
  3. **El proxy lo confirma**: `labs.google` (donde vive Flow) no responde, mientras que
     `generativelanguage.googleapis.com` y `aiplatform.googleapis.com` **sí son alcanzables**
     (404 en la raíz, que es respuesta real). O sea que técnicamente Veo se podría llamar desde
     una sesión — lo que lo impide es la decisión de costo ya tomada, no la red.
  La vía real, si el dueño la quiere: instalar uno de esos MCP en **su** Claude Code local.
  **El dueño lo pidió el 2026-09-11 y la guía quedó en `docs/FLOW_EN_TU_LAPTOP.md`**, escrita
  leyendo los README reales por `raw.githubusercontent.com` (que NO está bloqueado), no de
  memoria. Los tres NO son equivalentes y la comparación decide: **`hitjcl/google-flow-mcp`** se
  instala con un comando (`claude mcp add --scope user google-flow -- npx -y
  google-flow-browser-mcp`), está hecho para Claude Code, **usa un perfil de navegador propio en
  `~/.google-flow-creator/` en vez del Chrome del dueño**, dice explícitamente que no lee ni
  guarda contraseñas ni 2FA, y **pide confirmación antes de cada generación que gasta créditos**.
  El de `Mitanshp5` usa o copia el perfil real de Chrome y no menciona ninguna de esas dos
  salvaguardas; lo único que tiene de más son personajes y escenas, que conviene hacer a mano
  desde la interfaz de Flow igual.
  **Y lo primero que hay que hacer ahí no es un video: es crear a SANDO, WICHO y MAFE como
  PERSONAJES de Flow**, subiendo `sando_sonrie.png` y `wicho_rie.png` — los BUSTOS, no los
  `_cuerpo`, que traen pegada la elipse de sombra del piso. Eso es lo que resuelve que el estilo
  no viaje en palabras, que es el defecto probado en la regla 5 de
  `docs/PROMPTS_PERSONAJES.md`.
- **`mcp__Gamma__generate_image` SÍ existe y funciona — corrige lo que decía este archivo**
  (probado 2026-09-11). La nota vieja de más abajo dice que no hay herramienta directa de
  texto-a-imagen; eso era sobre `mcp__Gamma__generate`, que arma un documento entero. La
  herramienta nueva genera **una imagen suelta** y devolvió 1856x2304 px, por encima del mínimo
  de 2048 en el lado largo que piden las fichas de personaje. Dos límites reales:
  **cuesta ~70 créditos por imagen** (quedaban 115 tras la primera, o sea que el presupuesto se
  agota en dos), y **`referenceImages` solo acepta URLs públicas**, así que no se le puede pasar
  un archivo del repo. Eso último importa más de lo que parece: sin referencia **el estilo no
  viaja** (ver `docs/PROMPTS_PERSONAJES.md`, regla 5 — probado pidiendo SANDO al estilo de WICHO:
  salió la identidad y no salió el estilo). Y **`cdn.gamma.app` está bloqueado por el proxy**,
  así que la imagen generada no se puede descargar acá ni pasar por `asset_inline_preview` de
  Adobe, que rechaza ese host: solo queda entregarle la URL al dueño.
- **Producción de video para marketing: el dueño ya tiene su propio proceso con Google
  Flow (generación de video con IA), confirmado 2026-08-10** — y **el 2026-09-10 se retiró
  `admin-video-generate`**, la acción que generaba el video llamando a Veo por API.
  Cualquiera de sus tres motivos bastaba: costaba **US$0.10-0.15 por segundo** en un negocio
  que todavía no abre; **nunca se configuró su `GEMINI_API_KEY`**, así que jamás generó un
  solo video y llevaba desde que se escribió respondiendo 503; y **duplicaba un proceso que
  ya existe**. Un segundo camino que hace lo mismo peor y cobrando no es una opción, es
  código que se mantiene para no usarse.
  Lo que queda y sí se usa es `admin-video-script`, que arma el guion y el **prompt listo
  para pegar en Flow**. Desde la misma fecha ese prompt viaja DENTRO del borrador semanal
  del calendario (`flowPromptSemanal`), así que el dueño no tiene ni que abrir la pantalla:
  el formato se LEE de la letra con la que ya empieza el guion de esa semana —elegirlo
  aparte sería que el prompt diga un formato y el guion de al lado diga otro— y el Signature
  rota con la semana, salvo en EL SECRETO, que por no mostrar producto siempre le toca al
  menú secreto. — no es una integración de
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
- **Creative Cloud SIRVE para ENCONTRAR archivos del dueño, pero NO para traerlos a este
  sandbox — probado por tres vías distintas el 2026-09-12.** `asset_search` con
  `entityScope:"CCAsset"` funciona perfecto y lista lo que el dueño subió (nombre, tamaño,
  fecha, id). El problema es la descarga: **`renditionURL`, `downloadURL` y la URL que
  devuelve `asset_get_presigned_urls` resuelven las TRES a `at.adobe.com` o a
  `platform-cs-va6.adobe.io`**, y el proxy responde `http=000` a las dos. La descripción de
  `asset_get_presigned_urls` promete "presigned S3 URLs" — para assets `acp` no lo son, así
  que no hay que gastar la llamada esperando un host de S3.
  **La vía que SÍ funciona para que el dueño le pase un archivo a la sesión es Google
  Drive**: `mcp__Google_Drive__download_file_content` devuelve el contenido en **base64** y
  soporta `image/png`, `image/jpeg` y `image/jpg` explícitamente, así que se decodifica y se
  escribe en disco sin pasar por la red. **Requiere que el conector tenga alcance de lectura**
  — si no, responde `Insufficient scope` aunque aparezca conectado, y eso se arregla
  reconectándolo desde Ajustes de conectores de claude.ai (una sola vez).
  **Y lo que NO funciona de ninguna forma: las imágenes que el usuario PEGA en el chat.**
  Llegan como contenido de la conversación, no como archivo — se pueden ver pero no guardar.
  Verificado: `/mnt/user-data/working` existe y queda vacío, y no aparece ningún archivo
  nuevo en disco. Si el dueño pide "mete tú las imágenes", la respuesta es pedirle Drive (o
  que las pushee), no buscar la ruta otra vez.
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
