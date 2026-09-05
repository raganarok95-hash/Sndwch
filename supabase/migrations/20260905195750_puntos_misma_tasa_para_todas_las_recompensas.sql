-- Un punto se gana 1:1 por sol gastado, así que "puntos que cuesta un canje" es literalmente
-- "soles que el cliente tuvo que gastar". Dividir lo que a NOSOTROS nos cuesta honrarlo entre
-- esos puntos da el descuento efectivo que cada recompensa entrega. Estaba disparejo:
--
--     4ta salsa ......  40 pts, nos cuesta S/0.27  ->  devuelve 0.67%
--     15CM gratis .... 400 pts, nos cuesta S/5.90  ->  devuelve 1.48%
--     bebida gratis .. 120 pts, nos cuesta S/2.34  ->  devuelve 1.95%
--     doble proteína . 120 pts, nos cuesta S/2.47  ->  devuelve 2.06%
--     subir a 30CM ... 160 pts, nos cuesta S/4.61  ->  devuelve 2.88%
--
-- Un FACTOR 4.3 entre la más barata y la más cara PARA EL NEGOCIO. Un cliente que mira los
-- números canjea siempre "subir a 30CM" y nunca las otras cuatro: el programa termina pagando
-- el canje más caro cada vez y las demás recompensas son decorado.
--
-- Todo queda anclado en R06, que NO se puede mover: REFERRER_REWARD_POINTS debe valer
-- exactamente lo mismo y `npm run parity` lo verifica. Dispersión resultante: de 4.3x a 1.2x.
update catalog_prices set values = jsonb_set(values, '{pts}', to_jsonb(20::numeric)),  updated_at = now() where category = 'reward' and code = 'R02';
update catalog_prices set values = jsonb_set(values, '{pts}', to_jsonb(320::numeric)), updated_at = now() where category = 'reward' and code = 'R03';
update catalog_prices set values = jsonb_set(values, '{pts}', to_jsonb(160::numeric)), updated_at = now() where category = 'reward' and code = 'R04';
update catalog_prices set values = jsonb_set(values, '{pts}', to_jsonb(160::numeric)), updated_at = now() where category = 'reward' and code = 'R05';
-- R06 queda en 400 a propósito: es el ancla y lo exige la paridad con REFERRER_REWARD_POINTS.
