-- «Algo salió mal» (pantalla 35): reporte rápido de un pedido, dentro de las 48 h de la
-- entrega. Lo escribe solo el servidor (service role); RLS sin políticas cierra el acceso
-- con la anon key. Ver supabase/functions/api/actions/problems.ts.
create table if not exists public.order_problems (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  ref text not null,
  customer_phone text not null,
  motivo text not null check (motivo in ('falto','frio','distinto','otro')),
  detalle text,
  respond_by timestamptz not null,
  alerted boolean not null default false,
  resolved_at timestamptz,
  resolution text check (resolution in ('reposicion','credito','reembolso')),
  resolution_note text,
  resolved_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_problems_pendientes on public.order_problems(respond_by) where resolved_at is null;
create index if not exists idx_order_problems_cliente on public.order_problems(customer_phone);
-- Un solo reporte abierto por pedido.
create unique index if not exists uq_order_problems_abierto on public.order_problems(order_id) where resolved_at is null;
alter table public.order_problems enable row level security;

select cron.schedule(
  'sndwch-alert-order-problems',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://rjosezuoyngiadunfzyn.supabase.co/functions/v1/api',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := jsonb_build_object('action','alert-order-problems','cronSecret',(select decrypted_secret from vault.decrypted_secrets where name='sndwch_cron_secret'))
  );
  $$
);
