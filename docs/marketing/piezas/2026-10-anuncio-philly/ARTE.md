# Arte · 2026-10-anuncio-philly

> Director de arte. Cada revisión se agrega abajo; no se reescribe. Rúbrica y estilo:
> `.claude/skills/estilo-sndwch`. Pasa con ningún criterio bajo 3, promedio 4 o más y Verdad 4 o 5.

## Puerta 1 · 2026-10-16 · resumen

**Recomendado: A, «Detrás del pan».** Es la respuesta directa a «seamos más creativos»: el pan pisa
el titular y sale del cuadro. Pasa la rúbrica, y la foto aprobada no se toca (ni otra foto ni un
píxel del sándwich). **C, «La ventana»**, también pasa y saca más en la rúbrica de arte (luz del día,
vapor, calma), pero tiene la misma estructura que la v2 que el dueño rechazó (titular arriba a la
izquierda, datos abajo): es la alternativa si el dueño prefiere lo sobrio. **B, «La diagonal»**, no
cabe en esta foto.

Las maquetas (HTML y PNG), en `maquetas/`:
- `concepto-a-feed` y `concepto-a-vertical`;
- `concepto-b-feed` y `concepto-b-vertical`;
- `concepto-c-feed` y `concepto-c-vertical`.

Lo medido en la foto (4:5, 1080×1350):
- **La luz de la ventana** es solo un triángulo arriba a la izquierda (de x 0–520 arriba a x 0–150
  en y 300).
- **El kraft de abajo a la derecha del pan está en la sombra que proyecta el pan**, en una franja de
  100 a 150 px pegada al borde, donde ni la tinta ni el papel se leen.
- **El kraft claro** está arriba a la izquierda del pan y a su derecha.
- **La madera de abajo** tiene vetas claras en x 150–450 y un parche claro en la esquina de abajo a
  la izquierda (x 0–40, y 1130–1210).

Las posiciones de CONCEPTOS.md se ajustaron a eso.

Lo que la maqueta todavía no hace (es aproximado):
- **El fondo extendido del 9:16**: es la foto difuminada con la fila de arriba y la de abajo
  estiradas. Por eso se ven vetas verticales en la madera de abajo y en la pared de arriba. El final
  lo genera el Productor.
- **La máscara del sándwich de A**: es un `clip-path` con el contorno medido a mano, de borde duro y
  sin calar.
- **Lo que hay que borrar de la foto**: nada. Ni objetos, ni texto, ni logos, ni gente. Lo único
  vivo en la foto es el vapor, y se queda.

## 2026-10-16 · Puerta 1 · A «Detrás del pan» (concepto-a-feed, concepto-a-vertical)
veredicto: aprobada
criterios: Foco 4 · Lugar y hora 3 · Verdad 5 · Apetito 4 · Jerarquía 5 · Coherencia 5 · Zonas 4 · Limpieza 4
por qué funciona (o no): El titular gigante queda detrás y el pan, sin velo y con toda su luz, le pisa el pie a «SERIO.» (un cuarto de la letra, se sigue leyendo). Así la comida es lo que está más cerca de quien mira, en tres cuartos y lista para comer (Elder y Krishna), y se lee en dos segundos: momento → sándwich → nombre → marca (fluidez, Reber y otros). Lo que cuesta: el único velo apaga la ventana y tapa la columna de vapor, así que la hora del día se lee menos que en C (Wood: la escena pierde un poco de lugar).
cambio exacto: null. Para el final: (1) en el 9:16, el texto de abajo del concepto (tinta sobre el kraft, a la derecha del pan) cae en la sombra del pan y no se lee; la itálica, el Mono y la marca van en una columna en papel, a la derecha de «HAMBRE» y dentro del velo, como en la maqueta; (2) la máscara se cala 2–3 px siguiendo la corteza, nunca el kraft, y el velo llega a cero antes de y≈600 (4:5) o y≈760 (9:16), para que no quede halo en el flanco derecho de la cresta (4:5: x 730–770, y 440–520).

