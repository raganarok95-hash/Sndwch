-- `catalog_prices` es la fuente de verdad en runtime (loadCatalogPrices sobreescribe los
-- literales de catalog.ts con esta tabla), pero nunca recibió las decisiones de precio que
-- el dueño aprobó y que SÍ se escribieron en código el 8-9 de agosto de 2026 — las filas
-- seguían con los valores del 8-23 de julio. Resultado: 7 decisiones ya tomadas llevaban
-- 2-3 semanas sin efecto real en producción, entre ellas el "+S/2 de curaduría" (evitar que
-- un Signature cueste exactamente lo mismo que armarlo en BUILD YOUR OWN) y la corrección
-- del precio del atún, marcada CRÍTICO en su propio comentario de código.
--
-- El caso más grave: SIG04 30CM estaba en S/25 mientras la misma receta armada en BYO
-- (P04 p30 = S/30) costaba S/5 MÁS — el Signature curado salía más barato que su propio
-- build, con margen real de ~39% contra el objetivo de 55% (45% de costo de insumos).
--
-- Valores anteriores, por si hace falta revertir:
--   SIG01 {p15:18,p30:22} · SIG02 {p15:19,p30:24} · SIG03 {p15:21,p30:30}
--   SIG04 {p15:16,p30:25} · SIG06 {p15:17,p30:21} · P06 {p15:14,p30:24,pDbl:7} · R03 {pts:270}
--
-- No se toca SIG05: su precio vive en `secret_signature` (rotación mensual) y
-- loadSecretSignature() corre DESPUÉS de loadCatalogPrices(), así que una fila aquí sería
-- ignorada. P07/SIG08 tampoco: sin fila, mandan los literales del código, que ya son los
-- correctos — y con el arreglo de upsert en actAdminCatalogSetPrice, el panel podrá
-- crearlas la primera vez que el dueño edite ese precio.
update public.catalog_prices set values = '{"p15":18,"p30":24}'::jsonb,        updated_at = now() where code = 'SIG01';
update public.catalog_prices set values = '{"p15":19,"p30":26}'::jsonb,        updated_at = now() where code = 'SIG02';
update public.catalog_prices set values = '{"p15":21,"p30":32}'::jsonb,        updated_at = now() where code = 'SIG03';
update public.catalog_prices set values = '{"p15":18,"p30":32}'::jsonb,        updated_at = now() where code = 'SIG04';
update public.catalog_prices set values = '{"p15":17,"p30":23}'::jsonb,        updated_at = now() where code = 'SIG06';
update public.catalog_prices set values = '{"p15":14,"p30":24,"pDbl":6}'::jsonb, updated_at = now() where code = 'P06';
update public.catalog_prices set values = '{"pts":320}'::jsonb,                updated_at = now() where code = 'R03';
