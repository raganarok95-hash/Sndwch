# SND//WCH — ¿Es rentable cada parte del negocio?

**2026-09-05.** `modelo/rentabilidad_por_parte.py`. Precios y recetas leídos de
`catalog_prices` y `catalog_items` **en la base**, no de los literales del código.

**Cómo se lee el "costo %":** insumos + empaque como porcentaje del precio de venta. El techo
acordado con el dueño es **45%**. Más alto es peor. No es margen: es lo que se va en costo.

---

## 0. Respuesta corta — resuelto el 2026-09-05

Seis partes pasaban el techo. **Ninguna era un Signature. Hoy no queda ninguna.**

| parte | costo % antes | qué se hizo | ahora |
|---|---|---|---|
| The Midnight en combo | 48.8% | el combo se atribuye al **sándwich**, no a la bebida | **39.0%** |
| BYO Res asada 30CM | 47.6% | **fuera de ARMA EL TUYO** (`sigOnly`, sigue en THE ORIGINAL) | — |
| The Bloom / The Cool en combo | 46.8% | igual que The Midnight | **39.0%** |
| BYO Embutido 15CM | 45.7% | **fuera de ARMA EL TUYO** (`sigOnly`, sigue en THE SMOKE) | — |
| doble Pollo cajún 30CM | 45.2% | queda; es exclusiva del menú secreto, no se arma por BYO | — |
| doble Albóndiga 30CM | 44.7% | precio escalado con la porción: **S/6 → S/12** | **22.3%** |
| **bebida gratis de hora valle** | **contribución −S/1.79** | **retirada** | — |

Estado del catálogo hoy, con el cliente llevándose **todos** los vegetales disponibles:

| bloque | peor caso | ¿pasa el techo? |
|---|---|---|
| Signatures | The Original 30CM · 41.2% | no |
| ARMA EL TUYO | Pollo teriyaki 30CM · 43.3% | no |
| Doble proteína | Pollo teriyaki 30CM · 45.0% | justo en el borde |
| Bebidas | The Spice · **24.9%** | no — son lo mejor del catálogo |

> ⚠ **Una corrección a la primera versión de este documento.** El combo aparecía como el peor
> problema del catálogo, y era en parte un artefacto de cómo yo lo costeé: el combo es −S/1
> sobre el **total del pedido**, no sobre la bebida. Atribuirlo entero a la línea más barata
> hacía que tres de las cuatro bebidas parecieran pasarse. Con el descuento atribuido al
> sándwich —que tiene margen de sobra— las cuatro quedan en 39%. **El total que paga el
> cliente no cambió; cambió de qué línea sale.** Lo que sí era una pérdida real, y se retiró,
> es la bebida gratis de hora valle.

**Efecto en la contribución por pedido: S/14.11 → S/14.47.** Dos cosas la empujan: sacar las
dos peores proteínas del armador subió su promedio de S/9.94 a S/11.18, y el envase cotizado
(S/0.69 en vez de ~S/1) bajó el costo de las bebidas de un 39% asumido a un **21.9% real**.

## 1. Los Signatures están todos sanos

| | 15CM | 30CM |
|---|---|---|
| SIG02 The Marinara | 20.4% | 26.4% |
| SIG06 The Teriyaki | 27.5% | 37.3% |
| SIG04 The Fresh | 28.9% | 30.8% |
| SIG01 The Original | 29.7% | 41.2% |
| SIG03 The Smoke | 32.5% | 40.8% |

Ninguno se acerca al techo. **Esto confirma el hallazgo estructural del análisis de menú: una
receta fija es una receta costeada; un armador de elección libre no lo es.** Los Signatures se
diseñaron con el costo a la vista; el ARMA EL TUYO se costeó contra una configuración de
muestra, no contra lo que el cliente puede pedir.

---

## 2. ARMA EL TUYO — resuelto sacando dos proteínas

| proteína | 15CM | 30CM | estado |
|---|---|---|---|
| Albóndiga | 31.5% | 30.1% | ✅ |
| Atún | 39.1% | 36.2% | ✅ |
| Pollo teriyaki | 41.9% | 43.3% | ✅ |
| ~~Res asada~~ | 44.2% | ~~47.6%~~ | **fuera del armador** |
| ~~Embutido~~ | ~~45.7%~~ | 43.0% | **fuera del armador** |

Las dos salieron a `sigOnly`: no se pueden armar, **pero siguen vivas en THE ORIGINAL y THE
SMOKE**, donde la receta está costeada y rinden bien. Ese es exactamente el hallazgo
estructural: *una receta fija es una receta costeada; un armador de elección libre no lo es.*

