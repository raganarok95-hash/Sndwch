# SND//WCH — Proyección a 3 y 6 meses, y el camino a S/5,000 sostenidos

**2026-09-06.** 20,000 escenarios. Motor: `modelo/modelo_v11.py` sin tocar su mecánica —
lo que cambió son las **entradas**, porque el catálogo cambió. El análisis de la meta está
en `modelo/meta_5000_sostenido.py`, que extiende el horizonte a 24 meses.

> **Esto es una SIMULACIÓN, no un pronóstico.** El negocio no ha abierto. Todo cuelga de un
> CAC que sale de blogs de agencia peruanos, no de medición auditada. Se reconstruye con
> datos reales apenas haya ventas.

---

## Lo que cambió desde la v11

| entrada | v11 (05-sep) | v12 (06-sep) | por qué |
|---|---|---|---|
| Contribución por pedido | S/14.11 | **S/14.13** | entró el pavo al armador; salió el chai; bebidas costeadas por medio litro |
| Bebidas en el catálogo | 4 | **3** | el chai quedaba en 42.5% de costo |
| Proteínas armables | 3 | **4** | el pavo, sin merma de cocción |
| Apertura | 12-oct-26 | 12-oct-26 | sin cambio |

**La contribución no se movió.** El pavo agrega una proteína de margen ajustado (44.7%) y el
medio litro encarece la bebida; los dos efectos se cancelan contra la salida del chai. Es un
resultado útil por sí solo: **el trabajo de menú de los últimos dos días arregló el margen
parte por parte —ya nada pasa el techo de 45%— pero no movió el promedio.**

---

## 1 · La proyección a 3 y 6 meses

Neto mensual, mediana de 20,000 escenarios. Mes 3 = **dic-26**, mes 6 = **mar-27**.

| pauta/mes | neto mes 3 | neto mes 6 | P(mes 3 ≥ S/4,000) | P(mes 6 ≥ S/5,000) | P(sostener el camino) |
|---|---|---|---|---|---|
| S/2,000 | −1,063 | −328 | 0.0% | 0.0% | **0.0%** |
| S/4,000 | −1,365 | +244 | 0.1% | 1.8% | **0.0%** |
| **S/6,000** | −1,451 | **+723** | 1.0% | 7.2% | **0.0%** |
| S/8,000 | −1,808 | +828 | 2.2% | 7.9% | **0.0%** |
| S/14,000 | −3,285 | −958 | — | — | 0.1% |

- **Equilibrio (neto ≥ 0): feb-27**, el mes 5. Igual en las tres pautas.
- **Óptimo de publicidad: S/8,000/mes** por neto del mes 6 — pero deja S/846, no S/5,000.
- **Caja que hay que aguantar antes del equilibrio:** los cuatro primeros meses son negativos
  en todos los escenarios.

**La probabilidad de sostener S/4,000 desde el mes 3 y S/5,000 desde el mes 6 es 0.0% en toda
la rejilla.** No es que sea difícil: con estos números no ocurre.

---

## 2 · La meta de S/5,000 sostenidos

"Sostenido" acá es duro: **el neto tiene que quedar en S/5,000 o más ese mes y todos los que
siguen**. Un pico no cuenta. Horizonte de 24 meses, porque preguntar "¿cuándo?" con una
ventana de 12 es preguntar mal.

### Con publicidad sola no se llega. Con ninguna cantidad.

| pauta/mes | neto m6 | neto m12 | neto m24 | ¿sostiene? |
|---|---|---|---|---|
| S/4,000 | +313 | +726 | −70 | no |
| S/6,000 | +745 | +1,156 | −342 | no |
| S/10,000 | +764 | +871 | −1,651 | no |
| S/20,000 | −1,948 | −3,483 | −7,676 | no |

**Comprar más clientes al mismo CAC compra también más costo.** Lo que falta no es volumen.

> ⚠ **La caída del segundo año NO es una predicción — es un supuesto sin medir.** El modelo
> asume que el CAC sube 10% por cada 1,000 clientes captados (`SATURACION_POR_MIL`). Apagado,
> la curva se aplana en ~S/3,400 en vez de caer:
>
> | saturación | m6 | m12 | m18 | m24 |
> |---|---|---|---|---|
> | 0.00 | 1,599 | 3,337 | 3,464 | **3,429** |
> | 0.10 *(el modelo)* | 726 | 1,081 | 275 | **−332** |
>
> Verificar ese ritmo con datos reales es lo que decide si el año 2 existe.

### Cada palanca sola, y cuánto tendría que moverse

Pauta en S/6,000. Se mueve una cosa y el resto queda igual.

| palanca | valor que hace falta | desde cuándo sostiene | P(sostiene) |
|---|---|---|---|
| **CAC** | S/17.87 → **S/6** (−66%) | nov-26 | 25.6% |
| **Contribución** | S/14.13 → **S/28** (×2) | ene-27 | 27.1% |
| **Viralidad** | 0.06 → **0.40** por pedido | jun-27 | 20.1% |

Ninguna es realista sola. La contribución al doble significa duplicar los precios; un CAC de
S/6 es un tercio del que la industria reporta.

