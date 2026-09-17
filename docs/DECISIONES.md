# Decisiones del proyecto — por qué las cosas son como son

Este archivo guarda el RAZONAMIENTO detrás de cada decisión ya tomada, en orden
cronológico. Salió de `CLAUDE.md` el 2026-09-17, cuando ese archivo llegó a 52 000 tokens
que se inyectaban en cada turno de cada sesión.

**No se lee entero.** Se consulta cuando vas a tocar el área que describe, o cuando algo
parece arbitrario y quieres saber si lo es. Las REGLAS que salen de estas decisiones —lo
que hay que cumplir sin leer la historia— viven en `CLAUDE.md`; acá está el porqué.

Casi todas estas secciones describen un defecto real que llegó a producción. Si vas a
"simplificar" algo que acá está explicado, lee primero por qué está así.

---

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

## La política de privacidad decía lo contrario de lo que hace el píxel (2026-09-10)

El texto publicado decía, palabra por palabra: *"No vendemos ni compartimos tus datos con
terceros para publicidad."* El píxel de Meta hace exactamente eso, así que el día que se
configure el secret esa frase pasa a ser falsa. Ya está corregido, y **cada afirmación del
texto nuevo se verificó contra el código, no se redactó de memoria**: a Meta le llegan correo,
teléfono y **nombre de pila** hasheados con SHA-256, el monto sin delivery y los códigos de
producto; **no** le llegan DNI, fecha de nacimiento, PIN ni dirección. La IP la ve el navegador
de Meta, no el servidor (`clientIp` existe en `CapiPurchase` y **ningún llamador lo pasa**).

**Y avisar no alcanzaba.** La Ley 29733 da derecho de **oposición**, y prometerlo sin un
interruptor que lo cumpla es una promesa que se rompe el primer día que alguien la use. De ahí
`customers.ad_tracking_opt_out` y la tarjeta en Mi Perfil → Privacidad. Cuatro cosas que no hay
que romper:

- **El corte del navegador va en `fbTrack`**, el envoltorio, y NO en los cinco sitios que
  reportan un evento: ahí es donde el sexto se olvida.
- **El servidor corta en las DOS rutas.** La de `confirmManualPayment` importa más: Yape es el
  método por defecto, así que olvidarla dejaría el interruptor apagando casi nada. Un pedido de
  **invitado sí se reporta** — sin cuenta no hay dónde guardar una oposición.
- **El default es `false`.** La ley exige que oponerse SEA POSIBLE, no que haya que pedirlo.
- **El interruptor lee su estado del SERVIDOR**, no de lo que el navegador supone que guardó.
  Uno que miente sobre su propio estado es peor que no tenerlo.

Modo de fallo de todo esto: **silencio**. Quitar un guard no rompe nada visible — el pedido se
cobra, la pantalla se ve igual — solo hace que la app haga lo contrario de lo que promete su
texto legal. Por eso `tests-api/oposicion-a-la-medicion.test.ts` (5) y
`tests/oposicion-a-la-medicion.spec.ts` (4), las dos verificadas inyectando el defecto.

## La dirección se busca con Google; el mapa sigue en OpenStreetMap (2026-09-10)

*"La geolocalización es una porquería, no ubica mi dirección"* tenía una causa concreta:
**Nominatim tiene la avenida pero casi nunca el NÚMERO en Trujillo**, y el número es lo que el
motorizado necesita. Google Places sí lo tiene.

**Solo cambió el BUSCADOR.** Los tiles siguen siendo los de OSM: arrastrar el pin ya funcionaba
bien y pasar a "Dynamic Maps" de Google cobraría por cada apertura del mapa sin resolver ningún
problema que exista. Hay una prueba que lo fija, porque es la clase de cosa que alguien
"unifica" después.

**El costo entero cuelga del token de sesión.** Autocomplete se cobra **por sesión y no por
tecla**, y una sesión cerrada con un Place Details sale **gratis** en cualquier volumen. Por eso
`_gSessionToken` se crea al empezar a escribir y **se descarta al elegir**: reusarlo invalida la
sesión y Google pasa a cobrar tecla por tecla. Ese fallo **no da ningún error — llega como una
factura**, y por eso tiene prueba propia. El Place Details además trae las coordenadas que el
cobro por distancia necesita: no es una llamada extra, es la que vuelve gratis la sesión.

El reverse geocoding también pasa a Google (acierta el distrito mucho más seguido, y de ese
distrito depende si el pedido se puede entregar). Corre con **`google.maps.Geocoder` en el
navegador a propósito**: la API REST de Geocoding **rechaza una key restringida por referrer**
(probado, `REQUEST_DENIED`), y quitarle la restricción la dejaría usable por cualquiera que la
copie del HTML.

