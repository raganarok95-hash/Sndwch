# Las bebidas como producto propio (2026-10-21)

Dueño: «Quiero que veamos las bebidas: ahora son solo un complemento, pero estoy buscando que a
futuro sean un producto propio separado, para que se puedan comprar en tiendas, etc., además de
venderlas por la app. Hay que mejorar la receta. A futuro será en latas PET: cotízame eso, y una
máquina selladora automática económica».

> **Las fórmulas nuevas NO van en este archivo**: el repo es público y una bebida que se vende en
> tiendas tiene que proteger su receta. Se le entregaron al dueño aparte, el 2026-10-21. Ojo: las
> fórmulas de HOY están publicadas en `RECETARIO.md` (PARTE 4) y en `modelo/costo_bebidas.py`.
> Sacarlas de ahí es decisión del dueño (borrarlas del historial de git requiere su sí expreso).

## 1 · Dónde están hoy las tres

Azúcar calculada con las tandas del `RECETARIO.md` (gramos de azúcar ÷ 3 L):

| bebida | azúcar por 100 ml | octógono «Alto en azúcar» (≥ 5 g) | dura refrigerada |
|---|---|---|---|
| The Bloom (jamaica) | 8.3 g | **sí** | 5 días |
| The Midnight (té negro en frío) | 3.3 g | no | 7 días |
| The Cool (hierba luisa y menta) | 6.7 g | **sí** | 4 días |

Para la app sirven así. **Para una tienda, no**: duran una semana y dos llevarían octógono.

## 2 · Lo que cambia para venderlas en tiendas

1. **Que duren semanas refrigeradas, no 4 a 7 días, sin esencias, sorbato ni ácido cítrico**
   (dueño, 2026-10-21: «sí usaremos sucralosa o edulcorante, la idea es que sean cero azúcar; me
   refería solo a las esencias, sorbato y ácido cítrico»). Sin conservante, lo que la protege es
   la acidez natural de la jamaica o el limón (pH 3.8 o menos), pasteurizar el líquido, llenar en frío y la cadena de frío. La vida
   útil será más corta que con conservante y la fija el laboratorio. **La lata PET no aguanta el
   llenado en caliente**: el PET empieza a deformarse alrededor de los 70 °C. Por eso se
   pasteuriza el líquido ANTES, se enfría y se llena frío. Es una bebida de refrigeradora, como
   los jugos prensados, no de anaquel. **No todas tienen que ser ácidas** (dueño, 2026-10-21):
   las ácidas (jamaica, limón) aguantan semanas; las no ácidas (Midnight, chai) también van a
   tiendas, pero con **10 días refrigeradas como máximo**, salvo que el laboratorio valide más. La
   guía de la FDA para refrigerados de más de 10 días pide pH 5.0 o menos o un calentamiento de
   90 °C por 10 minutos: en una lata sellada, una bebida poco ácida es el ambiente del botulismo.
2. **Cero azúcar: 0.5 g o menos por 100 ml**, endulzada con sucralosa pura (la de sobres trae
   dextrosa). Sin octógono, «sin azúcar» en la etiqueta y, en el impuesto selectivo (punto 5), 12%
   en vez de 17% o 25%. La sucralosa tiene un tope: 0.30 g por litro (Codex, GSFA 14.1.4).
3. **Registro sanitario de DIGESA, uno por sabor**, por la VUCE. Pide análisis microbiológico y
   fisicoquímico de un laboratorio acreditado, la ficha técnica y el rotulado. En el TUPA anterior
   costaba S/365 por producto; un comunicado de 2026 sugiere que podría no tener costo, así que se
   confirma en la VUCE al generar el pago. Vale 5 años.
4. **La etiqueta**: nombre, ingredientes, contenido neto, lote, fecha de vencimiento, «Mantener
   refrigerado», RUC y dirección del fabricante, número de registro sanitario y el octógono si
   corresponde.
5. **Impuestos: al venderla envasada a una tienda, el negocio pasa a ser productor de bebidas.**
   Paga el ISC: 12% si tiene 0.5 g de azúcar o menos por 100 ml (DS 181-2019-EF), 17% entre 0.5 y
   5 g, y 25% desde 5 g (DS 266-2021-EF). Además, quien hace operaciones con ISC no puede estar en el Nuevo RUS. **Se
   confirma con el contador ANTES de vender la primera lata a una tienda.**

Cuando el volumen lo justifique, otra vía es la **maquila**: que la produzca una planta que ya
tiene registro y habilitación, con tu receta y tu marca.

## 3 · La receta mejorada: hacia dónde va

> Primera dirección (v2, 2026-10-21). La reemplaza la línea unida de cero azúcar de §9.

- **The Bloom**: la jamaica ya es ácida (pH ~3), así que se conserva bien. Baja el azúcar a la
  mitad y recupera el cuerpo con un poco más de flor y la cáscara de naranja, cuyo aroma hace que
  se sienta más dulce. Si queda corta, stevia medida.
- **The Midnight**: el azúcar ya está bien. Para la app sigue igual. Para tiendas necesita acidez
  (el té negro tiene pH ~5): cáscara de limón y ácido cítrico hasta pH 3.8–4.0, y pasteurizar
  después del reposo en frío. Hay que probar si el «sin amargor» se mantiene.
- **The Cool**: es la que más cambia. Lleva limón, que le da la acidez que la protege y la hace
  más fresca. La menta va en dos tiempos para que no se pierda el aroma, y el azúcar baja de 6.7 a
  ~4.3 g por 100 ml.

**Lo que manda es la medición, no los gramos**: cada tanda se mide con un **refractómetro** (los
°Brix, el dulzor) y un **pHmetro** (la acidez), se anota con su lote y se guardan 3 envases para
probarlos a los 7, 14 y 21 días. Esa prueba casera solo orienta: la vida útil que va en la
etiqueta sale del estudio del laboratorio.

## 4 · Latas PET: lo que se encontró en Perú (2026-10-21)

| vendedor | qué | precio publicado | falta saber |
|---|---|---|---|
| **The Homebrewer Perú** (Lurín, Lima) | lata PET 350 ml con tapa de aluminio | de S/555 a S/6,280 según la presentación | cuántas unidades trae cada presentación, si tienen de 500 ml |
| **Impacto Gastronómico Perú** | «lata soda PET» 330 ml, 100 unidades | S/89 (S/0.89 cada una) | si incluye la tapa de aluminio y si es compatible con la selladora |

Referencia sin importar: en China se venden a US$0.09–0.26 la unidad, con pedidos mínimos de 2,000
a 5,000. **Hoy la botella cuesta S/0.69**; por lo publicado, la lata con tapa en Perú costaría entre
~S/0.90 y S/1.50 en compras chicas (se confirma con la cotización).

**La lata y la tapa tienen que ser del mismo diámetro que la selladora** (cada máquina viene para
un tamaño de tapa). Lo seguro es comprar latas, tapas y máquina al mismo vendedor, o pedirle que
confirme la compatibilidad por escrito.

## 5 · La selladora: vendedores en Perú, sin importar

