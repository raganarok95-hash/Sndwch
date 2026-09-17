# Los dos hermanos como IDIOMA DE INTERFAZ

> Escrito el 2026-09-17 después de que el dueño tuviera que corregir tres rondas seguidas de
> diseño con la misma frase: *«no es solo un color»*. Tenía razón. Yo venía tratando la
> identidad de cada hermano como una capa de pintura sobre un mismo layout — cambiaba el tono
> y dejaba la estructura igual. Eso es un reskin, un nivel más arriba.
>
> Todo lo de acá **sale de sus fichas reales** (`docs/PROMPTS_PERSONAJES.md`, sección 3) y de
> muestrear sus PNG con código. Nada está elegido a ojo.

## La regla que ordena todo

**El mundo de cada hermano se construye con lo que ESE hermano es** — su color, su textura, su
tipo de línea, su forma de reaccionar. No con un tono que quede bonito. Si un elemento no se
puede rastrear a algo suyo, no va.

Y la diferencia entre los dos no puede ser solo cromática: **si pones las dos pantallas en
blanco y negro, se tienen que seguir distinguiendo.**

---

## SANDO · el curador

De su ficha: pelaje verde oliva casi negro, mechón corto en punta, máscara y hocico en **tan
cálido `#C9A87C`**, ojos almendrados de párpado pesado —*la mirada de quien ya decidió*—, boca
**cerrada, media sonrisa, nunca se le ven los dientes**. Casaca bomber oliva **de cuello y puños
ACANALADOS**, polo blanco liso. Línea de contorno de **grosor PAREJO, en verde muy oscuro —
nunca negro puro**. Sombreado **PLANO de dos tonos. Sin textura, sin trama, sin grano, sin
degradados, sin marcas de pincel.**

### Su idioma

| elemento | de dónde sale | cómo se usa |
|---|---|---|
| **Cero degradados. Dos tonos planos.** | su sombreado plano | **Ninguna superficie suya lleva degradado, ni un velo sobre foto.** Foto limpia + panel de color liso con borde recto. |
| **Un solo grosor de línea, en `#1E2B22`** | su contorno parejo | Todas sus reglas y separadores miden lo mismo. No hay pelos de 1px conviviendo con barras de 3. |
| **Esquina recta, siempre** | su línea cerrada | Nada redondeado en su lado. |
| **Acanalado (rib)** | cuello y puños de su bomber | Franjas verticales finas y regulares. Es SU textura — donde haya que llenar un campo, se llena con rib, no con degradado. |
| **Tan cálido `#C9A87C`** | su hocico y su máscara | El segundo color de su mundo, el que lo salva de ser solo verde y dorado. |
| **Dorado apagado** | el `//` bordado en su pecho | El dinero y lo único que hay que mirar. Apagado, no brillante. |
| **Silencio** | boca cerrada, párpado pesado | Su mundo no grita: sin signos de exclamación, sin globos, sin animación de rebote. La jerarquía la hace el tamaño, no el volumen. |

**Su color base** (muestreado de `img/sando_cuerpo.png`): pelaje `#183024` · casaca `#6C7860` ·
tan `#C9A87C` · dorado `#CBA258`.

---

## WICHO · el que arma

De su ficha: pelaje celeste `#8CC8EC` **con textura de pincel VISIBLE — se ven las cerdas, no es
un relleno plano**. Mechón desordenado cayendo al frente. Máscara y orejas en **rosa durazno
pálido**. Ojos: **ESPIRALES LILA `#C3A6D2` sobre `#4A3D62` — su rasgo más reconocible, jamás se
reemplazan**. Boca: **sonrisa abierta, dientes y lengua a la vista, cejas arriba**. Polo
gris-azul **estampado con curvas de nivel finas, tono sobre tono**. Trazo de tinta **suelto y de
grosor MUY VARIABLE en azul marino oscuro, líneas que SE PASAN y no siempre cierran**, textura
interna y **trama cruzada**, color saturado, energía de sticker.

### Su idioma

| elemento | de dónde sale | cómo se usa |
|---|---|---|
| **La espiral** | sus ojos | Su marca funcional: el avance de los seis pasos es una espiral que se cierra, el "cargando" gira, el secreto es un ojo. Nadie más la usa. |
| **Curvas de nivel** | el estampado de su polo | **El fondo de todo su mundo.** Tono sobre tono, finas, a bajo contraste. Es lo más suyo que existe y no estaba en ninguna pantalla. |
| **La línea que se pasa y no cierra** | su trazo | Sus subrayados sobresalen de lo que subrayan; sus marcos no cierran en las esquinas. Lo elegido se marca con un **círculo de tinta hecho a mano**, como si lo hubiera encerrado con plumón. |
| **Grosor variable** | su contorno | Sus trazos no son parejos. Un borde suyo engorda y adelgaza. |
| **Trama cruzada** | su sombreado | El relleno de lo seleccionado, en vez de un color plano. |
| **Rosa durazno** | su máscara y orejas | Su segundo color, el que corta el celeste. |
| **Volumen** | boca abierta, cejas arriba | Su mundo sí puede exclamar, exagerar y moverse. |

**Su color base** (muestreado de `img/wicho.png`): pelaje `#90CCF0` · tinta `#1E2F3A` ·
espiral `#C3A6D2` sobre `#4A3D62` · durazno `#F0D8CC`.

---

## ⚠ Lo que NUNCA se hace

- **Teñir una foto de comida con el color del hermano.** Error real cometido el 2026-09-17: se
  puso un velo celeste encima de las proteínas y la comida salió azul. La comida se ve como es;
  el color del hermano vive en la superficie de ALREDEDOR.
- **Inventarle a un hermano algo que no tiene.** Se le dibujó a SANDO una cremallera a rayas
  que su casaca no lleva. Lo que sí tiene es el **acanalado** del cuello y los puños.
- **Acercar a WICHO a SANDO.** Ya está escrito en `CLAUDE.md` y sigue siendo el error más fácil
  de cometer: si WICHO sale prolijo, con línea pareja y relleno plano, está mal.
- **Elegir un tono "que combine".** Se muestrea del PNG con código, o no va.
