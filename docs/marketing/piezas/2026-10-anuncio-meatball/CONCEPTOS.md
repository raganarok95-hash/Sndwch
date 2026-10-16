# Conceptos · 2026-10-anuncio-meatball

> Creativo, 2026-10-16 (paso 2 de `/pieza`). La idea («Hoy no cocinas.») y la foto
> (`docs/marketing/anuncios/fotos/foto-meatball.jpg`) ya las aprobó el dueño. Aquí no cambia la idea:
> son tres formas de contarla en la imagen, sin franja, marco, banda ni precio.

## Qué falló en la v2, además de la franja

La v2 (`docs/marketing/anuncios/meatball-feed.jpg`, `meatball-vertical.jpg`) tenía:

- la franja naranja;
- un segundo velo abajo, y el precio dentro de un recuadro de papel (otro bloque de color);
- «· TRUJILLO»;
- una frase de ingredientes donde podía hablar SANDO.

Y era el mismo cuadro que el Philly y el Turkey.

## Lo que vale para los tres conceptos

- **La foto**: la aprobada, y el sándwich no se toca. Es casi 4:5. Lo que tiene:
  - la noche: una lámpara cálida y desenfocada arriba a la izquierda y el cuarto oscuro;
  - a la izquierda, un plato, una servilleta y un tenedor, desenfocados;
  - a la derecha, el vaso de The Bloom con su sorbete;
  - el sándwich abajo al centro, sobre kraft, y la madera.
- **Dónde cae en el 4:5 (1080×1350), aprox.**
  - Halo de la lámpara: x 160–440, y 0–340.
  - Plato: x 80–620, y 380–515.
  - Vaso: x 760–1030, y 230–810. Su sorbete sube hasta la esquina de arriba a la derecha.
  - Sándwich: x 150–860, y 550–1030. El borde de arriba del pan va de ~(280, 550) a ~(820, 630).
  - Abajo: kraft al centro y madera en las dos esquinas.
- **El limón del vaso.** La rodaja no es parte de The Bloom (jamaica y canela). Propuesta: se borra
  de la foto. Es quitar, no agregar, y el sándwich no se toca. **Calidad decide** (brief).
  - Los tres conceptos mantienen el vaso: es el objeto de la noche (estilo, regla 1).
  - No se nombra. Si el texto lo nombra, va como «The Bloom // Hibiscus» y sin sugerir que viene
    incluido.
- **El 9:16 (1080×1920)**: la foto va a lo ancho. El fondo se extiende hacia arriba (más cuarto
  oscuro y lámpara) y hacia abajo (más madera) con el mismo modelo que la generó. Se extiende
  **solo el fondo**, y el sándwich no se toca.
- **Zonas del 9:16**: nada de texto en los 269 px de arriba ni de y 1248 para abajo.
- **El texto va en papel.** Lo oscuro de arriba es la zona tranquila natural. El velo (uno, solo
  donde hay texto) hace falta solo donde el texto cae sobre el halo de la lámpara o el plato, y
  nunca toca el pan.
- **Las tres voces**:
  - Anton para el titular: «Hoy no cocinas.», literal.
  - Instrument Serif itálica para SANDO o la carta.
  - IBM Plex Mono para el producto y «PIDE EN SNDWCH.APP».
  - El nombre sale de la carta (`carta.ts` → `datos.ts`).
  - Sin precio (brief) y sin «Trujillo».
- **El anuncio también sale al mediodía.** «Hoy no cocinas» se lee igual a esa hora: es la decisión
  de la cena.
- Las posiciones en px son de referencia: el Director de arte las ajusta en la maqueta.

## 1 · Abrir: 12 ejecuciones, sin juzgar

1. **Hoy sí cocino, tachado** *(la tensión)*: arriba, chico y tachado, «HOY SÍ COCINO.»; debajo,
   grande, «HOY NO COCINAS.», y firma SANDO.
2. **Detrás del pan** *(el producto)*: «HOY NO / COCINAS.» en lo oscuro de arriba, con el pan
   delante tapándole el pie.
