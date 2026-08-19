-- Nuevo catálogo de bebidas de la casa (D06-D09) — no jugos, distintas a lo que
-- venden las juguerías, decididas junto al dueño. Se seedean acá para que el editor
-- de precios del panel admin (admin-catalog-set-price) pueda hacer UPDATE sobre estas
-- filas igual que con D01-D05 (el endpoint hace PATCH, no upsert, así que sin esta fila
-- ya existente un cambio de precio desde el panel no se guardaría en silencio).
insert into public.catalog_prices (code, category, values) values
  ('D06', 'side', '{"price": 4}'::jsonb),
  ('D07', 'side', '{"price": 3}'::jsonb),
  ('D08', 'side', '{"price": 4}'::jsonb),
  ('D09', 'side', '{"price": 6}'::jsonb)
on conflict (code) do nothing;
