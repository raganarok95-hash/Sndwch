create table app_settings (
  id boolean primary key default true,
  business_launched boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

insert into app_settings (id, business_launched) values (true, false);

alter table app_settings enable row level security;
-- Sin policies: acceso exclusivo vía service_role desde la función `api`, mismo patrón
-- que store_hours/catalog_prices (default-deny para anon/authenticated).
