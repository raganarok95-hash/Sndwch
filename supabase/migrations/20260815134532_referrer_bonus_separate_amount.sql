-- Decisión del dueño 2026-08-15: quien refiere recibe un 15CM GRATIS (no 50 puntos).
-- Hasta ahora ambos lados recibían el mismo monto (p_referral_bonus), que era 50 puntos —
-- unos S/1.25 de valor, el 5% del ticket, contra el 10-25% que funciona en la categoría.
--
-- Se agrega p_referrer_bonus como parámetro NUEVO con default = p_referral_bonus para no
-- romper a ningún llamador existente. El referido sigue recibiendo su bono de siempre; el
-- que invita recibe el equivalente a un sándwich 15CM gratis (720 pts = R06).
create or replace function public.finalize_order_customer_update(
  p_phone text,
  p_points_delta integer,
  p_credit_delta numeric,
  p_total_orders_delta integer,
  p_last_address text,
  p_total_redeemed_delta integer,
  p_referrer_phone text default null::text,
  p_referral_bonus integer default 0,
  p_referrer_bonus integer default null::integer
)
returns customers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row customers;
  v_already_granted boolean;
  v_bonus_if_referral int;
  v_referrer_bonus int;
begin
  select referral_bonus_granted into v_already_granted from public.customers where phone = p_phone for update;
  if not found then
    raise exception 'customer_not_found';
  end if;

  -- Antes el gate era "total_orders previo = 0" (proxy de "primer pedido") — se
  -- reemplaza por un flag monotónico que nunca se revierte, para que una
  -- autocancelación (que sí resta total_orders) no vuelva a habilitar el bono.
  v_bonus_if_referral := case when p_referrer_phone is not null and not coalesce(v_already_granted, false) then p_referral_bonus else 0 end;
  -- Sin p_referrer_bonus explícito, se comporta igual que antes (mismo monto a ambos).
  v_referrer_bonus := coalesce(p_referrer_bonus, p_referral_bonus);

  update public.customers
  set points = points + p_points_delta + v_bonus_if_referral,
      credit_balance = coalesce(credit_balance, 0) + p_credit_delta,
      total_orders = total_orders + p_total_orders_delta,
      last_address = coalesce(p_last_address, last_address),
      total_redeemed = total_redeemed + p_total_redeemed_delta,
      referral_bonus_granted = referral_bonus_granted or (v_bonus_if_referral > 0)
  where phone = p_phone
    and points + p_points_delta + v_bonus_if_referral >= 0
    and coalesce(credit_balance, 0) + p_credit_delta >= 0
  returning * into v_row;

  if v_row is null then
    raise exception 'insufficient_balance';
  end if;

  if v_bonus_if_referral > 0 then
    update public.customers
    set points = points + v_referrer_bonus, total_referrals = total_referrals + 1
    where phone = p_referrer_phone;
  end if;

  return v_row;
end;
$function$;

revoke all on function public.finalize_order_customer_update(text, integer, numeric, integer, text, integer, text, integer, integer) from public, anon, authenticated;
grant execute on function public.finalize_order_customer_update(text, integer, numeric, integer, text, integer, text, integer, integer) to service_role;
