# El Revisor (control de calidad + publicador) — es CÓDIGO, no una sesión

**Cuándo**: cada día a las **11:15 de Lima** (`.github/workflows/revisar-marketing.yml`).
**Qué**: `scripts/video-auto/revisar.mjs` lee los borradores pendientes del Productor y le aplica
`decidir()` de `scripts/video-auto/reglas-del-revisor.mjs` (probada en
`tests-api/revisor-de-marketing.test.ts`). Aprueba **una** pieza o las bloquea con motivo.

Aprobar = `revision='aprobada'`, `status='scheduled'`, fecha de hoy: el cron
`auto-publish-calendar` la publica en ≤15 min. **La hora de este paso es la hora de publicación.**

## Por qué código y no una rutina de Claude (2026-10-07)
- Todas las reglas son mecánicas: el texto del post sale interpolado de la carta.
- Cuesta S/0 y no gasta créditos.
- Una rutina creada desde una sesión de Claude Code nace **sin el repo y sin conectores**
  (`create_trigger` no los pasa; ver `docs/ENTORNO.md`). No podría leer ni la base.

## Las reglas (una que falla = bloqueada, con motivo)
| regla | qué mira |
|---|---|
| espera | antes de `APERTURA` (2026-10-13) o un día que el horario de la base dice cerrado (lunes) o en pausa: no se toca nada |
| carta | el Signature sigue en la carta y activo |
| stock | ni el Signature ni su proteína están agotados hoy |
| precio | el precio del video = el que cobra la app hoy (`get-catalog`) |
| texto | el post trae el precio vigente y su propio `?src=` |
| video | el MP4 está en `marketing-images/videos/<src>.mp4` |
| repetida | ese Signature no salió en los últimos 2 días |
| acumulada | sale solo la más reciente que pasa; las demás se bloquean |

Una pieza bloqueada **no se corrige a ojo**: el Productor hace otra al día siguiente. El cron
de publicación nunca toma nada `bloqueado` (`loQueSaleSolo()` en `api/actions/social.ts`).
