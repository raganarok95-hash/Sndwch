alter table orders add column if not exists customer_email text;
alter table orders add column if not exists eta_minutes integer;