**Sin key, TODO cae a Nominatim** — secret sin configurar, o un shell viejo servido por un
service worker desactualizado. El peor caso es el comportamiento anterior, nunca un checkout
roto. También con prueba: sin ese respaldo el cliente se queda sin buscador y nada avisa.

⚠ **Requiere `Places API (New)` habilitada en Google Cloud**, no la legacy:
`AutocompleteSuggestion` no existe en la vieja. Una sola key sirve para todas las APIs
habilitadas del proyecto — no hace falta una por API.

## Lo que sí hace que la app parezca "un agregado a la web antigua" (2026-09-10)

El dueño lo reportó así y tenía razón, pero la causa **no** era el estilo de los personajes. Son
dos cosas concretas, encontradas renderizando las pantallas reales en vez de suponiendo:

1. **Los personajes están mal encuadrados en la home.** A SANDO se le corta la cabeza (queda solo
   la chaqueta y las piernas), WICHO se sale por la derecha, y el rótulo cae **encima** del
   cuerpo. Un personaje decapitado por su propio contenedor se lee como una imagen pegada donde
   no cabía.
2. **Las 8 fotos de Signature vienen de 8 sesiones fotográficas ajenas distintas** — una sobre
   tabla oscura con luz cálida dura, otra sobre plato gris con luz fría, otra sobre fondo blanco
   de estudio con una botella, otra sobre mantel estampado. No comparten luz, fondo, ángulo ni
   temperatura de color. Puestas en fila sobre el mismo verde se leen como resultados de una
   búsqueda de imágenes.

**Lo que las unifica no es el color, es el ENCUADRE.** Un viraje de color solo no arregla que una
foto tenga una botella de estudio y otra un mantel: probado en esta sesión, casi no se nota.
Cerrar el encuadre sí — la escenografía sale del cuadro y queda pan y relleno, que es lo único
que las ocho de verdad comparten. Encuadre cerrado al ratio de la tarjeta + viñeta + viraje a la
paleta + grano fino, **el mismo tratamiento en las ocho**.

**Y el tamaño de archivo importa aparte**: los Signatures son de 640×440 y la tarjeta a sangre
ocupa **1050 px reales** (medido con el navegador: 350×236 CSS px a DPR 3), así que se estiran
**1.64x**. Cualquier reemplazo se pide de al menos 1600 px de ancho.

### `scripts/tratar_fotos.py` — el tratamiento, versionado y repetible

Lee de **`img/fuente/`** y escribe en `img/`. Esa dirección no es un detalle: es lo que lo hace
**idempotente**. Aplicar viñeta y grano sobre una foto que ya los tiene la degrada un poco más
cada corrida, y ese defecto **no lanza ningún error** — solo va ensuciando el archivo cada vez
que alguien corre el script "por si acaso". Partiendo siempre del original no puede pasar, y
además deja re-ajustar los parámetros sin volver a conseguir las fotos.

**⚠ EL ZOOM CEDE ANTE LOS PÍXELES**, y ese guardarraíl es lo que evita que el script empeore lo
que vino a arreglar. Cerrar el encuadre **tira** píxeles: las fotos de hoy (640 px) cerradas a
1.34 quedan en 477, contra los 1050 que pide la tarjeta — o sea unificación a cambio de MÁS
estiramiento del que ya tenían. `zoom_util()` recorta el cierre hasta donde la fuente aguante y
se queda en 1.0 si no aguanta nada; con fotos grandes cierra entero y no cuesta nada. Cada
corrida imprime cuánto le falta a cada foto y hasta dónde pudo cerrar.

El **grano lleva semilla fija** para que las ocho compartan el mismo patrón (si cada una trae el
suyo, vuelve el problema que el script resuelve) y para que correr el script dos veces dé bytes
idénticos — así un diff dice si una foto cambió de verdad.

`npm run check:fotos` (dentro de `verify`) protege las dos cosas, más que cada foto servida
tenga su original guardado. **Su chequeo del ratio lleva el número medido escrito aparte, no
leído de `tratar_fotos.py`**: la primera versión comparaba el recorte contra la misma constante
que lo produce, así que cambiar `RATIO` a 16/9 pasaba sin protestar. Un chequeo que se mide
contra sí mismo no protege nada — verificado inyectando los tres defectos.

## El brief semanal prometía una promo retirada (2026-09-10)

El tema del calendario decía cuatro veces *"en hora valle tu bebida sale gratis"* — y la hora
valle **se retiró** por ser la única operación del catálogo con contribución negativa, así que
`OFFPEAK_DRINK_PROMO_HOURS_LIMA` quedó **vacío** y no se aplica nunca. El dueño copia esos
textos a Instagram y WhatsApp: era una promesa pública falsa, y la peor clase — no un número
desactualizado sino un mecanismo entero que ya no existe.

