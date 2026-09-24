-- CONFIRMAR UN PAGO YAPE/PLIN ES UNA SOLA OPERACIÓN (2026-09-24), y la cuenta se aplica en UN sitio.
--
-- `confirmManualPayment` (api/actions/orders.ts) tenía los mismos dos defectos que el paso 4
-- corrigió en la creación de pedidos:
--   · el pedido se marcaba pagado en una petición y los puntos se daban en otra. Si la segunda
--     fallaba, el pedido quedaba pagado SIN puntos para siempre: volver a confirmar ya no hacía
--     nada, porque el pedido figuraba pagado;
--   · el bono de referido se decidía con una lectura anterior al lock, y dos confirmaciones
--     simultáneas lo podían anotar dos veces en el historial.
--
-- Y apareció un tercero, que también tenía crear_pedido: el historial exige que el cliente exista
-- (clave foránea), y el bono se anotaba a nombre de quien invitó sin comprobar que su cuenta
-- siguiera existiendo. Si la había borrado, el primer pedido pagado del invitado fallaba entero
-- —con tarjeta, DESPUÉS de cobrar—. Ahora, sin quien invite, no hay bono.
--
-- La parte común —mover el saldo bajo lock, decidir el bono, anotar el historial— vive en UNA
-- función interna que usan las dos. Una sola copia de las reglas de la cuenta.

create or replace function public.aplicar_pedido_a_la_cuenta(p_cuenta jsonb, p_ref text, p_rangos jsonb default '[]'::jsonb)
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
  v_phone text := p_cuenta->>'phone';
  v_credito numeric := coalesce((p_cuenta->>'credit_delta')::numeric, 0);
  v_invita text := nullif(p_cuenta->>'referrer_phone', '');
begin
  select * into v_antes from public.customers where phone = v_phone for update;
  if not found then
    raise exception 'customer_not_found';
  end if;
  -- Quien invitó puede haber borrado su cuenta: sin ella no hay a quién darle el bono, y
  -- anotarlo rompería la clave foránea del historial y con ella el pedido entero.
  if v_invita is not null and not exists (select 1 from public.customers where phone = v_invita) then
    v_invita := null;
  end if;
  v_cli := public.finalize_order_customer_update(
    v_phone,
    coalesce((p_cuenta->>'points_delta')::int, 0),
    v_credito,
    1,
    p_cuenta->>'last_address',
    coalesce((p_cuenta->>'redeemed_delta')::int, 0),
    v_invita,
    case when v_invita is null then 0 else coalesce((p_cuenta->>'referral_bonus')::int, 0) end,
    case when v_invita is null then 0 else (p_cuenta->>'referrer_bonus')::int end
  );
  v_bono := coalesce(v_cli.referral_bonus_granted, false) and not coalesce(v_antes.referral_bonus_granted, false);
  select r->>'name' into v_rango
    from jsonb_array_elements(p_rangos) r
   where (r->>'min')::int <= v_cli.total_orders
   order by (r->>'min')::int desc
   limit 1;

  insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
  values (v_phone, 'earn_confirmed', coalesce((p_cuenta->>'base_points')::int, 0), p_cuenta->>'descripcion', p_ref, true);

  if v_credito <> 0 then
    insert into public.credit_ledger (customer_phone, delta, reason)
    values (v_phone, v_credito, 'Pedido pagado con crédito (' || p_ref || ')');
  end if;

  if p_cuenta->>'reward_label' is not null then
    insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
    values (v_phone, 'redeem', -(p_cuenta->>'reward_pts')::int,
            (p_cuenta->>'reward_label') || ' canjeado en pedido ' || p_ref, p_ref, true);
  end if;

  if v_bono then
    insert into public.transactions (customer_phone, type, points, description, confirmed)
    values (v_phone, 'earn_confirmed', (p_cuenta->>'referral_bonus')::int, 'Bono por referido', true);
    insert into public.transactions (customer_phone, type, points, description, confirmed)
    values (v_invita, 'earn_confirmed',
            coalesce((p_cuenta->>'referrer_bonus')::int, (p_cuenta->>'referral_bonus')::int),
            'Sándwich gratis por invitar a ' || coalesce(p_cuenta->>'nombre', ''), true);
  end if;

  return jsonb_build_object('customer', to_jsonb(v_cli), 'bono_referido', v_bono,
                            'pedidos_antes', v_antes.total_orders, 'rango', v_rango);
end;
$function$;

revoke all on function public.aplicar_pedido_a_la_cuenta(jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function public.aplicar_pedido_a_la_cuenta(jsonb, text, jsonb) to service_role;

-- crear_pedido, igual que antes pero con la cuenta aplicada por la función común.
create or replace function public.crear_pedido(p_pedido jsonb, p_cuenta jsonb default null, p_rangos jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_cuenta jsonb;
  v_pedido orders;
begin
  if p_cuenta is not null then
    v_cuenta := public.aplicar_pedido_a_la_cuenta(p_cuenta, p_pedido->>'ref', p_rangos);
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
    x.delivery_time, x.redeemed_reward, x.redeemed_reward_pts, v_cuenta->>'rango'
  from jsonb_populate_record(null::public.orders, p_pedido) x
  returning * into v_pedido;

  return jsonb_build_object(
    'order', to_jsonb(v_pedido),
    'customer', v_cuenta->'customer',
    'bono_referido', coalesce((v_cuenta->>'bono_referido')::boolean, false),
    'pedidos_antes', (v_cuenta->>'pedidos_antes')::int
  );
end;
$function$;

revoke all on function public.crear_pedido(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido(jsonb, jsonb, jsonb) to service_role;

-- Confirmar el pago manual: marcar pagado + aplicar la cuenta, o nada. Devuelve
-- {"ya_estaba": true} si el pedido ya estaba pagado o cancelado (doble toque, reintento de red):
-- entonces no se toca nada.
create or replace function public.confirmar_pago_manual(p_order_id text, p_cuenta jsonb default null, p_rangos jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_pedido orders;
  v_cuenta jsonb;
begin
  update public.orders set payment_status = 'paid'
   where id = p_order_id and payment_status is distinct from 'paid' and status is distinct from 'CANCELADO'
  returning * into v_pedido;
  if v_pedido is null then
    return jsonb_build_object('ya_estaba', true);
  end if;
  if p_cuenta is not null and exists (select 1 from public.customers where phone = p_cuenta->>'phone') then
    v_cuenta := public.aplicar_pedido_a_la_cuenta(p_cuenta, v_pedido.ref, p_rangos);
  end if;
  return jsonb_build_object(
    'ya_estaba', false,
    'order', to_jsonb(v_pedido),
    'customer', v_cuenta->'customer',
    'bono_referido', coalesce((v_cuenta->>'bono_referido')::boolean, false)
  );
end;
$function$;

revoke all on function public.confirmar_pago_manual(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.confirmar_pago_manual(text, jsonb, jsonb) to service_role;
