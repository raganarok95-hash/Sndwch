# Cómo se diseña acá — y por qué esto existe

> Escrito el 2026-09-18 después de una sesión entera de rediseños rechazados. El dueño
> señaló la causa mejor que yo: *«sigues con la misma lógica y no corriges eso, lo cual
> generará errores a futuro otra vez»*.

## La lógica que hay que romper

**El punto de partida era siempre el artefacto anterior.** Llegaba una corrección, se ubicaba
el defecto nombrado, y se le aplicaba a ESE MISMO archivo la transformación más chica que lo
tapara. Un bucle de edición solo puede producir vecinos de donde arrancó:

| lo que pidió | lo que se entregó |
|---|---|
| «esto no es un sistema, es un recolor» | se cambió color y fuente sobre el mismo HTML |
| «está muy cuadriculado» | se le pusieron cortes diagonales a las mismas pantallas |
| «el color invade el producto» | se encogió la foto en vez de cambiar el velo |
| «rehaz la pantalla» | se quitó un recuadro y se dejó todo lo demás |

**Por qué pasa:** partir de lo existente es barato y seguro —compila, renderiza, está al 90%—
y partir de cero cuesta trabajo real. Así que gana el vecino. Y a un vecino **siempre** se le
puede poner la etiqueta de un rediseño, así que el nombre esconde el mecanismo.

⚠ **Y no es un problema de maquetas.** Con esta misma lógica, las pantallas de la app salen
vecinas de las de la app anterior — que es el reclamo con el que empezó toda la reconstrucción
del front.

## Las tres reglas

### 1 · Clasificar el pedido ANTES de abrir nada

- **ARREGLO** — se señala algo puntual. Se edita en el archivo, se cambia solo eso.
- **REPENSAR** — la pantalla no funciona. **Archivo nuevo, en blanco, sin abrir el anterior.**
  Si te descubres pegando marcado viejo, estás en el bucle.

Casi todos los fallos de esa sesión son el mismo: se pidió REPENSAR y se entregó ARREGLO.

### 2 · Divergir antes de converger

En un REPENSAR, antes de la primera etiqueta: **tres respuestas estructuralmente distintas** a
«¿qué es esta pantalla?». Distintas de verdad — otro esqueleto, otra jerarquía, otra cantidad de
elementos, no otra paleta. Se elige una a propósito y se dice por qué. Así el vecino deja de ser
lo que sale solo y pasa a ser una de tres opciones visibles.

### 3 · El detector, que es mecánico

**Si el marcado nuevo comparte más del 30% con el viejo, no fue un repensar.** Se compara antes
de mostrar nada, y si no pasa, se dice —no se espera a que lo note el dueño—. Es el mismo
chequeo que ya cazó las «tres opciones de sistema» que resultaron ser un HTML pintado de tres
colores: *si el DOM es el mismo, es el mismo diseño*.

## Y lo que ya se sabía, que sigue valiendo

- **Se mira la pantalla renderizada, no el diff.** El criterio no es «¿cambió?» sino «¿alguien
  diría que es lo mismo?».
- **No se escribe la etiqueta antes de la comprobación.** Poner «tres sistemas distintos» en el
  pie de una imagen cierra el caso en la cabeza de quien lo escribe.
- **Antes de inventar, se abre el archivo** — el PNG, la ficha, la tabla. Ver
  `docs/LOS_DOS_HERMANOS.md`, que se lee ANTES de dibujar.
