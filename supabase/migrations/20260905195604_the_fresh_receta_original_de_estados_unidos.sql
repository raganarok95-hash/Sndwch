-- THE FRESH (SIG04) vuelve a la receta original de Estados Unidos — decisión del dueño
-- 2026-09-05: atún ESCURRIDO, mayonesa y pimienta. Nada más.
--
-- Por eso `tops` y `sauces` quedan VACÍOS, y no es un descuido:
--   · la mayonesa ya está dentro de P04 ("Atún premium con mayonesa clásica"),
--   · la pimienta es parte de la preparación de P04, no un ítem del catálogo — su costo es
--     despreciable y ya está dentro del insumo (se documenta en RECETARIO.md),
--   · la lechuga NO entra: el dueño la descartó de la receta. Quien la quiera, la arma.
--
-- `catalog_items` es APPEND-ONLY: esto inserta fila nueva y la de mayor id por item_id es la
-- vigente, así el historial de la receta anterior queda gratis.
--
-- ⚠ EL PITCH SE REESCRIBE EN LA MISMA OPERACIÓN. El anterior nombraba apio, limón y mostaza
-- dijon; ninguno de los tres sigue en la receta. Un texto que promete ingredientes que ya no
-- están es una promesa falsa que nada en el código puede detectar — la misma clase de defecto
-- que ya obligó a retirar los badges MÁS PEDIDO y EDICIÓN LIMITADA.
insert into catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces,
   price_15, price_30, fixed_cheese, cheese_optional, image_path, active, created_by)
select
  item_id, name, subtitle, badge,
  'Atún premium escurrido, con la mayonesa de la receta original y un golpe de pimienta. Nada más: así es como se hace en Estados Unidos, y así es como debe saber.',
  base, protein_id,
  '[]'::jsonb,
  '[]'::jsonb,
  price_15, price_30, fixed_cheese, cheese_optional, image_path, active,
  'decision-dueno-2026-09-05'
from catalog_items
where item_id = 'SIG04'
order by id desc
limit 1;
