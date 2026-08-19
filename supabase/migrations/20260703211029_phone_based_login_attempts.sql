-- Rastrea intentos fallidos por número de teléfono directamente, sin importar si ese
-- teléfono tiene una cuenta o no. Antes, el conteo de intentos vivía en customers.* —
-- pero eso significaba que un teléfono SIN cuenta nunca se bloqueaba (siempre devolvía
-- "no encontrado" al instante), mientras que un teléfono CON cuenta sí se bloqueaba tras
-- varios intentos — esa diferencia de comportamiento (404 vs 429) permitía a alguien
-- probar teléfonos y deducir cuáles tienen cuenta registrada. Con esta tabla, ambos casos
-- se comportan exactamente igual desde afuera.
create table if not exists public.login_attempts (
  phone text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.login_attempts enable row level security;
-- Sin políticas para anon — como el resto de tablas sensibles, solo la edge function
-- (vía service role) la toca.

create or replace function public.register_login_failure(p_phone text, p_max_attempts int, p_lockout_minutes int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_count int;
begin
  insert into public.login_attempts (phone, failed_count, updated_at)
  values (p_phone, 1, now())
  on conflict (phone) do update
    set failed_count = login_attempts.failed_count + 1,
        updated_at = now()
  returning failed_count into v_count;

  if v_count >= p_max_attempts then
    update public.login_attempts
    set locked_until = now() + (p_lockout_minutes || ' minutes')::interval,
        failed_count = 0
    where phone = p_phone;
  end if;
end;
$$;

create or replace function public.reset_login_attempts(p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.login_attempts where phone = p_phone;
end;
$$;

create or replace function public.login_lockout_remaining_minutes(p_phone text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_locked_until timestamptz;
begin
  select locked_until into v_locked_until from public.login_attempts where phone = p_phone;
  if v_locked_until is null or v_locked_until <= now() then
    return null;
  end if;
  return ceil(extract(epoch from (v_locked_until - now())) / 60);
end;
$$;
