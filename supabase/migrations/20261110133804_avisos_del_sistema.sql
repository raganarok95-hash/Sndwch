-- Dueño (2026-11-10): «Todo debe funcionar en automático». El vigía de las automáticas
-- (scripts/vigia-automaticas.mjs) deja aquí cada noche las automáticas en rojo, las preguntas
-- abiertas a Ezra y las entregas atascadas; el correo daily-summary lo muestra.
alter table public.app_settings
  add column if not exists avisos_del_sistema jsonb,
  add column if not exists avisos_del_sistema_at timestamp with time zone;