3. **Ya está** *(los hermanos)*: el sobrio. El titular en lo oscuro y SANDO que cierra con su
   frase.
4. **HOY NO / [pan] / COCINAS.** *(la marca: el corte del pan)*: la frase partida por el sándwich.
5. **La mesa puesta** *(el momento)*: un recorte ancho que deja ver el plato, el tenedor y la
   servilleta: la mesa lista sin haber cocinado.
6. **La lámpara** *(el momento)*: el titular dentro del halo de la lámpara.
7. **Las dos manos** *(el producto)*: de cerca, las albóndigas y el queso, con «De los que se comen
   con las dos manos.»
8. **La pareja** *(el dato)*: el vaso nombrado: «The Bloom // Hibiscus», que se pide aparte.
9. **HOY NO gigante** *(la tensión)*: «HOY NO» enorme y «cocinas.» chico: la decisión es el NO.
10. **Sin vaso** *(la verdad)*: un recorte que deja fuera el vaso y su limón; el sándwich solo en
    la noche.
11. **¿Cocinas hoy? / No.** *(lo nativo, Reels)*: secuencia en 9:16.
12. **El plano de la noche** *(el momento)*: plano ancho con la lámpara, la mesa y el vaso; el
    sándwich chico.

## 2 · Cerrar: la rúbrica (AGENCIA.md §4)

Las columnas: Br = Brief · Mo = Momento · Ma = Marca a los 2 s · Ga = Gancho · Co = Contagio ·
Pe = Pedible · Ve = Verdad · Se = Serie.

Pasa con 30 o más y Verdad en 4 o 5. La Verdad está en 4 en todos los que mantienen el vaso: falta
que Calidad resuelva el limón.

| # | ejecución | Br | Mo | Ma | Ga | Co | Pe | Ve | Se | total | |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Hoy sí cocino, tachado | 4 | 5 | 4 | 5 | 4 | 4 | 4 | 4 | **34** | **A** |
| 2 | Detrás del pan | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | **32** | **B** |
| 3 | Ya está | 5 | 5 | 4 | 3 | 2 | 4 | 4 | 4 | **31** | **C** |
| 4 | HOY NO / [pan] / COCINAS. | 5 | 3 | 4 | 4 | 3 | 4 | 4 | 5 | 32 | pasa, no va |
| 5 | La mesa puesta | 5 | 4 | 3 | 2 | 2 | 4 | 4 | 3 | 27 | |
| 6 | La lámpara | 5 | 5 | 3 | 3 | 2 | 4 | 4 | 3 | 29 | |
| 7 | Las dos manos | 4 | 2 | 3 | 4 | 2 | 4 | 3 | 3 | 25 | |
| 8 | La pareja | 3 | 3 | 3 | 2 | 3 | 5 | 5 | 3 | 27 | |
| 9 | HOY NO gigante | 4 | 3 | 3 | 4 | 3 | 4 | 4 | 3 | 28 | |
| 10 | Sin vaso | 5 | 3 | 3 | 3 | 2 | 4 | 5 | 3 | 28 | |
| 11 | ¿Cocinas hoy? / No. | 2 | 4 | 3 | 3 | 3 | 4 | 5 | 4 | 28 | |
| 12 | El plano de la noche | 4 | 5 | 3 | 2 | 2 | 3 | 4 | 3 | 26 | |

**Por qué quedan fuera los que no pasan:**
- **5** (la mesa puesta): el plato está desenfocado y no se lee como «mesa lista».
- **6** (la lámpara): el papel sobre el halo de la lámpara no tiene contraste.
- **7** (las dos manos) agranda la foto y parece más relleno.
- **8** (la pareja) vende la bebida y no el momento.
- **9** (HOY NO gigante) rompe el titular en dos tamaños sin ganar nada.
- **10** (sin vaso) resuelve el limón, pero pierde el objeto de la noche.
- **11** (¿Cocinas hoy? / No.) cambia el titular y su primer cuadro no tiene comida.
- **12** (el plano de la noche) deja el sándwich chico.

