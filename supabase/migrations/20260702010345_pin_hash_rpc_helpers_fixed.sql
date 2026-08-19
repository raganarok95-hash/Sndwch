
update public.customers
set pin = extensions.crypt(pin, extensions.gen_salt('bf'))
where pin is not null and pin !~ '^\$2[aby]\$';

create or replace function public.hash_pin(plain text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select extensions.crypt(plain, extensions.gen_salt('bf'));
$$;

create or replace function public.verify_pin(p_phone text, plain text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists(
    select 1 from public.customers
    where phone = p_phone and pin = extensions.crypt(plain, pin)
  );
$$;

revoke all on function public.hash_pin(text) from public, anon, authenticated;
revoke all on function public.verify_pin(text, text) from public, anon, authenticated;
grant execute on function public.hash_pin(text) to service_role;
grant execute on function public.verify_pin(text, text) to service_role;
