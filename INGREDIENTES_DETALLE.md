# SND//WCH — Todos los ingredientes, al detalle

**2026-09-03.** Sale de `RECETARIO.md` (gramajes y cortes), del catálogo real
(`supabase/functions/api/catalog.ts` + `src/app/01-*`) y de `MENU_FINANCIAL_ANALYSIS.md`
(precios por kilo). Cada número lleva de dónde viene.

**Leyenda de confianza:**
`[MEDIDO]` dato tuyo o de proveedor real · `[FUENTE]` investigado con fuente citada ·
`[PROXY]` un número genérico usado para todo el grupo · `[FALTA]` no existe el dato

---

## 1. PANES — 2 opciones

Formato **siempre sub/hoagie alargado**. Nunca pan de molde. Corte "bisagra": no se separan
las mitades, o el relleno se sale en la moto.

| id | Pan | 15CM | 30CM | Costo 15CM | Costo 30CM | Confianza |
|---|---|---|---|---|---|---|
| B01 | Classic // White | 71 g | 142 g | S/1.00 | S/2.00 | `[MEDIDO]` S/2 la unidad, el 15CM usa medio pan |
| B03 | Focaccia // Artesanal | 71 g | 142 g | S/1.30 | S/2.60 | `[MEDIDO]` S/13 la entera → 10 de 15CM o 5 de 30CM |

- **Miga cerrada, corteza fina pero firme.** Miga abierta = la salsa filtra y empapa.
- **Tostar la cara interna 30-40 s**, obligatorio en SIG02, SIG03 y SIG06 (los de mayor humedad).
- B03 cobra recargo al cliente: **+S/0.50 (15CM) / +S/1.00 (30CM)**. B01 no cobra nada.
- ⚠ Hay una inconsistencia menor entre documentos: el recetario pide a la panadería "71 g la
  unidad de 15 cm y 142 g la de 30 cm" (dos formatos), y el costeo asume "una unidad de S/2
  que se parte al medio". El costo sale igual, pero conviene decidir cuál le pides al panadero.

---

## 2. PROTEÍNAS — 6, porción de 85 g (15CM) y 170 g (30CM)

Los costos son **de la porción terminada, ya con merma de cocción**. De 1 kg de res cruda no
salen 1 kg de mechado — ese error infló los márgenes de este negocio hasta agosto.

| id | Proteína | Rendimiento | 85 g | 170 g | Confianza |
|---|---|---|---|---|---|
| P01 | Res // Asado | 0.54 (limpieza 10% + cocción 40%) | S/3.15 | S/6.30 | `[FUENTE]` |
| P02 | Pollo // Teriyaki | 0.69 (limpieza 8% + cocción 25%) | S/2.47 | S/4.95 | `[FUENTE]` |
| P03 | Pollo // Cajún *(menú secreto)* | 0.644 (8% + 30%) | S/2.49 | S/4.97 | `[FUENTE]` |
| P04 | Atún // House | no se cocina | S/4.82 | S/9.64 | `[FALTA]` sin cotizar |
| P05 | Embutido // Italiano | 0.95 (merma de laminado 5%) | S/4.29 | S/8.59 | `[FALTA]` sin cotizar |
| P06 | Albóndiga // Marinara | 0.75 | S/1.34 | S/2.68 | `[FALTA]` sin cotizar |

### Detalle de composición

**P01 Res // Asado** — punta de pecho. Tanda estándar **6 kg crudo → 3.24 kg de mechado = 38
porciones de 85 g**. Se congela en porciones **pesadas**, cada una en su bolsa, con **15-20 ml
del caldo reducido** adentro (es lo que evita que salga seco al recalentar).

**P02 Pollo // Teriyaki** — muslo deshuesado. Tanda **4 kg → 32 porciones de 85 g**, ~2 h 45
activo. Congelado en **bolsas planas de 340 g = 4 porciones**, con el glaseado adentro.
Al armar lleva **reglaseado de 90 segundos** en sartén.

**P03 Pollo // Cajún** — pechuga deshilachada. Lleva **cubo de jugo de servicio de ~15 g**
congelado por porción, para que no salga seco.

