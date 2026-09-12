# SND//WCH — cómo pedir las imágenes

> Los personajes y el mundo están descritos en **`docs/UNIVERSO_SNDWCH.md`**. Este archivo es
> solo el **cómo pedirlos**: los prompts listos para pegar y las reglas técnicas que, si se
> saltan, obligan a tirar la imagen y volver a empezar.
>
> Está dividido en dos mitades que **no se mezclan nunca**: los personajes y escenarios
> (ilustración) van de la 1 a la 4; la **fotografía hiperrealista de producto** va aparte, en
> la 5, porque tiene otras reglas, otro tamaño y otro destino.

---

## 1 · Las siete reglas técnicas

Salieron de defectos reales que costaron tiempo. **Ninguna es opinión de estilo.**

### 1 · El fondo se pide del color del SITIO donde va la imagen — y hoy hay CUATRO sitios

La app **ya no es verde entera**. Tiene cuatro suelos distintos, y es fácil comprobarlo:

| dónde | fondo | selector |
|---|---|---|
| **lado de SANDO** — Signatures | verde `#1E3932` | `:root` |
| **lado de WICHO** — ARMA EL TUYO | **azul `#102430`** | `:root[data-lado="wicho"]` |
| panel admin claro | crema `#F3EEE1` | `.admin-light` |
| panel admin oscuro | negro `#000000` | `.admin-dark` |

Eso no es un detalle de implementación: **cada hermano ya tiene su propio suelo en la app.** Así
que SANDO se pide sobre verde y **WICHO se pide sobre azul**, no los dos sobre verde. Mafe, si
las bebidas llegan a tener sección propia, sobre el suyo.

#### Por qué pedir un fondo plano y no transparente

Porque los generadores casi nunca entregan un alfa limpio, y cuando no lo entregan **el daño no
se puede deshacer**. Los PNG de hoy se recortaron contra fondo claro: los píxeles del borde
quedaron semitransparentes **pero con el color blanco viejo**, y sobre cualquier fondo oscuro se
ve un contorno lechoso. Eso todavía se arregla.

Lo que **no se pudo arreglar** fue la sombra de piso. Se midió: la elipse bajo los pies de SANDO
es `rgb(219,229,228)` y la suela de su zapatilla es `rgb(200,209,206)`. **Es el mismo color.** Se
intentó separarlas por color, por relleno acotado y por textura local; las tres veces quedó con
los zapatos mordidos. La única salida fue cortar el PNG arriba de la mancha y perder los pies.

Sobre fondo plano del color correcto nada de eso existe: **la imagen se usa tal cual, sin
recortar.** Y si algún día hay que recortarla, el halo del borde es del color del fondo y es
invisible sobre ese mismo fondo.

#### Cuándo sí pedir transparente

Cuando la misma imagen tiene que vivir en **más de un suelo** — por ejemplo un personaje que
aparece tanto del lado de SANDO como del de WICHO. Ahí no queda otra, y entonces hay que
**probar el alfa antes de aceptar la imagen**: componerla sobre los cuatro fondos reales
(`#1E3932`, `#102430`, `#F3EEE1`, `#000000`) y mirar el borde en los cuatro. Si aparece un halo
en alguno, se descarta y se vuelve a pedir. **Mirarla sobre blanco no sirve de nada** — el halo
es blanco, así que sobre blanco es invisible: ese es justo el motivo por el que llegó a
producción.

### 2 · Prohibido explícitamente: sombra, suelo, elipse, reflejo, viñeta, marco

Hay que escribirlo en el prompt, aunque parezca redundante. Los generadores ponen una sombrita
bajo los pies por defecto porque "queda mejor", y esa sombrita es exactamente el defecto que
hizo perder una sesión entera. Va en el prompt con esas palabras.

### 3 · Mínimo 2048 px en el lado largo

Aritmética, no gusto. Las de hoy tienen **640 px**. La tarjeta del Signature ocupa **1050 px
reales** en un celular moderno (350 CSS px × DPR 3) y el reel es de **1080 px** de ancho. O sea
que hoy todo se estira ~1.7x. Con 2048 px sobra en los dos casos.

