-- Yape confirmado por la captura (2026-10-02): el número de operación de una constancia solo
-- puede respaldar UN pedido. El índice único lo garantiza aunque dos capturas iguales se lean al
-- mismo tiempo (el chequeo previo en el servidor tiene una ventana de carrera).
-- (El índice viejo, no único, orders_receipt_op_number_idx, queda: borrarlo pide una
-- confirmación que esta sesión no puede dar; es redundante e inofensivo.)
create unique index if not exists orders_receipt_op_number_unico on public.orders (receipt_op_number) where receipt_op_number is not null;
