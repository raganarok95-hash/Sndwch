# Cómo trabajan los grandes equipos y qué cambia en SND//WCH (2026-11-10)

Pedido del dueño (2026-11-10): rechazó un reel por tener un título «todo tonto» y sin fundamento, y pidió «que se investigue
cómo mejorarse, qué aplican los grandes equipos de marketing… creatividad, ideas nuevas… líneas claras de ideas, de marca, de
marketing, de los porqué, algo completo y extremadamente bueno».

Este archivo es **investigación y propuesta**. No cambia ningún agente, skill ni tarea programada. Cada hallazgo lleva fuente y
fecha; lo que no pude ver está en la sección 3. **Honestidad sobre la evidencia:** varias fuentes son prensa de marca o
entrevistas (se marca cada una). Casi ningún dato de eficacia viene de un negocio de delivery de un solo local: se toman como
orientación, no como promesa.

---

## 1 · Qué falló en «Ese ya gotea» y por qué falló el sistema (no solo el título)

El guion (`docs/marketing/reels/2026-11-10-gotea/GUION.md`) justifica el título con una sola comprobación: «Revisado con
`git grep`: ni "gotea" ni "el jugo es de la res" se usaron antes». **Eso prueba que es nuevo, no que sea bueno.** Lo que
existe y por qué no lo evitó:

| lo que existe | qué falla | por qué (evidencia en el repo) |
|---|---|---|
| Rúbrica de 8 criterios (`AGENCIA.md` §4; `idear-y-cerrar`) | Puntúa ideas **ya hechas**; ningún criterio pregunta «¿por qué este título, de qué verdad o tensión sale?». Un título puede sumar 30 con Gancho y Serie altos y no tener fundamento | Los 8 criterios son Brief, Momento, Marca a los 2 s, Gancho, Contagio, Pedible, Verdad, Serie. Ninguno es «Título con porqué» ni «Insight» |
| Brief de una página (`brief-sndwch`) | Es **de la semana** (una idea por semana). Los reels (`reels/COMO_SE_HACEN.md`) pasan de «Guiones» a «Encargos» **sin mini-brief y sin la puerta de concepto** de `/pieza` | La carpeta del reel solo tiene `GUION.md` y `reel.json`; no hay `BRIEF.md` (sí lo tienen las piezas de `piezas/`) |
| Creativo abre y cierra (`.claude/agents/creativo.md`) | **Quien inventa también puntúa y elige**. El único revisor independiente es Calidad, y solo mira verdad y ley, no si la idea es buena | `creativo.md` pasos 2 y 3: «Abrir… Cerrar» con el mismo agente |
| Biblia de la serie (`BIBLIA_DE_LA_SERIE.md`) | Es la **premisa del show** (dos hermanos, orden contra caos), no una **plataforma de marca**: no dice contra qué estamos, qué territorios tenemos ni qué línea sostiene a todas las demás | Búsqueda de «plataforma de marca / posicionamiento / territorio» en `docs/`: no hay ningún documento que lo defina |
| Novedad como filtro (`estilo-sndwch` reglas 7 y 8; `git grep`) | Se castiga repetir, pero **no se pregunta si lo nuevo sirve**. Lo raro y nuevo puede ser también incomprensible | El propio guion de «gotea» |
| Aprendizajes por rol | Casi vacíos: `investigador.md` no tiene nada; `creativo.md` tiene 4 entradas, todas sobre **piezas**, ninguna sobre **por qué se mata una idea** | `docs/marketing/equipo/aprendizajes/` |
| Lo que sí sirve y se conserva | La Biblia de la serie, los momentos de compra (`AGENCIA.md` §2.2), el brief de una idea, la regla «Lo que llega», `por-que-vende`, el reel de prueba diario, el sí semanal del dueño | — |

**Opinión mía, sin fuente, sobre el título (sirve de ejemplo para el test de la sección 5):** «Ese ya gotea» es una afirmación
que solo se entiende viendo la toma; dicha sola no promete nada, no pregunta nada y «gotea» puede leerse como sándwich que
chorrea (lo contrario de «Lo que llega»: una porción limpia). Ver la sección 5 para cómo se habría detectado.

---

## 2 · Lo que hacen los mejores (hechos, con fuente y fecha)

### 2.1 Agencias creativas

