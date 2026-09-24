-- EL ESQUEMA DE `orders`, ARREGLADO ANTES DE ABRIR (2026-09-24, paso 6 de docs/REVISION_DE_LA_BASE.md).
--
-- Con cero pedidos en la base, cada uno de estos cambios es gratis hoy y una migración de datos
-- reales después de abrir.
--
-- 1. `delivery_time` pasa de TEXTO a fecha real. Los filtros `delivery_time=gte.<iso>` (capacidad
--    por hora, recordatorios de programados, vencimientos) comparaban TEXTO: funcionaban solo
--    mientras todas las fechas estuvieran escritas exactamente en el mismo formato.
-- 2. (Quitar las cuatro columnas de la app anterior va en OTRA migración, que se aplica al
--    mergear esta rama a `main`: el `api` desplegado hoy todavía las inserta al crear un pedido.
--    Ver supabase/migrations-al-mergear/.)
-- 3. `created_at` pasa a obligatoria. Admitía null, y el cálculo del lugar guardado del pedido
--    fijo (franja.ts) lo daba por hecho: lo mostraron los tipos generados en el paso 2.
-- 4. `items` siempre es una lista (nunca null, nunca otra forma de JSON).
-- 5. `id` sigue siendo texto, pero SIEMPRE con forma de uuid. No se cambia el tipo a uuid a
--    propósito: cada comparación de id en funciones y consultas habría que tocarla, y un id mal
--    formado que manda el cliente pasaría de «Pedido no encontrado» (404) a un error de tipo
--    (500). La restricción da la misma garantía —un solo formato de id— sin ese costo.

alter table public.orders
  alter column delivery_time type timestamptz using nullif(delivery_time, '')::timestamptz;

update public.orders set created_at = now() where created_at is null;
alter table public.orders alter column created_at set not null;

update public.orders set items = '[]'::jsonb where items is null;
alter table public.orders alter column items set default '[]'::jsonb;
alter table public.orders alter column items set not null;
alter table public.orders add constraint orders_items_es_lista check (jsonb_typeof(items) = 'array');

alter table public.orders add constraint orders_id_es_uuid
  check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
