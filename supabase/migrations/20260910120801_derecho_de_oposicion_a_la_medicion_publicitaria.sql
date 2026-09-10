-- DERECHO DE OPOSICIÓN A LA MEDICIÓN PUBLICITARIA (Ley 29733, art. 2.18)
--
-- La Política de Privacidad decía "no compartimos tus datos con terceros para publicidad".
-- Prender el píxel de Meta convierte esa frase en falsa, así que el texto se corrigió para
-- decir la verdad. Pero un texto legal que solo AVISA no alcanza: la ley peruana le da al
-- titular el derecho de OPONERSE al tratamiento con fines publicitarios, y prometerlo sin
-- un interruptor que lo cumpla es una promesa que se rompe el primer día que alguien la use.
--
-- `false` por defecto y no `true`: la medición es legítima y el consentimiento se da al
-- aceptar la política en el registro. Lo que la ley exige es que oponerse SEA POSIBLE, no
-- que haya que pedirlo. Quien no toca nada queda como está hoy.
--
-- Se guarda por CLIENTE y no por dispositivo a propósito: alguien que se opone desde el
-- celular no querría que su pedido desde la computadora sí se reporte.
alter table customers
  add column if not exists ad_tracking_opt_out boolean not null default false;

comment on column customers.ad_tracking_opt_out is
  'El cliente ejerció su derecho de oposición (Ley 29733): sus pedidos NO se reportan a Meta '
  'ni por el píxel del navegador ni por la Conversions API. No afecta precios, puntos ni nada '
  'del pedido — solo la medición de campañas.';
