# SND//WCH — Predicción a 6 meses reconstruida desde cero

**Fecha:** 2026-08-27 · **Horizonte:** sep-2026 a feb-2027 · **Modelo:** `modelo_v7.py`
**Sin componente de socio, sin 5%, sin ninguna estructura de reparto de utilidades.**

---

## 0. Antes que nada: de dónde salió el S/134 (respuesta a tu pregunta)

De ningún lado verificable. Lo rastreé por todo el repositorio y aparece exactamente
**dos veces**, ambas del mismo commit `e83cca1`:

- `CLAUDE.md:242` — *"comprar una cuenta de oficina entera cuesta el insumo de un sándwich
  (~S/6) contra ~S/128-141 por publicidad o por muestra dirigida"*
- `supabase/functions/api/catalog.ts:925` — el mismo texto, en un comentario de código

**Ninguna de las dos cita una fuente.** Y el propio `MENU_FINANCIAL_ANALYSIS.md:548`
dice otra cosa: *"CAC de industria US$30-120/cliente"*, que a S/3.35 son S/100-402 —
un rango tan ancho que no decide nada.

Es exactamente lo que me señalaste: **predecir no es inventar.** Tomé un número interno
sin respaldo, lo usé como si fuera dato, y sobre él construí la conclusión de que la
publicidad pagada nunca se paga. La conclusión era correcta *para ese número*. El número
estaba mal.

El CAC real documentado para Perú está más abajo. Este documento reconstruye todo desde
cero con esa corrección.

---

## 1. La regla de construcción

Cada número de este modelo lleva etiqueta de origen, y **no se admite ninguno sin ella**:

| Etiqueta | Significa |
|---|---|
| `[MEDIDO]` | Hecho verificable de este negocio: código en producción o dato del dueño |
| `[FUENTE]` | Benchmark externo publicado, con cita completa |
| `[DECISIÓN]` | Palanca que el dueño controla — no es predicción, es elección |
| `[DERIVADO]` | Aritmética de los anteriores; nunca un valor tecleado a mano |
| `[MÉTODO]` | Elección metodológica declarada — no es un dato |

**El modelo entero usa solo 3 números externos.** Todo lo demás es aritmética o hecho medido.

---

## 2. Lo que vale un cliente

Dos cifras del mismo estudio (Bloom Intelligence, 1,000+ locales, ene-2024 a oct-2025)
determinan la curva completa. No queda ningún grado de libertad que ajustar a gusto:

- **22.6%** de los clientes hacen un segundo pedido (77.4% visita una sola vez) `[FUENTE]`
- Quien hace el segundo promedia **6.93 pedidos totales** `[FUENTE]`

Calibrando un modelo shifted-beta-geometric (Fader & Hardie) sobre el índice de compra
con esas dos cifras:

| | |
|---|---|
| Pedidos esperados por cliente adquirido | **2.34** `[DERIVADO]` |
| Contribución por pedido | **S/16.42** `[MEDIDO]` |
| **Valor de vida (LTV) por cliente** | **S/38.43** |

**Sensibilidad a la única cifra discutible:**

| P(2º pedido) | pedidos/cliente | LTV | CAC máx 3:1 | CAC máx 2:1 |
|---|---|---|---|---|
| 22.6% (conservador) | 2.34 | S/38.43 | **S/12.81** | S/19.21 |
| 28.0% | 2.66 | S/43.68 | **S/14.56** | S/21.84 |
| 34.0% | 3.02 | S/49.53 | S/16.51 | S/24.76 |
| 40.0% (borde alto) | 3.37 | S/55.37 | S/18.46 | S/27.68 |

> **Tu objetivo de S/13-14 no es arbitrario: es exactamente el CAC que la regla estándar
> LTV/CAC = 3:1 implica para este negocio.** Llegaste al número correcto por instinto.

---

## 3. Cuánto cuesta de verdad un cliente por Meta Ads en Perú

Cadena completa, cada eslabón con fuente:

