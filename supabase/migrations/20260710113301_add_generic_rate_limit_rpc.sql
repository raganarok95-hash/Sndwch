-- Limitador de tasa genérico por clave arbitraria (ej. 'complaint:51999999999' o
-- 'guest-manual-order:51999999999') — usado para frenar abuso en endpoints públicos que
-- NO tienen sesión y por lo tanto no pueden usar el bloqueo de login_attempts (hallazgo
-- de la re-auditoría de 10 agentes: submit-complaint y los pedidos con pago manual
-- Yape/Plin de invitados no tenían ningún límite, y este último además reserva/descuenta
-- inventario real de inmediato sin verificar pago).
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;
comment on table public.rate_limits is 'Contador de tasa por clave arbitraria, ventana deslizante fija. Solo accesible vía check_rate_limit (SECURITY DEFINER) — sin políticas para anon/authenticated, igual que login_attempts.';

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_minutes integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_count int; v_window_start timestamptz;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case when rate_limits.window_start <= now() - (p_window_minutes || ' minutes')::interval
                      then 1
                      else rate_limits.count + 1 end,
        window_start = case when rate_limits.window_start <= now() - (p_window_minutes || ' minutes')::interval
                             then now()
                             else rate_limits.window_start end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;
revoke all on function public.check_rate_limit(text, integer, integer) from public;
revoke execute on function public.check_rate_limit(text, integer, integer) from anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to postgres, service_role;

create or replace function public.cleanup_old_rate_limits()
returns void
language sql
security definer
set search_path to 'public'
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;
revoke all on function public.cleanup_old_rate_limits() from public;
revoke execute on function public.cleanup_old_rate_limits() from anon, authenticated;
grant execute on function public.cleanup_old_rate_limits() to postgres, service_role;