Ahora la frase **se agrega sola si la promo vuelve y desaparece sola si se retira**
(`offpeakActiva()` en `catalog.ts`), y el descuento del combo se interpola de
`COMBO_DISCOUNT_PER_PAIR` — bajó de S/2 a S/1 el 2026-08-22 y nadie revisó los textos.

**`tests-api/ocasiones-del-brief.test.ts` falla si CUALQUIER texto de marketing menciona la
hora valle mientras la promo esté apagada.** Su primera versión ya encontró un segundo caso
que un reemplazo manual no había alcanzado. Es la regla del archivo llevada un paso más allá:
no basta con interpolar las cifras, tampoco se puede nombrar un mecanismo apagado.

## El brief se ancla a OCASIONES, y el borrador cae en el día que le toca (2026-09-10)

Los 8 temas hablaban todos del **negocio** — referidos, plan semanal, menú secreto, combo — y
ninguno del momento en que a alguien se le antoja un sándwich. Nadie compra "The Original":
compra *almuerzo de oficina* o *antojo de noche*, y la marca que se recuerda en esa situación
es la que gana el pedido.

Cada tema tiene ahora una `ocasion` con momento, disparador, **día de la semana y hora**. Y
eso no es decoración: `planContentCalendar` **mueve la fecha al día que la ocasión pide**.
Antes sumaba 7 días desde el día en que el dueño tocara el botón, así que generar un domingo
dejaba las 8 semanas en domingo — y un post de "almuerzo de oficina" un domingo no le habla a
nadie. **La fecha solo se adelanta, nunca se atrasa**: un borrador para ayer no sirve.

**La ocasión va en el TÍTULO del borrador**, no en un campo aparte: es lo primero que el dueño
lee, y sin ella "COMBO" no dice a quién le habla ni cuándo publicarlo.

## La tarjeta de regalo es una elección dominada (2026-09-10)

Regalar el mínimo (S/10) cuesta **400 puntos** — exactamente lo mismo que **R06**, el sándwich
de S/20.90 gratis para uno mismo. Por el mismo esfuerzo el cliente se lleva el doble de valor
sin regalar nada, y llegar a esos 400 puntos toma **19 pedidos** al ticket del 15CM.

La pantalla ya lo dice con honestidad —avisa cuánto falta y **en cuántos pedidos**— y ganó
montos sugeridos **derivados del catálogo**: si un Signature sube de precio, un monto fijo
escrito dejaría de alcanzar para lo que promete, y un regalo que se queda corto en la caja es
peor que no haberlo sugerido. Se redondea **hacia arriba** por lo mismo.

Los límites `GIFT_CARD_AMOUNT_MIN/MAX` estaban **escritos a mano en el cliente** (en el texto y
en la validación) mientras el servidor los tenía como constantes; ahora los compara
`npm run parity`.

**Cambiar la tasa de 40 pts/sol es decisión del dueño** — hoy la función existe y casi nadie
va a poder usarla.

## "Continuar con Google" crea la cuenta en un solo campo (2026-09-12)

Hasta esta fecha el botón verificaba la identidad y **después mandaba al formulario
completo**: nombre, teléfono, PIN, DNI, fecha de nacimiento y correo. Ahorraba dos campos de
seis y seguía siendo un registro — o sea que no era lo que un cliente espera al ver ese
botón en cualquier otra web.

Ahora queda **un solo campo: el teléfono**, y la decisión de cuáles caen fue del dueño.

**El teléfono no se puede quitar, y no es una decisión de producto.** Es la `PRIMARY KEY` de
`customers`, con **seis tablas apuntándole por foreign key** (`orders`, `ratings`,
`favorites`, `saved_addresses`, `transactions`, `credit_ledger`), y además es lo único con lo
que el negocio ubica a alguien para entregarle el pedido. Google no devuelve teléfono en
ningún scope de Sign-In. Antes de proponer "cuenta con cero campos", mirar esas seis FK.

Cuatro cosas que no hay que romper:

- **El nombre y el correo se toman del token firmado por Google, NUNCA del cuerpo de la
  petición.** Si se aceptara lo que manda el cliente, cualquiera podría registrarse con el
  token de otra persona poniéndole el nombre que quisiera. Por eso la pantalla los muestra
  como texto y no como input: un campo editable mentiría sobre lo que se va a guardar.
- **El PIN lo genera el servidor y nunca se muestra.** Quien entra con Google no lo escribe
  jamás; obligarlo a inventar uno de 4 dígitos era un campo más y una cosa más que recordar.
  Si algún día pierde su cuenta de Google, "recuperar PIN" le deja fijar uno.