⚠ **Esto dejó el armador con TRES proteínas** (pollo teriyaki, atún, albóndiga), porque el pollo
cajún es exclusivo del menú secreto. Tres es poco para una sección cuyo argumento entero es que
el cliente elige.

**Resuelto el 2026-09-06 con una cuarta: el PAVO (P08), S/15.90 / S/28.90.** Y lo que la hace
viable no es una cotización afortunada sino algo estructural: **es fiambre, así que no tiene
merma de cocción**. Un kilo comprado es un kilo servido, mientras que la res rinde 0.54 y el
pollo 0.64-0.69 y su costo real por porción termina siendo ~1.85x el del insumo crudo. Por eso
el pavo, que cuesta **más del doble por kilo que la res** (S/44.20 contra S/20), sale **más
barato por sándwich**: 44.7% de costo en los dos tamaños, justo debajo del techo.

Es la lección general para cualquier proteína futura del armador: **el precio por kilo no dice
nada hasta dividirlo por el rendimiento.** Si vuelve a haber margen, devolver la res sigue siendo
lo primero a revisar.

También salieron dos vegetales: **el apio** (ya no lo usa nadie) y **el pepinillo**, que el
dueño cambió por lechuga. El pepinillo sigue en el catálogo como `sigOnly` porque SIG01 y
SIG03 lo llevan. El armador baja de 92 g a **73 g** de vegetales, lo que además abarata cada
sándwich unos céntimos.

---

## 3. Las bebidas — cotizadas, y son la parte MÁS rentable del catálogo

**El envase ya está cotizado y comprado** (dueño 2026-09-05): **S/138 por 200 unidades =
S/0.69 la botella**, un 31% menos que el ~S/1 que se venía estimando. Era el único número que
faltaba para que esta sección dejara de ser aritmética sobre una suposición.

**Y el tamaño ya está decidido: MEDIO LITRO** — era la otra mitad del dato que faltaba. Hasta el
2026-09-06 las bebidas se costeaban contra un vaso de 350 ml que nunca se eligió; el envase
comprado es de medio litro, o sea **43% más bebida** que ese vaso. El insumo escala con el
volumen, el envase no.

| bebida | precio | insumo (500 ml) | envase | costo | deja | costo % |
|---|---|---|---|---|---|---|
| The Cool // Mint | S/6 | S/0.48 | S/0.69 | S/1.17 | **S/4.83** | 19.4% |
| The Midnight // Brew | S/5 | S/0.72 | S/0.69 | S/1.41 | **S/3.59** | 28.2% |
| The Bloom // Hibiscus | S/6 | S/1.20 | S/0.69 | S/1.89 | **S/4.11** | 31.5% |

**Promedio ponderado: 26.3% de costo.** Siguen a bastante menos del techo de 45% — son, por
lejos, lo mejor del catálogo, y eso refuerza la decisión de empujar el attach: cada bebida sube
la contribución del pedido bastante más de lo que sube el ticket.

**El envase es la MITAD del costo de una infusión y no escala con el volumen.** Por eso pasar de
350 ml a medio litro sube el costo mucho menos de lo que parece: The Cool sube 2.4 puntos, de
17.1% a 19.4%, y a cambio el cliente recibe 43% más bebida. Es la palanca más barata de valor
percibido que tiene el negocio.

Se costean **por bebida y no con un porcentaje plano** a propósito: The Bloom cuesta 2.5x lo que
The Cool y las dos se venden a S/6, así que un promedio esconde justo la que peor rinde.

### El chai salió del menú (decisión del dueño, 2026-09-06)

A medio litro, **The Spice // Chai quedaba en 42.5% de costo** contra 19-32% de las otras tres:
la única bebida cerca del techo. Y el motivo es estructural, no de proveedor — **media botella de
chai es media botella de LECHE**, un insumo que se compra, mientras que en las tres infusiones el
volumen es agua. Ninguna cotización arregla eso.

Era además la única con un insumo que no se puede stockear, lo que obligaba a un concentrado
aparte y a mezclar al momento. La receta queda guardada completa en `RECETARIO.md` PARTE 4.

> **Lo que sigue estimado es el precio por kilo de las hierbas**: jamaica y té negro se costean a
> S/97/kg (precio publicado de Campo Grande Perú) y el resto son supuestos de trabajo. Pesan mucho
> menos que el envase, que sí está cotizado, así que el número ya es utilizable. El cálculo
> completo, con el origen de cada precio, está en `modelo/costo_bebidas.py`.

### Y el modelo tenía tres defectos en bebidas, ahora corregidos

Usaba **una sola cifra** —25% de attach × S/3.79— que no correspondía a ninguna situación real:

1. El S/3.79 salía de "S/4.79 menos S/1 de combo", o sea asumía que **toda** bebida se vende
   en combo. Y ese S/4.79 no incluía el envase.
