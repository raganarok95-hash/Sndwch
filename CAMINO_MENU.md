# SND//WCH — Gramajes Subway y el camino del margen

**2026-09-04.** Sale de `modelo/menu_v3_subway.py`.

> ## ✅ DECISIONES TOMADAS POR EL DUEÑO (2026-09-04)
>
> - **Paso 1 aplicado**: gramajes al estándar de Subway y **lechuga (T09) agregada al
>   catálogo**. Ya está en código, en el recetario y con prueba.
> - **El queso sigue GRATIS.** No se cobra.
> - **Atún cotizado: S/4 la lata de 140 g al por mayor.** Su costo cae de S/4.82 a S/3.25 la
>   porción de 15CM, y **deja de cruzar el techo** (51.3% → 42.0%).
> - **Sobre las salsas — dato que corrige lo que este documento proponía:** *Subway no cobra
>   las salsas, son gratis e ilimitadas.* Nosotros ya incluimos 3 y cobramos la 4ta. **Cortar
>   la 3ra iría EN CONTRA de la paridad con Subway**, no a favor. Sigue siendo una decisión
>   posible, pero no se puede presentar como "igualar a Subway".
>
> **Estado con esas decisiones: 8 de 12 combinaciones siguen sobre el techo de 45%** (eran
> 10). Las 8 son de res, pollo y embutido; el atún y la albóndiga quedaron sanos.
> Ver §4-Paso 3: lo único que queda sobre la mesa es el precio del 30CM.

Todos los costos son cotizados salvo el embutido y la albóndiga, que siguen siendo estimados.

---

## 1. Igualar a Subway es GRATIS. Hazlo.

| topping | hoy | Subway 6" | cambio |
|---|---|---|---|
| **Lechuga** | no existe | **21 g** | **entra** |
| **Tomate** | 25 g | **35 g** | **+10 g** |
| Pepinillo | 15 g | 12 g | −3 g |
| Cebolla | 12 g | 7 g | −5 g |
| Pimiento | 18 g | 7 g | −11 g |
| Aceituna | 12 g | 3 g | −9 g |
| Apio | 12 g | 7 g* | −5 g |
| **Total** | **94 g** | **92 g** | **−2 g** |

*Subway no tiene apio; se lleva al nivel de sus vegetales menores.

**Cuesta menos dos céntimos. De hecho ahorra.** No es un cambio de costo, es una
**redistribución**: entra lechuga y sube el tomate —los dos más baratos por gramo, los de más
volumen y los que hacen que el sándwich se vea lleno— y bajan aceituna, pimiento y cebolla,
que hoy están entre 2x y 4x por encima de Subway y son los que vienen en frasco.

**La carne ya estaba al nivel:** 85 g en 15CM contra los ~80-90 g que implican los 24-26 g de
proteína que Subway declara en su 6-inch.

Esto no tiene contra. Es la única decisión de este documento que mejora el producto sin
costar nada.

---

## 2. Pero el margen no cierra, y no es por los toppings

Con gramajes Subway, peor caso que un cliente puede armar gratis (3 salsas + queso), empaque
en el punto medio del rango cotizado (S/1.30):

| | insumo | deja |
|---|---|---|
| Res 15CM | 47.0% ⚠ | S/7.90 |
| **Res 30CM** | **55.5%** ⚠ | S/10.20 |
| Pollo teriyaki 15CM | 45.5% ⚠ | S/7.58 |
| Pollo teriyaki 30CM | 51.8% ⚠ | S/10.55 |
| Pollo cajún 15CM | 45.6% ⚠ | S/7.56 |
| Pollo cajún 30CM | 51.9% ⚠ | S/10.53 |
| Atún 15CM | 51.3% ⚠ | S/8.23 |
| Atún 30CM | 51.9% ⚠ | S/14.86 |
| Embutido 15CM | 48.2% ⚠ | S/8.76 |
| Embutido 30CM | 48.5% ⚠ | S/15.91 |
| Albóndiga 15CM | 34.8% ✅ | S/9.71 |
| Albóndiga 30CM | 36.5% ✅ | S/15.82 |

**10 de 12 cruzan el techo de 45%.**

### De dónde sale el costo

| 15CM | | 30CM | |
|---|---|---|---|
| pan | 1.00 | pan | 2.00 |
| empaque | 1.30 | empaque | 1.30 |
| 3 salsas | 0.80 | 3 salsas | 1.60 |
| **toppings** | **0.37** | **toppings** | **0.74** |
| queso | 0.39 | queso | 0.77 |
| **piso fijo** | **S/3.85** | **piso fijo** | **S/6.40** |

**Los toppings son el 10% del piso. El pan y el empaque son el 60%.** Al techo del 45%, ese
piso exige cobrar **S/8.56 (15CM) y S/14.23 (30CM) antes de poner un gramo de proteína.**

Por eso subir a Subway no arregla nada y tampoco rompe nada: los toppings nunca fueron el
problema.

---

## 3. ⚠ Antes del camino: el 45% castiga justo al que más deja

El techo del 45% es un **porcentaje**. Lo que paga las cuentas son **soles**.

| | insumo | deja |
|---|---|---|
| Res 15CM | 47.0% | S/7.90 |
| Res 30CM | **55.5%** | **S/10.20** |

**El 30CM tiene peor porcentaje y deja S/2.30 más por pedido.**

