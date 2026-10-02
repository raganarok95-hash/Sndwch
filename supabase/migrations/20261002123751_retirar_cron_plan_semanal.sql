-- El Plan Semanal se retiró de la apertura (#58). Su cron corría cada 3 minutos sobre una tabla
-- vacía (480 llamadas al día a la edge function, en el plan free). Se retira el cron; la tabla
-- pending_weekly_plans queda (vacía) por si el Plan Semanal vuelve.
select cron.unschedule('sndwch-expire-pending-weekly-plans');
