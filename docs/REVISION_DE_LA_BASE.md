# Revisión de la base del código (2026-09-24)

El dueño preguntó: «¿por qué no viste ese error? ¿La base está bien hecha, se puede hacer
mejor?», y pidió explícitamente no quedarse en buscar texto. Esta revisión mira **cómo está
construida** cada capa, qué defectos reales ya produjo ese diseño y cómo debería ser. Los
números son medidos; ninguno es estimado.

---

## 1 · Por qué no vi el error

Confié en tres señales que **no miden lo que parecen medir**:

1. **«El compilador pasa».** TypeScript está en modo permisivo (`strict: false`), no hay un
   solo tipo que diga qué es un pedido, un cliente o una dirección, y buena parte del código
   vive dentro de textos que el compilador no lee. Pasar el compilador casi no prueba nada.
2. **«Las pruebas pasan».** Las 307 pruebas del navegador reemplazan el servidor por
   respuestas escritas a mano (131 inventadas). Prueban que *dada una respuesta inventada* la
   pantalla muestra cierto texto. Si la respuesta inventada no se parece a la real —ids de
   texto donde la base manda números—, pasan igual.
3. **«Los chequeos pasan».** Son 16 scripts (2 559 líneas) que buscan patrones de texto en el
   código. Cada uno ve solo su patrón, y ellos mismos fallan: `check:cliente` estuvo tapado
   meses por dos expresiones `/"/g` que se anulaban entre sí.

Y el error de fondo, que es mío: **copié el patrón que había en vez de cuestionarlo.** La
respuesta del repo a cada defecto ha sido agregar un vigilante más, nunca hacer que el
defecto sea imposible. Esta misma semana yo agregué dos. Los vigilantes son el síntoma.

---

## 2 · La base, capa por capa

### 2.1 Cómo se pinta la app

**Hoy.** Cada pantalla es una función que arma un texto HTML enorme (hay una línea de 4 422
caracteres) con ~2 000 estilos escritos dentro, y los botones llaman funciones **por su nombre
escrito en el texto** (`onclick="pedirFijoAhora('12')"`). En cada cambio, `render()` **borra la
pantalla entera y la vuelve a escribir**.

**Lo que ya causó:**
- **Lo que el cliente escribió se borra al repintar.** Hay 16 llamadas manuales a
  `syncConfirmFields()` para rescatarlo; el comentario cuenta que el camino más común borraba
  nombre, correo y dirección ya tipeados.
- **Un nombre o un id escrito como texto no lo revisa nadie.** «Recuperar mi PIN» apuntaba a
  una función del panel; elegir dirección comparaba `12 === '12'`; hoy mismo, **el panel no
  deja responder reclamos** por lo mismo (ver §3); el mapa escribe «Buscando...» en un
  elemento `maddr` que ya no existe.
- **Todo vive en el espacio global, compartido con los scripts de terceros.** El 2026-08-21
  Culqi pisó dos funciones nuestras (`sc` y `go`) el mismo día. La solución fue un «blindaje»
  que fotografía ~305 funciones y las repone **en cada repintado**. Es un parche contra un
  problema que solo existe porque todo es global.
- **El escapado es manual.** Cada dato del cliente pasa por `esc()` a mano; el día que alguien
  lo olvida, un nombre con `<` rompe la pantalla o inyecta HTML.
- **El color `GOLD` se reasigna en cada repintado** para teñir el panel: una constante que no
  es constante.

**Cómo debería ser.** Código en **módulos** (cada archivo importa lo que usa; nada global que
un tercero pueda pisar) y una capa de pintado que haga tres cosas por construcción:
- **ata cada botón a la función real** (`@click=${() => pedirFijo(r.id)}`): si la función
  cambia de nombre, no compila, y el id sigue siendo un número;
- **actualiza solo lo que cambió**, sin borrar lo que el cliente está escribiendo;
- **escapa por defecto.**

Eso es exactamente lo que hace **lit-html** (≈3 KB, verificado disponible: 3.3.3). Se escribe
casi igual que el HTML de hoy, así que el HTML y el CSS de las maquetas se reusan tal cual.
Los estilos van a clases, como ya hacen las pantallas nuevas (`.mgr`, `.mfj`, `.msec`).

