-- Maqueta 34 · Dónde te lo dejamos: cada dirección guardada trae su referencia («timbre 302,
-- portón negro»), y quien cae fuera de cobertura queda anotado para avisarle cuando se abra
-- su zona («te avisamos apenas abramos la zona»). Ver actions/zones.ts.
alter table public.saved_addresses add column if not exists reference text;

create table if not exists public.zone_waitlist (
  id bigint generated always as identity primary key,
  customer_phone text not null,
  district text not null,
  lat double precision,
  lon double precision,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
create unique index if not exists uq_zone_waitlist_pendiente on public.zone_waitlist(customer_phone, district) where notified_at is null;
create index if not exists idx_zone_waitlist_district on public.zone_waitlist(district) where notified_at is null;
alter table public.zone_waitlist enable row level security;
