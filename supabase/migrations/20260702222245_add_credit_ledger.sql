
-- Historial del crédito interno (regalos y usos) — a diferencia de los puntos,
-- esto se siente como dinero para el cliente, así que conviene dejar rastro.
create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  customer_phone text not null references public.customers(phone),
  delta numeric not null,
  reason text not null,
  related_phone text,
  created_at timestamptz not null default now()
);
alter table public.credit_ledger enable row level security;