## 2026-10-16 · Puerta 1 · B «La diagonal» (concepto-b-feed, concepto-b-vertical)
veredicto: rehacer
criterios: Foco 3 · Lugar y hora 5 · Verdad 5 · Apetito 5 · Jerarquía 2 · Coherencia 3 · Zonas 3 · Limpieza 3
por qué funciona (o no): Tal como está escrito (abajo a la derecha, ~150 px, girado 22°), el titular cae encima del pan y en su sombra; lo probé y no se lee. En el único kraft claro que queda, arriba a la izquierda y paralelo a la corteza, el titular cabe a 84 px girado 32°: parece una calcomanía, roza el pan y lo primero que se lee es el bloque de la ventana, no el momento (Jerarquía 2). Además, el `//` celeste se pierde sobre la ventana.
cambio exacto: con esta foto no tiene arreglo, porque no hay kraft limpio del tamaño del titular. Solo vuelve con otra foto en la que el kraft de abajo a la derecha quede libre y sin sombra (el sándwich arriba a la izquierda y la luz de frente). Esa foto nueva la decide el dueño. Mientras no la pida, se descarta.

## 2026-10-16 · Puerta 1 · C «La ventana» (concepto-c-feed, concepto-c-vertical)
veredicto: aprobada
criterios: Foco 5 · Lugar y hora 5 · Verdad 5 · Apetito 5 · Jerarquía 4 · Coherencia 5 · Zonas 4 · Limpieza 4
por qué funciona (o no): La foto queda intacta, sin velo: la luz de la ventana dice «de día» y el vapor sube libre (Wood, Spence). El titular en tinta y en la luz no le quita foco a la comida, y la firma «— SANDO» es un activo de la marca sin pegar su dibujo (Romaniuk). Su límite es el gancho. Además, la estructura (titular arriba, datos abajo) es la de la v2 sin franja ni precio: puede leerse como «lo mismo de antes».
cambio exacto: null. Para el final: (1) en el 4:5, el titular va a 130 px como mucho; más grande, «SERIO.» sale de la luz y cae sobre el alféizar oscuro; (2) en el 9:16, el titular baja a ~125 px y la firma va en dos líneas dentro de la ventana; la marca y el Mono, en papel sobre la madera oscura de la derecha, porque debajo del titular la luz se acaba; (3) la extensión de arriba tiene que dar una ventana clara y alta (0–400 px), sin nada adentro; (4) la punta del pan entra ~90 px en la zona de los botones: es pan, no texto, y se acepta.

## Para el Productor (si el dueño elige A)
- **Foto**: la aprobada, `docs/marketing/anuncios/fotos/foto-philly.jpg`. No se genera otra y no se
  borra nada.
- **4:5**:
  - la foto entera;
  - un solo velo de tinta: `rgba(14,20,16)` de .80 arriba a 0 en y≈600;
  - el titular en Anton, papel, 220 px, x 50, y 60;
  - encima, el sándwich recortado de la misma foto con una máscara calada 2–3 px, sin cambiar un
    píxel (el contorno de referencia es el `clip-path` de `concepto-a-feed.html`);
  - abajo, sobre la madera: la itálica de 40 px en y 1212, el Mono de 24 px en y 1290 y la marca a
    la derecha.
- **9:16**:
  - la foto a lo ancho, con su borde de arriba en y 273;
  - **se extiende solo el fondo**, con el mismo modelo: arriba 273 px de pared y ventana (quedan
    debajo del velo) y abajo ~306 px de la misma madera de la mesa. Nada de comida, objetos, texto
    ni gente, y el sándwich no se toca. En Flow es gratis; en Figma gasta créditos y necesita el sí
    del dueño;
  - el velo, de .82 arriba a 0 en y≈760;
  - el titular, a 235 px en x 48, y 300;
  - la máscara;
  - la columna en papel, alineada a la derecha en x 1024 desde y 306: la marca de 38 px, la itálica
    de 36 px en cuatro líneas y el Mono de 19 px en dos.
- **Las cifras y el nombre**: el nombre y la frase se derivan de la carta (`datos.ts`: `nombre`, y
  `pitch` cortado en «Tan jugoso que no lleva salsa.»). No se tipean.

## Para el Redactor
- **A, 9:16**: la itálica entra en cuatro líneas cortas («Philly / Cheesesteak. / Tan jugoso que /
  no lleva salsa.»). Si prefieres menos texto ahí, basta con el nombre.
- **C, 9:16**: la firma va en dos líneas («Tan jugoso que / no lleva salsa. — SANDO»).

## Para Calidad
- **La extensión del 9:16**: que no agregue nada.
- **La máscara de A**: que no cambie el borde del pan.

## Para el dueño
- **Elige A o C.** A es la que recomiendo. B queda fuera con esta foto.
