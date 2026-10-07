# El equipo de marketing automático de SND//WCH (2026-10-07)

Dueño: «falta la parte creativa, actúa como un enorme equipo de marketing, toma el flujo normal de
un equipo así, automatízalo, baja herramientas MCP… genera todo el motor completo de marketing;
cada cosa debe ser analizada, un equipo completo de marketing». Aprobado: **S/350 de pauta de
prueba** (27 oct – 9 nov). «Hazlo tú lo de Google Business».

Este archivo es el **organigrama y el manual**. Cada rol tiene su libreto en
`docs/marketing/roles/` y lo ejecuta una sesión programada de Claude (una «rutina») con las
herramientas conectadas. Lo mecánico (publicar, medir, frenar) lo hacen los crons de la app.

---

## 1 · Cómo trabaja un equipo de marketing de verdad, y cómo se copia aquí

Una agencia hace siempre el mismo ciclo: **datos → plan → investigación → ideas → producción →
control de calidad → publicación → comunidad → pauta → medición → retrospectiva**, y vuelve a
empezar. Cada paso tiene un dueño y un entregable que el siguiente usa. Aquí es igual: cada rol
deja su entregable en la base (`marketing_*`) o en el repo, y el siguiente lo toma.

| hora (Lima) | quién | qué deja |
|---|---|---|
| **Lunes 6:00** | Director | El plan de la semana: objetivo, presupuesto, temas, qué se deja de hacer |
| Lunes 6:30 | Investigador | Tendencias, competencia, calendario local de la semana |
| **Diario 5:00** | Creativo + Redactor | 3–5 ideas con gancho y guion; se eligen 1–2 |
| Diario 5:30 | Diseñador + Editor de video | Las piezas terminadas (video, carrusel, historia) |
| Diario 6:00 | Calidad | Aprueba o bloquea cada pieza con motivo |
| Diario (horas pico) | Publicador | Publica en Instagram, Facebook, TikTok y Google |
| Cada 2 h | Comunidad | Responde comentarios y mensajes con las reglas de la marca |
| **Diario 9:00** | Media buyer | Revisa la pauta, mueve el presupuesto, frena si hace falta |
| Por pedido | Growth | Tarjeta para compartir, WhatsApp, reseña, Rappi→directo |
| **Diario 23:00** | Analista | Mide cada pieza y cada canal; actualiza el «bandido» |
| **Domingo 20:00** | Analista + Director | Retrospectiva: qué funcionó, qué se mata, qué se prueba |

---

## 2 · Los doce roles, cada uno analizado

### 1 · Director de marketing
- **Trabajo**: leer los números de la semana y decidir en qué se gasta la atención y la plata.
- **Decide**: el objetivo de la semana (p. ej. «30 pedidos, 40% por canal propio»), el reparto del
  presupuesto entre plataformas, qué plantillas se siguen y cuáles se matan.
- **Datos**: pedidos por origen, costo por cliente, piezas ganadoras (del Analista).
- **Límite**: nunca pasa los topes de pauta aprobados por el dueño.

### 2 · Investigador
- **Trabajo**: saber qué está funcionando afuera esta semana.
- **Fuentes**: tendencias de TikTok/Instagram (vidIQ si se conecta; búsqueda web), **anuncios
  activos de la competencia** en la Biblioteca de Anuncios de Meta (Don Pacho, La Casera, King
  Sandwich, Xinona, Centrica, Subway), sus fichas de Google (reseñas y quejas = oportunidades),
  y el calendario de Trujillo (quincena y fin de mes, feriados, partidos, clima).
- **Entrega**: 5 oportunidades concretas por semana, con fuente.

### 3 · Creativo (estratega de contenido)
- **Trabajo**: convertir el plan y la investigación en ideas que se vean enteras.
- **Formatos**: video corto (Reels/TikTok), carrusel, historia, meme con SANDO y WICHO, encuesta.
- **Método**: 5 ideas por día, cada una con **gancho de 1 s**, formato y por qué funcionaría; se
  eligen 1–2 con el bandido del Analista (explora 20%, explota 80%).
- **Personajes**: SANDO (el que ya lo resolvió) y WICHO (el que arma), según
  `docs/LOS_DOS_HERMANOS.md`. Son la ventaja creativa que ningún competidor tiene.

### 4 · Redactor
- **Trabajo**: ganchos, textos, subtítulos, llamado a pedir.
- **Reglas**: español de Perú, «tú»; **precios, nombres y premios interpolados desde la carta y
  las reglas**, nunca escritos; nada de mecanismos apagados; sin promesas que el código no cumpla.

### 5 · Diseñador
- **Trabajo**: carruseles, historias, portadas, escenas.
- **Herramientas**: Canva, Adobe (Express/Firefly), Figma, Gamma; la marca (`//` dorado y
  celeste, tipografías del sistema).
- **Regla dura**: la IA crea **escenas, fondos, personajes y tipografía**; el sándwich de cada
  pieza es **siempre la foto real**. Nunca se genera una foto falsa del producto.

