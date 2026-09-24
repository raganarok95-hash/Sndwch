-- FOTOS DEL TURKEY (SIG10) Y DEL TUNA MELT (SIG12) (2026-09-24).
-- Salieron en la carta v4 sin foto (image_path null) y la tarjeta se veía vacía. Origen, licencia
-- y recorte en img/fuente/FUENTES.md. catalog_items es append-only: se publica la fila vigente
-- otra vez, idéntica salvo image_path. La ruta es la misma que declara _shared/carta.ts.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
select item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
       fixed_cheese, cheese_optional, 'img/' || lower(item_id) || '.jpg', active, 'migracion-fotos-sig10-sig12'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id in ('SIG10', 'SIG12') and vigente.image_path is null;
