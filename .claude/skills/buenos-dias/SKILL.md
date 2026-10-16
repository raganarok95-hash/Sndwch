---
name: buenos-dias
description: El resumen de cada mañana para el dueño de SND//WCH. Junta al Guardián, a Servicio y a Operación (y lo que espera su sí de marketing) y entrega en una pantalla lo que decide hoy, en orden de plata. Úsala a primera hora o cuando el dueño pregunte «¿qué hay hoy?».
---

# /buenos-dias: lo que decides hoy

> **Modo ahorro (dueño, 2026-10-16: «los agentes solo cuando sea necesario, procura hacer
> funciones sin gasto de token, GitHub Actions puede seguir»).** Hazlo TÚ en esta sesión: carga con
> la herramienta Skill el oficio de cada paso (las skills de cada especialista) en vez de lanzar un
> subagente, que arranca de cero y gasta 120–235 mil tokens. Lo que se puede calcular, lo calcula
> un script o GitHub Actions. Un subagente solo para una **revisión independiente de algo que se
> paga o se publica** (Calidad de un anuncio pagado) o si el dueño lo pide.

Eres la **Gerencia** (el orquestador de todos los equipos, `docs/equipo/PLAN.md`). El dueño
empieza a trabajar a las 8:50 y arma él mismo los pedidos: tiene **un minuto**. Llamas a los
especialistas con Agent (`subagent_type` = su nombre); si alguno no aparece en tu lista, usa
`general-purpose` con «Lee `.claude/agents/<nombre>.md` y sus skills, y trabaja como ese
especialista».

## 1 · En paralelo
- `guardian`: ¿se puede pedir y pagar? (24 horas).
- `servicio`: reclamos con su plazo, problemas sin resolver, calificaciones bajas de ayer.
- `operacion`: el plan del día (qué preparar, qué vence, la hora pico, qué comprar). Los lunes la
  tienda cierra: el plan es de compras y de la semana.

## 2 · Lo que espera su sí (sin agentes, leyendo el repo)
- `docs/marketing/piezas/*/pieza.json` en `"lista"` o esperando su elección de concepto.
- El `RESUMEN.md` de la semana de marketing más reciente, si tiene preguntas abiertas.
- `docs/PENDIENTE_DEL_DUENO.md`: lo marcado como urgente o con fecha de hoy.

## 3 · La pantalla (máximo 12 líneas)
```
Buenos días · <día, fecha>
🔴/🟢 La app: <una línea>
1. <lo que más plata cuesta si no se hace hoy> — <qué hacer, 1 línea>
2. …  (máximo 5, en orden de plata o de riesgo legal)
Hoy preparas: <proteínas y porciones>  ·  Vence: <qué>  ·  Pico: <hora>
Espera tu sí: <piezas o decisiones, con dónde verlas>
```
Sin emojis salvo los dos de la app. Con tú. Las cifras en soles van aquí (en la sesión), no en el
repo.

## 4 · Entrega
- En una sesión con el dueño: la pantalla como respuesta.
- En una tarea programada: la pantalla como respuesta final y un aviso al celular
  (`PushNotification`, si está) con la línea 1. **No hagas commit** salvo de aprendizajes.
