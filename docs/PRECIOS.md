# Los precios, verificados (2026-10-16)

Dueño: «Verifica los precios por favor…». Una primera lectura entendió «el 30CM a S/20 como
máximo» y el dueño la corrigió: «interpretaste mal, nunca dije 30 cm a 20 soles». Aquí queda solo lo
verificado; qué precio quiere y para qué producto, **se le pregunta antes de simular nada**.

## 1 · Los precios de hoy (verificados en la base, no en el código)

Manda la fila más reciente de cada Signature en `catalog_items` (y `catalog_prices` para el arma
el tuyo). Coinciden con la carta (`docs/hechos/CARTA.md`). El «Sándwich Prueba» de S/0.10 está
**inactivo** (no se puede comprar).

| Signature | 15CM | 30CM | cuesta hacerlo 15 / 30 | deja hoy 15 / 30 |
|---|---|---|---|---|
| Philly Cheesesteak | 22.90 | 33.90 | 6.48 / 11.65 | 16.42 / 22.25 |
| Meatball Marinara | 21.90 | 32.90 | 6.76 / 12.21 | 15.14 / 20.69 |
| Turkey | 23.90 | 34.90 | 6.58 / 11.86 | 17.31 / 23.04 |
| Tuna Melt | 22.90 | 33.90 | 6.45 / 11.60 | 16.45 / 22.30 |
| Italian Hoagie | 23.90 | 34.90 | 8.21 / 15.13 | 15.69 / 19.77 |
| Classic Tuna | 20.90 | 31.90 | 5.55 / 9.80 | 15.35 / 22.10 |

El costo es insumos + empaque (S/1.30), con la merma de cocción (`modelo/rentabilidad_por_parte.py`).
En Rappi y PedidosYa todo va 10% más caro (tu decisión del 9-oct).

## 2 · Pendiente

Qué precio busca el dueño y para qué (15CM, 30CM, el salto entre los dos, la carta de las apps):
se le pregunta. Ningún precio cambia sin su sí con la cifra exacta.
