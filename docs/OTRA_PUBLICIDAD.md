# Publicidad de otros tipos (2026-10-15, noche)

Dueño: «No, eso ya es muy invasivo [la pregunta «¿cómo nos conociste?»]. Veamos otras cosas que
más hacer. Publicidad de otros tipos, necesitamos llegar a esa meta».

Lo que no cambia: sin volantes, nada presencial, sin conocer a nadie, sin tocar precios,
degustaciones después del mes 6. **Todo lo de aquí se prende y se apaga desde el celular o la
computadora, y es gasto real: nada se prende sin tu sí.**

Cifras ANTES de tu sueldo (como en `docs/META_6000.md`). Simulación: `python3 modelo/meta_6000.py`
(400 corridas, parámetro `canales` de `modelo/proyeccion.py`). Aún no hay un solo pedido real.

## La respuesta corta

1. **Hay tres anuncios, además de Meta, que el modelo dice que sí pagan**: los de **dentro de
   Rappi**, los de **dentro de PedidosYa** y los de **Google** (búsqueda y Maps). Juntos,
   **S/800 al mes**.
2. **Con ellos, S/6,000 sostenidos llegan en el mes 6 en vez del mes 10** (si Meta cuesta lo que
   supone el modelo, ~S/36 por cliente). Si Meta cuesta lo que dicen las fuentes (~S/21): mes 5.
3. **Sin Meta no alcanza**: con solo esos tres, el mes 12 deja ~S/5,700. Meta sigue siendo
   necesario; estos tres lo complementan.
4. **TikTok sí, pero gratis** (los mismos videos). Pagado cuesta el doble que Meta por cliente y
   no adelanta la meta.
5. **Lo que sigue decidiendo todo es que vuelvan.** Si la recompra no mejora, ni con todo esto
   se llega en 12 meses.

## Por qué estos tres funcionan mejor que un anuncio cualquiera

Meta le muestra el anuncio a alguien que **no estaba pensando en comer**: por eso solo ~1.5–1.9%
de los que hacen clic compran. Estos tres aparecen **cuando la persona ya decidió comer y está
eligiendo qué**:

- Quien abre Rappi va a pedir comida, pero **solo el 3% sabe qué va a pedir** (gerente de Rappi
  Ads). El anuncio sale arriba justo cuando está eligiendo.
- Quien busca «sándwich delivery Trujillo» en Google ya quiere uno.

## Los canales, uno por uno

| canal | qué es | cuánto | costo por cliente que supone el modelo | desde | qué haces tú | qué hago yo |
|---|---|---|---|---|---|---|
| **Anuncios dentro de Rappi** | SND//WCH sale arriba en la búsqueda, en la lista y en «Mis favoritos»; pagas por clic | **S/300 al mes** (S/10 al día); Rappi no publica el precio del clic | S/15 [SUPUESTO] | 3-nov (con las primeras calificaciones) | prenderlo en el portal de aliados de Rappi, sección de anuncios (~10 min, una vez) | la guía paso a paso y mirar cada semana el costo por pedido |
| **Anuncios dentro de PedidosYa** | lo mismo en PedidosYa | **S/200 al mes** («desde S/200», a confirmar en el portal) | S/15 [SUPUESTO] | 1-dic (el alta es el 17-nov) | prenderlo en el portal de socios (~10 min, una vez). **Ojo**: no aceptar la «posición destacada» que sube la comisión al 35%; esa comisión se paga en TODOS los pedidos | la guía y el seguimiento |
| **Google (búsqueda y Maps)** | sale a quien busca sándwich o delivery en Trujillo; pagas por clic (S/0.40–3 en Perú) | **S/300 al mes** (S/10 al día); hay pocas búsquedas, no absorbe más | S/20 [SUPUESTO] | 3-nov | crear la cuenta de Google Ads con tu correo y poner la tarjeta (~15 min, una vez) | todo lo demás: la configuración lista para pegar (abajo) y el seguimiento |
| TikTok | los mismos videos del Estudio | **gratis** | — | ya | subirlos (~5 min al día) | los videos ya salen solos |
| TikTok pagado | — | mínimo ~S/20 al día | ~S/80 [SUPUESTO] | **no** | — | — |

