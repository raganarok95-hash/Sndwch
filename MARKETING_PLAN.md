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
   adquisición**, no un complemento — sin presupuesto pago, la única forma
   creíble de generar demanda antes de abrir es contenido nativo de Instagram
   grabado con el celular, con cadencia constante.
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

**Presupuesto pago:** ~S/0. Este plan asume cero gasto en ads (Meta Ads, Google
Ads) durante el lanzamiento. Si el volumen lo justifica más adelante, la puerta
de entrada más barata sería impulsar (boost) los Reels con mejor rendimiento
orgánico, S/20-50 puntuales, no una campaña sostenida — decisión a revisar solo
con datos reales de venta, nunca antes.

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

**Fase del negocio:** pre-apertura. Lanzamiento planeado ~septiembre 2026. Todo
dato de `orders`/`customers` hoy en producción es de prueba (~10 pedidos, 2
clientes) — no hay historial de ventas real todavía, así que ninguna proyección
de este plan es un pronóstico, es una hipótesis de trabajo a validar con datos
reales apenas haya volumen.

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

**Lo que este plan deliberadamente NO incluye:** ads pagados (sin presupuesto),
SEO de contenido/blog (la app es de una sola página, no hay dónde publicar
contenido indexable sin construir infraestructura nueva — fuera de alcance),
influencers pagados (sin presupuesto; ver §12 para la versión gratuita —
intercambio de producto por post, viable con micro-influencers locales de
comida en Trujillo).

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
  está rindiendo mejor.
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

**Q1 post-apertura (primeros 3 meses):**
- Intercambio de producto por post con 1-2 micro-influencers locales de comida
  en Trujillo (sin pago en efectivo — regalo de producto a cambio de
  contenido, acordado explícitamente como intercambio, no como publicidad
  encubierta).
- Primeros ajustes de cadencia según qué contenido convierte de verdad (ver
  §10).

**Q2+ (solo si el volumen lo justifica):**
- Boost pago puntual (S/20-50) de los Reels con mejor rendimiento orgánico —
  nunca una campaña sostenida sin datos reales de retorno.
- Newsletter/email de retención más allá de lo transaccional.

**Descartado explícitamente (con motivo):**
- Ads pagados sostenidos — sin presupuesto, y prematuro sin datos de venta
  reales que informen a quién targetear.
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
1. **Fecha de apertura exacta** — el fix del "Modo cocina de una mano"
   (`business_launched`) depende de que alguien lo active a mano el día real;
   no hay fecha automática porque nunca se confirmó una fecha exacta, solo
   "~septiembre 2026".
2. **Google Business Profile** — requiere dirección física confirmada de
   operación, dato de negocio fuera del alcance de este plan.
3. **Configurar los 3 secrets de Meta** (`META_PAGE_ACCESS_TOKEN`,
   `META_PAGE_ID`, `META_IG_USER_ID`) — paso técnico simple pero requiere que
   el dueño extraiga esos valores desde su Meta Business Manager; sin esto, la
   mitad del stack operativo de §11 sigue siendo manual.
4. **¿Habrá un código promocional específico de lanzamiento?** — el sistema ya
   existe, falta decidir el monto/condición y crearlo desde el panel admin.
5. **CAC real** — sin gasto pago, hoy no hay costo de adquisición que medir
   más allá del tiempo del dueño; esto cambia solo si se activa cualquier
   gasto pago futuro (§12, Q2+).
