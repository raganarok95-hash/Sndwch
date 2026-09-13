# La maquinaria de marketing — qué dice la evidencia y qué hacemos

**2026-09-12.** Construido sobre cuatro investigaciones externas hechas para este negocio:
retención en delivery, adquisición sin presupuesto, Meta Ads con presupuesto chico, y
referidos. Cada afirmación de abajo lleva su origen.

---

## ⚠ Antes de nada: la calidad de las fuentes

Casi todo lo que se publica sobre marketing de restaurantes lo escribe **alguien que vende
software de marketing para restaurantes**. Las cuatro investigaciones lo marcaron por su
cuenta. Por eso este documento usa tres etiquetas y NO las mezcla:

- **[CAUSAL]** — experimento o cuasi-experimento publicado. Es lo único sobre lo que apuesto.
- **[BENCHMARK]** — dato de plataforma o agencia, sin metodología pública. Sirve de orden de
  magnitud, no de meta.
- **[OPINIÓN]** — consenso de practicantes sin datos detrás.

**Y un hueco que hay que decir en voz alta: no existe ni un solo estudio de recompra de
delivery de comida en Perú a nivel de restaurante individual.** Ninguna de las cuatro
investigaciones lo encontró. Tus propios números de octubre van a ser los primeros.

---

## 1 · Lo que más evidencia tiene, y no lo estamos haciendo

### Las primeras 50 reseñas de Google valen más que todo el programa de referidos

**[CAUSAL]** Michael Luca (Harvard Business School), datos fiscales del estado de Washington
cruzados con Yelp, con regresión discontinua: **+1 estrella = +5 a 9% de ingresos**. Dos
matices que casi nadie cita y que a ti te tocan de lleno:

- el efecto aparece **solo en restaurantes independientes**, no en cadenas;
- **un cambio de rating pesa 50% más cuando ya tienes 50+ reseñas** que cuando tienes menos
  de 10.

Este es el único hallazgo **causal** de los cuatro informes que apunta a una acción concreta,
y **apareció por separado en dos investigaciones distintas**. Hoy tienes **cero reseñas**.

**[BENCHMARK]** El 53% de los clientes dice que dejaría reseña si se lo piden por mensaje.

**Lo que falta construir:** la app ya pide calificación tras la entrega —pero esa calificación
se queda adentro. **Nadie le pide nunca una reseña de Google.** Es el hueco más caro que
encontré hoy.

---

## 2 · Retención: la ventana es de 30 días y hoy la tocamos una sola vez

**[CAUSAL/gran muestra]** RJMetrics, 176 retailers y 18 millones de clientes: solo el **32%**
hace una segunda compra. Pero de los que llegan a la segunda, el **53%** hace la tercera; de
esos, el **64%** la cuarta; y quien llega a la novena tiene **83%** de hacer la décima.
**La curva se endereza sola después del segundo pedido.** Todo el esfuerzo va ahí.

**[BENCHMARK]** El 50.3% de las segundas compras cae dentro de los **30 días**, el 76.4%
dentro de 90; la conversión se desploma de 15-20% a 3-5% **después del día 45**.

**[BENCHMARK]** Restaurantes: 78.8% de abandono anual, solo 25% de los primerizos vuelve en 90
días — **pero con seguimiento personalizado sube a 35-45%**.

**Lo que tenemos:** `remind-second-order` dispara **una vez, entre el día 7 y el 10**. Está
dentro de la ventana buena, pero es **un solo toque en una ventana de 30 días**.

**Lo que la evidencia pide:** un segundo toque antes del día 30, con contenido distinto (no el
mismo recordatorio repetido). Y personalizado: la diferencia entre 25% y 35-45% de retorno es
exactamente "genérico vs. sabe qué pediste".

### El truco con mejor evidencia de todo el informe de retención

**[CAUSAL]** Nunes y Drèze (2006), tarjetas de lavado de autos: un grupo necesitaba 10 sellos
pero **ya traía 2 regalados**; el otro necesitaba 8 desde cero. El esfuerzo real es idéntico.
Canje: **34% contra 19%**.

⚠ **El efecto desaparece si no das una RAZÓN del regalo.** La razón puede ser arbitraria
("por la apertura"), pero tiene que existir. Ya damos bono de bienvenida — lo que falta es
que se presente como *progreso ya empezado hacia algo*, con su motivo dicho.

