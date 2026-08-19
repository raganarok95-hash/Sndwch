create table public.restock_notify_requests (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  sig_id text not null,
  created_at timestamptz not null default now(),
  unique (customer_phone, sig_id)
);
alter table public.restock_notify_requests enable row level security;
create index restock_notify_requests_sig_idx on public.restock_notify_requests (sig_id);
