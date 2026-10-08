# El Revisor (control de calidad + publicador) — es CÓDIGO, no una sesión

**Cuándo**: una vez al día (`.github/workflows/revisar-marketing.yml`, a las 11:15 de Lima… en
teoría). **GitHub atrasa sus horarios de 5 a 9 horas en este repo** (medido el 2026-10-08), así que
la hora de este paso ya NO es la hora de publicación.
**Qué**: `scripts/video-auto/revisar.mjs` lee los borradores pendientes del Productor **de hoy y de
mañana** (el Productor ya produce para mañana) y le aplica `decidir()` de
`scripts/video-auto/reglas-del-revisor.mjs` (probada en `tests-api/revisor-de-marketing.test.ts`).
Aprueba **una** pieza por día o las bloquea con motivo.

Aprobar = `revision='aprobada'`, `status='scheduled'` y **`publicar_desde`** = la franja de Lima de
su día (`horaDelVideo()` y `horaDePublicar()`): el cron `auto-publish-calendar` de Supabase, que sí
es puntual, la publica a esa hora. **La franja** (dueño, 2026-10-08): las 18:00, y las dos primeras
semanas desde `APERTURA`, un día a las 12:00 y otro a las 18:00, cruzado para que cada día de la
semana pruebe las dos. La franja queda en `datos.franja`. **Al terminar las dos semanas**, se suman
los pedidos de cada franja: son los `?src=` de los videos de cada una. Se queda la que traiga más, y
para cambiarla se edita `HORA_DEL_VIDEO`. Una de hoy aprobada tarde sale apenas se aprueba, nunca después de las 20:00.
**El stock se mira al publicar** (`agotadoAlPublicar()` en `api/actions/social.ts`): un día antes
no se sabe qué se agota.

## Por qué código y no una rutina de Claude (2026-10-07)
- Todas las reglas son mecánicas: el texto del post sale interpolado de la carta.
- Cuesta S/0 y no gasta créditos.
- Una rutina creada desde una sesión de Claude Code nace **sin el repo y sin conectores**
  (`create_trigger` no los pasa; ver `docs/ENTORNO.md`). No podría leer ni la base.

## Las reglas (una que falla = bloqueada, con motivo)
| regla | qué mira |
|---|---|
| espera | antes de `APERTURA` (2026-10-20; era el 13 hasta el 2026-10-08) o un día que el horario de la base dice cerrado (lunes) o en pausa: no se toca nada |
| carta | el Signature sigue en la carta y activo |
| stock | **al publicar**, no al revisar: ni el Signature ni su proteína agotados (lo mira el cron) |
| precio | el precio del video = el que cobra la app hoy (`get-catalog`) |
| texto | el post trae el precio vigente y su propio `?src=` |
| video | el MP4 está en `marketing-images/videos/<src>.mp4` |
| repetida | ese Signature no salió en los últimos 2 días |
| acumulada | sale solo la más reciente que pasa; las demás se bloquean |

Una pieza bloqueada **no se corrige a ojo**: el Productor hace otra al día siguiente. El cron
de publicación nunca toma nada `bloqueado` (`loQueSaleSolo()` en `api/actions/social.ts`).
