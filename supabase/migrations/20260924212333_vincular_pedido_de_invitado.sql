-- vincular_pedido_de_invitado (A2, 2026-09-24): al crear la cuenta desde la confirmación de un
-- pedido de invitado, reclamar el pedido y acreditarlo pasa en UNA transacción, por el mismo
-- camino que crear y confirmar (`aplicar_pedido_a_la_cuenta`). Antes eran pasos sueltos desde el
-- servidor —reclamar, sumar puntos, anotar historial y bono—, el bono se anotaba aunque la base
-- no lo hubiera otorgado, y si quien invitó ya había borrado su cuenta la clave foránea hacía
-- fallar la vinculación a medias (el pedido quedaba de la cuenta, sin sus puntos).
--
-- Devuelve {vinculado:false} si el pedido ya tenía dueño; si no, {vinculado:true, acreditado}
-- y, cuando se acreditó, lo que devuelve aplicar_pedido_a_la_cuenta.
create or replace function public.vincular_pedido_de_invitado(p_ref text, p_phone text, p_cuenta jsonb, p_rangos jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ord public.orders;
begin
  -- El filtro `customer_phone is null` es el reclamo: dos registros a la vez contra el mismo
  -- pedido, y solo el primero afecta una fila.
  update public.orders set customer_phone = p_phone
   where ref = p_ref and customer_phone is null
  returning * into v_ord;
  if not found then
    return jsonb_build_object('vinculado', false);
  end if;
  -- Solo lo que ya se cobró da puntos. Un Yape pendiente queda vinculado y los gana cuando el
  -- dueño lo confirme (confirmar_pago_manual ya sabe a qué cuenta va).
  if v_ord.payment_status = 'paid' and v_ord.status <> 'CANCELADO' and p_cuenta is not null then
    return public.aplicar_pedido_a_la_cuenta(p_cuenta || jsonb_build_object('phone', p_phone), v_ord.ref, p_rangos)
           || jsonb_build_object('vinculado', true, 'acreditado', true);
  end if;
  return jsonb_build_object('vinculado', true, 'acreditado', false);
end;
$function$;

revoke execute on function public.vincular_pedido_de_invitado(text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.vincular_pedido_de_invitado(text, text, jsonb, jsonb) to service_role;
