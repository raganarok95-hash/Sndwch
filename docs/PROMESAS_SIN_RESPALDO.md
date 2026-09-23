# Lo que las pantallas aprobadas prometen y el producto no tiene

Auditoría del 2026-09-23. Se leyó el **texto visible de las 30 pantallas aprobadas** (los
archivos de maqueta, no el resumen) y se cotejó cada afirmación contra las **150 acciones
registradas del servidor**, el catálogo real y `RECETARIO.md`.

**Por qué importa más que un error de diseño:** una pantalla es un contrato. El cliente no
sabe qué hay detrás — lo único que sabe es lo que la pantalla le dijo. Este repo ya retiró
dos badges (`MÁS PEDIDO`, `EDICIÓN LIMITADA`) por prometer lo que no podía sostener, y tiene
una regla escrita para las cifras en textos. **Esto es lo mismo, a escala de pantalla entera.**

**Ninguna de estas 20 se rompe sola.** No hay excepción, no hay test en rojo, no hay alerta:
la pantalla se pinta perfecta y el cliente descubre la diferencia el día que la usa. Es el
modo de fallo por silencio que ya obligó a construir la mitad de los chequeos del repo.

---

## A · Las cuatro graves: la pantalla describe OTRO producto

### A1 · ENTRAR — promete correo + código de 6 dígitos, y el login es teléfono + PIN

Tres pantallas aprobadas (`ENTRAR 1`, `ENTRAR 2`, `ENTRAR 3`) dicen textualmente:

> «Te mandamos un código de 6 dígitos · **LLEGA EN SEGUNDOS, NO HAY CONTRASEÑA**»
> «Tu correo» como único campo

Lo que existe es `actLogin(phone, pin)`: **teléfono y PIN**. No hay ninguna acción que mande
un código por correo, ni nada que lo verifique. El campo de correo de la maqueta no tiene
dónde aterrizar.

Lo que **sí** es cierto de esas pantallas: Google funciona, y «con Google no pedimos DNI» es
real y está autorizado por el dueño.

**Es la más grave de las veinte: es la primera pantalla de la app.** Si el resto está
perfecto y esta no, nadie entra.

### A2 · PLAN SEMANAL — promete cinco almuerzos; lo que se vende es crédito

La pantalla aprobada promete, en este orden: **cinco almuerzos 15CM**, una grilla LUN-VIE,
**«ENVIO DE LOS CINCO DIAS · INCLUIDO»**, **«Llega: de lunes a viernes, 12:30 – 1:00 p.m.»**,
**«Eliges: el sándwich de cada día, la noche antes»**, y un precio de **S/90.00**.

Lo que hace `prepare-weekly-plan` / `confirm-weekly-plan`: guarda `amount_paid` y
`credit_amount`. **Pagas S/95 y recibes S/100 de crédito.** Eso es todo.

No existen los días, ni el horario, ni el envío incluido, ni elegir el sándwich de cada
noche. Y el precio tampoco coincide: **S/95, no S/90**.

Son dos productos distintos con el mismo nombre. El de la pantalla es mucho mejor — y es el
que un cliente creería haber comprado.

### A3 · TARJETA DE REGALO — promete pagar S/50; en realidad cuesta 2 000 puntos

| la pantalla dice | el código hace |
|---|---|
| «Regalar · **S/50.00**», con chips de S/30 / S/50 / S/80 | cuesta **puntos**: `amount × GIFT_CARD_POINTS_PER_SOL` = **2 000 puntos** por S/50 |
| «Llega a +51 9•• ••• 412» — cualquier teléfono | el destinatario **tiene que tener cuenta ya**: si no, responde «No encontramos una cuenta con ese teléfono» |
| «Cuándo: Ahora mismo / **Programar**» | no existe programar: se acredita al instante |
| «**VENCE 18.12.2026**» · «NO VENCE ANTES DE 3 MESES» | el crédito **no vence**. La fecha es inventada |

Cuatro promesas, cuatro. Y la primera es la peor: un cliente que llega a esa pantalla con
S/50 en el bolsillo y sin puntos no puede comprar nada.

