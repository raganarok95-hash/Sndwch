-- Pedido recurrente (automatización #60). Ingreso predecible, que es justo lo que le falta a
-- un negocio nuevo.
--
-- ⚠ NO COBRA SOLO, Y NO PUEDE. El token de tarjeta de Culqi es de un solo uso y vive 5
-- minutos: el servidor no tiene forma de volver a cobrar sin que el cliente ponga una
-- tarjeta otra vez. Cobrar automáticamente exigiría guardar la tarjeta en Culqi (One Click),
-- que es una decisión del dueño sobre qué datos de sus clientes guardar, no un detalle de
-- implementación.
--
-- Tampoco cobra solo con crédito interno, aunque técnicamente se podría: sacarle plata a
-- alguien sin una decisión fresca suya es la clase de sorpresa que cuesta el cliente entero,
-- y el saldo interno es dinero que ya pagó.
--
-- Lo que SÍ hace: a la hora que el cliente eligió, le llega un aviso con su carrito ya
-- armado y confirma en un toque. Eso es "lo deja armado todas las semanas" sin tomar
-- decisiones de dinero por él.
create table if not exists public.recurring_orders (
  id uuid primary key default gen_random_uuid(),
  customer_phone text not null,
  -- El carrito completo, tal cual lo guarda `orders.items`: así el aviso reconstruye
  -- exactamente lo mismo y `priceCartItem` lo puede re-tasar con los precios VIGENTES. Nunca
  -- se guarda el total: un precio congelado acá sería una segunda fuente de verdad, el mismo
  -- defecto que costó tres semanas de precios fantasma.
  items jsonb not null,
  -- 0=domingo … 6=sábado, igual que store_hours.weekday y que Date.getDay().
  weekday smallint not null,
  -- Hora local de Lima en formato HH:MM. Texto y no time: el resto de la app maneja las
  -- franjas como "19:30" y convertir de ida y vuelta solo agrega sitios donde equivocarse.
  slot text not null,
  label text,
  active boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint recurring_orders_weekday_valido check (weekday between 0 and 6),
  constraint recurring_orders_slot_valido check (slot ~ '^[0-2][0-9]:[0-5][0-9]$')
);

-- Un cliente, una recurrencia por franja: repetir la misma le mandaría dos avisos idénticos.
create unique index if not exists recurring_orders_unica
  on public.recurring_orders (customer_phone, weekday, slot) where active;

create index if not exists recurring_orders_activas
  on public.recurring_orders (weekday, slot) where active;

-- Mismo criterio que el resto de las tablas de negocio: RLS activada SIN políticas, todo el
-- acceso pasa por la edge function `api` con la service role key. Sin esto, la anon key
-- podría leer los carritos y teléfonos de todos los clientes.
alter table public.recurring_orders enable row level security;

comment on table public.recurring_orders is
  'RLS: default-deny intencional, todo el acceso vía service_role desde la edge function api. No agregar políticas anon/authenticated. NO cobra sola: manda un aviso con el carrito armado y el cliente confirma (ver automatización #60).';
