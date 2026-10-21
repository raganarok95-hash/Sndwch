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

1. **Que duren 30 a 45 días refrigeradas, no 4 a 7.** Eso pide cuatro cosas juntas: acidez
   (pH 4.0 o menos), pasteurizar el líquido, llenar en frío y un conservante permitido (sorbato de
   potasio, dentro del límite del Codex). **La lata PET no aguanta el llenado en caliente**: el PET
   empieza a deformarse alrededor de los 70 °C. Por eso se pasteuriza el líquido ANTES, se enfría y
   se llena frío. Es una bebida de refrigeradora, como los jugos prensados, no de anaquel.
2. **Menos de 5 g de azúcar por 100 ml.** Sin octógono, y en el impuesto selectivo (punto 5)
   paga 17% en vez de 25%.
3. **Registro sanitario de DIGESA, uno por sabor**, por la VUCE. Pide análisis microbiológico y
   fisicoquímico de un laboratorio acreditado, la ficha técnica y el rotulado. En el TUPA anterior
   costaba S/365 por producto; un comunicado de 2026 sugiere que podría no tener costo, así que se
   confirma en la VUCE al generar el pago. Vale 5 años.
4. **La etiqueta**: nombre, ingredientes, contenido neto, lote, fecha de vencimiento, «Mantener
   refrigerado», RUC y dirección del fabricante, número de registro sanitario y el octógono si
   corresponde.
5. **Impuestos: al venderla envasada a una tienda, el negocio pasa a ser productor de bebidas.**
   Paga el ISC (Decreto Supremo 266-2021-EF): 17% si tiene entre 0.5 y 5 g de azúcar por 100 ml y
   25% desde 5 g. Además, quien hace operaciones con ISC no puede estar en el Nuevo RUS. **Se
   confirma con el contador ANTES de vender la primera lata a una tienda.**

Cuando el volumen lo justifique, otra vía es la **maquila**: que la produzca una planta que ya
tiene registro y habilitación, con tu receta y tu marca.

## 3 · La receta mejorada: hacia dónde va

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

Supuestos: la bodega gana 30% del precio final; ISC 17% (azúcar bajo 5 g); IGV 18%. Costo de la
lata llena entre S/1.70 y S/2.90: insumos S/0.50–1.20, lata y tapa S/0.90–1.50 (por confirmar) y
etiqueta ~S/0.20 (estimada). No cuenta mano de obra, frío ni reparto.

| precio en la tienda | te pagan (sin IGV ni ISC) | te queda por lata |
|---|---|---|
| S/6 | S/3.04 (S/2.85 si paga 25% de ISC) | S/0.14 a S/1.34 |
| S/8 | S/4.06 (S/3.80 con 25%) | S/1.16 a S/2.36 |

**A S/6 en una bodega, la lata casi no deja.** Como producto de tienda funciona si es premium
(S/7–8, artesanal, con pocas calorías) y con menos de 5 g de azúcar. En la app, donde no hay bodega
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

## Fuentes

- Latas PET y selladoras, The Homebrewer Perú: https://thehomebrewerperu.com/producto/latas-pet-de-350-ml-con-tapa/ · https://thehomebrewerperu.com/producto/selladora-automatica-de-latas-pet/ · https://thehomebrewerperu.com/producto/selladora-manual-de-latas-pet/
- Lata soda PET, Impacto Gastronómico Perú: https://www.impactogastronomicoperu.com/herramientas-1/lata-soda-pet-
- Casandina: https://casandina.com/product/maquina-selladora-de-latas/ · Promart: https://www.promart.pe/maquina-cerradora-de-lata-automatico-1000505543/p
- Latas PET en China (referencia): https://www.accio.com/plp/es/latas-pet · https://spanish.alibaba.com/product-detail/PET-plastic-can-with-aluminium-easy-60564268743.html
- PET y calor (Tg 67–71 °C): https://packagingeurope.com/molding-options-for-heat-setting-pet/5239.article
- Octógonos, segunda fase (5 g por 100 ml en bebidas desde el 17-09-2021): https://blog.prcp.com.pe/wp-content/uploads/2021/09/Client-Memo-El-17-de-setiembre-de-2021-entran-en-vigencia-los-parametros-tecnicos-de-la-segunda-fase-de-la-aplicacion-de-octogonos.pdf
- ISC de bebidas (DS 266-2021-EF): https://gestion.pe/economia/isc-bebidas-azucaradas-y-cerveza-sin-alcohol-con-nuevas-reglas-para-pagar-hasta-25-en-isc-noticia/ · https://www.infobae.com/america/peru/2021/09/30/mef-bebidas-que-pasen-los-5-gramos-de-azucar-pagaran-25-de-impuesto-selectivo-al-consumo/
- Registro sanitario: https://www.digesa.minsa.gob.pe/orientacion/COMUNICADO%20TUPA%20PRODUCTOS.pdf · https://www.industriaalimentaria.org/blog/contenido/digesa-garantiza-continuidad-de-tramites-sanitarios-para-alimentos · https://www.vuce.gob.pe/manual_vuce/manuales/usuarios/DGS006_Inscripcion_Registro_Sanitario_Alimentos_Bebidas_Consumo_Humano_(Nacional).pdf

Casi todos los precios son publicados por vendedores y sin la cantidad exacta: sirven para saber
a quién pedir cotización, no para comprar. Lo legal y lo tributario se confirma con DIGESA (VUCE)
y con el contador.
