-- `credit_ledger` ya tenía una columna `related_phone` para la contraparte. La versión
-- anterior de estas funciones metía el teléfono del otro dentro de `reason`
-- ("gift_sent:9XXXXXXXX"), que obliga a parsear texto para saber quién regaló a quién.
-- Con la columna dedicada, `reason` queda como un motivo estable y consultable.
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
