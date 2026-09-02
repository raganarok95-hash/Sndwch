# Lo que depende de ti — SND//WCH

Última actualización: 2026-09-02 · **Apertura: a más tardar la 2ª semana de octubre de 2026** (movida desde el 7 de septiembre por trámites de permisos)

Todo lo de esta lista está bloqueado por algo que **solo tú** puedes conseguir: una cuenta,
un secret, una cotización, una fecha real. Yo no lo puedo inventar — es la misma regla que
vale para el RUC o la razón social. Mientras no estén, el código que depende de ellos o no
se puede escribir, o queda escrito pero apagado.

Ordenado por qué tan cerca está de la apertura y de la plata.

---

## 1. Antes de abrir — sin esto no se puede operar

| # | Qué | Por qué importa |
|---|---|---|
| P1 | **Cotizar PHS + fumigación** con certificadora real en Trujillo | Requisito sanitario para vender comida |
| P2 | **Confirmar con la MPT** si el ITSE va aparte de la Licencia de Funcionamiento | Si va aparte y no lo sabes, abres sin un permiso |
| P3 | **Cerrar los lunes** el martes 8 de septiembre | Decisión ya tomada; hay que ejecutarla en el panel el día indicado |
| P4 | **Cotizar precios reales** al comprar la primera tanda | Todo el costeo del menú corre hoy sobre estimados. Ver P8 |

## 2. Plata directa — desbloquean ingresos o miden si los hay

| # | Qué | Desbloquea |
|---|---|---|
| P5 | **3 secrets de Meta**: `META_PIXEL_ID`, `META_CAPI_TOKEN` y los de publicación (`META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`) | Sin esto no se puede medir NADA de publicidad, y la publicidad pagada es prácticamente tu único canal de adquisición. Bloquea las automatizaciones 41, 42, 43, 45, 46, 47 y 53 |
| P6 | **Botón "Order Food"** de Meta en Instagram/Facebook | Convierte el perfil en un canal de pedido, no solo de fotos |
| P7 | **Perfil + herramientas gratuitas de WhatsApp Business** | Catálogo, respuestas rápidas, horario. Todo gratis, sin API |
| P8 | **Cotización real de atún y embutido** | El atún no tiene cotización propia (se usa ~S/67/kg investigado online). Sin esto, el margen de SIG04 y P04 es una suposición |
| P9 | **Cuántas porciones de 15CM salen de una focaccia entera** | El pan es una elección GRATUITA del cliente, así que todo sobrecosto de la focaccia sale de tu margen sin que nadie pague más. Hoy no se puede costear |
| P10 | **Costo del envase de bebida** (botella con tapa a rosca, estimado ~S/1) | El margen de bebidas se calculó sin envase. Con envase real baja de 61-84% a 56-66% |

## 3. Datos operativos — desbloquean automatizaciones concretas

| # | Qué | Automatización que desbloquea |
|---|---|---|
| P11 | **Lead time de cada proveedor** (pan, carne, verduras) | #13 — recordatorio de pedido al proveedor |
| P18 | **CONFIRMAR o revertir: el regalo de cumpleaños cambió** | Hasta el 2026-08-29 eran **100 puntos que no vencen**; ahora es un **cupón personal de S/6 que vence en 7 días** (automatización #54). El cambio es lo que pedía la lista ("un cupón con vencimiento corto convierte más porque tiene urgencia") y en valor esperado te cuesta menos —los puntos son un pasivo abierto para siempre, el cupón caduca solo—, pero **cambia lo que recibe tu cliente**: quien no pide esa semana pierde el regalo. Los S/6 están por encima de los S/5 que valían los 100 puntos, así que quien sí pide sale ganando. Si prefieres volver a los puntos, es revertir un bloque en `birthday-bonus` — dímelo y lo hago |
| P17 | **Revisar cuántos días aguanta de verdad cada insumo tuyo** en la pantalla de Inventario | La alerta de caducidad (#5) ya funciona, pero arranca con **3 días** para todo: es el extremo conservador de la guía de USDA para carne y pollo cocidos en frío, no una medición de TUS recetas. Un encurtido o una salsa aguantan bastante más, y dejarlos en 3 hace que la alarma suene por comida buena — que es la forma en que una alarma deja de mirarse. Se cambia por insumo desde el panel, sin código |
| P12 | **Régimen tributario y formato que pide tu contador** | #84 — exportación mensual |
| P13 | **Decidir sobre WhatsApp Business API** (con costo) | #18 — despacho automático al motorizado |
| P20 | **Mándame una captura real de una constancia de Yape** (tapando lo que quieras menos los rótulos) | El lector de comprobantes (#28) ya funciona y **no cuesta nada** — corre en tu navegador, sin cuenta ni servicio externo. Pero los rótulos que busca ("N° de operación", "Monto"...) los escribí **sin poder verificarlos contra una constancia real**: se me acabó el límite de búsquedas web. Con una captura tuya ajusto la lista en una línea. Mientras tanto, si no reconoce algo lo dice claro en vez de inventarlo |
| P19 | **Revisar el contenido de marketing antes de publicarlo la primera vez** | Tres números del texto que copias a Instagram/WhatsApp estaban **desactualizados**: decía que referir daba "50 puntos a ambos" (son 400 para ti y 120 para tu invitado), que el menú secreto se abre "desde tu 5to pedido" (son 3) y repetía los precios del Plan Semanal a mano. Ya está corregido y de ahora en adelante esos números salen solos del código, así que no se vuelve a desincronizar. Lo que te pido es una lectura tuya de los 8 textos (panel → MARKETING) antes del primer post: son promesas públicas y quien las firma eres tú |

## 4. Seguridad — pendiente viejo

| # | Qué | Por qué |
|---|---|---|
| P14 | **Rotar el secreto de cron** | El valor sigue en texto plano en el historial de migraciones dentro de Supabase. 4 archivos del repo lo llevan redactado a propósito, pero la base conserva el original. Automatización #87 |

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

Solo **11** están bloqueadas por esta lista. Son las de la sección 2 y 3 de arriba, y casi
todas cuelgan de una sola cosa: **los secrets de Meta (P5)**.
