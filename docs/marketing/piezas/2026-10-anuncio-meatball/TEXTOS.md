# Textos · 2026-10-anuncio-meatball

> Redactor, 2026-10-16 (paso 3 de `/pieza`). El titular de la imagen es el aprobado y no se toca:
> **«Hoy no cocinas.»** Aquí van las otras líneas de la imagen y los textos de Meta de cada
> concepto: A «Hoy sí cocino», B «Detrás del pan», C «Ya está». Ningún texto lleva precio (brief:
> «se le muestra el momento, no el precio»). Si el dueño pidiera uno, iría como `{precio15}`,
> interpolado de `scripts/piezas/datos.ts`.

## Cómo leer esto

- **Derivada**: es una oración o cláusula literal de «Cómo se vende» del Meatball (`pitch` en
  `datos.ts`). El generador la saca de ahí; no se tipea. El nombre del producto es `sigs[].nombre`.
- **Pulida**: la escribe el Redactor con palabras de la carta, sin cifras. Vive en este archivo.
- **Texto principal de Meta**: tres líneas (momento, verdad de la carta, cómo pedir). Entre
  paréntesis, los caracteres con los saltos de línea contados. El momento y la verdad caben en los
  primeros ~105 caracteres en todas las opciones; la tercera línea puede quedar tras el «ver más».
- **Titular de Meta**: 40 caracteres o menos. Va con cualquier texto principal; la pareja
  recomendada de cada concepto está marcada.
- **Botón**: «Pedir ahora». **Enlace**: `sndwch.app/?src=meta-meatball`.
- **El anuncio también sale al mediodía.** Solo la opción A3 nombra la noche; las demás se leen
  igual a las 11:00 que a las 20:00 («hoy», «la cena», «la cocina»).
- **El vaso no se nombra.** The Bloom // Hibiscus se vende aparte y ninguna línea sugiere que viene
  con el sándwich.

---

## A · «Hoy sí cocino»

### En la imagen (lo que no es el titular)

**La línea tachada.** Va en Anton a ~90 px, de x 56 a ~700: 15 caracteres como máximo.

1. «HOY SÍ COCINO.» (14)
   - Es lo que uno se dice, y el SÍ que se vuelve NO hace el contraste con el titular.
2. «HOY COCINO YO.» (14)
   - Pasa de «yo» a «tú», pero suena a quien se ofrece, no a quien se engaña.
3. «LUEGO COCINO.» (13)
   - Es la excusa de postergar; contrasta menos con «HOY NO».

**Favorita: la 1.** Es la que más suena a lo que uno se dice, y hace pareja exacta con el titular.

**La firma: «— SANDO», sin margen.** El concepto la fija (el titular son tres palabras y la firma
es su nombre). Una frase junto a ella compite con el titular y con la tachada. «Ya está.» es el
cierre del concepto C; aquí no se repite.

**El Mono**: «MEATBALL MARINARA · PIDE EN SNDWCH.APP», sin cambio.

### Texto principal de Meta

**A1** (121)
```
Esta mañana dijiste: hoy sí cocino.
Albóndigas en su propia marinara, queso derretido hasta el borde.
Pide en sndwch.app.
```
Por qué: pone en palabras lo que la imagen tacha y reconoce a quien lo ha dicho. La segunda línea
es lo que lo resuelve. Se lee igual a mediodía.

**A2** (120)
```
Hoy sí cocino. Hasta que toca cenar.
Caliente, contundente, de los que se comen con las dos manos.
Pídelo en sndwch.app.
```
Por qué: la misma tensión con una sonrisa de uno consigo mismo. Repite la tachada 1 de la imagen:
úsala si eliges la 2 o la 3. «Caliente» es la carta, no una promesa de temperatura al llegar.

**A3** (125)
```
La noche en que ya decidiste no cocinar.
Albóndigas en su propia marinara, queso americano derretido.
Pide hoy en sndwch.app.
```
Por qué: es la frase de la carta, literal. Es la única que nombra la noche: de 11:00 a 14:00 se lee
como la cena de hoy, pero rinde menos.

**Favorita: A1.**

### Titular de Meta

1. «Meatball Marinara» (17): el nombre tal cual la carta; A1 no lo dice. **Favorita.**
2. «Albóndigas en su propia marinara» (32): lo que lleva, en la voz de la carta. Repite la segunda
   línea de A1.
3. «La cena que no cocinas» (22): el momento. Repite el titular de la imagen, así que sobra.

**Pareja recomendada:** A1 + «Meatball Marinara».

---

## B · «Detrás del pan»

### En la imagen (lo que no es el titular)

**La itálica.** En el 4:5 va entera, abajo en la madera, en una línea (~40 px). En el 9:16 queda
solo «Meatball Marinara.», como pide el concepto.

1. «Meatball Marinara. Albóndigas cocidas en su propia marinara.» (60) · derivada.
   - El concepto proponía «Albóndigas en su propia marinara». La carta dice «cocidas» y es lo que se
     ve: la marinara alrededor del pan.
2. «Meatball Marinara. Un pan que aguanta todo el jugo.» (51) · derivada.
   - Explica por qué se come con las dos manos, pero no se comprueba en la foto.
