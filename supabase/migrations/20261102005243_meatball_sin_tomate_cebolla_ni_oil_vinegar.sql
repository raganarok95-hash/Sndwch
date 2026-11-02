-- MEATBALL SIN TOMATE, CEBOLLA NI OIL & VINEGAR (dueño, 2026-11-02: «vi que tiene tomates y cebolla, los cuales
-- realmente no lleva» y «sí, quítale al Meatball»). Queda como se sirve: albóndigas en su marinara y queso americano.
-- catalog_items es append-only: se publica la fila vigente otra vez sin verduras ni salsas.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, sin_envio, created_by)
select item_id, name, subtitle, badge, pitch, base, protein_id, '[]'::jsonb, '[]'::jsonb, price_15, price_30,
       fixed_cheese, cheese_optional, image_path, active, sin_envio, 'migracion-meatball-sin-verduras'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id = 'SIG02';
