# Configurar Meta — guía paso a paso

**Para hacer en ~30 minutos.** Son **dos cosas independientes** y conviene no mezclarlas:

| | qué desbloquea | prioridad |
|---|---|---|
| **A · Medición** (píxel + Conversions API) | saber tu **CAC real** | **hacer primero** |
| **B · Publicación** (IG/FB automático) | que el calendario publique solo | puede esperar |

**Haz la A completa antes de tocar la B.** La A es el bloqueo número uno del negocio: sin ella
todo el modelo financiero se apoya en CTR y CVR sacados de blogs de agencia, y no hay forma de
saber si el CAC real es S/8 (la meta es alcanzable) o S/25 (no existe).

> ⚠ **La interfaz de Meta cambia seguido.** Los nombres de menú de abajo son los que usa hoy;
> si alguno no aparece igual, busca el concepto (el ID del conjunto de datos, el token de
> Conversions API) en vez de la ruta exacta. Lo que **no** cambia son los nombres de las
> variables que espera el código.

---

## A · Medición — el píxel y la Conversions API

> **Estado al 2026-09-10 — dónde estás parado.**
>
> | | |
> |---|---|
> | `META_PIXEL_ID` | ✅ conseguido: `1571699187700546` |
> | Secret en Supabase | ⬜ **falta ponerlo** (paso A3) |
> | `META_CAPI_TOKEN` | ⬜ **falta generarlo** (paso A2) |
> | Texto legal | ✅ corregido, ya no contradice al píxel |
>
> **Poner solo el `META_PIXEL_ID` ya sirve** — el píxel se prende solo, sin desplegar nada, y
> empiezas a ver PageView y AddToCart el mismo día. Lo que te faltaría es la mitad que los
> bloqueadores se comen, que es justo el `Purchase`. Por eso A2 y A3 van juntos.


### A1. Consigue el ID del píxel

