-- "Continuar con Google" tiene que poder crear la cuenta sin más trámite (decisión del
-- dueño, 2026-09-12): Google da nombre, correo e identidad verificada, y lo único que no
-- puede dar es el teléfono, que igual hace falta para entregar el pedido. El DNI era la
-- barrera que quedaba.
--
-- El CHECK NO se borra, se ACOTA. Borrarlo dejaría el DNI opcional para TODAS las cuentas,
-- incluidas las que se registran por el formulario normal — y ahí el DNI es lo que sostiene
-- la recuperación de PIN (actRecover cruza DNI + fecha de nacimiento). Una cuenta creada con
-- Google no necesita esa vía: recupera el acceso volviendo a entrar con Google.
--
-- Así, la base sigue garantizando lo mismo que antes para el camino que lo necesita, en vez
-- de dejar la regla viviendo solo en el código del servidor. La UNIQUE de dni no se toca:
-- Postgres permite varios NULL en un índice único, así que las cuentas de Google no chocan
-- entre sí.
alter table public.customers
  drop constraint customers_dni_not_null;

alter table public.customers
  add constraint customers_dni_o_google
  check (dni is not null or google_id is not null);
