-- CARTA v4 — LOS CLÁSICOS DE USA (decisión del dueño, 2026-09-24).
-- Costeo y precios: docs/MENU_CLASICOS_USA.md (v4) y modelo/menu_clasicos_usa.py.
-- Las filas de los Signatures y los precios se GENERARON desde supabase/functions/_shared/carta.ts
-- (la misma carta que usan cliente, servidor y modelo), no se escribieron a mano.
--
-- catalog_items y production_recipes son append-only: la fila vigente es la de id más alto por
-- código. Retirar = publicar la misma fila con active=false (la receta queda guardada).

-- 1 · Sale todo Signature público que no esté en la carta v4: misma fila vigente, active=false.
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
select item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
       fixed_cheese, cheese_optional, image_path, false, 'migracion-carta-v4'
from (select distinct on (item_id) * from public.catalog_items order by item_id, id desc) vigente
where vigente.active and vigente.item_id <> all (array['SIG09', 'SIG02', 'SIG10', 'SIG12', 'SIG11', 'SIG04']);

-- 2 · Los 6 de la carta v4, sin badges (decisión del dueño).
insert into public.catalog_items
  (item_id, name, subtitle, badge, pitch, base, protein_id, tops, sauces, price_15, price_30,
   fixed_cheese, cheese_optional, image_path, active, created_by)
values
  ('SIG09', 'Philly Cheesesteak', 'Signature', '', 'Res laminada fina, salteada al momento con cebolla y pimiento, y cheddar fundido encima. Sin salsa: no le hace falta.',
   'B01', 'P09', '["T10","T06"]', '[]', 22.90, 32.90, 'C02', false, 'img/sig09.jpg', true, 'migracion-carta-v4'),
  ('SIG02', 'Meatball Marinara', 'Signature', '', 'Para la noche en que ya decidiste que no vas a cocinar. Albóndigas hechas acá, cocidas dentro de su propia marinara, con mozzarella derretida hasta el borde. Se come con las dos manos y con servilleta al lado.',
   'B01', 'P06', '["T01","T03","T05"]', '["S06"]', 21.90, 28.90, 'C01', false, 'img/sig02.jpg', true, 'migracion-carta-v4'),
  ('SIG10', 'Turkey', 'Signature', '', 'Pavo horneado en lonjas finas, con lechuga, tomate, cebolla y pimiento, terminado con aceite y vinagre.',
   'B01', 'P08', '["T09","T01","T03","T06"]', '["S06"]', 23.90, 34.90, null, false, null, true, 'migracion-carta-v4'),
  ('SIG12', 'Tuna Melt', 'Signature', '', 'El Classic Tuna con cheddar fundido encima: atún en lascas gruesas, mayonesa y pimienta blanca, y el queso que lo junta todo.',
   'B01', 'P04', '[]', '[]', 22.90, 36.90, 'C02', false, null, true, 'migracion-carta-v4'),
  ('SIG11', 'Italian Hoagie', 'Signature', '', 'Embutidos italianos en pliegues, mozzarella, lechuga, tomate, cebolla y pimiento, con oil & vinegar, como en los delis de siempre.',
   'B01', 'P05', '["T09","T01","T03","T06"]', '["S06"]', 23.90, 33.90, 'C01', false, 'img/sig11.jpg', true, 'migracion-carta-v4'),
  ('SIG04', 'Classic Tuna', 'Signature', '', 'Para comer en el escritorio con una mano, sin que se desarme entre bocado y bocado: no lleva nada suelto adentro. Atún en lascas gruesas, nunca hecho pasta, con la mayonesa justa y pimienta blanca. Nada más.',
   'B01', 'P04', '[]', '[]', 20.90, 34.90, null, false, 'img/sig04.jpg', true, 'migracion-carta-v4');

-- 3 · Precios del armador: los de la carta. Sale lo que la carta ya no vende (P01 y P02).
insert into public.catalog_prices (code, category, values)
values
  ('P03', 'protein', '{"p15":13.9,"p30":23.9,"pDbl":6,"pDbl30":11}'),
  ('P04', 'protein', '{"p15":16.9,"p30":32.9,"pDbl":10.9,"pDbl30":21.9}'),
  ('P05', 'protein', '{"p15":16.9,"p30":32.9,"pDbl":9.9,"pDbl30":19.9}'),
  ('P06', 'protein', '{"p15":14.9,"p30":26.9,"pDbl":6,"pDbl30":12}'),
  ('P08', 'protein', '{"p15":15.9,"p30":28.9,"pDbl":9,"pDbl30":17}'),
  ('P09', 'protein', '{"p15":12.9,"p30":22.9,"pDbl":7,"pDbl30":13}')
