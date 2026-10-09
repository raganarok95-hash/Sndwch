-- Código promocional de tipo «bebida» (2026-10-09, dueño: «Si aprueba todo»): regala la bebida
-- más barata del carrito, con `value` como tope (orders.ts · computePromoDiscount). Lo usa el QR
-- de la bolsa para pasar clientes de Rappi y PedidosYa al canal propio.
alter table public.promo_codes drop constraint promo_codes_discount_type_check;
alter table public.promo_codes add constraint promo_codes_discount_type_check
  check (discount_type = any (array['percent'::text, 'fixed'::text, 'bebida'::text]));

insert into public.promo_codes (code, discount_type, value, min_order_total, campaign_tag, created_by)
values ('BOLSA', 'bebida', 6, 0, 'qr-bolsa', 'migration')
on conflict (code) do nothing;
