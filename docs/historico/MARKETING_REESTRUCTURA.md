# SND//WCH — Reestructurar el proceso de marketing

**2026-09-07.** Pedido del dueño: *"aprende primero a ser un experto en marketing y luego
analiza todo el proceso e indícame cómo lo reestructuramos"*.

Este documento NO repite `MARKETING_PLAN.md` (18 secciones, 4 rondas de investigación táctica)
ni `MARKETING_HALLAZGOS.md` (10 investigaciones etiquetadas por nivel de respaldo). Lo que
agrega es **la capa que falta: la estratégica** — y el diagnóstico incómodo que sale de
aplicarla al proceso que ya existe.

---

## 1 · El marco que faltaba

Todo el marketing de este repo está construido sobre tácticas (qué publicar, cuándo, con qué
gancho). Lo que no está es **la ciencia de cómo crecen las marcas**, que lleva 40 años medida
y contradice varias cosas que el proyecto está haciendo.

### Las marcas crecen por PENETRACIÓN, no por lealtad

Ehrenberg-Bass (Byron Sharp, *How Brands Grow*): una marca crece consiguiendo **más
compradores**, sobre todo **compradores ligeros** —los que compran poco y rara vez—, no
haciendo que los fieles compren más. La lealtad es consecuencia del tamaño, no su causa.

**Esto es un problema directo para SND//WCH**, porque casi toda la maquinaria construida
apunta al lado contrario:

| mecanismo | a quién apunta |
|---|---|
| Programa de puntos | al que ya compró |
| Rangos (NUEVO → MESA FUNDADORA) | al que ya compró varias veces |
| Menú secreto (3 pedidos) | al que ya compró 3 veces |
| Escalera de referidos | al que ya compró y además convence |
| Plan Semanal | al que ya decidió que va a volver |
| 10 crons de recordatorio | a clientes que ya existen |

Es una máquina de retención muy bien hecha **para un negocio que todavía no tiene a quién
retener**. Y la propia investigación del repo ya lo había encontrado sin sacar la conclusión:
Leenheer et al. (IJRM 2007) mide que **solo ~14% de la diferencia entre socio y no socio es
influencia real del programa**, y que **el reconocimiento no tiene efecto medible** — o sea,
los RANGOS.

### Disponibilidad mental y los momentos de entrada a la categoría

Lo que hace que una marca se compre es que **venga a la cabeza en el momento en que aparece la
necesidad**. Sharp y Romaniuk lo desagregan en **Category Entry Points (CEP)**: las ocasiones
concretas que disparan la categoría — *"no quiero cocinar"*, *"almuerzo en la oficina"*,
*"antojo de noche"*, *"vienen visitas"*, *"quiero algo que no sea pollo a la brasa"*.

**Una marca crece conectándose a MÁS ocasiones.** Y para una marca nueva, los CEP que ningún
competidor ocupó son justamente donde hay espacio.

> **SND//WCH no tiene ni un CEP definido.** Todo el contenido —los cinco formatos, los ocho
> temas semanales— habla **del producto y de los hermanos**. Ninguno habla del **momento** en
> que alguien tiene hambre. Un video sobre lo bueno que es el sándwich compite por atención;
> un video anclado a "son las 9 de la noche y no vas a cocinar" compite por **memoria**, que es
> lo que se cobra después.

### El 60/40 de Binet & Field NO aplica acá, y saberlo ahorra plata

La regla dice 60% construcción de marca y 40% activación. Pero los propios datos vienen de
campañas con **share of voice medible**, y a nivel de presupuesto de arranque **la proporción
es casi irrelevante**: no estás comprando medios a una escala donde tu voz se distinga.

Cruzado con lo que ya midió `PREDICCION_V12.md` —Meta necesita ~S/3,885/mes solo para salir de
la fase de aprendizaje— la conclusión honesta es dura:

> **La publicidad pagada no es el motor de crecimiento a este presupuesto.** No porque no
> funcione, sino porque el negocio no puede comprar suficiente de ella para que funcione como
> motor. Es un complemento, y el modelo ya lo dijo desde el otro lado: a S/20,000/mes el
> resultado EMPEORA.

---

## 2 · Diagnóstico: qué optimiza el proceso actual y qué no

Lo que está **muy bien construido** (y no hay que tocar):

- Producción de contenido: 8 temas semanales con guion rodable, 5 formatos con personajes
  propios, borradores escritos 4 semanas adelante.
- Publicación: cron cada 15 minutos a Instagram y Facebook.
- Medición: Pixel + Conversions API con deduplicación, y desde ayer las tres palancas medidas.
- Retención: diez automatizaciones, cohortes, escalera de referidos.

Lo que **falta o está mal apuntado**:

### a) La foto de producto — el hueco más caro y el más barato de tapar

La evidencia es fuerte y consistente: menús con foto venden **+44% de volumen de pedidos**
(DoorDash), **+25% de conversión** (Uber Eats), y una encuesta de Google a 600 consumidores
midió que **ver la foto pesa 1.44x más que leer la descripción**.

> ⚠ **Etiqueta honesta:** casi todas esas cifras las publican empresas que VENDEN fotografía de
> comida (Snappr, Claid, Ocus, MenuPhotoAI). Es el mismo sesgo que este repo ya documentó para
> el CAC. La dirección es creíble y coincide entre fuentes; la magnitud exacta, no.

Y acá está el hallazgo concreto:

| ítem | ¿tiene foto? |
|---|---|
| 6 Signatures | ✅ |
| Res, pollo, atún, embutido, albóndiga | ✅ |
| **PAVO (P08)** — la 4ta proteína del armador, agregada ayer | ❌ **ninguna** |
| **The Bloom, The Midnight, The Cool** — las 3 bebidas | ❌ **ninguna** |

