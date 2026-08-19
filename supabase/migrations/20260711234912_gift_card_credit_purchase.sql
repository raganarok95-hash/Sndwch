create table public.pending_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  buyer_phone text not null,
  buyer_name text not null,
  to_phone text not null,
  to_name text not null,
  amount numeric not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.pending_credit_purchases enable row level security;

create or replace function public.add_gifted_credit(p_to_phone text, p_amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_to numeric;
begin
  update public.customers set credit_balance = coalesce(credit_balance, 0) + p_amount
    where phone = p_to_phone
    returning credit_balance into v_to;
  if v_to is null then
    raise exception 'customer_not_found';
  end if;
end;
$$;
