-- El código del QR de la bolsa cambia de nombre (dueño, 2026-10-09: «el código BOLSA no me gusta,
-- usemos otro»): pasa a WICHO, el hermano que sale en el sticker del QR. Mismo tipo («bebida»),
-- mismo tope y misma regla (una vez por celular). No tenía ningún canje.
update public.promo_codes set code = 'WICHO', campaign_tag = 'qr-bolsa'
where code = 'BOLSA' and uses_count = 0;
