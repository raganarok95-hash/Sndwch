-- add_gifted_credit / claim_discovery_challenge / claim_monthly_challenge son
-- SECURITY DEFINER y confían por completo en quien las llama (sin validar saldo del
-- remitente ni si el reto realmente se completó) porque esa validación vive en el
-- edge function `api`, que siempre las llama con la service_role key. PostgREST expone
-- toda función en el schema public a /rest/v1/rpc/* por defecto para anon/authenticated
-- -- sin este revoke, cualquiera con la anon key (visible en el código del cliente)
-- podía llamarlas directo y regalarse crédito o puntos ilimitados sin pasar por ninguna
-- validación. El edge function sigue funcionando igual: usa la service_role key, que
-- no depende de estos GRANT/REVOKE.
revoke execute on function public.add_gifted_credit(text, numeric) from anon, authenticated;
revoke execute on function public.claim_discovery_challenge(text, text, integer) from anon, authenticated;
revoke execute on function public.claim_monthly_challenge(text, text, integer) from anon, authenticated;
