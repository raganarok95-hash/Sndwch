-- Antes actConfirmWeeklyPlan hacía claim (status->consumed) + add_gifted_credit + insert
-- credit_ledger como 3 pasos HTTP separados: si el 2do o 3er paso fallaba después del
-- claim, la fila quedaba "consumed" sin que el cliente hubiera recibido el crédito, y
-- actReconcileCulqiCharges trata cualquier status=consumed como "ya reconciliado" — el
-- cliente pagaba S/95 reales y no había ninguna red de seguridad que lo detectara
-- (hallazgo de auditoría, ALTO). Esta RPC hace los 3 pasos en una sola transacción: si
-- cualquiera falla, todo se revierte y la fila queda en "pending" — lo que SÍ dispara la
-- reconciliación existente (que ya trata cualquier status != consumed como huérfano tras
-- el período de gracia).
create or replace function public.confirm_weekly_plan_credit(p_plan_id uuid)
returns pending_weekly_plans
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_plan pending_weekly_plans;
begin
  update public.pending_weekly_plans
  set status = 'consumed'
  where id = p_plan_id and status = 'pending'
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
$$;
