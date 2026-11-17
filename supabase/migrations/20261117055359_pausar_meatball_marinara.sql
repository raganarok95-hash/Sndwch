-- Dueño, 2026-11-17: «Por las primeras semanas quitemos de disponibilidad las albóndigas».
-- catalog_items es append-only: la fila vigente es la de id más alto. Se agrega una copia de la
-- vigente de SIG02 con active=false. No se borra nada: para volver, se guarda desde el panel con
-- «activo» (o se inserta otra copia con active=true).
insert into public.catalog_items (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces,
  price_15, price_30, fixed_cheese, cheese_optional, image_path, active, created_by, sin_envio)
select item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces,
  price_15, price_30, fixed_cheese, cheese_optional, image_path, false, created_by, sin_envio
from public.catalog_items where item_id = 'SIG02' order by id desc limit 1;
