# SND//WCH — Plan de marketing de lanzamiento

Nota sobre el método: este plan usa el framework AARRR (Adquisición, Activación,
Retención, Referido, Ingresos) de la skill `marketing-plan`, pero SIN la capa
pensada para startups con ronda de inversión (ARR, CAC formal, hitos de
financiamiento, contratación escalonada) — ese aparato no aplica a un operador
solo, sin capital externo, vendiendo sándwiches en Trujillo. Lo que sí se
conserva es lo útil: pensar cada acción por etapa del embudo, secuenciar en el
tiempo, y nombrar qué herramienta de la app ejecuta cada movimiento (la mayoría
ya están construidas).

## 1. Resumen ejecutivo

**3 apuestas grandes:**
1. **El contenido en video (Reels/Historias) es el canal principal de
   adquisición**, no un complemento — es la base que sostiene la demanda
   mientras el presupuesto de ads pagados (idea ya conversada, monto aún sin
   cerrar — ver §13) se define. Cuando ese presupuesto exista, amplifica el
   contenido que ya funciona orgánicamente; no lo reemplaza.
2. **La lista de espera + el programa de referidos hacen el trabajo pesado los
   primeros 60 días** — convertir a quien ya mostró interés (waitlist) y hacer
   que el primer lote de clientes reales traiga al siguiente (referidos) cuesta
   S/0 en medios pagos y ya está construido en el backend.
3. **La retención se automatiza sola desde el día 1** — los crons de
   recordatorio (carrito abandonado, reto mensual, hora pico) ya corren; el
   trabajo humano se concentra en producir contenido, no en perseguir clientes
   uno por uno.

**Prioridades de los primeros 90 días** (cuenta desde la fecha real de
apertura, no desde hoy): activar la publicación en Meta (3 secrets pendientes),
correr la campaña de pre-lanzamiento de 4-6 semanas con Reels/Historias,
convertir la lista de espera el día de apertura, y sostener una cadencia de
contenido semanal las primeras 8 semanas post-apertura.

**Resultado a 12 meses:** una base de clientes recurrentes (INICIADO+ en el
programa de rangos) que sostiene el negocio principalmente por reorden y
referido, con Instagram/Facebook como el canal de descubrimiento constante —
sin depender de gasto pago, que hoy no está presupuestado ni es necesario a
este volumen.

## 2. Marco estratégico

**Categoría:** sandwichería de pedidos online, Trujillo, Perú. No es "delivery
genérico" ni "cadena de sándwiches" — es curaduría (7 Signatures con historia
propia) + build-your-own + un menú secreto por rango (THE VAULT), con
mecánicas de fidelidad reales detrás.

**Quién compra:** dos perfiles distintos que conviven en el mismo catálogo —
quien quiere decidir rápido (pide un Signature, listo) y quien quiere armar
exactamente lo que quiere (build-your-own). El menú secreto y los rangos
apuntan a un tercer perfil, el cliente recurrente que ya conoce la marca — no
convierte al primer comprador, así que el contenido de lanzamiento no debe
apoyarse en él como gancho principal (ver `COMPETITIVE_POSITIONING.md`).

**Voz de marca (no negociable, ya documentada en `DESIGN.md`):** "Prada Caffè
Discipline" — editorial, sin exceso, un solo acento dorado, cero saturación
tipo "app de delivery". El "//" es el ícono permanente, pero NO está atado a
ninguna estética de "tech/terminal" — libre de reinterpretarse visualmente. El
tono de copy es directo, sin urgencia falsa, sin "¡¡SÚPER OFERTA!!" — coherente
con que el negocio compite en curaduría, no en descuento agresivo.

**Restricción de identidad:** SND//WCH NO tiene anclaje regional/trujillano
(confirmado explícitamente por el dueño) — el contenido no debe apoyarse en
referencias a Chan Chan, cultura Chimú, ni "somos de Trujillo" como ángulo de
marca. Trujillo es dónde se entrega, no el pitch.

## 3. Estado actual

**Equipo:** una persona (el dueño), sin presupuesto de marketing formal, sin
agencia ni freelancer contratado. Arma los pedidos él mismo — el tiempo
disponible para producir contenido es real pero limitado; cualquier formato de
contenido debe ser grabable en minutos, no producciones de medio día.

