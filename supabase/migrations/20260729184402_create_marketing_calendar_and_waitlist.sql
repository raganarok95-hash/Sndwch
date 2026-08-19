
create table if not exists marketing_calendar (
  id uuid primary key default gen_random_uuid(),
  scheduled_date date not null,
  channel text not null,
  status text not null default 'draft',
  title text not null,
  caption_text text,
  whatsapp_text text,
  photo_idea text,
  campaign_tag text,
  created_by text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table marketing_calendar enable row level security;

create index if not exists marketing_calendar_scheduled_date_idx on marketing_calendar (scheduled_date);
create index if not exists marketing_calendar_status_idx on marketing_calendar (status);

create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  source text,
  created_at timestamptz not null default now()
);

alter table waitlist_signups enable row level security;

create unique index if not exists waitlist_signups_phone_key on waitlist_signups (phone);
