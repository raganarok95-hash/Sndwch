# Mundo WICHO: cuatro identidades para la primera pantalla del armador (propuesta, 2026-10-25)

Dueño: «No termina de convencerme la parte de WICHO. Lo veo y no me gusta. Quisiera que se rehaga
la primera parte; dame opciones o tipos de identidad para ver cuál me gusta más». Es el mundo de
WICHO en la app: la primera pantalla de «Arma el tuyo» (el tamaño).

**Es un repensar** (`docs/COMO_DISENAR_ACA.md`): cuatro archivos nuevos, en blanco, sin abrir el
marcado de hoy. Todo sale de lo que WICHO es (`docs/LOS_DOS_HERMANOS.md`): las curvas de nivel de su
polo, la espiral de sus ojos, la línea que se pasa y no cierra, la trama cruzada, el celeste, el lila
y el durazno.

| | identidad | qué la estructura |
|---|---|---|
| A | **La libreta** | un dibujo a tinta, a escala; lo elegido se encierra con plumón |
| B | **Los stickers** | letra gigante; las opciones son stickers que se pegan |
| C | **La espiral** | el avance es la espiral de sus ojos, que se cierra paso a paso |
| D | **La cinta métrica** | el pan sobre una regla de 0 a 30 cm: el tamaño se ve, no se describe |

Generadas con `identidades.cjs`, que usa los precios de la carta de hoy (en la app saldrían del
código). **El dueño eligió la C, «La espiral»** (2026-10-25).

## La espiral, extendida a todo el armador (propuesta, en `espiral/`)

Son ocho pantallas: tamaño, pan, proteína (arriba y abajo), queso, vegetales, salsas y listo.
`espiral.cjs` las genera.

- **El fondo:** tinta `#1E2F3A`, con las curvas de nivel de su polo a bajo contraste.
- **El avance es la espiral de sus ojos**, que se cierra de afuera hacia adentro un tramo por paso.
  - Es grande en el primer paso y en el final.
  - En los demás pasos es chica en la cabecera, con «2/6» y el paso que viene.
- **Lo elegido va en lila `#C3A6D2`:**
  - las opciones de una sola elección son fichas redondas (tamaño, pan, queso);
  - las de varias, píldoras con + y ✓ (vegetales, salsas);
  - cada proteína es una fila con su foto real en círculo.
- **El corte** (lo aprobado de «El corte de WICHO»): el sándwich se arma capa por capa en la cabecera.
  En el final queda en el centro de la espiral cerrada.
- **Se queda lo que ya funciona:**
  - «¿Son varios?» en el primer paso;
  - el puente a la estrella de SANDO y el sándwich secreto en la proteína;
  - «Doble de la última»;
  - el precio y el botón de seguir en el pie.

**Falta la aprobación del dueño antes de tocar la app.**