> ⚠ **Por encima de 0.4 referidos por pedido el modelo deja de valer.** Compone sin techo de
> mercado: a 0.6 da 50,515 clientes captados y a 0.9 da 707,870, en una ciudad de ~1M de
> habitantes. Lo que sobrevive es **la dirección** —la viralidad es la palanca más potente—
> no la magnitud.

### La combinación que sí llega

Cada fila **agrega** una cosa a la anterior.

| escenario | contrib | CAC | viral | neto m12 | neto m24 | sostiene desde | P(sost) |
|---|---|---|---|---|---|---|---|
| hoy | 14.13 | 17.87 | 0.06 | 1,192 | −304 | **no llega** | 0.0% |
| + mezcla 65% Signature | 14.95 | 17.87 | 0.06 | 1,617 | 63 | no llega | 0.0% |
| + bebida en 40% de pedidos | 15.43 | 17.87 | 0.06 | 1,837 | 221 | no llega | 0.0% |
| + CAC 30% mejor | 15.43 | 12.51 | 0.06 | 4,676 | 2,286 | no llega | 0.0% |
| **+ viralidad 25/100** | 15.43 | 12.51 | 0.25 | **7,162** | **5,334** | **feb-27** | 17.6% |
| + viralidad 40/100 | 15.43 | 12.51 | 0.40 | 13,604 | 12,434 | ene-27 | 35.3% |

**El salto está en la viralidad.** Sin ella, mejorar la mezcla, el attach de bebida y el CAC
un 30% **no alcanza** — llega a S/4,676 en el mes 12 y se cae después. Con 25 referidos por
cada 100 pedidos, la meta se sostiene desde **febrero de 2027**.

---

## 3 · El número que reordena todo

S/5,000 traducido a pedidos. Esto **no depende de ningún supuesto de marketing**: es
aritmética sobre la contribución y los costos fijos.

| contribución | sin pauta | con S/3,000 | con S/6,000 |
|---|---|---|---|
| **S/14.13** *(hoy)* | **15.5 ped/día** | 24.0 ped/día | 32.5 ped/día |
| S/16.00 | 13.6 | 21.1 | 28.5 |
| S/18.00 | 12.1 | 18.7 | 25.3 |
| S/20.00 | 10.8 | 16.8 | 22.7 |

**Sin publicidad, S/5,000 netos son 15.5 pedidos al día.** El techo de una persona sola son
40. O sea que **la meta cabe holgadamente dentro de la capacidad física del negocio** — lo
que no cabe es pagarla con publicidad a S/17.87 el cliente: ahí la misma meta pasa a 32.5
pedidos diarios, y **la mitad de ese esfuerzo va a pagar la pauta, no al dueño**.

Ese es el hallazgo: **la publicidad no es el camino a S/5,000, es lo que lo encarece al
doble.** Sirve para arrancar —sin ella no hay primeros clientes— pero el negocio llega a la
meta el día que la mayoría de los clientes nuevos NO se compran.

---

## 4 · Qué hacer, en orden

1. **Medir el CAC real la primera semana.** Los tres secrets de Meta
   (`docs/CONFIGURAR_META.md`) están sin poner. Sin eso todo esto sigue siendo aritmética
   sobre un blog de agencia — y el CAC es el número del que cuelga la respuesta entera.
2. **Empujar el referido hasta 25 por cada 100 pedidos.** Es el único escalón que convierte
   "no llega" en "llega en feb-27", y ya está construido: cuesta S/7.65 contra S/17.87, o sea
   **43% de lo que cuesta comprar el mismo cliente**. Hoy la escalera existe pero nadie ha
   medido cuántos convierten.
3. **Subir el attach de bebida de 25% a 40%.** Vale +S/0.48 por pedido, las bebidas están al
   19-32% de costo, y no requiere adquirir a nadie.
4. **Empujar la mezcla hacia Signature (65/35).** Vale +S/0.82 por pedido. Un Signature deja
   ~S/5.50 más que un armado.
5. **Google Business Profile.** Gratis, y +1 estrella = +5-9% de ingresos, causal y solo para
   independientes. Trae pedidos que no pasan por la subasta de Meta.
6. **Medir el ritmo de saturación.** Decide si el año 2 existe, y hoy es una suposición.

**Lo que NO hay que hacer:** subir la pauta buscando la meta. El modelo la busca en toda la
rejilla hasta S/20,000/mes y el resultado empeora — a S/14,000 el neto ya es negativo en
todos los horizontes.

---

## 5 · Lo que este modelo no sabe

- **El CAC** (CPM S/5-12, CTR 2.97%, CVR 1.89%) es `[AGENCIA]`, no medición auditada.
- **La mezcla Signature / ARMA EL TUYO** no está medida; se asume mitad y mitad. Mover ese
  supuesto 15 puntos mueve la contribución casi un sol.
- **El attach de bebida** (25%) tampoco está medido, y es de las palancas más baratas.
- **El castigo por no salir de la fase de aprendizaje** de Meta (30% más caro) es una
  asunción declarada.
- **El modelo no tiene techo de mercado**: por encima de 0.4 referidos por pedido produce
  cifras imposibles.
- No hay estacionalidad peruana, ni fatiga creativa, ni competencia que reaccione.
- **No existe un solo dato público de una sandwichería o delivery en Trujillo.**
