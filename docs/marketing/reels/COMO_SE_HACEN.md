# Los reels de la semana: cómo se hacen (desde el 2026-11-10)

Dueño (2026-11-10): «deseo que genere 3 o 4 reels a la semana… generar un guión, mover y dar todos los clicks con
claude en chrome… en google flow, usando a personajes como sando y wicho» y «Lo importante es que sea automatizado,
… sí o sí todas las semanas». También: «es gratis hacer imágenes con google flow».

## El ciclo (corre solo cada lunes, 10:13, en el hilo «Equipo de marketing»)
| paso | quién | dónde | qué sale |
|---|---|---|---|
| 1 · Referentes | la rutina (nube) | `docs/marketing/referentes/<fecha>.md`, el banco de ideas de Ezra (`referentes/ideas/`, lo que él manda y analiza investigación) + lo que mande el hilo de investigación | qué modelo usar esta semana |
| 2a · Mini-brief | Planner (la sesión, con `PLATAFORMA_DE_MARCA.md`) | `reels/<id>/BRIEF.md` (`METODO_GRANDES_EQUIPOS.md` §4.2.1) | un brief por reel, con insight y fuente. **Sin insight, no hay reel** |
| 2b · Duplas | 2 llamadas en paralelo al agente `creativo`, cada una con un territorio distinto, sin verse | `DUPLA_A.md`, `DUPLA_B.md` | 4 ideas cada una, con guion corto y 3 títulos con su porqué |
| 2c · Crítico | agente `critico` (`.claude/agents/critico.md`; si no aparece, general-purpose que lo lea) | `CRITICO.md`, `MATADAS.md` | las 8 puertas: un «no» mata; 2 finalistas por brief |
| 2d · Extraño | agente `extrano` con solo el título y los 3 primeros segundos | `EXTRANO.md` | qué entiende alguien sin contexto y su lectura mala |
| 2e · Guion final | la sesión | `GUION.md` y `reel.json` | plano a plano, con el porqué de cada decisión |
| 3 · Encargos | la rutina | `estudio/encargos/<id>.md` (tipo video, `creditos_max: 10`) | máx. 2 tomas de video por reel; imágenes sin límite (gratis) |
| 4 · Flow | Claude in Chrome en la laptop de Ezra (`start_remote_control` + `scripts/estudio/FLOW_EN_CHROME.md`) | `estudio/hecho/<id>/v1.mp4` → rama `estudio` → main | las tomas |
| 5 · Montaje | la rutina: `node scripts/reels/montar.mjs reels/<id>/reel.json salida.mp4` (con `FUENTES_CSS`) | `reels/<id>/final.mp4` y copia en `/mnt/project-files/marketing/reels/` | el reel 9:16 con texto en pantalla, foto real y cierre |
| 6 · Revisión | `estilo-sndwch` + `verdad-y-ley` | — | se devuelve lo que no pasa |
| 7 · El sí | Ezra, con una tarjeta en el hilo | — | cuáles salen; se programan solo con su sí |

## Reglas fijas
- **Créditos:** video = créditos gratis del día (50). Veo 3.1 Lite, 10 por toma; nunca más de 50 en un día; **nunca
  se compran créditos ni se cambia el plan**. Las imágenes de Flow son gratis: se usan sin miedo.
- **La laptop:** el paso 4 necesita la laptop prendida y Chrome abierto con la cuenta de Flow. Si está dormida, la
  sesión arranca cuando Ezra escribe en el hilo; la rutina se lo avisa en una línea.
- Cada reel sale de **una verdad de `docs/hechos/CARTA.md`**; nada de plancha (se saltea en sartén); la foto final es
  la real de `img/` que corresponde al producto (PHILLY = `sig09_v.webp`, comprobado en `img/fuente/FUENTES.md`).
- Sin voces: texto en pantalla. Cifras y fechas interpoladas desde `docs/hechos/` y `APERTURA.md`.
- Nunca «dark kitchen». Nada se publica sin el sí de Ezra.

## Los modelos (de `referentes/2026-11-10.md`, de más a menos prometedor)
M1 La pregunta fija · M2 El invento con nombre · M3 Un solo plano del proceso · M4 La escena que todos conocen ·
M5 El estreno del día de cierre · M6 Primer plano del queso fundido · M7 Respuesta con filo entre los hermanos ·
M8 Presentación del personaje · M9 Reacción en 24 h (hoy no encaja). Primera tanda sugerida: M1, M4 y M3.
Límite: de Perú solo se vio qué pautan y desde cuándo (Instagram y el detalle de los anuncios no se leen sin
navegador); se completa con Claude in Chrome en la laptop.

## Frecuencia y formatos (hilo de investigación, `referentes/2026-11-10-frecuencia-y-formatos.md`)
- Feed: **6 por semana** = 4 reels + 2 carruseles con música; 0 fotos solas. Más **1 reel de prueba al día** (Reels
  de prueba, a no seguidores; el que gana se republica).
- Historias los días de servicio: 3 a 6 (11:00 «hoy hay» con foto real; 12:00 enlace `?src=historia`).
- Cada reel: comida desde el segundo 0, cierre con foto real, pensado para que **lo manden** (envíos por alcance,
  métrica número uno), precio o combo de la carta a la vista. **Sin etiqueta de IA voluntaria** (dueño, 2026-11-10: «no debe llevar nunca la etiqueta de IA. Eso arruina el contenido»).
- El cuello de botella es la revisión y el sí de Ezra: la rutina le entrega **la semana entera el lunes** para
  aprobarla de una vez.

### La etiqueta de IA: qué exige Instagram (revisado el 2026-11-10)
Desde el 31-ago-2026, Instagram baja el alcance a no seguidores de los perfiles que muestran **una persona generada
con IA** sin la etiqueta «AI-generated profile» ([WorkOS](https://workos.com/blog/instagram-ai-generated-profile-label)).
SANDO y WICHO son personajes dibujados, no personas: hoy no entran ahí. El riesgo está en las piezas con **manos o
media cara fotorrealistas generadas** (anuncio directo): si Instagram las detecta, puede marcar la cuenta y cortar
el alcance en Reels y Explorar. Por eso, en el contenido orgánico, las personas fotorrealistas generadas se usan poco
y nunca como protagonista. Si llega un aviso en «Estado de la cuenta», se le avisa a Ezra el mismo día.
