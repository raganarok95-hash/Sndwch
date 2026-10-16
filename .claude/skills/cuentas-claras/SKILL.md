---
name: cuentas-claras
description: Cómo lleva SND//WCH sus números para llegar a S/6,000 líquidos al mes (ventas y margen por canal, comisiones de las apps, costo por cliente, compras contra el modelo de costos, caja, lo que se debe pagar). Úsala para el cierre de la semana o del mes, o para responder si algo deja plata.
user-invocable: false
---

# Cuentas claras

**La meta**: S/6,000 líquidos al mes antes del sueldo del dueño (`docs/META_6000.md`,
`modelo/meta_6000.py`). Todo número de este informe responde una pregunta: ¿vamos o no vamos, y
qué palanca lo mueve?

## De dónde sale cada cosa (solo lectura)
| qué | fuente |
|---|---|
| ventas, pedidos, ticket, por canal | `orders` (pagados, no `CANCELADO`; `origen` dice el canal; Rappi y PedidosYa los pega el dueño desde sus paneles) |
| caja del día | la lógica de `actAdminCashClose` (`api/actions/admin.ts`) |
| gasto de pauta | `ad_spend` (lo carga el dueño) y Meta |
| compras de insumos | `ingredient_purchases` (`qty`, `unit`, `total_paid`, `supplier`) |
| costo por sándwich | `modelo/insumos.py` (`por_sandwich()`, la única que reparte costos; `check:costos`) |
| comisiones de apps | `modelo/proyeccion.py` (`rappi_comision`: el primer mes 0%) |
| lo que se debe a embajadores | `comisionesDeEmbajadores()` en `_shared/dinero.ts` (el panel lo muestra) |
| el plan y sus frenos | `docs/NEGOCIO.md` (techo de costo por cliente, freno por CAC) |

## El cierre de la semana
1. **Contra la meta**: lo que va del mes contra lo que hace falta para S/6,000 (con el modelo:
   margen de contribución × pedidos − fijos − pauta).
2. **Por canal**: lo que deja un pedido directo contra uno de Rappi y uno de PedidosYa (ticket −
   costo − comisión − envío que asume el negocio).
3. **Costo por cliente nuevo** de cada canal pagado, contra el techo de `docs/NEGOCIO.md`.
4. **Compras contra el modelo**: si el costo real de un insumo se separa más de 10% del de
   `modelo/insumos.py`, se dice cuál y cuánto mueve el margen. El modelo no se edita solo: se
   propone el cambio con la boleta.
5. **Lo que hay que pagar** esta semana (embajadores, proveedores conocidos).
6. **La palanca de la semana**: la que más acerca a la meta con lo que hay (más pedidos, más
   ticket, menos costo), con su número.

## Reglas
- Ventas, utilidad y caja en soles **no se commitean** (el repo es público): van en la respuesta.
  En el repo, solo porcentajes, decisiones y lo aprendido.
- Nunca un consejo tributario como hecho: RUC 10; lo que dependa del régimen o de SUNAT se marca
  «confirmar con el contador o en SUNAT».
- No se proponen cambios de precio (decisión del dueño). Sí: mezcla, ticket, costos, canales.
