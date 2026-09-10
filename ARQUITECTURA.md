# SND//WCH — Revisión de arquitectura

**2026-09-10.** Pedida por el dueño: *"revisa cómo estructurar mejor el código en general
y cómo se puede hacer mejor para expandirse"*. Todo lo que sigue está **medido**, no
estimado — cada número se puede volver a sacar con el comando que lo acompaña.

Antes que nada, lo que **NO** hay que hacer: **reescribir esto en React o similar.** La app
funciona, tiene 44 specs de navegador y 25 archivos de prueba de backend, y sobre todo
acumula decenas de defensas contra defectos que ya ocurrieron de verdad — el `sndScreen`
que un script de Culqi pisaba, la reversión de puntos al cancelar, el tope por hora. Una
reescritura tira esa corrección acumulada y la vuelve a aprender a golpes, en producción.
Lo que sigue son cambios **incrementales**, cada uno con su propio valor.

---

## El resumen, en una tabla

| # | Qué | Medida | Qué desbloquea |
|---|---|---|---|
| 1 | El admin viaja en el bundle del cliente | **39% del código**, 251 KB comprimidos | Conversión — la palanca nº1 del negocio |
| 2 | Cálculo de dinero atrapado en funciones que tocan la base | orders.ts: **3,145 líneas, 21 accesos a BD** | Poder probar lo que cobra |
| 3 | La interfaz es HTML dentro de strings | **1,859** `style=` en línea | Que un cambio de diseño no sea 997 ediciones |
| 4 | ~230 colores semánticos sin token | `#ff8888` × 79 | Contraste, accesibilidad, temas |
| 5 | 213 variables globales, sin módulos | 148 solo en `01-*` | Que una función nueva no pise a otra |
| 6 | `parity` compara constantes, no funciones | 40 comprobaciones, **0 de lógica** | Que el cliente y el servidor no diverjan |
| 7 | El repositorio es **público** | 2,134 líneas de análisis de márgenes | Decisión del dueño |

---

## 1 · El admin viaja en el bolsillo de cada cliente

```
src/app/08-* + 09-*  →  323 KB de 819 KB de código  →  39%
index.html servido   →  914 KB  (251 KB comprimidos)
```

Las dos partes de admin son **34 pantallas** que solo abre el dueño: dashboard, inventario,
recetas, cierre de caja, cohortes, campañas. **Todas se descargan en el celular de todo
cliente que abre la carta**, aunque nunca pueda entrar.

**Por qué importa más de lo que parece.** El modelo del negocio (`PREDICCION_V12.md`) dice
que el CAC es `CPM / (1000 × CTR × CVR) × 1.18`, y que **la conversión es la única de las
tres variables que el negocio controla** — las otras dos las fija la subasta de Meta.
Duplicar la conversión baja el CAC de S/17.87 a S/8.94, que es justo el umbral donde la
meta del mes 6 deja de ser imposible. Un bundle que pesa el doble de lo necesario en una
conexión móvil de Trujillo es fricción en el punto exacto donde se pierde al cliente.

**Cómo se arregla sin romper nada.** El bundle ya se concatena por orden alfabético
(`scripts/build.mjs`), así que las partes 08 y 09 son las últimas. Se emiten como un
segundo archivo que se carga bajo demanda cuando `isAdmin` es cierto — el mismo patrón que
`loadTesseract()` ya usa para los 3 MB del lector de comprobantes, que ningún cliente
descarga.

### Estado: el router ya está separado (2026-09-10)

`render()` y `renderScreen()` salieron del archivo del panel a su propia parte,
`08-router.ts` (11 KB), y las dos partes del panel se renumeraron a 09 y 10. Los **34 `case`
de pantallas admin** que el router tenía escritos pasaron a un registro: el panel se anuncia
en `ADMIN_SCREENS` al cargarse y el router solo pregunta.

