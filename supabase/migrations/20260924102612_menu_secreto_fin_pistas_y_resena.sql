-- Menú secreto (maquetas «estructura» y «fondo»): «el secreto de septiembre · 11 días»,
-- las tres pistas («Pica, y no de mentira») y «los que ya no vuelven» con su reseña
-- («cabrito, culantro y zarandaja»). La historia ya existía (la tabla es append-only);
-- faltaba dónde guardar la fecha de fin, las pistas y la reseña. Ver loadSecretSignature.
alter table public.secret_signature add column if not exists ends_at timestamptz;
alter table public.secret_signature add column if not exists hints jsonb not null default '[]'::jsonb;
alter table public.secret_signature add column if not exists blurb text;
