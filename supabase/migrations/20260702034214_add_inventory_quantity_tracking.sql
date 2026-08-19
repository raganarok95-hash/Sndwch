
alter table public.inventory add column if not exists stock_qty int;
alter table public.inventory add column if not exists low_stock_threshold int not null default 5;
