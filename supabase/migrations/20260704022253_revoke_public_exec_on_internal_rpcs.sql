-- Estas funciones son SECURITY DEFINER (corren con privilegios elevados, saltándose RLS)
-- y estaban otorgadas a anon/authenticated por el comportamiento por defecto de Postgres al
-- crearlas, igual que hash_pin/verify_pin antes de ser revocadas explícitamente. Solo la
-- edge function "api" (que usa la service_role key) debe poder invocarlas — nunca un
-- cliente con la clave pública, que puede llamarlas directo vía /rest/v1/rpc/<fn> saltándose
-- toda la lógica de auth/validación de la edge function.
revoke execute on function public.adjust_credit_balance from public, anon, authenticated;
revoke execute on function public.gift_credit from public, anon, authenticated;
revoke execute on function public.increment_customer_points from public, anon, authenticated;
revoke execute on function public.claim_monthly_challenge from public, anon, authenticated;
revoke execute on function public.finalize_order_customer_update from public, anon, authenticated;
revoke execute on function public.register_login_failure from public, anon, authenticated;
revoke execute on function public.reset_login_attempts from public, anon, authenticated;
revoke execute on function public.login_lockout_remaining_minutes from public, anon, authenticated;
revoke execute on function public.dashboard_aggregates from public, anon, authenticated;
