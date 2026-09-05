-- El apio (T08) sale de THE FRESH (SIG04) — decisión del dueño 2026-09-05, junto con sacarlo
-- de ARMA EL TUYO. Con esto T08 deja de tener consumidor en todo el catálogo.
--
-- `catalog_items` es APPEND-ONLY: publicar inserta fila nueva y la de mayor id por item_id es
-- la vigente. Así el historial de la receta anterior queda gratis.
--
-- ⚠ EL PITCH SE REESCRIBE EN LA MISMA OPERACIÓN, y no es cosmético: el texto decía "con el
-- crocante fresco del apio". Sacar el ingrediente y dejar el texto convierte la tarjeta del
-- producto en una promesa falsa que nada en el código puede detectar — es la misma clase de
-- defecto que ya obligó a retirar los badges MÁS PEDIDO y EDICIÓN LIMITADA.
--
-- ⚠ QUEDA UN HUECO DE TEXTURA: THE FRESH se queda con tomate y pepinillo. El apio entró el
-- 2026-08-08 justamente porque a la receta le faltaba crocancia. El pepinillo aporta algo,
-- pero si el dueño quiere reponer volumen y frescura lo natural es T09 (Lechuga, 21 g, el
-- topping de mayor volumen al menor costo por gramo) — eso es una decisión de producto que
-- todavía NO está tomada, así que acá no se agrega nada.
insert into catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces,
   price_15, price_30, fixed_cheese, cheese_optional, image_path, active, created_by)
select
  item_id, name, subtitle, badge,
  'Atún premium con mayonesa clásica, con el chorrito de limón que corta la cremosidad y el carácter justo de la mostaza dijon. Fresco en cada bocado — ideal para cualquier hora del día.',
  base, protein_id,
  '["T01","T02"]'::jsonb,
  sauces, price_15, price_30, fixed_cheese, cheese_optional, image_path, active,
  'decision-dueno-2026-09-05'
from catalog_items
where item_id = 'SIG04'
order by id desc
limit 1;
