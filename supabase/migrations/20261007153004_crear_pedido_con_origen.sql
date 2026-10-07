-- crear_pedido inserta una lista fija de columnas: sin esto, orders.origen (migración anterior)
-- llegaría en p_pedido y se perdería en silencio. Mismo cuerpo, más la columna `origen`.
CREATE OR REPLACE FUNCTION public.crear_pedido(p_pedido jsonb, p_cuenta jsonb DEFAULT NULL::jsonb, p_rangos jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    delivery_time, redeemed_reward, redeemed_reward_pts, customer_rank, origen
  )
  select
    x.promised_from, x.promised_to, x.ref, x.customer_phone, x.contact_phone, x.customer_name, x.customer_email,
    x.customer_address, x.lat, x.lon, x.group_code, x.recurring_id, x.summary, x.notes, x.total, x.delivery_fee,
    x.delivery_km, x.delivery_zone, 'RECIBIDO', x.payment_status, x.payment_id, x.payment_method, x.items,
    x.delivery_time, x.redeemed_reward, x.redeemed_reward_pts, v_cuenta->>'rango', x.origen
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
