# OPERATIVO // que nunca dejemos de producir

**Frente OPERACIÓN · creado el 2026-11-03 · abre el viernes 20 de noviembre de 2026.**

Dueño (2026-11-02): «Haz otro hilo "operativo" encargado de recopilar todo lo necesario
constantemente para la producción, se encarga que sigamos produciendo».

Este archivo es la **hoja viva** del hilo Operativo: qué se compra por tanda, cuánto tiene que
haber siempre, quién vende cada cosa, qué equipo falta y la lista para la apertura. Se actualiza
cada vez que el dueño compre, cotice o corrija algo.

**De dónde sale cada número (no se rehacen acá):**
- Recetas, gramajes y tandas: `recetas/COCINA_CARTA_V4.md` (versión 5, hilo «Revisar y ajustar
  las recetas») y las recetas cargadas en el panel (`production_recipes`).
- Precios por unidad: `modelo/insumos.py` (cada uno dice si está COTIZADO, ESTIMADO o SIN_COTIZAR).
- Cuánto se vende la primera semana: es **supuesto** (`docs/equipo/APERTURA_OPERACION.md`,
  ~2 pedidos al día, 1.3 sándwiches por pedido, 80% en 15CM). Se corrige con las ventas reales.
- Los totales en soles de cada compra van solo al dueño (el repo es público).

---

## 1 · Calendario hasta abrir

| día | qué |
|---|---|
| hasta el **vie 13-nov** | confirmar proveedores y cuánto tarda cada uno en entregar (sección 4); cotizar lo que falta |
| **lun 16-nov** | compra de todo lo que no vence: latas de atún y tomate, quesos, mayonesa, aceites, vinagres, especias, té, jamaica, empaque |
| **mié 18-nov** | compra de lo fresco: res, carne molida, pavo, embutido, pan, verdura, hierbas de las bebidas |
| **jue 19-nov** (día de cocina) | laminar y porcionar la res (~2 h), albóndigas y marinara (~2 h), cebolla salteada, salsas en tandas de 250 g, bebidas (una tanda de cada una), congelar el pan cortado |
| **vie 20-nov** (abre) | cargar el inventario en el panel («Abro con N» y las tandas con fecha), prender «Ya abrimos →» |
| **lun 23-nov** (cerrado) | contar lo que quedó |
| **mar 24-nov** | primera reposición con lo vendido real (correo diario) |

---

## 2 · Lo que se compra por tanda

Cada tanda, con lo que hay que tener a mano para hacerla. La tanda **de apertura** es la chica
(la primera semana se vende poco y lo cocinado vence).

