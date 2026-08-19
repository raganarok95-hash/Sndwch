
-- Comprobante de pago Yape/Plin subido por el cliente (item 12 de la lista de fricción
-- Yape/Plin) — guarda solo la RUTA dentro del bucket privado, nunca una URL pública: el
-- admin la ve via una URL firmada de corta duración (ver actAdminReceiptUrl).
alter table public.orders add column if not exists receipt_path text;

-- Bucket privado (public=false) — el único acceso es via la SERVICE_ROLE key desde la
-- función edge api, igual que el resto de tablas de negocio (customers/orders/etc): no
-- se agregan políticas RLS para anon/authenticated sobre storage.objects a propósito.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
