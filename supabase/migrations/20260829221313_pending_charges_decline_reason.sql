-- Rechazo de tarjeta registrado en la reserva (automatización #33).
--
-- Hoy, cuando Culqi rechaza una tarjeta, el rechazo queda en `debug_logs` (evento
-- 'culqi-rejected') y la reserva vuelve a 'pending' como si nada hubiera pasado. Cuando esa
-- reserva expira, el recordatorio de pago abandonado le dice al cliente "se te quedó a
-- medias" — un mensaje que NO le sirve a quien tuvo la tarjeta rechazada: va a reintentar
-- con la misma tarjeta y le va a volver a fallar.
--
-- Sobre el "reintento" automático: NO es posible por diseño de Culqi. El token de tarjeta
-- es de un solo uso y vive 5 minutos, así que el servidor no puede volver a cobrar sin un
-- token nuevo del cliente. Cobrar de nuevo solo sería posible guardando la tarjeta en Culqi
-- (One Click), lo que implica decidir guardar medios de pago de los clientes — una decisión
-- del dueño, no un detalle de implementación. Lo que sí se puede hacer, y es lo que hace
-- esto, es que el cliente sepa QUÉ pasó para que su reintento tenga sentido.
alter table public.pending_charges
  add column if not exists declined_at timestamptz,
  add column if not exists decline_reason text;

comment on column public.pending_charges.declined_at is
  'Momento del último rechazo de Culqi sobre esta reserva. Nulo = nunca se intentó cobrar, o el intento no llegó a Culqi.';
comment on column public.pending_charges.decline_reason is
  'Mensaje de Culqi del último rechazo (user_message). Se usa para que el recordatorio de recuperación diga que fue la tarjeta, en vez del genérico "se te quedó a medias".';
