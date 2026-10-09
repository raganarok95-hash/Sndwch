# Los tres stickers (propuesta 2026-10-09)

Dueño: «El QR no debe ir en el sticker de cierre sino un sticker de cierre y aparte el sticker del
QR, diséñalo bonito. Hazlo bien con tamaños de cada sticker. Hay tres stickers: el de sellado de
la bolsa, QR en la bolsa y un sticker interesante para poner en la calle como pequeña publicidad
extra». **Es una propuesta**: nada se imprime sin tu OK.

![lámina](lamina-stickers.png)

| | medida | material | va | QR |
|---|---|---|---|---|
| **1 · Cierre** `1-cierre.pdf` | **Ø 50 mm**, troquel circular | papel adhesivo couché, full color | cruzando el doblez de la bolsa: el que la abre lo rompe | — |
| **2 · QR de la bolsa** `2-qr-bolsa.pdf` | **70 × 100 mm**, esquinas de 4 mm | papel adhesivo couché **mate** (el brillo no deja leer el QR) | en el **dorso** de la bolsa, centrado (ver `docs/marketing/bolsa/`) | `sndwch.app/?src=bolsa&codigo=DIRECTO` |
| **3 · Calle** `3-calle.pdf` | **80 × 80 mm**, esquinas de 6 mm | **vinilo** blanco + laminado mate UV (aguanta sol y lluvia) | donde te dejen pegarlo (abajo) | `sndwch.app/?src=calle` |

| **4 · Tira de cierre con QR** `4-tira-cierre-qr.pdf` (opción B) | **70 × 200 mm**, esquinas de 4 mm | papel adhesivo couché **mate** | cruza la boca de la bolsa: 7.5 cm al frente (el sello redondo), 1 cm arriba, 11.5 cm al dorso (el QR) | `sndwch.app/?src=bolsa&codigo=DIRECTO` |

La **tira** reemplaza al cierre redondo y al sticker del QR: un solo sticker por bolsa (dueño:
«que no sean dos sino uno solo, el de cierre, largo, y contenga el QR»). En el pliego el tramo del
frente va **de cabeza**: al doblarla sobre la boca, las dos caras quedan derechas.

Todos los PDF llevan **3 mm de sangrado** por lado (el arte pasa del corte): la imprenta corta en
la medida de la tabla. Los dos QR se verificaron con un lector: abren su enlace.

## Por qué es así cada uno
- **Cierre.** Su trabajo es cerrar y dar confianza: el logo de los dos hermanos al centro y, en el
  anillo, «Armado al momento» arriba y «Si llega abierto, avísanos» abajo (los dos se leen
  derechos), con el `//` a cada lado. «Avísanos» es real: el pedido tiene su botón de «algo salió
  mal».
- **QR de la bolsa.** Es el mundo de WICHO, el de la energía de sticker: celeste, las curvas de
  nivel de su polo, él riéndose, y su círculo de plumón alrededor de «gratis». Le habla a quien
  pidió por Rappi o PedidosYa: «La próxima vez, pide directo y la bebida va gratis», con el
  código DIRECTO ya puesto en el QR (se llamó BOLSA y WICHO; dueño: «el código que sea algo más genérico» → «DIRECTO») (vale una vez por celular, la bebida más barata del carrito).
- **Calle.** Es el mundo de SANDO: papel crema, tinta, el forro naranja vertical y el acanalado
  de sus puños. Su frase firmada, «Si lees esto, ya tienes hambre.», no grita: hace que lo leas
  entero, y para entonces ya funcionó. El wordmark con el `//` dice de quién es; el QR (`?src=calle`)
  dice cuántos pedidos trae.

## Dónde pegar el de la calle
Pegarlo en postes, paredes o mobiliario público sin permiso suele estar prohibido por las
ordenanzas municipales de publicidad exterior y puede traer multa. Donde sí: vitrinas y puertas
de negocios que te den permiso, paneles de universidades e institutos, cajas de los motorizados,
tu moto, laptops y botellas (puedes regalar uno en cada pedido de grupo).

## Para cotizar
Pide precio a 500 y a 1,000 de cada uno, con la medida, el material y el troquel de la tabla.
El 1 y el 2 van uno por pedido; del 3 alcanza con 200–300 para empezar.

Se regeneran con `node scripts/piezas/stickers.mjs` (necesita `npm install --no-save
qrcode@1.5.4`).
