-- Cierra una condición de carrera real en el registro: dos registros concurrentes con el
-- mismo DNI podían insertarse ambos con éxito (auth.ts solo chequea con un SELECT previo,
-- sin lock). google_id ya tenía este patrón (índice único parcial); dni no lo tenía.
-- Confirmado sin duplicados existentes antes de aplicar (hallazgo de auditoría 2026-08-07).
ALTER TABLE public.customers ADD CONSTRAINT customers_dni_key UNIQUE (dni);
