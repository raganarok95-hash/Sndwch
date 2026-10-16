# Conceptos · 2026-10-anuncio-philly

> Creativo, 2026-10-16 (paso 2 de `/pieza`). La idea («Hambre en serio.») y la foto
> (`docs/marketing/anuncios/fotos/foto-philly.jpg`) ya las aprobó el dueño. Aquí no cambia la idea:
> son tres formas de contarla en la imagen, sin franja, marco, banda ni precio.

## Qué falló en la v2, además de la franja

La v2 (`docs/marketing/anuncios/philly-feed.jpg`, `philly-vertical.jpg`) tenía cuatro problemas:

- La franja naranja a la izquierda.
- Dos velos (arriba y abajo) que apagaron la luz de la ventana. Esa luz es lo que dice que es de día.
- El precio dentro de un recuadro de papel: otro bloque de color.
- «· TRUJILLO» junto a la marca.

Y era el mismo cuadro que los otros dos anuncios. Ninguno de los tres conceptos repite eso.

## Lo que vale para los tres conceptos

- **La foto**: la aprobada, y el sándwich no se toca. Es casi 4:5, así que en el feed entra entera.
  - Arriba a la izquierda, la ventana con luz de día: lo más claro del cuadro.
  - Arriba a la derecha y en toda la parte de abajo, madera oscura.
  - Debajo y alrededor del pan, el kraft (claro). Del centro sube vapor.
  - No hay nada que recortar.
- **Dónde cae en el 4:5 (1080×1350), aprox.**
  - Ventana: x 0–500, y 0–380.
  - Sándwich: x 195–930, y 400–975. La parte más alta del pan está en ~(650, 400).
  - Borde de abajo del pan: de ~(330, 975) a ~(910, 650).
  - Madera oscura de abajo: desde y ≈ 1150.
- **El 9:16 (1080×1920)**: la foto va a lo ancho. El fondo se extiende hacia arriba (más ventana y
  pared) y hacia abajo (más madera) con el mismo modelo que la generó. Se extiende **solo el
  fondo**: nada de comida ni objetos nuevos, y el sándwich no se toca. Así el sándwich queda en la
  zona útil y lo de abajo, que tapan los botones, es madera.
- **Zonas del 9:16**: nada de texto en los 269 px de arriba ni de y 1248 para abajo.
- **Las tres voces**:
  - Anton para el titular: «Hambre en serio.», literal.
  - Instrument Serif itálica para la verdad de la carta, con el nombre del producto.
  - IBM Plex Mono para «PIDE EN SNDWCH.APP».
  - El nombre y la frase salen de la carta (`carta.ts` → `datos.ts`); no se tipean.
  - Sin precio (brief) y sin «Trujillo».
- **Color**: tinta `#1E2B22` sobre lo claro (ventana, kraft) y papel `#EFE6D4` sobre lo oscuro
  (madera). El dorado y el celeste, solo en el `//` del logo.
- **Velo**: uno como máximo, solo donde hay texto y nunca sobre el sándwich.
- Las posiciones en px son de referencia: el Director de arte las ajusta en la maqueta.

## 1 · Abrir: 12 ejecuciones, sin juzgar

1. **Detrás del pan** *(el producto)*: el titular enorme arriba y el sándwich delante, tapándole el
   pie a la última línea.
2. **El sándwich de texto** *(la marca: el `//` es el corte del pan)*: «HAMBRE» arriba, «EN SERIO.»
   abajo y el Philly en medio, como relleno de la frase.
3. **La diagonal** *(el producto)*: el titular en tinta sobre el kraft, girado al ángulo del pan,
   como su leyenda.
4. **La ventana** *(el momento)*: la foto intacta; el titular chico y en tinta dentro de la luz de
   la ventana, y SANDO firma la frase de la carta.
