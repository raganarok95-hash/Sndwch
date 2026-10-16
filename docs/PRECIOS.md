# El costo real de un sándwich y el precio del 15CM (2026-10-16)

Dueño: «Verifica los precios» · «la idea no es mandar el 30 cm tan barato sino el de 15 cm
mandarlo a 16–20 soles» · «¿el precio por sándwich realmente es tan bajo ya contando empaquetado,
etc.? Cuenta bien. Quiero que encuentres el precio real de hacerlo. Igual que veas qué precio es
mejor». Nada de esto cambió un precio: se decide con su sí y la cifra exacta.

## 1 · Los precios de hoy (verificados en la base)

Manda la fila más reciente de cada Signature en `catalog_items` (y `catalog_prices` para el arma
el tuyo); coinciden con la carta. El «Sándwich Prueba» de S/0.10 está inactivo. En Rappi y
PedidosYa todo va 10% más caro.

| Signature | 15CM | 30CM |
|---|---|---|
| Philly Cheesesteak | 22.90 | 33.90 |
| Meatball Marinara | 21.90 | 32.90 |
| Turkey | 23.90 | 34.90 |
| Tuna Melt | 22.90 | 33.90 |
| Italian Hoagie | 23.90 | 34.90 |
| Classic Tuna | 20.90 | 31.90 |

## 2 · Lo que cuesta hacer un 15CM, contado entero

| Signature | insumos | cocina¹ | empaque² | gas³ | **total** |
|---|---|---|---|---|---|
| Philly Cheesesteak | 5.18 | 0.15 | 0.50 | 0.50 | **6.33** |
| Meatball Marinara | 5.46 | 0.15 | 0.50 | 0.50 | **6.61** |
| Turkey | 5.29 | 0.15 | 0.50 | 0.50 | **6.44** |
| Tuna Melt | 5.15 | 0.15 | 0.50 | 0.50 | **6.30** |
| Italian Hoagie | 6.91 | 0.15 | 0.50 | 0.50 | **8.06** |
| Classic Tuna | 4.25 | 0.15 | 0.50 | 0.50 | **5.40** |

Un 30CM cuesta entre S/9.65 y S/14.98.

- **Insumos** (`modelo/insumos.py`, con la merma de cocción): el Philly son res laminada S/3.04 (85 g
  de aguja a S/25/kg cotizada, con un rendimiento de **0.70 que es supuesto**: con 0.55 sube a
  S/3.86), pan S/1.00 (medio pan de S/2, cotizado), cheddar S/0.90 (una tajada) y cebolla y pimiento
  S/0.24. El Meatball depende de la **lata de tomate pelado, sin cotizar** (casi la mitad de la
  tanda de albóndigas). El pavo (S/44.20/kg) y el atún (S/4 la lata) están cotizados.
- ¹ **Cocina** S/0.15 por pedido [supuesto]: aceite y sal de cocción, film, guantes, servilletas,
  limpieza. No estaba sumado antes.
- ² **Empaque** S/0.50 por pedido [estimado]: la bolsa kraft lisa con tu sello, papel manteca y
  sticker (tu decisión del 10-oct). **Si usas la bolsa impresa a una tinta que cotizaste (S/2.50 por
  pedido), súmale S/2.00 a cada fila.**
- ³ **Gas, frío y coordinación** S/0.50 por pedido [supuesto del modelo].
- El delivery no entra: lo paga el cliente al motorizado.

## 3 · Lo que además se paga por cada venta, y al mes

| qué | cuánto | cuándo |
|---|---|---|
| tarjeta (Culqi 5.5%, ~30% paga con tarjeta) | ~1.7% del precio | siempre |
| puntos y recompensas | ~1.4% del precio | siempre |
| **IGV** de restaurante MYPE (8% + 2.5% IPM en 2026) | ~9.5% del precio | desde que pasas S/8,000 de ventas en un mes (Régimen MYPE) |
| renta | 10% de la utilidad | en el Régimen MYPE |
| fijos de la casa | S/500 al mes | siempre |
| envío del pan | ~S/65 al mes | siempre |
| contador | S/200 al mes | en el Régimen MYPE |
| comida que se vence sin venderse | ~S/20 a la semana con control | sobre todo al empezar, con pocos pedidos |

Con S/6,000 líquidos de meta, las ventas pasan los S/8,000 al mes: se calcula con el IGV.

## 4 · Lo que te queda y cuántos pedidos hacen falta

Sin contar bebidas, 80% de los pedidos en 15CM, todo por la web, 26 días abiertos al mes.

| precios | te queda por pedido | pedidos al día para S/6,000 |
|---|---|---|
| **hoy** (15CM S/20.90–23.90) | 14.21 | **20.1** |
| **15CM S/19.90 · 30CM S/30.90** | 11.73 | **24.4** (+21%) |
| escalera: Classic Tuna S/16.90, Meatball S/18.90, el resto S/19.90 (30CM = 15CM + S/11) | 11.15 | **25.6** (+27%) |
| 15CM S/17.90 · 30CM S/28.90 | 9.98 | **28.6** (+42%) |

Por Rappi, desde el segundo mes (comisión ~25%), cada pedido deja unos S/3 menos que por la web.

## 5 · Qué precio es mejor

- **Lo que dice la evidencia**: la comida fuera de casa responde poco al precio. La elasticidad
  medida es −0.81 (Andreyeva, Long y Brownell, *American Journal of Public Health*, 2010): bajar el
  precio 10% trae ~8% más pedidos. Pasar de ~S/22.60 a S/19.90 (−12%) traería ~10% más, y hacen falta
  21% más para ganar lo mismo. **Por la cuenta sola, bajar el precio no se paga.**
- **Lo que la cuenta no ve**: es una marca nueva en Trujillo, donde se paga menos que en Lima. Tu
  única referencia de mercado son las capturas de Subway en PedidosYa de Lima (30-sep): 15 cm de
  lista entre S/19.90 y S/28.90, con promoción y bebida entre S/13.90 y S/21.90. En Trujillo no hay
  Subway. Si en Trujillo un 15CM a más de S/20 espanta al que no te conoce, el precio bajo trae
  clientes que de otro modo no prueban, y eso la elasticidad promedio no lo mide. Eso lo sabes tú.
- **La recomendación**: si vas a bajar, **15CM a S/19.90 y 30CM a S/30.90**. Queda debajo de S/20,
  pierde lo mínimo (~S/2.50 por pedido) y necesita ~4 pedidos más al día. Bajar a S/16.90–17.90 pide
  8–9 pedidos más al día con la misma cocina.

## 6 · Cómo se cambia (cuando decidas)

Una migración con la fila nueva de cada Signature en `catalog_items` y el arma el tuyo en
`catalog_prices`; la semilla `_shared/carta.ts` igual; `npm run hechos`; `parity` y `test:api`.
Ningún texto lleva el precio escrito: todo se interpola.
