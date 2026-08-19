-- 1) Bono de referido se otorgaba dos veces bajo carrera (doble clic / reintento de red en
-- el primer pedido de un cliente referido): la decisión "es su primer pedido" se tomaba
-- en la app ANTES de esta llamada atómica, así que dos solicitudes casi simultáneas podían
-- ambas verla como "primera". Ahora se relee total_orders con FOR UPDATE (bloquea la fila
-- hasta el commit) dentro de la misma función, y el bono solo se aplica si de verdad seguía
-- en 0 en ese instante — la segunda llamada concurrente ve total_orders ya incrementado y
-- no lo repite. Importante: ya NO se aborta el pedido completo si el bono no aplica (antes
-- una carrera podía tumbar el pedido entero por un problema que solo afecta al bono).
create or replace function public.finalize_order_customer_update(
  p_phone text,
  p_points_delta integer,
  p_credit_delta numeric,
  p_total_orders_delta integer,
  p_last_address text,
  p_total_redeemed_delta integer,
  p_referrer_phone text default null,
  p_referral_bonus integer default 0
)
returns customers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row customers;
  v_prior_total_orders int;
  v_bonus_if_referral int;
begin
  select total_orders into v_prior_total_orders from public.customers where phone = p_phone for update;
  if not found then
    raise exception 'customer_not_found';
  end if;

  v_bonus_if_referral := case when p_referrer_phone is not null and coalesce(v_prior_total_orders, 0) = 0 then p_referral_bonus else 0 end;

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
    raise exception 'insufficient_balance';
  end if;

  if v_bonus_if_referral > 0 then
    update public.customers
    set points = points + p_referral_bonus, total_referrals = total_referrals + 1
    where phone = p_referrer_phone;
  end if;

  return v_row;
end;
$function$;

-- 2) dashboard_aggregates.pendingPayment usaba "payment_method not in (...)", que en SQL
-- da NULL (excluido del WHERE) cuando payment_method IS NULL — así que casi todos los
-- pedidos sin método de pago asignado quedaban invisibles para el admin. Se corrige
-- tratando explícitamente el caso NULL como "sí cuenta".
create or replace function public.dashboard_aggregates(p_week_start timestamp with time zone, p_month_start timestamp with time zone)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  result json;
begin
  select json_build_object(
    'allTime', (
      select json_build_object('revenue', coalesce(sum(total), 0), 'count', count(*))
      from orders where payment_status = 'paid'
    ),
    'statusCounts', (
      select coalesce(json_object_agg(status, cnt), '{}'::json)
      from (
        select coalesce(status, 'RECIBIDO') as status, count(*) as cnt
        from orders group by 1
      ) s
    ),
    'pendingPayment', (
      select count(*) from orders
      where payment_status is distinct from 'paid'
        and status is distinct from 'CANCELADO'
        and (payment_method is null or payment_method not in ('cod', 'yape', 'plin'))
    ),
    'codPending', (
      select json_build_object('count', count(*), 'total', coalesce(sum(total), 0))
      from orders
      where payment_method in ('cod', 'yape', 'plin')
        and payment_status is distinct from 'paid'
        and status is distinct from 'CANCELADO'
    ),
    'avgEtaMinutes', (
      select round(avg(eta_minutes)) from orders where eta_minutes is not null
    ),
    'customersTotal', (select count(*) from customers),
    'newThisWeek', (select count(*) from customers where created_at >= p_week_start),
    'newThisMonth', (select count(*) from customers where created_at >= p_month_start),
    'returning', (select count(*) from customers where coalesce(total_orders, 0) > 1),
    'tierCounts', (
      select json_build_object(
        'VIP', count(*) filter (where coalesce(points, 0) >= 400),
        'FREQUENT', count(*) filter (where coalesce(points, 0) >= 200 and coalesce(points, 0) < 400),
        'REGULAR', count(*) filter (where coalesce(points, 0) >= 80 and coalesce(points, 0) < 200),
        'MEMBER', count(*) filter (where coalesce(points, 0) < 80)
      )
      from customers
    ),
    'pointsIssued', (
      select coalesce(sum(points), 0) from transactions where type = 'earn_confirmed'
    ),
    'pointsRedeemed', (
      select coalesce(sum(abs(points)), 0) from transactions where type = 'redeem'
    ),
    'ratingsAvg', (select round(avg(stars)::numeric, 1) from ratings),
    'ratingsCount', (select count(*) from ratings)
  ) into result;
  return result;
end;
$function$;

-- 3) Reserva/restitución de stock atómica (evita la carrera de leer-luego-escribir que
-- tenía actPlaceOrder/actAdminCancelOrder en la edge function, y además hace que un
-- producto agotado SÍ rechace el pedido en vez de solo pisar el stock a 0 silenciosamente).
create or replace function public.reserve_inventory(p_codes text[], p_qtys int[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  i int;
  v_stock int;
begin
  if p_codes is null or array_length(p_codes, 1) is null then
    return;
  end if;
  for i in 1..array_length(p_codes, 1) loop
    select stock_qty into v_stock from public.inventory where product_code = p_codes[i] for update;
    if v_stock is not null and v_stock < p_qtys[i] then
      raise exception 'out_of_stock: %', p_codes[i];
    end if;
  end loop;
  for i in 1..array_length(p_codes, 1) loop
    update public.inventory
    set stock_qty = stock_qty - p_qtys[i],
        in_stock = (stock_qty - p_qtys[i]) > 0
    where product_code = p_codes[i] and stock_qty is not null;
  end loop;
end;
$function$;

create or replace function public.restock_inventory(p_codes text[], p_qtys int[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare i int;
begin
  if p_codes is null or array_length(p_codes, 1) is null then
    return;
  end if;
  for i in 1..array_length(p_codes, 1) loop
    update public.inventory
    set stock_qty = stock_qty + p_qtys[i],
        in_stock = true
    where product_code = p_codes[i] and stock_qty is not null;
  end loop;
end;
$function$;

revoke execute on function public.reserve_inventory from public, anon, authenticated;
revoke execute on function public.restock_inventory from public, anon, authenticated;

-- 4) Salvaguardas a nivel de esquema, baratas y sin efecto sobre el comportamiento normal:
-- una calificación por pedido (la app ya lo valida, esto cierra la carrera de doble-tap),
-- y un chargeId de Culqi no puede quedar asociado a más de un pedido (antes de que las
-- llaves reales de Culqi entren en producción).
alter table public.ratings add constraint ratings_order_ref_unique unique (order_ref);
create unique index if not exists orders_payment_id_unique on public.orders (payment_id) where payment_id is not null;
