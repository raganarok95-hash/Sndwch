# Aprendizajes · Guardián

- **2026-10-14 · La base se ahoga cada noche** (~19:00–2:00 de Lima): la limpieza de pg_net sobre
  `net._http_response` inflada se come el procesador. Diagnóstico y estado en `docs/ENTORNO.md`,
  «La base se ahoga cada noche». Es lo primero que se mira si la API tarda de noche.
- **Siempre · Desde la nube no se llega a supabase.co** (`docs/ENTORNO.md`): la base se lee por el
  MCP de Supabase o por los workflows de GitHub.
- **Siempre · El backend se despliega por CI** (`deploy-api.yml`); a mano solo si el CI está roto.
