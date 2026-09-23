# De dónde salió cada foto

Los archivos de esta carpeta son los ORIGINALES sin tratar. `scripts/tratar_fotos.py` lee de
acá y escribe en `img/` — nunca al revés, porque aplicar viñeta y grano sobre una foto que ya
los tiene la degrada un poco más en cada corrida sin dar ningún error.

Este archivo existe porque hasta el 2026-09-17 **no había forma de saber de dónde venía
ninguna foto**: si una resultaba mal licenciada, o el dueño quería el original en otro
recorte, no quedaba rastro. Toda foto nueva se anota acá el mismo día que entra.

## Proteínas de ARMA EL TUYO (2026-09-17)

Las seis anteriores eran stock suelto que nunca pasó por `tratar_fotos.py`, y tres mostraban
cosas que no están en ninguna receta (mantel a cuadros azul, tomates cherry, aceitunas).
Estas se licenciaron en la **categoría gratuita de Adobe Stock** (`pricing:"free"`, sin costo
para el dueño) y se recortaron al sujeto antes de guardarse, que es lo que saca la
escenografía ajena del cuadro.

| archivo | receta que representa | Adobe Stock | recorte aplicado al original |
|---|---|---|---|
| `prot_p01.jpg` | **P01 Res // Asado** — punta de pecho a fuego lento | `334898925` (5760×3840) | cuadrado 2600 px desde (1868, 313) — deja fuera el pan de molde y el mantel a cuadros del plano original |
| `prot_p02.jpg` | **P02 Pollo // Teriyaki** — muslo marinado y glaseado | `683939451` (5393×3600) | cuadrado 2100 px desde (2455, 930) — solo el plato |
| `prot_p04.jpg` | **P04 Atún // House** — en lascas gruesas, nunca pasta | `321236277` (3251×4354) | cuadrado 1900 px desde (675, 922) — **por dentro de la lata**, que es lo que elimina el fondo turquesa de estudio |
| `prot_p05.jpg` | **P05 Embutido // Italiano** — laminado fino, en pliegues | `559782786` (5472×3648) | cuadrado 2400 px desde (1098, 1000) — deja fuera el cuenco de aceitunas, la botella de aceite y el romero |
| `prot_p06.jpg` | **P06 Albóndiga // Marinara** — chicas, en su propia marinara | `412433609` (7872×4432) | cuadrado 3000 px desde (2200, 938) — por dentro del sartén, fuera la servilleta rosa |
| `prot_p08.jpg` | **P08 Pavo // Horneado** — lonjas finas, en pliegues | `469607542` (5184×3456) | cutout + fondo nuevo, ver abajo |

Las cinco primeras se guardan reescaladas a 1600 px: la pantalla pide 1050, así que 1600 deja
holgura real para re-encuadrar sin volver a licenciar, y evita meter 11 MB de binarios al
historial por una foto que se sirve a 150 KB.

### El pavo lleva un paso más

La única foto honesta de lonjas de pavo horneado (no ahumado, no a la parrilla) venía sobre
**fondo blanco de estudio**. Puesta junto a las otras cinco rompía el set entero — que es
exactamente el defecto que `tratar_fotos.py` existe para evitar: el tratamiento uniforma
color y grano, pero ningún filtro convierte un blanco de catálogo en la misma escena que un
sartén de hierro.

Así que el fondo se reemplazó antes de guardarla: máscara del blanco **conectado al borde**
(un flood fill desde las cuatro esquinas, para que los brillos claros DENTRO de la lonja no
se vuelvan transparentes), suelo con el degradado oscuro de la marca y una sombra de contacto
suave para que las lonjas no floten. Se hizo con Pillow y no con `image_remove_background` de
Adobe porque el host que devuelve ese recorte (`photoshop-api.adobe.io`) está bloqueado por
el proxy de este entorno — la llamada funciona, el archivo no se puede traer. Ver
`docs/ENTORNO.md`.

## Signatures

