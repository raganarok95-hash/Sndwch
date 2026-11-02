# Latas: propuesta v3 de los stickers (maqueta, 2026-11-02)

Dueño, 2026-11-02, con las latas de BLOOM, COLD BREW TEA y COOL como base: «No debe estar totalmente cubierta, de
preferencia debe ser transparente. Podemos quitar la parte de la tapa, mejoremos eso más o menos así deben quedar».

- Maqueta: [`propuesta-v3/lamina-v3.png`](propuesta-v3/lamina-v3.png) (lata de base + frente y atrás planos) y
  [`propuesta-v3/atras-de-cerca.png`](propuesta-v3/atras-de-cerca.png). Script: `scripts/piezas/etiquetas-latas-v3.mjs`.
- Reemplaza a la v2 como propuesta. La v1 (`etiquetas/`) sigue siendo la vigente hasta que el dueño elija.

## Qué cambia frente a la v2

| qué | v2 | v3 |
|---|---|---|
| Atrás | placa crema que tapaba la bebida, 56 × 100 mm | **todo transparente, solo tinta**, 50 × 92 mm |
| Tapa | sticker «AGÍTALA» con fecha y lote | **sin sticker**; «Agítala» ya está en el frente |
| Fecha y lote | en la tapa | **atrás**, en un recuadro para la etiquetadora (HECHA · VENCE · LOTE) |
| QR | verde sobre la placa | en COOL, impreso en oscuro; en las oscuras, una placa chica solo detrás del QR para que se lea |

Se queda de la v2: «355 ML» en el frente con cifras de 4 mm y «//» en vez de «·», el nombre igual en frente y atrás
(dueño, 2026-11-02: «Como el frente: BLOOM, COOL, CHAI»), ingredientes con su INS, tabla nutricional, «Hecho en Perú» y
el lema. El detalle y las fuentes de cada punto legal están en [`PROPUESTA_V2.md`](PROPUESTA_V2.md).

## Lo que hay que saber

- **Sin la placa, la letra chica de LEMON TEA queda en 4.1 de contraste** (crema sobre la bebida). Se lee, pero es la más
  justa de las cinco. Por eso el texto de atrás va en peso medio y a 1.8 mm.
- **La fecha va en una etiquetita de la etiquetadora** pegada en el recuadro: es lo único opaco que queda atrás.
- Lo que sigue entre corchetes (P65, P66, P60): tabla nutricional, R.S., razón social, RUC, dirección, la lista del chai
  y los colorantes del brillo dorado.

## La tabla nutricional, estimada (dueño, 2026-11-02: «calculémoslo»)

Por 100 ml. Sale de los valores USDA de té negro e infusión preparados (~1 kcal, 0.2–0.3 g de carbohidratos, 1–3 mg de
sodio) y del jugo de limón (22 kcal, 6.9 g de carbohidratos y 2.5 g de azúcares por 100 g). Sucralosa, mica y dióxido de
titanio no suman a la tabla en estas dosis. **Supuestos, a cambiar por los gramos de la fórmula v6 (privada):** jugo de
limón hasta 100 g por litro en LEMON TEA y hasta 50 g en COOL. Se tomó el extremo alto.

| | BLOOM | COOL | LEMON TEA | CHAI | COLD BREW TEA |
|---|---|---|---|---|---|
| Energía (kcal) | 2 | 2 | 3 | 1 | 1 |
| Grasa total / saturada (g) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Carbohidratos (g) | 0.5 | 0.6 | 1.0 | 0.3 | 0.3 |
| Azúcares (g) | 0.2 | 0.2 | 0.3 | 0 | 0 |
| Proteína (g) | 0 | 0 | 0 | 0 | 0 |
| Sodio (mg) | [según la sal] | [según la sal] | [según la sal] | [según la sal] | [según la sal] |

- **Sodio:** 1–3 mg del agua y el té, más **~3.9 mg por cada 0.1 g de sal por litro**. Falta la dosis de sal de la v6.
- **«Cero azúcar» se cumple con margen** (tope: 0.5 g por 100 ml, Codex CXG 23). Ninguna llega al octógono (5 g de azúcar o
  100 mg de sodio por 100 ml).
- En la maqueta van con la nota «Valores estimados». **El laboratorio los confirma antes de imprimir** (P66).

