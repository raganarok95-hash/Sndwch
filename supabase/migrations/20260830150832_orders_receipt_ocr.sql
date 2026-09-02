-- #28 — Lectura del comprobante de Yape/Plin, SIN COSTO.
--
-- Lo que NO hace, y no puede hacer: confirmar el pago. Una captura se edita en dos minutos,
-- así que leerla automáticamente solo confirmaría una falsificación más rápido. La
-- confirmación sigue siendo del admin mirando su cuenta, igual que hasta ahora.
--
-- Lo que sí hace: los tres chequeos que el dueño haría a ojo, hechos por la app.
--   · el monto de la captura contra el total del pedido,
--   · la fecha, contra la del pedido,
--   · y el NÚMERO DE OPERACIÓN, que es lo verdaderamente nuevo: detecta la misma
--     transferencia reutilizada en dos pedidos. Es estrictamente más fuerte que el hash de
--     la imagen (#29), porque volver a capturar la pantalla cambia el hash pero no el número.
alter table public.orders
  add column if not exists receipt_ocr jsonb,
  add column if not exists receipt_op_number text;

comment on column public.orders.receipt_ocr is
  'Lo que se leyo del comprobante (monto, numero de operacion, fecha, texto crudo). Es una AYUDA para el admin, nunca una prueba de pago: una captura se edita.';
comment on column public.orders.receipt_op_number is
  'Numero de operacion leido del comprobante. Sirve para detectar la MISMA transferencia usada en dos pedidos — mas fuerte que el hash de la imagen, porque recapturar la pantalla cambia el hash pero no el numero.';

create index if not exists orders_receipt_op_number_idx
  on public.orders (receipt_op_number)
  where receipt_op_number is not null;
