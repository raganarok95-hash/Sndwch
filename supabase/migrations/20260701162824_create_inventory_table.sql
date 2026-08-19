create table if not exists inventory (
  product_code text primary key,
  product_name text,
  in_stock boolean not null default true,
  updated_at text
);

alter table inventory enable row level security;

create policy "allow anon read inventory"
  on inventory for select
  using (true);

create policy "allow anon insert inventory"
  on inventory for insert
  with check (true);

create policy "allow anon update inventory"
  on inventory for update
  using (true);
