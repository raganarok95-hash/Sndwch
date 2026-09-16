# La primera campaña — y el freno que la acompaña

**Fecha:** 2026-09-12 · **Apertura:** 12 de octubre de 2026

Todas las cifras de este documento salen de `modelo/modelo_v11.py` corriéndolo, no de memoria.
El servidor las tiene en `CAC_TECHO` (`env.ts`) y **`npm run parity` verifica que coincidan
ejecutando el Python** — si alguien mueve una, el chequeo falla.

---

## 1 · El número que decide todo, antes de hablar de creatividades

| | |
|---|---|
| Lo que deja un pedido | **S/14.13** |
| Menos overhead (gas, frío, coordinación) | −S/0.50 |
| **Techo del PRIMER pedido** | **S/13.63** |
| **Techo del CLIENTE COMPLETO** (2.41 pedidos × 0.75 de confianza) | **S/24.59** ← con el que decide el freno desde el 2026-09-13 |
| CAC de Meta con el CPM más barato (S/5) | S/10.51 |
| CAC de Meta con el CPM medio (S/8.50) | **S/17.87** |
| CAC de Meta con el CPM más caro (S/12) | S/25.23 |

⚠ **ACTUALIZADO EL 2026-09-13, DOS CORRECCIONES QUE SE MUEVEN EN DIRECCIONES OPUESTAS:**

1. **El techo subió.** La publicidad se trata como **reinversión** (decisión del dueño), así
   que el techo correcto es el del cliente completo. Investigación propia (Genesys, delivery):
   solo el **45%** vuelve a pedir, de esos el **85%** hace un tercero, y después sigue el
   **60%** → **2.41 pedidos por cliente**. Recortado al 75% porque esa repetición es de
   industria, no de este negocio: **S/24.59**.
2. **Y el CAC también subió.** El rango de este documento (S/10.51-25.23) tomaba el extremo
   optimista de CTR **y** de CVR a la vez. Con los rangos reales —CTR 1.85-2.97%, CVR
   1.54-1.89%— el CAC medio es **S/24.27**, no S/17.87.

**El resultado neto es un empate al filo**: S/24.27 de CAC medio contra S/24.59 de techo. Por
eso la medición de S/300 vale más que antes, no menos — y por eso el freno sigue existiendo.

Lo que sigue en este documento usa el análisis original; la lectura de la primera tabla cambia
con lo de arriba.

**Al CPM medio pagas S/17.87 por un cliente que te deja S/13.63 en su primer pedido.** Vas
S/4.24 abajo desde el minuto uno, y solo lo recuperas si vuelve.

Eso **no está mal por sí solo** — casi todo el delivery del mundo funciona así. Está mal
*cuando no sabes si vuelve*, y hoy no lo sabes: la repetición no está medida porque el negocio
no ha abierto. Así que al CPM medio estarías apostando ~S/4 por cliente a un número que nadie
vio nunca.

⚠ **Y el rango entero es de agencia, no medición propia.** Entre S/10.51 y S/25.23 hay un
factor 2.4. Con el extremo bueno la publicidad se paga sola; con el malo destruye S/11.60 por
cliente. **Nadie sabe en cuál estás.** Ese es el verdadero problema a resolver primero.

---

## 2 · El costo de hacerlo "como dice el manual"

Meta necesita **~50 conversiones cada 7 días** por conjunto de anuncios para salir de la fase
de aprendizaje. Al mes son **217 conversiones**.

| | al mejor CAC (S/10.51) | al CAC medio (S/17.87) |
|---|---|---|
| Presupuesto mensual para salir de aprendizaje | **S/2,285** | **S/3,885** |
| Por día | S/75 | S/128 |

**Compáralo con tus costos fijos: S/500 al mes.** Salir de la fase de aprendizaje cuesta entre
**4.6 y 7.8 veces todo lo que te cuesta operar el negocio.** No es un detalle de presupuesto:
es la razón por la que `PREDICCION_V12.md` concluye que la meta **no se alcanza con más
publicidad**.

---

## 3 · Entonces, ¿qué campaña se aprueba?

**La primera campaña no se hace para vender. Se hace para MEDIR.** Su entregable es un número
—tu CAC real— y ese número decide todo lo demás. Gastar S/3,885 al mes antes de saber si estás
en S/11 o en S/25 es apostar el presupuesto de siete meses de operación a una moneda al aire.

### ⚠ Y la respuesta cuesta S/300, no S/840 — corregido el 2026-09-13

