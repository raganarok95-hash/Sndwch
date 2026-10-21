# Qué falta para operar con los sándwiches (2026-10-21)

Dueño: «Ayúdame por favor a ver qué nos falta para operar con los sándwiches». Revisado contra
producción el 2026-10-21 (`estado-apertura.yml` y la base), no de memoria.

## Lo que ya está (verificado hoy)

- **La carta**: 6 Signatures activos a S/19.90 (15CM) y S/30.90 (30CM).
- **El horario**: martes a domingo, de 11:00 a 22:00; los lunes cerrado.
- **Los pagos**: Yape por defecto, con el número de cobro cargado, y tarjeta (la llave de Culqi
  está puesta).
- **Lo demás del sistema**: correos (Resend), Google (entrar y mapa), y el píxel y CAPI de Meta,
  probados contra Meta.
- **Permisos**: PHS, fumigación, ITSE y licencia (dueño, 2026-10-07: «Permisos están listos hace
  bastante»).
- **Motorizados**: listos (dueño, 2026-10-07).
- **Bebidas solas desde 2**: hecho hoy.

## Lo que bloquea abrir

1. **Los sellos y las bolsas kraft.** No han llegado: su fecha de entrega fija el día de apertura
   (P57).
2. **El día de apertura (P57).** Con el día, se escribe en
   `scripts/video-auto/reglas-del-revisor.mjs` y se rehacen el lanzamiento y el plan de cocina.
3. **Las alertas de pedidos en tu celular (P38).** Verificado hoy: **0 celulares tuyos
   suscritos**. Sin eso, un pedido nuevo, un Yape por confirmar o un pedido trabado no suenan.
4. **La boleta (P62).** En el Nuevo RUS cada venta lleva boleta, y en el proyecto no hay nada
   decidido sobre cómo se da. Se elige con el contador: la boleta electrónica gratuita de SUNAT o
   un talonario.
5. **El inventario: «Abro con N» cada mañana.** Hoy hay 0 productos cargados. **Sin cargarlo, la
   app vende sin límite**: no frena cuando se acaba una proteína.
6. **Un ensayo general, el día antes.** Que 2 o 3 conocidos pidan de verdad: uno con Yape, uno con
   tarjeta y uno con un motorizado real. Hay que ver que suene, que llegue el correo, que el
   motorizado entienda la dirección, y probar el panel: confirmar el Yape, cambiar los estados y
   cancelar.
7. **Los 4 pedidos de prueba** (cancelados) siguen en la base. Borrarlos para que los números del
   primer día empiecen en cero es borrar datos: va con tu sí (P63).
8. **Prender la app el día de apertura**: en el panel, «Ya abrimos →». Hoy está en «Aún no
   abrimos».

## La cocina, antes del primer día

- **Las compras de la primera semana**: están en `docs/equipo/APERTURA_OPERACION.md` (res, carne
  molida, atún, pavo, embutido, quesos, 12 panes sub y verdura), y se rehacen con la fecha nueva.
- **El lunes antes de abrir** (cerrado): laminar y porcionar la res (~2 h), hacer las albóndigas
  (~2 h) y la cebolla salteada.
- **El empaque completo**: bolsas, sellos, papel para envolver, servilletas y el QR de la bolsa
  (P0b).
- **Con qué bebidas abres.** Hoy la app tiene las 3 de siempre (con azúcar, en botella, a S/5–6).
  Para abrir con la línea nueva de cero azúcar hay que cambiar nombres, descripciones y precios en
  la carta: con tu sí, después de probarlas (P59).
- **Cuántos días aguanta cada insumo (P17)** y **cuánto tarda cada proveedor (P11)**. La alerta
  de caducidad arranca en 3 días para todo.

## Si abres también en Rappi o PedidosYa

- La vitrina, los precios con +10% y las preguntas al ejecutivo (P46, P55, P56).
- **Sus pedidos no descuentan el stock de la web (P54)**: hay que bajarlo a mano en el panel.

## Puede esperar al primer mes

- El token de Instagram para publicar solo (P40). Verificado hoy: sigue sin los permisos de
  Instagram.
- Meta, en pausa hasta que llegue el empaque. Plan: 14 días sin anuncios (P1b).
- Embajadores, TikTok, la ficha de Google y referidos.
