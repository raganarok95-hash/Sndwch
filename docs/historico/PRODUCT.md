# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two distinct users on the same app:
- **Clientes finales** — residentes de Trujillo, Perú, pidiendo sándwiches para delivery vía una PWA de una sola página, desde el celular en su mayoría. Pueden pedir como invitados o con cuenta (registro exige DNI, PIN, fecha de nacimiento).
- **El dueño**, único operador — arma cada pedido él mismo (sin personal, mientras el volumen lo permita) y usa el mismo panel admin tanto para cocina (cola de pedidos, "modo foco" de un pedido a pantalla completa) como para negocio (dashboard, marketing, inventario), casi siempre desde su propio celular.

## Product Purpose

SND//WCH es una sandwichería con pedidos online — build-your-own o Signatures curados, con programa de puntos/recompensas, pagos con tarjeta (Culqi)/Yape/Plin/crédito interno, pedido programado y pedido grupal. Existe para operar el negocio real del dueño de principio a fin (pedido → cocina → entrega → fidelización), no como demo.

## Positioning

Se distingue deliberadamente de un build-your-own tipo Subway: Signatures curados con nombre propio, un menú secreto de rotación mensual (desbloqueado por rango de fidelidad, antes fijo bajo el nombre "The Vault") y una identidad de marca centrada en el símbolo "//" — sin apoyarse en gaseosas de reventa ni en ninguna identidad regional/geográfica.

## Operating Context

- **El negocio físico aún no ha abierto** (lanzamiento estimado ~septiembre 2026) — todo lo que hoy hay en `orders`/`customers` es data de prueba, no ventas reales. Cualquier proyección financiera es una simulación hasta que haya volumen real.
- Un solo operador (el dueño) prepara todo — el panel admin está diseñado para uso con una mano/celular, no para un equipo de turnos.
- El delivery lo paga y coordina el dueño por fuera de la app (motorizado); la app solo cobra un fee pass-through al cliente.
- Pagos Yape/Plin son manuales: quedan `pending` hasta que el dueño confirma a mano que llegó la transferencia en su app bancaria — no hay integración automática con esos rieles.
- Recién en esta sesión se completó la única automatización real de redes sociales: publicación directa a Instagram/Facebook vía Meta Graph API (requiere que el dueño configure 3 secretos — ver `supabase/functions/api/env.ts`); antes de eso, todo el "contenido de marketing" del panel era texto para copiar/pegar a mano.

## Capabilities and Constraints

- Catálogo: build-your-own (base+proteína+toppings+salsas, tamaños 15CM/30CM, doble proteína) o 7 Signatures (6 públicos + el menú secreto (rotación mensual), desbloqueado por rango); 4 bebidas de la casa (sin gaseosas de reventa).
- Checkout multi-ítem: tarjeta (Culqi, reserva atómica antes de cobrar), Yape/Plin manual, crédito interno, recompensa que cubre el 100%, o combinación con código promocional; pedido inmediato o programado dentro de horario.
- Fidelidad: puntos 1:1 por sol gastado, bono de bienvenida/referido, retos mensual y de descubrimiento, rangos puramente cosméticos (nunca cambian precio), recompensas canjeables (R02-R06), tarjeta de regalo (con puntos, sin cobro real), Plan Semanal (paga S/95 hoy, recibe S/100 en saldo).
- Pedido grupal: un organizador crea un código, cualquiera con el link agrega su sándwich sin cuenta, se paga todo junto.
- Legal: DNI obligatorio en registro (nunca opcional); Libro de Reclamaciones Virtual público, texto legal nunca se modifica sin pedido explícito; identidad legal del negocio (RUC, razón social) es real y nunca se debe inventar si falta un dato.
- Admin: cola de pedidos priorizada + "modo foco" (un pedido a pantalla completa, acción anclada al fondo del viewport), dashboard de negocio, inventario/catálogo editable, códigos promo, calendario de contenido con publicación real a Instagram/Facebook, lista de espera pre-lanzamiento, auditoría de acciones admin.
- Sin app nativa — PWA instalable. Sin conector de terceros para redes sociales más allá de la integración directa a Meta Graph API ya construida.
- Backend: Supabase (Postgres + edge functions Deno), sin framework en el cliente (un solo `src/app.ts` que compila a `index.html`).

## Brand Commitments

- **"//"** es la identidad de marca permanente, pero solo como concepto/ícono — no está atado a ninguna paleta, tipografía o connotación estética específica; esas siguen siendo libres de cambiar.
- **SND//WCH no tiene identidad trujillana/regional** — descartado explícitamente por el dueño (2026-07-29); no proponer ni asumir referencias a Trujillo, cultura Chimú/Moche, ni ningún otro anclaje geográfico en paleta, iconografía o naming.
- Nombre del negocio: SND//WCH.

## Evidence on Hand

- Identidad legal real del negocio (RUC, razón social) ya cargada en el backend (`env.ts`) — nunca se debe regenerar ni inventar si falta algo, se pregunta.
- Página de Facebook, cuenta de Instagram Business y Meta Business Manager reales ya creados por el dueño (confirmado en esta sesión) — la integración de publicación ya está construida, solo falta que el dueño configure 3 secretos de acceso.
- Fotografía de producto: se ha usado fotografía de stock licenciada (Adobe Stock) para los Signatures — no hay fotos reales del local/comida física todavía porque el negocio no ha abierto.
- Sin testimonios, reseñas o cifras de ventas reales todavía — cualquier "reseña" o "cliente" que aparezca en el catálogo de pruebas es data de prueba, no debe tratarse como evidencia real de producto.

## Product Principles

1. **Curado, no solo build-your-own** — los Signatures y el menú secreto son la diferenciación real frente a un armador genérico de sándwiches.
2. **Ningún "automático" que no lo sea de verdad** — cada feature de automatización (marketing, recordatorios, publicación social) es honesta sobre lo que en verdad ejecuta; nunca se implica una acción que no ocurre.
3. **Diseñado para un operador solo, con su celular** — el panel admin prioriza ergonomía de una mano/pantalla chica sobre flujos pensados para un equipo con turnos.
4. **Integridad financiera primero** — reservas/reclamos atómicos en cualquier operación que mueva dinero o puntos, para que un doble tap o una condición de carrera nunca duplique un cobro o farme puntos.
5. **Ningún dato legal o de marca se inventa** — RUC, razón social, identidad regional, testimonios, fotos de producto: solo se usan si son reales, y se pregunta antes de rellenar un vacío.

## Accessibility & Inclusion

Sin un estándar formal exigido todavía. En la práctica se han corregido varios hallazgos puntuales de contraste (texto sobre botones de color semáforo en el panel admin, modo claro/oscuro) según auditorías previas, pero no hay un compromiso WCAG documentado como requisito de producto.
