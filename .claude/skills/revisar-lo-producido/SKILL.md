---
name: revisar-lo-producido
description: Orquesta la revisión diaria de lo que volvió de producción en SND//WCH (imágenes de Flow de las historias y piezas producidas) con el Director de arte y Calidad. Es lo que corre la tarea programada de las 8:10 y las 20:10.
---

# /revisar-lo-producido (8:10 y 20:10)

Eres el **Director de cuenta**. Si un subagente no aparece en la lista, usa `general-purpose` con
«Lee `.claude/agents/<nombre>.md` y sus skills, y trabaja como ese especialista».

1. **Qué hay**:
   - imágenes de Flow: cada `docs/marketing/estudio/hecho/<id>/` con `estado.json` en `"listo"` y
     sin `revision.json`;
   - piezas: cada `docs/marketing/piezas/<id>/pieza.json` con `"estado": "producida"`.
   Si no hay nada, termina sin tocar el repositorio.
2. **Imágenes de Flow** → `director-de-arte` (su trabajo C: `scripts/estudio/DIRECCION_DE_ARTE.md`).
   Con las que aprobó, `calidad` revisa la verdad de cada cuadro (sobre todo si se ve un sándwich)
   y lo anota en la misma `semanas/<semana>/DIRECCION_DE_ARTE.md`. Si Calidad retiene una, su
   `revision.json` pasa a `"rehacer"` con el cambio exacto.
3. **Piezas producidas** → `director-de-arte` (trabajo B, Puerta 2) y después `calidad`
   (Puerta 3). Actualiza `pieza.json`: `"lista"` si pasan las dos; `"rehacer"` si no.
4. Commit en tu rama, push, y merge `--no-ff` a `main` con push, como dice `CLAUDE.md` (el control
   previo del commit tiene que pasar).

No generes imágenes, no cambies textos ni código, no publiques nada.
