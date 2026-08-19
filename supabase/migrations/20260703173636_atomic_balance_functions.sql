-- Operaciones atómicas de saldo (puntos/crédito) para eliminar condiciones de carrera
-- read-then-write en la edge function. Cada UPDATE aquí es una sola sentencia SQL,
-- por lo que Postgres la ejecuta de forma atómica sin importar cuántas solicitudes
-- concurrentes lleguen para el mismo cliente.

create or replace function public.increment_customer_points(p_phone text, p_delta int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_points int;
begin
  update public.customers
  set points = points + p_delta
  where phone = p_phone and points + p_delta >= 0
  returning points into v_points;
  if v_points is null then
    if exists (select 1 from public.customers where phone = p_phone) then
      raise exception 'insufficient_points';
    else
      raise exception 'customer_not_found';
    end if;
  end if;
  return v_points;
end;
$$;

create or replace function public.adjust_credit_balance(p_phone text, p_delta numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare v_balance numeric;
begin
  update public.customers
  set credit_balance = coalesce(credit_balance, 0) + p_delta
  where phone = p_phone and coalesce(credit_balance, 0) + p_delta >= 0
  returning credit_balance into v_balance;
  if v_balance is null then
    if exists (select 1 from public.customers where phone = p_phone) then
      raise exception 'insufficient_credit';
    else
      raise exception 'customer_not_found';
    end if;
  end if;
  return v_balance;
end;
$$;

-- Regalo de crédito entre dos clientes en una sola transacción (ambas mitades se
-- confirman o se revierten juntas — evita que el dinero "desaparezca" si algo falla
-- a la mitad).
create or replace function public.gift_credit(p_from text, p_to text, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_from numeric; v_to numeric;
begin
  update public.customers set credit_balance = coalesce(credit_balance, 0) - p_amount
    where phone = p_from and coalesce(credit_balance, 0) - p_amount >= 0
    returning credit_balance into v_from;
  if v_from is null then
    if exists (select 1 from public.customers where phone = p_from) then
      raise exception 'insufficient_credit';
    else
      raise exception 'customer_not_found';
    end if;
  end if;
  update public.customers set credit_balance = coalesce(credit_balance, 0) + p_amount
    where phone = p_to
    returning credit_balance into v_to;
  if v_to is null then
    raise exception 'customer_not_found';
  end if;
end;
$$;

-- Reclamo del reto mensual: marca el mes como reclamado Y suma el bono en una sola
-- sentencia atómica, para que dos solicitudes simultáneas no puedan ambas pasar el
-- chequeo y duplicar el bono.
create or replace function public.claim_monthly_challenge(p_phone text, p_month text, p_bonus int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_points int;
begin
  update public.customers
  set challenge_claimed_month = p_month, points = points + p_bonus
  where phone = p_phone and (challenge_claimed_month is distinct from p_month)
  returning points into v_points;
  if v_points is null then
    raise exception 'already_claimed';
  end if;
  return v_points;
end;
$$;
