# El mercado de sándwiches en Trujillo (estudio, 2026-10-16)

Dueño: «Para ver el precio necesito un estudio de mercado real. Un análisis profundo a
competidores; hay algunos que venden mucho más caro y más pequeños, pero no lo sé. Quiero primero
que hagamos bien el estudio».

## 1 · Cómo se hizo (y qué no cubre todavía)

- **Fuente**: las páginas públicas de Rappi (las que indexa Google, sin cuenta), leídas el
  16-oct-2026 por `scripts/mercado/rappi.mjs` desde GitHub Actions (`mercado.yml`, sin gasto de
  tokens). Categorías de Trujillo: sándwiches, hamburguesas, comida rápida y desayunos; solo locales
  del Trujillo metropolitano (Trujillo, Víctor Larco, La Esperanza, El Porvenir).
- **Lo que trajo**: **120 locales** con su carta y **4,024 productos**; de ellos, **185 sándwiches**
  (sin combos ni promociones) y 598 hamburguesas. Los datos completos están en la rama `mercado`
  (`mercado/rappi.json` y `mercado/rappi-productos.csv`).
- **Límites, dichos de frente**:
  1. **Son precios de Rappi.** Muchos locales cobran más en la app que en el local, igual que tú (+10%).
     Se compara precio de app contra precio de app.
  2. **Ninguna carta dice gramos ni centímetros.** «Más caro y más pequeño» no se puede saber leyendo:
     hay que comprarlos y pesarlos (§5).
  3. **PedidosYa no está**: sus páginas no salen en Google y desde aquí no cargan.
  4. Falta el número de reseñas de cada local, que es la mejor pista de cuánto vende.

## 2 · Lo que cuesta un sándwich en Trujillo (Rappi)

| | cuántos | mínimo | 25% | **mediana** | 75% | máximo |
|---|---|---|---|---|---|---|
| **todos los sándwiches** | 185 | 5.00 | 11.50 | **14.90** | 18.90 | 68.00 |
| pavo | 12 | 7.50 | 12.90 | **16.50** | 18.90 | 19.00 |
| res, asado, lomo | 35 | 8.50 | 12.90 | **17.00** | 19.90 | 50.70 |
| pollo | 93 | 5.00 | 11.00 | **13.90** | 19.00 | 68.00 |
| cerdo, chicharrón, bondiola | 48 | 8.50 | 16.00 | **19.45** | 27.00 | 51.00 |
| jamón, mixto, triple | 47 | 7.00 | 10.90 | **14.00** | 20.00 | 68.00 |
| club sándwich | 11 | 12.90 | 16.90 | **24.90** | 26.13 | 42.00 |
| hamburguesas | 598 | 5.00 | 12.00 | **16.50** | 22.00 | 73.00 |

60 de los sándwiches incluyen papas en el precio (mediana S/16).

## 3 · Los que más se parecen a ti

| local (calificación en Rappi) | qué vende | precios |
|---|---|---|
| **Don Pacho** Sánguches & Horneados (4.5) | horneados en pan: pavo, asado de res, bondiola, lomo, codillo | **S/14.90–19.90**; el «Extremo» S/26.50 |
| **La Casera** Sanguchería (4.6) | mixtos, pollo, atún (S/17), caprese; lomo al wok S/28; club S/33.50 | **S/12–18.50** |
| **Juguería San Agustín** (4.3) | pollo deshilachado, pavo y asado (S/19), lechón (S/20.50) | **S/12.50–20.50** |
| Labs | paninis de pollo, pavo (S/19) y cerdo, con chips | S/17.50–20 |
| Patria | pollo con papas nativas incluidas | S/16–19; club S/30 |
| Mamá Mía Sandwiches | sándwiches «del mundo» | S/15 todos |
| Llámame Doña | pavo y mechado en ciabatta | S/8.90–12.90; club S/24.90 |
| **Chili's Sándwiches** | pollo y cerdo estilo americano, **con papas** | **S/27–34** (el caro) |

## 4 · Dónde quedas tú

Tu precio en Rappi es el de la web + 10%:

| | web | **Rappi** | lo comparable en Rappi |
|---|---|---|---|
| Philly Cheesesteak 15CM | 22.90 | **25.19** | asado de res: Don Pacho 19.90, San Agustín 19.00 |
| Turkey 15CM | 23.90 | **26.29** | pavo: Don Pacho 18.90, San Agustín 19.00, Labs 19.00 |
| Classic Tuna 15CM | 20.90 | **22.99** | atún: La Casera 17.00 |
| Meatball Marinara 15CM | 21.90 | **24.09** | (no hay albóndiga en Trujillo) |

**Hoy estás S/6–7 por encima de las mejores sangucherías de Trujillo en la misma app**, y por encima
del techo de pavo y de res de todo el mercado (S/19–19.90). Solo te pasan Chili's (con papas) y los
club sándwiches. Con el 15CM a **S/16.90–19.90 en la web**, en Rappi quedarías en **S/18.59–21.89**:
a la par de Don Pacho y San Agustín.

Lo que la tabla no dice todavía, y decide si tu precio se sostiene: **cuánto relleno traen ellos**.
Tu 15CM lleva ~85 g de proteína en un pan de 15 cm. Si el pavo de S/18.90 trae 60 g, estás caro por
poco; si trae 120 g, estás caro de verdad.

## 5 · Lo que falta para cerrar el estudio

1. **Comprar y pesar** (la prueba que responde «más caro y más pequeño»): 5 sándwiches comparables
   por Rappi, el mismo día y a la misma hora — Don Pacho pavo (S/18.90) y asado de res (S/19.90), La
   Casera atún (S/17), San Agustín pavo (S/19) y Labs pavo (S/19). Unos **S/95 más el envío**: es
   gasto real, va con tu sí. Con una balanza de cocina y una cinta: largo del pan, peso total, peso
   del relleno (sacándolo), qué proteína es y cuánta, cómo llegó (temperatura, empaque, tiempo).
   Una hoja por sándwich con foto. Con eso sale el **precio por 100 g de relleno** de cada uno, que es
   la comparación justa.
2. **PedidosYa**: 10 capturas tuyas de la búsqueda «sándwich» en Trujillo (la lista con precios y
   calificaciones, y la carta de los 4–5 primeros), como hiciste con Subway.
3. **Cuánto vende cada uno**: agregar al lector el número de reseñas de cada local (un ajuste chico y
   otra corrida de GitHub, sin tokens).

Con eso se decide el precio con datos de Trujillo, no con una regla promedio.
