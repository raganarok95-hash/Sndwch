# El equipo de marketing con subagentes: el plan (2026-10-16)

Dueño, en tres mensajes seguidos:
- «Las imágenes de los sándwich estaban bien, la franja era lo disonante. Arma dentro del equipo de
  marketing un artista o revisor de arte. Validemos creatividad, teoría del marketing, cómo hacerlo,
  que se aprenda a hacerlo bien antes de producirlo. Definamos un estilo artístico que se vea
  profesional, y el porqué.»
- «Quiero que organices un equipo formal con subagentes con skills especializadas para cada uno de
  esos procesos. Armémoslo y esquematicemos, orquestando todos esos subagentes: cuándo se activan,
  cómo trabajan, etc. Haz el plan, ve dónde agregamos más.»

Esquema en una imagen: `esquema.png` (sale de `esquema.html`).

> **Estado (2026-10-16, noche): construido.** Dueño, al repetir el pedido: «Correcto, eso es lo de
> marketing. Revísalo, necesitamos pulirlo al máximo». Los 13 subagentes están en `.claude/agents/`,
> sus skills y los orquestadores en `.claude/skills/`, lo aprendido en `aprendizajes/`. El lunes de
> la laptop ya corre `/agencia-semana` y la tarea de las 8:10 y 20:10 corre `/revisar-lo-producido`.
> Las tres decisiones de §9 quedaron con lo propuesto (equipo y fases; el lunes sigue en la laptop;
> el estilo «Lo que llega»), cambiables cuando el dueño diga. El resto del negocio: `docs/equipo/PLAN.md`.

## 0 · Por qué se rehace

Hoy el marketing tiene piezas sueltas que funcionan, pero no un equipo:

| hoy | el problema |
|---|---|
| Una sola sesión del lunes en tu laptop (`scripts/estudio/LUNES.md`) hace estrategia, creatividad y el resumen para ti | el mismo «cerebro» propone y se juzga a sí mismo: nadie le dice que no |
| La Dirección de arte (tarea programada, 8:10 y 20:10) revisa **solo** las imágenes de Flow de las historias | los anuncios no pasan por nadie: **por eso se coló la franja naranja** |
| No hay un estilo escrito para la fotografía y los anuncios | cada pieza se decide de nuevo, a ojo |
| Pauta, Rappi, comunidad y datos los hago yo a mano en el chat | se hace cuando te acuerdas de pedirlo |
| `DATOS.md` no lo escribe nadie | la agencia decide la semana siguiente sin saber qué trajo pedidos |
| Tu opinión («la franja es lo disonante», «la oficina está horrible») queda en el chat | el equipo no aprende: el mismo error puede volver |

## 1 · Cómo funciona en Claude Code, en simple

- **Subagente** = un especialista. Es un archivo `.claude/agents/<nombre>.md` que dice quién es,
  qué herramientas puede usar, con qué modelo trabaja y qué skills lleva cargadas.
- **Skill** = su manual de oficio. Es `.claude/skills/<nombre>/SKILL.md` más sus archivos de
  referencia (el estilo, la rúbrica, ejemplos aprobados y rechazados con su porqué). Se le carga
  al especialista al empezar.
- **Orquestador** = el Director de cuenta. Es una skill que corre en la sesión principal
  (`/agencia-semana`, `/pieza`, `/revisar-pauta`) y llama a cada especialista en orden, o a varios
  a la vez (hasta 20), y les pasa lo que entregó el anterior. Los especialistas **no se llaman
  entre ellos**: así cada uno trabaja con lo suyo y el orquestador ve todo el recorrido.
- **Dónde corren**: en la nube, como tarea programada (clona el repo desde `main` y trae los
  agentes y skills solo); en tu laptop (el Estudio y Flow, con `claude -p`); y aquí, cuando me lo
  pides.
- **Reglas comunes**: una skill `reglas-sndwch` que llevan todos (tú y nunca voseo; ninguna cifra
  escrita a mano; la verdad de la carta; nada regional; los dos hermanos; el `//`). Los
  especialistas no cargan el CLAUDE.md entero (16 KB en cada uno): ahorra créditos.