Las bebidas son **la parte más rentable del catálogo** (19-32% de costo) y **una de las tres
palancas de la meta** (subir el attach de 25% a 40%). Se venden con un ícono y un texto.

**Respuesta directa a "¿es necesario el proceso fotorrealista?": sí, pero no para los anuncios
— para el MENÚ.** Ahí es donde ocurre la conversión que el modelo dice que es la única entrada
del CAC bajo control propio.

### b) Cero disponibilidad física fuera de la app

Alguien en Trujillo que busca "delivery de sándwiches" hoy **no encuentra a SND//WCH**. No hay
Google Business Profile. Es gratis, y la evidencia de Luca (HBS) sobre reseñas —+1 estrella =
+5-9% de ingresos, causal y **solo para independientes**— es de las más sólidas del lote.

### c) Todo el contenido es sobre la marca, ninguno sobre la ocasión

Los cinco formatos son excelentes construyendo **activo distintivo** (los hermanos son
exactamente lo que Ehrenberg-Bass llama un distinctive asset, y la ficha congelada es la
práctica correcta). Pero ninguno conecta con un **momento de hambre**.

### d) La secuencia está invertida

El negocio automatizó **primero** la retención (10 crons) y **después** va a ocuparse de la
adquisición. Para un negocio que abre en octubre con cero clientes, es al revés.

---

## 3 · Cómo se reestructura

La idea que ordena todo: **el proceso de marketing no es un embudo de contenido, son cuatro
capas, y hoy solo dos existen.**

### Capa 1 · SER ENCONTRABLE (física) — hoy: no existe
Google Business Profile, con fotos y horario. Reseñas pedidas por el link de un solo uso que ya
existe para confirmar entrega. **Costo: S/0.** Es lo primero porque es lo único que trae pedidos
sin pasar por la subasta de Meta.

### Capa 2 · SER RECORDADO (mental) — hoy: a medias
Los hermanos ya son el activo distintivo, y están bien resueltos. Lo que falta es **anclarlos a
ocasiones**: definir 5-6 CEP propios ("no quiero cocinar", "almuerzo de oficina", "antojo de
noche", "vienen visitas", "algo que no sea pollo a la brasa") y que **cada video se rode contra
uno**, no contra un tema de producto. Es un cambio de brief, no de máquina: los 5 formatos y el
calendario se quedan igual.

### Capa 3 · CONVERTIR (la app) — hoy: es donde está la plata y donde falta trabajo
1. **Fotos del pavo y de las 3 bebidas.** El hueco más caro que existe hoy.
2. **Mostrar el envío antes del checkout.** El cliente arma el sándwich, escribe la dirección y
   pone el pin, y recién ahí ve el flete: los costos inesperados al final del embudo son el
   mayor motor de abandono (39%).
3. Duplicar la conversión lleva el CAC de S/17.87 a S/8.94 — el umbral donde la meta pasa a ser
   una moneda al aire.

### Capa 4 · REPETIR Y REFERIR — hoy: sobre-construida
No hay que agregarle nada. Si acaso, **medir si los RANGOS sirven** antes de invertir más ahí:
la evidencia dice que el reconocimiento no mueve la aguja.

---

## 4 · Qué se automatiza y qué no

El pedido era "un proceso completo de marketing automatizado". La respuesta honesta es que
**tres de las cuatro capas no se automatizan, y no es una limitación técnica**:

| capa | ¿se automatiza? | por qué |
|---|---|---|
| Ser encontrable | **No.** Es un trámite de una vez | Crear el perfil de Google es del dueño |
| Ser recordado | **El brief sí, el rodaje no** | Flow no tiene API; y la decisión de qué ocasión atacar es de negocio |
| Convertir | **No.** Es producto | Las fotos y el checkout son trabajo de una vez, no un cron |
| Repetir | **Ya está automatizada** | 10 crons corriendo |

Lo que sí falta automatizar y es real: **el brief semanal debe salir anclado a un CEP** (hoy
sale anclado a un tema de producto), y **la parte pagada debe quedar preparada para aprobar con
un toque, con freno automático por techo de CAC** — que es lo que el dueño ya eligió.

> **La trampa que hay que nombrar:** automatizar más contenido no aumenta ventas si el contenido
> no está anclado a una ocasión y el menú no tiene fotos. Sería producir más rápido algo que
> convierte peor. La secuencia correcta es capa 1 → 3 → 2 → 4, y hoy el proyecto está
> trabajando en la 4.

---

## Fuentes

Sobre fotografía de menú (⚠ mayormente publicadas por proveedores de fotografía):
[Snappr](https://www.snappr.com/enterprise-blog/high-quality-food-photos-can-increase-orders-on-restaurant-delivery-apps-by-35) ·
[MenuPhotoAI](https://www.menuphotoai.com/guides/food-photography-science-research) ·
[Claid](https://claid.ai/blog/article/impact-of-visual-content-on-food-tech) ·
[Ocus](https://www.ocus.com/resources/the-role-of-professional-photography-in-creating-effective-food-delivery-app-menus)

Sobre cómo crecen las marcas:
[Category Entry Points — Quantilope](https://www.quantilope.com/resources/category-entry-points) ·
[How Brands Grow, resumen — Brand Genetics](https://brandgenetics.com/human-thinking/how-brands-grow-part-2-2016-speed-summary/) ·
[Mental availability — Tasmanic](https://www.tasmanic.eu/blog/mental-availability/)

Sobre el 60/40 y por qué no aplica a este presupuesto:
[Growth Method](https://growthmethod.com/long-and-short/) ·
[Marqeable — por qué el 60/40 se rompe en presupuestos de arranque](https://www.marqeable.com/blog/brand-vs-performance-startup-budget/)
