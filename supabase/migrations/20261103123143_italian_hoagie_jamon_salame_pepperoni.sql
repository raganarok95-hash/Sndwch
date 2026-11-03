-- ITALIAN HOAGIE con trío nuevo (dueño, 2026-11-03, tarjeta: «Jamón ahumado, salame, pepperoni»).
-- Antes: jamón, cabanossi y paté a S/48/kg; el 30CM pasaba el techo de 45% (49%). Ahora ~39%.
-- catalog_items es append-only: se publica la fila vigente otra vez con el pitch nuevo.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by, sin_envio)
select item_id, name, subtitle, badge,
       'Jamón ahumado, salame y pepperoni en pliegues, queso americano, verduras frescas y oil & vinegar. El sándwich de deli de toda la vida: cada capa suma sabor y ninguna sobra. Para cuando quieres de todo en un solo pan.',
       base, protein_id, tops, sauces, price_15, price_30,
       fixed_cheese, cheese_optional, image_path, active, 'migracion-italian-hoagie-trio', sin_envio
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id = 'SIG11' and vigente.active;
