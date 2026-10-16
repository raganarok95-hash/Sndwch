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
  3. **PedidosYa** no se puede leer desde aquí: está con las capturas del dueño (§5).
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
del techo de pavo y de res de todo el mercado (S/19–19.90). Solo te pasan Chili's (con papas), los
club sándwiches y los cafés de §5.

## 5 · PedidosYa (capturas del dueño, 16-oct-2026, 11:15, búsqueda «sandwich»)

Solo se anota lo que en la captura queda debajo del nombre de su local.

| local (calificación) | qué vende | precios |
|---|---|---|
| **La Lucha Sanguchería Criolla** – Húsares (4.5) | lechón a la leña, pollo deshilachado | lechón **S/19.90** (promo S/16.90), pollo **S/18.50** |
| **San Agustín de Carlos Fhon** – El Golf (4.8) | asado, pollo, lechón | **S/15.90–19.90** (asado S/18.90) |
| San Agustín – Av. América Oeste (4.4) | asado, lomito, ternera | S/12.50–19 |
| San Agustín – San Andrés (4.6) | pollo, ternera, hot dog | S/12.50–13.50 |
| **La Casera** Sanguchería (4.7) | **atún S/17** (5.0 con 10 calificaciones, «relación precio calidad»: trozos de atún, sarza, lechuga, tomate), club S/33.50 | S/17–33.50 |
| Juguería Sandoval – Paseo Las Aguas (4.3) | lechón, pollo | S/12.90–18.50 |
| Ristr3tto Coffee Shop (4.2) | tres jamones, panini de pollo, flauta italiana | S/15–16.25 |
| Starbucks – Mall Aventura (4.4) | panino y ciabatta de pollo, queso | S/15.50 |
| Frutea – Av. Fátima (4.4) | bondiola ahumada, apaltado | S/23–25 |
| Vital Foods – El Golf (4.4) | capresse, atún, teriyaki | S/20.60–30.60 |
| Elevaria Café (4.5) | mediterráneo, picaña al chimichurri, club | S/28–37 |
| Triples Wow, Yuls, Soandi | triples, pan con lomo o pollo, sándwich de desayuno | S/7–15 |

Lo que dice la pantalla, además de los precios:
- **Las sangucherías que se parecen a ti cobran S/15.90–19.90** por su sándwich estrella, igual que
  en Rappi. Por encima solo están los **cafés** (Frutea, Vital Foods, Elevaria: S/23–37, con
  4.4–4.5), con pan de ciabatta o integral: existe un público que paga más de S/20 en Trujillo.
- **Casi todos los primeros resultados son pagados** («Anuncio») y llevan descuento (15–43%).
- Siete muestran **«Mismo precio que en local»**. Tú cobras 10% más en las apps: ese sello no lo
  tendrías.
- La Lucha y San Agustín llevan **«Solo en PedidosYa»**: la exclusividad es algo que las apps
  negocian (va con la pregunta de exclusividad a Rappi, P55).

## 6 · Lo que viste al pedirlos (16-oct)

Dueño: «Pedí los sándwiches; no los pesé, pero el de San Agustín es un pan pequeño, tradicional,
pan francés: alguien en el desayuno se come dos o tres. Mismo pan Don Pacho. No encontré disponible
el de atún (La Casera), pero el pan es pequeño».

**«Más caro y más pequeño» se confirma, al menos en el pan.** Los sándwiches de S/18.90–19.90 de
San Agustín y Don Pacho van en un pan de desayuno. Tu 15CM va en medio pan sub (la unidad pesa ~150 g;
el 15CM lleva ~75 g de pan) con ~85 g de proteína: es un almuerzo, no un pan del desayuno. Falta la
balanza para decir cuánto relleno traen ellos, pero el tamaño ya cambia la comparación: **por lo que
llega, tu precio no es caro; parece caro en la tarjeta de la app**, donde el cliente solo ve una
foto y un número.

## 7 · Lo que esto le dice al precio

1. **No hace falta bajar el 15CM a S/16–17.** Ahí estarías regalando margen contra sándwiches más
   chicos.
2. **El techo que el cliente ve es S/19.90.** Es el precio de las mejores sangucherías en las dos
   apps. Un 15CM a **S/19.90 en la web** queda a la par de ellos en precio, con más comida. Decirlo
   en un anuncio con cifras («el doble») pide la balanza primero (§8).
3. **La pregunta que queda es el +10% de las apps**: con él, el 15CM a S/19.90 sale a S/21.89 en
   Rappi y PedidosYa, otra vez arriba de la banda y sin el sello «Mismo precio que en local».
4. **El tamaño tiene que verse**: en la foto (con algo que dé escala) y en el texto de la vitrina
   («15 cm», la proteína real). Si no se ve, el cliente compara solo el número.
5. **El mes 1 de Rappi ya es la prueba de precio** (30% de descuento obligatorio: el 15CM sale a
   S/16.09–18.40 en la app). Si con el descuento vende y sin él se cae, el número era la barrera.

## 8 · Lo que falta (opcional)

- **Pesar** uno de San Agustín o Don Pacho y uno tuyo (pan y relleno por separado) para escribir
  la comparación con gramos y no con palabras. Sin esto el estudio ya alcanza para decidir.
- El número de reseñas de cada local en Rappi (otra corrida de GitHub, sin tokens).
