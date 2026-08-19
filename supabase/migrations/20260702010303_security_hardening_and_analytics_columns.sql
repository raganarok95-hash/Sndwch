
-- 1. Enable pgcrypto for bcrypt-style PIN hashing
create extension if not exists pgcrypto;

-- 2. Hash any existing plaintext PINs (skip if already hashed)
update public.customers
set pin = crypt(pin, gen_salt('bf'))
where pin is not null and pin !~ '^\$2[aby]\$';

-- 3. Analytics columns on orders (structured product info for dashboard aggregation)
alter table public.orders add column if not exists mode text;
alter table public.orders add column if not exists product_key text;

-- 4. Enable RLS with NO anon/authenticated policies.
--    All access to these tables now goes exclusively through the `api` edge function,
--    which uses the service_role key (service_role always bypasses RLS).
--    This seals customer PIN/DNI/birthday, admin identities, order PII and the points ledger
--    from direct reads/writes via the public anon key embedded in the client.
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.orders enable row level security;
alter table public.admin_accounts enable row level security;
alter table public.saved_addresses enable row level security;

-- 5. Inventory stays publicly readable (shoppers need to see stock), but only
--    admins (via the api edge function) should be able to change it — anyone
--    with devtools could otherwise mark the whole menu "agotado".
drop policy if exists "allow anon update inventory" on public.inventory;
drop policy if exists "allow anon insert inventory" on public.inventory;
