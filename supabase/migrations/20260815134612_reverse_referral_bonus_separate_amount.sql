-- Acompaña a referrer_bonus_separate_amount: ahora que quien invita recibe 720 puntos
-- (un 15CM gratis) y el referido 50, la reversión por cancelación tiene que descontar el
-- monto que de verdad se le dio a CADA UNO. Con el parámetro único anterior, cancelar el
-- primer pedido de un referido devolvía solo 50 de los 720 otorgados al que invitó — 670
-- puntos (≈ S/16 de valor canjeable) quedaban regalados por un pedido que nunca existió.
create or replace function public.reverse_referral_bonus(
  p_referred_phone text,
  p_referrer_phone text,
  p_bonus integer,
  p_referrer_bonus integer default null::integer
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.customers
  set points = greatest(0, points - p_bonus),
      referral_bonus_granted = false
  where phone = p_referred_phone;

  -- Sin p_referrer_bonus explícito se comporta igual que antes (mismo monto a ambos).
  update public.customers
  set points = greatest(0, points - coalesce(p_referrer_bonus, p_bonus)),
      total_referrals = greatest(0, total_referrals - 1)
  where phone = p_referrer_phone;
end;
$function$;

revoke all on function public.reverse_referral_bonus(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.reverse_referral_bonus(text, text, integer, integer) to service_role;