| vendedor | precio | qué es |
|---|---|---|
| **The Homebrewer Perú** (Lurín, Lima) | **S/1,490** | la ficha dice «manual» en el título y describe un sellado automatizado: **hay que confirmarlo** |
| **The Homebrewer Perú** | **S/5,490** | **semiautomática** de latas PET de 250 a 500 ml (para cerveza artesanal, bubble tea y bebidas frías) |
| **Casandina** (Lima) | a consultar | «completamente automática», 2 segundos por lata, 1 año de garantía · +51 958 602 410 |
| **Cool Machine** (Perú) | a consultar | modelos CM-PET100A-23 y CM-PETS200SA-25, envases de 210 a 700 ml |
| **Moneymaking.pe** | a consultar | envío a todo el Perú |
| Promart (Comercial World) | S/9,000, agotada | cerradora automática industrial |

**En este tamaño de máquina, «semiautomática» es lo que sella sola**: pones la lata con su tapa,
aprietas y la máquina cierra en 2 a 5 segundos. «Totalmente automática», con faja que trae las
latas, ya es de planta (S/9,000 o más). Para cientos de latas por semana alcanza de sobra con una
que selle sola.

**La recomendación**: la más barata que selle sola. Primero confirmar si la de S/1,490 es
motorizada; si no lo es, comparar la de S/5,490 con lo que respondan Casandina y Cool Machine.
Facebook Marketplace e Instagram no se pudieron revisar desde aquí: vale buscar ahí «selladora
latas PET» (Lima y Trujillo).

## 6 · Cuánto deja una lata en una tienda (estimado)

Supuestos: la bodega gana 30% del precio final; ISC 12% (cero azúcar); IGV 18%. Costo de la lata
llena entre S/1.76 y S/3.25: insumos S/0.66–1.55 (§9), lata y tapa S/0.90–1.50 (por confirmar) y
etiqueta ~S/0.20 (estimada). Sin brillo (§10). No cuenta mano de obra, frío ni reparto.

| precio en la tienda | te pagan (sin IGV ni ISC) | te queda por lata |
|---|---|---|
| S/6 | S/3.18 (S/3.04 con 17% de ISC) | −S/0.07 a S/1.42 |
| S/8 | S/4.24 (S/4.06 con 17%) | S/0.99 a S/2.48 |

**A S/6 en una bodega, la lata casi no deja.** Como producto de tienda funciona si es premium
(S/7–8, artesanal, cero azúcar). En la app, donde no hay bodega
ni ISC por venta a tiendas, deja mucho más.

## 7 · El orden

1. **Ahora, casi sin gastar**: la receta mejorada en la cocina, con refractómetro y pHmetro, y la
   prueba casera de 7, 14 y 21 días.
2. **Al abrir**: en la app, la receta nueva en la botella actual; cotizar latas y selladora con
   el mensaje de abajo.
3. **Con el sí del dueño (es gasto)**: comprar la selladora y las latas, y vender en lata en la
   app para aprender cuánto rota.
4. **Tiendas**: contador (ISC y régimen), laboratorio (análisis y vida útil), registro sanitario
   por sabor, etiqueta, y un piloto con 5 bodegas o cafés de Trujillo.

## 8 · El mensaje para cotizar (WhatsApp)

> Hola, busco una selladora de latas PET con tapa de aluminio **que selle sola** (pongo la lata,
> aprieto y cierra; no de palanca), a 220 V, para bebidas frías de 350 a 500 ml. ¿Precio con envío
> a Trujillo, garantía y repuestos? ¿Venden también las latas y las tapas compatibles? Precio por
> ciento y por millar, y si tienen de 500 ml. Gracias.

## 9 · Las fórmulas de 0 azúcar que trajo el dueño, contra las nuestras (2026-10-21)

El dueño trajo 5 fórmulas de 0 azúcar en dos versiones (con y sin goma xantana): Chai Spiced Cold
Brew con filtrantes comerciales, «Arnold Palmer» Zero, Hibiscus Naranja & Especias, «Hibiscus
Mojito» y Matcha Lemonade. Pidió compararlas con las nuestras, mejorar las dos, unirlas o elegir.
Aclaró después: **cero azúcar con sucralosa sí; esencias, sorbato y ácido cítrico no**.

**Se unen en una línea de cero azúcar**, con nuestros nombres y el reposo en frío. **De lo suyo se
toma**: la sucralosa, la naranja y las especias para The Bloom, el «medio y medio» de té y limón,
la menta con limón para The Cool, el chai sin leche y, si el matcha sale barato, el Matcha
Lemonade para la app. **Se corrige o se deja**:

- **La dosis de sucralosa**: 0.4–0.6 g por litro de sucralosa pura es 3 a 4 veces lo que endulza
  un té helado (~0.15 g endulzan como ~8% de azúcar) y **pasa el tope de 0.30 g del Codex**. Va
  de 0.10 a 0.20 g, medida con una solución madre (0.15 g no se pesan en una balanza de cocina).
  Y tiene que ser **pura**: la de sobres es casi toda relleno, con dextrosa, y puede romper el
  «cero azúcar».
- **La goma xantana sale** (dueño: «entonces quitamos la xantana»). Lo que no se disuelve (el
  matcha, el brillo) se asienta: la lata dice «agítala».
- **Las esencias de naranja y menta**: las reemplazan la cáscara de naranja y la menta fresca,
  la mitad infusionada en frío 2 h para el aroma.
- **El chai va con filtrantes** (dueño: caja de 20 a S/11.50, S/0.58 cada uno). Con 5 por litro
  cuesta 37% de S/6 (32% a S/7), contra 26% con mezcla propia. Si la caja dice «saborizante» o
  «aroma», trae esencia. Los filtrantes van 5 minutos en agua caliente antes del reposo en frío,
  porque las especias crudas no tienen ningún paso que mate los microbios.
- **El «Hibiscus Mojito»**: sería otra bebida roja de jamaica igual a The Bloom, y «mojito»
  nombra un cóctel (no se muestra alcohol). Su menta pasa a The Cool.
- **El nombre «Arnold Palmer»**: es marca registrada (Arnold Palmer Enterprises, con licencia a
  AriZona). Va como «medio y medio».
- **Los «concentrados» sin definir**: el de té queda definido (26 g por litro, 12 h en frío).

Costo por botella de 500 ml con envase (S/0.69). Los filtrantes van al precio del dueño; la
sucralosa, el limón, la naranja y el matcha, a precios estimados:

| bebida | hoy | cero azúcar | dónde se vende |
|---|---|---|---|
| The Bloom (jamaica, naranja, canela) | S/1.89 (31%) | S/1.86 (31%) | app y tiendas |
| The Midnight (té negro en frío) | S/1.41 (28% de S/5) | S/1.35 (27% de S/5) | app y tiendas, 10 días |
| Medio y medio (té negro y limón) | — | S/2.18 (36%) | app y tiendas |
| The Cool (hierba luisa, menta, limón) | S/1.17 (19%) | S/1.51 (25%) | app y tiendas |
| Chai con filtrantes, sin leche (5 por litro) | — | S/2.24 (37%; 32% a S/7) | app y tiendas, 10 días |
| Matcha Lemonade | — | S/4.21 (70%); con matcha a S/40 los 100 g, S/2.71 (34% de S/8) | app, si el matcha sale barato |
| *chai con mezcla propia (no elegido)* | — | S/1.56 (26%) | — |

