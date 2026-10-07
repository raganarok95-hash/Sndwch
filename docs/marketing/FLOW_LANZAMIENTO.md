# Imágenes para el lanzamiento, en Flow (gratis) — 2026-10-07

Dueño: «Si ya tienes acceso a Flow, puedes producir imágenes totalmente gratis». **Desde la sesión
en la nube no hay acceso a Flow**: Flow no tiene API y solo se maneja con un navegador con tu
cuenta de Google (`docs/FLOW_EN_TU_LAPTOP.md`). Las imágenes de Flow sí son gratis con tu cuenta.

## Cómo se hace (una vez instalado el MCP en tu laptop)

1. `claude mcp add --scope user google-flow -- npx -y google-flow-browser-mcp`
2. En la carpeta del repo, abre Claude Code y pégale esto:

> Lee `docs/marketing/FLOW_LANZAMIENTO.md`. Genera en Flow cada imagen de la tabla con tus
> personajes @SANDO y @WICHO como referencia, formato vertical 4:5, sin texto en la imagen.
> Guarda cada una como `docs/marketing/lanzamiento/flow/<archivo>.png`, commitea y haz push a la
> rama `claude/business-app-analysis-axbhx0`. No publiques nada.

3. La sesión de la nube compone las piezas con esas imágenes y te las muestra.

## El bloque fijo (va al final de cada prompt)

```
Vertical 4:5. Illustration in the exact style of the reference characters, not photographic
for the characters. The two brothers keep their own art styles: SANDO (dark olive chimp,
olive bomber jacket with orange lining, calm, heavy eyelids, mouth closed) and WICHO
(sky-blue brush-textured chimp, lilac spiral eyes, open grin, grey-blue contour-line tee).
Night kitchen: deep green tiles, one warm hanging bulb, everything else falls to black.
No text, no letters, no logos, no watermark. Leave the top 30% calm for a headline.
Any sandwich shown is a long sub/hoagie roll with exactly the real recipe stated.
```

## Las imágenes

| archivo | para qué pieza | prompt |
|---|---|---|
| `hermanos-portada` | Son hermanos (portada) | SANDO holding ONE perfect, neat sub at chest height, looking at it with quiet pride; WICHO next to him holding an overloaded sub with sauce dripping and toppings falling, laughing. They are back to back. |
| `sexta-salsa-1` | La tira, viñeta 1 | WICHO holding six sauce squeeze bottles at once, manic joy, sauce in the air. |
| `sexta-salsa-2` | La tira, viñeta 2 | SANDO close-up, deadpan, one eyebrow slightly raised, looking off-frame. |
| `sexta-salsa-3` | La tira, viñeta 3 | WICHO shouting with his arms open, bottles flying, sauce splashes everywhere. |
| `sexta-salsa-4` | La tira, viñeta 4 | SANDO calmly holding up ONE sauce bottle, unimpressed; behind him a tidy wooden board. |
| `arma-portada` | Arma el tuyo | WICHO building a sub in mid-air: bread open, slices of turkey, tomato, onion, pepper and cheese floating in a spiral above it. |
| `oficina` | ¿Pides para la oficina? | WICHO walking in with a paper list so long it drags on the floor, a tower of delivery bags in the other arm, proud. |
| `abrimos` | Abrimos el martes 13 | SANDO and WICHO opening the kitchen doors from inside, warm light spilling out toward the viewer, WICHO peeking, SANDO steady. |
| `philly-anatomia` | Anatomía del Philly | Exploded vertical view of a Philly Cheesesteak sub, PHOTOREALISTIC food: bottom bun, thin seared beef, sautéed onion, green pepper strips, melted cheddar, top bun, each layer floating slightly apart. No sauce. Real portion, not oversized. Dark background. |

La última es el sándwich generado: **fiel a la receta** (res laminada, cebolla, pimiento, cheddar,
sin salsa; `_shared/carta.ts`) y a la porción real (CLAUDE.md, INDECOPI).
