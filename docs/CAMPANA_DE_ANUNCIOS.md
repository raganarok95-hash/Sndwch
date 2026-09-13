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
| **Techo: lo que deja un cliente en su PRIMER pedido** | **S/13.63** |
| CAC de Meta con el CPM más barato (S/5) | S/10.51 |
| CAC de Meta con el CPM medio (S/8.50) | **S/17.87** |
| CAC de Meta con el CPM más caro (S/12) | S/25.23 |

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

### Lo que se aprueba

| campo | valor | por qué |
|---|---|---|
| **Objetivo** | Ventas (Conversiones) · evento **Purchase** | El píxel ya reporta `Purchase` por navegador Y por Conversions API con el mismo `event_id`, así que Meta deduplica en vez de contar doble. Optimizar a "tráfico" compraría visitas, no pedidos. |
| **Un solo conjunto de anuncios** | sí | Repartir el presupuesto multiplica el problema: varios aprendizajes que ninguno completa. |
| **Presupuesto** | **S/40/día durante 21 días = S/840** | ⚠ **Corregido el 2026-09-12 tras la investigación de Meta Ads**: decía 14 días, y la aritmética no daba. A S/40/día con un CAC de S/15 entran ~2.7 compras diarias, o sea **~19 días para juntar 50**. Y 50 es el número donde el margen de error del CAC baja a ±14%; con las ~37 de 14 días el margen es ±16% y el techo todavía cae dentro. La primera lectura confiable es a **21 días o 50 compras, lo que llegue después**. |
| **Ubicación** | Trujillo + 5 km, cruzado con los distritos que de verdad cubres | `DELIVERY_DISTRICTS` manda. Pagar por alcanzar a alguien a quien no le puedes entregar es tirar el dinero dos veces: el clic y la frustración. |
| **Edad** | 18-45 | |
| **Segmentación por intereses** | **ninguna** | Con este presupuesto, segmentar reduce el grupo y encarece el CPM. Deja que Meta busque. |
| **Horario** | todo el día | El brief ya ancla los temas a ocasiones; que el algoritmo encuentre a qué hora convierte tu gente en vez de decidirlo tú sin datos. |

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

## 4 · El freno: cuándo cortar, decidido ANTES de gastar

En **Admin // Marketing // Freno de CAC**. Carga ahí lo que gastaste cada día (cópialo del
panel de Meta) y la pantalla cruza ese gasto con los clientes nuevos que no vinieron por
referido.

**Las reglas, en orden:**

1. **Días 1-14: no decidas nada, y no toques nada.** Cada edición de audiencia, creatividad o
   evento **reinicia la fase de aprendizaje** (documentación oficial de Meta). Lo único que se
   permite es pausar un anuncio con cero compras y más de S/80 gastados.
2. **La pantalla decide por ti cuándo el número ya sirve.** No usa un umbral de conversiones:
   calcula el intervalo de confianza (`1/√n`) y solo dice "puedes actuar" cuando ese intervalo
   cae ENTERO de un lado del techo. Mientras el techo caiga dentro del rango, te lo dice con
   los dos extremos escritos.
3. **Si el intervalo entero queda bajo S/13.63** → funciona. Sube **20-25% cada 5 días**,
   nunca de golpe.
4. **Si el intervalo entero queda sobre S/13.63** → corta. No subas el presupuesto "a ver si
   mejora".
5. **Si gastaste y no entró nadie** → corta ya. Ese caso tiene veredicto propio en la pantalla
   y no espera a ningún mínimo: es información dura, no falta de datos.
6. **Si a los 60 días el CAC sigue arriba del techo con 100+ compras**, el problema no es la
   configuración: es la oferta o el precio. Ahí se cambia la oferta, no el targeting.

**Y mientras tanto, mira las señales adelantadas**, que sí tienen volumen desde el día 2: CPM,
CTR, hook rate del video (>25%) y costo por *inicio de pago*. Sirven para detectar un desastre,
no para declarar un éxito.

⚠ **El CAC que ves es el MEJOR caso, no el real.** Cuenta como captado por publicidad a todo
cliente nuevo sin referidor — y ahí adentro también está quien te encontró por Google Business
Profile o por el QR de la bolsa. Con más gente en el reparto, el costo sale más barato de lo
que es. **Si hasta ese número optimista pasa el techo, el real lo pasa seguro.** Separarlos de
verdad exige el píxel, que es justo lo que esta campaña viene a encender.

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