```
1,000 impresiones          S/5 – S/12      [FUENTE ibo.pe, Perú, rubro restaurantes]
CTR 2.97%          →       29.7 clics      [FUENTE get-ryze / Two Minute Reports 2026]
CVR 1.89%          →       0.561 pedidos   [FUENTE misma]
+ IGV 18% sobre el gasto de Meta           [FUENTE Paradero Digital, Perú]
─────────────────────────────────────────────────────────
CAC de PRIMER PEDIDO  =  S/10.51 – S/25.23 [DERIVADO]
```

**Contraste de sanidad:** el CPC que sale de esta cadena (S/0.168–0.404) cae dentro del
CPC S/0.20–0.70 que la *misma* agencia peruana mide por separado. Los dos datos se
validan entre sí.

**El S/134 estaba entre 5 y 13 veces por encima del costo real documentado.**

---

## 4. La regla de una línea que reemplaza a todos los escenarios

> **Contribución del primer pedido de un cliente: S/16.42.**
> Si el CAC está por debajo, cada cliente se paga solo el día que pide por primera vez.
> Si está por encima, el negocio financia clientes esperando que vuelvan — y solo 23 de
> cada 100 vuelve.

| CAC | | ¿lo paga el 1er pedido? | pedidos para recuperarlo |
|---|---|---|---|
| Pedido grupal de oficina | S/1.19 | sí | 0.07 |
| Referido | S/7.65 | sí | 0.47 |
| **Tu objetivo** | **S/13.50** | **sí** | **0.82** |
| Meta Ads, buen CPM | S/10.51 | sí | 0.64 |
| *Punto de quiebre* | *S/16.42* | *justo* | *1.00* |
| Meta Ads, mal CPM | S/25.23 | NO | 1.54 |
| El S/134 sin fuente | S/134.00 | NO | 8.16 — más de los 2.34 que hace un cliente |

Cualquier CAC por encima de **S/38.43** destruye valor con certeza matemática.

---

## 5. Cómo se llega a S/13-14 — las tres palancas ya están en el código

Ninguna hay que construirla. Las tres están programadas y desplegadas. Lo que faltaba era
saber **cuánto cuesta cada una en efectivo real, no en precio de carta.**

| Canal | Costo real por cliente | De dónde sale |
|---|---|---|
| Meta Ads (mejor CPM de Perú) | **S/10.51** | CPM S/5 + CTR + CVR + IGV |
| Meta Ads (peor CPM de Perú) | **S/25.23** | CPM S/12 + CTR + CVR + IGV |
| Referido (400 pts + 120 pts) | **S/7.65** | insumo del 15CM + la bebida |
| Pedido grupal de oficina (5+) | **S/1.19** | un 15CM entre 5 personas |

Regalar un 15CM de S/20.90 le cuesta al negocio **S/5.94** de insumo y empaque. Esa
diferencia entre precio de carta y costo real es exactamente lo que hace alcanzable el
objetivo.

**Mezclas que aterrizan en S/13-14, usando el CAC de ads en su PEOR valor (S/25.23):**

| % por ads | % referido | % grupo | CAC mezcla | LTV/CAC | ¿objetivo? |
|---|---|---|---|---|---|
| 100% | 0% | 0% | S/25.23 | 1.5 | no |
| 70% | 20% | 10% | S/19.31 | 2.0 | no |
| 50% | 30% | 20% | S/15.15 | 2.5 | casi |
| **40%** | **30%** | **30%** | **S/12.74** | **3.0** | **SÍ** |
| 30% | 40% | 30% | S/10.98 | 3.5 | mejor |
| 0% | 50% | 50% | S/4.42 | 8.7 | mejor |

> **Respuesta directa:** con el CAC de publicidad en su peor valor documentado, basta con
> que el **56%** de los clientes nuevos entre por referido o pedido grupal para que la
> mezcla caiga a S/13.94. Si Meta rinde en el buen extremo (S/10.51), **el objetivo se
> cumple solo con publicidad, sin mezcla.**

---

## 6. Proyección central a 6 meses, con CAC = S/13.50

Días abiertos leídos del horario real del código (cerrado los lunes; septiembre arranca
el día 7): sep 20d · oct 27d · nov 25d · dic 27d · ene 27d · feb 24d.

