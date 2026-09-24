-- crear_cuenta (2026-09-24): crear la cuenta y anotar el bono de bienvenida es UNA transacción.
-- Antes el servidor insertaba el cliente con los puntos del bono y después, aparte, la fila del
-- historial: si la segunda fallaba, la cuenta quedaba con puntos que su historial no explicaba.
-- Lo destapó `check:doble-escritura` al empezar a leer las funciones de la base: el registro
-- escribía `transactions` a mano y también a través de la RPC que vincula el pedido de invitado.
--
-- p_cliente: los campos que fija el registro (los demás toman su valor por defecto).
-- p_bono: puntos de bienvenida (0 si esta persona ya lo recibió antes).
create or replace function public.crear_cuenta(p_cliente jsonb, p_bono integer)
returns public.customers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v public.customers;
begin
  insert into public.customers
    (phone, name, pin, email, dni, birthday, points, pending_points, total_orders, total_redeemed,
     referral_code, referred_by, acquisition_source, google_id)
  values
    (p_cliente->>'phone', p_cliente->>'name', p_cliente->>'pin', nullif(p_cliente->>'email', ''),
     nullif(p_cliente->>'dni', ''), nullif(p_cliente->>'birthday', ''), greatest(coalesce(p_bono, 0), 0), 0, 0, 0,
     p_cliente->>'referral_code', nullif(p_cliente->>'referred_by', ''),
     nullif(p_cliente->>'acquisition_source', ''), nullif(p_cliente->>'google_id', ''))
  returning * into v;
  if coalesce(p_bono, 0) > 0 then
    insert into public.transactions (customer_phone, type, points, description, confirmed)
    values (v.phone, 'earn_confirmed', p_bono, 'Bono de bienvenida', true);
  end if;
  return v;
end;
$function$;

revoke execute on function public.crear_cuenta(jsonb, integer) from public, anon, authenticated;
grant execute on function public.crear_cuenta(jsonb, integer) to service_role;
