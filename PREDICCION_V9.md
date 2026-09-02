# SND//WCH — S/10,000 netos al mes: qué dice el modelo con varianza

**Fecha:** 2026-09-02 · **Modelo:** `modelo/modelo_v9.py` · **Salida:** `modelo/modelo_v9_salida.txt`
**Reemplaza a `PREDICCION_V8.md`**, cuyas conclusiones quedan retiradas.

---

## Qué estaba mal en la versión anterior

Encontraste tres defectos y los tres eran reales:

1. **Sin varianza.** El v8 daba un número por mes como si fuera seguro. Ahora cada escenario
   son miles de corridas y la respuesta es una **distribución con probabilidad**.
2. **Retención clavada en el peor valor.** El v8 usaba el 22.6% de segundo pedido — el
   benchmark de un restaurante **sin programa de fidelidad**. Este negocio tiene puntos,
   rangos, menú secreto, escalera de referidos y nueve recordatorios automáticos, todos
   construidos para batir ese número. Además suponía que **el 100% de los clientes se
   compran con publicidad**, ignorando el referido, que cuesta S/7.65 y ya está en el código.
3. **El delivery.** Tienes razón: lo paga el cliente, no sale de tus ganancias. Sale del
   modelo de rentabilidad. (Lo que sí encontré revisando el código está en §6.)

---

## 1. La aritmética que manda sobre todo lo demás

Antes de cualquier tabla, el número que explica el resto:

| | |
|---|---|
| Un cliente recién comprado entrega **un** pedido en el mes en que lo compras | |
| Ese pedido deja | **S/16.42** |
| Comprarlo cuesta (CAC medio, cuenta madura) | **S/17.87** |
| Comprarlo cuesta en el arranque en frío | **S/28.59** |
| El resto de sus pedidos llegan en los **meses siguientes** | |

> **La publicidad casi no se paga dentro del mes en que se gasta.** Se paga con los pedidos
> que ese cliente hace después. Por eso reinvertir solo lo generado no arranca ningún motor,
> y por eso **la retención no es "una palanca más": es lo único que convierte publicidad en
> negocio.**

---

## 2. Tu plan real: S/2,000/mes fijos + reinversión encima

Retención sorteada en todo el rango de industria, viralidad 0.3:

| reinversión | ads mes 6 | ped/día | personas | neto mes 6 (P10/P50/P90) | P(≥10k mes 6) | P(llega en 12m) |
|---|---|---|---|---|---|---|
| 0% | S/2,000 | 10 | 1 | −50 / **1,220** / 3,319 | 0% | 0% |
| 30% | S/3,304 | 16 | 1 | −48 / **1,876** / 6,593 | 2% | 8% |
| 60% | S/6,047 | 26 | 1 | −75 / **3,032** / 12,596 | **15%** | 36% |
| 90% | S/11,700 | 48 | 2 | −313 / **4,159** / 25,470 | **30%** | 54% |

> **Con S/2,000/mes fijos, el mes 6 no llega.** Reinvirtiendo el 60% la mediana queda en
> S/3,032 y hay un **15% de probabilidad** de alcanzar los S/10,000 en el mes 6; un 36% de
> alcanzarlos en algún momento de los 12 meses.

---

## 3. Sin límite de dinero: cuánto haría falta

Cuánta publicidad mensual fija pone la **mediana** del mes 6 en S/10,000 (con 60% de
reinversión encima):

| retención 2º pedido | viralidad | ads/mes necesarios | ped/día | personas | clientes nuevos/mes |
|---|---|---|---|---|---|
| 22.6% (piso) | 0.0 | S/34,479 | 250 | 7 | 4,435 |
| 22.6% (piso) | 0.3 | S/10,724 | 120 | 4 | 2,175 |
| 31.8% (medio) | 0.0 | S/15,332 | 133 | 4 | 2,146 |
| **31.8% (medio)** | **0.3** | **S/6,641** | **93** | **3** | **1,534** |
| 40% (tope) | 0.0 | S/10,153 | 107 | 3 | 1,549 |
| **40% (tope)** | **0.3** | **S/5,019** | **83** | **3** | **1,283** |

**Sí se alcanza el mes 6 si el dinero no es la restricción** — entre **S/5,000 y S/6,600 al
mes** de publicidad fija, si la retención y el boca a boca acompañan. Eso es 2.5× a 3.3× lo
que tenías pensado poner.

Pero mira las dos últimas columnas antes de decidir: son **1,283 a 1,534 personas distintas
por mes en Trujillo**, y 3 personas trabajando. El modelo compra clientes sin que suba el
precio y sin que se acabe el mercado — **ninguna de las dos cosas es cierta**, así que estos
números son un **piso de dificultad, no un plan**.

