-- Para poder medir de verdad si una campaña paga (anuncios) se paga sola: sin esto no
-- había forma de saber de dónde vino un cliente nuevo más allá del programa de referidos
-- entre clientes (referred_by). El cliente manda esto solo al registrarse (?src=... en el
-- link del anuncio), nunca se pisa después.
alter table public.customers add column if not exists acquisition_source text;
