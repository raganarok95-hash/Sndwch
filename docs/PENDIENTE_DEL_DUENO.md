# Lo que depende de ti — SND//WCH

Última actualización: 2026-10-07 · **Apertura al público: martes 13 de octubre de 2026** (los lunes cerrado). Permisos, precios reales y motorizados: listos.

Todo lo de esta lista está bloqueado por algo que **solo tú** puedes conseguir: una cuenta,
un secret, una cotización, una fecha real. Yo no lo puedo inventar — es la misma regla que
vale para el RUC o la razón social. Mientras no estén, el código que depende de ellos o no
se puede escribir, o queda escrito pero apagado.

Ordenado por qué tan cerca está de la apertura y de la plata.

---

> **Verificado el 2026-09-30 contra producción** (no por lectura del código): los **42 crons están
> activos**; el servidor ya devuelve `metaPixelId`, la llave de Google Maps y el `googleClientId`,
> así que **P5 y P23 están hechos** (los tokens de Meta que solo usa el servidor —CAPI, página— no
> se ven desde fuera: el dueño confirma que están puestos). El **QR de Yape** que el dueño mandó ese
> día es el mismo que ya usa la app (`img/yape-qr.png`, mismo contenido decodificado). Sigue
> `businessLaunched: false`: se activa al abrir. P14 (rotar el secreto de cron) no se pudo verificar.

> **ABIERTO el 2026-10-01 a las 6:20 (Lima)**: `businessLaunched` activo. El jueves volvió a abrir a las 11:00 (revertido el mismo día, 21:00 UTC).
>
> **No volver a pedirle al dueño** (2026-10-01, «hay cosas que me estás volviendo a pedir»):
> **snd.pe** no es suyo («la decisión es programarlas; snd.pe no es mía»): se borra de las
> maquetas; **las fotos las consigo yo** («obtén las fotos como has obtenido las anteriores»);
> el kraft de la hoja del mapa **se queda**; la cuenta publicitaria de Meta es la 221839797.
>
> **Al día el 2026-10-01** (dueño): la **compra real de prueba ya se hizo**; los secrets de Meta
> están puestos (no volver a listarlos como pendientes); el **provolone ya no se usa** (fuera de la
> lista); **P14 se cierra como riesgo bajo**: el secreto de cron figura en 5 registros del historial
> de migraciones y en 4 de los 42 crons, pero ese historial no lo expone la API: solo lo ve quien
> ya tiene acceso total a la base. Rotarlo es higiene, no urgencia.

## 0. Probar en tu celular (2026-10-02) — lo dijiste: «lo haré luego»

| # | Qué | Qué me dices después |
|---|---|---|
| ~~P30~~ | ~~Dirección guardada~~ — **cerrado sin pruebas tuyas** (dueño, 2026-10-03: «debe solucionarlo sin pruebas mías»): cubierto por `tests/direccion-guardada-sin-pin.spec.ts` (4 pruebas, incluida «con una guardada con pin, el carrito queda listo para pagar sin tocar nada») | — |
| ~~P31~~ | ~~Mover el pin de «Casa»~~ — **no hace falta** (dueño, 2026-10-02): el pin que ya tiene se respeta; una guardada con pin se usa de un toque, sin mapa | — |
| ~~P32~~ | ~~Tarjeta~~ — **arreglado 2026-10-03 sin pruebas tuyas**: el cobro iba sin correo para invitados y cuentas sin correo (create-charge lo rechazaba tras escribir la tarjeta); ahora usa el correo que el cliente da en Culqi. Verificado en producción: la reserva tiene todas sus columnas y la ventana de Culqi abre con el formulario. La primera compra real con tarjeta lo confirma: se ve en `debug_logs` (`tarjeta:*`) si falla | — |

## 1. Antes de abrir — sin esto no se puede operar

| # | Qué | Por qué importa |
|---|---|---|
| ~~P1~~ | ~~PHS + fumigación~~ — **listo** (dueño, 2026-10-07: «Permisos están listos hace bastante») | — |
| ~~P2~~ | ~~ITSE / Licencia de Funcionamiento~~ — **listo** (mismo mensaje) | — |
| ~~P3~~ | ~~Cerrar los lunes~~ — **hecho 2026-10-07**: `store_hours` lunes `closed=true`. **Apertura al público: martes 13 de octubre** (dueño: «Abrimos martes 13») | — |
| ~~P4~~ | ~~Precios reales~~ — **listo** (dueño, 2026-10-07: «Ya todo está con precios reales»). Motorizados listos. El inventario lo llena el dueño al abrir («Abro con N porciones») | — |

## 1a. ⚠ LO QUE DECIDE EL MES 3 — y casi todo depende de ti, no del código

