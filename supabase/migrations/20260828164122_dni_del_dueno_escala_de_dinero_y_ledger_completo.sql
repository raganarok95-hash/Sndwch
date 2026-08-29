-- 1. DNI del dueño (dato real entregado por él) y restauración de la restricción.
-- Se revirtió esta mañana porque su fila tenía dni null y `NOT VALID` no evita que un
-- UPDATE posterior re-evalúe la restricción: con ella activa no podía cerrar un pedido
-- suyo. Con el dato puesto, la restricción ya puede volver — y esta vez VALIDATE de
-- verdad, porque no queda ninguna fila que la incumpla.
update public.customers set dni = '73604452' where phone = '930957640' and dni is null;

alter table public.customers drop constraint if exists customers_dni_not_null;
alter table public.customers add constraint customers_dni_not_null check (dni is not null) not valid;
alter table public.customers validate constraint customers_dni_not_null;

-- 2. Escala explícita en las columnas de DINERO.
-- Eran `numeric` sin precisión, así que la base aceptaba y guardaba tal cual valores como
-- 24.369999999999997 — exactamente la basura de punto flotante que `money()` y `pz()`
-- existen para evitar del lado del cliente. Con numeric(10,2) el redondeo a céntimos queda
-- garantizado por el tipo, no por que todos los caminos del código se acuerden de aplicarlo.
-- Se hace ahora que las tablas están vacías: sin datos que redondear, no hay riesgo.
-- store_hours.open_hour/close_hour NO se tocan: son horas, no dinero.
alter table public.catalog_items          alter column price_15          type numeric(10,2);
alter table public.catalog_items          alter column price_30          type numeric(10,2);
alter table public.secret_signature       alter column price_15          type numeric(10,2);
alter table public.secret_signature       alter column price_30          type numeric(10,2);
alter table public.complaints             alter column claimed_amount    type numeric(10,2);
alter table public.credit_ledger          alter column delta             type numeric(10,2);
alter table public.customers              alter column credit_balance    type numeric(10,2);
alter table public.orders                 alter column total             type numeric(10,2);
alter table public.orders                 alter column delivery_fee      type numeric(10,2);
alter table public.pending_charges        alter column expected_total    type numeric(10,2);
alter table public.pending_charges        alter column delivery_fee      type numeric(10,2);
alter table public.pending_charges        alter column promo_discount    type numeric(10,2);
alter table public.pending_weekly_plans   alter column amount_paid       type numeric(10,2);
alter table public.pending_weekly_plans   alter column credit_amount     type numeric(10,2);
alter table public.promo_code_redemptions alter column discount_applied  type numeric(10,2);
alter table public.promo_codes            alter column max_discount      type numeric(10,2);
alter table public.promo_codes            alter column min_order_total   type numeric(10,2);
alter table public.promo_codes            alter column value             type numeric(10,2);

-- 3. `credit_ledger` completo: TODO movimiento de saldo deja asiento.
-- Hasta ahora solo escribía confirm_weekly_plan_credit. Los regalos entre clientes, el
-- canje de puntos por tarjeta de regalo y los ajustes manuales del admin movían
-- credit_balance sin registrar nada, así que el libro no cuadraba con el saldo y no había
-- forma de reconstruir por qué alguien tenía el crédito que tenía. En un saldo que el
-- cliente puede gastar, eso es rendición de cuentas, no comodidad.
--
-- Se usa la columna `related_phone` que la tabla ya tenía para la contraparte, en vez de
-- meter el teléfono del otro dentro de `reason` (que obligaría a parsear texto para saber
-- quién le regaló a quién).
--
-- Probado end-to-end contra la base real, dentro de una transacción con rollback: las tres
-- funciones dejan los 4 asientos esperados con su contraparte correcta.
create or replace function public.gift_credit(p_from text, p_to text, p_amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.customers set credit_balance = credit_balance - p_amount
  where phone = p_from and credit_balance >= p_amount;
  if not found then
    raise exception 'insufficient_balance';
  end if;
  update public.customers set credit_balance = credit_balance + p_amount where phone = p_to;
  insert into public.credit_ledger (customer_phone, delta, reason, related_phone)
  values (p_from, -p_amount, 'gift_sent', p_to),
         (p_to, p_amount, 'gift_received', p_from);
end;
$function$;

create or replace function public.redeem_points_for_gift_credit(
  p_from text, p_to text, p_points integer, p_credit_amount numeric
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.customers set points = points - p_points
  where phone = p_from and points >= p_points;
  if not found then
    raise exception 'insufficient_points';
  end if;
  update public.customers set credit_balance = credit_balance + p_credit_amount where phone = p_to;
  insert into public.credit_ledger (customer_phone, delta, reason, related_phone)
  values (p_to, p_credit_amount, 'gift_card_received', p_from);
end;
$function$;

create or replace function public.adjust_credit_balance(p_phone text, p_delta numeric)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_new numeric;
begin
  update public.customers set credit_balance = credit_balance + p_delta
  where phone = p_phone and credit_balance + p_delta >= 0
  returning credit_balance into v_new;
  if v_new is null then
    raise exception 'insufficient_balance';
  end if;
  insert into public.credit_ledger (customer_phone, delta, reason, related_phone)
  values (p_phone, p_delta, 'admin_adjust', null);
  return v_new;
end;
$function$;
