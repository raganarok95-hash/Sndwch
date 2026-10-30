# El Instagram de SND//WCH: cómo se ve (propuesta del 2026-10-30)

Dueño: «Diseñame cómo se debe ver nuestro Instagram, foto de perfil, destacados, miniaturas, todo».
**La versión vigente es `final/` (ver `final/LEEME.md`: el concepto, el porqué de cada elemento y cómo subirlo).**
Lo que sigue es el historial de cómo se llegó.

Maqueta: `perfil-maqueta.jpg`.

Versión 3 (mismo día), la vigente. Dueño: «Creo que confundiste falta sando y wicho con ponlos en todo
ig, ten creatividad o sea mira descompone usa los colores». Los hermanos ya no salen dibujados por todos lados:
**salen descompuestos** en sus elementos (`docs/LOS_DOS_HERMANOS.md`). Dibujado queda solo el logo de la foto de perfil.

- **SANDO** (los Signatures): el oliva de su casaca con el acanalado de puños y basta, su verde casi negro
  y el forro naranja como franja lisa y vertical, solo en su mundo (la carta y Zonas).
- **WICHO** (arma el tuyo, cómo pedir): su celeste con las curvas de nivel del polo, la espiral lila de sus
  ojos (calculada) y su tinta con la trama cruzada.
- **Los Signatures** llevan la foto limpia arriba. Abajo va la basta acanalada de SANDO con el texto.
  Nada se monta encima de la comida.

## Lo que va en el perfil

| campo | texto |
|---|---|
| Nombre | SND//WCH · Sándwiches |
| Categoría | Restaurante de sándwiches |
| Biografía | Sándwiches de pan largo, al estilo americano. / Armados al momento, a domicilio. / Abrimos en noviembre. |
| Enlace | `https://sndwch.app/?src=ig-bio` (ya puesto por el dueño, P37) |
| Botones | Mensaje y WhatsApp |

- **Foto de perfil** (`foto-de-perfil.jpg`): el logo de la app, con los dos hermanos, sobre el papel.
- **Destacados** (`destacado-*.jpg`, portadas de 1080 × 1920), cada uno un pedazo de un hermano con el ícono de la app:
  - Carta: el acanalado oliva de SANDO.
  - Cómo pedir: el celeste y las curvas de nivel de WICHO.
  - Bebidas: la espiral lila de WICHO.
  - Zonas: el verde y el forro de SANDO.

  Va «Zonas» y no «Dónde llegamos» porque Instagram corta el nombre a unos 10 caracteres.
- **Cuadrícula** (`publicacion-*.jpg`, 1080 × 1350). Todo lo importante va dentro del recorte 3:4 que hace
  Instagram en el perfil desde enero de 2025.

| | 1 | 2 | 3 |
|---|---|---|---|
| fijadas | Abrimos (Philly) | La carta, en el mundo de SANDO (carrusel) | Cuatro pasos, en el mundo de WICHO (carrusel) |
| | Meatball | Turkey | Tuna Melt |
| | Italian Hoagie | Classic Tuna | Reel «Detrás del pan» (lo graba el dueño) |

Las fotos nuevas (`anuncios/fotos/foto-tuna-melt.jpg`, `foto-italian-hoagie.jpg` y `foto-classic-tuna.jpg`)
se generaron fieles a la receta de `_shared/carta.ts`:
- **Tuna Melt:** atún en lascas y cheddar fundido, sin verduras.
- **Italian Hoagie:** tres embutidos en pliegues, queso americano, lechuga, tomate, cebolla morada, pimiento y oil & vinegar.
- **Classic Tuna:** solo atún con mayonesa.

Las fotos de `img/` de esos tres no calzan con la receta: el Tuna Melt sale abierto y el Classic Tuna con lechuga, tomate y pepino.
A la Classic Tuna se le rehízo la foto porque traía una taza de café (nada que no se venda).

**La Meatball, rehecha (2026-10-30, dueño: «sí, regenera la Meatball con la bebida en su envase»).**
Lleva la bebida en la lata PET sleek, sin vaso (`anuncios/fotos/foto-meatball-lata.jpg`). La pieza vieja
de `instagram-preapertura/` todavía muestra el vaso: no se usa.

## Las 7 versiones más (2026-10-30)

Dueño: «dame 7 versiones más de todo lo que Instagram, con sando, wicho, sin, mezclados, descompuestos y en
todas dame una idea por cada una de la foto de perfil». Están en `siete/`: la maqueta de cada una
(`perfil-*.jpg`), las 7 fotos de perfil juntas (`fotos-de-perfil-7.jpg`) y la idea de cada foto
(`ideas.json`). El script (`siete/siete.cjs`) genera también cada pieza suelta.

**La foto de perfil es siempre el logo oficial** (dueño, 2026-10-30: «¿Por qué en ninguno tiene nuestro
logo oficial?»). Es el isotipo de `img/marca/avatar-1024-transparente.png`, que no se redibuja ni se migra
(`docs/PANTALLAS_APROBADAS.md`). En cada versión cambia solo el fondo. La primera tanda de las 7 había
inventado otras fotos de perfil, y eso fue un error. Las versiones:

1. SANDO
2. WICHO
3. Sin hermanos
4. Mezclados
5. Descompuestos
6. El corte
7. Con voz

Para regenerar: `FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) SALIDA=out node docs/marketing/instagram-perfil/perfil-ig.cjs`.
Escribe en `out/`, junto al script.
