-- Lote E6 — higiene técnica y cumplimiento.

-- #88 — Auditoría de cuentas admin inactivas.
--
-- Hoy hay una sola cuenta admin, así que esto parece innecesario. Precisamente por eso se
-- pone AHORA: el día que haya tres y una sea de alguien que ya no trabaja acá, nadie va a
-- acordarse de revisarlo. Se marca en el LOGIN y no en cada petición — un write por request
-- admin sería un costo permanente para un dato que solo se mira una vez al mes.
alter table public.admin_accounts
  add column if not exists last_login_at timestamptz;

comment on column public.admin_accounts.last_login_at is
  'Ultimo inicio de sesion de esta cuenta admin (automatizacion #88). Se escribe en el login, no en cada peticion: el dato se mira una vez al mes y un write por request seria un costo permanente por nada.';

-- #97 — Alerta de crecimiento de la base.
--
-- El plan de Supabase de esta cuenta es `free`, con 500 MB de base. Topar ese límite no
-- degrada nada con aviso: la base pasa a solo-lectura y el negocio deja de tomar pedidos.
-- Enterarse el día que pasa es enterarse tarde.
--
-- `security definer` porque pg_database_size no es accesible con el rol normal, y con el
-- revoke de rigor: es el sexto caso del mismo defecto en este repo (una RPC definer sin
-- revoke queda llamable con la anon key).
create or replace function public.db_size_bytes()
returns bigint
language sql
security definer
set search_path to 'public'
as $$ select pg_database_size(current_database()) $$;

revoke execute on function public.db_size_bytes() from public, anon, authenticated;
grant execute on function public.db_size_bytes() to service_role;

-- Las tablas más pesadas, para que el aviso no sea solo "te estás quedando sin espacio"
-- sino "y es por esta tabla". Sin eso, el dueño no puede hacer nada al respecto.
create or replace function public.table_sizes(p_limit integer default 10)
returns table(table_name text, total_bytes bigint, row_estimate bigint)
language sql
security definer
set search_path to 'public'
as $$
  select c.relname::text,
         pg_total_relation_size(c.oid)::bigint,
         c.reltuples::bigint
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by pg_total_relation_size(c.oid) desc
  limit greatest(1, least(coalesce(p_limit, 10), 50))
$$;

revoke execute on function public.table_sizes(integer) from public, anon, authenticated;
grant execute on function public.table_sizes(integer) to service_role;
