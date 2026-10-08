# Respuestas automáticas de WhatsApp e Instagram (2026-10-08)

Dueño: «Ayúdame a configurar WhatsApp Business en automático… automatiza las respuestas de IG y
de WhatsApp. Hazlo, lo más prioritario hoy».

## Qué se puede tener para el martes 20 (la apertura, movida del 13), y qué viene después

| | para el 20 (gratis, sin revisión de Meta) | después (bot propio que responde con datos reales) |
|---|---|---|
| **WhatsApp** | App **WhatsApp Business**: bienvenida, ausencia, respuestas rápidas, catálogo, etiquetas | API de WhatsApp en el mismo número («coexistencia»): exige **7 días de uso** del número en la app Business. Desde el 1-oct-2026 cada número tiene **1,000 mensajes de servicio gratis al mes**; luego Meta cobra ([precios de Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)). Lo que mandas desde la app sigue gratis |
| **Instagram / Facebook** | **Meta Business Suite**: respuesta instantánea, ausencia, preguntas frecuentes, respuestas guardadas | API de mensajería: responder a cualquier persona exige **revisión de la app por Meta** ([guía de Meta](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/app-review/apps-for-your-own-business)); con el token del paso B de `CONFIGURAR_META.md` ya pedido con esos permisos |
| **Comentarios** | a mano (Business Suite no responde comentarios solo) | el bot: comentario con palabra clave → mensaje privado con el enlace |

Corrección a `MARKETING_AUTOMATICO.md` §4: escribía «los mensajes de servicio no se cobran». Eso
cambió el 1-oct-2026 (1,000 gratis al mes por número).

Los textos de abajo **no llevan precios** a propósito: los precios cambian en el panel y un
texto pegado en Meta no se actualiza solo. Llevan el enlace con su origen (`?src=wa`,
`?src=ig-dm`) para que el análisis sepa cuántos pedidos traen. El horario es el de la base al
2026-10-08 (martes a domingo, 11:00–22:00; lunes cerrado): si cambia, se cambia aquí y allá.

---

## WhatsApp Business (en tu celular, ~15 minutos)

Si el número del negocio todavía está en WhatsApp normal: instala **WhatsApp Business** y, al
abrirla, elige pasar ese número (conserva los chats).

**1 · Perfil** — Ajustes → Herramientas para la empresa → Perfil de empresa
- Nombre: `SND//WCH` · Categoría: Restaurante · Horario: martes a domingo 11:00–22:00, lunes cerrado
- Descripción: `Sándwiches armados al momento, a domicilio. Pide en sndwch.app`
- Sitio web: `https://sndwch.app/?src=wa`

**2 · Mensaje de bienvenida** — Herramientas → Mensaje de bienvenida → Activado → Destinatarios: todos
```
Hola, aquí SND//WCH. Sándwiches armados al momento, directo a tu puerta.
Pides en sndwch.app/?src=wa: eliges un Signature o armas el tuyo, y pagas con Yape o tarjeta.
Si tienes una duda, escríbela aquí.
```

**3 · Mensaje de ausencia** — Herramientas → Mensaje de ausencia → Activado → Horario
personalizado: lunes todo el día, y de martes a domingo fuera de 11:00–22:00
```
Ahora la cocina está cerrada: abrimos de martes a domingo, de 11:00 a 22:00.
Puedes dejar tu pedido programado en sndwch.app/?src=wa y te llega a la hora que elijas.
```

**4 · Respuestas rápidas** — Herramientas → Respuestas rápidas → «+». Se usan escribiendo `/` en el chat.

| atajo | mensaje |
|---|---|
| `/pedir` | Entra a sndwch.app/?src=wa, elige el tuyo y paga con Yape o tarjeta. Sin descargar nada. |
| `/zona` | Pon tu dirección en sndwch.app/?src=wa y te sale el envío al instante, antes de pagar. |
| `/pago` | Yape o tarjeta, dentro de la app. Con Yape subes la captura y se confirma solo. |
| `/carta` | La carta completa está en sndwch.app/?src=wa: los Signatures y el que armas tú. |
| `/grupo` | Para la oficina usa «Pedir en grupo» en la app: cada uno elige lo suyo y quien organiza tiene premio. |
| `/secreto` | Hay un menú secreto. Se desbloquea pidiendo. No podemos decir más. |
| `/estado` | Pásame tu número de pedido (empieza con ORD-) y te digo cómo va. |
| `/algo` | Lamentamos lo que pasó. En la app, abre tu pedido y toca «Algo salió mal»: así llega directo a cocina. También está el Libro de Reclamaciones en sndwch.app. |

**5 · Catálogo** — Herramientas → Catálogo → un artículo por Signature con su foto real
(`img/sigNN.jpg`) y su descripción de la carta; en «enlace» pon `https://sndwch.app/?src=wa`.
Sin precio, o actualízalo cuando cambie en el panel.

**6 · Etiquetas** — Nuevo cliente · Pedido · Reclamo (para ordenar los chats).

---

## Instagram y Facebook (Meta Business Suite, ~10 minutos)

**business.facebook.com** → **Bandeja de entrada** → ⚙ / **Automatizaciones**. Cada una se
activa para **Instagram y Facebook** a la vez.

**1 · Respuesta instantánea**
```
Hola, gracias por escribir. Pides en sndwch.app/?src=ig-dm: eliges un Signature o armas el tuyo,
y pagas con Yape o tarjeta. Si tienes una duda, escríbela aquí.
```

**2 · Mensaje de ausencia** (fuera de horario)
```
Ahora la cocina está cerrada: abrimos de martes a domingo, de 11:00 a 22:00. Puedes dejar tu
pedido programado en sndwch.app/?src=ig-dm.
```

**3 · Preguntas frecuentes** (aparecen como botones al abrir el chat)

| pregunta | respuesta |
|---|---|
| ¿Cómo pido? | En sndwch.app/?src=ig-dm, desde el celular y sin descargar nada. Pagas con Yape o tarjeta. |
| ¿Llegan a mi casa? | Pon tu dirección en sndwch.app/?src=ig-dm y te sale el envío al instante, antes de pagar. |
| ¿Qué me recomiendas? | Si es tu primera vez, el Philly Cheesesteak. Si quieres jugar, arma el tuyo. |
| ¿Hacen pedidos para oficina? | Sí: «Pedir en grupo» en la app. Cada uno elige lo suyo y quien organiza tiene premio. |

**4 · Respuestas guardadas** — las mismas de WhatsApp (`/pedir`, `/zona`…), cambiando
`?src=wa` por `?src=ig-dm`.

---

## Lo que sigue: el bot propio

Cuando estén el token (paso B de `CONFIGURAR_META.md`) y los 7 días de uso de WhatsApp
Business, el bot responde solo con datos reales de la app: el estado de un pedido por su número,
si hoy hay o no un Signature (inventario), el envío a una dirección y, en Instagram, el mensaje
privado a quien comenta una palabra clave. Para Instagram hay que pedir la revisión de Meta con
un video del bot funcionando; se prepara cuando esté el token.
