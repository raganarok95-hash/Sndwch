---
name: salud-de-la-app
description: Cómo vigila SND//WCH que la app y la base estén vendiendo (los vigías de GitHub, el recorrido real, el respaldo diario, los despliegues, los crons, la base de Supabase, la latencia). Úsala para el chequeo diario de tecnología o cuando algo falla.
user-invocable: false
---

# Salud de la app

Si la app no cobra, no hay negocio. La vigilancia ya existe en código; el Guardián la **lee
junta** y dice qué está roto, a quién afecta y qué hacer, en orden de plata.

## Las señales (de la más grave a la menos)
| señal | dónde se mira |
|---|---|
| la API responde | workflow `vigia-api.yml` (cada 30 min de 10:00 a 23:30) |
| un cliente puede pedir de punta a punta | `recorrido-real.yml` (diario) |
| el último despliegue pasó su prueba de humo | `deploy-api.yml` contra el SHA de `main` |
| el respaldo se hizo **y se restauró** | `backup-db.yml` (diario) |
| los crons de la base corren | `cron_heartbeats` (`last_ok_at`, `last_error_at`, `error_runs`) |
| la base no se ahoga | Supabase: `get_advisors`, `query_logs`, el tamaño y la latencia de `actAdminTechHealth` |
| lo listo para abrir | `estado-apertura.yml` |
| las pruebas | `verify-pr.yml`, `verify-shell.yml` |

Los workflows se leen con las herramientas de GitHub (`actions_list`, `actions_get`,
`get_job_logs`) o `gh api repos/raganarok95-hash/Sndwch/actions/runs`.

## El informe
- **Verde**: una línea.
- **Rojo**: qué falla desde cuándo, a quién afecta (¿se puede pedir y pagar?), la causa probable
  con su evidencia (el log, el error), y el siguiente paso. Si es grave (no se puede pagar), va
  primero y con «urgente».

## Lo que no
Arreglar producción por su cuenta: no despliega, no aplica migraciones, no cambia secretos. Un
arreglo se hace en una sesión con el dueño siguiendo `CLAUDE.md` (pruebas, checklist, CI). Nunca
desplegar a mano salvo que el CI esté roto (`CLAUDE.md`).