**[CAUSAL]** DonorsChoose partió a sus donantes primerizos en dos y mandó notas escritas a
mano a la mitad: **+38% de repetición**. Es donación, no comida, pero es un A/B real. Todas
las cifras que verás de "26% más recompra con notas manuscritas" vienen de empresas que
venden notas manuscritas — ignóralas; esta no.

---

## 3 · Referidos: la evidencia dice lo contrario de lo que íbamos a hacer

**[CAUSAL]** Wolters, Schulze y Gedenk (*Marketing Science*, 2020), experimento de campo con
**más de 160,000 clientes de banco**: los premios más grandes traen **más** referidos pero
**bastante menos rentables**.

**Traducción directa:** subir los 400 puntos del que invita **no es la palanca**, y
probablemente ya está sobredimensionado. Considera bajarlo.

**[CAUSAL, reportado por plataforma]** Premiar **solo al invitado** rindió parecido a un
premio de dos lados **que costaba el doble**.

**[CAUSAL]** Premio en **especie** (producto) funciona mejor que en efectivo. Acá ya
acertamos: damos sándwich y bebida, no crédito.

**[CAUSAL]** Schmitt, Skiera y Van den Bulte (*Journal of Marketing*, 2011), ~10,000 clientes
seguidos casi 3 años: el cliente referido vale **al menos 16% más** y **se va 18% más lento**.
O sea que el referido no solo es más barato — es mejor cliente.

**[CAUSAL, restaurantes]** Ko y Song (*Cornell Hospitality Quarterly*, 2025): los escalones
aceleran el esfuerzo **solo si el cliente VE su progreso**. Sin barra de progreso son teatro.
**Acá ya estamos bien**: `REFERRAL_MILESTONES` existe en el cliente justamente para pintarlo,
y el código lo dice con esas palabras.

**[DATO CON ORIGEN]** El **84% del compartir online ocurre en canales privados** (WhatsApp,
DM). Tu programa vive o muere en WhatsApp, y **nunca vas a ver ese tráfico en un dashboard**.

**Modo de fallo número uno, según todas las fuentes sin excepción:** que nadie sepa que el
programa existe.

---

## 4 · El descuento recurrente es una trampa, y por eso existe el freno

**[CAUSAL]** Estudio sobre cupones de Alibaba: recibir promociones iniciales **baja la
disposición a pagar**, **baja el precio de referencia** del cliente y sube su sensibilidad al
precio — **incluso cuando después compra a vendedores que no promocionan**. El daño se derrama
fuera de tu propia tienda.

Esto es lo que respalda dos decisiones que ya están tomadas en este repo:

- **El combo de S/1 y las recompensas por puntos NO son descuento recurrente**: son estructura
  de carta y beneficio ganado. No entrenan a esperar rebaja.
