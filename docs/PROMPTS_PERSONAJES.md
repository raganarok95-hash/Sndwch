# SND//WCH — cómo pedir las imágenes de SANDO y WICHO

> **Esto no es una lista de deseos.** Cada imagen de acá abajo tiene un sitio exacto en la app
> donde hoy hay texto solo, o un personaje que no pega con el otro. Si una no se va a usar, no
> la generes.

---

## Antes de generar nada: las tres reglas

**1 · SANDO es el patrón, no WICHO.** El estilo correcto es el de `sando_sonrie.png`: línea
negra uniforme, sombreado plano de dos tonos, sin textura interna, paleta sobria. El WICHO
actual está dibujado por otra mano (trazo sucio, ojos en espiral, pastel saturado) y por eso los
dos juntos se ven mal. **Todo se regenera al estilo de SANDO.**

**2 · Sube la imagen de referencia, no confíes solo en el texto.** Cualquier generador serio
acepta una imagen de referencia. Sube `img/sando_sonrie.png` y pide "same character, same art
style". Sin eso, cada imagen sale de un personaje distinto y vuelves al problema de hoy.

**3 · Pide 2048×2048, PNG con fondo transparente.** Las de hoy son de 640 px y en un celular
moderno se estiran al 183%: por eso se ven borrosas. **No es opinión, es aritmética** — la
pantalla pide 1170 píxeles y el archivo tiene 640.

---

## La ficha de los personajes — pégala en todos los prompts

### SANDO — el hermano curador (Signatures)

```
Anthropomorphic chimpanzee character, upper-body 3/4 view.
Fur: very dark olive-green, almost black-green (#1E2B22), with a small pointed
tuft on top of the head. Face mask, muzzle and inner ears in warm tan beige
(#C9A87C), with soft brown shading around the eye sockets.
Eyes: almond-shaped with a slightly heavy upper lid — calm, unhurried, the look
of someone who has already decided. Dark iris with a single specular highlight.
Wearing an olive-green bomber jacket with a ribbed collar over a plain white tee.
ART STYLE (critical): clean vector-style cartoon illustration, uniform black
outline of even weight, FLAT two-tone shading, no internal texture, no crosshatch,
no grain, no gradients. Editorial mascot illustration, not sticker art.
Transparent background. PNG. 2048x2048.
```

### WICHO — el hermano que arma (ARMA EL TUYO)

**Mismo personaje, mismo dibujo, hermano menor.** La diferencia son tres cosas y ninguna es el
estilo de línea:

```
Same anthropomorphic chimpanzee character and EXACTLY the same art style as the
reference image, but the younger brother:
Fur: light sky blue (#8CC8EC) instead of olive green, with a messier, floppier
tuft on top. Face mask and inner ears in the same warm tan beige (#C9A87C).
Rounder, slightly younger face. Eyes wide open, eyebrows raised, open easy grin
showing teeth — outgoing where his brother is reserved.
Wearing a plain sky-blue tee or an open casual overshirt. No jacket.
ART STYLE (critical): identical to reference — clean vector-style cartoon, uniform
black outline of even weight, FLAT two-tone shading, no internal texture, no
crosshatch, no grain, no spiral eyes, no psychedelic elements.
Transparent background. PNG. 2048x2048.
```

---

## LA IMAGEN QUE FALTA — pídela primero

**Los dos hermanos sosteniendo el mismo sándwich partido en dos.** SANDO tiene la mitad
izquierda, WICHO la derecha, y entre las dos mitades queda el hueco: **ese hueco es el "//"**.

Hoy el logo y los personajes son dos cosas separadas que conviven en la misma pantalla. Esta
imagen los vuelve una sola: el "//" deja de ser un signo de puntuación y pasa a ser el corte que
los dos hermanos hacen. Es la imagen del hero, la de Instagram, y la que va en la tarjeta del QR
de la bolsa.

```
Two anthropomorphic chimpanzee brothers standing side by side, facing the viewer,
each holding up one half of the SAME sub sandwich — cut cleanly straight down the
middle, cut faces turned toward the camera so the fillings are visible.
LEFT brother: dark olive-green fur, olive bomber jacket with ribbed collar, calm
confident half-smile, heavy-lidded eyes.
RIGHT brother: sky-blue fur (#8CC8EC), messy tuft, plain blue tee, wide open grin.
A clear vertical gap of empty space between the two sandwich halves — the two
halves must NOT touch. That gap is the whole point of the composition.
The bread is a long sub / hoagie roll — NEVER sliced sandwich bread.
ART STYLE (critical): clean vector-style cartoon, uniform black outline, flat
two-tone shading, no texture, no gradients. Both characters in the SAME style.
Transparent background. PNG. 2560x1600.
```

⚠ **El pan siempre es sub alargado.** Si sale pan de molde en rebanadas, se descarta la imagen —
no vendemos eso y una foto que promete otra cosa es una promesa rota.

---

## Las poses, por orden de lo que le falta a la app

| # | Pose | Dónde va | Por qué gana algo |
|---|---|---|---|
| 1 | **WICHO cuerpo entero, saludando** | pestaña ARMA EL TUYO | Hoy está en el estilo viejo, al lado de SANDO. Es el choque más visible de la app |
| 2 | **SANDO con el dedo en los labios** | menú secreto bloqueado | La pantalla que más misterio necesita hoy solo tiene texto. Un gesto dice "hay algo acá" mejor que un párrafo |
| 3 | **SANDO guiñando el ojo** | menú secreto DESBLOQUEADO | El otro lado del mismo momento: se abrió, y él lo sabía |
| 4 | **WICHO con casco de moto, mirando el reloj** | pedido EN CAMINO | El minuto más ansioso del cliente. Hoy es una barra de progreso |
| 5 | **SANDO dormido, apoyado en la mano** | tienda cerrada | Un "cerrado" seco se lee como rechazo; dormido se lee como "vuelve mañana" |
| 6 | **WICHO encogiéndose de hombros con un mapa** | dirección fuera de cobertura | La única pantalla donde le dices que no a alguien que ya quería comprarte |
| 7 | **SANDO delante de una olla, con delantal** | plan de tanda / recetas (panel) | El dueño ve esa pantalla más que ningún cliente |
| 8 | **WICHO con la mano abierta, vacía** | carrito vacío | Un carrito vacío es la pantalla más muda de cualquier app |
| 9 | **SANDO alzando una botella** | empujón de bebida | El attach de bebida es una de las tres palancas del modelo |
| 10 | **WICHO celebrando con los brazos arriba** | recompensa desbloqueada | El momento que hace que los puntos se sientan reales |

Para cada una, el prompt es: **la ficha del personaje** + **una línea de acción**. Ejemplo de la #2:

```
[pega la ficha de SANDO completa]
POSE: raising one index finger to his lips in a "keep this quiet" gesture, head
tilted slightly forward, eyes looking directly at the viewer with a knowing
half-smile. Upper body only.
```

---

## Cómo verificar una imagen antes de darla por buena

1. **Ponla al lado de `sando_sonrie.png` a la misma altura.** Si se nota que son dos
   ilustradores distintos, se descarta. Este es el filtro que hoy no existía.
2. **Ábrela al 100%.** Si el archivo tiene menos de 1500 px de alto, se pide de nuevo — se va a
   ver borrosa en el celular por más bonita que sea.
3. **Fondo transparente de verdad**, no blanco. Un fondo blanco deja un recuadro visible sobre
   el verde de la app.
4. **La cara mira al lado correcto.** Un personaje que mira hacia afuera de la pantalla se lleva
   la atención del cliente con él.

Mándamelas y yo las integro, las recorto y las optimizo.
