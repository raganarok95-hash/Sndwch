# Marketing automático — análisis desde cero (2026-10-07)

Dueño: «Realmente necesito que mejoremos esto, reestructuremos, investiguemos mejor el proceso de
marketing y quiero que sea automático por completo. Analízalo desde cero».

**Estado: propuesta. Nada de esto está construido.** Concepto antes que código (regla 3): las
decisiones del final las cierra el dueño y recién ahí se programa.

---

## 1 · Lo que dicen los datos hoy (base de producción, 2026-10-07)

| qué | cuánto |
|---|---|
| Clientes registrados en total | **1** (el dueño) |
| Pedidos pagados desde que se abrió (1 oct) | **0** |
| Personas en «Avísame cuando abramos» | **1** |
| Publicaciones de Instagram | **0 publicadas**; 12 borradores sin imagen, varios de cosas que ya no existen (plan semanal, hora valle) |
| Reseñas de Google | **0**, y la app nunca le pide una a nadie |
| Gasto en Meta Ads | **S/0** en 30 días (cuenta 221839797); `ad_spend` vacía |
| Medición de visitas | **no existe**: solo se sabe de dónde vino quien se registra (`?src=`) |

**El diagnóstico en una línea:** la app tiene ~30 automatizaciones de retención (segundo pedido,
carrito abandonado, cumpleaños, reactivación…) que trabajan sobre clientes que **no existen**, y
la parte de arriba del embudo —que alguien se entere— dependía de pasos a mano del dueño (subir
fotos, aprobar cada post, cargar el gasto, crear la ficha de Google, avisar a su red). Ninguno
pasó. **No falló el marketing: nunca arrancó.**

`docs/MAQUINARIA_DE_MARKETING.md` (2026-09-12) sigue valiendo como evidencia (qué funciona y qué
es teatro). Lo nuevo de este documento es **cómo se ejecuta solo**.

---

## 2 · Qué se puede automatizar de verdad (por canal)

La regla: **se automatiza lo que tiene API**. Lo demás o se hace una vez, o no se hace.

| canal | ¿automático? | por qué / límite |
|---|---|---|
| **Instagram y Facebook (posts)** | **Sí, 100%** | Graph API con los tokens que ya están. Hasta 50–100 posts por día; consultar `content_publishing_limit` en vez de fijar el número. El cron `auto-publish-calendar` ya publica: le falta quien lo alimente. |
| **Meta Ads** | **Sí, dentro de un tope que pone el dueño** | Marketing API. Desde la v25 las campañas nuevas son Advantage+ (audiencia, presupuesto y ubicaciones automáticas). Optimizar a **Compra** desde el día 1 con Pixel + Conversions API (ya están); una sola campaña y un solo conjunto con presupuesto chico. **Gastar plata real requiere el tope aprobado por el dueño** (regla 8). |
| **Gasto de pauta → freno de CAC** | **Sí** | Hoy el gasto se carga a mano (P1c) y el freno solo AVISA. Se lee solo de Meta cada día y el freno PAUSA solo. |
| **Reseñas de Google** | **Sí, después de una configuración única** | El enlace `search.google.com/local/writereview?placeid=…` se manda solo tras cada entrega. Requiere que la ficha de Google exista y esté verificada (eso lo hace Google con el dueño, no se puede automatizar). ⚠ Google **prohíbe pedir reseñas solo a los contentos** («review gating»): se le pide a todos. |
| **Posts en Google Business** | Fase 2 | La API exige pedir acceso a Google (días a una semana). |
| **TikTok** | **No, por ahora** | Sin auditoría de TikTok (2–6 semanas) todo lo publicado por API queda **privado**. |
| **WhatsApp Estados / difusión** | **No** | Los Estados no tienen API; la API de WhatsApp Business cuesta (P13). Se automatiza el **mensaje listo** con su link, no el envío. |
| **La red del dueño** (P0a) | **No** | Es su teléfono. El sistema le deja cada día el mensaje y el link de lanzamiento listos; enviarlo es un toque suyo. |
| **Referidos** | **Sí** | Ya existe `shareReferral()`. Falta ofrecerlo en el momento correcto (al recibir el pedido). |

---

## 3 · La máquina propuesta: cinco ciclos que corren solos

### A · Contenido (diario, sin el dueño)
Un cron arma cada día el post de mañana:
- **tema** de una rotación fija (un Signature, el armador de WICHO, el pedido en grupo, el menú
  secreto como misterio, y —cuando existan— reseñas reales);