Este documento pedía S/40/día durante 21 días. **Era más del doble de lo necesario**, y la regla
del propio freno lo demuestra: el veredicto no llega a un número fijo de conversiones, llega
cuando el intervalo `1/√n` cae entero de un lado del techo. Eso tiene una propiedad que la
versión anterior no aprovechaba — **el veredicto es más barato cuanto más extremo es el
resultado**:

| si tu CAC real es… | conversiones para el veredicto | gasto |
|---|---|---|
| S/8 (excelente) | 3 | **S/24** |
| S/10.51 (el mejor del rango) | 12 | **S/126** |
| S/20 | 10 | **S/200** |
| S/25.23 (el peor del rango) | 5 | **S/126** |
| S/12 o S/15 (pegado al techo) | 55 / 120 | S/660 / S/1,800 |

**Lo caro de probar es justo lo que no hace falta probar.** Entre S/11 y S/17.6 estás a menos
de un cuarto del punto de equilibrio del primer pedido: ahí la decisión no la resuelve más
publicidad, la resuelve la repetición, que se mide gratis con los clientes que ya tengas.

**Lo aprobado: S/30/día con tope duro de S/300**, y el freno corta antes si el intervalo se
separa. A ese gasto entran ~17 primeras compras ya descontado el IGV del 18% — margen ±24%,
suficiente salvo que caigas en la banda de empate. **Si llegas a S/300 sin veredicto, ese ES el
veredicto**: estás en el empate y no se escala.

### Lo que se aprueba

| campo | valor | por qué |
|---|---|---|
| **Objetivo** | Ventas (Conversiones) · evento **Purchase** | El píxel ya reporta `Purchase` por navegador Y por Conversions API con el mismo `event_id`, así que Meta deduplica en vez de contar doble. Optimizar a "tráfico" compraría visitas, no pedidos. |
| **Un solo conjunto de anuncios** | sí | Repartir el presupuesto multiplica el problema: varios aprendizajes que ninguno completa. |
| **Presupuesto** | **S/30/día, tope duro S/300** | Ver la sección de arriba. El tope es duro; el freno puede cortar antes, nunca después. |
| **Ubicación** | Trujillo + 5 km, cruzado con los distritos que de verdad cubres | `DELIVERY_DISTRICTS` manda. Pagar por alcanzar a alguien a quien no le puedes entregar es tirar el dinero dos veces: el clic y la frustración. |
| **Edad** | **18-60**, no 18-45 | Cada filtro encoge el grupo y encarece el CPM. Recortar la edad "por intuición" se paga en subasta y no se recupera con nada. |
| **Segmentación por intereses** | **ninguna** | Ver abajo. Es aritmética, no confianza ciega en el algoritmo. |
| **Ubicaciones (placements)** | automáticas | |
| **Horario** | todo el día | El brief ya ancla los temas a ocasiones; que el algoritmo encuentre a qué hora convierte tu gente en vez de decidirlo tú sin datos. |

### Qué controlas tú y qué delegas — el criterio, no una preferencia

La línea no es "confío o no confío en el algoritmo". Es esta: **tú controlas lo que es una
restricción del negocio; Meta controla lo que es una hipótesis que no has probado.**

| lo controlas TÚ | por qué no es negociable |
|---|---|
| Ubicación: los 8 distritos que sí cubres | El Porvenir y El Milagro están `out:true` en `DELIVERY_DISTRICTS`. |
| El evento: `Purchase` | Es el único cableado por navegador y por CAPI con el mismo `event_id`. |
| El destino: la app, nunca WhatsApp | Un clic que termina en un chat no dispara `Purchase`: Meta no aprende y tú no mides. |
| Las 3 creatividades | El algoritmo no inventa tu producto. |
| El tope de gasto y la regla de corte | |

| lo delegas a META | por qué |
|---|---|
| Intereses y comportamientos: NINGUNO | Ver el párrafo de abajo. |
| Ubicaciones, horario, género | Cero datos propios para decidirlo mejor que la subasta. |
| Qué creatividad se lleva el presupuesto | |

⚠ **Y sobre "¿cuánto mejor es que Meta se adapte?": no hay un número honesto.** No existe un
estudio revisado que compare segmentación amplia contra intereses; todo lo publicado lo escribe
alguien que vende software de anuncios — el mismo patrón que ya detectaron solas las cuatro
investigaciones de `MAQUINARIA_DE_MARKETING.md`. La documentación de Meta dice que su expansión
"puede mejorar el rendimiento", pero es el vendedor hablando de su producto.