`PREDICCION_V14.md` midió qué hace falta para **S/3,000 netos en diciembre**. El resultado es
incómodo y útil: **la publicidad NO lo mueve** (con S/8,000 de pauta sale peor que con S/0,
porque el gasto se resta hoy y el cliente vuelve recién a las cinco semanas). Lo que sí lo
mueve es esto, en orden:

| # | Qué | Cuánto mueve |
|---|---|---|
| P0a | **Avísale a 300 personas de tu red el primer mes.** El panel te da el link y el mensaje listo en Admin // Marketing // "Avísale a tu gente". **Usa ESE link** (lleva `?src=lanzamiento`): sin él, el sistema los cuenta como gente que llega sola todos los días y meses después te apaga los anuncios solo | P(S/3,000 en el mes 3): de 0% a **44.7%** con 200 · **73%** con 300 |
| P0b | **Google Business Profile publicado** (ya tienes el texto listo) **y el QR de la bolsa impreso** | lleva el orgánico a ~3/día: suma **+15 puntos** |
| P0c | **Que los referidos lleguen a 25 por cada 100 pedidos** (hoy el modelo asume 6). El mecanismo ya está en la app **y desde el 2026-09-13 paga lo que promete**: tu invitado recibía 120 puntos con la bebida costando 160, así que no podía canjear nada de lo que la app le decía. Lo que falta es que lo uses en cada entrega | de 15.5% a **52%** |
| P0d | S/2,000 de pauta con reinversión — **para el año que viene, no para diciembre** | m12: S/3,476 → S/4,058 |

Con las cuatro: **79.9%** de llegar a S/3,000 en el mes 3, y **la caja nunca baja de cero**
(el peor momento es +S/4,399, así que no hay pozo que financiar).

⚠ **Las 300 personas son un supuesto tuyo, no mío.** Si tu red son 80, esa fila no aplica.

## 1b. ⚠ Una sola oportunidad: la ventana sin publicidad, al abrir

