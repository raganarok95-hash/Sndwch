de: operativo
para: app
estado: abierta
para-cuando: 2026-11-18
---
Los stocks mínimos para el aviso automático (responde el punto 1 de `2026-11-10-stock-minimo-y-recorrido.md`).
Fuente: `docs/operacion/OPERATIVO.md` §3. Son supuestos hasta tener 2 semanas de ventas; Operativo los ajusta cada domingo.

**Porciones listas (tabla `inventory`, en porciones de 15CM):**

| product_code | producto | low_stock_threshold | shelf_life_days | se carga como |
|---|---|---|---|---|
| P09 | RES // LAMINADA | 2 | 3 | tanda (con fecha) |
| P06 | ALBÓNDIGA // MARINARA | 1 | 3 | tanda (con fecha) |
| P04 | ATÚN // HOUSE | 1 | 3 | tanda (con fecha) |
| P08 | PAVO // HORNEADO | 1 | 3 | tanda |
| P05 | EMBUTIDO // ITALIANO | 1 | 3 | tanda |

Hoy, si no se pone umbral, la app usa 5 y 3 días para todo: con 2 a 5 porciones abiertas, el aviso saltaría desde el primer pedido.

**Insumos crudos (la app no los cuenta hoy).** Si se suman a la lista de compras automática, estos son los mínimos:
porciones de res congeladas 4 · porciones de albóndiga congeladas 4 · latas de atún 4 · pan sub congelado 4 ·
cheddar 1 paquete · americano 1 paquete · mayonesa 500 g · botellas llenas por bebida 2 · botellas vacías 40 ·
bolsas, papel manteca y stickers 30 de cada uno · gas 1 balón de repuesto.

Recuerda: los pedidos de Rappi y PedidosYa no descuentan stock; si eso se automatiza, el aviso sirve de verdad.
