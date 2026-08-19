alter table public.customers add column if not exists google_id text;
create unique index if not exists customers_google_id_idx on public.customers (google_id) where google_id is not null;
