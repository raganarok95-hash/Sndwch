# Orden de ejecución de las 93 automatizaciones vigentes

Fecha: 2026-08-29 · Aprobado por el dueño: "todos, en orden de prioridad de los que más
generan dinero y la prioridad que indicaste en el documento".

Los números son los de `docs/100_AUTOMATIZACIONES.md` y **no cambian nunca**, aunque se
hayan descartado 7 (48, 49, 76, 80, 81, 82, 85).

## Cómo se ordenó

Dos criterios combinados, como pidió el dueño:

1. **Cuánto dinero mueve** — primero lo que protege ingresos ya existentes o los recupera,
   después lo que los genera, después lo que ahorra costo, al final lo que solo informa.
2. **La prioridad del documento** — las 12 que marqué como "haría primero" suben, y lo que
   marqué "no haría todavía" baja al bloque que corresponde.

Un tercer criterio que no estaba en el pedido pero manda igual: **las dependencias**. El
#38 (precio de insumo por compra) va temprano no porque genere plata por sí solo, sino
porque sin él no se pueden hacer el #7, el #37, el #8 ni el #15.

---

## Lote E1 — Nada de esto puede esperar

Ordenado por consecuencia del peor caso, no por dinero.

| Orden | # | Qué | Por qué acá |
|---|---|---|---|
| 1 | 83 | Respaldo de la base | **Hoy no existe ninguno.** Es el único de la lista cuyo peor caso es "se perdió todo el negocio" |
| 2 | 100 | Restaurar el respaldo de prueba | Un backup que nunca se restauró no es un backup, es fe |
| 3 | 99 | Prueba de humo en producción tras deploy | El CI verifica antes de desplegar; nadie verifica después |
| 4 | 5 | Alerta de caducidad de tanda | Seguridad alimentaria. No es optimización |

## Lote E2 — Protege ingresos que ya existen

Lo que evita perder ventas o clientes que ya tienes.

| Orden | # | Qué |
|---|---|---|
| 5 | 11 | Bloqueo preventivo de Signature sin insumo comprometido |
| 6 | 26 | Alerta de pedido programado sin insumo |
| 7 | 23 | Auto-pausa al llenar la hora |
| 8 | 24 | Reapertura automática |
| 9 | 16 | ETA ajustada por cola |
| 10 | 79 | Alerta de pedido que pasó el ETA |
| 11 | 32 | Alerta de rechazo de tarjeta alto |
| 12 | 33 | Reintento de cobro fallido |
| 13 | 27 | Recordatorio al cliente 1h antes del pedido programado |
| 14 | 30 | Alerta de nota de cocina inusual (alergias) |

## Lote E3 — Genera ingresos nuevos

| Orden | # | Qué |
|---|---|---|
| 15 | 60 | Pedido recurrente programado |
| 16 | 55 | Referidos escalonados |
| 17 | 59 | "Lo de siempre" propuesto solo |
| 18 | 64 | Aviso de "te faltan N puntos" |
| 19 | 54 | Cupón de cumpleaños con vencimiento |
| 20 | 61 | Aviso de favorito de vuelta en stock |
| 21 | 25 | Sugerencia de hora alternativa cuando la franja está llena |
| 22 | 65 | Resumen mensual personal |
| 23 | 50 | Generar el calendario de contenido, no solo recordarlo |

## Lote E4 — Devuelve tu tiempo (el cuello real)

| Orden | # | Qué |
|---|---|---|
| 24 | 2 | Aviso de "toca cocinar" |
| 25 | 10 | Checklist de mise en place del día |
| 26 | 12 | Orden de cocción sugerido |
| 27 | 9 | Escalado de receta |
| 28 | 3 | Temporizador de tanda |
| 29 | 4 | Etiquetas de tanda imprimibles |
| 30 | 40 | Cierre de caja diario |
| 31 | 19 | Confirmación de entrega por link |
| 32 | 17 | Agrupación de pedidos por cercanía |
| 33 | 22 | Aviso de dos pedidos a la misma dirección |
| 34 | 21 | Detección de dirección ambigua |
| 35 | 29 | Detección de comprobante duplicado |
| 36 | 20 | Auto-cierre de pedidos sin calificar |

## Lote E5 — Base de datos de costo (desbloquea el bloque de margen)

| Orden | # | Qué |
|---|---|---|
| 37 | 38 | Precio de insumo por compra |
| 38 | 31 | Reporte diario de conciliación |
| 39 | 34 | Reporte mensual de comisiones Culqi |
| 40 | 39 | Pasivo de crédito emitido |
| 41 | 35 | Alerta de margen por pedido bajo el umbral |

## Lote E6 — Higiene técnica y cumplimiento

| Orden | # | Qué |
|---|---|---|
| 42 | 97 | Alerta de crecimiento de la base |
| 43 | 98 | Alerta de latencia de la edge function |
| 44 | 90 | Verificación de que el shell se actualizó |
| 45 | 89 | Alerta de intentos de acceso admin fallidos |
| 46 | 88 | Auditoría de cuentas admin inactivas |
| 47 | 86 | Reporte del Libro de Reclamaciones |
| 48 | 77 | Detección de queja repetida |
| 49 | 78 | Tiempo real de entrega vs. prometido |
| 50 | 94 | Envío automático del reporte de cohortes |

## Lote E7 — Necesitan historial real (después de abrir)

**31 ítems.** Se construyen igual, pero cada uno con la salvaguarda de fiabilidad que ya
usa el plan de tanda (`reliable:false` mientras no haya suficiente historial, y el motivo
mostrado ANTES que las cifras). Sin esa salvaguarda producen números con aspecto de dato,
y el aspecto de dato es exactamente lo que hace que se les crea.

Números: 1, 6, 7, 8, 14, 15, 36, 37, 44, 51, 52, 56, 57, 58, 62, 63, 67, 68, 69, 70, 71,
72, 73, 74, 75, 91, 92, 93, 95, 96.

Recomendación: **empezar la semana del 28 de septiembre**, con ~3 semanas de ventas.

## Lote E8 — Bloqueados por el dueño

Ver `docs/PENDIENTE_DEL_DUENO.md`. Números: 13, 18, 41, 42, 43, 45, 46, 47, 53, 84, 87.

Casi todos cuelgan de una sola cosa: **los secrets de Meta**.

## Fuera de lote — con costo, decisión aparte

- **28** (OCR del voucher de Yape). Con el volumen de la primera semana, confirmar a mano
  es más rápido que integrar y pagar un servicio. Retomar cuando el volumen lo justifique.

---

## Nota sobre el tamaño de esto

Son 50 automatizaciones en los lotes E1-E6 que se pueden construir ya, más 31 que esperan
datos y 11 que te esperan a ti. **No entra en una sesión.** Se va por lotes, cada uno con
sus pruebas y su `npm run verify` en verde antes de pasar al siguiente, y cada lote se
mergea a `main` para que se despliegue solo.
