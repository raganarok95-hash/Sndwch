# Respuestas automáticas de Instagram (@snd__wch), versión de la apertura (2026-11-04)

Dueño (2026-11-04): «Automaticemos las respuestas de ig genera el speech y colocala».
Base: `RESPUESTAS_AUTOMATICAS.md` (2026-10-08) y `docs/servicio/RESPUESTAS_TIPO.md`, al día con la
apertura del **viernes 20 de noviembre, 11:00**. **Borrador: nada se activa sin el sí del dueño.**

Reglas: con «tú» y cortas. Sin precios (cambian en el panel y un texto pegado no se actualiza) y sin
horario escrito (el de la base puede cambiar). Cada enlace lleva `?src=ig-dm` para saber qué pedidos
traen los mensajes. Un reclamo nunca se contesta solo: pasa a una persona.

## 1 · Preguntas frecuentes (botones que el cliente ve al abrir el chat; máximo 4)

**Hasta el jueves 19:**

| pregunta | respuesta |
|---|---|
| ¿Cuándo abren? | El viernes 20 de noviembre a las 11:00. Ese día pides en sndwch.app/?src=ig-dm, desde el celular y sin descargar nada. |
| ¿Cómo pido? | En sndwch.app/?src=ig-dm: eliges un Signature o armas el tuyo, y pagas con Yape o tarjeta. Sin descargar nada. |
| ¿Llegan a mi casa? | Pon tu dirección en sndwch.app/?src=ig-dm y te sale el envío al instante, antes de pagar. |
| ¿Qué me recomiendas? | Si es tu primera vez, el PHILLY CHEESESTEAK. Si quieres jugar, arma el tuyo. |

**Desde el viernes 20**, «¿Cuándo abren?» se cambia por:

| ¿Hacen pedidos para oficina? | Sí: «Pedir en grupo» en la app. Cada uno elige lo suyo y quien organiza tiene premio. |
|---|---|

## 2 · Bienvenida (el primer mensaje de alguien nuevo)

Hasta el 19:
```
Hola, aquí SND//WCH. Abrimos el viernes 20 de noviembre a las 11:00.
Ese día pides en sndwch.app/?src=ig-dm: eliges un Signature o armas el tuyo, y pagas con Yape o tarjeta.
Si tienes una duda, escríbela aquí.
```
Desde el 20:
```
Hola, aquí SND//WCH. Pides en sndwch.app/?src=ig-dm: eliges un Signature o armas el tuyo,
y pagas con Yape o tarjeta. Si tienes una duda, escríbela aquí.
```

## 3 · Fuera de horario (desde el 20)
```
Ahora la cocina está cerrada. Puedes dejar tu pedido programado en sndwch.app/?src=ig-dm
y te llega a la hora que elijas.
```

## 4 · Respuestas guardadas (las usas tú en el chat)

| atajo | mensaje |
|---|---|
| `/pedir` | Entra a sndwch.app/?src=ig-dm, elige el tuyo y paga con Yape o tarjeta. Sin descargar nada. |
| `/zona` | Pon tu dirección en sndwch.app/?src=ig-dm y te sale el envío al instante, antes de pagar. |
| `/pago` | Yape o tarjeta, dentro de la app. Con Yape subes la captura y se confirma solo. |
| `/carta` | La carta completa está en sndwch.app/?src=ig-dm: los Signatures y el que armas tú. |
| `/grupo` | Para la oficina usa «Pedir en grupo» en la app: cada uno elige lo suyo y quien organiza tiene premio. |
| `/secreto` | Hay un menú secreto. Se desbloquea pidiendo. No podemos decir más. |
| `/estado` | Pásame tu número de pedido (empieza con ORD-) y te digo cómo va. |
| `/algo` | Lamentamos lo que pasó. En la app, abre tu pedido y toca «Algo salió mal»: así llega directo a cocina. También está el Libro de Reclamaciones en sndwch.app. |

Demoras, errores y reembolsos: las de `docs/servicio/RESPUESTAS_TIPO.md` (`/tarde`, `/falto`…),
igual que en WhatsApp.

## Dónde se colocan

- **Preguntas frecuentes y respuestas guardadas**: en la app de Instagram, como snd__wch
  (Configuración → Herramientas para empresas). No pasan por la página ni por la revisión de Meta.
- **Bienvenida y fuera de horario**: Instagram solo las ofrece desde Meta Business Suite, que exige
  el Instagram unido a la página (bloqueado por la marca de «Políticas de publicidad» del 8-oct).
  Mientras tanto las manda el contestador propio (abajo).
- **Contestador propio** (`api`, con `INSTAGRAM_LOGIN_TOKEN`): revisa la bandeja cada pocos minutos y
  manda la bienvenida o el «fuera de horario» una sola vez por persona. Para contestarle a cualquier
  cliente, Meta puede pedir la revisión de la app; se prueba primero con lectura, sin mandar nada.
