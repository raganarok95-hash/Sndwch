-- Primer intento (revoke_public_execute_on_security_definer_rpcs) revocó anon/authenticated
-- pero PostgreSQL otorga EXECUTE a PUBLIC por defecto al crear una función, y anon/
-- authenticated heredan de PUBLIC — revocar solo de los roles nombrados no alcanza mientras
-- PUBLIC siga con el privilegio. El advisor lo confirmó: seguía marcando WARN después del
-- primer migration. Esto cierra el hueco de verdad.
revoke execute on function public.add_gifted_credit(text, numeric) from public;
revoke execute on function public.claim_discovery_challenge(text, text, integer) from public;
revoke execute on function public.claim_monthly_challenge(text, text, integer) from public;