**P04 Atún // House** — no se cocina, se mezcla. Ratio **4:1 atún escurrido : mayonesa**.
Tanda de 2 kg: atún escurrido 1.6 kg · mayonesa 400 g · sal 12 g · pimienta blanca 3 g ·
mostaza amarilla 40 g. **Desmenuzar con tenedor, no hacer pasta** — se quieren lascas visibles.
Es la preparación más sensible del catálogo: **3 días máximo refrigerado, no se estira.**
⚠ **No admite doble proteína** (`noDouble`): a S/9 por 170 g que cuestan S/11.39, era la única
operación del catálogo con margen negativo (−26.6%).

**P05 Embutido // Italiano** — no se cocina, **se lamina y se pesa**. Tres fiambres:

| Fiambre | % | En 85 g | En 170 g | Grosor |
|---|---|---|---|---|
| Jamón ahumado | 40% | 34 g | 68 g | fino, 1-1.5 mm, **en pliegues** (no plano) |
| Cabanossi | 35% | 30 g | 60 g | sesgado, 2-3 mm |
| Paté peperoncino | 25% | 21 g | 42 g | untado o cortado grueso, 5 mm |

El jamón da volumen y pliegue (hace que el sándwich se vea lleno), el cabanossi da mordida y
grasa, el paté es el más intenso: **más de 25% y tapa todo lo demás**, incluido el cheddar y el
BBQ que ese sándwich también lleva.

**P06 Albóndiga // Marinara** — tanda de 2000 g de carne molida (15-20% grasa) + panade (pan
del día anterior sin corteza 200 g) + queso rallado 100 g + ajo 20 g + perejil 25 g + sal 24 g
(1.2%) + pimienta 4 g + orégano 4 g.
**15CM = 3 albóndigas (75 g) + 10 g de salsa adherida = 85 g. 30CM = 6 albóndigas.**
⚠ **Máximo 10 g de marinara por porción de 15CM** — escurrir antes de poner. Es el ítem con
mayor riesgo de empapar el pan.

---

## 3. QUESOS — 3, todos 11 g (15CM) / 22 g (30CM)

En **láminas**, y van **debajo de la proteína caliente** para que derritan con su calor y hagan
de barrera de humedad.

| id | Queso | Dónde va | 15CM | 30CM | Costo 15CM | Costo 30CM |
|---|---|---|---|---|---|---|
| C01 | Mozzarella | **fijo en SIG02** | 11 g | 22 g | S/0.39 | S/0.77 |
| C02 | Cheddar | **fijo en SIG03** | 11 g | 22 g | S/0.39 | S/0.77 |
| C03 | Edam | opcional en BYO | 11 g | 22 g | S/0.39 | S/0.77 |

Precio: **S/35/kg** `[PROXY]` — genérico para los tres. Hay un dato mejor sin aplicar: la
mozzarella Braedt se investigó a **~S/22.50/kg**, o sea el proxy la sobrecostea un 55%.

⚠ **El queso es GRATIS en ARMA EL TUYO y nadie lo paga.** Cuesta S/0.39 / S/0.77.

---

## 4. TOPPINGS — 7, todos gratis y sin límite

| id | Topping | Corte | 15CM | 30CM* | ¿Comprar o hacer? |
|---|---|---|---|---|---|
| T01 | Tomate // Fresco | Rodajas 4-5 mm, **por el ecuador** | 25 g | 50 g | Comprar |
| T02 | Pepinillo // Encurtido | Rodajas 3 mm | 15 g | 30 g | **Comprar** en frasco |
| T03 | Cebolla // Morada juliana | Juliana **fina, 2 mm** | 12 g | 24 g | Comprar |
| T04 | Jalapeño // Encurtido *(menú secreto)* | Rodajas 3 mm | 12 g | 24 g | **Comprar** en frasco |
| T05 | Aceituna // Negra en rodajas | Rodajas 3 mm | 12 g | 24 g | **Comprar** ya deshuesada |
| T06 | Pimiento // Curado | Tiras de 1 cm | 18 g | 36 g | Comprar en frasco, o asar y pelar |
| T08 | Apio // Picado | Picado 3-4 mm | 12 g | 24 g | Comprar fresco, **se pica al día** |