### A4 · TU PEDIDO FIJO — promete lo contrario de lo que el repo decidió a propósito

La pantalla dice: **«LO MANDAMOS SOLO, A LA HORA DE SIEMPRE.»**

El producto real dice, en dos sitios del cliente y con una prueba que lo protege:
**«Te avisamos una hora antes y lo confirmas en un toque — nunca te cobramos sin que
confirmes.»**

`docs/DECISIONES.md` explica por qué se eligió así: *«sacarle plata a alguien sin una decisión
fresca suya es la clase de sorpresa que cuesta el cliente entero»*. **La maqueta reintrodujo
justo la promesa que se había retirado.**

---

## B · Nombra productos que no existen

| # | dónde | dice | la verdad |
|---|---|---|---|
| B1 | Bebidas (3 pantallas) | «The Midnight — **CHICHA MORADA**» | D07 es **THE MIDNIGHT // Brew**: té negro en frío, 8-12 h |
| B2 | Bebidas | «**The Hibiscus** — EMOLIENTE FRÍO» | D06 es **THE BLOOM // Hibiscus**: flor de jamaica y canela. El emoliente es otra bebida |
| B3 | Bebidas | «**The Citrus** — LIMONADA · HIERBABUENA» | D08 es **THE COOL // Mint**: hierba luisa y menta. Ese nombre no existe |
| B4 | Tus pedidos, Pedido fijo | «The Original 15CM + **papas**» | **no vendemos acompañamientos de comida** (decisión del dueño, 2026-08-15) |
| B5 | Tus pedidos, Pedido fijo, Grupal | «**The Chicago** 30CM» | retirado del catálogo el 2026-08-22 |
| B6 | Menú secreto (ficha) | «**THE VAULT**» | el nombre se retiró el 2026-08-10; hoy vive en `secret_signature.name` |

Las tres bebidas son el caso más delicado: **son las únicas tres que hay**, están en tres
pantallas aprobadas, y **ninguna coincide con su receta real**.

---

## C · Promete una pantalla o una función que no existe

| # | la pantalla ofrece | estado real |
|---|---|---|
| C1 | Tu cuenta → «**Cómo pagas** · YAPE POR DEFECTO →» | no hay preferencia de pago guardada ni pantalla donde cambiarla |
| C2 | Tu cuenta → «**Avisos** · CUANDO SALE Y CUANDO LLEGA →» | solo hay `push-subscribe` / `push-unsubscribe`: todo o nada, sin elegir qué avisos |
| C3 | Ficha → «¿LO QUIERES A TU MANERA? **ARMA UNO PARECIDO** →» | no existe: nada precarga el armador desde un Signature |
| C4 | Tus pedidos → «**LOS JUEVES SON 9 DE LOS 14** — POR ALGO SERÁ» | nada calcula ni expone el día favorito del cliente |
| C5 | Menú secreto → «**Los que ya no vuelven**»: tres meses pasados con su receta | los datos **sí existen** (`secret_signature` guarda historial), pero solo los lee el panel admin. Falta exponerlos al cliente |

C5 es el barato de los cinco: la información ya está guardada.

---

## D · Cifras escritas a mano que no coinciden

| # | dónde | dice | real |
|---|---|---|---|
| D1 | 5 · PAGO | «Tarjeta **+5.5%**» | **+S/0.41**: el recargo engorda el envío, no el total |
| D2 | Menú secreto (ficha) | «**CAMBIA CADA SEMANA**» | cambia **cada mes** |
| D3 | Ficha The Teriyaki | S/21.90 / S/28.90 | **S/19.90 / S/25.90** |
| D4 | Estado vacío | The Original S/21.90 | **S/20.90** |
| D5 | Plan semanal | S/90.00 | **S/95.00** |

D1 ya está corregido en la pantalla 31; sigue mal en la 5.

---

## E · Un activo del mundo real que quizá no tenemos

