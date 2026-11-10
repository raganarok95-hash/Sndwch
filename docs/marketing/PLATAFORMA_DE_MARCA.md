# La plataforma de marca de SND//WCH (propuesta, 2026-11-10)

> **Qué es esto.** Las reglas de fondo que tiene que cumplir todo el contenido: reels, posts, historias y anuncios.
> Va **antes** que la biblia de la serie (`BIBLIA_DE_LA_SERIE.md`), el estilo (`estilo-sndwch`) y cada brief: la biblia
> dice *cómo* se arma un episodio; esto dice *por qué* existe la marca y *qué* tiene que decir cada pieza.
> **Estado: propuesta del Estratega. No reemplaza nada hasta que el dueño la apruebe.**
>
> Se escribe porque el dueño rechazó el reel «Ese ya gotea» (2026-11-10): «¿en qué se basa para ponerle un título
> como "ese ya gotea"? Título todo tonto, debe tener líneas claras de ideas, de marca, de marketing, de los porqué».
>
> **Cómo leer las fuentes.** Cada afirmación lleva al lado de dónde sale: un archivo del repo, un estudio (con autor y
> año) o **«sin evidencia»**. Hasta hoy no hay pedidos reales: todo lo que hay en `orders` y `customers` es de prueba
> (`aprendizajes/analista.md`). Por eso **todo lo que se diga del cliente es hipótesis** hasta que lleguen los pedidos
> del 20 de noviembre.

---

## 1 · Diagnóstico honesto

### 1.1 · Qué es hoy la marca en lo publicado y programado

| lo que hay | lo que comunica | fuente |
|---|---|---|
| El perfil de Instagram aprobado: logo, los dos lados (SANDO con los Signatures, WICHO con arma el tuyo) | un sistema visual cuidado y reconocible | `instagram-perfil/final/`, `aprendizajes/director-de-arte.md` 2026-10-30 |
| Las láminas de los Signatures: el nombre manda, el sándwich llena el cuadro | **qué** se vende | `aprendizajes/director-de-arte.md` 2026-10-30 |
| La semana del 9: «¿Qué es un Philly?», «¿Frío o gratinado?», «Cómo se dice» | explica la carta, y lo explica bien | `semanas/2026-11-09/TEXTOS.md` |
| La semana del 16: «FALTAN 3 DÍAS.», «MAÑANA, 11:00.», «HOY ABRIMOS.» | la cuenta regresiva | `semanas/2026-11-16/RESUMEN.md` |
| Los anuncios aprobados como idea: «Hambre en serio.», «Hoy no cocinas.», «El almuerzo que no te tumba la tarde.» | **para cuándo** es: el momento | `aprendizajes/creativo.md` 2026-10-16 |

**Lectura.** Hoy SND//WCH es **una carta bien explicada con un sistema visual bueno**. Se sabe qué vende y cómo se
ve. **No se sabe por qué existe ni qué piensa.** La cuenta regresiva la podría firmar cualquier local que abre. Los
hermanos aparecen como estética (sus colores, sus mundos), no como dos formas de ver algo que le importe al cliente. Lo
único que ya tenía un porqué eran los tres titulares de momento del 16 de octubre, y salieron de la carta.

La idea de marca escrita hasta hoy («dos hermanos que nunca se ponen de acuerdo en cómo se arma un sándwich»,
`AGENCIA.md` §2.1) **es un formato, no una razón**: dice lo que hacen los personajes, no por qué al cliente le
importa. Con eso cualquier discusión parece válida, aunque sea de nada. El reel rechazado lo muestra.

### 1.2 · Por qué «Ese ya gotea» era tonto: qué le faltaba

