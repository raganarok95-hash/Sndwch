# SND//WCH — El camino a S/5,000 y a S/10,000, con cinco métodos en vez de uno

**2026-09-13.** Motor: `modelo/modelo_v13.py` (política de anuncios nueva) y
`modelo/metodos_de_prediccion.py` (comparación de métodos). Salida completa en
`modelo/metodos_salida.txt`.

> **Esto es una SIMULACIÓN, no un pronóstico.** El negocio no ha abierto. Se reconstruye con
> datos reales apenas haya ventas.

---

## 0 · Dos cosas antes de cualquier número

**La meta subió.** Los modelos v11 y v12 medían *"S/4,000 desde el mes 3 y S/5,000 desde el
mes 6"* (decisión del dueño, 2026-09-02). Lo pedido ahora es **S/5,000 desde el mes 3** y
**S/10,000 sostenidos** más adelante. El mes 3 pide **25% más sobre un mes que el v12 ya
proyectaba en negativo**. Comparar las probabilidades de este documento con las del v12 sin
notar eso llevaría a leer una meta más ambiciosa como un negocio que empeoró.

**Y por primera vez no es un solo método.** Los modelos v7 a v12 eran el mismo esqueleto con
entradas distintas. Eso tiene un problema que ninguna cantidad de escenarios arregla: si el
esqueleto está mal, 20,000 corridas lo repiten 20,000 veces con una barra de error preciosa
alrededor de un número equivocado. La evidencia sobre esto es sólida — en la competencia M4,
**12 de los 17 modelos más precisos usaban alguna forma de combinación**, y el promedio simple
de métodos heterogéneos resulta difícil de batir.

| método | qué aporta | qué supuesto de los otros rompe |
|---|---|---|
| **M1 · Estructural** (Monte Carlo de cohortes) | probabilidades | — es el de siempre |
| **M2 · Difusión de Bass** | forma de la curva y techo | que no existe techo de mercado |
| **M3 · Clase de referencia** (vista de afuera) | supervivencia | que el negocio sigue abierto 24 meses |
| **M4 · Retrocálculo** | la condición física | que el cuello de botella es la demanda |
| **M5 · Valor de la información** | cuándo se va a saber | que hay que esperar años para verificar |

---

## 1 · La respuesta corta

| pregunta | respuesta |
|---|---|
| **P(S/5,000 netos en el mes 3)** | **0.0%** — en las 12 combinaciones probadas, sin excepción |
| **P(S/5,000 sostenidos en 24 meses)** | 0.0% a **6.8%** según el ritmo orgánico; ×0.76 por supervivencia → **hasta 5.2%** |
| **P(S/10,000 sostenidos en 24 meses)** | **0.0%** con los supuestos de hoy |
| **P(S/10,000) si se alcanzan las palancas objetivo** | **82.6%** (8 orgánicos/día + 0.40 referidos/pedido) |

El mes 3 es **diciembre de 2026**, con el negocio abierto ~2.5 meses. No es que sea difícil:
no hay tiempo material para acumular la base de clientes que S/5,000 requiere. Esa conclusión
no depende de ningún supuesto de marketing — sale del método M4, que es aritmética.

---

## 2 · M4 · Lo que tiene que ser cierto, sin supuestos de marketing

Es el único bloque que no puede estar equivocado por el lado del modelo.

| meta neta | sin pauta | pauta S/1,500 | pauta S/3,000 | pauta S/6,000 |
|---|---|---|---|---|
| **S/5,000** | 15.5 ped/día | 19.8 | 24.0 | 32.5 ⚠ |
| **S/10,000** | 29.6 ped/día | 33.9 ⚠ | 38.1 ⚠ | 50.8 → 2 personas |

Techo físico de una persona: **40 pedidos/día**. ⚠ = por encima del 75% de ese techo.

Tres lecturas:

1. **S/10,000 netos CABEN en una persona sola** — 29.6 pedidos/día — pero solo si el negocio
   no está pagando publicidad. Es el hallazgo que reordena todo lo demás.
2. **La publicidad no es el camino: es lo que lo encarece hasta el techo.** Con S/6,000/mes de
   pauta, la misma meta de S/10,000 pasa a 50.8 pedidos/día y obliga a contratar — y el sueldo
   se come lo que la pauta no.
3. **A S/10,000 no queda margen para un mal día.** Se opera al 74-95% del techo físico.

---

## 3 · M1 · El motor estructural, con la política de anuncios nueva

