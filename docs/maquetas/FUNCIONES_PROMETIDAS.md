# Lo que prometen las maquetas aprobadas, contra lo que existe hoy (2026-09-24)

Revisión de las 35 maquetas de `aprobadas/`, una por una. Cada cosa que la pantalla le
**promete** al cliente (un dato, un botón, un aviso) se buscó en el cliente, en el servidor y
en la base real. Las cifras y nombres de muestra no cuentan: salen del código.

## ✅ Ya existe — solo falta pintarla como la maqueta

| maqueta | qué promete | de dónde sale hoy |
|---|---|---|
| 01 · Ficha / Ficha WICHO | receta, 15 y 30 cm con precio, «Lo quiero» | `get-catalog`, `catalog_items` |
| 23 · La comanda | el ticket de cocina con cada parte | pantalla de cocina del panel |
| 29 · Tus puntos y sus 3 estados | «dos pedidos más y te lo doy», qué ya puedes canjear, cuánto falta para cada recompensa | la escalera por pedidos (`count:3`, `count:5`) y `REWARDS` |
| 30 G2 · El carrito | ítems, combo −S/1, envío por km, «Programar», «Cambiar» dirección | `deriveCart`, tarifa por distancia, pedido programado |
| 31 · Tarjeta | la comisión va sobre el envío, «si no abre, elige Yape» | `create-charge` (Culqi) |
| 31 · Yape | monto, QR, «Prefiero tarjeta · son S/x más», «Ya pagué» | Yape manual; la captura es opcional. **Falta la imagen de tu QR** |
| 33 · Tus pedidos / los sellos | el último arriba con «Pedir lo mismo», sellos por fecha, «has comido acá N veces» | `my-orders`, `my-history` |
| 34 · Dónde te lo dejamos | varias direcciones con nombre, km y envío de cada una | `saved_addresses` (lat/lon) + tarifa por distancia |
| Bebidas (los dos lados) | 500 ml, S/6 suelta, S/5 en combo | catálogo + combo |
| Entrar | correo + código de 6 dígitos, Google, nombre y DNI solo la 1.ª vez | `request-login-code`, `google-auth` |
| Estado vacío | el patrón con el hermano | `VACIO()` |
| La puerta M2 | «abierto ahora · cierra 10 p.m. · delivery desde S/x» | `get-store-hours` + tarifa mínima |
| Mundo SANDO M15 / WICHO M22 + puente | los Signatures uno por uno, el armador por pasos, el puente, la fila del secreto | catálogo + armador |
| Menú secreto | se desbloquea por pedidos, precio, «pedirlo a ciegas» | `secret_signature` |
| Pedido grupal | enlace, quién pidió qué, minutos que quedan, cerrar y pagar | `create/get/add/close-group-order` |
| Detalle de un pedido | lo pediste / prometimos / llegó a las · «dentro» | `created_at`, `eta_minutes`, `delivered_at` |
| Tu cuenta | pedidos, puntos, crédito, direcciones, datos, cerrar sesión, borrar cuenta | `customers`, `delete-account` |
| Lo legal | los tres textos | ya están; **las fechas las pones tú** |

## ⚠ A medias — existe una parte, la maqueta promete más

1. **«Llega 7:40 – 8:05» antes de salir** (30 G2, 31, 06, detalle «prometimos»). Hoy la hora
   estimada solo se fija cuando el pedido pasa a EN CAMINO. Al pagar no hay ninguna ventana
   que mostrar. Hace falta calcularla al hacer el pedido (preparación + km) y guardarla, para
   que el «prometimos» del detalle sea lo que de verdad se prometió.
