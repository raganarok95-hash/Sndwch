create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent','fixed')),
  value numeric not null check (value > 0),
  max_discount numeric,
  max_uses integer,
  uses_count integer not null default 0,
  min_order_total numeric not null default 0,
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  campaign_tag text,
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.promo_codes enable row level security;

create table public.promo_code_redemptions (
  id bigint generated always as identity primary key,
  promo_code_id uuid not null references public.promo_codes(id),
  code text not null,
  order_ref text not null unique,
  phone text not null,
  discount_applied numeric not null,
  created_at timestamptz not null default now()
);
create unique index promo_code_redemptions_promo_phone_key on public.promo_code_redemptions (promo_code_id, phone);
create index promo_code_redemptions_code_idx on public.promo_code_redemptions (code);
alter table public.promo_code_redemptions enable row level security;

alter table public.pending_charges add column promo_code_id uuid, add column promo_discount numeric not null default 0;

create or replace function public.redeem_promo_code(
  p_promo_id uuid,
  p_phone text,
  p_order_ref text,
  p_discount numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_uses integer;
  v_uses_count integer;
  v_code text;
begin
  select max_uses, uses_count, code into v_max_uses, v_uses_count, v_code
  from promo_codes
  where id = p_promo_id
  for update;

  if not found then
    raise exception 'promo_code_not_found';
  end if;

  if v_max_uses is not null and v_uses_count >= v_max_uses then
    raise exception 'promo_code_exhausted';
  end if;

  update promo_codes set uses_count = uses_count + 1 where id = p_promo_id;

  insert into promo_code_redemptions (promo_code_id, code, order_ref, phone, discount_applied)
  values (p_promo_id, v_code, p_order_ref, p_phone, p_discount);
end;
$$;