| hallazgo | fuente y fecha | qué se saca |
|---|---|---|
| BBH parte de **mapear lo que hace toda la categoría** para no caer ahí. Hoy lo hace con un «Zig Index»: un anuncio deliberadamente ordinario que se pega en la pared durante el desarrollo creativo, y antes una caja en el brief con «las convenciones que evitar». Ejemplo Burger King: la marca se conocía por nuggets y descuentos; volvieron a su **activo distintivo, el Whopper** | Creative Salon, 2024-11-21 | La originalidad se mide **contra la categoría**, no contra lo que ya publicamos nosotros. Hace falta un mapa de lo que hacen todos |
| Hegarty: «el brief es el primer anuncio de la campaña; es mi trabajo mejorarlo». Y: «ninguna gran idea salió de una reunión de lluvia de ideas»; hay que **rodearse de gente que te lleve la contra**; una idea sin ruta clara a vender o sin marca fuerte «la copia la competencia rápido» | WARC, «It all begins with a brief» (sin fecha, autor no confirmado); inkl, entrevista a Hegarty (sin fecha) | El brief es parte de la creatividad. La crítica la hace alguien que disiente, no un comité. Las ideas se piensan por separado antes de juntarse |
| Hegarty sobre procesos de agencia: los que se presentan a clientes son «todo tonterías» | Creative Review (sin fecha) | Un proceso largo no garantiza nada; importa que cada filtro mate algo de verdad |
| W+K: **«caminar en tonto cada mañana»**: pone en cada cuenta a gente sin experiencia en la categoría (para Honda, equipo de no especialistas en autos; salió «Cog», 2003) | B&T (Inventium), 2016-05-12 (opinión externa) | Hace falta una lectura **sin contexto** de cada idea: si alguien que no sabe nada no la entiende, falla |
| Droga: «muchas veces el cliente compra procesos, y es humo y espejos»; «ellos son más fuegos artificiales y nosotros más faro» (enfoque de largo plazo) | Digiday, 2015-08-21 (entrevista) | Un proceso sirve solo si mejora el resultado. Faro = pocas ideas que se repiten, no cien que se olvidan |
| Africa Creative (Brasil): entender el problema y su **tensión**, encontrar un **insight**, decidir cómo contarlo y distribuirlo, y **verificar si funcionó**. Prefieren «una buena idea a una nueva». Quieren buscar la causa raíz, no tratar el síntoma. Los cargos no dan autoridad | Meio & Mensagem, 2018-02-20 (entrevista a Gordilho) | La cadena **problema → tensión → insight → idea → verificación** es lo que falta entre «verdad de la carta» y «título» |
| Circus Grey Perú: una gran idea «resuelve muy bien un problema de negocio»; una campaña de Unacem se mapeó, se presentó al comité creativo global de Grey y salió dos años después; «Perú quizás es el mejor brief» | Forbes Perú, 2026-04-23 | El criterio peruano: negocio primero. El artículo no detalla etapas internas |
| Mother: todos entran a la idea desde el inicio, **nadie decide solo** el resultado, la gente cambia de sitio cada seis semanas, los trabajos se presentan al resto de la agencia | Creative Lives in Progress, 2018-03-13 | Contrapunto: no existe una sola fórmula. Pero el artículo **no cuenta cómo mueren las ideas** |
| Jung von Matt, Fahrenheit DDB, Ogilvy | **Sin fuente útil** (ver sección 3) | — |

### 2.2 Equipos de marca y social in-house

