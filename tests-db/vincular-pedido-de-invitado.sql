-- vincular_pedido_de_invitado (A2, 2026-09-24): crear la cuenta desde un pedido de invitado lo
-- reclama y lo acredita en una transacción, sin robar pedidos ajenos, sin acreditar dos veces
-- y sin romperse si quien invitó ya no existe.
do $$
declare
  r jsonb; n int;
  rangos jsonb := '[{"min":0,"name":"NUEVO"},{"min":1,"name":"REGULAR"}]';
  cuenta jsonb := '{"points_delta":20,"credit_delta":0,"redeemed_delta":0,"last_address":"x","referrer_phone":"900000009","referral_bonus":120,"referrer_bonus":400,"base_points":20,"descripcion":"Pedido SND//WCH (vinculado tras crear cuenta)","nombre":"Ana"}';
begin
  insert into customers (phone, name, pin, dni, points, total_orders) values ('900000009', 'Invita', 'x', '70000009', 0, 0);
  insert into customers (phone, name, pin, dni, points, total_orders, referred_by) values ('930000001', 'Ana', 'x', '70000010', 0, 0, '900000009');
  insert into customers (phone, name, pin, dni, points, total_orders) values ('930000003', 'Otro', 'x', '70000012', 0, 0);
  insert into orders (id, ref, customer_phone, contact_phone, customer_name, customer_address, total, delivery_fee, payment_status, payment_method, items)
  values ('00000000-0000-4000-8000-000000000011', 'G-1', null, 'x', 'Ana', 'x', 25, 5, 'paid', 'card', '[]'),
         ('00000000-0000-4000-8000-000000000012', 'G-2', null, 'x', 'Ana', 'x', 25, 5, 'pending', 'yape', '[]'),
         ('00000000-0000-4000-8000-000000000013', 'G-3', null, 'x', 'Beto', 'x', 25, 5, 'paid', 'card', '[]');

  -- 1. Pagado: queda de la cuenta, con sus puntos, su pedido contado, su historial y el bono.
  r := vincular_pedido_de_invitado('G-1', '930000001', cuenta, rangos);
  if not (r->>'acreditado')::boolean then raise exception '1 no acreditó: %', r; end if;
  if (select customer_phone from orders where ref = 'G-1') <> '930000001' then raise exception '1 no vinculó'; end if;
  if (select points || '|' || total_orders from customers where phone = '930000001') <> '140|1' then
    raise exception '1 cuenta: %', (select points || '|' || total_orders from customers where phone = '930000001');
  end if;
  if (select points from customers where phone = '900000009') <> 400 then raise exception '1 quien invita no recibió su bono'; end if;
  select count(*) into n from transactions where customer_phone in ('930000001', '900000009');
  if n <> 3 then raise exception '1 movimientos: % (esperaba 3)', n; end if;

  -- 2. Otro registro contra el mismo pedido: no lo roba ni acredita nada.
  r := vincular_pedido_de_invitado('G-1', '930000003', cuenta, rangos);
  if (r->>'vinculado')::boolean or (select points from customers where phone = '930000003') <> 0 then raise exception '2 robó el pedido: %', r; end if;

  -- 3. El bono de referido se da una sola vez: otro pedido vinculado no lo repite.
  update orders set payment_status = 'paid' where ref = 'G-2';
  r := vincular_pedido_de_invitado('G-2', '930000001', cuenta, rangos);
  if (select points from customers where phone = '900000009') <> 400 then raise exception '3 bono de referido dos veces'; end if;
  select count(*) into n from transactions where description = 'Bono por referido';
  if n <> 1 then raise exception '3 el bono quedó anotado % veces', n; end if;

  -- 4. Pendiente: se vincula, sin puntos (los da la confirmación del pago).
  update orders set customer_phone = null, payment_status = 'pending' where ref = 'G-2';
  update customers set points = 0 where phone = '930000003';
  r := vincular_pedido_de_invitado('G-2', '930000003', '{"points_delta":20,"base_points":20}', rangos);
  if (r->>'acreditado')::boolean or (select points from customers where phone = '930000003') <> 0
     or (select customer_phone from orders where ref = 'G-2') <> '930000003' then raise exception '4 pendiente: %', r; end if;

  -- 5. Quien invitó borró su cuenta: se vincula y acredita igual, sin bono (antes: fallaba a medias).
  insert into customers (phone, name, pin, dni, points, total_orders, referred_by) values ('930000004', 'Beto', 'x', '70000013', 0, 0, '900000099');
  r := vincular_pedido_de_invitado('G-3', '930000004', cuenta || '{"referrer_phone":"900000099"}', rangos);
  if (r->>'bono_referido')::boolean or (select points from customers where phone = '930000004') <> 20 then raise exception '5 sin quien invite: %', r; end if;

  -- 6. La clave pública no la puede llamar.
  if has_function_privilege('anon', 'public.vincular_pedido_de_invitado(text,text,jsonb,jsonb)', 'execute') then raise exception '6 anon puede ejecutar'; end if;
end $$;
