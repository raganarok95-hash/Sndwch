-- Subida de margen del 2026-08-22 (decisión del dueño), aplicada a catalog_prices, que es
-- la fuente de verdad en runtime: los literales de catalog.ts solo son la semilla del
-- primer arranque y NUNCA se usan para cobrar si el código tiene fila acá.
--
-- 1) Signatures +S/2 en ambos tamaños. Ambos tamaños a propósito: R03 ("SUBE A 30CM //
--    GRATIS") perdona la diferencia p30-p15, así que subir solo uno cambiaría el valor de
--    esa recompensa sin que nadie lo pidiera.
UPDATE catalog_prices SET values = '{"p15":20.9,"p30":26.9}'::jsonb WHERE category='sig' AND code='SIG01';
UPDATE catalog_prices SET values = '{"p15":21.9,"p30":28.9}'::jsonb WHERE category='sig' AND code='SIG02';
UPDATE catalog_prices SET values = '{"p15":23.9,"p30":34.9}'::jsonb WHERE category='sig' AND code='SIG03';
UPDATE catalog_prices SET values = '{"p15":20.9,"p30":34.9}'::jsonb WHERE category='sig' AND code='SIG04';
UPDATE catalog_prices SET values = '{"p15":19.9,"p30":25.9}'::jsonb WHERE category='sig' AND code='SIG06';

-- 2) Bebidas +S/2, y +S/3 el chai (es el único con costo de insumo alto de verdad).
--    El margen de 61-84% que se venía usando costeaba solo el insumo, nunca el envase.
UPDATE catalog_prices SET values = '{"price":6}'::jsonb WHERE category='side' AND code='D06';
UPDATE catalog_prices SET values = '{"price":5}'::jsonb WHERE category='side' AND code='D07';
UPDATE catalog_prices SET values = '{"price":6}'::jsonb WHERE category='side' AND code='D08';
UPDATE catalog_prices SET values = '{"price":9}'::jsonb WHERE category='side' AND code='D09';

-- 3) El recargo de doble proteína deja de ser plano: pDbl (15CM) + pDbl30 (30CM). La
--    porción que agrega el doble escala con el tamaño y el recargo no lo hacía, así que en
--    30CM costaba más de lo que cobraba en 3 de 4 proteínas (res 105%, embutido 95%,
--    pollo 83% del precio). Se sube SOLO donde pasaba el techo de 45% de costo: P06 se
--    queda igual porque ya estaba sano.
UPDATE catalog_prices SET values = '{"p15":14.9,"p30":22.9,"pDbl":7,"pDbl30":14}'::jsonb    WHERE category='protein' AND code='P01';
UPDATE catalog_prices SET values = '{"p15":13.9,"p30":21.9,"pDbl":6,"pDbl30":11}'::jsonb    WHERE category='protein' AND code='P02';
UPDATE catalog_prices SET values = '{"p15":13.9,"p30":21.9,"pDbl":6,"pDbl30":11}'::jsonb    WHERE category='protein' AND code='P03';
UPDATE catalog_prices SET values = '{"p15":16.9,"p30":30.9,"pDbl":10.9,"pDbl30":21.9}'::jsonb WHERE category='protein' AND code='P04';
UPDATE catalog_prices SET values = '{"p15":16.9,"p30":30.9,"pDbl":9.9,"pDbl30":19.9}'::jsonb  WHERE category='protein' AND code='P05';
UPDATE catalog_prices SET values = '{"p15":14.9,"p30":24.9,"pDbl":6,"pDbl30":6}'::jsonb     WHERE category='protein' AND code='P06';

-- 4) SIG07 (THE CHICAGO) se retiró del catálogo el 2026-08-22. Su fila acá ya no la lee
--    nadie (loadCatalogPrices solo aplica filas cuyo code exista en SIG_DATA), pero se
--    borra para que la tabla no siga afirmando un precio de un producto que no se vende.
DELETE FROM catalog_prices WHERE category='sig' AND code='SIG07';
