-- CLASSIC TUNA SIN «SE COME CON UNA MANO» (dueño, 2026-11-01: «cambia totalmente lo de se come con una mano, no tiene
-- sentido, cámbialo y revisa todo»). El pitch habla de sabor y textura, como el post de Instagram («Cremoso y en lascas.»).
-- catalog_items es append-only: se publica la fila vigente otra vez con el pitch nuevo.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, sin_envio, created_by)
select item_id, name, subtitle, badge,
       'Atún en lascas gruesas, nunca hecho pasta, con la mayonesa justa y pimienta blanca. Cremoso, simple y bien hecho.',
       base, protein_id, tops, sauces, price_15, price_30,
       fixed_cheese, cheese_optional, image_path, active, sin_envio, 'migracion-classic-tuna-sin-una-mano'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id = 'SIG04';
