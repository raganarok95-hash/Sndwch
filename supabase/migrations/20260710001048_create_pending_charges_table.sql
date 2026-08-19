-- Reserva creada ANTES de cobrar con Culqi (ver actPrepareOrder) — mueve toda la
-- validación pesada (horario, carrito/precio, recompensa) y la reserva real de
-- inventario a un paso previo al cobro, en vez de después como era antes. También
-- sirve de registro de conciliación: cada intento de cobro real queda anotado aquí
-- aunque el pedido nunca llegue a crearse.
create table public.pending_charges (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  customer_phone text,
  contact_phone text not null,
  customer_name text not null,
  customer_email text,
  customer_address text not null,
  notes text,
  summary text,
  expected_total numeric not null,
  reserved_codes text[] not null default '{}',
  reserved_qtys int[] not null default '{}',
  sanitized_items jsonb not null,
  reward_id text,
  scheduled_for timestamptz,
  status text not null default 'pending' check (status in ('pending','consumed','expired','cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Cron de expiración (cada ~2 min) revisa por status+expires_at; el índice parcial por
-- teléfono es lo que permite bloquear una segunda reserva concurrente del mismo cliente
-- (dos pestañas) sin escanear toda la tabla.
create index pending_charges_status_expires_idx on public.pending_charges(status, expires_at);
create index pending_charges_phone_pending_idx on public.pending_charges(customer_phone) where status = 'pending';

-- Mismo criterio que el resto de tablas sensibles (ver comentario en db.ts): RLS activo
-- sin políticas para anon/authenticated — solo la función api (service role) la toca.
alter table public.pending_charges enable row level security;
