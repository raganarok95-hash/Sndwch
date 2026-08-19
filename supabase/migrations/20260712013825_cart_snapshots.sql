create table public.cart_snapshots (
  customer_phone text primary key,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  reminded_at timestamptz
);
alter table public.cart_snapshots enable row level security;