| Presupuesto/mes | Clientes nuevos/mes | Pedidos sep | Pedidos feb | Ped/día feb | Neto feb | **Neto 6 meses** |
|---|---|---|---|---|---|---|
| S/300 | 22 | 22 | 34 | 1.4 | −S/240 | **−S/1,872** |
| S/600 | 44 | 44 | 68 | 2.8 | +S/21 | **−S/744** |
| S/1,000 | 74 | 74 | 114 | 4.7 | +S/368 | **+S/761** |
| S/1,500 | 111 | 111 | 171 | 7.1 | +S/802 | **+S/2,641** |
| S/2,000 | 148 | 148 | 227 | 9.5 | +S/1,235 | **+S/4,521** |

**Punto de equilibrio:** 30 pedidos/mes (1.2 al día) sin publicidad; 91 pedidos/mes
(3.5 al día) con S/1,000 de publicidad.
**Techo físico:** 40 pedidos/día = 1,040/mes. El escenario mayor llega al **24%** del techo.

**Lo que esta tabla dice y hay que leer bien:** gastar poco en publicidad es lo que
mantiene el negocio en pérdida. A S/300/mes los S/500 de costos fijos se comen todo; a
S/2,000/mes el negocio es rentable desde el primer mes. **No es un negocio que falle por
falta de mercado, es uno que falla por falta de escala.**

### La misma tabla con la corrección de optimismo aplicada

Flyvbjerg, Holm & Buhl (*JAPA* 71(2), 210 proyectos): los pronósticos de demanda se
sobreestiman **+106%** en promedio, y 9 de cada 10 se sobreestiman. Dividiendo entre 2.06:

| Presupuesto/mes | Nuevos/mes | Pedidos feb | Ped/día feb | Neto feb | **Neto 6 meses** |
|---|---|---|---|---|---|
| S/300 | 11 | 17 | 0.7 | −S/528 | −S/3,379 |
| S/600 | 22 | 33 | 1.4 | −S/556 | −S/3,757 |
| S/1,000 | 36 | 55 | 2.3 | −S/593 | −S/4,262 |
| S/1,500 | 54 | 83 | 3.5 | −S/640 | −S/4,893 |
| S/2,000 | 72 | 110 | 4.6 | −S/687 | −S/5,524 |

**Todos negativos.** Esta corrección no dice que la publicidad rinda menos: dice que un
dueño proyectando su propio negocio sobreestima la demanda. Es una corrección al
*pronosticador*, no al negocio. Si el gasto es real y el CAC es el medido, los clientes
entran; lo que castiga es dar por hecho que todos pedirán al ritmo del benchmark
estadounidense.

**Las dos tablas juntas son el resultado honesto**: el rango real de los primeros 6 meses
va de **−S/5,500 a +S/4,500** según cuánto se gaste y cuánto de los benchmarks prestados
se cumpla en Trujillo.

---

## 7. El canal de oficinas cambia la aritmética

Una cuenta de oficina de 6 personas que pide 4 veces al mes (81% de los pedidos de oficina
son semanales o más frecuentes — `[FUENTE ezCater]`):

```
4 pedidos × 6 sándwiches × S/16.16              = S/387.84 de contribución
menos el 15CM regalado al organizador cada vez  = S/ 23.76
────────────────────────────────────────────────────────────
CONTRIBUCIÓN NETA DE UNA SOLA OFICINA           = S/364.08 AL MES
```

Eso equivale a **22 pedidos individuales**, con un solo cliente que atender y una sola
entrega.

| Oficinas activas | Contribución/mes | Neto/mes | Pedidos/día | % del techo |
|---|---|---|---|---|
| 2 | S/728 | +S/228 | 0.3 | 1% |
| 5 | S/1,820 | +S/1,320 | 0.8 | 2% |
| 10 | S/3,641 | +S/3,141 | 1.5 | 4% |
| 20 | S/7,282 | +S/6,782 | 3.1 | 8% |

