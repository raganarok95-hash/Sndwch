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

## Ajustado con tus respuestas (2026-10-15, tarde)

Dueño: «Compra de bolsas lisas y sellos ya está realizado» · «todo se congela» · «me cobran 15
soles por el envío del pan» · «todos abren juntos PedidosYa, Rappi y la web» · «movemos la prueba
al inicio» · «no puedo ofrecer a 2 oficinas al día, tengo un trabajo fijo formal».
`python3 modelo/primer_mes.py --ajustado`: bolsa lisa, merma controlada, S/15 de envío de pan por
semana, PedidosYa desde el 20, la prueba de Meta del 20-oct al 16-nov y oficinas solo por mensaje y
al paso (+0.15 clientes al día [SUPUESTO]).

| escenario (cada fila suma a la anterior) | primer mes | gana en | pedidos al día | 6 meses |
|---|---|---|---|---|
| así abres hoy | −S/23 (−S/279 a +S/238) | 45% | 2.0 | +S/1,647 |
| + Rappi trabajado | +S/83 | 63% | 2.2 | +S/2,315 |
| + volantes o stickers (~S/100) | +S/104 | 66% | 2.5 | +S/2,454 |
| + bebida, 30CM, referidos y recompra | +S/177 | 75% | 2.6 | +S/3,153 |
| + oficinas por mensaje y al paso | +S/217 (−S/111 a +S/553) | 79% | 2.8 | +S/3,962 |
| **+ UN almuerzo fijo de oficina desde el 3-nov** | **+S/410 (+S/82 a +S/746)** | **95%** | 3.3 | **+S/5,725** |
| lo mismo, con la prueba de Meta en diciembre | +S/506 | 100% | 2.7 | +S/5,482 |

La prueba de Meta al inicio cuesta ~S/96 en el primer mes y trae clientes que se quedan: en 6
meses deja un poco más que hacerla en diciembre. Decisión tuya: va al inicio.

### El pan (S/15 por envío)
- **Congelar el mismo día que llega**, ya frío y **cortado en porciones de 15CM**, envuelto dos
  veces (film y bolsa zip sin aire), con la fecha. Aguanta hasta 3 meses; mejor dentro del mes
  ([King Arthur](https://www.kingarthurbaking.com/blog/2023/12/20/freeze-bread)).
- **Nunca a la refrigeradora**: el frío de la refri lo pone duro más rápido que dejarlo afuera
  ([America's Test Kitchen](https://www.americastestkitchen.com/articles/7254-how-to-store-homemade-bread)).
- Afuera, en bolsa cerrada, solo lo de 1 o 2 días.
- **Cada mañana** sacas las porciones del día (las de «Abro con N»): 30–60 min en su bolsa. Si
  llega un pedido antes, va directo del congelador al horno: 175 °C unos 5 minutos devuelven la
  costra ([King Arthur](https://www.kingarthurbaking.com/blog/2025/07/24/how-to-defrost-bread)).
- **Pide cada dos semanas** y congela: el envío baja a S/7.50 por semana. Pregunta si hay un
  pedido mínimo con envío gratis, o recógelo al volver del trabajo.
- Lo ideal sería pan **precocido** (se termina 8–10 min en el horno): no encontré proveedor en
  Trujillo; pregúntale a tu panadero si lo hace.

### ¿Volantes o sticker publicitario?
- **El sticker en postes o paredes es riesgoso**: el SEGAT de Trujillo sanciona afiches pegados
  sin autorización
  ([SINIA](https://sinia.minam.gob.pe/novedades/infraccionaran-quienes-coloquen-afiches-sin-autorizacion-fiestas-ano)).
  Además, en la calle la gente pasa y no se detiene a escanear. Funciona donde la gente espera
  o se sienta, con permiso: la bolsa (ya va), el mural del condominio, una bodega o barbería amiga.
- **El volante llega a la mano**, en la casa o en el escritorio, con tiempo para escanear.
  Las cifras que circulan (1.8–3.5% de respuesta) son de empresas que venden volanteo: tómalas como
  techo. El modelo supone mucho menos (~0.5%).
- **Se prueban los dos** con su propio origen: volantes con `?src=volante`, stickers con
  `?src=calle` (el que ya está impreso). A las dos semanas se queda el que trae más pedidos.

### Oficinas sin visitas diarias
La lista está en `docs/marketing/OFICINAS_CERCANAS.md` (179 lugares, las 10 primeras elegidas).
Con tu trabajo formal: tu propia oficina primero, mensajes de noche a las 10 de la lista y una
pasada por semana dejando volantes. Origen `?src=oficina`.

### La prueba de Meta al inicio: lo que falta para que salga el 20
- Un **método de pago** en la cuenta de anuncios 1488138326460689 y tus permisos de finanzas
  (`docs/CONFIGURAR_META.md`, C3 y C4).
- La **página conectada a la cuenta de anuncios** (C5). Instagram no hace falta para la prueba:
  el anuncio sale en Instagram con la página como identidad.
- Se pierde la medición limpia de cuánta gente llega sola los primeros 14 días (P1b): se separa
  con los `?src=` y la atribución de Meta.

## Después del primer mes: la meta de S/6,000
Dueño: «no haré volantes… la meta sería al menos 6000 líquidos al mes». Está en
`docs/META_6000.md`: sin volantes, la fila «+ volantes o stickers» de arriba no aplica. La
alternativa está allá: las bandejas por encargo.
