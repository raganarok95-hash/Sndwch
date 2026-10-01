-- PRECIOS PAREJOS (dueño, 2026-10-01: «Iguala los precios» · «Arréglalo»).
-- 1) De 15CM a 30CM son S/11 en todos (antes iba de +S/6 a +S/14 sin regla).
-- 2) ARMA EL TUYO cuesta lo mismo que el Signature de su proteína (atún = Tuna Melt, porque en el
--    armador el queso no se cobra). Antes era más caro que el Signature con la misma proteína.
-- Todo queda bajo el techo de 45% de costo (el más justo: pavo 30CM, 43.4%).
update public.catalog_prices set values = values || jsonb_build_object('p15', 22.9, 'p30', 33.9), updated_at = now() where code = 'P04' and category = 'protein';
update public.catalog_prices set values = values || jsonb_build_object('p15', 21.9, 'p30', 32.9), updated_at = now() where code = 'P06' and category = 'protein';
update public.catalog_prices set values = values || jsonb_build_object('p15', 23.9, 'p30', 34.9), updated_at = now() where code = 'P08' and category = 'protein';
update public.catalog_prices set values = values || jsonb_build_object('p15', 22.9, 'p30', 33.9), updated_at = now() where code = 'P09' and category = 'protein';
-- catalog_items es append-only: se publica la fila vigente otra vez con el precio nuevo.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
select item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15,
       case item_id when 'SIG09' then 33.90 when 'SIG02' then 32.90 when 'SIG12' then 33.90
                    when 'SIG11' then 34.90 when 'SIG04' then 31.90 end,
       fixed_cheese, cheese_optional, image_path, active, 'migracion-precios-parejos'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id in ('SIG09', 'SIG02', 'SIG12', 'SIG11', 'SIG04');
insert into public.secret_signature
  (name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids, min_orders, image_path, created_by, ends_at, hints, blurb)
select name, base, protein_id, tops, sauces, price_15, 35.90, vault_only_ids, min_orders, image_path,
       'migracion-precios-parejos', ends_at, hints, blurb
from public.secret_signature order by created_at desc limit 1;