Las cantidades están en el archivo que se le mandó al dueño (v5), no acá. Qué bebidas quedan en
la app (hoy son 3) y a qué precio lo decide el dueño después de probarlas.

## 10 · El brillo comestible (glitter)

- **Cuándo**: al llenar, nunca en la olla. En la olla se va al fondo y se queda pegado, y
  pasteurizarlo no sirve de nada. Se echa en cada lata vacía justo antes de llenarla en frío, y
  el chorro lo reparte. Como entra después del calor, va con cuchara seca y limpia, guantes, y el
  frasco cerrado entre lata y lata.
- **Cuánto**: el tope es 0.07%, o sea 0.7 g por litro (0.35 g por lata de 500 ml). Se empieza con
  0.1 g por lata y se mira. Se pesa una vez para 10 latas con la balanza de 0.01 g y se calibra
  una cucharita.
- **Cuál**: que diga **comestible** y traiga ficha técnica o registro sanitario. «No tóxico» es
  brillo de manualidades y no se come. El de bebidas es mica perlada con dióxido de titanio (en
  Europa el dióxido de titanio está prohibido desde 2022; en Perú se permite), y va en la
  etiqueta como colorante. En Lima lo vende Librería Gastro Perú (Brew Glitter, de S/26 a S/100
  según el tamaño).
- **Lo que cuesta**: si el frasco chico es de 4 g (como el de la marca), sale ~S/6.50 el gramo, y
  0.1 g por lata suman ~S/0.65. **Hay que cotizarlo por kilo** antes de ponerlo en todas.
- **Sin xantana se asienta**: agitar la lata hace el remolino, y ese es el efecto. Luce en las
  claras (The Bloom, The Cool, Medio y medio); en el chai y el Midnight, que son oscuros, casi no
  se ve.

## 11 · ¿Cuánto deja y vale la pena la selladora de S/3,500? (2026-10-21)

Dueño: «No quiero evitar todo lo que sea químico. Pero bueno, ¿cuán rentable sería? La máquina de
latas que mandaste no sirve, pero la otra cuesta 3500 soles: ¿vale la pena?». Lo que no se usa
sigue siendo solo esencias, sorbato y ácido cítrico (y la xantana, que el dueño sacó); lo demás se
juzga por lo que aporta.

**La lata llena cuesta ~S/2.54** (insumo promedio de las 5 de §9: S/1.14; lata y tapa: ~S/1.20, por
confirmar; etiqueta: ~S/0.20). **La botella de hoy, llena, ~S/1.83.**

- **En la app, la lata deja S/0.71 menos por bebida que la botella.** No vende más sándwiches. Se
  justifica solo si la bebida en lata se cobra S/1 más.
- **En tiendas** (la bodega gana 30%, ISC 12%, IGV 18%, se pierde 10% por vencimiento):

| precio en la tienda | deja por lata | 10 tiendas × 15 latas/sem | 20 × 15 | 40 × 15 |
|---|---|---|---|---|
| S/6 | S/0.39 | S/251/mes | S/502 | S/1,003 |
| S/7 | S/0.92 | S/595/mes | S/1,190 | S/2,379 |
| S/8 | S/1.45 | S/939/mes | S/1,878 | S/3,755 |

Sin contar tu tiempo, el reparto a las tiendas ni el crédito del IGV de las compras.

**La máquina sola (S/3,500) se paga**:

| precio en la tienda | 10 tiendas | 20 tiendas |
|---|---|---|
| S/7 | 6 meses | 3 meses |
| S/6 | 14 meses | 7 meses |

**Con el registro sanitario y los análisis** (S/390 por sabor más el laboratorio, ~S/2,000–4,000
según cuántos sabores), a S/7 y con 10 tiendas se paga todo en ~11 meses.

**Veredicto: hoy no; cuando haya tiendas que la pidan, sí.** Primero se prueba en la app, en la
botella de hoy: no necesita registro ni máquina. Ahí se aprende qué sabores se piden. Después se
consigue el sí de 10 tiendas o cafés a S/7 o más (con muestras para probar, no ventas). Ahí se
decide el envase y se compra la máquina. **El registro sanitario se saca con el envase
definitivo**, porque cambiarlo después obliga a modificar el registro. A S/6 en bodega la lata
casi no deja: el lugar de esta bebida es la tienda que la cobra a S/7–8.

**Antes de pagar los S/3,500, que el vendedor confirme por escrito:**
- que selle sola (no de palanca);
- 220 V;
- el tamaño de tapa y de lata que acepta (500 ml);
- la garantía;
- quién la repara en Perú y cuánto cuestan los repuestos (rodillos y mandril);
- y que te venda las latas y tapas compatibles.

## 12 · Producto propio en la app, a S/8 la lata (2026-10-21)

Dueño: «El precio sería de 8 soles en realidad. Te enfocaste en tienda, pero la idea es hacer otro
producto de las bebidas. Pueden venderse igual solo por el app. Cotízame las PET con latas de
aluminio easy to open».

**Lo que deja cada lata a S/8 en la app.** Supuestos: lata llena S/2.54, IGV, ~2% de comisión de
pago (Yape por defecto) y 5% de merma:

- **S/3.95 por lata** si no paga ISC.
- **S/3.23 por lata** si el contador dice que paga el 12% de ISC. Una bebida envasada con marca,
  vendida como producto, puede pagarlo aunque se venda solo en la app.
- **La botella de hoy a S/6 deja ~S/3.04.** O sea, la lata a S/8 deja más.
- **Con brillo**, ~S/0.65 menos.

| latas por día | al mes (26 días) | la máquina de S/3,500 se paga en |
|---|---|---|
| 5 | S/419–514 | 7–8 meses |
| 10 | S/839–1,028 | 3.4–4.2 meses |
| 20 | S/1,678–2,055 | ~2 meses |

**Validación del precio**: en el Centro de Lima venden bubble tea en lata a S/8.90.

**Dos cosas que cambian si la bebida es un producto aparte:**

1. **Hoy la app rechaza todo pedido sin sándwich** (dueño, 2026-09-30, `tests-api/solo-bebidas.test.ts`).
   Para venderla sola hay que abrir eso, y conviene un mínimo (un pack de 3–4 latas): el envío
   cuesta casi lo que una lata. Es decisión del dueño, y concepto antes que código.
2. **El registro sanitario**: una lata con marca, lote y vencimiento puede contar como bebida
   industrializada aunque se venda solo en la app. Se consulta con DIGESA antes de lanzar.

**Las latas PET con tapa de aluminio abre fácil: lo que se encontró (2026-10-21)**

| dónde | qué | precio |
|---|---|---|
| The Homebrewer Perú (Lurín) | lata PET 350 ml con tapa; importadas, solo a pedido | S/555 a S/6,280 según la presentación (no dice cuántas trae) |
| Impacto Gastronómico Perú | «lata soda PET» 330 ml × 100 | S/89 (S/0.89 c/u; no dice si trae la tapa) |
| Fábricas en China (referencia, no se importa) | lata PET 500 ml con tapa de aluminio | US$0.11–0.15 c/u (mínimo 1,000); US$0.26 (mínimo 5,000) |
| India (referencia) | lata PET con tapa abre fácil | ₹10–12 c/u (~S/0.45–0.55) |

