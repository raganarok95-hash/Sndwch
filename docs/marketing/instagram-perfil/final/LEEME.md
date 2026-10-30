# El Instagram de SND//WCH: versión final (2026-10-30)

Dueño: «Dame la versión bien pensada, analizada y con respaldo en estudios del feed de Instagram».
Maqueta: `perfil-final.jpg`. **Aprobado por el dueño el 2026-10-30** («Aprobado, ahora sigamos con el token de Instagram»).

## El concepto: «Dos formas de comer SND//WCH»

El logo oficial es una cara partida entre dos hermanos, y el perfil repite esa partición:
- **El lado de SANDO son los Signatures, los seis de la casa.** Van con su oliva acanalado, su verde y su forro naranja.
- **El lado de WICHO es «arma el tuyo» y cómo pedir.** Va con su celeste, sus curvas de nivel y su espiral.

Quien entra entiende en segundos que puede elegir uno de la casa o armar el suyo. Los hermanos aparecen con sus
**poses oficiales**, siempre en su lado y **nunca encima de la comida**. El WICHO generado se descartó:
«lo modificaste demasiado».

## El perfil

| campo | texto | por qué |
|---|---|---|
| Foto | El logo oficial, con el fondo partido igual que su cara | Las caras captan la atención aun en chiquito (Theeuwes y Van der Stigchel, 2006). Es el mismo logo de la app |
| Nombre | SND//WCH · Sándwiches a domicilio | El buscador de Instagram lee el nombre del perfil |
| Categoría | Restaurante de sándwiches | |
| Biografía | Sándwiches de pan largo, al estilo americano. / Elige uno de la casa o arma el tuyo. / A domicilio en todo Trujillo. | Qué es, las dos formas y hasta dónde llega. Dos opciones claras ayudan a decidir (Iyengar y Lepper, 2000). La fecha se agrega cuando haya día |
| Enlace | `https://sndwch.app/?src=ig-bio` | Mide cuántos llegan desde el perfil |
| Botones | Mensaje y WhatsApp | El peruano compra más por WhatsApp que por otras redes (Ipsos Perú) |

