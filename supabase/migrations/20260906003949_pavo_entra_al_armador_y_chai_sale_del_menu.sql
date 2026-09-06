-- Dos decisiones del dueño del 2026-09-06, en la misma migración porque son el mismo
-- movimiento: dejar el catálogo con lo que rinde.
--
-- 1) ENTRA P08 (PAVO // HORNEADO) como 4ta proteína de ARMA EL TUYO.
--    El armador había quedado con TRES al salir res y embutido por rentabilidad. Lo que hace
--    viable al pavo es que NO TIENE MERMA DE COCCIÓN: es fiambre, 1 kg comprado es 1 kg
--    servido, mientras res rinde 0.54 y pollo 0.64-0.69. Por eso una proteína más cara por
--    kilo que la res (S/44.20 contra S/20) sale MÁS BARATA por sándwich.
--      85 g = S/3.76 · 170 g = S/7.51
--    Con el piso fijo del armador (S/3.35 / S/5.41) el precio que deja el costo justo en el
--    techo de 45% es S/15.79 y S/28.72; se cobra S/15.90 y S/28.90 -> 44.7% en ambos tamaños.
--    pDbl 9 / pDbl30 17 se calcularon contra el costo REAL de la porción extra (41.8% y
--    44.2%), no copiando el de otra proteína: ese fue el defecto de P06.
--
-- 2) SALE D09 (THE SPICE // CHAI).
--    Costeado por BOTELLA DE MEDIO LITRO -el envase real ya comprado, no el vaso de 300 ml
--    que suponía el recetario- el chai queda en 42.5% de costo contra 19-32% de las tres
--    infusiones. Es la única bebida cerca del techo, y por un motivo estructural: media
--    botella de chai es media botella de LECHE, un insumo que se compra; en las otras tres el
--    volumen es agua. Era además la única con un insumo que no se puede stockear.
--
-- La fila se BORRA en vez de dejarse: loadCatalogPrices ya la ignoraría (D09 salió de
-- SIDE_PRICE), pero una fila viva para un código muerto es exactamente la segunda fuente de
-- verdad que en este repo ya costó tres semanas de precios fantasma.
insert into catalog_prices (code, category, values)
values ('P08', 'protein', '{"p15": 15.9, "p30": 28.9, "pDbl": 9, "pDbl30": 17}'::jsonb)
on conflict (code) do update
  set category = excluded.category, values = excluded.values, updated_at = now();

delete from catalog_prices where category = 'side' and code = 'D09';
