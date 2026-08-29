# Lo que depende de ti — SND//WCH

Última actualización: 2026-08-29 · **Apertura: lunes 7 de septiembre de 2026 (faltan 9 días)**

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
| P17 | **Revisar cuántos días aguanta de verdad cada insumo tuyo** en la pantalla de Inventario | La alerta de caducidad (#5) ya funciona, pero arranca con **3 días** para todo: es el extremo conservador de la guía de USDA para carne y pollo cocidos en frío, no una medición de TUS recetas. Un encurtido o una salsa aguantan bastante más, y dejarlos en 3 hace que la alarma suene por comida buena — que es la forma en que una alarma deja de mirarse. Se cambia por insumo desde el panel, sin código |
| P12 | **Régimen tributario y formato que pide tu contador** | #84 — exportación mensual |
| P13 | **Decidir sobre WhatsApp Business API** (con costo) | #18 — despacho automático al motorizado |

## 4. Seguridad — pendiente viejo

| # | Qué | Por qué |
|---|---|---|
| P14 | **Rotar el secreto de cron** | El valor sigue en texto plano en el historial de migraciones dentro de Supabase. 4 archivos del repo lo llevan redactado a propósito, pero la base conserva el original. Automatización #87 |

## 5. Marca — sin urgencia

| # | Qué |
|---|---|
| P15 | Definir la variación A de la mascota "El cocinero" |
| P16 | Confirmar de dónde salió el dibujo del mono antes de imprimirlo |

---

## Lo que YO puedo hacer sin ti

Para que quede claro dónde está la frontera: de las 93 automatizaciones vigentes, **55
están marcadas HOY** — los datos y el código ya existen y las puedo construir sin que
tengas que conseguir nada. Otras **31 necesitan historial real de ventas**, así que no es
que falte algo tuyo: falta que el negocio opere unas semanas.

Del lote E1 (respaldo, restauración, humo en producción y caducidad de tanda) **no quedó
nada pendiente de tu lado**: ya está funcionando. Lo único que suma esta ronda es P17, y no
bloquea nada — la alerta ya opera con el valor conservador.

Solo **11** están bloqueadas por esta lista. Son las de la sección 2 y 3 de arriba, y casi
todas cuelgan de una sola cosa: **los secrets de Meta (P5)**.
