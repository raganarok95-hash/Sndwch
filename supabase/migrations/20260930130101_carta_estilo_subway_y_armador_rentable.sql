-- CARTA AL ESTILO SUBWAY Y ARMADOR IGUAL DE RENTABLE QUE UN SIGNATURE (dueño, 2026-09-30).
-- 1) Precios del armador: la proteína absorbe pickles y jalapeño incluidos, y deja lo mismo que un
--    Signature promedio. La doble de albóndiga y la de res en 30CM suben lo mínimo para el techo de 45%.
update public.catalog_prices set values = values || jsonb_build_object('p15', 23.9, 'p30', 35.9), updated_at = now() where code = 'P04' and category = 'protein';
update public.catalog_prices set values = values || jsonb_build_object('p15', 23.9, 'p30', 35.9, 'pDbl', 6.9, 'pDbl30', 13.9), updated_at = now() where code = 'P06' and category = 'protein';
update public.catalog_prices set values = values || jsonb_build_object('p15', 24.9, 'p30', 36.9), updated_at = now() where code = 'P08' and category = 'protein';
update public.catalog_prices set values = values || jsonb_build_object('p15', 23.9, 'p30', 35.9, 'pDbl30', 13.9), updated_at = now() where code = 'P09' and category = 'protein';
-- 2) Sin aceituna (T05) y queso americano en vez de mozzarella: catalog_items es append-only, se
--    publica la fila vigente otra vez con el cambio.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
select item_id, name, subtitle, badge,
       replace(replace(pitch, 'con mozzarella derretida hasta el borde', 'con queso americano derretido hasta el borde'),
               'Embutidos italianos en pliegues, mozzarella,', 'Embutidos italianos en pliegues, queso americano,'),
       base, protein_id, tops - 'T05', sauces, price_15, price_30,
       fixed_cheese, cheese_optional, image_path, active, 'migracion-carta-estilo-subway'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id in ('SIG02', 'SIG11');
-- 3) El jalapeño deja de ser exclusivo del menú secreto: es lo picante del armador.
insert into public.secret_signature
  (name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids, min_orders, image_path, created_by, ends_at, hints, blurb)
select name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids - 'T04', min_orders, image_path,
       'migracion-carta-estilo-subway', ends_at, hints, blurb
from public.secret_signature order by created_at desc limit 1;
