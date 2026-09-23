-- Un cobro hecho en Culqi queda ANOTADO en la reserva, en vez de devolverla a 'pending'.
--
-- Antes, tras cobrar, create-charge devolvía la reserva de 'charging' a 'pending' con un
-- PATCH cuyo error se tragaba. Si ese PATCH fallaba, la fila quedaba 'charging' con el dinero
-- ya cobrado: la confirmación respondía "ya fue procesado" (falso) y el cron de expiración la
-- trataba como abandonada, reponía el inventario y la marcaba 'expired'. Cobro sin pedido y
-- sin aviso. Y aunque el PATCH funcionara, 'pending' no distinguía "todavía no pagó" de "ya
-- pagó": un reintento del cliente volvía a reclamarla y cobraba DOS veces.
--
-- 'charged' + charge_id hacen que "ya se cobró" sea un estado de la base, no una suposición.
alter table public.pending_charges
  add column if not exists charge_id text,
  add column if not exists charged_at timestamptz,
  add column if not exists alerted_orphan_charge boolean not null default false;

alter table public.pending_charges drop constraint if exists pending_charges_status_check;
alter table public.pending_charges add constraint pending_charges_status_check
  check (status = any (array['pending','charging','charged','consumed','expired','cancelled']));

-- _shared/culqi-claim.ts es el mismo código para las dos tablas: sin estas columnas, el
-- PATCH a 'charged' fallaría en pending_weekly_plans (hoy retirado, pero compartido).
alter table public.pending_weekly_plans
  add column if not exists charge_id text,
  add column if not exists charged_at timestamptz;
