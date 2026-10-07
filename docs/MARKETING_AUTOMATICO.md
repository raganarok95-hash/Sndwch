# Marketing desde cero — auditoría y sistema nuevo (2026-10-07, v2)

Dueño, 2026-10-07: «quiero que sea automático por completo. Analízalo desde cero» y, tras la v1:
«aún falta que de verdad analices bien. El sistema que tenemos no solo no arrancó sino que no
funciona, es obsoleto, no sirve, hay que hacerlo desde cero». «Yo me encargo de que se pueda
publicar en TikTok».

**Estado: propuesta para aprobar. Nada construido.** Concepto antes que código (regla 3).

---

## 1 · Auditoría: cada pieza del sistema actual y por qué no sirve

| pieza | qué hace hoy | veredicto |
|---|---|---|
| **Generador del calendario** (`remind-marketing-content`, `marketingContent()`) | Cada lunes copia textos de un **rotador fijo de 2 semanas escrito a mano** a `marketing_calendar` como **borrador sin imagen** y te manda un push para que los copies tú. El código dice: «nada de esto publica solo… es la lista de acción que el dueño copia a mano». | **Obsoleto por diseño.** Textos congelados (habla de plan semanal y hora valle, que ya no existen), sin imagen, sin video, dependiente de ti. 12 borradores, 0 publicados. **Se borra.** |
| **Publicador** (`auto-publish-calendar`, Graph API) | Publica en Instagram/Facebook una entrada `scheduled` con foto o video ya listo. | **La única pieza que sirve**: es solo el último paso. Se conserva como «brazo» del sistema nuevo. |
| **Videos** (`admin-upload-raw-video`, `content_uploads`) | Subes un clip crudo; «una sesión programada aparte» lo editaría. | **Esa sesión nunca existió.** 0 clips. La idea (tú grabas, el sistema edita) es la correcta; la ejecución no existe. Se rehace. |
| **16 recordatorios de retención** (segundo pedido, carrito abandonado, cumpleaños, reactivación, puntos…) | Todos hablan **solo por notificación push del navegador**. | **Canal equivocado.** Hay **0 suscripciones** (ni la tuya). En Android hay que aceptar un permiso que casi nadie acepta en una web; en iPhone el push web solo funciona si instalas la app en la pantalla de inicio. En Perú la conversación con un negocio de comida es WhatsApp. **Se rehacen sobre WhatsApp.** |
| **Campañas por correo** (`winback-campaign`, `birthday-bonus`) | Correo por Resend. | **Alcance mínimo**: hay 1 correo en toda la base (el registro de invitado no lo pide). Quedan solo como respaldo. |
| **Freno de CAC** (`alert-cac-brake`) | Divide un gasto que **escribes a mano** entre clientes nuevos y te **avisa**. | **No frena nada.** `ad_spend` está vacía. Se rehace: lee el gasto de Meta solo y **pausa** solo. |
| **Botón de anuncios** (`admin-meta-ads`) | Pausa y reanuda campañas existentes. | No crea campañas, no lee resultados. Queda como interruptor manual. |
| **Medición para Meta** | Pixel en el navegador: `AddToCart`, `CompleteRegistration`, `Purchase`. Servidor (CAPI): solo `Purchase`. | **Insuficiente para empezar**: con 0 compras Meta no tiene de qué aprender. Faltan `ViewContent` e `InitiateCheckout` del lado del servidor. |
| **Atribución** (`?src=`, `acquisition_source`) | Se guarda solo si la persona **crea cuenta**. | **Ciego**: el invitado (que es el camino principal) no se cuenta, y no existe conteo de **visitas**. Hoy no se puede saber cuánta gente entra y no compra. |
| **Referidos** | Código personal, premio en puntos, botón «Compartir». | Exige cuenta y se ofrece en un rincón. La mecánica sirve; el momento y el canal no. |
| **Reseñas** | La app pide estrellas que **se quedan adentro**. | **Nadie pide nunca una reseña de Google**, que es la acción con mejor evidencia causal (`MAQUINARIA_DE_MARKETING.md`). |

