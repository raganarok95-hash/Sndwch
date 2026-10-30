# El Instagram de SND//WCH: cómo se ve (propuesta del 2026-10-30)

Dueño: «Diseñame cómo se debe ver nuestro Instagram, foto de perfil, destacados, miniaturas, todo».
Maqueta: `perfil-maqueta.jpg`. **Es una propuesta: falta el sí del dueño.**

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

⚠ **La Meatball de preapertura muestra la bebida en un vaso.** Dueño, 2026-10-29: «Debe ser en los
envases, nunca en jarra». Hay que regenerar esa foto con la bebida en su envase.

Para regenerar: `FUENTES_CSS=$(bash scripts/piezas/fuentes-locales.sh) SALIDA=out node docs/marketing/instagram-perfil/perfil-ig.cjs`.
Escribe en `out/`, junto al script.
