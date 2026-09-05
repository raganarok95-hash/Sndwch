# SND//WCH — Proyección v11 · 3 y 6 meses · 20,000 escenarios

**2026-09-05.** `modelo/modelo_v11.py` + `modelo/modelo_v11_metas.py`. Apertura 12 de octubre
de 2026 (el techo que puso el dueño). Lunes cerrado.

**Meta [decisión del dueño 2026-09-02]:** neto ≥ **S/4,000** desde el mes 3 y ≥ **S/5,000**
desde el mes 6, **todos los meses**. No es un pico: basta un mes por debajo para romperlo.

---

## 0. El resultado, sin rodeos

> **La meta, tal como está escrita, tiene 0.0% de probabilidad en 20,000 escenarios y en
> toda la rejilla de publicidad —de S/0 a S/20,000 al mes.** No es que sea difícil: es que
> ninguna cantidad de publicidad la alcanza, porque la publicidad no es el cuello de botella.

Lo que sí dice el modelo:

| | mes 3 (dic-26) | mes 6 (mar-27) |
|---|---|---|
| neto mediano, al mejor presupuesto | **−S/1,822** | **+S/730** |
| meta | S/4,000 | S/5,000 |
| probabilidad de alcanzarla | **0.1%** | **7.4%** |
| pedidos/día (mediana) | ~19 | ~27 |

**El equilibrio (neto ≥ 0) llega en febrero de 2027**, o sea el mes 5 — no el mes 3.

---

## 1. Dos correcciones que explican por qué esto no se veía antes

### ⚠ La contribución por pedido estaba inflada un 14%

El v8, el v9 y el v10 proyectaron con **S/16.42 por pedido**. Ese número es el promedio de
los **cinco Signatures y de ningún ARMA EL TUYO**. Un BYO deja ~S/6 menos que un Signature.

Con la mitad de los pedidos por BYO —lo único honesto mientras nadie mida la mezcla real— la
contribución es **S/14.11**. Son S/2.31 menos por pedido, arrastrados por tres modelos
seguidos. Acá se calcula desde los componentes reutilizando `comparativa_menu.contrib`, para
que no existan dos fuentes del mismo número.

### ⚠ Ningún modelo anterior tenía la fase de aprendizaje de Meta

Meta necesita **~50 conversiones por conjunto de anuncios cada 7 días** (≈217 al mes) para
salir de la fase de aprendizaje. Por debajo, la entrega es más cara.

Con un CAC limpio de **S/17.87** (CPM medio), **salir de aprendizaje cuesta S/3,885/mes**.
Ese es el piso real de publicidad, y no estaba en ningún modelo. Por debajo de esa cifra el
dinero rinde peor por sol gastado.

*El castigo por no salir (asumido en +30% sobre el CAC) es una **asunción declarada, no una
medición**: Meta dice "menos eficiente" y no publica un número. Se recorre entero en el
modelo — con 1.00 el mecanismo se apaga.*

---

## 2. La respuesta sobre publicidad

**Óptimo: S/6,000–8,000 al mes.** Pero el hallazgo importante es otro:

| publicidad/mes | neto mes 6 (P50) | P(mes 6 ≥ meta) | ¿sale de aprendizaje? |
|---|---|---|---|
| S/2,000 | −S/326 | 0.0% | no |
| S/4,000 | +S/226 | 2.0% | 42% de las veces |
| **S/6,000** | **+S/725** | **7.4%** | siempre |
| **S/8,000** | **+S/837** | **7.4%** | siempre |
| S/12,000 | +S/775 | 11.5% | siempre |
| S/20,000 | — | 12.2% | siempre |
| S/14,000 | −S/972 | — | siempre |

**Triplicar el presupuesto de S/6,000 a S/20,000 mueve la probabilidad de 7.4% a 12.2%.** Y
pasando de S/8,000 el neto **empieza a caer**: la publicidad se resta del mes en curso y el
cliente devuelve su valor en los meses siguientes, así que existe un óptimo intermedio y
pasarse empeora el resultado.

> **La publicidad no es la palanca.** Es una condición de entrada —hay que superar el piso de
> S/3,885 para que el dinero no se desperdicie— pero por encima de eso, gastar más no compra
> la meta.

### La caja que hay que tener antes de empezar

Nadie llega al equilibrio sin aguantar los meses de pérdida. Esta es la pérdida acumulada
máxima antes de dar vuelta:

| publicidad/mes | caja necesaria (P50) | caja necesaria (mal caso) | equilibrio |
|---|---|---|---|
| S/2,000 | S/6,619 | S/12,756 | sep-27 |
| S/4,000 | S/7,327 | S/17,800 | mar-27 |
| **S/6,000** | **S/8,640** | **S/21,289** | **feb-27** |
| S/8,000 | S/10,844 | S/27,117 | feb-27 |
| S/12,000 | S/17,799 | S/43,291 | mar-27 |

**Con S/6,000/mes de publicidad hay que poder perder ~S/8,600 antes de que el negocio dé
vuelta, y ~S/21,000 si sale mal.** Esa es la decisión real, y es anterior a cualquier
discusión de marketing: si esa caja no existe, el plan no es ejecutable a ese presupuesto y
hay que ir por el de S/4,000 aceptando un mes más de espera.

---

## 3. Qué habría que mover para llegar de verdad

Cada palanca sola, hasta que la meta del mes 6 sea una moneda al aire:

