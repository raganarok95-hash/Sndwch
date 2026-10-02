-- Un Signature puede no cobrar envío (dueño, 2026-10-02: «que para el prueba no se cobre el envío»).
-- Es una PROPIEDAD del producto, no un código: el envío sale 0 solo si TODO el carrito la tiene.
alter table public.catalog_items add column if not exists sin_envio boolean not null default false;
