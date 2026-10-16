---
name: vitrina-apps
description: Cómo se cuida la tienda de SND//WCH dentro de Rappi y PedidosYa (vitrina, fotos, descripciones, precios de app, promos, calificaciones y anuncios internos). Úsala para preparar, revisar o mejorar la presencia de SND//WCH en las apps de delivery.
user-invocable: false
---

# La vitrina en las apps

Un anuncio manda gente a la tienda; si la tienda se ve pobre, se paga el clic y no hay pedido. Las
apps no tienen API para nosotros: **el especialista deja todo listo para pegar** y el dueño lo
carga en el portal de aliados.

## La vitrina (`docs/PLAN_DESDE_HOY.md` §1)
- **Nombres**: los de la carta, iguales.
- **Descripciones**: la primera frase de «Cómo se vende» (`docs/hechos/CARTA.md`): que diga qué
  lleva. Sin superlativos ni palabras de salud.
- **Orden**: el Philly primero (la estrella y la foto que calza), después el resto.
- **Precios**: los de la web + 10% (decisión del dueño, 2026-10-09). Se calculan desde la carta,
  nunca a mano; el redondeo que use el dueño en el portal se anota.
- **Fotos**: solo las que calzan con la receta. Las de stock que no calzan se marcan para cambiar
  apenas haya fotos reales o generadas fieles aprobadas.
- **Horario**: el de la base. **Combo**: sándwich + bebida, como en la web.
- **Aceptar rápido**: el celular o la tablet con sonido; menos de 2 minutos pesa en el orden.

## Lo que se mira cada semana
- Calificación y comentarios: lo que se repite va al Director de cuenta (y a Comunidad si es un
  reclamo).
- Pedidos y ticket por app contra la web (los números los pega el dueño).
- La comisión: el primer mes de Rappi sin comisión; después, cuánto deja cada pedido de app contra
  uno directo (`modelo/proyeccion.py`). La meta es llevar al que repite al canal directo, sin
  romper las reglas de la app.

## Lo que NO
- No se promete en la app algo distinto de la web (otra receta, otra porción).
- Promos y anuncios de la app son gasto: se proponen con su costo y su regla de corte
  (`pauta-medible`) y los prende el dueño.
