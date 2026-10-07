# Marketing desde cero — v3: todo automático (2026-10-07)

Historia: la v1 proponía arrancar lo que había; la v2, rehacerlo con clips grabados por el dueño.
El dueño, sobre la v2: «No es automático, porque requiere que yo grabe clips. Dije todo
automático… ve algo más potente que reseñas… repiensa el sistema de análisis y la creación de
videos». Respuestas suyas: WhatsApp **sí, pero gratis**; grabar **no puede**; pauta: **«analicemos
cuánto es necesario»**; ficha de Google: **existe, revísala**; Rappi: **acuerdo de 0% de comisión el
primer mes**. TikTok: lo habilita él.

**Estado: propuesta. La única pieza ya probada es el generador de video (muestra en §2).**
La auditoría de lo viejo (qué sirve y qué no) está en el historial de este archivo (v2, mismo día).

---

## 1 · La regla de diseño

**Nada depende de una persona.** Todo lo que el sistema necesita ya existe en la app: la carta
(nombres, precios, ingredientes, frases), 26 fotos propias tratadas, SANDO y WICHO, el inventario
del día, los pedidos reales y los horarios. El sistema convierte eso en contenido, mensajes y
decisiones. El dueño no graba, no escribe, no aprueba (puede frenar algo si quiere) y no carga
números.

---

## 2 · Motor de contenido: video generado por código, sin cámara

**Ya probado hoy**: `scripts/video-auto/` arma un Reel/TikTok vertical de 12 s (1080×1920, MP4
H.264) **solo a partir de la carta**. La muestra (`docs/maquetas/propuestas/video-auto-philly.mp4`)
salió así, sin que nadie escriba nada:

- gancho = la primera frase del pitch del Signature («El clásico de Filadelfia, sin atajos»);
- la foto propia en movimiento, el nombre, los ingredientes reales de la receta, el precio de
  15CM sacado de la carta, SANDO entrando y el cierre con WICHO y el «//» de la marca;
- costo: **S/0** (navegador + codificador libre, en GitHub); tarda ~50 s por video.

Lo que lo vuelve un motor y no un video suelto:

| plantilla | de dónde salen los datos |
|---|---|
| El Signature del día (la de la muestra) | carta |
| «Quedan N hoy» (urgencia real, en vivo) | inventario del día que llenas al abrir |
| Arma el tuyo con WICHO: el armado paso a paso | panes, proteínas, quesos, salsas de la carta |
| 15CM vs 30CM: cuánto más es | precios y gramajes de la carta |
| El menú secreto: lo que no se ve | número de pedidos para desbloquearlo (reglas) |
| Pide en grupo: con N, el más barato gratis | reglas del pedido grupal |
| El pedido más pedido de la semana | pedidos reales |
| Lo que dicen los clientes | calificaciones y reseñas reales (cuando existan) |

Cada día genera 1–2 videos, rota plantilla, producto, gancho y hora, y los publica en Reels
(Instagram + Facebook) y TikTok. **El sándwich generado se permite desde el 2026-10-07, fiel a la receta real** (antes era regla no hacerlo): el
movimiento y el texto son generados; la comida es la foto real.

---

## 3 · Más potente que las reseñas: tres bucles donde cada cliente trae al siguiente

Las reseñas siguen (automáticas, a todos, §4), pero no traen gente por sí solas. Esto sí:

### Bucle 1 · Rappi como embudo gratis hacia el canal propio
El acuerdo de **0% de comisión el primer mes** convierte a Rappi en adquisición sin costo: ahí ya
está la gente que busca comida en Trujillo. Cada bolsa que sale por Rappi lleva una tarjeta con
QR (impresa una sola vez): «Tu próximo pedido, directo en sndwch.app: [beneficio]». El QR lleva
`?src=rappi`, así que el sistema sabe cuántos clientes de Rappi pasaron al canal propio. Cuando
Rappi empiece a cobrar comisión, esos clientes ya piden directo.

### Bucle 2 · La tarjeta que el cliente comparte (sin grabar nada)
Al entregarse cada pedido, el sistema genera una imagen vertical personalizada («Mafe ya probó el
Philly Cheesesteak»), lista para su estado de WhatsApp o su historia de Instagram, con **su link**:
si un amigo pide con él, **los dos ganan** (premio derivado de las reglas, sin subirlo: la
evidencia dice que un premio mayor trae referidos peores). Cada pedido produce publicidad hecha
por el cliente, gratis.

### Bucle 3 · El pedido en grupo como motor de oficinas
Ya existe: con N sándwiches, el del organizador sale gratis. Un pedido grupal mete 4–6 personas
nuevas de una vez. El contenido empuja este formato a la hora del almuerzo (plantilla propia),
y el bucle 2 aplica a cada integrante del grupo.

---

## 4 · WhatsApp gratis

La API de WhatsApp **no cobra los mensajes de servicio** si la conversación la empieza el
cliente: durante 24 horas, todo lo que le respondes es gratis. Diseño:

- En el pedido, un botón «Sigue tu pedido por WhatsApp». Abre WhatsApp con un mensaje ya escrito
  («Hola, quiero seguir mi pedido ORD-…»). El cliente lo envía: **él abre la ventana gratis**.