| equipo | hallazgo | fuente y fecha |
|---|---|---|
| **Duolingo** | Equipo de seis roles (jefe de social, community manager, coordinadores, managers). Las ideas se sacan en una **lluvia semanal**, a menudo de audios en tendencia, y se eligen las que el equipo siente con más fuerza. Ciclo de **dos días**, sin esperar a la dirección. Hay controles: legal puede frenar tendencias, y algunas ideas van a un canal de «Standards and Practices» con un consultor externo. Una idea avanza si es buena para la marca aunque alguien interno objete. El personaje se construye con **estructura narrativa** (lore, conflicto, viaje del héroe). Se mide con impresiones, likes, compartidos, reposts y uso en la app. «No planees la viralidad; planea la mentalidad que la produce» | Technical.ly, 2025-03-25; Contagious (sin fecha visible) |
| **Liquid Death** | Sin briefs formales ni discusión larga: **«Liquid Death es la idea»** (la marca es la estrategia). Equipo «muy pequeño», producción propia («Death Machine»), **«vende la idea más pequeña posible»**, salida «desechable» (casi una campaña por semana), probar sin parar «como un cómico en micrófono abierto», usar la respuesta de TikTok en tiempo real como investigación. La IA, según el VP, mayormente recicla ideas que la marca ya tiene | LBB Online, 2025-11-05 (entrevista; el artículo no explica cómo se matan ideas) |
| **Wendy's** | Equipo central de cinco personas con decisiones rápidas y estructura plana; el tono («sassy») lo define el máximo responsable de marketing; **seguro de sí sin presumir**: el chiste debe ser simpático, no un «somos mejores». El tono se adapta a cada plataforma. Nota: la fuente de 2019 es **contenido de marca pagado por Wendy's** | Fast Company (FastCo Works), 2019-04-18; NRN, 2024-04-22 |
| **Popeyes** | La campaña planificada (cuatro meses) se descartó en buena parte cuando el tuit orgánico explotó; evalúan ideas con lentes **sociales y culturales**; equipo en un grupo de WhatsApp para noticias y tendencias; la agencia, no un equipo propio, lo llevaba | The Root, 2019-11-26 |
| **Burger King, «Whopper Detour»** (FCB Nueva York): cupón de un centavo del Whopper que solo se desbloquea estando cerca de un McDonald's | 1.5 millones de descargas de la app, 3.5 mil millones de impresiones, retorno 37 a 1 **según Burger King**; Gran Premio Directo en Cannes | Adweek, 2019-06-19 |
| **McDonald's, «Famous Orders»**: parte del hecho «todos tenemos un pedido de siempre» y lo convierte en el producto de la campaña | Mejor campaña del mundo en los Effie Global (premio «Iridium»); «cientos de millones de ventas incrementales» según el jurado | Effie, 2023-12-07 |
| **Ryanair, Chipotle, Inka Kola** | **No se obtuvo proceso útil**: Ryanair (The Drum, 2023-11-10) solo describe el tono (sarcástico, a veces el cliente es el blanco del chiste) sin reglas ni estructura; Chipotle e Inka Kola solo aparecieron en búsquedas, no se leyeron | — |

### 2.3 La evidencia de eficacia

| hallazgo | fuente y fecha | límite |
|---|---|---|
| **Largo y corto plazo (Binet y Field):** reparto óptimo cercano a **60 % construir marca / 40 % activación**; las campañas **emocionales** dan más efectos de marca y de negocio que las racionales; **alcance amplio** rinde más que segmentar fino; la «fama» (lo que la gente comenta) da el mayor crecimiento de ganancias; la cuota de voz crece con la cuota de mercado | Resumen de Alex Murrell sobre *The Long and the Short of It* (sin fecha en la página; resumen con un pasaje de lealtad contradictorio, que no se usa) | Datos del IPA, de marcas grandes con TV. Al abrir, el reparto se empareja (cifra 56/44 que **no pude verificar**) |
| **Ehrenberg-Bass (Romaniuk y Sharp):** puntos de entrada a la categoría = situaciones (por qué, cuándo, dónde, con quién, con qué) que traen la categoría a la cabeza; la marca debe venir a la mente en esas situaciones. Un **activo distintivo** necesita **fama** (la gente lo reconoce) y **unicidad** (lo liga a la marca); se desarrolla, se mide y se mantiene | Resumen de Alex Murrell sobre *How Brands Grow Part 2* (sin fecha) | Medirlos de verdad exige encuestas que no tenemos; ver proxy en la sección 4.6 |
| **System1, personajes («Fluent Devices»):** una campaña con personaje de marca como vehículo creativo tiene **37 % más probabilidad de crecer en cuota, 27 % más de ganar clientes, 30 % más de ganar ganancias**; en una prueba en línea, **hasta 50 % más tiempo de permanencia** y hasta 25 % más recuerdo espontáneo. El uso de personajes **cayó del 41 % (1992) al 12 %** en los casos del IPA, o sea, sobra espacio. M&M's 2023: el anuncio con los personajes sacó 4.8 estrellas; el de la celebridad, 1 | System1 (artículo sin fecha, datos IPA DataMINE); System1, 2024-05-13; IPA/System1 Eff Week 2017 | Datos de TV y de marcas grandes; los números exactos de la prueba en línea no están detallados. Dato clave para nosotros: los personajes casi no se usan en digital («oportunidad perdida», WARC 2019-06-10) |
| **El gancho en Reels (Meta):** el gancho debe llegar en «los primeros segundos»; tres tipos: **promesa de valor, declaración de intención, pregunta o invitación**; probar ganchos con A/B porque «pequeños cambios… mejoran mucho»; Reels con música o locución dan hasta 13 % más conversiones incrementales (dato de Meta, anuncios) | Social Media Today (sobre blogs de Meta), 2025-12-17 | Cifras de Meta sobre anuncios, no de contenido orgánico |
| **Instagram:** la métrica nueva **skip rate** = porción de gente que se va del Reel en los primeros **3 segundos**, junto al gráfico de retención | Website Builder Expert, 2025-08-28 | No da umbrales numéricos; hay que comparar contra nuestro propio historial |
| Efecto de las series: «campañas únicas de largo plazo rinden más que varias cortas» | Solo vi el **titular** de un resumen de WARC (de pago), no el contenido | No lo uso como base de nada |

