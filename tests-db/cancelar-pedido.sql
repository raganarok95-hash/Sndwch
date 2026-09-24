-- cancelar_pedido (A3, 2026-09-24): cancelar marca, devuelve stock, deshace la cuenta y revierte
-- el bono de referido en UNA transacción; si algo no alcanza, no se cancela nada.
do $$
declare
  r jsonb; n int;
  deshacer jsonb := '{"phone":"930000001","points_delta":-20,"credit_delta":25,"total_orders_delta":-1,"redeemed_delta":0,"pagado":true,"referral_bonus":120,"referrer_bonus":400,"desc_puntos":"Ajuste por cancelación","desc_credito":"Reembolso por cancelación","desc_bono":"Reversión de bono"}';
begin
  insert into customers (phone, name, pin, dni, points, total_orders) values ('900000009', 'Invita', 'x', '70000009', 400, 0);
  update customers set total_referrals = 1 where phone = '900000009';
  insert into customers (phone, name, pin, dni, points, total_orders, referred_by, referral_bonus_granted, credit_balance)
  values ('930000001', 'Ana', 'x', '70000010', 140, 1, '900000009', true, 0);
  insert into inventory (product_code, product_name, stock_qty, in_stock) values ('X1', 'Uno', 2, true);
  insert into orders (id, ref, customer_phone, contact_phone, customer_name, customer_address, total, delivery_fee, payment_status, payment_method, items)
  values ('00000000-0000-4000-8000-000000000021', 'C-1', '930000001', 'x', 'Ana', 'x', 25, 5, 'paid', 'credit', '[]'),
         ('00000000-0000-4000-8000-000000000022', 'C-2', '930000001', 'x', 'Ana', 'x', 25, 5, 'paid', 'credit', '[]');
  update orders set status = 'PREPARANDO' where ref = 'C-2';

  -- 1. El cliente solo cancela desde RECIBIDO: un pedido en cocina no se toca.
  r := cancelar_pedido('00000000-0000-4000-8000-000000000022', array['RECIBIDO'], 'Cliente canceló', array['X1'], array[1], deshacer);
  if (r->>'cancelado')::boolean or (select status from orders where ref = 'C-2') <> 'PREPARANDO' or (select stock_qty from inventory where product_code = 'X1') <> 2 then
    raise exception '1 canceló un pedido en cocina: %', r;
  end if;

  -- 2. Cancelar: estado, stock, crédito devuelto, puntos quitados, historial, libro y bono revertido.
  r := cancelar_pedido('00000000-0000-4000-8000-000000000021', array['RECIBIDO'], 'Cliente canceló', array['X1'], array[1], deshacer);
  if not (r->>'cancelado')::boolean or not (r->>'bono_revertido')::boolean then raise exception '2 respuesta: %', r; end if;
  if (select status || '|' || cancel_reason from orders where ref = 'C-1') <> 'CANCELADO|Cliente canceló' then raise exception '2 estado'; end if;
  if (select stock_qty from inventory where product_code = 'X1') <> 3 then raise exception '2 no devolvió el stock'; end if;
  if (select points || '|' || credit_balance || '|' || total_orders from customers where phone = '930000001') <> '0|25.00|0' then
    raise exception '2 cuenta: %', (select points || '|' || credit_balance || '|' || total_orders from customers where phone = '930000001');
  end if;
  if (select points from customers where phone = '900000009') <> 0 then raise exception '2 no revirtió el bono de quien invitó'; end if;
  select count(*) into n from transactions where type = 'cancel_reversal';
  if n <> 3 then raise exception '2 movimientos de reversión: % (esperaba 3)', n; end if;
  if (select count(*) from credit_ledger where customer_phone = '930000001' and delta = 25) <> 1 then raise exception '2 el libro de crédito no lo anotó'; end if;

  -- 3. Cancelar dos veces (doble toque): no se devuelve nada otra vez.
  r := cancelar_pedido('00000000-0000-4000-8000-000000000021', null, 'x', array['X1'], array[1], deshacer);
  if (r->>'cancelado')::boolean or (select stock_qty from inventory where product_code = 'X1') <> 3
     or (select credit_balance from customers where phone = '930000001') <> 25 then raise exception '3 canceló dos veces'; end if;

  -- 4. Si el saldo no alcanza para deshacer, NO se cancela nada (antes: cancelado y sin devolver).
  update orders set status = 'RECIBIDO' where ref = 'C-2';
  begin
    perform cancelar_pedido('00000000-0000-4000-8000-000000000022', null, 'x', array['X1'], array[1],
                            deshacer || '{"points_delta":-999,"pagado":false}');
    raise exception '4 canceló sin saldo';
  exception when others then
    if sqlerrm like '4 %' then raise; end if;
  end;
  if (select status from orders where ref = 'C-2') <> 'RECIBIDO' or (select stock_qty from inventory where product_code = 'X1') <> 3 then
    raise exception '4 quedó cancelado a medias';
  end if;

  -- 5. El dueño cancela desde cualquier estado menos ENTREGADO; un Yape sin pagar no toca la cuenta.
  update orders set status = 'EN CAMINO' where ref = 'C-2';
  r := cancelar_pedido('00000000-0000-4000-8000-000000000022', null, 'Sin insumo', array[]::text[], array[]::int[], null);
  if not (r->>'cancelado')::boolean or (select credit_balance from customers where phone = '930000001') <> 25 then raise exception '5 dueño: %', r; end if;

  -- 6. La clave pública no la puede llamar.
  if has_function_privilege('anon', 'public.cancelar_pedido(text,text[],text,text[],integer[],jsonb)', 'execute') then raise exception '6 anon puede ejecutar'; end if;
end $$;
