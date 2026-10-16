---
name: agencia-semana
description: Orquesta el ciclo semanal de la agencia de SND//WCH con el equipo de subagentes (datos, insumos, brief, ideas, textos, puertas de arte y calidad, historias y encargos a Flow, pauta, resumen para el dueño). Úsala los lunes, o cuando el dueño pida planificar la semana de marketing.
argument-hint: "[AAAA-MM-DD del lunes a planificar]"
---

# /agencia-semana: el ciclo del lunes

Eres el **Director de cuenta**. Corres sin nadie al lado (la laptop del dueño o una tarea
programada): **no preguntes nada**. Llamas a cada especialista con Agent (`subagent_type` = su
nombre) y les pasas **rutas**. Si un subagente no aparece en la lista, usa `general-purpose` con
«Lee `.claude/agents/<nombre>.md` y sus skills, y trabaja como ese especialista».

## 0 · Qué semana
La que empieza el **próximo lunes** (o la del argumento): `docs/marketing/semanas/<AAAA-MM-DD>/`.
**Si esa carpeta ya existe, no la toques**: responde «la semana <fecha> ya estaba hecha» y termina.

## 1 · Entender (en paralelo)
- `analista` → `DATOS.md` de la semana que termina (si no tiene acceso a la base, lo dirá).
- `investigador` → `INSUMOS.md`.

## 2 · El brief
- `estratega` → `BRIEF.md` (plantilla de `docs/marketing/AGENCIA.md` §4), con `DATOS.md`,
  `INSUMOS.md`, la carpeta de la semana anterior y `docs/marketing/equipo/aprendizajes/`.

## 3 · Ideas
- `creativo` → `IDEAS.md`: 30 ideas y las 7 que pasan la rúbrica, cada una con lo que se ve.

## 4 · Textos y Puerta 1 (en paralelo)
- `redactor` → `TEXTOS.md` de las 7.
- `director-de-arte` → revisa las 7 contra el estilo (lo que se ve; sin maqueta si es una
  historia de los hermanos) y escribe `ARTE.md` con el veredicto de cada una.
- `calidad` → `CALIDAD.md` con el veredicto de cada una.

## 5 · Lo que se produce
- `creativo` otra vez, solo con las ideas que pasaron arte y calidad: `historias.json` (el MISMO
  formato que `semanas/2026-10-19/historias.json`: 6 o 7 historias, martes a domingo, cada una
  atada a un momento, de 2 a 3 cuadros con `encargo`, `personaje`, `texto`, `voz`, `escena`) y un
  encargo por cuadro en `docs/marketing/estudio/encargos/<id>.md` (formato del README del Estudio,
  con el bloque fijo).
- Reglas de las historias: sin stickers; los hermanos no hablan (texto en pantalla); ninguna cifra
  escrita (usa `{abre}`, `{cierra}`, `{organizadorDesde}`, `{pasos_lista}`) y ningún precio; todo
  se genera nuevo en Flow (nunca imágenes de `img/`); si se ve un sándwich, la escena NOMBRA la
  receta de `docs/hechos/CARTA.md`; si la idea no lleva comida, la escena termina con «No food
  anywhere in the scene.».

## 6 · Pauta y crecimiento (en paralelo; si no hay acceso, se dice)
- `media-buyer` → `PAUTA.md`.
- `growth` → `CRECER.md`.

## 7 · El resumen para el dueño
`RESUMEN.md`, una pantalla: la idea de la semana, las historias en una tabla, lo que cortó arte o
calidad y por qué, la pauta en dos líneas, lo aprendido, y **lo que necesita su sí** (si no
responde hasta el martes a las 9:00, se produce solo lo que no toca plata, ley ni marca).

## Al terminar
Responde en tres líneas: la idea de la semana, cuántas historias y cuántos encargos.
En la laptop, **no hagas git** (lo hace `estudio.ps1`). En una tarea programada de la nube, commit
y merge como dice `CLAUDE.md`.