5. **De cerca** *(el producto)*: recorte apretado al cheddar sobre la res.
6. **El vapor** *(el producto)*: el titular sube con la columna de vapor.
7. **Más grande que el cuadro** *(la tensión)*: «HAMBRE» tan grande que se sale por los bordes.
8. **HAMBRE // EN SERIO.** *(la marca)*: el titular escrito como un ingrediente de la carta
   («Res // Laminada»).
9. **¿Hambre? / En serio.** *(los hermanos)*: alguien pregunta y SANDO contesta.
10. **Lo que lleva** *(el dato)*: etiquetas en Mono con los nombres de la carta señalando cada
    ingrediente.
11. **El silencio de SANDO** *(los hermanos)*: el sándwich chico en una esquina y mucho aire
    oscuro.
12. **Palabra por palabra** *(lo nativo, Reels)*: el 9:16 como secuencia: «HAMBRE» → «EN SERIO.» →
    el sándwich.

## 2 · Cerrar: la rúbrica (AGENCIA.md §4)

Las columnas: Br = Brief · Mo = Momento · Ma = Marca a los 2 s · Ga = Gancho · Co = Contagio ·
Pe = Pedible · Ve = Verdad · Se = Serie.

Pasa con 30 o más y Verdad en 4 o 5.

| # | ejecución | Br | Mo | Ma | Ga | Co | Pe | Ve | Se | total | |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Detrás del pan | 5 | 3 | 4 | 5 | 3 | 4 | 4 | 4 | **32** | **A** |
| 2 | El sándwich de texto | 5 | 3 | 4 | 4 | 3 | 4 | 4 | 5 | 32 | pasa, no va |
| 3 | La diagonal | 5 | 4 | 4 | 4 | 3 | 4 | 5 | 3 | **32** | **B** |
| 4 | La ventana | 5 | 4 | 3 | 3 | 2 | 4 | 5 | 4 | **30** | **C** |
| 5 | De cerca | 4 | 2 | 3 | 4 | 2 | 4 | 3 | 3 | 25 | |
| 6 | El vapor | 5 | 4 | 3 | 3 | 2 | 4 | 3 | 3 | 27 | |
| 7 | Más grande que el cuadro | 4 | 2 | 3 | 5 | 2 | 3 | 5 | 3 | 27 | |
| 8 | HAMBRE // EN SERIO. | 3 | 3 | 4 | 3 | 2 | 4 | 5 | 3 | 27 | |
| 9 | ¿Hambre? / En serio. | 2 | 3 | 4 | 4 | 3 | 4 | 5 | 4 | 29 | |
| 10 | Lo que lleva | 3 | 2 | 4 | 3 | 3 | 5 | 5 | 4 | 29 | |
| 11 | El silencio de SANDO | 4 | 3 | 3 | 2 | 2 | 3 | 5 | 3 | 25 | |
| 12 | Palabra por palabra | 5 | 3 | 3 | 3 | 2 | 4 | 5 | 4 | 29 | |

**Por qué quedan fuera los que no pasan:**
- **5** (de cerca) agranda la foto el doble: se ablanda y, sin los bordes del pan, parece más
  relleno del que llega.
- **6** (el vapor) convierte el vapor en la promesa, y por delivery llega caliente, no humeando.
- **7** (más grande que el cuadro) corta letras y deja de leerse.
- **8** («HAMBRE // EN SERIO.») cambia el titular aprobado y gasta el `//` como muletilla.
- **9** («¿Hambre? / En serio.») también cambia el titular, que el brief pide literal.
- **10** (lo que lleva) es una lista, y en el celular no para el dedo.
- **11** (el silencio de SANDO) rompe la regla de que el sándwich ocupa entre la mitad y dos
  tercios del cuadro.
- **12** (palabra por palabra) es video, y su primer cuadro no tiene comida.

**El 2 pasa pero no va.** En el 9:16, «EN SERIO.» debajo del sándwich cae en la zona de los botones
o sobre madera y kraft mezclados. Además, partir la frase con el sándwich rinde más en el Turkey,
donde el corte significa algo: el almuerzo arriba y la tarde abajo. Lo mejor del 2 vive en el A.

## 3 · Los tres conceptos

### A · «Detrás del pan» (el claramente distinto · recomendado)

**El concepto.** El titular, enorme, queda detrás del Philly. El sándwich está más cerca de ti que
las palabras y les pisa el pie: el hambre se dice en grande y la comida se pone delante.

**Qué se ve primero.** El titular gigante y, en el mismo vistazo, el sándwich iluminado que lo
pisa. Después, la frase y la marca abajo.

**Lo que se ve en 4:5 (1080×1350)**
- La foto entera, sin recortar.
- Las capas, de atrás hacia adelante:
  1. la foto;
  2. un velo de tinta solo en la mitad de arriba (fuerte arriba y en cero a la altura del pan,
     ~y 560), para que el papel se lea sobre la ventana;
  3. el titular;
  4. **el sándwich recortado de la misma foto** (una máscara, sin cambiar un píxel);
  5. los textos de abajo.

  Así el velo oscurece la ventana pero no el pan, que queda iluminado delante de las letras.
- **El titular**: «HAMBRE / EN SERIO.» en Anton, papel, alineado a la izquierda (x 56).
  - ~220 px de cuerpo: las mayúsculas miden ~190 px.
  - «HAMBRE» va de y 48 a 240 y «EN SERIO.» de y 260 a 450 (x 56–800).
  - La parte más alta del pan (~y 400, x ~650) tapa el pie de «RIO.». Nunca más de un tercio de
    la altura de una letra, y «EN SE» queda entero.
- **Abajo, en la madera oscura (y 1170–1300), en papel y sin velo:**
  - la itálica «Philly Cheesesteak. Tan jugoso que no lleva salsa.» (~44 px, una línea, x 56,
    y ≈ 1185);
  - debajo, «PIDE EN SNDWCH.APP» en Mono (~24 px, x 56, y ≈ 1275);
  - a la derecha, el logo SND//WCH (borde derecho en x 1024, y ≈ 1250–1300).

**Lo que se ve en 9:16 (1080×1920)**
- La foto a lo ancho, con su borde de arriba en y ≈ 330. Se extiende la ventana y la pared hacia
  arriba (0–330) y la madera hacia abajo (1671–1920).
- El sándwich queda entre y ≈ 730 y 1300. Su punta de abajo a la izquierda entra unos 50 px en la
  zona de los botones: es pan, no texto.
- Las mismas capas. El velo va de 0 a ~800.
- **El titular** en papel, x 56, ~250 px de cuerpo: «HAMBRE» de y 330 a 545 y «EN SERIO.» de
  y 560 a 775. La parte más alta del pan (y ≈ 730) le tapa el pie a «RIO.», como en el feed.
- **Sobre el kraft, abajo a la derecha del sándwich**, en tinta (el kraft es claro), alineados a la
  derecha en x 1024 entre y 1110 y 1240:
  - «Philly Cheesesteak.» en itálica (~46 px);
  - «PIDE EN SNDWCH.APP» en Mono (~24 px);
  - el logo.
- Nada de texto debajo de y 1248.

**El titular.** «HAMBRE / EN SERIO.», literal, en dos líneas.
- Itálica candidata (la pule el Redactor), de «Cómo se vende»: «Philly Cheesesteak. Tan jugoso que
  no lleva salsa.»

**Por qué funciona.**
- **Gancho (5).** En el feed de comida todo es foto con texto encima. Un titular del ancho del
  cuadro con la comida *delante* no se ve, y la profundidad hace que el sándwich salga del cuadro.
- **Es la idea hecha imagen.** El hambre es grande y el sándwich va por delante.
- **Elder y Krishna.** El pan en tres cuartos y en primer plano es lo que la mente «prueba».

**El riesgo.**
1. **Foco**: la palabra gigante compite con la comida. Por eso el titular va en papel (neutro) y el
   sándwich, lo único con color, va delante y sin velo.
2. **Si el pan tapa de más, «SERIO» no se lee.** Máximo un tercio de la letra, y se prueba en la
   maqueta a tamaño de celular.
3. **La máscara del sándwich puede dejar un halo** en el borde. Se revisa en la Puerta 2.
4. **El titular tapa la columna de vapor** y se pierde una señal de apetito. Lo compensan el queso
   y la res, que quedan delante y con toda su luz.
5. **El velo apaga un poco la ventana**: el día se lee menos que en B y C.
6. **Si el dueño elige este recurso aquí y en el Meatball (su concepto B), los dos anuncios se
   parecen.** Va en uno solo.
7. **La extensión del 9:16 es fondo generado.** Calidad mira que no aparezca nada que no se vende.

**Puntaje.** Br 5 · Mo 3 · Ma 4 · Ga 5 · Co 3 · Pe 4 · Ve 4 · Se 4 = **32**

### B · «La diagonal»

**El concepto.** El titular se apoya junto al sándwich, en tinta sobre el kraft, girado al mismo
ángulo que el pan, como su leyenda. La foto queda intacta: sin velo, con la luz de la ventana y el
vapor.

**Qué se ve primero.** El sándwich (lo único con color fuerte) y, pegado a él, el titular
inclinado. Después, arriba a la izquierda, la marca en la luz.

**Lo que se ve en 4:5 (1080×1350)**
- La foto entera, sin velo y sin recortar.
- **El titular**: «HAMBRE / EN SERIO.» en Anton y en tinta.
  - ~150 px de cuerpo: las mayúsculas miden ~130 px.
  - Dos líneas alineadas a la izquierda, giradas ~22°: suben hacia la derecha, paralelas al borde
    de abajo del pan.
  - El bloque va sobre el kraft, debajo y a la derecha del sándwich: de ~(470, 1060) abajo a la
    izquierda a ~(1050, 690) arriba a la derecha.
  - Ninguna letra toca el pan ni sale del kraft hacia la madera oscura, donde la tinta no se lee.
- **Arriba a la izquierda, dentro de la luz de la ventana y en tinta:**
  - el logo (x 56, y 56–110);
  - la itálica «Philly Cheesesteak. Tan jugoso que no lleva salsa.» en dos líneas (~40 px, ancho
    máximo 440, y 130–225);
  - «PIDE EN SNDWCH.APP» en Mono (~22 px, y ≈ 250).
- Abajo, solo foto.

**Lo que se ve en 9:16 (1080×1920)**
- La foto a lo ancho, con su borde de arriba en y ≈ 230. Se extiende la ventana hacia arriba
  (0–230) y la madera hacia abajo (1571–1920).
- **Arriba a la izquierda, en la luz de la ventana y en tinta:** el logo (y ≈ 300), la itálica
  (y 370–460) y el Mono (y ≈ 490).
- El sándwich queda entre y ≈ 630 y 1205.
- **El titular** girado sobre el kraft, debajo y a la derecha del pan, de ~(560, 1240) a
  ~(1050, 900), con ~130 px de cuerpo.
- Nada de texto debajo de y 1248.

**El titular.** «HAMBRE / EN SERIO.», literal. La itálica es la misma que en A.

**Por qué funciona.**
- **Momento (4) y Verdad (5).** Es la foto aprobada tal cual, con la luz del día y el vapor. El
  texto no la tapa ni la oscurece (Wood: la escena se queda entera).
- **Gancho (4).** Un titular inclinado junto a la comida rompe la grilla del feed y lleva el ojo
  del pan a las palabras.

**El riesgo.**
1. **El texto girado se lee más lento.** No más de ~22°, y dos líneas cortas.
2. **Tinta sobre kraft arrugado.** Si la sombra de un pliegue cae sobre una letra, se mueve el
   bloque.
3. **Que parezca impreso en el papel**, y el papel que llega no lo trae. Por eso va plano, sin
   deformarse con las arrugas: se lee como gráfica, no como papel impreso.
4. **El `//` celeste del logo pierde contraste sobre la luz de la ventana.** El Director de arte
   prueba el logo en tinta ahí.
5. **Grita menos que A.** En el celular se lee, pero el titular es más chico.

**Puntaje.** Br 5 · Mo 4 · Ma 4 · Ga 4 · Co 3 · Pe 4 · Ve 5 · Se 3 = **32**

### C · «La ventana» (el sobrio)

**El concepto.** La foto aprobada casi sin nada encima: el titular chico y en tinta dentro de la
luz de la ventana, y SANDO que firma la verdad de la carta. Es el silencio de SANDO: decir poco.

**Qué se ve primero.** El sándwich con su vapor. El titular, en la luz, entra en el mismo vistazo.
La marca, abajo.

**Qué cambia frente a la v2.** Tiene la estructura parecida (el titular arriba), pero:
- no hay franja;
- no hay velo, así que la ventana se ve como ventana;
- no hay precio;
- el texto va en tinta sobre la luz, y firma SANDO.

**Lo que se ve en 4:5 (1080×1350)**
- La foto entera, sin velo.
- **El titular**: «HAMBRE / EN SERIO.» en Anton y en tinta, arriba a la izquierda, dentro del
  vidrio iluminado.
  - ~130 px de cuerpo: las mayúsculas miden ~113 px.
  - x 56: «HAMBRE» de y 64 a 177 y «EN SERIO.» de y 197 a 310.
  - No pasa del marco de la ventana (~x 480).
- El vapor queda libre, a la derecha del titular.
- **Abajo, en la madera oscura, en papel y sin velo:**
  - la itálica «Tan jugoso que no lleva salsa. — SANDO» (~46 px, x 56, y ≈ 1185);
  - debajo, «PHILLY CHEESESTEAK · PIDE EN SNDWCH.APP» en Mono (~22 px, y ≈ 1270);
  - a la derecha, el logo (borde derecho en x 1024, y ≈ 1250–1300).

**Lo que se ve en 9:16 (1080×1920)**
- La foto a lo ancho, con su borde de arriba en y ≈ 380. Hacia arriba (0–380) se extiende la
  ventana: queda una ventana alta y clara, que es la zona tranquila.
- **En la luz, en tinta y alineado a la izquierda (x 56):**
  - el titular, ~170 px de cuerpo (y 300–560);
  - la itálica con la firma (y 585–635);
  - el logo y el Mono (y 660–720).
- El sándwich queda entre y ≈ 780 y 1355. Su punta de abajo a la izquierda entra un poco en la zona
  de los botones: es pan, no texto.

**El titular.** «HAMBRE / EN SERIO.», literal.
- Itálica: «Tan jugoso que no lleva salsa. — SANDO». Son seis palabras, sin exclamar: así habla
  SANDO (biblia §2).

**Por qué funciona.**
- **Verdad (5) y Momento (4).** La luz cuenta la hora sin una palabra, y nada tapa ni tiñe la
  comida.
- **Marca.** La firma de SANDO es un activo que no necesita su dibujo.

**El riesgo.**
1. **Gancho bajo (3).** Es el más tranquilo de los tres. Si el dueño quiere parar el dedo, es A.
2. **El titular chico en el feed.** Se prueba en la maqueta a tamaño de celular.
3. **El `//` celeste sobre la ventana**, igual que en B.
4. **La ventana extendida del 9:16 es fondo generado.** Lo revisa Calidad.

**Puntaje.** Br 5 · Mo 4 · Ma 3 · Ga 3 · Co 2 · Pe 4 · Ve 5 · Se 4 = **30**

## 4 · La recomendación

**A, «Detrás del pan».**
- Es el que más para el dedo y es la idea hecha imagen.
- Si en la maqueta el velo apaga demasiado el día, el plan B es **B, «La diagonal»**: mismo
  puntaje, la foto intacta, menos grito.
- C queda como la opción sobria.

## 5 · Para los que siguen

- **Redactor**: el titular no se toca. Pule la itálica:
  - en A y B, nombre + frase de la carta;
  - en C, la firma de SANDO (seis palabras como máximo, sin exclamar).
- **Director de arte**:
  - A pide la máscara del sándwich (de la misma foto) y un solo velo.
  - B y C van sin velo.
  - Los tres 9:16 piden extender el fondo de la foto.
  - Prueba el logo en tinta sobre la ventana (B y C).
- **Calidad**: que la extensión del fondo no agregue nada (ni comida, ni objetos, ni texto), y que la
  máscara de A no cambie el borde del pan.

## Para el dueño

- **Elige uno de los tres** cuando veas las maquetas (Puerta 1).
- **Extender el fondo para el 9:16** usa un modelo de imagen.
  - Si se hace en Flow, es gratis.
  - Si solo sale en Figma (créditos de tu plan, como las fotos), necesita tu sí.
  - Sin extender, el 9:16 se hace recortando los costados: el sándwich queda más grande y una parte
    cae bajo los botones de Instagram.