**Resumen honesto:** de once piezas, una sirve tal cual (el publicador), tres sirven como base
(videos, referidos, botón de anuncios) y siete se tiran.

---

## 2 · Lo que dice la investigación (lo que cambia el diseño)

1. **El video corto es el motor de descubrimiento para un local nuevo.** TikTok y Reels son de los
   pocos canales donde un negocio chico llega a miles de personas de su ciudad **sin pagar
   distribución**: el algoritmo premia que lo vean entero, lo guarden y lo compartan, no los
   seguidores. Un clip de 20 segundos puede rendir más que meses de fotos fijas.
   ([Malou · TikTok for restaurants 2026](https://www.malou.io/en-us/blog/tiktok-for-restaurants),
   [Direct Orders · 2026](https://www.directorders.com/blog/restaurant-marketing-2026-trends))
2. **En Perú se compra por redes y se pide por WhatsApp.** 91% del Perú urbano usa redes y 53% ya
   compró algo tras verlo en Facebook o TikTok; TikTok lidera en tiempo de uso entre jóvenes e
   Instagram es la favorita de 16 a 34 años; **81% dice que seguirá usando WhatsApp para hacer
   pedidos**. ([Ipsos Perú](https://www.threads.com/@ipsosperu/post/DUEDWaikcXR/las-redes-sociales-hoy-son-un-canal-clave-para-descubrir-evaluar-y-comprar),
   [Lima Retail 2026](https://limaretail.com/redes-sociales/estadisticas-redes-sociales-2026/),
   [UTP 2025](https://www.utp.edu.pe/blog/novedades-utp/tendencias-del-consumidor-peruano-2025))
3. **WhatsApp por API cobra por mensaje de plantilla, no por conversación** (desde julio 2025): los
   mensajes de servicio dentro de la ventana de 24 h son gratis, y las plantillas de «utilidad»
   (estado del pedido) también si van dentro de esa ventana; las de marketing se pagan según el país.
   ([Meta · WhatsApp pricing](https://developers.facebook.com/docs/whatsapp/pricing))
4. **Meta Ads con presupuesto chico:** una sola campaña Advantage+ y un solo conjunto, optimizada a
   **Compra** desde el día 1, con Conversions API además del pixel.
   ([Meta · Advantage+](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns))
5. **Instagram por API**: hasta 50–100 publicaciones por día, Reels de hasta 90 s en MP4/H.264.
   ([Meta · Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing))
6. **TikTok por API**: sin la auditoría de TikTok todo sale privado. Lo resuelves tú; el sistema
   queda listo para publicar ahí el día que esté aprobado.
   ([TikTok · Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post))
7. **Reseñas de Google**: el enlace directo `search.google.com/local/writereview?placeid=…` se puede
   mandar solo tras cada entrega. Google **prohíbe** pedírsela solo a los contentos: se le pide a
   todos. ([Dreikon](https://www.dreikon.de/en/news/online-marketing-knowledge/link-to-google-reviews/))

---

## 3 · El sistema nuevo: cuatro motores y un tablero

### Motor 1 · Contenido en video (el que trae gente nueva)
- **Lo único que no se puede automatizar es la cámara.** Tu parte: grabar con el celular, mientras
  cocinas una tanda, clips crudos de 1–3 minutos (manos armando, el corte del pan, el queso
  fundiéndose, la bolsa saliendo) y subirlos desde el panel. Sin editar, sin pensar en el texto.
- El sistema, solo: corta los mejores 15–25 s, los pone en vertical, agrega subtítulos y el texto
  (nombres y precios **interpolados desde la carta**, nunca escritos a mano), y los programa en la
  franja con más pedidos.
- Publica a la vez en **Reels (Instagram + Facebook)** y **TikTok** (cuando esté habilitado).
- Si una semana no hay clips nuevos, publica con las fotos propias para no cortar el ritmo.
- Cada post se puede frenar desde el panel («No publicar»); si no lo tocas, sale.

### Motor 2 · WhatsApp (la relación con el cliente, reemplaza el push)
- En el checkout, una casilla (desmarcada por defecto, por ley de datos personales): «Avísame por
  WhatsApp». El celular ya se pide para el pedido.
- **Estado del pedido por WhatsApp** (gratis o casi: va dentro de la ventana de servicio).
- **Tras la entrega, un solo mensaje**: el enlace de reseña de Google + tu link para invitar a un
  amigo (vale también para invitados, sin cuenta).
- **Recompra**: los recordatorios que hoy van por push (segundo pedido a los 7 días, reactivación a
  los 21–30), pasados a plantillas de WhatsApp, con tope de mensajes por persona y por mes.

### Motor 3 · Pauta en Meta (acelera lo que ya funciona)
- Desde el día 15 (después de los 14 días sin anuncios para medir el orgánico).
- Una campaña Advantage+ optimizada a Compra, en tu zona de reparto, cuyos anuncios son **los
  videos que mejor funcionaron gratis** (se promociona lo que la gente ya vio entero).
- Cada mañana lee el gasto de Meta, calcula el costo por cliente nuevo y **pausa sola** si pasa tu
  límite. Nunca supera el tope diario ni el mensual que pongas.
- Medición completa: `ViewContent`, `AddToCart`, `InitiateCheckout` y `Purchase` también desde el
  servidor, para que Meta aprenda antes de las primeras 50 compras.

### Motor 4 · Medición (para saber qué funciona)
- Conteo de visitas por origen (video, anuncio, Google, referido, tu red), sin datos personales.
- Embudo por origen: visitas → carrito → pago → segundo pedido.
- **Cada lunes por WhatsApp**: qué video trajo más pedidos, cuánto costó cada cliente nuevo,
  reseñas nuevas y qué recomienda el sistema (subir o bajar pauta, qué tema grabar).

### El tablero (una sola pantalla de marketing en el panel)
Lo próximo que se publica (con «No publicar»), los topes de pauta, el embudo de la semana y el
botón para subir clips. Nada más.

---

## 4 · Qué se borra

El rotador `marketingContent()` y el generador de borradores; los 12 borradores; los 16
recordatorios por push (se rehacen sobre WhatsApp); el cálculo de CAC con gasto a mano. Se
conservan: el publicador de Graph API, el bucket de clips crudos, el pixel y la CAPI (ampliados),
la mecánica de referidos y el botón de anuncios.

---

## 5 · Lo que tienes que decidir (sin esto no se programa)

1. **WhatsApp Business por API** (P13): ¿lo activamos? Necesita un número del negocio
   conectado a la API (según cómo lo tengas hoy puede ser el mismo de WhatsApp Business o uno
   nuevo; lo verifico antes) y una tarjeta en Meta para los mensajes de marketing. Te traigo la
   tarifa exacta de Perú antes de gastar nada.
2. **Grabar**: ¿te comprometes a subir clips crudos al menos 2 veces por semana? Es lo único que
   el sistema no puede hacer, y es lo que más gente nueva trae.
3. **Tope de pauta**: cuánto por día y por mes, desde el 27 de octubre.
4. **Ficha de Google**: ¿existe y está verificada? Sin ella no hay enlace de reseña.
5. **PedidosYa / Rappi**: ¿quieres estar también ahí como vitrina? Ahí ya está la gente que busca
   comida en Trujillo, a cambio de comisión. No es automatizable desde aquí, pero es un canal de
   descubrimiento que el análisis no puede ignorar.

---

## 6 · Orden de construcción (cuando apruebes)

1. Medición (visitas, embudo, eventos completos a Meta): sin esto no se sabe si lo demás funciona.
2. Motor 1 (video) con el publicador existente; TikTok en cuanto lo habilites.
3. Motor 2 (WhatsApp): estado del pedido + reseña + referido; después la recompra.
4. Motor 3 (pauta), el día 15.
5. Borrar lo obsoleto.
