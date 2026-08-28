-- Menú secreto: el desbloqueo baja de 5 a 3 pedidos (decisión del dueño, 2026-08-26).
--
-- La tabla es APPEND-ONLY por diseño: publicar siempre inserta una fila nueva y la de mayor
-- id es la vigente, así el historial de sándwiches secretos anteriores queda gratis. Por eso
-- esto NO es un UPDATE: copia la fila vigente entera y solo cambia min_orders.
--
-- El precio se copia TAL CUAL está en producción (24/30), sin tocarlo. El código tiene
-- 24.90/30.90 en su literal semilla, pero esta tabla es la fuente de verdad en runtime
-- (loadSecretSignature corre después de loadCatalogPrices), así que hoy se cobra 24/30. Ese
-- desajuste es una decisión de dinero pendiente del dueño y se deja como está a propósito.
insert into secret_signature
  (name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids, min_orders, image_path, created_by)
select
  name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids, 3, image_path, 'migracion-2026-08-26'
from secret_signature
order by id desc
limit 1;
