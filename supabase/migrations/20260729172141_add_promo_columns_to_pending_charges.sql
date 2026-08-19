alter table public.pending_charges
  add column if not exists promo_code_id uuid references public.promo_codes(id),
  add column if not exists promo_discount numeric not null default 0;