*El 30CM se asume el doble; el recetario solo declara el 15CM.

**Los 7 juntos en un 15CM son 106 g.** A `[PROXY]` S/4/kg eso da **S/0.42**.

⚠ **Este es el dato más flojo de todo el costeo.** S/4/kg es un proxy de "mezcla de vegetales"
aplicado por igual a tomate fresco y a aceituna negra deshuesada en frasco, que cuesta varias
veces más. **Ningún topping tiene precio propio cotizado.** Como son gratis e ilimitados, es
también el rubro donde un cliente puede cargar el sándwich sin que nadie lo cobre.

**Notas del recetario que valen plata:**
- **El tomate va en 5 de los 7 Signatures y es el que más agua suelta.** Cortar **por el ecuador**
  (perpendicular al tallo): esas rodajas dejan las cavidades de semillas expuestas y se vacían con
  el dedo. Después **salar y dejar 15 min en colador, y secar con papel**. Ese es exactamente el
  agua que si no, va a tu pan. **Cortarlo el mismo día, nunca el domingo para el miércoles.**
- **Cebolla morada** muy agresiva: 10 min en agua con hielo y un chorro de vinagre. Pierde el filo
  y gana crocancia.
- **El apio se pica al día.** Mezclado en la tanda del domingo, para el martes ya no cruje — y
  perdiste justo lo que fuiste a buscar.

---

## 5. SALSAS — 11, porción 14 g (15CM) / 28 g (30CM)

Costo `[PROXY]` **S/19/kg** para todas → **S/0.27 (15CM) / S/0.53 (30CM)** cada una.
El cliente elige **hasta 3 gratis**; la 4ta cuesta **S/2** (`EXTRA_SAUCE_PRICE`).

| id | Salsa | Perfil | Dónde va | Se hace o se compra | Vida útil |
|---|---|---|---|---|---|
| S01 | Aioli // Signature | Ajo, limón, suave | SIG01 | **Se hace** — tanda 1 kg = 71 porciones | 7 días |
| S02 | Spicy // Mayo 🌶 | Cremoso, calor progresivo | **menú secreto** | Se hace — tanda 1 kg | 7-10 días |
| S03 | Smoke // BBQ | Ahumado, miel, pimentón | SIG03 | **Se hace** — tanda 2 kg = 142 porciones | 3-4 semanas |
| S04 | Honey // Mustard | Dulce, mostaza suave | SIG01 | Se hace — tanda 1 kg | 2-3 semanas |
| S05 | SNDWCH // Special | Salada, umami | SIG06 | **Se hace — ⚠ SIN RECETA** | — |
| S06 | Oil & Vinegar // Classic | Aceite de oliva y vinagre | SIG02 | Se compra | — |
| S08 | Teriyaki // Glaze | Dulce, soja, jengibre | BYO | — | — |
| S09 | Chimichurri // Piña y Ají 🌶 | Dulce-ahumado con picor | BYO | Se hace | — |
| S10 | Peanut // Satay | Maní, soya, jengibre | SIG06 | Se hace | — |
| S11 | Mostaza // Dijon | Ácida y filosa, sin dulzor | SIG04 | **Se compra**, y punto | — |
| S12 | Picante // Miel 🌶 | Dulce con golpe de picor | **menú secreto** | Se hace | — |

**Recetas completas de las que sí la tienen:**

- **S01 Aioli** — tanda 1 kg (**71 porciones de 14 g**): mayonesa 850 g · **ajo asado en puré
  60 g** · jugo de limón 50 ml · ralladura de 2 limones · sal 8 g · pimienta blanca 2 g.
  **El ajo va ASADO, no crudo** — crudo pica y amarga a los 2 días; asado (cabeza entera en
  papel, 180 °C, 40 min) es dulce y redondo.
- **S02 Spicy Mayo** — mayonesa 800 g · pasta de ají limo o rocoto molido 120 g · vinagre blanco
  30 ml · azúcar 15 g · ajo en polvo 5 g · sal 5 g. El "calor progresivo" lo da el ají **molido
  en pasta**, no en hojuelas.
