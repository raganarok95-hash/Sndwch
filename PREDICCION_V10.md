# SND//WCH — Plan para S/4,000 desde el mes 3 y S/5,000 desde el mes 6

**Fecha:** 2026-09-02 · **Modelo:** `modelo/modelo_v10.py` · **Salida:** `modelo/modelo_v10_salida.txt`
Reemplaza a `PREDICCION_V9.md`.

---

## 0. El objetivo cambió de forma, y eso lo hace más duro

Ya no es un pico ("S/10,000 en el mes 6") sino un **piso mensual sostenido**:

- desde el mes 3 (nov-26) en adelante → neto **≥ S/4,000 todos los meses**
- desde el mes 6 (feb-27) en adelante → neto **≥ S/5,000 todos los meses**

Basta **un** mes por debajo para romperlo. Por eso la métrica central de este modelo ya no
es "¿cuánto da el mes 6?" sino **"¿qué probabilidad hay de sostener el camino entero?"**.

**Tres cosas que el v9 no modelaba y ahora sí:** saturación (el CAC sube 10% por cada 1,000
clientes adquiridos — el v9 afirmaba implícitamente que Trujillo es infinito), costos que
crecen con el volumen (S/0.50/pedido de gas, frío y coordinación) y que **contratar no es
gratis ni instantáneo** (la persona nueva cobra completo y rinde 60% el primer mes).

---

## 1. El umbral que decide todo el negocio

| | |
|---|---|
| Lo que deja un cliente en su **primer** pedido | **S/15.92** |
| Comprarlo por Meta con el mejor CPM (S/5) | S/10.51 ✓ **deja ganancia** |
| Comprarlo con el CPM medio (S/8.5) | S/17.87 ✗ **pierde** |
| Comprarlo con el peor CPM (S/12) | S/25.23 ✗ **pierde mucho** |
| Traerlo por **referido** | **S/7.65** ✓ el único siempre rentable |

> **Todo el plan cuelga de ese umbral.** Si el CAC real cae por debajo de S/15.92, cada
> cliente comprado deja ganancia desde su primer pedido. Si cae por encima, cada cliente
> comprado es una pérdida que solo se recupera si vuelve — y en los primeros meses casi
> nadie ha vuelto todavía.
>
> **El rango documentado (S/10.51 a S/25.23) cruza el umbral por el medio.** Hoy no se sabe
> de qué lado está este negocio, y es la única pregunta que importa.

---

## 2. Con el CAC medio o malo, el mes 3 no se alcanza a ningún presupuesto

Probando **todos** los presupuestos y quedándose con el mejor de cada mes (esto es el techo,
no un plan):

| mes | mejor ads | neto P50 | objetivo | |
|---|---|---|---|---|
| nov-26 | S/12,000 | S/806 | S/4,000 | ✗ **no llega** |
| dic-26 | S/12,000 | S/2,412 | S/4,000 | ✗ no llega |
| ene-27 | S/24,000 | S/3,679 | S/4,000 | ✗ no llega |
| feb-27 | S/8,000 | S/3,840 | S/5,000 | ✗ no llega |

**No es falta de dinero.** En el mes 3 casi todos los clientes son nuevos, cada uno cuesta
más de lo que deja su primer pedido, y todavía no hay una base que haya vuelto.

Separado por CAC, la tabla se parte en dos:

| escenario | neto m3 | neto m6 | P(camino) |
|---|---|---|---|
| **CAC S/10.51 · viral 0.3** | S/8,418 | S/15,787 | 18% |
| **CAC S/10.51 · viral 1.0** | S/13,555 | S/25,341 | 22% |
| CAC S/17.87 · viral 0.3 | S/139 | S/3,691 | 0% |
| CAC S/25.23 · viral 0.3 | −S/2,097 | S/566 | 0% |

**No hay punto intermedio interesante: o el CAC está por debajo de S/15.92 o no.**

---

## 3. Un promedio bueno no basta: el piso no es la mediana

| mediana del mes 6 | P(ese mes ≥ meta) | P(**todos** los meses ≥ meta) |
|---|---|---|
| S/7,202 | 90% | **22%** |
| S/11,806 | 94% | **33%** |
| S/25,400 | 97% | **57%** |

> Para que S/5,000 sea un **piso confiable** hay que apuntar bastante por encima de S/5,000.
> Planificar para que la mediana sea exactamente la meta es planificar para fallar la mitad
> de los meses.

---

## 4. El plan

Acotado a mano a una escala defendible en Trujillo — si se deja al modelo elegir libremente
se desboca a 250 pedidos/día y 4,000 clientes nuevos por mes, que es el modelo corriendo sin
freno de mercado, no un plan.

