-- Hallazgo de auditoría (ALTO): no existía ninguna acción admin para corregir
-- credit_balance a mano — necesario porque actAdminCancelOrder puede dejar crédito
-- interno debitado sin forma de devolverlo (ver siguiente fix), y en general para
-- correcciones de soporte. Guarda contra dejar el saldo en negativo por error del
-- operador, mismo criterio que finalize_order_customer_update.
create or replace function public.admin_adjust_credit(p_phone text, p_delta numeric)
returns customers
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row customers;
begin
  update public.customers
  set credit_balance = coalesce(credit_balance, 0) + p_delta
  where phone = p_phone
    and coalesce(credit_balance, 0) + p_delta >= 0
  returning * into v_row;

  if v_row is null then
    if not exists (select 1 from public.customers where phone = p_phone) then
      raise exception 'customer_not_found';
    else
      raise exception 'insufficient_balance';
    end if;
  end if;

  return v_row;
end;
$function$;