- **`dni` y `birthday` se guardan como `null`, no como `""`.** Una cadena vacía chocaría con
  la `UNIQUE` del DNI en cuanto hubiera dos cuentas de Google, y haría que `actRecover`
  encontrara coincidencia con cualquiera que deje el campo en blanco. Por lo mismo, el
  término `dni.eq.` **solo entra en el filtro de duplicados si hay DNI**: PostgREST lee
  `dni.eq.` sin valor como "igual a la cadena vacía" y el `or=()` empieza a traer filas que
  no tienen nada que ver — incluido el de `deleted_account_identities`, que decide si alguien
  cobra o no el bono de bienvenida.
- **`fbTrack('CompleteRegistration')` también se dispara acá.** Sin eso, toda cuenta creada
  por Google quedaría invisible para Meta y el CAC medido saldría más alto de lo real, justo
  por el camino que lo baja.

**Dónde aparece el botón** (elegido por el dueño): PUNTOS sin sesión —donde ya estaba—, el
checkout de invitado **arriba de los campos** (existe para ahorrar escribir; ofrecerlo
después de que ya escribieron no ahorra nada), y una pantalla de **primera apertura**.

⚠ **La primera apertura es una puerta antes del menú**, y el dueño la aceptó sabiéndolo. Por
eso "VER LA CARTA" es un botón del mismo ancho que el de Google y no un enlace al pie: quien
llega de un anuncio quiere ver comida, y una puerta que no se salta de un toque se cierra
saliendo de la app. La marca `sw_seen_hello` se escribe **al mostrarla, no al salir** — si se
escribiera al salir, cerrar la pestaña ahí la haría reaparecer para siempre. Y no se
interpone cuando la URL trae destino propio (`?group=`, `?ref=`, `?entrega=`): ahí romperia
el link que la persona tocó.

### ⚠ UNA PRUEBA QUE PREPARA EL ESTADO A MANO PUEDE VALIDAR UN CAMINO IMPOSIBLE

La pantalla de bienvenida (`p_hello`) **no se mostró NUNCA** desde que se escribió, y la
prueba que la cubría pasaba en verde todo el tiempo. Vale entender exactamente por qué,
porque el mecanismo se repite:

- La condición vivía suelta en el arranque y llamaba a `googleConfigured()` **de forma
  síncrona**. El client id llega por RED, dentro de `get-store-hours`, así que en ese momento
  `GOOGLE_CLIENT_ID` todavía es el marcador y la condición da `false` **siempre**, con secret
  o sin él.
- La prueba inyectaba el id con `addInitScript` **antes** de cargar la app. O sea que
  construía un estado que producción no puede alcanzar, y ahí la pantalla sí aparecía.

**Regla:** cuando una prueba tiene que PREPARAR un valor que en producción llega por red,
pregúntate si llega a tiempo. Si la prueba lo pone antes y la app lo recibe después, no estás
probando el mismo programa. Lo mismo vale para cualquier estado sembrado a mano.

La solución tiene dos mitades, y las dos hacen falta:
1. **`mostrarHolaSiCorresponde()` es UNA función** llamada desde los dos momentos en que hay
   que decidir —el arranque y la llegada del id— en vez de la condición escrita dos veces.
   Lleva `_holaYaDecidido` para no decidir dos veces, y `conRender` porque en el arranque el
   propio arranque ya pinta y renderizar dos veces se nota en un celular de gama baja.
2. **El id se cachea en `localStorage` (`sw_gcid`)**, así que de la segunda visita en adelante
   se sabe en el primer render sin esperar a la red. Es un valor público, no un secreto.

Y una salvaguarda que no hay que quitar: la bienvenida **no aparece si ya se navegó, si hay
algo en el carrito o si la URL trae destino propio**. Es para quien acaba de entrar, no una
pared que cae encima de quien ya está mirando la carta.

### ⚠ El client id VIAJA DESDE EL SERVIDOR — antes poner el secret no prendía nada

`env.ts` decía que el id "viaja también al cliente, ver `GOOGLE_CLIENT_ID` en `shell.html`".
**No viajaba, y en `shell.html` no estaba**: el cliente lo tenía escrito a mano en
`src/app/01-*` como `REEMPLAZA_...` y nada lo sobreescribía. O sea que correr
`supabase secrets set GOOGLE_CLIENT_ID=...` dejaba el botón igual de invisible, y no había
manera de enterarse — el único síntoma era la ausencia de un botón.

Desde el 2026-09-12 va en `get-store-hours` (campo `googleClientId`), **mismo patrón que
`META_PIXEL_ID`**: el client id de Google es público por diseño (viaja en el HTML de cualquier
sitio que use Sign-In), así que poner el secret **prende el botón sin redesplegar el cliente**.
El literal de `01-*` es SEMILLA, nunca la fuente.