Con el CAC bueno, retención media y **sin reinversión** (para no depender de que el lazo se
realimente):

| ads fijos | viralidad | nuevos/mes m6 | ped/día m6 | personas | neto m3 | neto m6 | **P(camino)** |
|---|---|---|---|---|---|---|---|
| S/4,000 | 0.3 | 418 | 30 | 1 | S/3,168 | S/6,088 | 2% |
| S/6,000 | 0.3 | 586 | 42 | 2 | S/4,684 | S/7,379 | 25% |
| S/8,000 | 0.3 | 736 | 53 | 2 | S/5,474 | S/8,768 | 45% |
| S/4,000 | **1.0** | 599 | 43 | 2 | S/5,821 | S/8,172 | **59%** |
| **S/6,000** | **1.0** | 821 | 59 | 2 | S/6,975 | S/11,415 | **85%** ← el plan |

> **Mira dos veces la comparación:** S/4,000/mes con viralidad 1.0 da **más** probabilidad
> (59%) que S/8,000/mes con viralidad 0.3 (45%). **El doble de presupuesto pierde contra el
> boca a boca.** Un referido cuesta S/7.65 y un cliente comprado S/10.51.
>
> **Antes de subir el presupuesto de publicidad, gasta el esfuerzo en que cada cliente traiga
> a otro.** Es más barato y aguanta mejor los meses malos.

### Puntos de control mes a mes

**S/6,000/mes de publicidad fija · sin reinversión · cada cliente trae a otro · 85% de
probabilidad de sostener el camino.**

| mes | nuevos | pedidos | ped/día | personas | neto P10 | neto P50 | meta |
|---|---|---|---|---|---|---|---|
| sep-26 | 714 | 728 | 36 | 1 | −S/56 | S/2,188 | — |
| oct-26 | 735 | 970 | 36 | 1 | S/2,847 | S/6,130 | — |
| **nov-26** | 767 | 1,121 | 45 | 2 | S/4,456 | S/6,910 | **S/4,000** |
| dic-26 | 813 | 1,258 | 47 | 2 | S/6,086 | S/8,920 | S/4,000 |
| ene-27 | 876 | 1,389 | 52 | 2 | S/6,622 | S/10,765 | S/4,000 |
| **feb-27** | 821 | 1,411 | 59 | 2 | S/6,745 | S/11,325 | **S/5,000** |
| mar-27 → ago-27 | ~650-780 | ~1,320-1,400 | ~50-54 | 2 | ~S/6,800-7,150 | ~S/10,500-11,300 | S/5,000 |

**Si el mes 1 real no se parece a la fila de sep-26, el plan no está atrasado: está
equivocado**, y hay que rehacerlo con el dato nuevo.

---

## 5. Qué hacer, en orden

1. **Medir el CAC real en la primera semana.** Es lo único que decide de qué lado del umbral
   está el negocio. Se mide con el píxel de Meta (ya instalado) + `?src=` en el link del
   anuncio. **Regla de corte: si el CAC pasa de S/15.92, comprar clientes con publicidad
   destruye caja en el corto plazo** y el plan tiene que apoyarse en referidos.
2. **Empujar el referido por encima de todo lo demás.** A S/7.65 es el único canal rentable
   desde el primer pedido, y funciona esté donde esté el CAC. La escalera ya está construida;
   falta que el cliente la vea en el momento correcto.
3. **Subir lo que deja el primer pedido.** Cada sol que sube la contribución corre el umbral
   a favor y mete más escenarios de CAC del lado rentable.
4. **No gastar de más mientras el CAC sea malo.** Pasado un punto, subir el presupuesto
   **empeora** el neto del mes, porque la publicidad se resta hoy y el cliente devuelve su
   valor después. Si el CAC sale alto, hay que crecer más lento, no gastar más.

---

## 6. Los dos supuestos de los que depende el plan

El plan del 85% necesita **las dos cosas a la vez**:

- **CAC en el extremo bueno del rango** (S/10.51, no S/17.87 ni S/25.23) — no medido.
- **Viralidad 1.0**: cada cliente trae a otro — no medido, y es una tasa alta.

Si solo se cumple una, la probabilidad cae a la banda del 20-45%. **Ninguna de las dos se
despeja discutiendo: se miden en las primeras tres semanas de venta.**

Y sigue sin modelar, dicho sin adornos: estacionalidad peruana (fiestas, verano, quincena),
fatiga creativa de los anuncios, y el desfase de cobro de Culqi.
