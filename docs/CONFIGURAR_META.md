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

> **Estado al 2026-10-08 — verificado contra Supabase** (workflow «Estado para abrir»).
>
> | | |
> |---|---|
> | `META_PIXEL_ID` | ✅ puesto en Supabase; el cliente lo recibe |
> | `META_CAPI_TOKEN` | ⬜ **falta generarlo y ponerlo** (pasos A2 y A3) — antes de la pauta del 27 |
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

1. Abre directo **[Supabase → Edge Functions → Secrets](https://supabase.com/dashboard/project/rjosezuoyngiadunfzyn/functions/secrets)**.
   > ⚠ **Ahí, y solo ahí** (2026-10-08: el dueño lo puso y no estaba). **No** es Base de datos →
   > Vault, **ni** Project Settings → API, **ni** las variables de Vercel o de GitHub. El código
   > solo lee los secrets de las Edge Functions.
2. **Add new secret** (Agregar secreto). Agrega los dos, con **exactamente** estos nombres:

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

3. Pulsa **Save** (Guardar) y espera a que el secret aparezca en la lista con su nombre. Si
   pegaste el valor y cerraste sin guardar, no quedó.
4. **Avísale a Claude**: corre «Estado para abrir» y te dice si quedó bien **probándolo contra
   Meta** (`verificar-meta`): si el token vale y si puede escribirle a tu píxel, sin registrar
   ninguna venta falsa.

### A3b. El píxel y el token tienen que ser del MISMO conjunto de datos (2026-10-08)

Lo que pasó: el token se generó en el conjunto **«SNDWCH.APP» (`1410494047274081`)**, creado ese
día, pero `META_PIXEL_ID` decía `1571699187700546`, que no es ese conjunto. Y la cuenta de anuncios
`221839797` está conectada a OTRO conjunto, «SNDWCH» (`906727948871849`), que nunca recibió un
evento. La prueba `verificar-meta` lo encontró: el token vale, pero no podía escribirle al píxel.
Cada compra se habría perdido sin ningún error visible.

Se arregla dejando todo en «SNDWCH.APP», que es el del token y vive en tu Business:
1. **Supabase → Edge Functions → Secrets**: edita `META_PIXEL_ID` y pon `1410494047274081`.
2. **Agrega la cuenta de anuncios a tu Business**: [Configuración del negocio](https://business.facebook.com/settings)
   → Cuentas → **Cuentas publicitarias** → Agregar → «Agregar una cuenta publicitaria» → `221839797`.
   (Hoy la cuenta no pertenece a ningún Business.)
3. En la misma configuración → Orígenes de datos → **Conjuntos de datos** → «SNDWCH.APP» →
   **Asignar / conectar recursos** → la cuenta `221839797`.
4. **Método de pago** en la cuenta `221839797` (Meta: no tiene ninguno). Sin él, la pauta del 27
   no arranca.

Después, «Estado para abrir» tiene que decir `✓ CAPI probado contra Meta: token válido, escribe al
píxel: sí`.

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

## B · Publicación automática y respuestas (UN token permanente) — reescrito 2026-10-08

Un solo secret: **`META_PAGE_ACCESS_TOKEN`**. El servidor saca de ahí la página y el Instagram
(`paginaDelToken()` en `api/actions/social.ts`); `META_PAGE_ID` y `META_IG_USER_ID` ya no hacen
falta. El recomendado es el de un **usuario del sistema**, porque **no vence nunca**.

### B1. Ten una app de Meta (una sola vez)
1. Entra a **developers.facebook.com** → **Mis apps** → **Crear app**.
2. Caso de uso: **Otro** → tipo **Empresa** (Business). Nombre: `SNDWCH`. Portafolio comercial:
   el de tu negocio. Crear.

### B2. Crea el usuario del sistema y dale la página y el Instagram
1. Entra a **business.facebook.com** → ⚙ **Configuración** (Configuración del negocio).
2. **Usuarios → Usuarios del sistema → Agregar**. Nombre `sndwch-bot`, rol **Administrador**.
3. Con `sndwch-bot` elegido: **Asignar activos** →
   - **Páginas** → «Snd//wch» → **Control total**.
   - **Cuentas de Instagram** → tu cuenta → **Control total**.
   - **Apps** → `SNDWCH` → **Control total**.

### B3. Genera el token (no vence)
1. En `sndwch-bot`: **Generar token** → app `SNDWCH` → vencimiento **Nunca**.
2. Marca estos permisos:
   `pages_show_list` · `pages_read_engagement` · `pages_manage_posts` · `instagram_basic` ·
   `instagram_content_publish` · `business_management` — y, para el bot de respuestas que viene
   después: `pages_messaging` · `instagram_manage_messages` · `instagram_manage_comments`.
3. **Generar**. Copia el texto largo (empieza con `EAA`). **Es una contraseña**: no lo mandes por
   chat ni por correo.

### B4. Pégalo en Supabase
**supabase.com** → tu proyecto → **Edge Functions** → **Secrets** → **Add new secret**:
nombre `META_PAGE_ACCESS_TOKEN`, valor el token. Guardar. No hace falta redesplegar.

### B5. Comprobar
Avísame y corro el workflow **«Estado para abrir»**: debe salir ✓ en «Publicar en
Instagram/Facebook». Las 9 publicaciones del lanzamiento salen apenas las apruebes.

### B6. Además, para la pauta del 27: vincular a la cuenta de anuncios
**Configuración del negocio → Cuentas → Cuentas publicitarias** → la 221839797 → **Asignar
activos**: la página «Snd//wch» y tu Instagram. Hoy la cuenta de anuncios no tiene ninguno.

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