4,000 corridas por celda, 24 meses. **La publicidad ya no es un gasto fijo mensual**: son
S/300 para medir en el mes 3 y después la regla del freno decide escalar, cortar o quedarse.

| orgánico | viral | P(m3 ≥ 5k) | P(5k sost) | P(10k sost) | neto m12 | neto m24 |
|---|---|---|---|---|---|---|
| 0/día | 0.06 | 0.0% | 0.0% | 0.0% | −S/493 | −S/500 |
| 0/día | 0.25 | 0.0% | 0.0% | 0.0% | −S/484 | −S/498 |
| 1/día | 0.25 | 0.0% | 0.1% | 0.0% | S/599 | S/696 |
| 2/día | 0.25 | 0.0% | 0.4% | 0.0% | S/1,646 | S/1,901 |
| 3/día | 0.06 | 0.0% | 0.1% | 0.0% | S/1,764 | S/1,784 |
| **3/día** | **0.25** | 0.0% | **6.8%** | 0.0% | S/2,698 | **S/3,041** |

### ⚠ Lo más importante de esta tabla es la primera fila

**Con cero clientes orgánicos, el negocio se queda en −S/500 para siempre** — que es
exactamente el costo fijo. No pierde más porque el freno de CAC corta la publicidad al ver que
el CAC pasa el techo. Y no gana nada porque no le queda ningún motor.

Eso **no es un fallo del freno: es el diagnóstico.** Los modelos anteriores "crecían" porque
gastaban S/6,000/mes en publicidad a pérdida; el freno, aplicado con honestidad, revela que
**este negocio no tiene ningún motor de crecimiento aparte de lo orgánico y los referidos.**

---

## 4 · M2 · Bass, y dos errores que cometí y hay que dejar escritos

| mercado M | q/mes | ped/día m6 | ped/día m12 | ped/día m24 | neto m24 |
|---|---|---|---|---|---|
| 31,557 | 0.0317 | 5.8 | 7.8 | 10.6 | S/3,244 |
| 78,893 | 0.0317 | 14.6 | 19.4 | 26.4 | S/8,861 |
| 157,786 | 0.0317 | 29.2 | 38.8 | 52.8 | S/16,722 |

**Dos errores reales de mi primera implementación**, porque los dos producían resultados que
parecían razonables hasta mirarlos de cerca:

1. **Los coeficientes publicados son ANUALES y los apliqué mensualmente.** Con p = 0.03 sobre
   un mercado de 157,786 personas, el mes 1 daba 4,734 adoptantes, y de ahí el modelo reportó
   **S/267,336 de neto en el mes 12 con diez empleados**. La aritmética estaba bien; la unidad
   de tiempo, no.
2. **Bass modela la adopción de una CATEGORÍA por un mercado, no la cuota de un vendedor.**
   Poner M = todo el mercado equivale a asumir 100% de cuota para una sandwichería que abre.
   Ninguna corrección de unidades arregla eso: es usar el modelo fuera de su dominio validado.

**Por eso de este método no se toma el nivel, se toma la forma.** Lo que sí viaja, y no depende
de M ni de la unidad de tiempo, es la razón **q/p = 13**: la imitación pesa trece veces más que
la adopción espontánea. Traducido: el boca a boca debería dominar a la publicidad pagada por un
orden de magnitud — **la misma conclusión del método estructural, por un camino independiente.**

---

## 5 · La convergencia, que vale más que cualquiera de los dos por separado

El `p` de Bass no es un parámetro abstracto: **p·M son los adoptantes espontáneos del primer
mes**, o sea el ritmo orgánico — el mismo número que M1 recorre a mano. Si los dos modelos son
razonables, alineado ese número tienen que coincidir.

| mercado M | implica orgánico | M2 neto m24 | M1 neto m24 | brecha |
|---|---|---|---|---|
| 31,557 | 3.0/día | S/3,244 | S/3,134 | −3% |
| 78,893 | 7.6/día | S/8,861 | S/8,188 | −8% |
| 157,786 | 15.2/día | S/16,722 | S/15,647 | −6% |

Dos esqueletos distintos —uno de cohortes, uno de difusión— aterrizan **dentro del 8%**.

**Eso no valida el número: valida que toda la respuesta cuelga de un único parámetro que nadie
midió.** Y ese parámetro es exactamente el que la ventana sin publicidad de las primeras dos
semanas va a medir. La simulación acaba de decir cuánto vale esa medición antes de tomarla.

---

