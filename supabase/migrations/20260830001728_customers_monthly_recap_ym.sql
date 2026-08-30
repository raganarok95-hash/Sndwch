-- #65 — Resumen mensual personal ("este mes pediste 4 veces, tu favorito fue X").
--
-- La marca de "a este cliente ya le mandé el resumen de este mes", con el mismo criterio
-- que birthday_pts_year: un entero AAAAMM (ej. 202608), no un booleano ni una fecha.
--
-- No es cosmética, es lo que hace que el resumen SOBREVIVA al tope de envíos. Todos los
-- crons de push de este proyecto cortan en MAX_PUSH_PER_RUN (200) por corrida — sin esta
-- marca, un cron mensual dejaría fuera al cliente 201 en adelante y su siguiente
-- oportunidad sería el mes siguiente, cuando la ventana ya se movió: nunca recibirían el
-- suyo. Con la marca, el cron corre los primeros días del mes y cada corrida atiende a los
-- que todavía no la tienen, hasta terminar la lista.
alter table public.customers
  add column if not exists monthly_recap_ym integer not null default 0;

comment on column public.customers.monthly_recap_ym is
  'Ultimo mes (AAAAMM) cuyo resumen personal ya se le envio a este cliente. 0 = ninguno. Permite que el cron mensual retome donde quedo cuando el tope de envios por corrida lo corta a la mitad.';

create index if not exists customers_monthly_recap_ym_idx
  on public.customers (monthly_recap_ym);
