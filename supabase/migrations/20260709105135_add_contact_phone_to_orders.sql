-- El checkout de invitado no pedía ningún teléfono — la única forma de contactar al
-- cliente era el mensaje de WhatsApp que él mismo debía enviar tras pagar, y si ese paso
-- fallaba (bloqueo de pop-up, cerró la pestaña) un pedido ya cobrado quedaba sin ninguna
-- forma de ubicarlo. Columna nueva y separada de customer_phone (que es el teléfono de
-- la CUENTA, null para invitados) — esta es el contacto de ESTE pedido específico.
ALTER TABLE public.orders ADD COLUMN contact_phone text;