**Nadie en Perú publica precio por unidad de 500 ml**: los que venden importan a pedido. Con lo
publicado, la lata con tapa saldría entre ~S/0.80 y S/1.50 en compras chicas (el modelo usa
S/1.20). **El precio real sale de la cotización al vendedor de la máquina**, que además asegura
que la tapa calce con la máquina: 202 (52 mm) o 209, según la máquina.

## 13 · Por qué la lata deja lo que deja, y los precios revisados (2026-10-21)

Dueño: «Asimismo, cotiza y mira bien los precios: ¿por qué se gana tan poco por lata?».

**De S/8, lo que se va** (The Bloom, con los precios revisados):

| | S/ |
|---|---|
| precio en la app | 8.00 |
| IGV (18%, nunca fue tuyo) | −1.22 |
| comisión de pago (~2%, Yape por defecto) | −0.16 |
| insumos | −0.67 |
| lata PET con tapa | −0.90 |
| etiqueta | −0.12 |
| merma (5%) | −0.08 |
| **te queda** | **4.85** (y 4.12 si paga ISC: −0.73) |

No es poco: es ~60% de lo que queda después del IGV. **Se veía poco por tres cosas:**

1. **El IGV se lleva S/1.22 antes que nada.**
2. **El envase (lata, tapa y etiqueta) cuesta más que la bebida que lleva adentro.**
3. **El modelo tenía la jamaica a S/97 el kilo** (Campo Grande, de tienda). En el mercado está a
   S/25–40: Agrosur S/25, Mercado Libre desde S/25, Mercampo S/36.50, Comfrutti S/39. Solo eso le
   suma S/0.50 por lata a The Bloom. El té negro también estaba a S/97: no hay precio publicado a
   granel, pero si se exporta a ~US$9.5 el kilo, al por mayor debería estar bastante más abajo.

**Cada lata, con el precio del modelo y con el revisado.** El revisado usa jamaica a S/30, té a
S/60 (estimado), lata a S/0.90 comprando por millar y etiqueta a S/0.12: las dos últimas, por
cotizar.

| bebida | deja hoy en el modelo | deja con precios revisados | si el limón sube a S/20/kg |
|---|---|---|---|
| The Bloom | S/3.92 | **S/4.85** | S/4.56 |
| The Midnight | S/4.46 | **S/5.11** | S/5.11 |
| Medio y medio | S/3.58 | **S/4.24** | **S/2.29** |
| The Cool | S/4.29 | **S/4.69** | S/3.72 |
| Chai con filtrantes | S/3.52 | **S/3.92** | S/3.92 |

Sin ISC. Si lo paga, se resta ~S/0.73 a cada una.

**Dos riesgos y una palanca:**

- **El limón**: hoy está a S/3–5.30 el kilo en supermercado (Tottus, Metro), pero se pronostica
  hasta **S/20 el kilo en el verano de 2027** por El Niño costero. Con ese precio, el Medio y medio
  deja menos de la mitad. Las que no dependen del limón (The Bloom, Midnight y chai) aguantan.
- **El chai**: con filtrantes a S/0.58, solo el té cuesta S/1.44 por lata, y es lo más caro de la
  línea. Con 4 filtrantes por litro en vez de 5 se ahorran S/0.29 por lata. Una caja más grande, o
  el mismo chai a granel, lo bajaría más.
- **La palanca**: comprar las latas por millar y las etiquetas en imprenta (no sueltas).

**Lo que falta cotizar** (nadie lo publica en Perú; se pide por WhatsApp):
- las latas PET de 500 ml con tapa, por millar, al vendedor de la máquina;
- 1,000 etiquetas adhesivas a color, en una imprenta de Trujillo;
- el té negro a granel, por kilo, en el mercado mayorista o a Campo Grande.

La sucralosa casi no pesa: aunque cueste el doble, son ~S/0.05 por lata.

`modelo/costo_bebidas.py` todavía usa la jamaica y el té a S/97. Ese número alimenta la proyección
y el freno de costo por cliente (`parity`), así que se corrige con el precio real al que compra el
dueño, no con uno de internet.

> **Corrección del 2026-10-21 (régimen)**: el negocio está en el **Nuevo RUS** (RUC 10,
> `docs/META_6000.md`), que **no cobra IGV**. Mientras siga ahí, cada lata deja ~S/1.22 más que en
> §12 y §13: entre ~S/5.10 y S/6.30 a S/8. Pero quien hace operaciones con ISC no puede estar en el
> Nuevo RUS: si la lata con marca paga ISC, cambia de régimen. Se confirma con el contador (P62).

## Fuentes

