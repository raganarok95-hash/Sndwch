-- Auditoría de modelado de datos (2026-07-30): 4 funciones SECURITY DEFINER que mueven
-- dinero/puntos reales quedaron ejecutables por anon/authenticated via PostgREST desde
-- que se crearon (ninguna repitió el patrón REVOKE ya usado 4 veces antes en este mismo
-- repo para el mismo tipo de problema). Cualquiera con la anon key pública podía llamar
-- POST /rest/v1/rpc/admin_adjust_credit con p_delta positivo arbitrario y phone de otro
-- cliente para inflar su credit_balance, o redeem_points_for_gift_credit sin validar que
-- p_credit_amount corresponda a p_points, o redeem_promo_code sin validar vigencia/monto
-- mínimo del código. Estas 4 solo deben ejecutarse desde supabase/functions/api (service
-- role) tras pasar por las validaciones reales en orders.ts/customer.ts.
revoke execute on function admin_adjust_credit(text, numeric) from public, anon, authenticated;
revoke execute on function redeem_points_for_gift_credit(text, text, integer, numeric) from public, anon, authenticated;
revoke execute on function redeem_promo_code(uuid, text, text, numeric) from public, anon, authenticated;
revoke execute on function reverse_referral_bonus(text, text, integer) from public, anon, authenticated;