### 4 · Cuerpo entero, pies completos, aire alrededor

Nada tocando el borde del lienzo. Si el personaje llega justo al borde, no se puede reencuadrar
después sin cortarlo — y reencuadrar es el 90% de lo que se hace con estas imágenes.

### 5 · SIN IMAGEN DE REFERENCIA NO HAY ESTILO. Está probado.

**Esta es la regla que más caro sale ignorar, y se demostró el 2026-09-11.**

Se pidió SANDO dibujado en el estilo de WICHO. El prompt describía el estilo de WICHO con todo
el detalle posible —línea de grosor variable, trazos que se pasan, textura interna, rayado,
color saturado, energía de sticker, y prohibiciones explícitas de limpiarlo— y **no se pudo
adjuntar la referencia**, porque la herramienta solo acepta URLs y el archivo está en disco.

**El resultado no era el estilo de WICHO.** La identidad sí salió (el pelaje, la casaca, los
ojos tranquilos); el estilo, no.

La conclusión es limpia y sirve para todo lo que venga:

> **Las palabras transmiten QUÉ se dibuja. Solo una imagen transmite CÓMO se dibuja.**

Consecuencia práctica: **genera desde la interfaz web del generador (Flow, Gamma, el que sea),
donde puedes subir el archivo de referencia a mano**, y no desde una API que no lo acepta. Y
sube `sando_sonrie.png` para SANDO y `wicho_rie.png` para WICHO — **nunca las dos juntas**: los
estilos distintos son el concepto, y un generador al que le enseñas los dos los promedia.

### 6 · Nada de texto en la imagen

Ni el wordmark, ni el nombre, ni un precio. Los generadores escriben mal, y además el texto real
lo pone el código con la tipografía correcta. Lo único que sí va dibujado es el `//` **bordado o
estampado en la ropa**, y va descrito como "dos barras diagonales paralelas del mismo tamaño",
nunca como "el logo".

### 7 · El pan es SIEMPRE tipo sub/hoagie alargado

En toda imagen, de personaje o de producto. Los nombres de `BASES` (`CLASSIC // WHITE`,
`HERBS // CHEESE`, `FOCACCIA // ARTESANAL`) describen **sabor de la masa, no forma**.
**Nunca pan de molde en rebanadas.** Jamás.

---

## 2 · Bloque común — pégalo al final de TODOS los prompts de personaje

**Reemplaza `<FONDO>` por el color del sitio donde va la imagen** (tabla de la regla 1):
`#1E3932` para SANDO, `#102430` para WICHO, `#2B1B2A` para Mafe si se aprueba su fondo.

```
BACKGROUND: flat solid <FONDO> filling the entire frame, edge to edge.
No floor, no ground plane, no ellipse or oval under the character, no drop shadow,
no cast shadow, no reflection, no vignette, no gradient, no border, no frame.
Nothing behind the character but flat <FONDO>.
Full body, both feet fully visible, generous margin — nothing touching the canvas edge.
No text, no letters, no numbers, no logotype, no watermark.
PNG, 2048 px on the long side.
```

---

## 3 · Los tres hermanos

> **Sube siempre la referencia** (regla 5). El texto de abajo describe la identidad; el estilo
> lo lleva la imagen.

### 3.1 · SANDO — el curador · fondo verde `#1E3932`

Referencia: `img/sando_sonrie.png`.

```
Anthropomorphic chimpanzee character, full body, three-quarter view.
Fur: very dark olive green, almost black-green (#1E2B22), with a short pointed
tuft on the crown. Face mask, muzzle and inner ears in warm tan beige (#C9A87C),
with soft brown shading around the eye sockets.
Eyes: almond-shaped with a heavy upper lid — calm, unhurried, the look of someone
who has already decided. Dark iris, a single specular highlight.
Mouth: a short CLOSED half-smile. Teeth are never visible.
Wearing an olive-green bomber jacket with ribbed collar and cuffs over a plain
white crew tee, dark trousers, dark low sneakers. Two short parallel diagonal
slashes, both exactly the same size, embroidered in muted gold on the left chest.
ART STYLE (match the reference image exactly): clean editorial cartoon
illustration. Outline of EVEN, UNIFORM weight in very dark green — not pure black.
FLAT two-tone shading. No internal texture, no hatching, no grain, no gradients,
no brush marks. Mascot illustration, not sticker art.
```
+ el bloque común con `<FONDO>` = `#1E3932`.