- **Lo que no pueden hacer**: un especialista no te puede preguntar nada. Las preguntas las junta
  el orquestador y te llegan en el resumen.

## 2 · El equipo

| # | rol | subagente · skill | qué hace | modelo | estado |
|---|---|---|---|---|---|
| 0 | **Director de cuenta** | orquestador · `agencia-semana`, `pieza`, `revisar-pauta` | corre los ciclos, junta las preguntas, te deja un resumen de una pantalla y pide tus aprobaciones | el de la sesión | nuevo (hoy lo hace LUNES.md) |
| 1 | **Analista** | `analista` · `medir-por-pedidos` | pedidos por origen, costo por cliente de cada pieza, quién vuelve → `DATOS.md` | Sonnet | **nuevo** |
| 2 | **Investigador** | `investigador` · `investigar-mercado` | qué pauta la comida en Trujillo (Biblioteca de Anuncios de Meta), qué hace la competencia → `INSUMOS.md` | Sonnet | **nuevo** |
| 3 | **Estratega** | `estratega` · `brief-sndwch` | el diagnóstico y el brief de una sola idea → `BRIEF.md` | Opus | existe dentro de LUNES.md |
| 4 | **Creativo** | `creativo` · `idear-y-cerrar` | 30 ideas → 7 propuestas con la rúbrica → `IDEAS.md`, historias y encargos | Opus | existe dentro de LUNES.md |
| 5 | **Redactor** | `redactor` · `voz-sndwch` | titulares, textos, la voz de SANDO y de WICHO | Sonnet | **nuevo** |
| 6 | **Director de arte** | `director-de-arte` · `estilo-sndwch` | el estilo y su porqué; **valida el boceto antes de producir** y cada imagen y pieza después, **incluidos los anuncios** | Opus | existe solo para Flow → **se amplía** |
| 7 | **Productor** | `productor` · `producir-piezas` | imágenes fieles (Flow, Figma) y piezas montadas (`scripts/piezas`) | Sonnet | existe en tu laptop → se formaliza |
| 8 | **Editor de video** | `editor-video` · `video-sndwch` | el video del día y los Reels con clips reales | Sonnet | existe en código → se formaliza |
| 9 | **Calidad** | `calidad` · `verdad-y-ley` | lo que el Revisor de código no ve: lo que promete la imagen, INDECOPI, políticas de Meta, el alcohol, lo que tú tienes que decidir | Sonnet | **nuevo** (el Revisor de código sigue) |
| 10 | **Media buyer** | `media-buyer` · `pauta-medible` | Meta y los anuncios de Rappi: arma en pausa, lee los lunes, propone cortes. **Nunca prende ni gasta sin tu sí** | Opus | **nuevo** (hoy lo hago a mano) |
| 11 | **Apps** | `apps` · `vitrina-apps` | la vitrina de Rappi y PedidosYa, promos, calificaciones; te deja lo que pegas | Sonnet | **nuevo** |
| 12 | **Comunidad** | `comunidad` · `responder-como-sndwch` | comentarios, mensajes y reseñas; un reclamo pasa al Libro de Reclamaciones | Haiku | **nuevo** (necesita P40) |
| 13 | **Growth** | `growth` · `crecer-sin-pauta` | embajadores, referidos, pedido fijo, los que dejaron de pedir | Sonnet | **nuevo** |

Cada uno solo con las herramientas de su trabajo: el Analista lee la base pero no escribe; el
Media buyer toca Meta pero no el código; el Director de arte mira y monta, no publica.

## 3 · Cómo se orquesta

### A · La semana

