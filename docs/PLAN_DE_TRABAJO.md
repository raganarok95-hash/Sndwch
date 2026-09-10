# SND//WCH — plan de trabajo (2026-09-10)

Apertura: **segunda semana de octubre**. Quedan ~4 semanas.

Todo lo de abajo está ordenado por lo que le cuesta al negocio si no se hace, no por lo que
es más fácil o más lindo.

---

# PARTE 1 · LO TUYO

## 🔴 Esta noche, si solo haces una cosa

### T1 · Los dos secrets de Meta

**Es el bloqueo número uno del negocio.** Sin esto, el CAC —cuánto cuesta traer un cliente—
sale de blogs de agencia, no de tu medición. Todo el modelo financiero cuelga de ese número,
y ninguna decisión de publicidad se puede evaluar hasta tenerlo.

1. `META_PIXEL_ID = 1571699187700546` → panel de Supabase → **Edge Functions → Secrets**.
2. `META_CAPI_TOKEN` → generarlo primero: Administrador de Eventos → **Orígenes de datos** →
   tu dataset → **Configuración** → **API de Conversiones** → *Configurar manualmente* →
   **Generar token de acceso**.

Paso a paso completo en `docs/CONFIGURAR_META.md`, con la ruta que Meta usa hoy y qué hacer
si no ves ese bloque.

> ⚠ Desde 2026 Meta ya **no lo llama "píxel" sino "conjunto de datos"**. Buscando la palabra
> "píxel" no vas a encontrar nada.

**Lo legal ya no lo bloquea.** La Política de Privacidad se corrigió y hay un interruptor
real de oposición, así que puedes prenderlo sin que la app prometa una cosa y haga otra.

---

## 🟡 Esta semana

### T2 · La restricción `www` de la key de Google

Google Cloud → Credenciales → tu key → **Restricciones de sitios web**. Tiene que decir
exactamente `https://www.sndwch.app/*`, como línea aparte de la de `sndwch.app/*`.

Lo probé y sigue bloqueado. Si tu dominio ya redirige `www` al principal esto no le afecta a
nadie, pero desde acá no puedo comprobar esa redirección — el proxy de este entorno bloquea
tu dominio.

### T3 · Las imágenes de los hermanos, en grande

`docs/PROMPTS_PERSONAJES.md` tiene las fichas listas para pegar. Tres reglas que evitan
rehacer todo:

- **Cada hermano contra SU PROPIA referencia** (`sando_sonrie.png` / `wicho_rie.png`). Nunca
  contra la del otro: son distintos a propósito y esa diferencia es el concepto.
- **2048×2048, PNG con fondo transparente.**
- **Sin fleco blanco alrededor del contorno.** Las que ya tenías traían halo de recorte
  (`sando_cuerpo` tenía 18% del borde en blanco) — se lo quité, pero es mejor que no venga.

**Pídeme primero esta**, antes que las 10 poses: los dos hermanos con el mismo sándwich
partido, cada uno con su mitad y un hueco entre las dos. Ese hueco es el "//". Sirve para el
hero, para Instagram y para la tarjeta del QR de la bolsa.

### T4 · Las 8 fotos de Signature, en grande

Son de 640 px y la tarjeta ocupa ~1050 px reales: se estiran ~60% y por eso se ven blandas.
**Mínimo 1600 px de ancho.** Si las vuelves a sacar de banco de imágenes, busca las ocho con
el sándwich llenando el cuadro y sin escenografía (sin platos decorados, sin manteles, sin
botellas de fondo) — es lo que hace que ocho fotos ajenas se lean como una sola casa.

---

## 🟢 Cuando puedas

| | Qué | Por qué |
|---|---|---|
| T5 | **Una captura real de una constancia de Yape** (tapa lo que quieras menos los rótulos) | El lector de comprobantes funciona pero sus rótulos nunca se verificaron contra una constancia real. Con una captura tuya lo ajusto en una línea |
| T6 | **Leer los 8 textos de marketing** (panel → MARKETING) antes del primer post | Son promesas públicas y quien las firma eres tú |
| T7 | **Revisar la vida útil real de cada insumo** en el panel de Inventario | Hoy arrancan todos en 3 días, que es el extremo conservador de la guía USDA para carne cocida — no una medición de TUS recetas. Un encurtido aguanta mucho más, y dejarlo en 3 hace que la alarma suene por comida buena |
| T8 | **Cotizar pavo al por mayor** | Hoy el precio sale del retail de Braedt. Ojo: Sigma Alimentos es dueño de Braedt, Otto Kunz y La Segoviana a la vez — entre esas tres no hay competencia real de precio. Los independientes son San Fernando y Laive; Makro tiene local en Trujillo |
| T9 | **Los 3 secrets de publicación** (`META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`) | Para que el calendario publique solo en IG/FB. Puede esperar: la medición (T1) vale mucho más |

