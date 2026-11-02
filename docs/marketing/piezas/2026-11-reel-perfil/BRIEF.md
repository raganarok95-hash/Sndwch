# Brief · 2026-11-reel-perfil

> Mini-brief del Estratega (`brief-sndwch`), 2026-11-02. Reemplaza al Reel «Los seis de la casa»
> (`instagram-perfil/final/reel.cjs`). El dueño pidió que decida la agencia; esto pasa al Creativo,
> que propone la pieza.

**Diagnóstico.**
1. **Qué pasó.** El dueño rechazó el Reel antes de que hubiera un solo dato («no es nada creativo,
   es solo los sándwiches pegados») y no eligió ninguna de las tres propuestas de la sesión.
2. **Por qué.** Es un catálogo, no una idea. 9,6 de sus 15,6 s (62 %) son seis fotos de 1,6 s con
   su nombre. La idea de la marca, dos hermanos que no se ponen de acuerdo, aparece solo 0,4 s, en
   el segundo 10,4 (`reel.cjs`, constante `T`). Lo que no dice nada de quien lo mira no tiene por
   qué mandarse.
3. **Qué lo impide.** No hay clips reales y no se genera video del sándwich, así que el movimiento
   tiene que salir de la idea, no de la cámara. Tampoco hay con qué comparar: la cuenta no tiene
   ningún Reel medido (sin acceso a Instagram en esta corrida).

**Pieza:** `2026-11-reel-perfil` · Reel 9:16 (1080 × 1920), 15–20 s, con portada 9:16 que la
cuadrícula recorta a 3:4 · Instagram orgánico (y Facebook, como todo el set), en el centro de la
cuadrícula · id en `publicar.json`: `perfil-5-reel`.

**LA IDEA: «¿De qué lado comes?»** El Reel no enseña la carta. Hace que quien lo ve elija lado:
uno de la casa, que no se toca, o armar el suyo. Y que se lo mande a quien come del otro lado.
Es el concepto del perfil, «Dos formas de comer SND//WCH», convertido en una pregunta sobre ti.

1. **Para quién.** Una persona en Trujillo que todavía no nos sigue, en **la juntada o el
   partido** (AGENCIA §2.2: viernes a domingo, de noche; «los dos discuten»; varios, en grupo).
   *Es hipótesis*: no hay pedidos reales que la confirmen. Nivel: **no nos conoce** (§2.3), así
   que se le muestran el momento y los hermanos, sin precio.
   *Por qué este momento:* es el único de §2.2 donde discuten los dos hermanos, y el único donde
   se decide entre varios, que es lo mismo que mandar el Reel. Como el Reel queda fijo en la
   cuadrícula, no nombra el día ni la hora: tiene que funcionar también un martes.
2. **Lo que tiene que pasar.** Que lo vea entero, que lo vuelva a ver y que se lo mande por mensaje
   a alguien. Después, que siga la cuenta. Un Reel orgánico no tiene enlace que se toque: quien
   quiera la carta entra por el perfil (`sndwch.app/?src=ig-bio`). `perfil-5-reel` es el id de
   la pieza y no se puede contar como origen en la app. El video lleva una sola acción, elegir y
   mandar: no dice «pide». El texto de la publicación sigue al resto del set (dueño, 2026-10-30:
   «este set invita a pedir por WhatsApp»; antes de abrir, el chat responde con la web).
3. **Lo que hoy piensa** (hipótesis, del brief de la semana): «Otra sanguchería de delivery.» →
   **Lo que queremos que piense:** «Aquí hay dos formas de comer. Yo soy de esta, y conozco a
   alguien que es de la otra.» **Lo que siente:** que se reconoce, y ganas de picar a un amigo.
4. **La verdad que lo sostiene.**
   - **Las dos formas existen y se piden igual.** Seis Signatures con receta fija, o «Arma el
     tuyo»: el pan (Classic // White o Focaccia // Artesanal), una proteína (atún, albóndiga, pavo
     o res) y lo de encima (`docs/hechos/CARTA.md`). La biografía ya lo dice: «Elige uno de la
     casa o arma el tuyo» (`instagram-perfil/final/LEEME.md`).
   - **El contraste más claro, y los dos lados son ciertos.** Del Philly, en «Cómo se vende»:
     «Tan jugoso que no lleva salsa» (su receta: salsas —). En «Arma el tuyo» entran hasta 3 salsas
     incluidas (`MAX_SAUCES_BYO` en `src/app/04-armado-de-pedido.ts`; CARTA.md: «Hasta 3
     salsas»). También: el atún «en lascas gruesas, nunca hecho pasta» (Classic Tuna).
   - **La idea de marca:** «Dos hermanos que nunca se ponen de acuerdo en cómo se arma un
     sándwich» (AGENCIA §2.1, BIBLIA §1). Y «a veces gana él» (BIBLIA §2): ningún lado pierde. Si
     uno pierde, el Reel le dice a la mitad del público que su forma de comer está mal.
   - **Por qué se manda.** A quien no te sigue, Instagram le reparte más lo que se manda por
     mensaje, lo que se mira más tiempo y lo que recibe más «me gusta» por cuenta alcanzada
     (Mosseri, 2023 y 2025, citado en LEEME). La gente comparte lo que dice algo de ella (Berger,
     *Contagious*, 2013; es el criterio «Contagio» de la rúbrica, AGENCIA §4). Y un envío viaja por
     los contactos de quien lo manda: si lo manda alguien de Trujillo, casi siempre llega a alguien
     de Trujillo. Esto último es razonamiento, no un dato medido.
