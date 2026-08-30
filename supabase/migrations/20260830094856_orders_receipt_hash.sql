-- #29 — Detección de comprobante duplicado.
--
-- El comprobante de Yape/Plin es una CAPTURA DE PANTALLA que sube el cliente, y el admin
-- confirma el pago mirándola. Nada comparaba una captura contra las anteriores: la misma
-- imagen servía para tres pedidos distintos, y el único filtro era que el dueño recordara
-- haberla visto — con dos pedidos seguidos del mismo cliente eso no pasa.
--
-- Se guarda el SHA-256 de los bytes, no la imagen: alcanza para decir "esta captura ya se
-- usó en el pedido X" y no duplica el archivo. No pretende ser antifraude completo (recortar
-- un píxel cambia el hash); cubre el caso real y perezoso, que es reenviar el mismo archivo.
alter table public.orders
  add column if not exists receipt_hash text;

comment on column public.orders.receipt_hash is
  'SHA-256 en hex de los bytes del comprobante subido. Sirve para avisar si la MISMA captura ya se uso en otro pedido (automatizacion #29). Nunca bloquea el pedido por si solo: la confirmacion de pago sigue siendo del admin.';

-- El índice hace que la comprobación al subir sea una búsqueda y no un barrido de la tabla
-- de pedidos. Parcial: la enorme mayoría de pedidos (tarjeta, crédito) no tiene comprobante.
create index if not exists orders_receipt_hash_idx
  on public.orders (receipt_hash)
  where receipt_hash is not null;
