# Para mandar a imprimir (2026-10-10)

Dueño: «envíame los stickers para mandarlos a imprimir, imágenes listas solo para enviar, sin texto
adicional en la imagen; pero sí escríbeme qué medidas exactas pedir».

Cada imagen trae **3 mm de sangrado por lado** (el arte pasa del corte): la imprenta corta en la
medida final. PNG a 576 dpi con la medida guardada en el archivo; el PDF es el mismo arte, vectorial.

## 1 · Sticker de la bolsa — `sticker-bolsa-7x7cm.png` / `.pdf`
- **Medida final:** 7 × 7 cm (la imagen mide 7.6 × 7.6 cm con el sangrado).
- **Corte:** cuadrado con **esquinas redondeadas de 4 mm**.
- **Material:** papel adhesivo, impresión full color, acabado **mate** (el brillo dificulta leer el QR).
- **Precorte:** micro-perforado **recto, horizontal, de borde a borde, a 1.1 cm del borde de arriba**
  (la línea punteada del arte marca el lugar: arriba solo «rasga aquí», abajo el logo y el QR).
- **Cantidad:** 1,000 (lista de referencia: S/150).
- QR verificado: abre `sndwch.app/?src=bolsa&codigo=DIRECTO`.

## 2 · Sticker de la calle — `sticker-calle-8x8cm.png` / `.pdf`
- **Medida final:** 8 × 8 cm (la imagen mide 8.6 × 8.6 cm con el sangrado).
- **Corte:** cuadrado con **esquinas redondeadas de 6 mm**.
- **Material:** **vinilo blanco con laminado mate** (para exterior: sol y lluvia).
- **Cantidad:** 250 para empezar.
- QR verificado: abre `sndwch.app/?src=calle&codigo=DIRECTO` (la bebida gratis del sello naranja).

Se regeneran con `node scripts/piezas/stickers.mjs` (los originales están en `docs/marketing/stickers/`).