5. **Lo obligatorio.**
   - **La comida en los 2 primeros segundos**, sin logo de entrada ni pantalla de título
     (`video-sndwch`). Se usan las fotos aprobadas: `anuncios/fotos/foto-*-30.jpg` y
     `foto-arma-*.jpg`. Cada una con su receta real y la porción de la carta para el tamaño que
     se ve (15 cm · 85 g; 30 cm · 170 g; una capa, sin desbordar). El primer cuadro es la portada
     que toma la API.
   - **La marca a los 2 s, sin leer el nombre.** Los dos lados se reconocen por sus elementos:
     SANDO por el oliva acanalado, el verde y el forro naranja; WICHO por el celeste, las curvas de
     nivel y la espiral. El `//` dorado `#CBA258` y celeste `#8CC8EC` va donde significa el corte.
     El cierre es el logo oficial con `SNDWCH.APP`, como en todo el set.
   - **Los hermanos**, si salen: con sus poses oficiales (`img/sando2_*`, `img/wicho*`) o con poses
     nuevas hechas en Flow con su referencia, comparadas lado a lado antes de usarlas. Nunca encima
     de la comida. No hablan: todo va en texto en pantalla.
   - **Formato.** 9:16, 15–20 s. Texto fuera del 14 % de arriba (269 px) y del 35 % de abajo
     (672 px). Lo importante de la portada va en la franja central de 1080 × 1440 que deja el
     recorte 3:4.
   - **Que funcione en silencio.** Por sistema sale sin audio (LEEME). Todo se lee.
   - **En bucle.** El último cuadro empalma con el primero (BIBLIA §5): es lo que hace que se vea
     dos veces.
   - **Ningún precio, ninguna fecha, ninguna cifra a mano.** Si el texto nombra cuántos panes,
     proteínas o salsas hay, sale de `scripts/piezas/datos.ts` (`cuenta`). El tope de salsas
     (`MAX_SAUCES_BYO`) hoy no está en `datos.ts`: mientras no esté, no se escribe en pantalla.
     Los nombres de los productos son los de la app.
6. **Lo que NO.**
   - **El desfile de fotos, o algo que se le parezca.** «No es nada creativo, es solo los
     sándwiches pegados.» Tampoco el mosaico de seis, una lista de la carta ni «O arma el tuyo»
     como lámina final.
   - **Las propuestas A, B y C de la sesión, tal cual**: la ruleta «pausa el video», «se arma
     solo» y «de 11 a 22». El dueño no eligió ninguna.
   - **Video generado del sándwich** (`video-sndwch`). Tampoco un sándwich dibujado: «se ve
     asquerosa», y salió con forma de hamburguesa.
   - **Nada que la receta no lleve.** Ningún ingrediente, queso ni relleno de más, y ningún armado
     con más de 3 salsas distintas (INDECOPI). Nada de alcohol, personas ni manos.
   - **Los hermanos pegados sobre una foto de comida**, o puestos en todo. Dueño: «No necesitas
     usar a SANDO y WICHO para todo… sé creativo»; «descompone, usa los colores». Tampoco el
     WICHO modificado («lo modificaste demasiado»).
   - **Teñir la comida**, ni franjas, marcos o bandas de color sobre la foto.
   - **Un lado que pierde**, o que se burla del otro.
   - **Pedir el envío con una orden** («etiqueta a…», «mándaselo a…»). Facebook baja lo que pide
     compartir o etiquetar de forma explícita (su política contra el *engagement bait*, 2017).
     El envío tiene que salir de la idea.
   - **Nada de preapertura**: la fecha, «abrimos», «próximamente», «ensayo» o «todavía no». El
     Reel queda fijo y tiene que servir el día que abramos. Lo temporal va en su propia pieza
     (dueño, 2026-11-01). «Antes de abrir, se ensaya» vive en las historias de la semana.
   - **Lo que ya se rechazó en los textos**: enumerar ingredientes como descripción, los
     beneficios que necesitan explicación («se come con una mano»), «gran inauguración» y
     cualquier identidad regional, Trujillo incluido.
7. **Cómo se mide.** Con la estadística del Reel en Instagram: en el celular o por la API, si el
   token funciona (sin acceso en esta corrida). Se lee a las 48 h para ver el gancho y a los 7
   días para decidir. Los «me gusta» no deciden nada (AGENCIA §7).
   - **El número que decide: envíos por cuenta alcanzada** (envíos ÷ cuentas alcanzadas). Se
     compara con los dos carruseles fijados (la carta y «Arma el tuyo»), que son las piezas del set
     hechas para mandarse.
   - **Reproducciones repetidas:** visualizaciones ÷ cuentas alcanzadas. Si da más de 1, se volvió
     a ver. Si la pantalla ya no muestra las repeticiones aparte, se usa este cociente: Instagram
     las juntó con las «visualizaciones» en 2025.
   - **Si lo ven entero:** tiempo promedio visto ÷ duración del Reel.
   - **Seguidores nuevos desde el Reel** (los «seguimientos» de su estadística) y **qué parte del
     alcance no nos seguía**.
   - **Reglas de corte (propuestas; no hay datos propios para fijarlas).** A los 7 días:
     - Si el tiempo promedio visto no llega a la mitad de lo que dura, falla el gancho: se cambian
       los 2 primeros segundos, no la idea.
     - Si lo ven entero pero manda menos por cuenta alcanzada que los carruseles, falla la idea y
       vuelve al Estratega.
   - **Lo que falta:** no hay ningún dato de alcance para comparar, y no sé si «Los seis de la
     casa» ya se publicó.
