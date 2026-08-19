-- Fix crítico: el bono de referido se otorgaba usando total_orders=0 como proxy de
-- "primer pedido" — pero total_orders puede volver a 0 tras una autocancelación
-- (actCancelMyOrder resta 1), y referred_by nunca se limpia, así que el bono se podía
-- volver a otorgar indefinidamente con "pedir con crédito → cancelar → repetir"
-- (hallazgo de auditoría de código, CRÍTICO). Reemplaza el proxy por un flag monotónico
-- que se otorga una sola vez en la vida del cliente, sin importar cuántas veces
-- total_orders suba o baje después.
alter table public.customers
  add column referral_bonus_granted boolean not null default false;

-- Backfill: bajo la semántica vieja, cualquier cliente con referred_by que ya completó
-- al menos un pedido pagado (total_orders > 0 hoy) ya recibió su bono en su momento.
update public.customers
set referral_bonus_granted = true
where referred_by is not null and total_orders > 0;
