-- Auditoría de modelado de datos (2026-07-30): orders.total/orders.delivery_fee y
-- pending_charges.delivery_fee eran integer, pero deliveryFeeForZoneCard() (orders.ts,
-- "engorda" el fee real para absorber la comisión Culqi) y el descuento porcentual de
-- promo_codes (computePromoDiscount) producen montos con centavos (ej. S/6.35 para la
-- zona "cerca"). Verificado empíricamente: '6.35'::integer falla con
-- "invalid input syntax for type integer" — cualquier pedido con tarjeta+delivery (todas
-- las zonas tienen fee>0, ninguna divide exacto entre 0.945) o con un código promocional
-- porcentual rechaza el INSERT en pending_charges (actPrepareOrder, ANTES de cobrar) o en
-- orders (actPlaceOrder para Yape/Plin/crédito con promo %, o el fallback de
-- finalizeAndInsertOrder). Se ensanchan a numeric para que coincidan con
-- pending_charges.expected_total/promo_discount, que ya eran numeric.
alter table orders alter column total type numeric using total::numeric;
alter table orders alter column delivery_fee type numeric using delivery_fee::numeric;
alter table pending_charges alter column delivery_fee type numeric using delivery_fee::numeric;
