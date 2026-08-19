drop function if exists public.claim_monthly_challenge(text, text, integer);

create or replace function public.claim_monthly_challenge(p_phone text, p_month text, p_bonus integer)
returns setof public.customers
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  update public.customers
  set challenge_claimed_month = p_month, points = points + p_bonus
  where phone = p_phone and (challenge_claimed_month is distinct from p_month)
  returning *;

  if not found then
    raise exception 'already_claimed';
  end if;
end;
$function$;
