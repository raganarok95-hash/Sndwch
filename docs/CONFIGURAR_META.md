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

### A1. Consigue el ID del píxel

1. Entra a **[Administrador de Eventos](https://business.facebook.com/events_manager2)**
   (Events Manager) con la cuenta que administra tu negocio.
2. Si ya tienes un píxel/conjunto de datos creado, selecciónalo. Si no: **Conectar orígenes de
   datos → Web → Píxel de Meta**, ponle un nombre (ej. `SND//WCH web`).
3. El **ID** es un número largo que aparece bajo el nombre del conjunto de datos. Cópialo.

**Ese número es `META_PIXEL_ID`.** Es público por diseño — cualquiera puede verlo en el HTML de
cualquier sitio que use un píxel, así que no es un secreto que proteger.

### A2. Genera el token de Conversions API

1. En el mismo conjunto de datos: **Configuración** (Settings).
2. Baja hasta **API de Conversiones** → **Generar token de acceso**.
3. Cópialo apenas aparezca. **Meta no te lo vuelve a mostrar** — si lo pierdes, generas otro.

**Ese texto largo es `META_CAPI_TOKEN`.** Este **sí** es secreto: nunca sale del servidor.

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

## Lo que hay que decidir ANTES de prender la medición

**La Política de Privacidad no menciona que se comparten datos con Meta.** Aunque todo va
hasheado con SHA-256 y nunca en claro, igual se comparten identificadores de clientes con un
tercero, y la **Ley 29733** de protección de datos personales exige transparencia sobre eso.

No toqué el texto legal porque **modificarlo requiere que tú lo pidas explícitamente**. Es una
frase, pero es tu decisión y es previa a activar los secrets en producción. Si quieres, la
redacto y me dices si va.

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
