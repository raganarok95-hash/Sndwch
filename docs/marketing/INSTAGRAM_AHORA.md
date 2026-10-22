# Instagram ahora, hasta abrir en noviembre (2026-10-22)

Dueño: «Al revés: prioridad Instagram, es lo que puedo hacer ahora. Lo demás sí límpialo. Ve qué
mejorar, ver cómo más hacer».

**El trabajo de Instagram antes de abrir**: que el día 1 haya gente esperando. Se mide en
seguidores y, cuando exista (punto 6), en cuántos dejan su WhatsApp para que les avisemos.

## 1 · Arreglar el token para que el sistema publique solo (~10 minutos, lo haces tú)

Verificado el 2026-10-21 contra Meta: el token de `sndwch-bot` en Supabase **no trae los permisos
de Instagram** (`instagram_basic`, `instagram_content_publish`) ni el de publicar en la página
(`pages_manage_posts`). Además, **la cuenta publicitaria no ve ningún Instagram vinculado**, y sin
eso los anuncios no pueden salir en Instagram cuando se prendan.

1. **business.facebook.com/settings → Cuentas → Cuentas de Instagram.** Tiene que estar
   @snd__wch; si no está, **+ Agregar**.
2. Con @snd__wch elegido: **Asignar activos** (o «Conectar activos») → la **cuenta publicitaria**
   1488138326460689 y la página Snd//wch.
3. **Usuarios → Usuarios del sistema → `sndwch-bot` → Asignar activos → Cuentas de Instagram →
   @snd__wch → Control total.**
4. En `sndwch-bot` → **Generar token**: app `SNDWCH`, vence **Nunca**, y marca
   `instagram_basic`, `instagram_content_publish`, `pages_manage_posts`, `pages_show_list`,
   `pages_read_engagement` y `business_management`. Si los de Instagram no salen en la lista:
   developers.facebook.com → app `SNDWCH` → **Casos de uso → Agregar** → el de administrar
   contenido de Instagram, y repites este paso.
5. **Supabase → Edge Functions → Secrets → `META_PAGE_ACCESS_TOKEN`**: pegas el token nuevo.
   Nunca por chat.
6. Me avisas y corro «Estado para abrir»: dice si ya puede publicar o qué permiso falta.

## 2 · El perfil, hoy

- **Biografía** (la pegas tal cual):
  > Sándwiches de pan largo, al estilo americano. Armados al momento, a domicilio.
  > Abrimos en noviembre.
- **Enlace**: `sndwch.app/?src=ig_bio`. Con el `?src=` sabemos cuántos llegaron desde la bio.
- **Historias destacadas**: Carta · Cómo pedir · Bebidas · Dónde llegamos.
- **Fijar 3 publicaciones** arriba: la carta, cómo se pide y la de «abrimos».
- **Botón de WhatsApp** en el perfil (Editar perfil → Botones de acción).

## 3 · Tres publicaciones listas para subir hoy

En `docs/marketing/instagram-preapertura/`: las 3 piezas ya trabajadas (Philly, Meatball y Turkey),
con «Abrimos en noviembre» en lugar de «Pide en sndwch.app», porque hoy la app todavía no toma
pedidos. A la Meatball se le quitó la firma «— SANDO»: los hermanos no salen hacia afuera. Vienen
en dos formatos: `-feed` (publicación, 4:5) y `-vertical` (historia, 9:16).

Textos, fieles a la carta y sin precios:

- **Philly**: «Hambre en serio. Philly Cheesesteak: res laminada que se saltea al momento con
  cebolla y pimiento, y cheddar fundido encima. Abrimos en noviembre: síguenos para saber el
  día.»
- **Meatball**: «Hoy no cocinas. Meatball Marinara: albóndigas cocidas en su propia marinara,
  queso derretido y un pan que aguanta todo el jugo. Abrimos en noviembre.»
- **Turkey**: «El almuerzo que no te tumba la tarde. Turkey: pavo horneado en lonjas finas,
  lechuga, tomate, cebolla, pimiento y un toque de aceite y vinagre. Abrimos en noviembre.»

## 4 · Hasta abrir: 3 publicaciones por semana e historias cada día

- **Detrás del pan** (lo que mejor funciona y solo tú puedes grabar): clips de 10–15 segundos
  cortando el pan, laminando la res, la plancha y el armado. Que la comida se vea en los
  primeros 2 segundos.
- **La carta**, un Signature por publicación. Faltan Tuna Melt, Italian Hoagie y Classic Tuna.
- **Encuestas en historias**: «¿Cuál pruebas primero?». Las haces a mano: la API no publica
  stickers.
- **Las bebidas nuevas**, cuando estén probadas: un adelanto.
- **Cuando haya día**: el sticker de cuenta regresiva.

## 5 · Cómo hacer más sin pagar

- **Creadores de comida de Trujillo**: 3 a 5 cuentas chicas (5–30 mil seguidores) que prueben la
  carta antes de abrir, a cambio de los sándwiches. Que publiquen en **colaboración** (la
  publicación sale en las dos cuentas). Es lo que más alcance trae sin anuncios.
- **No hagas un sorteo al azar**: en Perú las promociones con sorteo están reguladas por el
  Ministerio del Interior y piden autorización previa. Lo que no es al azar no la pide: por
  ejemplo, «los primeros 30 pedidos del día 1 llevan bebida».
- **Responder cada comentario y mensaje en menos de 1 hora**: ayuda al alcance y a vender.
- **El mismo video, también en TikTok** (P45) y en Facebook.
- **Tu red** (P0a) y **embajadores** (P49), con sus enlaces.

## 6 · ~~«Avísame cuando abran» en la app~~ — no (dueño, 2026-10-22: «No, porque nadie llega desde Instagram»)

Hoy, quien llega desde Instagram ve «Aún no abrimos» y **no tiene dónde dejar su contacto**: la
lista de espera se retiró de la app y solo tiene 1 inscrito, del 13-sep. **Propuesta**: un botón
«Avísame cuando abran» en esa pantalla (WhatsApp o celular) y, el día 1, un aviso a todos. Es lo
que convierte seguidores en primeros pedidos.

## 7 · El modo de preapertura — aprobado (dueño, 2026-10-22: «eso sí») y hecho

Hoy todo lo automático está frenado hasta que haya día de apertura. **Propuesta**: un modo de
preapertura en el que el sistema publica solo lo que no invita a pedir (la carta, detrás del pan,
«abrimos en noviembre») con el calendario de la agencia, y deja en espera lo que dice «pide hoy».

**Cómo quedó**:
- `enPreapertura()` e `invitaAPedir()` (`scripts/video-auto/reglas-del-revisor.mjs`, con pruebas).
- `historias.mjs --final` programa las historias que no invitan a pedir, y deja fuera las que sí
  invitan o nombran un día que todavía no existe.
- El video del día sigue esperando, porque dice «Pídelo hoy».
- La agencia (`agencia-semana` §2, `brief-sndwch`) arma la semana para preapertura.
- Empieza a publicar cuando el token tenga permisos (§1).
