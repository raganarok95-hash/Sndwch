> ⚠ **DOCUMENTO SUPERADO (2026-09-02).** Sus conclusiones quedan retiradas: este modelo era
> determinista (un número por mes, sin varianza), clavaba la retención en el peor valor del
> rango, suponía que el 100% de los clientes se compran con publicidad, y trataba el reparto
> como una fuga del margen cuando lo paga el cliente. **Ver `PREDICCION_V9.md`.**
> Se conserva porque el rastro de en qué se equivocó cada versión es parte del método.

# SND//WCH — Cómo llegar a S/10,000 netos al mes

**Fecha:** 2026-09-02 · **Modelo:** `modelo/modelo_v8.py` · **Salida:** `modelo/modelo_v8_salida.txt`

---

## 0. Retiro la respuesta anterior

La primera versión de este documento decía: *"sí se puede: con 1.25 sándwiches por pedido el
mes 6 da S/10,571"*. El dueño preguntó lo único que había que preguntar: **¿estás asumiendo
que esa idea sí o sí dará resultados?**

Sí lo estaba asumiendo, y estaba mal.

**Ese 1.25 no era un dato ni un pronóstico: era un número que despejé hacia atrás para que la
cuenta cerrara, y después lo presenté como plan.** No existe una sola fuente —ni interna ni
externa— de cuánto sube el attach un cambio en el carrito. Es exactamente el defecto que este
repositorio ya pagó dos veces: el CAC de S/134 y el "S/128-141 por publicidad", ambos escritos
sin fuente y usados después como si fueran medición.

Esta versión audita sus propios supuestos antes de calcular nada.

---

## 1. Auditoría de supuestos

### Lo que está medido y se puede usar
| | |
|---|---|
| Contribución por pedido **S/16.42** | `MENU_FINANCIAL_ANALYSIS.md`, con merma de cocción y pan real |
| Costos fijos **< S/500/mes** | opera desde casa, sin planilla |
| **40 pedidos/día** por persona | cocina por tandas, en servicio solo arma |
| Comisión Culqi, tarifas de zona, horario | todo en el código, en producción |

### Lo que es benchmark prestado (de EE.UU., no de Trujillo)
- **22.6%** hace un 2º pedido → 2.34 pedidos por cliente adquirido (Bloom Intelligence)
- **33 días** entre pedidos (Paytronix)
- **CAC Meta Perú S/10.51 – S/25.23** (ibo.pe + get-ryze + IGV)

### Lo que yo inventé en la primera versión y no debió entrar
- ✗ **"1.25 sándwiches por pedido".** Despejado hacia atrás, presentado como plan.
- ✗ **"1.00 sándwiches por pedido" como punto de partida.** Tampoco está medido — el negocio
  no ha abierto. **Los dos extremos de mi palanca eran inventados.**
- ✗ **Aplicar los S/16.16 de contribución MEDIA al sándwich MARGINAL.** El segundo sándwich de
  un pedido no tiene por qué ser el promedio del catálogo, y si se empuja con combo o
  descuento, contribuye menos.
- ✗ **Presentar como "plan" un escenario que corría al 100% de la capacidad de una persona
  todos los días del mes.** Eso no es un plan: es un mes sin un solo día malo.

### Lo que sigue sin modelar, y ahora importa más que todo lo demás
- ⚠ **El CAC se supone constante a cualquier nivel de gasto.** Es falso y se sabe que es
  falso: la audiencia barata se agota y el costo sube.
- ⚠ **No hay arranque en frío.** El modelo asume que Meta entrega 800-1,000 clientes en el
  **primer mes** a una marca que nadie conoce, al mismo CAC que una marca madura. El CAC
  temprano suele ser peor. Es la parte más dudosa de todo el modelo.
- ⚠ **No hay tamaño de mercado.** El modelo adquiriría 50,000 clientes en Trujillo sin
  inmutarse.
- ⚠ **Los fijos se quedan en S/500** aunque el volumen se multiplique por veinte.
- ⚠ **El reparto se supone neutro.** Cobras por zona y te cobran por kilómetro (ver §5).

---

## 2. El caso base: solo con lo medido, sin techo de producción

Con tu decisión de que **la producción no es una traba** (se contrata a S/1,500 por cada 40
pedidos/día extra; tú eres la persona 1 y no cobras sueldo), y **sin ninguna palanca
inventada** — cada pedido lleva lo que hoy lleva:

| CAC | ads/mes | pedidos | ped/día | personas | clientes nuevos/mes | neto mes 6 |
|---|---|---|---|---|---|---|
| **S/10.51** (mejor) | S/8,579 | 1,253 | 52.2 | 2 | 816 | **S/10,000** |
| **S/13.50** (central) | S/13,830 | 1,573 | 65.5 | 2 | 1,024 | **S/10,000** |
| S/18.00 | S/37,430 | 3,193 | 133.0 | 4 | 2,079 | S/10,000 |
| S/25.23 (peor) | — | — | — | — | — | **imposible a cualquier gasto** |

> **La restricción nunca estuvo en la cocina.** Liberada la producción, el objetivo se alcanza
> con **2 personas y sin inventar ninguna palanca de producto**. Lo que decide todo es el CAC
> — y el CAC es justo el número que nadie ha medido.

Y el negocio se autofinancia: es positivo desde el primer mes en los dos escenarios buenos.

