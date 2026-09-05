# SND//WCH — El menú desde la raíz

**2026-09-03 · v2, con los datos cotizados del dueño.** Reconstruido con
`modelo/menu_v2_cotizado.py` (la v1, `modelo/menu_desde_la_raiz.py`, queda como historial),
que **no parte de ningún
margen ya calculado**: suma componente por componente (gramaje × precio/kg, con merma de
cocción) y recién al final compara contra el precio de carta. Los precios están verificados
contra `catalog_prices`, `catalog_items` y `secret_signature` en la base — coinciden.

---

## 0. El hallazgo, en una línea

**El precio del ARMA EL TUYO se fijó contra una configuración de muestra, no contra lo que
el cliente puede pedir de verdad.** Son gratis e ilimitados: los toppings (6 públicos, todos
a la vez, 94 g), el queso, y hasta 3 salsas. Nadie costeó el sándwich que un cliente
racional arma.

> **⚠ CORREGIDO 2026-09-03 con los datos cotizados del dueño.** Esta versión usaba un bloque
> de "~65 g de vegetales" tomado de Subway, y marcaba el empaque y los toppings como *sin
> cotizar*. Las dos cosas estaban mal: **el empaque está cotizado (S/1.10–1.50) y los toppings
> también (S/4/kg)**, y el gramaje real por topping estaba escrito en `RECETARIO.md`.
> Con los datos reales el resultado es **peor**, no mejor — ver `modelo/menu_v2_cotizado.py`.

| | cruzan el techo de 45% |
|---|---|
| Lectura del análisis anterior (2 salsas, sin queso) | **1** de 12 |
| Peor caso real, empaque en S/1.10 | **8** de 12 |
| Peor caso real, empaque en S/1.50 | **10** de 12 |

El "peor caso real" es el que un cliente puede armar hoy sin pagar un sol extra: pan sub,
**3 salsas, queso, y los 6 toppings públicos (94 g)**. Todo su costo está cotizado.

**Los 12 Signatures no cruzan ninguno.** Esa es la lección estructural, y no es suerte:

> Una receta fija es una receta costeada. Un armador de elección libre no lo es.
> En un Signature el cliente no puede cargar el sándwich; en el BYO sí, y gratis.

---

## 1. El piso fijo — la parte que la lista de precios ignora

El precio del BYO es una escalera por **proteína** (`PROT_PRICE`), como si la proteína fuera
el producto. Pero antes de poner un gramo de proteína, el sándwich ya cuesta:

| | 15CM | 30CM |
|---|---|---|
| Pan sub | 1.00 | 2.00 |
| Empaque | 1.10 | 1.10 |
| 3 salsas | 0.80 | 1.60 |
| 7 toppings | 0.61 | 1.21 |
| Queso | 0.39 | 0.77 |
| **Piso** | **S/3.89** | **S/6.68** |
| **Al 45%, exige cobrar** | **S/8.64** | **S/14.84** |

Ese piso **no cambia con la proteína**, pero la escalera de precios sí. Por eso la proteína
más barata parece la más rentable y la más cara se rompe: no es un problema de qué proteína,
es que la mitad del costo no está en la escalera que fija el precio.

---

## 2. Lo que cruza, y cuánto falta

Lectura conservadora (3 salsas + queso, vegetales fijos):

Peor caso con el empaque en el extremo alto del rango cotizado (S/1.50):

| combinación | insumo | precio hoy | necesita | falta |
|---|---|---|---|---|
| Res 30CM | **56.4%** | 22.90 | 28.71 | +5.81 |
| Pollo cajún 30CM | 52.9% | 21.90 | 25.75 | +3.85 |
| Pollo teriyaki 30CM | 52.8% | 21.90 | 25.71 | +3.81 |
| Atún 30CM ⁽ᵉ⁾ | 52.6% | 30.90 | 36.13 | +5.23 |
| Atún 15CM ⁽ᵉ⁾ | 52.5% | 16.90 | 19.73 | +2.83 |
| Embutido 15CM ⁽ᵉ⁾ | 49.4% | 16.90 | 18.55 | +1.65 |
| Embutido 30CM ⁽ᵉ⁾ | 49.2% | 30.90 | 33.80 | +2.90 |
| Res 15CM | 48.4% | 14.90 | 16.02 | +1.12 |
| Pollo cajún 15CM | 47.1% | 13.90 | 14.55 | +0.65 |
| Pollo teriyaki 15CM | 47.0% | 13.90 | 14.51 | +0.61 |

⁽ᵉ⁾ costo de la proteína **estimado sin cotizar** — ver §4. Con el empaque en S/1.10 salen
de la lista las dos últimas (pollo 15CM, las dos justo debajo del techo).

**La única proteína sana en los dos tamaños es la albóndiga** (36% y 37%).

El caso peor es **Res 30CM a 56.4%** con el empaque en S/1.50 (54.7% con S/1.10), no el 45.6%
que decía el análisis anterior.

**El 30CM es donde se rompe todo.** Si tu hipótesis de 80% en 15CM se cumple, el daño está
acotado — pero es exactamente el producto que la app etiqueta "Para compartir", o sea el de
ticket alto que querrías empujar.

---

## 3. Los Signatures están bien, y con holgura

| Signature | 15CM | 30CM |
|---|---|---|
| The Marinara | 19.9% | 26.3% |
| Menú secreto | 22.8% | 33.2% |
| The Teriyaki | 26.9% | 37.2% |
| The Original | 28.9% | 40.8% |
| The Smoke | 31.8% | 40.4% |
| The Fresh | 35.6% | 39.5% |

