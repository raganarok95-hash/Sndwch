# El Instagram como vitrina (propuesta, 2026-10-07)

Dueño: «No solo necesita ser video o video corto: pueden ser imágenes, etc., cualquier cosa
necesaria. Y se debe tener en cuenta cómo está el propio Instagram: qué fotos hay subidas,
historias, destacadas y cómo se ve todo».

## 0 · Cómo está hoy: todavía no se puede ver desde acá

`.github/workflows/mirar-instagram.yml` intentó abrir **@snd__wch** como un cliente sin cuenta
(2026-10-07): Instagram muestra solo la pantalla de inicio de sesión y su API pública responde
**429**. Hay dos caminos para la auditoría:
1. **El token de la página (P33)**: con él, la API de Instagram da el perfil, cada publicación,
   sus métricas y las historias del día. Queda automático.
2. **Ahora mismo**: 4 capturas tuyas desde el celular: el perfil arriba (foto, bio, destacadas),
   la cuadrícula bajando hasta el final, una destacada abierta y una historia.

Con eso se llena la sección 6 (la auditoría) contra lo de abajo.

## 1 · Lo que el perfil tiene que lograr en 3 segundos

Quien llega desde un video ve el perfil **antes** de pedir. Tiene que entender: qué es, si le
llega a su casa, cuándo y cómo se pide. Si duda, se va.

| pieza | propuesta | por qué |
|---|---|---|
| **Nombre** (el campo que Instagram busca) | `SND//WCH · Sándwiches a domicilio` | se encuentra al buscar «sándwiches», no solo el nombre |
| **Bio**, 4 líneas | qué es · dónde reparte · horario (sale de `store_hours`) · «pide aquí ↓» | responde las cuatro dudas sin abrir nada |
| **Enlace** | `sndwch.app/?src=ig-bio` | mide cuántos pedidos trae el perfil |
| **Botón de acción** | «Pedir comida» hacia sndwch.app, si Instagram lo ofrece para tu cuenta | un toque menos |
| **Foto de perfil** | el logo con el SANDO aprobado, legible a 110 px | es lo que se ve en cada comentario e historia |

## 2 · Las destacadas: el menú fijo del perfil

| destacada | qué tiene | portada |
|---|---|---|
| **Pide** | cómo se pide en 3 pasos, Yape y tarjeta, sin descargar nada | el carrito |
| **Carta** | una historia por Signature: la foto y su frase | el pan |
| **Arma** | el armador paso a paso, con WICHO | la espiral de WICHO |
| **Grupo** | cómo pedir para la oficina y la regla de quien organiza (derivada del código) | la lista larga |
| **Zonas** | hasta dónde llega y el horario | el mapa |
| **Ellos** | quiénes son SANDO y WICHO | sus caras |
| **Ustedes** | lo que publican los clientes (cuando lo haya) | el corazón de tinta |

Las portadas se dibujan con los elementos de cada hermano (`LOS_DOS_HERMANOS.md`): que se
lean como una fila del mismo sistema.

## 3 · La cuadrícula: que se lea como una carta

- **Tres publicaciones fijadas**: 1) cómo pedir (carrusel), 2) la carta en una publicación,
  3) presentación de los hermanos (video).
- **Ritmo de tres**: cada fila combina personaje, producto y algo útil (carrusel o gráfico), así
  la cuadrícula nunca es una pared de fotos iguales.
- **Portadas de los Reels con el mismo sistema**: título corto en la misma tipografía y posición.
  Desde el perfil, los videos se leen como capítulos de una serie y no como clips sueltos.
- **Recorte 4:5 seguro**: Instagram muestra la cuadrícula en vertical; el título nunca va donde
  se corta.

## 4 · Las historias: el día a día (martes a domingo)

| hora | historia | sticker |
|---|---|---|
| 10:30 | «Hoy hay» (lo disponible del inventario real) | enlace con `?src=ig-hist` |
| 11:30 | la pregunta del día de WICHO | encuesta o deslizador |
| 12:30 | la cuenta regresiva al almuerzo | cuenta regresiva |
| 19:00 | lo que salió en la cocina hoy (los hermanos) | — |
| solo si pasa | «Se acabó» | — |
| domingo 20:00 | «Mañana cerramos, pide hoy» | enlace |

Lo que sirve se guarda en su destacada; lo demás vence a las 24 horas.

## 5 · Más allá del video (formatos)

| formato | para qué | ejemplo nuestro |
|---|---|---|
| **Carrusel** | lo que se guarda y se comparte | la anatomía en 6 láminas; el pedido raro como cómic |
| **Tira cómica** (1 imagen, 4 viñetas) | personaje sin producir video | SANDO y WICHO, una tira por semana |
| **Póster** (1 imagen) | lo que tiene que verse de lejos | el Signature del día, el ganador del duelo |
| **Historias interactivas** | conversación, alcance | encuesta, quiz «¿qué Signature eres?» |
| **Notas** de Instagram | la línea del día, arriba del chat | «Hoy SANDO no quiere hablar» |
| **Canal de difusión** | avisos a quien te sigue de verdad | el duelo, el pedido raro, lo nuevo |
| **Stickers de WhatsApp** | los grupos de oficina | el paquete de los hermanos |
| **Estados de WhatsApp** | los contactos del negocio | lo mismo que las historias |
| **Publicaciones de Google** | quien busca «sándwiches» | el Signature de la semana (cuando exista la ficha) |
| **TikTok de fotos** (carrusel) | alcance en TikTok sin video | la anatomía |
| **La tarjeta de la bolsa** | el cliente que ya pidió | el mini cómic coleccionable con QR |

## 6 · La auditoría (pendiente de ver el perfil)

| qué | cómo está | qué cambia |
|---|---|---|
| Nombre y bio | — | — |
| Foto de perfil | — | — |
| Destacadas | — | — |
| Cuadrícula (lo subido) | — | — |
| Historias | — | — |
