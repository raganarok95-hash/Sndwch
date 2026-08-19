alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;
