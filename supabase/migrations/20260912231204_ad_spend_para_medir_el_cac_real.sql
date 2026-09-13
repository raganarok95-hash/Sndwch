-- SND//WCH — el gasto en publicidad, para que el CAC deje de ser un número de blog (2026-09-12)
--
-- POR QUÉ. `PREDICCION_V12.md` cuelga entero del CAC, y el CAC sale de tasas de agencia
-- (CPM S/5-12, CTR 2.97%, CVR 1.89%) que nadie auditó: de ahí un rango de S/10.51 a S/25.23,
-- que es la diferencia entre "la publicidad sostiene el negocio" y "lo desangra". Medirlo
-- exige dos números: cuánto se gastó y cuántos clientes NUEVOS llegaron sin venir de un
-- referido. El segundo la base ya lo tiene (`customers.created_at` + `referred_by`). El
-- primero no existía en ninguna parte.
--
-- ⚠ SE CARGA A MANO, y eso es una decisión, no una carencia. Leer el gasto de Meta por API
-- exige el permiso `ads_read` y un token de Marketing API — otro secret, otra revisión, y un
-- token con permiso de LECTURA DE FACTURACIÓN viviendo en el servidor. El dueño mira el
-- gasto en el panel de Meta de todos modos; transcribir un número al día es más barato que
-- todo eso, y no puede fallar en silencio.
--
-- UNIQUE (spend_date, platform): un día se corrige, no se duplica. Sin esto, volver a
-- escribir el gasto del martes lo sumaría dos veces y el CAC saldría al DOBLE — un error que
-- empuja a apagar una campaña que estaba sana.

create table if not exists public.ad_spend (
  id          bigint generated always as identity primary key,
  spend_date  date        not null,
  platform    text        not null default 'meta',
  amount      numeric(10,2) not null check (amount >= 0),
  note        text,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (spend_date, platform)
);

comment on table public.ad_spend is
  'Gasto diario en publicidad, cargado a mano por el dueño. Cruzado con los clientes nuevos '
  'sin referidor da el CAC real, que es lo único que convierte el modelo en una medición.';

-- Las consultas siempre son por rango de fecha reciente.
create index if not exists ad_spend_fecha_idx on public.ad_spend (spend_date desc);

-- Mismo criterio que catalog_items / inventory / debug_logs: RLS activo y CERO políticas, o
-- sea que solo la service role (la edge function) lo ve. Es información de costos del
-- negocio: no tiene por qué ser legible con la anon key.
alter table public.ad_spend enable row level security;