**Conclusión de la sección 2 en cuatro frases.** (1) Las mejores agencias ponen el esfuerzo **antes** de la idea: el brief, la
categoría y el insight. (2) Matan ideas con **una persona que disiente** y con una lectura sin contexto, no con más puntaje.
(3) Los equipos sociales ágiles son pequeños, tienen un **personaje con conflicto y memoria**, una voz fija y un ciclo corto,
y **prueban en público** ideas pequeñas. (4) La eficacia viene de repetir los mismos activos y personajes ante gente amplia, en
las situaciones donde se decide la compra, con emoción.

---

## 3 · Lo que no pude ver

- **Wieden+Kennedy, Droga5, Mother, Jung von Matt, Ogilvy, Fahrenheit DDB:** no encontré su brief, su rúbrica ni cómo matan ideas.
  Solo hay filosofía (W+K, Droga) y estructura (Mother). Mother no cuenta cómo se matan ideas y Liquid Death tampoco.
- **Africa Creative:** solo una entrevista de 2018 con principios generales.
- **Duolingo en The Drum (2025-02-25):** la página no cargó contenido. Usé Technical.ly y Contagious.
- **Chipotle, Inka Kola y la «Famous Orders» como proceso:** solo resultados; el proceso interno no está publicado donde pude llegar.
- **WARC y Effie por dentro:** son de pago; solo vi resúmenes y titulares.
- **Datos de Meta sobre el segundo exacto:** no encontré un número oficial de «pierdes X % en el segundo 1»; solo «primeros
  segundos» (Meta) y «3 segundos» (skip rate de Instagram).
- **Perú, rubro comida:** no revisé la Biblioteca de Anuncios ni Rappi en esta corrida (el pedido era de método, no de mercado).

---

## 4 · El método para SND//WCH

**Principio rector:** *ninguna pieza sale si no se puede completar la frase «Se llama así / dice esto porque…» con un hecho del
brief o de la carta.* El dueño debe poder leer ese «porque» en la tarjeta de aprobación sin preguntar.

### 4.1 Los roles: qué falta, qué se separa

Hoy hay 13 especialistas (`.claude/agents/`) y casi todo el trabajo creativo lo hace uno solo. **Costo real:** una skill cargada
en la sesión es casi gratis; un subagente cuesta 120–235 mil tokens (nota de `agencia-semana`). Por eso: roles nuevos como
**skills** que carga la sesión, y **subagente solo donde la independencia es el punto** (el crítico y el extraño). El dueño ya
autorizó subagentes para las piezas creativas del feed (CLAUDE.md, 2026-11-02).

