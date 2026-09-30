# SND//WCH — Simulación de los primeros 3 meses

> **Simulación, no pronóstico.** La tienda aún no abre: no hay ventas reales. Los precios son los
> de la carta vigente; los costos, los del modelo de costos del negocio. Lo marcado [SUPUESTO] o
> [ESTIMADO] no está medido.

## Por pedido

| concepto | S/ |
|---|---|
| Ticket de comida (sin envío; el envío va íntegro al motorizado) | 30.72 |
| Insumos y empaque | −8.90 |
| Comisión de tarjeta | −0.51 |
| Puntos y recompensas | −0.46 |
| **Contribución por pedido** | **20.86** (68% del ticket) |

Sándwich promedio: precio 25.50, costo 7.35 (29%).

**Punto de equilibrio** (fijos + sueldo del dueño, sin pauta): **3.7 pedidos al día**.

## Tres escenarios

### Conservador

| | Mes 1 | Mes 2 | Mes 3 | Total |
|---|---|---|---|---|
| Pedidos al día | 5 | 8 | 11 | — |
| Pedidos del mes | 130 | 208 | 286 | 624 |
| Ventas | S/3,994 | S/6,391 | S/8,787 | S/19,172 |
| Contribución | S/2,711 | S/4,338 | S/5,965 | S/13,015 |
| Fijos + sueldo | S/-2,000 | S/-2,000 | S/-2,000 | S/-6,000 |
| Pauta | S/0 | S/-300 | S/-300 | S/-600 |
| **Utilidad del mes** | S/711 | S/2,038 | S/3,665 | **S/6,415** |

### Base

| | Mes 1 | Mes 2 | Mes 3 | Total |
|---|---|---|---|---|
| Pedidos al día | 8 | 12 | 16 | — |
| Pedidos del mes | 208 | 312 | 416 | 936 |
| Ventas | S/6,391 | S/9,586 | S/12,781 | S/28,758 |
| Contribución | S/4,338 | S/6,507 | S/8,677 | S/19,522 |
| Fijos + sueldo | S/-2,000 | S/-2,000 | S/-2,000 | S/-6,000 |
| Pauta | S/0 | S/-300 | S/-300 | S/-600 |
| **Utilidad del mes** | S/2,338 | S/4,207 | S/6,377 | **S/12,922** |

### Optimista

| | Mes 1 | Mes 2 | Mes 3 | Total |
|---|---|---|---|---|
| Pedidos al día | 12 | 17 | 22 | — |
| Pedidos del mes | 312 | 442 | 572 | 1,326 |
| Ventas | S/9,586 | S/13,580 | S/17,574 | S/40,740 |
| Contribución | S/6,507 | S/9,219 | S/11,930 | S/27,657 |
| Fijos + sueldo | S/-2,000 | S/-2,000 | S/-2,000 | S/-6,000 |
| Pauta | S/0 | S/-300 | S/-300 | S/-600 |
| **Utilidad del mes** | S/4,507 | S/6,919 | S/9,630 | **S/21,057** |

## Cuánto queda al mes y qué lo mueve

Utilidad de un mes (26 días, ya pagados fijos, sueldo del dueño y S/300 de pauta):

| pedidos al día | 8 | 12 | 16 | 20 | 25 | 30 |
|---|---|---|---|---|---|---|
| utilidad del mes | S/2,038 | S/4,207 | S/6,377 | S/8,546 | S/11,257 | S/13,969 |

Palancas, medidas sobre el mes de 16 pedidos al día (S/6,377):

| palanca | cambio | utilidad del mes |
|---|---|---|
| +4 pedidos al día | 16 → 20 | +S/2,169 |
| Sándwiches por pedido | 1.15 → 1.3 | +S/1,082 |
| Pedidos que llevan bebida | 0.3 → 0.45 | +S/189 |
| Pagos con Yape en vez de tarjeta | 0.3 → 0.15 | +S/105 |

Lo que más mueve es **vender más pedidos** y **más sándwiches por pedido** (packs, el pedido en
grupo, «¿uno para mañana?»). La bebida y Yape suman poco por pedido. Subir la mezcla de Signature
ya no mueve nada: el armador quedó igual de rentable (decisión del dueño, 2026-09-30).

## Supuestos

- [HECHO] 26 días de atención al mes (martes a domingo); techo de cocina 40 pedidos/día.
- [HECHO del dueño] costos fijos S/500/mes y sueldo del dueño S/1,500/mes.
- [SUPUESTO] 1.15 sándwiches por pedido; 65% Signature; 80% en 15CM; 30% lleva bebida (con el combo de S/1); 30% paga con tarjeta.
- [SUPUESTO] pedidos por día de cada escenario; sin anuncios el primer mes y S/300/mes de prueba después.
- Costos de insumos de modelo/insumos.py (2026-09-30): carne molida S/15/kg, aguja S/25/kg, quesos americano y cheddar tajados
  (1 tajada por 15CM, como Subway), pepinillo y jalapeño cotizados; lechuga, tomate, pepino y la lata de tomate estimados.
- Empaque real: papel manteca por sándwich + bolsa y sticker por pedido (bolsa estimada, sticker sin cotizar).
- No incluye: inversión inicial ni su recuperación (dato del dueño), impuestos, ni el envío (pasa íntegro al motorizado).