### 3.2 · WICHO — el que arma · fondo azul `#102430`

Referencia: `img/wicho_rie.png`. **Se conserva su estilo tal cual.** Lo que se pide es el mismo
WICHO en poses nuevas y en grande, no un WICHO distinto.

```
Same anthropomorphic chimpanzee character as the reference image, in the exact
same illustration style.
Fur: light sky blue (#8CC8EC) with VISIBLE brush texture — the strokes show, it is
not a flat fill. Messy floppy tuft falling forward. Face mask and inner ears in
pale peach-pink.
Eyes: LILAC SPIRALS (#C3A6D2 over #4A3D62). This is his single most recognisable
feature — never replace them with normal eyes, not even in a calm pose.
Mouth: wide open grin, teeth and tongue visible, eyebrows up.
Wearing a grey-blue tee printed with fine tone-on-tone topographic contour lines,
dark cargo shorts, cream high-top sneakers. Two short parallel diagonal slashes,
both exactly the same size, printed on the chest.
ART STYLE (match the reference image exactly): loose energetic ink linework of
strongly VARYING weight in dark navy ink, lines that overshoot and do not always
close, visible internal texture and cross-hatching, saturated punchy colour,
sticker-art energy.
Do NOT clean him up. Do NOT flatten the shading. Do NOT give him an even outline.
Do NOT make him match a cleaner-lined character — the looseness is the point.
```
+ el bloque común con `<FONDO>` = `#102430`.

> ⚠ Si vuelve prolijo, con línea pareja o relleno plano, **se descarta y se vuelve a pedir**.
> No se retoca.

### 3.3 · MAFE — la hermana del medio · fondo ciruela `#2B1B2A` ⟡

> Se escribe **MAFE**, sin tilde. `MF` es su forma corta.

**Aprobada el 2026-09-11.** No tiene referencia todavía: esta sería su primera imagen, así que
conviene generar 4 variantes, **elegir una y guardarla como `img/mafe_ref.png`** — a partir de
ahí ella también se rige por la regla 5 y todas sus poses se piden contra esa referencia.

```
Anthropomorphic chimpanzee character, full body, three-quarter view. A young adult
— late teens, early twenties. Slimmer than her two brothers and a little taller
than the younger one. Relaxed, unbothered, effortlessly cool.
Fur: muted dusty rose-grey / dusty mauve (#C9A9B4, shadow #8E6C7A). Long hair tied
up carelessly with two loose strands falling forward. Face mask and inner ears in
warm cream.
Eyes: large with a LOW lid, iris SOFT and DIFFUSE rather than crisply defined, as
if seen through glass. The expression is UNIMPRESSED, not serene — one eyebrow
sits higher than the other. Mouth small, closed; if she smiles it is one-sided.
Wearing an oversized tee that hangs loose, wide baggy cargo trousers, worn flat
sneakers. NO apron — she is not cooking, she already cooked. Two short parallel
diagonal slashes, both exactly the same size, small and tone-on-tone on the chest.
POSE: leaning, weight on one hip, ALWAYS holding a tall glass bottle of cold
hibiscus infusion, deep rose liquid. The bottle is her object the way the sandwich
is her brothers'.
ART STYLE (critical): loose watercolour and ink wash on textured paper WITH
DELIBERATE RISOGRAPH MISREGISTRATION — a second ink layer offset by two or three
pixels. NO closed outline anywhere; edges dissolve and bleed outward. Parts of her
body are genuinely TRANSLUCENT: what is behind her shows through. Visible pigment
granulation in the darker passages, visible paper tooth. Zine and gig-poster
energy, NOT delicate botanical watercolour.
Hibiscus rose (#E0708F) appears only in one clothing detail and in the liquid —
never as a fill across her body.
Do NOT give her a black outline. Do NOT give her flat fills. Do NOT make her look
like either of her brothers — she is painted, they are drawn.
```
+ el bloque común con `<FONDO>` = `#2B1B2A`.