- Dentro de esas 24 h, el sistema le manda solo: cada cambio de estado, la entrega, la **tarjeta
  para compartir** (bucle 2) y el **enlace de reseña de Google**. Todo gratis.
- Lo que NO es gratis: escribirle días después para que vuelva (son plantillas de marketing,
  pagadas). Eso **no se hace**. La recompra la llevan el contenido diario, Rappi y los bucles.
- Requisito único: un número del negocio conectado a la API de WhatsApp (configuración de una
  vez en Meta, sin costo).

---

## 5 · El sistema de análisis: decide solo, no hace reportes

Lo viejo era un reporte para que el dueño leyera. Lo nuevo es un **bucle cerrado**:

1. **Mide cada pieza**: cada video lleva su link con `?src=` propio. Instagram y TikTok dan por
   API reproducciones, guardados y compartidos; la app da visitas, carritos y pedidos por origen
   (hoy no se cuentan visitas: se agrega, sin datos personales).
2. **Decide**: cada semana reparte las próximas publicaciones entre plantillas, productos,
   ganchos y horas según lo que **trajo pedidos** (no likes). Lo que no funciona deja de salir;
   lo que funciona sale más (un «bandido»: explora un poco, explota lo que gana).
3. **Escala lo ganador**: el video que más pedidos trajo gratis pasa a ser el anuncio pagado (§6).
4. **Te avisa una sola cosa por semana**: pedidos, de dónde vinieron y cuánto costó cada cliente
   nuevo. Si no lees nada, igual sigue funcionando.

---

## 6 · Pauta: cuánto hace falta (el cálculo)

Números del propio modelo (`docs/NEGOCIO.md`):

| dato | valor |
|---|---|
| Lo que deja el primer pedido | ≈ S/13.6–16.4 |
| Lo que deja un cliente completo (2.41 pedidos según la industria, al 75% de confianza) | ≈ S/25–30 |
| Costo por cliente esperado en Meta (benchmarks, sin medir) | S/18–24 (rango S/10.5–25) |
| Compras para leer el costo real con algo de confianza | ~30 |

**Cuánto hace falta:**
- **Mes 1 (13 oct – 9 nov): S/0 en Meta durante los primeros 14 días.** Rappi a 0% de comisión y
  el contenido orgánico hacen la adquisición. Además, es la única forma de medir cuánta gente
  llega sola.
- **Prueba de medición desde el 27 oct: S/25/día × 14 días = S/350.** A S/18–24 por cliente,
  da 15–20 clientes: lo justo para una primera lectura del costo real.
- **Mes 2: se escala solo si el costo medido queda bajo ~S/25** (lo que deja un cliente
  completo). Ahí el sistema sube hasta el tope mensual que apruebes. Si el costo se pasa, pausa
  solo.
- Lo que **no** se intenta: que Meta «salga del aprendizaje» (50 compras por semana ≈ S/900–1,200
  semanales). No es la escala de este negocio todavía.

**Lo que te pido aprobar: S/350 para la prueba (27 oct – 9 nov).** Es plata real (regla 8).

---

## 7 · Tu ficha de Google: no aparece

Revisado hoy con la misma librería de Google que usa la app (`scripts/ficha-google.mjs`, workflow
«Revisar la ficha de Google»). Para «SND//WCH Trujillo», «SNDWCH Trujillo» y «SND WCH sandwich
Trujillo», Google devuelve solo competidores: King Sandwich, Don Pacho (3 locales), Xinona,
Centrica y La Casera (4.4 estrellas con 532 reseñas). **La ficha de SND//WCH no sale en ninguna
búsqueda.** Causas posibles: no está verificada todavía, o es de «área de servicio» sin dirección
pública (esas no aparecen en búsquedas por texto). Con el enlace de la ficha (en la app de Google
Business: «Compartir perfil») se revisa directo y se saca el enlace de reseñas.

---

## 8 · Qué se construye, en orden

1. **Medición** (visitas por origen, eventos completos a Meta): sin esto el bucle de análisis no
   tiene qué medir.
2. **Motor de video** (§2) conectado al publicador existente; TikTok cuando lo habilites.
3. **Bucle 2** (tarjeta para compartir) y **WhatsApp gratis** (§4) con reseña.
4. **Tarjeta de Rappi** (§3, bucle 1): el diseño, listo para imprimir.
5. **Análisis que decide** (§5).
6. **Pauta** (§6), el 27 de octubre, si apruebas los S/350.
7. Borrar lo obsoleto (rotador de textos, 16 recordatorios por push, gasto a mano).

## Fuentes

- [Meta · WhatsApp pricing](https://developers.facebook.com/docs/whatsapp/pricing) (ventana de servicio gratis).
- [Meta · Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing).
- [TikTok · Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post).
- [Malou · TikTok para restaurantes 2026](https://www.malou.io/en-us/blog/tiktok-for-restaurants).
- [Ipsos Perú · redes y compra](https://www.threads.com/@ipsosperu/post/DUEDWaikcXR/las-redes-sociales-hoy-son-un-canal-clave-para-descubrir-evaluar-y-comprar).
- [Meta · Advantage+](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns).
- Números del negocio: `docs/NEGOCIO.md` (techo de CAC, cadena de recompra).
