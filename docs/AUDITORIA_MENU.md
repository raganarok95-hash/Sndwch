# Auditoría del menú — qué sobra y qué falta

Fecha: 2026-09-12. Los números de costo salen de `modelo/rentabilidad_por_parte.py`, que lee
precios y recetas de `catalog_prices`/`catalog_items` (la base), no de los literales del
código. El techo acordado con el dueño es **45% de costo de insumos+empaque**.

El cruce de ingredientes contra recetas se hizo con un script sobre
`src/app/01-catalogo-y-estado.ts`, no leyendo a ojo.

---

## 1 · Lo que SOBRA

### 1.1 ⚠ El apio (T08) no lo puede pedir NADIE — y se sigue comprando

`T08` está marcado `sigOnly:true`, o sea fuera de ARMA EL TUYO. El comentario que justifica
esa marca, escrito el 2026-09-04, dice:

> *Apio fuera de ARMA EL TUYO el 2026-09-04 (decisión del dueño). NO se borra: THE FRESH lo
> lleva y es su único elemento crocante.*

**THE FRESH ya no lo lleva.** Su receta pasó a atún escurrido + mayonesa + pimienta, con
`tops:[]`. Al cerrarse esa receta, el apio se quedó sin su único hogar: no está en ningún
Signature y está bloqueado del armador. Es un ingrediente que hay que comprar, lavar, picar
al momento y desechar cuando caduca, **para cero pedidos posibles**.

El cruce completo, ingrediente por ingrediente:

| ingrediente | restricción | ¿algún Signature lo usa? |
|---|---|---|
| P01 Res, P05 Embutido | `sigOnly` | sí (SIG01/SIG08 · SIG03) |
| P03 Pollo cajún | `vaultOnly` | sí (SIG05) |
| T02 Pepinillo | `sigOnly` | sí (SIG01, SIG03) |
| T04 Jalapeño | `vaultOnly` | sí (SIG05) |
| **T08 Apio** | `sigOnly` | **NO — nadie puede pedirlo** |

**Qué hacer**: son dos opciones y ninguna es "dejarlo así". Devolverlo a ARMA EL TUYO
(quitar `sigOnly`) o retirarlo del catálogo como se retiró T07 giardiniera, dejando el
comentario de cómo volver. Lo que no puede quedar es un insumo en la lista de compras sin
una sola vía de venta.

> Esto es exactamente el defecto que el propio `CLAUDE.md` describe en otro contexto: *el
> modo de fallo es silencio*. Nadie ve un error; simplemente se compra apio que nadie pide.

### 1.2 Seis ítems viven SOLO en ARMA EL TUYO

No es un defecto —el armador es la mitad de la identidad de la marca— pero conviene saber
cuáles no tienen ninguna receta que los enseñe:

`P08 Pavo` · `T09 Lechuga` · `S08 Teriyaki Glaze` · `S09 Chimichurri` · `S11 Dijon` · `C03 Edam`

Dos merecen comentario:

- **S09 Chimichurri de piña y ají** quedó huérfano al retirarse THE EMBER (SIG08). Sigue
  disponible públicamente y es **la única salsa picante que un cliente sin menú secreto
  puede pedir** (S02 y S12 son `vaultOnly`). O sea que la nota vieja de "BYO no tiene
  ninguna opción picante" ya no es cierta — pero depende de una salsa que ningún producto
  del menú presenta. Si alguien la retira "porque no la usa ningún Signature", el armador se
  queda sin picante y nada avisa.
- **S08 Teriyaki Glaze existe, y THE TERIYAKI no lo usa.** SIG06 lleva S10 satay + S05
  special; el glaseado va dentro de la proteína P02. No está mal, pero es una tensión de
  naming real: el producto que se llama Teriyaki no lleva la salsa que se llama Teriyaki.

### 1.3 Lo que NO sobra, aunque lo parezca

- **Los 3 quesos**: son gratis y cuestan S/0.39–0.77. Edam no aparece en ninguna receta, pero
  su razón de ser es dar una tercera opción al que arma. No es sobrante, es surtido.
- **Las 3 bebidas**: 19.5%, 28.2% y 31.5% de costo. Todas sanas. El chai salió bien.

---

## 2 · Lo que FALTA

### 2.1 No hay una sola opción vegetariana. Ni una.

Las 7 proteínas son carne o pescado. Y la proteína es **obligatoria** en ARMA EL TUYO
(`byoStep===1` → "Elige una proteína"), así que no se puede armar un sándwich sin ella.

Consecuencia concreta y medible: **un pedido grupal con un vegetariano no se puede completar
en la app.** El pedido grupal es el canal con más sándwiches por pedido —la palanca que sube
la contribución sin adquirir a nadie— y basta una persona en una oficina de seis para que el
grupo entero busque otra opción.

