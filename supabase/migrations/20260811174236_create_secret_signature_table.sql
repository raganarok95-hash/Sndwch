create table public.secret_signature (
  id bigint generated always as identity primary key,
  name text not null,
  base text not null,
  protein_id text not null,
  tops jsonb not null default '[]'::jsonb,
  sauces jsonb not null default '[]'::jsonb,
  price_15 numeric not null,
  price_30 numeric not null,
  vault_only_ids jsonb not null default '[]'::jsonb,
  min_orders integer not null default 5,
  image_path text,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.secret_signature enable row level security;
-- Sin policies a propósito (mismo criterio que catalog_prices/store_hours): solo el
-- service role de las edge functions puede leer/escribir esta tabla — nunca expuesta
-- directo a un cliente anon vía PostgREST, ni siquiera de solo lectura, porque contiene
-- la composición real del menú secreto (lo que get-catalog SÍ expone es un subconjunto
-- curado, nunca la fila completa).

insert into public.secret_signature (name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids, min_orders, image_path, created_by)
values (
  'The Vault',
  'B03',
  'P03',
  '["T04","T06","T03"]'::jsonb,
  '["S02","S12"]'::jsonb,
  24,
  30,
  '["P03","T04","S02","S12"]'::jsonb,
  5,
  'img/sig05.jpg',
  'migration-seed'
);
