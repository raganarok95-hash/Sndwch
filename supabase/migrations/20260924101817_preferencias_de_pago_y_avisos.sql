-- Tu cuenta · «Cómo pagas» y «Avisos» (maqueta tu-cuenta). El método con el que el checkout
-- abre, y qué avisos quiere recibir el cliente. Ver actions/customer.ts (set-preferences) y
-- push.ts (categoriaDelAviso), que es donde se respeta de verdad.
alter table public.customers add column if not exists preferred_payment text
  check (preferred_payment in ('yape','culqi'));
alter table public.customers add column if not exists notif_prefs jsonb not null
  default '{"pedido": true, "promo": true}'::jsonb;