**E1 · `snd.pe/g/7741`** — el pedido grupal muestra ese enlace corto para copiar y compartir.
**Nadie verificó que el dominio `snd.pe` esté registrado a nombre del negocio.** Si no lo
está, el enlace no lleva a ninguna parte, o peor, lleva al sitio de otro. Es dato del dueño,
no se inventa.

---

## Lo que esta auditoría NO encontró, y conviene saber

Varias cosas que parecían promesas resultaron reales y bien hechas:

- **El pedido grupal cierra por tiempo de verdad** (`expires_at` con `GROUP_ORDER_WINDOW_MINUTES`).
- **El pedido programado, las zonas de envío y el envío por distancia** existen y están tasados.
- **Las cinco recompensas de la pantalla de puntos** coinciden exactamente con `catalog_prices`.
- **Borrar la cuenta, cerrar sesión en todos lados y los términos** existen.
- **El pedido fijo guarda día y franja** — lo único que falla ahí es el texto, no el motor.

---

# El proceso de trabajo

## La regla que ordena todo: cada hueco tiene DOS salidas

Ninguna de las veinte obliga a programar. Cada una se cierra de una de dos formas, y **cuál
de las dos es una decisión de negocio, no técnica**:

- **CONSTRUIR** — el producto pasa a hacer lo que la pantalla prometía. Caro, y a veces vale
  la pena porque la promesa era mejor que el producto.
- **DECIR LA VERDAD** — la pantalla pasa a decir lo que el producto hace. Barato, casi
  siempre horas, y a veces la pantalla queda peor.

**Lo que NO es una salida: dejarlo así.** Una pantalla que promete de más no falla en
desarrollo, falla frente al cliente, el día que el negocio ya abrió.

El orden de abajo está armado para que las decisiones caras se tomen temprano y las baratas
no esperen a nadie.

---

## FASE 0 · Las cuatro decisiones que solo puede tomar el dueño

Nada de lo caro arranca hasta que estas cuatro estén cerradas. Cada una con lo que cuesta
cada salida, para que la decisión se tome con el número delante:

| # | el hueco | CONSTRUIR | DECIR LA VERDAD | recomendación |
|---|---|---|---|---|
| A1 | **Entrar con correo + código** | ~1-2 días. Resend ya está conectado y el bloqueo por intentos ya existe: es una acción que genera el código, otra que lo verifica, y la tabla donde vive | ~2 horas: las tres pantallas pasan a decir «teléfono y PIN» | **construir.** Es la primera pantalla de la app y «no hay contraseña» es mejor producto. Pero no es gratis y decide el dueño |
| A2 | **Plan semanal de cinco almuerzos** | ~~semanas~~ — **NO se construye (dueño, 2026-09-23): nada de suscripción** | ~3 horas: la pantalla pasa a contar lo que es — **pagas S/95 y tienes S/100 para gastar** | **decir la verdad, y evaluar retirarlo.** El análisis está en `docs/VOLVER_SIN_SUSCRIPCION.md` §5: el 5% se paga por un flote muy corto, le pide plata por adelantado a quien todavía no confía, y `remind-unused-credit` existe porque ese crédito se queda durmiendo |
| A3 | **Tarjeta de regalo con plata** | ~2-3 días: cobrar con Culqi en vez de puntos, aceptar a alguien sin cuenta, programar el envío, y decidir si el crédito vence | ~2 horas: la pantalla pasa a decir **«regala con tus puntos · 40 puntos = S/1»** y que el otro necesita cuenta | **decir la verdad.** Pero ojo: con puntos, la tarjeta de regalo es casi inalcanzable — S/50 son 2 000 puntos, cinco sándwiches gratis de por medio |
| A4 | **El pedido fijo se manda solo** | ~~no se construye~~ — **CERRADO 2026-09-23: el dueño confirma que NO es una suscripción.** Solo se avisa y el cliente vuelve a pedir | ~30 minutos | **decir la verdad.** Y hacer las cuatro cosas de `docs/VOLVER_SIN_SUSCRIPCION.md`, que valen más que la suscripción y no comprometen al negocio con nadie |