**El momento es este:** la capa de pantallas del cliente se está reescribiendo desde cero
para que calce con las maquetas (tarea #56). Reescribirla sobre la base correcta cuesta casi
lo mismo que reescribirla sobre la vieja.

### 2.2 El estado

**Hoy.** 475 variables globales; cualquier función cambia cualquiera. Otras 18 cosas viajan
entre pantallas colgadas de `window._…`.

**Lo que ya causó.** El origen del carrito (`pendingGroupCode`, `pendingRecurringId`) se
limpia a mano en tres sitios distintos (vaciar carrito, pedido hecho, cerrar sesión); el día
que se agrega un dato nuevo y se olvida uno de los tres, se arrastra al pedido siguiente. El
comentario de `clearCart` ya registra una vez que pasó.

**Cómo debería ser.** Estado agrupado por lo que representa y con tipo: la sesión, el pedido
en curso (ítems + de dónde salió + dirección + hora), la pantalla. Vaciar el pedido es
reemplazar **un** objeto: no hay campo que olvidar.

### 2.3 Los datos no tienen forma

**Hoy.** No existe un tipo `Pedido`, `Cliente` ni `Direccion`, ni en el cliente ni en el
servidor. Las 165 acciones del servidor reciben el cuerpo como `any` y las lecturas de la base
devuelven `any`. Si se enciende el modo estricto, el compilador marca **1 133 errores**, y 835
son el mismo: «uso una propiedad de algo que no sé qué es».

**Lo que ya causó.** Los ids que cambian de tipo; la consulta a una columna que no existe
(`scheduled_for`) cuyo error se tragaba un `catch` y dejó el tope por hora sin aplicarse desde
el día uno; puntos con decimales contra una columna entera, que reventaba **después** del
cobro.

**Cómo debería ser.**
- Los tipos de la base **generados** desde el esquema real (Supabase los genera tabla por
  tabla), no escritos a mano.
- Un archivo `compartido/` con el dominio (`Pedido`, `ItemCarrito`, `Direccion`…) y el
  **contrato de la API**: cada acción declara qué recibe y qué devuelve. El cliente llama
  `api('recurring-skip', …)` con ese contrato; un nombre de acción o un campo mal escrito
  deja de compilar, en los dos lados.
- El servidor valida la entrada contra ese mismo contrato en vez de un `any`.

### 2.4 El dinero se calcula dos veces

**Hoy.** El motor de precios completo existe **dos veces**: en el cliente (`itemUnitPrice`,
`cartComboCount`, `rewardWaiverAmount`, `cartFinalTotal`…) y en el servidor (`priceCartItem`,
`rewardWaiver`, `deriveCart`). Los precios, además, están escritos en **tres** lugares: la
tabla `catalog_prices` (la real), el servidor y el cliente. `parity` compara 117 constantes
leyendo los dos lados como texto; **la lógica no la compara nadie**.

**Lo que ya causó.** El sándwich gratis del organizador: el cliente descontaba dos cosas y el
servidor una, y el pago se rechazaba por «el total no coincide» (lo registra el comentario de
`deriveCart`). Las tres semanas de precios fantasma de agosto (CLAUDE.md) son la misma
enfermedad: más de una fuente de verdad.

**Cómo debería ser.** **Una sola implementación**, en un módulo compartido que importan el
cliente y el servidor. Mismo código y mismos precios (los de la tabla, que ya llegan por
`get-catalog`) dan el mismo total por construcción. `parity` y la copia del cliente
desaparecen.

### 2.5 Operaciones de varios pasos sin transacción

**Hoy.** Crear un pedido son unas **cinco escrituras separadas**: reservar inventario, insertar
el pedido, actualizar al cliente, anotar los movimientos de puntos (hasta cuatro) y el libro
de crédito. Cada una es su propia llamada. Si algo falla a la mitad, el código intenta
deshacer «en lo posible»: `restockBestEffort` aparece 9 veces, `releasePromoBestEffort` 6, la
bandera `orderInserted` 11. El reparto del grupal que escribí esta semana hace lo mismo con N
pedidos.

**El riesgo.** Si la función se corta entre dos pasos (tiempo agotado, red), queda stock
reservado sin pedido, o un pedido cobrado sin sus puntos, **sin ningún error visible**.

**Cómo debería ser.** Eso es lo que resuelve una transacción de Postgres: una función
`crear_pedido(…)` en la base que hace todo o no hace nada. El repo ya usa 31 funciones así;
justo la más importante no lo es.

### 2.6 La base de datos

- `orders.delivery_time` es **texto**, y se compara como texto: funciona solo mientras todos
  escriban la fecha exactamente en el mismo formato.
- `orders` conserva **cuatro columnas de la app anterior** que nadie escribe (`mode`,
  `product_key`, `size`, `build`).
- Los ids son de tres clases: número en 16 tablas, uuid en otras, y uuid-guardado-como-texto
  en `orders`.
- `items` es JSON sin forma declarada.

**Por qué ahora.** Todo lo que hay en la base es data de prueba. Arreglar el esquema **antes de
abrir** es casi gratis; después hay que migrar pedidos reales.

### 2.7 Las pruebas

| capa | cuántas | qué prueban de verdad |
|---|---|---|
| navegador | 307 | que con una respuesta inventada aparece un texto. 525 búsquedas por texto visible, 281 por CSS/onclick internos, **0** por una marca estable. 22 fallan siempre |
| servidor | 427 | funciones puras de cálculo — **son buenas**, 6 segundos |
| contra una base real | 1 | casi nada toca Postgres: los nombres de columna, las transacciones y las restricciones no los prueba nadie |
| chequeos de texto | 16 scripts | parches para lo que el compilador no ve |

**Cómo debería ser**, de abajo arriba:
1. **El compilador** atrapa nombres, tipos y formas: gratis y en cada guardado.
2. **Pruebas de lógica pura** del servidor: se quedan como están.
3. **Pruebas de integración contra un Postgres real con las migraciones.** La infraestructura
   ya existe: `check:backup` levanta su propio Postgres. Ahí se prueban las acciones de
   verdad, con columnas, transacciones y restricciones reales.
4. **Pocas pruebas de navegador de punta a punta** para los flujos críticos (pedir y pagar,
   grupal, fijo, reclamo), corriendo **el servidor real** contra ese Postgres en vez de
   respuestas inventadas, y buscando botones por su rol o una marca estable, no por el texto.
5. **Se retiran** los chequeos que el compilador reemplaza, y las 22 rojas se arreglan o se
   borran: una suite con rojos permanentes enseña a ignorar el rojo.

Menos pruebas, y más fuertes.

### 2.8 El armado de la app

**Hoy.** `tsc` compila cada archivo suelto, se concatenan por orden alfabético, se quitan los
`"use strict"` sobrantes, y el panel se descarga con un cargador hecho a mano. `check:bundle` y
`check:cliente` cuidan que eso no se rompa.

**Cómo debería ser.** **esbuild** (verificado disponible: 0.28.2): módulos con `import`, el panel
como `import()` diferido, compila en milisegundos. Desaparecen la concatenación, el orden
alfabético, el cargador manual, el blindaje global, `check:bundle` y `check:cliente`.

---

## 3 · Defectos vivos que salieron de esta revisión

| defecto | efecto | gravedad |
|---|---|---|
| **Responder un reclamo**: `cmplRespondingId='5'` contra `c.id === 5` | la caja para responder no se abre nunca. Es el Libro de Reclamaciones, que por ley hay que responder | **alta** |
| **Carga del catálogo**: 99 líneas en un `try` con `catch(e){}` vacío | un error de código se trata igual que un corte de red: la app se queda con los precios semilla, callada, y el servidor rechaza el pago | **alta** |
| **Carga del horario y la capacidad**: 38 líneas, mismo `catch` vacío | el cliente vería horas libres que el servidor rechaza | media |
| `maddr` renombrado a `maddr-input` | «Buscando...» no aparece al mover el pin | baja |

---

## 4 · Lo que está bien y se conserva

- **El servidor es la autoridad del dinero**: recalcula todo y nunca confía en el total del
  cliente.
- **La lógica pura extraída y probada** (`franja.ts`, `repartirGrupo`, `cancellationDeltas`).
- **Calcular en vez de guardar** estados que alguien tiene que acordarse de revertir.
- Migraciones versionadas, respaldo diario **que se restaura**, prueba de humo tras cada deploy.
- Los guardas atómicos por estado en la base.
- Las decisiones escritas con su porqué.

---

## 5 · Plan propuesto (reemplaza los pasos 1–4)

**Sin reescribir todo de golpe.** La base nueva convive con la vieja: un segundo paquete en
módulos (esbuild + TypeScript estricto + lit-html) que se sirve junto al actual. El router
entrega a la base nueva cada pantalla que se migra; la vieja sigue funcionando mientras
tanto. Un archivo puente declara, con tipo, las pocas variables viejas que la nueva necesita
leer.

| # | qué | días | antes de abrir |
|---|---|---|---|
| 0 | Arreglar los defectos vivos de §3 | ½ | sí |
| 1 | Base nueva: esbuild, módulos, TS estricto, lit-html, puente con la vieja | 1½ | sí |
| 2 | Tipos generados de la base + dominio + contrato de la API (cliente y servidor) | 1½ | sí |
| 3 | Dinero en un solo módulo compartido; se borra la copia del cliente y `parity` | 1 | sí |
| 4 | `crear_pedido` transaccional en Postgres | 1 | sí |
| 5 | Pruebas: integración contra Postgres, 4 flujos de punta a punta con el servidor real, las 22 rojas resueltas, chequeos de texto retirados | 1½ | sí |
| 6 | Esquema: `delivery_time` a fecha real, columnas muertas fuera, ids | ½ | sí: con data de prueba es gratis |
| 7 | Las pantallas que faltan (33, 34…) se construyen directo sobre la base nueva | — | sí |
| 8 | Las pantallas viejas migran a medida que se tocan | — | después |

**Unos 7 días antes de volver a las pantallas.** Con la apertura a más tardar la segunda semana
de octubre, es ajustado pero cabe; y cada pantalla que se construya después cuesta menos,
porque ya no arrastra la clase de errores de esta semana.