- **El kill switch** (Admin // Marketing // Freno de CAC) apaga todos los códigos
  promocionales de golpe, y **no toca** recompensas, crédito ni referidos. La distinción no es
  cosmética: apagar lo que el cliente ya se ganó sería romper una promesa.

---

## 5 · Publicidad pagada: qué esperar de verdad con S/40/día

**[OFICIAL META]** La fase de aprendizaje pide ~50 conversiones cada 7 días por conjunto de
anuncios. Sigue vigente en 2026.

**[ARITMÉTICA]** A S/40/día con un CAC de S/15 entran ~11-27 compras por semana. **No vas a
salir de la fase de aprendizaje, y hay que planificar aceptándolo** en vez de subir el
presupuesto persiguiéndolo.

**[DESACUERDO REAL, reportado como tal]** Hay practicantes serios que dicen que *Learning
Limited* significa rendimiento **inestable**, no malo, y que un buen conjunto en una cuenta
chica puede vivir ahí para siempre. Otros dicen que presupuesto bajo = "impresiones para
quemar plata sin conversiones para entrenar". **No hay consenso.** Lo honesto es medir el tuyo.

**[ESTADÍSTICA]** El error de un CAC medido es `1/√n`: con 10 conversiones el margen es
**±32%**; con 25, ±20%; con 50, ±14%. Con 10 compras, un CAC "medido" de S/14 es compatible
con cualquier cosa entre S/9.50 y S/18.50 — y el techo cae en medio. **Decidir ahí es apagar
al ganador y escalar al perdedor sin enterarte nunca.**

→ Por eso el freno de CAC **no usa un umbral de conversiones**: calcula el intervalo y solo
declara fiable cuando cae entero de un lado del techo. La estadística decide cuántas
conversiones hacen falta, no una constante escrita a mano.

**[PRACTICANTE, consenso]** Un conjunto, audiencia amplia, sin segmentar por intereses; 4-5
creatividades dentro del mismo conjunto; **manos quietas 14 días**; creatividad nueva cada 3-4
semanas por saturación de mercado chico. **La creatividad es la palanca principal, muy por
encima de la configuración.**

⚠ **No optimizar por "Añadir al carrito"** en este negocio: optimizaría hacia gente que arma
sándwiches por curiosidad.

---

## 6 · Canales orgánicos: qué sirve y qué es teatro

| canal | veredicto | evidencia |
|---|---|---|
| **Google Business Profile** | **Lo primero.** 2-3 h una vez + 15 min/semana | [CAUSAL] +5-9% por estrella, más fuerte en independientes |
| **Tarjeta en la bolsa** | Ya existe (QR de grupo). Costo marginal cero | [BENCHMARK] +30-40% de recompra |
| **WhatsApp — Estados** | Sí, para alcance | [BENCHMARK] 500M usuarios diarios |
| **WhatsApp — difusión** | Solo **retención**, no adquisición | [OFICIAL] solo llega a quien te guardó; máx. 256 por lista |
| **TikTok** | Apuesta asimétrica: no depende de seguidores | [BENCHMARK] cuenta nueva 500-2,000 vistas/video |
| **Instagram orgánico** | ~20 personas por post con cuenta chica | [BENCHMARK] 9.8% de alcance, 0.23% engagement en comida |
| **Hashtags** | **Teatro** | [OFICIAL] Mosseri: "no son una forma primaria de aumentar tu alcance" |
| **Volantes** | **No** — 1-2% en lista fría y exige caminar la ciudad | [BENCHMARK] |
| **Micro-influencers** | Sin evidencia; todo viene de agencias que lo venden | [OPINIÓN] |

**El detalle que cambia el orden de todo:** graba el contenido **mientras cocinas por tandas**.
Es el único momento en que el contenido no te cuesta tiempo extra — y tu cuello de botella no
es el dinero, es tu hora.

---

## 7 · El orden en que yo lo haría

**Antes de abrir (octubre):**

1. **Google Business Profile completo** — categoría exacta, 20-30 fotos propias, enlace de
   pedido apuntando a tu app (no a un agregador). *Es la acción con mejor evidencia de todo
   este documento.*
2. **Imprimir la tarjeta del QR** para la bolsa.
3. **Los tres secrets de Meta.** Sin ellos no hay CAC que medir y el freno no tiene qué frenar.

**Las primeras 4 semanas:**

4. **Pedir reseña de Google a cada entrega.** Meta: llegar a 50 reseñas. Es el umbral donde el
   efecto medido se hace 50% más fuerte.
5. **Campaña de medición**: S/40/día, un conjunto, audiencia amplia, 4-5 creatividades.
   **Primera lectura de CAC a los 21 días o 50 compras, lo que llegue después.**
6. **Manos quietas.** Cada edición reinicia el aprendizaje.

**Del mes 2 en adelante, con datos propios:**

7. Revisar el segundo toque de la ventana de 30 días.
8. Revisar el monto del bono de referido **a la baja**, no al alza.
9. Reemplazar todo benchmark de este documento por tu propio número.

---

## 8 · Lo que NO vamos a hacer, y por qué

- **No subir el bono de referido.** [CAUSAL] Premio más grande = referidos menos rentables.
- **No poner descuentos recurrentes.** [CAUSAL] Entrenan a esperar el descuento y el daño
  persiste fuera de tu tienda.
- **No perseguir salir de la fase de aprendizaje** subiendo el presupuesto a S/128/día. Eso es
  7.8 veces todos tus costos fijos.
- **No repartir el presupuesto en varios conjuntos.**
- **No decidir con 10 conversiones.**
- **No creerle a ningún benchmark de este documento** una vez que tengas tus propios datos.
