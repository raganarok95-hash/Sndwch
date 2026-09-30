# Cómo se calcula el dinero

> **Generado por `npm run hechos`** desde `_shared/dinero.ts`, `api/actions/orders.ts` y `modelo/`. No se edita a mano: se regenera. Si algo de acá
> está mal, el error está en el código, no en esta ficha.

## Lo que paga el cliente (en este orden, en céntimos enteros)
1. **Cada línea** = precio base (Signature, o proteína + recargo del pan) + doble proteína + salsa extra (S/2). Bebida = su precio.
2. **Subtotal** = Σ línea × cantidad.
3. **Combo**: −S/1 × min(sándwiches, bebidas). La recompensa de sándwich o de bebida saca esa unidad de la cuenta del combo.
4. **Organizador** (pedido grupal con ≥ 5 sándwiches): −el 15CM más barato.
5. **Recompensa**: −lo que perdona (con su tope).
6. **Envío** aparte (ver REGLAS.md), ajustado si paga con tarjeta. Código promocional aparte.
7. **Puntos que da** = round(total de comida), sin envío.

Fuente única: `resolverCarrito()` en `_shared/dinero.ts`. El cliente muestra con la misma función
(`cartDesglose()`); una regla de precio nueva va ahí y en ningún otro sitio.

## Lo que le queda al negocio
- **Costo de ingredientes por sándwich**: `modelo/insumos.py` — cada insumo con valor, unidad, estado
  (COTIZADO/ESTIMADO/SIN_COTIZAR), fuente y fecha, convertido SOLO por `por_sandwich()`.
- **Techo**: el costo de ingredientes no pasa del **45%** del precio. Parte por parte:
  `python3 modelo/rentabilidad_por_parte.py`.
- **Contribución por pedido** = comida cobrada − ingredientes − empaque (por PEDIDO, no por sándwich) −
  comisión de tarjeta si aplica. El envío no deja margen (pass-through).
- **Recompensas**: todas devuelven ~1.3–1.5% de lo gastado para ganarlas (tasa pareja anclada en el 15CM gratis).

## Conseguir clientes
- **CAC = CPM ÷ (1000 × CTR × CVR) × 1.18** (IGV). El CAC baja en proporción a lo que suben CTR y CVR;
  la conversión de la app es la única de las tres que controla el negocio.
- El referido cuesta lo que se regala en puntos (160 + 400); mezclarlo con el pagado baja el CAC combinado.
- Techo de CAC por valor de vida del cliente, no por primer pedido: `docs/CAMPANA_DE_ANUNCIOS.md`.

## Proyección
`python3 modelo/modelo_v14.py` (usa v11 y `comparativa_menu.py`). Es SIMULACIÓN: la tienda no ha
abierto, no hay un solo pedido real. Supuestos y resultados: `PREDICCION_V14.md` y `docs/NEGOCIO.md`.
