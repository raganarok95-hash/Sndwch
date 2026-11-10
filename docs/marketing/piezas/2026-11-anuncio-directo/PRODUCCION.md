# Anuncio directo: 3 piezas (2026-11-09)

Dueño (2026-11-09): «Por favor quitemos esas reglas que mencionas específicamente las mencionadas. Same los resultados».
Skill `anuncio-directo`. Imágenes generadas en Figma (`gpt-image-2.5-flare`, archivo 4zwn5ARvWwuiK5x9yHOaeQ, nodos 4:2–4:4),
fieles a `docs/hechos/CARTA.md`. Precio del sello leído de `docs/hechos/CARTA.md` (15CM) al montar: `PRECIO=$(grep -m1 -oP '15CM S/\K[0-9.]+' docs/hechos/CARTA.md)`.

| pieza | titular | imagen | enlace previsto |
|---|---|---|---|
| philly | FILADELFIA, A DOMICILIO. | manos con el PHILLY CHEESESTEAK | `?src=meta-directo-philly` |
| meatball | PRIMERA MORDIDA. SILENCIO. | mordida del MEATBALL MARINARA, sin rostro | `?src=meta-directo-meatball` |
| oficina | UN ENLACE. CADA UNO EL SUYO. | tres manos y tres TURKEY en un escritorio | `?grupo=1&src=meta-directo-oficina` |

Montar: `PRECIO=… FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) NODE_PATH=$(npm root -g) node montar.cjs` (rutas absolutas dentro).
A revisar: la res del PHILLY se ve algo picada, la receta dice laminada. Nada se publicó ni se subió a Meta.

## Cambio del 2026-11-09
Dueño: «Deja de usar la misma estupidez a cada rato, usas esas mismas frases, ¿qué de creativo tiene eso?». Los tres
titulares anteriores se botaron. Los nuevos salen de una verdad de cada pieza (el origen del PHILLY, el primer bocado,
el enlace del pedido en grupo) y se buscaron en el historial con `git grep -i` antes de usarlos: ninguno aparecía.