Los ocho `sig0N.jpg` son anteriores a este archivo y **no tienen procedencia anotada**: se
consiguieron antes de que existiera esta libreta y no se inventa acá un dato que nadie
verificó. Si alguna vez hay que volver a licenciar una, hay que buscarla de nuevo.

## SANDO v2 y las manos de los dos (2026-09-18)

**El dueño rediseñó a SANDO.** Su dibujo nuevo es de línea negra limpia y sombreado plano —
ya no el trazo pintado del anterior. Llegaron por Flow, generados por él, no licenciados:
no hay stock detrás de ninguno de estos archivos.

| archivo | qué es | de dónde salió | tratamiento aplicado |
|---|---|---|---|
| `sando2_frente.png` | busto de frente, neutro | Flow · `persona_studio_batch_2.zip`, shot 1 | fondo plano recortado por relleno desde los bordes, recorte al sujeto |
| `sando2_sonrie.png` | tres cuartos a la derecha, media sonrisa | ídem, shot 2 | ídem |
| `sando2_mira.png` | tres cuartos, mirando de lado | ídem, shot 3 | ídem |
| `sando2_perfil.png` | perfil izquierdo | ídem, shot 4 | ídem |
| `sando2_ladea.png` | tres cuartos a la izquierda | ídem, shot 5 | ídem |
| `sando2_asoma.png` | busto vertical, para asomar por el costado | Flow, imagen suelta | ídem |
| `sando2_pulgar.png` | brazo y mano, pulgar arriba | Flow, imagen suelta | ver la nota de abajo |
| `wicho_pulgar.png` | brazo y mano de WICHO, pulgar arriba | Flow, imagen suelta | ver la nota de abajo |
| `wicho_asoma.png` | busto de WICHO mirando a la izquierda | Flow, imagen suelta | fondo blanco recortado |

⚠ **Las manos llegaron en `.jpg`, así que su transparencia ya no existía**: el damero gris de
fondo venía **dibujado dentro de la imagen**, no como canal alfa. El alfa se reconstruyó
detectando el fondo neutro claro por relleno desde los bordes. Funciona, pero los bordes
quedan más duros que en un PNG original. **Están pedidos los PNG con alfa de verdad** —
cuando lleguen, estos dos archivos se reemplazan.

⚠ **Los `img/sando_*.png` viejos son del SANDO anterior** y no se borraron todavía porque
el cliente los sigue referenciando. Reemplazarlos es una tarea aparte, y hay que hacerla
completa: un SANDO nuevo junto a uno viejo en dos pantallas distintas es peor que dejar
todo viejo.

## WICHO sin la sombra de piso (2026-09-23)

`wicho_cuerpo.png` trae **un óvalo gris azulado bajo los pies pintado dentro del archivo**,
no un efecto de la pantalla — así que no se puede apagar por CSS. En la pantalla de entrada,
donde SANDO y WICHO se paran juntos, uno traía su sombra y el otro no, y el desnivel se veía.

`wicho_cuerpo_sinsombra.png` es el mismo dibujo con esa sombra quitada (8 250 píxeles). El
original **no se tocó**.

**Cómo se detectó, para poder repetirlo:** una sombra de piso es un componente conectado de
color **neutro** (los tres canales a menos de 26 de diferencia), **claro** (luminancia ≥ 135),
**ancho** (más del 45% del cuadro) y **bajo** (menos del 12% de alto), en la franja inferior de
la imagen. Esos cuatro criterios juntos la separan de las zapatillas, que son beige —no
neutras— y estrechas. Descartar por "no toca el contorno del dibujo" NO funciona: los pies se
apoyan sobre la sombra y la tocan.

Se corrió el mismo análisis sobre `wicho_rie` y `sando2_cuerpo` y **ninguno tiene sombra
horneada**: esto no abre una limpieza general, era solo este archivo.

⚠ Los prompts de `docs/POSES_QUE_TE_TOCAN.md` ya piden «fondo transparente, sin sombra de
piso» justamente por esto. Si una pose nueva llega con sombra, se le aplica este mismo
procedimiento antes de usarla.
