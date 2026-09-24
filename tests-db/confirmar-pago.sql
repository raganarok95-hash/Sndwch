-- confirmar_pago_manual y aplicar_pedido_a_la_cuenta (2026-09-24): marcar pagado + acreditar la
-- cuenta en una transacción, sin repetir puntos ni bono, y sin romperse si quien invitó ya no existe.
do $$
declare
  r jsonb; n int;
  rangos jsonb := '[{"min":0,"name":"NUEVO"},{"min":1,"name":"REGULAR"}]';
  cuenta jsonb := '{"phone":"930000001","points_delta":25,"credit_delta":0,"redeemed_delta":0,"last_address":"x","referrer_phone":"900000009","referral_bonus":120,"referrer_bonus":400,"base_points":25,"descripcion":"Pedido SND//WCH (Yape)","nombre":"Ana"}';
begin
  insert into customers (phone, name, pin, dni, points, total_orders) values ('900000009', 'Invita', 'x', '70000009', 0, 0);
  insert into customers (phone, name, pin, dni, points, total_orders, referred_by) values ('930000001', 'Ana', 'x', '70000010', 0, 0, '900000009');
  insert into orders (id, ref, customer_phone, contact_phone, customer_name, customer_address, total, delivery_fee, payment_status, payment_method, items)
  values ('o1', 'Y-1', '930000001', 'x', 'Ana', 'x', 30, 5, 'pending', 'yape', '[]'),
         ('o2', 'Y-2', null, 'x', 'Invitado', 'x', 20, 5, 'pending', 'yape', '[]'),
         ('o3', 'Y-3', '930000001', 'x', 'Ana', 'x', 20, 5, 'pending', 'yape', '[]');
  update orders set status = 'CANCELADO' where id = 'o3';

  -- 1. Confirmar: pagado, puntos, bono, historial.
  r := confirmar_pago_manual('o1', cuenta, rangos);
  if (r->>'ya_estaba')::boolean or (select payment_status from orders where id = 'o1') <> 'paid' then raise exception '1 no quedó pagado: %', r; end if;
  if (select points from customers where phone = '930000001') <> 25 + 120 then raise exception '1 puntos: %', (select points from customers where phone = '930000001'); end if;
  if (select points from customers where phone = '900000009') <> 400 then raise exception '1 quien invita no recibió su bono'; end if;
  select count(*) into n from transactions where customer_phone in ('930000001', '900000009');
  if n <> 3 then raise exception '1 movimientos: % (esperaba 3)', n; end if;

  -- 2. Confirmar dos veces: no se toca nada.
  r := confirmar_pago_manual('o1', cuenta, rangos);
  if not (r->>'ya_estaba')::boolean or (select points from customers where phone = '930000001') <> 145 then raise exception '2 doble confirmación: %', r; end if;

  -- 3. Un pedido cancelado no se confirma.
  r := confirmar_pago_manual('o3', cuenta, rangos);
  if not (r->>'ya_estaba')::boolean or (select payment_status from orders where id = 'o3') = 'paid' then raise exception '3 confirmó un cancelado'; end if;

  -- 4. Invitado (sin cuenta): solo se marca pagado.
  r := confirmar_pago_manual('o2', null, rangos);
  if (select payment_status from orders where id = 'o2') <> 'paid' or r->'customer' <> 'null'::jsonb then raise exception '4 invitado: %', r; end if;

  -- 5. Quien invitó borró su cuenta: el pedido se crea igual y no hay bono (antes: fallaba entero).
  insert into customers (phone, name, pin, dni, points, total_orders, referred_by) values ('930000002', 'Beto', 'x', '70000011', 0, 0, '900000099');
  r := crear_pedido(jsonb_build_object('ref','Y-5','customer_phone','930000002','contact_phone','x','customer_name','Beto','customer_address','x',
        'total',10,'delivery_fee',0,'payment_status','paid','payment_method','card','items','[]'::jsonb),
        cuenta || '{"phone":"930000002","referrer_phone":"900000099","points_delta":10,"base_points":10}', rangos);
  if (r->>'bono_referido')::boolean or (select points from customers where phone = '930000002') <> 10 then raise exception '5 bono sin quien invite: %', r; end if;

  -- 6. Ninguna de las tres la puede llamar la clave pública.
  if has_function_privilege('anon', 'public.confirmar_pago_manual(text,jsonb,jsonb)', 'execute')
     or has_function_privilege('anon', 'public.aplicar_pedido_a_la_cuenta(jsonb,text,jsonb)', 'execute') then
    raise exception '6 anon puede ejecutar';
  end if;
end $$;
