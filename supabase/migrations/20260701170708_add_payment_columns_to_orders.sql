alter table orders
  add column if not exists payment_status text default 'pending',
  add column if not exists payment_id text,
  add column if not exists payment_method text;
