-- Decisión del dueño 2026-08-15: la escalera de recompensas devolvía 3-4x menos valor que
-- el benchmark de la categoría. R06 (sándwich gratis) costaba 720 pts = ~29 pedidos ≈ 7
-- meses para el primer premio grande, cuando la evidencia dice que la primera recompensa
-- debe llegar en 2-3 visitas. Chipotle devuelve ~8.8% del gasto y Starbucks ~7%; con 1
-- punto por sol, 720 pts por un 15CM de S/17.90 devolvía 2.4%.
--
--   R06  720 → 400 pts  (sándwich 15CM gratis)   → ~4.5% de retorno
--   R05  220 → 120 pts  (bebida gratis)          → ~3.3% de retorno
--
-- R02 (40, salsa extra) y R03/R04 (320, upgrades) quedan igual por ahora — R03 y R04
-- siguen empatados en 320 y son redundantes entre sí (ambos "mejora del mismo sándwich"),
-- pendiente de decidir si se fusionan.
--
-- IMPORTANTE: REFERRER_REWARD_POINTS en env.ts vale exactamente lo mismo que R06 (es "un
-- 15CM gratis" entregado como puntos), así que bajó de 720 a 400 en la misma sesión. Si
-- R06 vuelve a cambiar, ese número tiene que seguirlo.
update public.catalog_prices set values = '{"pts":120}'::jsonb, updated_at = now() where code = 'R05';
update public.catalog_prices set values = '{"pts":400}'::jsonb, updated_at = now() where code = 'R06';
