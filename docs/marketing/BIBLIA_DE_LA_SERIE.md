# La biblia de la serie (propuesta, 2026-10-07)

> **Se abre ANTES de escribir un guion, no después** (la misma lección de
> `docs/LOS_DOS_HERMANOS.md`). Si un episodio no se puede rastrear a algo de acá, no va.
> **Estado: propuesta para que la revise el dueño. Nada se produce hasta su visto bueno.**

Fuentes, nada inventado: los personajes salen de `docs/LOS_DOS_HERMANOS.md` y
`docs/PROMPTS_PERSONAJES.md` §3; el mundo, de §4.2 (la cocina de noche para Flow); las
situaciones, de los pitches reales de la carta (`_shared/carta.ts`).

---

## 1 · La premisa, en una línea

**Dos hermanos que nunca se ponen de acuerdo en cómo se arma un sándwich, y una hermana que ya
terminó.**

El motor de cada episodio es el mismo: **orden contra caos**. SANDO cura, WICHO arma, y ninguno
de los dos tiene siempre la razón. Eso es la carta (los Signatures de SANDO) contra el armador
(«arma el tuyo», el mundo de WICHO). Cada pelea termina en algo que se puede pedir.

## 2 · Los personajes en video

### SANDO · el curador
- **Qué quiere**: que cada cosa esté en su sitio. Una salsa, la justa.
- **Cómo habla**: voz grave, lenta. **Frases de seis palabras o menos.** Nunca exclama, nunca
  repite una pregunta. Su arma es el silencio: deja que el otro se escuche a sí mismo.
- **Cómo se mueve**: poco. Brazos cruzados, una ceja, deja algo sobre la mesa y se va.
- **Su lugar**: la tabla de madera, todo en ángulo recto, un solo cuchillo (§4.2, escena 2).
- **Nunca**: grita, enseña los dientes, se ríe a carcajadas, explica un chiste.
- **Su frase**: «Uno.» · «Así no.» · «Ya está.»

### WICHO · el que arma
- **Qué quiere**: probarlo todo a la vez. Ponerle nombre a cada invento.
- **Cómo habla**: rápido, agudo, se ríe de sus propias ideas antes de terminarlas. Exclama,
  exagera, pregunta «¿y si…?».
- **Cómo se mueve**: mucho. Todo abierto, salsa en el aire, se pasa de la raya, como su trazo.
- **Su lugar**: el mostrador con todos los envases abiertos (§4.2, escena 3).
- **Nunca**: es el tonto del chiste. **A veces gana él**: su mundo es el del cliente que arma su
  propio sándwich, y si siempre pierde, la serie le dice al cliente que armar está mal.
- **Su frase**: «¿Y si le ponemos…?» · «Esto tiene nombre.»

### MAFE · la hermana del medio (**después**: dueño, 2026-10-07, «MAFE luego»)
- **Qué quiere**: nada. Ya terminó. Sirve las bebidas y se va.
- **Cómo habla**: casi no habla. Una línea seca al final, media sonrisa de un lado.
- **Su objeto**: la botella alta de infusión rosada (en la carta, las bebidas).
- **Su papel**: **el remate**. Cuando los dos hermanos se trancan, entra, deja la bebida y cierra.
- **Pendiente**: está aprobada (2026-09-11) pero **no tiene imagen de referencia** (`img/mafe_ref.png`
  no existe). Sin referencia no hay estilo (regla 5 de PROMPTS_PERSONAJES): primero se pide su
  imagen con el prompt de §3.3, se elige una variante y después entra a la serie.

### Las voces (para Flow)
Español neutro latinoamericano, con **tú**, sin modismos regionales marcados (la marca no tiene
identidad regional). SANDO grave y pausado; WICHO agudo y acelerado; MAFE baja y aburrida. **La
misma voz en todos los episodios**: por eso conviene el MCP de Flow con biblioteca de voces.

## 3 · El mundo

- **La cocina de noche** (§4.2): azulejo verde, una sola bombilla cálida, todo lo demás negro.
  Siempre es de noche ahí. Es el escenario de casi todo.
- **La mesa del cliente** (§4.2, escena 6): luz fría y neutra, sin color de marca. **El cambio de
  luz es la entrega**: cuando la escena pasa a esa luz, el sándwich ya es de alguien.
- **El sándwich se puede generar** (dueño, 2026-10-07), en ilustración o fotorrealista, siempre
  **fiel a la receta y a la porción reales** de la carta: mismos ingredientes, mismo pan, nada de
  relleno de más (INDECOPI sanciona la imagen que promete más de lo que llega).

## 4 · Lo que la serie nunca hace

1. **Mostrar un sándwich que no es el que llega**: el generado lleva la receta y la porción
   reales; nunca un ingrediente que no tiene ni más relleno del que tiene.
2. **Escribir un número a mano**: precios, puntos y la regla del grupo se interpolan del código.
   El resto (ganchos, diálogos, chistes) sí se escribe.
3. **Contar qué lleva el menú secreto** ni nombrar mecanismos apagados. Del secreto se habla en
   pedidos: «se desbloquea pidiendo».
4. **Mostrar a un cliente**: el pedido raro va sin nombre, sin teléfono, sin dirección, sin
   fecha exacta.
5. **Burlarse de lo que alguien pidió.** WICHO lo celebra; SANDO lo juzga en silencio. Nadie se ríe
   del cliente.
6. **Teñir la comida** con el color de un hermano (error real del 2026-09-17).
7. **Identidad regional.** El `//` va donde sume, no siempre (dueño, 2026-10-07).

