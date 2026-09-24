-- SND//WCH — entrar con correo y código de 6 dígitos (2026-09-23)
--
-- Las tres pantallas ENTRAR aprobadas prometen "te mandamos un código de 6 dígitos, no hay
-- contraseña" y el login real era teléfono + PIN. Esto construye lo que la pantalla dice.
--
-- El código NO se guarda en claro: se guarda con extensions.crypt/gen_salt('bf'), el mismo
-- tratamiento que ya tiene el PIN en customers (ver verify_pin). Si la tabla se filtrara, un
-- código de 6 dígitos en claro es un espacio de 10^6 que se recorre en segundos.

create table if not exists public.login_codes (
  email       text primary key,
  code_hash   text        not null,
  expires_at  timestamptz not null,
  attempts    int         not null default 0,
  sent_at     timestamptz not null default now()
);

alter table public.login_codes enable row level security;
-- Sin política: nadie llega a esta tabla con la anon key. El único camino son las dos
-- funciones security definer de abajo.
revoke all on public.login_codes from public, anon, authenticated;

-- El correo pasa a ser una IDENTIDAD, así que tiene que ser único. Hasta hoy `email` solo
-- tenía un índice btree normal: dos cuentas podían compartir correo y "entrar con tu correo"
-- habría sido ambiguo. Parcial porque el camino de Google puede dejarlo null.
create unique index if not exists customers_email_unico
  on public.customers (lower(btrim(email)))
  where email is not null and btrim(email) <> '';

-- ── Emitir un código ──────────────────────────────────────────────────────────────────
-- Devuelve false si ya se mandó uno hace menos de p_cooldown_seconds: sin eso, el botón
-- "mándame el código" es un generador gratuito de correos hacia cualquier dirección.
create or replace function public.issue_login_code(
  p_email text, p_code text, p_ttl_minutes int, p_cooldown_seconds int
) returns boolean
language plpgsql security definer set search_path to 'public', 'extensions'
as $$
declare v_email text := lower(btrim(p_email)); v_last timestamptz;
begin
  select sent_at into v_last from public.login_codes where email = v_email;
  if v_last is not null and v_last > now() - make_interval(secs => p_cooldown_seconds) then
    return false;
  end if;
  insert into public.login_codes (email, code_hash, expires_at, attempts, sent_at)
  values (v_email, extensions.crypt(p_code, extensions.gen_salt('bf')),
          now() + make_interval(mins => p_ttl_minutes), 0, now())
  on conflict (email) do update
    set code_hash  = excluded.code_hash,
        expires_at = excluded.expires_at,
        attempts   = 0,
        sent_at    = now();
  return true;
end;
$$;

-- ── Verificar un código ───────────────────────────────────────────────────────────────
-- Cuenta los intentos DENTRO de la transacción y borra la fila al acertar, para que un
-- código no se pueda reusar ni adivinar a fuerza bruta. El mismo intento fallido que agota
-- p_max_attempts deja el código muerto: hay que pedir otro.
create or replace function public.verify_login_code(
  p_email text, p_code text, p_max_attempts int
) returns boolean
language plpgsql security definer set search_path to 'public', 'extensions'
as $$
declare v_email text := lower(btrim(p_email)); v_row public.login_codes%rowtype;
begin
  select * into v_row from public.login_codes where email = v_email for update;
  if not found then return false; end if;
  if v_row.expires_at < now() or v_row.attempts >= p_max_attempts then
    delete from public.login_codes where email = v_email;
    return false;
  end if;
  if v_row.code_hash = extensions.crypt(p_code, v_row.code_hash) then
    delete from public.login_codes where email = v_email;
    return true;
  end if;
  update public.login_codes set attempts = attempts + 1 where email = v_email;
  return false;
end;
$$;

-- La regla del repo: toda función security definer nueva pierde el execute público, o
-- cualquiera con la anon key la llama directamente. Lo vigila npm run check:rpc.
revoke execute on function public.issue_login_code(text, text, int, int) from public, anon, authenticated;
revoke execute on function public.verify_login_code(text, text, int) from public, anon, authenticated;

-- Limpieza: un código vencido no sirve para nada y la tabla no tiene por qué crecer.
create index if not exists login_codes_expires_idx on public.login_codes (expires_at);
