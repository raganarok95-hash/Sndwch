-- reponer_tanda (A1, 2026-09-24): registrar una tanda suma sobre lo que HAY en ese momento, en
-- una sola sentencia, anota cuándo se cocinó y crea el insumo que todavía no tenía fila.
do $$
declare r jsonb;
begin
  insert into inventory (product_code, product_name, stock_qty, in_stock, batch_cooked_at)
  values ('X1', 'Uno', 4, true, now() - interval '3 days'),
         ('X2', 'Dos', 0, false, null),
         ('X9', 'Otro', 7, true, now() - interval '5 days');

  -- 1. Un pedido reserva DESPUÉS de que el panel mostró 4 y ANTES de que llegue la tanda: la
  --    tanda suma sobre 3, no sobre el 4 que vio el panel (el defecto: quedaba en 4 + 10).
  perform reserve_inventory(array['X1'], array[1]);
  r := reponer_tanda('[{"code":"X1","name":"Uno","add":10},{"code":"X2","add":6},{"code":"X3","name":"Nuevo","add":5}]');
  if (select stock_qty from inventory where product_code = 'X1') <> 13 then
    raise exception '1 la tanda pisó la reserva: %', (select stock_qty from inventory where product_code = 'X1');
  end if;
  if r->0 <> '{"code":"X1","from":3,"to":13}'::jsonb then raise exception '1 respuesta: %', r; end if;

  -- 2. El agotado vuelve a estar disponible.
  if not (select in_stock from inventory where product_code = 'X2') or (select stock_qty from inventory where product_code = 'X2') <> 6 then
    raise exception '2 el agotado no volvió';
  end if;

  -- 3. El insumo sin fila se crea, con su nombre.
  if (select stock_qty || '|' || product_name from inventory where product_code = 'X3') is distinct from '5|Nuevo' then
    raise exception '3 no se creó el insumo nuevo';
  end if;

  -- 4. La fecha de la tanda se anota en los tres y no toca a los demás (de ella cuelga la caducidad).
  if (select count(*) from inventory where product_code in ('X1','X2','X3') and batch_cooked_at > now() - interval '1 minute') <> 3 then
    raise exception '4 no anotó la fecha de la tanda';
  end if;
  if (select batch_cooked_at from inventory where product_code = 'X9') > now() - interval '4 days' then
    raise exception '4 tocó un insumo que no estaba en la tanda';
  end if;

  -- 5. Cero, negativo o sin código: no se aplica NADA de la tanda (todo o nada).
  begin
    perform reponer_tanda('[{"code":"X9","add":2},{"code":"X1","add":-3}]');
    raise exception '5 aceptó una cantidad negativa';
  exception when others then
    if sqlerrm like '5 %' then raise; end if;
  end;
  if (select stock_qty from inventory where product_code = 'X9') <> 7 then raise exception '5 aplicó media tanda'; end if;

  -- 6. La clave pública no la puede llamar.
  if has_function_privilege('anon', 'public.reponer_tanda(jsonb)', 'execute') then raise exception '6 anon puede ejecutar'; end if;
end $$;
