# SND//WCH — Dónde mejorar: retención, captación, marketing y rentabilidad

**Fecha:** 2026-09-02 · Sale de `modelo/modelo_v10.py`, ya re-corrido con la apertura de octubre.
**Apertura:** a más tardar la 2ª semana de octubre de 2026 → **mes 3 = dic-26 · mes 6 = mar-27**.

---

## 0. Todo cuelga de un solo número

| | |
|---|---|
| Lo que deja un cliente en su **primer** pedido | **S/15.92** |
| Traerlo por Meta con el mejor CPM | S/10.51 ✓ **gana** |
| Traerlo con el CPM medio | S/17.87 ✗ **pierde** |
| Traerlo con el peor CPM | S/25.23 ✗ **pierde mucho** |
| Traerlo por **referido** | **S/7.65** ✓ **el único que gana siempre** |

El rango documentado **cruza el umbral por el medio**. Si el CAC real cae debajo de S/15.92,
comprar clientes deja ganancia desde el primer pedido y el negocio escala pagando publicidad.
Si cae encima, cada cliente comprado es una pérdida que solo se recupera si vuelve — y en los
primeros meses casi nadie ha vuelto todavía.

**Nada de lo que sigue importa tanto como medir ese número la primera semana.**

Las cuatro áreas que pediste, ordenadas por lo que mueven de verdad:

---

## 1. Rentabilidad del producto — la palanca que mueve el umbral

Subir lo que deja el primer pedido **mueve la línea de S/15.92 hacia arriba** y mete más
escenarios de CAC del lado rentable. Es la única palanca que cambia las reglas en vez de
jugar mejor dentro de ellas.

**Lo que ya está medido y no se está usando:**

- **El 45% de costo de insumos es una DECISIÓN conservadora, no una medición.** El cálculo
  real con precios de Perú dio **26-36%**. Cada punto real por debajo del 45% es contribución
  que ningún modelo está contando. Se resuelve cargando compras reales en
  **Admin // Compras y costos** (ya construido: `ingredient_purchases` + `recipeCost`).
- **La bebida deja 56-66% de margen, mejor que el sándwich**, y solo el 25% de los pedidos
  lleva una. Subir ese 25% vale más por pedido que subir el precio del sándwich.
- **`attach.avgUnits`, `drinkPct`, `size30Pct`, `doubleProt` y `extraSauce` ya se calculan**
  en `retention_report`. Hoy nadie los mira porque no hay ventas. **Desde el día 1 son la
  brújula de rentabilidad.**

**Lo que falta construir:** nada grande. Falta **medir** antes de tocar precios.

⚠ Y una trampa ya documentada: **cambiar un precio en el código no cambia el precio real.**
La fuente de verdad en runtime es `catalog_prices`. Ya costó tres semanas de precios fantasma.

---

## 2. Retención — el motor, no un adorno

Del piso al tope del rango de industria, los pedidos por cliente pasan de **2.34 a 3.37**,
sin gastar un sol más en publicidad. A 12 meses eso es la diferencia entre S/2,139 y S/35,981
de neto mensual.

**Lo que ya está construido y funcionando:** puntos 1:1, rangos, menú secreto a los 3 pedidos,
escalera de referidos, y nueve recordatorios automáticos (carrito abandonado, pago abandonado,
segundo pedido, crédito sin usar, post-cancelación, aniversario, cumpleaños, reto mensual,
hora pico).

**Dónde está el hueco real:** el modelo dice que **el segundo pedido es donde se gana o se
pierde el negocio** — 77% de los clientes de un restaurante no vuelven nunca. Lo que existe
para eso es un recordatorio genérico. Lo que falta:

1. **Que el bounce-back use la mediana real de días al segundo pedido.** `retention_report` ya
   devuelve `daysToSecond.median`; el recordatorio hoy usa una ventana fija. Mandarlo cuando
   la gente de verdad vuelve vale más que mandarlo más veces.
2. **Que el primer pedido termine con una razón concreta para el segundo**, no con un "gracias".
   El menú secreto a los 3 pedidos es buena mecánica pero está lejos; entre el pedido 1 y el 2
   no hay ningún gancho.
