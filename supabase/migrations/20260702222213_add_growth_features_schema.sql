
-- Guarda la selección exacta del pedido (base/prot/tops/cheese/sauces/size/etc.)
-- para poder reconstruirlo con precisión: "repetir pedido" y "favoritos".
alter table public.orders add column if not exists build jsonb;

-- Crédito interno regalable (no retirable, no es dinero real) — saldo prepago.
alter table public.customers add column if not exists credit_balance numeric not null default 0;

-- Backfill: el código de referido de un cliente es simplemente su teléfono
-- (ya es único), así no hay riesgo de colisión al generarlo.
update public.customers set referral_code = phone where referral_code is null;

create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  order_ref text not null,
  customer_phone text,
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.ratings enable row level security;

create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  customer_phone text not null references public.customers(phone),
  name text not null,
  build jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.favorites enable row level security;

create table if not exists public.stock_notify (
  id bigint generated always as identity primary key,
  product_code text not null,
  customer_phone text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.stock_notify enable row level security;