**El 4 pasa pero no va.** «COCINAS.» debajo del sándwich cae sobre kraft claro y madera oscura
mezclados, así que pediría un segundo velo, y en el 9:16 no entra antes de la zona de los botones.
Además, partir la frase con el sándwich es el recurso del Turkey, donde significa la tarde.

## 3 · Los tres conceptos

### A · «Hoy sí cocino» (el claramente distinto · recomendado)

**El concepto.** Lo que te dices a ti mismo, tachado. Arriba, chico y tachado, «HOY SÍ COCINO.».
Debajo, grande, «HOY NO COCINAS.» y la firma «— SANDO». SANDO te corrige y decide por ti: «no
pienses, ya está resuelto» (AGENCIA §2.2).

**Qué se ve primero.** La línea tachada: es rara y el ojo se detiene. Enseguida, la respuesta
grande. Después, el sándwich caliente, que es la prueba.

**Lo que se ve en 4:5 (1080×1350)**
- **La foto se extiende ~200 px hacia arriba** (más cuarto oscuro y lámpara), se corre hacia abajo
  y pierde ~200 px de kraft y madera abajo.
  - El sándwich queda entre y ≈ 750 y 1230, y el vaso a la derecha (x 760–1030, y 430–1010).
  - Así el texto tiene lugar sin que el velo toque el pan.
- **El bloque de texto**, arriba a la izquierda (de x 56 a ~700, para no pisar el vaso), en papel:
  - «HOY SÍ COCINO.»: Anton, ~90 px (mayúsculas ~80), y 70–150. Lo cruza a media altura una raya
    recta, en papel y del grueso del trazo de la Anton (~12 px). Es tipografía, no un adorno.
  - «HOY NO / COCINAS.»: Anton, ~190 px (mayúsculas ~165), de y 190 a 355 y de 375 a 540.
  - «— SANDO»: Instrument Serif itálica, ~52 px, alineada a la derecha con el final de
    «COCINAS.», y 565–610.
  - «MEATBALL MARINARA · PIDE EN SNDWCH.APP»: Mono, ~22 px, x 56, y ≈ 645.
- **Un solo velo de tinta**, arriba a la izquierda y solo detrás del bloque (sobre todo donde cae el
  halo de la lámpara). Se apaga antes del pan, a ~y 690.
- **El logo**, abajo a la derecha, en papel sobre la madera de la esquina (borde derecho en
  x 1024, y ≈ 1250–1300).

**Lo que se ve en 9:16 (1080×1920)**
- La foto a lo ancho, con su borde de arriba en y ≈ 300. Hacia arriba se extiende el cuarto oscuro
  con la lámpara (0–300), y hacia abajo la madera (1641–1920).
- **Todo a la izquierda** (x 56 a ~700) y en papel:
  - el logo, con «PIDE EN SNDWCH.APP» en Mono al lado (y 290–335);
  - «HOY SÍ COCINO.» tachado (y 375–455);
  - «HOY NO» (y 470–620) y «COCINAS.» (y 640–790);
  - «— SANDO» (y 800–845).
- El velo, solo detrás del bloque (ahí cae la lámpara), hasta ~y 850.
- El sándwich queda entre y ≈ 850 y 1330 (el pan de abajo roza la zona de los botones). El vaso, a
  la derecha (x 760–1030), sin texto encima.

**El titular.** «HOY NO / COCINAS.», literal, y encima su pie: «HOY SÍ COCINO.» tachado.
- La firma es «— SANDO». El producto va en el Mono.
- El Redactor puede probar otra línea tachada («HOY COCINO.», «HOY SÍ COCINO.»): la que suene más a
  lo que uno se dice.

**Por qué funciona.**
- **Gancho (5) y Momento (5).** Es lo que la gente se dice a sí misma (la lente de la tensión), y en
  el cuadro pasa algo: alguien tacha y alguien decide. Para Wood, eso es cerebro derecho: una voz y
  un personaje, aunque no se vea su dibujo.
- **Funciona al mediodía.** Ahí es la decisión de la cena.
- **Contagio (4).** Se reconoce («yo, todos los días») y se manda a quien siempre dice que va a
  cocinar.

