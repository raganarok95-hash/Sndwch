-- DESCRIPCIONES QUE VENDEN (dueño, 2026-10-01: «deben ser más para venta, no vende nada»).
-- Cada una: el antojo, lo que se siente al morderlo y cuándo pedirlo. Nada que la receta no tenga.
-- catalog_items es append-only: se publica la fila vigente otra vez con el pitch nuevo.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
select item_id, name, subtitle, badge,
       case item_id
         when 'SIG09' then 'El clásico de Filadelfia, sin atajos: res laminada que se saltea en el momento con cebolla y pimiento, y cheddar que se funde encima hasta amarrarlo todo. Tan jugoso que no lleva salsa. Es el que pides cuando el hambre va en serio.'
         when 'SIG02' then 'Albóndigas cocidas en su propia marinara, queso americano derretido hasta el borde y un pan que aguanta todo el jugo. Caliente, contundente, de los que se comen con las dos manos. Para la noche en que ya decidiste no cocinar.'
         when 'SIG10' then 'Pavo horneado en lonjas finas con lechuga, tomate, cebolla y pimiento bien frescos, y un toque de aceite y vinagre que lo despierta. Llena sin pesar: el almuerzo que no te tumba la tarde.'
         when 'SIG12' then 'Atún en lascas gruesas con mayonesa y pimienta blanca, bajo una capa de cheddar fundido que se estira al primer mordisco. Cremoso, caliente y con todo el sabor del clásico americano.'
         when 'SIG11' then 'Tres embutidos italianos en pliegues, queso americano, verduras frescas y oil & vinegar. El sándwich de deli de toda la vida: cada capa suma sabor y ninguna sobra. Para cuando quieres de todo en un solo pan.'
         when 'SIG04' then 'Atún en lascas gruesas, nunca hecho pasta, con la mayonesa justa y pimienta blanca. Simple y bien hecho: no lleva nada suelto, así que se come con una mano, en el escritorio o en camino.'
       end,
       base, protein_id, tops, sauces, price_15, price_30,
       fixed_cheese, cheese_optional, image_path, active, 'migracion-descripciones-que-venden'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.item_id in ('SIG09', 'SIG02', 'SIG10', 'SIG12', 'SIG11', 'SIG04');
