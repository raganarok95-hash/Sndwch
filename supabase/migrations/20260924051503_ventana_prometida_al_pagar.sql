-- La hora de llegada que se le promete al cliente al crear el pedido (pantallas 30 G2,
-- 31, 06 y el «prometimos» del detalle). Se guarda para que lo prometido no se recalcule
-- después con otra cola. Ver ventanaPrometida() en supabase/functions/api/env.ts.
alter table public.orders add column if not exists promised_from timestamptz;
alter table public.orders add column if not exists promised_to timestamptz;
