# SND//WCH — Cómo llegar a S/3,000 netos en el mes 3

**2026-09-13.** Motor: `modelo/modelo_v14.py`. Parámetros **re-derivados con investigación de
esta sesión**, no importados de los modelos v7-v13.

> **Es una SIMULACIÓN, no un pronóstico.** El negocio no ha abierto.

---

## 0 · Tres correcciones del dueño que cambian la estructura

**1. "Mano de obra = S/0" deja de ser regla.** Todo el costeo del menú —el techo de 45% de
insumos— se fijó asumiendo que el trabajo del dueño no cuesta nada. Eso hacía que el negocio
pareciera más rentable de lo que es, y que "neto" significara dos cosas distintas según quién
lo leyera. Ahora es explícito y se recorre.

**2. La publicidad es reinversión y no debe limitar.** El freno comparaba contra lo que deja
**un solo pedido** (S/13.63), y el CAC de Meta arranca por encima de eso en todo el rango: el
freno **cortaba siempre** y el negocio se quedaba sin su único canal de adquisición.

**3. Los números se re-derivan, no se heredan.** Un valor escrito en julio y marcado
`[SIN MEDIR]` en su propio comentario seguía gobernando la conclusión seis versiones después.

---

## 1 · Lo que encontré al re-derivar, y no coincide con lo heredado

### A favor: un cliente pide 2.41 veces, no una

[FUENTE propia] Genesys, delivery de comida: **solo el 45% de los clientes nuevos vuelve a
pedir**; de los que hacen un segundo pedido, **~85% hace un tercero**; pasado el tercero,
**60% sigue**. La cadena da **2.41 pedidos por cliente**.

El modelo heredado llegaba a **2.20** por un camino completamente distinto (un ajuste sBG sobre
Bloom/Paytronix). **Dos derivaciones independientes dentro del 10%** — es lo más cerca de una
validación a la que se puede llegar sin datos propios.

**Consecuencia:** el techo de CAC pasa de S/13.63 a **S/24.59** (2.41 × S/13.63 × 0.75 de
confianza, porque la repetición de *este* negocio no está medida). Ya está en el código y el
freno decide contra él; el del primer pedido sigue visible porque contesta otra pregunta.

### En contra: el CAC es 36% peor de lo que decía el modelo heredado

[FUENTE propia] Benchmarks 2026 de Meta: **CTR de 1.85% (Alimentos y Bebidas) a 2.97%
(Restaurantes)** y **CVR de 1.54% a 1.89%**. El modelo heredado tomó **el extremo optimista de
los dos a la vez** — y como el CAC es inversamente proporcional a ambos, el error no se suma:
se multiplica.

| | mejor caso | medio | peor caso |
|---|---|---|---|
| heredado | S/10.51 | **S/17.87** | S/25.23 |
| **re-derivado** (CPM de agencia peruana) | S/10.51 | **S/24.27** | S/49.70 |
| re-derivado (CPM de mercados emergentes) | S/23.12 | S/79.94 | S/186.38 |

⚠ **El CPM es la incertidumbre más grande de todo el expediente.** La agencia peruana dice
S/5-12; mis fuentes de mercados emergentes dan US$3-12 (≈S/11-45). **Los dos rangos casi no se
superponen.** No elegí uno: recorrí los dos. Al CPM peruano el CAC medio (S/24.27) queda
**justo debajo** del techo nuevo (S/24.59) — en el filo. Eso hace la medición de S/300 aún más
valiosa, no menos.

---

## 2 · La respuesta: cómo se llega a S/3,000 en el mes 3

Cada fila **agrega** una palanca a la anterior.

| escenario | P(m3 ≥ 3k) | neto m3 | neto m12 | neto m24 | pozo de caja |
|---|---|---|---|---|---|
| hoy, sin ninguna | 0.0% | S/108 | S/222 | S/10 | −S/324 |
| **+ avisas a 200 de tu red** | 0.0% | S/1,182 | S/253 | S/5 | S/2,524 |
| + 3 orgánicos/día (Google + QR) | **15.5%** | S/2,419 | S/1,662 | S/1,015 | S/3,025 |
| **+ referidos 25 por 100 pedidos** | **52.0%** | S/3,035 | S/3,476 | S/2,643 | S/2,992 |
| + pauta S/2,000 con reinversión 35% | 50.3% | S/3,009 | **S/4,058** | S/2,924 | S/2,950 |
| **+ avisas a 300 en vez de 200** | **79.9%** | S/3,820 | S/4,240 | S/2,891 | S/4,399 |

**El plan que llega a 80%:**

1. **Avísale a 300 personas de tu red el primer mes.** Es LA palanca, y no cuesta nada.
2. **3 clientes orgánicos por día** — Google Business Profile y el QR de la bolsa.
3. **25 referidos por cada 100 pedidos** (hoy el modelo asume 6). El mecanismo ya está.
4. **S/2,000 de pauta con 35% de reinversión** — no para diciembre, para el año que viene.