1. Entra a **[Administrador de Eventos](https://business.facebook.com/events_manager2)**
   (Events Manager) con la cuenta que administra tu negocio.
2. Si ya tienes un píxel/conjunto de datos creado, selecciónalo. Si no: **Conectar orígenes de
   datos → Web → Píxel de Meta**, ponle un nombre (ej. `SND//WCH web`).
3. El **ID** es un número largo que aparece bajo el nombre del conjunto de datos. Cópialo.

**Ese número es `META_PIXEL_ID`.** Es público por diseño — cualquiera puede verlo en el HTML de
cualquier sitio que use un píxel, así que no es un secreto que proteger.

### A2. Genera el token de Conversions API

**Tener el ID no activa nada todavía.** El ID solo enciende el píxel del navegador, que es
justo la mitad que los bloqueadores de anuncios se comen. El token de abajo es el que hace que
Meta vea TODAS tus ventas. Este es el paso que sigue, y sin él la medición queda a medias.

Ruta exacta, con los nombres que usa Meta hoy:

1. **[Administrador de Eventos](https://business.facebook.com/events_manager2)** → menú de la
   izquierda → **Orígenes de datos** (Data Sources).
2. Haz clic en **tu dataset** — el que tiene el ID que ya copiaste.
   > ⚠ Desde 2026 Meta ya **no lo llama "píxel" sino "conjunto de datos"** (dataset). Es el
   > mismo objeto, con otro nombre. Si buscas la palabra "píxel" no la vas a encontrar.
3. Arriba de esa pantalla: **Configuración** (Settings).
4. Baja hasta el bloque **API de Conversiones** (Conversions API).
5. Busca **"Configurar manualmente"** (Set up manually / Configurar integración directa) y
   dentro, **Generar token de acceso** (Generate access token).
6. Acepta el diálogo de Meta y **cópialo apenas aparezca**. **Meta no te lo vuelve a mostrar**
   — si lo pierdes, no pasa nada grave: generas otro y el viejo se reemplaza.

**Ese texto largo es `META_CAPI_TOKEN`.** Este **sí** es secreto: trátalo como una contraseña,
nunca sale del servidor y no debe ir a un chat, un correo ni una captura.

> **Si no ves el bloque "API de Conversiones"**, casi siempre es que estás dentro de la cuenta
> personal y no del negocio, o que el dataset todavía no recibió ni un evento. Manda una visita
> a la app primero (con el `META_PIXEL_ID` ya puesto, paso A3) y vuelve: el bloque aparece
> cuando el dataset deja de estar vacío.

### A3. Ponlos en Supabase

La vía más simple, sin instalar nada:

1. Entra al **panel de Supabase** → tu proyecto → **Edge Functions** → **Secrets**
   (o **Project Settings → Edge Functions → Secrets**, según la versión).
2. Agrega los dos, con **exactamente** estos nombres:

```
META_PIXEL_ID     = 1234567890123456
META_CAPI_TOKEN   = EAAG...(el token largo)
```

Si prefieres la terminal y tienes la CLI de Supabase:

```bash
supabase secrets set META_PIXEL_ID=1234567890123456 META_CAPI_TOKEN=EAAG...
```

⚠ **Los nombres tienen que ser idénticos**, en mayúsculas y con guion bajo. El código los lee
por nombre exacto; uno mal escrito no da error, simplemente deja la medición apagada.

### A4. Comprueba que quedó prendido

**No hace falta redesplegar el cliente.** El `META_PIXEL_ID` viaja al navegador dentro de
`get-store-hours`, así que el píxel se enciende solo en cuanto el secret existe.

Tres comprobaciones, de más rápida a más completa:

1. **Abre la app** y mira el código fuente de la página: debe aparecer el script del píxel con
   tu ID. Si no está, el secret no llegó.
2. **Events Manager → Probar eventos** (Test Events): abre la app en otra pestaña, navega y
   agrega algo al carrito. Deberían aparecer `PageView` y `AddToCart` en vivo.
3. **Haz un pedido de prueba real.** Debe llegar **un solo** `Purchase`, no dos: el navegador y
   el servidor mandan el mismo evento con el mismo `event_id` (la referencia del pedido) justo
   para que Meta los una. Si ves dos, avísame — eso sí sería un defecto.

> **Un pedido por Yape/Plin no reporta `Purchase` hasta que tú confirmas el pago** en el panel.
> Es a propósito: si reportara al tocar "ya pagué", Meta optimizaría hacia pedidos que nadie
> pagó. Así que para probar el `Purchase`, confirma el pago del pedido de prueba.

---

## B · Publicación automática en Instagram y Facebook

Esto ya está construido, pero necesita tres datos más. Requisitos previos: una **Página de
Facebook**, una cuenta de **Instagram Business** vinculada a esa Página, y una **app** en
[Meta for Developers](https://developers.facebook.com/).

### B1. Token con los permisos correctos

1. Entra al **[Explorador de la API Graph](https://developers.facebook.com/tools/explorer/)**.
2. Arriba a la derecha elige **tu app**, y en "User or Page Access Token" elige tu usuario.
3. **Agregar permisos**, y marca estos cuatro:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
4. **Generar token de acceso** y acepta el diálogo.

### B2. Consigue el ID de la Página y el de Instagram

Con ese token puesto en el Explorador:

- Consulta `me/accounts` → te devuelve tus Páginas. El campo `id` de la tuya es
  **`META_PAGE_ID`**, y su `access_token` es un **token de Página**.
- Consulta `{PAGE_ID}?fields=instagram_business_account` → el `id` que devuelve es
  **`META_IG_USER_ID`**.

### B3. Convierte el token en uno de larga duración

El token del Explorador **caduca en horas**. Para que no se apague solo, cámbialo por uno de
larga duración con la herramienta **[Depurador de tokens](https://developers.facebook.com/tools/debug/accesstoken/)**:
pega el token, y abajo usa **"Extender token de acceso"**.

Un **token de Página** de larga duración normalmente **no expira** mientras no cambies la clave
ni revoques permisos. Ése es el que va como **`META_PAGE_ACCESS_TOKEN`**.

⚠ **Verifica la fecha de expiración en el Depurador antes de darlo por bueno.** Si dice que
expira en 60 días, guardaste el de usuario y no el de Página — y la publicación se va a apagar
sola dos meses después, sin aviso.

### B4. Ponlos en Supabase

```
META_PAGE_ACCESS_TOKEN = EAAG...(el token de Página, largo)
META_PAGE_ID           = 1234567890
META_IG_USER_ID        = 17841400000000000
```

Mientras falten, el panel te devuelve un **error claro** al intentar publicar; no falla en
silencio y no rompe nada más.

---

## Lo legal ya está resuelto (2026-09-10)

**La Política de Privacidad decía lo contrario de lo que el píxel iba a hacer.** Textual:
*"No vendemos ni compartimos tus datos con terceros para publicidad."* Ya está corregida, y
ahora dice la verdad verificada contra el código:

- **Sí le llegan a Meta**: tu correo, tu teléfono y tu nombre de pila — siempre cifrados con
  SHA-256, nunca legibles —, el monto del pedido sin el delivery, y qué productos llevó.
- **No le llegan**: DNI, fecha de nacimiento, PIN ni dirección de entrega.
- La **IP** sí la ve Meta, pero porque el navegador se conecta a Meta, no porque el servidor
  se la mande. Pasa en cualquier web con publicidad, y el texto lo dice así.

Y como la **Ley 29733** da derecho de **oposición**, avisar no alcanzaba: hay un interruptor
real en **Mi Perfil → Privacidad** que apaga el reporte de esa persona en los dos caminos (el
píxel del navegador y el del servidor). No cambia precios, puntos ni nada de su pedido.

**Ya puedes prender la medición sin que tu app prometa una cosa y haga otra.**

---

## Resumen para llevar

| variable | de dónde sale | ¿secreto? |
|---|---|---|
| `META_PIXEL_ID` | Events Manager → ID del conjunto de datos | no, es público |
| `META_CAPI_TOKEN` | Events Manager → Configuración → API de Conversiones | **sí** |
| `META_PAGE_ACCESS_TOKEN` | Graph Explorer → `me/accounts` → extendido | **sí** |
| `META_PAGE_ID` | Graph Explorer → `me/accounts` | no |
| `META_IG_USER_ID` | Graph Explorer → `{PAGE_ID}?fields=instagram_business_account` | no |

**Si solo alcanzas a hacer una cosa mañana, haz la A.** Es la que convierte la proyección en un
pronóstico en vez de una simulación sobre referencias ajenas.