### 6 · Editor de video
- **Trabajo**: los videos.
- **Herramientas**: `scripts/video-auto/` (ya probado), HyperFrames (composiciones HTML, voz
  sintética, quitar fondos), Adobe (cortes, redimensionar).
- **Plantillas**: el Signature del día, «quedan N hoy», arma el tuyo con WICHO, 15CM vs 30CM, el
  menú secreto, pide en grupo, el más pedido de la semana, SANDO y WICHO discuten (sketch).

### 7 · Control de calidad (marca y legal)
- **Trabajo**: que nada salga mal publicado. Bloquea con motivo; no corrige a ojo.
- **Revisa**: precio contra la base, foto real del producto, marca `//` correcta, horario y zona
  verdaderos, ningún dato legal inventado, nada que contradiga el Libro de Reclamaciones.

### 8 · Publicador
- **Trabajo**: que cada pieza aprobada salga en su red, a su hora.
- **Cómo**: el cron `auto-publish-calendar` (Instagram y Facebook, ya funciona), TikTok cuando lo
  habilites, Google Business. Horarios: los del pico de pedidos (almuerzo y cena).

### 9 · Comunidad
- **Trabajo**: responder comentarios y mensajes en minutos, no en horas.
- **Reglas**: preguntas de precio, horario, zona y cómo pedir → respuesta con el dato real y el
  link; quejas → se pasan al flujo de «Algo salió mal» y te avisa; nada de discutir.

### 10 · Media buyer (pauta)
- **Trabajo**: los S/350 de prueba (27 oct – 9 nov) y lo que venga.
- **Cómo**: Meta Ads por su MCP: **una** campaña Advantage+ optimizada a Compra, Trujillo y la
  zona de reparto, con los 3–5 videos que mejor funcionaron gratis. S/25/día.
- **Frena solo** si el costo por cliente pasa ~S/25 durante 3 días; nunca pasa el tope.

### 11 · Growth (bucles y CRM)
- **Trabajo**: que cada cliente traiga al siguiente.
- **Bucles**: Rappi→directo (tarjeta con QR en la bolsa, `?src=rappi`), la **tarjeta para
  compartir** tras cada entrega con su link de referido, el pedido en grupo a la hora del
  almuerzo, WhatsApp dentro de la ventana gratis (estado, tarjeta, reseña).

### 12 · Analista
- **Trabajo**: medir y decidir, no hacer reportes que nadie lee.
- **Mide**: por pieza (reproducciones, guardados, compartidos, clics, **pedidos** por su `?src=`)
  y por canal (visitas → carrito → pago → segundo pedido; costo por cliente).
- **Decide**: el bandido que reparte las piezas del día siguiente; qué video pasa a pauta.
- **Avisa** al dueño una vez por semana, en tres líneas.

### Local / Google Business (lo hace el Publicador + Comunidad)
- Publicaciones semanales, fotos reales, respuestas a reseñas. **La ficha la crea y verifica Google
  con la cuenta del dueño** (código o videollamada): eso no lo puede hacer nadie más. Todo lo
  demás está listo en `docs/marketing/google-business.md`.

---

## 3 · Herramientas: lo que hay y lo que falta conectar

| herramienta | para quién | estado |
|---|---|---|
| Meta Ads (incluye Biblioteca de Anuncios) | Media buyer, Investigador | **Conectado** |
| Canva, Adobe, Figma, Gamma | Diseñador | **Conectados** (los créditos de IA de cada plan; se usan dentro de lo incluido) |
| HyperFrames (HeyGen) | Editor de video | Conectado (lectura) + habilidad local `npx skills add heygen-com/hyperframes` |
| Supabase | Analista, Calidad, Growth | **Conectado** |
| GitHub (render de video, recorridos) | Editor de video | **Conectado** |
| **TikTok for Business** | Media buyer, Publicador | **Falta conectar** (claude.ai → Conectores) |
| **vidIQ** | Investigador | **Falta conectar** (tendencias de TikTok/Instagram) |
| AdWhispr | Investigador | Opcional (anuncios de la competencia en TikTok) |

---

## 4 · Límites que ningún rol puede cruzar

- **Plata**: tope de pauta aprobado (S/350 hasta el 9 nov). Más, solo con aprobación del dueño.
- **Producto**: nunca una foto falsa del sándwich.
- **Precios y premios**: siempre de la base; Calidad bloquea si no coinciden.
- **Legal**: nada de datos legales inventados; textos legales intocables.
- **Marca**: el `//` es el corte del pan, dorado y celeste; SND//WCH no tiene identidad regional.

---

## 5 · Cómo se construye (fases)

1. **Cimientos (antes del 13 oct)** — **hecho el 2026-10-07**: `marketing_calendar` ampliada
   (plantilla, gancho, `src`, rol, revisión, datos, métricas) en vez de tablas nuevas;
   `marketing_plan`, `marketing_flow_cola`, `visitas_por_origen`; `orders.origen` (el `?src=`
   viaja con el pedido); ViewContent e InitiateCheckout al píxel; **video del día** en GitHub
   (`.github/workflows/video-diario.yml` → `scripts/video-auto/diario.mjs`), que deja un borrador
   pendiente de revisión. El cron de publicación ya no toma nada `bloqueado`.