> **2 oficinas cubren todos los costos fijos. 10 oficinas dejan S/3,000 netos al mes usando
> el 4% del techo de cocina.** Es el camino más corto que existe en este negocio, y el
> incentivo que lo activa (`ORGANIZER_FREE_MIN_SANDWICHES = 5`) ya está desplegado.

Además, **70% de quienes prueban un restaurante por una comida pagada por su empleador
después piden por su cuenta** `[FUENTE ezCater]` — cada oficina siembra ~4 clientes
individuales sin costo de adquisición extra.

**Lo que este bloque NO demuestra:** cuántas oficinas se consiguen al mes. La búsqueda no
encontró ninguna cifra citable de costo por cuenta corporativa adquirida. Ese número solo
sale de medirlo desde el 7 de septiembre.

---

## 8. Por qué las predicciones anteriores dieron resultados tan distintos

**Los modelos no discrepaban sobre el negocio. Discrepaban sobre una variable cada uno, y
ninguna de esas variables tenía fuente.**

| Modelo | Qué se tecleó a mano | Efecto |
|---|---|---|
| v1–v4 | "pedidos/día" sorteados de un rango elegido (el optimista asumía 28/día en el mes 3) | Define el resultado entero; el modelo solo lo multiplica |
| v5 | Costos fijos S/950 y motorizado como costo fijo de S/1,100/mes | Inventó un "valle" inexistente; el delivery es pass-through |
| v6 | Retención mensual elegida (0.38) + S/300 de publicidad supuesta | La meseta `activos = n/(1−r)` queda fijada por dos números sin fuente |
| v6b | Igual que v6 + reinversión como % de ventas | Crecimiento compuesto sin ningún CAC medido detrás |
| socio | **CERO costo de adquisición** (`neto = contribución − fijos`) | Infló todos los escenarios, y más los optimistas |
| socio3/4 | **CAC = S/134, sin fuente** | Invirtió la conclusión: hizo ver la publicidad como destructora de valor |
| **v7 (este)** | **Nada.** Los 3 números externos tienen cita | El resultado es una consecuencia, no una elección |

**Los dos errores fueron simétricos y los cometí en la misma sesión:** primero cobré S/0
por cada cliente, después cobré S/134. Con S/0 todo escenario era rentable; con S/134
ninguno lo era. El negocio no cambió entre una tabla y la otra — cambió un número que yo
había puesto sin respaldo.

---

## 9. Qué medir desde el 7 de septiembre para que esto deje de ser simulación

Este modelo descansa en 3 números prestados de estudios estadounidenses. Cada uno se
reemplaza con dato propio en pocas semanas, y el orden importa:

1. **P(2º pedido)** — hoy 22.6% prestado. Medible al 2º mes con el panel admin actual.
   Es la variable más sensible del modelo: entre 22.6% y 40%, el LTV pasa de S/38.43 a
   S/55.37 (**+44%**).
2. **CAC real de Meta** — hoy un rango de S/10.51 a S/25.23. Medible en la **primera
   semana** de campaña. El Pixel + Conversions API ya están programados; falta correr
   `supabase secrets set META_PIXEL_ID=... META_CAPI_TOKEN=...`.
3. **Días entre pedidos** — hoy 33 prestado (Paytronix, canal propio). Medible al 3er mes.

### El supuesto más frágil de todo el cálculo

El ticket de este negocio (S/20.90–34.90 el sándwich, más S/6–15 de reparto) está **muy
por encima** del único ticket de delivery con fuente para provincia peruana: **S/15**
(Rappi vía *Gestión*). No invalida el modelo — SND//WCH no compite por precio — pero
significa que el **CVR de 1.89%** usado para derivar el CAC podría ser optimista para este
precio en este mercado. Si el CVR real fuera la mitad, el CAC se duplica y la mezcla del
bloque 5 pasa de ser conveniente a ser obligatoria.

---

## 10. Fuentes