> **El desfase de registro es lo que la hace joven.** Una acuarela limpia la volvería delicada y
> mayor, que es lo contrario de lo pedido. La risografía mal registrada es lenguaje de fanzine y
> de póster de concierto: se lee como alguien de veintipocos.
>
> ⚠ Sobre fondo plano, la parte translúcida deja ver ese fondo, que es justo lo que se busca. Su
> versión transparente se va a ver rara sobre cualquier otro fondo — es el precio de su estilo y
> conviene saberlo antes de pedirla.

---

## 4 · Escenarios y la imagen que falta

### 4.1 · LA QUE HAY QUE PEDIR PRIMERO — el corte

**Los dos hermanos sosteniendo el mismo sándwich partido en dos.** SANDO tiene la mitad
izquierda, WICHO la derecha, y entre las dos mitades queda el hueco: **ese hueco es el `//`**.

Hoy el logo y los personajes son dos cosas que conviven en la misma pantalla sin tocarse. Esta
imagen los vuelve una sola cosa: el `//` deja de ser un signo y pasa a ser **el corte que los dos
hermanos hacen**. Va en el hero, en Instagram y en la tarjeta del QR de la bolsa.

```
Two anthropomorphic chimpanzee brothers standing side by side, each holding one
half of the SAME long sub sandwich, cut cleanly down the middle. The two halves are
held slightly apart, cut faces towards the viewer, so a narrow diagonal gap of empty
background is left between them.
LEFT: the calm dark-olive brother in the olive bomber jacket, clean uniform outline,
flat two-tone shading, holding his half level and steady.
RIGHT: the sky-blue brother with lilac spiral eyes and the contour-line tee, loose
varying ink linework and visible texture, holding his half tilted and about to bite.
EACH BROTHER KEEPS HIS OWN ART STYLE. They are deliberately drawn as if by two
different hands. Do NOT unify the two styles.
The bread is a long sub / hoagie roll — never sliced sandwich bread.
```
+ el bloque común con `<FONDO>` = `#1E3932`. **Esta va del lado verde**: es la imagen de marca,
no la de un lado ni la del otro.

### 4.2 · Escenarios para Flow

Se piden **VACÍOS, sin personajes y sin manos**. Así cada escena sirve para los tres hermanos y
no hay que regenerarla al cambiar de personaje.

**El bloque de la cocina va IDÉNTICO en las escenas 1 a 4.** Si se reescribe en cada una, no se
ven como la misma cocina — mismo mecanismo que el párrafo fijo de la sección 5.

```
Night kitchen. Deep green tiled wall (#1E3932) up to mid-height, worn steel prep
table, a SINGLE warm bulb hanging low over the table, everything beyond it
falling to black. No window, no daylight, no clock — it is always night here.
One warm light source from above, clear direction, long shadows. Never flat
studio light.
No people, no characters, no hands in frame.
No text, no letters, no signage, no logotype, no watermark.
```

**1 · LA COCINA** — bloque fijo +
```
Wide establishing shot of the empty kitchen. Mise en place containers lined up
along the steel table, lids on, everything at rest before service.
```

**2 · LA TABLA DE SANDO** — bloque fijo +
```
Close three-quarter view of a worn wooden cutting board on the steel table.
Everything sits at right angles. ONE knife. Ingredients already portioned into
equal piles. Nothing open, nothing half-used. The order itself is the subject.
The bread is a long sub / hoagie roll — never sliced sandwich bread.
```

**3 · EL MOSTRADOR DE WICHO** — bloque fijo +
```
Close three-quarter view of a prep counter where EVERY topping container is open
at once, sauce bottles caught mid-squeeze, one spoon in the wrong container.
Same warm light, but here the disorder is the subject.
The bread is a long sub / hoagie roll — never sliced sandwich bread.
```

