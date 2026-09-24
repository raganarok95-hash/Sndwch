-- QUITAR LAS COLUMNAS DE LA APP ANTERIOR DE `orders` (paso 6, 2026-09-24).
--
-- ⚠ SE APLICA AL MERGEAR A `main`, NO ANTES. El `api` que corre en producción mientras esta rama
-- no llegue a `main` todavía INSERTA `mode`, `product_key`, `size` y `build` al crear cada pedido
-- (el código nuevo ya no: crear_pedido no las nombra), y el dashboard y las exportaciones las
-- piden. Quitarlas antes dejaría a producción sin poder crear pedidos.
--
-- Orden: 1) merge a main y push (el CI despliega el api nuevo); 2) aplicar esto con
-- apply_migration; 3) mover este archivo a supabase/migrations/ con la versión que registre la
-- base; 4) sacar la foto del esquema y los tipos (guardar-foto.mjs / guardar-tipos.mjs).
-- `npm run check:columnas` ya comprueba que el código no las nombra en ninguna consulta.
alter table public.orders
  drop column if exists mode,
  drop column if exists product_key,
  drop column if exists size,
  drop column if exists build;
