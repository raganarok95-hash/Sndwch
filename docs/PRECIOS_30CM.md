# El precio del 30CM: verificado y simulado (2026-10-16)

Dueño: «Verifica los precios por favor, me gustaría más el de 30 cm hasta máximo 20 soles; si es
alrededor de 16 soles igual estaría bien».

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

## 2 · Lo que pasa con la meta de S/6,000 (`modelo/proyeccion.py`)

Cuántos pedidos al día hacen falta, con 1 sándwich por pedido, 1 de cada 4 con bebida, el gasto por
pedido, la tarjeta y los puntos. **Tu tope armando solo es ~40 pedidos al día.**

| precios | ticket | deja por pedido | pedidos/día para S/6,000 (directo) | (si todo fuera Rappi al 25%) |
|---|---|---|---|---|
| **hoy** (80% pide 15CM) | 26.18 | 15.39 | **16.6** | 22.0 |
| 15CM S/15.90 · **30CM S/19.90** | 19.07 | 6.84 | **37.4** | 62.6 |
| 15CM S/13.90 · **30CM S/19.90** | 18.07 | 5.87 | **43.6** | 78.5 |
| 15CM S/10.90 · **30CM S/15.90** | 14.57 | 2.48 | **103.3** | 689 |
| **30CM = 15CM + S/7** (mitad y mitad) | 27.48 | 15.00 | **17.0** | — |

- Con el **30CM a ~S/16** el Italian Hoagie deja **S/0.87** antes del gasto del pedido (pierde
  plata) y la meta pide ~100 pedidos al día: no alcanza ni con dos personas.
- Con el **30CM a S/19.90**, el 15CM tiene que bajar a menos de S/19.90 (si no, nadie pide 15CM), y
  la meta pide 37–44 pedidos al día: tu tope, todos los días, sin margen para nada.
- **El 30CM a «15CM + S/7»** lo hace mucho más atractivo (el segundo medio sándwich cuesta S/7 en vez
  de S/11) y **la meta casi no se mueve** (17 pedidos al día), porque un 30CM igual deja más que un
  15CM.

| Signature | 30CM hoy | 30CM a «15CM + S/7» | deja |
|---|---|---|---|
| Philly Cheesesteak | 33.90 | **29.90** | 18.25 |
| Meatball Marinara | 32.90 | **28.90** | 16.69 |
| Turkey | 34.90 | **30.90** | 19.04 |
| Tuna Melt | 33.90 | **29.90** | 18.30 |
| Italian Hoagie | 34.90 | **30.90** | 15.77 |
| Classic Tuna | 31.90 | **27.90** | 18.10 |

## 3 · Si lo que buscas es un precio de entrada más bajo

Si la idea es competir con lo que cobra la calle en Trujillo, lo que no rompe la cuenta es **un
producto de entrada**, no bajar toda la carta: por ejemplo, un 15CM clásico más simple (la proteína
más barata, menos ingredientes) a ~S/14.90, al lado de los Signatures. Se diseña con Carta y
Finanzas si te interesa.

## 4 · Cómo se cambia (cuando decidas)

Una migración que agrega la fila nueva de cada Signature en `catalog_items` y actualiza el 30CM del
arma el tuyo en `catalog_prices`; la semilla `_shared/carta.ts` igual; `npm run hechos`; y las
pruebas de dinero (`parity`, `test:api`). Ningún texto lleva el precio escrito: todo se interpola.