2. **Producción diaria**: rutinas de Creativo → Diseñador/Editor → Calidad → Publicador.
   Playbooks de las rutinas en `docs/marketing/roles/` (`revisor.md` diario 11:15,
   `analista.md` domingo 20:00). Para ahorrar créditos, varios roles comparten una rutina.
3. **Bucles**: tarjeta para compartir, WhatsApp gratis, tarjeta de Rappi, reseñas.
4. **Pauta** (27 oct): Media buyer con los S/350.
5. **Analista y bandido**; retrospectiva semanal.
6. Borrar lo viejo (rotador de textos, recordatorios por push, gasto a mano).

---

## 6 · Flow: los personajes que ya tienes, conectados al equipo (2026-10-07)

Dueño: «Recuerda que tenemos los personajes en Flow, ¿hay forma de que se conecte?».

**Sí, por tu laptop.** Flow no tiene API ni conector oficial; los servidores MCP que existen
(`hitjcl/google-flow-mcp`, ver `docs/FLOW_EN_TU_LAPTOP.md`) manejan Flow en un navegador con **tu**
sesión de Google. Por eso el equipo en la nube no puede abrirlo, pero tu computadora sí:

1. El equipo en la nube escribe cada día los encargos de video para Flow en la cola
   `marketing_flow_cola`: prompt, personajes (`@SANDO`, `@WICHO`, los que ya armaste en Flow),
   duración, formato vertical.
2. Una **rutina programada en tu laptop** (Claude Code local + el MCP de Flow) toma la cola cuando
   la laptop está prendida, genera en Flow con tus personajes, y sube el video al almacenamiento
   de la app.
3. El Editor de video lo recibe, le pone subtítulos, precio de la carta y cierre de marca, pasa por
   Calidad y se publica.

- **Costo**: los créditos que ya trae tu plan de Flow; la rutina **se detiene si no quedan
  créditos**, nunca compra más.
- **Si la laptop está apagada**: no se pierde nada. Ese día salen los videos por código (§2.6) y
  las escenas de Canva; los de Flow salen cuando vuelva a prenderse.
- La comida en Flow tampoco se inventa: los personajes actúan; el sándwich que se muestra es la
  foto real, compuesta por el Editor.

## 7 · Más y mejor, todo gratis

Lo que agrega el equipo además de lo de arriba, sin costo:

| qué | rol | por qué rinde |
|---|---|---|
| **Una página por Signature** en sndwch.app (`/carta/philly-cheesesteak`) con datos estructurados de menú | Growth / SEO | Google la muestra en búsquedas como «sándwich Trujillo delivery», gratis y para siempre |
| **YouTube Shorts** con los mismos videos | Publicador | Tercera red de video corto sin producir nada extra (API gratuita; una autorización tuya una vez) |
| **Concurso «Muestra tu sándwich»**: quien publica su pedido etiquetándonos desbloquea un premio de las reglas | Growth | Contenido de clientes reales; el sistema detecta las menciones por la API de Instagram y lo reposta |
| **Respuestas automáticas en Instagram** (comentarios y mensajes) con precio, horario, zona y link | Comunidad | La API de mensajería de Instagram es gratis; responder en minutos multiplica las ventas por mensaje |
| **Calendario de momentos de Trujillo**: quincena y fin de mes, partidos de la selección, Canción Criolla y Halloween (31 oct), feriados, días de calor | Investigador | El mismo contenido rinde varias veces más el día correcto |
| **Experimentos con hipótesis**: cada semana 1 prueba con una sola variable (gancho, hora, formato, personaje) | Analista | Aprender rápido sin quemar la pauta |
| **Espionaje semanal de la competencia**: anuncios activos y reseñas negativas de La Casera, Don Pacho, Subway… | Investigador | Sus quejas (frío, demora, poco relleno) son tus ganchos |
| **Optimización de tu ficha en Rappi** (fotos reales, nombres, descripciones, orden) | Growth | Rappi es tu vitrina del primer mes; el equipo prepara todo para que solo lo pegues |
| **Embajadores de oficina**: quien organiza 3 pedidos grupales recibe un premio de las reglas | Growth | El pedido grupal es el canal más barato para llegar a 5 personas nuevas de una vez |
| **Revisión diaria de la marca**: precios, fotos y textos publicados contra la base | Calidad | Un error publicado cuesta confianza; se borra o corrige solo |

Herramientas: todo con lo conectado (Canva, Adobe, Figma, Meta, Supabase, GitHub) y lo gratis
(GitHub Actions, codificador libre, la API de Instagram, la de YouTube y la de WhatsApp dentro de
la ventana gratis). Lo único que no es gratis es lo que ya aprobaste: los S/350 de pauta.
