---
name: verdad-y-ley
description: El control de verdad y ley de SND//WCH antes de producir, publicar o pagar una pieza (la carta real, INDECOPI, promociones, políticas de anuncios de Meta, alcohol, datos personales). Úsala para revisar un concepto, un texto, una imagen o un anuncio de SND//WCH antes de que salga.
user-invocable: false
---

# Verdad y ley: la Puerta 3 (y la mitad de la Puerta 1)

Calidad no juzga si una pieza es bonita (eso es arte) ni si es buena idea (eso es el creativo):
juzga si **dice la verdad**, si **se puede publicar** y si **algo necesita al dueño**. El Revisor
de código (`scripts/video-auto/reglas-del-revisor.mjs`) ya controla agotados, horario y fecha de
apertura del video del día; Calidad ve lo que el código no ve: lo que **promete** la imagen.

## La lista (cada punto: pasa, falla o «para el dueño»)

### 1 · La carta (lo que se ve es lo que llega)
- Leer el producto en `docs/hechos/CARTA.md`: pan, proteína, vegetales, salsas, queso.
- En la imagen: **¿falta algo que la receta lleva?** (tolerable si no se ve) **¿Hay algo que no
  lleva?** (falla: otro queso, pepino, hierbas, otra salsa). **¿La porción es la real?** Pan de
  15 cm, una capa, ~85 g de proteína; desbordado = falla.
- Precios, tamaños, horas y reglas: **iguales a los de la carta y las reglas**
  (`scripts/piezas/datos.ts` los entrega; `docs/hechos/REGLAS.md`). Una cifra escrita a mano que
  no sale de ahí = falla, aunque hoy coincida.
- El texto de «cómo se vende» de la carta es la fuente de toda afirmación sobre el producto.

### 2 · INDECOPI (publicidad y consumo)
- **Veracidad**: nada que pueda inducir a error sobre lo que se recibe (ingredientes, tamaño,
  tiempo de entrega, zona). El caso Bon o Bon: la imagen promete, y se sanciona.
- **Promociones**: si una pieza anuncia un premio, descuento o regalo, tiene que decir sus
  condiciones o llevar a donde están (vigencia, mínimo, stock). «Gratis» solo si no hay que
  pagar nada para recibirlo, o la condición va al lado.
- **Comparaciones** con otro negocio: no, salvo que el dueño lo pida.
- **Salud**: nada de «saludable», «light», «bajo en», «nutritivo» ni beneficios de salud.
  «Llena sin pesar» es la frase de la carta y es lo máximo.
- El **texto legal** (Términos, Privacidad, Cambios y Devoluciones, Cancelaciones) no se toca, y
  ningún dato legal del negocio (RUC, razón social, dirección) se escribe si no está en la app.
- El **Libro de Reclamaciones** se responde dentro del plazo legal (15 días hábiles, ver
  `supabase/functions/api/actions/complaints.ts`); un reclamo nunca se contesta solo en un
  comentario.

### 3 · Las políticas de anuncios de Meta
- **Alcohol**: ni en la imagen ni en el texto (además, no se vende).
- **Atributos personales**: el texto no puede afirmar o insinuar que sabe algo de la persona
  (salud, situación económica, etc.). «¿Hoy no cocinas?» está bien; «¿Estás a dieta?» no.
- **Gente real o famosa**: nadie reconocible sin permiso; nada de testimonios inventados.
- **Botón y destino**: el enlace lleva a `sndwch.app` con su `?src=`; lo que promete el anuncio
  tiene que estar en esa página.
- Texto sobre la imagen: ya no hay regla del 20%, pero menos texto rinde más.

### 4 · La marca y los datos
- Sin identidad regional; el `//` correcto si aparece; los hermanos con su dibujo real.
- Nada de datos personales de clientes (nombres, teléfonos, direcciones) en una pieza ni en el
  repo, que es público.

## El veredicto
- **pasa**: todo pasa.
- **retener**: algo falla; di qué y el cambio exacto que lo arregla.
- **para el dueño**: toca plata, ley o marca y no es obvio (una promoción nueva, una afirmación
  dudosa, gasto). No se decide solo.