3. «Meatball Marinara. Queso americano derretido hasta el borde.» (60) · derivada.
   - Nombra el queso. Calidad confirma que el de la foto es el Americano antes de usarla (la foto de
     stock traía otro).

**Favorita: la 1.** Es lo que la foto muestra y es la verdad que sostiene el titular.

**El Mono**: «PIDE EN SNDWCH.APP», sin cambio.

### Texto principal de Meta

**B1** (109)
```
Hoy la cocina descansa.
Queso derretido hasta el borde y un pan que aguanta todo el jugo.
Pide en sndwch.app.
```
Por qué: corta, no promete un tiempo y no repite la itálica (las albóndigas) de la imagen.

**B2** (125)
```
Sin ganas de cocinar y sin saber qué pedir.
Caliente, contundente, con un pan que aguanta todo el jugo.
Pídelo en sndwch.app.
```
Por qué: es lo que la persona piensa hoy (brief) y la cena como respuesta. «Caliente» es la carta,
no una promesa de temperatura al llegar.

**B3** (122)
```
La cocina puede esperar.
Albóndigas cocidas en su propia marinara, queso derretido hasta el borde.
Pide hoy en sndwch.app.
```
Por qué: la receta completa en una línea. Repite la itálica 1 de la imagen.

**Favorita: B1.**

### Titular de Meta

1. «De los que se comen con las dos manos» (37): la carta, literal; no está en B1. **Favorita.**
2. «Queso derretido hasta el borde» (30): repite la segunda línea de B1; mejor con B2.
3. «Pide el Meatball Marinara» (25): la acción pura; el botón ya la dice.

**Pareja recomendada:** B1 + «De los que se comen con las dos manos».

---

## C · «Ya está»

### En la imagen (lo que no es el titular)

**La firma de SANDO** (seis palabras como máximo, sin exclamar). En el 4:5 va en ~56 px bajo el
titular, en papel.

1. «Ya está. — SANDO» (2 palabras)
   - Es la frase de la biblia y la candidata del concepto.
2. «Ya está resuelto. — SANDO» (3 palabras)
   - Es la forma completa de su voz («No lo pienses. Ya está resuelto.»). Quita el riesgo de que
     «Ya está.» se lea frío, pero pierde la frase corta.
3. «Caliente, contundente. — SANDO» (2 palabras) · derivada.
   - Pone la verdad del producto en la imagen, pero deja de decir «no hay nada que decidir», que es
     el concepto.

**Favorita: la 1.** Es la frase de SANDO y va pegada al titular. Si en la maqueta se lee fría, pasa
a la 2.

**El Mono**: «MEATBALL MARINARA · PIDE EN SNDWCH.APP», sin cambio.

### Texto principal de Meta

**C1** (90)
```
Hoy no hay nada que decidir.
Albóndigas cocidas en su propia marinara.
Pide en sndwch.app.
```
Por qué: el concepto dicho con la voz de SANDO. La segunda línea es la carta, literal. Sin «ya
está», que es la firma de la imagen.

**C2** (118)
```
Decidir la cena ya no es tu tarea.
Caliente, contundente, de los que se comen con las dos manos.
Pídelo en sndwch.app.
```
Por qué: nombra lo que cansa (decidir) y lo quita. «Caliente» es la carta, no una promesa de
temperatura al llegar.

**C3** (116)
```
Ni cocinar ni pensar qué pedir.
Albóndigas en su propia marinara, queso americano derretido.
Pide hoy en sndwch.app.
```
Por qué: la más directa; dos cosas que no haces y lo que llega.

**Favorita: C1.**

### Titular de Meta

1. «Meatball Marinara, cena resuelta» (32): nombre y momento. **Favorita.**
2. «Hoy no cocinas, hoy no decides» (30): extiende el titular de la imagen.
3. «Tu cena, resuelta» (17): la más corta; no nombra el producto.

**Pareja recomendada:** C1 + «Meatball Marinara, cena resuelta».

---

## Revisión

- **Tú, nunca voseo**: los verbos son «pide», «pídelo», «dijiste», «decidiste», «pienses»,
  «cocinas». Ninguno está en forma de vos.
- **Ninguna cifra escrita**: no hay precios, horas, mínimos ni premios.
- **Nada de salud ni superlativos**: «caliente» y «contundente» son la carta; no hay «mejor» ni
  «el más».
- **Nada regional**: sin ciudad, sin jerga local.
- **Nada engañoso**: los ingredientes nombrados (albóndigas, marinara, queso americano, pan) están
  en la receta del Meatball. No se nombra hierba, otro queso ni más albóndigas. El vaso y su rodaja
  no se nombran.
- **Nada apagado**: ningún texto habla de descuentos, premios ni de mecanismos que ya no corren.
- **Sin gente, sin marcas ajenas, sin alcohol.**

## Para el dueño

Nada. Solo elegir concepto en la Puerta 1; el texto de ese concepto se usa con el titular de Meta
que prefieras.

## Final (2026-10-17): el texto de Meta que va
Dueño (Puerta 1): cambiar la línea 1 de A1. Queda:
```
Hoy sí cocino. Hasta que toca cenar.
Albóndigas en su propia marinara, queso derretido hasta el borde.
Pide en sndwch.app.
```
