-- cancelar_pedido (A3, 2026-09-24): cancelar un pedido es UNA transacción. Antes eran pasos
-- sueltos desde el servidor —marcar CANCELADO, devolver stock, devolver crédito y quitar puntos,
-- anotar historial y libro de crédito, revertir el bono de referido—: si uno fallaba, el pedido
-- quedaba cancelado con el saldo sin devolver, o devuelto sin anotar. Era lo único del dinero de
-- la cuenta que no había pasado a una transacción.
--
-- p_desde: estados desde los que se puede cancelar (el cliente, solo RECIBIDO); null = cualquiera
--   salvo ENTREGADO o CANCELADO (el dueño).
-- p_codes/p_qtys: los insumos a devolver (los deriva el servidor de la foto del pedido).
-- p_deshacer: null si no hay nada que deshacer en la cuenta; si no {phone, points_delta,
--   credit_delta, total_orders_delta, redeemed_delta, pagado, referral_bonus, referrer_bonus,
--   desc_puntos, desc_credito, desc_bono}. El bono de referido se revierte si este era el pedido
--   que lo otorgó (pagado, bono dado y total_orders = 1), leído ACÁ bajo lock y no antes.
-- Si el saldo no alcanza para deshacer (el cliente ya gastó esos puntos), no se cancela nada.
create or replace function public.cancelar_pedido(p_order_id text, p_desde text[], p_motivo text, p_codes text[], p_qtys integer[], p_deshacer jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ord public.orders;
  v_cli public.customers;
  v_phone text := p_deshacer->>'phone';
  v_puntos int := coalesce((p_deshacer->>'points_delta')::int, 0);
  v_credito numeric := coalesce((p_deshacer->>'credit_delta')::numeric, 0);
  v_invita text;
begin
  update public.orders set status = 'CANCELADO', cancel_reason = p_motivo
   where id = p_order_id
     and case when p_desde is null then status not in ('ENTREGADO', 'CANCELADO') else status = any(p_desde) end
  returning * into v_ord;
  if not found then
    return jsonb_build_object('cancelado', false);
  end if;

  perform public.restock_inventory(p_codes, p_qtys);

  if v_phone is not null then
    select * into v_cli from public.customers where phone = v_phone for update;
    if found and coalesce((p_deshacer->>'pagado')::boolean, false) and v_cli.referral_bonus_granted
       and v_cli.total_orders = 1 and v_cli.referred_by is not null
       and exists (select 1 from public.customers where phone = v_cli.referred_by) then
      v_invita := v_cli.referred_by;
    end if;

    perform public.finalize_order_customer_update(
      v_phone, v_puntos, v_credito,
      coalesce((p_deshacer->>'total_orders_delta')::int, 0), null,
      coalesce((p_deshacer->>'redeemed_delta')::int, 0), null, 0, 0);

    if v_puntos <> 0 then
      insert into public.transactions (customer_phone, type, points, description, order_ref, confirmed)
      values (v_phone, 'cancel_reversal', v_puntos, p_deshacer->>'desc_puntos', v_ord.ref, true);
    end if;
    if v_credito > 0 then
      insert into public.credit_ledger (customer_phone, delta, reason)
      values (v_phone, v_credito, p_deshacer->>'desc_credito');
    end if;
    if v_invita is not null then
      perform public.reverse_referral_bonus(v_phone, v_invita, (p_deshacer->>'referral_bonus')::int, (p_deshacer->>'referrer_bonus')::int);
      insert into public.transactions (customer_phone, type, points, description, confirmed)
      values (v_phone, 'cancel_reversal', -(p_deshacer->>'referral_bonus')::int, p_deshacer->>'desc_bono', true),
             (v_invita, 'cancel_reversal', -(p_deshacer->>'referrer_bonus')::int, p_deshacer->>'desc_bono', true);
    end if;
  end if;

  return jsonb_build_object('cancelado', true, 'order', to_jsonb(v_ord), 'bono_revertido', v_invita is not null);
end;
$function$;

revoke execute on function public.cancelar_pedido(text, text[], text, text[], integer[], jsonb) from public, anon, authenticated;
grant execute on function public.cancelar_pedido(text, text[], text, text[], integer[], jsonb) to service_role;
