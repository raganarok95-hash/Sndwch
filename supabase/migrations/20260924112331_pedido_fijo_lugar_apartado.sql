-- EL LUGAR APARTADO DEL PEDIDO FIJO (2026-09-24, aprobado por el dueño el 2026-09-23).
-- El lugar NO se guarda: se calcula (supabase/functions/api/franja.ts). Lo único que hace
-- falta guardar son los hechos de los que sale el cálculo:
--   orders.recurring_id   de qué fijo salió un pedido: gasta el lugar de ese día y, pagado,
--                         cuenta como una confirmación del hábito.
--   pending_charges.recurring_id   el mismo dato mientras el cobro con tarjeta está en curso.
--   recurring_orders.skip_on       «esta semana no»: suelta el lugar de ESE día antes de hora.
--   recurring_orders.address_id    a dónde va, para que confirmar sea un toque y no volver a
--                                  elegir dirección cada semana.
alter table public.recurring_orders
  add column if not exists skip_on date,
  add column if not exists address_id bigint references public.saved_addresses(id) on delete set null;

alter table public.orders
  add column if not exists recurring_id uuid references public.recurring_orders(id) on delete set null;
create index if not exists orders_recurring_id_idx on public.orders (recurring_id) where recurring_id is not null;

alter table public.pending_charges
  add column if not exists recurring_id uuid;

comment on column public.orders.recurring_id is 'Pedido fijo del que salió este pedido. Gasta el lugar apartado de ese día y, pagado, cuenta como confirmación (franja.ts).';
comment on column public.recurring_orders.skip_on is 'Día (Lima) que el cliente saltó con «esta semana no»: ese día no se aparta lugar ni se avisa.';
comment on column public.recurring_orders.address_id is 'Dirección guardada a la que va el pedido fijo.';