Eso desata las dos mitades, que era el bloqueo real. Lo que falta para cobrar el beneficio:

1. Que `build.mjs` emita las partes 09-10 como un **segundo archivo**, cargado bajo demanda
   cuando `isAdmin` — el mismo patrón que `loadTesseract()` ya usa para los 3 MB del lector
   de comprobantes, que ningún cliente descarga.
2. Que `sw.js` y `check:shell` sepan de ese segundo archivo: hoy el sello `APP_BUILD` es el
   hash de UN bundle.

Dos defensas quedan puestas para que el acoplamiento no vuelva, porque volvería con una
línea distraída y sin romper nada: `check:bundle` falla si el router vuelve a nombrar una
pantalla de admin, y `tests/registro-del-panel.spec.ts` comprueba que el mecanismo funciona
—incluido el caso del panel sin cargar, que es el estado en que va a estar el 100% de los
clientes en cuanto se parta el archivo.

---

## 2 · Lo que cobra dinero está donde no se puede probar

```
supabase/functions/api/actions/orders.ts   3,145 líneas — 21 accesos a la base
supabase/functions/api/actions/admin.ts    3,206 líneas
                                           = 45% de todo el backend
```

Veintiún accesos a la base en tres mil líneas significa que **la enorme mayoría de ese
archivo es cálculo puro atrapado dentro de funciones que tocan la base**, y por lo tanto no
se puede probar sin una base.

El repo ya sabe cuál es la salida y la aplicó cinco veces: extraer el cálculo y probarlo
aparte. Así nacieron `cancellationDeltas`, `deriveCart`, `batchExpiryStatus`,
`prepShortfall`, `orderMargin`. Los 25 archivos de `tests-api/` existen porque
**dos defectos reales llegaron a producción con todo en verde** — `pointsFor` devolviendo
decimales contra una columna `integer` (reventaba DESPUÉS del cobro de Culqi) y
`assertHourCapacity` consultando una columna inexistente cuyo error se tragaba un catch.

**Lo que falta es terminar el trabajo, no inventar nada nuevo.** Cada función que decide un
monto y todavía vive pegada a un `await db(...)` es un `pointsFor` esperando su turno.

---

## 3 · La interfaz es HTML dentro de comillas

```
130 KB de literales HTML dentro de strings   (16% del código cliente)
1,859  style="..."  en línea
  192  onclick="..." en línea
```

Esto tiene cuatro consecuencias concretas, y **ya se pagaron las cuatro en esta sesión**:

1. **No hay reutilización.** Al abrir el segundo punto de compra de bebidas hubo que
   extraer `drinkRowHTML` a mano; si no, habrían quedado dos plantillas del mismo ítem y
   una se habría quedado con el precio viejo.
2. **Un cambio de diseño es N ediciones.** El caso extremo: `var(--sw-card,#2D5246)` estaba
   escrito **997 veces** y ninguna `:root` lo definía. Ya está arreglado, pero fue el
   síntoma, no la enfermedad.
3. **El escape es manual.** `esc()` a mano en cada interpolación. Una que se olvide es un
   XSS; nada avisa.
4. **El tipado no llega al markup.** `tsc` no ve dentro de un string.

**Lo que NO propongo:** cambiar de tecnología. **Lo que sí:** una capa fina de constructores
— `CARD()`, `ROW()`, `BTN()`, `FIELD()` — que devuelvan el mismo string pero desde un solo
sitio. `CARD()` y `CUT()` ya existen y funcionan; es seguir por ahí, pantalla por pantalla,
sin big-bang.

---

## 4 · Los colores semánticos siguen sueltos

| color | veces | qué significa |
|---|---|---|
| `#ff8888` | 79 | error |
| `#25D366` | 60 | confirmación — **y es el verde de WhatsApp**, dos significados en un color |
| `#ffa500` `#ff5555` `#ffb366` | 47 | avisos |
| `#241a08` `#0d0d0d` | 41 | texto sobre dorado |