**Lo que falta es del dueño y no se puede hacer desde una sesión**: crear el OAuth Client ID
(tipo *Aplicación web*) en **su** Google Cloud Console, con `https://sndwch.app` en los
orígenes autorizados de JavaScript, y correr `supabase secrets set`. Verificado el 2026-09-12:
`api.supabase.com` está **bloqueada por el proxy** (`http=000`), no hay `SUPABASE_ACCESS_TOKEN`
en el entorno de la sesión, y **el MCP de Supabase no tiene ninguna herramienta de secrets**
(solo migraciones, SQL, edge functions y ramas). No insistir por esa vía.

Nada de esto se ve sin el secret: `googleConfigured()` es falso con el marcador
`REEMPLAZA_...` y `googleCtaHTML()` devuelve cadena vacía, así que la app sin
`GOOGLE_CLIENT_ID` se ve exactamente como antes. Por eso `tests/google-en-segundos.spec.ts`
(7) **inyecta un client id de prueba con un accessor definido antes de que corra el bundle**
en vez de saltarse las pruebas: una prueba que se salta no protege nada, y alguien podía
borrar `googleCtaHTML()` del checkout con la suite en verde.

## El modo cocina se rehizo contra un celular de gama baja (2026-09-12)

El dueño opera con un **celular aparte, de gama baja, dedicado a la tienda abierta**. Todo lo
que sigue salió de **renderizar la pantalla real a 360×640** (viewport CSS típico de gama
baja), no de suponer. `docs/AUDITORIA_PANEL_ADMIN.md` tiene la medición completa.

- **Un pedido medía 1 239 px en una ventana útil de 429**, y la barra fija cortaba la receta
  a media palabra —en "Proteína:" del 30CM— con un corte tan limpio que parecía el borde de
  la tarjeta. Ahora la receta **entra entera sin scroll**: se fundieron las dos barras
  superiores en una (el rótulo "Modo // cocina" se comía 44 px para decir algo que el dueño
  ya sabe), el nombre del cliente bajó a "Para entregar" —sirve para despachar, no para
  armar— y hay un degradado que avisa que hay más abajo.
- **El degradado va DENTRO de la barra fija**, anclado con `translateY(-100%)`, no a una
  distancia fija del fondo: la barra cambia de alto según el pedido (un pago sin confirmar
  le agrega una línea), así que cualquier número escrito a mano se desalinea en la mitad de
  los casos.
- **Wake Lock mientras el modo cocina está abierto.** Sin él la pantalla se apaga sola en
  30 s–1 min y cada aviso obliga a desbloquear con las manos grasosas. Tres cosas: todo en
  `try/catch` (la API no existe en todos los navegadores), **se vuelve a pedir en
  `visibilitychange`** —el sistema lo suelta al cambiar de app y no lo devuelve solo, así que
  sin eso funciona una vez y después no, que es peor que no tenerlo— y **se suelta al salir**,
  porque dejar la pantalla encendida toda la noche quema la batería del celular dedicado.
- **Cuatro accesos de servicio en el home, solo con la tienda ABIERTA** (`storeStatus()`, sin
  interruptor nuevo: un modo que hay que acordarse de apagar se queda prendido). Cocina,
  Pagos, Inventario y Salud — las únicas decisiones que se toman con pedidos entrando. El
  botón de Pagos **baja a la cola del mismo home** en vez de abrir otra pantalla: dos listas
  del mismo dato terminan contradiciéndose.
- **Con la tienda abierta y pedidos en cola, el panel abre DIRECTO en modo cocina.** El home
  mide 4 600 px con 53 controles; atravesarlo para llegar a cocinar era el camino de todos
  los días. `← Salir` sigue a un toque.

### ⚠ La receta no puede callar un ingrediente retirado

`fn()` devuelve **cadena vacía** cuando no encuentra un id, así que la comanda mostraba
**«Pan:»** seguido de nada — y si el Signature entero faltaba en `SIGS`, `itemRecipeLines`
devolvía `[]` y el bloque desaparecía: **un pedido que se ve SIN receta**. No es hipotético:
este repo ya retiró P07, T07, T08, D09 y SIG07/SIG08, y un pedido programado o el historial
cae justo ahí. Ahora dice el id y «ya no está en la carta». En la pantalla que dice qué
cocinar, un dato que falta se dice; no se borra.

### Medir un DOM con animación de entrada da tamaños encogidos

`tests/modo-cocina-gama-baja.spec.ts` fija todo lo anterior, y su primera versión reportó un
defecto falso: el enlace de Maps medía **43.34 px** con `min-height:44px` puesto. La causa era
medir a mitad de la animación `.fi` — al terminar mide 44 exactos. **Cualquier prueba que
mida geometría tiene que esperar a que la animación asiente**, o reporta defectos que no
existen y, peor, deja de distinguir el día que sí existan.

