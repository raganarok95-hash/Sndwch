-- Cierra un hallazgo de riesgo legal de la re-auditoría: un reclamo del Libro de
-- Reclamaciones sin responder podía vencer el plazo de 30 días calendario (exigido por el
-- Código de Protección y Defensa del Consumidor) en silencio, sin ningún aviso al negocio —
-- a diferencia de un pedido atascado, que sí avisa a los 10 minutos. alerted_deadline sigue
-- el mismo patrón que orders.alerted_stuck: evita reenviar el mismo aviso cada vez que
-- corre el cron mientras el reclamo sigue sin respuesta.
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS alerted_deadline boolean NOT NULL DEFAULT false;