## 6 · M3 · La vista de afuera, que ningún modelo anterior aplicó

Los métodos de adentro calculan P(meta | el negocio sigue abierto) y se olvidan de multiplicar
por P(sigue abierto).

| fuente | cierre año 1 | sobrevive 24 m |
|---|---|---|
| Datassential 2025 | 0.9% | 98.7% |
| servicios/restaurantes | 17.0% | 75.9% |
| National Restaurant Association | 30.0% | 59.5% |

El rango 0.9%–30% es tan ancho que el número puntual no sirve; lo que sirve es la dirección.
Con el caso central, **el 6.8% de arriba se convierte en 5.2%**. Y conviene no repetir el
"90% cierra el primer año": es un mito sin respaldo.

---

## 7 · M5 · Cuándo se va a saber — el único método verificable en semanas

| si el CAC real es | conversiones | gasto | veredicto |
|---|---|---|---|
| S/8 | 3 | S/24 | sirve |
| S/10.51 | 12 | S/126 | sirve |
| S/12 | 55 | S/660 | ⚠ banda de empate |
| S/15 | 120 | S/1,800 | ⚠ banda de empate |
| S/17.87 | 18 | S/322 | cortar |
| S/25.23 | 5 | S/126 | cortar |

Lo caro de probar es justo lo que no hace falta probar. Es lo que sostiene el presupuesto de
S/300 con tope duro aprobado el 2026-09-13.

---

## 8 · La variable que ningún modelo de este repo tuvo nunca

**El dueño es un punto único de falla.** Una persona sola, sin reemplazo: cada día que no puede
trabajar, el negocio factura 0 y los costos fijos siguen corriendo.

| días caídos/año | disponibilidad | meta S/5,000 queda en | meta S/10,000 queda en |
|---|---|---|---|
| 0 | 100% | S/5,000 | S/10,000 |
| 10 | 96.8% | S/4,824 | S/9,663 |
| 20 | 93.6% | S/4,647 | S/9,327 |
| 30 | 90.4% | S/4,471 | S/8,990 |

**20 días caídos al año cuestan S/353 al mes** contra la meta de S/5,000 y S/673 contra la de
S/10,000. Y a S/10,000 el negocio opera al 74-95% del techo físico: **no hay margen para
recuperar los días perdidos trabajando más.**

---

## 9 · Qué haría falta para S/10,000 sostenidos

| orgánico | viral | contribución | P(10k sost) | neto m24 | ped/día m24 |
|---|---|---|---|---|---|
| 3/día | 0.25 | 14.13 | 0.0% | S/3,046 | 11.8 |
| 5/día | 0.25 | 14.13 | 1.9% | S/5,366 | 19.5 |
| 5/día | 0.40 | 14.13 | 43.4% | S/9,501 | 39.3 |
| 8/día | 0.25 | 14.13 | 34.2% | S/8,860 | 30.8 |
| **8/día** | **0.40** | **14.13** | **82.6%** | **S/15,431** | 63.3 |
| 8/día | 0.40 | 17.13 | 96.9% | S/20,456 | 63.8 |
| 12/día | 0.40 | 14.13 | 97.2% | S/21,529 | 90.4 |

**S/10,000 sostenidos exigen dos cosas a la vez**, y ninguna es publicidad:

- **8 clientes nuevos orgánicos por día** (≈208 al mes sin gastar en anuncios), y
- **0.40 referidos por pedido servido** — seis veces el 0.06 que el modelo asume hoy.

A 63 pedidos/día el negocio **ya necesita una segunda persona**. Eso está dentro del modelo
(S/1,500 de sueldo) y aun así el neto queda en S/15,431 — pero rompe el supuesto "mano de obra
= S/0" sobre el que descansa todo el costeo del menú. **S/10,000 no es el mismo negocio con más
volumen: es otro negocio.**

---

## 10 · Cómo subir las probabilidades, en orden de lo que mueve

| palanca | de → a | efecto medido |
|---|---|---|
| **1. Ritmo orgánico** | 0 → 3/día | P(5k sost) de 0.0% a **6.8%**; el negocio deja de estar clavado en −S/500 |
| **2. Referidos** | 0.06 → 0.25 por pedido | a 3 orgánicos/día, P(5k) ×68 (de 0.1% a 6.8%) |
| **3. Los dos juntos** | 8/día + 0.40 | P(10k sost) **82.6%** |
| **4. Contribución** | +S/3 por pedido | sobre lo anterior, sube P(10k) de 82.6% a **96.9%** |
| **5. Reseñas de Google** | 0 → 50 | fuera del modelo; **la única evidencia causal del expediente** (+5-9% de ingresos por estrella, solo en independientes) |
| **6. No caerse** | 20 → 5 días/año | +S/265/mes a la meta de S/10,000, gratis |

