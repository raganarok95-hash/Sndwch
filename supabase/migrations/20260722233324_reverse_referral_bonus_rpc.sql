-- El bono de referido (+50/+50 pts) se otorgaba al pagar pero nunca se revertía al
-- cancelar (a diferencia de puntos/crédito/total_orders, que finalize_order_customer_update
-- ya revierte desde la sesión anterior) — permitía farmear el bono con un pedido mínimo
-- cancelado antes de que cocina empiece (hallazgo de auditoría financiera). Esta función
-- se llama SOLO cuando el pedido cancelado era el único pedido pagado del cliente
-- (total_orders=1, a punto de volver a 0) y referral_bonus_granted sigue en true — el
-- caso real del hueco de farmeo. Floor-clamped a 0 en vez de lanzar excepción: es una
-- limpieza secundaria, no debe bloquear la cancelación del pedido si el cliente ya gastó
-- esos puntos en otra parte.
CREATE OR REPLACE FUNCTION public.reverse_referral_bonus(p_referred_phone text, p_referrer_phone text, p_bonus integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  update public.customers
  set points = greatest(0, points - p_bonus),
      referral_bonus_granted = false
  where phone = p_referred_phone;

  update public.customers
  set points = greatest(0, points - p_bonus),
      total_referrals = greatest(0, total_referrals - 1)
  where phone = p_referrer_phone;
end;
$function$;
