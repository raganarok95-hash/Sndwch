-- 1. Segundo aviso de plazo de reclamo.
-- `alerted_deadline` avisa a 4 días hábiles del vencimiento y nunca se resetea: si el dueño
-- no actúa sobre ese único push, el reclamo se queda callado hasta vencer, con el plazo
-- legal de 30 días corriendo y una multa de por medio. Esta columna sostiene un segundo
-- aviso, ya en zona roja.
alter table public.complaints add column if not exists alerted_deadline_final boolean not null default false;

-- 2. Sobrecarga vieja de finalize_order_customer_update.
-- PostgREST elige la sobrecarga por los NOMBRES de los argumentos, así que cualquier
-- llamador que omitiera `p_referrer_bonus` caía en la versión de 8 parámetros y descontaba
-- el monto del referido a los dos lados. Los llamadores ya se corrigieron para pasarlo
-- siempre; esto elimina la trampa para el próximo.
drop function if exists public.finalize_order_customer_update(text, int, numeric, int, text, int, text, int);

-- 3. El DNI obligatorio solo vivía en auth.ts.
-- Es una regla no negociable del proyecto pero la base aceptaba NULL, y `customers_dni_key`
-- UNIQUE admite N nulos. NOT VALID a propósito: hay al menos una fila histórica con dni
-- nulo y no se toca dato existente — la restricción aplica de acá en adelante.
alter table public.customers drop constraint if exists customers_dni_not_null;
alter table public.customers add constraint customers_dni_not_null check (dni is not null) not valid;

-- 4. Índice sobre delivery_time.
-- assertHourCapacity lo filtra en CADA checkout, y también lo usan actAdminPrepList y el
-- cron de pedidos programados. Los 8 índices de `orders` no lo cubrían: seq scan completo.
create index if not exists orders_delivery_time_idx
  on public.orders (delivery_time)
  where delivery_time is not null;

-- 5. Append-only de verdad en las tablas versionadas.
-- `catalog_items` y `secret_signature` son append-only POR CONVENCIÓN: publicar inserta una
-- fila nueva y la de mayor id gana, y de ahí sale el historial gratis. Nada lo impedía a
-- nivel de base: un UPDATE distraído en una migración futura borra ese historial sin aviso.
create or replace function public.forbid_update_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  raise exception 'La tabla % es append-only: publica una fila nueva en vez de modificar la existente.', tg_table_name;
end;
$$;

drop trigger if exists catalog_items_append_only on public.catalog_items;
create trigger catalog_items_append_only
  before update or delete on public.catalog_items
  for each row execute function public.forbid_update_delete();

drop trigger if exists secret_signature_append_only on public.secret_signature;
create trigger secret_signature_append_only
  before update or delete on public.secret_signature
  for each row execute function public.forbid_update_delete();

-- 6. Quitarle a `anon`/`authenticated` los permisos que nunca necesitaron.
-- Las 33 tablas concedían SELECT/INSERT/UPDATE/DELETE/TRUNCATE a las dos roles públicas.
-- Hoy RLS lo frena (activada sin políticas = solo service_role), pero es una única línea de
-- defensa: una sola política permisiva futura, o un `disable row level security` en una
-- migración, entrega escritura completa a una clave que viaja en el cliente. El backend usa
-- service_role, que ignora estos grants. Verificado antes de aplicar: el cliente ya no hace
-- ninguna lectura PostgREST directa (la última, `inventory`, pasó a viajar dentro de
-- get-catalog en el mismo cambio), así que `sbG()` quedó sin llamadores.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- 7. verify_cron_secret en tiempo constante.
-- El endpoint `api` es HTTP público: cualquiera puede mandar action + cronSecret. La
-- comparación `=` de texto corta en el primer byte distinto, lo que en teoría deja un canal
-- lateral de tiempo para adivinar el secreto. Es la única pieza de esta cadena (Vault,
-- EXECUTE revocado) que no había cerrado ese detalle.
-- Verificado tras aplicar: false con secreto incorrecto, true con el real, false con null.
create or replace function public.verify_cron_secret(p_secret text)
returns boolean
language plpgsql
security definer
set search_path to 'public, vault, extensions'
as $$
declare
  v_expected text;
begin
  select decrypted_secret into v_expected
  from vault.decrypted_secrets where name = 'sndwch_cron_secret';
  if v_expected is null or p_secret is null then
    return false;
  end if;
  -- Comparar los digest de longitud fija en vez de los textos: mismo costo siempre.
  return extensions.digest(p_secret, 'sha256') = extensions.digest(v_expected, 'sha256');
end;
$$;
