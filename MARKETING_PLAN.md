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
propia) + build-your-own + un menú secreto por rango (rotación mensual, antes fijo como "The Vault"), con
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
| -2 | Teaser del menú secreto (rota cada mes) — nunca mostrar qué es, solo "hay algo que no todos van a poder pedir el día 1" | Historia tipo "shh" con sticker de emoji de candado | Crear intriga sin gastar el gancho principal antes de tiempo |
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
   el menú secreto una vez algunos clientes ya llegaron a INICIADO). 1 Reel/semana
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
  el sabor del mes"), no como decoración forzada en cada frase.
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

### 14.4 Qué le falta a la página (app.ts) para este embudo específico — RESUELTO 2026-08-03

1. ~~Código de bienvenida~~ — **HECHO.** Código `BIENVENIDA` creado (S/5 fijo, mínimo de
   pedido S/15, sin fecha de expiración, una vez por cliente vía el sistema ya existente).
   Verificado financieramente seguro: con el ticket promedio (S/24) deja ~S/12.8 de
   contribución tras COGS; en el peor caso (pedido mínimo S/15) sigue positivo (~S/6.1).
2. ~~Copy de la tarjeta de lista de espera~~ — **HECHO.** Ahora menciona el código
   `BIENVENIDA` real en vez de prometer un mecanismo de "primeros N inscritos" que no existe
   en el backend (nunca se promete algo que la app no cumple de verdad).
3. ~~Copy del resurfacing de referido post-entrega~~ — **HECHO.** Ahora pide compartir en
   Instagram/TikTok/WhatsApp explícitamente — el botón ya usaba `navigator.share()` (abre el
   selector nativo completo) cuando está disponible, el copy viejo solo mencionaba
   WhatsApp y subestimaba lo que el botón de verdad hacía.

Falta todavía un banner específico para quien llega desde el link en bio con el código ya
resaltado en el primer segundo (más allá de la tarjeta de lista de espera) — no se hizo en
esta pasada, queda como posible mejora futura si el código `BIENVENIDA` no se nota lo
suficiente una vez haya tráfico real que medir.

### 14.5 Automatización — qué corre solo vs qué es trabajo humano

| Tarea | Estado |
|---|---|
| Publicar a Instagram/Facebook con un toque | Construido, bloqueado por 3 secrets de Meta (§11, sin cambio) |
| Publicar a TikTok con un toque | **No construido** — TikTok no tiene una integración propia en `api`; publicar ahí sigue siendo manual desde el celular, igual que Instagram/Facebook antes de `actAdminPublishSocial`. Evaluar si vale la pena construirla una vez que el resto del embudo esté validado — no es prioridad #1 hoy. |
| Sorteo de lanzamiento con mecánica de referido | El motor (bono de referido) ya corre solo — la campaña en sí (definir premio/anunciarla) es trabajo humano, una sola vez. **Fecha decidida 2026-08-03: 2da semana de apertura (~14-21 de septiembre), no antes de abrir** — falta todavía el premio. |
| Código de bienvenida para tráfico frío | **RESUELTO 2026-08-03** — código `BIENVENIDA` (S/5 fijo, mínimo S/15) ya creado y activo, corre solo desde ahora. |
| Grabar/publicar contenido en sí (Reels/TikToks) | No automatizable — trabajo humano cada semana, sin cambio respecto al plan original |

### 14.6 Calendario — integrado con §9, no lo reemplaza

El calendario de §9 (semanas -6 a -1) sigue siendo la base — lo único que cambia es
publicar cada pieza en TikTok Y Reels desde el día 1 (no solo Instagram), y sumar estas
piezas nuevas donde corresponde:

- **Ahora (semana -5)**: código `BIENVENIDA` ya activo — mencionarlo desde el primer
  contenido de pre-lanzamiento en vez de esperar a la última semana.
- **Semana -3/-2**: si hay dirección física confirmada, activar Google Business Profile.
- **2da semana de apertura (~14-21 sept)**: sorteo de lanzamiento con mecánica de referido —
  movido de "antes de abrir" a después a pedido del dueño (2026-08-03), para lanzarlo con
  clientes reales ya entrando, no solo con seguidores fríos sin haber probado el producto.

### 14.7 Decisiones que requieren tu aprobación — actualizado 2026-08-03

1. ~~¿Aprobamos el código promocional de bienvenida?~~ — **RESUELTO: S/5 fijo, mínimo de
   pedido S/15, código `BIENVENIDA`, ya creado y activo.**
2. **¿Premio del sorteo de referido?** Fecha ya resuelta (2da semana de apertura) — falta
   definir el premio (¿un Plan Semanal gratis? ¿crédito? ¿un combo específico?) y si usa
   exactamente el sistema de referidos existente o algo aparte. Sigue abierto.
3. ~~¿Autorizas el cambio de copy?~~ — **RESUELTO: sí, aplicado** (tarjeta de lista de
   espera + resurfacing de referido post-entrega, ver §14.4).
4. Todo lo demás de esta sección (TikTok como prioridad igual a Instagram, geoetiquetado,
   colaboraciones, WhatsApp local, UGC con QR) es contenido/operación pura — no requiere
   aprobación técnica, se ejecuta según tu propio criterio y tiempo disponible.

## 15. Investigación profunda de mercado, competencia y conversión (agregado 2026-08-04)

10 investigaciones paralelas con WebSearch, cada una con fuentes citadas. Resumen ejecutivo
por tema — el detalle completo con todas las fuentes queda en el historial de la sesión;
acá solo lo accionable.

### 15.1 Competencia real en Trujillo

