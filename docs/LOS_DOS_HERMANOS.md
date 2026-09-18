# Los dos hermanos como IDIOMA DE INTERFAZ

> Escrito el 2026-09-17 después de que el dueño tuviera que corregir tres rondas seguidas de
> diseño con la misma frase: *«no es solo un color»*. Tenía razón. Yo venía tratando la
> identidad de cada hermano como una capa de pintura sobre un mismo layout — cambiaba el tono
> y dejaba la estructura igual. Eso es un reskin, un nivel más arriba.
>
> Todo lo de acá **sale de sus fichas reales** (`docs/PROMPTS_PERSONAJES.md`, sección 3) y de
> muestrear sus PNG con código. Nada está elegido a ojo.

## La regla que ordena todo

**El mundo de cada hermano se construye con lo que ESE hermano es** — su color, su textura, su
tipo de línea, su forma de reaccionar. No con un tono que quede bonito. Si un elemento no se
puede rastrear a algo suyo, no va.

Y la diferencia entre los dos no puede ser solo cromática: **si pones las dos pantallas en
blanco y negro, se tienen que seguir distinguiendo.**

---

## SANDO · el curador

> ⚠ **Su ficha en `PROMPTS_PERSONAJES.md` está vieja y no describe el dibujo real.** Dice
> «contorno de grosor parejo, sombreado PLANO de dos tonos, sin textura, sin marcas de pincel».
> Mirando `img/sando_cuerpo.png` de cerca, su casaca tiene **pinceladas visibles** y el contorno
> **le varía de grosor**. El dueño lo confirmó el 2026-09-17: los dos comparten tipo de dibujo y
> el que se acerca es SANDO. **Así que "línea pareja / dos tonos planos / cero textura" NO es su
> identidad — es justo lo que hay que corregirle.** Su identidad es todo lo demás.

Lo que sí es suyo, mirado del dibujo y no de la ficha:

| elemento | de dónde sale | cómo se usa |
|---|---|---|
| **El forro NARANJA** `#D8823C` | la tira del forro que asoma en la abertura de su bomber | **El único naranja de toda la marca.** No es cremallera ni va a rayas: es una franja lisa y vertical. Le da la temperatura que un mundo de verde y dorado no tiene. Se usa poquísimo y siempre vertical. |
| **El acanalado (rib)** | puños y basta de su bomber | Franjas verticales finas y regulares. Donde haya que llenar un campo suyo, se llena con rib. |
| **El `//` bordado** | su pecho izquierdo | Bordado en el verde de la tela, apenas más oscuro. Discreto, nunca dorado brillante. |
| **Oliva salvia** `#6C7860` | el cuerpo de la casaca | La superficie de su mundo. |
| **Verde casi negro** `#183024` | su pelaje | El fondo. |
| **Tan cálido** `#C9A87C` | su hocico y máscara | Su segundo tono. |
| **Dorado apagado** `#CBA258` | el `//` y el dinero | Lo único que hay que mirar. Apagado, nunca brillante. |
| **Ojo almendrado, párpado pesado, boca cerrada** | su cara | Su mundo no grita: sin exclamaciones, sin globos, sin rebotes. La jerarquía la hace el tamaño. |

## WICHO · el que arma

De su ficha: pelaje celeste `#8CC8EC` **con textura de pincel VISIBLE — se ven las cerdas, no es
un relleno plano**. Mechón desordenado cayendo al frente. Máscara y orejas en **rosa durazno
pálido**. Ojos: **ESPIRALES LILA `#C3A6D2` sobre `#4A3D62` — su rasgo más reconocible, jamás se
reemplazan**. Boca: **sonrisa abierta, dientes y lengua a la vista, cejas arriba**. Polo
gris-azul **estampado con curvas de nivel finas, tono sobre tono**. Trazo de tinta **suelto y de
grosor MUY VARIABLE en azul marino oscuro, líneas que SE PASAN y no siempre cierran**, textura
interna y **trama cruzada**, color saturado, energía de sticker.

### Su idioma

| elemento | de dónde sale | cómo se usa |
|---|---|---|
| **La espiral** | sus ojos | Su marca funcional: el avance de los seis pasos es una espiral que se cierra, el "cargando" gira, el secreto es un ojo. Nadie más la usa. |
| **Curvas de nivel** | el estampado de su polo | **El fondo de todo su mundo.** Tono sobre tono, finas, a bajo contraste. Es lo más suyo que existe y no estaba en ninguna pantalla. |
| **La línea que se pasa y no cierra** | su trazo | Sus subrayados sobresalen de lo que subrayan; sus marcos no cierran en las esquinas. Lo elegido se marca con un **círculo de tinta hecho a mano**, como si lo hubiera encerrado con plumón. |
| **Grosor variable** | su contorno | Sus trazos no son parejos. Un borde suyo engorda y adelgaza. |
| **Trama cruzada** | su sombreado | El relleno de lo seleccionado, en vez de un color plano. |
| **Rosa durazno** | su máscara y orejas | Su segundo color, el que corta el celeste. |
| **Volumen** | boca abierta, cejas arriba | Su mundo sí puede exclamar, exagerar y moverse. |

**Su color base** (muestreado de `img/wicho.png`): pelaje `#90CCF0` · tinta `#1E2F3A` ·
espiral `#C3A6D2` sobre `#4A3D62` · durazno `#F0D8CC`.

---

## Cuáles son obligatorios (confirmado por el dueño, 2026-09-17)

**Ninguno es obligatorio en todas las pantallas — solo los más característicos.** El reparto,
confirmado:

