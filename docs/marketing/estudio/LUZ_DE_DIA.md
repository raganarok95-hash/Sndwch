# Luz de día: cómo se piden las imágenes a Flow desde el 2026-11-11

Ezra, 2026-11-11: «Las imágenes que marketing está haciendo en flow son horribles parecen de películas de terror, busca
skills que sirvan para que los haga bien».

**La causa** está en nuestro propio bloque de prompt, no en Flow. Desde octubre, cada encargo pedía «night kitchen…
a single warm bulb hanging low… everything beyond it falling to black» (`docs/PROMPTS_PERSONAJES.md`, «la cocina de
noche»). Un foco colgando sobre una mesa en la oscuridad es, literalmente, la luz de una película de terror. Y con
los ojos en espiral de WICHO y la boca abierta, el resultado asusta.

**Desde hoy, la cocina de noche queda retirada.** Los 32 encargos pendientes que la usaban pasaron a
`encargos/pausados/`, y la laptop ya no los genera. No se reactivan sin reescribirlos con este archivo.

## Las reglas (todas las imágenes)

1. **La luz se nombra siempre, y es de día.** Va de una de estas tres maneras, nunca con «una sola lámpara»:
   - *Producto en estudio*: «bright high-key commercial food photography, large soft light from the front-left,
     white bounce fill, no dark shadows».
   - *Producto en su lugar*: «natural midday daylight from a big window on the left, soft and diffused, airy and
     bright».
   - *Personajes*: «bright, even, cheerful lighting, flat 2D cartoon shading, no dramatic shadows».
2. **El fondo es uno de los cuatro de la identidad** (`docs/marketing/identidad/IDENTIDAD_VISUAL_2026-11-11.md`),
   con su hex y «seamless solid backdrop». Así se recorta fácil, y el feed queda con color, no con negro.
3. **El apetito se describe con detalles concretos**: «glossy melted cheese», «visible steam», «crisp lettuce»,
   «juicy, freshly made». Siempre con la receta exacta de la carta y la porción real.
4. **La cámara se nombra**: «shot with a 100mm macro lens at f/4, three-quarter angle at 45 degrees, shallow depth
   of field» para el producto; «eye-level medium shot» para los personajes.
5. **Los personajes se piden amables**: «friendly, cute, rounded features, warm smile», «cheerful children's
   animation style». WICHO conserva sus ojos en espiral lila, pero «playful, not creepy». SANDO conserva su calma,
   «relaxed and confident, not grumpy».
6. **El cierre negativo, siempre al final**: «No darkness, no night, no single hanging bulb, no vignette, no fog,
   no horror or eerie mood, no harsh shadows. No text, no letters, no logos, no watermark.»

## El bloque fijo (se copia al final de cada encargo)

```
Bright, appetizing, cheerful. Daylight or bright studio light, soft and even, no dark areas.
No darkness, no night, no single hanging bulb, no vignette, no fog, no horror or eerie mood, no harsh shadows.
No text, no letters, no numbers, no logos, no watermark.
Any sandwich shown is a long sub roll with exactly the real recipe stated, in this order; real portion, never overfilled.
```

## Por qué así (fuentes)

- Los anuncios de comida que más venden usan luz brillante y de frente: la comida con luz difusa y sombras suaves
  se percibe más fresca y apetitosa, y la oscura, menos (Spence, Okajima y otros, *Gastrophysics*, 2017; la misma
  línea que cita `estilo-sndwch`).
- Los modelos de imagen copian el ánimo de las palabras de luz. «Single bulb», «falls to black» y «long shadows» son
  las palabras que describen el *film noir* y el terror. Por eso cambian el ánimo aunque el resto del prompt hable
  de comida.
- No hay una skill instalable para esto (se buscó el 2026-11-11 en las skills de claude.ai: ninguna de fotografía de
  comida). Esta guía la reemplaza y la aplica `producir-piezas`.