## El bono del invitado prometió ocho días una bebida que no podía pagar (2026-09-13)

`REFERRAL_BONUS_POINTS` **es** "una bebida gratis": esa fue la decisión del dueño el
2026-08-20, y 120 era su implementación porque entonces R05 costaba 120. El 2026-09-05 la
recalibración de puntos subió **R05 de 120 a 160** y el literal se quedó donde estaba.

Desde entonces la app le prometía al invitado una bebida **en SEIS sitios** —la invitación que
aparece al entregar el pedido (`refInviteHTML`, el momento de mayor intención), la tarjeta del
perfil, el mensaje que se comparte por WhatsApp, y los tres textos de marketing que el dueño
copia a Instagram— con un bono que no alcanzaba a pagarla.

⚠ **Y el sexto solo apareció cuando falló una prueba**: `tests/palancas-del-modelo.spec.ts`
afirmaba `120 pts` sobre la invitación del pedido entregado, así que una búsqueda de la
constante no bastaba — había que correr la suite. Esa prueba ahora exige además que los dos
**productos** estén nombrados («sándwich 15CM GRATIS», «una bebida de la casa»), no solo los
dígitos: comprobar el número es justo lo que dejó pasar el defecto ocho días. Y no era solo un número corto: **120 caía
en tierra de nadie**, por encima de la salsa extra (20) y por debajo de todo lo demás (160),
o sea que el invitado **no podía canjear NADA** de lo que se le dijo. Justo el lado del
referido que tiene que decidir comprar sin haber pedido nunca, y justo la palanca de la que
cuelga el mes 3.

**Subirlo a 160 no cuesta más**: el premio siempre fue la misma bebida (~S/2.34 de insumo);
lo que cambió fue su etiqueta de precio en puntos. No contradice la evidencia de
Wolters/Schulze/Gedenk sobre no subir el bono — no sube el premio, restaura el que ya estaba
decidido.

**Lo que más duele es que el defecto estaba escrito.** El comentario de
`REFERRER_REWARD_POINTS` lo describe palabra por palabra para el OTRO lado del referido
(«si alguien mueve uno de los dos números y no el otro, la app promete un sándwich que la
recompensa ya no alcanza a pagar») y ese sí tenía su comprobación en `npm run parity` desde
que R06 bajó de 720 a 400. Este no. Lo encontró una revisión a mano, no el CI.

**Son DOS huecos distintos y hacen falta las dos defensas:**

1. **El del código** — alguien recalibra `REWARDS` y olvida el bono. Lo cierra
   `npm run parity`, que ahora ata `REFERRAL_BONUS_POINTS` a R05 igual que ya ataba
   `REFERRER_REWARD_POINTS` a R06.
2. **El del panel** — **R05 se repricea desde `catalog_prices`** (categoría `reward`), que
   `loadCatalogPrices()` vuelca encima de `REWARDS` en runtime, y que el cliente recibe en
   `rewardPts` de `get-catalog`. Parity **no puede verlo**: compara la SEMILLA. Lo cierra
   `loQueGanaElInvitado()` (`catalog.ts` y `src/app/06-*`), que **DERIVA la frase en vez de
   afirmarla** — si el bono cubre R05 nombra la bebida, y si no se queda en los puntos, que es
   lo único que sigue siendo verdad. Mismo criterio exacto que `offpeakActiva()` usa para la
   hora valle retirada, y la frase **vuelve sola** si el bono vuelve a alcanzar: apagarla para
   siempre sería igual de malo, porque el premio concreto y nombrable es lo que hace funcionar
   la invitación.

**Regla que sale de esto, y es un paso más allá de la que ya estaba escrita en este archivo:**
interpolar la cifra no alcanza. Si un texto **nombra un producto** que el cliente va a poder
canjear o no según un número editable, ese nombre también tiene que derivarse.

### Y la ESCALERA tenía el mismo defecto, del mismo día — con un chequeo que lo dejaba pasar

El escalón de 3 amigos (`REFERRAL_MILESTONES`) pagaba **120 puntos** con la etiqueta «una
bebida de la casa gratis». Misma recalibración, mismo día, segunda víctima.

Lo interesante es por qué `npm run parity` no lo vio teniéndolo delante: su chequeo exigía que
los puntos de cada escalón fueran **múltiplo de ALGUNA recompensa**, y `120 % 20 === 0`, así
que el escalón se validaba como «seis salsas extra» mientras prometía una bebida.
**Verificaba la aritmética, no la promesa** — y la promesa es lo único que el cliente lee.