| lo que faltaba | qué pasó en el guion | por qué importa |
|---|---|---|
| **Decir qué es** | El título habla de un sándwich que en Trujillo nadie conoce | El dueño ya lo dijo: «Nadie conoce qué es un Philly» (`aprendizajes/redactor.md` 2026-11-02). «Ese» no apunta a nada para quien no nos conoce, que es casi todo el público de un reel (`AGENCIA.md` §2.3) |
| **Una palabra que sume** | «Gotea» es ambigua y, en delivery, negativa: lo que gotea mancha, se ablanda en el camino y llega roto | La carta dice «tan jugoso que no lleva salsa», no «gotea». El dueño ya pidió no decir cosas negativas («sin amargor», `aprendizajes/redactor.md` 2026-10-24). Y choca con la promesa de «Lo que llega» (`CONCEPTO_DEL_NEGOCIO.md` §6) |
| **Un conflicto que le importe al cliente** | WICHO quiere ponerle mayonesa y ketchup al Philly; SANDO lo corrige | Es una discusión que nadie tiene. Además WICHO queda como el tonto, y la biblia lo prohíbe: «si siempre pierde, la serie le dice al cliente que armar está mal» (`BIBLIA_DE_LA_SERIE.md` §2). Y las salsas que se burlan están en la carta |
| **El personaje bien hecho** | SANDO celebra una gota | SANDO es «todo en ángulo recto», su tabla «está limpia incluso mientras trabaja» (`UNIVERSO_SNDWCH.md` §5.2). Una gota es lo contrario de su mundo |
| **Un momento de compra** | No dice para cuándo es | Cada pieza se ata a UN momento (`AGENCIA.md` §1, Romaniuk). Sin momento, nadie recuerda el reel cuando le da hambre |
| **Una razón para pedir** | El remate solo funciona si viste la gota | El título tiene que funcionar solo: en la portada, en la cuadrícula y sin sonido |
| **Un porqué de verdad** | El único control fue «no se usó antes» (`git grep`) | Que sea nuevo no quiere decir que signifique algo. Lo nuevo es una condición para que una idea pase, no la razón para elegirla |
| **Cuidar lo que no se corrige** | «Abrimos el viernes 20» escrito en la imagen | Regla del dueño: sin fecha en las imágenes (`aprendizajes/director-de-arte.md` 2026-10-30) |

**La causa de fondo**: se partió del **formato** («conflicto + remate», biblia §1) y se le buscó un chiste. Tenía que
ser al revés: primero **la tensión del cliente y el momento**, después la verdad de la carta, y recién al final el
formato y el título. Así se trabaja desde ahora (§7).

---

## 2 · Para quién, el problema y la tensión

### 2.1 · El cliente concreto

No se define por edad, se define por **el momento** (Romaniuk; `AGENCIA.md` §2.2). Lo que el repo permite decir de él:

| qué se sabe | dato | fuente |
|---|---|---|
| **Ya pide comida por app** en Trujillo | Rappi tiene 120 locales de sándwiches, hamburguesas, comida rápida y desayunos en el Trujillo metropolitano | `docs/MERCADO.md` §1 |
| **Lo que suele pedir: hamburguesa o pollo** | 598 hamburguesas contra 185 sándwiches en Rappi. En Meta, el pollo y la hamburguesa pautan precio («a S/10», «promo») | `MERCADO.md` §1; `referentes/2026-11-10.md` §1 |
| **Ya paga lo que cuesta un sándwich de los buenos** | las mejores sangucherías cobran entre S/15.90 y S/19.90 por su estrella; hay un público que paga más de S/20 (los cafés, con 4.4–4.5) | `MERCADO.md` §5 |
| **Su sándwich de referencia es el criollo** | pan francés o ciabatta: lechón, pollo deshilachado, asado (San Agustín, Don Pacho, La Lucha, La Casera) | `MERCADO.md` §3, §5; `CONCEPTO_DEL_NEGOCIO.md` §1 |
| **No conoce los nombres de la carta** | «Nadie conoce qué es un Philly» | dueño, 2026-11-02 (`aprendizajes/redactor.md`) |
| **Descubre y compra por redes y WhatsApp** | el 84% de los que usan redes en el Perú urbano está en Facebook y el 46% en Instagram (2022); el peruano compra más por WhatsApp que por otras redes | Ipsos Perú, citado en `instagram-perfil/final/LEEME.md` (dato de 2022: puede estar viejo) |
| A qué hora pide, cuánto gasta, en grupo o solo, si vuelve | **sin evidencia**: no hay pedidos reales | se mide desde el 20-nov (§5) |

