-- SND//WCH — un solo interruptor que apaga TODAS las promociones (2026-09-12)
--
-- POR QUÉ. Hoy cada código promocional se apaga por separado desde el panel. Si uno se filtra,
-- si una campaña sale mal, o si el dueño simplemente no llega a apagarla a tiempo, la única
-- salida es entrar a la lista y desactivarlos uno por uno — desde el celular, cocinando. El
-- dueño lo pidió con esas palabras: un freno "por si en su momento fallas o no lo detienes".
--
-- ⚠ SE GUARDA LA HORA, NO UN BOOLEANO, y eso no es cosmético: un kill switch tiene el modo de
-- fallo INVERSO al de la pausa de tienda. La pausa se reanuda sola comparando contra el reloj,
-- porque olvidarse encendida cierra el negocio. Éste NO puede auto-revertirse: si lo bajaste
-- porque un código se filtró, que se vuelva a encender solo es el peor resultado posible.
-- Pero entonces el riesgo se invierte — queda apagado y nadie se acuerda — así que guardar la
-- HORA deja que el panel diga "llevas 3 días sin promociones", que es lo único que evita que
-- se quede así para siempre. Un booleano no puede decir eso.
--
-- QUÉ APAGA Y QUÉ NO:
--  · SÍ: los códigos promocionales (todos, de golpe) y cualquier promo por ventana horaria.
--    Son lo "pauteado": lo que se enciende para una campaña y puede quedarse encendido.
--  · NO: las recompensas por puntos (R02-R06), el crédito interno, el sándwich gratis del
--    organizador de un grupo ni los bonos de referido. Eso el cliente YA SE LO GANÓ — apagarlo
--    no sería frenar una campaña, sería romper una promesa, y es exactamente la clase de cosa
--    que este negocio ya decidió no hacer nunca.
--  · NO: el combo sándwich+bebida. Es estructura de la carta, no una campaña: está pintado en
--    el menú, así que apagarlo desde el servidor haría que el cliente vea un precio y se le
--    cobre otro en el checkout.

alter table public.app_settings
  add column if not exists promos_killed_at timestamptz,
  add column if not exists promos_killed_by text;

comment on column public.app_settings.promos_killed_at is
  'Hora en que se bajó el interruptor de promociones. NULL = promociones activas. No se '
  'auto-revierte a propósito; la hora existe para que el panel pueda decir cuánto lleva abajo.';