3. **Medir la retención propia y dejar de usar el benchmark.** El reporte de cohortes ya se
   manda solo cada mes (#94) con la salvaguarda de fiabilidad. A los 30 clientes empieza a
   decir la verdad.

---

## 3. Captación — el referido le gana al presupuesto

El hallazgo más accionable de todo el modelo:

| | P(sostener el camino) |
|---|---|
| **S/4,000/mes de ads + viralidad alta** | **59%** |
| S/8,000/mes de ads + viralidad baja | 45% |

**El doble de presupuesto pierde contra el boca a boca.** Un referido cuesta S/7.65 y un
cliente comprado S/10.51 en el mejor caso.

**Lo que ya está construido:** escalera de referidos (400 pts por cada uno + premios al 3º, 5º
y 10º), tarjeta de regalo, crédito regalable, pedido grupal con el 15CM del organizador gratis
a partir de 5 sándwiches, y el QR `?grupo=1` para la tarjeta de la bolsa.

**Dónde está el hueco:** el referido existe pero **el cliente no lo ve en el momento en que
importa**. Hoy vive dentro de "Mi Perfil". Los tres momentos donde sí convierte:

1. **Justo después de una entrega buena** — cuando califica con 4-5 estrellas. Es el único
   instante en que está contento y con el teléfono en la mano.
2. **En el empaque** — el QR `?grupo=1` ya existe y no exige ningún trabajo de venta tuyo.
   Es promoción pasiva dentro de un pedido que ya entregaste. **Esto conecta directo con los
   empaques que estás por comprar: la tarjeta va en la bolsa.**
3. **Cuando alcanza un rango** — ya hay una celebración; ahí cabe el "trae a alguien".

⚠ Y lo que **no** hay que hacer: proyectar oficinas. El pedido grupal es cualquier cliente
comprando para varios; llega por la app como todos. Nadie sale a conseguir cuentas.

---

## 4. Marketing — instrumentado, apagado

**Lo que ya está construido:** Meta Pixel + Conversions API con deduplicación por `event_id`,
`?src=` para atribuir campañas, contenido semanal listo para copiar, calendario de contenido
con borradores automáticos a 4 semanas, guion de video, y publicación automática a
Instagram/Facebook.

**Todo eso está apagado porque faltan tres secrets de Meta** (`META_PIXEL_ID`,
`META_CAPI_TOKEN`, y los de publicación). Ver **P5** en `docs/PENDIENTE_DEL_DUENO.md`.

**Ese es el bloqueo número uno del negocio entero**, y no por el marketing: **sin el píxel no
se puede medir el CAC**, que es el número del que cuelga todo el plan. Un `supabase secrets set`
lo destraba.

⚠ Antes de activarlo: la Política de Privacidad debería mencionar que se comparten
identificadores hasheados con Meta. No la toco sin que lo pidas.

---

## 5. Sistemas — qué falta construir

De las 93 automatizaciones vigentes, **50 ya están en producción** (lotes E1-E6). Lo que
queda no es trabajo pendiente de escribir, es trabajo que todavía no se puede hacer bien:

- **31 ítems necesitan historial real.** Construirlos hoy produciría números con aspecto de
  dato sobre 10 pedidos de prueba. Con la apertura en octubre, la ventana correcta para
  empezarlos es **principios de noviembre**, con ~3 semanas de ventas.
- **11 dependen de ti**, casi todos colgando de los secrets de Meta.

**Lo único que yo construiría antes de abrir**, porque no necesita datos y ataca los dos
huecos de arriba:

1. **El referido en el momento de la calificación** (§3.1) — es donde el boca a boca se gana.
2. **El bounce-back calibrado con la mediana real** (§2.1) — se puede dejar listo para que se
   auto-ajuste apenas haya datos.

---

## En orden, esta semana

1. **Poner los secrets de Meta.** Destraba la medición del CAC, que decide todo lo demás.
2. **Cerrar el logo y mandar los empaques** — con la tarjeta del QR `?grupo=1` incluida.
3. **Cargar compras reales** en Admin // Compras y costos, para saber si el costo real es 45%
   o 30% y mover el umbral a favor.
4. Recién después, ajustar precios o presupuesto de publicidad.

**Lo que no hay que hacer todavía:** subir el presupuesto de publicidad. Mientras no se sepa
de qué lado del umbral está el CAC, gastar más puede estar comprando pérdidas más rápido —
y el modelo muestra que pasado cierto punto, más gasto **empeora** el neto del mes.
