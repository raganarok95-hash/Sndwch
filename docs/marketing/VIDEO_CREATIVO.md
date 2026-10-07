# Video creativo: de «foto con adornos» a una serie (propuesta, 2026-10-07)

Dueño, tras ver el primer video automático: «¿Por qué usaste cada elemento? Ese video es una foto
nada más con adornos, seamos más creativos». Tiene razón, y es la misma crítica de la v3
(«te estás limitando solo a imágenes que ya tienes, falta la parte creativa»): la repetí.

**Estado: propuesta. Concepto antes que código: nada de esto se construye hasta que elijas.**

---

## 1 · Por qué cada elemento del video actual (y por qué no alcanza)

| elemento | por qué lo puse | el problema real |
|---|---|---|
| Foto real con zoom lento | La regla: nunca una foto falsa del producto, y la foto es lo único real que hay | Es una diapositiva. Nada pasa |
| Gancho = primera frase del pitch | La regla: ningún texto escrito a mano, todo sale de la carta | Es la descripción de un menú. Nadie para el dedo por «albóndigas cocidas en su marinara» |
| Nombre + ingredientes en chips | Informar qué lleva, con datos de la carta | Es la carta leída en voz baja. Informa, no engancha |
| Sello del precio | El precio decide la compra; sale de la base | Bien, pero llega al segundo 6, cuando ya se fueron |
| SANDO entrando abajo | Que la marca tenga cara | Es un sticker. No hace nada, no dice nada |
| Cierre con `//` y WICHO | Marca y enlace | Bien como firma, mal como único momento de los hermanos |
| Audio en silencio | Algunas redes rechazan video sin pista de audio | **El peor error**: el video corto se mira con sonido |

El fallo de fondo: elegí cada pieza preguntando **«qué dato tengo»** y no **«por qué alguien dejaría
de deslizar»**. Salió un catálogo animado. En Reels y TikTok gana lo que tiene **tensión en el
primer segundo, personajes, voz y un remate**, y lo que se vuelve **serie** (la gente sigue a
personajes, no a fotos de producto).

## 2 · Lo que sí tenemos y no estábamos usando

- **Dos personajes con personalidad opuesta** (`docs/LOS_DOS_HERMANOS.md`): SANDO, el curador
  (párpado pesado, boca cerrada, no grita, la jerarquía la da el tamaño), y WICHO, el que arma
  (espirales en los ojos, boca abierta, exagera, se pasa de la línea). Es la pareja clásica de la
  comedia: **el serio y el caos**. Eso es una serie.
- **Flow con los personajes ya armados**: Veo genera clips de ~8 s **con voz y sonido**, a partir
  de tus personajes. Es la pieza que faltaba (por la cola de la laptop, `docs/FLOW_EN_TU_LAPTOP.md`).
- **Datos reales que son historias**: lo más raro que alguien armó esta semana, lo más pedido, lo
  que se agotó, el pedido grupal más grande, el horario pico. No hay que inventar nada.
- **La regla de la foto se respeta igual**: los personajes y las escenas son ilustración; **el
  sándwich que aparece al final es SIEMPRE la foto real**. El remate es el producto de verdad.

## 3 · La propuesta: «Los hermanos», una serie de 15–20 s

Cada episodio: **un conflicto entre los dos** (0–2 s) → **la discusión** (2–12 s, voz de Flow) →
**el remate con el sándwich real** (12–17 s) → firma `//` con el enlace y su `?src=`.

Episodios que salen de la carta y de los datos (el guion lo escribe Claude cada día; los números
se interpolan, nunca se escriben):

| episodio | conflicto | remate real |
|---|---|---|
| **La sexta salsa** | WICHO quiere ponerle todas las salsas. SANDO sostiene una sola | La foto del Signature que lleva la combinación justa |
| **¿15 o 30?** | WICHO: «el de 30, obvio». SANDO hace la cuenta en silencio | Los dos precios reales y cuánto más trae el de 30 |
| **Alguien pidió esto** | WICHO lee en voz alta el armado más raro de la semana (dato real). SANDO lo mira | «¿Te atreves?» y el armador abierto |
| **La oficina** | WICHO llega con la lista de 6 compañeros. SANDO: «organízalo tú y el tuyo sale gratis» | La regla del grupo, derivada del código |
| **Lo que no se ve** | WICHO intenta adivinar el menú secreto; SANDO no dice nada | «Se desbloquea pidiendo». Sin nombrar lo que hay dentro |
| **Se acabó** | WICHO llega tarde al último Philly del día (inventario real) | «Mañana a las 11» |

Formatos de apoyo, que alternan con la serie, para no quemarla:
- **La pregunta del día** (WICHO pregunta, los comentarios eligen el armado del próximo episodio).
- **El corte `//`**: la transición de marca. Las dos barras cortan la pantalla en diagonal y
  aparece la foto real. Es el momento reconocible de todos los videos.

## 4 · Cómo se produce solo

1. **Guionista** (rutina de Claude creada desde claude.ai → Rutinas, con repo y Supabase): elige
   el episodio por datos y rotación, escribe 2–3 tomas con diálogo y deja los encargos en
   `marketing_flow_cola`.
2. **Flow en tu laptop**: genera las tomas con tus personajes, con voz y sonido.
3. **Editor** (GitHub, ya existe la base en `scripts/video-auto/`): une las tomas, subtítulos
   grandes (la mayoría mira sin sonido al inicio), el corte `//`, la foto real, precio y cierre.
4. **Revisor** (ya funciona): precio, stock, repetición. **Publicador** (ya funciona en cuanto
   pegues el token, P33).

Si la laptop está apagada, ese día sale un formato de respaldo: los personajes en imagen fija
(Canva, con sus referencias) con voz sintética y el corte `//`. Peor que Flow, pero mejor que la
foto con adornos.

## 5 · Lo que te pido decidir

1. ¿Va «Los hermanos» como formato principal? ¿O prefieres otro tono (más absurdo, más seco, más
   de reto)?
2. Las voces: ¿cómo suena cada uno? Propuesta: **SANDO** grave, lento, pocas palabras;
   **WICHO** rápido, agudo, se ríe de sus propias ideas.
3. El piloto: lo armo con «La sexta salsa» (primer cuadro de prueba, con los personajes de
   referencia: Canva, media `MAHXWAXwk8o`). Para hacerlo con Flow necesito el MCP de Flow en tu
   laptop (`docs/FLOW_EN_TU_LAPTOP.md`); sin él, hago el piloto en la versión de respaldo.
