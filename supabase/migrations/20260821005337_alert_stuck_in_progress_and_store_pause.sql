-- 1) La alerta de "pedido estancado" solo vigilaba el estado RECIBIDO: un pedido olvidado
-- en PREPARANDO o EN CAMINO no disparaba absolutamente nada, y ese es justo el que termina
-- en una calificación de 1 estrella. Columna propia (no se reusa alerted_stuck) para que un
-- pedido pueda avisar una vez en RECIBIDO y otra distinta si después se cuelga a mitad de
-- preparación.
alter table public.orders add column if not exists alerted_stuck_progress boolean not null default false;

-- 2) Pausa temporal de la tienda con reanudación automática. Hasta ahora "hoy no puedo
-- atender" obligaba a editar el horario semanal recurrente Y acordarse de revertirlo — si
-- se olvidaba, el negocio perdía ese mismo día de la semana siguiente entero. Se compara
-- contra now() al leer, así que no necesita ningún cron que la levante.
alter table public.app_settings add column if not exists paused_until timestamptz;
comment on column public.app_settings.paused_until is 'Si está en el futuro, la tienda no acepta pedidos hasta esa hora. Se reanuda sola: nadie tiene que acordarse de revertirla.';