| rol | qué hace | cómo se implementa | por qué existe (fuente) |
|---|---|---|---|
| **Planner** (separar del Estratega) | Es dueño de la **plataforma de marca**, del **banco de insights** y escribe los **mini-briefs** de cada reel. No inventa piezas | Skill `plataforma-de-marca` + `brief-reel`; lo ejecuta la sesión del lunes | Africa (tensión → insight), Hegarty (el brief es el primer anuncio), Romaniuk (momentos) |
| **Dupla A y Dupla B** (separar del Creativo) | Cada una recibe el **mismo mini-brief y un territorio distinto**, piensa **por separado** y entrega 3–4 ideas con guion corto y 3 títulos candidatos | 2 llamadas en paralelo al agente `creativo` con territorios distintos (no se ven entre sí) | Hegarty (no lluvia de ideas en grupo; las ideas se piensan solas y luego se confrontan) |
| **Crítico** (nuevo, independiente) | **Solo mata o deja pasar**; no escribe ideas. Aplica la rúbrica de matar y deja el motivo por escrito | Subagente nuevo `critico` con una sola tarea, sin acceso a lo que dijo la dupla sobre sus propias razones | Hegarty (gente que lleva la contra), Duolingo («Standards and Practices» como canal aparte) |
| **Extraño** (nuevo, sin contexto) | Lee **solo** el título y la descripción de los primeros 3 s y responde: ¿qué cree que es? ¿qué le provoca? ¿qué haría? | Subagente nuevo `extrano` sin skills de marca ni CLAUDE.md (para que no sepa nada) | W+K («caminar en tonto») |
| **Titulero** (separar del Redactor) | Dueño de títulos, ganchos y última línea; aplica el **test de títulos**; cada título lleva su porqué | El Redactor, con la skill `test-de-titulos`; no el Creativo | Meta (tres tipos de gancho, probar variantes) |
| **Guionista de producción** (separar del Productor) | Pasa el concepto aprobado a plano a plano, con prompt de Flow, texto en pantalla y duración | Skill `guion-de-reel` (lo que hoy hace «la rutina») | Liquid Death («vende la idea más pequeña»: guion corto) |
| **Productor + Editor** (ya existen) | Flow en Chrome, montaje con `scripts/reels/montar.mjs` | Igual que hoy (`COMO_SE_HACEN.md`) | — |
| **Calidad** (ya existe) | Verdad, ley, marca. No juzga si es buena | Igual | — |
| **Analista + postmortem** (ya existe, se amplía) | Cada reel tiene su postmortem de 15 minutos al sexto día, que alimenta los aprendizajes | Skill `postmortem-reel` | Africa («verificar si funcionó»); Liquid Death (probar en micrófono abierto) |
| **Investigador** (ya existe) | Además de la competencia: el **mapa de la categoría** (qué hacen todos) y las **tensiones** de comentarios y reseñas | Skill `investigar-mercado` ya tiene el §1; se suma el mapa | BBH (Zig Index) |

### 4.2 Los documentos que hacen falta

| documento | qué es | dónde vive |
|---|---|---|
| **`PLATAFORMA_DE_MARCA.md`** (fijo; se revisa una vez al mes) | 1) La **razón de existir** en una frase. 2) El **enemigo**: lo que hace toda la categoría y no haremos (sale del mapa de la categoría). 3) La **promesa** y su **prueba** (la receta y la porción reales de `CARTA.md`). 4) Los **puntos de entrada** (los momentos de `AGENCIA.md` §2.2). 5) Los **territorios creativos** (3–4). 6) El **tono** de cada hermano y de la marca (qué sí, qué nunca). 7) Los **activos distintivos** y cómo se prueban (fama y unicidad) | `docs/marketing/PLATAFORMA_DE_MARCA.md` |
| **`MAPA_DE_CATEGORIA.md`** | Lo que muestran y dicen **todos** los anuncios de sándwich y delivery en Perú esta semana (la Biblioteca de Anuncios), en una imagen mental de «lo ordinario». Es el «Zig Index» barato | `semanas/<lunes>/INSUMOS.md` §2, ampliado |
| **`BANCO_DE_INSIGHTS.md`** | Tensiones humanas en una frase («la gente quiere X pero Y»), cada una con su fuente real: comentarios, reseñas de la competencia, pedidos reales, la propia carta. Nunca inventadas | `docs/marketing/BANCO_DE_INSIGHTS.md` |
| **Mini-brief del reel** (`brief-reel`) | Una página: ver 4.2.1 | `reels/<fecha>-<nombre>/BRIEF.md` |
| **Rúbrica para matar** | Puertas de sí o no, antes del puntaje; ver 4.4 | skill `idear-y-cerrar` (se amplía) |
| **Test de títulos** | Ver sección 5 | skill nueva `test-de-titulos` |
| **`MATADAS.md`** | Cada idea muerta, con la puerta que no pasó y el motivo. Es la memoria que evita repetirlas | `semanas/<lunes>/MATADAS.md` y resumen en `aprendizajes/creativo.md` |
| **Postmortem del reel** | Una tabla: qué se esperaba, qué pasó, qué se aprende | `reels/<id>/POSTMORTEM.md` |

**4.2.1 · El mini-brief del reel (una idea, una página).**

