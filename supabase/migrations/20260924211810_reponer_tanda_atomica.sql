-- reponer_tanda (A1, 2026-09-24): registrar una tanda cocinada SUMA al stock en una sola
-- sentencia. Antes el servidor leía el stock, sumaba en TypeScript y escribía el total: un
-- pedido que reservaba entre la lectura y la escritura quedaba borrado del stock y se vendía
-- lo que ya no había. `restock_inventory` suma bien pero no anota la fecha de la tanda (de la
-- que cuelga la caducidad) ni crea el insumo si todavía no tiene fila, por eso no servía acá.
--
-- p_items: [{"code": "P04", "name": "Atún", "add": 12}, ...]. Devuelve [{code, from, to}].
create or replace function public.reponer_tanda(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  it jsonb;
  v_code text;
  v_add int;
  v_to int;
  out jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'reponer_tanda: no hay insumos';
  end if;
  for it in select * from jsonb_array_elements(p_items) loop
    v_code := nullif(trim(it->>'code'), '');
    v_add := (it->>'add')::int;
    if v_code is null then raise exception 'reponer_tanda: falta el código de un insumo'; end if;
    -- Solo suma: bajar un número es la edición normal de stock, que fija el valor exacto.
    if v_add is null or v_add <= 0 then raise exception 'reponer_tanda: la cantidad de % debe ser mayor a 0', v_code; end if;
    insert into public.inventory as inv (product_code, product_name, stock_qty, in_stock, batch_cooked_at)
    values (v_code, nullif(trim(it->>'name'), ''), v_add, true, now())
    on conflict (product_code) do update
      set stock_qty = coalesce(inv.stock_qty, 0) + v_add,
          in_stock = true,
          batch_cooked_at = now()
    returning inv.stock_qty into v_to;
    out := out || jsonb_build_array(jsonb_build_object('code', v_code, 'from', v_to - v_add, 'to', v_to));
  end loop;
  return out;
end;
$function$;

revoke execute on function public.reponer_tanda(jsonb) from public, anon, authenticated;
grant execute on function public.reponer_tanda(jsonb) to service_role;