| # | Qué | Por qué no se puede posponer |
|---|---|---|
| P1b | **Abrir y NO gastar un sol en anuncios durante al menos 14 días** | Es la única forma de saber cuánta gente llega sola. Después, el costo por cliente le acredita a Meta también a quien iba a llegar igual, y sale **más barato de lo que es** — el error que hace escalar un canal que pierde plata. **No se puede reconstruir después.** El panel (Admin // Marketing // Freno de CAC) lo cuenta solo y te dice cuánto falta; la campaña arranca en noviembre, no en octubre |
| P1c | **Una vez que empiece la campaña: cargar el gasto de Meta todos los días** | El freno divide gasto ÷ clientes y el gasto lo escribes tú. Tres días sin cargar y el costo por cliente sale más barato de lo que es, con el freno en verde. A los 3 días te llega un aviso al celular, pero el número ya estuvo mal ese tiempo |

## 2. Plata directa — desbloquean ingresos o miden si los hay

| # | Qué | Desbloquea |
|---|---|---|
| P5 | **3 secrets de Meta**: `META_PIXEL_ID`, `META_CAPI_TOKEN` y los de publicación (`META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`) | Sin esto no se puede medir NADA de publicidad, y la publicidad pagada es prácticamente tu único canal de adquisición. Bloquea las automatizaciones 41, 42, 43, 45, 46, 47 y 53 |
| P6 | **Botón "Order Food"** de Meta en Instagram/Facebook | Convierte el perfil en un canal de pedido, no solo de fotos |
| P7 | **Perfil + herramientas gratuitas de WhatsApp Business** | Catálogo, respuestas rápidas, horario. Todo gratis, sin API |
| ~~P8~~ | ~~Cotización real de atún y embutido~~ | **RESUELTO: los dos.** Embutido S/48/kg (confirmado por ti 2026-08-01) y atún S/4 la lata de 140 g al por mayor (2026-09-04) = S/43.96/kg escurrido, contra los S/67/kg que se venían usando. El atún dejó de ser la peor proteína del catálogo y pasó a 42% de costo en los dos tamaños |
| ~~P9~~ | ~~Cuántas porciones de 15CM salen de una focaccia entera~~ | **RESUELTO 2026-09-03: 10 de 15CM o 5 de 30CM** (medido por ti). De ahí salió `BASE_SURCHARGE` — la focaccia ya no es una elección gratuita, cobra S/0.50 y S/1.00 |
| ~~P10~~ | ~~Costo del envase de bebida~~ | **RESUELTO 2026-09-05: S/138 por 200 unidades = S/0.69 la botella** (comprado por ti), menos que el ~S/1 estimado. Y el tamaño quedó en MEDIO LITRO (2026-09-06) |

⚠ **P8, P9 y P10 aparecían como pendientes hasta el 2026-09-13 aunque tú ya los habías
entregado** (el atún el 4 de septiembre, la focaccia el 3, el envase el 5). Una lista que te
pide cosas que ya diste es una lista que se deja de mirar — el mismo motivo por el que la
alerta de caducidad no puede sonar por comida buena. Si ves algo acá que ya resolviste, dilo y
lo tacho.

## 3. Datos operativos — desbloquean automatizaciones concretas

| # | Qué | Automatización que desbloquea |
|---|---|---|
| P22 | **Agrega `https://www.sndwch.app/*` a la restricción de tu key de Google Maps** (Google Cloud → Credenciales → tu key → Restricciones de sitios web) | Probé la key contra Google: con `https://sndwch.app/` **funciona** y devuelve "Av. España 1234, Trujillo" — con el número, que es justo lo que antes no encontraba. Con `https://www.sndwch.app/` responde **403 bloqueado**. Si alguien entra por `www`, la búsqueda cae al buscador viejo **en silencio**: no da error, solo vuelve a no encontrar números. Es agregar una línea a esa lista |
| P23 | **Pon el `META_PIXEL_ID` en Supabase y genera el `META_CAPI_TOKEN`** (paso a paso en `docs/CONFIGURAR_META.md`) | Es el **bloqueo número uno del negocio**: sin esto el CAC sale de blogs de agencia y todo el modelo financiero cuelga de un número que nadie midió. Lo legal ya está resuelto — la Política de Privacidad se corrigió y hay un interruptor real de oposición, así que ya puedes prenderlo sin que la app prometa una cosa y haga otra |
| P33 | **Para que el equipo de marketing publique solo: el token de tu página «Snd//wch»** (2026-10-07) | Verificado contra Supabase: **faltan `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID` y `META_IG_USER_ID`**, por eso el calendario nunca publicó nada. El video del día y el Revisor ya funcionan; sin esto el video queda aprobado y no sale. Pasos (≈10 min): business.facebook.com → Configuración → Usuarios del sistema → crea uno con acceso a la página «Snd//wch» y a tu Instagram → **Generar token** con `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`, sin vencimiento → pégalo en Supabase → Edge Functions → Secrets como `META_PAGE_ACCESS_TOKEN`. **Es lo único que pegas**: la página (id `1188463894356831`) y el Instagram los saca el servidor del propio token. **Además**: la cuenta de anuncios 221839797 no tiene ni la página ni el Instagram vinculados; para la pauta del 27 oct, en Configuración del negocio → Cuentas publicitarias → asigna la página «Snd//wch» y conecta el Instagram |
| P34 | **Aprobar la bolsa a una tinta y pedir la serigrafía** (2026-10-08) | `docs/marketing/bolsa/README.md`: frente y dorso, PDF con sangrado. Pregunta a la imprenta el mínimo y el plazo; si no llega para el 13, sale con bolsa lisa y la impresa entra después. Antes del tiraje, escanea el QR de la prueba |
| P35 | **Para la pauta del 27: método de pago y conjunto de datos en la cuenta nueva** (2026-10-08) | CAPI funciona (probado contra Meta). La cuenta de anuncios es ahora **`1488138326460689`**, en tu Business. Falta: (a) **el método de pago** (no te deja: mándame el mensaje exacto o una captura; lo más común es que el banco bloquee compras por internet o en el extranjero) y (b) confirmar que «SNDWCH.APP» esté conectado a esa cuenta (la API aún no lo ve). `CONFIGURAR_META.md` §A3b |
| P36 | **Instalar el Estudio automático en tu laptop** (2026-10-08) — **instalado por el dueño; falta la primera corrida** | Una vez, ~3 min: `docs/marketing/estudio/INSTALAR.md`. Después la laptop genera en Flow sola (7:30 y 19:30) y hace el lunes de la agencia |
| ~~P37~~ | ~~El enlace del perfil de Instagram con su origen~~ — **hecho por el dueño el 2026-10-08** | Pon `https://sndwch.app/?src=ig-bio` como sitio web del perfil: las historias ya no llevan sticker y mandan al enlace del perfil; con el `src` se mide lo que traen |
| P11 | **Lead time de cada proveedor** (pan, carne, verduras) | #13 — recordatorio de pedido al proveedor |
| P18 | **CONFIRMAR o revertir: el regalo de cumpleaños cambió** | Hasta el 2026-08-29 eran **100 puntos que no vencen**; ahora es un **cupón personal de S/6 que vence en 7 días** (automatización #54). El cambio es lo que pedía la lista ("un cupón con vencimiento corto convierte más porque tiene urgencia") y en valor esperado te cuesta menos —los puntos son un pasivo abierto para siempre, el cupón caduca solo—, pero **cambia lo que recibe tu cliente**: quien no pide esa semana pierde el regalo. Los S/6 están por encima de los S/5 que valían los 100 puntos, así que quien sí pide sale ganando. Si prefieres volver a los puntos, es revertir un bloque en `birthday-bonus` — dímelo y lo hago |
| P17 | **Revisar cuántos días aguanta de verdad cada insumo tuyo** en la pantalla de Inventario | La alerta de caducidad (#5) ya funciona, pero arranca con **3 días** para todo: es el extremo conservador de la guía de USDA para carne y pollo cocidos en frío, no una medición de TUS recetas. Un encurtido o una salsa aguantan bastante más, y dejarlos en 3 hace que la alarma suene por comida buena — que es la forma en que una alarma deja de mirarse. Se cambia por insumo desde el panel, sin código |
| P12 | **Régimen tributario y formato que pide tu contador** | #84 — exportación mensual |
| P13 | **Decidir sobre WhatsApp Business API** (con costo) | #18 — despacho automático al motorizado |
| ~~P20~~ | ~~Captura real de Yape~~ — **recibida el 2026-10-02**: el lector se calibró con ella (el «S/» sale como «7», los asteriscos del celular como basura; ambos resueltos, `tests-api/yape-por-captura.test.ts`) | — |
| P19 | **Revisar el contenido de marketing antes de publicarlo la primera vez** | Tres números del texto que copias a Instagram/WhatsApp estaban **desactualizados**: decía que referir daba "50 puntos a ambos" (son 400 para ti y 120 para tu invitado), que el menú secreto se abre "desde tu 5to pedido" (son 3) y repetía los precios del Plan Semanal a mano. Ya está corregido y de ahora en adelante esos números salen solos del código, así que no se vuelve a desincronizar. Lo que te pido es una lectura tuya de los 8 textos (panel → MARKETING) antes del primer post: son promesas públicas y quien las firma eres tú |

## 4. Seguridad — pendiente viejo

| # | Qué | Por qué |
|---|---|---|
| ~~P14~~ | ~~**Rotar el secreto de cron**~~ — **cerrado 2026-10-01 como riesgo bajo** (ver arriba) | El valor sigue en texto plano en el historial de migraciones dentro de Supabase. 4 archivos del repo lo llevan redactado a propósito, pero la base conserva el original. Automatización #87 |

## 5. Marca — sin urgencia

| # | Qué |
|---|---|
| P15 | Definir la variación A de la mascota "El cocinero" |
| ~~P16~~ | ~~Confirmar de dónde salió el dibujo del mono~~ — **RESUELTO 2026-09-02: lo dibujó el dueño.** Sin riesgo de procedencia. |


---

## Lo que YO puedo hacer sin ti

Para que quede claro dónde está la frontera: de las 93 automatizaciones vigentes, **55
están marcadas HOY** — los datos y el código ya existen y las puedo construir sin que
tengas que conseguir nada. Otras **31 necesitan historial real de ventas**, así que no es
que falte algo tuyo: falta que el negocio opere unas semanas.

Del lote E1 (respaldo, restauración, humo en producción y caducidad de tanda) **no quedó
nada pendiente de tu lado**: ya está funcionando. De los lotes E2 a E5 salieron cuatro cosas
para ti y **ninguna bloquea nada**: P17 (la alerta ya opera con el valor conservador), P18
(el regalo de cumpleaños ya cambió; solo dime si lo quieres al revés), P19 (una lectura tuya
del contenido de marketing, ya corregido) y P20 (una captura de Yape para afinar el lector
de comprobantes, que ya funciona).

### P21 — calibrar el factor de ruta del delivery (2026-09-02)

Desde hoy el envío se cobra por **distancia real**: los kilómetros del pin del cliente por
S/2, que es lo que te cobra tu grupo de motorizados. Antes el cliente elegía su zona de un
desplegable, o sea elegía cuánto pagar de envío.

El mínimo ya está resuelto: **S/5** por viaje corto, confirmado por ti el 2026-09-02. Por
debajo de 2.5 km la tarifa la fija ese piso y no los kilómetros. **Nada pendiente acá.**

Lo que sí queda es un dato que vale la pena que midas tú, aunque no bloquea nada: **los
kilómetros reales de una muestra de entregas**, para calibrar el factor de 1.3 que convierte
la línea recta en ruta de moto. `orders.delivery_km` ya guarda lo que se cobró en cada
pedido, así que la comparación contra lo que te cobre el motorizado es directa.

---

Solo **8** siguen bloqueadas por esta lista (eran 11 hasta el 2026-09-13, cuando se tacharon
P8, P9 y P10 — ya los habías entregado). Son las de la sección 2 y 3 de arriba, y casi todas
cuelgan de una sola cosa: **los secrets de Meta (P5)**.