**Salida de esta fase:** cuatro palabras del dueño — construir o decir la verdad. Nada más.

---

## FASE 1 · Lo barato, que no espera a nadie (≈1 día)

Arranca **en paralelo** a la Fase 0, porque nada de esto depende de esas decisiones.

1. **Las tres bebidas** (B1-B3) — que la pantalla las llame por su nombre real y las describa
   por su receta real. Es lo más urgente de la fase: son las únicas tres que hay y están mal
   las tres.
2. **Los cinco números** (D1-D5) — y no escribirlos: **interpolarlos**, que es la regla que
   este repo ya tiene. Un precio escrito a mano se vuelve mentira el día que el dueño lo
   mueva desde el panel.
3. **Los productos fantasma** (B4-B6) — fuera «papas», fuera «The Chicago», fuera «THE
   VAULT». Son datos de ejemplo de las maquetas, pero si llegan al código llegan al cliente.
4. **Preguntarle al dueño por `snd.pe`** (E1). Si no es suyo, el enlace del pedido grupal
   cambia hoy.

---

## FASE 2 · El menú nuevo (en curso)

Va en paralelo y ya tiene su propio camino cerrado: precios fijados, sensibilidad verificada,
fichas escritas. **Lo único que lo gatilla son las cuatro fotos.**

Una cosa que esta auditoría cambia: las pantallas donde hoy aparecen The Chicago, The Smoke y
The Original **se van a reescribir igual** por el cambio de menú. Conviene hacer el B5 y el
cambio de menú **en el mismo movimiento**, no dos veces.

---

## FASE 3 · Lo que la Fase 0 haya mandado construir

Sin las decisiones no arranca. Si A1 sale «construir», es el camino crítico de toda la lista
y va primero, porque **bloquea la puerta de entrada**.

Cada cosa que se construya entra con su prueba de comportamiento en `tests-api/` si toca
dinero, y su spec en `tests/` si toca un flujo del cliente. Sin excepción: el login sin
prueba es la clase de código que falla el día de mayor tráfico.

---

## FASE 4 · Que esto no vuelva a pasar (≈medio día)

Lo que hace que esta auditoría valga más que una tarde de correcciones. Sin esto, dentro de
dos meses hay otras veinte.

**`npm run check:promesas`** — mismo patrón que `check:colores`, que ya impide que reaparezca
la paleta de la app anterior:

1. **Lista negra de lo retirado.** Ninguna palabra que el negocio dio de baja —«The Chicago»,
   «THE VAULT», «papas», «MÁS PEDIDO», «EDICIÓN LIMITADA», «chicha morada»— puede reaparecer
   en el cliente. Cada una tiene una fecha y un motivo, no es una lista de gustos.
2. **Todo nombre de producto que el cliente lee existe en el catálogo.** Si un texto nombra
   una bebida, un sándwich o una proteína, ese código tiene que estar vivo en `catalog.ts`.
   Caza los tres nombres de bebida de golpe.
3. **Ninguna cifra de dinero escrita a mano en copy.** Extiende lo que `check:precios` ya
   hace con los importes visibles hacia el texto corrido, que es justo donde se colaron las
   cinco de la sección D.

Y como el resto de los chequeos de este repo: **se verifica inyectándole los defectos que
dice cazar**, o es decoración.

---

## Cómo se sabe que terminó

No «se revisaron las pantallas». Tres cosas medibles:

1. Las veinte filas de este documento tienen una resolución escrita — construida o dicha.
2. `npm run check:promesas` pasa, y **falla** cuando se le reinyecta cualquiera de las veinte.
3. `npm run verify` entero en verde, con las pruebas nuevas de lo que se haya construido.

## El riesgo de calendario, dicho claro

El negocio abre **a más tardar la segunda semana de octubre**. Las fases 1, 2 y 4 caben con
holgura. **La Fase 3 no, si A1 sale «construir» y arranca tarde** — por eso la Fase 0 es de
esta semana y no de la próxima.
