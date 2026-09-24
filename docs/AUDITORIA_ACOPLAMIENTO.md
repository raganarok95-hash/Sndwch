# Auditoría: código que depende de un texto en vez de un objeto (2026-09-24)

Pedido del dueño, después de que la carta v4 rompiera decenas de pruebas y chequeos sin que
ninguna regla del negocio hubiera cambiado: *«no solo la carta, debes verificar todo el código
donde hay estos temas, generan errores como los de antes en los cuales perdimos mucho tiempo»*.

## La clase de defecto

Un dato del negocio —un producto, un precio, un umbral, una decisión— escrito como **texto
suelto** en más de un sitio, o una lógica que pregunta por **un código concreto** en vez de por
una **propiedad**. Nada revienta cuando se desalinea: el compilador no lo ve porque para él son
cadenas. Se descubre tarde, y siempre de la misma forma: una prueba o un chequeo que falla por
algo que no cambió, o —peor— un cliente que ve una cosa y paga otra.

Lo que se hizo en esta sesión y hay que dejar de hacer: buscar el daño contando cadenas
(`grep "SIG01"`), arreglarlo reemplazando frases exactas en los archivos, y tomar una oración de
un documento como si fuera un dato (así se escribió «a la plancha» sin que nadie lo hubiera
decidido: no hay plancha).

## Lo medido

| # | Qué | Cuánto | Riesgo |
|---|---|---|---|
| 1 | **Datos del negocio copiados entre cliente y servidor**, sincronizados solo por `parity.mjs`, que lee los dos archivos con 45 expresiones regulares | ~40 clases: carta (proteínas, Signatures, bebidas, nombres, exclusividad, doble), zonas y tarifa de envío, coordenadas de la tienda, horario, rangos, puntos de referido y su escalera, retos, tarjeta de regalo, cola, tope por hora, ventana de entrega, palabras de alerta, comisión de Culqi, bono de bienvenida | Alto: es exactamente lo que rompió la v4 |
| 2 | **La misma carta en una tercera copia**: el modelo en Python (`rentabilidad_por_parte.py`), que `check_costos.py` compara contra `catalog.ts` leyéndolo con regex | 1 copia entera | Alto |
| 3 | **Lógica que pregunta por un código** en vez de por una propiedad | El menú secreto se reconoce por `'SIG05'` en 5 sitios; las recompensas por `'R02'…'R06'` en 3 sitios; el orden de la carta es una lista de códigos | Medio |
| 4 | **Reglas de dinero escritas dos veces**: `rewardWaiver` y `findRewardTargetIndex` de `catalog.ts` repiten lo que ya hace `_shared/dinero.ts` | 2 funciones | Alto (dinero) |
| 5 | **Promesas al cliente con la cifra escrita**: «¡Reto completado! +50 pts» (×2) junto a `CHALLENGE_BONUS_POINTS`, «(S/2)» junto a `REGLAS.salsaExtra`; y en el panel, cifras del modelo («S/5.50», «S/0.48», «S/7.65», «S/17.87») | 4 al cliente, 4 al dueño | Medio: coinciden HOY; se rompen al primer cambio |
| 6 | **Ids que viajan por el HTML como texto** (`onclick="…'"+id+"'…"`), la clase del defecto de `mismoId` | 119 de 225 `onclick`; 59 comparaciones `.id ===` contra 9 `mismoId()` | Medio |
| 7 | **Chequeos de la base que leen SQL con regex** (`check-rpc`, `check-doble-escritura`) teniendo ya un Postgres local con el esquema real, donde `pg_proc` responde lo mismo como objeto | 2 chequeos | Medio: `check-rpc` ya tuvo un punto ciego por esto |
| 8 | **Pruebas con códigos de producto o precios escritos** | ~60 códigos en 20 archivos; 8 precios en 4 | Medio |
| 9 | **Documentos tomados como dato** | `RECETARIO.md` da por hecha la plancha (3 pasos) y sigue nombrando Signatures retirados | Bajo en código, alto en operación |

Defecto vivo encontrado y ya corregido: el panel de video caía a `'SIG01'` si no había Signature
elegido — un producto que la carta v4 retiró.

## El plan, en orden

Cada paso reemplaza una copia por **un objeto con tipo** que importan los dos lados, igual que
se hizo con el dinero (`_shared/dinero.ts`, paso 3 de la revisión de la base). El compilador
pasa a ser el chequeo; `parity.mjs` se achica a medida que sus comparaciones dejan de tener dos
lados que comparar.

1. **La carta única** (aprobada): `supabase/functions/_shared/carta.ts` con proteínas, panes,
   vegetales, quesos, salsas, bebidas y Signatures, cada uno con sus propiedades (`secreto`,
   `soloEnSignature`, `estrella`, `orden`, `sinDoble`…). La usan `catalog.ts`, el cliente (por la
   base nueva, como el dinero) y las pruebas; el modelo en Python lee una exportación a JSON que
   un chequeo mantiene al día. Resuelve 1 (la parte de carta), 2 y 3 (secreto y orden). Encima
   se carga la v4 en la base.
2. **Las recompensas como objeto**: cada una con su `tipo` (salsa, subir a 30, doble, bebida,
   sándwich). El dinero decide por el tipo, no por el código; se borran las dos funciones
   duplicadas de `catalog.ts`. Resuelve 3 (recompensas) y 4.
3. **Las reglas del negocio compartidas** (`_shared/reglas.ts`): envío, tienda, horario, rangos,
   referidos, retos, tarjeta de regalo, cola, entrega. Los textos interpolan de ahí. Resuelve el
   resto de 1 y 5.
4. **Los chequeos de la base contra la base**: `check-rpc` y `check-doble-escritura` preguntan
   a `pg_proc` del Postgres local en vez de leer migraciones con regex. Resuelve 7.
5. **Las pruebas que quedan**: códigos y precios a `cartaDeLaApp()` / `tests-api/carta.ts`.
   Resuelve 8.
6. **Los ids por HTML** se resuelven solos al migrar cada pantalla a la base nueva (lit-html
   pasa el objeto, no el texto: ver `src/nuevo/pantallas/fijo.ts`). Hasta entonces, `mismoId()`.
7. **Los documentos**: `RECETARIO.md` sin plancha y sin productos retirados. Regla nueva: una
   decisión del dueño entra al código solo si está anotada en `docs/DECISIONES.md` con su fecha;
   una frase en otro documento no es una decisión.
