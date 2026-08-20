-- El pedido grupal (una oficina donde cada quien arma su sándwich y el organizador paga
-- todo junto) ya existía completo, pero el pedido que resultaba de cerrarlo era
-- indistinguible de cualquier otro: no había forma de saber cuánta venta viene de ese
-- canal, ni de decidir con datos si vale la pena empujarlo comercialmente. Es
-- justamente el canal con mejor economía — una sola entrega para 4-8 sándwiches — así que
-- medirlo es el primer paso para venderlo.
alter table public.orders add column if not exists group_code text;
create index if not exists orders_group_code_idx on public.orders (group_code) where group_code is not null;
