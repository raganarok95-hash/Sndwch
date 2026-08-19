-- FKs on the highest-value tables that were missing them
alter table public.orders
  add constraint orders_customer_phone_fkey foreign key (customer_phone) references public.customers(phone);

alter table public.ratings
  add constraint ratings_customer_phone_fkey foreign key (customer_phone) references public.customers(phone);

-- Indexes on FK/filter columns that lacked them
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_transactions_customer_phone on public.transactions(customer_phone);
create index if not exists idx_favorites_customer_phone on public.favorites(customer_phone);
create index if not exists idx_saved_addresses_customer_phone on public.saved_addresses(customer_phone);
create index if not exists idx_credit_ledger_customer_phone on public.credit_ledger(customer_phone);
create index if not exists idx_ratings_customer_phone on public.ratings(customer_phone);

-- Document the default-deny RLS pattern so it isn't accidentally "helped" later
comment on table public.customers is 'RLS: intentional default-deny, all access via service_role/RPC from the api edge function. Do not add anon/authenticated policies.';
comment on table public.orders is 'RLS: intentional default-deny, all access via service_role/RPC from the api edge function. Do not add anon/authenticated policies.';
comment on table public.transactions is 'RLS: intentional default-deny, all access via service_role/RPC from the api edge function. Do not add anon/authenticated policies.';

-- Staff/admin action audit trail (who did what sensitive action)
create table public.admin_action_log (
  id bigint generated always as identity primary key,
  actor_phone text not null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_action_log enable row level security;
comment on table public.admin_action_log is 'RLS: intentional default-deny, all access via service_role from the api edge function. Do not add anon/authenticated policies.';
create index idx_admin_action_log_actor on public.admin_action_log(actor_phone);
create index idx_admin_action_log_created_at on public.admin_action_log(created_at);