---

## 4. Las dos palancas que el modelo anterior tenía apagadas

Con S/2,000/mes fijos y 60% de reinversión:

| retención | viralidad | pedidos/cliente | neto mes 6 | neto mes 12 | P(≥10k mes 6) |
|---|---|---|---|---|---|
| 22.6% (piso) | 0.0 | 2.34 | S/476 | S/2,139 | 1% |
| 22.6% (piso) | 0.6 | 2.34 | S/3,486 | S/11,067 | 18% |
| 31.8% (medio) | 0.3 | 2.88 | S/3,265 | S/10,727 | 16% |
| **40% (tope)** | **0.6** | **3.37** | **S/6,751** | **S/35,981** | **37%** |

Del piso al tope de retención, los pedidos por cliente pasan de 2.34 a 3.37 — **sin gastar un
sol más de publicidad**. Y a 12 meses la diferencia es de S/2,139 a S/35,981.

---

## 5. Qué decide más, y cómo cambia con el horizonte

Caso medio: S/2,000/mes + 60% reinversión, viral 0.3, retención 31.8%.
Mes 6 P50 = S/2,937 · Mes 12 P50 = S/9,590

| cambio | efecto mes 6 | efecto mes 12 |
|---|---|---|
| publicidad fija S/10,000 en vez de S/2,000 | **+S/11,187** | **+S/38,122** |
| publicidad fija S/5,000 en vez de S/2,000 | +S/4,175 | +S/15,539 |
| viralidad alta (0.6) | +S/2,068 | **+S/10,402** |
| reinversión 90% | +S/1,010 | **+S/21,491** |
| retención al tope (40%) | +S/1,298 | **+S/6,322** |
| sin arranque en frío | +S/1,429 | +S/2,516 |
| sin viralidad | −S/1,619 | −S/4,851 |
| retención al piso | −S/1,016 | −S/4,098 |
| sin reinversión | −S/1,699 | −S/7,725 |

> **El orden cambia según el horizonte, y eso es lo importante.** En el mes 6 manda cuánta
> publicidad pones. A 12 meses la retención, la viralidad y la reinversión se pagan solas y
> pasan al frente. **Un plan optimizado solo para el mes 6 compra crecimiento caro; uno que
> además mueve la retención lo compra una sola vez.**

⚠ **El P90 de todas estas distribuciones no es creíble.** El modelo no tiene tamaño de
mercado ni encarecimiento del CAC al escalar. La mediana y el P10 son los números que
sirven.

---

## 6. Lo que encontré revisando el delivery en el código

Me dijiste *"en teoría el app calcula los kilómetros de distancia y cobra ese monto al cliente
en el checkout"*. **Revisé el código y no es lo que hace.**

Lo que hace de verdad (`src/app/05-carrito-y-checkout.ts`):

1. El cliente **elige su zona en un desplegable** (cerca S/6 · media S/8 · lejos S/12 · muy
   lejos S/15). **El valor por defecto es `media`.** Ese monto plano es lo que se cobra.
2. Si el cliente usó el mapa o el GPS, la app calcula la distancia y **solo avisa** si la zona
   elegida no cuadra, con un botón para cambiarla. El comentario del código lo dice
   textualmente: *"No es una geocerca ni una validación: existe solo para AVISAR… El cobro
   real lo sigue fijando la zona que él eligió."*
3. **La mayoría de los pedidos nunca tocan el mapa** (se escribe la dirección a mano), así que
   en esos no hay ningún chequeo de distancia.
4. La distancia que sí calcula es **en línea recta** (haversine), no de manejo. La ruta real
   suele ser 20-40% más larga.

O sea: **el cliente elige su propio precio de envío, y elegir el más barato no le cuesta
nada.** El aviso incluso le dice *"puede que el motorizado te pida la diferencia al llegar"* —
una promesa sobre lo que hará el motorizado.

Esto **no es una fuga de tu margen** (tenías razón, el delivery lo paga el cliente), pero sí
es una diferencia entre lo que crees que hace la app y lo que hace. **Es una decisión tuya**
si quieres que cobre por distancia real.

---

## 7. Lo que este modelo sigue sin saber

No se despeja discutiendo. Se mide en las primeras semanas de venta:

1. **El CAC real de Trujillo** — hoy es un rango prestado de S/10.51 a S/25.23.
2. **Cuánto sube el CAC al escalar** — el modelo lo supone constante, y es falso.
3. **Cuánta viralidad hay** — mueve más que casi todo lo demás y es pura suposición.
4. **Si el mercado alcanza** para 1,300-1,500 clientes nuevos por mes.
