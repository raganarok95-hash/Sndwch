-- Libro de Reclamaciones Virtual — exigido por el Código de Protección y Defensa del
-- Consumidor (D.S. 011-2011-PCM y modificatorias) para todo establecimiento comercial en
-- Perú. Debe ser propio del sitio (no un formulario externo ni un archivo de Drive) y
-- generar un código de reclamo correlativo entregado al consumidor.
create table public.complaints (
  id bigint generated always as identity primary key,
  claim_code text not null unique,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('reclamo','queja')),
  consumer_name text not null,
  consumer_dni text not null,
  consumer_address text not null,
  consumer_phone text not null,
  consumer_email text not null,
  is_minor boolean not null default false,
  guardian_name text,
  order_ref text,
  claimed_amount numeric,
  detail text not null,
  consumer_request text not null,
  status text not null default 'pendiente' check (status in ('pendiente','atendido')),
  provider_response text,
  responded_at timestamptz,
  responded_by text
);
create index complaints_status_idx on public.complaints (status, created_at desc);

alter table public.complaints enable row level security;
comment on table public.complaints is 'RLS: intentional default-deny, all access via service_role from the api edge function (submit-complaint is public write via that endpoint, not via anon/authenticated policies). Do not add anon/authenticated policies.';