| tanda | rinde | se compra | cada cuánto (supuesto) |
|---|---|---|---|
| **RES // LAMINADA** (apertura) | 8 porciones 15CM | 1 kg de aguja de res | cuando queden 3 porciones congeladas |
| **RES // LAMINADA** (grande) | 40 porciones | 5 kg de aguja | cuando se vendan ~5 al día |
| **CEBOLLA // SALTEADA** (apertura) | 10 porciones | 700 g de cebolla blanca | cada 3 días (dura 3) |
| **ALBÓNDIGA // MARINARA** (media) | 15 porciones | 1 kg carne molida 15-20% grasa · 100 g pan del día · 110 ml leche · 1 huevo · 50 g parmesano · 10 g ajo · 12 g perejil · sal, pimienta, orégano · **marinara 1.5 L:** 1.25 kg tomate pelado en lata (~3 latas de 400 g), 50 ml aceite de oliva, 20 g ajo, 100 g cebolla, 10 g sal, orégano y albahaca | cuando queden 4 porciones congeladas |
| **ATÚN // HOUSE** | 2 porciones 15CM por lata | 1 lata de 140 g escurrido + 35 g de mayonesa + pimienta blanca | **todos los días que se venda**: solo las latas del día (dura 3 días, no se congela) |
| **PAVO // HORNEADO** (se compra en pieza y se taja a diario: dueño, 2026-11-11) | ~11 porciones por kilo | jamón de pavo en pieza, sin tajar: 500 g para abrir | se taja solo lo del día; comprar cuando quede 1/3 de la pieza |
| **EMBUTIDO // ITALIANO** (dueño, 2026-11-03) | por 15CM: 35 g jamón ahumado + 25 g salame + 25 g pepperoni (30CM, el doble) | para abrir, paquete chico o mostrador: jamón ahumado 250 g, salame 150 g, pepperoni 150 g (~6 porciones); el paquete de 500 g recién cuando se venda más | cuando quede 1/3 del jamón; abierto, cerrar bien y usar primero lo más viejo |
| **OIL & VINEGAR** (250 ml) | ~17 porciones | 125 ml aceite de oliva · 50 ml aceite vegetal · 63 ml vinagre de vino tinto · 5 g orégano · 3 g ajo en polvo · 3 g sal · 1 g pimienta | cada 2 semanas (dura 1 mes) |
| **HONEY MUSTARD** (250 g) | ~17 porciones | 95 g mostaza amarilla · 75 g miel · 63 g mayonesa · 13 ml vinagre de manzana · 1 g sal | cada 2 semanas |
| **CHIMICHURRI PIÑA Y AJÍ** (250 g) | ~17 porciones | 75 g piña · 25 g perejil · 9 g ajo · 6 g ají limo · 4 g ají panca · 25 ml vinagre de vino tinto · 63 ml aceite · 2 g orégano · 4 g sal | cada semana (dura 7 días) |
| **SPICY MAYO** y **PICANTE MIEL** (menú secreto) | ~17 porciones | mayonesa, ají limo o rocoto, miel, vinagres, hojuelas de ají (receta en el panel) | cuando se acaben |
| **BEBIDAS** (1 L de cada una) | 2 botellas de 500 ml | **THE BLOOM:** 16 g flor de jamaica, 3 g canela, 5 g cáscara de naranja · **COLD BREW // TEA:** 26 g té negro a granel · **THE COOL:** 13 g hierba luisa, 10 g menta, 25 ml limón · todas: agua de bidón, solución de sucralosa pura al 2% y de sal al 10% | Bloom y Cool duran 7 días; Cold Brew, 5 |
| **Vegetales del día** (por cada 10 sándwiches con verdura) | — | tomate 350 g · lechuga 210 g · cebolla morada 70 g · pimiento verde 70 g (y 70 g más de pimiento por cada 10 PHILLY) | 2 veces por semana |
| **Pan sub** | 2 porciones 15CM por pan | 12 panes para abrir, cortados y congelados | según el proveedor (sección 4) |
| **Quesos** | cheddar: 8 tajadas por paquete · americano: 10 | 2 paquetes de cheddar y 1 de americano para abrir | cuando quede 1 paquete |
| **Empaque** | por pedido | bolsa kraft lisa, papel manteca, sticker de cierre, servilletas | cuando queden 30 de cada uno |

---

## 3 · Stock mínimo y avisos

**La app ya avisa** de dos cosas, si se carga el inventario el día de apertura:
- **Poco stock:** cuando un producto baja de su umbral (si no se pone, usa 5 porciones).
- **Vence:** con la fecha de la tanda + los días que dura (si no se pone, 3 días para todo).
  Solo funciona si se carga **como tanda** (con fecha), no solo con «Abro con N».

**Lo que la app NO sabe**: los pedidos de Rappi y PedidosYa no le descuentan stock (hay que
bajarlo a mano), y no lleva cuenta de los insumos crudos (latas, pan, quesos, empaque). Para eso
es el mínimo de abajo.

### Porciones listas (se cargan en el panel)

| producto | abrir con (supuesto) | umbral de aviso | dura |
|---|---|---|---|
| RES // LAMINADA (descongelada en el refri) | 4 | 2 | 3 días en el refri; 1 mes congelada |
| ALBÓNDIGA // MARINARA | 2 | 1 | 3 días en el refri; 1 mes congelada |
| ATÚN // HOUSE | 2 (1 lata) | 1 | 3 días, no se congela |
| PAVO // HORNEADO | 2 | 1 | 3 días laminado |
| EMBUTIDO // ITALIANO | 2 | 1 | 3 días laminado |

Regla de cada noche (de `docs/equipo/APERTURA_OPERACION.md`): contar lo que sobró, abrir mañana
con lo vendido +1 en el PHILLY y mínimo 2 por proteína; si algo se agotó antes de las 19:00 dos
días seguidos, +1; si sobraron 2 o más dos días seguidos, −1.

### Mínimo en la casa (insumos crudos)

**Punto de compra = lo que se gasta en los días que tarda el proveedor + 2 días de margen.**
Mientras no se sepa cuánto tarda cada proveedor, se usa este mínimo:

| insumo | mínimo en la casa | si baja de ahí |
|---|---|---|
| porciones de res congeladas | 4 | laminar la tanda siguiente |
| porciones de albóndiga congeladas | 4 | hacer media tanda |
| latas de atún | 4 | comprar 6 |
| pan sub congelado | 4 panes | pedir al panadero |
| cheddar / americano | 1 paquete de cada uno | comprar 2 |
| mayonesa | 1/2 kg | comprar 1 kg |
| botellas llenas, de cada bebida | 2 | hacer la tanda |
| botellas vacías | 40 | avisar: comprar más (hay 200) |
| bolsas, papel manteca, stickers | 30 de cada uno | comprar el siguiente lote |
| gas | 1 balón de repuesto | pedir otro balón |

