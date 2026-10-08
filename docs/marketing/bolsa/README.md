# La bolsa: todo lo que llega con un pedido (propuesta 2026-10-08)

Dueño: «Diseña toda la bolsa». **Es una propuesta para aprobar**: nada se imprime sin tu OK.

Se regenera con `node scripts/piezas/bolsa.mjs <datos.json> docs/marketing/bolsa`. El
`datos.json` lo hace `scripts/piezas/datos.ts`, y de ahí sale el número de la tarjeta de grupo
(`REGLAS.organizadorDesde`). Si la regla cambia, se regenera y se vuelve a imprimir.

![maqueta](maqueta-bolsa.png)

## Qué lleva cada pedido

| pieza | qué hace | archivos |
|---|---|---|
| **Bolsa kraft** | para el 13 va **lisa**. El arte es para cuando el volumen pague bolsas impresas | `bolsa-frente`, `bolsa-dorso` |
| **Sticker de cierre** | sella el doblez: «armado al momento · cerrado en cocina». Quien reparte es un tercero: si el sticker llega roto, se nota. En la bolsa lisa es lo único a color, y lleva la cara de los hermanos | `sticker-cierre` |
| **Papel manteca** | envuelve cada sándwich. Es el que ya cotizaste (S/150 los 2 millares) | `papel-manteca-patron` |
| **Etiqueta del sándwich** | «Para ____ · Armado a las __:__». En un pedido de grupo dice de quién es cada uno: la cocina ya recibe «De: nombre» en cada ítem. La hora prueba lo que dice el sticker | `etiqueta-sandwich` |
| **Tarjeta** (una por pedido) | pedido propio → **tarjeta de grupo**; pedido de Rappi → **tarjeta de Rappi** | `tarjeta-*-frente`, `tarjeta-*-dorso` |

Los QR llevan su origen, así el análisis sabe cuántos pedidos trae cada tarjeta:
- grupo: `https://sndwch.app/?grupo=1&src=bolsa` abre un pedido en grupo nuevo (pide cuenta,
  porque el servidor necesita saber a quién cobrarle);
- Rappi: `https://sndwch.app/?src=rappi`.

## Por qué está cada palabra

- **«¿Y la oficina? / Somos seis. Bueno, siete.»** Quien recibe la bolsa en el trabajo puede
  organizar el próximo pedido. Habla WICHO, el que exagera, y por eso cuenta mal. El dorso dice
  lo que hay que saber: «Con 5, el más barato va gratis».
- **«La próxima, directo. Ya sabes dónde encontrarnos.»** No nombra a Rappi ni lo ataca, y no
  promete descuento. Habla SANDO, que no levanta la voz.
- **«En la app hay más»**: lo que fuera de la app no está: armar el tuyo, los puntos y el menú
  secreto.
- **«Armado al momento.»** Es verdad tal cual: la proteína se cocina por tandas y en servicio
  se arma (`docs/NEGOCIO.md`). Por eso dice «armado» y no «cocinado».
- **«Alguien pidió bien.»** (dorso de la bolsa) le habla a quien la ve pasar: en la oficina,
  en el ascensor, en la mesa de al lado.
- La bolsa no lleva QR ni oferta: para eso está la tarjeta, que va dentro.

## Para la imprenta

Los PDF tienen las **medidas reales con 3 mm de sangrado por lado** y las fuentes incrustadas.
Los PNG son para mirar.

| pieza | medida final | PDF (con sangrado) | material | impresión |
|---|---|---|---|---|
| tarjeta de grupo | 9 × 5.5 cm | 9.6 × 6.1 cm | couché mate 300 g | a color, **frente y dorso** |
| tarjeta de Rappi | 9 × 5.5 cm | 9.6 × 6.1 cm | couché mate 300 g | a color, frente y dorso |
| sticker de cierre | **círculo de 6 cm** | 6.6 × 6.6 cm | adhesivo mate (vinil o couché) | a color; dile «**troquel circular de 60 mm al centro**» |
| etiqueta del sándwich | 5 × 3 cm | 5.6 × 3.6 cm | adhesivo **mate que se pueda escribir con plumón** | a color, solo frente |
| papel manteca | patrón de 30 × 30 cm que se repite | 30.6 × 30.6 cm | el de tu proveedor | **una tinta** |
| bolsa (después) | cara de 24 × 30 cm | 24.6 × 30.6 cm | kraft | **3 tintas planas** |

- **Cantidades.** Con ~600 sándwiches al mes (la referencia de `NEGOCIO.md`) salen unos 300 a
  450 pedidos. **500 tarjetas en total** cubren el primer mes: repártelas según cuánto esperes
  de Rappi. **500 stickers**, uno por pedido. **Etiquetas**: una por sándwich, si la adoptas.
- **Color.** Los PDF van en RGB, que es lo que acepta la impresión digital. Pide **una prueba
  impresa** antes del tiraje, sobre todo del celeste (`#8CC8EC`), que es el que más cambia.
- **Papel manteca**: manda `papel-manteca-patron.pdf` al proveedor que te cotizó. La tinta es
  `#1E2B22` (verde casi negro), o la más oscura que tenga apta para alimentos. El patrón no
  lleva el «//» porque el «//» pide dos colores (dorado y celeste) y el papel se imprime a uno.
- **Bolsa impresa (más adelante).** Las 3 tintas son `#1E2B22`, más dorado `#CBA258` y
  celeste `#8CC8EC`, que solo van en las dos barras del «//». Pide a la imprenta que iguale
  esos colores con su guía y te muestre la prueba. **Los 6 cm de arriba quedan bajo la solapa**
  al doblarla, por eso ahí no va nada. Si la bolsa que te coticen mide otra cosa, se regenera a
  su medida.
- **Plazo.** Abres el martes 13 y el lunes está cerrado: **la tarjeta y el sticker tienen que
  ir a la imprenta el viernes 9**. La impresión digital suele tardar 24 a 48 horas.

## Lo que decides tú antes de imprimir

1. **Rappi.** Revisa tu acuerdo: hay plataformas que no permiten meter en la bolsa material
   que invite a pedir por fuera. Si el tuyo lo prohíbe, los pedidos de Rappi van **sin
   tarjeta**, ni la de Rappi ni la de grupo, porque las dos llevan a sndwch.app.
2. **¿El armador está en tu ficha de Rappi?** La tarjeta de Rappi dice que en la app «armas el
   tuyo». Si en Rappi también se puede, esa frase se cambia.
3. **La etiqueta.** ¿La cocina puede escribir el nombre y la hora en cada sándwich? Si no,
   usa la etiqueta solo en pedidos de grupo (donde resuelve un problema real) o se quita la
   línea de la hora.
4. **Costos.** La tarjeta y la etiqueta todavía no tienen precio. Cuando los cotices, entran a
   `modelo/insumos.py` como fichas con su unidad (`check:costos`). El sticker ya está ahí, sin
   cotizar.

## Detalle técnico

- El avatar aprobado (`img/marca/avatar-1024-transparente.png`) trae un trazo suelto abajo a
  la izquierda. En el sticker el avatar se recorta con un círculo y ese trazo no sale. **El
  archivo no se toca**: está aprobado así.
- La maqueta (`maqueta-bolsa.png`) se arma con las mismas piezas que van a imprenta, no con
  copias.
