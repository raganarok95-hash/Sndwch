create table public.marketing_touches (
  id bigint generated always as identity primary key,
  customer_phone text not null,
  campaign_type text not null,
  channel text not null default 'push',
  sent_at timestamptz not null default now()
);
alter table public.marketing_touches enable row level security;
create index idx_marketing_touches_phone on public.marketing_touches (customer_phone);
create index idx_marketing_touches_campaign_sent on public.marketing_touches (campaign_type, sent_at);