```
Reel: <id> · semana del <lunes> · día
1. El problema de negocio (un número que se mueve: envíos por alcance, alcance a no seguidores, pedidos con ?src=).
2. El momento de compra (de AGENCIA §2.2) y a quién le habla (nivel de conciencia).
3. EL INSIGHT: «La gente quiere ___ pero ___» (con su fuente en BANCO_DE_INSIGHTS).
4. La prueba: el hecho de CARTA.md que lo sostiene, tal cual.
5. Qué piensa hoy · qué debe pensar y sentir al terminar (una emoción nombrada).
6. El territorio (uno de los de la plataforma) y quién lo lleva (SANDO, WICHO o los dos).
7. Qué hace ordinaria a la categoría aquí (del mapa) y qué haremos distinto.
8. Tipo de gancho (Meta): promesa de valor, intención o pregunta/invitación.
9. Lo que NO (de MATADAS y aprendizajes).
10. Cómo se mide y cuándo se decide (el día 6).
```

**Territorios creativos: borrador para que el Planner lo revise.** Salen de lo que ya está en el repo, no de datos nuevos.
No son decisión hasta que el dueño los apruebe.

1. **Orden contra caos** (el motor de `BIBLIA_DE_LA_SERIE.md`): SANDO cura, WICHO arma.
2. **Lo que llega** (la regla de estilo de `PLAN.md` §5): la porción real, el pan que aguanta, el jugo que no se pierde.
3. **El momento** (los puntos de entrada de `AGENCIA.md` §2.2): la reunión que se alarga, la noche sin ganas de cocinar.
4. **La cocina y el corte** («Detrás del pan» está prohibida por gastada en `anuncio-directo`) (la cocina y el corte, el `//`): cómo se arma lo que llega, sin mostrar a nadie hasta que haya fotos reales.

### 4.3 El proceso de cada semana, con sus filtros

| cuándo (Lima) | quién | qué | filtro que mata |
|---|---|---|---|
| Dom 23:15 | código (ya existe) | `DATOS-base.json` | — |
| **Lun, primero** | Investigador | `INSUMOS.md` con **mapa de la categoría** y **tensiones nuevas** | **F0:** si no hay mapa, no hay brief |
| Lun | Planner | `PLATAFORMA_DE_MARCA.md` (solo se lee) y **4 mini-briefs** (uno por reel) | **F1 Brief:** un reel sin insight con fuente no se encarga |
| Lun | Dupla A y Dupla B (en paralelo, separadas) | Cada una: 3–4 ideas por brief, con guion de 5 líneas y 3 títulos | — (aquí se abre, sin juzgar) |
| Lun | Crítico | Aplica las puertas (4.4). Deja **2 finalistas por brief** y registra en `MATADAS.md` | **F2 Rúbrica para matar** |
| Lun | Titulero + Extraño | **Test de títulos** a los finalistas (sección 5) | **F3 Título con porqué** y **F4 Test del extraño** |
| Lun | Guionista | Plano a plano, prompt de Flow, texto en pantalla | **F5 Verdad de la carta** (la comida en cuadro es la receta real) |
| Lun | Calidad + Director de arte | `verdad-y-ley` y `estilo-sndwch` | **F6 Verdad y ley** |
| **Lun, noche** | Dueño | **Una tarjeta con la semana entera.** Por reel: idea en una frase, título, **el porqué en una línea con su fuente**, qué se espera medir | El dueño decide; lo que no responde antes del martes 9:00 no se produce si toca plata, ley o marca |
| Mar–Dom | Productor + Editor | Flow en Chrome, montaje, un reel por día (mar, jue, sáb, dom) | — |
| **Día 6 tras cada reel** | Analista | **Postmortem** (4.6); **mata, repite o itera** | **F7 Datos:** el reel decide la próxima semana |
| Dom 23:15 | Analista + Planner | Actualiza el banco de insights y la lista de territorios que funcionan | — |

**Límite honesto:** hoy el equipo no puede abrir Instagram sin navegador ni leer cuánto se queda la gente. Mientras no abra el
local, **no hay pedidos que medir**: las métricas son envíos, alcance a no seguidores y skip rate. Si el Analista no lee
Instagram el domingo, F7 no funciona y se dice en la tarjeta del lunes.

### 4.4 La rúbrica para matar ideas

Antes del puntaje de 8 criterios existente. **Cualquier «no» mata la idea.** El Crítico escribe el motivo en `MATADAS.md`.