Ahora cada escalón declara `covers` (el código de la recompensa que su etiqueta nombra) y
`veces`, así que el chequeo no adivina a qué se refiere el texto: el texto lo dice. Y
`etiquetaDeEscalon()` (servidor y cliente) deja de nombrar el premio si el panel lo repricea
por encima del escalón — incluido el push de «te llevas N puntos extra: …», que es donde el
cliente lo lee en el momento de mayor intención.

De paso quedó corregido un comentario que ya mentía: el de `WELCOME_BONUS_POINTS` decía que
R02 cuesta 40; cuesta 20 desde la misma recalibración.

### Y el lado de QUIEN INVITA, por simetría

`REFERRER_REWARD_POINTS` nunca estuvo roto —`npm run parity` lo ata a R06 desde que R06 bajó
de 720 a 400— pero esa comprobación cubre la SEMILLA, y R06 se repricea desde el panel igual
que R05. El push «Ya tienes 400 puntos: canjéalos por un 15CM gratis» y la tarjeta del perfil
pasan por `loQueGanaQuienInvita()`. Arreglar un solo lado de un defecto simétrico deja el otro
esperando su turno.

### Un tercer caso, en una prueba que creía cubrir más de lo que cubría

`tests-api/carrito.test.ts` tiene una prueba titulada «R05 cubre entera la bebida más cara que
hoy existe» — y ejercía `D06` **escrito a mano**. Una bebida nueva más cara entraba al catálogo
y la prueba seguía en verde midiendo otra cosa, justo la que dice proteger. Ahora la bebida más
cara **se deriva de `SIDE_PRICE`**. Verificado subiendo D08 a S/8: falla nombrando la bebida y
el monto.

Sigue cubriendo solo la SEMILLA. El precio de las bebidas también es editable desde el panel
(`catalog_prices`, categoría `side`), así que subir una bebida por encima de `R05_FLAT_WAIVER`
deja «BEBIDA // GRATIS» cubriendo una parte. Lo que salva hoy ese caso es que la pantalla de
canje muestra el ahorro REAL al seleccionarla («· ahorras S/6»), no el rótulo — o sea que el
número que el cliente ve es cierto aunque el titular se quede grande. Cambiar el titular es
decisión del dueño, no un defecto que se pueda corregir solo.

Probado en `tests-api/bono-del-invitado.test.ts` (8), verificado inyectando los cuatro
defectos: devolver el bono a 120 (falla nombrando que solo alcanzaba para R02), volver a
escribir «una bebida de regalo» a mano en el texto público, devolver el escalón a 120, y
quitarle `covers`/`veces` a la escalera.

---

## 2026-09-17 · La noche en que se fue la app anterior

El dueño lo dijo tres veces, y cada vez más claro: **«no reeskinees»**. Esta sesión empezó
creyendo que el front ya estaba rehecho y terminó encontrando que gran parte seguía siendo
la app de antes con pintura nueva.

### El verde que asomaba debajo de todo

La paleta nueva existía desde el 2026-09-09 y estaba bien hecha: tokens en `:root`, ~997
llamadas a `var(--sw-*)`. Pero el verde anterior seguía escrito **878 veces**. Treinta y
siete eran valores REALES —`html,body` y `#app` tenían `background:#1E3932` a pelo, así que
el verde asomaba debajo de cada pantalla; el `theme-color` del manifiesto seguía pintando de
verde la barra del navegador en Android; y el modal del mapa, el que el cliente usa para
marcar su puerta en el checkout, estaba entero en la paleta vieja— y las otras 841 eran el
respaldo dentro de `var(--sw-x,#viejo)`.

Ese respaldo parecía inofensivo y no lo es: significa que el día que un token no cargue, la
app no se degrada a un gris neutro, **reaparece la app anterior**.

Ninguno de los chequeos lo veía. `check:colores` perseguía colores de ESTADO (el rojo de
error, el verde de confirmación) y solo miraba `src/app/` — nunca `src/shell.html`, que es
donde estaban los dos peores casos. Ahora persigue también la paleta anterior, en los dos
archivos, y **también dentro de los respaldos**. El hex dentro de un comentario sí se
permite: media docena de comentarios cuentan justamente por qué esa paleta se fue, y borrar
ese relato para pasar un chequeo sería cambiar historia por verde.

### Los cinco pasos que eran la misma fila

El armador ya tenía el riel de pasos del concepto 6, pero **dentro de cada paso estaba la
lista de siempre**: rectángulo redondeado, título, párrafo, precio a la derecha, cinco veces
seguidas. El riel era nuevo; lo que el cliente toca, no.

La corrección no fue pintar distinto: fue darle a cada paso la forma que su contenido pide.

- **Pan** son dos opciones y la decisión es una comparación, no un recorrido. Una lista
  obliga a leer una, bajar, leer la otra y recordar la primera. Dos paneles lado a lado.
