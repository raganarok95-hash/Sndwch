---
name: embudo-de-la-app
description: Cómo mide y mejora SND//WCH la conversión de su app (de la visita al pago): visitas por enlace, carritos guardados y recordados, pagos que no terminaron, el recorrido real diario, y propuestas de experimento. Úsala para encontrar dónde se pierden pedidos en sndwch.app.
user-invocable: false
---

# El embudo de la app

Cada visita que no termina en pedido es plata de pauta que se fue. Un punto de conversión vale lo
mismo que bajar el costo por clic, y no cuesta pauta.

## Las etapas y su fuente (solo lectura)
| etapa | fuente |
|---|---|
| visitas por enlace | `visitas_por_origen` (`dia`, `src`, `visitas`) |
| carritos armados | `cart_snapshots` (`items`, `updated_at`, `reminded_at`: el recordatorio ya existe) |
| intentos de pago | `pending_charges` (`status`: `pending`, `charging`, `charged`, `consumed`, `expired`, `cancelled`; `expected_total`, `delivery_zone`, `promo_code_id`) |
| pedidos pagados | `orders` (`payment_status = 'paid'`, `origen`) |
| fuera de zona | `zone_waitlist` |
| el recorrido de un cliente | el workflow `recorrido-real.yml` (diario) y `scripts/sitio-real.mjs` |

## Lo que se calcula
- Conversión visita → pedido por `src` (y por canal: anuncio, Instagram, WhatsApp, directo).
- **Pagos que no terminaron**: `expired` + `cancelled` sobre el total de intentos, por método de
  pago, por zona, por monto y por hora. Un salto en uno solo es una pista concreta.
- Carritos sin pedido y cuántos volvieron después del recordatorio.
- Visitas desde fuera de zona.

## Cómo se propone una mejora
1. El dato (con su número y cuántos casos; con menos de 30, «todavía no se sabe»).
2. La hipótesis: qué fricción lo explica (mirar la pantalla real: `npm run build` y abrir
   `index.html`, o las capturas del recorrido).
3. El cambio más chico que la prueba, y cómo se mide.
4. **Concepto antes que código** (`CLAUDE.md`): la propuesta va al dueño; no se toca la app.

## Lo que no
Cambiar la app, la base o el texto legal; mandar mensajes a clientes; quitar el DNI del registro
(es obligatorio salvo con Google).
