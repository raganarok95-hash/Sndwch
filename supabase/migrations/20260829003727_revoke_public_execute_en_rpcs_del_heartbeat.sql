-- Las 4 funciones del dead-man switch se crearon HOY sin repetir el patrón REVOKE que
-- este repo ya había usado 5 veces para exactamente el mismo problema (ver
-- revoke_public_exec_on_internal_rpcs, _v2, revoke_public_execute_on_security_definer_rpcs,
-- _v2, revoke_public_execute_on_money_rpcs_v3). Son SECURITY DEFINER, así que PostgREST
-- las expone en /rest/v1/rpc/... a cualquiera con la anon key, que es pública por diseño.
--
-- La peor de las cuatro es `record_cron_heartbeat`: cualquiera podía escribir un latido
-- falso para una acción y DEJAR MUDO el propio dead-man switch — la alarma se apagaría
-- justo mientras la automatización está caída, que es exactamente el escenario para el
-- que se construyó. `mark_cron_alerted` permite lo mismo por otra vía (marcar como "ya
-- avisado"). `dead_cron_jobs` y `error_spike` no escriben nada, pero filtran los nombres
-- de los procesos internos y el volumen de errores del negocio, que tampoco tiene por qué
-- ser público.
--
-- Las 4 solo deben llamarse desde supabase/functions/api con la service role.
revoke execute on function public.record_cron_heartbeat(text, boolean, text) from public, anon, authenticated;
revoke execute on function public.mark_cron_alerted(text) from public, anon, authenticated;
revoke execute on function public.dead_cron_jobs(integer) from public, anon, authenticated;
revoke execute on function public.error_spike(integer, numeric) from public, anon, authenticated;

-- Arrastre viejo, no de esta sesión: `forbid_update_delete()` es una función de TRIGGER
-- (protege las tablas append-only). Llamarla directo por RPC no rompe nada — falla porque
-- no hay contexto de trigger — pero no tiene ningún motivo para estar expuesta.
revoke execute on function public.forbid_update_delete() from public, anon, authenticated;
