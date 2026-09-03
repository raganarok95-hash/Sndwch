# SND//WCH — El menú desde la raíz

**2026-09-03.** Reconstruido con `modelo/menu_desde_la_raiz.py`, que **no parte de ningún
margen ya calculado**: suma componente por componente (gramaje × precio/kg, con merma de
cocción) y recién al final compara contra el precio de carta. Los precios están verificados
contra `catalog_prices`, `catalog_items` y `secret_signature` en la base — coinciden.

---

## 0. El hallazgo, en una línea

**El precio del ARMA EL TUYO se fijó contra una configuración de muestra, no contra lo que
el cliente puede pedir de verdad.** Son gratis e ilimitados: los toppings (7, todos a la
vez), el queso, y hasta 3 salsas. Nadie costeó el sándwich que un cliente racional arma.

| | cruzan el techo de 45% |
|---|---|
| Lectura del análisis anterior (2 salsas, sin queso) | **1** de 12 |
| Contando la 3ra salsa y el queso, que son gratis | **7** de 12 |
| Contando además los 7 toppings | **10** de 12 |

La fila del medio es la que importa: **no depende de ningún supuesto discutible.** La 3ra
salsa y el queso son gratis, están en el builder, y su costo está medido.

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

| combinación | insumo | precio hoy | necesita | falta |
|---|---|---|---|---|
| Res 30CM | **53.7%** | 22.90 | 27.30 | +4.40 |
| Atún 30CM ⁽ᵉ⁾ | 50.6% | 30.90 | 34.72 | +3.82 |
| Pollo cajún 30CM | 50.0% | 21.90 | 24.35 | +2.45 |
| Pollo teriyaki 30CM | 49.9% | 21.90 | 24.30 | +2.40 |
| Atún 15CM ⁽ᵉ⁾ | 49.5% | 16.90 | 18.58 | +1.68 |
| Embutido 30CM ⁽ᵉ⁾ | 47.2% | 30.90 | 32.39 | +1.49 |
| Embutido 15CM ⁽ᵉ⁾ | 46.3% | 16.90 | 17.41 | +0.51 |

⁽ᵉ⁾ costo **estimado sin cotizar** — ver §4.

El caso peor es **Res 30CM a 53.7%**, no el 45.6% que decía el análisis. La diferencia entera
es la 3ra salsa y el queso.

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
| Res, pollo teriyaki, pollo cajún (con merma) | **INVESTIGADO** con fuentes citadas |
| Atún, embutido, albóndiga | **ESTIMADO SIN COTIZAR** |
| Empaque S/1.10 | **SIN COTIZAR**, y describe empaque genérico, no el brandeado premium |
| Gramaje de vegetales (65 g) | marcado "dato débil" en el propio análisis |

**Tres de las siete combinaciones que cruzan se apoyan en un costo estimado**, y el atún es
el más frágil de todos (S/67/kg investigado online, sin proveedor).

### El empaque es el número que estás por convertir en un hecho

| empaque | BYO que cruzan | Signatures que cruzan |
|---|---|---|
| **S/1.10** (el supuesto de hoy) | 7/12 | 0/12 |
| S/1.50 | 10/12 | 0/12 |
| S/2.00 | 10/12 | 0/12 |
| S/2.50 | 10/12 | 1/12 |
| S/3.00 | 11/12 | 2/12 |

**Cuarenta céntimos de más en el empaque llevan el BYO de 7 a 10 combinaciones rotas.** Los
Signatures aguantan hasta S/2.50. Cuando cotices el empaque brandeado, ese número entra acá
antes de decidir cualquier precio.

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
4. **Cotizar el atún y el empaque** antes de fijar precios: son los dos números que más
   mueven la tabla y ninguno tiene proveedor real detrás.

**Lo que NO haría todavía:** tocar los Signatures. Están holgados, ya subieron en agosto, y
el problema no está ahí.

---

*Reproducible: `python3 modelo/menu_desde_la_raiz.py`*
