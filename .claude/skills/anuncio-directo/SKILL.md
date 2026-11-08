---
name: anuncio-directo
description: La fórmula del anuncio de respuesta directa de SND//WCH (bloque de color con titular corto, sello «DESDE» con el precio real, una línea de cómo pedir e imagen generada del sándwich fiel a la receta, con manos o alguien comiendo). Úsala para producir en serie anuncios y posts de venta de SND//WCH.
user-invocable: true
---

# Anuncio directo

Dueño (2026-11-08), sobre dos anuncios de otra marca de delivery: «Ejemplo de publicidad creativa y bien realizada,
¿qué necesitas para generar un skill que pueda replicar los conceptos que se emplean y hacerlas constantemente para
mi?» y «Allí no existen fotos reales». Se toma **la fórmula**, nunca su marca, sus colores ni sus textos.

## La fórmula (por qué funciona)
| pieza | qué hace | regla en SND//WCH |
|---|---|---|
| **Bloque de color arriba** (~40% del alto) con el titular | se lee en un segundo, aunque el pulgar no pare | papel `#EFE6D4` con tinta `#1E2B22`, o al revés. Una sola marca por pieza: el logo con el `//` arriba a la derecha |
| **Titular de 3 a 4 palabras con punto final** | un momento o un antojo, no una descripción | Anton en mayúsculas. Ejemplos de tono: «HAMBRE EN SERIO.», «HOY NO COCINAS.», «EL ALMUERZO RESUELTO.» |
| **Una línea de cómo pedir** | quita la duda de «¿y cómo lo consigo?» | IBM Plex Mono o Instrument Serif: «Lo pides en sndwch.app y llega.» |
| **Sello «DESDE S/…»** | el precio de entrada ancla y filtra | **el número sale de la base** (el 15CM más barato de `catalog_prices`, vía `docs/hechos/CARTA.md`), nunca escrito a mano |
| **La comida grande, con manos o alguien comiendo**, abajo (~60%) | la mano y el bocado hacen que la mente «lo pruebe» (Elder y Krishna, *Journal of Consumer Research*, 2012) | imagen generada, fiel a la receta (abajo) |
| **Botón a la app** | un solo camino | `sndwch.app/?src=meta-<pieza>`; en orgánico, enlace en la biografía |

## La imagen generada, fiel a la receta
- Con `producir-piezas` §2: el prompt en inglés desde `docs/hechos/CARTA.md`, cada ingrediente real, lo que NO lleva
  en negativo explícito, **la porción real** (pan de 15 cm, una capa, ~85 g de proteína). INDECOPI sanciona la imagen
  que promete más relleno del que llega.
- Personas generadas: manos o la parte baja de la cara, sin rostro reconocible, ropa neutra. Nunca alcohol ni nada
  que no se venda. La bebida, solo la botella de 500 ml mientras no haya latas.
- Variantes por serie: 1 sándwich en mano · 2 o 3 sándwiches compartidos sobre la mesa (oficina) · el corte del 30CM.
- Cada pieza estrena imagen (`estilo-sndwch` regla 7).

## Cómo se produce en serie
1. Elegir de la carta qué se vende esta semana (`ingenieria-de-carta`: primero los que más dejan; el ITALIAN HOAGIE
   no va primero).
2. Titular y línea con `voz-sndwch`; `por-que-vende` dice por qué, con su fuente o «sin evidencia».
3. Imagen en Figma (`generate_image`) y maqueta en Claude Design (`claude-design`), 1080×1350 y 1080×1920.
4. Calidad: `verdad-y-ley` (porción, precio de la base, sin promesas que no existen).
5. El dueño elige. Después se monta y, si es anuncio, se crea **en pausa** (`pauta-medible`).

## Lo que nunca
Copiar el logo, la paleta, el sello o las frases de la referencia; escribir un precio a mano; publicar o prender un
anuncio sin el sí del dueño.

## Pendiente del sí del dueño (2026-11-08)
Esta fórmula choca con tres reglas vigentes; hasta su sí, se produce solo como maqueta:
1. `estilo-sndwch` regla 2: «nada de bloques de color».
2. `estilo-sndwch` regla 1: «nadie en el cuadro hasta que haya fotos reales».
3. `CONCEPTO_DEL_NEGOCIO.md` §8: «no poner el precio en anuncios para quien no nos conoce».
