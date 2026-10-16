-- PRECIO NUEVO (dueño, 2026-10-16, tras el estudio de mercado de Trujillo, docs/MERCADO.md §7):
-- «1, 2 y 3, puntos aprobados» → el 15CM a S/19.90 y el 30CM a S/30.90 (sigue la regla de +S/11).
-- ARMA EL TUYO sigue costando lo mismo que el Signature de su proteína (regla del 2026-10-01).
-- El menú secreto y la doble porción no cambian.
update public.catalog_prices set values = values || jsonb_build_object('p15', 19.9, 'p30', 30.9), updated_at = now()
where category = 'protein' and code in ('P04', 'P06', 'P08', 'P09');
-- catalog_items es append-only: se publica la fila vigente otra vez con el precio nuevo.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
select item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, 19.90, 30.90,
       fixed_cheese, cheese_optional, image_path, active, 'migracion-precio-15cm-1990'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id in ('SIG02', 'SIG04', 'SIG09', 'SIG10', 'SIG11', 'SIG12') and vigente.active;