Por qué esos costos por cliente: Rappi y PedidosYa no publican el precio del clic. El supuesto es un
clic de ~S/1 y que 1 de cada 10 que entran a tu tienda desde el anuncio pide (en la app ya van a
comer) y que la mayoría son nuevos: ~S/15. En Google: clic ~S/1 y 1 de cada 20 pide en tu app:
~S/20. En TikTok: mil vistas cuestan S/11–30 (Meta S/5–14) con el mismo clic y la misma compra que
Meta: ~S/80. **Son supuestos: el primer mes de cada uno da el número real**, y abajo está qué se
hace con él.

## Las cifras

| | mes 3 | mes 6 | mes 12 | S/6,000 sostenidos desde | llega en el mes 12 (de 100 casos) | tus horas a la semana, mes 6 |
|---|---|---|---|---|---|---|
| desde casa, sin publicidad pagada | S/2,491 | S/2,987 | S/3,706 | nunca | 10 | ~13 |
| solo los tres anuncios (S/800), sin Meta | S/2,627 | S/4,059 | S/5,718 | no en 12 meses | 46 | ~18 |
| solo Meta S/2,500, cliente a ~S/36 (el plan de antes) | S/2,328 | S/4,364 | S/6,551 | mes 10 | 55 | ~20 |
| **los tres + Meta S/2,500, cliente a ~S/36** | **S/2,820** | **S/6,024** | **S/7,923** | **mes 6** | **77** | ~24 |
| los tres + Meta S/1,500, cliente a ~S/21 | S/3,874 | S/7,570 | S/9,808 | mes 5 | 96 | ~26 |

Con «los tres + Meta a ~S/36», si algo sale peor:

| | mes 6 | mes 12 | S/6,000 desde |
|---|---|---|---|
| si los tres anuncios cuestan el DOBLE por cliente | S/4,820 | S/6,812 | mes 8 |
| + TikTok pagado (S/600 al mes) | S/5,925 | S/7,847 | mes 7 (peor que sin él) |
| + ayudante cuando pase de ~20 pedidos al día (febrero, S/1,400) | S/4,788 | S/7,378 | mes 8 |
| si la recompra no mejora | S/3,740 | S/5,084 | **nunca** |

**Las horas**: en el mes 6 serían ~23 pedidos al día, ~24 horas tuyas a la semana armando (además
del banco). Es el costo de llegar en el mes 6. Con ayudante desde febrero lo tuyo baja a ~5 horas,
pero la meta se mueve al mes 8. Eso se decide en enero, con los pedidos reales.

## Cuándo se mira y qué se hace

| fecha | se mira | si va bien | si no |
|---|---|---|---|
| **3-nov** | — | si dijiste sí: prendes Rappi y Google a S/10 al día cada uno | — |
| **17-nov** | la prueba de Meta (ya estaba) | — | — |
| **1-dic** | Rappi: el panel dice cuánto gastaste y cuántos pedidos trajo el anuncio. Google: los pedidos con origen `google-ads` del correo del domingo | **menos de S/20 por pedido**: sigue, y prendes PedidosYa | S/20–35: baja a S/5 al día · **más de S/35**: se apaga |
| 5-ene | lo mismo con PedidosYa | menos de S/20: sigue | más de S/35: se apaga |

## Google: la configuración lista para pegar

- **Cuenta**: Google Ads con tu correo, en modo experto (no «Smart»), sin campaña de Performance
  Max. Moneda: soles. Zona horaria: Lima.
- **Campaña de búsqueda**, solo red de búsqueda (sin «red de display»), presupuesto S/10 al día,
  «maximizar clics» con tope de S/1.50 por clic el primer mes.
- **Dónde**: Trujillo y los distritos donde reparten los motorizados; «personas en la zona» (no
  «interesadas en la zona»).
