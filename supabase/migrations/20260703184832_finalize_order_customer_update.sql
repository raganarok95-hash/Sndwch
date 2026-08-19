-- Consolida en UNA transacción todo el ajuste de saldo del cliente que resulta de un
-- pedido pagado (puntos ganados, puntos de recompensa canjeados, crédito debitado,
-- contador de pedidos, última dirección, y opcionalmente el bono de referido al
-- referente) — antes esto eran 3-4 llamadas HTTP separadas (rpc + rpc + sbUpdate +
-- sbUpdate), cada una atómica por sí sola pero no la secuencia completa; si una fallaba
-- a la mitad (ej. un timeout de red), el pedido quedaba registrado con el saldo del
-- cliente solo parcialmente actualizado. Ahora es una sola llamada.
create or replace function public.finalize_order_customer_update(
  p_phone text,
  p_points_delta int,
  p_credit_delta numeric,
  p_total_orders_delta int,
  p_last_address text,
  p_total_redeemed_delta int,
  p_referrer_phone text default null,
  p_referral_bonus int default 0
)
returns customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row customers;
  v_bonus_if_referral int := case when p_referrer_phone is not null then p_referral_bonus else 0 end;
begin
  update public.customers
  set points = points + p_points_delta + v_bonus_if_referral,
      credit_balance = coalesce(credit_balance, 0) + p_credit_delta,
      total_orders = total_orders + p_total_orders_delta,
      last_address = coalesce(p_last_address, last_address),
      total_redeemed = total_redeemed + p_total_redeemed_delta
  where phone = p_phone
    and points + p_points_delta + v_bonus_if_referral >= 0
    and coalesce(credit_balance, 0) + p_credit_delta >= 0
  returning * into v_row;

  if v_row is null then
    if exists (select 1 from public.customers where phone = p_phone) then
      raise exception 'insufficient_balance';
    else
      raise exception 'customer_not_found';
    end if;
  end if;

  if p_referrer_phone is not null then
    update public.customers
    set points = points + p_referral_bonus, total_referrals = total_referrals + 1
    where phone = p_referrer_phone;
  end if;

  return v_row;
end;
$$;
