-- +S/2 en el precio de 30CM de las 6 proteínas de ARMA EL TUYO (decisión del dueño,
-- 2026-09-04). El 30CM era donde el BYO se rompía: el pan y la proteína se duplican pero el
-- precio solo subía S/8, así que el piso fijo (S/6.40 a 30CM) se comía el margen.
--
-- ⚠ ESTA MIGRACIÓN ES LA MITAD QUE DE VERDAD COBRA. Los literales de PROT_PRICE en
-- catalog.ts son solo la semilla del primer arranque: loadCatalogPrices() carga esta tabla
-- encima en cada llamada. Editar el código sin tocar esta tabla ya costó tres semanas de
-- precios fantasma en agosto (7 decisiones de precio aprobadas que nunca tuvieron efecto).
update catalog_prices
set values = jsonb_set(values, '{p30}', to_jsonb((values->>'p30')::numeric + 2)),
    updated_at = now()
where category = 'protein'
  and code in ('P01','P02','P03','P04','P05','P06');