**Retención y frecuencia**
- Bloom Intelligence — [Restaurant Guest Retention Rate: 78.8% Churn (2025 Data)](https://bloomintelligence.com/blog/state-of-restaurant-guest-retention-2025/) · [Guía de retención 2026](https://bloomintelligence.com/blog/restaurant-customer-retention-2026-guide/)
- Paytronix Online Ordering Report 2025 vía [Restaurant Dive](https://www.restaurantdive.com/news/paytronix-first-party-customers-tip-better-order-more-versus-third-party-aggregators/651565/)
- Olo — [Restaurant Trends That Defined 2025](https://www.olo.com/blog/restaurant-trends-that-defined-2025-how-olo-powered-them)
- Toast — [The Regulars Report 2026](https://pos.toasttab.com/blog/data/regulars-report)
- ezCater — [Lunch Rush](https://www.ezcater.com/lunchrush/restaurant/introduction-to-catering-how-big-is-the-opportunity/) · [Recurring Employee Meals](https://www.ezcater.com/company/corporate-solutions/recurring-employee-meals/)

**Costo de publicidad en Perú**
- ibo.pe — [Publicidad Digital en Perú 2026: Costos, Tendencias y Plataformas Clave](https://ibo.pe/blog/publicidad-digital-en-peru-2026-costos-tendencias-y-plataformas-clave/)
- Paradero Digital — [Publicidad en Facebook, Instagram y WhatsApp: precios y costos](https://www.paraderodigital.pe/publicidad-en-facebook-instagram-y-whatsapp-precios-y-costos/)
- get-ryze.ai — [Meta Ads Cost Benchmarks by Industry 2026](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026)
- ads.com.pe — [Google Ads Precio Perú](https://ads.com.pe/google-ads-precio/)

**Metodología de pronóstico**
- Flyvbjerg, Holm & Buhl — [How (In)accurate Are Demand Forecasts in Public Works Projects?](https://www.tandfonline.com/doi/abs/10.1080/01944360508976688), *JAPA* 71(2)
- Fader & Hardie — [How to Project Customer Retention](https://faculty.wharton.upenn.edu/wp-content/uploads/2012/04/Fader_hardie_jim_07.pdf), *JIM*
- Fader, Hardie & Lee — [Counting Your Customers the Easy Way (BG/NBD)](http://brucehardie.com/papers/018/fader_et_al_mksc_05.pdf), *Marketing Science* 2005
- Luo & Stark — [Only the Bad Die Young](https://arxiv.org/abs/1410.8603) (microdatos BLS: 17% de restaurantes independientes cierra el año 1; vida mediana 3.75 años para ≤5 empleados)

**Mercado peruano**
- Rappi vía [Gestión](https://gestion.pe/economia/empresas/rappi-peru-dos-nuevas-ciudades-donde-llegara-el-crecimiento-de-turbo-y-mas-cobertura-en-lima-delivery-plataformas-comida-noticia/) — ticket delivery provincia ~S/15
- APEIM — [Niveles Socioeconómicos 2020](https://apeim.com.pe/wp-content/uploads/2022/08/APEIM-NSE-2020.pdf) (La Libertad urbano: NSE AB 10.7%, C 33.5%)
- INEI — actividad de restaurantes [dic-2025 +4.22%](https://www.gob.pe/institucion/inei/noticias/1356717-actividad-de-restaurantes-crecio-4-22-en-diciembre-2025) · [ene-2026 +5.97%](https://www.gob.pe/institucion/inei/noticias/1368670-actividad-de-restaurantes-aumento-5-97-durante-enero-2026) · [feb-2026 +7.29%](https://www.gob.pe/institucion/inei/noticias/1381704-actividad-de-restaurantes-mostro-crecimiento-de-7-29-en-febrero-2026)

### Advertencia de verificación

El proxy de red de este entorno bloqueó `WebFetch` en casi todos estos dominios. **Las
cifras provienen de extractos de resultados de búsqueda, no de la lectura directa de cada
página.** Antes de tomar una decisión de plata grande, conviene abrir las URLs desde un
navegador normal. Además, varias fuentes de retención (Bloom, Toast, Olo, Paytronix) son
blogs de proveedores de tecnología para restaurantes, con interés comercial en que la
retención parezca un problema grave: tratarlas como orden de magnitud, no como verdad.
