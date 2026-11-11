# PASAPORTE · veredicto del Crítico (2026-11-11)

> El Crítico no inventa: mata o deja pasar. Cada reel pasó las 8 puertas en orden (`METODO_GRANDES_EQUIPOS.md` §4.4);
> un «no» lo mata. Los cambios de abajo dicen **qué tiene que cambiar y dónde**, no reescriben la idea.

## Qué se juzgó (ojo con esto primero)

Lo que se monta es el `reel.json` (v2, «tras el extraño», 2026-11-11), **no el `GUION.md`**. Los dos ya no dicen lo
mismo: los títulos, los sellos y las imágenes cambiaron en el JSON y los GUION quedaron viejos. Se juzgó lo que se va a
ver (el JSON). Antes de mostrar nada al dueño, el GUION tiene que copiar al JSON o al revés: hoy hay dos versiones de
cada reel en el repo.

Recetas verificadas contra `supabase/functions/_shared/carta.ts` (SIG09, SIG11, SIG12, SIG04; P04, P05, P09; C01, C02;
T01, T03, T06, T09, T10; S06). Las líneas de ingredientes de los cuatro reels coinciden con la carta.

## La campaña (antes de los reels)

- **P1 Insight: pasa, pero no está escrito.** La campaña no tiene la frase «La gente quiere ___ pero ___». La que sí se
  puede armar con fuentes: *la gente quiere salir de lo de siempre (pollo, hamburguesa: `MERCADO.md` §1) pero no sabe
  qué es un Philly o un Hoagie* (dueño, 2026-11-02, `aprendizajes/redactor.md`). El sello responde «de dónde es» y la
  foto, «qué es». Lo de que el origen «se guarda y se comparte» es **sin evidencia local**, y la campaña lo dice.
- **P5 El activo: pasa.** El sello dorado de SANDO en el mismo lugar y la nota celeste de WICHO con «Allá / Acá» se
  repiten igual en los cuatro, y eso es lo que le faltaba a «¿Y si hoy son albóndigas?».
- **Lo que rompe la campaña desde adentro** (aparece en tres de los cuatro reels): las reglas dicen que el sello lleva
  «ciudad y año, nada más», que la leyenda se dice como leyenda y que la foto es la real de `img/`. La v2 incumple las
  tres en Hoagie, Tuna Melt y Classic Tuna.

## Reel por reel

### Sello 1 · PHILLY (lun 16) · **PASA · 37/50**

Se ve: foto real `img/sig09_v.webp` desde el segundo 0, el sello «FILADELFIA · 1930» encima y el título «Este sándwich
nació en un carrito de hot dogs.»

| puerta | | motivo |
|---|---|---|
| P1 | sí | el insight de la campaña: nadie sabe qué es un Philly; aquí se ve y se cuenta de dónde viene |
| P2 | sí | «Dice esto porque» Pat Olivieri vendía hot dogs en un carrito y puso res en un pan (National Geographic; Tasting Table, en `PASAPORTE.md`) |
| P3 | sí | contar el origen es común en cuentas de comida; lo que cambia es «Allá / Acá» con el porqué de la carta |
| P4 | sí | con la foto y el título, un extraño entiende «un sándwich con historia» en 3 s |
| P5 | sí | sello y nota de los hermanos |
| P6 | sí, con un cambio | foto real; la línea de ingredientes es la de SIG09. «Allá: provolone» es verdad solo para el **primer** queso: hoy en Filadelfia se pide igual con Cheez Whiz o con queso americano. Así como está, un comentario lo desmiente, y la campaña vive de que sus datos sean ciertos |
| P7 | sí | da algo para contarle a otro (envío); cierre con SNDWCH.APP |
| P8 | sí | no se burla de nadie y WICHO no es el tonto |

Puntaje: Brief 4 · Momento 2 · Marca a 2 s 4 · Gancho 4 · Contagio 4 · Pedible 3 · Verdad 4 · Serie 5 · Insight 3 ·
Título con porqué 4 = **37**. Pasa por poco: el punto débil es el momento (no dice para cuándo es, y no puede pedir
antes de abrir).

**Cambios obligatorios antes de publicar:**
1. Línea de WICHO: el «Allá» tiene que decir que era el **primer** queso, no el de hoy. Si no, se cambia el eje.
2. Cierre «Sello 1 de 6»: quitar «de 6» mientras el Meatball y el Turkey no tengan origen verificado (`PASAPORTE.md`
   los deja pendientes). Si no aparece una fuente, la serie prometió algo que no cumple.
3. `GUION.md`: copiar la v2. Hoy dice otro título y abre con el pasaporte vacío.

### Sello 2 · HOAGIE (mié 18) · **MUERE en P6 (la verdad)**

Se ve: título «El almuerzo de un astillero.», línea «Filadelfia, hace un siglo: los obreros italianos lo llevaban en
pan largo.», sello «FILADELFIA · ASTILLERO».

- **Motivo:** la v2 dice como un hecho lo que la propia campaña llama leyenda (una carta de 1953 a un diario; Wikipedia da
  otras explicaciones del nombre). Se perdió el «dicen». La regla de `PASAPORTE.md` es que «el reel dice que lo son».
  Encima, «italianos» cuando la fuente dice «italoamericanos».
