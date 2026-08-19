create table public.store_hours (
  weekday int primary key check (weekday between 0 and 6),
  open_hour numeric,
  close_hour numeric,
  closed boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.store_hours is 'RLS: intentional default-deny, all access via service_role from the api edge function (get-store-hours is public read via that endpoint, not via anon/authenticated policies). Do not add anon/authenticated policies.';

alter table public.store_hours enable row level security;

insert into public.store_hours (weekday, open_hour, close_hour, closed) values
  (0, 11, 22, false),
  (1, 11, 22, false),
  (2, 11, 22, false),
  (3, 11, 22, false),
  (4, 11, 22, false),
  (5, 11, 22, false),
  (6, 11, 22, false);