Lo que sí se sostiene sin ningún estudio es la aritmética: **con S/300 compras ~30,000
impresiones en total.** Contra los cientos de miles de adultos alcanzables de tus 8 distritos,
eso es frecuencia por debajo de 0.1 — no llegas ni a rozar el grupo entero. **No tienes
presupuesto para elegir un subgrupo: no alcanzas a cubrir el grupo completo.** Segmentar ahí
solo sube el CPM a cambio de una hipótesis que no probaste. Verificable antes de gastar un sol:
pon los distritos en el estimador de audiencia, mira el CPM, agrega un interés y mira cómo sube.

### Las creatividades — una por ocasión, que ya están escritas

Los pitches del catálogo se reescribieron el 2026-09-12 anclados a un momento. **Esos mismos
son los anuncios**, y no hay que inventar copy nuevo:

| anuncio | ocasión | producto |
|---|---|---|
| 1 | *la noche en que ya decidiste que no vas a cocinar* | The Marinara |
| 2 | *el almuerzo que tiene que aguantar hasta la noche* | The Original |
| 3 | *el del viernes, cuando el día ya se acabó* | The Smoke |

Tres creatividades en el mismo conjunto. El video lo generas en Flow con el prompt que el
brief semanal ya te deja escrito (`flowPromptSemanal`).

⚠ **El destino es la app, no WhatsApp.** Un clic que termina en un chat no dispara `Purchase`
y Meta no aprende nada — y medir es todo el punto de esta campaña.

---

## 3b · ⚠ LO PRIMERO NO ES LA CAMPAÑA: ES NO GASTAR NADA DURANTE 2-3 SEMANAS

Cuesta cero, solo se puede hacer una vez, y sin ello todo lo demás de este documento mide mal.

El CAC del panel cuenta como captado por publicidad **a todo cliente nuevo sin referidor** —
incluido el que te encontró solo, por el QR de la bolsa o porque un amigo le contó sin usar el
código. Eso no es un matiz: Gordon, Zettelmeyer, Bhargava y Chapsky (*Marketing Science*, 15
experimentos en Facebook, 500 millones de observaciones) demostraron que **la atribución
observacional exagera el efecto de la publicidad**, y trabajos posteriores lo cuantificaron en
factores de **2 a 5 veces**. Un CAC exagerado a la baja es exactamente el error que hace
escalar un canal que pierde plata.

**La corrección:** abre en la segunda semana de octubre y **no gastes un sol en anuncios
durante al menos 14 días**. Admin // Marketing // Freno de CAC cuenta solo los clientes nuevos
que entran en ese periodo y te dice cuántos por día son. Ese es tu **línea base orgánica**.
Cuando empieces a gastar, ese ritmo se resta antes de dividir, y el CAC pasa de ser un piso
optimista a ser el número real.

- Se deriva **sola**, del primer `ad_spend` que cargues — no hay que acordarse de nada.
- Necesita **14 días y 10 clientes** como mínimo. Por debajo, `porDia` es ruido y restarlo
  ensuciaría la medición en una dirección que nadie puede ver, así que no se resta.
- Los días son los **28 anteriores al primer gasto**, no "desde el primer cliente": una cuenta
  de prueba creada hace medio año estiraría el denominador y dejaría la base cerca de cero,
  que es la dirección peligrosa.
- **Una vez que empiezas a gastar no se puede reconstruir.** No hay periodo limpio con el cual
  comparar, y no existe forma de recuperarlo después.

Consecuencia de calendario: **la campaña arranca en noviembre, no en octubre.**

---

## 4 · El freno: cuándo cortar, decidido ANTES de gastar

En **Admin // Marketing // Freno de CAC**. Carga ahí lo que gastaste cada día (cópialo del
panel de Meta) y la pantalla cruza ese gasto con los clientes nuevos que no vinieron por
referido.

**Las reglas, en orden:**

1. **Días 1-14: no decidas nada, y no toques nada.** Cada edición de audiencia, creatividad o
   evento **reinicia la fase de aprendizaje** (documentación oficial de Meta). Lo único que se
   permite es pausar un anuncio con cero compras y más de S/80 gastados.
1b. **Si gastaste y entraron clientes pero ninguno por encima de tu línea base** → corta. Tiene
   veredicto propio (`sin-incrementales`) y no espera a ningún mínimo estadístico: no es una
   medición imprecisa, es el resultado. Y es justo el caso que el CAC optimista pintaba de
   verde, porque dividía el gasto entre clientes que iban a llegar igual.
