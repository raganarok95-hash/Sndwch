-- Recordatorio al CLIENTE una hora antes de su pedido programado (automatización #27).
--
-- Ya existe `alerted_scheduled_reminder`, pero esa bandera es del aviso al NEGOCIO ("empieza
-- a prepararlo", 20 min antes). Este es el otro lado y con otro plazo: al cliente hay que
-- avisarle con tiempo suficiente para que llegue a casa, no cuando el pedido ya está en la
-- plancha. Reutilizar la misma bandera haría que uno de los dos avisos apagara al otro.
--
-- Por qué importa: un pedido programado se hace horas antes, y para cuando llega la hora el
-- cliente puede estar en la calle. Una entrega fallida cuesta el sándwich, el motorizado y
-- casi siempre el cliente.
alter table public.orders
  add column if not exists reminded_customer_scheduled boolean not null default false;

comment on column public.orders.reminded_customer_scheduled is
  'Ya se le recordó al CLIENTE su pedido programado (automatización #27). Distinta de alerted_scheduled_reminder, que es el aviso al negocio y con otro plazo.';