**En una frase (hipótesis):** alguien en Trujillo que ya pide comida por app, que **ya paga** por un sándwich de los
buenos, y que hoy elige entre **lo de siempre**: pollo, hamburguesa o el sánguche criollo.

### 2.2 · Sus momentos (los *Category Entry Points*)

Un *Category Entry Point* es la situación que te hace pensar en la categoría: cuándo, con quién, para qué
(Romaniuk, *How Brands Grow 2*; `AGENCIA.md` §1). **Todos son hipótesis** hasta que la hora de los pedidos los confirme.
Nota del Estratega: Meta solo entrega anuncios de 11:00 a 14:00 y de 18:00 a 21:00, así que un momento fuera de esas
horas no se puede probar con pauta (`aprendizajes/estratega.md` 2026-10-16).

| # | momento | cuándo (hipótesis) | qué necesita | la frase de la carta que lo resuelve | quién lo cuenta |
|---|---|---|---|---|---|
| 1 | **El almuerzo de semana** | mar–vie, 12:00–14:30 | que llene y no lo tumbe en la tarde | Turkey: «el almuerzo que no te tumba la tarde» | SANDO |
| 2 | **El hambre en serio** | cualquier hora, después de un día largo | algo contundente, sin pensar | Philly: «el que pides cuando el hambre va en serio» | SANDO |
| 3 | **La noche sin ganas de cocinar** | 19:00–22:00 | que alguien ya lo haya resuelto | Meatball: «para la noche en que ya decidiste no cocinar» | SANDO |
| 4 | **La juntada o el partido** | vie–dom, noche | varios y distintos, que cada uno elija | Italian Hoagie: «cuando quieres de todo en un solo pan»; el pedido en grupo | los dos |
| 5 | **El antojo a tu manera** | tarde, 16:00–18:00 | sentir que lo eligió él | ARMA EL TUYO: «el precio lo pone la proteína» | WICHO |
| 6 | **Cansado de lo de siempre** | cualquier día | algo distinto al pollo y la hamburguesa | «recetas que en Trujillo no se consiguen» (`CONCEPTO_DEL_NEGOCIO.md` §4) | los dos |
| 7 | **El domingo de flojera** | domingo | no moverse | un Signature (cualquiera) | SANDO |

El 6 es nuevo. Sale de que en las apps predomina la hamburguesa y en la pauta el pollo con precio (§2.1). Es una
hipótesis: no hay evidencia de que la gente busque «algo distinto».

### 2.3 · El problema que resuelve

**Pedir comida en Trujillo es elegir entre lo de siempre, y el sándwich que conoce es un pan de desayuno.** SND//WCH le
da otra opción: **un sándwich que es un almuerzo**. Es pan largo con ~85 g de proteína en el 15 cm (`docs/hechos/CARTA.md`,
tabla de Rappi), con recetas que acá no hay y hecho al momento. Y le deja elegir: o confía en la receta, o la arma él.

Fuente: el dueño, al probar la competencia: «el de San Agustín es un pan pequeño, tradicional, pan francés: alguien
en el desayuno se come dos o tres. Mismo pan Don Pacho» (`MERCADO.md` §6). **Ojo**: contra La Casera (ciabatta de
18–20 cm) no gana el tamaño, gana el relleno, y eso solo se puede decir con la balanza (`MERCADO.md` §6, §8).

### 2.4 · La tensión de la que se puede hablar

Son dos, y la segunda es la que encarnan los hermanos:

1. **«Un sánguche no es almuerzo.»** En el Perú el sánguche criollo es de desayuno o de lonche, y el pan es chico
   (observación del dueño y cartas de la competencia: `MERCADO.md` §3, §6). **Sin estudio de consumo que lo mida**: es
   una verdad de la calle, no un dato. Se habla de ella mostrando el pan largo y el relleno real, **nunca burlándose
   del sánguche criollo** ni comparando con cifras («el doble») sin la balanza.