- **Siempre presentes, porque son los que se reconocen sin leer:** de SANDO el **forro naranja**,
  el **acanalado** y el **tan cálido**; de WICHO la **espiral**, las **curvas de nivel** y el
  **rosa durazno**.
- **Solo donde toca:** el `//` bordado va en las pantallas donde el hermano aparece en persona —
  y ojo, **si su figura está en pantalla el `//` YA ESTÁ**, bordado en su casaca dentro del propio
  dibujo. No hay que agregarlo aparte.
- El resto (oliva salvia, verde casi negro, lila, tinta) son la paleta de apoyo y se usan donde
  hagan falta.

⚠ **Y este documento se ABRE antes de dibujar, no después.** Se escribió el 2026-09-17 por la
mañana y esa misma tarde se diseñaron tres pantallas de SANDO sin consultarlo: de sus ocho
elementos se usó bien UNO, el naranja apareció como un rótulo de 8px en vez de una franja, y el
acanalado no estaba en ninguna. Escribir la regla no la pone delante en el momento de generar.
**El paso es: abrir esta tabla y escribir dónde va cada elemento ANTES de la primera etiqueta.
Si un elemento característico no tiene sitio asignado, la pantalla no está terminada.**

## El sistema de SANDO — aprobado por el dueño el 2026-09-17

Salió de tres sistemas propuestos: se tomó **él y su frase** de uno y **la foto grande y limpia**
de otro. Lo aprobado:

| | |
|---|---|
| **Fondo** | papel crema `#EFE6D4` — sale de su tan. **Su lado dejó de ser oscuro.** |
| **Tinta** | `#1E2B22`, su pelaje |
| **Acento** | el naranja del forro `#D8823C`, en franja vertical |
| **Apoyo** | oliva salvia `#6C7860` |
| **Display** | Anton, en mayúsculas, para nombres y títulos |
| **Su voz** | Instrument Serif en itálica — su frase firmada |
| **Texto** | EB Garamond |
| **Números** | IBM Plex Mono — precios tabulares |

**⚠ Ya NO se usa el dorado sobre verde casi negro con Bodoni Moda.** Esa combinación era la de la
app anterior, y es la razón por la que cinco rediseños seguidos de su carta le siguieron
pareciendo la web vieja al dueño: se le cambiaba la estructura y la piel seguía siendo la misma.
El dorado sigue existiendo solo en el `//` del wordmark.

Lo que se aprobó de la composición: él abre la carta con su frase firmada; **la foto va grande y
sin NADA encima** —el texto vive debajo, sobre el papel—; el forro corre vertical a todo lo alto;
el acanalado separa plato de plato. El menú secreto entra en el mismo ritmo pero **sin número de
carta** (no está en la carta, no puede tener número), con el nombre una sola vez y, donde los
otros llevan precio, lo que te falta.

### ⚠ ESTO NO ES UNA PLANTILLA

**Aprobado no significa replicar.** Palabras del dueño al cerrarlo: *«puedes guardar que me
gustó, pero no necesariamente vas a replicarlo. Deja de buscar lo más fácil: en diseño importa
solo cómo se vea.»*

Copiar esta composición a las demás pantallas porque ya está aprobada es exactamente el camino
fácil de siempre, con otro disfraz. **Lo que se conserva es la paleta, las tipografías y los
elementos; la composición se decide pantalla por pantalla, mirando cómo queda.** Un carrito, una
ficha de producto y una pantalla de pago no tienen por qué componerse como una carta.

### La espiral se genera por cálculo, nunca a mano

Se dibujó dos veces a mano en SVG y las dos salió un trébol cortado en vez de una espiral. Se
genera con un bucle —radio creciente sobre el ángulo, ~3.6 vueltas— y sale bien siempre.

## ⚠ Lo que NUNCA se hace

- **Teñir una foto de comida con el color del hermano.** Error real cometido el 2026-09-17: se
  puso un velo celeste encima de las proteínas y la comida salió azul. La comida se ve como es;
  el color del hermano vive en la superficie de ALREDEDOR.
- **Inventarle a un hermano algo que no tiene.** Se le dibujó a SANDO una cremallera a rayas
  naranja y crema que su casaca no lleva. Lo que sí tiene, y hay que abrir el PNG para verlo, es
  el **forro naranja liso** de la abertura, el **acanalado** de puños y basta, y el `//` bordado.
- **Llamar "descuidado" al trazo de WICHO.** No lo es, y el dueño lo corrigió: su línea es la
  buena. El que se acerca es SANDO — **sin tocarle figura, ropa, color ni expresión**, solo el
  tratamiento del trazo. Y por ahora SANDO se queda tal cual está.
- **Elegir un tono "que combine".** Se muestrea del PNG con código, o no va.


---

## La altura: SANDO es 1.4 veces WICHO (2026-09-18)

Cuando los dos salen en la misma pantalla, **SANDO es alto y delgado y WICHO bajo y ancho**.
No basta con pegarlos: hay que fijar la proporción, porque los archivos tienen encuadres
distintos y a igual altura de caja WICHO se ve MÁS grande —su cabeza ocupa mucho más de su
cuerpo— y la escena se lee al revés de como es.

**Regla: SANDO ≈ 1.4 × la altura de WICHO.** En la pantalla de entrada son 288 px contra
208 px. Se escala por `height` con `width:auto`, nunca por `width`: los dos archivos tienen
proporciones muy distintas (`sando2_cuerpo` es 1:2.66 y `wicho_cuerpo` 1:1.43), así que
igualar anchos deforma la relación.

⚠ **Y dejarles aire arriba.** Pegar a SANDO al borde superior de su contenedor le corta el
mechón, y es de lo primero que se nota. Error real, corregido por el dueño.