**Lo que NO sube la probabilidad: gastar más en publicidad.** El v12 lo recorrió hasta
S/20,000/mes y el resultado empeora. Este modelo lo confirma por otra vía: con el freno puesto,
la publicidad se autolimita y lo que queda en pie es el orgánico.

---

## 11 · Inventario de variables

**Dentro del modelo (21).** Contribución por pedido · mezcla BYO/Signature · attach de bebida ·
retención (sBG con Bloom + Paytronix) · CAC (CPM·CTR·CVR·IGV) · fase de aprendizaje de Meta y
su castigo · saturación del CAC · arranque en frío · ruido mensual · referidos por pedido ·
costo del referido · capacidad por persona · contratación y su rendimiento inicial · costos
fijos · días operativos · **ritmo orgánico** ⚠ · **política de decisión publicitaria** ⚠ ·
**sesgo de atribución del CAC** ⚠ · **techo de mercado** ⚠ · **supervivencia del negocio** ⚠ ·
**punto único de falla** ⚠ (las seis marcadas son nuevas en v13).

**Fuera, declarado (12).** Estacionalidad peruana (Fiestas Patrias, Navidad, verano) · día de
la semana · fatiga creativa de los anuncios · tiempo de cobro de Culqi (capital de trabajo) ·
competencia que reacciona · elasticidad precio · quiebres de stock · disponibilidad del
motorizado · **reseñas de Google** · inflación de insumos · cierre sanitario o regulatorio ·
clima.

**Las dos que más podrían mover el resultado y no están: la estacionalidad y las reseñas de
Google.** La segunda es la única con evidencia causal de todo el expediente, y hoy la app pide
calificación tras la entrega pero esa calificación se queda adentro.

---

## 12 · Conclusiones

1. **S/5,000 en el mes 3 no ocurre.** 0.0% en las 12 combinaciones, y el motivo no es de
   marketing: en diciembre de 2026 el negocio lleva 2.5 meses abierto y no hay tiempo material
   para acumular la base. Conviene mover esa meta al mes 9-12 antes que perseguirla.
2. **Toda la respuesta cuelga de un número que nadie midió: cuántos clientes llegan solos.**
   Dos métodos independientes convergen dentro del 8% una vez alineado. De 0 a 3 por día, el
   negocio pasa de estar clavado en pérdida a tener una probabilidad real.
3. **La ventana sin publicidad de las primeras dos semanas no es una formalidad: es la medición
   más valiosa del primer año**, y solo se puede tomar una vez.
4. **S/10,000 es otro negocio.** Cabe en una persona (29.6 ped/día) solo sin publicidad; con
   pauta pasa al techo físico y obliga a contratar, rompiendo el supuesto de mano de obra en
   cero que sostiene todo el costeo del menú.
5. **La publicidad no es el motor, y ahora hay dos métodos que lo dicen.** El estructural
   porque el freno la apaga sola; Bass porque la imitación pesa 13 veces la adopción
   espontánea.
6. **Falta multiplicar por seguir existiendo.** El caso central de la clase de referencia baja
   cualquier probabilidad de arriba en un cuarto.
7. **Lo más barato que queda sin hacer son las reseñas de Google.** Cuesta cero, tiene la única
   evidencia causal del expediente, y está fuera del modelo — o sea que todo lo de arriba es
   antes de ese efecto.

---

## 13 · Lo que este documento no sabe

- El CAC sigue siendo `[AGENCIA]`, no medición propia.
- El ritmo orgánico es **puro supuesto recorrido**, no un dato. Es el parámetro que más manda.
- La saturación del CAC (+10% por cada 1,000 captados) decide si el año 2 existe y nadie la midió.
- La clase de referencia de este negocio **no existe**: no hay base de datos de sandwicherías
  de delivery unipersonales en Trujillo. Se usó la de restaurantes, que dispersa 0.9%–30%.
- Bass está usado **fuera de su dominio validado**; de él se toma la forma, nunca el nivel.
- El mercado alcanzable parte del censo 2017 y su factor más frágil (quién paga S/21+ por un
  sándwich a domicilio) es `[SIN MEDIR]` y se recorrió entre 10% y 50%.