2. **«¿Confío en lo que alguien pensó, o lo hago a mi manera?»** Cualquiera que pide comida vive esa duda: el plato de
   la casa o el que se arma.
   - **A favor de armarlo**: lo que uno mismo arma se valora más (el «efecto IKEA»: Norton, Mochon y Ariely, *Journal of
     Consumer Psychology*, 2012).
   - **A favor de la receta**: demasiadas opciones pueden frenar la compra (Iyengar y Lepper, 2000). Pero el meta-análisis
     de Chernev y otros (2015) muestra que **eso solo pasa en ciertos casos**: cuando la decisión es compleja o la persona
     no sabe qué quiere. No es una ley.
   - **Lo que deja**: las dos posturas tienen algo de razón, y por eso **ninguno de los dos hermanos gana siempre**.

---

## 3 · La idea de marca, el posicionamiento y la promesa

### 3.1 · La idea de marca (el porqué existe)

> **El sándwich, tomado en serio: o lo pensamos nosotros, o lo piensas tú.**

- **«Tomado en serio»** responde a la tensión 1: aquí el sándwich no es el pan del desayuno, es comida de verdad.
  También es lo que el brief del 2 de noviembre quería que pensara el cliente: «estos se lo toman en serio»
  (`semanas/2026-11-02/BRIEF.md`).
- **«O lo pensamos nosotros, o lo piensas tú»** responde a la tensión 2 y es la carta tal cual. **SANDO** es los
  Signatures, la receta cerrada. **WICHO** es ARMA EL TUYO, la abierta (`UNIVERSO_SNDWCH.md` §0).
- **El `//` es el corte** entre las dos mitades: el corte del pan y el corte entre las dos formas de pedir.
- Reemplaza como **porqué** a «dos hermanos que nunca se ponen de acuerdo» (`AGENCIA.md` §2.1), que queda como el
  **formato** de la serie. **Desde ahora, toda discusión de los hermanos es sobre una decisión que el cliente toma de
  verdad al pedir.**

### 3.2 · El posicionamiento

> Para quien en Trujillo pide comida por app y está cansado de lo de siempre, **SND//WCH es la sandwichería de pan
> largo al estilo de los clásicos americanos que llena como un almuerzo**. Te da dos caminos: la receta pensada (SANDO)
> o la tuya (WICHO). A diferencia del sánguche criollo, que va en pan de desayuno, **cada sándwich se arma al momento con
> la proteína que se ve**.

Fuentes: `CONCEPTO_DEL_NEGOCIO.md` §1 y §4; `MERCADO.md` §6. Lo que no dice, a propósito: no dice «el mejor» (la marca
va sin superlativos, `CONCEPTO_DEL_NEGOCIO.md` §5), no nombra una ciudad como identidad (regla 10) y no promete un tiempo
de entrega, porque el reparto lo hace un tercero (`CLAUDE.md`).

### 3.3 · La promesa

> **Lo que ves es lo que llega, hecho al momento, a la manera de él o a la tuya.**

Es la regla de «Lo que llega» (`CONCEPTO_DEL_NEGOCIO.md` §6) convertida en promesa. Además protege de INDECOPI (caso Bon
o Bon): la marca no puede prometer en la imagen más de lo que entrega.

### 3.4 · Las razones para creer (solo de la carta y la operación reales)

| razón | dónde está escrita |
|---|---|
| La res «laminada fina y salteada al momento» | `CARTA.md`, ARMA EL TUYO |
| Las albóndigas «hechas acá, cocidas dentro de su propia marinara» | `CARTA.md` |
| El pavo en «lonjas de un milímetro… laminadas el mismo día» y el tomate «cortado el mismo día» | `CARTA.md` |
| El atún «en lascas gruesas» | `CARTA.md` |
| ~85 g de proteína en el 15 cm, el doble en el 30 cm | `CARTA.md`, tabla para Rappi |
| Recetas que en Trujillo no se consiguen: no hay albóndiga en Rappi Trujillo y no hay Subway | `MERCADO.md` §4; `CONCEPTO_DEL_NEGOCIO.md` §1 |
| Arma el tuyo: eliges pan, proteína, vegetales, queso y hasta 3 salsas | `CARTA.md` |
| El menú secreto se desbloquea pidiendo y hacia afuera no se dice qué lleva | `CARTA.md` (el número de pedidos se interpola, no se escribe) |
| Cada pedido lo arma quien pensó la receta; no hay local ni mostrador | `CONCEPTO_DEL_NEGOCIO.md` §1 |

