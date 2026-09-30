# Subway en PedidosYa y el menú «fit» (2026-09-30)

Fuente: 16 capturas del dueño de Subway Rivera Navarrete en PedidosYa (Perú, 30-09-2026). Nada de
esto está decidido: es el análisis para que el dueño elija qué adoptar.

## Cómo arma Subway el pedido

- **Todo producto se personaliza, incluso los Signatures**: pan (1, «Requerido») → queso (1, con
  «Sin queso») → vegetales (hasta 9, con «Sin vegetales») → aderezos (hasta 5, con «Sin aderezo»)
  → bebida (si es combo). Cada bloque dice «Requerido» y pasa a «Completado».
- **Opciones con «Más popular»** (lechuga, orégano & parmesano, chipotle, ranch) y **«Agotado»**
  visible en la opción (pepinillos, mayonesa light).
- **Condimentos gratis dentro de los aderezos**: aceite, vinagre, sal, pimienta.
- **Vegetales**: lechuga, tomate, pepino, pimiento verde, cebolla morada, aceituna negra, jalapeño,
  pepinillo. **Aderezos**: mostaza, mostaza dulce, kétchup, cebolla dulce, chipotle, ranch, BBQ,
  ají amarillo, aceite, vinagre, mayonesa light. **Panes**: blanco (italiano), orégano & parmesano…
  **Quesos**: americano, cheddar.
- **Combos por todas partes**: sub + gaseosa 300 ml, sub + galleta, sub + papas rejilla + bebida +
  galleta, 2×1 en la cena, «dupla», packs de 5 subs de 30 cm para el partido (S/119.90).
- **Precio tachado y % de descuento** en casi todo (22 %–49 %), la mayoría financiados o empujados
  por PedidosYa («Mejor precio en PedidosYa», «Plus»).
- **Sabores peruanos**: pollo saltado, lomo saltado, tripleta saltado, salsa de ají amarillo.
- Precios de lista 15 cm: S/19.90–28.90; con promo y bebida: S/13.90–21.90. 30 cm: S/35.90–40.90.

## Qué nos sirve (propuesta, en orden)

1. **Quitar ingredientes de un Signature** («sin cebolla», «sin queso»), sin poder agregar: no
   rompe la receta cerrada y es la personalización que más pide la gente. Hoy solo hay la nota.
2. **Condimentos gratis** (sal, pimienta, orégano, ají) que no cuentan dentro del tope de 3 salsas.
3. **El combo como precio final visible en la ficha** («con bebida S/X · ahorras S/1»): ya existe
   en la pantalla de bebidas; en la ficha no se ve.
4. **Un pack para compartir que use el 15CM gratis del organizador** (5 sándwiches): Subway vende
   packs de 5 para el partido; nosotros ya tenemos el mecanismo y no lo mostramos como producto.
5. **«Agotado» en la opción**, no escondida: ya lo hace el catálogo con `isAvail`; revisar que el
   armador lo muestre igual.

**Qué NO copiar**: descuentos permanentes de 30–49 % (los pone el agregador; con nuestro costo de
~25–45 % se come el margen), gaseosas de marca (poco margen y rompen la marca), «Más popular» antes
de tener pedidos reales (sería inventado), sabores locales (la carta v4 es de clásicos de USA por
decisión del dueño; SND//WCH no tiene identidad regional).

**Posición de precio**: con promo, Subway en PedidosYa queda por debajo nuestro (S/13.90–21.90 con
bebida vs S/20.90–23.90 sin bebida, más envío por distancia). Se compite por calidad y producto, no
por precio.

## ¿Es un menú «fit»? — ESTIMADO, no medido

Por 15CM, con los gramajes de `modelo/insumos.py` (85 g de proteína, ~11 g de queso, ~14 g de salsa)
y valores de tablas estándar (pan blanco de 15 cm ≈ 200 kcal). **Aproximaciones sin análisis de
laboratorio: nunca se publican como cifras exactas.**

| Signature 15CM | kcal aprox. | proteína | grasa | lectura |
|---|---|---|---|---|
| Turkey | ~350 | ~24 g | ~9 g | **la opción fit de la carta** |
| Philly Cheesesteak | ~445 | ~34 g | ~17 g | **alta en proteína** |
| Classic Tuna | ~400 | ~24 g | ~16 g | intermedio (la mayonesa suma) |
| Tuna Melt | ~445 | ~27 g | ~20 g | intermedio |
| Meatball Marinara | ~495 | ~21 g | ~23 g | no es fit |
| Italian Hoagie | ~555 | ~24 g | ~32 g | no es fit |

**En ARMA EL TUYO**, pavo o res laminada + todos los vegetales + aceite y vinagre (o honey mustard),
sin queso: ~330–420 kcal y 24–31 g de proteína.

**Cómo usarlo en la venta (recomendación)**:
- Sí: «alto en proteína» con el Philly (más de 30 g) y «el más ligero de la carta» con el Turkey, y
  un armado sugerido «fit» en el lado de WICHO. Siempre «aprox.».
- No: «light», «bajo en grasa», «saludable» ni conteos exactos: tienen significado regulado y hoy
  no se pueden respaldar. Y no como discurso principal: la etiqueta de «ligero» baja el sabor
  percibido (ver DECISIONES) y la marca vende sabor.
- Faltan para que el ángulo sea fuerte: pan integral, una opción sin pan (bowl) y una salsa ligera.
  Cada uno es un insumo nuevo: decisión del dueño con su costo.