| palanca | hoy | tendría que llegar a | ¿alcanzable? |
|---|---|---|---|
| **CAC** | S/17.87 | **S/8** (−55%) | difícil, pero es la más potente |
| **Contribución/pedido** | S/14.11 | **S/24** (+70%) | no sin romper el precio |
| **Viralidad** | 6/100 pedidos | **60/100** | no sola |
| **Publicidad** | S/6,000 | — | **nunca cruza**, tope ~12% |

**El CAC es la única palanca con recorrido real**, y es exactamente lo que el sistema de
video con los hermanos ataca: mejor creativo → mejor CTR → menor CAC. No es marketing
decorativo; es la variable de la que cuelga todo el plan.

### La combinación que sí funciona

| escenario | contrib. | CAC | viral | neto m6 (P50) | P(mes 6) | P(sostener) |
|---|---|---|---|---|---|---|
| hoy | 14.11 | 17.87 | 6/100 | S/713 | 7.4% | 0.0% |
| + mezcla 65% Signature | 14.96 | 17.87 | 6/100 | S/1,123 | 9.7% | 0.1% |
| + CAC 30% mejor | 14.96 | 12.51 | 6/100 | S/3,944 | 38.1% | 6.4% |
| + viralidad 25/100 | 14.96 | 12.51 | 25/100 | S/5,868 | 63.4% | 15.7% |
| + viralidad 40/100 | 14.96 | 12.51 | 40/100 | S/7,735 | 75.2% | 27.4% |
| **+ contribución S/18** | **18.00** | **12.51** | **40/100** | **S/11,724** | **94.3%** | **57.2%** |

Ninguna sola alcanza. **Las cuatro juntas llevan la probabilidad de sostener el camino de
0.0% a 57.2%.**

---

## 4. Exactamente qué hacer

En orden de impacto por esfuerzo, todo derivado de las tablas de arriba.

**1 · Medir el CAC real la primera semana.** Los tres números de los que cuelga todo
—CPM S/5–12, CTR 2.97%, CVR 1.89%— salen de blogs de agencia, no de medición auditada. Con
CAC real de S/8 la meta es probable; con S/25 no existe. Requiere los **tres secrets de Meta**
(`supabase secrets set META_PIXEL_ID … META_CAPI_TOKEN …`), que siguen sin poner. **Es el
bloqueo número uno del negocio entero**: sin píxel no hay CAC, y sin CAC nada de esto se
puede evaluar.

**2 · Empujar la mezcla hacia Signature.** Pasar de 50% a 35% de pedidos por ARMA EL TUYO
vale +S/0.85 por pedido y sube el neto del mes 6 un 58%. Se hace con orden de aparición,
badges y el pitch — no requiere tocar precios. Y `retention_report` ya devuelve
`attach.size30Pct`, así que la mezcla real se puede medir desde el primer mes.

**3 · Subir la viralidad de 6 a 25–40 por cada 100 pedidos.** Es la palanca que el marketing
sí controla y la más barata: el referido cuesta **S/7.65** contra **S/17.87** del CAC pagado.
Concretamente, y todo respaldado en `MARKETING_HALLAZGOS.md`:
- **Progreso dotado**: regalar 1 pedido de avance al registrarse (34% de finalización contra
  19% con la tarjeta vacía). Mejor que bajar el umbral del menú secreto.
- **Reclamar el perfil de Google Business**: +1 estrella = +5–9% de ingresos, causal y solo
  para independientes. Cuesta cero.
- **El QR de la bolsa** vale más que el menú secreto: lo que sostiene el boca a boca son los
  disparadores recurrentes, no lo "interesante".

**4 · Subir la contribución a S/18.** Los huecos ya identificados y sin decidir: el
**embutido 15CM al 48.2%** (cuesta S/4.29, el insumo más caro, y se cobra igual que el atún
que ahora cuesta S/3.25) y el **pollo pasado por 14 céntimos**. Falta cotizar embutido,
albóndiga, envase de bebida y queso.

**5 · Publicidad: S/6,000/mes, un solo conjunto, y no más.** Un solo conjunto de anuncios con
todo el presupuesto — repartirlo produce varios aprendizajes que nunca se completan. Subir
como máximo 20–30% cada 3–4 días: un cambio mayor reinicia el aprendizaje.

**6 · Y la conversación que hay que tener: la meta o la fecha.** Con la unidad económica
actual (LTV/CAC ≈ 2.2, que **sí funciona**) el negocio llega al equilibrio en **feb-27** y a
un neto estable de ~S/1,100/mes. Para S/5,000 sostenidos hace falta la combinación completa
de arriba, y aun así con 57% de probabilidad. **La meta del mes 3 no es alcanzable de ninguna
manera** — en el mes 3 el negocio todavía está perdiendo plata en todos los escenarios.

---

## 5. Lo que este modelo no sabe

- **El CPM, CTR y CVR son de blogs de agencia.** Todo el CAC —y con él el óptimo de
  publicidad y la meta entera— cuelga de ahí.
- **El castigo por no salir de aprendizaje es una asunción**, no un dato.
- **La mezcla Signature/BYO no está medida**; se asume mitad y mitad.
- No hay estacionalidad peruana, ni fatiga creativa, ni tiempo de cobro de Culqi, ni
  competencia que reaccione.
- **No existe ni un solo dato público de una sandwichería o delivery en Trujillo.**

Todo lo de acá es una **simulación sobre referencias externas**, no un pronóstico con
historial propio. El negocio no ha abierto: los ~10 pedidos que hay en la base son de prueba.
Se reconstruye con datos reales apenas haya volumen que medir.
