# Los anuncios de Meta (2026-10-16)

Dueño, sobre las primeras piezas (las láminas del lanzamiento con fotos de stock): «Mejora los
anuncios, ya lo vi y no me gusta, mejóralo» · «genera imágenes fieles» · «Meta sí me sirve»
(arranca el viernes 23).

## El cambio

| antes | ahora |
|---|---|
| la lámina del Instagram de lanzamiento: foto de stock arriba, papel abajo con texto chico | **la comida a sangre ocupando todo**, un titular corto en grande, el precio y la marca |
| fotos de stock que no calzaban con la receta (el Turkey con pepino, el Tuna Melt abierto) | **fotos generadas fieles a la receta y a la porción** (ver abajo) |
| un solo formato (4:5) recortado para Historias y Reels | **dos**: 4:5 para el feed y 9:16 para Historias y Reels, con el texto fuera de las zonas que tapan los botones de Instagram |

Todo número de las piezas sale de la carta (`scripts/piezas/datos.ts`): se regeneran con
`node scripts/piezas/anuncios.mjs datos.json docs/marketing/anuncios/fotos docs/marketing/anuncios`
(con `FUENTES_CSS` de `scripts/piezas/fuentes-locales.sh` en una sesión de la nube).

## Las cuatro piezas

| pieza | titular | prueba | enlace |
|---|---|---|---|
| `philly-*.jpg` | «Hambre en serio.» | el producto estrella | `sndwch.app/?src=meta-philly` |
| `meatball-*.jpg` | «Hoy no cocinas.» | la cena | `sndwch.app/?src=meta-meatball` |
| `turkey-*.jpg` | «El almuerzo que no te tumba la tarde.» | el almuerzo en la casa o la oficina | `sndwch.app/?src=meta-turkey` |
| `oficina-*.jpg` | «¿Pides para la oficina?» | el pedido en grupo | `sndwch.app/?grupo=1&src=meta-oficina` |

El texto de arriba de cada anuncio es el «Cómo se vende» de la carta (`docs/hechos/CARTA.md`).

## Las fotos (generadas, fieles a la receta)

Generadas el 2026-10-16 con Figma (modelo `gemini-3.1-flash-image`, créditos del plan del dueño) y
revisadas una por una contra la receta. Se descartaron dos: un Meatball con un vaso de cerveza al
fondo (no se vende y Meta restringe el alcohol) y una oficina con gente. La porción se pidió como
la que se sirve: ~85 g de proteína en un pan de 15 cm, una capa, sin desbordar.

| foto | lo que se pidió (en inglés, como se generó) |
|---|---|
| `fotos/foto-philly.jpg` | 15 cm soft white sub roll; thinly sliced beef sautéed, sautéed onion, green bell pepper strips, melted orange cheddar on top; no sauce; moderate portion (~85 g of meat), not overstuffed; brown kraft paper, dark wood, side window light |
| `fotos/foto-meatball.jpg` | 15 cm soft white sub roll; ~4 small beef meatballs in marinara, melted yellow American cheese, a few fresh tomato slices and thin raw red onion; no herbs, no other cheese; moderate portion; kraft paper, evening lamp light; the only drink, a glass of iced hibiscus (The Bloom); no alcohol |
| `fotos/foto-turkey.jpg` | 15 cm soft white sub roll; thin folded roasted turkey slices, lettuce, tomato, thin red onion, green bell pepper, a little oil and vinegar; no cheese, no cucumber, no mayonnaise; ~85 g of turkey; kraft paper on a desk next to a laptop, midday light |
| `fotos/foto-oficina.jpg` | empty office table at lunchtime: five 15 cm subs fully wrapped in white paper (no filling shown), two plain brown delivery bags, a laptop, iced tea; no people; no logos |

WICHO (`img/wicho2_celebra.png`) es el personaje real de la marca, puesto encima: no se genera.

## El Turkey, regenerado (2026-10-16, Calidad; dueño: «Regenerar en Figma»)

Calidad retuvo la foto del Turkey en la Puerta 1: el pan era una baguette enharinada de corteza
gruesa y llega un pan blanco suave (Classic // White); además traía el logo de la laptop y una
botella de agua. `fotos/foto-turkey-v3.jpg` (Figma, `gemini-3.1-flash-image`) corrige el pan, la
laptop y la botella. Pedida así:

> Realistic food photograph, natural midday window light. A single 15 cm submarine sandwich on a
> SOFT WHITE SUB ROLL: pale golden thin soft crust, soft white crumb, smooth top, no flour dusting,
> not a baguette, not crusty, not rustic, no seeds. Filling, single layer, moderate realistic
> portion (about 85 g of turkey), not overstuffed: thin folded slices of roasted turkey breast,
> crisp green lettuce, fresh red tomato slices, thin raw red onion rings, thin green bell pepper
> strips, a light drizzle of oil and vinegar. NO cheese, NO cucumber, NO mayonnaise, NO herbs. […]
> On the left edge, part of a closed plain silver laptop with a completely blank lid […] No people,
> no hands, no bottles, no glasses, no salt or pepper shakers, no logos, no text, no alcohol.

**Pendiente**: el sándwich quedó chico en el cuadro y de costado (el estilo pide la mitad a dos
tercios, en tres cuartos). La segunda variante no salió: se acabaron los créditos de IA de Figma del
día (vuelven a las 00:00 UTC). Se pide otra más cerca apenas vuelvan.


`fotos/foto-turkey-v3-cerca.jpg` es la v3 recortada más cerca del sándwich (sin generar nada
nuevo). La usa el lanzamiento de Instagram (la carta y la lámina del Turkey) en vez de
`img/sig10.jpg`, que muestra pepino (dueño, 2026-10-16: «Sí, foto fiel»).
