-- SND//WCH — LO QUE SUPABASE TRAE Y UN POSTGRES COMÚN NO (2026-09-24).
--
-- Las migraciones de supabase/migrations/ asumen el entorno de Supabase: sus roles, los esquemas
-- `cron` (tareas programadas), `net` (llamadas HTTP desde la base), `vault` (secretos) y
-- `storage`. Para cargar el esquema REAL en un Postgres local de pruebas, esto crea versiones
-- mínimas de esas piezas: existen con la misma forma, pero no hacen nada (un cron no corre, un
-- http_post no sale a la red). Lo que se prueba contra este Postgres es la lógica de NUESTRAS
-- funciones y tablas, no la de Supabase.
--
-- Si una migración nueva usa otra pieza de Supabase, `npm run check:pg` falla al cargarla y
-- dice cuál: se agrega acá, con su forma real.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
-- Supabase deja `extensions` en el search_path: las funciones de pgcrypto se llaman sin esquema.
alter database postgres set search_path to public, extensions;
set search_path to public, extensions;

create schema if not exists cron;
create table if not exists cron.job (jobid bigserial primary key, jobname text unique, schedule text, command text, active boolean default true);
create table if not exists cron.job_run_details (runid bigserial primary key, jobid bigint, status text, return_message text, start_time timestamptz, end_time timestamptz);
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $f$
  insert into cron.job (jobname, schedule, command) values (job_name, schedule, command)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command
  returning jobid;
$f$;
create or replace function cron.schedule(schedule text, command text) returns bigint language sql as $f$
  insert into cron.job (schedule, command) values (schedule, command) returning jobid;
$f$;
create or replace function cron.unschedule(job_name text) returns boolean language sql as $f$
  delete from cron.job where jobname = job_name returning true;
$f$;
create or replace function cron.unschedule(job_id bigint) returns boolean language sql as $f$
  delete from cron.job where jobid = job_id returning true;
$f$;

create schema if not exists net;
create or replace function net.http_post(
  url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb, timeout_milliseconds integer default 5000
) returns bigint language sql as $f$ select 0::bigint $f$;
create or replace function net.http_get(
  url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb, timeout_milliseconds integer default 5000
) returns bigint language sql as $f$ select 0::bigint $f$;

create schema if not exists vault;
create table if not exists vault.secrets (id uuid primary key default extensions.gen_random_uuid(), name text unique, secret text, description text);
create or replace view vault.decrypted_secrets as select id, name, secret as decrypted_secret, description from vault.secrets;
create or replace function vault.create_secret(new_secret text, new_name text default null, new_description text default '') returns uuid language sql as $f$
  insert into vault.secrets (secret, name, description) values (new_secret, new_name, new_description) returning id;
$f$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default extensions.gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb,
  created_at timestamptz default now()
);

create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $f$ select null::uuid $f$;
create or replace function auth.role() returns text language sql stable as $f$ select 'service_role'::text $f$;