`CLAUDE.md` ya documenta que el cuello de botella de este negocio es la **demanda**, no la
cocina (capacidad ~40 pedidos/día, y se cocina por tandas). Con la demanda como límite, lo que
importa es cuánto deja **cada pedido**, no qué porcentaje del precio se fue en insumo.

**El 45% sirve** para no vender por debajo del costo y para comparar productos entre sí.
**No sirve** para decidir si el 30CM debe existir: por esa regla habría que empujar al cliente
al 15CM, que deja S/2.30 menos.

Esto va antes del camino porque cambia qué estamos arreglando: **no hay que llevar todo al
45%. Hay que dejar de regalar lo que nadie paga.**

---

## 4. El camino

### Paso 1 — Gramajes Subway (§1). Gratis, sin contra.

### Paso 2 — Cortar lo que hoy es gratis y nadie paga

Hoy el ARMA EL TUYO incluye sin cobrar: **3 salsas, el queso, y los toppings sin límite**.

| cambio | ahorro 15CM | ahorro 30CM |
|---|---|---|
| 2 salsas incluidas en vez de 3 (la 3ra a S/2, como ya se cobra la 4ta) | S/0.27 | S/0.53 |
| Queso a S/1, en vez de gratis | S/0.39 | S/0.77 |

| | insumo | |
|---|---|---|
| Res 15CM | 47.0% → **42.6%** | ✅ |
| Res 30CM | 55.5% → 49.8% | ⚠ |
| Pollo teriyaki 15CM | 45.5% → **40.8%** | ✅ |
| Pollo teriyaki 30CM | 51.8% → 45.9% | ⚠ |
| Atún 15CM | 51.3% → 47.5% | ⚠ |
| Embutido 15CM | 48.2% → **44.3%** | ✅ |
| Embutido 30CM | 48.5% → **44.3%** | ✅ |

**Pasa de 10 a 5 combinaciones fuera del techo.** Y el cliente no recibe menos comida: recibe
lo mismo, pagando lo que hoy se le regala. **El queso a S/1 cuesta S/0.39** — sigue siendo un
buen negocio para los dos.

### Paso 3 — +S/1 o +S/2 solo en el 30CM

El 15CM ya queda sano con el paso 2. El 30CM no, porque el pan y la proteína se duplican y el
precio solo sube S/8.

| | cruzan | contribución media |
|---|---|---|
| Hoy | 10/12 | S/9.44 |
| Paso 2 solo | 5/12 | S/10.52 |
| Paso 2 + **S/1** en 30CM | 3/12 | S/10.72 |
| Paso 2 + **S/2** en 30CM | 2/12 | S/10.92 |

*(Contribución media por sándwich a la mezcla del plan: 80% en 15CM.)*

**A 1,411 pedidos/mes (el mes 6 del plan):**

| | S//mes |
|---|---|
| Paso 2 solo | **+S/1,526** |
| Paso 2 + S/1 en 30CM | **+S/1,808** |
| Paso 2 + S/2 en 30CM | **+S/2,090** |

Para comparar: la meta es S/5,000 netos. **El paso 2 solo ya es el 30% de la meta, sin
adquirir un cliente más y sin que el cliente reciba menos comida.**

### Paso 4 — Cotizar el atún

**El atún es el único que no se arregla con precio.** Queda en 47.5% incluso después del
paso 2, y su costo (**S/67/kg**) es el único número grande del modelo que **no tiene proveedor
real detrás** — está investigado online, no cotizado.

El recetario ya dice dónde está el ahorro: **cotizar lata institucional de 1 kg+ en Makro**
antes de comprar latas de 170 g. Si el precio real baja un 20%, el atún deja de ser un
problema sin tocar su precio de carta.

**No subas el precio del atún antes de cotizarlo.** Sería subir un precio para tapar un número
que quizá no existe.

---

## 5. Lo que NO recomiendo

- **Subir todo al 45%.** Serían +S/1.98 de promedio y **+S/5.33 en res 30CM** — un aumento del
  23% en el producto de ticket alto, en un negocio que todavía no abre y no tiene ni un
  cliente. El techo no vale eso.
- **Bajar la proteína.** Estás al nivel de Subway. Bajar de ahí es competir por abajo con el
  referente, que es exactamente lo que no puede hacer una marca nueva.
- **Tocar los Signatures.** Los 12 están sanos (19.6% a 41.9%), ya subieron en agosto, y el
  problema no está ahí.

---

## 6. Lo que decides tú

1. **¿Se cobra el queso?** S/1 sobre un costo de S/0.39.
2. **¿La 3ra salsa deja de ser gratis?** Ya se cobra la 4ta a S/2.
3. **¿+S/1 o +S/2 en el 30CM del BYO?**
4. **¿Se cotiza el atún antes de tocar su precio?**

Lo único que haría sin preguntar, porque no tiene contra, es **el paso 1**: lechuga adentro y
tomate a 35 g.

⚠ **Y el recordatorio de siempre:** cuando decidas, cambiar el precio en el código NO cambia
el precio real. La fuente de verdad en runtime es `catalog_prices`; un cambio de precio no
está terminado hasta que esa tabla lo refleje. Ya costó tres semanas de precios fantasma.

---

*Reproducible: `python3 modelo/menu_v3_subway.py`*
