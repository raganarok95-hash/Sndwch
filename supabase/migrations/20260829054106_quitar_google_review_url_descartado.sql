-- Se retira el enlace de reseña de Google: el dueño lo descartó por no aportar valor.
-- La columna se agregó hoy mismo (migración 20260829020112) y nunca se llegó a usar —
-- verificado que estaba en NULL antes de borrarla, así que no se pierde ningún dato.
--
-- Se elimina en vez de dejarla vacía: una columna que nadie lee ni escribe es una promesa
-- de funcionalidad que no existe, y la próxima sesión que abra el esquema perdería tiempo
-- averiguando quién la usa. El código que la leía (actGetStoreHours,
-- actAdminSetGoogleReviewUrl y el bloque del cliente) se quitó en el mismo cambio.
alter table public.app_settings drop column if exists google_review_url;
