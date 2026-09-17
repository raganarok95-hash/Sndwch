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
