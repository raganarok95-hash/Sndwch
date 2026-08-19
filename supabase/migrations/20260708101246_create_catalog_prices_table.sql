-- Antes cambiar un precio requería editar el mismo número en 2 lugares (index.html Y la
-- función api) y redesplegar ambos. Esta tabla es la única fuente de verdad para los
-- NÚMEROS de precio — nombres/ingredientes/descripciones siguen hardcodeados (cambian
-- con mucha menos frecuencia y necesitan criterio de un developer de todas formas).
-- `values` es jsonb porque cada categoría tiene una forma distinta:
--   protein: {"p15":14,"p30":22,"pDbl":6}   (build-your-own, tamaño 15/30cm + doble)
--   sig:     {"p15":18,"p30":22}             (Signature builds, sin campo pDbl propio —
--                                             el recargo de doble proteína usa el de su
--                                             proteína base, ver priceCartItem)
--   side:    {"price":5}                     (bebidas/sides, precio único)
--   reward:  {"pts":40}                      (costo en puntos de una recompensa)
create table public.catalog_prices (
  code text primary key,
  category text not null check (category in ('protein','sig','side','reward')),
  values jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.catalog_prices enable row level security;
comment on table public.catalog_prices is 'RLS: intentional default-deny, all access via service_role from the api edge function (get-catalog is public read via that endpoint, not via anon/authenticated policies). Do not add anon/authenticated policies.';

insert into public.catalog_prices (code, category, values) values
  ('P01','protein','{"p15":14,"p30":22,"pDbl":6}'),
  ('P02','protein','{"p15":13,"p30":21,"pDbl":6}'),
  ('P03','protein','{"p15":12,"p30":20,"pDbl":4}'),
  ('P04','protein','{"p15":12,"p30":20,"pDbl":5}'),
  ('P05','protein','{"p15":16,"p30":26,"pDbl":9}'),
  ('P06','protein','{"p15":14,"p30":24,"pDbl":7}'),
  ('SIG01','sig','{"p15":18,"p30":22}'),
  ('SIG02','sig','{"p15":19,"p30":24}'),
  ('SIG03','sig','{"p15":21,"p30":26}'),
  ('SIG04','sig','{"p15":16,"p30":20}'),
  ('D01','side','{"price":5}'),
  ('D02','side','{"price":5}'),
  ('D03','side','{"price":3}'),
  ('D04','side','{"price":4}'),
  ('D05','side','{"price":3}'),
  ('R01','reward','{"pts":40}'),
  ('R02','reward','{"pts":80}'),
  ('R03','reward','{"pts":140}'),
  ('R04','reward','{"pts":180}'),
  ('R05','reward','{"pts":250}'),
  ('R06','reward','{"pts":400}');