## ¿Hace falta el registro sanitario de DIGESA? (dueño: «¿no se requiere o sí, en este caso vía web?»)

- **Lo que preparas y vendes tú al cliente final** (la app, el delivery, la botella de la apertura) **no lleva registro
  sanitario por producto.** Es comida preparada: pide licencia municipal y cumplir la norma sanitaria de restaurantes, y la
  vigila la municipalidad. El registro es para alimentos y bebidas **industrializados** (DS 007-98-SA).
- **La lata sellada con marca, lote y vencimiento** se parece más a una bebida industrializada, aunque se venda solo por la
  app. **En tiendas o bodegas, el registro es obligatorio.** Para la app es zona gris: se consulta con DIGESA antes de
  lanzar las latas (§12). La orientación es gratis.
- **En la etiqueta:** mientras sea solo app y DIGESA diga que no aplica, la línea «R.S. N.°» sale. Si se registra, entra
  con el número real.

## El chai y el brillo

- **Filtrantes del CHAI: Nature's Heart** (dueño, 2026-11-02). No se encontró publicada su lista de ingredientes. Una
  ficha la nombra «Infusión herbal Té Chai», o sea que puede no llevar té negro. **Falta una foto de los ingredientes de la
  caja.** Si dice «saborizante» o «aroma», el CHAI no lleva «Sabor 100% natural» (§17).
- **Brillo:** el repo dice que el de bebidas es mica perlada con dióxido de titanio (§10, Brew Glitter). Eso va en las cinco.
  Si el dorado trae además óxido de hierro (los tonos dorados suelen llevarlo), se suma «INS 172»: se confirma en el frasco.

Fuentes: USDA FoodData Central (té negro, infusión de hierbas y jugo de limón);
[kom.pe, vender comida por internet en el Perú](https://kom.pe/vender-comida-por-internet-peru/);
[ficha de Nature's Heart Té Chai](https://www.fitatu.com/catalog/mx/natures-heart-infusion-herbal-te-chai--120822618).

## Datos que dio el dueño (2026-11-02, tarde)

- **Dirección:** «Av. prolongación Cesar Vallejo 2670» → en la etiqueta, «Av. Prolongación César Vallejo 2670, Trujillo».
- **Caja del chai (Nature's Heart), foto del dueño:** «Té negro, canela, jengibre, saborizante natural vainilla, clavo de
  olor, cardamomo, pimienta negra, vainilla en polvo». Va como ingrediente compuesto: «chai (té negro, canela, …)».
  **Trae saborizante:** el frente del CHAI cambia «SABOR 100% NATURAL» por «TÉ NEGRO Y ESPECIAS» (§17).
- **Brillo:** el del repo, mica perlada con dióxido de titanio (§10), en las cinco.
- **Limón de LEMON TEA:** 60 ml por litro (§18). La tabla pasa a 2 kcal, 0.7 g de carbohidratos y 0.2 g de azúcares.
- **R.S.:** sale de la etiqueta mientras sea solo app; entra si DIGESA lo pide.
- **Atrás ya no repite la línea de sabor** (está en el frente): deja lugar a los ingredientes del CHAI.
- **Siguen faltando:** razón social y RUC; los gramos de sal por litro (sodio) y de limón en COOL. Las cantidades de la v6
  se entregaron aparte y **no están en el repo** (es público): solo el limón de LEMON TEA.

## Más datos del dueño (2026-11-02, noche)

- **Sal:** «la receta no lo lleva». Sin sal en los ingredientes; el sodio estimado sale del agua y la infusión: BLOOM 4,
  COOL 2, LEMON TEA, CHAI y COLD BREW TEA 3 mg por 100 ml.
- **Limón de COOL:** «no lo he medido». Queda el supuesto alto (50 g por litro): 2 kcal, 0.6 g de carbohidratos, 0.2 g de
  azúcares. Se mide en la próxima tanda o lo da el laboratorio.
- **Razón social: «SNDWCH», RUC 10736044523.** Un RUC que empieza con 10 es de **persona natural**: la razón social es el
  nombre completo del titular tal como figura en SUNAT, y SNDWCH es el nombre comercial. En la etiqueta va
  «[nombre del titular] (SNDWCH)» hasta que el dueño lo confirme.
