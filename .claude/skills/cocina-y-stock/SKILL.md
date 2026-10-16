---
name: cocina-y-stock
description: Cómo se opera la cocina de SND//WCH para no perder ventas ni botar comida (qué preparar hoy, stock y vida útil, capacidad por hora, pedidos con problema, tiempos de entrega del tercero, agotados). Úsala para planear el día, revisar la operación de la semana o proponer mejoras de cocina y entrega.
user-invocable: false
---

# Cocina y stock

El dueño arma cada pedido él mismo y trabaja en casa de 8:50 a 18:00; **no reparte** (lo hace un
tercero avisado en un grupo de WhatsApp, `docs/NEGOCIO.md`). Cada agotado es una venta perdida y
cada porción vencida es plata botada: el trabajo es acertar la cantidad.

## De dónde sale cada cosa (solo lectura)
| qué | tabla o lógica |
|---|---|
| stock por producto, umbral, cuándo se cocinó y cuánto dura | `inventory` (`stock_qty`, `low_stock_threshold`, `batch_cooked_at`, `shelf_life_days`, `in_stock`) |
| lo programado para las próximas horas | la lógica de `actAdminPrepList` (`supabase/functions/api/actions/admin.ts`) sobre `orders` con `promised_from` |
| la carga de cada hora | `supabase/functions/api/capacidad.ts` (**la única** que cuenta la carga) |
| recetas e insumos por porción | `production_recipes`; costos en `modelo/insumos.py` |
| pedidos con problema | `order_problems` (`motivo`, `respond_by`, `resolved_at`) |
| la demanda que no se atendió | `restock_notify_requests` (pidieron avisar cuando vuelva), `zone_waitlist` (fuera de zona) |
| tiempos | `orders`: `created_at` → `status_changed_at` → `delivered_at`; `eta_minutes`, `alerted_eta_missed` |

## El plan del día (para el dueño, a primera hora)
1. **Cuánto preparar** por proteína: lo vendido el mismo día de la semana en las últimas 4
   semanas (o la proyección de `modelo/proyeccion.py` si todavía no hay historia), más lo ya
   programado, menos el stock que sigue dentro de su vida útil. Redondear hacia arriba en la
   estrella (Philly) y hacia abajo en lo que vence rápido.
2. **Lo que vence hoy o mañana** (`batch_cooked_at + shelf_life_days`): usarlo primero; si sobra,
   proponerlo al Media buyer o a Growth para empujarlo (nunca con descuento sin el sí del dueño).
3. **La hora pico** esperada (capacidad): si se va a llenar, avisar para preparar antes.
4. Lo que hay que comprar, con cantidades.

## La semana
- Agotados: cuántas horas estuvo agotado cada producto y cuántos avisos de reposición dejó.
- Merma: lo que venció sin venderse (si el dueño lo anota).
- Tiempos: de pedido a entrega, por franja; cuántos pasaron su hora prometida.
- Pedidos con problema: por motivo; los que se repiten tienen una causa que se arregla.
- Zonas pedidas fuera de cobertura (`zone_waitlist` por distrito): si una se repite, es una
  propuesta para el dueño (ampliar zona cambia costos de envío: va con su número).

## Lo que no
Cambiar stock, recetas ni horarios en la base (el dueño lo hace en el panel), coordinar con los
motorizados (es del dueño), proponer un cambio de precio.