| mes | pedidos (CAC 10.51) | neto | acumulado |
|---|---|---|---|
| sep-26 | 816 | S/2,824 | S/2,824 |
| oct-26 | 1,001 | S/7,353 | S/10,177 |
| nov-26 | 1,100 | S/7,476 | S/17,654 |
| dic-26 | 1,166 | S/8,561 | S/26,215 |
| ene-27 | 1,215 | S/9,367 | S/35,582 |
| **feb-27** | **1,253** | **S/10,002** | **S/45,584** |

El flotante que hay que poner por delante es **más o menos un mes de publicidad**.

---

## 3. La pregunta que el modelo no puede responder

| CAC | nuevos/mes | nuevos por día abierto | clientes distintos en 6 meses |
|---|---|---|---|
| S/10.51 | 816 | 34 | 4,897 |
| S/13.50 | 1,024 | 43 | 6,147 |
| S/18.00 | 2,079 | 87 | 12,477 |

**Este es el número que hay que mirar a los ojos.** Sostener el objetivo exige conseguir entre
**816 y 1,024 clientes nuevos cada mes, todos los meses** — unas 34 a 43 personas distintas por
día abierto, sin repetir. Y en el **primer mes**, no después de un año de marca.

No sé si Trujillo da eso a ese precio. **Nadie lo sabe todavía, y cualquiera que te dé una
cifra hoy la está inventando.** Es LA incógnita del plan, y se despeja midiendo el CAC real en
la primera semana de publicidad — no discutiéndola ahora.

---

## 4. La palanca de sándwiches por pedido, en su lugar correcto

No está en el caso base porque no hay evidencia de que funcione. Lo que sí se puede decir es
**cuánto valdría si funcionara**, y así decidir si vale la pena intentarlo.

Con la contribución marginal **castigada un 25%** (S/12.12 en vez de S/16.16), porque un
segundo sándwich empujado con combo contribuye menos que el promedio:

| sándwiches/pedido | ads/mes necesarios | ahorro vs 1.00 | personas |
|---|---|---|---|
| 1.00 | S/13,830 | — | 2 |
| **1.05** | S/12,812 | **S/1,018/mes** | 2 |
| 1.10 | S/11,934 | S/1,896/mes | 2 |
| 1.25 | S/9,898 | S/3,932/mes | 2 |
| 1.50 | S/6,744 | S/7,086/mes | **1** |

> **Es real pero no es el plan.** Un +5% —objetivo modesto y medible— ahorra S/1,018 de
> publicidad **todos los meses** sin cambiar nada más. Pero el objetivo **no depende de ella**:
> el caso base ya llega sin inventar nada, y esta palanca solo lo abarata. Ese es el lugar
> correcto para una idea sin evidencia.

Y lo primero no es construirla: es **medir cuánto vale hoy**. `retention_report` ya devuelve
`attach.avgUnits`. El día 1 de ventas reales ese número existe.

---

## 5. El piso honesto

Aplicando la corrección de Flyvbjerg (los pronósticos de demanda se sobreestiman +106%;
castiga al **pronosticador**, no al negocio):

| CAC | ¿llega al mes 6? |
|---|---|
| S/10.51 | solo con S/182,392/mes de publicidad — sin sentido |
| S/13.50 | **no, a ningún gasto** |
| S/25.23 | **no, a ningún gasto** |

**El mes 6 depende por completo de que el CAC real de Trujillo caiga en el buen extremo de un
rango prestado Y de que la demanda se parezca al benchmark.** Ninguna de las dos está medida,
y son independientes: pueden fallar las dos a la vez.

---

## 6. La única fuga medida que nadie mira: el reparto

**Te cobran por kilómetro (S/2/km). La app cobra por zona**, un monto plano que elige el cliente.

| zona | cobra | km que cubre |
|---|---|---|
| cerca | S/6 | 3.0 km |
| media | S/8 | 4.0 km |
| lejos | S/12 | 6.0 km |
| muy lejos | S/15 | 7.5 km |

`CLAUDE.md` afirma que *"el negocio no gana ni subsidia el reparto"*. **Eso solo es cierto si
la zona coincide con los kilómetros reales, y nadie lo ha comprobado.**

Al volumen del objetivo (1,573 pedidos/mes):

| descuadre por pedido | pérdida/mes | % del objetivo |
|---|---|---|
| S/0.50 | S/787 | 7.9% |
| S/1.00 | S/1,573 | 15.7% |
| **S/2.00** | **S/3,146** | **31.5%** |
| S/3.00 | S/4,719 | 47.2% |

A diferencia de todo lo demás de este documento, **esto no es un pronóstico**: es una fuga que
o existe o no existe hoy, y se resuelve con una libreta y dos semanas de anotar kilómetros.

---

## 7. Qué se puede afirmar y qué no

**Se puede afirmar:**
1. El objetivo **no necesita ninguna palanca de producto inventada**.
2. La producción **no es la restricción** — se resuelve contratando.
3. El negocio es **cash-positivo desde el mes 1** en los escenarios buenos.
4. **El CAC es el único número que decide** si esto funciona.

**No se puede afirmar:**
1. Que se llegue en el mes 6. Depende de un CAC no medido y de una demanda no medida.
2. Que Trujillo tenga 800-1,000 clientes nuevos por mes a ese precio.
3. Que el CAC del mes 1, con una marca desconocida, se parezca al de un anunciante maduro.
4. Que el reparto esté cuadrado.

**La primera tarea no es construir nada: es medir el CAC real.** Todo lo demás es aritmética
sobre benchmarks prestados hasta que ese número exista.
