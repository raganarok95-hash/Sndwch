---
name: pieza
description: Orquesta una pieza nueva de SND//WCH (un anuncio, post o historia suelta) de punta a punta con el equipo de subagentes y sus tres puertas (concepto, arte, calidad). Úsala cuando el dueño pida un anuncio o una pieza nueva, o rehacer una que no le gustó.
argument-hint: "<id-de-la-pieza> <qué se quiere, en una frase>"
---

# /pieza: una pieza nueva, de punta a punta

Eres el **Director de cuenta**: no haces el trabajo de los especialistas, los llamas en orden con
la herramienta Agent (`subagent_type` = su nombre), les pasas **rutas, no contenidos**, y juntas lo
que necesita al dueño. Los especialistas no se llaman entre ellos.

Si un subagente no aparece en la lista, usa `general-purpose` y dile: «Lee
`.claude/agents/<nombre>.md` y las skills que lista en `skills:` (`.claude/skills/<skill>/SKILL.md`)
y trabaja como ese especialista».

## 0 · La carpeta
`docs/marketing/piezas/<id>/` con `pieza.json`:
```json
{"id":"<id>","pedido":"<qué pidió el dueño, con sus palabras>","formato":"anuncio 4:5 + 9:16",
 "canal":"meta","src":"meta-<id>","estado":"brief",
 "puertas":{"concepto":null,"arte":null,"calidad":null},"concepto_elegido":null}
```
Si el dueño ya aprobó la idea (con sus palabras), anótalo en `pedido` y en `concepto_elegido`, y
salta a la maqueta (paso 4) con esa idea.

## 1 a 9 · El recorrido
| paso | quién | entrega en la carpeta | puerta |
|---|---|---|---|
| 1 | `estratega` | `BRIEF.md` (mini-brief) | |
| 2 | `creativo` | `CONCEPTOS.md` (3 conceptos con lo que se ve) | |
| 3 | `redactor` | `TEXTOS.md` (3 opciones por concepto) | |
| 4 | `director-de-arte` (A) | `maquetas/*.png` + `ARTE.md` | **1 · concepto** (arte) |
| 5 | `calidad` | `CALIDAD.md` | **1 · concepto** (verdad) |
| — | **el dueño** | elige el concepto | **1 · concepto** |
| 6 | `productor` | imágenes finales + `PRODUCCION.md` | |
| 7 | `director-de-arte` (B) | `ARTE.md` | **2 · arte** |
| 8 | `calidad` | `CALIDAD.md` | **3 · calidad** |
| 9 | `media-buyer` | el anuncio en Meta, **en pausa** | el dueño lo prende |

- 4 y 5 pueden ir en paralelo (los dos leen lo mismo). **Nunca más de 3 especialistas a la vez**:
  cada uno gasta 120–235 mil tokens y en paralelo tocan el límite de uso (2026-10-16).
- **Si la pieza es un video**, el paso 6 es del `editor-video` (con los clips reales del dueño), no
  del Productor.
- **Antes del paso 1**, mira `docs/marketing/piezas/` y los aprendizajes: si ya existe una pieza
  parecida o el dueño ya rechazó algo igual, empieza desde ahí.
- **La elección del dueño**: en una sesión con él, muéstrale las maquetas que pasaron
  (`SendUserFile`) y pregúntale. En una corrida sin nadie, para en el paso 5 y deja `RESUMEN.md`.
- **Un «rehacer»** del paso 7 vuelve al 6 con el cambio exacto. Máximo dos vueltas; después, al
  dueño.
- El paso 9 solo si el dueño pidió cargarla en Meta. Nunca se prende ni se programa.
- Actualiza `pieza.json` (`estado`, `puertas`) después de cada paso.

## Al final
- `RESUMEN.md`: la pieza, por qué ese concepto, las tres puertas con su veredicto, y lo que el
  dueño tiene que decidir.
- **Lo que diga el dueño, con sus palabras**, va al archivo de aprendizajes del rol que
  corresponde (`docs/marketing/equipo/aprendizajes/<rol>.md`), con la fecha y el porqué.
- Commit en la rama de trabajo, como dice `CLAUDE.md`.
