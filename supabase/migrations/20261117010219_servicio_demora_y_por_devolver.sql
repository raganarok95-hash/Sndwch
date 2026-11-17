-- Servicio (dueño, 2026-11-17: «si a todo» a docs/servicio/PROPUESTA_APERTURA.md).
-- 1. Aviso de demora al cliente: una sola vez por pedido, cuando pasa la hora prometida
--    (promised_to) sin entregarse. Los pedidos que ya existían quedan marcados como avisados
--    para que el primer barrido no le escriba a nadie por un pedido viejo.
alter table public.orders add column if not exists alerted_customer_late boolean not null default true;
alter table public.orders alter column alerted_customer_late set default false;

-- 2. «Por devolver»: cada devolución de dinero que se le debe a un cliente (un pedido pagado que
--    se canceló, o un «Algo salió mal» resuelto con reembolso) hasta que el dueño marca que la hizo.
--    Lo pagado con crédito de la app no entra: eso lo devuelve solo cancelar_pedido.
create table if not exists public.refunds_due (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id),
  ref text not null,
  amount numeric(10,2) not null check (amount > 0),
  payment_method text not null,
  origen text not null check (origen in ('cancelacion', 'algo-salio-mal')),
  created_by text not null,
  created_at timestamptz not null default now(),
  refunded_at timestamptz,
  refunded_by text,
  unique (order_id, origen)
);
create index if not exists refunds_due_pendientes_idx on public.refunds_due (created_at) where refunded_at is null;
alter table public.refunds_due enable row level security;
revoke all on table public.refunds_due from public, anon, authenticated;
grant select, insert, update, delete on table public.refunds_due to service_role;
