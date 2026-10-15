# Rentables desde el primer mes (2026-10-15)

Dueño: «Busca puntos exactos donde mejorar para poder ser totalmente rentables desde el primer
mes, sino el negocio morirá, dame todas las formas. Repiénsalo y encuentra algo viable».

**El primer mes** son los 30 días desde que se abre: del martes 20 de octubre al miércoles 18 de
noviembre, con los fijos de esos 30 días (S/493) y la cuota del Nuevo RUS. Ganancia **antes de tu
sueldo**. Simulación (`python3 modelo/primer_mes.py`, 2,000 corridas sobre el motor de
`modelo/proyeccion.py`): no hay un solo pedido real. Rango = 1 de cada 10 casos · la mitad · 9 de
cada 10.

## Lo que encontré al repensarlo

1. **El modelo no veía la comida que se vence.** Con 1 pedido al día y toda la carta lista (pan
   comprado «por si acaso», verduras, dos quesos y dos fiambres abiertos, atún preparado, salsas)
   se botan ~S/85 por semana [SUPUESTO]. Con eso, **hoy el primer mes pierde S/296** (−S/569 a
   −S/26) y solo gana en 8 de cada 100 casos. Antes de esto, el modelo decía −S/128.
2. **Para no perder bastan 1.3 pedidos propios al día** (34 en el mes), si cada uno deja S/17.39
   con la bolsa lisa y no se gasta en Meta ese mes. El problema no es el margen: es llegar a esos
   pedidos con cero clientes.
3. **Los canales de consumo arrancan lentos** (Rappi, Instagram, Google: ~1 pedido al día el primer
   mes). **Lo único que mueve el primer mes de verdad son las oficinas**: un almuerzo fijo semanal
   de una oficina vale más que todas las demás palancas juntas.

## Cada palanca, sola (cambio en el primer mes · en 6 meses)

| palanca | primer mes | 6 meses | qué hay que hacer |
|---|---|---|---|
| **Un pedido fijo de oficina** (6 por semana desde la 2.ª semana, con su descuento de grupo) | **+S/320** | +S/1,649 | cerrar con UNA oficina un almuerzo semanal (pedido fijo del panel) |
| **Merma controlada** | **+S/169** | +S/232 | pan por pedido o congelado; fiambres y carnes en porciones congeladas; «Abro con N porciones» |
| Rappi trabajado (+30%) | +S/124 | +S/679 | fotos reales, combo y una promo propia mientras la comisión es 0% |
| Visitas a oficinas desde el día 1 (+0.5 clientes al día), con muestras (~S/225) | +S/99 | +S/2,007 | 2 oficinas al día, un 15CM partido en bocados, el enlace del pedido en grupo |
| TikTok con los mismos videos | +S/99 | +S/1,035 | abrir la cuenta y subir lo mismo |
| Fijos −S/100 al mes | +S/99 | +S/600 | revisar los S/500 y bajar lo que no se usa |
| PedidosYa desde el 3-nov | +S/78 | +S/157 | terminar el alta esta semana |
| La prueba de Meta fuera del primer mes | +S/56 | −S/143 | moverla a cuando haya 2 pedidos al día o Instagram vinculado |
| Volantes de lanzamiento (+0.3 clientes al día, 3 semanas; ~S/100) | +S/44 | +S/164 | 1,000 volantes con QR y DIRECTO en edificios a 2 km |
| Bebida ofrecida + 30CM como «el doble» | +S/31 | +S/190 | ya está en el carrito; combos en Rappi |
| Bolsa lisa + sellos | +S/29 | +S/437 | ya decidido: comprarlas |
| Referidos con botón de WhatsApp | +S/10 | +S/194 | pedir el reenvío al entregar |

## El plan viable

**Todo lo de arriba menos TikTok y el recorte de fijos** (que suman encima si los haces):

| | primer mes | gana en | pedidos | 6 meses |
|---|---|---|---|---|
| **Plan completo** | **+S/613** (+S/313 a +S/931) | 100% de los casos | 84 (3.2 al día) | +S/7,605 |
| sin el pedido fijo de oficina | +S/337 (+S/37 a +S/656) | 93% | 64 (2.4 al día) | +S/5,760 |
| sin oficinas (ni visitas ni pedido fijo) | +S/266 (−S/31 a +S/572) | 86% | 47 (1.8 al día) | +S/3,143 |
| solo costos (bolsa, sin Meta, merma) | +S/26 (−S/208 a +S/254) | 55% | 28 (1.1 al día) | +S/1,639 |
| hoy, con la merma real | −S/296 (−S/569 a −S/26) | 8% | 35 | +S/817 |

Ya incluye lo que cuestan las muestras (~S/225) y los volantes (~S/100). No incluye los sellos y
la tinta (se pagan una vez). Octubre como mes de calendario sigue en negativo (paga el mes entero de
fijos con 11 días abiertos): lo que importa es que los primeros 30 días ganen.

## Paso a paso

**Esta semana, antes de abrir**
1. Comprar las bolsas lisas y los 2 sellos.
2. Congelar en porciones de 15CM lo que se puede: albóndigas, res laminada, pavo y embutido
   rebanados. Pan: acordar con la panadería compras chicas cada día, o pan sub precocido congelado.
3. Abrir cada día con pocas porciones en «Abro con N porciones».
4. Hacer la lista de 10 oficinas a 2 km: bancos, clínicas, notarías, colegios, centros de llamadas.
5. Imprimir 1,000 volantes A6 con el QR y el código DIRECTO.
6. Terminar el alta de PedidosYa. En Rappi: fotos, combo y una promo propia mientras no cobra.
7. Mover la prueba de Meta (S/350): no se gasta en el primer mes.

**Semana 1 (20–25 oct)**: volantes 3 mañanas; 2 oficinas al día a las 11:00 con un 15CM partido y
el pedido en grupo («con 5, el más barato va gratis»).

**Semana 2**: cerrar con UNA oficina el almuerzo fijo semanal. Seguir con las visitas.

**Cada domingo** se mide: pedidos propios por día, lo que se botó, de dónde vino cada cliente
(`?src=`). **Si al día 14 no hay 1.3 pedidos propios al día**, se duplican las visitas y se achica la
carta del día (menos proteínas abiertas) para que la merma no se coma el margen.

## Lo que no está en la tabla y también sirve
- **Concentrar el horario** en almuerzo y cena libera las mañanas para visitar oficinas.
- **Pedidos programados** para el almuerzo de oficina: se cocina exacto, sin merma.
- **Carta corta de lanzamiento** (3 o 4 proteínas abiertas por día): menos merma e inventario; es
  decisión tuya.
- **Precios: no se tocan** (dueño, 2026-10-09). Por eso ninguna palanca los sube.

## Lo que hay que medir la primera semana (y volver a correr esto)
Pedidos propios al día; lo que se bota por semana (la merma es un supuesto); cuántas oficinas
visitadas piden; pedidos de Rappi y PedidosYa; el ticket promedio.