**El riesgo.**
1. **Si la línea tachada pesa igual que el titular, confunde.** Por eso va a la mitad del tamaño y
   la raya se ve sin duda.
2. **Quién habla**: «Hoy sí cocino» es yo y «Hoy no cocinas» es tú. La firma de SANDO deja claro
   quién habla.
3. **Le suma una línea al titular aprobado.** El titular sigue literal y es lo más grande. Si el
   dueño lo quiere solo, se quita la línea tachada y queda C.
4. **Que suene a regaño.** SANDO no exclama ni explica: tres palabras y su nombre.
5. **La extensión del fondo y el limón** los revisa Calidad.

**Puntaje.** Br 4 · Mo 5 · Ma 4 · Ga 5 · Co 4 · Pe 4 · Ve 4 · Se 4 = **34**

Sobre la serie: el recurso (la frase que uno se dice, tachada por SANDO) se puede repetir con otros
momentos sin cansar.

### B · «Detrás del pan»

**El concepto.** «HOY NO / COCINAS.» grande en la noche de arriba, y el Meatball delante, tapándole
el pie a «COCINAS.»: la cena ya llegó y está más cerca que la frase.

**Qué se ve primero.** El titular grande en lo oscuro, con el pan encima. Después, el queso y la
marinara.

**Lo que se ve en 4:5 (1080×1350)**
- La foto entera.
- Las capas, de atrás hacia adelante:
  1. la foto;
  2. un velo de tinta solo arriba a la izquierda, sobre la lámpara y el plato;
  3. el titular;
  4. **el sándwich recortado de la misma foto** (una máscara, sin cambiar un píxel);
  5. los textos de abajo.
- **El titular** en papel, x 56, ~190 px de cuerpo (mayúsculas ~165):
  - «HOY NO» de y 250 a 415 y «COCINAS.» de y 435 a 600 (x 56–740, antes del vaso);
  - el borde de arriba del pan (~y 550 a la izquierda) tapa el pie de «COC». Nunca más de un tercio
    de la letra.
- **Arriba a la derecha**, en lo oscuro y en papel, alineados a x 1024: el logo y debajo
  «PIDE EN SNDWCH.APP» en Mono (y 60–110). Quedan por encima del sorbete, que empieza más abajo.
- **Abajo**, en la madera, en papel: la itálica «Meatball Marinara. Albóndigas en su propia
  marinara.» (~40 px, x 56, y ≈ 1270).

**Lo que se ve en 9:16 (1080×1920)**
- La foto a lo ancho, con su borde de arriba en y ≈ 230. El fondo se extiende hacia arriba y hacia
  abajo.
- **Arriba a la izquierda, en papel:** el logo con el Mono (y 295–340) y la itálica «Meatball
  Marinara.» (y 380–425).
- **El titular** en papel, x 56, ~190 px de cuerpo: «HOY NO» de y 480 a 645 y «COCINAS.» de y 665
  a 830. El borde de arriba del pan (y ≈ 780) le tapa el pie.
- El velo, solo arriba a la izquierda. El sándwich queda entre y ≈ 780 y 1250.

**El titular.** «HOY NO / COCINAS.», literal.
- Itálica candidata, de la carta: «Meatball Marinara. Albóndigas en su propia marinara.»

**Por qué funciona.**
- **Gancho (4).** Las letras detrás del pan son raras en el feed y hacen que el sándwich salga del
  cuadro.
- **Momento (4).** La noche queda arriba, entera, y el titular vive en ella sin tapar la comida.

**El riesgo.**
1. **Es el mismo recurso que el concepto A del Philly.** Si el dueño elige los dos, los anuncios se
   parecen: va en uno solo.
2. **La máscara puede dejar un halo**, y el pan no puede tapar más de un tercio de «COCINAS.».
3. **El velo apaga un poco la lámpara.** El resto del cuarto sigue oscuro y dice noche.
4. **El limón y la extensión del fondo** los revisa Calidad.

**Puntaje.** Br 5 · Mo 4 · Ma 4 · Ga 4 · Co 3 · Pe 4 · Ve 4 · Se 4 = **32**

### C · «Ya está» (el sobrio)

