---
name: cuentas-claras
description: Cómo vigila SND//WCH su plata y busca subir la ganancia: cierre del día, de la semana y del mes, costo real por pedido y por sándwich, margen por canal (web contra Rappi y PedidosYa), alerta del techo de 45%, conciliación de Culqi y Yape, compras contra el modelo y la palanca que más sube la ganancia. Úsala para cualquier cierre o para responder si algo deja plata.
user-invocable: false
---

# Cuentas claras

**El trabajo fijo** (dueño, 2026-11-02): «monitorear y buscar aumentar las ganancias
constantemente». **La meta**: S/6,000 líquidos al mes antes del sueldo del dueño. Cada número
responde: ¿vamos o no vamos, y qué palanca lo mueve? Abre el **20-nov-2026**: hasta entonces
todo pedido de la base es de prueba y se dice así.

## Lo que ya corre solo (no se rehace a mano)
| qué | dónde | cuándo |
|---|---|---|
| Cierre del día: comida cobrada, insumos y empaque del modelo, descuentos, comisiones, lo que queda, por canal; lo que debe verse en Yape/Plin y lo que Culqi debe depositar; alertas de techo y de pagos que no cuadran | correo `daily-summary` | pg_cron `30 3 * * *` = 22:30 de Lima, después de cerrar (dueño, 2026-11-03) |
| La semana en plata: lo mismo + pauta (`ad_spend`) + compras de insumos de la semana + costo % de los 8 productos que más venden | correo `weekly-summary` | pg_cron `30 3 * * 1` = domingo 22:30 de Lima |
| El cálculo | `supabase/functions/_shared/finanzas.ts` (`cierre`, `conciliar`, `alertasDePlata`), probado en `tests-api/finanzas.test.ts` | — |
| El costo de cada producto | `_shared/costos.ts`, GENERADO por `python3 modelo/exportar_costos.py` desde `modelo/insumos.py` | `check:costos` falla si quedó viejo |
| Cuánto deja cada sándwich en web, tarjeta, Rappi y PedidosYa | `python3 modelo/margen_por_canal.py` | a pedido |

**Si cambias un costo en `modelo/insumos.py` o `rentabilidad_por_parte.py`**, corre
`python3 modelo/exportar_costos.py` y commitea `costos.ts` en el mismo cambio: si no, los correos
siguen restando el costo viejo (lo ataja `check:costos`).

## De dónde sale cada cosa (solo lectura)
| qué | fuente |
|---|---|
| ventas, pedidos, ticket, canal | `orders` pagados y no `CANCELADO`; `origen` dice el canal (`canalDe()`); `items[].precio` es el precio cobrado de carta |
| caja del día | `cashClose()` en `api/actions/admin.ts` (el panel) |
| Culqi del mes | `culqiReconciliation()` (`admin-culqi-report`) contra la liquidación de Culqi |
| Yape/Plin | `receipt_op_number` y `receipt_ocr` (`amount`, `coincide`, `duplicada`) de cada pedido |
| gasto de pauta | `ad_spend` (lo carga el dueño) y Meta |
| compras de insumos | `ingredient_purchases` (`qty`, `unit`, `total_paid`, `supplier`) |
| comisiones de apps | `COMISION_APPS` en `finanzas.ts` (Rappi 26% desde el mes 2, oferta 2026-10-16; PedidosYa sin dato) |
| embajadores | `comisionesDeEmbajadores()` en `_shared/dinero.ts` (el panel lo muestra) |
| precio real | `catalog_prices` en la base, nunca la semilla |

Las sesiones no llegan a supabase.co por el proxy (`docs/ENTORNO.md`): para leer la base usa
`mcp__Supabase__execute_sql` (solo `select`) o un workflow de GitHub. **Rappi y PedidosYa no
entran a la base**: hasta que el dueño pegue sus resúmenes, su margen real es «sin dato» y se usa
`margen_por_canal.py` para el teórico.

## Cierre del día (si el dueño pregunta antes del correo)
Mismo cálculo que el correo: `cierre()` y `conciliar()` sobre los pedidos del día. Se reporta en
este orden: lo que quedó · pagos que no cuadran (con el pedido) · lo que pasó el techo.

## Cierre de la semana
1. **Contra la meta**: lo que va del mes contra lo que hace falta (contribución − fijos − pauta).
   Los fijos se piden al dueño si no están; no se inventan.
2. **Por canal**: lo que deja un pedido web (Yape y tarjeta por separado) contra uno de Rappi y uno
   de PedidosYa.
3. **Costo por cliente nuevo** de cada canal pagado, contra el techo de `docs/NEGOCIO.md`.
4. **Compras contra el modelo**: «compraste» contra «insumos del modelo» del correo. Si una boleta
   se separa más de 10% del costo de `modelo/insumos.py`, se dice cuál y cuánto mueve el margen, y
   se PROPONE el cambio con la boleta (el modelo no se edita sin ella).
5. **Lo que hay que pagar** esta semana (embajadores, proveedores conocidos).
6. **La palanca de la semana**, una sola, con su número.

## Cierre del mes
El de la semana con el mes entero, más: Culqi del mes contra su depósito (`admin-culqi-report`),
la mezcla de productos (`porProducto`) y qué Signature conviene empujar por lo que deja.

## Buscar más ganancia (siempre, sin tocar precios)
Palancas en este orden, cada una con cuánto mueve en soles por mes: (1) mezcla: empujar lo que
más deja (`margen_por_canal.py`, columna yape); (2) ticket: bebida y 30CM en el mismo pedido;
(3) costo: la boleta más cara contra la alternativa cotizada; (4) canal: pasar clientes de las apps
a la web (cada pedido que se pasa recupera la comisión); (5) pago: Yape no paga el 5.5% de Culqi.
Toda propuesta que cambie lo que ve el cliente pasa por `por-que-vende`.

## Reglas
- Ventas, utilidad y caja en soles **no se commitean** (el repo es público): van en la respuesta.
  En el repo, solo porcentajes, decisiones y lo aprendido.
- Nunca un consejo tributario como hecho: RUC 10; lo que dependa del régimen o de SUNAT se marca
  «confirmar con el contador o en SUNAT».
- No se proponen cambios de precio (decisión del dueño). Sí: mezcla, ticket, costos, canales.
- Bebida al abrir: botella de 500 ml (envase S/0.69). La lata (S/1.38, venta a S/8.50) solo cuando
  llegue la selladora: no se costea antes.
- Una tarea programada nueva o cambiada se PROPONE al dueño; no se crea sin su sí.
