# Pagar lo menos posible por cada cliente (2026-10-09)

Dueño: «Necesito que investigues sobre anuncios, sobre analytics, etc., para bajar la pauta a lo
menos posible. Imaginando que la publicidad siempre me hace perder plata, el negocio está
condenado».

## Primero, la corrección: el negocio NO está condenado

**Ni siquiera depende de la publicidad.** Los clientes que llegan por Google, Instagram, Rappi,
PedidosYa o un amigo no cuestan nada de traer, y cada uno deja ~S/35 en su vida. La publicidad es
solo una forma más de traer gente, y conviene únicamente si traer a alguien cuesta menos de lo que
deja.

**Y el precio de Meta que usé estaba mal.** Había tomado S/11–45 por mil vistas («mercados
emergentes»). Las fuentes peruanas de 2026 dicen **S/5–12 para restaurantes**
([Ads Academy](https://adsacademy.pe/cuanto-cuesta-una-campana-de-facebook-ads-en-peru-2026/)), y un
promedio país de US$2.1–3.7 ([Fuelads](https://fuelads.tech/benchmarks-latam-2026),
[Adamigo](https://www.adamigo.ai/blog/meta-ads-cpm-cpc-benchmarks-by-country-2026)). Con eso,
`modelo/proyeccion.py` da:

| | antes | con precios de Perú |
|---|---|---|
| un cliente por Meta, el mes de prueba | S/100 (S/39–159) | **S/36 (S/23–52)** |
| sale a cuenta (≤ S/30) | 6% de los casos | **30%** |
| S/300 al mes desde diciembre | pierde en 9 de cada 10 casos | **gana en 56%** y marzo sube de S/968 a S/1,114 |
| S/600 al mes | pierde | gana en 51%; marzo S/1,229 |
| S/1,000 o más al mes | pierde | ya no conviene: Trujillo es chico y el cliente se encarece |

**Está casi parejo, y cada táctica de abajo lo inclina a favor.** Además, la tabla corta a los 6
meses: un cliente de marzo sigue pidiendo en abril, y eso no se ve aquí.

## Lo que ya tenemos (mucho de lo que recomiendan, ya está)

- **El embudo completo al píxel:** ver un producto, agregarlo al carrito, empezar el pago y comprar.
- **La compra también desde el servidor (CAPI)**, con correo, teléfono, nombre, las cookies `_fbp`
  y `_fbc`, IP y navegador, todo en clave. Meta reporta un costo por resultado 13–18% menor con
  CAPI y píxel juntos ([Meta Blueprint](https://bep.facebookblueprint.com/student/path/514683/activity/466137),
  [WeltPixel](https://weltpixel.com/blogs/news/meta-event-match-quality-emq-guide)).
- **Una compra se reporta solo cuando está pagada**, así que Meta no aprende a buscar pedidos que
  nadie pagó.
- **El origen de cada visita y cada pedido** (`?src=`), así se mide el costo por pedido real y no
  el de Meta.
- **El freno de la pauta**, que corta si el costo por cliente supera lo que deja.

## Lo que baja el costo, en orden de peso (con su evidencia)

1. **Radio corto: solo donde repartes, unos 4–5 km de la cocina.** En un caso de un restaurante,
   pasar de 24 a 6 km bajó el clic de US$2.30 a US$0.85
   ([DataLatte](https://datalatte.pro/blog/facebook-ads-restaurant-delivery-orders-guide)). Es la
   palanca más barata.
2. **Reels e Historias, no el feed.** Cuestan menos por vista
   ([Stackmatix](https://www.stackmatix.com/blog/facebook-ads-cost-per-impression)), y ahí van las
   piezas de Flow.
3. **Volver a mostrar el anuncio a quien ya miró y no pidió** (los eventos de vista y carrito de
   los últimos 30 días): es la audiencia más barata, porque ya te conoce
   ([Bloom](https://bloomintelligence.com/blog/restaurant-advertising-playbook/)).
4. **Un carrusel de sándwiches reales.** En un caso, un carrusel tuvo 2.8% de clics contra 1.5%
   de una imagen sola, y 47% menos de costo por pedido (anecdótico, DataLatte).
5. **Las horas que venden: 11:00–14:00 y 18:00–21:00.** El precio de la vista sube viernes y
   sábados (Ads Academy).
6. **Una campaña, un solo conjunto de anuncios.** Con S/350 Meta nunca junta las 50 compras por
   semana que necesita para aprender. Partirlo en varios conjuntos lo empeora
   ([AdManage](https://admanage.ai/blog/facebook-ads-learning-phase-guide)). Para la prueba, se
   optimiza por **«iniciar pago»**, que pasa varias veces más que la compra, y se juzga por el
   costo por **pedido pagado** medido con `?src=`, no por lo que diga Meta.
7. **Una oferta de primer pedido** (por ejemplo, la bebida gratis) **solo si tú la decides:** es
   plata. Recomiendan atar la oferta al anuncio. Hoy no hay ninguna aprobada.
8. **Anuncios a WhatsApp:** convierten más, pero exigen contestar en segundos. Sin bot propio, no
   por ahora.

## La prueba de noviembre, armada

| | |
|---|---|
| fechas | lunes 3 al domingo 30 de noviembre (después de 14 días sin pauta) |
| presupuesto | S/350 → ~S/12.50 por día, en una campaña con un solo conjunto |
| optimiza por | iniciar pago (se mide aparte el pedido pagado) |
| dónde | **solo Instagram**: Feed, Historias y Reels (dueño, 2026-10-09: «toda la publicidad y balas irán allí, Facebook actualmente está más usado con señores») |
| a quién | radio de 4–5 km de la cocina, 18–45 años, sin intereses (que Meta busque) |
| cuándo | 11:00–14:00 y 18:00–21:00 |
| piezas | 3: el carrusel de la carta, un Reel de Flow y la foto real del Philly |
| enlace | `sndwch.app/?src=meta-prueba` |

**Las reglas, el 1 de diciembre:**
- **Un cliente salió a S/30 o menos:** se sigue con S/300–600 al mes.
- **Salió entre S/30 y S/45:** se cambian piezas o radio y se prueba otra vez con S/150.
- **Salió a más de S/45:** no se pone un sol más. Se crece con Rappi, PedidosYa, Google,
  Instagram y referidos, que no cuestan.

## La campaña, armada (2026-10-09, dueño: «1 y 2 aprobados»)
En la cuenta `1488138326460689`, **en pausa / borrador, no gasta nada**:
- Campaña `120252427032810076` «SNDWCH · Prueba de noviembre (S/350)»: ventas, presupuesto total
  S/350, del 3 al 30 de noviembre.
- Conjunto `120252427034590076`: 5 km alrededor de la cocina (STORE_LAT/LON de `reglas.ts`),
  18–45 años como sugerencia, Reels e Historias de Facebook e Instagram, martes a domingo de
  11:00 a 14:00 y de 18:00 a 21:00, optimiza por **iniciar pago** con el píxel `1410494047274081`.
- **Faltan los anuncios**: se crean cuando Meta vincule @snd__wch. Sin el id de Instagram, un
  anuncio nunca sale en Instagram, y una pieza no se puede editar después de creada.

## Anuncio «almuerzo para la oficina» (2026-10-09, dueño: «Siii»)
Va como **4.ª pieza dentro del mismo conjunto** `120252427034590076`, no como conjunto aparte:
partir S/350 en dos conjuntos hace que Meta aprenda peor (regla 6). El conjunto ya cubre
11:00–14:00 dentro de 5 km; Meta le da más plata a la pieza que más vende. Pieza: encargo
`estudio/encargos/2026-11-03-oficina-1.md` (SANDO y WICHO entrando con bolsas a una oficina;
sándwiches envueltos, sin relleno a la vista). Texto sugerido: «¿Almuerzo para la oficina? Pide
4 y llegan juntos.» Se crea con las otras tres cuando Meta vincule @snd__wch.

## Solo Instagram (2026-10-09)
Dueño: «Lo importante va a ser Instagram, toda la publicidad y balas irán allí; Facebook
actualmente está más usado con señores». El conjunto `120252427034590076` quedó con
`publisher_platforms: instagram` y Feed + Historias + Reels (sigue en pausa).

## Audiencias creadas (2026-10-09, tras aceptar los términos)
- `120252435956920076` «Visitaron sndwch.app (30 días)» — píxel.
- `120252435957110076` «Iniciaron pago y no compraron (14 días)» — píxel; las más baratas.
- `120252435958900076` «Interactuaron con la página (90 días)» — Facebook; **no se usa** (el
  público es Instagram). Cuando Meta vincule @snd__wch se crea la de Instagram (`ig_business`).
Se llenan solas con el tráfico; no gastan nada hasta que haya pauta.

## Audiencias para bajar el costo (2026-10-09, dueño: «Si aprueba todo»)
Dos audiencias de retargeting, gratis hasta que se pauta: «visitaron sndwch.app (30 días)» e
«iniciaron pago y no compraron (14 días)», ambas del píxel `1410494047274081`. **Bloqueadas:**
Meta pide que el dueño acepte los términos de audiencias personalizadas en
https://www.facebook.com/customaudiences/app/tos/?act=1488138326460689 (error 2663). Aceptado
eso, se crean con `ads_create_custom_audience` (las reglas están en la sesión 2026-10-09).
Desde diciembre, con 100+ compradores reales: lista de clientes → audiencia parecida al 1%.

## El QR de la bolsa: bebida gratis (2026-10-09)
Código `WICHO` (antes WICHO) (tipo «bebida», tope S/6, una vez por celular). El QR del dorso de la bolsa lleva
a `sndwch.app/?grupo=1&src=bolsa&codigo=WICHO` y el dorso lo dice: «Tu primera vez en la web, la
bebida va gratis: código WICHO.» El checkout lo ofrece ya escrito (`docs/marketing/bolsa/`). Cuesta ~S/1.90 por
cliente que pasa de Rappi o PedidosYa a la web, donde cada pedido deja S/3.78 más.

## ¿Ventas a la web o a los mensajes de Instagram? (2026-10-09)
Dueño: «¿No debemos enfocarnos en la opción ventas con los ads? Casi nadie entrará a la web, todo
será por Instagram; luego por mensajes de Instagram o el perfil les damos la web y compran».
- La campaña **ya es de Ventas** (`OUTCOME_SALES`). La venta siempre se cierra en sndwch.app (es la
  única caja), así que la pregunta es si el anuncio lleva **directo** a la web o **primero** a
  los mensajes.
- **Directo a la web** (lo armado): el botón «Pedir ahora» abre sndwch.app **dentro de
  Instagram**; nadie sale de la app. Un paso menos, nadie tiene que contestar al instante, y Meta
  aprende de quién PAGA (píxel + CAPI con celular y correo). Quien en vez de tocar el botón entra
  al perfil, escribe y compra después, igual cuenta: Meta atribuye la compra hasta 7 días después
  del clic o 1 día después de ver el anuncio, y el `?src=` dice por dónde llegó.
- **A los mensajes**: Meta optimiza por conversaciones, no por compras; hay que contestar en
  minutos de 12 a 14 y de 18 a 21, y muchas conversaciones («¿precio?») no compran.
- **Plan**: noviembre sale como está (Ventas → web). Mientras tanto, el camino por mensajes se
  deja automático (abajo) y se mide con `?src=ig-dm` e `?src=ig-bio`. Si en noviembre las ventas
  vienen sobre todo por ahí y el costo por cliente a la web sale > S/30, en diciembre se prueba
  Ventas → mensajes de Instagram con S/150.

### Respuestas automáticas en los mensajes (las pega el dueño en Instagram)
Instagram → Configuración → Herramientas para empresas → **Preguntas frecuentes** (hasta 4):
- **¿Cómo pido?** → «Aquí, en un minuto y sin crear cuenta: sndwch.app/?src=ig-dm — eliges, pagas
  con Yape o tarjeta y te avisamos cuando sale.»
- **¿Llegan a mi zona?** → «Pon tu dirección en sndwch.app/?src=ig-dm y te dice al toque si
  llegamos y cuánto es el envío.»
- **¿Qué hay hoy?** → «La carta con precios, al día: sndwch.app/?src=ig-dm . Abrimos de martes a
  domingo.»
Enlace de la bio: `sndwch.app/?src=ig-bio`.