**Ningún competidor de Trujillo tiene programa de puntos/fidelización propio, y no existe
ningún "build-your-own sandwich" real operando en la ciudad** (confirmado tras búsqueda
específica, no solo ausencia de resultado). El líder histórico, **Jano's Sandwichería**
(la más establecida, precio bajo S/11-14), tiene debilidad documentada en velocidad/
precisión de pedido (2.9/5, 592 reseñas) — un competidor con cola de pedidos estructurada
(que SND//WCH ya tiene) compite directo en ese punto débil real, no inventado. Otros
locales identificados: La Stación, Sandwichería El Halley, Juguería San Agustín (más
parada rápida que delivery). Subway solo tiene presencia en el patio de comidas de Mall
Aventura Plaza Trujillo — sin build-your-own delivery propio en la ciudad. Cadenas
nacionales con delivery activo en Trujillo (competencia indirecta por el mismo momento de
consumo): Bembos, Pardos Chicken, China Wok, Otto Grill. Rappi lista ~48-50 locales en la
categoría "Sándwiches" en Trujillo, dominados por poke/acai, no sandwicherías tradicionales.

### 15.2 Subway (el competidor conceptual explícito de la marca)

Subway Perú expandió a Trujillo, con plan nacional de 100-150 locales en 5 años. Relanzó
globalmente su programa de lealtad **Sub Club** (4to sándwich footlong gratis cada 3
comprados) — confirma que la fidelización SÍ es un vector de competencia activo en la
categoría, no algo que SND//WCH inventó de más. Reputación real documentada: 2.0-2.7★ en
la mayoría de plataformas, quejas recurrentes de pan rancio/sin tostar, ingredientes
escasos, y solo 13% de tasa de resolución de quejas — contraste real y verificable para
comunicación de marca (curaduría + calidad consistente vs. cadena de bajo margen).

### 15.3 Mercado de delivery — Trujillo específicamente vs. nacional

**No existe ninguna cifra dura de pedidos/día para un delivery nuevo en Trujillo** (mismo
gap que ya documentaba `MENU_FINANCIAL_ANALYSIS.md` — confirmado de nuevo, no resuelto).
Trujillo sí es ciudad priorizada de expansión por Rappi/PedidosYa fuera de Lima. Contexto
nacional aplicable: horas pico almuerzo 12-14h y cena 19-22h (ticket más alto), fin de
semana (~45% de pedidos semanales) concentra la demanda, Yape/Plin ~60% de transacciones
de e-commerce en Perú. Las apps cobran 20-30% de comisión — negocios pequeños las usan
para captar clientes nuevos y migrarlos a pedido directo (exactamente el modelo de
SND//WCH, validado por la tendencia real del mercado, no solo por decisión propia).

### 15.4 Contenido de comida que convierte (no solo genera views)

Video de proceso/armado (ASMR) y "empaque del pedido" (packing) son los formatos con
mejor evidencia de conversión real — casos documentados de negocios de un solo operador
(Judy's Family Café, La Vecindad) creciendo ventas reales con celular, sin producción.
CTA debe ser específico ("pide antes de las X, link en bio"), nunca genérico. Escasez
real y verificable ("quedan N del Signature de hoy", ligada a alertas de stock bajo que
ya existen en el backend) es más creíble que urgencia inventada — coherente con la voz de
marca ya definida.

### 15.5 Convertir tráfico frío (sin ninguna reseña todavía)

Descuento de primer pedido en el rango **10-20%** es el estándar que mueve comportamiento
sin regalar margen de más — el `BIENVENIDA` ya creado (S/5 fijo sobre ticket promedio S/24
≈ 21%) cae justo en ese rango, validado con evidencia externa después del hecho. El **Libro
de Reclamaciones**, obligatorio por ley en Perú, funciona también como señal real de
confianza según fuentes de e-commerce peruano — vale la pena mostrarlo como parte de la
propuesta de transparencia, no solo como trámite legal escondido. La "regla de 7"
(≈7 exposiciones antes de decidir comprar) confirma que un solo Reel no basta — refuerza
la necesidad del calendario sostenido de §9, no un solo golpe de lanzamiento.

### 15.6 Psicología de precios — el formato actual ya está bien

El formato de precio de SND//WCH (símbolo S/ chico, sin decimales) ya sigue la evidencia
de menor "dolor de pagar" (Cornell, 2009) — no requiere cambio. Único hallazgo accionable
real: el combo de -S/2 se aplica en silencio al carrito sin mostrar el ahorro como cifra
explícita — un texto "Ahorras S/2" en el resumen probablemente convierte mejor que
dejarlo implícito (aversión a la pérdida > descuento silencioso).

### 15.7 Publicidad paga — S/300 refinado

Confirma y afina la recomendación de §12/§13: **nunca usar el botón "Impulsar publicación"
(optimiza para engagement, no pedidos)** — crear la campaña en Ads Manager con objetivo
Mensajes/Conversión. Radio geográfico 3-8 km sobre la zona real de reparto (ni "toda la
ciudad" ni hiperlocal). Reparto sugerido de los S/300: ~S/220 en 2-3 tandas de Meta Ads
(boosteando solo contenido con tracción real) + ~S/80 en TikTok Spark Ads o WhatsApp
click-to-chat si hay contenido con tracción para esa fecha.

### 15.8 Retención — 2 gaps reales encontrados cruzando con datos reales del cron

1. **`sndwch-remind-second-order` dispara mal calibrado**: hoy es día 3-5 desde el primer
   pedido a las 15:00 UTC (10am Lima) — la evidencia dice que el reorden mediano ocurre a
   los ~8.9 días y que push de comida convierte mejor 11:30am o 19:30-20:00h. Es un cambio
   de código real y acotado (mover el rango de días + el horario del cron), no implementado
   todavía — requiere tu aprobación antes de tocarlo (ver §15.9).
2. El reto mensual (3 pedidos=50pts) ya funciona como una "racha" mensual en la práctica —
   la recomendación es hacerlo más visible en la UI (barra de progreso tipo streak) en vez
   de construir un mecanismo de racha diaria nuevo, que no calza con la cadencia real de
   pedido semanal de este negocio.

### 15.9 Checkout — 1 gap real encontrado

~~No hay ningún estimado de tiempo de entrega visible en el checkout~~ — **CORRECCIÓN
2026-08-04: falso positivo del agente de investigación.** Verificado con `git blame`:
`checkoutExtrasHTML()` ya muestra "Tiempo estimado: 25-40 min" antes de pagar desde el
commit `390de6a`, anterior a esta investigación — el agente no lo encontró en su lectura
de código, pero sí existe. Mismo error que el punto de "Ahorras S/2" de §15.6 (también ya
existía, mismo commit). Segunda vez en la sesión que un agente que mezcla WebSearch con
lectura de código se equivoca en la parte de código — la lección queda anotada en
CLAUDE.md.

**De los 3 cambios de código identificados en §15.6/15.8/15.9, solo 1 era real —
IMPLEMENTADO 2026-08-04:**
1. ~~Mostrar "Ahorras S/2" explícito~~ — falso positivo, ya existía.
2. **Recalibrado el cron de "segundo pedido"** a día 7-10 (antes 3-5) y horario 7:30pm
   Lima (antes 10am) — cambio real, aplicado en `customer.ts` y en `cron.job` de Supabase.
3. ~~Agregar estimado de tiempo de entrega~~ — falso positivo, ya existía.

### 15.10 Tendencia estacional real a tener en cuenta

El **Festival Internacional de la Primavera de Trujillo** cae del 21 al 28 de septiembre
2026 (Gran Corso 27-28) — el evento cultural más grande de la ciudad, ~2 semanas después
de la apertura del 7 de septiembre. Es una ventana real de contenido/campaña con la
ciudad ya en modo festivo, sin necesidad de anclar la marca a identidad regional
(coherente con la restricción ya definida de no usar Trujillo/Chimú como ángulo de marca
— es solo timing de campaña, no identidad).

## 16. Ronda 2 de investigación: marketing y ventas (agregado 2026-08-04)

8 investigaciones nuevas con WebSearch, sin repetir lo ya cubierto en §15.

**16.1 Micro-influencers en Trujillo — playbook de 4 pasos.** (1) Buscar 5-8 cuentas
1K-10K seguidores vía hashtags/geotags locales en Instagram/TikTok (no hay directorio
dedicado de Trujillo, la vía real es manual). (2) Brief de una página por WhatsApp: qué
se entrega (ej. 2 sándwiches) a cambio de 1 post + 2 stories con mención, plazo de 7 días,
permiso de repost. (3) Cerrar 2-3. (4) **Código promocional único por influencer** (el
sistema ya existe) para medir pedidos reales atribuibles, no solo likes.

**16.2 Empaque como marketing — 3 ideas de bajo costo**, dentro del margen ya reservado
(~S/1.10/pedido): sticker circular con el "//" en bolsa/papel kraft neutro, nota impresa
corta con CTA "etiquétanos" + handle de Instagram, un solo color distintivo de bolsa como
identificador visual repetible en fotos. Sin caso individual documentado de un operador
único usando esto como canal principal, pero sí evidencia de que empaque de marca sube
retención hasta 25% en 6 meses (Packaging Machinery Manufacturers Institute).

**16.3 Canal de WhatsApp (no lista de difusión, no bot) — sí vale la pena.** La función
nativa "Canal" de WhatsApp Business (sin tope de 256, sin requerir que te tengan guardado)
funciona como feed unidireccional, tasas de apertura 60-80%. Máx. 1-2 publicaciones/semana
(nuevo Signature, promo de hora valle) para no arriesgar el quality rating del número. Cero
código, cero automatización — coherente con la decisión ya tomada de no activar el
asistente de IA de WhatsApp.

**16.4 Google Business Profile — ya estamos dentro de la ventana de preparación.**
Hallazgo importante: existe una categoría "service-area business" que oculta la dirección
al público (solo declara área de servicio) — aplica directo al modelo delivery-only de
SND//WCH, sin esperar a resolver el dato de dirección física para el público (sí se sigue
necesitando internamente para verificación). Además: **el perfil se puede crear ahora con
fecha de apertura futura y se hace público automáticamente 90 días antes de esa fecha** —
con apertura 7 sept 2026, esa ventana ya empezó (~9 jun 2026). Preparar ya: categoría,
descripción, horario, banco de 20-25 fotos, link a la app — todo lo que no depende de la
dirección.

**16.5 Upsell pagado — 3 tácticas concretas.** Ofrecer 30CM pagado (no solo con puntos)
**durante el paso de construcción del sándwich**, no en el carrito (los prompts de add-on
convierten mejor mientras el cliente aún está eligiendo). Una sola sugerencia de bebida en
el carrito, solo si falta. Nunca duplicar el mismo prompt en dos pantallas — máximo una
oferta visible por paso.

**16.6 Pre-venta para el día de apertura — no vale la pena.** El pedido programado que ya
existe cumple la misma función que la alternativa recomendada por la industria ("reserva
sin pago"). Cobrar por adelantado tiene sentido en catering de eventos grandes (costo fijo
alto que cubrir), no en un operador único donde el riesgo real es sobre-vender capacidad
de cocina el día 1, no el no-show. Considerar sí un tope de pedidos por franja horaria y
un soft opening acotado unos días antes de la apertura pública.

**16.7 Carrito abandonado — 1 ajuste de calibración sugerido.** El piso actual del cron
(`ABANDONED_CART_MIN_MINUTES=20`) está en el borde de lo que la evidencia marca como "ya
tarde" para comida (ventana ideal 8-15 min, límite duro 20 min) — sugiere bajarlo a
~10-12 min. El resto del diseño (un solo intento, sin descuento) ya está alineado con la
evidencia, sin cambio necesario ahí. **APROBADO e IMPLEMENTADO 2026-08-05** — bajado a 10
min en `customer.ts`.

**16.8 Ángulo B2B/corporativo — no ahora.** Demanda real pero sin evidencia de escala en
Trujillo (la oferta encontrada está concentrada en Lima). El pedido grupal actual (cada
quien paga lo suyo) no encaja con cómo las oficinas realmente prefieren pagar (factura
centralizada) — sería una feature nueva, no construida. Recomendación: priorizar 100%
consumidor individual hasta validar volumen operativo real; recién ahí evaluar 2-3
oficinas cercanas con contacto directo, sin construir facturación centralizada todavía.

## 17. Ronda 3: ventas desde frío por Instagram y WhatsApp (agregado 2026-08-05)

Investigación de conversión manual (sin bot/API de pago) para el arranque en frío. Nota
de cautela común a ambos: buena parte de la evidencia de conversión proviene de blogs de
herramientas de automatización DM con incentivo comercial directo — se cita por falta de
estudios independientes mejores, tómese como orientación direccional, no benchmark exacto.

**17.1 Velocidad de respuesta — la variable de mayor impacto, en ambos canales.**
Consistente en IG DM y WhatsApp: responder en el primer minuto puede multiplicar la
conversión hasta 391% (Velocify), con la ventaja cayendo a la mitad tras solo 4 minutos
más; a los 5 minutos las probabilidades de calificar el lead caen ~80%. En WhatsApp
específicamente, 98% de los leads abren el mensaje en los primeros 5 minutos (ese es el
margen real de respuesta), un estudio de Meta (2024) encontró +60% de conversión
respondiendo bajo 5 min, y 78% de los compradores le compran a la primera empresa que
responde — frente a un promedio de industria de ~42 horas. Activar notificaciones push y
tratar la respuesta como prioridad operativa durante horas de atención, no "cuando haya
tiempo", es la palanca de mayor retorno de todo este plan y no cuesta nada.

**17.2 Comment-to-DM manual en Instagram — viable sin bot a bajo volumen.** Meta soporta
oficialmente el patrón "comenta X y recibe un DM"; sin automatización se vuelve "revisar
comentarios y responder a mano", que no escala pero es totalmente manejable a volumen bajo
(pocas decenas de comentarios/día). Táctica concreta: en cada post de producto, pedir
"comenta 🥪 y te mando el link para pedir" y responder uno por uno con el link directo al
checkout — sin intermediarios de terceros.

**17.3 Botón nativo "Order Food" de Meta — gratis, vale la pena configurarlo.** Desde
septiembre 2025 el checkout nativo in-app de Instagram Shopping fue reemplazado por
checkout hacia el sitio propio, y el catálogo de Shopping exige productos físicos que se
envían (excluye comida preparada) — no aplica a SND//WCH. Lo que sí aplica es el botón
nativo "Order Food" de Meta para restaurantes (gratis, enlaza directo a la web propia) —
pendiente de configurar, requiere aprobación previa (activos de Meta ya existen, ver
CLAUDE.md).

**17.4 Primer mensaje que convierte — misma estructura en IG y WhatsApp.** Valor primero
(entregar lo que pidieron) → prueba social breve → pregunta de seguimiento; corto (bajo
100 palabras en IG, 5-6 líneas de pantalla en WhatsApp) — evitar el genérico "gracias por
escribirnos, en breve te respondemos", que no orienta ni genera confianza.

**17.5 Plantilla de bienvenida sugerida para WhatsApp (click-to-chat actual, sin API):**
> Hola, gracias por escribir a SND//WCH.
> Armamos tu sándwich a tu manera o eliges uno de nuestros Signatures — pedidos y precios
> acá: [link a la web].
> Cualquier duda sobre el menú, contame directo por aquí.

**17.6 Notas de voz en WhatsApp — señal débil pero direccional.** Evidencia mayormente de
blogs de marketing (no estudios controlados): un audio corto transmite "persona real" más
rápido que texto; en campañas estacionales el cierre sube 15-35% con audio personalizado.
Pedidos de comida por WhatsApp en LATAM reportan 18-25% de conversión, de las más altas
por canal — sin comparación rigurosa audio-vs-texto específica para comida, tratar como
señal, no como cifra dura.

**17.7 Errores frecuentes que enfrían la venta (ambos canales).** Respuestas
inconsistentes entre quien atiende (un solo dueño mitiga esto de por sí), no pedir datos
estructurados de una vez (dirección, forma de pago), fragmentar la atención en varios
números/cuentas, y sobre todo la lentitud misma de respuesta (ver 17.1).

Fuentes: [QuickDM — Instagram comment-to-DM](https://quickdm.app/blog/instagram-comment-to-dm-automation-complete-guide),
[LeadResponse — speed-to-lead statistics](https://leadresponse.co/blog/speed-to-lead-statistics),
[SkedSocial — Instagram DM templates](https://skedsocial.com/blog/instagram-business-direct-message-templates),
[inro.social — Instagram Shop 2025](https://www.inro.social/blog/instagram-shop),
[Meta Help Center — Order Food button](https://help.instagram.com/661624171320775/?helpref=related_articles),
[getsauce.com — Order Food button setup](https://www.getsauce.com/post/how-to-add-the-order-food-button-to-your-restaurant-s-instagram-facebook),
[Mercately — mensajes de bienvenida WhatsApp](https://blog.mercately.com/whatsapp/mensajes-bienvenida-whatsapp/),
[Tiendanube — mensaje de bienvenida WhatsApp Business](https://www.tiendanube.com/blog/mensaje-de-bienvenida-de-whatsapp/),
[GreetNow — lead response time statistics](https://greetnow.com/blog/lead-response-time-statistics),
[Kraya AI — lead response time](https://blog.kraya-ai.com/lead-response-time),
[B2Chat — errores comunes WhatsApp Business](https://www.b2chat.io/blog/whatsapp/como-usar-whatsapp-business-para-aumentar-ventas-en-2025-5-estrategias-clave/),
[Chattigo — WhatsApp Voice](https://blog.chattigo.com/whatsapp-business/whatsapp-voice-beneficios-clave-para-las-empreses),
[Waicom — pedidos por WhatsApp restaurante](https://waicom.ai/blog/pedidos-por-whatsapp-restaurante),
[Escala — errores comunes al vender por WhatsApp](https://escala.com/buenas-practicas-y-errores-comunes-al-vender-por-whatsapp/),
[Beex — errores comunes WhatsApp](https://blog.beexcc.com/errores-comunes-whatsapp-c%C3%B3mo-evitarlos).

**17.8 Setup técnico de WhatsApp Business (app gratuita, sin API de pago).** Herramientas
de negocio gratis a configurar (menos de 5 min c/u, menú "Herramientas para la empresa"):
mensaje de bienvenida (dispara automático al primer contacto o tras 14 días de
inactividad — ideal para el cliente frío que llega desde Instagram), mensaje de ausencia
(configurable por horario, usa el horario ya cargado en el perfil), y respuestas rápidas
(atajos tipo `/menu`, `/horario`, `/delivery` para no reescribir lo mismo cada vez).

**17.9 Catálogo nativo de WhatsApp — fuerte para Signatures/bebidas, débil para BYO.**
Soporta hasta 500 productos con foto/precio/variantes simples (talla/sabor), organizables
en colecciones, con "carrito" que el cliente arma y envía como mensaje — pero el pago
siempre ocurre fuera (Yape/Plin/transferencia manual, igual al flujo `pending` que ya
existe). Encaja bien para las 7 Signatures + 4 bebidas (productos fijos); no soporta la
combinatoria real de build-your-own (proteína+tamaño+doble+salsa extra) — para eso seguir
dirigiendo al link del sitio o atender por chat manual con respuestas rápidas.

**17.10 Etiquetas nativas para seguimiento con un solo dueño.** Hasta 20 etiquetas
personalizables (5 predeterminadas: nuevo cliente, nuevo pedido, pago pendiente, pedido
finalizado). Set sugerido para SND//WCH: Cliente nuevo, Pedido en curso, Pago pendiente
Yape/Plin (espejo del flujo `pending` del admin), Cliente recurrente, Reclamo (para no
perder el plazo legal). Cumple el rol de un CRM básico sin herramienta externa.

**17.11 Enlaces wa.me con mensaje prellenado — puente de baja fricción, no checkout.**
Formato `wa.me/<código país><número>?text=<mensaje>` (sin +, espacios ni ceros iniciales).
Usar el mismo número en Instagram bio y en el botón nativo de WhatsApp de Google Business
Profile (ambos lo soportan). Recomendado: mensaje prellenado distinto por canal de origen
(bio IG vs. Stories vs. Google) para inferir qué canal generó el contacto sin analítica
externa — y mantenimiento mensual del texto para que no quede desalineado con precios/
promos vigentes.

**17.12 Límites reales de la app gratuita.** 1 teléfono principal + hasta 4 dispositivos
vinculados (no es "un solo dispositivo" estricto, pero el principal debe seguir conectado);
difusión tope 256 contactos por lista (sin límite de listas, pero el destinatario debe
tener el número guardado en su agenda o el mensaje no llega, sin aviso de rebote). No es
un problema al lanzamiento (base de clientes reducida) — reconsiderar si el negocio crece
lo suficiente como para necesitar difusión masiva.

**2 cambios de código/configuración pendientes de aprobación de esta ronda:**
- Configurar el botón nativo "Order Food" de Meta (§17.3) — sin costo, solo configuración.
- Configurar perfil + herramientas gratuitas de WhatsApp Business (§17.8-17.10) — sin
  costo, solo configuración manual del dueño en la app.

Fuentes (17.8-17.12): [Tiendanube — WhatsApp Business guía 2026](https://www.tiendanube.com/blog/whatsapp-business/),
[Tiendanube — catálogo en WhatsApp](https://www.tiendanube.com/blog/como-hacer-un-catalogo-en-whatsapp/),
[Cliengo — Guía Completa WhatsApp Business 2026](https://guiawabusiness.cliengo.com/business-app),
[Leadsales — etiquetas WhatsApp Business](https://leadsales.io/blog/etiquetas-whatsapp-business/),
[gowalink — wa.me link generator](https://www.gowalink.org/Guides/wa-me-link-generator/),
[pickyassist — botón WhatsApp en Google Business Profile](https://pickyassist.com/blog/add-whatsapp-google-business-profile/),
[Blueticks — WhatsApp broadcast limit 2026](https://blueticks.co/blog/whatsapp-broadcast-limit),
[Blueticks — WhatsApp Business app limitations 2026](https://blueticks.co/blog/whatsapp-business-app-limitations),
[Gurusup — WhatsApp away message](https://gurusup.com/blog/whatsapp-away-message).

**17.13 Instagram Stories NO es la herramienta correcta para el primer contacto en frío
— corrección importante a la secuencia del embudo.** Hallazgo más relevante de esta
ronda: la evidencia (con reserva, ver nota de sesgo abajo) indica que Stories es un
formato "follower-first" — Meta lo posiciona para profundizar audiencia YA existente, no
para alcanzar gente nueva, porque aparece sobre todo en la bandeja de quien ya sigue la
cuenta. Reels es el formato que Instagram empuja activamente a no-seguidores (Explore,
hashtags, geoetiquetas). Con SND//WCH arrancando en cero seguidores, publicar solo
stickers de Stories (encuesta, countdown, quiz) hoy prácticamente no lo ve nadie fuera de
quien ya sigue la cuenta — **la secuencia correcta es Reels/hashtags/colaboraciones
locales primero para conseguir los primeros seguidores, y recién ahí Stories entra a
convertir/nutrir a esa audiencia ya tibia.** Esto es coherente con y refuerza el
énfasis "TikTok/Reels-first" ya establecido en §14, no lo contradice — pero corrige
cualquier plan que hubiera puesto Stories como canal de captación inicial.

**17.14 Countdown de apertura — escalar en fases, no arrancar recién en septiembre.**
Publicar el mismo sticker de cuenta regresiva todos los días (no una sola vez) maximiza
alcance acumulado, reforzado en paralelo con un Reel-teaser (el countdown solo no llega a
gente nueva, ver 17.13). Aplicado al calendario real: quedan ~33 días hasta el 7-sep-2026
desde esta investigación — no activar el countdown recién en septiembre, sino primero
acumular seguidores vía Reels/hashtags locales, y activar el sticker de countdown en la
última semana-10 días cuando ya haya base que lo vea y comparta.

**17.15 Highlights (historias destacadas) — set sugerido.** Deben responder de inmediato
qué es/dónde está/cuándo abre/qué se puede pedir, con portadas de diseño consistente. Para
el catálogo real de SND//WCH: **MENÚ** (Signatures), **ARMÁ EL TUYO** (BYO), **CÓMO
PEDIR**, **COMBOS/PROMOS**, y — una vez abierto — **RESEÑAS**. No hay cifra óptima de
cantidad bien sustentada en ninguna fuente, solo la heurística de "lo mínimo necesario
para no saturar el perfil".

**17.16 Nota de cautela sobre fuentes de esta sub-ronda.** La mayoría de fuentes sobre
Stories son blogs de herramientas de gestión de redes (Hootsuite, Sprout Social,
Metricool, Skedsocial, ChowNow) con incentivo comercial directo. Un dato específico
encontrado durante la investigación (cifras de "79-85% de finalización" para quiz
stickers, atribuidas a un supuesto "Meta Engineering Blog") se identificó como
probablemente fabricado/no verificable (fuente de blog de contenido genérico sin
trazabilidad) — **descartado explícitamente, no se incluye como dato**. El hallazgo de
17.13 (Stories = follower-first, Reels = descubrimiento) sí es consistente entre múltiples
fuentes independientes entre sí, a diferencia de esa cifra puntual.

Fuentes (17.13-17.15): [Skedsocial — Instagram Stories 2026](https://skedsocial.com/blog/ideas-to-boost-interactions-on-instagram-stories-in-2026),
[Brandwatch — Guide to Instagram Stories](https://www.brandwatch.com/blog/instagram-stories/),
[UpMenu — Restaurant Instagram Marketing Strategies](https://www.upmenu.com/blog/instagram-for-restaurants/),
[ChowNow — Instagram Tips for Restaurants](https://get.chownow.com/blog/instagram-guide-for-restaurants/),
[InfluencerMarketingHub — Reels vs Stories](https://influencermarketinghub.com/instagram-reels-vs-stories/),
[Metricool — Countdown en Instagram](https://metricool.com/instagram-countdown/).

## 18. Ronda 4: reseñas/SEO local y TikTok (agregado 2026-08-05)

**18.1 Reseñas de Google — cómo pedirlas sin violar política.** Pedir reseñas SÍ está
permitido (Google tiene su propio "Marketing Kit" con QR/carteles). Prohibido: ofrecer
cualquier cosa a cambio (descuento/puntos/saldo — violaría también la norma de incentivos
de reseñas), y el "review gating" (filtrar antes de pedir, mandando el link de Google solo
a quien respondió bien) — hay que pedir a TODOS los clientes por igual, nunca ligado al
programa de fidelidad existente.

**18.2 Timing y canal — ventana corta, no al día siguiente.** La evidencia (con sesgo
comercial de vendors de SMS/CRM, pero dirección consistente) marca 1-4 horas después de
la entrega como ventana óptima, mientras la experiencia sigue fresca — encaja bien con el
push de "entregado" que ya existe en el flujo real de la app, ese es el gatillo natural.
SMS reporta ~34% de finalización vs. ~4.2% de email (cifra de vendor, orden de magnitud);
no hay estudio serio que mida WhatsApp para esto, pero como SND//WCH ya usa WhatsApp como
canal principal es razonable extrapolar un desempeño comparable o mejor. Refuerzo pasivo:
QR + texto explícito en el empaque ("¿nos regalas 30 segundos en Google?") — un QR sin
petición directa al lado genera 30-50% menos reseñas según una fuente con sesgo comercial.

**18.3 Qué pesa más en SEO local — según Whitespark 2026 (encuesta a 47 expertos, fuente
de mayor peso del grupo).** Señales de Google Business Profile (~32%) > señales de
reseñas (~20%) > SEO on-page (~19%) > enlaces (~15%) > señales de comportamiento (~8%) >
NAP/citaciones (~7%). Proximidad al buscador es el factor individual más determinante
(~55%) — ninguna táctica de reseñas lo compensa, importa más la categoría correcta del GBP
(ya activo, ver §16.3) y la dirección exacta.

**18.4 Velocidad de reseñas > cantidad total — el hallazgo más accionable.** Consenso
2026: Google favorece flujo constante y reciente sobre volumen acumulado estático — un
negocio con 80 reseñas y ritmo semanal supera en ranking a uno con 200 sin ninguna en 6
meses. Ventaja real para un negocio que recién abre: no hace falta "ponerse al día" con
negocios de años, hace falta sostener un ritmo constante desde el primer pedido.

**18.5 Cómo responder reseñas negativas.** Responder es en sí señal positiva para el
algoritmo (meta razonable: <24-48h, tasa de respuesta >80% incluyendo positivas). El
objetivo real no es convencer a quien se quejó — es convencer a quien lee después: tono
profesional, sin litigar en público, reconocer y mover la resolución a WhatsApp/teléfono.
Mismo principio que probablemente ya aplica el Libro de Reclamaciones Virtual existente —
mantener el mismo tono en ambos canales.

**18.6 Umbral real de reseñas que mueve conversión.** Cifra citada de forma consistente
(estudio Womply ~2017-2019 sobre ~200k negocios reales, desactualizado pero con base de
datos reales, no solo opinión): pasar a 9+ reseñas se asoció con ~52% más ingresos
promedio; a 25 reseñas, ~108% más. Dato relevante: el rating asociado a más ingresos NO es
un 5.0 perfecto sino 3.5-4.5 (un rating "demasiado perfecto" genera sospecha). BrightLocal
2026 (más actual, encuesta a consumidores reales): el umbral psicológico de confianza bajó
— hoy deciden con 0-49 reseñas, antes exigían 50+. Meta práctica para SND//WCH: llegar a
~9-10 reseñas reales cuanto antes tras la apertura, y sostener un flujo semanal de 1-3
nuevas después.

**18.7 TikTok — caso real que valida directamente la estrategia de arrancar ahora, antes
de abrir.** Salt Hank (Henry Laporte) construyó su cuenta de contenido de comida en TikTok
durante **cinco años antes de abrir su local físico** (Salt Hank's, West Village NYC,
~5M seguidores acumulados) — el día de apertura ya había cola en la puerta. Formato
distintivo replicable: filmar el sándwich en el momento de máximo desborde/jugosidad, no
estático. Valida directamente construir audiencia en TikTok desde ahora (agosto 2026),
antes de la apertura de septiembre.

**18.8 Formato POV de armado — el más aplicable directamente al rubro de SND//WCH.**
Milad Mirghahari pasó de 10,000 a 1,000,000 de seguidores en menos de un mes con cámara
POV armando sándwiches pedidos por comentarios de seguidores, narrado con historias
personales — evidencia directa (aunque con apoyo de sponsor, no 100% orgánico) de que el
formato POV+interacción con comentarios funciona a escala en el formato sándwich
específico. Otros formatos con buen desempeño reportado: ASMR de preparación (crunch,
sizzle, corte — aprovecha el consumo con sonido activado de TikTok) y overhead/time-lapse
de armado (menor fricción de producción para negocio sin equipo de video).

**18.9 El cliente real puede viralizar mejor que el negocio mismo.** East 81st Street Deli
(Cleveland): el video viral no lo publicó el negocio sino una clienta elogiando el
producto en 15 segundos — resultado: ventas triplicadas (de 40 a 300 porciones/día).
Lección aplicable: facilitar (no fabricar) que clientes graben su propia reacción al
recibir el pedido, en vez de depender solo de contenido producido por el dueño.

**18.10 Sin ventana garantizada de "explosión" — no planear asumiendo viralidad
inmediata.** El mismo caso East 81st Street Deli no empezó a viralizar hasta ~7 semanas
después de publicado. Frecuencia recomendada para cuenta nueva: 2-3 publicaciones
diarias en fase de arranque (piso mínimo aceptable 3-5/semana) — dado que el dueño arma
los pedidos él mismo sin planilla, el piso de 3-5/semana es más realista que 2-3/día antes
de la apertura.

**18.11 Hashtags locales — geolocalización algorítmica sí, identidad regional no
(compatible con la restricción ya definida).** La geolocalización algorítmica de TikTok y
el hashtag de ubicación son mecánica de descubrimiento, no identidad de marca — usar
`#TrujilloPeru`/`#deliveryTrujillo` como etiqueta de alcance es compatible con que
SND//WCH no tenga anclaje trujillano en naming/iconografía/guion, siempre que el hashtag
no se filtre hacia esos otros elementos. Mezcla recomendada: 1 hashtag amplio + 1-2 locales
+ 1 de nicho — evitar hashtag stuffing (20+ tags), 3-5 enfocados superarían en desempeño.

**18.12 Nota de cautela sobre fuentes (17 y 18).** La mayoría de fuentes de TikTok son
blogs de herramientas/agencias con incentivo comercial directo, repitiendo cifras sin
atribución primaria verificable — tratadas como consenso de industria, no dato duro. Los
4 casos reales de negocios (18.7-18.9) sí tienen respaldo periodístico/documentación
verificable (Square, Wikipedia, Cleveland Scene, Today.com, ABC7), y ninguno usó anclaje
regional como gancho — el gancho fue siempre el producto y la persona, coherente con la
restricción ya definida del proyecto. Para reseñas, Whitespark y BrightLocal (18.3, 18.6)
son encuestas metodológicamente transparentes pese a también vender software, y el estudio
Womply (18.6) usa datos reales de ~200k negocios aunque desactualizado — se marcan aparte
del resto de blogs de agencias sin metodología visible.

Fuentes (18.1-18.6): [Google — Prohibited & restricted content policy](https://support.google.com/contributionpolicy/answer/7400114?hl=en),
[Whitespark — 2026 Local Search Ranking Factors](https://whitespark.ca/local-search-ranking-factors/),
[BrightLocal — What is NAP in Local SEO](https://www.brightlocal.com/learn/what-is-nap/),
[Womply vía Search Engine Land — review counts vs. revenue](https://searchengineland.com/review-counts-matter-more-to-local-business-revenue-than-star-ratings-according-to-study-320271),
[Search Engine Land — how to handle negative Google reviews](https://searchengineland.com/guide/how-to-handle-negative-google-reviews).

Fuentes (18.7-18.11): [Square — From TikTok to the Table: Salt Hank's](https://squareup.com/us/en/the-bottom-line/starting-your-business/opening-salt-hanks-nyc),
[Cleveland Scene — East 81st Deli, un año después](https://www.clevescene.com/news/how-the-east-81st-deli-its-a-chicken-salad-viral-video-changed-the-lives-of-the-business-and-star-one-year-later-42929261/),
[Today.com — Chicken Salad Deli Viral](https://www.today.com/food/trends/chicken-salad-81st-deli-cleveland-viral-tiktok-rcna54854),
[ABC7 NY — NJ Deli Owner Goes Viral](https://abc7ny.com/nj-deli-guy-tiktok-the-midland-park/12043744/),
[Malou — TikTok for Restaurants 2026](https://www.malou.io/en-us/blog/tiktok-for-restaurants).

**18.13 Fórmulas exitosas de negocios de comida chicos — el patrón real, no una fórmula
matemática.** No existe ningún caso de comida con una "fórmula de primeras 100 ventas"
verificada con cifras duras (hueco real de esta investigación) — pero el patrón que se
repite en los casos con nombre real (no en blogs comerciales) es consistente: **boca a
boca amplificado por creadores/reviewers locales pequeños + un formato de contenido
repetible y barato de producir + un ítem-ancla reconocible**, sostenido sobre una
operación que pueda absorber un pico de demanda. 2 estudios académicos (Walden
University, entrevistas cualitativas a dueños de restaurantes independientes) confirman
el mismo eje: boca a boca + redes sociales dirigidas por el consumidor, nunca una sola
táctica aislada.

**18.14 Casos reales verificados — el más comparable es un salumeria/paninoteca, no una
cadena.** Ai Monti Lattari (Nápoles, Italia): un empleado filmó un ritual fijo y repetible
(misma pregunta, "¿Con mollica o senza?", mismo gesto de cortar el pan) sin producción
cara — se volvió viral, atrajo turistas internacionales. **Arepas XL** (Medellín,
Colombia — el caso más cercano en escala/contexto latinoamericano): fundado en 1,5 m² con
2 empleados, creció por boca a boca amplificado en redes, en 7 meses el local se quedó
chico y tuvo que mudarse; hoy ~20 empleados. **BBQFromTheCurb** (California, negocio de 1
año): un solo video de un reviewer local generó fila hasta la esquina — la lección
replicable no es "lograr un video viral" (no es controlable) sino **cultivar reviewers
locales pequeños invitándolos, sin pagarles**, táctica de costo bajo/cero.

**18.15 El riesgo real no es "no viralizar" — es viralizar sin poder sostenerlo.** Tanto
Ai Monti Lattari (Nápoles) como un caso paralelo en París (Folderol) muestran el mismo
patrón: la viralidad atrajo tanta gente enfocada en fotos que los clientes habituales
dejaron de ir, y terminaron restringiendo el acceso. Mitigación concreta recomendada:
**soft opening con creadores/vecinos locales invitados (descuento 20-50% o gratis) antes
de la fecha oficial del 7-sep-2026** — prueba la operación con volumen bajo y genera el
primer lote de contenido/reseñas orgánicas antes del lanzamiento real. Dato de contexto
(no específico de lanzamiento en redes, estudio Ohio State sobre permisos sanitarios de 3
años): ~26% de restaurantes independientes cierran/cambian de dueño en el primer año (no
el mito popular de 90%) — y el estudio de Cornell "Why Restaurants Fail" atribuye las
quiebras sobre todo a falta de visión de liderazgo y a dueños que no conocen sus costos
diarios, no a falta de marketing.

**18.16 Ítem-ancla y fricción de pedido — ya resueltos de origen en SND//WCH.** Concentrar
el contenido/boca a boca en 1-2 ítems reconocibles en vez de diluir en todo el catálogo es
coherente con la estructura que ya existe (Signatures + un menú secreto de rotación mensual,
sin necesidad de cambio). Y el hallazgo de "vender solo por DM sin link directo pierde
pedidos al crecer" ya está resuelto de origen — SND//WCH tiene checkout propio, no depende
de mensajes manuales para cerrar la venta.

Fuentes (18.13-18.16): [The Takeout — Ai Monti Lattari](https://www.thetakeout.com/tiktok-viral-chaotic-italian-sandwich-maker-farewell-1849331317/),
[Food Republic — qué pasa cuando un restaurante se viraliza](https://www.foodrepublic.com/1428411/what-happens-when-restaurants-become-viral-tiktok/),
[El Colombiano — Arepas XL](https://www.elcolombiano.com/negocios/negocios-virales-por-tiktok-emprendimiento-antioquia-KC34635069),
[CBS Sacramento — BBQFromTheCurb](https://www.cbsnews.com/sacramento/news/tiktok-ban-could-impact-local-businesses-limiting-their-exposure/),
[Ohio State News — tasa real de fracaso de restaurantes](https://news.osu.edu/restaurant-failure-rate-much-lower-than-commonly-assumed-study-finds/),
[ScholarWorks Walden — estudio cualitativo Pittsburgh](https://scholarworks.waldenu.edu/cgi/viewcontent.cgi?article=3567&context=dissertations),
[PUCP-CIDE — casos peruanos (Mitos Anticuchos)](https://cide.pucp.edu.pe/casos-de-exito-nakarys-y-mitos-anticuchos-negocios-superan-la-crisis-de-la-covid-19/).

*Falta el agente de economía real del reparto para operador único (se agrega en
MENU_FINANCIAL_ANALYSIS.md cuando termine).*