- **texto** generado desde la carta y las reglas del código (nombres y precios **interpolados**,
  nunca escritos: la regla de CLAUDE.md, que ya atrapó 3 errores en el calendario viejo);
- **imagen** de las fotos propias (`img/`, 26 tratadas) con la marca;
- queda `scheduled` y `auto-publish-calendar` lo publica a la hora con más pedidos.
- **El freno del dueño:** el panel muestra los próximos 3 posts con un botón «No publicar». Si no
  lo toca, sale. Automático por defecto, veto opcional.

### B · Pauta (diaria, desde el día 15)
- Una campaña Advantage+ optimizada a **Compra**, Trujillo + radio de reparto, 4–5 creatividades
  de las mismas fotos.
- **Tope diario y tope mensual que fija el dueño una sola vez.** El sistema nunca lo pasa.
- Cada mañana: lee el gasto de Meta → `ad_spend` → calcula CAC. Si el CAC pasa el límite, **pausa
  sola** (el botón de anuncios ya sabe pausar y reanudar lo que pausó) y avisa.
- «Manos quietas»: no edita la campaña en la fase de aprendizaje (cada edición la reinicia).

### C · Reseñas (por pedido)
Al pasar a ENTREGADO: push o correo con el enlace de reseña de Google a **todos**. Quien califica
mal dentro de la app sigue yendo además al flujo de «Algo salió mal», para arreglarlo. Meta del
mes: 50 reseñas, el umbral donde el efecto medido se hace más fuerte.

### D · Referidos (por pedido)
Al confirmar la entrega, la pantalla del pedido ofrece «Pásale tu link» con el premio derivado de
las reglas. Sin subir el premio (la evidencia dice que premio mayor = referidos peores).

### E · Medición (semanal, automática)
- Contador de **visitas por origen** (`?src=`), sin datos personales: hoy no se sabe cuánta gente
  entra y no compra.
- Cada lunes, al dueño: visitas → pedidos → recompra por origen, CAC, reseñas nuevas, qué post
  trajo más visitas. Con los números propios se reemplazan los benchmarks.

---

## 4 · Calendario con la apertura del martes 13

| cuándo | qué corre |
|---|---|
| **Antes del 13** | Borrar los 12 borradores viejos; generar 2 semanas de posts con foto. Ficha de Google creada y verificada (dueño) y su Place ID en la app. |
| **13 → 26 oct (14 días)** | Orgánico (A), reseñas (C), referidos (D), medición (E) y la red del dueño. **Cero pauta**: es la única ventana para saber cuánta gente llega sola (P1b). |
| **Desde el 27 oct** | Pauta (B) con el tope aprobado. |

---

## 5 · Lo que tiene que decidir el dueño

1. **¿Publicación 100% automática, o con el botón «No publicar» como freno?** Recomiendo el freno:
   sale igual si no lo tocas.
2. **Tope de pauta**: cuánto por día y cuánto por mes, y si arranca el 27 de octubre (respetando
   los 14 días sin anuncios). Es plata real: sin este número no se crea ninguna campaña.
3. **Ficha de Google**: ¿ya existe y está verificada? Si sí, con su nombre exacto se saca el
   Place ID; si no, es lo primero que hay que hacer (la verificación la pide Google al dueño).
4. **¿Borro los 12 borradores viejos** del calendario y los reemplaza el generador?

---

## 6 · Fuentes de esta revisión

- Publicación por API en Instagram y sus límites: [Meta · Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing),
  [Instagram API rate limits 2026](https://instantdm.com/blog/instagram-api-rate-limits-explained-2026-developer-guide).
- Advantage+ y la API unificada (v25): [Meta · Advantage+ campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns),
  [PPC Land](https://ppc.land/meta-launches-unified-api-structure-for-advantage-campaigns/).
- Optimizar a Compra con pixel nuevo, una sola campaña: [Shopify Community](https://community.shopify.com/t/new-meta-pixel-with-no-purchase-data-best-optimization-strategy-for-a-new-store/650420).
- Enlace directo de reseña con Place ID: [Dreikon](https://www.dreikon.de/en/news/online-marketing-knowledge/link-to-google-reviews/).
- API de Google Business Profile (acceso por solicitud): [Slashpost](https://slashpost.ai/blogs/google-business-profile/google-business-profile-api-documentation-2026).
- TikTok sin auditoría = privado: [TikTok for Developers · Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post).
- Evidencia de fondo (reseñas, referidos, descuentos): `docs/MAQUINARIA_DE_MARKETING.md`.
