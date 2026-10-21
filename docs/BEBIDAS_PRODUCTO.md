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
- Registro sanitario: https://www.digesa.minsa.gob.pe/orientacion/COMUNICADO%20TUPA%20PRODUCTOS.pdf · https://www.industriaalimentaria.org/blog/contenido/digesa-garantiza-continuidad-de-tramites-sanitarios-para-alimentos · https://www.vuce.gob.pe/manual_vuce/manuales/usuarios/DGS006_Inscripcion_Registro_Sanitario_Alimentos_Bebidas_Consumo_Humano_(Nacional).pdf

Casi todos los precios son publicados por vendedores y sin la cantidad exacta: sirven para saber
a quién pedir cotización, no para comprar. Lo legal y lo tributario se confirma con DIGESA (VUCE)
y con el contador.