**Y no hay pozo de caja que financiar.** La caja acumulada nunca baja de cero en el escenario
bueno: el peor momento es **+S/4,399**. Eso responde la pregunta que nadie había hecho.

---

## 3 · ⚠ La publicidad NO mueve el mes 3, y gastar más lo empeora

| pauta de lanzamiento | P(m3 ≥ 3k) | neto m12 |
|---|---|---|
| S/0 | **85.0%** | S/3,663 |
| S/2,000 | 79.6% | S/3,737 |
| S/5,000 | 79.0% | S/3,829 |

**Más publicidad baja la probabilidad del mes 3.** El gasto se resta hoy y el cliente devuelve
en su **segundo** pedido, unas cinco semanas después: en diciembre solo alcanzas a pagar la
captación, no a cobrarla.

**Pero la reinversión sí paga, y a partir del mes 12:**

| reinversión | neto m12 | neto m24 | P(5k sostenido) |
|---|---|---|---|
| 0% | S/3,663 | S/2,678 | 0.4% |
| **35%** | **S/4,255** | **S/2,966** | **10.8%** |
| 60% | S/4,392 | S/2,945 | 10.0% |

⇒ **Sí, gasta en publicidad como reinversión — pero sabiendo que su efecto llega al año, no a
diciembre.** El mes 3 se gana con tu red, con Google y con los referidos.

---

## 4 · Qué significa "neto" ahora que tu trabajo cuesta

| lectura | P(m3 ≥ 3k) | neto m3 | neto m12 |
|---|---|---|---|
| **neto = lo que te llevas tú** (la de todos los modelos anteriores) | 79.4% | S/3,791 | S/4,214 |
| **neto = utilidad después de pagarte S/1,500** | 27.0% | S/2,296 | S/2,573 |

Las dos son legítimas y hay que elegir cuál es la meta. La primera dice *"me llevo S/3,000 a
casa"*; la segunda dice *"el negocio deja S/3,000 además de pagarme un sueldo"* — y esa es la
que hay que usar el día que contrates, porque es la única que compara tu trabajo con el de un
empleado al mismo precio.

### ⚠ Corrijo algo que escribí mal en el primer borrador de este documento

Había escrito que, con tu trabajo dentro del costo, **el techo de 45% de insumos del menú queda
mal calibrado y algunos Signatures dejarían de cumplirlo**. Eso está mal, y el error importa
porque llevaría a subir precios sin motivo.

Tu sueldo es un **costo de periodo**, no un costo por sándwich: lo pagas trabajes 10 o 30
pedidos ese día. Para decidir si un producto vale la pena en la carta, lo que manda es el costo
**marginal** —lo que cuesta hacer uno más— y ahí tu trabajo pesa casi nada mientras estés lejos
del techo de 40 pedidos/día. Por eso el 45% sigue siendo el criterio correcto para el menú, y
por eso el techo de CAC tampoco cambia: el cliente marginal sigue dejando S/13.63.

Lo que sí cambia —y es lo de la tabla de arriba— es **cuántos pedidos hacen falta**: tu sueldo
entra junto a los costos fijos, así que la meta sube de 9.5 a 13.6 pedidos diarios. Es un
problema de volumen, no de precios.

El día que estés cerca del techo físico sí habría que repartir tu tiempo entre productos, porque
ahí hacer un sándwich lento significa no hacer otro. Hoy estás a un cuarto de ese techo.

---

## 5 · Lo que construí en esta sesión para destrabar cada punto

| traba | qué hice |
|---|---|
| El freno apagaba la publicidad siempre | Techo por **valor de vida** (`cacTechoValorVida`), con factor de confianza. Los dos techos se muestran. |
| El aviso a la red no existía como mecanismo | Bloque **"Avísale a tu gente"** en Marketing, primero de la sección: link marcado, mensaje listo, bono interpolado. |
| Un lanzamiento de 200 envenenaba la línea base | Promedio **recortado por arriba** (20%) + exclusión de fuentes de ráfaga. Sin eso, el freno mataba la publicidad meses después por una fiesta de apertura. |
| El bono de bienvenida estaba escrito a mano | Interpolado + `npm run parity` (106 comprobaciones). |
| La palanca vivía detrás de un `return` de error | El bloque sobrevive aunque el brief semanal no cargue. |

---

## 6 · Lo que este documento no sabe

- **El CPM es un rango de 1:9** entre mis dos fuentes, y de él cuelga si la publicidad paga.
- **La repetición (2.41) es de industria**, no de este negocio. Por eso el techo lleva 0.75.
- **El ritmo orgánico es supuesto recorrido**, no medido. La ventana sin publicidad lo mide.
- **300 personas en tu red es un supuesto tuyo**, no mío: si son 80, la fila de 79.9% no aplica.
- **El decaimiento del orgánico (3% al mes)** es método, no medición, y es lo que hace caer el
  mes 24 respecto del 12.