**Destacados, en el orden en que un cliente nuevo duda** (actualizado el 2026-10-30; dueño: «la de zonas no me convence,
además como que falta destacado»). Instagram muestra unos cinco sin deslizar; el sexto se ve al deslizar:
1. **Cómo pedir** (WICHO): los 4 pasos.
2. **Carta** (SANDO): los seis Signatures.
3. **Arma el tuyo** (WICHO, en su tinta): el pan, la proteína y lo de encima. Es la otra mitad del concepto y faltaba.
4. **Envíos** (la bolsa kraft con el //): todo Trujillo, y el envío según la distancia con una boleta sin cifras.
5. **Horario** (un reloj en las 11 con el arco hasta las 22), separado de Envíos por pedido del dueño («Horario como
   destacado propio»): la semana, con el lunes de descanso. Sale de `STORE_HOURS`.
6. **Bebidas** (la lata): las de la casa, con «Próximamente».

**Las portadas y las historias, sin personajes: «un sándwich es capas»** (2026-10-30, dueño: «No necesitas usar a SANDO
y WICHO para todo, solo estás usando lo que ya tienes, sé creativo»). Se dibujan con objetos planos del mundo del
sándwich (las funciones de dibujo van al inicio de `final.cjs` e `historias.cjs`), siempre de pan largo y nunca como hamburguesa:
- Cómo pedir: el celular con un toque.
- Carta: el sándwich cerrado.
- Arma el tuyo: las capas sueltas.
- Envíos: la bolsa kraft con el sello //.
- Bebidas: la lata.

Los hermanos quedan descompuestos en los fondos (el acanalado y el forro de SANDO; las curvas, la espiral y el celeste de
WICHO). Dibujado, solo queda el logo de la foto de perfil.

**No hay «Zonas».** Dueño: «nuestra zona es todo Trujillo». El envío no tiene límite desde el 2026-09-30
(«mi proveedor de delivery no tiene límites de envío», `reglas.ts`).

## El feed: qué se publica y por qué

| decisión | qué logra | en qué me baso | cómo lo mido |
|---|---|---|---|
| **Fijar dos carruseles:** la carta (una lámina por Signature) y arma el tuyo (pan, proteína, lo de encima) | El carrusel es el formato con más interacción por publicación | Socialinsider, informe 2025 (datos de 2023-2024): carrusel 0.55%, Reels 0.50%, foto sola 0.45% | Guardados y envíos de cada carrusel |
| **Un Reel al centro** («Los seis de la casa», hecho con las fotos) **y uno por semana grabado por ti** | Es lo que más llega a gente que todavía no te sigue | Mosseri, «Instagram Ranking Explained» (2023) y declaraciones de 2025: tiempo visto, «me gusta» y envíos por alcance | Alcance en no seguidores |
| **Caras: los hermanos en sus piezas y tus manos o tu cara en los Reels** | Las fotos con caras reciben más «me gusta» y comentarios | Bakhshi, Shamma y Gilbert, CHI 2014 (1.1 millones de fotos de Instagram): 38% más «me gusta» y 32% más comentarios. Eran caras humanas; para dibujos es una extrapolación | Comentarios por publicación |
| **3 a 5 publicaciones por semana**, sin saltarse ninguna | Los seguidores crecen el doble que con 1 o 2. Saltarse una semana frena el crecimiento | Buffer, 2.1 millones de publicaciones de 102 mil cuentas. Es correlación, no prueba | Seguidores nuevos por semana |
| **Cada Signature en su lugar y a su hora**, listo para comer | Abre el hambre y hace que la mente «lo pruebe» | Elder y Krishna, 2012; Spence y otros, 2016; Orlando Wood, 2019 | Guardados y compartidos |
| **El titular es el momento** («Hoy no cocinas», «El almuerzo que no te tumba la tarde») | Dice cuándo pedirlo | Las palabras de momento, temperatura y textura vuelven más atractiva la comida (Papies, 2013) | Comparar titulares de momento contra titulares descriptivos |
| **El texto en la franja de abajo, nunca sobre la comida** | La comida se ve entera y el texto se lee de un vistazo | Lo fácil de leer genera confianza (Reber, Schwarz y Winkielman, 2004) | — |
| **Piezas para mandar:** la carta y arma el tuyo sirven para decidir con alguien | Instagram reparte más lo que la gente se manda por mensaje | Mosseri, 2025 | Envíos por alcance |
| **Diseño para el recorte 3:4** | Nada importante se corta en la cuadrícula | Instagram cambió la cuadrícula a 3:4 en enero de 2025 (Kapwing, Planoly) | — |
| **Lo mismo en Facebook** | Llega a más gente | Perú urbano: el 84% de quienes usan redes está en Facebook y el 46% en Instagram (Ipsos Perú, 2022) | Alcance de cada red |
| **Sin fecha y sin precios en las imágenes** | Una imagen publicada no se corrige; el día de apertura todavía no está confirmado. Abajo de cada pieza va `SNDWCH.APP` | Dueño, 2026-10-30: «no pongas que abrimos en noviembre en las imágenes» | — |

**Lo que no tiene estudio** y se mide en la práctica:
- el orden de los destacados;
- el concepto de los dos lados;
- que las texturas de los hermanos se reconozcan.

## Las 9 primeras y los carruseles

| | 1 | 2 | 3 |
|---|---|---|---|
| fijadas | Philly | La carta, carrusel de 7: portada y `carrusel-carta-2…7` | Arma el tuyo, carrusel de 4: portada y `carrusel-arma-2/3/4` |
| | Meatball | Reel «Los seis de la casa» | Turkey |
| | Tuna Melt | Italian Hoagie | Classic Tuna |

## El ritmo después: 3 a 5 por semana

- **Lunes:** un carrusel. Puede ser un Signature con su porqué o armar el tuyo de una forma nueva.
- **Miércoles:** un Reel tuyo de la cocina. La comida en el primer segundo, de 10 a 15 segundos.
- **Viernes:** un Signature en su momento: la cena del viernes.
- **Historias todos los días:** encuestas («¿cuál pruebas primero?») y la cuenta regresiva cuando haya fecha.

## Los Signatures, versión C (2026-10-30)

Dueño: «a las fotos de sándwich les falta algo» y «falta el poder pedir por WhatsApp donde les pasamos igual la web».
Entre tres opciones eligió **C: más cerca**:
- **El sándwich llena el cuadro:** la foto entra al 128 % y cada una con su encuadre, para que el pan no toque el borde.
  No hay un estudio directo detrás; es práctica de fotografía de comida.
- **El nombre del sándwich es el titular** y el momento va debajo («Hambre en serio. Tan jugoso que no lleva salsa.»).
  Un nombre descriptivo vende más (Wansink, Painter y van Ittersum, 2001).
- **«Pide por WhatsApp» con el número** y el logo oficial como sello. El número sale del código
  (`src/app/01-catalogo-y-estado.ts`), y los textos terminan con «Pide por WhatsApp al … o en sndwch.app».
  Antes de abrir, el chat responde con la web.

## El Reel «Los seis de la casa» (`reel-los-seis-de-la-casa.mp4`)

15,6 segundos, 1080 × 1920, sin música: Instagram no deja agregarla a un Reel publicado por sistema, así que sale
en silencio. Si quieres música, súbelo tú desde la app con el audio que elijas.
- **0 s:** la portada, con los seis en mosaico. Es el primer cuadro, y la API lo toma como portada, así que
  la comida está en el primer segundo.
- **0,8 s:** cada Signature, 1,6 s. La foto va entera abajo y el texto en la basta de SANDO, arriba, fuera
  de lo que tapan los botones.
- **10,4 s:** el corte. Las dos barras del logo cruzan y abren el lado de WICHO. Es el único // del video.
- **10,8 s:** «O arma el tuyo».
- **13,4 s:** el logo oficial y sndwch.app.

«Así se arma un Philly» queda para el primer Reel que grabes tú.

## Las historias de los destacados (`historias/`)

Un destacado se arma con historias publicadas. Cada uno vive en el mundo de su hermano:

| destacado | historias | sale |
|---|---|---|
| Envíos | 2: todo Trujillo y el envío por distancia | ya |
| Horario | 1: la semana, con el lunes de descanso | ya |
| Arma el tuyo | 3: el pan, la proteína y lo de encima | ya |
| Carta | 6: un Signature por historia | ya |
| Cómo pedir | 4: los pasos | ya (dueño: «Quítale el próximamente, solo las bebidas deben tener el próximamente») |
| Bebidas | 3: The Bloom, Cold Brew Tea y The Cool en su lata, con «Próximamente» | ya: al abrir salen en botella (dueño, 2026-10-24), y la etiqueta dice que la lata todavía no llega |

## Cómo se publica solo

`publicar.json` tiene cada pieza en el orden de subida (de abajo hacia arriba), con su texto y cuándo sale.
Los textos no invitan a pedir (`invitaAPedir()`) y no llevan cifras.
1. **Cargar:** el workflow «Subir el Instagram final» (`subir-perfil.yml`) sube todo al bucket y lo deja como
   borrador en el calendario. También bloquea los borradores del lanzamiento anterior (`docs/marketing/lanzamiento`),
   que este reemplaza.
2. **Publicar:** con el token de Instagram arreglado (`scripts/meta/INSTAGRAM_EN_CHROME.md`) y verificado con
   `estado-apertura.yml`, se corre el mismo workflow con `publicar = si`. Las 24 quedan programadas
   cada 5 minutos, y el cron (cada 15) las publica en orden.
3. **A mano, en el celular:**
   - la foto de perfil, el nombre y la biografía;
   - fijar Arma el tuyo, la carta y el Philly;
   - armar los destacados desde las historias, con las portadas `destacado-*.jpg`.

   La API de Instagram no hace nada de esto.

Instagram pone lo más nuevo arriba, por eso se publica de abajo hacia arriba:

1. Classic Tuna.
2. Italian Hoagie.
3. Tuna Melt.
4. Turkey.
5. El Reel.
6. Meatball.
7. Arma el tuyo.
8. La carta.
9. Philly.

Para regenerar (el Reel primero, porque la cuadrícula usa su portada):
`FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh)`, y después `node` con `reel.cjs`, `final.cjs` e `historias.cjs`,
de esta carpeta. El Reel necesita `FFMPEG` (o `ffmpeg` en el PATH).

## Fuentes

- Socialinsider, Instagram Benchmarks 2025: socialinsider.io/data-geeks/instagram_benchmarks_2025.pdf
- Bakhshi, Shamma y Gilbert, «Faces Engage Us», CHI 2014: news.gatech.edu (2014-03-20)
- Buffer, «How Often Should You Post on Instagram» (2.1 millones de publicaciones): buffer.com/resources/how-often-to-post-on-instagram
- Mosseri, «Instagram Ranking Explained» (2023); sobre los envíos: searchenginejournal.com
- Ipsos Perú: compras por WhatsApp (ipsos.com/es-pe/node/724226) y uso de redes (ipsos.com/es-pe/node/464646)
