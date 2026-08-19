-- Cierra dos hallazgos críticos/altos de la auditoría de 10 agentes sobre el flujo de pago:
--
-- 1) Un invitado (sin sesión) que reintenta tras un fallo de red ambiguo generaba una
--    referencia nueva cada vez (ver doOrder() en el cliente) y el bloqueo de "ya tienes un
--    pago en proceso" solo miraba customer_phone (null para invitados) — así que dos
--    intentos del mismo invitado podían generar dos cobros reales en paralelo. El bloqueo
--    ahora se hace por contact_phone (siempre presente, invitado o no).
--
-- 2) create-charge cobraba el monto que viniera en el cuerpo de la petición sin verificar
--    contra ninguna reserva real — se agrega el estado transitorio 'charging' para que
--    create-charge pueda reclamar la reserva ANTES de llamar a Culqi (pending->charging,
--    reclamo atómico igual que pending->consumed en actConfirmCulqiOrder) y así una segunda
--    llamada concurrente para la MISMA referencia no pueda generar un segundo cobro real.
ALTER TABLE public.pending_charges DROP CONSTRAINT pending_charges_status_check;
ALTER TABLE public.pending_charges ADD CONSTRAINT pending_charges_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'charging'::text, 'consumed'::text, 'expired'::text, 'cancelled'::text]));

CREATE INDEX IF NOT EXISTS pending_charges_contact_phone_pending_idx
  ON public.pending_charges (contact_phone)
  WHERE status = 'pending';

COMMENT ON TABLE public.pending_charges IS 'RLS habilitado sin políticas para anon/authenticated — solo accesible vía la función edge api con la SERVICE_ROLE key, mismo patrón que el resto de tablas de negocio (customers, orders, transactions).';
