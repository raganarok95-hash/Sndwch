-- El esquema de `orders` después del paso 6 (migración esquema_de_pedidos): lo que la base
-- garantiza por sí misma, sin depender de que el código lo cumpla.
do $$
declare err text;
begin
  -- delivery_time es fecha: se compara como fecha aunque se escriba en otro formato.
  insert into orders (id, ref, contact_phone, customer_name, customer_address, total, delivery_fee, items, delivery_time)
  values ('11111111-1111-4111-8111-111111111111', 'E-1', 'x', 'x', 'x', 1, 0, '[]', '2026-10-10T19:00:00Z'),
         ('22222222-2222-4222-8222-222222222222', 'E-2', 'x', 'x', 'x', 1, 0, '[]', '2026-10-10 14:30:00-05');
  if (select count(*) from orders where delivery_time >= '2026-10-10T19:00:00Z') <> 2 then
    raise exception 'delivery_time no compara como fecha';
  end if;

  -- Un id que no es uuid se rechaza.
  err := null;
  begin
    insert into orders (id, ref, contact_phone, customer_name, customer_address, total, delivery_fee, items) values ('ord-1', 'E-3', 'x', 'x', 'x', 1, 0, '[]');
  exception when check_violation then err := 'rechazado';
  end;
  if err is null then raise exception 'aceptó un id que no es uuid'; end if;

  -- items: nunca null (toma la lista vacía) y nunca otra forma de JSON.
  insert into orders (ref, contact_phone, customer_name, customer_address, total, delivery_fee) values ('E-4', 'x', 'x', 'x', 1, 0);
  if (select items from orders where ref = 'E-4') <> '[]'::jsonb then raise exception 'items sin lista por defecto'; end if;
  err := null;
  begin
    insert into orders (ref, contact_phone, customer_name, customer_address, total, delivery_fee, items) values ('E-5', 'x', 'x', 'x', 1, 0, '{"a":1}');
  exception when check_violation then err := 'rechazado';
  end;
  if err is null then raise exception 'aceptó items que no son lista'; end if;

  -- created_at siempre existe.
  if (select is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'created_at') <> 'NO' then
    raise exception 'created_at sigue admitiendo null';
  end if;
end $$;
