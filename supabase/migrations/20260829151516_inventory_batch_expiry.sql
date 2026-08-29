-- Caducidad de tanda (automatización #5). SEGURIDAD ALIMENTARIA, no optimización de merma.
--
-- El dueño cocina por tandas 1-2 veces por semana y en hora de servicio solo ARMA. Eso deja
-- proteínas cocidas guardadas en frío varios días, y hasta ahora nada en el sistema sabía
-- CUÁNDO se cocinó cada una: `inventory` solo guardaba cuánto queda. Con eso, una tanda
-- vieja y una recién hecha son indistinguibles para el sistema, y la única defensa era que
-- una persona sola se acordara.
--
-- `shelf_life_days` arranca en 3 por la guía de USDA/foodsafety.gov para carne o pollo
-- COCIDOS refrigerados a 4 °C o menos, que da 3-4 días: se toma el extremo conservador. Es
-- un valor por defecto, no una verdad sobre estos insumos — es editable por insumo y hay
-- que revisarlo con las recetas reales.
alter table public.inventory
  add column if not exists batch_cooked_at timestamptz,
  add column if not exists shelf_life_days integer not null default 3;

comment on column public.inventory.batch_cooked_at is
  'Momento de la última tanda producida de este insumo. Lo escribe admin-inventory-restock. Nulo = nunca se registró una tanda (insumo comprado ya listo, o repuesto antes de que existiera esta columna).';
comment on column public.inventory.shelf_life_days is
  'Días que el insumo aguanta en frío desde la tanda. Por defecto 3, extremo conservador de la guía USDA/foodsafety.gov para carne y pollo cocidos a <=4C (3-4 dias). Editable por insumo.';

-- Un valor de 0 o negativo dejaría todo vencido desde el instante en que se cocina, y la
-- alerta pasaría a ser ruido constante que se ignora — que es la forma en que una alarma
-- de seguridad deja de funcionar.
alter table public.inventory
  add constraint inventory_shelf_life_days_positivo check (shelf_life_days > 0);