Ninguno pasa de 41%. **The Marinara al 19.9% es el producto más rentable del menú público** y
The Fresh al 35.6% el más ajustado — y aun así sobra.

---

## 4. Qué está medido y qué no

| dato | estado |
|---|---|
| Pan sub y focaccia | **MEDIDO** — proveedor real, y el rendimiento de la focaccia lo mediste tú |
| **Empaque S/1.10–1.50** | **COTIZADO** (dueño 2026-09-03) |
| **Toppings S/4/kg** | **COTIZADO** (dueño 2026-09-03) |
| Gramaje por topping | **PROPIO** — está en `RECETARIO.md`, no es una referencia externa |
| Res, pollo teriyaki, pollo cajún (con merma) | **INVESTIGADO** con fuentes citadas |
| Atún, embutido, albóndiga | **ESTIMADO SIN COTIZAR** |

**Cuatro de las diez combinaciones que cruzan se apoyan en un costo estimado** (atún y
embutido), y el atún es el más frágil de todos: S/67/kg investigado online, sin proveedor.
**Las otras seis se apoyan enteramente en datos cotizados o investigados con fuente.**

### El empaque: cotizado, pero el rango importa

| empaque | BYO que cruzan | Signatures que cruzan |
|---|---|---|
| S/1.10 (extremo bajo del rango cotizado) | **8/12** | 0/12 |
| S/1.50 (extremo alto) | **10/12** | 0/12 |

**Los 40 céntimos del rango valen dos combinaciones más.** Los Signatures aguantan los dos
extremos con holgura. Conviene cerrar en qué punto del rango queda antes de fijar precios,
pero ya no es un dato faltante.

*(El modelo cobra el empaque por sándwich y la fuente lo da por pedido: en un pedido de 2+
sándwiches el costo real es menor. El error va hacia lo conservador, a propósito.)*

---

## 5. Las recompensas salen de este mismo margen

Los puntos se ganan 1:1 por sol. La pregunta útil no es cuántos puntos cuesta cada
recompensa, sino **cuánto margen entrega** — el descuento sale entero del margen porque el
costo del insumo no baja.

| recompensa | puntos | cuesta de verdad | pts por sol de COSTO |
|---|---|---|---|
| R02 4ta salsa | 40 | S/0.53 | 75.2 |
| R06 15CM gratis | 400 | S/6.69 | 59.8 |
| R05 bebida gratis | 120 | S/2.64 | 45.5 |
| R03 subir a 30CM | 160 | S/5.59 | 28.6 |
| **R04 doble proteína** | **120** | **S/6.30** | **19.0** |

**R04 es cuatro veces más barata que R02 por cada sol que le cuesta al negocio.** Un cliente
que optimice va a canjear siempre R04, que es justo la que más cuesta servir.

Esto **corrige** la nota que quedó pendiente en `CLAUDE.md`: ahí la inversión se midió contra
el precio de carta. Medida contra el costo real —que es la plata que sale— la recompensa
descalibrada es R04, no R03.

---

## 6. Lo que hay que decidir, y es tuyo

1. **Si el techo de 45% sigue siendo el techo.** Es una decisión tuya, no una medición: el
   costo real calculado daba 26-36% y pusiste 45% para financiar mejor empaque. Todo lo de
   arriba cuelga de ese número.
2. **Qué hacer con el 30CM del BYO**, que es donde se rompe: subir precio, recortar lo que
   va gratis (¿la 3ra salsa sigue gratis en 30CM?), o aceptar el margen porque es el 20% de
   los pedidos.
3. **Si el queso sigue siendo gratis.** Cuesta S/0.39 y S/0.77, y hoy no lo paga nadie.
4. **Cotizar el atún** antes de fijar su precio: es el único insumo que cruza el techo y no
   tiene proveedor real detrás. El empaque y los toppings ya están cotizados.
5. **Si entra la lechuga** (ver §7): es el único hueco real contra el estándar de Subway, y
   cuesta centavos.

**Lo que NO haría todavía:** tocar los Signatures. Están holgados, ya subieron en agosto, y
el problema no está ahí.

---

*Reproducible: `python3 modelo/menu_v2_cotizado.py`*

---

## 7. Contra Subway: la carne está, la lechuga no

El dueño pidió comparar contra el estándar de Subway. Resultado:

- **La carne ya está al nivel.** 85 g en 15CM y 170 g en 30CM; el 6-inch de Subway declara
  24-26 g de proteína, que son ~80-90 g de carne cocida. No hay hueco.
- **En toppings estamos por encima en gramos totales** (94 g contra 85 g) pero con el reparto
  invertido: aceituna 4x, pimiento 2.6x y cebolla 1.7x lo de Subway — y **sin lechuga**, que
  es el mayor volumen de su estándar (21 g) y lo que más hace que un sándwich se vea lleno.
- **El tomate es el único donde estamos por debajo**: 25 g contra 35 g, y va en 5 de los 7
  Signatures.

**Igualar a Subway donde estamos cortos cuesta S/0.12 por 15CM** (lechuga 21 g + tomate 10 g
a S/4/kg). Sobre el peor caso mueve el insumo menos de un punto porcentual. Es de las pocas
decisiones de este documento donde lo que se gana en percepción no compite con el margen.

*Fuentes de las porciones de Subway: su información nutricional oficial y las bases que la
publican — ver `INGREDIENTES_DETALLE.md` §4.*