Las superficies ya son tokens; **el estado no**. Si mañana hay que subir el contraste del
rojo de error para cumplir WCAG, hay que acertarle a 79 sitios. Faltan `--sw-ok`,
`--sw-warn`, `--sw-danger` y un chequeo que falle si vuelve a colarse un hex suelto —
exactamente el patrón de `check:precios`, que ya atrapó 6 casos que se me habían escapado.

Lo mismo con `'EB Garamond',serif` escrito **362 veces**.

---

## 5 · 213 variables globales

```
01-catalogo-y-estado.ts : 148        05-carrito-y-checkout.ts :   8
09-admin-negocio.ts     :  28        06-cuenta-y-pedidos.ts   :  10
```

Son scripts globales a propósito (está documentado y `check:bundle` lo protege), pero el
costo es real: **toda función nueva compite por el mismo espacio de nombres.** Ya pasó —
`render()` tiene una red de seguridad porque un script de Culqi pisó `sndScreen`, y hay un
bloque entero de "BLINDAJE DE FUNCIONES GLOBALES" que repone funciones nuestras que un
bundle de terceros sobreescribió.

No hace falta módulos ES para mejorar esto: agrupar el estado en unos pocos objetos
(`sw.cart`, `sw.user`, `sw.ui`) reduce la superficie de choque sin tocar el mecanismo de
concatenación.

---

## 6 · `parity` compara constantes, no comportamiento

Las 40 comprobaciones de `scripts/parity.mjs` son todas de **valores**: precios, topes,
umbrales, zonas. Ninguna compara **funciones**.

Y hay al menos una que sí está duplicada de los dos lados: **`deliveryFee`**. Las
constantes que usa están vigiladas; la fórmula que las combina, no. Si un lado empieza a
redondear distinto, `parity` pasa en verde y el cliente muestra un monto mientras el
servidor cobra otro — que es literalmente el defecto que `parity` se escribió para evitar.

---

## 7 · El repositorio es público

Comprobado sirviendo `img/wicho_saluda.png` desde `raw.githubusercontent.com` sin
credenciales: **HTTP 200**.

No hay claves en el código (los secretos viven en Supabase y en GitHub Actions), así que no
es una emergencia. Pero sí es público, ahora mismo:

- `MENU_FINANCIAL_ANALYSIS.md` — **2,134 líneas** de costos por porción y márgenes reales
- `RECETARIO.md` — 854 líneas, el recetario completo de producción
- `PREDICCION_V12.md`, `MARKETING_PLAN.md` — la estrategia y los números del negocio

**Es una decisión del dueño, no un defecto.** Ponerlo privado no rompe el CI ni el deploy.
Lo que sí hay que saber: las imágenes que hoy sirven a Canva desde `raw.githubusercontent`
dejarían de ser alcanzables, y habría que subirlas por otra vía.

---

## El orden que propongo

**Primero lo que ya tiene su propio valor medible y no depende de nada:**

1. **Tokens semánticos + `check:colores`** — medio día, cero riesgo, y deja el terreno
   listo para todo lo visual que falta.
2. **Sacar el admin del bundle del cliente** — el único cambio de esta lista que mueve una
   métrica del negocio (conversión → CAC). Exige mover `render()` primero.
3. **Extraer el cálculo puro de `orders.ts`** — no se hace de una: cada vez que se toque una
   función que decide un monto, se extrae y se prueba. Es como llegaron a 25 los archivos
   de `tests-api/`.
4. **`parity` que compare funciones**, empezando por `deliveryFee`.

**Y en paralelo, sin bloquear nada:** seguir la capa de constructores de UI pantalla por
pantalla, aprovechando que el rediseño ya obliga a tocarlas.

---

*Cada número de este documento se puede volver a medir. Si alguno cambia, se actualiza acá:
un informe de arquitectura desactualizado es peor que ninguno, porque se le cree.*