| cuándo | dónde | quién | entrega |
|---|---|---|---|
| **domingo 21:00** | nube | Analista | `semanas/<lunes>/DATOS.md` + lo aprendido |
| **lunes 6:30** | nube (o tu laptop) | Director de cuenta → Investigador ‖ Estratega → Creativo → Redactor ‖ **Director de arte (boceto)** ‖ **Calidad** | `INSUMOS.md`, `BRIEF.md`, `IDEAS.md` con sus bocetos y el `RESUMEN.md` para ti |
| **lunes** | nube | Media buyer | la pauta de la semana leída con `DATOS.md`: qué sigue, qué se corta, qué se propone |
| **lunes o martes** | tu celular | **Tú** | «sí», o cambias o tachas. Lo que no toca plata, ley ni marca se produce el martes a las 9:00 si no respondes (la regla de hoy) |
| **martes a domingo, 7:30 y 19:30** | tu laptop | Productor (Flow) | las imágenes de lo aprobado |
| **8:10 y 20:10** | nube | **Director de arte** | cada imagen y cada pieza revisada con su porqué (la tarea que ya existe, ampliada) |
| **11:15** | GitHub | Revisor (código) + **Calidad** | lo que sale ese día, aprobado o retenido con motivo |
| cuando haya Instagram | nube | Comunidad, Apps, Growth | respuestas, vitrina, embajadores |

‖ = en paralelo.

### B · Una pieza nueva (un anuncio): `/pieza`

1. **Estratega**: el mini-brief (para quién, qué momento, qué tiene que pasar).
2. **Creativo**: 3 conceptos.
3. **Redactor**: el titular y el texto de cada uno.
4. **Director de arte**: una maqueta de cada uno con el estilo. **Puerta 1.**
5. **Calidad**: la verdad y la ley. **Tú eliges el concepto.**
6. **Productor**: la imagen fiel y la pieza en sus dos formatos.
7. **Director de arte**: revisa la pieza terminada. **Puerta 2.**
8. **Calidad**: el último control. **Puerta 3.**
9. **Media buyer**: la deja en la campaña, en pausa. **Tú la prendes.**

### C · Cómo aprende

- Cada rol tiene su archivo `docs/marketing/equipo/aprendizajes/<rol>.md`: lo lee **antes** de
  trabajar y agrega lo que decidió, con el porqué.
- **Lo que tú dices, con tus palabras, se vuelve regla.** «La franja era lo disonante» entra hoy
  al Director de arte; «¿Pides para la oficina? está horrible» también, con el análisis de por qué.
- Cada mes el Analista cruza lo aprendido con los pedidos: lo que el dato contradice, se corrige.
- El estilo y las rúbricas (los manuales de cada skill) solo cambian con tu sí: cambiar el estilo
  es cambiar la marca.

## 4 · Las tres puertas

| puerta | cuándo | quién | con qué |
|---|---|---|---|
| **1 · Concepto** | antes de gastar un crédito en producir | Director de arte + Calidad, y tú | la rúbrica creativa (AGENCIA.md §4) y una **maqueta** con el estilo |
| **2 · Arte** | cuando vuelve la imagen o la pieza | Director de arte | la rúbrica de arte (§5) |
| **3 · Calidad** | antes de publicar o de pagar | Calidad (+ el Revisor de código) | la carta, INDECOPI, las políticas de Meta |

Lo que pediste («que se aprenda a hacerlo bien antes de producirlo») es la Puerta 1: nada se
produce sin una maqueta revisada contra el estilo.

## 5 · El estilo de la marca en fotografía y anuncios: «Lo que llega»

**La idea**: la foto muestra exactamente lo que llega, en el lugar donde se come y a la hora en
que se come. No es un sándwich de estudio: es el tuyo, en tu mesa, a tu hora.

### Por qué este estilo, y no otro

