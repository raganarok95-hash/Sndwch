-- Los correos de cierre salen a las 22:30 de Lima, después de cerrar a las 22:00
-- (dueño, 2026-11-03: «Sí, a las 22:30»). Lima = UTC-5 todo el año.
select cron.alter_job((select jobid from cron.job where jobname = 'sndwch-daily-summary'), schedule := '30 3 * * *');
select cron.alter_job((select jobid from cron.job where jobname = 'sndwch-weekly-summary'), schedule := '30 3 * * 1');
