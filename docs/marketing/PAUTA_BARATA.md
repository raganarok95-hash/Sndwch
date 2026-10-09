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
| dónde | Reels e Historias de Instagram y Facebook |
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

## Audiencias para bajar el costo (2026-10-09, dueño: «Si aprueba todo»)
Dos audiencias de retargeting, gratis hasta que se pauta: «visitaron sndwch.app (30 días)» e
«iniciaron pago y no compraron (14 días)», ambas del píxel `1410494047274081`. **Bloqueadas:**
Meta pide que el dueño acepte los términos de audiencias personalizadas en
https://www.facebook.com/customaudiences/app/tos/?act=1488138326460689 (error 2663). Aceptado
eso, se crean con `ads_create_custom_audience` (las reglas están en la sesión 2026-10-09).
Desde diciembre, con 100+ compradores reales: lista de clientes → audiencia parecida al 1%.

## El QR de la bolsa: bebida gratis (2026-10-09)
Código `BOLSA` (tipo «bebida», tope S/6, una vez por celular, campaña `qr-bolsa`). El QR lleva a
`sndwch.app/?src=qr-bolsa&codigo=BOLSA`: el checkout lo ofrece ya escrito. Cuesta ~S/1.90 por
cliente que pasa de Rappi o PedidosYa a la web, donde cada pedido deja S/3.78 más.
