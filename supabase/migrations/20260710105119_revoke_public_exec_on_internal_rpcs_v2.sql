-- claim_monthly_challenge y verify_cron_secret son SECURITY DEFINER pensadas para ser
-- llamadas SOLO desde la función edge `api` (que usa la SERVICE_ROLE key) — nunca
-- directo desde el navegador con la anon key. Una migración anterior
-- (revoke_public_exec_on_internal_rpcs) ya había revocado esto, pero un CREATE OR REPLACE
-- posterior de estas dos funciones reseteó los grants al default de Postgres (EXECUTE
-- público para roles con USAGE en el schema), volviendo a exponerlas: cualquiera con la
-- anon key (pública, embebida en el cliente) podía llamar claim_monthly_challenge
-- directo vía PostgREST para acuñar puntos de lealtad arbitrarios en cualquier cuenta, o
-- usar verify_cron_secret como oráculo para adivinar por fuerza bruta el secreto de cron.
REVOKE EXECUTE ON FUNCTION public.claim_monthly_challenge(text, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_cron_secret(text) FROM anon, authenticated;