**4 · LA BARRA DE MAFE** — bloque fijo, **cambiando la línea de luz por**
`BACKLIT: the light passes THROUGH the liquid instead of bouncing off it.` +
```
A row of tall glass jars of infusion at rest along the bar, half-litre glass
bottles, ice, a strainer. Deep rose hibiscus bleeding slowly into clear water
inside one of the jars. The only place in this world where you can see THROUGH
something.
```

**5 · LA BOLSA** — **sin** bloque fijo, es afuera
```
A closed branded greaseproof paper bag on a dark surface at night, a small card
tucked just inside the fold. Warm low light from one side, deep shadow behind.
No motorcycle, no courier, no face, no people, no hands.
No text, no letters, no signage, no logotype, no watermark.
```

**6 · LA MESA DEL CLIENTE** — **sin** bloque fijo, y **la luz se invierte a propósito**
```
An ordinary table in an ordinary room. No kitchen, no green tiles, no brand
colour anywhere. Cooler, flatter, more neutral daylight — deliberately different
from the warm kitchen light. The sandwich has arrived and belongs to someone else.
The bread is a long sub / hoagie roll — never sliced sandwich bread.
No people, no characters, no faces.
No text, no letters, no signage, no logotype, no watermark.
```

> **Por qué el 6 rompe las reglas.** Los cinco primeros comparten luz cálida y verde de marca;
> la mesa del cliente no. Ahí el producto ya salió del mundo de SND//WCH. Ese corte de
> temperatura es lo que hace que el cierre de un video se sienta como una entrega.

### 4.3 · Las poses que le faltan a WICHO

SANDO tiene `mira`, `piensa` y `serio`; WICHO **no tiene ninguna de las tres**. Son las que hacen
falta para los estados de espera, de error y de vacío de la app.

Se piden con la ficha de WICHO (3.2) cambiando solo el gesto:

```
WICHO MIRA    — head turned, looking off to one side, eyebrows slightly raised,
                mouth closed for once. Waiting for something to happen.
WICHO PIENSA  — one hand up near his chin, eyes narrowed, mouth pursed to one
                side. Visibly struggling to decide, which for him is agony.
WICHO SERIO   — mouth a flat line, eyebrows down, shoulders squared. The rarest
                one: the spiral eyes stay, but everything else goes still.
```

> Los tres conservan **los ojos en espiral**. Es lo que la ficha ya dice que no se le quita
> nunca, ni siquiera en una pose tranquila.

## 5 · Fotografía hiperrealista de producto

> **Esta sección no se mezcla con la de arriba.** Acá no hay personajes, no hay verde de marca
> de fondo y no hay ilustración. Es fotografía de comida.

### El problema que estas reglas resuelven

Las 8 fotos de Signature que hay hoy vienen de **8 sesiones fotográficas ajenas distintas**: una
sobre tabla oscura con luz cálida dura, otra sobre plato gris con luz fría, otra sobre fondo
blanco de estudio. En la app, separadas por scroll, se disimula. **En un reel, con cortes de 2
segundos, salta** — se leen como resultados de una búsqueda de imágenes.

Lo que las unifica **no es el color, es el ENCUADRE**. Un viraje de color no arregla que una
tenga una botella de estudio y otra un mantel estampado; probado, casi no se nota. Cerrar el
encuadre sí: la escenografía sale del cuadro y queda pan y relleno, que es lo único que las ocho
de verdad comparten.

### Cómo se pide: un párrafo FIJO + un bloque variable

**El párrafo de montaje se copia palabra por palabra en las ocho.** Solo cambia el bloque del
relleno. Ese es el mecanismo entero — si el párrafo fijo se reescribe "mejorándolo" en cada
foto, vuelve el problema de las ocho sesiones.

#### Párrafo fijo (no lo edites entre fotos)

