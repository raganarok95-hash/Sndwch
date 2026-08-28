-- C1 — Dead-man switch de los crons.
--
-- EL HUECO REAL. pg_cron ya guarda si DISPARÓ cada job (cron.job_run_details), pero
-- net.http_post() vuelve al instante: "succeeded" ahí significa "se encoló la petición",
-- no "la edge function hizo su trabajo". Si el secreto de cron rota, o `api` empieza a
-- responder 500, los 20 jobs siguen marcando "succeeded" para siempre mientras NADA de lo
-- automatizado ocurre — recordatorios, expiración de cargos, conciliación de Culqi — y el
-- dueño se entera cuando un cliente reclama.
--
-- Este latido cierra el hueco desde el otro lado: `api` anota cada corrida de cron que
-- llega y termina bien. dead_cron_jobs() cruza las dos fuentes y devuelve los jobs que
-- DISPARARON varias veces sin que llegara un solo latido.
create table if not exists public.cron_heartbeats (
  action        text primary key,
  last_ok_at    timestamptz,
  last_error_at timestamptz,
  last_error    text,
  ok_runs       bigint not null default 0,
  error_runs    bigint not null default 0,
  -- Para no repetir la misma alerta cada hora mientras el problema sigue abierto.
  alerted_at    timestamptz
);
-- RLS activo y SIN policies = solo service_role, igual que el resto de las tablas
-- internas. Nada de esto le sirve a un cliente.
alter table public.cron_heartbeats enable row level security;

-- Escrito por `api` (index.ts) al final de CADA petición que trajo cronSecret válido, ok
-- o no. Es best-effort: si esto falla, la corrida del cron igual siguió su curso.
create or replace function public.record_cron_heartbeat(p_action text, p_ok boolean, p_error text default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.cron_heartbeats as h (action, last_ok_at, last_error_at, last_error, ok_runs, error_runs)
  values (
    p_action,
    case when p_ok then now() end,
    case when p_ok then null else now() end,
    case when p_ok then null else left(p_error, 400) end,
    case when p_ok then 1 else 0 end,
    case when p_ok then 0 else 1 end
  )
  on conflict (action) do update set
    last_ok_at    = case when p_ok then now()             else h.last_ok_at end,
    last_error_at = case when p_ok then h.last_error_at   else now() end,
    last_error    = case when p_ok then h.last_error      else left(p_error, 400) end,
    ok_runs       = h.ok_runs    + case when p_ok then 1 else 0 end,
    error_runs    = h.error_runs + case when p_ok then 0 else 1 end,
    -- Un latido bueno cierra la alerta: si vuelve a morir, se avisa de nuevo desde cero.
    alerted_at    = case when p_ok then null else h.alerted_at end;
$$;

-- Jobs que dispararon p_min_misses veces o más sin un solo latido bueno desde entonces.
-- El umbral existe para no despertar al dueño por un fallo transitorio: con 3, un job de
-- cada 3 minutos avisa a los ~9 minutos y uno diario recién al tercer día — proporcional
-- a lo seguido que corre cada uno, sin tener que escribir un plazo por job a mano.
--
-- Solo cubre los jobs que llaman a la función `api` con un `action` en el cuerpo: hoy son
-- 20 jobs / 19 acciones distintas (dos jobs comparten remind-peak-hour), y son justamente
-- donde existe el hueco y donde este repositorio controla el código que late. Los otros 6
-- quedan explícitamente fuera, no silenciosamente adentro dando siempre "muerto":
-- daily-summary, weekly-summary, birthday-bonus y winback-campaign son edge functions
-- aparte que no escriben latido, y cleanup-debug-logs/cleanup-rate-limits son SQL puro sin
-- ninguna llamada HTTP — para esos dos el estado que reporta pg_cron SÍ es la verdad.
create or replace function public.dead_cron_jobs(p_min_misses int default 3)
returns table (
  jobname     text,
  action      text,
  last_ok_at  timestamptz,
  fired_since bigint,
  last_error  text,
  alerted_at  timestamptz
)
language sql
security definer
set search_path = public, cron
as $$
  with jobs as (
    select
      j.jobid,
      j.jobname::text as jobname,
      substring(j.command from '''action''\s*,\s*''([a-z0-9-]+)''') as action
    from cron.job j
    where j.active
  )
  select
    jb.jobname,
    jb.action,
    h.last_ok_at,
    count(d.*) filter (where d.status = 'succeeded') as fired_since,
    h.last_error,
    h.alerted_at
  from jobs jb
  left join public.cron_heartbeats h on h.action = jb.action
  left join cron.job_run_details d
    on d.jobid = jb.jobid
   -- Sin latido previo se mira una ventana acotada, no toda la historia: la tabla guarda
   -- ~2 meses de corridas y contarlas enteras diría "muerto" por algo ya resuelto.
   and d.start_time > coalesce(h.last_ok_at, now() - interval '2 days')
  where jb.action is not null
  group by jb.jobname, jb.action, h.last_ok_at, h.last_error, h.alerted_at
  having count(d.*) filter (where d.status = 'succeeded') >= p_min_misses;
$$;

-- Marca que ya se avisó por este job, para que la alerta no se repita cada hora mientras
-- el problema sigue abierto. Crea la fila si el job nunca llegó a latir (justamente el
-- caso más grave: nunca funcionó).
create or replace function public.mark_cron_alerted(p_action text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.cron_heartbeats (action, alerted_at)
  values (p_action, now())
  on conflict (action) do update set alerted_at = now();
$$;

-- C2 — Pico de errores. debug_logs recibe todo fallo interno de `api`; en operación normal
-- son unos pocos por día (69 filas en el último mes). Un salto brusco es la señal más
-- temprana de que algo se rompió en producción, y hoy no la mira nadie: hay que entrar al
-- panel de Supabase a buscarla. Compara la última hora contra el promedio por hora de los
-- 7 días previos.
create or replace function public.error_spike(p_min_errors int default 10, p_factor numeric default 4)
returns table (last_hour bigint, baseline_per_hour numeric)
language sql
security definer
set search_path = public
as $$
  with h as (
    select count(*)::bigint as n from public.debug_logs where created_at > now() - interval '1 hour'
  ), b as (
    -- Se excluye la última hora del promedio: si no, el propio pico se diluye a sí mismo.
    select count(*)::numeric / (24 * 7) as per_hour
    from public.debug_logs
    where created_at > now() - interval '7 days' and created_at <= now() - interval '1 hour'
  )
  select h.n, round(b.per_hour, 2)
  from h, b
  -- p_min_errors es el piso absoluto: con un promedio cercano a cero, cualquier factor se
  -- dispara con 2 errores sueltos y la alerta deja de significar algo.
  where h.n >= p_min_errors and h.n >= greatest(b.per_hour * p_factor, p_min_errors);
$$;

-- Siembra: las 19 acciones que hoy existen arrancan con el latido en ahora. Sin esto, la
-- primera corrida del chequeo diría que TODOS están muertos — que es cierto en el sentido
-- literal (nunca latieron) pero inútil como aviso. El dead-man switch mide de acá para
-- adelante, no acusa el pasado.
insert into public.cron_heartbeats (action, last_ok_at)
select distinct substring(j.command from '''action''\s*,\s*''([a-z0-9-]+)''') as action, now()
from cron.job j
where j.active
  and substring(j.command from '''action''\s*,\s*''([a-z0-9-]+)''') is not null
on conflict (action) do nothing;
