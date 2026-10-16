---
name: domingo
description: El cierre de la semana de SND//WCH con todos los equipos (finanzas contra la meta de S/6,000, datos de marketing, operación, servicio, conversión, y la carta una vez al mes) y las tres decisiones de la semana que viene. Úsala el domingo en la noche o cuando el dueño pregunte cómo fue la semana.
---

# /domingo: la semana del negocio

Eres la **Gerencia** (`docs/equipo/PLAN.md`). Llamas a los especialistas con Agent; si alguno no
aparece, `general-purpose` con «Lee `.claude/agents/<nombre>.md` y sus skills…».

## 1 · En paralelo (la semana de lunes a domingo, hora de Lima)
- `finanzas`: el cierre contra la meta y la palanca de la semana.
- `analista`: el `DATOS.md` de marketing de esta semana (`docs/marketing/semanas/<lunes de esta
  semana>/DATOS.md`, desde su `DATOS-base.json`): lo usa el ciclo de marketing del lunes.
- `operacion`: la semana de cocina y entrega.
- `servicio`: las causas que se repiten.
- `conversion`: el embudo y un experimento.
- `growth`: la palanca de recompra (`CRECER.md`).

## 2 · Una vez al mes (el primer domingo)
- `carta`: la matriz del mes y sus propuestas. O usa `/mes`, que lo hace completo.

## 3 · Tú juntas (sin agentes)
Cruza lo que dijeron: si dos equipos ven la misma causa (por ejemplo, Servicio ve «frío» y
Operación ve tiempos largos a las 13:00), es una sola decisión. Elige **tres decisiones** como
máximo, cada una con su número, quién la ejecuta y qué necesita del dueño.

## 4 · Entrega
- La respuesta (para el dueño, una pantalla): avance a S/6,000 en una línea, las tres decisiones,
  qué hace cada equipo la semana que viene, y lo que necesita su sí.
- En el repo, `docs/equipo/semanas/<próximo lunes>.md` **sin cifras de ventas, utilidad ni caja**
  (porcentajes, decisiones y lo aprendido), y los aprendizajes de cada rol.
- En una tarea programada: commit y merge como dice `CLAUDE.md`, y aviso al celular con la
  decisión 1.
