-- El pin GPS que el cliente confirma en el mapa del checkout ahora sí viaja al servidor.
-- `orders` ya tenía lat/lon (siempre vacías porque nadie las mandaba); `pending_charges`
-- es la reserva intermedia del camino Culqi, así que necesita cargarlas para que el
-- pedido resultante no pierda la ubicación al confirmarse el cobro.
alter table public.pending_charges
  add column if not exists lat double precision,
  add column if not exists lon double precision;