| decisión | el porqué | de dónde sale |
|---|---|---|
| **El sándwich en un lugar real** (mesa, papel kraft, la luz de la hora) y no recortado sobre un color | los anuncios con sentido de lugar, personajes e historia rinden más que los de producto aislado, primeros planos y órdenes en pantalla | Orlando Wood, *Lemon* (IPA, 2019; base de 30,000 anuncios de System1) |
| **Listo para comer, en ángulo de tres cuartos, hacia quien mira** | ver el producto en la posición en que uno lo usaría hace que la mente «lo pruebe» y sube la intención de compra | Elder y Krishna, *Journal of Consumer Research*, 2012 |
| **El queso fundido, el vapor, la textura, de cerca** | ver comida apetitosa despierta el apetito («hambre visual»): el cerebro responde a la imagen como a una señal de comida | Spence y otros, *Brain and Cognition*, 2016 |
| **Un solo foco, el texto en la zona tranquila, tres voces fijas** | lo que se procesa fácil se percibe como más bello y más confiable (fluidez) | Reber, Schwarz y Winkielman, 2004 |
| **Siempre los mismos pocos elementos** (las tres letras de la marca, el `//`, los hermanos) | la marca se reconoce sin leerla cuando sus activos se repiten igual, por años | Romaniuk, *Building Distinctive Brand Assets* |
| **La porción real, nunca desbordada** | INDECOPI sanciona la imagen que promete más de lo que llega | CLAUDE.md; caso Bon o Bon |

### Las reglas

1. **Foto**: el sándwich ocupa entre la mitad y dos tercios del cuadro, en tres cuartos, con el
   fondo desenfocado. La **luz cuenta la hora** (mediodía claro para el almuerzo; lámpara cálida
   para la noche). Un solo objeto del momento (la laptop del almuerzo, la bebida The Bloom de la
   noche). Nada que no vendas, nada de alcohol, nadie en el cuadro hasta que haya fotos reales.
2. **Composición**: un solo foco, la comida. El texto va en la zona tranquila (arriba), nunca
   sobre el sándwich. Un solo velo oscuro para que se lea. **Nada de franjas, marcos ni bandas de
   color.** En vertical, libre el 14% de arriba y el 35% de abajo.
3. **Letra, tres voces y siempre las mismas**: Anton para **el momento** (el titular, cinco
   palabras como máximo); Instrument Serif itálica para **la verdad del producto** (una frase de la
   carta); IBM Plex Mono para **los datos** (el precio, cómo pedir).
4. **Color**: el color lo pone la foto. Encima, solo la tinta (`#1E2B22`) y el papel (`#EFE6D4`).
   El dorado y el celeste viven en el `//` del logo y en ningún otro lado.
5. **Los hermanos**: protagonizan sus propias piezas (la serie). **No se pegan sobre una foto de
   comida**: en un anuncio de producto, a lo más firman con su voz («— SANDO»).
6. **Texto**: el titular es el **momento** (AGENCIA.md §2.2); la frase es la **verdad de la carta**;
   toda cifra sale del código.

### Por qué la franja desentonaba (y el anuncio de la oficina)

- **La franja naranja** es el forro de la casaca de SANDO: un elemento de **su mundo de papel**
  (`docs/LOS_DOS_HERMANOS.md`: «si un elemento no se puede rastrear a algo suyo, no va»). Sobre
  una foto de comida sin SANDO no tiene ancla: es decoración que compite con el sándwich.
- **«¿Pides para la oficina?»**: no muestra comida (sándwiches envueltos), pega a WICHO dibujado
  sobre una foto real (dos mundos que no conversan), y la regla del grupo es demasiado larga para
  leerse en dos segundos. La idea del pedido en grupo puede volver, pero desde cero y por la
  Puerta 1.

### La rúbrica de arte (1 a 5; pasa sin ningún criterio bajo 3 y con 4 de promedio)

| criterio | la pregunta |
|---|---|
| **Foco** | ¿Hay un solo protagonista, la comida? |
| **Lugar y hora** | ¿Se entiende el momento sin leer? |
| **Verdad** | ¿Es la receta y la porción de la carta? |
| **Apetito** | ¿Se ve el queso, el vapor, la textura? |
| **Jerarquía** | ¿Se lee en dos segundos: momento → precio → marca? |
| **Coherencia** | ¿Cada elemento tiene un ancla en la marca? (nada decorativo) |
| **Zonas** | ¿El texto evita la comida y las zonas que tapa Instagram? |
| **Limpieza** | ¿Sobra algo? Si sobra, se quita |

