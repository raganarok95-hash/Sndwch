-- CREAR UN PEDIDO ES UNA SOLA OPERACIÓN (2026-09-24, paso 4 de docs/REVISION_DE_LA_BASE.md).
--
-- Hasta hoy `finalizeAndInsertOrder` (api/actions/orders.ts) hacía hasta cinco escrituras
-- sueltas, cada una en su propia petición a PostgREST:
--   1. finalize_order_customer_update — descuenta puntos/crédito, suma el pedido, bono de referido;
--   2. el insert del pedido;
--   3-5. el historial: transactions (puntos ganados, canje, bono de referido) y credit_ledger.
-- Si (2) fallaba, el cliente quedaba con los puntos o el crédito DESCONTADOS y sin pedido: el
-- código devolvía el stock y liberaba el código promocional, pero el saldo no tenía vuelta.
-- Y (3-5) decidía el bono de referido con una lectura hecha ANTES del lock de (1): con dos
-- pedidos a la vez, la base daba el bono una vez y el historial lo anotaba dos.
--
-- Ahora todo pasa acá adentro, en una transacción: o queda el pedido con su saldo y su
-- historial, o no queda nada. El bono se anota solo si ESTA llamada lo otorgó (comparando la
-- fila antes y después, bajo el mismo lock).
--
-- p_pedido: la fila del pedido como jsonb, con los nombres de las columnas de `orders`.
--           `jsonb_populate_record` convierte cada campo al tipo de su columna.
-- p_cuenta: null para un invitado o un pedido sin pagar. Si viene, el pedido está pagado por
--           un cliente con cuenta: phone, points_delta, credit_delta, redeemed_delta,
--           last_address, referrer_phone, referral_bonus, referrer_bonus, base_points,
--           descripcion (del movimiento de puntos), reward_label, reward_pts, nombre.
-- p_rangos: los rangos de lealtad [{min, name}] de env.ts, para guardar en el pedido el rango
--           del cliente YA contado este pedido. Se pasan en vez de copiarse acá: un solo sitio.
create or replace function public.crear_pedido(p_pedido jsonb, p_cuenta jsonb default null, p_rangos jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_antes customers;
  v_cli customers;
  v_bono boolean := false;
  v_rango text;
  v_pedido orders;
  v_ref text := p_pedido->>'ref';
  v_phone text := p_cuenta->>'phone';
  v_credito numeric := coalesce((p_cuenta->>'credit_delta')::numeric, 0);
begin
  if p_cuenta is not null then
    select * into v_antes from public.customers where phone = v_phone for update;
    if not found then
      raise exception 'customer_not_found';
    end if;
    v_cli := public.finalize_order_customer_update(
      v_phone,
      (p_cuenta->>'points_delta')::int,
      v_credito,
      1,
      p_cuenta->>'last_address',
      coalesce((p_cuenta->>'redeemed_delta')::int, 0),
      nullif(p_cuenta->>'referrer_phone', ''),
      coalesce((p_cuenta->>'referral_bonus')::int, 0),
      (p_cuenta->>'referrer_bonus')::int
    );
    v_bono := coalesce(v_cli.referral_bonus_granted, false) and not coalesce(v_antes.referral_bonus_granted, false);
    select r->>'name' into v_rango
      from jsonb_array_elements(p_rangos) r
     where (r->>'min')::int <= v_cli.total_orders
     order by (r->>'min')::int desc
     limit 1;
  end if;

  insert into public.orders (
    promised_from, promised_to, ref, customer_phone, contact_phone, customer_name, customer_email,
    customer_address, lat, lon, group_code, recurring_id, summary, notes, total, delivery_fee,
    delivery_km, delivery_zone, status, payment_status, payment_id, payment_method, items,
    delivery_time, redeemed_reward, redeemed_reward_pts, customer_rank
  )
  select
    x.promised_from, x.promised_to, x.ref, x.customer_phone, x.contact_phone, x.customer_name, x.customer_email,
    x.customer_address, x.lat, x.lon, x.group_code, x.recurring_id, x.summary, x.notes, x.total, x.delivery_fee,
    x.delivery_km, x.delivery_zone, 'RECIBIDO', x.payment_status, x.payment_id, x.payment_method, x.items,
    x.delivery_time, x.redeemed_reward, x.redeemed_reward_pts, v_rango
  from jsonb_populate_record(null::public.orders, p_pedido) x
  returning * into v_pedido;

  if p_cuenta is not null then
    insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
    values (v_phone, 'earn_confirmed', (p_cuenta->>'base_points')::int, p_cuenta->>'descripcion', v_ref, true);

    if v_credito <> 0 then
      insert into public.credit_ledger (customer_phone, delta, reason)
      values (v_phone, v_credito, 'Pedido pagado con crédito (' || v_ref || ')');
    end if;

    if p_cuenta->>'reward_label' is not null then
      insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
      values (v_phone, 'redeem', -(p_cuenta->>'reward_pts')::int,
              (p_cuenta->>'reward_label') || ' canjeado en pedido ' || v_ref, v_ref, true);
    end if;

    if v_bono then
      insert into public.transactions (customer_phone, type, points, description, confirmed)
      values (v_phone, 'earn_confirmed', (p_cuenta->>'referral_bonus')::int, 'Bono por referido', true);
      insert into public.transactions (customer_phone, type, points, description, confirmed)
      values (p_cuenta->>'referrer_phone', 'earn_confirmed',
              coalesce((p_cuenta->>'referrer_bonus')::int, (p_cuenta->>'referral_bonus')::int),
              'Sándwich gratis por invitar a ' || coalesce(p_cuenta->>'nombre', ''), true);
    end if;
  end if;

  return jsonb_build_object(
    'order', to_jsonb(v_pedido),
    'customer', case when v_cli is null then null else to_jsonb(v_cli) end,
    'bono_referido', v_bono,
    'pedidos_antes', case when v_antes is null then null else v_antes.total_orders end
  );
end;
$function$;

revoke all on function public.crear_pedido(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido(jsonb, jsonb, jsonb) to service_role;
