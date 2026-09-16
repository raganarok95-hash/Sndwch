# Plan del front — qué se ve amateur, medido, y en qué orden se arregla

Fecha: 2026-09-16. Todo lo que sigue está **verificado renderizando las pantallas reales**
(Playwright sobre el `index.html` construido, 390×844 y 1440×900) o leyendo el código, nunca
suponiendo. Donde algo que este repo daba por roto ya está arreglado, lo digo y lo saco del
plan: un plan con items muertos se deja de leer.

---

## 0 · Lo que YA está bien, y no se toca

Esto importa tanto como la lista de defectos, porque cuatro de las cinco sospechas
"obvias" sobre por qué se ve amateur resultaron falsas:

- **El encuadre de los hermanos ya está corregido** (commit del 2026-09-12,
  `transform-origin:bottom left/right`). Nadie tiene la cabeza cortada hoy. El texto de
  `CLAUDE.md` que describe a SANDO decapitado quedó viejo.
- **La tipografía no tiene NI UN resto de estética código/terminal**: cero fuentes
  monoespaciadas, cero `[TAG]`, cero verde-sobre-negro. Bodoni Moda + EB Garamond +
  Fraunces, las tres serif editoriales.
- **Las animaciones comunican algo, ninguna es gratuita**, y las seis respetan
  `prefers-reduced-motion` (3 reglas en `shell.html`).
- **Las 8 fotos de Signature SÍ pasaron por `tratar_fotos.py`** y hoy comparten encuadre,
  viñeta y viraje. El problema de "8 sesiones fotográficas distintas" está mitigado ahí.
- **El checkout está compuesto con cuidado** — jerarquía editorial, tarjetas de bebida con
  foto, QR. No es donde está el problema.

---

## 1 · El lema que reportaste SÍ existe — y no es "hecho en casa"

Debajo del wordmark, en cada pantalla, dice:

> **Sándwiches hechos acá**

`src/app/03-helpers-y-signature.ts:14`. Y "hechas acá" aparece en cuatro sitios más: el
rótulo de Bebidas del home, la pantalla de bebidas sueltas, la descripción de P06 y su
pitch.

Es exactamente lo que describiste. Vale decir por qué no apareció antes: una búsqueda por
"hecho en casa" da **cero** resultados, y con eso se podría haber concluido que no existe.
La frase real es otra. **Tenías razón y la búsqueda estaba mal hecha.**

Y hay una contradicción escrita en el propio repo: `src/app/01-catalogo-y-estado.ts:377-378`
dice textualmente que la marca **no** usa *"Casero"/"Tradicional" ni ningún sinónimo*
porque *"se posiciona como compañía consolidada, no como negocio local/casero"*. "Hechos
acá" es ese sinónimo. La regla está escrita y el lema la incumple.

---

## 2 · El diagnóstico real: el mismo producto se dibuja de tres formas distintas

Esto es lo que produce el "armada una cosa sobre otra". Los MISMOS 5 Signatures se
renderizan con tres tratamientos que no se hablan entre sí:

| dónde | tratamiento |
|---|---|
| Home | fila con miniatura de **52 px**, precio a la derecha |
| Elegir Signature (`o_sig`) | tarjeta **a sangre**, foto de 220 px de alto, título Bodoni encima |
| Bebidas | una **píldora** de texto, sin foto |

La tarjeta a sangre se ve muy bien. La fila de 52 px desperdicia por completo el trabajo de
`tratar_fotos.py` — a ese tamaño una foto tratada y una sin tratar se ven igual. Y el home
es la primera pantalla, o sea la que forma la impresión.

**Un solo tratamiento de tarjeta de producto, usado en los tres sitios.** No es rediseñar:
es dejar de tener tres diseños.

---

## 3 · No existe ningún diseño de escritorio. Cero.

`src/shell.html` tiene **5 media queries y las 5 son `prefers-reduced-motion`**. No hay ni
un breakpoint de ancho. `#app` es `max-width:480px;margin:0 auto`.