| puerta | pregunta | de dónde sale |
|---|---|---|
| **P1 Insight** | ¿Se puede escribir «La gente quiere ___ pero ___» con una fuente real? | Africa (tensión → insight) |
| **P2 Título con porqué** | ¿Se puede completar «Dice esto porque ___» con un hecho del brief o de la carta, sin recurrir a «suena bien» o «es nuevo»? | principio rector del método |
| **P3 La categoría** | ¿Está en el mapa de lo ordinario (lo que todos ya hacen)? Si sí, ¿qué cambia? | BBH Zig Index |
| **P4 El extraño** | Alguien sin contexto, con solo el título y los primeros 3 s, ¿entiende qué es y qué hacer? | W+K, Meta |
| **P5 El activo** | ¿Se reconoce como nuestra sin leer el nombre (hermanos, `//`, voz)? | Romaniuk (fama y unicidad) |
| **P6 La verdad** | ¿Lo que se ve es la receta y la porción reales y se puede pedir? | INDECOPI, `verdad-y-ley` |
| **P7 La ruta a la venta** | ¿Hay un camino claro a envío, a guardado o a pedido, y no es solo un chiste? | Hegarty (ruta clara a vender) |
| **P8 El riesgo** | ¿Se burla de alguien, empuja a WICHO a ser el tonto del chiste o promete algo apagado? | `BIBLIA` §4; Wendy's (seguro sin presumir) |

Lo que pasa las 8 puertas se puntúa con la rúbrica existente (Brief, Momento, Marca a 2 s, Gancho, Contagio, Pedible, Verdad,
Serie), más dos criterios nuevos: **Insight** y **Título con porqué**. Se propone con 36 de 50 o más.
*Los umbrales son una apuesta, sin estudio; se ajustan con los postmortem.*

### 4.5 La medición

| qué | cómo | por qué |
|---|---|---|
| **Skip rate a 3 s** y gráfico de retención | Instagram, leído el sexto día. Se compara **contra los últimos 8 reels nuestros**, no contra un número externo (Instagram no da umbrales) | Instagram, 2025-08-28; Meta, 2025-12-17 |
| **Envíos por alcance** y alcance a **no seguidores** | Instagram | Sharp (llegar a más gente), la métrica número uno ya definida en `COMO_SE_HACEN.md` |
| **Pedidos con `?src=`** | Base (desde el día de apertura) | el único número que decide (`AGENCIA.md` §7) |
| **Reconocimiento del personaje** (proxy de fama y unicidad) | Cada mes: ¿cuántos comentarios o mensajes nombran a SANDO o WICHO sin que el texto los nombre? | Romaniuk. **Apuesta, sin estudio**: el estudio real exige encuesta |
| **Regla de decisión inicial** | **Itera el gancho** (no la idea) si el skip rate está en el tercio peor de nuestros últimos 8; **repite** el territorio si está en el tercio mejor y además se envía; **mata el territorio** tras tres reels malos seguidos | Apuesta, sin estudio; se afina cada mes |

### 4.6 Qué cambia en lo que ya existe (sin tocarlo hoy)

- `idear-y-cerrar`: agregar la sección «Matar» con las 8 puertas y los dos criterios nuevos.
- `brief-sndwch`: agregar el mini-brief del reel (4.2.1).
- `reels/COMO_SE_HACEN.md`: pasos nuevos entre «Referentes» y «Guiones»: mini-brief, duplas, crítico, título, extraño.
- `agencia-semana`: el paso 3 pasa de «30 ideas del Creativo» a «duplas A y B → crítico → 2 finalistas por brief».
- `.claude/agents/`: nuevos `critico.md` y `extrano.md`; `creativo.md` deja de cerrar; `redactor.md` suma el test de títulos.
- `aprendizajes/`: el crítico y el analista escriben las muertes y los postmortem; el investigador deja de estar vacío.

---

## 5 · El test de títulos

Todo título o línea de pantalla pasa estas pruebas, **en este orden**. Se prueban **tres candidatos** por reel; el Titulero no
elige por gusto.