```
Professional food photography of a single long sub / hoagie sandwich, cut in half,
both halves standing with the cut faces towards the camera so the filling is fully
visible. Shot at a low 20-degree angle, close and tight: the sandwich fills the frame
edge to edge and the surface it rests on is almost entirely out of frame.
Lighting: one warm key light from the back left at 45 degrees, soft fill from the
right, deep warm shadows. Dark warm wooden surface, deep shadow falling to near
black behind. Shallow depth of field, focus on the cut face of the front half.
Warm colour temperature, rich and slightly desaturated, never bright or clinical.
No props, no plate, no cutlery, no drinks, no bottles, no fries, no side dishes,
no garnish scattered around, no patterned cloth, no hands, no people.
No text, no logo, no watermark.
Photorealistic, sharp, 1600 px minimum on the long side, 3:2 landscape.
```

**Por qué cada prohibición está ahí:** nada de papas fritas ni acompañamientos porque **no los
vendemos** (decisión del dueño, 2026-08-15) y una foto que los muestra promete algo que no
existe. Nada de botellas de gaseosa porque tampoco las vendemos — las bebidas de la casa van en
su propia foto. Nada de mantel estampado ni plato porque es justo la escenografía que hace que
las ocho no peguen.

#### Bloque variable — uno por Signature

Las porciones son las reales del negocio: **85 g de proteína en 15CM y 170 g en 30CM**, 92 g de
vegetales, 3 salsas incluidas. Pedir un relleno desbordado da una foto que el producto no cumple.

```
THE ORIGINAL  — slow-cooked shredded beef, tomato, pickle, red onion, aioli
                and honey mustard, on a plain white sub roll.
THE MARINARA  — beef meatballs in marinara sauce, MELTED MOZZARELLA, tomato,
                red onion, BLACK OLIVES, oil-and-vinegar Italian dressing,
                on a plain white sub roll.
THE SMOKE     — smoked Italian cold cuts, melted cheddar, red onion, pickle,
                tomato, smoky BBQ glaze, on a FOCACCIA-crumb sub roll
                (still sub-shaped).
THE FRESH     — drained tuna mixed with mayonnaise and cracked black pepper,
                and NOTHING ELSE. No lettuce, no tomato, no onion, no sauce
                on top. The restraint is the recipe.
THE TERIYAKI  — caramelised teriyaki chicken, tomato, sweet red pepper, peanut
                satay sauce and house sauce, on a plain white sub roll.
```

> ⚠ **Verifica la composición contra el panel antes de pedir la foto.** La receta vigente vive
> en `catalog_items`, no en el código: el dueño puede haberla cambiado sin desplegar nada. Una
> foto con un ingrediente que ya no lleva es una promesa rota, igual que un precio viejo.
>
> **SIG05 (menú secreto) no se fotografía nunca.** Su composición no se le revela al cliente;
> ese es el mecanismo entero.

### Las otras dos fotos que hacen falta

```
LAS TRES BEBIDAS — Three half-litre clear glass bottles in a row, backlit so the
light passes through the liquid: pale green mint infusion, dark cold-brewed black
tea, deep rose hibiscus. Condensation on the glass. Dark warm background falling to
black. Same warm key light as the sandwich shots. No labels, no text, no garnish,
no people. Photorealistic, 1600 px minimum, 3:2 landscape.
```

```
EL CORTE — Extreme close-up of a long sub sandwich being cut straight down the
middle with a chef's knife, the two halves just beginning to separate. Focus on
the blade and the cut face. Same warm key light, same dark wooden surface, same
deep shadow. No hands beyond the forearm, no props, no text.
Photorealistic, 1600 px minimum, vertical 9:16.
```

### Después de conseguirlas

Guárdalas en **`img/fuente/`**, no en `img/`. El script `scripts/tratar_fotos.py` lee de ahí,
aplica el tratamiento común —encuadre cerrado al ratio de la tarjeta, viñeta, viraje a la paleta
y grano fino con semilla fija— y escribe en `img/`.

**Esa dirección es lo que lo hace idempotente:** aplicar viñeta y grano sobre una foto que ya los
tiene la degrada un poco más cada corrida, y eso no lanza ningún error, solo va ensuciando el
archivo. Partiendo siempre del original no puede pasar. `npm run check:fotos` lo protege.