2. **Tu pedido fijo: «lo mandamos solo, a la hora de siempre»**. Hoy `recurring_orders` solo
   **recuerda**: no manda nada solo. Ya decidiste «apartar la franja sin cobrarla» (tarea
   #61). Los datos «lo pediste 9 veces · siempre a las 7:20» sí se pueden sacar del historial.
3. **Direcciones con referencia** («Urb. San Andrés · timbre 302, portón negro»). La tabla
   solo guarda nombre, dirección y coordenadas: no hay dónde anotar la referencia.
   Y «fuera de los distritos… te avisamos apenas abramos la zona» no tiene nada detrás
   (`waitlist-join` es la lista de antes de abrir, no por zona).
4. **Menú secreto: «el secreto de septiembre · 11 días», «los que ya no vuelven» y las tres
   pistas** («Pica, y no de mentira»). No hay fecha de fin, no hay pistas guardadas y no se
   muestran los anteriores. La historia sí existe (la tabla nunca borra filas); la fecha de
   fin y las pistas hay que agregarlas y cargarlas desde el panel.
5. **Pedido grupal: «tu parte por ahora», «el envío se parte entre todos» y «Yo invito»**.
   ✅ **Hecho el 2026-09-24** (el dueño eligió «cada uno paga lo suyo»): «Cerrar y pagar»
   pide la dirección con pin y crea un pedido Yape por persona con su parte del envío
   partida en céntimos (`split-group-order`, `repartirGrupo`); lo que no se paga en 20
   minutos se cancela y repone stock (`expire-group-shares`). «Yo invito» es el cierre de
   siempre. El enlace muestra el dominio real, no `snd.pe`. Lo que sigue es el texto previo:
   Hoy paga todo quien organiza, en un solo cobro. «Tu parte» y el envío repartido se pueden
   **mostrar**; que cada uno pague lo suyo no existe. Y los dos botones («Cerrar y pagar» /
   «Yo invito») hoy hacen lo mismo. Además, el enlace `snd.pe/g/…` no es el dominio real
   (tarea #60).
6. **Tu cuenta: «Cómo pagas · Yape por defecto» y «Avisos · cuando sale y cuando llega»**.
   No hay dónde guardar esas preferencias (tarea #64).
7. **Ficha WICHO: «¿Lo quieres a tu manera? Arma uno parecido»**. Falta precargar el armador
   desde un Signature (tarea #65).

## ❌ No existe, y tal como está dibujado no se puede cumplir

1. **32 · En camino: «1.2 km de ti» y «Ya salí. Voy por Larco»**. El reparto lo hace un
   tercero coordinado por WhatsApp: no tenemos su ubicación. Lo que sí se puede cumplir: la
   cuenta regresiva «14 min» (sale de `eta_minutes` y la hora en que salió) y la barra lo
   armamos → salió → tu puerta. Para la distancia en vivo habría que dársela a quien reparte.
2. **32 · «¿Algo que avisarle? Escribir»**. No hay canal hacia quien reparte. Se puede
   cumplir mandándolo a tu WhatsApp, que es quien habla con él.
3. **Detalle · «Descargar comprobante · PDF»**. No existe nada. Una boleta o factura
   electrónica necesita RUC y un proveedor SUNAT; eso no se inventa. Lo único posible sin
   eso es un resumen del pedido que diga que **no** es comprobante de pago.

## ⛔ La maqueta contradice el texto legal

- **Detalle de un pedido · «Algo salió mal · hasta 48 h después»**, y la pantalla 35 entera
  (elegir «Faltó algo / Llegó frío / …» y «Sando responde antes de las 9 p.m.»). Tus
  Términos dicen **«repórtalo dentro de las 2 horas siguientes a la entrega por WhatsApp o
  desde el Libro de Reclamaciones»**. Además, hoy lo único que existe es el Libro de
  Reclamaciones (reclamo o queja, con plazo legal en días hábiles), no un reporte rápido del
  pedido. El texto legal no se toca sin que tú lo pidas: o la pantalla dice 2 horas, o
  cambias los Términos.
- «Sando responde antes de las 9 p.m.» es una promesa de plazo que nada vigila.

## Aprobadas pero retiradas de la apertura

Plan semanal y Tarjeta de regalo. El código existe; no se construyen para abrir.
