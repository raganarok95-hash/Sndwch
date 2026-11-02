# Conceptos · 2026-11-reel-perfil

> Creativo, 2026-11-02 (paso 2 de `/pieza`). Parte del brief del Estratega («¿De qué lado comes?»,
> `BRIEF.md`). Reemplaza al Reel «Los seis de la casa». Primero se abre sin juzgar (§1), después se
> cierra con la rúbrica de `AGENCIA.md` §4 (§2) y quedan tres conceptos (§3). Recomendado: **A**.

## 0 · Lo que vale para los tres

- **Formato.** 1080 × 1920, 30 cuadros por segundo, 15–16 s, en bucle. Sin audio: lleva la pista
  muda en AAC, como `reel.cjs`. Todo se lee.
- **Zonas.** El texto va entre y 269 y y 1248: fuera del 14 % de arriba y del 35 % de abajo. Lo
  importante del primer cuadro (la portada) cae en la franja central de 1080 × 1440 que deja el
  recorte 3:4 de la cuadrícula.
- **El motor.** `instagram-perfil/final/reel.cjs` (HTML pintado cuadro por cuadro + ffmpeg) sirve
  tal cual. Ya trae el corte de las dos barras, las curvas de nivel en movimiento, la espiral
  calculada y el logo. Lo nuevo:
  - las fotos como «ventana», con un recorte rectangular de la misma foto, sin tocar un píxel;
  - trazos que se dibujan solos, con `stroke-dashoffset` en SVG.
- **Las fotos que sí se usan.** Todas aprobadas:
  - `foto-philly-30.jpg`: es la única a 1856 × 2304, así que aguanta recortes;
  - `foto-classic-tuna-30.jpg`;
  - `foto-arma-pan.jpg`, `foto-arma-proteina.jpg`, `foto-arma-encima.jpg` y `foto-arma-capas.jpg`.

  Las demás miden 1024 × 1280: no se agrandan más de 1,15×, porque se ablandan.
- **Las que no.**
  - `foto-meatball-30.jpg` lleva la lata de The Bloom al lado.
  - Las latas en alta tampoco se usan.
  - El motivo: las bebidas todavía no se venden, y al abrir salen en botella (LEEME). Un Reel
    fijo en la cuadrícula no puede mostrar algo que no llega.
- **Ninguna cifra, precio ni fecha.**
  - Los nombres («Philly Cheesesteak», «Classic Tuna», «Focaccia») y los pasos del armador
    (PAN, PROTEÍNA, QUESO, VEGETALES, SALSAS) salen de `scripts/piezas/datos.ts` (`sigs` y `pasos`).
  - El tope de salsas no se escribe: se ve. En `foto-arma-encima` hay tres salsitas, y tres es el
    tope real.
- **La comida no se tapa ni se tiñe.**
  - Sin franja naranja: el dueño la quitó el 2026-10-16 («sin SANDO no tiene ancla»).
  - Sin bandas ni marcos sobre la foto.
  - Los círculos de tinta de WICHO van por el kraft, alrededor del ingrediente, sin cruzar la comida.
- **Los hermanos, nunca encima de la comida.**
  - En A y en C están descompuestos: sus mundos (el oliva acanalado de SANDO; el celeste con
    curvas y la espiral de WICHO) y sus voces en letra (SANDO en itálica, WICHO en Anton
    cursiva). En persona salen solo en el logo del cierre.
  - En B salen sus caras, en la cabecera del chat, lejos de las fotos.
- **El cierre** es el logo oficial con `SNDWCH.APP`, como en todo el set. En los tres, el último
  cuadro empalma con el primero.
- **La frase del brief se queda adentro.** «¿De qué lado comes?» es la idea. No sale en pantalla
  ni en el texto de la publicación: en Perú, «comer» y «del otro lado» se leen con doble sentido
  («batear para el otro lado»). Ver «Para el dueño».

## 1 · Abrir: 28 ideas, sin juzgar

**El momento (la juntada, el «¿qué pedimos?»)**
1. **Visto.** El chat de los hermanos antes de pedir: SANDO manda una foto y dos palabras; WICHO,
   un párrafo; SANDO lo deja en visto.
2. **La lista del que pide.** Las notas del celular de quien junta los pedidos: cinco líneas de una
   palabra y una que no termina.
3. **Igual comen juntos.** Pelean por cómo se arma, y al final los dos van en el mismo pedido.
4. **El último pedazo.** Queda una mitad del 30 en la mesa y nadie la toca.
5. **Medio tiempo.** El pedido en el entretiempo del partido.

**El producto**
6. **¿Y la salsa?** El Philly no lleva ninguna; el tuyo lleva las que marques, hasta el tope. La
   discusión en tres líneas.
