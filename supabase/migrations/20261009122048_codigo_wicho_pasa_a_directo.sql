-- El código del QR de la bolsa pasa a DIRECTO (dueño, 2026-10-09: «el código que sea algo más
-- genérico» y después «DIRECTO»). Va con el «Pide directo» del sticker. Mismo tipo («bebida»),
-- mismo tope y misma regla (una vez por celular). No tenía ningún canje.
update public.promo_codes set code = 'DIRECTO'
where code = 'WICHO' and uses_count = 0;
