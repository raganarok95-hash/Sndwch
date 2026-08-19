-- El delivery ahora se cobra dentro del mismo pago del pedido (antes se pagaba aparte,
-- directo al motorizado, sin ningún registro) — se guarda por separado del total de
-- comida para que el programa de puntos siga ganando solo sobre lo que de verdad genera
-- margen (el delivery es un pass-through al motorizado, no ingreso real del negocio).
alter table orders add column delivery_fee integer not null default 0;
alter table orders add column delivery_zone text;
alter table pending_charges add column delivery_fee integer not null default 0;
alter table pending_charges add column delivery_zone text;