## 6 · Dónde agregamos más

**En marketing, en este orden:**
1. **Director de arte ampliado + el estilo** (lo más urgente: Meta arranca el viernes 23).
2. **Calidad como agente**: el Revisor de código no ve lo que promete una imagen.
3. **Media buyer**: la pauta medida cada lunes, no cuando me acuerdo.
4. **Analista**: sin `DATOS.md` la agencia decide a ciegas.
5. **Apps**: Rappi es el canal más grande del primer mes.
6. **Redactor** e **Investigador**.
7. **Growth** y **Comunidad**, cuando haya clientes y el Instagram esté en el Business (P40).

**Fuera del marketing** (el mismo patrón sirve):
- **Finanzas**: cada domingo, lo real contra el plan de S/6,000 (ventas, margen, costo por cliente).
- **Operación**: el inventario (hoy en 0), los tiempos de entrega, lo que se acaba.
- **Servicio**: los reclamos, que tienen plazo legal.

## 7 · Costo y límites

- Cada especialista empieza de cero y lee sus archivos: el ciclo del lunes son ~8 llamadas. Para
  gastar poco: herramientas justas, manuales cortos, sin el CLAUDE.md entero, Sonnet o Haiku para
  producir y revisar, y Opus solo para estrategia, creatividad, arte y pauta.
- Las tareas programadas en la nube corren desde `main`, como mínimo cada hora, y no pueden
  preguntarte nada: las aprobaciones te llegan en el resumen y en el celular.
- Flow vive en tu laptop: la generación con Flow sigue ahí. Lo demás puede correr en la nube y no
  depende de que la laptop esté prendida.

## 8 · Cómo se arma

| fase | cuándo | qué |
|---|---|---|
| **1** | hoy al domingo | `reglas-sndwch`; Director de arte + `estilo-sndwch` (este estilo, la rúbrica, los aprendizajes de hoy); Calidad; Productor; el orquestador `/pieza`. **Los 3 anuncios pasan por la Puerta 1** y te los muestro antes del viernes |
| **2** | semana del 20 | Analista (domingo), Media buyer (lunes) y el lunes de LUNES.md pasa a `/agencia-semana` con Investigador, Estratega, Creativo y Redactor |
| **3** | cuando haya clientes e Instagram | Apps, Comunidad, Growth; después Finanzas, Operación, Servicio |

## 9 · Lo que decides

1. ¿Apruebas el equipo y el orden de las fases?
2. ¿El lunes corre en la nube (no depende de la laptop) o sigue en tu laptop?
3. ¿El estilo «Lo que llega» es la dirección? Es lo que juzgará el Director de arte.

## Fuentes

- Elder y Krishna (2012), *The «Visual Depiction Effect» in Advertising*: [BYU ScholarsArchive](https://scholarsarchive.byu.edu/facpub/8438).
- Spence y otros (2016), *Eating with our eyes*: [PubMed](https://pubmed.ncbi.nlm.nih.gov/26432045/).
- Orlando Wood (2019), *Lemon*: [System1](https://system1group.com/blog/lemon-preview), [LBB](https://lbbonline.com/news/ipa-publishes-lemon-a-repair-manual-to-reverse-the-crisis-in-creative-effectiveness).
- Reber, Schwarz y Winkielman (2004), *Processing Fluency and Aesthetic Pleasure*: [PDF](https://pages.ucsd.edu/~pwinkielman/reber-schwarz-winkielman-beauty-PSPR-2004.pdf).
- Romaniuk, Sharp, Binet y Field: ya citados en `docs/marketing/AGENCIA.md` §1.
- Subagentes y skills de Claude Code: [subagentes](https://code.claude.com/docs/en/sub-agents), [skills](https://code.claude.com/docs/en/skills), [tareas en la nube](https://code.claude.com/docs/en/routines).
