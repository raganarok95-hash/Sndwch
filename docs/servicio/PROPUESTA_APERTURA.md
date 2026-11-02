# Servicio listo para abrir el 20 de noviembre: lo arreglado y lo que espera tu sí (2026-11-02)

## Ya estaba bien (revisado contra el código y la base)
- Libro de Reclamaciones virtual: público sin cuenta, código correlativo `REC-AAAA-000000`,
  correo de constancia al consumidor, respuesta desde el panel que llega por correo, y el reclamo
  no se marca «atendido» si el correo no salió.
- Plazo legal de **15 días hábiles** (Ley 31435). Aviso a 4 días y a 1 día del vencimiento; la
  tarea corre cada día a las 8 a.m. y su última corrida fue hoy, sin errores. Cero reclamos en la base.
- Avisos de estado al cliente: correo al recibir, en preparación, en camino (con hora estimada) y
  entregado; push en los mismos momentos para quien lo activó.
- «Algo salió mal»: el cliente reporta hasta 48 h después de la entrega, se le promete una hora de
  respuesta y te llega un aviso si se va a pasar.

## Arreglado hoy (eran errores silenciosos)
1. **Un reclamo nuevo solo avisaba a `contacto@sndwch.com`.** Ahora también te llega push (o, sin
   celular suscrito, correo a tu cuenta admin). Antes podías enterarte recién a 4 días del vencimiento.
2. **Cancelar un pedido no mandaba correo**, solo push, y casi nadie tiene el push activado (en la
   prueba: 0 de 7 pedidos con push, 6 de 7 con correo). Ahora el cliente recibe un correo; si ya
   había pagado, le dice que se le devuelve por el mismo medio. Igual cuando se cancela solo por
   un Yape no confirmado.
3. **La respuesta a «Algo salió mal» solo iba por push** y el panel decía «Le avisamos al cliente»
   aunque nadie lo recibiera. Ahora va también por correo, y el panel dice la verdad si no salió.
4. El correo de «Recibimos tu pedido» mandaba a una sección que ya no existe («PUNTOS → MIS
   PEDIDOS»); ahora lleva el enlace directo al pedido.

## Espera tu sí

### A · Libro de Reclamaciones: tres cosas que pide el reglamento (es texto legal: no se toca sin ti)
1. **Falta el domicilio del proveedor.** La hoja muestra nombre y RUC, pero de dirección solo
   «Trujillo, Perú». Propuesta: «Av. Prolongación César Vallejo 2670, Trujillo» (la que ya va en
   la etiqueta de las latas).
2. **Falta la leyenda obligatoria**: «La formulación del reclamo no impide acudir a otras vías de
   solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.»
3. **La constancia por correo solo trae el código.** Debería traer la copia de la hoja: fecha y
   hora, datos del consumidor, pedido, monto, detalle y lo que pide.
4. Menor: la definición de «Queja» pone de ejemplo «demoras». La demora de un pedido pagado es un
   **reclamo** (tiene que ver con el servicio contratado). Propuesta: ejemplo «atención».

**Y una pregunta:** ¿`contacto@sndwch.com` existe y lo lees? La marca usa `sndwch.app`. Ese correo
sale en la app, en Privacidad y es donde llega cada reclamo.

### B · Aviso automático de demora al cliente
Hoy, si un pedido va tarde, te avisa a ti, pero el cliente no recibe nada hasta que escribe. Propuesta:
cuando salte tu aviso de «pedido estancado», al cliente le llega una vez (correo + push):
«Tu pedido [REF] va un poco tarde. Ya estamos en eso y te avisamos apenas salga.»

### C · Que un reembolso o un crédito prometido no se olvide
- Si eliges «Crédito» en «Algo salió mal», al cliente le llega «Te dejamos el monto como crédito»,
  pero el crédito **no se carga solo**: hay que entrar aparte a crédito manual. Propuesta: que se
  cargue en el mismo toque (el monto del pedido, o el que pongas).
- Si cancelas un pedido pagado o eliges «Reembolso», no queda registro de que falta devolver.
  Propuesta: una lista «Por devolver» en el panel hasta que marques «devuelto».
- Los Términos dicen que el cliente **elige** entre reposición, crédito o reembolso; hoy eliges tú.
  Las respuestas tipo de abajo se lo preguntan al cliente para cumplirlo.

### D · Respuestas tipo para WhatsApp
Demoras, errores, reembolsos y cancelaciones: `docs/servicio/RESPUESTAS_TIPO.md`. Se cargan como
respuestas rápidas en WhatsApp Business; nunca salen solas.
