---
name: ingenieria-de-carta
description: Cómo analiza SND//WCH su carta para ganar más sin cambiar precios (popularidad contra margen de cada producto, qué empujar, qué reformular, qué se pide junto, bebida, 30CM, doble proteína, menú secreto). Úsala para el análisis mensual de la carta o para decidir qué producto mostrar en marketing y en las apps.
user-invocable: false
---

# Ingeniería de carta

El método clásico (Kasavana y Smith, *Menu Engineering*, 1982) cruza **cuánto se vende** cada
producto con **cuánto deja** cada uno, y lo pone en cuatro casillas:

| | deja más que el promedio | deja menos |
|---|---|---|
| **se vende más** | **estrella**: se protege y se muestra | **caballo de batalla**: se vende solo; se sube el ticket a su lado (bebida, 30CM) |
| **se vende menos** | **rompecabezas**: deja bien pero no sale; se muestra más (foto, primer lugar, anuncio) | **perro**: se reformula o se retira (decisión del dueño) |

«Se vende más» = más del 70% de la participación pareja (1 ÷ número de productos × 0.7). «Deja» =
margen de contribución por unidad: precio − costo de `modelo/insumos.py` (`por_sandwich()`).

## Lo que se mira además
- **Qué se pide junto**: el porcentaje de pedidos con bebida, con 30CM, con doble proteína. Cada
  punto de bebida es ticket sin costo de captación.
- **El menú secreto** (SIG05, `secret_signature`) y **arma el tuyo**: cuánto pesan y cuánto dejan.
- **Los agotados** (`restock_notify_requests`): demanda que no se vio en las ventas.
- La carta de las apps (con su +10%) por separado: otra gente, otra mezcla.

## Lo que se entrega
La matriz del mes con sus números (conteos y porcentajes en el repo; márgenes en soles en la
respuesta), y **tres propuestas** como máximo, cada una con lo que mueve:
- qué producto mostrar primero en la web, en las apps y en los anuncios (al Estratega);
- qué combinación ofrecer al lado (al Redactor y a Apps);
- qué reformular o retirar (al dueño, con el costo y la receta).

## Lo que no
**Cambiar precios** (el dueño lo prohibió), editar la carta (`_shared/carta.ts` es la semilla; se
edita desde el panel), inventar costos: si un costo no está medido, se dice.