- **Cuándo**: martes a domingo, de 11:00 a 21:30.
- **Palabras** (concordancia de frase): «sándwich trujillo», «sanguchería trujillo», «sánguches
  trujillo», «sandwich delivery», «delivery trujillo», «comida a domicilio trujillo», «almuerzo
  delivery trujillo», «cena delivery trujillo».
- **Palabras negativas**: receta, cómo hacer, preparar, trabajo, empleo, gratis, curso.
- **Enlace**: `https://sndwch.app/?src=google-ads` (así cada pedido queda contado en el correo
  del domingo).
- **Textos del anuncio**: sin precios (un precio escrito a mano envejece; los precios están en la
  app). Los escribo yo cuando digas sí.
- **Maps**: vincular tu perfil de Google Business (ya está) a la cuenta de Google Ads, para que el
  anuncio salga también en Maps.

## Lo que no cuesta y suma (no está en las cifras)

- **Grupos de Facebook de Trujillo** (delivery, compra y venta, emprendedores): publicar el video
  del día 2–3 veces por semana, desde el celular (~10 min a la semana).
- **YouTube Shorts**: los mismos videos (~2 min al día).
- **Google Business**: una foto a la semana y contestar cada reseña.

## Para después, o para que tú decidas

- **Una publicación pagada en una página grande de Trujillo** (de noticias, de memes, de «qué
  comer»): la página publica TU video; no prueban nada, así que no es una degustación. Nano y micro
  creadores en Perú cobran ~S/60–350 por pieza (Publifyer, en Mercado Negro). Prueba de una sola
  vez: ~S/150 con su propio enlace (`?src=pagina-<nombre>`); si trae 6 clientes o más, se repite.
  Tú le escribes a la página por mensaje; yo preparo el video y el enlace.
- **Creadores de comida que reseñan**: tienen que probar el sándwich. Por tu regla, eso es una
  degustación: **después del mes 6**, salvo que digas que un creador pagado no cuenta.

## Lo que se descartó y por qué

- **TikTok pagado**: cuesta el doble que Meta por cliente y el modelo dice que no adelanta la meta.
  Se vuelve a mirar si Meta se satura.
- **La «posición destacada» de PedidosYa**: sube la comisión de todos los pedidos.
- **Radio, paneles, revistas, volantes**: caros, sin forma de medir qué pedido trajeron, o
  presenciales.

## Fuentes

- Rappi: [Rappi Ads](https://merchants.rappi.com/es-pe/ads),
  [marketing para aliados](https://merchants.rappi.com/es-pe/marketing),
  [promociones 2026](http://promos.rappi.com/peru/promocionesrest2026),
  [«solo el 3% sabe qué va a ordenar»](https://www.valoraanalitik.com/rappi-entrevista-con-general-manager-de-ads-solo-3-clientes-sabe-pedido/).
- PedidosYa: [centro de socios](https://centrodesocios.pedidosya.com/pe/blog/tres-formas-en-que-pedidosya-impulsa-el-crecimiento-de-tu-restaurante-socios-creditos-y-plus/),
  [comisiones y anuncios en Perú](https://www.panca.pe/blog/comisiones-apps-delivery-peru-comparativa).
- Google: [kom.pe](https://kom.pe/presupuesto-google-ads-landing-page-peru/),
  [Consigue Ventas](https://consigueventas.com/cuanto-cuesta-anunciar-en-google-ads-en-peru/),
  [ads.com.pe](https://ads.com.pe/google-ads-precio/),
  [PPC Chief, restaurantes](https://ppcchief.com/google-ads-cost/restaurants).
- TikTok: [Paradero Digital](https://www.paraderodigital.pe/precios-costos-de-publicidad-en-tiktok-peru/),
  [Flama Creators](https://flamacreators.com/cuanto-cuesta-tiktok-ads-peru),
  [Somos Itera](https://somositera.com/cuanto-cuesta-publicidad-tiktok-ads/).
- Creadores: [Mercado Negro](https://mercadonegro.pe/noticias/cuanto-cuesta-contratar-a-un-influencer-en-peru).
