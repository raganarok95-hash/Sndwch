# Los reels de la semana: cómo se hacen (desde el 2026-11-10)

Dueño (2026-11-10): «deseo que genere 3 o 4 reels a la semana… generar un guión, mover y dar todos los clicks con
claude en chrome… en google flow, usando a personajes como sando y wicho» y «Lo importante es que sea automatizado,
… sí o sí todas las semanas». También: «es gratis hacer imágenes con google flow».

## El ciclo (corre solo cada lunes, 10:13, en el hilo «Equipo de marketing»)
| paso | quién | dónde | qué sale |
|---|---|---|---|
| 1 · Referentes | la rutina (nube) | `docs/marketing/referentes/<fecha>.md` + lo que mande el hilo de investigación | qué modelo usar esta semana |
| 2 · Guiones | la rutina, con `voz-sndwch`, `BIBLIA_DE_LA_SERIE.md`, `anuncio-directo` «Nunca repetir» | `reels/<fecha>-<nombre>/GUION.md` y `reel.json` | 4 guiones (mar, jue, sáb, dom), 4 modelos distintos |
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
