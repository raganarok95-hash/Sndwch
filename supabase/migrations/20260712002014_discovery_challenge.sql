alter table public.customers add column if not exists discovery_claimed_month text;

create or replace function public.claim_discovery_challenge(p_phone text, p_month text, p_bonus integer)
returns setof customers
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  return query
  update public.customers
  set discovery_claimed_month = p_month, points = points + p_bonus
  where phone = p_phone and (discovery_claimed_month is distinct from p_month)
  returning *;

  if not found then
    raise exception 'already_claimed';
  end if;
end;
$$;