- **S03 Smoke BBQ** — tanda 2 kg (**142 porciones**): kétchup 900 g · agua 200 ml · vinagre de
  manzana 180 ml · miel 220 g · azúcar rubia 120 g · salsa inglesa 60 ml · mostaza amarilla 40 g ·
  **páprika ahumada 25 g** · ají panca molido 20 g · ajo en polvo 12 g · cebolla en polvo 12 g ·
  pimienta 5 g. Reducir 25-30 min hasta que **nape la cuchara**. La páprika **ahumada** es lo que
  hace verdadera la palabra "ahumado" del nombre.
- **S04 Honey Mustard** — mostaza amarilla 380 g · miel 300 g · mayonesa 250 g · vinagre de
  manzana 50 ml · sal 5 g.
- **S11 Dijon** — se compra embotellada. Opcional: 500 g de dijon + 20 ml de vinagre blanco.

⚠ **S04 y S11 tienen que ser OPUESTAS en boca.** Si al probarlas juntas se parecen, baja la miel
de S04 o sube el vinagre de S11. Pruébalas **juntas, en pan, no en cuchara**.

⚠ **S05 SNDWCH // Special es la única salsa que lleva el nombre de la marca y no tiene receta.**
Tiene que ser **salada/umami, NO dulce**: es lo único que evita que SIG06 (pollo teriyaki dulce +
satay dulce) empalague, porque a esa receta se le quitó el pepinillo y no le queda ningún
elemento ácido.

**Solo una salsa picante es pública (S09).** S02 y S12 son exclusivas del menú secreto.

---

## 6. BEBIDAS — 4, todas de la casa

Vaso recomendado **350 ml** (D06/D07/D08) y **300 ml** (D09, más denso y más caro).
Botella o vaso **con tapa a rosca** — en moto la tapa a presión se sale.

| id | Bebida | Precio | Tanda | Rinde | Vida útil |
|---|---|---|---|---|---|
| D06 | The Bloom // Hibiscus | S/6 | 3 L | ≈8 vasos | 5 días |
| D07 | The Midnight // Brew | S/5 | 3 L | ≈8 vasos | 7 días |
| D08 | The Cool // Mint | S/6 | 3 L | ≈8 vasos | **4 días** |
| D09 | The Spice // Chai | S/9 | 1.5 L concentrado | — | 7 días el concentrado |

- **D06 Bloom** — flor de jamaica 60 g · agua 3 L · canela 2 ramas · azúcar 250 g. Hervir el agua,
  **apagar**, infusionar tapada 15 min y colar. **No hervir con la flor dentro más de 5 min** — se
  pone astringente.
- **D07 Midnight** — té negro a granel 40 g · agua **fría** 3 L, refrigerado **8-12 h**. Colar.
  ⚠ **El "sin amargor" del pitch viene exactamente de esto**: en frío no se extraen los taninos.
  **Si lo haces en caliente y lo enfrías, el pitch deja de ser cierto.** Hay que preverlo con 12 h.
- **D08 Cool** — hierba luisa 40 g · menta fresca 30 g · agua 3 L · azúcar 200 g. Infusionar
  tapada **solo 10 min** y colar de inmediato: pasados 15 min la menta amarga y pierde el aroma,
  que es todo lo que estás vendiendo.
- **D09 Chai** — concentrado 1.5 L: agua 1.5 L · té negro 80 g · canela 6 ramas · cardamomo 30
  vainas machacadas · clavo 20 · jengibre fresco 100 g · pimienta 10 granos · azúcar 300 g.
  Especias 20 min tapado, apagar, té 5 min, colar, disolver azúcar.
  **Al servir: 50% concentrado + 50% leche** (vaso de 300 ml = 150 + 150).
  **La leche no se stockea** — es el peor perfil microbiológico del catálogo.

**El hielo en delivery:** si mandas hielo, en 30 min el cliente recibe agua con sabor. Si no
mandas nada, llega tibia. **Botella pre-enfriada desde la noche anterior y nada de hielo**: una de
350 ml que sale a 4 °C llega a ~10 °C en media hora.

