# El plan de cocina de la apertura (martes 20 a domingo 25 de octubre)

Lo armó **Operación** (`.claude/agents/operacion.md`) el 2026-10-16 desde `modelo/proyeccion.py` y
`modelo/meta_6000.py` (1,500 corridas). **Todo es supuesto del modelo**: todavía no hay una venta
real (en `orders` hay 4 pruebas canceladas; `inventory` está vacío). Las cifras en soles se le
dieron al dueño en la sesión.

## Qué cargar en «Abro con N» (porciones de 85 g)
| | Philly (res) | Atún | Meatball | Turkey | Embutido |
|---|---|---|---|---|---|
| **mar 20 a jue 22** | 4 | 3 | 2 | 2 | 2 |
| **vie 23 a dom 25, si arranca Meta** | 5 | 4 | 3 | 3 | 2 |

Sin Meta, la segunda fila repite la primera. El pollo cajún (menú secreto) no tiene receta
cargada: no se carga. **Por qué estos números**: se esperan ~2 pedidos al día (1.3 sándwiches por
pedido); agotar el Philly cuesta mucho más que botar una porción, así que se sube; la albóndiga y
el atún con mayonesa vencen rápido, así que bajan (el atún se mezcla de 2 en 2). Todo vence a los
3 días: lo que sobra sale primero y cada noche se repone solo lo vendido.

## Lo que cuesta ventas (ver P53 y P54 en `docs/PENDIENTE_DEL_DUENO.md`)
- ~~Un 30CM descuenta 1 porción y gasta 2~~ **Arreglado el 2026-10-16** (P53): el contador cuenta
  porciones de 15CM y un 30CM descuenta 2 solo. «Abro con N» es en porciones de 15CM.
- **Los pedidos de Rappi y PedidosYa no descuentan el stock de la web**: bajarlo a mano con cada
  pedido de las apps, o la web vende lo que ya no hay.
- **La albóndiga se carga como tanda** (reponer por tanda): «Abro con N» no guarda la fecha y sin
  fecha no avisa la caducidad.

## La hora pico
No hay dato por hora. Se espera 12:00–14:00 y 19:00–21:00, pero con menos de 1 pedido por hora la
cocina no se llena (el tope es 10). El riesgo es el almuerzo, en horario de trabajo del dueño:
aceptar Rappi en menos de 2 minutos.

## Compras para la semana (cubren el escenario alto con Meta; todo se congela salvo la verdura)
- Res (aguja) 1 kg · carne molida 670 g para ⅓ de tanda de albóndigas (con pan, leche, huevo,
  queso rallado, ajo, perejil, cebolla, aceite de oliva y 2 latas de tomate pelado de 400 g).
- Atún 6 latas de 140 g · pavo 500 g · embutido 250 g (gramaje de `modelo/insumos.py`; no tienen
  receta cargada).
- Cheddar 1 paquete · americano 1 paquete · pan sub 12 (un pan = dos 15CM; cortado y congelado) ·
  bebidas ~3.
- Verdura (mar–jue / vie–dom): tomate 250/525 g · lechuga 90/190 g · cebolla morada 70/150 g ·
  pimiento verde 90/185 g · cebolla blanca 210/420 g.
- **Lunes 19 (cerrado)**: laminar y porcionar la res (~2 h), hacer las albóndigas (~2 h) y la
  cebolla salteada.

## La regla de cada noche (hasta que haya 2 semanas de historia)
Contar lo que sobró por proteína. Abrir con lo vendido ese día de la semana en las últimas 4
semanas (mientras no haya, el promedio de los últimos 3 días abiertos), +1 en el Philly, mínimo 2
por proteína. Si algo se agotó antes de las 19:00 dos días seguidos, +1; si sobraron 2 o más dos
días seguidos, −1. Lo que vence hoy o mañana, primero.
