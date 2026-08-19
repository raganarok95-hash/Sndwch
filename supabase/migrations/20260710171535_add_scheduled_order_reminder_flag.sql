alter table public.orders add column if not exists alerted_scheduled_reminder boolean not null default false;
comment on column public.orders.alerted_scheduled_reminder is 'Evita reenviar el recordatorio de cocina para un pedido programado (ver actAlertScheduledOrders) más de una vez.';
