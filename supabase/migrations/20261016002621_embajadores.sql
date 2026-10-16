-- Embajadores pagados por resultado (dueño, 2026-10-16: «Sí, amé los embajadores»).
-- Cada embajador tiene su enlace sndwch.app/?src=emb-<codigo>. Lo que se le debe se CALCULA de los
-- pedidos (orders.origen) en _shared/dinero.ts; aquí solo viven quiénes son y lo que ya se les pagó.
create table public.embajadores (
  id bigint generated always as identity primary key,
  nombre text not null check (length(btrim(nombre)) between 2 and 60),
  codigo text not null unique check (codigo ~ '^[a-z0-9-]{2,30}$'),
  telefono text not null unique check (telefono ~ '^9[0-9]{8}$'),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.embajador_pagos (
  id bigint generated always as identity primary key,
  embajador_id bigint not null references public.embajadores(id),
  monto numeric(10,2) not null check (monto > 0),
  pagado_por text not null,
  created_at timestamptz not null default now()
);
create index embajador_pagos_embajador_idx on public.embajador_pagos (embajador_id);

-- Solo el servidor (service_role) los lee y escribe; nada para anon ni authenticated.
alter table public.embajadores enable row level security;
alter table public.embajador_pagos enable row level security;
revoke all on table public.embajadores from anon, authenticated;
revoke all on table public.embajador_pagos from anon, authenticated;