| prueba | pregunta | cómo se hace |
|---|---|---|
| **T1 Tipo de gancho** | ¿Es promesa de valor, intención o pregunta/invitación (Meta)? Si es una afirmación suelta, ¿se entiende sin la toma? | Se etiqueta cada candidato |
| **T2 Sin sonido y a 3 s** | ¿Se lee y se entiende en 3 segundos, sin audio? | Se cuenta en palabras y en segundos de pantalla |
| **T3 El porqué** | «Dice esto porque ___» con un hecho de la carta o del insight | Se escribe al lado; sin porqué, muere |
| **T4 Qué es** | ¿Dice qué producto, qué momento o qué conflicto es? | Lectura del Titulero |
| **T5 El extraño** | El subagente `extrano` recibe **solo** el título y lo que se ve en el segundo 0–3, y responde en tres líneas: qué cree que es, qué siente, qué haría | Subagente sin contexto |
| **T6 La lectura mala** | ¿Se puede leer al revés (sucio, falso, burla)? | Se pregunta al `extrano`: «¿qué lectura negativa tiene?» |
| **T7 Nuestro** | ¿Lo diría SANDO (seis palabras o menos, sin exclamar) o WICHO (pregunta, «¿y si…?»)? | `BIBLIA` §2 |
| **T8 Novedad** | ¿Ya se usó? (`git grep`, como hoy). **Es la última puerta, no la primera** | `git grep` |

**«Ese ya gotea» contra el test (mi lectura, no un resultado medido):**
T1 declaración de intención que depende de la toma y no promete nada al espectador; T3 el porqué real («es jugoso, no lleva
salsa») no está en el título, está dos tramos después; T6 «gotea» puede sonar a sándwich sucio o a defecto, contrario a «Lo que
llega»; T8 fue la única puerta que se aplicó. Un candidato que sí dice el porqué y nace de un hecho de la carta se escribe
desde el hecho (jugoso, sin salsa), por ejemplo **«Sin salsa, ¿y no se seca?»** (pregunta/invitación, T1; porqué: la carta dice
«Tan jugoso que no lleva salsa»; lo prueba la última toma). Es solo un ejemplo del método, no una propuesta de pieza.

---

## 6 · Los 8 cambios más importantes (resumen)

1. **Plataforma de marca fija** con enemigo, promesa, prueba, puntos de entrada, territorios, tono y activos (BBH, 2024-11-21; Romaniuk; Liquid Death, 2025-11-05).
2. **Mapa de la categoría antes de crear**, estilo «Zig Index»: lo original se mide contra lo que hacen todos, no contra nuestro feed (Creative Salon, 2024-11-21).
3. **Mini-brief de una sola idea por reel con insight (tensión) y su fuente**, antes del guion (Hegarty, WARC; Gordilho, M&M 2018-02-20).
4. **Quien inventa no elige**: duplas A y B por separado y un **Crítico independiente** que solo mata, con motivo en `MATADAS.md` (Hegarty).
5. **Test de títulos de 8 pruebas**, con tipos de gancho de Meta y la regla «dice esto porque…» (Meta vía Social Media Today, 2025-12-17).
6. **Un «extraño» sin contexto** lee cada título y primeros 3 s, y dice qué entendió y qué lectura mala tiene (W+K, B&T 2016-05-12).
7. **Los hermanos como personajes con lore y conflicto**, usados siempre y en digital (System1: +37 % cuota, +27 % clientes, +30 % ganancias, 2017 y 2024-05-13; Technical.ly, 2025-03-25).
8. **Ciclo corto con postmortem a los 6 días** (skip rate a 3 s y envíos contra nuestro propio historial), y matar territorios, no solo piezas (Liquid Death, 2025-11-05; Technical.ly, 2025-03-25; Instagram, 2025-08-28).

---

## Hecho / Por qué / Para el dueño

- **Hecho:** este archivo (`docs/marketing/equipo/METODO_GRANDES_EQUIPOS.md`). No se cambió ningún agente, skill ni tarea.
- **Por qué:** el título fue solo el síntoma; el sistema no tiene un lugar donde el «porqué» se pida ni un revisor que mate. Los
  mejores equipos ponen el trabajo antes de la idea (brief, categoría, insight) y la crítica en manos de alguien que disiente.
- **Para el dueño:** (1) aprobar el método o tachar partes; (2) aprobar la creación de los dos subagentes (`critico`,
  `extrano`), que cuestan uso de Claude (120–235 mil tokens por llamada, según `agencia-semana`); (3) aprobar los 4
  territorios del borrador o cambiarlos; (4) dar acceso para leer Instagram cada domingo, sin lo cual los filtros F7 y la
  medición no funcionan.