**El concepto.** La noche como está, el titular arriba en lo oscuro, y SANDO que cierra con su
frase: «Ya está.». No hay nada que decidir.

**Qué se ve primero.** El titular en papel sobre lo oscuro. Después, el sándwich con el queso, y la
firma.

**Qué cambia frente a la v2.** Tiene la estructura parecida, pero:
- no hay franja;
- no hay precio ni velo abajo;
- la frase de ingredientes cambia por la voz de SANDO.

**Lo que se ve en 4:5 (1080×1350)**
- La foto entera.
- **El titular**: «HOY NO / COCINAS.» en papel, Anton, ~170 px (mayúsculas ~148), x 56: de y 60 a
  208 y de 228 a 376.
- **Debajo**, en papel: «Ya está. — SANDO» en itálica (~56 px, y 405–460) y
  «MEATBALL MARINARA · PIDE EN SNDWCH.APP» en Mono (~22 px, y ≈ 490).
- **El velo**, de tinta, solo arriba a la izquierda (el halo y el plato). Se apaga antes del pan,
  a ~y 530.
- **El logo**, abajo a la derecha, en papel sobre la madera (borde derecho en x 1024,
  y ≈ 1250–1300).

**Lo que se ve en 9:16 (1080×1920)**
- La foto a lo ancho, con su borde de arriba en y ≈ 330. El fondo se extiende hacia arriba y hacia
  abajo.
- **El logo**, en papel, arriba a la derecha (y 295–340). El sorbete empieza más abajo.
- **A la izquierda (x 56), en papel:**
  - el titular, ~170 px de cuerpo (de y 360 a 510 y de 530 a 680);
  - «Ya está. — SANDO» (y 705–760);
  - el Mono (y ≈ 795).
- El velo llega hasta ~y 860. El sándwich queda entre y ≈ 880 y 1350 (el pan de abajo roza la zona
  de los botones).

**El titular.** «HOY NO / COCINAS.», literal.
- La firma «Ya está. — SANDO» es su frase de la biblia (§2).

**Por qué funciona.**
- **Momento (5).** La lámpara, el cuarto oscuro y el vaso: la noche se entiende sin leer.
- **Marca (4).** SANDO habla con su frase y su cursiva.

**El riesgo.**
1. **Gancho bajo (3).** Si el dueño quiere parar el dedo, es A.
2. **«Ya está.» sin contexto puede leerse frío.** Por eso va pegado al titular.
3. **El limón** lo decide Calidad.

**Puntaje.** Br 5 · Mo 5 · Ma 4 · Ga 3 · Co 2 · Pe 4 · Ve 4 · Se 4 = **31**

## 4 · La recomendación

**A, «Hoy sí cocino».**
- Es el puntaje más alto de los tres anuncios y el único con una historia dentro del cuadro: alguien
  se dice algo y SANDO lo tacha.
- Es lo que pide el brief («Ya está resuelto: algo caliente y contundente, sin pensarlo»).
- Si el dueño no quiere sumar la línea tachada, la opción es **C**: el mismo titular, sin la
  tachada.

## 5 · Para los que siguen

- **Redactor**: el titular no se toca. En A, prueba la línea tachada (la que suene más a lo que uno
  se dice); en B, la itálica de la carta; en C, la firma de SANDO.
- **Director de arte**:
  - A pide extender la foto hacia arriba también en el 4:5.
  - B pide la máscara del sándwich.
  - La raya de A es tipografía: del grueso del trazo, en papel y nunca más larga que la línea.
- **Calidad**: el limón del vaso (borrarlo o recortarlo), que la extensión del fondo no agregue
  nada, y que la máscara de B no cambie el borde del pan.

## Para el dueño

- **Elige uno de los tres** cuando veas las maquetas (Puerta 1).
- **En A, el titular gana una línea encima** («HOY SÍ COCINO.», tachada). Tu titular queda literal y
  es lo más grande; si lo prefieres solo, es C.
- **Extender el fondo (y borrar el limón)** usa un modelo de imagen.
  - Si se hace en Flow, es gratis.
  - Si solo sale en Figma (créditos de tu plan), necesita tu sí.