2. **Ignoraba la bebida gratis de hora valle**, que era contribución negativa. Un promedio que
   omite el peor caso no es un promedio. *(Esa promo ya se retiró: era la única operación del
   catálogo que perdía plata.)*
3. **Atribuía el combo a la bebida.** El combo es −S/1 sobre el total del pedido; cargárselo a
   la línea más barata hacía que tres de las cuatro parecieran pasarse del techo.

Ahora la contribución por bebida es **S/5.07** y el combo se resta aparte, una vez por pedido
con bebida.

---

## 4. El programa de puntos — recalibrado

Un punto se gana 1:1 por sol gastado, así que "puntos que cuesta un canje" es literalmente
"soles que el cliente tuvo que gastar". Lo que devolvía cada recompensa estaba disparejo:

| recompensa | antes | devolvía | **ahora** | devuelve |
|---|---|---|---|---|
| 4ta salsa gratis | 40 | 0.67% | **20** | 1.33% |
| sube a 30CM gratis | 160 | **2.88%** | **320** | 1.44% |
| doble proteína gratis | 120 | 2.06% | **160** | 1.54% |
| bebida gratis | 120 | 1.95% | **160** | 1.46% |
| sándwich 15CM gratis | 400 | 1.48% | 400 | 1.48% |

**Había un factor 4.3 entre la más barata y la más cara para el negocio.** Un cliente que mira
los números canjeaba siempre "sube a 30CM" y las otras cuatro eran decorado — así que el
programa terminaba pagando el canje más caro cada vez. Ahora la dispersión es **1.2x**.

R06 no se movió a propósito: es el ancla, y `REFERRER_REWARD_POINTS` debe valer exactamente lo
mismo — `npm run parity` lo verifica. Aplicado en código **y** en `catalog_prices`.

---

## 5. Lo que sí está bien construido

**El delivery es pass-through de verdad.** El cliente paga, el motorizado cobra, el negocio ni
gana ni subsidia. Dos detalles lo sostienen y no hay que romperlos: la tarifa se engorda por
la comisión de Culqi en pagos con tarjeta (si no, cada envío perdería 5.5% del flete), y
`billableKm` devuelve `null` y nunca 0 cuando no puede medir. Lo que falta es **mirar
`orders.delivery_km` contra lo que el motorizado cobró** — la columna existe para eso y nadie
la ha usado.

**El Plan Semanal es un descuento del 10.2%, no del 5%.** Entran S/95, Culqi se lleva S/5.22,
quedan S/89.78 limpios contra un compromiso de S/100 de consumo. El descuento sale entero de
la contribución.

**El referido cuesta S/7.65 contra un CAC pagado de ~S/17.87** — el 43%. Es el canal más
barato que tiene el negocio, y es coherente con que la proyección diga que la viralidad es
una de las pocas palancas con recorrido.

---

## 6. Lo que queda abierto

Todo lo de arriba ya está aplicado, en código **y** en `catalog_prices`/`catalog_items` — un
precio en el código no cambia el precio real. Lo que sigue pendiente:

1. **Cotizar el insumo por vaso de cada bebida.** El envase ya está (S/0.69); lo que queda
   estimado es la infusión en sí, y pesa mucho menos.
2. **Cotizar embutido, albóndiga y queso.** El queso usa un proxy de S/35/kg cuando hay un
   dato de S/22.50/kg para mozzarella — si ese fuera el real, todos los Signatures con queso
   fijo mejoran.
3. **Cotizar el pavo al por mayor.** Entró costeado a S/44.20/kg derivado del precio *retail*
   de Braedt (S/43.75/kg); Makro tiene local en Trujillo y ahí debería bajar. Ojo con el
   proveedor: **Sigma Alimentos es dueño de Braedt, Otto Kunz y La Segoviana a la vez**, así que
   entre esas tres no hay competencia real de precio — hay que cotizar contra San Fernando o
   Laive, que son los independientes.
4. **Medir la mezcla real Signature/ARMA EL TUYO.** Todo el modelo asume mitad y mitad sin
   ningún dato. `retention_report` ya devuelve `attach.size30Pct`, así que se puede medir
   desde el primer mes.
5. **Comparar `orders.delivery_km` contra lo que el motorizado cobró.** La columna existe
   justo para eso y nadie la ha mirado.

> **Nada de esto se arregla con publicidad.** Al contrario: la publicidad multiplica el volumen
> de lo que ya está mal. Por eso hacer rentable cada parte va **antes** de gastar en captar —
> y la proyección lo confirma desde el otro lado: subir el presupuesto de S/6,000 a S/20,000
> mueve la probabilidad de éxito 5 puntos.
