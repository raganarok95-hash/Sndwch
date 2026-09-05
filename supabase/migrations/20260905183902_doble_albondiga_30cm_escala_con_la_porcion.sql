-- P06 (Albóndiga) era la ÚNICA proteína del catálogo cuyo recargo de doble proteína costaba
-- lo mismo en 15CM que en 30CM: pDbl 6 y pDbl30 6. Un precio que no escaló con la porción
-- que agrega — el costo pasaba de 22.3% a 44.7% del precio solo por eso, a un pelo del techo
-- de 45%, y sin que nada fallara.
--
-- Es el MISMO defecto que en agosto obligó a partir el campo plano `pDbl` en dos (`pDbl` y
-- `pDbl30`): se partió el campo y a esta fila se le copió el mismo número en los dos.
--
-- A S/12 el 30CM vuelve a 22.3% de costo, igual que su propio 15CM.
update catalog_prices
set values = jsonb_set(values, '{pDbl30}', to_jsonb(12::numeric)),
    updated_at = now()
where category = 'protein' and code = 'P06';