on conflict (code) do update set values = excluded.values, updated_at = now();
delete from public.catalog_prices
 where category = 'protein' and code <> all (array['P03', 'P04', 'P05', 'P06', 'P08', 'P09']);

-- 4 · Recetas de cocina. Salen la res mechada (P01) y el pollo teriyaki (P02): misma fila vigente,
--     active=false. Entran la res laminada (P09) y la cebolla salteada (T10) del Philly.
--     ⚠ NO HAY PLANCHA (dueño, 2026-09-24): la res y la cebolla se saltean al momento en una
--     sartén grande. PRIMERA VERSIÓN: el rendimiento de la res (0.70) es supuesto y se corrige
--     con la primera tanda.
insert into public.production_recipes
  (recipe_code, name, yield_portions, portion_grams, ingredients, steps, notes, active, created_by)
select recipe_code, name, yield_portions, portion_grams, ingredients, steps, notes, false, 'migracion-carta-v4'
from (select distinct on (recipe_code) * from public.production_recipes order by recipe_code, id desc) vigente
where vigente.active and vigente.recipe_code in ('P01', 'P02');

insert into public.production_recipes
  (recipe_code, name, yield_portions, portion_grams, ingredients, steps, notes, active, created_by)
values
  ('P09', 'Res laminada (Philly)', 40, 85,
   '[{"item":"Res limpia (el corte cotizado a ~S/20/kg)","qty":5000,"unit":"g"},
     {"item":"Sal","qty":50,"unit":"g"},
     {"item":"Pimienta negra molida","qty":10,"unit":"g"},
     {"item":"Aceite vegetal (para la sartén, al pedido)","qty":100,"unit":"ml"}]',
   '[{"label":"Limpiar grasa dura y nervio; cortar en bloques de 1 kg","minutes":20},
     {"label":"Congelar los bloques hasta que estén firmes, no duros: es lo que deja laminar fino a cuchillo","minutes":90},
     {"label":"Laminar contra la fibra, lo más fino que salga (objetivo 2-3 mm)","minutes":30},
     {"label":"Porcionar en 115 g limpios crudos (quedan ~85 g salteados) y guardar en frío, sin sal","minutes":15},
     {"label":"Al pedido: sartén grande muy caliente con un hilo de aceite, la porción extendida en una sola capa, sal y pimienta al caer","minutes":2},
     {"label":"Voltear, separar con la espátula, juntar con la cebolla y el pimiento, y el cheddar encima hasta que se funda","minutes":1}]',
   'PRIMERA VERSIÓN (2026-09-24). Laminada en frío y salteada al momento en sartén grande: no hay plancha. Rendimiento supuesto 0.70 (limpieza 8% + salteado 24%): pesar lo que sale en la primera tanda y corregir rendimiento y porciones. La sal va recién en la sartén: salada antes suelta agua y se cuece en vez de sellar. Nunca más de dos porciones a la vez en la misma sartén: baja la temperatura y la res se hierve en su jugo.',
   true, 'migracion-carta-v4'),
  ('T10', 'Cebolla blanca salteada (Philly)', 40, 40,
   '[{"item":"Cebolla blanca","qty":2800,"unit":"g"},
     {"item":"Aceite vegetal","qty":60,"unit":"ml"},
     {"item":"Sal","qty":10,"unit":"g"}]',
   '[{"label":"Pelar y cortar en juliana gruesa (5 mm)","minutes":20},
     {"label":"Saltear en sartén grande a fuego medio-alto, moviendo, hasta que se dore en los bordes y quede blanda","minutes":15},
     {"label":"Salar al final, enfriar extendida y guardar tapada en frío","minutes":10}]',
   'PRIMERA VERSIÓN (2026-09-24). 70 g crudos por Philly quedan en ~40 g salteados. No es la cebolla morada en juliana del resto de la carta (T03): esta va cocida. Al pedido se recalienta en la misma sartén que la res.',
   true, 'migracion-carta-v4');