7. **En lascas.** El atún que nunca se hace pasta; WICHO lo quiere con jalapeño.
8. **La otra mitad.** Cada foto es un 30 partido en dos: la línea del corte es el `//`.
9. **Lo que no lleva.** Etiquetas de la carta («Res // Laminada»…) y una que señala al vacío:
   «Salsa: no lleva.»

**Los hermanos**
10. **¿Algún cambio?** La pregunta de todo mostrador. SANDO: «Ninguno.» WICHO: «Todos.»
11. **Mientras tanto.** Pantalla partida: SANDO terminó en un segundo y WICHO sigue eligiendo cuando
    el video vuelve a empezar.
12. **La reseña.** Cada uno prueba el del otro y, a regañadientes, le gusta.
13. **La cocina partida.** Una escena nueva de Flow: la tabla de SANDO a la izquierda, el mostrador
    de WICHO a la derecha.
14. **La firma.** SANDO firma su sándwich con una palabra; WICHO garabatea el nombre de su invento.

**La tensión**
15. **Hay dos tipos de personas.** El meme de siempre, con los dos lados.
16. **¿Confías o controlas?** La pregunta no es de comida: es de carácter.
17. **Banderas rojas.** Las banderas rojas y verdes de cada lado.
18. **Lo de siempre.** El historial de pedidos de uno es el mismo sándwich; el del otro nunca se
    repite.
19. **Tu otra mitad.** Tú pides lo de siempre y tu pareja arma todo. O al revés.

**El dato**
20. **Seis o miles.** Seis de la casa contra todas las combinaciones del armador.
21. **Una proteína.** El armador deja elegir una sola («Elige una proteína») y WICHO quiere dos.
22. **Los pasos.** Uno llega en un toque y el otro tiene seis pasos.

**El ritual**
23. **La pregunta de la semana.** Cada semana, una pregunta a los dos: ¿salsa?, ¿pan?, ¿15 o 30?
24. **El test.** Tres preguntas rápidas de la vida diaria y, al final, «eres de SANDO» o «eres de
    WICHO».

**Lo nativo**
25. **Dos puertas.** Una grabación de pantalla de la app real: la carta y el armador.
26. **Match.** Los sándwiches con perfil de app de citas.
27. **Te toca pedir para todos.** Las notificaciones que llegan a tu celular: una de SANDO y veinte de
    WICHO.
28. **Si fueran personas.** El Philly no contesta audios; el armado te manda veinte.

## 2 · Cerrar: la rúbrica

Las columnas son los ocho criterios de `AGENCIA.md` §4:
- **Br**: Brief.
- **Mo**: Momento.
- **Ma**: Marca a los 2 s.
- **Ga**: Gancho.
- **Co**: Contagio.
- **Pe**: Pedible.
- **Ve**: Verdad.
- **Se**: Serie.

Pasa con 30 o más y Verdad en 4 o 5.

| # | idea | Br | Mo | Ma | Ga | Co | Pe | Ve | Se | total | destino |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Visto | 5 | 4 | 5 | 4 | 4 | 4 | 4 | 5 | **35** | **B** |
| 2 | La lista del que pide | 4 | 5 | 2 | 3 | 4 | 4 | 4 | 3 | 29 | |
| 3 | Igual comen juntos | 5 | 4 | 4 | 4 | 5 | 4 | 4 | 3 | **33** | **C** |
| 4 | El último pedazo | 2 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 26 | |
| 5 | Medio tiempo | 3 | 5 | 3 | 3 | 3 | 4 | 4 | 2 | 27 | |
| 6 | ¿Y la salsa? | 5 | 3 | 4 | 4 | 4 | 4 | 5 | 3 | 32 | dentro de B y C |
| 7 | En lascas | 3 | 2 | 4 | 3 | 2 | 4 | 5 | 4 | 27 | |
| 8 | La otra mitad | 4 | 3 | 5 | 4 | 3 | 4 | 3 | 3 | 29 | |
| 9 | Lo que no lleva | 3 | 2 | 4 | 3 | 2 | 4 | 5 | 3 | 26 | |
| 10 | ¿Algún cambio? | 5 | 3 | 4 | 4 | 5 | 4 | 5 | 5 | **35** | **A** |
| 11 | Mientras tanto | 5 | 3 | 4 | 4 | 4 | 4 | 4 | 3 | 31 | dentro de A |
| 12 | La reseña | 3 | 3 | 4 | 3 | 3 | 4 | 4 | 3 | 27 | |
| 13 | La cocina partida | 5 | 2 | 5 | 3 | 3 | 3 | 3 | 4 | 28 | |
| 14 | La firma | 3 | 2 | 4 | 2 | 2 | 4 | 5 | 3 | 25 | |
| 15 | Hay dos tipos de personas | 5 | 2 | 3 | 3 | 4 | 4 | 5 | 3 | 29 | |
| 16 | ¿Confías o controlas? | 4 | 2 | 3 | 4 | 4 | 3 | 4 | 3 | 27 | |
| 17 | Banderas rojas | 4 | 2 | 3 | 4 | 5 | 3 | 4 | 4 | 29 | |
| 18 | Lo de siempre | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 27 | |
| 19 | Tu otra mitad | 4 | 3 | 4 | 4 | 5 | 4 | 4 | 3 | 31 | dentro de C |
| 20 | Seis o miles | 4 | 2 | 3 | 5 | 3 | 4 | 3 | 2 | 26 | |
| 21 | Una proteína | 3 | 2 | 4 | 3 | 2 | 4 | 5 | 3 | 26 | |
| 22 | Los pasos | 4 | 2 | 3 | 3 | 2 | 4 | 5 | 3 | 26 | |
| 23 | La pregunta de la semana | 5 | 3 | 4 | 3 | 4 | 4 | 5 | 5 | 33 | es la serie de A |
| 24 | El test | 4 | 2 | 3 | 4 | 4 | 3 | 4 | 4 | 28 | |
| 25 | Dos puertas | 4 | 3 | 4 | 3 | 3 | 5 | 5 | 3 | 30 | al destacado «Cómo pedir» |
| 26 | Match | 3 | 2 | 4 | 4 | 4 | 4 | 4 | 3 | 28 | |
| 27 | Te toca pedir para todos | 4 | 5 | 3 | 4 | 4 | 4 | 4 | 3 | 31 | dentro de B |
| 28 | Si fueran personas | 4 | 2 | 3 | 3 | 4 | 4 | 4 | 4 | 28 | |

**Las que pasan y no van solas:**
- **6** (la salsa) es el contraste más claro del brief. Entra como réplica en B («¿sin salsa?»)
  y en C («Sin salsa.» / «Con estas.»).
- **11** (mientras tanto) es la forma de A: los dos lados a la vez y WICHO que no termina.
- **19** (tu otra mitad) es el remate de C, ampliado: no solo la pareja, también el hermano y el
  grupo.
- **23** es A vuelta formato semanal (ver «Serie» en A).
- **25** (dos puertas) es útil, pero es ayuda, no algo para mandar: rinde más en el destacado
  «Cómo pedir», que ya tiene las pantallas reales.
- **27** aporta a B su mejor chiste: WICHO que escribe y escribe.

**Por qué quedan fuera las que no pasan:**
- **2.** Sin comida en los 2 primeros segundos (es una pantalla de notas) y no se reconoce como
  nuestra.
- **4.** Es de compartir un sándwich, no de elegir lado: se sale del brief.
- **5.** El partido con el tiempo encima se acerca al reloj de «de 11 a 22», y un martes no sirve.
- **7, 9, 14, 21 y 22.** Son verdaderas pero planas: un dato o una etiqueta no paran el dedo ni
  dicen nada de quien mira.
- **8.** Verdad 3. La otra mitad de un Philly no se convierte en otro sándwich: un 30 es una sola
  receta.
- **12.** Terminan de acuerdo, y se pierde la idea de la marca.
- **13.** Una escena nueva con comida y hermanos juntos: es lo más caro y lo más arriesgado, porque
  la comida dibujada ya se rechazó.
- **15.** Es lo obvio: la plantilla del meme. Su parte buena vive en A.
- **16.** «Controlas» suena a defecto, así que un lado pierde.
- **17.** Se burla del cliente (biblia §4.5).
- **18.** El historial sería inventado, y la misma foto repetida es «sándwiches pegados».
- **20.** Verdad 3. La cifra no está calculada por código, y hay reglas del armador sin confirmar
  para contarla (dobles, sin queso).
- **24.** No lleva comida al inicio, y su mecánica de juego se acerca a la ruleta.
- **26 y 28.** Doble sentido (el de citas sobre todo) y la comida queda en segundo plano.

## 3 · Los tres conceptos

### A · «¿Algún cambio?» (recomendado)

**La idea en una frase.** A la pregunta de todo mostrador, SANDO contesta «Ninguno.» y ya terminó;
WICHO contesta «Todos.» y, cuando el video vuelve a empezar, sigue cambiando.

**Por qué no es un chiste inventado.** «Todos» y «Ninguno» son las dos caras de **un botón real del
armador**. En el paso VEGETALES el atajo dice «Todos» y, cuando ya están todos, cambia a «Ninguno»
(`src/app/04-armado-de-pedido.ts`, paso 4: «Sin límite y sin costo. "Todos" es un atajo real»). La
pelea de los hermanos está escrita en la app.

**Titular candidato** (lo pule el Redactor):
- arriba, partido por el `//`: «¿ALGÚN | CAMBIO?»;
- las respuestas: «Ninguno.» (SANDO) y «Todos.» (WICHO);
- para el texto de la publicación: «¿Ninguno o todos?».

**Lo que se ve** (para la maqueta):
- **El corte.** La pantalla está partida por el `//`: dos barras, dorada a la izquierda y celeste
  a la derecha. Van inclinadas como en el wordmark (−16°) y cruzan el centro de arriba abajo. Es
  el corte del pan, y es el logo: una cara partida en dos.
- **Izquierda, el mundo de SANDO.**
  - El fondo: oliva `#6C7860` con su acanalado vertical.
  - La foto, como ventana: la mitad izquierda del Philly de `foto-philly-30.jpg`, en tres cuartos,
    con su kraft y su madera, a la altura de y ≈ 430–1060.
  - Encima de la ventana, en Mono papel: «PHILLY CHEESESTEAK» (de `datos.ts`).
- **Derecha, el mundo de WICHO.**
  - El fondo: celeste `#90CCF0` con sus curvas de nivel, que se mueven despacio (ya están en
    `reel.cjs`).
  - La foto, como ventana: la opción del paso, de `foto-arma-pan`, `-proteina` o `-encima`.
  - Encima de la ventana, en Mono tinta: el nombre del paso tal como lo muestra la app (`pasos`).
  - Lo que elige se marca con su **círculo de tinta hecho a mano**: tinta `#1E2F3A`, grosor
    variable, una línea que se pasa y no cierra (`LOS_DOS_HERMANOS.md`). Se dibuja en vivo por el
    kraft y no cruza la comida.
- **Arriba (y ≈ 290–430).**
  - «¿ALGÚN» en Anton papel sobre el oliva y «CAMBIO?» en Anton tinta sobre el celeste.
  - La pregunta queda cortada por el `//`: es el recurso de «la frase partida» que el dueño eligió
    para el Turkey, ahora cortada por el pan.
- **Las respuestas, debajo de cada ventana (y ≈ 1090–1240).**
  - SANDO: Instrument Serif itálica, papel, ~90 px. Aparece sin rebote.
  - WICHO: Anton cursiva, tinta, ~130 px. Entra de golpe.
- **La gramática de cámara** (`estudio/README.md`): SANDO quieto y la cámara se mueve; WICHO se
  mueve y la cámara no.
  - En la ventana de SANDO solo hay un acercamiento lento de 1,00 a 1,05× en todo el video.
  - En la de WICHO, la cámara está quieta: lo que se mueve son sus trazos y sus cambios.
- **La portada** es el primer cuadro: el corte, el Philly, los dos panes y la pregunta. Repite la
  foto de perfil (el fondo partido) en el centro de la cuadrícula.

**El guion (16 s).**

| s | qué se ve | texto en pantalla |
|---|---|---|
| 0,0 | Portada. Izquierda: el Philly. Derecha: Classic y Focaccia (`foto-arma-pan`) | «¿ALGÚN \| CAMBIO?» · «PHILLY CHEESESTEAK» · «PAN» |
| 0,7 | Aparece la respuesta de SANDO (sube 10 px y se queda) | «Ninguno.» |
| 1,3 | Entra la de WICHO (escala de 1,15 a 1) | «Todos.» |
| 1,8 | Un círculo de tinta rodea la Focaccia | — |
| 2,4 | Izquierda, debajo de su respuesta | «Ya está.» |
| 2,8 | Derecha: la ventana cambia de golpe a las proteínas (`foto-arma-proteina`) | «PROTEÍNA» |
| 3,3 | Círculo en la res | — |
| 3,8 | El círculo se borra y salta a la albóndiga | «¿O…?» |
| 4,4 | Vuelve a la res: la app deja una sola proteína | — |
| 5,0 | Los dos quesos de `foto-arma-encima`; círculo en el cheddar | «QUESO» |
| 6,2 | Todos los vegetales de `foto-arma-encima`; un solo trazo largo los encierra por el borde del kraft | «VEGETALES» · «TODOS.» |
| 8,0 | Las tres salsitas de `foto-arma-encima`; tres círculos, uno por uno | «SALSAS» |
| 9,6 | Izquierda: no pasa nada. Solo la cámara, que sigue acercándose | — |
| 11,0 | Izquierda | «¿Ya?» |
| 11,8 | Derecha | «Ya casi.» |
| 12,8 | Derecha: se borran los círculos y la ventana vuelve al pan | «Mejor cambio el pan.» |
| 13,8 | Las dos mitades se cierran sobre el `//` y queda el logo oficial con el fondo partido (oliva acanalado y celeste), como la foto de perfil | «SNDWCH.APP» |
| 15,2 | El logo se abre otra vez por el corte y cae en el primer cuadro | — |
| 16,0 | Empalma con 0,0: WICHO está otra vez en PAN | — |

**Por qué alguien lo mandaría.**
- Todos conocemos a los dos: al que pide «como viene» y al que cambia todo. Uno se reconoce en un
  lado y piensa en alguien del otro, y se lo manda con un «tú». La gente comparte lo que dice algo
  de ella (Berger).
- Se vuelve a ver porque pasan dos cosas a la vez, y la primera vez se mira un solo lado. Y el
  final no es final: WICHO cambia el pan y empieza de nuevo. El bucle es el chiste, y empuja la
  métrica de repeticiones del brief (visualizaciones ÷ alcance).
- «¿Ninguno o todos?» le da al texto de la publicación una pregunta que se contesta en los
  comentarios, sin pedir que etiqueten a nadie.

**Por qué funciona.**
- **Contagio (5).** Es un tipo de persona que todos tienen cerca.
- **Verdad (5).** Las dos palabras son un botón de la app. Cada elección respeta las reglas del
  armador: un pan, una proteína, un queso, todos los vegetales sin costo y tres salsas. No se
  muestra un sándwich armado que no exista.
- **Serie (5).** Se vuelve formato: cada semana, otra pregunta a los dos lados en la misma pantalla
  partida («¿Picante?», «¿15 o 30?», «¿Con queso?»).
- **Cerebro derecho (Wood).** Hay dos personajes que se reconocen sin dibujo (su mundo y su voz),
  un momento (el mostrador) y algo que se dice.

**Con qué piezas reales se hace.**
- Las fotos: `foto-philly-30.jpg`, `foto-arma-pan.jpg`, `foto-arma-proteina.jpg` y
  `foto-arma-encima.jpg`.
- Los nombres: `datos.ts` (`sigs[].nombre` y `pasos`).
- El logo oficial: `img/marca/avatar-1024-transparente.png`.
- De `reel.cjs`: el corte de las barras, las curvas y la exportación.

**Qué pedirle a Flow.** Nada.

**El riesgo.**
1. **Dos lados a la vez en el celular.** Cada ventana mide media pantalla.
   - Se prueba en la maqueta a tamaño real.
   - Si no se lee, plan B: alternar lados cada 0,7 s en vez de mostrarlos a la vez. Se pierde algo
     de la repetición, pero el bucle se queda.
2. **Los círculos sobre la foto.**
   - Van por el kraft, nunca cruzan la comida.
   - Si en la maqueta tocan un ingrediente, se reemplazan por el nombre en la letra de WICHO al
     lado de la ventana.
3. **Que WICHO quede como el tonto indeciso.** No pierde nadie:
   - WICHO disfruta cada cambio;
   - SANDO termina solo, esperando con su «¿Ya?».
4. **«Ninguno.» no dice que la app no deje cambiar un Signature** (no lo verifiqué). Es lo que
   contesta SANDO por el suyo.
5. **Quien no nos conoce no ve a los hermanos hasta el logo.** La marca se lee por el `//` y los
   dos mundos. Si el dueño quiere sus caras en el video, es B.
6. **El trazo que encierra los vegetales.** Una línea larga y suelta puede parecer garabato. Se
   prueba contra el ejemplo de su trazo en `img/wicho.png`.

**Qué cambió frente a lo rechazado.**
- **Frente a «Los seis de la casa»:** hay dos fotos de Signature en vez de seis, y ninguna desfila
  con su nombre.
- **Frente a «se arma solo»:** no cae ninguna capa y el sándwich de WICHO nunca se arma en
  pantalla. Lo que se mueve son sus trazos sobre fotos quietas.
- **Frente a la ruleta y «de 11 a 22»:** no hay ruleta, ni pausa, ni reloj.
- **El cierre** es el logo, no «O arma el tuyo».

**Puntaje.** Br 5 · Mo 3 · Ma 4 · Ga 4 · Co 5 · Pe 4 · Ve 5 · Se 5 = **35**
- Momento queda en 3: el mostrador sirve para cualquier pedido, no solo para la juntada.

### B · «Visto»

**La idea en una frase.** El chat de los hermanos antes de pedir: SANDO manda una foto y dos
palabras, WICHO manda un párrafo, y SANDO lo deja en visto.

**Titular candidato.** No hay titular: el chat es el texto. La última línea, de WICHO, es la
pregunta del Reel: «¿y tú de cuál?».

**Lo que se ve** (para la maqueta):
- **Un chat propio, diseñado con la marca.** No se copia WhatsApp ni Instagram: sus pantallas son
  de otras marcas.
  - El fondo: papel crema `#EFE6D4`, el del lado de SANDO aprobado.
  - Las burbujas de SANDO: oliva con acanalado, su itálica en papel.
  - Las de WICHO: celeste con curvas tono sobre tono, en Archivo tinta, en minúsculas y rápidas.
- **La cabecera (y ≈ 290–400).**
  - Dos caras en círculo, sacadas de las poses oficiales: `img/sando2_frente.png` e `img/wicho.png`.
  - El nombre del chat: «hermanos».
- **Las fotos son mensajes.** Van dentro de una burbuja, a tres cuartos del ancho y en cuadrado. La
  comida es un mensaje, no un fondo: no se escribe nada encima.
- **El «escribiendo…» de WICHO es su espiral, que gira** (calculada, como en `reel.cjs`). A SANDO
  nunca se le ve escribir: contesta y ya.
- **La barra para escribir**, al pie del chat, va a y ≈ 1150–1240, fuera de lo que tapa
  Instagram. Lo de abajo es papel.

**El guion (15,5 s).**

| s | qué se ve | texto en pantalla |
|---|---|---|
| 0,0 | Portada: el chat abierto. Un mensaje de WICHO y, debajo, la foto del Philly que mandó SANDO (`foto-philly-30`, recorte cuadrado) | WICHO: «¿qué pedimos?» · SANDO: [foto] «Este.» |
| 0,8 | WICHO escribe: su espiral gira | — |
| 1,4 | | WICHO: «¿sin salsa?» |
| 2,1 | | SANDO: «No lleva.» |
| 2,8 | | WICHO: «¿ni una?» |
| 3,4 | | SANDO: «Ni una.» |
| 4,0 | La espiral de WICHO gira más tiempo: está escribiendo mucho | — |
| 5,2 | WICHO manda una foto: `foto-arma-encima` con sus círculos de tinta, como quien raya una foto antes de mandarla (la Focaccia no sale en esta foto: va en el texto) | WICHO: [foto] «el mío» |
| 6,2 | | WICHO: «focaccia, res, cheddar, todos los vegetales y estas» |
| 7,2 | Debajo, en gris: «Visto». El chat se queda quieto un segundo: es el silencio de SANDO | «Visto» |
| 8,4 | | WICHO: «sando» |
| 8,8 | | WICHO: «SANDOOO» |
| 9,4 | | WICHO: «pedimos los dos y ya» |
| 10,2 | SANDO reacciona a la foto de WICHO con un `//` (sus dos barras) en vez de un emoji | — |
| 10,8 | | SANDO: «Ya está.» |
| 11,6 | El cursor parpadea en la barra para escribir: le toca a quien mira | WICHO: «¿y tú de cuál?» |
| 12,6 | Las dos caras de la cabecera se juntan en el centro y se vuelven el logo oficial, con el fondo partido | «SNDWCH.APP» |
| 14,6 | El logo vuelve a la cabecera y el chat sube hasta el primer mensaje | — |
| 15,5 | Empalma con 0,0 | — |

**Por qué alguien lo mandaría.**
- Es el chat que todos tienen con un hermano, la pareja o el grupo: uno decide en dos palabras y
  el otro escribe un párrafo. «Literal nosotros» es de las razones más comunes para mandar un Reel.
- El «Visto» lo reconoce cualquiera.
- La última línea le pasa la palabra a quien mira, sin pedirle nada.

**Por qué funciona.**
- **Marca a los 2 s (5).** Las caras de los dos están en el primer cuadro, y no están sobre la
  comida.
- **Momento (4).** El «¿qué pedimos?» de la juntada, sin día ni hora.
- **Serie (5).** «El chat de los hermanos» puede volver cada semana: la sexta salsa, el pedido
  raro, ¿15 o 30?
- **La voz de cada uno, tal cual la biblia:**
  - SANDO usa frases de seis palabras o menos y nunca exclama. Su arma es el silencio, y aquí es
    literal: el «Visto».
  - WICHO exagera, insiste y es el que resuelve.

**Con qué piezas reales se hace.**
- Las fotos: `foto-philly-30.jpg` y `foto-arma-encima.jpg`.
- Las caras: `img/sando2_frente.png` e `img/wicho.png`.
- El logo oficial.
- La espiral y la exportación de `reel.cjs`.

**La verdad del chat.**
- «Todos los vegetales» es real: no tienen límite ni costo.
- WICHO marca una proteína, un queso y tres salsas: el tope, sin escribir el número.
- «Pedimos los dos» también es real: un pedido lleva Signatures y armados juntos, y la app tiene
  el modo «¿Son varios? Cada uno arma el suyo».

**Qué pedirle a Flow.** Nada obligatorio. Si el dueño quiere caras con otro gesto (SANDO con la
ceja arriba, WICHO riéndose), ya existen `sando2_ladea.png` y `wicho2_rie.png`.

**El riesgo.**
1. **El chat en pantalla es un formato conocido.**
   - Lo nuestro está en los detalles: la espiral que escribe, el «Visto» de SANDO y el `//` como
     reacción.
   - Sin esos detalles, es lo obvio.
2. **Mucho texto: doce mensajes en 15 s.** Cada uno tiene seis palabras o menos, salvo el párrafo
   de WICHO, que es el chiste. Se prueba leyéndolo en el celular.
3. **La lista de WICHO enumera ingredientes.** Enumerar como descripción ya se rechazó. Aquí es
   diálogo, pero el Redactor la deja en una línea.
4. **Que WICHO quede como el pesado.** El «Visto» es de SANDO, pero quien destraba es WICHO
   («pedimos los dos y ya»), y SANDO le da el `//`.
5. **Las caras son el mismo dibujo de siempre.** El dueño pidió no usarlos «para todo»; aquí son
   los personajes de la escena, no un adorno.

**Puntaje.** Br 5 · Mo 4 · Ma 5 · Ga 4 · Co 4 · Pe 4 · Ve 4 · Se 5 = **35**

### C · «Así se come»

**La idea en una frase.** Los dos dicen la misma frase, «Así se come.», de dos sándwiches
opuestos. La pelea se acelera, se frena en seco, y el remate es que nunca se ponen de acuerdo y
igual comen juntos.

**Titular candidato.**
- «Así se come.», dicho por los dos.
- El remate: «Nunca se ponen de acuerdo. Igual comen juntos.»

**Lo que se ve** (para la maqueta):
- **Pantalla completa, un lado a la vez.**
  - SANDO: la foto a lo ancho, con el oliva acanalado arriba.
  - WICHO: la foto a lo ancho, con el celeste y sus curvas arriba.
  - El sándwich queda entre y ≈ 560 y 1240.
- **Cada cambio de lado es el corte.** Las dos barras del `//` barren la pantalla en diagonal en
  0,2 s (el corte de `reel.cjs`, más rápido). La pelea se ve en el ritmo: los cortes se acercan
  cada vez más.
- **El texto va arriba (y ≈ 290–520)**, en el mundo de cada uno, nunca sobre la foto: SANDO en
  itálica papel y WICHO en Anton cursiva tinta.
- **Los recortes**, como máximo de 1,15×.

**El guion (15 s).**

| s | qué se ve | texto en pantalla |
|---|---|---|
| 0,0 | SANDO · el Philly (`foto-philly-30`) | «Así se come.» |
| 1,3 | Corte → WICHO · `foto-arma-capas` | «Así se come.» |
| 2,6 | Corte → SANDO · el Philly, más cerca del queso y la res | «Sin salsa.» |
| 3,5 | Corte → WICHO · las tres salsitas de `foto-arma-encima`, con sus círculos | «Con estas.» |
| 4,3 | Corte → SANDO · `foto-classic-tuna-30` | «En lascas.» |
| 5,0 | Corte → WICHO · el jalapeño de `foto-arma-encima` | «Y jalapeño.» |
| 5,6 | Corte → SANDO · Classic Tuna | «Así no.» |
| 6,1 | Corte → WICHO · `foto-arma-capas` | «Así sí.» |
| 6,5 / 6,8 / 7,1 | Tres cortes seguidos, cada vez más rápidos | «No.» · «Sí.» · «No.» |
| 7,4 | El `//` se detiene en el medio: a la izquierda el Philly, a la derecha el armado. Nada se mueve | — |
| 8,0 | Arriba, partido por el `//` | «Nunca se ponen \| de acuerdo.» |
| 9,6 | Las dos mitades se acercan hasta tocarse, como las dos mitades de un 30 | «Igual comen juntos.» |
| 11,4 | Donde se juntan aparece el logo oficial con el fondo partido | «SNDWCH.APP» |
| 13,6 | El `//` barre otra vez y destapa el Philly | «Así se come.» |
| 15,0 | Empalma con 0,0 | — |

**Por qué alguien lo mandaría.** Todos tienen a alguien con quien nunca están de acuerdo y con quien
igual comen: el hermano, la pareja, el grupo de siempre. El remate cambia la pelea por cariño. Se
manda con un «somos nosotros».

**Por qué funciona.**
- **Contagio (5).** Lleva emoción, no solo identidad.
- **Cerebro derecho (Wood).** Personajes, un conflicto que sube y un giro al final.
- **Es la idea de la marca dicha completa:** «dos hermanos que nunca se ponen de acuerdo».
- **Ningún lado pierde:** el remate es que los dos van juntos.

**Con qué piezas reales se hace.**
- Las fotos: `foto-philly-30.jpg`, `foto-classic-tuna-30.jpg`, `foto-arma-capas.jpg` y
  `foto-arma-encima.jpg`.
- El logo oficial.
- El corte de `reel.cjs`.

**La verdad.**
- «Sin salsa.»: el Philly no lleva.
- «En lascas.»: es la carta del atún.
- «Y jalapeño.»: en el armador, el atún va con jalapeño.
- «Con estas.»: tres salsas, el tope.

**Qué pedirle a Flow.** Nada.

**El riesgo.**
1. **Es el más cercano a «fotos pegadas».**
   - Por eso son solo cuatro fotos, que se repiten, y cada una es una réplica, no una lámina de la
     carta.
   - Si en la maqueta se siente catálogo, se descarta antes de producir.
2. **Cortes rápidos.** Un texto de 0,3 s no se lee: por eso las palabras del final de la pelea son
   de una sílaba.
3. **`foto-arma-capas` tiene las capas en el aire.** Es una foto quieta, ya aprobada en el
   carrusel, y nada cae. Aun así, recuerda a «se arma solo». Si molesta, se cambia por
   `foto-arma-encima`.
4. **Serie baja.** El remate se cuenta una vez.

**Puntaje.** Br 5 · Mo 4 · Ma 4 · Ga 4 · Co 5 · Pe 4 · Ve 4 · Se 3 = **33**

## 4 · La recomendación

**A, «¿Algún cambio?».**
- **El bucle es el chiste.** WICHO vuelve a empezar, así que el Reel se ve dos veces sin que nadie
  lo pida, y eso es lo que mide el brief.
- **No inventa nada.** «Todos» y «Ninguno» son un botón real de la app, y cada elección respeta
  las reglas del armador.
- **El brief entra en dos palabras**, y la pregunta del texto («¿Ninguno o todos?») se contesta
  sola.
- **Se vuelve serie:** una pregunta nueva cada semana, en la misma pantalla partida.

**B empata en puntos y es el plan B.** Es el que va si el dueño quiere ver las caras de los
hermanos en el video.

**C es el más cálido**, pero el más cerca de las fotos seguidas.

**Con A, lo primero que se mira a las 48 h** son las repeticiones (visualizaciones ÷ cuentas
alcanzadas). Si no pasan de 1, el bucle no se está viendo.

## 5 · Para los que siguen

- **Redactor.** Pule las líneas de cada personaje:
  - SANDO: seis palabras o menos, sin exclamar.
  - WICHO: puede exclamar.
  - Ninguna línea dice «del otro lado» ni «¿de qué lado comes?».
  - En B, la lista de WICHO en una sola línea.
  - El texto de la publicación sigue el resto del set: invita a pedir por WhatsApp y no pide
    etiquetar.
- **Director de arte.**
  - La geometría del `//`: la misma inclinación del wordmark, y las dos barras del mismo ancho.
  - Los círculos de WICHO no cruzan comida.
  - Las ventanas de foto respetan el encuadre: sin agrandar más de 1,15×, salvo el Philly.
  - En A, prueba a tamaño de celular que los dos lados se lean a la vez.
  - En B, diseña un chat que no se parezca a WhatsApp ni a Instagram.
- **Editor de video.**
  - Parte de `reel.cjs`.
  - Agrega las ventanas de foto con recorte y los trazos con `stroke-dashoffset`.
  - Revisa el empalme cuadro a cuadro: el último tiene que llevar al primero sin salto.
- **Calidad.**
  - Que no aparezca la lata ni `foto-meatball-30`.
  - Que no haya cifras escritas, ni precio, ni fecha.
  - Que las elecciones de WICHO cumplan el armador: un pan, una proteína, un queso y como máximo
    tres salsas.
  - Que nada tape ni tiña la comida.

## Para el dueño

1. **Elige A, B o C** cuando veas las maquetas (Puerta 1). La agencia recomienda A.
2. **«¿De qué lado comes?» no sale en pantalla ni en el texto.** En Perú, «comer» y «del otro
   lado» se leen con doble sentido. La idea se queda como guía interna. Si te parece que no hay
   riesgo, dilo y el Redactor la puede usar.
3. **Ni latas ni Meatball en este Reel.** Las bebidas todavía no se venden y al abrir salen en
   botella. `foto-meatball-30` tiene la lata de The Bloom, y el Reel actual también la muestra en
   su portada.
4. **Si «Los seis de la casa» ya está publicado,** decide si lo archivas cuando suba el nuevo.
   Si no, el centro de la cuadrícula queda con dos Reels.