---

# PARTE 2 · LO MÍO

## Ya hecho hoy

- El **"//" bicolor variante C** — una barra por hermano, fino y plano.
- **SANDO ya no sale decapitado** en la home: se dimensionaba por ancho, y su proporción lo
  hacía medir 246 px en un contenedor de 212 con `overflow:hidden`. Ahora por altura.
- **El rótulo ya no cae sobre el cuerpo** del hermano — el velo subió a 62% y con tres paradas.
- **Fuera el halo de recorte** de las 5 imágenes que lo traían.
- **"Build your own bite"** era el único texto en inglés de la app, justo bajo el nombre del
  negocio → "Sándwiches hechos acá".
- **"Delivery desde S/6 según tu zona"** prometía un cobro por zona que se retiró hace una
  semana → ahora dice la distancia y lee las constantes reales.

## Lo que sigue, por orden

> **Corregido el 2026-09-10 tras revisar el estado real** en vez de arrastrar lo que la
> lista decía. Tres puntos de la versión anterior estaban **mal**: decían pendiente algo
> que ya estaba hecho. Se marcan abajo.

### ~~2 · Las pantallas que faltan de la dirección visual~~ → YA ESTÁN

**Era falso.** La lista decía que perfil, reclamos, tarjeta de regalo y pedido grupal
"siguen con el diseño anterior". Se capturaron las cuatro: todas tienen el wordmark nuevo,
la tipografía, la paleta y los componentes de la dirección. De 27 pantallas del cliente, 11
usan helpers de la dirección y el resto ya está sobre la misma base visual.

Lo único que sí quedó flojo, y se ve de un vistazo: **la tarjeta de regalo es dos campos y
un botón en una pantalla entera**, con dos tercios de espacio muerto. No es que le falte la
dirección — le falta contenido.

### ~~3 · Los estados vacíos~~ → PARCIALMENTE HECHO

El helper `VACIO()` existe y ya lo usan Mis Pedidos, Pedido Fijo, Favoritos y Direcciones.

Lo que sigue faltando son los estados de **espera y de rechazo**, que son otra cosa: pedido
en camino, tienda cerrada, dirección fuera de cobertura, menú secreto bloqueado. **Dependen
de las poses de T3** — sin las imágenes no hay nada que poner ahí.

### ~~5 · Extraer el cálculo puro de `orders.ts`~~ → EN BUEN ESTADO

La lista lo daba como deuda abierta. El backend tiene hoy **305 pruebas en 26 archivos**, y
los cálculos que importan ya están extraídos y probados: `batchExpiryStatus`, `prepShortfall`,
`queueAddressFlags`, `cashClose`, `orderMargin`, `cancellationDeltas`, `deriveCart`,
`pointsFor`. Queda como higiene continua, no como tarea pendiente.

---

### Lo que de verdad queda, en orden

**1 · Llenar la pantalla de tarjeta de regalo.** Es la más vacía de la app y además es una
palanca de crecimiento: regalar saldo trae un cliente nuevo sin costo de adquisición.

**2 · Los estados de espera y rechazo** — en cuanto lleguen las poses de T3.

**3 · Anclar el brief semanal a ocasiones (CEP).** Hoy el contenido rota por Signature; las
personas no compran "The Original", compran *almuerzo de oficina*, *antojo de noche*,
*fin de semana en casa*. Nunca se empezó.

**4 · Campaña de anuncios lista para aprobar, con freno por techo de CAC.**
**Bloqueada por T1**: un freno por CAC no tiene contra qué frenar hasta que el CAC se mida.

**5 · Cerrar la auditoría con un entregable.** La tarea "auditar qué automatizar, qué mejorar
y qué ya no sirve" no tiene forma definida, y así no se termina nunca. Se cierra como un
documento con la lista de lo que se retiró, lo que se automatizó y lo que se decidió no
tocar — o se borra.

## Lo que NO voy a hacer, y por qué

- **Unificar el estilo de los hermanos.** Son distintos a propósito: SANDO cura los
  Signatures y su línea está cerrada; WICHO es ARMA EL TUYO y la suya es suelta.
- **Pasar el mapa a Google.** Los tiles de OpenStreetMap son gratis y arrastrar el pin ya
  funciona bien. Google cobraría por cada apertura del mapa sin resolver nada.
- **Degradar ARMA EL TUYO para empujar la mezcla hacia Signatures.** Es la mitad de la
  identidad de la marca; esconderlo rompería el producto para ganar céntimos.
- **Tocar el texto legal sin que lo pidas.** Lo de la Política de Privacidad se hizo porque
  lo pediste explícitamente.
