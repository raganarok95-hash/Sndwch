-- Cada regalo de crédito quedaba anotado DOS veces en credit_ledger.
--
-- gift_credit y redeem_points_for_gift_credit ya escribían sus filas del libro dentro de la
-- transacción (con motivos en clave: 'gift_sent', 'gift_received', 'gift_card_received'), y
-- actCreditGift / actGiftCardPurchase las volvían a escribir DESPUÉS, fuera de la
-- transacción, con texto legible. Un regalo de S/10 dejaba dos débitos de S/10 en el
-- historial que el dueño ve en el detalle del cliente. Y como la segunda escritura iba
-- fuera, si fallaba el cliente veía un error con el saldo ya movido, y podía reintentar.
--
-- Queda una sola escritura, la de adentro de la transacción, con el texto que se muestra.
-- El código deja de escribir (ver customer.ts).
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
  values (p_from, -p_amount, 'Regalo enviado', p_to),
         (p_to, p_amount, 'Regalo recibido', p_from);
end;
$function$;

revoke execute on function public.gift_credit(text, text, numeric) from public, anon, authenticated;

create or replace function public.redeem_points_for_gift_credit(p_from text, p_to text, p_points integer, p_credit_amount numeric)
 returns void
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
  values (p_to, p_credit_amount, 'Tarjeta de regalo recibida', p_from);
end;
$function$;

revoke execute on function public.redeem_points_for_gift_credit(text, text, integer, numeric) from public, anon, authenticated;
