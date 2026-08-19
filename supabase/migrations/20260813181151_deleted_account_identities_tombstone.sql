-- actDeleteAccount borraba la fila de customers por completo (no la anonimizaba, a
-- diferencia de orders/ratings) — como actRegister solo rechaza duplicados contra filas
-- EXISTENTES, borrar la cuenta y volver a registrarse con el mismo teléfono/DNI pasaba el
-- chequeo de duplicados y otorgaba otro bono de bienvenida (WELCOME_BONUS_POINTS),
-- repetible sin límite (hallazgo de auditoría, ALTO). Esta tabla deja un tombstone del
-- phone/dni que sobrevive al borrado, para que actRegister pueda seguir permitiendo el
-- re-registro (no es una cuenta bloqueada) pero sin volver a regalar el bono.
create table if not exists public.deleted_account_identities (
  phone text primary key,
  dni text,
  deleted_at timestamptz not null default now()
);
create index if not exists deleted_account_identities_dni_idx on public.deleted_account_identities (dni);

alter table public.deleted_account_identities enable row level security;
-- Solo el service role (el backend de api) toca esta tabla — mismo criterio deny-by-default
-- que el resto de tablas sensibles, sin políticas para anon/authenticated.
