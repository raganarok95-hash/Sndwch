# Proyección de octubre 2026 a marzo 2027

**2026-10-09.** Dueño: «Agrega Rappi y PedidosYa, pero mejor no te bases en modelos viejos: hazlo
bien el modelo». Motor nuevo, hecho desde cero: `modelo/proyeccion.py` (2,000 corridas, día por día).
Reemplaza a la simulación del mismo día, que tenía los errores de abajo.

> **Es una simulación.** No hay un solo pedido real. Cada número de entrada tiene su rango en
> `SUPUESTOS` del script; se corrige con lo que se mida la primera semana.

![proyección](PROYECCION.png)

## Mes a mes: con lo que ya hay

Lo que te queda **después de impuestos y antes de pagarte un sueldo**. Octubre son 11 días.

| mes | pedidos al día (propio / Rappi / PedidosYa) | ventas | ganancia (8 de cada 10 casos) | con las soluciones 3, 4 y 5 |
|---|---|---|---|---|
| oct | 1.7 (0.5 / 1.2 / 0.0) | S/491 | −S/200 (−S/333 a −S/60) | −S/187 |
| nov | 3.4 (1.0 / 1.5 / 0.9) | S/2,243 | S/324 (−S/67 a S/725) | S/396 |
| dic | 4.3 (1.2 / 1.8 / 1.3) | S/3,087 | S/925 (S/455 a S/1,444) | S/1,050 |
| ene | 5.0 (1.5 / 2.1 / 1.5) | S/3,588 | S/1,170 (S/624 a S/1,761) | S/1,340 |
| feb | 5.6 (1.7 / 2.2 / 1.6) | S/3,532 | S/1,165 (S/618 a S/1,729) | S/1,347 |
| mar | 6.0 (1.9 / 2.3 / 1.7) | S/4,115 | S/1,455 (S/812 a S/2,095) | S/1,684 |
| **6 meses** | | | **S/4,855** (S/2,204 a S/7,597) | **S/5,661** |

En el caso malo, la caja baja hasta −S/386: hace falta un colchón de unos S/400 para
octubre y noviembre.

## Un pedido

- **Ticket:** S/26.18. Los insumos y el empaque cuestan S/8.29.
- **Pedido propio:** deja S/16.59. Ya descuenta la tarjeta, los puntos y S/0.50 de gas y frío.
- **Pedido por app:** deja S/17.39 menos la comisión. Con 25% quedan S/10.85.
- **Para cubrir los costos fijos** hacen falta 1.2 pedidos propios al día, o
  1.9 por app.

## Qué decide el resultado

La correlación de cada supuesto con la ganancia de los 6 meses:

| supuesto | peso |
|---|---|
| rappi_dia | +0.71 |
| pya_dia | +0.43 |
| instagram_dia | +0.29 |
| brecha | -0.27 |
| google_dia | +0.21 |
| p2 | +0.18 |

**Lo que más pesa es cuánta gente llega por Rappi y PedidosYa.** El canal propio arranca chico, con
una cuenta y una ficha nuevas. Los primeros meses, el negocio vive de las apps, y el QR de la bolsa
es lo que va pasando a esos clientes al canal propio, donde dejan S/6 más por pedido.

**Meta:** un cliente cuesta ~S/93 (mediana) con una cuenta nueva y los datos de la
industria. Los S/350 sirven para medir ese costo, no para vender.

## Los errores que tenía la simulación anterior, y cómo quedaron

| error | antes | ahora |
|---|---|---|
| Tu red | 300 avisados y 90 que piden | ~30 avisados, 0–10% pide (dueño: «probablemente ninguno») |
| Canal propio | 1 a 3 clientes nuevos al día | Google 0.1–0.4 y, desde el 27 de octubre, Instagram 0–0.4 |
| Rappi y PedidosYa | no existían | Rappi desde la apertura, al 0% el primer mes; PedidosYa desde el 3 de noviembre |
| Gasto por pedido (S/0.50) | no se descontaba | se descuenta |
| Recompras | todo cliente «llegaba el día 1 del mes»: en octubre contaba recompras imposibles | el día de llegada es el real, y la recompra cae X días después |
| Impuestos | no había | Nuevo RUS (S/20–50) hasta S/8,000 al mes; arriba, IGV y renta del Régimen MYPE |
| Modelo base | heredado de modelo_v14 | escrito desde cero; solo usa los precios de `insumos.py` |

## Las soluciones (3, 4 y 5): lo que suman

Cada una sola, sobre «lo que ya hay», en 6 meses (mediana):

- **referidos**: +S/263
- **recompra**: +S/197
- **ticket**: +S/270

Suman poco **porque el volumen es chico**: mejoran cada pedido, no traen gente. El que trae gente
es el canal de las apps.

## Lo que hay que medir la primera semana (y volver a correr esto)
1. Pedidos por día en Rappi y, desde el alta, en PedidosYa. Es el supuesto que más pesa.
2. Las comisiones reales de tus contratos.
3. Cuántos pedidos llegan con `?src=` de Google y de Instagram.
4. Cuántos clientes de la app vuelven en 14 días.
