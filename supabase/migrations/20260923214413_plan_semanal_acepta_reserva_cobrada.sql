-- create-credit-charge comparte _shared/culqi-claim.ts con create-charge, y desde
-- 20260923214201 ese código deja la reserva en 'charged' tras cobrar (antes la devolvía a
-- 'pending'). Esta función solo aceptaba 'pending': con el cambio, un Plan Semanal YA
-- COBRADO respondería 'already_processed' y el cliente pagaría sin recibir el saldo. Hoy el
-- Plan Semanal está retirado y ninguna reserva nueva llega acá, pero el defecto quedaría
-- dormido esperando el día que se reactive — justo el caso que nadie vuelve a probar.
-- 'charging' también entra: si el PATCH a 'charged' falló, el cobro igual es real, y quien
-- llama ya lo verificó contra Culqi antes de llegar acá.
create or replace function public.confirm_weekly_plan_credit(p_plan_id uuid)
 returns pending_weekly_plans
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_plan pending_weekly_plans;
begin
  update public.pending_weekly_plans
  set status = 'consumed'
  where id = p_plan_id and status in ('pending', 'charging', 'charged')
  returning * into v_plan;

  if v_plan is null then
    raise exception 'already_processed';
  end if;

  update public.customers
  set credit_balance = coalesce(credit_balance, 0) + v_plan.credit_amount
  where phone = v_plan.buyer_phone;

  if not found then
    raise exception 'customer_not_found';
  end if;

  insert into public.credit_ledger (customer_phone, delta, reason)
  values (v_plan.buyer_phone, v_plan.credit_amount, 'Plan Semanal (pagó S/' || v_plan.amount_paid || ')');

  return v_plan;
end;
$function$;

revoke execute on function public.confirm_weekly_plan_credit(uuid) from public, anon, authenticated;