- Latas PET y selladoras, The Homebrewer Perú: https://thehomebrewerperu.com/producto/latas-pet-de-350-ml-con-tapa/ · https://thehomebrewerperu.com/producto/selladora-automatica-de-latas-pet/ · https://thehomebrewerperu.com/producto/selladora-manual-de-latas-pet/
- Lata soda PET, Impacto Gastronómico Perú: https://www.impactogastronomicoperu.com/herramientas-1/lata-soda-pet-
- Casandina: https://casandina.com/product/maquina-selladora-de-latas/ · Promart: https://www.promart.pe/maquina-cerradora-de-lata-automatico-1000505543/p
- Latas PET en China (referencia): https://www.accio.com/plp/es/latas-pet · https://spanish.alibaba.com/product-detail/PET-plastic-can-with-aluminium-easy-60564268743.html
- PET y calor (Tg 67–71 °C): https://packagingeurope.com/molding-options-for-heat-setting-pet/5239.article
- Octógonos, segunda fase (5 g por 100 ml en bebidas desde el 17-09-2021): https://blog.prcp.com.pe/wp-content/uploads/2021/09/Client-Memo-El-17-de-setiembre-de-2021-entran-en-vigencia-los-parametros-tecnicos-de-la-segunda-fase-de-la-aplicacion-de-octogonos.pdf
- ISC de bebidas (DS 266-2021-EF): https://gestion.pe/economia/isc-bebidas-azucaradas-y-cerveza-sin-alcohol-con-nuevas-reglas-para-pagar-hasta-25-en-isc-noticia/ · https://www.infobae.com/america/peru/2021/09/30/mef-bebidas-que-pasen-los-5-gramos-de-azucar-pagaran-25-de-impuesto-selectivo-al-consumo/
- Arnold Palmer, marca registrada: https://en.wikipedia.org/wiki/Arnold_Palmer_(drink) · https://trademark.justia.com/owners/arnold-palmer-enterprises-inc-487144
- Sucralosa, dulzor por concentración: https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/5380541 · https://dspace5.ufes.br/items/2689f747-6eca-47f9-ba46-70e879da222c
- Sucralosa: 300 mg/kg en bebidas a base de agua (Codex GSFA 14.1.4): https://www.fao.org/gsfaonline/foods/details.html?id=248 · https://www.fao.org/gsfaonline/additives/details.html?id=137
- ISC de 12% para bebidas sin azúcar (DS 181-2019-EF): https://www.mef.gob.pe/es/notas-de-prensa-y-comunicados/6055-ejecutivo-publica-decreto-supremo-con-ajustes-al-isc-y-al-ir
- Brillo comestible (tope 0.07%, ingredientes): https://brewglitter.com/products/glitter-drinks-fuchsia · https://bakell.com/products/blue-brew-glitter-edible-glitter-for-sports-drinks-energy-drinks · en Lima: https://www.libreriagastroperu.com/collections/brew-glitter-purpurina-comestible
- Bebidas poco ácidas y botulismo (la guía de la FDA de 10 días, citada en patentes): https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11744265 · https://ohsonline.com/articles/2017/09/22/death-wish-nitro-cold-brew-recalled.aspx
- Latas PET (referencias): https://spanish.alibaba.com/product-detail/PET-plastic-can-with-aluminium-easy-60564268743.html · https://smpetcan.en.made-in-china.com/product/gxBRhHLwbrpO/China-Transparent-Pet-Plastic-250ml-330ml-350ml-Easy-Open-Beverage-Cans-with-Aluminium-Lid.html · https://m.indiamart.com/impcat/pet-cans.html · https://www.puntoqpack.com/es/375-latas-pet
- Bubble tea en lata a S/8.90 en Lima: https://panamericana.pe/prendete/locales/436120-bubble-tea-centro-lima-sabores-presentaciones-debes-dejar-probar
- Jamaica por kilo: https://www.agrosurperu.com/product-page/flor-de-jamaica · https://listado.mercadolibre.com.pe/flor-de-jamaica-x-kg · https://mercampo.pe/producto/flor-de-jamaica/ · https://comfruttiperu.com/producto/flor-de-jamaica-deshidratado-importado/
- Limón: https://www.tottus.com.pe/tottus-pe/articulo/115830731/limon-sutil-tottus/115830732 · https://www.metro.pe/limon-sutil-x-kg-140-2/p · pronóstico por El Niño: https://www.infobae.com/peru/2026/10/15/fenomeno-el-nino-dispararia-el-precio-del-limon-hasta-s-20-el-kilo-en-el-verano-de-2027/
- Té negro exportado (~US$9.5/kg FOB): https://agraria.pe/noticias/notable-incremento-en-las-exportaciones-de-te-negro-peruano-28733
- Registro sanitario: https://www.digesa.minsa.gob.pe/orientacion/COMUNICADO%20TUPA%20PRODUCTOS.pdf · https://www.industriaalimentaria.org/blog/contenido/digesa-garantiza-continuidad-de-tramites-sanitarios-para-alimentos · https://www.vuce.gob.pe/manual_vuce/manuales/usuarios/DGS006_Inscripcion_Registro_Sanitario_Alimentos_Bebidas_Consumo_Humano_(Nacional).pdf

Casi todos los precios son publicados por vendedores y sin la cantidad exacta: sirven para saber
a quién pedir cotización, no para comprar. Lo legal y lo tributario se confirma con DIGESA (VUCE)
y con el contador.

## 14 · La cotización de The Homebrewer y la lata sleek de 355 ml (2026-10-24)

Dueño: «Te paso los precios y veamos si conviene. En todo caso 335 ml con la lata sleek.
Investiguemos y verifiquemos en el mercado». Mandó la cotización y la foto de la lata: **55 × 155
mm**. Y sobre la etiqueta: «No imprimiré sobre la lata. Directamente como sticker sería lo ideal».

**La cotización** (pedido en espera, precios de caja):

| producto | precio | por unidad |
|---|---|---|
| selladora «manual» de latas PET y aluminio | S/1,490 | — |
| selladora semiautomática con pantalla táctil | S/5,490 | — |
| lata PET 250 ml con tapa, caja de 300 | S/340 | S/1.13 |
| lata PET 330 ml con tapa, caja de 300 | S/390 | S/1.30 |
| **lata PET 355 ml sleek con tapa, caja de 300** | **S/415** | **S/1.38** |
| lata PET 500 ml con tapa, caja de 200 | S/295 | S/1.48 |

**Verificado en el mercado:**
- **Precio de la lata.** The Homebrewer es el único vendedor en Perú con precio publicado. Casandina
  lista latas transparentes de 250, 355 y 500 ml, pero sin precio: hay que pedirle cotización. En
  México, 200 latas PET de 355 ml con tapa cuestan MXN 1,950, así que S/1.38 está en línea.
- **La «manual» de S/1,490.** Su ficha se contradice: el título dice manual, la ficha dice
  «automático, 220V», y lista latas de 250/300/350/500 ml. **No confirma la sleek de 355.**
- **La semiautomática** pide tapa 202 y trae el mandril B64. Cierra una lata cada ~3 segundos.
- **Antes de pagar, al vendedor:**
  - si la de S/1,490 es manual de verdad;
  - si cierra la sleek de 355 con su tapa (¿202 B64 o CDL?) y con qué mandril;
  - cuántas latas por minuto.
- **Stickers en Lima** (Imprenta Peruana, 2026):
  - vinilo troquelado de 5×5 cm: S/180 el millar; de 10×10 cm: S/320;
  - forma propia en vinilo transparente: S/0.33 c/u;
  - matriz de S/35–80 por forma (el corte digital no la cobra).

**Cuánto deja cada lata a S/8** (Nuevo RUS, sin IGV):
- **Supuestos:** insumos del §13 llevados a 355 ml; stickers ~S/0.55 (frente, espalda y sello);
  brillo ~S/0.46; 2% de comisión; 5% de merma.
- **Resultado:**

| | The Bloom | The Cool | The Noon | The Dusk | The Midnight |
|---|---|---|---|---|---|
| 355 ml sleek | S/4.83 | S/4.71 | S/4.37 | S/4.13 | S/5.02 |
| 500 ml | S/4.28 | S/4.11 | S/3.63 | S/3.30 | S/4.55 |

- **La sleek de 355 deja S/0.47–0.83 más por lata.** Además es el tamaño que ya se vende a S/8.90:
  el bubble tea en lata de 350 ml.
- **La selladora:**
  - **la de S/1,490 se paga con ~320 latas** (un mes a 12 por día);
  - **la de S/5,490 necesita ~1,190** (4.6 meses a 10 por día);
  - una manual hace ~6 latas por minuto (dato de un vendedor argentino), suficiente hasta decenas
    al día.
- **Recomendación:** la manual (si se confirma lo de arriba) y una caja de sleek de 355 =
  **S/1,905**, no los S/8,420 de la cotización entera.
- **Si paga ISC**, cambia de régimen: va con el contador (P62).

## 15 · Las latas desde cero, validadas (2026-10-24)

El dueño rechazó la v3. Dijo: «Todo eso con mediodía y medianoche no tiene sentido, son bebidas
heladas», «¿por qué mencionas queso fundido?», «no menciones cosas negativas», «cero azúcar no es
un dato peor», «investiga en el Perú» y «repiénsalo de cero». La base es la foto de la lata sleek
que mandó. Cada elección pasa por `por-que-vende`:

| qué | cómo impacta en ventas | en qué se basa | ¿Perú? |
|---|---|---|---|
| **«Cero azúcar» arriba, bajo la marca, entre dos líneas finas** (el dueño eligió la C de tres formas; el círculo no le gustó) | ataca la preocupación número uno al comprar | Ipsos Perú, feb 2025: el 70% dice que «Alto en azúcar» es el octógono que más le preocupa; el 28% dejó de comprar lo que lleva octógonos | sí |
| **Lata transparente: el color de la bebida es el diseño** | el color se ve de lejos y en la grilla; sube el apetito | envase transparente (Deng y Srinivasan, 2013); color y sabor esperado (Spence, 2019) | en Lima y Trujillo el bubble tea en envase transparente es tendencia; en lata de 350 ml se vende a S/8.90 |
| **El nombre enorme, en vertical (como la v1)** | se reconoce sin leer; una fuerte presencia de marca en la góndola y en el feed | tendencia 2026: un color dominante y tipografía enorme (Lien Design, 2026) | — |
| **Los nombres** (dueño, 2026-10-24: «los de la app se mantienen; cambian solo los que no tienen nombre» y «el chai debe llamarse Chai (pero mejorado), porque vende, es conocida»): The Bloom · Jamaica, The Cool · Hierba luisa y menta, The Midnight · Té negro (los de la app), **Lemon Tea** · Té negro y limón y **The Chai** · Especiado y aromático (los eligió entre tres opciones cada uno) | lo conocido se elige más rápido; el chai está de moda en las cafeterías de Lima y el limón es el sabor más pedido en té helado | El Comercio (chai en Lima); Rappi (3 de los 5 Free Tea más pedidos llevan limón); Song y Schwarz, 2009 (lo fácil de pronunciar parece menos riesgoso) | sí |
| **«Agítala y activa la magia»** | el ritual sube el sabor percibido y lo que se paga, y es el video que la gente graba | rituales antes de consumir (Vohs et al., 2013) | — |
| **Frases en positivo y sensoriales** («Floral, vibrante y bien helada», «Suave como terciopelo») | se evalúan mejor que las negativas y hacen imaginar el sabor | Levin y Gaeth, 1988, y metaanálisis de 2021; Papies, 2013 y 2020 | — |
| **Colores vivos (los de la v1)** | más apetito, más sabor esperado | Spence, 2019; al dueño le gustaron | — |

**Lo que falta probar:**
- **No hay en el Perú una marca de bebida sin alcohol en lata transparente con precio publicado**.
  Las latas y las selladoras sí se venden acá (The Homebrewer; Casandina sin precio). Eso es
  diferencial, pero sin prueba local.
- **La forma barata de probarlo:**
  - una caja de 300 latas (S/415);
  - la selladora de S/1,490 (si se confirma que cierra la sleek);
  - cuatro semanas en la app, midiendo las latas por pedido, si repiten y los videos de «Agítala».

**Stickers:**
- **frente:** vinilo transparente de 66 × 110 mm impreso en crema;
- **atrás:** legal de 42 × 62 mm;
- **tapa:** sello de 36 mm con lote y vencimiento.

No se imprime sobre la lata.

## 16 · La selladora: la local de S/1,490 o una automática de Alibaba (2026-10-24)

Dueño: «Sí la cierra [la de S/1,490 cierra la sleek de 355], pero estoy cotizando en Alibaba, ya
que me la ofrecen hasta por menos dinero: menos de 400 dólares la máquina automática». Y sobre el
azúcar: «Ya es cero azúcar con nuestra fórmula».

**Lo que cuesta de verdad la de menos de US$400, puesta en Trujillo** (estimado, al cambio de
~S/3.75):
- **Supuestos:** pesa 30–60 kg en su caja, va por flete aéreo (~US$11 por kilo, agente en China,
  junio de 2026) y entra por courier simplificado (4% de arancel + 18% de IGV, hasta US$2,000).
- **Resultado:** **US$900–1,400 (S/3,400–5,200)**. Por mar consolidado sale ~US$950 (S/3,500),
  pero tarda de 5 a 8 semanas y suma los gastos de agente y de puerto.

**Contra la local de S/1,490, que ya se confirmó que cierra la sleek:**
- **Cuesta 2.3 a 3.5 veces más**, y no trae garantía ni repuestos en el Perú.
- **La corriente:** el Perú es 220 V a **60 Hz**, y muchas máquinas chinas vienen para 50 Hz. Un
  motor de 50 Hz gira ~20% más rápido a 60 Hz y la electrónica puede fallar. Hay que pedirla para
  60 Hz.
- **⚠ El Nuevo RUS no permite importar.** El TUO del Nuevo RUS (art. 3.2) excluye las operaciones
  de comercio exterior. La única excepción es la zona de frontera, hasta US$500 al mes, y Trujillo
  no lo es. Importarla a su nombre podría sacarlo del régimen. **Se confirma con el contador antes
  de comprar** (P62). La salida sería comprarla a un importador local.

**Recomendación:**
- **Ahora, la local de S/1,490.** Una manual hace ~6 latas por minuto: alcanza hasta decenas de
  latas al día y se paga con ~320 latas (§14).
- **La automática, cuando se vendan más de 40–50 latas al día.** Si es de Alibaba, se pide:
  - la versión de 60 Hz;
  - el mandril de la tapa 202 de la sleek;
  - un video cerrando una lata igual;
  - Trade Assurance;
  - y comprarla por un importador si sigue en el Nuevo RUS.

**Cero azúcar:** la fórmula no lleva azúcar. Se guarda el cálculo de la fórmula como respaldo del
«cero azúcar», por si lo piden DIGESA o INDECOPI.

**Actualización del 24-oct.** Dueño: «Es la misma máquina automática que vende Homebrewer, pero
del fabricante». Entonces se compara con la semiautomática de **S/5,490**, no con la manual:
- **Importarla ahorra S/300–2,100.**
- **Pero se pierde:** la garantía y el servicio en el Perú, la seguridad de que viene para 60 Hz, y
  el riesgo del Nuevo RUS.
- **Antes de decidir,** pregúntale a Homebrewer si su unidad viene para 60 Hz y con cuánta garantía.
  Si la diferencia queda en unos cientos de soles, conviene la local.

## 17 · Las fórmulas v6 y lo que dice la lata (2026-10-24)

Dueño: «Veamos las fórmulas de las bebidas, llevémoslo a su máxima expresión, repiénsalas 10 veces
como mínimo» y «colocar en la lata las cosas positivas, como 100% hecho con ingredientes
naturales».

**Las fórmulas v6** van aparte, fuera del repo, que es público. Salieron de doce vueltas
(dulzor, color, aroma, cuerpo, ingrediente exacto, brillo, vida útil, costo y cata). Lo principal:
- **Dos tiempos de extracción:** un golpe corto de calor para el color y el cuerpo, y frío largo
  para el aroma.
  - En caliente, la jamaica suelta 47% más antocianinas (2021).
  - En frío sale más floral y menos amargo (*Foods*, 2022).
- **Una pizca de sal**, que suaviza lo amargo más que lo dulce (Breslin y Beauchamp, *Nature*,
  1997).
- **Cáscaras de cítricos en frío** en lugar de esencias.
- **Hierba luisa de tallo** (*Cymbopogon*), fresca y golpeada.
- **Limón sutil:** la ralladura va en frío y el jugo al final.

