-- El equipo de marketing automático (docs/marketing/EQUIPO.md, aprobado por el dueño 2026-10-07).
-- Las piezas siguen viajando por marketing_calendar: es la tabla que el publicador
-- (auto-publish-calendar) ya sabe publicar. Se le agrega lo que el equipo necesita para trabajar.
alter table public.marketing_calendar
  add column if not exists plantilla text,
  add column if not exists gancho text,
  add column if not exists src text,
  add column if not exists rol text,
  add column if not exists revision text not null default 'pendiente',
  add column if not exists motivo_revision text,
  add column if not exists datos jsonb not null default '{}'::jsonb,
  add column if not exists metricas jsonb not null default '{}'::jsonb;
alter table public.marketing_calendar
  add constraint marketing_calendar_revision_check check (revision in ('pendiente', 'aprobada', 'bloqueada'));
-- Cada pieza lleva su propio ?src= para medir cuántos pedidos trajo: no puede repetirse.
create unique index if not exists marketing_calendar_src_unico on public.marketing_calendar (src) where src is not null;

-- El plan de la semana que deja el Director cada lunes.
create table if not exists public.marketing_plan (
  semana date primary key,
  objetivo text not null,
  presupuesto numeric(10, 2) not null default 0,
  temas jsonb not null default '[]'::jsonb,
  notas text,
  creado_por text not null default 'director',
  creado_at timestamptz not null default now()
);

-- La cola de Flow: el equipo en la nube encarga; la rutina de la laptop del dueño genera.
create table if not exists public.marketing_flow_cola (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.marketing_calendar(id) on delete set null,
  prompt text not null,
  personajes text[] not null default '{}',
  duracion_s int not null default 8,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'listo', 'fallo')),
  resultado_url text,
  error text,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);
create index if not exists marketing_flow_cola_estado_idx on public.marketing_flow_cola (estado, creado_at);

-- Visitas por origen y por día, sin datos personales: hoy no se sabe cuánta gente entra y no compra.
create table if not exists public.visitas_por_origen (
  dia date not null,
  src text not null,
  visitas int not null default 0,
  primary key (dia, src)
);

create or replace function public.registrar_visita(p_src text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visitas_por_origen (dia, src, visitas)
  values ((now() at time zone 'America/Lima')::date, left(coalesce(nullif(trim(p_src), ''), 'directo'), 60), 1)
  on conflict (dia, src) do update set visitas = public.visitas_por_origen.visitas + 1;
$$;
revoke execute on function public.registrar_visita(text) from public, anon, authenticated;

alter table public.marketing_plan enable row level security;
alter table public.marketing_flow_cola enable row level security;
alter table public.visitas_por_origen enable row level security;
revoke all on table public.marketing_plan, public.marketing_flow_cola, public.visitas_por_origen from anon, authenticated;
