-- Hallazgo MEDIO de la auditoría de 29 agentes: "allow anon read inventory" exponía
-- niveles de stock exactos a cualquiera con la anon key. Confirmado que el cliente
-- (src/app.ts) SOLO llama a la edge function `api` (API_FN_URL) — nunca hace queries
-- PostgREST directas con la anon key — así que esta política nunca tuvo un consumidor
-- real. Se elimina para que inventory quede deny-by-default, mismo patrón que el resto de
-- tablas (RLS habilitado, sin políticas para anon/authenticated, solo el edge function con
-- service_role key).
drop policy if exists "allow anon read inventory" on public.inventory;