---

## 4 · Proveedores y precios

Hoy **no hay ninguna compra registrada** en el panel (Compras está vacío). Cada compra que se
anote ahí calcula el costo real de cada receta y **avisa si un precio subió fuerte**. Por eso la
regla: **toda compra se anota en el panel el mismo día**, con proveedor, cantidad y lo pagado.

| insumo | precio que usa el costeo | estado | proveedor | ¿cuánto tarda? |
|---|---|---|---|---|
| aguja de res | S/25 el kilo | cotizado por el dueño (30-sep) | **falta** | **falta** |
| carne molida 15-20% | S/15 el kilo | cotizado por el dueño (30-sep) | **falta** | **falta** |
| atún en lata 140 g | S/4 la lata | cotizado (4-sep) | **falta** | se compra al día |
| jamón de pavo en pieza | S/44.20 el kilo (referencia, sin confirmar) | **falta cotizar en el mostrador** (Makro, Metro, Tottus) o con distribuidor | — | — |
| jamón ahumado, salame y pepperoni tajados | ~S/32.38 el kilo (ponderado) | precio online de Makro: confirmar en Trujillo | Makro | se compra al día |
| pan sub | S/2 la unidad | cotizado (22-ago) | panadero del dueño | **falta** |
| queso cheddar tajado | S/7.20 el paquete de 136 g | precio online de Tottus | — | se compra al día |
| queso americano tajado | S/10.95 el paquete de 170 g | precio online de Tottus | — | se compra al día |
| parmesano | S/32.90 los 454 g | precio online de Tottus | — | se compra al día |
| tomate pelado en lata Mutti 400 g | S/4.99 la lata | elegido por el dueño (2026-11-05), Makro web | Makro | se compra al día |
| mayonesa | ~S/15 el kilo | estimado | — | — |
| lechuga, tomate, cebolla, pimiento | S/3 a S/4.50 el kilo | estimado | mercado | se compra al día |
| bolsa kraft lisa #20 | S/0.26 | estimado (offi.pe) | **¿llegó?** | — |
| papel manteca | S/0.075 por sándwich | cotizado | — | — |
| sticker de cierre | ~S/0.10 | sin cotizar | — | — |
| botella de 500 ml | S/0.69 | comprada (hay 200) | — | — |
| té, jamaica, hierbas, sucralosa pura | — | **sin cotizar** | — | — |

---

## 5 · Equipos

| equipo | para qué | estado |
|---|---|---|
| sartén grande | PHILLY y cebolla | **por confirmar** |
| horno | albóndigas (200 °C) | **por confirmar** |
| congeladora | res y albóndigas en porciones, pan | **por confirmar** (sin congelar no funcionan las tandas) |
| refrigeradora con termómetro | todo lo listo, a 4 °C o menos | **por confirmar** el termómetro |
| balanza de cocina (1 g) | porciones | **por confirmar** |
| balanza de 0.01 g | sucralosa y sal de las bebidas | **por confirmar** |
| pHmetro y refractómetro | control de las bebidas | **por confirmar** (~S/250–400 junto con lo de arriba y el Star San) |
| botellas dosificadoras | salsas | **por confirmar** |
| bolsitas de congelar y etiquetas | porciones con código y fecha | **por confirmar** |
| **selladora de latas** | latas de 355 ml | **no se compra todavía**: hasta entonces, botella de 500 ml |
| etiquetadora de 2 líneas | fecha y lote de las latas | va con las latas |

---

## 6 · Lo que hace este hilo, siempre

- **Cada vez que compres**: anótalo en Compras del panel. Si me pasas el ticket o los precios, lo
  paso yo a esta hoja y te aviso si algo subió.
- **Antes de cada semana**: la lista de compras con lo vendido real y lo que queda.
- **Cada noche, al cerrar (cuando haya ventas)**: qué reponer mañana y qué vence. Desde la apertura,
  el correo diario trae los pedidos reales y el costo de insumos por producto (`_shared/finanzas.ts`):
  con eso se ajusta la reposición, no con el supuesto. Si las compras se anotan en el panel, el
  correo semanal compara lo comprado contra lo que se debió consumir (la diferencia es merma).
- **Nunca compro ni gasto nada sin tu sí, ni creo tareas programadas sin tu sí.** Lo que es plata
  va con Finanzas.