## 5 · Cómo se arma un episodio (15–20 s)

| tramo | qué pasa |
|---|---|
| **0–1.5 s · el gancho** | El conflicto ya empezado, en imagen: WICHO con seis salsas, SANDO con una. La primera línea de diálogo cae aquí. Nada de logos, nada de presentación. |
| **1.5–12 s · la escalada** | Dos o tres intercambios. Cada uno sube un poco. |
| **12–16 s · el remate** | La foto real del sándwich, con una línea (de SANDO, de WICHO o de MAFE) y el precio interpolado. |
| **16–18 s · el cierre** | Dónde pedirlo, con su `?src=` propio. |

**Siempre con subtítulos grandes**: la mayoría empieza a mirar sin sonido. **Si se puede, en
bucle**: que el último cuadro empalme con el primero, así se ve dos veces.

## 6 · Los formatos fijos (martes a domingo, uno por día; lunes no se publica)

| formato | frecuencia | de dónde sale | qué se mide |
|---|---|---|---|
| **El pedido raro de la semana** (aprobado por el dueño) | 1 por semana, el domingo | el armado más inusual de los pedidos reales de la semana, sin datos del cliente | pedidos que usan el armador desde ese enlace |
| **Los hermanos** (conflicto) | 2 por semana | un tema de la carta: salsas, 15 o 30, el grupo, el secreto | pedidos por `?src=` |
| **Para cuándo** | 2 por semana, a su hora | la frase de situación de cada pitch (abajo) | pedidos en esa franja |
| **Se acabó** | solo cuando pasa | el inventario real del día | — (es urgencia verdadera) |
| **La pregunta** | 1 por semana | WICHO pregunta, los comentarios eligen el próximo pedido raro | comentarios |

**Para cuándo**, sacado de los pitches reales:

| Signature | la situación (frase de la carta) | cuándo se publica |
|---|---|---|
| Turkey | «el almuerzo que no te tumba la tarde» | martes a viernes, 11:30 |
| Classic Tuna | «se come con una mano, en el escritorio» | martes a viernes, 12:00 |
| Meatball Marinara | «la noche en que ya decidiste no cocinar» | viernes y sábado, 19:00 |
| Philly Cheesesteak | «cuando el hambre va en serio» | sábado y domingo, 13:00 |
| Italian Hoagie | «cuando quieres de todo en un solo pan» | domingo, 13:00 |

## 7 · Diez ganchos para el primer mes

Entre llaves, lo que se interpola. Ninguno se publica sin pasar por el Revisor.

1. **La sexta salsa** — WICHO, con seis botellas: «Le pongo todas. Todas.» SANDO, con una: «Uno.»
2. **¿15 o 30?** — WICHO: «El de 30, obvio.» SANDO no contesta: pone los dos panes uno al lado del
   otro. Remate: {precio 15} y {precio 30}.
3. **El pedido raro** — WICHO, leyendo un papel: «Alguien pidió esto ayer… y lo voy a respetar.»
   Remate: «Arma el tuyo».
4. **La oficina** — WICHO entra con una lista que arrastra por el suelo: «Somos seis. Bueno, siete.»
   SANDO: «Organízalo tú.» Remate: desde {organizadorDesde} sándwiches, quien organiza se lleva
   gratis el 15CM más barato (`_shared/dinero.ts`; el menú secreto no entra).
5. **La puerta** — WICHO pegado a una puerta cerrada: «¿Qué hay ahí?» SANDO: «Pedidos.» Remate:
   «Se desbloquea pidiendo».
6. **La tarde** — WICHO dormido sobre un escritorio a las tres. SANDO deja un Turkey a su lado:
   «Otro día.» Remate: el almuerzo que no te tumba la tarde.
7. **Una mano** — WICHO intenta escribir y comer con las dos manos a la vez. SANDO, con una mano:
   «Así.» Remate: Classic Tuna.
8. **No cocinas** — La cocina del cliente, luz fría, olla vacía. Entra la bolsa. Ni una palabra.
   Remate: Meatball Marinara.
9. **El último** — WICHO llega corriendo; SANDO sostiene el último del día. Solo si el inventario
   real se agotó ese día.
10. **Ya terminé** (debut de MAFE, **más adelante**) — los dos discuten; MAFE deja la
    botella en la mesa: «Ya terminé.» Y se va.

## 8 · Cómo se produce y cómo se decide qué sigue

- **Guion**: una rutina de Claude (creada desde claude.ai → Rutinas, con repo y Supabase) elige
  el formato del día con esta tabla, escribe el guion con esta biblia y deja las tomas en
  `marketing_flow_cola`.
- **Tomas**: Flow en la laptop del dueño, con los personajes y las voces fijas.
- **Montaje**: GitHub (`scripts/video-auto/`) une las tomas, pone subtítulos, la foto real, el
  precio y el cierre.
- **Revisor y publicación**: lo que ya funciona.
- **Qué sigue**: cada formato lleva su prefijo de `?src=`. Tras 4 episodios, un formato que no
  trajo pedidos baja de frecuencia; el que más trajo sube y su mejor episodio pasa a la pauta
  del 27 de octubre.

## 9 · Lo que falta para el primer episodio

1. **Tu visto bueno** a esta biblia (o lo que cambies).
2. **El MCP de Flow en tu laptop** (`docs/FLOW_EN_TU_LAPTOP.md`; para voces fijas,
   `felipedamacenoteodoro/mcp-google-flow`).
4. **El token de la página** (P33), para que lo publicado salga solo.
