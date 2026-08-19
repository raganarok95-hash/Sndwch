-- Decisión del dueño 2026-08-15: +S/0.90 exacto sobre cada precio de sándwich
-- (Signatures y proteínas de BUILD YOUR OWN). El insumo no cambia, así que el aumento va
-- casi íntegro a margen: sube la contribución modelada de S/11.35 a ~S/12.9 por pedido.
-- No se aplicó un % — es S/0.90 plano sobre cada precio, más simple y más suave.
--
-- Excepción decidida aparte: SIG07 THE CHICAGO. Cobraba S/25 en 15CM y S/25 en 30CM, o
-- sea el cliente pedía el doble de sándwich sin pagar nada extra (la tarjeta de upsell ni
-- se mostraba porque el delta era cero). Queda 15CM S/22 · 30CM S/29.90: escalón de
-- S/7.90, coherente con el +S/6-8 del resto del catálogo.
--
-- Bebidas (D06-D09) y adicionales (pDbl, salsa extra) NO se tocan: el tope de la promo de
-- hora valle es de S/4 y subir las bebidas a X.90 lo dejaría sin cubrir la bebida completa.
--
-- ESTA MIGRACIÓN ES LA QUE DE VERDAD CAMBIA EL PRECIO. Los literales de catalog.ts son
-- solo la semilla del primer arranque; loadCatalogPrices() carga esta tabla encima en cada
-- llamada (ver la advertencia de CLAUDE.md).
update public.catalog_prices set values = '{"p15":18.90,"p30":24.90}'::jsonb, updated_at = now() where code = 'SIG01';
update public.catalog_prices set values = '{"p15":19.90,"p30":26.90}'::jsonb, updated_at = now() where code = 'SIG02';
update public.catalog_prices set values = '{"p15":21.90,"p30":32.90}'::jsonb, updated_at = now() where code = 'SIG03';
update public.catalog_prices set values = '{"p15":18.90,"p30":32.90}'::jsonb, updated_at = now() where code = 'SIG04';
update public.catalog_prices set values = '{"p15":17.90,"p30":23.90}'::jsonb, updated_at = now() where code = 'SIG06';
update public.catalog_prices set values = '{"p15":22.00,"p30":29.90}'::jsonb, updated_at = now() where code = 'SIG07';

update public.catalog_prices set values = '{"p15":14.90,"p30":22.90,"pDbl":6}'::jsonb, updated_at = now() where code = 'P01';
update public.catalog_prices set values = '{"p15":13.90,"p30":21.90,"pDbl":6}'::jsonb, updated_at = now() where code = 'P02';
update public.catalog_prices set values = '{"p15":13.90,"p30":21.90,"pDbl":6}'::jsonb, updated_at = now() where code = 'P03';
update public.catalog_prices set values = '{"p15":16.90,"p30":30.90,"pDbl":9}'::jsonb, updated_at = now() where code = 'P04';
update public.catalog_prices set values = '{"p15":16.90,"p30":30.90,"pDbl":9}'::jsonb, updated_at = now() where code = 'P05';
update public.catalog_prices set values = '{"p15":14.90,"p30":24.90,"pDbl":6}'::jsonb, updated_at = now() where code = 'P06';

-- SIG08 (edición de apertura) no tiene fila en catalog_prices, así que su literal en
-- catalog.ts sí manda — no hace falta insertarla. SIG05 vive en `secret_signature` y su
-- precio se carga DESPUÉS de esta tabla, así que una fila acá sería ignorada.