**Lo que NO es razón para creer** (no está probado): «el más grande», «el doble que…» sin la balanza, el tiempo de
entrega, «artesanal», cualquier número de clientes o de reseñas antes de tenerlo.

---

## 4 · SANDO y WICHO como activos distintivos

Un **activo distintivo** es lo que hace que te reconozcan sin leer el nombre (Romaniuk, *Building Distinctive Brand
Assets*, 2018). Sirve solo si se repite siempre igual. Los hermanos son los dos más fuertes que tiene la marca
(`AGENCIA.md` §2.1).

| | SANDO | WICHO |
|---|---|---|
| **Qué representa de la marca** | **La receta pensada.** Los 6 Signatures: alguien ya hizo la prueba por ti | **La receta tuya.** ARMA EL TUYO: el derecho a hacerlo a tu manera |
| **Qué le promete al cliente** | no tienes que pensar: está resuelto | tú mandas |
| **La tensión real que encarna** | la confianza: «déjalo en manos de quien sabe» | el control: «lo que yo elijo vale más» (efecto IKEA) |
| **Sus momentos** | almuerzo, hambre en serio, noche sin cocinar, domingo (CEP 1, 2, 3, 7) | antojo a tu manera, la juntada (CEP 4, 5) |
| **Cuándo tiene razón** | cuando no tienes ganas de decidir | cuando sabes lo que quieres o quieres probar |
| **Cómo se reconoce a los 2 s** | forro naranja, acanalado, tan cálido; quieto, la cámara se mueve | espiral, curvas de nivel, rosa durazno; se mueve, la cámara está quieta |
| **Fuente** | `LOS_DOS_HERMANOS.md`; `UNIVERSO_SNDWCH.md` §1, §4 | `LOS_DOS_HERMANOS.md`; `UNIVERSO_SNDWCH.md` §2, §4 |

**El conflicto de verdad** es **la receta o la tuya**. Sirve cualquier decisión que el cliente toma en la app:
Signature o arma el tuyo, 15 o 30, una salsa o tres, Classic o Focaccia, con bebida o sin bebida, pedir solo o en
grupo. **Si la discusión no es una de esas decisiones, no es un episodio.**

**Lo que NO hacen** (todo ya decidido; se junta aquí):
- No hablan: lo que dicen va en texto en pantalla (dueño, 2026-10-08; `BIBLIA_DE_LA_SERIE.md` §2).
- WICHO no dice precios ni promociones, y **no es el tonto del chiste**. Gana a veces (`UNIVERSO_SNDWCH.md` §2; biblia §2).
- SANDO no grita, no enseña los dientes, no anuncia descuentos y no celebra el desorden (`UNIVERSO_SNDWCH.md` §1, §4).
- No se burlan del cliente ni de lo que pidió, ni del sánguche criollo de la competencia (biblia §4.5).
- No salen en todo: si un objeto cuenta mejor la idea, va el objeto (dueño, 2026-10-30).
- No se pegan encima de una foto de comida, y la comida no se tiñe con su color (`aprendizajes/director-de-arte.md`).
- No se generan fuera de Flow sin su referencia, y no se les inventa nada que no tengan (`LOS_DOS_HERMANOS.md`).
- No son de ninguna ciudad (regla 10).

---

## 5 · Los pilares de contenido

Son cuatro, uno por cada paso del cliente. La discusión de los hermanos («la receta o la tuya») es **la voz que
cruza los cuatro**, no un pilar aparte.

