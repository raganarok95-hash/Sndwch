-- Operativo, 2026-11-10 (docs/entregas/app/2026-11-10-stock-minimo-de-operativo.md); Ezra, 2026-11-11, en la tarjeta: «Sí, ponlos».
-- Umbral de «stock bajo» y días que dura cada porción. Sin fila, la app usaba 5. stock_qty queda null (sin control)
-- hasta que el dueño cargue con cuántas abre; cargar stock no toca el umbral.
insert into public.inventory (product_code, product_name, in_stock, stock_qty, low_stock_threshold, shelf_life_days) values
  ('P09', 'Res // Laminada', true, null, 2, 3),
  ('P06', 'Albóndiga // Marinara', true, null, 1, 3),
  ('P04', 'Atún // House', true, null, 1, 3),
  ('P08', 'Pavo // Horneado', true, null, 1, 3),
  ('P05', 'Embutido // Italiano', true, null, 1, 3)
on conflict (product_code) do update
  set low_stock_threshold = excluded.low_stock_threshold,
      shelf_life_days = excluded.shelf_life_days;
