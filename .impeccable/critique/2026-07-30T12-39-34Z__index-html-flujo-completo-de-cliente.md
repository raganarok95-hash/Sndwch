---
target: index-html-flujo-completo-de-cliente
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-07-30T12-39-34Z
slug: index-html-flujo-completo-de-cliente
---
Method: dual-agent (A: general-purpose design-review agent · B: general-purpose detector/browser-evidence agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | El toast de "agregado al carrito" (z-index 400) tapa completamente el botón fijo de pago (z-index 100) por 3.2s — justo tras la acción más común del flujo. |
| 2 | Match System / Real World | 4/4 | Soles, Yape/Plin de primera clase, confirmación por WhatsApp, zonas de delivery reales de Trujillo — se siente construido para este mercado, no traducido. |
| 3 | User Control and Freedom | 3/4 | Botones de retroceso y "vaciar carrito" consistentes; no se pudo verificar un control visible de "cancelar este pedido" desde la propia pantalla de confirmación tras pagar. |
| 4 | Consistency and Standards | 3/4 | Disciplina de tokens excelente en casi toda la app, pero las tarjetas de recompensa usan un fondo navy (`#0c1d30`) que no existe en ningún token documentado de DESIGN.md. |
| 5 | Error Prevention | 4/4 | `prepare-order` reserva antes de que Culqi abra, el pago manual exige confirmación explícita "¿ya transferiste?", y el estado de "cobro exitoso pero pedido falló" bloquea la UI con instrucción clara de no reintentar. |
| 6 | Recognition Rather Than Recall | 3/4 | Direcciones guardadas, reorden con un toque, carrito persistente reducen bien la carga — contrarrestado por el recargo de tarjeta invisible (ver Priority Issues). |
| 7 | Flexibility and Efficiency | 4/4 | El camino rápido (carrito vacío → la pantalla de confirmación funciona como checkout completo, saltándose `o_cart`) es un atajo genuino para el caso mayoritario de un solo ítem. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Lo primero que ve cualquier invitado en Home, antes del menú, es un formulario de captura de teléfono sin botón de cerrar — y el detector confirmó mecánicamente 19 instancias de texto funcional por debajo del piso de 11px y 8 de texto realmente diminuto (8-11px). |
| 9 | Error Recognition/Diagnosis/Recovery | 4/4 | Copy de error específico por campo en todo el flujo; el estado de bloqueo por doble cobro es el mejor ejemplo — explica qué pasó, qué NO hacer, y da una referencia. |
| 10 | Help and Documentation | 3/4 | Sin FAQ buscable, pero una burbuja de WhatsApp flotante persiste en cada pantalla — un canal humano en vivo, posiblemente más útil que ayuda estática para este modelo de negocio. |
| **Total** | | **33/40** | **Good (82%)** |

**Trend for `index-html-flujo-completo-de-cliente`**: primera corrida, sin tendencia todavía.

## Design Specificity Verdict

**Evaluación LLM (Assessment A):** No es una plantilla de delivery re-pintada. El emparejamiento tipográfico (Bodoni Moda para nombres/precios/totales, EB Garamond itálica reemplazando chips), el wordmark "//" como componente real (no glifo suelto), la disciplina de un solo acento dorado, y mecánicas específicas del producto (menú secreto por rango, checkout Yape/Plin con QR generado en la app, zonas de delivery en soles) no podrían insertarse sin cambios en un clon genérico de Subway o un DoorDash — el flujo de pago solo (confirmación manual de transferencia, ajuste de comisión de Culqi) es ingeniería específica de Perú, no boilerplate. Donde se lee genérica es la capa de fidelidad: el anillo radial de puntos, la grilla de insignias y las barras de progreso por rango (perfil/recompensas) son un patrón que cualquier programa gamificado (tarjetas de sello de cafetería, millas aéreas) usa casi idéntico — nada ahí señala "SND//WCH" específicamente más allá de aplicar la paleta encima.

**Escaneo determinístico (Assessment B):** 814 hallazgos brutos del detector estático (538 warning, 276 advisory), pero la mayoría son ruido mecánico, no drift real — ver desglose abajo. El hallazgo más valioso del escaneo NO es de la lista bruta: la inyección en navegador real (DOM ya renderizado, no regex) confirmó de forma independiente **19 casos de texto funcional bajo 11px** y **1 caso de contraste real bajo AA (3.4:1, necesita 4.5:1 — texto `#666666` sobre `#0c0c0c`)** — evidencia que el Assessment A no capturó explícitamente (llegó a la misma sensación vía heurística #8, pero sin el número exacto).

**Falsos positivos identificados y descartados:**
- `design-system-font` (531 de 533 hallazgos de esta regla): la regex del detector no despoja las comillas escapadas (`\'Bodoni Moda\'`) que usa este codebase por ser JS con strings concatenados — Bodoni Moda, EB Garamond y Fraunces SÍ están documentadas en DESIGN.md, exactamente como se usan. Solo `Public Sans` (2 casos) es un gap real — ver más abajo.
- `broken-image` (2 casos): la cadena `<img>` aparece dentro de un comentario JS, no es una etiqueta real.
- `overused-font` sobre Fraunces: contradice la propia regla de fuentes del detector, que sí la reconoce — Fraunces está documentada a propósito solo para el wordmark (Two-Family Rule).
- `bounce-easing` (rankpop, la celebración de subida de rango): es un token de movimiento documentado a propósito en el sidecar de DESIGN.md (`.impeccable/design.json`), usado una sola vez, con `prefers-reduced-motion` respetado — no es "slop genérico", es una decisión ya tomada y ya registrada.

**Drift real confirmado (no ruido mecánico):**
- `Public Sans` no está documentado en DESIGN.md — se usa a propósito solo en el panel admin (hallazgo de una sesión anterior, "Formalizar tokens de diseño conservadora") pero mi DESIGN.md recién escrito lo omitió. Esto es un hueco mío en la documentación, no del código.
- `#0c1d30` (fondo navy de tarjetas de recompensa) confirmado ausente de DESIGN.md por ambas evaluaciones de forma independiente — ver Priority Issues.
- `dark-glow` real: `box-shadow:0 0 8px rgba(203,162,88,.6)` en un segmento de barra de progreso — contradice directamente la "No-Glow Rule" que el propio DESIGN.md declara.
- Lista de colores genuinamente ausentes de DESIGN.md (no solo un problema de parseo del detector): `#1a1a2e`, `#ff5555`, `#ff8a5c`, `#2a2a2a`, `#F5C518` (dorado de estrellas de calificación), `#1E4A38`, y varios grises (`#666`,`#555`,`#444`,`#888`,`#ddd`) — candidatos para una futura pasada de `$impeccable document` más exhaustiva, no urgente ahora.

## Overall Impression

La app está genuinamente bien construida donde más importa (dinero: reservas atómicas, prevención de doble cobro, mensajes de error específicos) y tiene una identidad visual real y consistente en el 90% de las pantallas. El mayor problema no es de dirección de diseño — es que dos decisiones puntuales (el toast que tapa el botón de pago, y el formulario de lista de espera sin cerrar antes del menú) rompen la experiencia justo en los dos momentos de mayor fricción: "acabo de agregar algo, ¿ahora qué?" y "quiero ver el menú, no dejar mi teléfono". Ninguno de los dos requiere rediseño, ambos son arreglos de una tarde.

## What's Working

1. **La pantalla rápida de confirmación de pedido** — colapsar carrito+checkout en una sola pantalla para el caso de un solo ítem no es un default de plantilla, es una decisión que solo tiene sentido si ya se entendió que la mayoría de pedidos acá son un sándwich.
2. **La ingeniería de errores alrededor del dinero** — el patrón de reservar-antes-de-cobrar y el estado de bloqueo en rojo "no reintentes" resuelven el problema difícil real de "qué ve el cliente cuando el cobro sí pasó pero el pedido no se guardó", de forma correcta y sin dramatismo visual (texto plano en una caja con borde, no un modal de alarma).
3. **La pantalla de confirmación de pedido** — wordmark como protagonista, semáforo de estado con los colores documentados, un plazo real en vez de "te confirmamos pronto", y el upsell de crear cuenta relegado a un link discreto al final en vez de competir con el CTA de WhatsApp.

## Priority Issues

**[P0] El toast de "agregado al carrito" tapa el botón de pago por 3.2 segundos**
- **Por qué importa:** Se dispara en la acción más común del carrito (agregar un segundo ítem/side) justo antes del momento en que un usuario apurado o distraído (Casey) buscaría el botón de pagar — no es un caso borde, es el camino por defecto en cualquier pedido de más de un ítem.
- **Arreglo:** Mover el toast a `top` en vez de `bottom`, o reposicionarlo por encima de la barra fija (`bottom:76px` en vez de `bottom:20px`) para que nunca se superponga con la región del CTA fijo.
- **Comando sugerido:** `$impeccable polish`

**[P1] Falla de accesibilidad confirmada mecánicamente: texto bajo 11px (19 casos) y contraste bajo AA (3.4:1 vs. 4.5:1 requerido)**
- **Por qué importa:** Esto lo encontró el detector inyectado en el DOM real, no una opinión — un usuario dependiente de accesibilidad (Sam: lupa del navegador, baja visión) directamente no puede leer con confianza el precio ("S/" a 7.8px), el badge "Menú secreto //" (9px), ni el texto gris `#666666` sobre casi-negro en, al menos, un lugar confirmado.
- **Arreglo:** Subir el piso de tamaño de fuente funcional a 11px mínimo en toda la app (revisar especialmente el prefijo "S/" y los labels EB Garamond de 9px), y auditar cualquier texto `#666666`/gris apagado sobre fondos oscuros contra el mínimo 4.5:1.
- **Comando sugerido:** `$impeccable audit`

**[P1] La tarjeta de "avísame cuando abramos" lidera el Home de cada invitado, contradiciendo el estado "Abierto ahora" una línea arriba**
- **Por qué importa:** El principio de producto #2 (ya documentado en PRODUCT.md) es "ningún automático que no lo sea de verdad" — un cartel de "avísenme cuando abran" al lado de "● ABIERTO AHORA" es exactamente esa clase de contradicción, y hoy es estructural (no depende de si el negocio ya abrió de verdad). También rompe "un solo foco" de carga cognitiva: la primera interacción obligatoria de un invitado nuevo es un campo de teléfono, no el menú.
- **Arreglo:** Condicionar la tarjeta a una bandera real de "aún no abrimos" (no solo `cust`/`wlDone`) para que se retire sola en el lanzamiento sin necesitar un cambio de código, y darle el mismo botón de cerrar que ya usan el banner de instalar PWA y el de "cerca del local" dos componentes más abajo en el mismo archivo.
- **Comando sugerido:** `$impeccable clarify`

**[P1] El checkout es un solo scroll largo sin divulgación progresiva, pese a que el patrón ya existe en la misma pantalla**
- **Por qué importa:** Viola "una cosa a la vez" de carga cognitiva. Si a Riley (usuario que prueba límites) lo interrumpen a medio scroll (llamada, cambio de app), no hay ningún ancla para volver a ubicarse en un bloque indiferenciado de ~9 secciones apiladas.
- **Arreglo:** Partir en secciones nombradas y colapsables (Contacto, Entrega, Cuándo, Cómo pagas) reusando el patrón `<details>` que ya existe dos componentes arriba, en la sección de extras del sándwich.
- **Comando sugerido:** `$impeccable layout`

**[P2] El recargo por comisión de tarjeta es invisible y cambia el total sin explicación**
- **Por qué importa:** El total sube antes de que el cliente elija método de pago (se asume tarjeta por defecto), sin ningún desglose visible — y baja a un número redondo si luego elige Yape/Plin, sin que nada en pantalla explique por qué cambió. Esto choca con el principio de "integridad financiera primero" extendido al lado visible para el cliente, no solo al backend.
- **Arreglo:** Mostrar "+S/0.47 comisión de tarjeta" como línea propia solo cuando el camino de tarjeta esté implicado, o no aplicar el recargo al total mostrado hasta que se elija método de pago de verdad.
- **Comando sugerido:** `$impeccable clarify`

**[P3] Deriva de token: fondo navy `#0c1d30` en tarjetas de recompensa, ausente de DESIGN.md — y viola la "No-Glow Rule" en un segmento de barra de progreso**
- **Por qué importa:** Confirmado de forma independiente por ambas evaluaciones — exactamente la clase de deriva que el propio DESIGN.md pide evitar ("nunca... gris neutro [ni azulado]", "ninguna superficie usa sombra tipo glow"). Menor en impacto, pero es la prueba de que el sistema de diseño ya empezó a driftear en dos puntos concretos.
- **Arreglo:** Cambiar el navy por `--sw-card2` (`#1A3028`) con el patrón ya existente de borde dorado en estado de éxito; quitar el `box-shadow` de glow del segmento de la barra de progreso o documentarlo explícitamente como excepción si es intencional.
- **Comando sugerido:** `$impeccable polish`

## Persona Red Flags

**Jordan (primerizo confundido):** Llega a Home y lo primero que ve es un formulario de teléfono, no un sándwich (P1). Si llega a la pantalla de confirmación, el total "S/26.47" para un ítem mostrado en otro lado como "S/18" no tiene desglose visible en esa pantalla — Jordan no tiene forma de saber que S/8 es delivery y S/0.47 es comisión estimada de tarjeta; el resumen de WhatsApp (que sí lo desglosa) recién se genera DESPUÉS de pagar.

**Casey (usuaria móvil distraída, solo pulgar):** Agrega un segundo ítem, el toast tapa el botón de pago por 3.2s (P0) — un toque habitual "donde siempre está el botón" durante esa ventana no hace nada, lo que para una usuaria distraída se lee como "la app está rota", no "espera un segundo". Si la interrumpen a media pantalla de checkout, no hay ancla para volver a ubicarse en el bloque largo sin dividir (P1).

**Sam (dependiente de accesibilidad — nueva, basada en evidencia mecánica de Assessment B):** El escaneo del DOM real confirmó texto funcional tan chico como 7.8px ("S/") y 9px ("Menú secreto //", "Premium") — muy por debajo de cualquier piso razonable de legibilidad — y al menos un caso de contraste real bajo AA (3.4:1, texto gris sobre casi-negro). Con zoom del navegador al 200% (comportamiento típico de Sam) estos elementos probablemente se recorten o superpongan antes de volverse legibles, en vez de reflowear limpio.

**Riley (probador de límites):** Al confirmar el mismo build dos veces en la misma prueba, el carrito generó dos líneas separadas de cantidad 1 en vez de fusionarlas en una de cantidad 2 — inconsistente con `addSideToCart()`, que sí fusiona sides duplicados incrementando `qty`. Sin ningún diferenciador visual entre las dos líneas idénticas, se ve como un carrito desordenado, no como "llevas 2".

## Minor Observations

- A ancho de escritorio (1280-1440px) la app centra correctamente su columna única sin estirarse ni romperse — verificado en ambas evaluaciones de forma independiente.
- DESIGN.md (recién escrito) describe 3 bases de build-your-own ("Classic//White, Herbs//Cheese, Focaccia//Artesanal") pero el catálogo real de `src/app.ts` solo tiene 2 (`Herbs//Cheese` se retiró por decisión del dueño según un comentario del propio código) — esto es un error mío en DESIGN.md, lo corrijo aparte.
- Perfil y Recompensas muestran el saldo de puntos dos veces con dos tratamientos visuales distintos (anillo radial vs. número plano) a un toque de distancia — no está mal, pero es una oportunidad perdida de un solo motivo visual consistente para "puntos" en toda la superficie de fidelidad.
- El header y el conteo mostrado del detector (`[impeccable] 29 anti-patterns found` vs. 34 líneas de hallazgo individuales) tienen un desajuste — anomalía mecánica de la propia herramienta, no de la app, vale la pena reportarlo si se sigue usando esta skill.

## Questions to Consider

1. Si el lanzamiento es en ~6 semanas, ¿la tarjeta "Avísame cuando abramos" debe desaparecer sola en esa fecha, o alguien tiene que acordarse de tocar el código ese día?
2. El checkout ya tiene cada sección separada como bloque HTML independiente en el propio archivo — ¿el scroll único fue una apuesta deliberada de "más corto es más rápido", o simplemente se fue acumulando así, un `+=` a la vez?
3. Mostrar un total que depende del método de pago ANTES de elegirlo (el recargo de tarjeta) — dado que Yape/Plin ya está marcado como "Recomendado" y no paga comisión, ¿vale más la pena mostrar por defecto el total SIN recargo y sumarlo solo si de verdad se elige tarjeta?
