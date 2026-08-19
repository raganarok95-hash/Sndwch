create table public.group_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  organizer_phone text not null,
  organizer_name text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.group_orders enable row level security;

create table public.group_order_items (
  id uuid primary key default gen_random_uuid(),
  group_order_id uuid not null references public.group_orders(id) on delete cascade,
  contributor_name text not null,
  item jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.group_order_items enable row level security;
create index group_order_items_group_order_id_idx on public.group_order_items(group_order_id);