En una laptop la app es **una columna de teléfono de 480 px en el centro de 1440 px**, con
el resto vacío. Si la estás mostrando desde una computadora, eso solo ya explica buena parte
de la vergüenza — y no es un problema de gusto, es que la pantalla de escritorio nunca se
diseñó.

---

## 4 · Las 6 fotos de proteína son seis fotos de stock sin relación

Y es el hallazgo que más pesa, porque ARMA EL TUYO es la mitad de la identidad de la marca.

| foto | qué muestra |
|---|---|
| P01 Res | carne deshilachada en sartén de hierro, madera oscura, luz cálida |
| P02 Pollo teriyaki | macro glaseado, poca profundidad de campo, dorado |
| P04 Atún | bowl de vidrio sobre **mantel a cuadros azul**, mayonesa en zigzag decorativo |
| P05 Embutido | tabla de charcutería sobre pizarra negra |
| P06 Albóndiga | sartén con salsa y paño de cocina rayado |
| P08 Pavo | lonjas sobre tabla clara **con tomates cherry y un ají verde** |

Verificado: **ninguna pasó por `tratar_fotos.py`** — `img/fuente/` solo tiene los 8
Signatures, no hay ni un `prot_*`. Son 500×500 tal como se bajaron.

Dos van más allá del estilo: el mantel a cuadros azul del atún es el único color saturado
no-comida de todo el catálogo, y las guarniciones del pavo (tomate cherry, ají) no están en
la receta. **Ninguna de las seis muestra un sándwich.**

Esto no se arregla con código. Requiere o stock curado con una sola dirección de arte, o
fotos reales. Lo que sí puedo hacer desde acá es pasarlas por el mismo tratamiento que ya
unificó los Signatures.

---

## 5 · Cuatro defectos concretos, todos con línea exacta

**a) El botón de WhatsApp tapa producto en `o_sig`** — `02-ui-base-y-api.ts:118`.
La lista de exclusión es `admin*`, `o_item_confirm`, `o_cart`, `o_home`. **Falta `o_sig`**,
que es la pantalla con más scroll de todas. El comentario de arriba de esa línea ya explica
el razonamiento —"tapa la información que decide la compra"— aplicado a otras tres
pantallas. Es la cuarta instancia del mismo defecto ya corregido tres veces. Fix de una
palabra.

**b) 19 px de contenido detrás de la barra fija.** `#app` reserva `49px`
(`shell.html:232`), y la barra de acción "← Atrás / Continuar //" mide **68 px**. Medido en
el DOM real. Se ve "The Origin[al]" cortado por el borde de la barra.

**c) Regresión: "Se desbloquea en REGULAR (3 pedidos)".**
`03-helpers-y-signature.ts:1195` deriva ese texto de `rankName(minOrders)`. Con el umbral en
3, `rankName(3)` devuelve **REGULAR** — un rango que se alcanza al PRIMER pedido. O sea que a
alguien que ya es REGULAR se le dice que el menú secreto se desbloquea al llegar a REGULAR.

Lo grave es que **el arreglo está a medias y documentado como completo**:
`01-catalogo-y-estado.ts:533` dice textual que *"ni la tarjeta bloqueada ni la celebración
post-pedido derivan su texto de `rankName()`"*. La celebración sí se arregló
(`_lSecretUnlock`). La tarjeta bloqueada no. El comentario afirma lo contrario de lo que
hace el código, así que nadie lo iba a volver a mirar.

**d) Todos los pitches cortados a media palabra** en las tarjetas del selector:
"…cocidas dentro de su propia…", "…puestos en pliegues so…", "…no lleva nada suelto…",
"…con pepinill…". Los cinco. Un texto cortado a media palabra en las cinco tarjetas de la
pantalla de compra es de las cosas que más rápido leen como descuido.

---

## 6 · El "//" como separador de campo — tu lectura de "código" tiene un anclaje real

El glifo de marca está protegido y no se discute. Lo que sí produce la lectura de código es
otra cosa: **el "//" usado como separador de etiqueta dentro de los formularios**, en unos
25 campos:

```
Nombre // Tu nombre          Teléfono // 9XXXXXXXX
Correo // Opcional...        DNI // 8 dígitos (obligatorio)
Dirección // Calle o usa GPS Fecha de nacimiento // DD/MM/AAAA
```

`Etiqueta // pista` es literalmente la forma de un comentario de código. En un rótulo de
marca el "//" es el corte del pan; dentro de un `placeholder` de formulario, al lado de un
campo de texto, es un delimitador de comentario. **Mi propuesta es sacarlo solo de los
campos de formulario** y dejarlo en títulos y marca, donde sí funciona.

---

## 7 · Tu error del cliente: Google no auto-autentica

Verificado. `mountGoogleButton()` (`05-carrito-y-checkout.ts:1690-1697`) hace exactamente
dos cosas: `initialize()` y `renderButton()`. **No existe ninguna llamada a
`google.accounts.id.prompt()` ni el parámetro `auto_select`** en todo el cliente.

O sea: el secret está bien puesto de tu lado, el botón se pinta, pero *One Tap* —la tarjeta
que aparece sola y te reconoce si ya iniciaste sesión— **nunca se construyó**. No es un
problema de configuración, es una función que falta. Son dos parámetros y una llamada.

---

## 8 · El orden que propongo

Abres **a más tardar la segunda semana de octubre**. Eso son unas tres semanas.

### Sobre "hacerlo desde cero"

Lo mido antes de opinar: **2 027 `style=` inline, 203 `onclick=`, 249 pruebas acopladas a
texto y geometría exactos, y cero `data-testid`**. Una reescritura desde cero no es
"rehacer el CSS": es rehacer el cliente entero y volver a verificar 249 pruebas, con el
negocio abriendo en tres semanas y el PR #4 todavía sin mergear a `main`.

**Mi recomendación es no hacerlo desde cero ahora** — pero la decisión es tuya y si me dices
que sí, lo hago. Lo que propongo consigue el mismo resultado visible por otra vía: los
defectos de arriba no son de arquitectura, son de tratamiento, y se arreglan sin tocar la
estructura.

### Fase 1 — lo que no admite discusión (bugs, no diseño)

1. `o_sig` a la lista de exclusión del botón de WhatsApp.
2. El `padding-bottom` de `#app` contra la altura real de la barra de acción.
3. La tarjeta bloqueada deja de usar `rankName()` — y se corrige el comentario que miente.
4. Los pitches dejan de cortarse a media palabra.
5. Google One Tap: `auto_select` + `prompt()`.

### Fase 2 — lo que resuelve el "se ve amateur" (esperan tu visto bueno)

6. **Un solo tratamiento de tarjeta de producto** en home, selector y bebidas.
7. **Diseño de escritorio**: los primeros breakpoints de ancho que va a tener la app.
8. **Retirar "hechos acá"** de los cinco sitios, y decidir con qué se reemplaza (o con nada).
9. **Sacar el "//" de los placeholders de formulario**, dejándolo en marca y títulos.

### Fase 3 — depende de ti, no de código

10. **Las 6 fotos de proteína.** Puedo pasarlas por `tratar_fotos.py` para que al menos
    compartan luz y encuadre, pero el mantel a cuadros azul y los tomates cherry no se van
    con un viraje de color. Lo que las arregla de verdad es stock curado con una sola
    dirección, o fotos tuyas.
11. **La resolución de las fotos de Signature**: la tarjeta pide ~1 050 px reales y la
    fuente sigue en 640, o sea 1.64x de estiramiento. Cualquier reemplazo se pide de 1 600 px
    de ancho para arriba.

---

## 9 · Lo que necesito que decidas

- ¿Desde cero o la vía de arriba? (recomiendo la de arriba, y digo por qué)
- **"Sándwiches hechos acá" sale — ¿con qué se reemplaza?** Puedo proponer opciones.
- ¿Escritorio entra ahora o después de abrir?
- Las fotos de proteína: ¿busco stock curado, o las tomas tú?
