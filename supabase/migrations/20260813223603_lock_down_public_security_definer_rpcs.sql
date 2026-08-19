-- El advisor de seguridad de Supabase detectó que confirm_weekly_plan_credit (creada en
-- esta sesión) y release_promo_redemption (preexistente, ya documentada como hallazgo
-- MEDIO en la auditoría de 29 agentes) quedaron invocables directo vía PostgREST por
-- anon/authenticated (/rest/v1/rpc/<nombre>) sin pasar por la verificación de Culqi ni por
-- ninguna validación de dueño del lado de la edge function — a diferencia de TODAS las
-- demás RPC SECURITY DEFINER del proyecto (add_gifted_credit, redeem_promo_code,
-- finalize_order_customer_update, hash_pin, verify_pin, reserve_inventory,
-- check_rate_limit), que ya tienen su proacl reducido a solo postgres+service_role. Esto
-- iguala el ACL de estas dos al mismo patrón — la edge function sigue funcionando igual
-- (llama con la service_role key), pero ya no queda expuesta a que cualquiera con la anon
-- key llame la RPC directo saltándose toda la lógica de negocio.
revoke all on function public.confirm_weekly_plan_credit(uuid) from public, anon, authenticated;
revoke all on function public.release_promo_redemption(uuid, text, text) from public, anon, authenticated;
