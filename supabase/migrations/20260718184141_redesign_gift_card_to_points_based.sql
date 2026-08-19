-- Rediseño de tarjeta de regalo: antes cobraba dinero real vía Culqi (actPrepareCreditPurchase/
-- actConfirmCreditPurchase) para acreditarle saldo a otro cliente. La función se pensó
-- originalmente para canjearse con puntos, antes de que Culqi existiera en el proyecto —
-- Culqi no tiene forma de "cobrar con puntos", así que terminó implementada con dinero real
-- por pragmatismo. El dueño pidió corregir eso: ahora se regala saldo gastando PUNTOS propios,
-- sin ningún cobro real de por medio (mismo patrón atómico que gift_credit, que ya transfiere
-- saldo YA PROPIO entre clientes).

create or replace function public.redeem_points_for_gift_credit(p_from text, p_to text, p_points integer, p_credit_amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_from_points int;
begin
  update public.customers set points = points - p_points
    where phone = p_from and points - p_points >= 0
    returning points into v_from_points;
  if v_from_points is null then
    if exists (select 1 from public.customers where phone = p_from) then
      raise exception 'insufficient_points';
    else
      raise exception 'customer_not_found';
    end if;
  end if;
  update public.customers set credit_balance = coalesce(credit_balance, 0) + p_credit_amount
    where phone = p_to;
  if not found then
    raise exception 'customer_not_found';
  end if;
end;
$function$;

-- El cron que expiraba reservas de Culqi para tarjeta de regalo ya no tiene nada que
-- expirar (el nuevo flujo es atómico, sin reserva pendiente ni pago externo).
select cron.unschedule('sndwch-expire-pending-credit-purchases');

-- La tabla que reservaba esas compras contra Culqi queda huérfana con el nuevo flujo.
drop table if exists public.pending_credit_purchases;