⚠ **El envase no está cotizado** (~S/1 estimado). El margen "61-84%" del recetario costea solo el
insumo; con envase real cae a **56-66%**.

---

## 7. Otros costos por sándwich

| | 15CM | 30CM | Confianza |
|---|---|---|---|
| Empaque (papel manteca brandeado + bolsa) | S/1.10 | S/1.10 | `[FALTA]` sin cotizar, y describe empaque **genérico** |

⚠ Es el número que estás por convertir en una compra real, y **40 céntimos de más llevan el ARMA
EL TUYO de 7 a 10 combinaciones fuera del techo de 45%**.

---

## 8. Cómo se arma cada Signature

**Orden físico: pan → queso → proteína → toppings → salsas.** (El queso va antes de la proteína
caliente para derretir con ella y hacer de barrera. Es distinto del orden en que el cliente elige
en pantalla, y no tiene por qué coincidir.)

| Signature | Pan | Queso | Proteína 15/30 | Toppings 15CM | Salsa 15/30 | Riesgo |
|---|---|---|---|---|---|---|
| **SIG01** The Original | B01 | — | P01 85/170 g | Tomate 25 · Pepinillo 15 · Cebolla 12 | S01 + S04, 14/28 g | Mechado seco si se recalienta mal |
| **SIG02** The Marinara | B01 **tostado** | C01 fijo, abajo | 3 albóndigas + 10 g salsa | Tomate 25 · Cebolla 12 · Aceituna 12 | S06 14/28 g | **Pan empapado. Máx 10 g de marinara** |
| **SIG03** The Smoke | B03 **tostado** | C02 fijo | 34 jamón + 30 cabanossi + 21 paté | Cebolla 12 · Pepinillo 15 · Tomate 25 | S03 14/28 g | Humedad + sabor cargado |
| **SIG04** The Fresh | B01 | — | P04 85/170 g | Tomate 25 · Pepinillo 15 · **Apio 12 al momento** | S11 14/28 g **+ limón exprimido** | **Temperatura. El más sensible** |
| **SIG06** The Teriyaki | B01 **tostado** | — | P02 85/170 g **+ reglaseado 90 s** | Tomate 25 · Pimiento 18 | S10 + S05, 14/28 g | **Doble dulce sin ácido** |
| **SIG05** Menú secreto | B03 | — | P03 85/170 g + cubo de jugo | Jalapeño 12 · Pimiento 18 · Cebolla 12 | S02 + S12, 14/28 g | Tres picantes apilados |

**Tiempo objetivo: 4-5 min por sándwich** (SIG06 ~6 min por el reglaseado).
**Para pedidos de varios ítems: recorrido por lote** — queso en TODOS los panes, después proteína
en todos, después toppings. Baja de 5×N pasadas a 5.

---

## 9. Lo que falta cotizar, en orden de cuánto mueve

1. **Empaque** — sin cotizar, y es una compra inminente.
2. **Atún (P04)** — S/67/kg investigado online, sin proveedor. El insumo de peor margen.
   El recetario dice dónde está el ahorro: **cotizar lata institucional de 1 kg+ en Makro**
   antes de comprar latas de 170 g.
3. **Toppings** — ninguno tiene precio propio; todos usan un proxy de S/4/kg que es
   evidentemente falso para aceituna, jalapeño y pimiento en frasco.
4. **Envase de bebida** — ~S/1 estimado.
5. **Quesos** — S/35/kg proxy, cuando ya hay un dato de S/22.50/kg para mozzarella.
6. **Rendimiento real de P05 y P06** — estimados, no medidos.

**Todo esto se carga en Admin // Compras y costos** (`ingredient_purchases`), que ya está
construido: guarda cada compra con fecha y cantidad, y deriva el precio unitario como promedio
**ponderado** de las últimas 3. Con eso el costo por porción deja de ser un literal de markdown.

---

*Fuentes: `RECETARIO.md` (gramajes, cortes, tandas) · `supabase/functions/api/catalog.ts` y
`src/app/01-catalogo-y-estado.ts` (catálogo vigente) · `MENU_FINANCIAL_ANALYSIS.md` (precios/kg)*
