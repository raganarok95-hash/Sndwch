# Lo que depende de Ezra — una sola lista

Reemplaza a `docs/PENDIENTE_DEL_DUENO.md` (no se actualizaba desde el 2026-10-21). Reglas en
[`../README.md`](../README.md). **Antes de preguntarle algo a Ezra, buscarlo aquí.** Sin montos: el repo es público.

Estado: `abierta` (espera a Ezra) · `respondida` (con sus palabras y la fecha) · `de-otro-hilo` (la sabe un hilo, no Ezra).
El vigía de las 22:13 cuenta las filas `abierta` y las pone en el correo de cierre.

| id | desde | hilo | pregunta | estado | respuesta |
|---|---|---|---|---|---|
| Q01 | 2026-11-03 | app | Pegar el token de Instagram (empieza con «IG») como `INSTAGRAM_LOGIN_TOKEN` en Supabase | respondida | Ya está: verificado en la base el 2026-11-10 (token «IG», se renovó solo el 2026-11-08, vence el 2027-01-07). |
| Q02 | 2026-11-03 | app | Pegar en Supabase el borrado de los 7 pedidos de prueba | abierta | |
| Q03 | 2026-11-03 | operativo | A quién le compras la res, la carne molida, el pavo y el pan, y cuántos días tarda cada uno | abierta | |
| Q04 | 2026-11-03 | operativo | ¿Ya llegaron las bolsas kraft y los sellos? | respondida | Ezra, 2026-11-11: «No llegaron ni kraft ni sellos. por eso por ahora quiero que generes igual lo que ibamos a hacer con los sellos, como stickers». Diseños hizo `sticker-sello-10x10cm`. |
| Q05 | 2026-11-03 | operativo | Qué equipos ya tienes: congeladora, balanza, termómetro, pHmetro, refractómetro | abierta | |
| Q06 | 2026-11-05 | operativo | El sí a la compra del primer fin de semana (lista en la carpeta del proyecto, `operacion/compras-apertura.md`) | respondida | Ezra, 2026-11-10: «Y sí dale luz verde a todo»; 2026-11-12: «todo debe ser como ya existe entonces laminado como ya venden». Pavo Braedt ya tajado. La compra la hace él. |
| Q07 | 2026-11-03 | finanzas | Comisión real de PedidosYa, y si el 26% de Rappi es + IGV | en parte | Ezra 2026-11-12: «Me cobrarán 30% por pedidos» (PedidosYa, más un fijo al mes). Falta: si la de Rappi y la de PedidosYa llevan IGV. |
| Q08 | 2026-11-02 | servicio | ¿Existe y revisas `contacto@sndwch.com`? Ahí llegan los reclamos | abierta | |
| Q09 | 2026-11-06 | recetas | Qué chimichurri con piña ganó la cata, A o B | respondida | Ezra 2026-11-12: «No lo haré sigamos con lo que los datos indican que es mejor». Queda A (piña 30%), la que cumple «dulce y ahumada de entrada» de la carta. |
| Q10 | 2026-11-09 | disenos | Alto de la parte lisa de la botella de 500 ml (hacen falta 10.5 cm) | abierta | |
| Q11 | 2026-11-09 | disenos | ¿La imprenta tiene tinta blanca? | abierta | |
| Q12 | 2026-11-03 | disenos | ¿Las bebidas llevan sal? (la receta guardada dice 0.2 g por litro) | respondida | Ezra, 2026-11-02: «sin sal en la receta». Quitada del panel y del recetario el 2026-11-10 (RECETAS). |
| Q13 | 2026-11-10 | app | ¿Pongo en la base los umbrales de stock bajo de Operativo (Res 2; Albóndiga, Atún, Pavo y Embutido 1)? Sin eso el aviso salta desde el primer pedido. El SQL está en `docs/entregas/app/2026-11-10-stock-minimo-y-recorrido.md` | respondida | Ezra, 2026-11-11, en la tarjeta: «Sí, ponlos». Cargados en la base (migración 20261111115128). |
| Q14 | 2026-11-10 | app | Para que el recorrido diario revise la cuenta y los puntos de verdad: ¿creo una cuenta robot de cliente (sin pedidos, sin permisos de panel)? | respondida | Ezra, 2026-11-11, en la tarjeta: «Sí, solo de cliente». Hecha: scripts/robot-recorrido.mjs, el PIN cambia en cada corrida. |
| Q15 | 2026-11-11 | operativo | Las kraft: ¿el pedido sigue en camino y con qué fecha? Si no llegan el lun 16, ¿compro 30 bolsas kraft lisas en Trujillo el mar 17 y les pego el sticker al frente? | respondida | Ezra, 2026-11-12: «No veo nada para aprobar». Queda por defecto: si el lun 16 no llegó la kraft, el mar 17 se compran 30 lisas en Trujillo. |
| Q16 | 2026-11-11 | investigacion | ¿Cuáles de estas palabras dice la gente en Trujillo al hablar de su almuerzo o de un sánguche: bajonear/bajón, llenador, táper, combinado, menú, «al toque», buenazo, contundente? (no encontré fuente escrita; tu oído cuenta como fuente) | abierta | |
| Q17 | 2026-11-13 | marketing | El caption del post 6 del perfil (Turkey) dice «pavo horneado», y la carta ya no lo dice. ¿Lo cambio en Instagram a «pavo en lonjas finas»? (editar un caption publicado) | abierta | |