| pilar | objetivo de negocio | qué cuenta | de dónde sale | nivel de conciencia (`AGENCIA.md` §2.3) |
|---|---|---|---|---|
| **1 · Qué es esto** | **CONOCER**: que nos ubique quien no nos conoce | qué es un Philly, un hoagie, un melt; qué es el pan largo; los dos caminos (la receta o la tuya) | la carta; las dudas reales («nadie conoce qué es un Philly») | no nos conoce |
| **2 · Así se hace** | **ANTOJAR**: que lo quiera | el proceso real y cómo se siente: res salteada al momento, queso que amarra, atún en lascas | `CARTA.md`, «Cómo se vende». El esfuerzo que se ve sube el valor (Kruger y otros, 2004) y lo que habla de sabor se elige más (Turnwald y otros, 2019) | no nos conoce / nos vio una vez |
| **3 · Para cuándo** | **PEDIR**: que pida hoy, en su momento | un momento (§2.2) y el Signature o el armado que lo resuelve; el precio, leído de la base | las frases de momento de la carta; los titulares aprobados el 16-oct | nos vio / visitó la app |
| **4 · De la casa** | **VOLVER**: segundo y tercer pedido | el menú secreto que se desbloquea pidiendo, los puntos, el pedido raro de la semana, el grupo | `CARTA.md`; `docs/hechos/REGLAS.md` (las cifras se interpolan). El secreto da estatus y la bolsa se ve en público (Berger, *Contagious*) | ya pidió |

**El reparto.** Para una marca nueva pesa más llegar a mucha gente que convencer a los mismos (Sharp, *How Brands
Grow*). Al lanzar, el reparto entre construir marca y activar ventas se acerca a mitades (Binet y Field; la cifra
~56/44 no está verificada, `AGENCIA.md` §1).
- **Hasta el 19-nov (preapertura)**: solo los pilares 1 y 2. No se invita a pedir (`brief-sndwch`).
- **Desde el 20-nov, con 3 o 4 reels por semana**: uno del pilar 1, uno del 2 y uno del 3. El cuarto alterna entre el 3
  y el 4. El pilar 4 entra cuando haya clientes con un segundo pedido.

### Cómo se mide cada pilar

Hay que decirlo claro: **un reel orgánico no lleva enlace propio.** El único enlace es el del perfil, `?src=ig-bio`,
y es uno solo para todo. Por eso cada pilar se mide con dos cosas: lo que entrega Instagram y una **historia con
enlace** que repite el reel el mismo día. Los `src` nuevos son propuesta: siguen el estilo de los que ya existen
(`ig-bio`, `ig-hist`, `meta-philly`, `bolsa`, `wa-estado`).

| pilar | número principal | con qué `?src=` | cuándo se mira |
|---|---|---|---|
| 1 · Qué es esto | % del alcance que **no nos sigue** y seguidores nuevos (Instagram) | visitas con `ig-bio` en las 24 h después del reel, contra el promedio de la semana | a las 48 h |
| 2 · Así se hace | guardados + compartidos por cada 1,000 cuentas alcanzadas; retención a los 3 s (Instagram) | `ig-hist-antojo-<id>` (la historia que repite el reel) | a las 48 h |
| 3 · Para cuándo | **pedidos** en la franja de su momento, contra el total del día | `ig-hist-<momento>-<id>`; en pauta, `meta-<momento>-<producto>` | el domingo (`DATOS.md`) |
| 4 · De la casa | % de clientes con segundo pedido en 30 días; menús secretos desbloqueados | `bolsa`, `wa-estado`, `ig-hist-casa-<id>` | cada mes |

Regla del Analista (biblia §8): después de 4 episodios, un formato que no movió su número baja de frecuencia, y el
que más movió sube.

---

## 6 · El sistema verbal: cómo se hace un buen título

### 6.1 · Qué es un título

El título es **la frase grande del primer cuadro y de la portada**. Es lo que lee alguien que no nos conoce, sin
sonido, mientras pasa el dedo. **No es una línea de diálogo de un hermano.** «Ese ya gotea» era una línea de SANDO
puesta como título: sin la escena no significa nada.

### 6.2 · De dónde sale (una de estas cuatro, siempre)

