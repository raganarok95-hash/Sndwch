-- Para poder detectar un pedido colgado a mitad del flujo hace falta saber CUÁNDO entró a
-- su estado actual. `created_at` no sirve (mide desde que se hizo el pedido, no desde el
-- último avance) y no existe ninguna columna updated_at en esta tabla. Se rellena con
-- created_at para las filas existentes: es el valor correcto para un pedido que nunca
-- avanzó, y para los que sí, la primera actualización real lo corrige.
alter table public.orders add column if not exists status_changed_at timestamptz;
update public.orders set status_changed_at = created_at where status_changed_at is null;
create index if not exists orders_status_changed_at_idx on public.orders (status, status_changed_at);
