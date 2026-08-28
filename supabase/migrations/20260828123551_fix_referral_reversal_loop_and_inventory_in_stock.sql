-- Cierra el bucle de re-cobro del bono de referido.
--
-- DEFECTO: la función reponía `referral_bonus_granted = false` SIEMPRE, aunque el
-- `greatest(0, points - p_bonus)` hubiera tenido que recortar porque el cliente ya se
-- gastó los puntos. Secuencia real: B (referido) paga con crédito propio, A cobra sus 400
-- puntos, A los canjea en R06 (un 15CM gratis), B se autocancela en RECIBIDO — el crédito
-- se le devuelve íntegro, el flag se reabre, y B repite. Cada vuelta le sale gratis al
-- atacante y le cuesta al negocio un 15CM real.
--
-- ARREGLO: el flag solo se repone si de verdad se pudo recuperar el bono completo de los
-- DOS lados. Si a alguno no le alcanzaban los puntos, la relación de referido queda marcada
-- como ya usada y no se puede volver a cobrar.
create or replace function public.reverse_referral_bonus(
  p_referred_phone text,
  p_referrer_phone text,
  p_bonus integer,
  p_referrer_bonus integer default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_referred_ok boolean := false;
  v_referrer_ok boolean := false;
  v_referrer_amount integer := coalesce(p_referrer_bonus, p_bonus);
begin
  -- `points >= p_bonus` en el WHERE: si no alcanza, la fila no se toca y v_referred_ok
  -- queda en false, así que el flag NO se repone.
  update public.customers
  set points = points - p_bonus
  where phone = p_referred_phone and points >= p_bonus;
  v_referred_ok := found;

  update public.customers
  set points = points - v_referrer_amount,
      total_referrals = greatest(0, total_referrals - 1)
  where phone = p_referrer_phone and points >= v_referrer_amount;
  v_referrer_ok := found;

  -- Si a alguno no le alcanzaba, igual hay que descontar lo que se pueda (el pedido se
  -- canceló de verdad), pero SIN reabrir la puerta.
  if not v_referred_ok then
    update public.customers set points = greatest(0, points - p_bonus)
    where phone = p_referred_phone;
  end if;
  if not v_referrer_ok then
    update public.customers
    set points = greatest(0, points - v_referrer_amount),
        total_referrals = greatest(0, total_referrals - 1)
    where phone = p_referrer_phone;
  end if;

  if v_referred_ok and v_referrer_ok then
    update public.customers set referral_bonus_granted = false
    where phone = p_referred_phone;
  end if;
end;
$function$;

-- La sobrecarga vieja de 3 argumentos seguía viva y PostgREST elige por nombre de
-- argumento: cualquier llamador que omitiera `p_referrer_bonus` caía en ella y descontaba
-- el monto del referido a los dos lados. Es exactamente el defecto de los "350 puntos
-- regalados" que ya está documentado en CLAUDE.md, esperando a un llamador nuevo.
drop function if exists public.reverse_referral_bonus(text, text, integer);

-- ─────────────────────────────────────────────────────────────────────────────
-- INVENTARIO: lo que se marca SIN STOCK desde el panel tiene que respetarse.
-- ─────────────────────────────────────────────────────────────────────────────
-- DEFECTO 1: reserve_inventory solo miraba `stock_qty`. Un ingrediente marcado SIN STOCK a
-- mano (típicamente uno sin cantidad rastreada, ej. "hoy no tengo atún") se seguía pudiendo
-- pedir: el pedido entraba, el dueño se enteraba en la cocina. El cliente tampoco lo veía,
-- porque leía `inventory` por PostgREST directo y RLS le devuelve 200 [] en silencio.
create or replace function public.reserve_inventory(p_codes text[], p_qtys integer[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  i int;
  v_stock int;
  v_in_stock boolean;
begin
  if p_codes is null or array_length(p_codes, 1) is null then
    return;
  end if;
  for i in 1..array_length(p_codes, 1) loop
    select stock_qty, in_stock into v_stock, v_in_stock
    from public.inventory where product_code = p_codes[i] for update;
    -- Un "no" explícito del dueño manda sobre cualquier cantidad.
    if v_in_stock is false then
      raise exception 'out_of_stock: %', p_codes[i];
    end if;
    if v_stock is not null and v_stock < p_qtys[i] then
      raise exception 'out_of_stock: %', p_codes[i];
    end if;
  end loop;
  for i in 1..array_length(p_codes, 1) loop
    update public.inventory
    set stock_qty = stock_qty - p_qtys[i],
        in_stock = (stock_qty - p_qtys[i]) > 0
    where product_code = p_codes[i] and stock_qty is not null;
  end loop;
end;
$function$;

-- DEFECTO 2: restock_inventory ponía `in_stock = true` sin condiciones. Se dispara al
-- cancelar un pedido y desde el cron que expira cargos Culqi (cada 3 minutos), así que
-- bastaba con que expirara cualquier cargo con ese código para resucitar un ingrediente
-- que el dueño acababa de apagar a mano.
--
-- Regla nueva: solo se vuelve a habilitar lo que se había apagado SOLO porque la cantidad
-- llegó a cero (que es lo que hace reserve_inventory arriba). Si el dueño lo apagó
-- teniendo stock, sigue apagado — devolver unidades no es una orden de volver a venderlo.
create or replace function public.restock_inventory(p_codes text[], p_qtys integer[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare i int;
begin
  if p_codes is null or array_length(p_codes, 1) is null then
    return;
  end if;
  for i in 1..array_length(p_codes, 1) loop
    update public.inventory
    set stock_qty = stock_qty + p_qtys[i],
        in_stock = ((stock_qty + p_qtys[i]) > 0 and (in_stock or stock_qty <= 0))
    where product_code = p_codes[i] and stock_qty is not null;
  end loop;
end;
$function$;
