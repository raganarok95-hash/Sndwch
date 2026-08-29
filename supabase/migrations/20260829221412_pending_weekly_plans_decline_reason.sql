-- Mismas columnas de rechazo en `pending_weekly_plans` (automatización #33).
--
-- `claimAndChargeCulqi` es compartida: create-charge la usa contra `pending_charges` y
-- create-credit-charge contra `pending_weekly_plans`. Si solo una de las dos tablas tuviera
-- estas columnas, el PATCH del rechazo fallaría SIEMPRE para el Plan Semanal — y como es
-- best-effort dentro de un try/catch, fallaría en silencio para siempre.
--
-- Además el caso es el mismo por el lado del cliente: a quien le rechazan la tarjeta
-- comprando el Plan Semanal también le sirve saber que fue la tarjeta.
alter table public.pending_weekly_plans
  add column if not exists declined_at timestamptz,
  add column if not exists decline_reason text;

comment on column public.pending_weekly_plans.declined_at is
  'Momento del último rechazo de Culqi sobre esta reserva de Plan Semanal. Espejo de pending_charges.declined_at: la función de cobro es compartida.';
comment on column public.pending_weekly_plans.decline_reason is
  'Mensaje de Culqi del último rechazo (user_message). Espejo de pending_charges.decline_reason.';