- Además (no hace falta para matarlo): el sello no tiene año («ASTILLERO» va en el lugar del año), cuando la regla es
  ciudad y año. Y el dato bueno, que «hoagie» viene de Hog Island, no aparece en pantalla: está solo en el caption.
- La imagen es **generada** (`estudio/hecho/2026-11-16-pasaporte-sandwich-hoagie/v1.jpg`, que todavía no existe), cuando
  existe la real `img/sig11_v.webp` y la campaña dice «nunca una generada».

**Lo que lo haría pasar:** (1) la línea de 0–3 s marca la leyenda («dicen», «se cuenta») y dice «italoamericanos»;
(2) el sello vuelve a ciudad y año, o lleva la palabra LEYENDA igual que la tenía el Tuna Melt en el GUION, siempre del
mismo modo; (3) el paso Hog Island → hoagie se ve en pantalla, no solo en el caption; (4) la foto es `img/sig11_v.webp`.

### Sello 3 · TUNA MELT (vie 20) · **MUERE en P3 (la categoría)**

Se ve: título «El atún también se come caliente.», línea «Un clásico de las cafeterías de Estados Unidos.», sello
«EE. UU. · CAFETERÍA».

- **Motivo:** la v2 sacó el dato: no hay Charleston, ni 1965, ni el accidente. Lo que queda («un clásico de las
  cafeterías de EE. UU.») lo puede decir cualquier sandwichería «al estilo americano», que es justo lo que
  `PASAPORTE.md` dice que vino a arreglar, y es el «super genérico» del 10-nov. Un sello que dice «EE. UU. · CAFETERÍA»
  no es un sello de origen: rompe el activo en el tercer reel.
- Además: la nota de WICHO «Acá: en lascas» / «En lascas gruesas, nunca hecho pasta» no da un porqué, repite la
  diferencia. Y la foto es generada, con «pan tostado en sartén»: eso no está en la carta (la tabla de la campaña
  también dice «en sartén» sin fuente). Existe la real, `img/sig12_v.webp`.
- Es el reel del día de apertura y es el más débil de la semana.

**Lo que lo haría pasar:** (1) el dato vuelve a 0–3 s como leyenda (Charleston, 1965, «nadie lo pudo probar»), y el
sello con ciudad, año y LEYENDA; (2) la nota de WICHO da un motivo y no repite la diferencia (si la carta no tiene un
motivo, no hay nota); (3) foto `img/sig12_v.webp` y fuera la «sartén».

### Sello 4 · CLASSIC TUNA (dom 22) · **MUERE en P6 (la verdad)**

Se ve: título «El sándwich de atún tiene más de 130 años.», sello «NUEVA YORK · 1893», nota de WICHO «Allá: atún
importado. Acá: lascas, mayonesa justa.»

- **Motivo:** «Allá: atún importado» frente a «Acá» hace pensar que nuestro atún no es importado. La carta no dice de
  dónde viene el atún, y en el repo no hay dato del proveedor. Es una afirmación sobre el producto sin fuente.
- Además: no hay contraste (importado y en lascas son cosas distintas) y el motivo repite el «Acá» palabra por palabra
  («La mayonesa justa y pimienta blanca»). Es la **segunda** nota de la semana sobre «lascas», dos días después del Tuna
  Melt, y con la misma proteína (P04). La foto es generada; existe la real, `img/sig04_v.webp`. El dato de 1893 tiene una
  sola fuente (Wikipedia).
- El título sí sirve: dice qué es, lleva una cifra que se deriva de la fuente y da algo para contar.

**Lo que lo haría pasar:** (1) la nota de WICHO no dice nada sobre el origen del atún, salvo que el dueño confirme al
proveedor; usa un eje que la carta respalde y que no sea «lascas» otra vez; (2) una segunda fuente para 1893, o el
título dice «la receta más antigua que se conoce»; (3) la foto es `img/sig04_v.webp`.

## Muertes (para `MATADAS.md`)

| reel | idea en una línea | puerta | motivo |
|---|---|---|---|
| Hoagie v2 | «El almuerzo de un astillero» | P6 | cuenta una leyenda como un hecho; la campaña obliga a decir que es leyenda |
| Tuna Melt v2 | «El atún también se come caliente» | P3 | sin dato de origen: genérico «al estilo americano»; el sello «EE. UU. · CAFETERÍA» rompe el activo |
| Classic Tuna v2 | «Allá: atún importado. Acá: lascas» | P6 | da a entender el origen de nuestro atún, que no tiene fuente |

## Finalistas

Hay **uno**: **Sello 1 · PHILLY**, con sus tres cambios. Alguien lo va a mandar porque «nació en un carrito de hot dogs»
es un dato que se puede contar sin haber probado el sándwich (fuentes: National Geographic, Tasting Table; que el origen
se comparta es **sin evidencia local**, se mide con envíos por alcance). **No hay segundo finalista**: los otros tres
mueren tal como están. Es mejor mostrarle al dueño uno que cuatro.

## Para el dueño
- Los cuatro reels tienen dos versiones (GUION y JSON). Alguien tiene que decidir cuál vale antes de montar.
- Si Meatball y Turkey no tienen origen verificado, ¿la serie es de 4 sellos o de 6?
- ¿Se confirma el proveedor del atún? Sin eso, ninguna pieza puede decir nada sobre su origen.
