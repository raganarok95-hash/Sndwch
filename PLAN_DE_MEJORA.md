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

## 4b. Las tres fugas de margen que el repo ya identificó y nadie cerró

Estas no necesitan **un solo cliente más**. Están documentadas en `CLAUDE.md`, con número, y
siguen abiertas. Al volumen del plan (1,411 pedidos/mes en el mes 6):

| palanca | S//mes | S//año | estado |
|---|---|---|---|
| Bajar el pago con tarjeta de 60% a 30% (empujar Yape/Plin) | **S/487** | S/5,842 | ✅ **cerrada** 2026-09-03 |
| +S/1 en ARMA EL TUYO | **S/423** | S/5,080 | ⏳ abierta — decisión de precio tuya |
| Cobrar o medir la focaccia | **S/175** | S/2,100 | ✅ **cerrada** 2026-09-03 |
| **Total** | **S/1,085** | **S/13,021** | |

**Las tres juntas son el 22% de la meta mensual, sin adquirir a nadie. Dos ya están
cerradas** (~S/662/mes): Yape/Plin pasó a ser el método de pago por defecto, y la focaccia
se mide (10 porciones de 15CM por unidad de S/13) y se cobra (+S/0.50 / +S/1.00).
**La que queda es la única que sube un precio de carta**, y esa es tuya.

**1. La comisión de Culqi — CERRADA el 2026-09-03.** Cada pedido con tarjeta deja S/0.69 en
la pasarela; Yape/Plin no cobra nada. La app tenía la **tarjeta como método por defecto**: quien
no tocaba el selector pagaba la comisión sin haber elegido nada. Ahora el default es Yape/Plin,
con el ahorro escrito en el botón y el nombre del titular a la vista para que la transferencia
no se caiga por desconfianza. La tarjeta sigue a un tap, así que nadie queda encerrado.
**El costo lo pagas tú en tiempo**: cada pago manual hay que confirmarlo contra tu cuenta. Eso
ya está abaratado con el lector de comprobantes (#28) y la confirmación por lotes del panel —
pero **el lector NO confirma el pago**, solo lo lee; el veredicto sigue siendo tuyo.
**Si un día la confirmación manual te come más tiempo del que ahorra, el default se revierte
en una línea** — es una decisión de negocio, no una restricción técnica.

**2. ARMA EL TUYO quedó sin subir — LA ÚNICA QUE SIGUE ABIERTA, y es tuya.** La subida de margen del 2026-08-22 tocó los 5 Signatures
y **no** el BYO, porque autorizaste los Signatures. Con el pan recosteado a S/2 la unidad,
**BYO 30CM de res cruzó el techo de 45%** (llegó a 45.6%) y el de atún quedó en 43.2%: son
las dos combinaciones más ajustadas del catálogo y las únicas que se pasan del objetivo.

**3. La focaccia — CERRADA el 2026-09-03.** Faltaba un solo dato y lo mediste: **de una
focaccia de S/13 salen 10 de 15CM o 5 de 30CM**. Eso es S/1.30 y S/2.60 de pan contra S/1.00 y
S/2.00 del pan sub — cayó del lado malo (empataba recién a 13 porciones). Ya no es una elección
gratuita: se cobra **+S/0.50 y +S/1.00**, algo por encima del sobrecosto real, y el monto se ve
en la tarjeta del pan **antes** de elegirlo. Las recompensas que regalan un sándwich (R06) o el
upgrade a 30CM (R03) lo perdonan entero: un "gratis" que después cobra S/0.50 es una promesa
rota, la misma clase que ya obligó a retirar dos badges del menú.

⚠ Y una cuarta, sin cifra porque no se puede calcular sin ventas: **la tasa de puntos quedó
invertida.** R03 cuesta 40 pts/sol y R04 53 pts/sol, contra 20 pts/sol de R05 y R06 — o sea
las recompensas caras salen más baratas en puntos que las baratas. Está anotado en
`CLAUDE.md` como detectado y no resuelto. Se revisa con los primeros canjes reales.

---

## 4c. ¿Y si las metas se pueden subir?

Preguntaste también cómo mejorarlas. La respuesta honesta:

Con el plan recomendado (S/6,000/mes de publicidad, boca a boca fuerte, CAC bueno), la
**mediana** del mes 6 es **S/11,415** — más del doble de la meta de S/5,000. Y las tres fugas
de arriba suman otros S/1,085.

Pero eso **no significa que la meta esté mal puesta**. Significa que el rango es ancho: el P10
de ese mismo escenario está mucho más abajo, y con el CAC medio o malo no se llega ni a
S/5,000. **La meta de S/5,000 no es un pronóstico, es un piso** — y un piso se pone donde
puedas dormir tranquilo, no donde esperas terminar.

**Cuándo subirla:** cuando tengas 3 semanas de CAC real. Si cae debajo de S/15.92, súbela sin
miedo. Si cae encima, la meta de S/5,000 ya era optimista y hay que replantear el gasto, no
la meta.

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
