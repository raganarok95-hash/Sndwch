-- SIG05 se estaba cobrando S/24.00 / S/30.00 mientras el código (src/app.ts y catalog.ts)
-- dice 24.90 / 30.90 desde el 2026-08-15, cuando el dueño aprobó "+S/0.90 plano sobre cada
-- precio de sándwich". La subida nunca llegó a esta tabla, y `loadSecretSignature()` corre
-- DESPUÉS de `loadCatalogPrices()`, así que la fila manda sobre el literal del archivo.
-- Esto no decide un precio nuevo: ejecuta uno ya decidido que se quedó a medias.
--
-- Es además el único precio del catálogo que `npm run parity` no puede detectar: ese
-- script compara código contra código, y acá la fuente de verdad es una tercera (la
-- tabla). Por eso el desfase sobrevivió dos semanas con todo en verde.
--
-- Append-only: se INSERTA una fila nueva con la misma composición y solo el precio
-- corregido, nunca se actualiza la anterior — así queda el rastro de que se cobró 24/30
-- entre el 2026-08-26 y hoy.
insert into public.secret_signature
  (name, base, protein_id, tops, sauces, price_15, price_30, vault_only_ids, min_orders, image_path, created_by)
select
  name, base, protein_id, tops, sauces,
  24.90, 30.90,
  vault_only_ids, min_orders, image_path,
  'fix-precio-090-pendiente-desde-2026-08-15'
from public.secret_signature
order by id desc
limit 1;
