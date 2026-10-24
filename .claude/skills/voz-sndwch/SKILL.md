---
name: voz-sndwch
description: La voz escrita de SND//WCH (titulares, textos de anuncios, captions, historias, respuestas) y la de cada hermano, SANDO y WICHO, con sus reglas de cifras y de idioma. Úsala para escribir cualquier texto que vea un cliente de SND//WCH.
user-invocable: false
---

# La voz

## Las tres voces de una pieza (las mismas que la letra del estilo)
| voz | qué dice | reglas |
|---|---|---|
| **El titular** (Anton) | **el momento** | 5 palabras o menos. Sin signos de exclamación. Se entiende sin la foto. |
| **La frase** (Instrument Serif itálica) | **la verdad del producto** | sale de «Cómo se vende» de `docs/hechos/CARTA.md`; una frase. **Tiene que vender**, y cada frase se valida con `por-que-vende` antes de mostrarla (dueño, 2026-10-24). Se dice en positivo (lo que es, no lo que le falta) |
| **El dato** (IBM Plex Mono) | precio, cómo pedir | siempre interpolado desde la carta, nunca escrito |

## Los hermanos
- **SANDO** cura: sobrio, seguro, frases cortas, sin exclamaciones, decide por ti. «No lo pienses.
  Ya está resuelto.» Habla de los Signatures.
- **WICHO** arma: exagera, se ríe, se enreda, se mueve; sí puede exclamar. Habla de armar el tuyo,
  del grupo, del caos.
- En la serie **no hablan con voz**: el texto va en pantalla.
- En un anuncio de producto, a lo más **firman** una frase («— SANDO»).

## Reglas de idioma
- **Tú, nunca voseo.** Español neutro de Perú; sin jerga regional ni de Trujillo.
- Sin «gran inauguración», sin «el mejor de la ciudad», sin superlativos que no se pueden probar.
- Sin palabras de salud («saludable», «light», «ligero»): «llena sin pesar» es el máximo.
- **Cifras**: precio, hora, mínimo o premio van como marcador (`{precio15}`, `{abre}`,
  `{organizadorDesde}`) o se leen de `scripts/piezas/datos.ts`. Si nombras un producto canjeable
  según un número editable, el nombre también se deriva.
- No se nombra un mecanismo apagado.

## Los textos de un anuncio de Meta
- **Texto principal**: se ven ~125 caracteres antes del «ver más». Primera línea = el momento o
  el producto; segunda = la verdad de la carta; tercera = cómo pedir.
- **Titular del anuncio** (debajo de la imagen): 40 caracteres o menos.
- El botón: «Pedir ahora». El enlace lleva su `?src=`.
- Entrega **tres opciones** de cada texto, cada una con una línea de por qué.
