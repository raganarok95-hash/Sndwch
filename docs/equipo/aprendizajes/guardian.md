# Aprendizajes · Guardián

- **2026-10-14 · La base se ahoga cada noche** (~19:00–2:00 de Lima): la limpieza de pg_net sobre
  `net._http_response` inflada se come el procesador. Diagnóstico y estado en `docs/ENTORNO.md`,
  «La base se ahoga cada noche». Es lo primero que se mira si la API tarda de noche.
- **Siempre · Desde la nube no se llega a supabase.co** (`docs/ENTORNO.md`): la base se lee por el
  MCP de Supabase o por los workflows de GitHub.
- **Siempre · El backend se despliega por CI** (`deploy-api.yml`); a mano solo si el CI está roto.
- **2026-10-16 · El ahogo de la noche, resuelto.** La noche del 15 al 16: 0 crons fallidos (antes
  73–81 por hora), la API sin 5xx (0.7–1.6 s de promedio; antes 13 s y picos de 109 s),
  `net._http_response` de 178 MB a 2.2 MB. Falta ver que la limpieza diaria (cron 53, 07:45 UTC)
  corra.
- **2026-10-16 · GitHub se salta los horarios en punto.** El vigía corrió 3 de 28 veces; el
  respaldo de las 08:10 corrió a las 13:19. Se movió el vigía a los minutos 13 y 43. Si sigue
  sin correr, hace falta un vigía fuera de GitHub (necesita una cuenta del dueño).