No propongo una receta: **qué proteína vegetariana entra es decisión de producto del dueño.**
Lo que sí digo es que el hueco es estructural y no de surtido.

### 2.2 Faltan 3 vegetales del estándar de Subway, y 2 más están bloqueados

El repo ya adoptó los gramajes de Subway el 2026-09-04 y agregó lechuga por eso mismo. El
set estándar de Subway y lo que tenemos:

| vegetal de Subway | nosotros |
|---|---|
| Lechuga | ✅ T09 |
| Tomate | ✅ T01 |
| Cebolla | ✅ T03 |
| Aceituna | ✅ T05 |
| Pimiento | ⚠ T06, pero **curado en aceite**, no el verde fresco |
| Pepinillo | ❌ bloqueado (`sigOnly` desde 2026-09-05) |
| Jalapeño | ❌ bloqueado (`vaultOnly`) |
| Pepino | ❌ no existe |
| Espinaca | ❌ no existe |

**El pepinillo es el caso que más pesa.** Es de los toppings más pedidos en Subway, cuesta
casi nada, y se sacó del armador el 2026-09-05 para meter lechuga. No eran excluyentes: se
puede tener los dos. Devolverlo cuesta quitar una palabra.

⚠ Y hay un detalle de paridad que este archivo ya advierte y conviene repetir: **Subway no
cobra las salsas.** Nosotros incluimos 3 y cobramos la 4ta a S/2. Cualquier propuesta de
"igualar a Subway" que recorte toppings va en la dirección contraria.

### 2.3 Solo 2 panes, y el segundo cobra recargo

`B01 Classic White` y `B03 Focaccia` (+S/0.50 / +S/1.00). Subway Perú tiene 4–5. No es
urgente —la focaccia ya cubre el "pan especial"— pero es el surtido más corto del catálogo y
el que más barato sale ampliar, porque el pan se compra hecho.

---

## 3 · Dónde está el margen justo (lo que hay que vigilar, no cambiar hoy)

Nada del catálogo **pedible** pasa el techo de 45%. Lo más ajustado:

| combinación | costo % |
|---|---|
| Pavo 15CM y 30CM | 44.7% · 44.7% |
| Pavo doble 30CM | 44.2% |
| Pollo teriyaki 30CM | 43.3% |
| The Original 30CM | 41.2% |
| The Smoke 30CM | 40.8% |

El pavo entró rozando el techo a propósito y con el precio **derivado a medias**: S/44.20/kg
sale del retail de Braedt, no de cotización propia al por mayor. Si el mayorista sube, el
pavo es lo primero que se pasa. Es el número a confirmar antes de abrir.

Las combinaciones que sí pasan el techo (res 30CM 47.0%, embutido 15CM 45.2%, pollo cajún
doble 30CM 45.2%) están todas **fuera del armador** — solo existen dentro de Signatures cuyo
precio de carta sí cumple. Eso está bien y es intencional.

---

## 4 · El programa de puntos sigue invertido

Lo que cada recompensa devuelve por punto, en puntos por sol de costo real:

| recompensa | puntos | nos cuesta | pts/sol |
|---|---|---|---|
| bebida gratis | 160 | S/1.89 | **84.7** |
| 4ta salsa gratis | 20 | S/0.27 | 75.2 |
| sándwich 15CM gratis | 400 | S/5.83 | 68.7 |
| sube a 30CM gratis | 320 | S/5.21 | 61.5 |
| doble proteína gratis | 160 | S/3.15 | **50.8** |

Dispersión **1.67x** entre la más barata y la más cara para el negocio. Mejoró mucho —venía
de 4.3x— pero un cliente que mira los números sigue canjeando siempre "doble proteína" y
nunca "bebida". No es urgente; es lo que hay que releer con canjes reales.

⚠ `R06` (400 pts) **no se puede mover**: `REFERRER_REWARD_POINTS` tiene que valer lo mismo y
`npm run parity` lo verifica.

---

## 5 · Resumen: qué decidir

| # | qué | quién decide |
|---|---|---|
| 1 | **Apio (T08): devolverlo al armador o retirarlo.** Hoy no lo puede pedir nadie. | dueño |
| 2 | **Pepinillo (T02): devolverlo al armador.** Se sacó para meter lechuga, no eran excluyentes. | dueño |
| 3 | **Una proteína vegetariana.** Sin ella, un pedido grupal con un vegetariano no se puede completar. | dueño |
| 4 | Cotizar el pavo al por mayor. Entró a 44.7% con precio de retail. | dueño |
| 5 | Pepino y/o espinaca para cerrar el set de Subway. | dueño |
| 6 | Releer los puntos con canjes reales (hoy 1.67x de dispersión). | después de abrir |

Ninguno de los seis se toca sin que el dueño lo diga: cambiar el catálogo cambia el menú
real, no solo el código.
