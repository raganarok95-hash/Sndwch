-- Cobro del delivery por DISTANCIA REAL (2026-09-02).
--
-- Hasta hoy la app cobraba un monto plano por ZONA que el propio cliente elegía en un
-- desplegable, con "media" (S/8) por defecto. El motorizado —un tercero con 50+ repartidores
-- coordinado por WhatsApp— cobra S/2 POR KILÓMETRO. O sea: el cliente elegía su propio precio
-- de envío y elegir el más barato no le costaba nada.
--
-- El pin del mapa ya existía, pero SOLO AVISABA del desajuste; el cobro seguía saliendo de la
-- zona. El dueño creía que la app ya cobraba por distancia — no lo hacía.
--
-- Se guarda el km COBRADO con el pedido, aunque se podría recalcular desde lat/lon: guardarlo
-- deja el número inmune a un cambio futuro del factor de ruta, y todo el sentido de esta
-- columna es poder comparar lo que se cobró contra lo que el motorizado cobró ESE día.
alter table public.orders
  add column if not exists delivery_km numeric;

comment on column public.orders.delivery_km is
  'Kilometros cobrables (linea recta x factor de ruta) usados para calcular delivery_fee. NULL = el pedido se cobro por zona, no por distancia (cliente sin pin, o shell viejo).';

-- Misma columna en la reserva previa al cobro con tarjeta: el fee se fija en prepare-order y
-- el pedido se crea despues, asi que el km tiene que viajar con la reserva o se perderia.
alter table public.pending_charges
  add column if not exists delivery_km numeric;

comment on column public.pending_charges.delivery_km is
  'Kilometros cobrables de la reserva, para que el pedido creado despues del cobro conserve el mismo dato.';