2. **La pantalla decide por ti cuándo el número ya sirve.** No usa un umbral de conversiones:
   calcula el intervalo de confianza (`1/√n`) y solo dice "puedes actuar" cuando ese intervalo
   cae ENTERO de un lado del techo. Mientras el techo caiga dentro del rango, te lo dice con
   los dos extremos escritos.
3. **Si el intervalo entero queda bajo el techo (S/24.59)** → funciona. Sube **20-25% cada 5 días**,
   nunca de golpe.
4. **Si el intervalo entero queda sobre el techo (S/24.59)** → corta. No subas el presupuesto "a ver si
   mejora".
5. **Si gastaste y no entró nadie** → corta ya. Ese caso tiene veredicto propio en la pantalla
   y no espera a ningún mínimo: es información dura, no falta de datos.
6. **Si a los 60 días el CAC sigue arriba del techo con 100+ compras**, el problema no es la
   configuración: es la oferta o el precio. Ahí se cambia la oferta, no el targeting.

**Y mientras tanto, mira las señales adelantadas**, que sí tienen volumen desde el día 2: CPM,
CTR, hook rate del video (>25%) y costo por *inicio de pago*. Sirven para detectar un desastre,
no para declarar un éxito.

⚠ **Cuánto vale el CAC que ves depende de si levantaste la línea base** (sección 3b):

- **Sin línea base** es el MEJOR caso, no el real: cuenta como captado por publicidad a todo
  cliente nuevo sin referidor, incluido quien te encontró por Google Business Profile o por el
  QR de la bolsa. Con más gente en el reparto sale más barato de lo que es. **Si hasta ese
  número optimista pasa el techo, el real lo pasa seguro.** La pantalla lo dice arriba de la
  cifra y explica que faltan 14 días sin publicidad para poder descontarlo.
- **Con línea base** ya está restado el ritmo que entraba solo, y el titular pasa a ser el
  ajustado; el optimista queda abajo, en chico, dicho como lo que es. Lo que sigue sin poder
  saberse: si el boca a boca creció por su cuenta desde entonces, la base quedó corta.

---

## 5 · El canal con el que hay que comparar siempre

**Un referido cuesta S/7.65** (el insumo del 15CM de R06 más la bebida de R05). Es **más
barato que el mejor CAC pagado que existe en el rango** (S/10.51), y no depende de ninguna
subasta.

Por eso, antes de subir un sol el presupuesto de Meta, la pregunta es si la escalera de
referidos ya está funcionando: si consigues que los referidos suban, bajas el CAC combinado
**sin tocar la publicidad**. En el modelo es la única palanca que convierte "no llega nunca" en
"sostiene".

---

## 6 · Lo que falta antes de poder lanzar

1. **Los secrets de Meta** — `META_PIXEL_ID` y `META_CAPI_TOKEN`. Ver `docs/CONFIGURAR_META.md`.
   Sin ellos no hay `Purchase` que optimizar y la campaña compra a ciegas.
2. **Un método de pago en la cuenta publicitaria.** Verificado el 2026-09-12 con el MCP
   oficial de Meta Ads: la cuenta **221839797** existe, está ACTIVA y en soles, con presupuesto
   diario mínimo de **S/3.39** — pero `has_payment_method: false`. Hoy no puede gastar nada.
3. **Nada más del lado del código.** El píxel, la Conversions API, la deduplicación por
   `event_id`, el respeto al derecho de oposición, el freno de CAC y el interruptor de
   emergencia de promociones ya están construidos y probados.

---

## 7 · Lo que dice la evidencia y este documento NO cubre

`docs/MAQUINARIA_DE_MARKETING.md` tiene el plan completo. Los tres titulares que más cambian
las prioridades:

- **Las primeras 50 reseñas de Google valen más que el programa de referidos.** Es el único
  hallazgo causal de toda la investigación (+5-9% de ingresos por estrella, efecto **más fuerte
  en independientes**, y 50% más fuerte una vez pasadas las 50 reseñas). Hoy tienes cero.
- **No subas el bono de referido.** Experimento de campo con 160,000 clientes: premios más
  grandes traen más referidos y **menos rentables**.
- **El 50% de las segundas compras cae dentro de los 30 días** y la conversión se desploma
  después del día 45. Hoy tocamos esa ventana una sola vez, entre el día 7 y el 10.
