create table public.pending_weekly_plans (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  buyer_phone text not null,
  buyer_name text not null,
  amount_paid numeric not null,
  credit_amount numeric not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.pending_weekly_plans enable row level security;
create index pending_weekly_plans_buyer_status_idx on public.pending_weekly_plans (buyer_phone, status);
