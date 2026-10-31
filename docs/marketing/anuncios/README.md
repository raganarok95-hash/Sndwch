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

## El Turkey v4, más cerca (2026-10-17)

`fotos/foto-turkey-v4.jpg` (Figma, `gemini-3.1-flash-image`): el mismo prompt de la v3 con «CLOSE-UP:
a single 15 cm submarine sandwich fills half to two thirds of the frame, three-quarter angle», sin
laptop. Es la que usan las finales del anuncio (`piezas/2026-10-anuncio-turkey/final/`).

## Los Signatures en 30 cm, partidos en dos (2026-10-30)

Dueño: «No se ven grandes los sándwiches, dan la impresión de ser un pan pequeño, y recuerda que el de 15 siempre es la
mitad de uno de 30». Las fotos anteriores mostraban un pan corto cerrado por las dos puntas, y ese pan no existe en la
carta: el de 15 cm es la mitad de uno de 30, con una punta redonda y un corte.
- **La toma nueva:** el de 30 cm partido en sus dos mitades, con las caras del corte de frente y el relleno a la vista,
  sobre kraft y madera oscura.
- **Lo que se probó:** también una versión con la nota «En la foto, el de 30 cm · el de 15 es la mitad». El dueño eligió
  «Así, pero sin la nota».

| archivo | herramienta | lo que pide el prompt |
|---|---|---|
| `fotos/foto-philly-30.jpg` | Gamma (`generate_image`, tipo foto, 4:5), porque Figma no tenía créditos | 30 cm Philly cheesesteak on a soft white sub roll, cut into two 15 cm halves, cut faces to camera: thinly sliced sautéed beef, sautéed white onion, green bell pepper, melted cheddar; no sauce; each half one rounded end and one cut end; generous but realistic; kraft paper, dark wood; no drinks, text or people |
| `fotos/foto-meatball-30.jpg` | Figma, `gpt-image-2.5-flare` (1024 × 1280) | 30 cm meatball marinara sub cut into two halves: small beef meatballs in marinara, melted yellow American cheese, tomato slices, thin red onion; no herbs, no other cheese; behind, a slim 355 ml clear PET can with ruby hibiscus drink and a plain magenta label without text |
| `fotos/foto-turkey-30.jpg` | igual | 30 cm turkey sub cut into two halves: thin folded roasted turkey, lettuce, tomato, red onion, green bell pepper, a little oil and vinegar; no cheese, no cucumber, no mayonnaise |
| `fotos/foto-tuna-melt-30.jpg` | igual | 30 cm hot tuna melt cut into two halves: chunky flaked tuna (never a paste) with a little mayonnaise and white pepper, under melted cheddar that stretches; no vegetables |
| `fotos/foto-italian-hoagie-30.jpg` | igual | 30 cm Italian hoagie cut into two halves: three Italian cold cuts folded in pleats, yellow American cheese, shredded lettuce, tomato, red onion, green bell pepper, oil and vinegar |
| `fotos/foto-classic-tuna-30.jpg` | igual | 30 cm classic tuna sub cut into two halves: chunky flaked tuna with just the right mayonnaise and white pepper; nothing else |

Las seis van sobre kraft arrugado y madera oscura, con luz de ventana, y en todas la toma es la misma: cada mitad con
una punta redonda y un corte, el relleno generoso pero real. El recorte en la publicación (`ENCUADRE` en `final.cjs`)
deja la foto a su ancho completo para que ninguna mitad quede cortada.
