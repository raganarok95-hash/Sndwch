
alter table public.customers add column if not exists failed_login_count int not null default 0;
alter table public.customers add column if not exists locked_until timestamptz;