- **Proteína** es la única decisión del armador con fotografía propia, y esa foto era una
  miniatura de 56 px al costado de un párrafo: el tamaño de un ícono para lo único que el
  cliente de verdad quiere ver. Ahora la foto ES la tarjeta.
- **Queso** ganó «Sin queso» como opción explícita. Antes la única forma de decir «ninguno»
  era no tocar nada, que se ve igual que saltarse el paso por error.
- **Vegetales** son gratis, ilimitados y de nombre obvio: no hay nada que vender con un
  párrafo. Y traían un defecto real —cada descripción se imprimía DOS veces—. Fichas, con
  «poner todos» de un golpe: de 1084 px a 912.
- **Salsas** muestran el tope de 3 como tres espacios que se llenan. Antes era un «0 // 3»
  que nadie mira hasta que la cuarta carta deja de responder al toque — y una carta que no
  responde parece rota, no llena. De 1482 px a 1140.

Cuando los cinco pasos dejaron de usarla, `CARD()` quedó sin una sola llamada. Se borró:
dejar la plantilla del patrón viejo esperando en el archivo es la forma más fácil de que
vuelva.

### El riel mentía desde hacía doce días

Al recapturar el armador apareció algo que no era de diseño: el riel encendía **TOPPINGS**
mientras la pantalla decía **Queso**, y **QUESO** mientras decía **Vegetales** — con el valor
del otro paso al lado.

El 2026-09-05 se intercambió el CONTENIDO de los pasos 2 y 3 para seguir el orden del
mostrador de Subway. Se cambió el `if` que decide qué se pinta y no se tocaron
`BYO_STEP_LABELS` ni `byoValor`. No rompía nada: mentía.

`tests/armador-riel.spec.ts` no afirma contra una lista escrita en el test —eso sería copiar
el mismo error— sino que **compara las dos fuentes entre sí**: el rótulo que el riel enciende
contra el título que de verdad se pintó. Los dos defectos se reinyectaron y cada uno lo caza
su prueba.

### 19 píxeles debajo de una barra opaca

`#app` reservaba 49 px al pie porque esa era la altura de la barra de navegación el día que
alguien la midió. Pero no hay UNA barra: el armador pone una de 68 px, el panel otra, la de
«hay versión nueva» otra más. En el armador quedaban 19 px de contenido debajo de una barra
opaca — justo el último renglón de la última tarjeta.

Ahora cada barra se declara `sw-barra` y `medirBarraFija()` mide la más alta que haya en
pantalla después de pintar. Sin barra, el hueco es 0, que es lo correcto.

### Las fotos y su procedencia

Las seis fotos de proteína eran stock suelto que nunca pasó por `tratar_fotos.py` —el script
existe justo para que un set de fotos ajenas no se lea como los resultados de una búsqueda de
imágenes— y tres mostraban cosas que no están en ninguna receta: un mantel a cuadros azul,
tomates cherry, un cuenco de aceitunas.

Las nuevas se licenciaron gratis en Adobe Stock, se recortaron al sujeto y salen del mismo
tratamiento que los Signatures. La del pavo llevó un paso más: la única foto honesta de
lonjas horneadas venía sobre blanco de estudio, y junto a las otras cinco rompía el set
entero — que es exactamente lo que el script existe para evitar. El fondo se reemplazó por el
oscuro de la marca con una sombra de contacto, enmascarando el blanco **conectado al borde**
para que los brillos DENTRO de la lonja no se volvieran transparentes.

Y algo que faltaba desde siempre: **`img/fuente/FUENTES.md`**. Hasta esta noche no había
forma de saber de dónde venía ninguna foto del repo.

### Lo que el panel nunca tuvo

El panel tiene 35 pantallas registradas y nueve pruebas, cada una sobre una herramienta
concreta. Nadie comprobaba que el RESTO siquiera abriera — y el panel es lo que el dueño usa
con el local lleno. `panel-todas-las-herramientas.spec.ts` las abre una por una. La lista
sale de `adminToolsSections()`, no del test: una herramienta nueva entra sola.

### Cuatro números escritos a mano, otra vez

El perfil prometía «Haz 3 pedidos pagados este mes y gana 50 puntos extra» y «Prueba 3
Signatures distintos... gana 50 puntos extra». Los cuatro números viven en el servidor
(`CHALLENGE_TARGET_ORDERS`, `CHALLENGE_BONUS_POINTS`, `DISCOVERY_TARGET_FLAVORS`,
`DISCOVERY_BONUS_POINTS`) y ninguno estaba en `parity`. Si el dueño sube el reto a 4 pedidos,
el servidor rechaza el reclamo y la pantalla sigue prometiendo 3: el cliente cree que la app
le falló. Es el mismo defecto que este repo ya documentó en grande; ahora se interpolan y
`parity` compara los cuatro.
