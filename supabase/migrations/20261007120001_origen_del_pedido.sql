-- De dónde vino cada pedido (?src= del enlace: un video, un anuncio, Google, Rappi, un referido).
-- Hasta hoy solo se guardaba al CREAR CUENTA (customers.acquisition_source), así que el pedido de
-- invitado —el camino principal— no se atribuía a nada. El equipo de marketing mide con esto.
alter table public.orders add column if not exists origen text;
create index if not exists orders_origen_idx on public.orders (origen) where origen is not null;
