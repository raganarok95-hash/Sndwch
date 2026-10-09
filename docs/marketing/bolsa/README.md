# La bolsa, a una tinta (propuesta 2026-10-08)

Dueño: «Diseña toda la bolsa». Y después: «Papel manteca ya tengo, está con el logo como cara;
a futuro podríamos cambiarlo. No puedo mandar tarjetas por cada uno por ahora: **debe ser todo
en la bolsa, a una sola tinta**. En Rappi también se puede armar el tuyo. La etiqueta no: añade
trabajo». **Es una propuesta**: nada se imprime sin tu OK.

![maqueta](maqueta-bolsa.png)

## Lo que lleva cada pedido

| pieza | qué hace | archivo |
|---|---|---|
| **Papel manteca** | el que ya tienes, con la cara de los hermanos | — |
| **Bolsa, frente** | le habla a quien la ve pasar: en la oficina, en el ascensor, en la mesa de al lado. «Alguien pidió bien.» y dónde se pide | `bolsa-frente.pdf` |
| **Bolsa, dorso** | hace el trabajo de la tarjeta: quien la recibe en el trabajo puede organizar el próximo pedido. «¿Y la oficina?» y un QR que abre un pedido en grupo | `bolsa-dorso.pdf` |

Nada se agrega a mano: ni tarjeta, ni sticker, ni etiqueta. La bolsa va igual en los pedidos
propios y en los de Rappi, así que no dice nada que en Rappi no sea cierto.

## Por qué está cada palabra

- **«Alguien pidió bien.»** Halaga a quien pidió y le da curiosidad a quien mira. No dice
  «pide», pero el siguiente renglón dice dónde.
- **sndwch.app en vez de SND//WCH.** El `//` es dorado y celeste, o no va (`CLAUDE.md`,
  regla 10), y a una tinta no se puede. sndwch.app es el nombre y además es donde se pide.
- **«¿Y la oficina? / Somos seis. Bueno, siete.»** Lo dice WICHO, que exagera y cuenta mal. El
  dorso da la regla real: «Con 5, el más barato va gratis» (sale de `REGLAS.organizadorDesde`;
  si cambia, se regenera).
- **El QR** lleva `https://sndwch.app/?grupo=1&src=bolsa&codigo=BOLSA`: abre un pedido en grupo
  nuevo, el análisis sabe cuántos pedidos trae la bolsa, y el checkout ofrece ya escrito el código.
- **«Tu primera vez en la web, la bebida va gratis: código BOLSA.»** (2026-10-09, dueño: «Si aprueba
  todo»). Es la razón para que quien pidió por Rappi o PedidosYa pida directo la próxima vez:
  allí cada pedido deja S/3.78 más. El código vale una vez por celular y regala la bebida más
  barata del carrito (tipo «bebida», migración 20261009025200).
- **Las ondas y las costillas** son las texturas de WICHO y de SANDO. A una tinta funcionan igual.

## Para la imprenta

| | |
|---|---|
| **Impresión** | **una tinta**: `#1E2B22` (verde casi negro). Si el negro le sale más barato a la imprenta, el diseño funciona igual en negro |
| **Caras** | frente y dorso (dos pantallas, la misma tinta). Si solo puedes una cara, **imprime el dorso**: es el que trae pedidos |
| **Medida** | el arte es para una cara de 24 × 30 cm (PDF con 3 mm de sangrado: 24.6 × 30.6 cm). **Los 6 cm de arriba quedan bajo el doblez**, así que ahí no va nada. Si tu bolsa mide otra cosa, se regenera a su medida |
| **QR** | 5.2 cm. **Antes del tiraje, escanea la prueba impresa** con dos celulares distintos: el kraft da menos contraste que el papel blanco |
| **Cómo** | serigrafía sobre la bolsa kraft que ya cotizaste (S/0.35, `docs/NEGOCIO.md`). Pregunta el mínimo y el plazo: si no llega para el 20, sale con bolsa lisa y la impresa entra después |

## Más adelante (diseñado, no se imprime ahora)

En `mas-adelante/`: las tarjetas (grupo y Rappi), el sticker de cierre, la etiqueta del sándwich
y un papel manteca de patrón. Quedan listos para cuando quieras cambiar el papel o agregar algo.

Se regenera con `node scripts/piezas/bolsa.mjs <datos.json> docs/marketing/bolsa`.

## Opción barata: bolsa lisa + sticker con QR (2026-10-09)
Dueño: «C, modificar el empaque». El empaque cotizado sale S/2.50 por pedido; casi todo es la
bolsa impresa. **Propuesta:** bolsa kraft **lisa** (~S/0.35) cerrada con el sticker que ya va en
cada pedido, ahora con QR y código (`opcion-barata/sticker-qr.pdf`, 6 cm, una tinta). Empaque
total ~S/0.60: **+S/663 en 6 meses** frente a hoy (`docs/PROYECCION.md`). No suma trabajo: el
sticker ya estaba en el cierre. Se pierde el frente «Alguien pidió bien.» (el letrero ambulante);
si quieres conservarlo, la intermedia es imprimir **solo una cara** en tiraje de 1,000+ (~S/1.20).
El QR lleva `sndwch.app/?src=sticker&codigo=BOLSA` (verificado: se lee).

![sticker](opcion-barata/sticker-qr.png)

### El sello del frente (2026-10-09, idea del dueño)
Bolsa lisa + **sello** con el frente («Alguien pidió bien.» y sndwch.app) + el **sticker con QR**
de cierre. Arte del sello en negro, a tamaño real 12 × 9 cm: `opcion-barata/sello-frente.pdf`
(se lo mandas a la sellería tal cual). **El QR no va en el sello**: en kraft la tinta se corre y
deja de leerse. Se sella en tanda antes del servicio (50 bolsas en unos minutos), no al despachar.
Tinta: para sellos sobre papel/kraft, base agua, color negro o verde muy oscuro.

![sello](opcion-barata/sello-frente.png)
