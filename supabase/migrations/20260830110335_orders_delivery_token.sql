-- #19 — Confirmación de entrega por link.
--
-- Hoy el pedido pasa a ENTREGADO porque el dueño lo marca, y el dueño no está en la puerta:
-- está cocinando. Entre que el motorizado entrega y que alguien toca el botón pasan minutos
-- u horas, así que el cliente ve "EN CAMINO" cuando ya está comiendo, y el ETA, la alerta de
-- pedido estancado y el aviso de calificación se disparan todos contra una hora falsa.
--
-- El motorizado abre un link único y el pedido se cierra solo. El token es la autorización:
-- es un identificador no adivinable que solo recibe quien lleva ese pedido, el mismo criterio
-- que ya usa `ref` para que un invitado sin cuenta pueda ver o cancelar el suyo.
-- `delivered_at` YA EXISTÍA (la escribe actAdminAdvanceOrder y la lee weekly-summary): el
-- `if not exists` la deja intacta y acá solo se le pone el comentario que le faltaba. La
-- columna nueva es `delivery_token`.
alter table public.orders
  add column if not exists delivery_token text,
  add column if not exists delivered_at timestamptz;

comment on column public.orders.delivery_token is
  'Token no adivinable del link de confirmacion de entrega (automatizacion #19). Se genera al pasar a EN CAMINO y se BORRA al confirmar: el link es de un solo uso, asi un link reenviado no puede reabrir ni recerrar un pedido.';
comment on column public.orders.delivered_at is
  'Momento real de la entrega. Con el link de confirmacion (#19) por fin lo escribe quien entrega, no quien se acuerda de tocar el boton un rato despues.';

-- Buscar por token tiene que ser una busqueda, no un barrido: es un endpoint publico.
create unique index if not exists orders_delivery_token_idx
  on public.orders (delivery_token)
  where delivery_token is not null;