**Presupuesto pago:** confirmado por el dueño 2026-08-01 — **S/300 iniciales,
escalable** según resultado. Fecha de arranque recomendada (decisión técnica,
no del dueño — ver §13 decisión #6): últimas 1-2 semanas antes de apertura,
no desde hoy. Motivo: la lógica de §12 es impulsar (boost) contenido orgánico
que ya demostró tracción real, no financiar campañas sin ningún dato de qué
funciona — arrancar el gasto antes de tener al menos 2-3 Reels publicados
desestima esa ventaja. Concentrar el grueso del presupuesto en boostear el
Reel de apertura + el/los Reels de pre-lanzamiento con mejor performance real
(pedidos desde la waitlist, no likes).

**Ya construido y listo para usar (sin escribir código nuevo):**
- Página de Facebook, cuenta de Instagram Business y Meta Business Manager ya
  creados por el dueño.
- Integración técnica de publicación automática a Instagram/Facebook desde el
  panel admin (`actAdminPublishSocial`) — **bloqueada solo por 3 secrets sin
  configurar** (`META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`).
  Este es el desbloqueo #1 antes de que cualquier parte de este plan que
  dependa de publicación automática funcione — sin esto, publicar sigue siendo
  100% manual desde el celular, lo cual igual es viable pero pierde la
  automatización ya pagada en trabajo de desarrollo.
- Calendario de contenido en el panel admin (`marketing_calendar`) — permite
  planear texto + foto por fecha/canal y publicar con un toque una vez estén
  los secrets.
- Lista de espera pre-lanzamiento (`waitlist_signups`) — cualquier visitante
  sin cuenta deja su teléfono. Hoy la tarjeta se muestra en el Home; se retira
  sola el día que actives "Ya abrimos" en Admin → Horario de atención (fix de
  esta misma sesión).
- Sistema de códigos promocionales (crear/validar/canjear).
- Programa de puntos y rangos (NUEVO → REGULAR → INICIADO → CÍRCULO INTERNO →
  MESA FUNDADORA), con bono de bienvenida, bono de referido, reto mensual y
  reto de descubrimiento (3 Signatures distintos).
- Resurfacing del código de referido post-entrega (se lo recuerdan al cliente
  justo después de recibir su pedido, el momento de mayor satisfacción).
- Consentimiento de reseña como testimonio — el cliente autoriza explícitamente
  que su calificación se use en redes, lo cual habilita reposting de UGC sin
  fricción legal.
- Crons de recordatorio al cliente: hora pico sin pedir, carrito abandonado,
  segundo pedido, re-enganche de rango alto, "nunca ha pedido" (3 etapas),
  aniversario de cuenta.

**Fase del negocio:** pre-apertura. **Fecha de apertura confirmada: lunes 7 de
septiembre de 2026** (dueño, 2026-08-01). Todo dato de `orders`/`customers` hoy
en producción es de prueba (~10 pedidos, 2 clientes) — no hay historial de
ventas real todavía, así que ninguna proyección de este plan es un pronóstico,
es una hipótesis de trabajo a validar con datos reales apenas haya volumen.

**Urgencia de calendario (2026-08-01):** con apertura el 7 de septiembre,
quedan ~5.3 semanas — menos que las 6 semanas que asume el calendario de §9.
La pieza de "semana -6" (Reel "Por qué //") ya debería estar grabada; empezarla
esta misma semana para no perder más terreno. El resto del calendario de §9 se
corre completo, comprimido a 5 semanas en vez de 6 (fusionar semana -6 y -5 si
hace falta, no saltarse ninguna pieza).

## 4. Adquisición — cómo se enteran desconocidos

**Canal principal: Instagram/Facebook orgánico (Reels + Historias + Feed).**
Ver §9 para el calendario de contenido detallado — esta sección cubre la
estrategia, §9 la ejecución semana a semana.

**Canales secundarios:**
- **WhatsApp de boca en boca**: cada pedido ya genera un mensaje de WhatsApp
  formateado al admin; el mismo canal sirve para que un cliente comparta
  directo con un amigo ("mira lo que pedí"). No requiere código nuevo, solo
  incentivarlo en el copy de la confirmación de pedido.
- **Google Maps / búsqueda local**: crear la ficha de Google Business Profile
  (gratis, no requiere presupuesto) apenas haya dirección física de operación
  confirmada — fuera del alcance de este plan (dato del negocio, no de
  marketing), pero es la acción de mayor apalancamiento en SEO local a costo
  cero. **Anotado como decisión abierta en §13.**
- **Lista de espera → primeros clientes**: cada persona que dejó su teléfono
  antes de abrir es la conversión más barata que existe — ya mostró intención.
  El día de apertura, un mensaje directo (WhatsApp o llamada, no espera a un
  cron) convierte mejor que cualquier post nuevo.

**Ads pagados (Meta Ads):** la idea ya se conversó, el monto y la fecha de
arranque son la decisión abierta #6 de §13. En cuanto haya presupuesto
confirmado, la forma más barata y de menor riesgo de empezar es impulsar
(boost) los Reels orgánicos con mejor rendimiento real (no likes, pedidos) en
vez de armar campañas nuevas desde cero — el contenido de §9 ya sirve como
banco de creativos probados antes de gastar en algo sin validar. Las skills
`ads` y `ad-creative` (ya instaladas en este proyecto) cubren la estrategia de
campaña y la generación de variantes de copy/headline respectivamente, cuando
llegue el momento de usarlas.

**Lo que este plan deliberadamente NO incluye (por ahora):** SEO de
contenido/blog (la app es de una sola página, no hay dónde publicar contenido
indexable sin construir infraestructura nueva — fuera de alcance),
influencers pagados en efectivo (ver §12 para la versión gratuita — intercambio
de producto por post, viable con micro-influencers locales de comida en
Trujillo).

## 5. Activación — de "vio el Instagram" a "primer pedido pagado"

El camino más corto ya existe: cualquier Reel/Historia con swipe-up o link en
bio lleva directo al Home, y con carrito vacío el primer sándwich entra en
"modo pago rápido" (checkout completo en la misma pantalla, sin pasar por TU
CARRITO) — la fricción técnica ya está resuelta, el trabajo de esta sección es
solo asegurar que el primer contacto (el contenido) apunte directo a probar.

**Regla de oro para el contenido de activación:** todo Reel de lanzamiento debe
terminar con una acción de un solo paso — "el link está en la bio", nunca "búscanos
y regístrate". El registro (con DNI obligatorio) puede esperar al segundo
pedido; el primero debe poder hacerse como invitado.

**Incentivo de activación real, ya construido:** bono de bienvenida al
registrarse. Vale la pena mencionarlo en el contenido de lanzamiento ("primer
pedido + cuenta = puntos de regalo"), pero sin convertirlo en el gancho
principal — el gancho es el producto (ver §9).

## 6. Retención — cómo se queda quien ya compró

Esto ya corre solo, vía los crons existentes — el trabajo humano en esta
sección es cero código, solo verificar que el contenido semanal (§9) refuerce
lo mismo que las automatizaciones ya empujan por su cuenta:
- Reto mensual (3 pedidos pagados = 50 pts) y reto de descubrimiento (3
  Signatures distintos = 50 pts) — el contenido puede recordar estos retos sin
  que suene a "recordatorio automático", ej. una Historia semanal tipo "¿ya
  probaste tu 3er Signature este mes?".
- Combo hora valle (bebida gratis 2pm-6pm) — contenido recurrente de "última
  llamada" antes de las 6pm en Historias, aprovechando el sticker de cuenta
  regresiva.
- Recompensas (R02-R06) — cada una es contenido potencial ("¿sabías que puedes
  subir gratis a 30CM?").

**Único hueco real de retención sin cubrir por automatización:** no hay
newsletter/email de retención más allá de lo transaccional — no es una
prioridad para este plan (Instagram ya cumple ese rol para este tipo de
negocio local), pero queda anotado como decisión abierta en §13 si el volumen
crece.

## 7. Referido — cómo el que ya compró trae al siguiente

Ya construido de punta a punta: bono de referido (ambos lados), y el
resurfacing post-entrega que se lo recuerda al cliente justo después de recibir
su pedido — el momento de mayor satisfacción, no un email genérico tres días
después.

**Lo que el contenido puede sumar:** explicar el mecanismo en un Reel corto
("cómo funciona invitar a un amigo") una sola vez en el lanzamiento, y dejar
que la automatización haga el resto — no hace falta empujarlo en cada post,
sería redundante con lo que ya pasa dentro de la app.

## 8. Ingresos — precio, promociones, upsell

Cubierto en detalle en `catalog.ts`/CLAUDE.md (contexto de negocio), no se
repite aquí. Lo relevante para marketing:
- **Yape/Plin es "Recomendado" en el checkout porque no paga comisión** — el
  contenido de lanzamiento puede mencionarlo como ventaja real ("sin recargo
  de tarjeta"), no solo como opción técnica.
- **Los códigos promocionales ya construidos** son la palanca de precio más
  barata para el lanzamiento — un código de un solo uso para quien viene de la
  lista de espera ("WAITLIST10" o similar) cuesta cero en desarrollo, ya
  existe el sistema.
- **Tarjeta de regalo (puntos, no cobro Culqi) y Plan Semanal** son
  mecanismos de ingreso anticipado/fidelización que el contenido puede
  introducir después del lanzamiento (semana 4+), no en el día 1 — son
  conceptos que requieren que el cliente ya confíe en la marca.

## 9. Calendario de contenido — Reels, Historias y demás (el corazón de este plan)

Todo lo de abajo es grabable con un celular, por una sola persona, sin equipo
de producción. Formato por defecto: vertical, 9:16, sin necesidad de edición
compleja (las apps nativas de Instagram/CapCut bastan).

### Pre-lanzamiento (semanas -6 a -1 antes de abrir)

**Cadencia:** 2-3 Reels/semana + Historias diarias (aunque sea una).

| Semana | Reel(s) | Historias | Objetivo |
|---|---|---|---|
| -6 | "Por qué //" — el dueño (voz en off o cámara, a su elección) cuenta en 20-30seg por qué nace SND//WCH, sin mostrar el menú todavía. Cierre: "Muy pronto." | Encuesta: "¿Sándwich curado o armado por ti?" | Generar curiosidad, empezar a construir la lista de espera |
| -5 | Close-up del pan real (formato sub/hoagie, nunca pan de molde) siendo cortado — textura, corte transversal, sin mostrar el sándwich armado completo todavía | Cuenta regresiva sticker hacia la fecha de apertura + link a la waitlist | Reforzar "esto es artesanal", capturar más teléfonos |
| -4 | "Arma tu propio //" — timelapse de un build-your-own completo, capa por capa (pan, proteína, topping, salsa) | Pregunta: "¿Cuál proteína no puede faltar en tu sándwich?" | Mostrar la mecánica BYO sin revelar precios todavía |
| -3 | Reveal de 1-2 Signatures (nombre + foto, sin el menú completo) — "THE ORIGINAL" y otro contrastante | Sticker de cuenta regresiva actualizado + "guarda este post" | Empezar a anclar nombres de producto en la memoria |
| -2 | Teaser de THE VAULT (menú secreto) — nunca mostrar qué es, solo "hay algo que no todos van a poder pedir el día 1" | Historia tipo "shh" con sticker de emoji de candado | Crear intriga sin gastar el gancho principal antes de tiempo |
| -1 | "Así se pide" — mini demo de 15-20seg del flujo de compra real en la app (elegir, pagar con Yape, confirmar) | Countdown final "Mañana abrimos" + recordatorio de la lista de espera | Bajar la fricción percibida antes del día 1 |

### Semana de apertura (día 0 a día 7)

- **Reel de apertura**: anuncio directo, sin vueltas — "Ya estamos abiertos //",
  con el wordmark como protagonista (coherente con la identidad visual). CTA:
  link en bio.
- **Mensaje directo a la lista de espera** (WhatsApp/llamada, no solo post) —
  la conversión más barata del lanzamiento, no depender solo de que vean el
  Instagram orgánicamente ese día.
- **Historias en vivo del primer día**: pedidos reales saliendo (con
  consentimiento si se ve al cliente), aunque sean pocos — la autenticidad de
  "recién estamos empezando" vende mejor que fingir que ya hay una cola larga.
- **Reel "cómo pedir en 3 pasos"**: tutorial corto y directo, pensado para
  quien todavía no se anima a probar la app.
- **Publicar el código promocional de lanzamiento** (si se decide usar uno) en
  post fijo + Historia con sticker de link.

### Primeras 8 semanas post-apertura

**Cadencia sostenida:** 3 Reels/semana + Historias diarias. Esto es más
exigente que el pre-lanzamiento — realista solo si cada pieza toma minutos, no
horas. Formatos recurrentes (reducen el costo de decidir qué grabar cada vez):

1. **"Armando el [Signature de la semana]"** — estilo ASMR/timelapse, un
   Signature distinto cada semana, rotando los 7 (6 públicos + eventualmente
   THE VAULT una vez algunos clientes ya llegaron a INICIADO). 1 Reel/semana
   fijo en este formato.
2. **Reposting de UGC** — fotos/reseñas de clientes reales que ya dieron su
   consentimiento (flujo ya construido: consentimiento de reseña como
   testimonio). Sin este contenido no hay reposting legal, así que activar
   este flujo desde el pedido #1 importa. 1 Historia/semana mínimo.
3. **Explicación de una recompensa/mecánica distinta cada semana** — bebida
   gratis, sube a 30CM gratis, doble proteína gratis, el programa de rangos,
   la tarjeta de regalo. Reduce a "por qué comprar de nuevo" sin sonar a
   publicidad repetida — cada semana es información nueva, no el mismo pitch.
4. **"Última llamada hora valle"** — Historia recurrente, ~1:30pm, recordando
   la ventana de bebida gratis 2pm-6pm. Aprovecha el sticker de cuenta
   regresiva de Instagram apuntando a las 6pm.
5. **Detrás de cámara / la persona detrás de la marca** — el dueño mostrando
   algo del proceso (compra de insumos, preparación) sin que sea siempre
   "vendiendo" — humaniza la cuenta, funciona mejor en Historias que en Reels.

**Publicación técnica:** una vez configurados los 3 secrets de Meta, todo lo de
arriba se puede planear en el calendario del panel admin
(`marketing_calendar`) y publicarse con el botón "Publicar ahora" en vez de
subirlo a mano desde el celular — pero el contenido en sí (grabar, elegir el
mejor take) sigue siendo trabajo humano, ninguna herramienta lo reemplaza.

### Reglas de copy para todo el contenido (heredadas de la voz de marca)

- Nunca "¡¡OFERTA IMPERDIBLE!!" — el tono es editorial, no de urgencia
  artificial. "Bebida gratis de 2 a 6pm" es suficiente, sin signos de
  exclamación en cascada.
- El "//" aparece en captions como separador tipográfico natural ("Nuevo //
  THE VAULT"), no como decoración forzada en cada frase.
- Nunca inventar reseñas, testimonios o cifras de venta — todo UGC reposteado
  debe venir del flujo de consentimiento real, nunca redactado a mano
  simulando ser de un cliente.
- Nunca anclar el contenido a identidad trujillana/Chimú/regional — Trujillo
  es la zona de entrega, no el ángulo narrativo.

## 10. Vista a 12 meses

- **Meses 1-2 (apertura):** foco total en §9 — cadencia de contenido +
  conversión de lista de espera. Métrica que más importa: % de la lista de
  espera que hizo su primer pedido.
- **Meses 3-4:** primeros datos reales de qué contenido convierte (qué Reels
  generaron más pedidos, no solo más likes) — ajustar la cadencia hacia lo que
  funciona, no seguir el calendario de §9 al pie de la letra si algo distinto
  está rindiendo mejor. Si para entonces ya hay presupuesto de ads confirmado
  (§13, decisión #6), este es el momento natural de empezar a impulsar el
  contenido que ya demostró funcionar orgánicamente, en vez de partir de cero.
- **Meses 5-6:** evaluar activar el código promocional del programa de
  referidos con más fuerza si el % de pedidos recurrentes (rango INICIADO+)
  es bajo — el dato real decide, no una fecha fija en un calendario.
- **Meses 7-12:** solo si el volumen de pedidos justifica dejar de ser un
  operador solo (umbral ya documentado en CLAUDE.md: "esto deja de ser válido
  si el volumen crece lo suficiente como para necesitar contratar"), evaluar
  la primera contratación — probablemente alguien que ayude con cocina/armado,
  liberando tiempo del dueño para seguir produciendo contenido, no un
  "community manager" contratado antes de que haya presupuesto real para
  justificarlo.

## 11. Stack operativo — qué ejecuta cada movimiento

| Movimiento | Herramienta SND//WCH | Estado |
|---|---|---|
| Lista de espera pre-lanzamiento | `waitlist-join` + panel admin | Construido, activo |
| Publicación automática Instagram/Facebook | `actAdminPublishSocial` | Construido, **bloqueado por 3 secrets** |
| Calendario de contenido | `marketing_calendar` + panel admin | Construido, activo |
| Códigos promocionales | Sistema completo (crear/validar/canjear) | Construido, activo |
| Programa de puntos/rangos/retos | RWDS, RANKS, retos mensual/descubrimiento | Construido, activo |
| Resurfacing de referido post-entrega | Cron automático | Construido, activo |
| Consentimiento de reseña como testimonio | Flujo de calificación post-entrega | Construido, activo |
| Recordatorios de retención (carrito, hora pico, etc.) | Crons en `api` | Construido, activo |
| Bandera "negocio ya abrió" (retira la tarjeta de waitlist) | `app_settings.business_launched`, toggle en Admin → Horario | Construido, activo (fix de esta sesión) |
| Google Business Profile | — | No construido, fuera del alcance técnico — acción manual del dueño |
| Producción del contenido en sí (grabar Reels/Historias) | — | No automatizable — trabajo humano cada semana |

## 12. Banco de ideas — priorizadas para este negocio

**Ahora (pre-lanzamiento / lanzamiento):**
- Todo el calendario de §9.
- Activar los 3 secrets de Meta para publicación automática.
- Crear Google Business Profile (gratis, alto impacto en búsqueda local).
- Código promocional exclusivo para la lista de espera.
- ~~Cerrar el monto real de ads pagados~~ — resuelto, S/300 iniciales
  escalables (§13, decisión #6). Falta solo decidir la fecha exacta de
  arranque dentro de la ventana recomendada.

**En cuanto haya presupuesto de ads confirmado:**
- Boost de los Reels con mejor rendimiento orgánico real (pedidos, no likes) —
  más barato y menos riesgoso que armar campañas nuevas sin datos.
- Si el volumen de aprendizaje lo justifica, campaña de Meta Ads dirigida
  (retargeting de quienes vieron el contenido orgánico sin comprar) — usar la
  skill `ads` para la estrategia y `ad-creative` para las variantes de copy.

**Q1 post-apertura (primeros 3 meses):**
- Intercambio de producto por post con 1-2 micro-influencers locales de comida
  en Trujillo (sin pago en efectivo — regalo de producto a cambio de
  contenido, acordado explícitamente como intercambio, no como publicidad
  encubierta).
- Primeros ajustes de cadencia según qué contenido convierte de verdad (ver
  §10).

**Q2+ (solo si el volumen lo justifica):**
- Newsletter/email de retención más allá de lo transaccional.

**Descartado explícitamente (con motivo):**
- SEO de contenido/blog — la app es de una sola página, no hay infraestructura
  de contenido indexable; construirla no es prioridad frente al contenido
  social, que es más barato y más rápido de producir para este negocio.
- Cualquier ángulo de marca regional/trujillano — descartado explícitamente
  por el dueño, no es una omisión.
- Multiplicador VIP en el programa de puntos — retirado a propósito en el
  diseño del programa (ver CLAUDE.md), no se reintroduce vía marketing.

## 13. Medición, decisiones abiertas, apéndice

**Métrica que más importa (norte):** % de la lista de espera que convierte a
primer pedido en los primeros 7 días de apertura. Es la señal más temprana y
más barata de si el contenido de pre-lanzamiento funcionó.

**Métricas secundarias a mirar desde el dashboard admin ya construido:**
ingresos, tendencia de 14 días, top productos, clientes en riesgo de fuga,
rendimiento por franja horaria (ya existen en Admin → Dashboard, no requieren
nada nuevo).

**Decisiones abiertas (sin resolver en este plan, requieren al dueño):**
1. ~~Fecha de apertura exacta~~ — **RESUELTO 2026-08-01: lunes 7 de septiembre
   de 2026.** Falta activar `business_launched` a mano ese día (o el día real,
   si se corre).
2. **Google Business Profile** — requiere dirección física confirmada de
   operación, dato de negocio fuera del alcance de este plan.
3. **Configurar los 3 secrets de Meta** (`META_PAGE_ACCESS_TOKEN`,
   `META_PAGE_ID`, `META_IG_USER_ID`) — el dueño está en proceso de extraerlos
   desde Meta Business Manager/Graph API Explorer (guía dada 2026-08-01); sin
   esto, la mitad del stack operativo de §11 sigue siendo manual.
4. **¿Habrá un código promocional específico de lanzamiento?** — el sistema ya
   existe, falta decidir el monto/condición y crearlo desde el panel admin.
5. **CAC real** — sin gasto pago hasta ahora, no hay costo de adquisición que
   medir más allá del tiempo del dueño; empieza a poder calcularse en cuanto
   arranque el presupuesto de ads (punto 6).
6. ~~Monto y fecha de arranque de ads pagados~~ — **RESUELTO (monto)
   2026-08-01: S/300 iniciales, escalable.** Fecha de arranque queda a
   criterio operativo: recomendado últimas 1-2 semanas antes del 7 de
   septiembre, no desde hoy (ver §3, motivo detallado ahí).

## 14. Plan de conversión desde frío (agregado 2026-08-03)

**Por qué esta sección existe aparte:** `waitlist_signups` tiene **0 inscritos** (consultado
en vivo, 2026-08-03) — todo lo de arriba (§9 en adelante) asume que hay algo de audiencia
"tibia" esperando. Hoy no la hay. Este plan asume tráfico 100% frío: nadie que llegue a la
cuenta o a la app te conoce todavía. Investigado con fuentes externas (no solo criterio
propio) — ver fuentes al final de cada bloque.

### 14.1 Cambio de énfasis: TikTok primero, no Instagram primero

El plan original (§4/§9) trata Instagram/Facebook como el canal principal. Con audiencia en
cero, eso hay que revisarlo: en 2026, TikTok tiene ~3.70% de engagement promedio (+49%
interanual) contra ~0.48% de Instagram, y da hasta 10x más alcance orgánico con el mismo
contenido — la diferencia está en que un Reel/TikTok se muestra a gente que **nunca vio la
cuenta** (vía Explore/For You), mientras que un post de feed normal se muestra sobre todo a
quien ya te sigue. Para ganar seguidores desde cero, el formato que ya se graba para
Instagram (Reels verticales, celular, sin producción) se sube **igual a TikTok**, sin
trabajo extra — es el mismo archivo. ([Malou — TikTok for Restaurants 2026](https://www.malou.io/en-us/blog/tiktok-for-restaurants),
[SocialMediaToday](https://www.socialmediatoday.com/news/brands-see-biggest-growth-on-tiktok-but-organic-reach-is-slowing-on-instagr/812789/))

**Semana 1 de TikTok (arranque del algoritmo, aplica también a Instagram):** publicar 3
piezas la primera semana — 1 de producto/visual, 1 detrás de cámara, 1 formato tendencia —
para señalizar cuenta activa, y **responder cada comentario dentro de la primera hora** (el
algoritmo premia el loop de interacción rápida, no solo el contenido en sí).

**No se propone abandonar Instagram** — Facebook/Instagram siguen siendo donde el 45% de la
gente revisa el perfil de un restaurante antes de pedir, y ahí vive toda la automatización
ya construida (`actAdminPublishSocial`) — se sigue publicando en ambos, solo que TikTok deja
de ser una idea "en cuanto haya tiempo" y pasa a tener la misma prioridad desde el día 1.

### 14.2 Conseguir seguidores reales desde cero — tácticas concretas

1. **Geoetiquetar cada publicación** con la ubicación de reparto — hace que la cuenta
   aparezca a gente buscando o navegando cerca, sin gastar nada.
2. **UGC con incentivo real, usando lo que ya existe**: un sticker/QR en el empaque que
   lleve directo al perfil, con una recompensa por etiquetar en su historia/video al recibir
   el pedido — la recompensa puede ser puntos del programa ya construido (ej. +50 pts, el
   mismo monto que el reto de descubrimiento) en vez de inventar un mecanismo de premio
   nuevo.
3. **Colaboraciones con cuentas locales de Trujillo que compartan audiencia** (no
   competidores directos — ej. una cafetería, un gimnasio, un fotógrafo de comida local) —
   un Reel conjunto simple es de las formas más rápidas de ganar visibilidad real sin gastar.
4. **Sorteo de lanzamiento con mecánica de referido**, enganchado al sistema de referidos
   YA CONSTRUIDO: en vez de "comenta y etiqueta a 3 amigos" (spam de comentarios, cada vez
   más penalizado por las plataformas), cada participante entra con SU propio código de
   referido — quien se una con ese código le suma una entrada extra al sorteo. Esto es
   exactamente el loop que ya paga la app (bono de referido ambos lados) con una capa de
   sorteo encima; el mecanismo de referido no es código nuevo, la campaña sí es una decisión
   de negocio (premio, fecha, monto) que falta definir contigo — ver §14.7.
5. **Google Business Profile** — sigue bloqueado por la misma razón de siempre (dirección
   física confirmada), pero confirmado por investigación externa que es alto impacto/costo
   cero: 45% de comensales lo revisan antes de pedir. Prioridad #1 en cuanto tengas la
   dirección de operación lista.
6. **WhatsApp ultra-local**: compartir el catálogo (ya existe como resumen del pedido) en
   grupos de vecinos/urbanización cercanos a la zona de reparto — la recomendación
   boca-a-boca sigue siendo el canal de mayor conversión real para un delivery nuevo en Perú
   (+80% del primer pedido de un cliente nuevo viene de una recomendación directa, no de un
   anuncio).

Fuentes: [Tiendanube — 14 estrategias 2026](https://www.tiendanube.com/blog/como-conseguir-seguidores-en-instagram/),
[CursoTutorial — primeros 1000 seguidores](https://cursotutorial.com/instagram-2026-primeros-1000-seguidores/),
[KickoffLabs — Instagram Giveaway Rules 2026](https://kickofflabs.com/blog/instagram-giveaway-rules-2026/),
[Restaurant India — cloud kitchen marketing](https://restaurant.indianretailer.com/article/how-to-market-your-cloud-kitchen-business.13833),
[PANCA — Delivery para Restaurantes en Perú](https://www.panca.pe/blog/delivery-restaurante-peru-como-empezar/).

### 14.3 Convertir tráfico frío en primer pedido — sin ninguna reseña/prueba social todavía

Investigación externa: sitios de comida/delivery convierten en promedio 4.5-6%, con >5%
como buen resultado; por debajo de 3% hay fricción real que vale la pena buscar. Sin
reseñas (el negocio no ha abierto — ninguna es real todavía), la regla que más aplica es
"cada sección debe quitarle una incertidumbre concreta al visitante nuevo, no sumar
adorno". Revisando la app contra eso:

**Ya cumple** (confirmado en la auditoría de UX de esta sesión, sin cambios pendientes):
checkout como invitado sin login forzado, precio final visible antes de pagar sin cargos
sorpresa, flujo de pago claro (Culqi/Yape/Plin explícitos).

**Fricción real que sigue sin resolverse — requiere una decisión tuya, no es solo código:**
fotos de producto son de stock licenciado, no reales (el negocio no ha abierto) — la
investigación confirma que las imágenes son el primer punto de contacto real ("se come
primero con los ojos", afecta conversión más que casi cualquier otro elemento) — en cuanto
haya fotos reales de los primeros pedidos saliendo, reemplazarlas es la mejora de conversión
de mayor impacto disponible, más que cualquier cambio de copy o de layout.

Fuentes: [Unicorn Platform — Food Delivery Conversion Pages 2026](https://unicornplatform.com/blog/food-delivery-conversion-pages-in-2026/),
[Percengage — Restaurant Website CRO 2026](https://percengage.com/blog/restaurant-website-conversion-optimization-turn-browsers-diners-delivery-orders),
[Ressto — Why your restaurant website gets traffic but no orders](https://ressto.co/blog/restaurant-conversion-rate-optimization/).

### 14.4 Qué le falta a la página (app.ts) para este embudo específico — PROPUESTA, sin implementar todavía

Estos 3 cambios son los que de verdad conectan "alguien llega frío desde TikTok/Instagram" →
"hace su primer pedido". Ninguno se ha tocado — quedan para que elijas cuáles aprobar antes
de escribir código (ver §14.7):

1. **Código de bienvenida visible de inmediato para quien llega desde el link en bio** —
   hoy el sistema de códigos promocionales ya existe, pero nadie ve un incentivo concreto en
   el primer segundo de la visita. Un banner simple ("Primer pedido // -S/X con el código
   BIENVENIDA") reduce exactamente la incertidumbre de "¿vale la pena pedir aquí sin conocer
   la marca?" — coincide con el punto 4 de las decisiones abiertas de §13, que ya estaba
   pendiente de definir monto/condición.
2. **Reforzar el copy de la tarjeta de lista de espera** ahora que se sabe que está en 0 —
   de un mensaje pasivo a algo con incentivo real medible (ej. "los primeros 20 inscritos
   reciben X puntos de bienvenida extra al abrir"), usando el programa de puntos ya
   construido, no un mecanismo nuevo.
3. **Reforzar el copy del resurfacing de referido post-entrega** para pedir explícitamente
   compartir en redes (no solo WhatsApp 1:1 como está hoy) — mismo momento de mayor
   satisfacción que ya se aprovecha, con un pedido más específico.

### 14.5 Automatización — qué corre solo vs qué es trabajo humano

| Tarea | Estado |
|---|---|
| Publicar a Instagram/Facebook con un toque | Construido, bloqueado por 3 secrets de Meta (§11, sin cambio) |
| Publicar a TikTok con un toque | **No construido** — TikTok no tiene una integración propia en `api`; publicar ahí sigue siendo manual desde el celular, igual que Instagram/Facebook antes de `actAdminPublishSocial`. Evaluar si vale la pena construirla una vez que el resto del embudo esté validado — no es prioridad #1 hoy. |
| Sorteo de lanzamiento con mecánica de referido | El motor (bono de referido) ya corre solo — la campaña en sí (definir premio/fecha/anunciarla) es trabajo humano, una sola vez |
| Código de bienvenida para tráfico frío | El sistema de códigos promocionales ya corre solo una vez creado — falta crearlo (decisión de monto) y, si se aprueba, el banner de la app (§14.4.1) |
| Grabar/publicar contenido en sí (Reels/TikToks) | No automatizable — trabajo humano cada semana, sin cambio respecto al plan original |

### 14.6 Calendario de 5 semanas — integrado con §9, no lo reemplaza

El calendario de §9 (semanas -6 a -1) sigue siendo la base — lo único que cambia es
publicar cada pieza en TikTok Y Reels desde el día 1 (no solo Instagram), y sumar estas 2
piezas nuevas en las semanas donde tiene más sentido:

- **Semana -5 (ahora)**: además del Reel de §9, lanzar el sorteo de referido si se aprueba
  (§14.7) — es la pieza con más potencial de generar los primeros seguidores reales rápido.
- **Semana -3/-2**: si hay dirección física confirmada, activar Google Business Profile.
- **Semana -1**: banner de código de bienvenida activo en la app, listo para el tráfico que
  llegue de la última semana de contenido antes de abrir.

### 14.7 Decisiones que requieren tu aprobación antes de que se ejecute algo real

Nada de esto se ha creado ni tocado todavía — son decisiones de negocio, no técnicas:

1. **¿Aprobamos el código promocional de bienvenida?** Falta el monto/condición (ej. -S/5,
   -15%, tope de descuento) y si se limita a primer pedido.
2. **¿Aprobamos el sorteo de lanzamiento con mecánica de referido?** Falta definir el premio
   (¿un Plan Semanal gratis? ¿crédito? ¿un combo específico?), la fecha de cierre, y si
   quieres que use exactamente el sistema de referidos existente o algo aparte.
3. **¿Autorizas que actualice el copy de la tarjeta de lista de espera y del resurfacing de
   referido** (solo texto, sin nueva lógica) para reflejar lo de arriba?
4. Todo lo demás de esta sección (TikTok como prioridad igual a Instagram, geoetiquetado,
   colaboraciones, WhatsApp local, UGC con QR) es contenido/operación pura — no requiere
   aprobación técnica, se ejecuta según tu propio criterio y tiempo disponible.
