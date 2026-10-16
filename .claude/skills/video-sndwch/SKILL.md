---
name: video-sndwch
description: Cómo hace SND//WCH sus videos (el video del día automático, los Reels con clips reales del dueño y los episodios de la serie de los hermanos) y cómo se revisan antes de salir. Úsala para editar, planear o revisar un video o Reel de SND//WCH.
user-invocable: false
---

# Video

## Lo que ya corre (no se rehace)
- **El video del día** (`scripts/video-auto/diario.mjs`, GitHub `video-diario.yml` a las 5:47 de
  Lima): un Reel de un Signature con las fotos de la app, que queda como **borrador**. El Revisor
  de código (`revisar.mjs`, 11:15) lo aprueba o lo bloquea (agotado, no se abre hoy, antes de
  abrir). Es el **respaldo**: lo nuevo sale de clips reales y de Flow.
- La serie de los hermanos: `docs/marketing/BIBLIA_DE_LA_SERIE.md` (15–20 s, sin voces, texto en
  pantalla, formatos fijos de martes a domingo).

## Un Reel con clips reales (lo que más rinde en comida)
1. **La comida antes del segundo 2**: el corte, el queso que se estira, el vapor. Sin logo de
   entrada, sin pantalla de título.
2. **Texto en pantalla** (casi todos lo ven sin sonido): el momento en 3–5 palabras; el producto y
   el precio salen de la carta (`scripts/video-auto/datos.ts`).
3. 8–15 s para un anuncio; 15–20 s para la serie. Vertical 9:16, con el texto fuera del 14% de
   arriba y el 35% de abajo.
4. **El cierre**: el `//` y cómo pedir. Nada de «link en la bio» si es anuncio (tiene botón).
5. Música: solo la de la biblioteca libre de Instagram o Meta; nunca una canción con derechos.

## Lo que el clip tiene que cumplir
- Es el producto real, armado como se vende (la receta de la carta). Un clip donde se ve otro
  ingrediente o una porción que no es la real, no se usa.
- Nadie reconocible sin su permiso (ni clientes, ni motorizados).
- Pasa por el Director de arte (Puerta 2) y por Calidad (Puerta 3) como cualquier pieza.

## Lo que falta para el primero
Los clips: 2–3 de ~10 s del dueño armando los primeros pedidos (el celular parado, sin posar).
Mientras no estén, se dice en «Para el dueño»; no se reemplazan con video generado del sándwich.