1. **Una frase de la carta** («Cómo se vende» o la descripción de un ingrediente, `CARTA.md`).
2. **Un momento** de §2.2, dicho como lo viviría el cliente.
3. **Una duda real del cliente** (lo que pregunta, lo que comenta; hoy: «¿qué es un Philly?»).
4. **La decisión de los hermanos**: la receta o la tuya, en una decisión real de la app.

Si un título no sale de una de las cuatro, se tira. Y antes de usarlo se revisa que no se haya usado ya, con `git
grep` en `docs/marketing` (dueño, 2026-11-09). Pero eso es solo el último filtro.

### 6.3 · Qué tiene que lograr en un segundo

En el celular, la gente recuerda un contenido después de verlo apenas un cuarto de segundo, y en promedio le dedica
1.7 segundos (Facebook IQ, *Capturing Attention in Feed*, 2016; estudio viejo, no verificado en esta corrida).
Casi todo se mira sin sonido (`UNIVERSO_SNDWCH.md` §4 cita 85%: cifra de 2016, puede haber cambiado).
En ese segundo el título tiene que hacer **dos cosas**:

1. **Decir de qué se trata**: el producto (y qué es, si el nombre no se conoce) o el momento.
2. **Dar una razón para quedarse**: una sensación que antoja (sabor, textura, temperatura) o una tensión que
   reconoce («¿la receta o la tuya?»). Que se sienta al leer (Papies, 2013 y 2020; `aprendizajes/redactor.md`).

**Cómo tiene que ser**:
- Corto, para que entre grande en el 9:16. Cuantas menos palabras, mejor. **Sin evidencia** de un número exacto:
  es práctica de oficio.
- En positivo y concreto. Sin palabras ambiguas ni negativas (dueño, 2026-10-24).
- Sin palabras de salud (`CONCEPTO_DEL_NEGOCIO.md` §5).
- Sin un juego de palabras que necesite la imagen para entenderse.
- Sin fecha ni cifra escrita a mano: los precios se interpolan y la fecha no va en la imagen.

### 6.4 · Cinco buenos, comentados

| título | de dónde sale | por qué funciona en un segundo |
|---|---|---|
| **«El almuerzo que no te tumba la tarde.»** | la carta (Turkey) y el momento 1 | El momento y lo que resuelve, en el idioma del cliente. El dueño lo aprobó como idea (2026-10-16) |
| **«Hambre en serio.»** | la carta (Philly) y el momento 2 | Dos palabras que cualquiera reconoce en su cuerpo. Aprobada como idea (2026-10-16) |
| **«Queso fundido hasta el borde.»** | la carta (Meatball) | Textura y temperatura: se siente al leerlo (Papies). El dueño la pidió para un Signature (2026-11-02) |
| **«¿Qué es un Philly?»** | la duda real del cliente | La pregunta que el público ya se hace, y promete la respuesta. Le habla a quien no nos conoce (`semanas/2026-11-09`) |
| **«¿La receta o la tuya?»** (propuesta nueva) | la idea de marca y la decisión real de la app | En cuatro palabras dice qué es SND//WCH y pone la tensión que encarnan los hermanos. Sirve de título fijo para una serie (`referentes/2026-11-10.md`, M1: el formato fijo sostuvo a la cuenta de Nápoles) |

### 6.5 · Cinco malos, comentados

| título | por qué falla |
|---|---|
| **«Ese ya gotea.»** | No dice qué es ni para cuándo. «Gotea» es ambiguo y, en delivery, negativo. Necesita la imagen para entenderse. Es una línea de diálogo, no un título. Y SANDO no celebra el desorden (§1.2) |
| **«¿Pides para la oficina?»** | Suena a encuesta. No hay sensación ni comida a la vista. El dueño: «está horrible» (`aprendizajes/creativo.md` 2026-10-16) |
| **«Se come con una mano.»** | Un beneficio práctico que necesita explicación. El dueño: «no tiene sentido» (`aprendizajes/redactor.md` 2026-11-01). El título dice cómo sabe, no cómo se maneja |
| **«Sin amargor.»** | Para vender algo, nombra lo que no tiene. El dueño: «No menciones cosas negativas» (`aprendizajes/redactor.md` 2026-10-24) |
| **«La plancha se prendió.»** | Es falso: no hay plancha, la res se saltea en sartén (`DECISIONES.md` 2026-09-24; `semanas/2026-11-16/RESUMEN.md`). Una frase linda que la operación no sostiene rompe la promesa |