**Decisiones del dueño:**
- **Sigue la sucralosa:** se le explicó que para decir «ingredientes naturales» tenía que ser
  stevia, y eligió sucralosa.
- **Sigue el brillo.**

**Lo que dice la lata**, todo en positivo y verdadero:

| frase | por qué es cierta | por qué vende |
|---|---|---|
| **Cero azúcar** | la fórmula no lleva azúcar | Ipsos 2025: el 70% se preocupa por «Alto en azúcar» |
| **Sabor 100% natural** | el sabor sale de flores, hojas, frutas y especias, sin esencias ni saborizantes | una frase concreta y comprobable es más creíble que una vaga (Darley y Smith, 1993); en el Perú el 42% desconfía de lo que se vende como «saludable» (Kantar 2025) |
| **Reposada en frío** | es el proceso | contar el esfuerzo sube la calidad percibida (Kruger, 2004) |

- **No se dice «100% ingredientes naturales»:** la sucralosa es sintética y el brillo lleva dióxido
  de titanio. INDECOPI ya sancionó un «100% jugo» sin respaldo (Resolución 0076-2020/SDC,
  L'Onda).
- **Si cambian el endulzante o el brillo,** se revisa.
- **Si la caja de los filtrantes del chai dice «saborizante» o «aroma»,** The Chai no puede llevar
  «Sabor 100% natural».

## 18 · Las recetas v7: se revierten, salvo el Arnold Palmer (2026-10-24)

El dueño había dicho: «No mejoramos en nada las recetas. Mejóralas, investiga, mira chef, mira
bebidas populares en USA y traemos a Perú. Mira cómo lo hace también la marca Arizona». La v7
sumó un ingrediente nuevo a cada lata:
- kion y maracuyá en The Bloom;
- pepino y hierbabuena en The Cool;
- especias enteras en The Chai;
- cacao en The Midnight.

**El dueño la rechazó:** «Revierte. Te pedí mejoras; yo apruebo los cambios completos de sabores.
Los nuevos no me gustan para nada, más que Arnold Palmer. No quiero cambiar el chai aún».

**Lo que queda** (las fórmulas, aparte y privadas):
- **The Bloom, The Cool, The Chai y The Midnight vuelven a la v6.**
- **Lemon Tea queda al estilo Arnold Palmer:**
  - el té domina: 60 ml de limón por litro en vez de 90. Arnold Palmer: «Iced tea has the
    dominant side, and if it doesn't, it isn't really right»;
  - la ralladura fresca va al final, para el aroma al abrir;
  - **sin pera.** Dueño: «Sin fruta para mantener el cero azúcar. Si es pera sería esencia, pero
    no deseamos esencias». Lo que se revisó:
    - **La cáscara de pera:** es donde más aroma suelta (Rapparini y otros, 2005, en una sola
      variedad), pero también trae azúcar.
    - **Destilarla:** saca el aroma sin el azúcar, pero para la ley eso es un «aroma natural» (Codex
      CXG 66-2008), o sea una esencia hecha en casa. Además, un hidrolato sin conservante se
      contamina aun a 5 °C (INRAE).
    - **Quedó fuera:** el Arnold Palmer original es solo té y limonada.

**The Midnight:** el dueño pidió cambiarle el nombre (venía del concepto de las horas que él
descartó) y ver si se queda en la línea. La decisión está en §19.

## 19 · The Midnight pasa a llamarse Cold Brew Tea, y se queda a prueba (2026-10-24)

El nombre venía del concepto de las horas que el dueño descartó. Pidió cambiarlo y ver si la bebida
se queda.

**Lo que pesó:**
- **Para que se quede:**
  - Es la que más deja por lata (S/5.11 con precios revisados, §11).
  - No depende del limón.
  - Ya está en la app.
- **Para que salga:**
  - Con Lemon Tea y The Chai serían tres latas de té negro de cinco.
  - Los tés fríos que se lanzan en el Perú llevan sabor (Lipton: limón y durazno).
  - Es poco ácida: dura 5 días.
- **Lo que no se usó como argumento:** «menos opciones venden más». Entre 5 y 4 no hay evidencia
  (metaanálisis de Scheibehenne y otros, 2010).

**Decisión del dueño:** se queda y se mide, con el nombre **Cold Brew Tea**. En la app se lee
«Cold Brew // Tea» y en la lata, «COLD BREW TEA» con «Té negro» debajo.

**Por qué ese nombre:**
- Dice lo que es: 12 horas en frío.
- «Cold brew» ya se conoce en el Perú por el café:
  - Midagri lo promovió en el verano de 2025;
  - gana interés entre los jóvenes en las cafeterías de Lima (America Retail, 2025).
- Contar el esfuerzo sube la calidad que se percibe (Kruger, 2004).

**Cómo se mide** (ingeniería de carta, Kasavana y Smith):
- **Cuándo:** a las 4 semanas de la apertura.
- **La regla:** con 5 bebidas, una es popular si se lleva al menos el **14%** de las bebidas
  vendidas (el 70% de 1/5).
- **Si no llega, sale.**
- **Mientras tanto:**
  - se hace en tandas chicas (1–2 L);
  - no va a tiendas hasta pasar la prueba.

## 20 · ¿La lata PET sleek aguanta gas? (2026-10-24)

Dueño: «Averigua si esas latas soportan burbujas».

**Respuesta: no lo sabemos, y aun si la lata aguanta, el gas choca con dos cosas de la marca.**

- **La lata:**
  - Una bebida con gas empuja a 2.7–4.7 bar en la lata cerrada (ChemEd X, latas y botellas de
    355 ml), y más con calor: una cola a 38 °C llega a ~4.5 kg/cm².
  - Una botella PET de gaseosa resiste unos 5–7 bar porque tiene la pared más gruesa y la base de
    pétalos (fabricantes de envases).
  - Hay latas PET «para soda» con su tapa de aluminio especial, vendidas para gaseosa y cerveza
    artesanal. Las de bubble tea son otra cosa.
  - **La ficha de la sleek de 355 ml de The Homebrewer no dice si es para gas**, y su fondo plano es
    el punto débil: es lo que se abomba.
- **El reparto:** una lata en la mochila del motorizado, al sol de Trujillo, sube de presión. Una
  tapa que salta en la bolsa es un reclamo y un sándwich mojado.
- **«Agítala» y el brillo:** una bebida con gas no se agita antes de abrirla, porque revienta. Y las
  partículas del brillo hacen que la espuma brote al abrir. **El ritual de la marca no funciona con
  gas.**
- **El equipo:** hace falta gasificar en un barril con CO₂ y llenar a contrapresión (el llenador
  más barato encontrado cuesta ~US$260, más el barril, el CO₂ y su regulador).
- **Si algún día se quiere:**
  1. pedir al fabricante la presión de prueba de la lata y de la tapa;
  2. probar 24 horas a 40 °C con una bebida gasificada de verdad;
  3. hacerla como **otra línea**, sin brillo y sin «Agítala».

## 21 · La ejecución al milímetro (2026-10-24)

Dueño: «Las fórmulas las refines al milímetro, me des ideas inocuas y baratas de ejecutar». **Las
cantidades van aparte (privadas).** Lo que se adoptó:
- **Todo por peso:** el agua, las hojas, el jugo y el llenado (355 g ± 3 g por lata).
- **Se completa al peso final después de colar:** las hojas absorben agua y así cada tanda sale con
  la misma concentración.
- **La sucralosa y la sal en solución madre** (al 2% y al 10%), con jeringa o balanza de 0.01 g.
- **Siempre la misma agua de bidón.**
- **Enfriado rápido:** con botellas de hielo, y la regla de la FDA (de 57 a 21 °C en 2 h; a 5 °C
  en 4 h más).
- **Desinfección:**
  - Star San, sin enjuague, para latas y utensilios;
  - lejía a ~100 ppm para lo que entra crudo.
- **Control de cada tanda:**
  - pHmetro: las ácidas por debajo de 4.0;
  - refractómetro (°Brix);
  - termómetro en la refrigeradora;
  - planilla de lote y muestra testigo.
- **La fecha y el lote en el sello de la tapa**, con etiquetadora: hecha · vence · lote.
- **El dulzor exacto** se elige con la cata «justo como me gusta» (escala JAR, ASTM MNL 63).
- **Equipo nuevo:** ~S/250–400, estimado.

## 22 · Tres mejoras al diseño aprobado (propuesta, 2026-10-24)

Dueño: «Quiero que mejores el diseño del producto». Es un **arreglo**, no un rediseño: se queda
todo lo aprobado (los nombres, la banda de «Cero azúcar», la letra, los colores).

| mejora | por qué vende | en qué me baso |
|---|---|---|
| **El dibujo del ingrediente** junto a la línea de sabor (flor de jamaica, hojas, rodaja de limón, canela, hoja de té), en línea, del color de la letra | Las tres de té (Lemon Tea, The Chai, Cold Brew Tea) se parecen por el color. Un dibujo las distingue | Ehrenberg-Bass (2023, EE. UU., 1,853 compradores): con imágenes, 23% más personas reconocen la variedad que con color. Cada dibujo es de un ingrediente que la lata sí lleva (INDECOPI) |
| **El sello de la tapa: «AGÍTALA» al centro**, con flechas, y la fecha y el lote impresos con etiquetadora | El ritual se lee justo cuando la mano está por abrir. La fecha de hecha se lee como frescura | Vohs y otros, 2013 (los rituales); una tesis de Taiwán (la fecha de fabricación sube la frescura percibida al inicio de la vida del producto; evidencia débil); la Ley 26842 art. 92 exige la fecha de vencimiento |
| **Atrás: «¿Otra? Pídela con tu sándwich.»** junto al QR | Quien compre la lata en una tienda llega a la app y conoce los sándwiches | El QR es costumbre en el Perú: los pagos con QR crecieron 74% en 2025 (América TV) |

**Pendiente:** que el dueño elija cuáles entran.

## 23 · Inocuidad: lo más cerca de cero riesgo que permite la lata PET (2026-10-24)

Dueño: «Cómo esterilizar por completo, quiero cero riesgos».

**Lo honesto primero:**
- **Esterilizar de verdad** (como una conserva: 121 °C a presión) **no se puede en esta lata.** El PET
  común se empieza a deformar desde ~60 °C, y se ablanda a ~76 °C, su transición vítrea (patentes y
  fabricantes de envases).
- **Por la misma razón no se llena en caliente.** Eso pide PET termofijado (para unos 85 °C), y
  nada dice que la sleek lo sea.
- **Lo que sí se puede** es que ningún microbio peligroso tenga cómo entrar, sobrevivir ni crecer, y
  **comprobarlo con laboratorio**. Es el sistema de barreras.

### Barrera 1 · Matar: pasteurizar la bebida terminada, en la olla, antes de llenar

| bebidas | tratamiento | por qué ese número |
|---|---|---|
| **The Bloom, The Cool, Lemon Tea** (ácidas, pH menor a 4.0) | **75 °C sostenidos 1 minuto**, medidos en el centro de la olla | La FDA da 71.1 °C por 3–6 segundos para bajar 100,000 veces (5 log) E. coli O157:H7, Salmonella y Listeria en jugos de pH 3.9–4.0. Con 75 °C y 1 minuto hay margen de sobra |
| **The Chai y Cold Brew Tea** (poco ácidas, pH ~5) | **Opción máxima: 90 °C por 10 minutos.** Si cambia demasiado el sabor: 75 °C por 1 minuto y la vida corta de abajo | 90 °C por 10 minutos es el tratamiento de referencia de la agencia británica (FSA) contra *C. botulinum* no proteolítico, el único que crece en frío. Sin ese calor, la regla es que no pasen 10 días entre 3 y 8 °C: nosotros damos 5 días a 4 °C o menos |
| **Opción por probar en las dos poco ácidas** | gotas de jugo de limón hasta que el pH baje de **5.0** | pH 5.0 o menos es otra de las barreras de la FSA contra el botulismo. Se prueba a ciegas que no se note el limón; si se nota, no va |

- **El calor va al final**, con todo ya mezclado: el limón, la menta y la ralladura también se
  pasteurizan.
- **El aroma fresco se resiente un poco:** se cata la pasteurizada contra la cruda antes de
  adoptarla.
- **«Reposada en frío» sigue siendo cierto:** el reposo en frío no cambia.

### Barrera 2 · Que no entre nada después del calor
- **Se cuela antes de pasteurizar, nunca después.**
- **Se enfría con la olla tapada**, en baño de agua con hielo **por fuera**. Después del calor no se
  mete nada que no esté desinfectado.
- **Latas, tapas, embudo y jarra:** Star San por 1 minuto, escurridos boca abajo sobre una rejilla
  limpia. No se enjuagan con agua de caño.
- **Se llena y se sella al momento:** ninguna lata se queda abierta.
- **Quien llena** lleva gorro, mascarilla y guantes rociados con alcohol al 70%. Nadie enfermo toca
  la producción.
- **El brillo,** solo con ficha técnica y análisis microbiológico del proveedor. Se guarda cerrado y
  se saca con una cucharita seca y desinfectada.

### Barrera 3 · Que no crezca
- **4 °C o menos, siempre:** termómetro dentro de la refrigeradora, anotado mañana y tarde.
- **En el reparto,** bolsa térmica con gel refrigerante.
- **Vida corta:** 7 días las ácidas y 5 las poco ácidas. Primero que entra, primero que sale.

### Barrera 4 · Comprobarlo (lo que convierte «creo» en «sé»)
- **Laboratorio acreditado por INACAL**, con las cinco fórmulas finales:
  - **cuándo:** el día 0, el último día de vida y el día 10, para tener margen;
  - **qué mide:** aerobios mesófilos, mohos y levaduras, coliformes y *E. coli*. Son los parámetros
    que usa la norma peruana de criterios microbiológicos (RM 591-2008/MINSA, NTS 071).
- **Se repite** cada mes y cada vez que cambie algo (proveedor, receta, proceso).
- **Precio:** por cotizar.
- **Lo crudo igual se desinfecta** (lejía a ~100 ppm, 2 minutos). Cuantos menos microbios
  entran, más margen deja el calor.
