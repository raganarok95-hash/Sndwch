-- crear_pedido (migración 20260924173551): saldo + pedido + historial en UNA transacción.
-- Corre contra el Postgres local con el esquema real (npm run check:pg). Cada caso afirma con
-- `raise exception` si algo no da lo esperado; el primero que falla corta la prueba.
do $$
declare
  r jsonb; c customers; n int; pts_antes int; err text;
  rangos jsonb := '[{"min":0,"name":"NUEVO"},{"min":1,"name":"REGULAR"},{"min":5,"name":"FIEL"}]';
  cuenta jsonb;
begin
  insert into customers (phone, name, pin, dni, points, credit_balance, total_orders) values ('900000001', 'Quien invita', 'x', '70000001', 0, 0, 3);
  insert into customers (phone, name, pin, dni, points, credit_balance, total_orders, referred_by)
  values ('930957640', 'Ana', 'x', '70000002', 500, 50, 0, '900000001');

  -- 1. Invitado: pedido sin cuenta, sin rango.
  r := crear_pedido(jsonb_build_object('ref','T-INV','contact_phone','999','customer_name','Invitado','customer_address','Av. X 1',
        'total',25.5,'delivery_fee',5,'payment_status','pending','payment_method','yape','items','[]'::jsonb), null, rangos);
  if r->'order'->>'status' <> 'RECIBIDO' or r->'customer' <> 'null'::jsonb or r->'order'->>'customer_rank' is not null then
    raise exception '1 invitado: %', r;
  end if;

  -- 2. Pagado con recompensa (160), crédito (30), 30 pts ganados, bono de referido 120 / 400.
  cuenta := jsonb_build_object('phone','930957640','points_delta',30-160,'credit_delta',-30,'redeemed_delta',1,'last_address','Av. Y 2',
        'referrer_phone','900000001','referral_bonus',120,'referrer_bonus',400,'base_points',30,'descripcion','Pedido de prueba',
        'reward_label','BEBIDA GRATIS','reward_pts',160,'nombre','Ana');
  r := crear_pedido(jsonb_build_object('ref','T-CTA','customer_phone','930957640','contact_phone','930957640','customer_name','Ana',
        'customer_address','Av. Y 2','total',30,'delivery_fee',0,'payment_status','paid','payment_method','credit','items','[]'::jsonb), cuenta, rangos);
  select * into c from customers where phone = '930957640';
  if c.points <> 490 or c.credit_balance <> 20 or c.total_orders <> 1 or r->'order'->>'customer_rank' <> 'REGULAR' or (r->>'bono_referido')::boolean is not true then
    raise exception '2 saldo: puntos=% credito=% pedidos=% rango=% bono=%', c.points, c.credit_balance, c.total_orders, r->'order'->>'customer_rank', r->>'bono_referido';
  end if;
  select count(*) into n from transactions where order_ref = 'T-CTA' or description in ('Bono por referido', 'Sándwich gratis por invitar a Ana');
  if n <> 4 then raise exception '2 movimientos: % (esperaba 4)', n; end if;
  if (select count(*) from credit_ledger where reason like '%T-CTA%') <> 1 then raise exception '2 libro de crédito'; end if;
  if (select points from customers where phone = '900000001') <> 400 then raise exception '2 quien invita no recibió 400'; end if;

  -- 3. Segundo pedido: el bono no se repite.
  r := crear_pedido(jsonb_build_object('ref','T-CTA2','customer_phone','930957640','contact_phone','x','customer_name','Ana','customer_address','x',
        'total',10,'delivery_fee',0,'payment_status','paid','payment_method','card','items','[]'::jsonb),
        cuenta || '{"points_delta":10,"credit_delta":0,"redeemed_delta":0,"base_points":10,"reward_label":null}', rangos);
  select count(*) into n from transactions where description = 'Bono por referido';
  if (r->>'bono_referido')::boolean or n <> 1 then raise exception '3 bono repetido: % anotados', n; end if;

  -- 4. Falla a mitad, DESPUÉS de mover el saldo (+999): no queda nada.
  select points into pts_antes from customers where phone = '930957640';
  begin
    r := crear_pedido(jsonb_build_object('ref','T-MAL','customer_phone','930957640','contact_phone','x','customer_name','Ana','customer_address','x',
          'total','no-es-un-numero','delivery_fee',0,'payment_status','paid','payment_method','card','items','[]'::jsonb),
          cuenta || '{"points_delta":999,"credit_delta":0,"redeemed_delta":0,"base_points":999,"reward_label":null}', rangos);
    raise exception '4 debía fallar y no falló';
  exception when invalid_text_representation then null;
  end;
  if (select points from customers where phone = '930957640') <> pts_antes
     or exists (select 1 from orders where ref = 'T-MAL') or exists (select 1 from transactions where order_ref = 'T-MAL') then
    raise exception '4 la falla dejó rastro';
  end if;

  -- 5. Saldo insuficiente: se rechaza sin crear el pedido.
  err := null;
  begin
    r := crear_pedido(jsonb_build_object('ref','T-POBRE','customer_phone','930957640','contact_phone','x','customer_name','Ana','customer_address','x',
          'total',1,'delivery_fee',0,'payment_status','paid','payment_method','card','items','[]'::jsonb),
          cuenta || '{"points_delta":-99999,"credit_delta":0,"base_points":0,"reward_label":null}', rangos);
  exception when others then err := sqlerrm;
  end;
  if err is distinct from 'insufficient_balance' or exists (select 1 from orders where ref = 'T-POBRE') then
    raise exception '5 saldo insuficiente: error=%', err;
  end if;

  -- 6. La clave pública no la puede llamar.
  if has_function_privilege('anon', 'public.crear_pedido(jsonb,jsonb,jsonb)', 'execute') then
    raise exception '6 anon puede ejecutar crear_pedido';
  end if;
end $$;
