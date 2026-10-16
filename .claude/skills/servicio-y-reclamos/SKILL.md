---
name: servicio-y-reclamos
description: Cómo atiende SND//WCH lo que sale mal después del pago (reclamos del Libro de Reclamaciones con su plazo legal, pedidos con problema, cancelaciones, calificaciones bajas) y cómo convierte cada uno en una causa que se arregla. Úsala para revisar reclamos y calificaciones o preparar respuestas para el dueño.
user-invocable: false
---

# Servicio y reclamos

Un cliente molesto bien atendido vuelve; uno ignorado deja una reseña y, si es un reclamo formal,
una multa. Comunidad responde en redes; **Servicio** atiende lo que pasó con un pedido.

## De dónde sale (solo lectura)
| qué | fuente |
|---|---|
| reclamos y quejas formales | `complaints` (`claim_code`, `created_at`, `kind`, `detail`, `consumer_request`, `status` `pendiente`/`atendido`, `responded_at`) |
| el plazo legal | **15 días hábiles** (`supabase/functions/api/actions/complaints.ts`); el panel avisa cuando se acerca |
| pedidos con problema | `order_problems` (`motivo`, `respond_by`, `resolved_at`, `resolution`) |
| cancelaciones | `orders.status = 'CANCELADO'` y `cancel_reason` |
| calificaciones | `ratings` (`stars`, `comment`, `testimonial_consent`) |

## Cada día
- **Reclamos pendientes** con los días hábiles que quedan. A 5 días o menos: primero en la lista
  del dueño. Un reclamo vencido es un riesgo legal: se dice así.
- Pedidos con problema sin resolver pasada su hora (`respond_by`).
- Calificaciones de 1 o 2 estrellas del día anterior.

## Cada semana
- Por causa (tarde, frío, faltó algo, equivocado, cobro, app): cuántos y la causa raíz. Lo que se
  repite va al dueño con el arreglo propuesto (a Operación si es cocina o entrega; a Conversión si
  es la app).
- Cancelaciones por motivo.
- Calificación promedio y comentarios con permiso de testimonio (útiles para marketing, solo con
  `testimonial_consent`).

## Las respuestas
El borrador para que el dueño lo revise y lo mande desde el panel: corto, con tú, con el hecho y
lo que se hace. **El arreglo (reembolso, reposición, crédito) lo decide el dueño.** El texto legal
no se toca.

## Lo que no
Responder un reclamo por su cuenta, prometer reembolsos, poner datos del consumidor en el repo
(nombre, DNI, dirección, teléfono): solo el `claim_code`.