**Un caso que depende del lugar:** «Hoy no cocinas.» sirve en una pieza del **pilar 3** (el momento). Bajo el nombre de
un Signature no sirve, porque ahí la línea describe el sándwich (dueño, 2026-11-02). El mismo título puede estar bien
o mal según el pilar.

---

## 7 · El test: lo que todo concepto pasa antes de mostrarse al dueño

Cada concepto lleva estas ocho respuestas escritas. **Si una es «no» o queda vacía, el concepto no se muestra.** Lo
revisa quien no lo escribió (Calidad o el Estratega).

| # | pregunta | lo que la hace fallar | de dónde sale |
|---|---|---|---|
| 1 | **¿A qué pilar y a qué momento pertenece?** Uno de cada uno, escritos | «sirve para todo»; ningún momento | Romaniuk; §2.2 y §5 |
| 2 | **¿De qué fuente sale?** Frase de la carta, dato del repo, duda real del cliente o decisión de la app | sale de un chiste o del formato | §6.2; Ritson: diagnóstico antes que táctica |
| 3 | **¿El título se entiende solo, en un segundo y sin sonido, por alguien que no sabe qué es un Philly?** Léelo sin la imagen | necesita la escena, usa un nombre que nadie conoce o es ambiguo | §6.3; dueño 2026-11-02 |
| 4 | **¿Dice algo en positivo que se siente** (sabor, textura, momento), sin negativos ni palabras de salud? | «gotea», «sin amargor», «ligero» | Turnwald 2019; Papies; dueño 2026-10-24 |
| 5 | **¿La discusión de los hermanos es una decisión real del cliente** (la receta o la tuya), sin que WICHO quede de tonto ni nadie se burle? | discuten algo que nadie decide; uno es el tonto; se burla del cliente o de la competencia | §3.1, §4; biblia §2 y §4 |
| 6 | **¿Se reconoce como nuestra en 2 segundos sin leer el nombre?** | no hay hermano ni ninguno de sus elementos | Romaniuk; `AGENCIA.md` §2.1 |
| 7 | **¿Lo que se ve es lo que llega y lo que se dice es verdad?** Receta y porción reales, nada que no se venda, nada que la operación no haga, sin fecha en la imagen, cifras interpoladas | más relleno, otro ingrediente, «plancha», una cifra escrita a mano | INDECOPI (Bon o Bon); `reglas-sndwch` |
| 8 | **¿Qué número dice si funcionó, con qué `?src=` y cuándo se mira?** ¿Y es nuevo (`git grep`)? | no se puede medir, o el título ya se usó | §5; dueño 2026-11-09 |

**Y una línea final, obligatoria:** *«Alguien lo va a pedir porque…»*, en una frase, con su fuente. Si no se puede
escribir, el concepto no tiene un porqué.

---

## 8 · Lo que decide el dueño

1. **La idea de marca** (§3.1): si «El sándwich, tomado en serio: o lo pensamos nosotros, o lo piensas tú» pasa a ser
   el porqué de la marca, y «dos hermanos que nunca se ponen de acuerdo» queda como el formato de la serie.
2. **El slogan sigue pendiente** (`CONCEPTO_DEL_NEGOCIO.md` §9). Esta plataforma refuerza la opción que ya estaba
   recomendada, «Uno cura. El otro arma.», y suma «¿La receta o la tuya?» como título fijo de una serie, no como slogan.
3. **Los cuatro pilares** y el reparto desde el 20-nov (§5).
4. **Los `?src=` nuevos** por pilar (§5): hay que confirmar que el conteo de visitas acepta cualquier texto en `src`.
   Lo verifica quien mantiene la app; este documento no lo comprobó.
