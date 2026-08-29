-- Alerta de pedido que pasó su ETA (automatización #79).
--
-- Ya existe una alerta de "pedido sin avanzar" que dispara al doble del umbral de
-- estancamiento, pero esa mira el RELOJ DE LA COCINA y no sabe qué se le prometió a ese
-- cliente en concreto. Cuando el pedido sale EN CAMINO se le manda "llega entre las X y las
-- Y" (etaWindowText, ±5 min sobre eta_minutes): esa es la promesa que importa, y es la que
-- convierte una demora en una calificación de 1 estrella si nadie avisa.
--
-- La bandera es por pedido y no un rate limit global porque cada pedido tiene su propia
-- promesa: dos pedidos distintos que se pasan del ETA son dos clientes distintos a los que
-- hay que escribirles.
alter table public.orders
  add column if not exists alerted_eta_missed boolean not null default false;

comment on column public.orders.alerted_eta_missed is
  'Ya se avisó que este pedido pasó el ETA prometido al cliente (automatización #79). Evita repetir el aviso en cada corrida del cron.';
