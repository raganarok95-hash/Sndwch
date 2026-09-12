# Prender "Continuar con Google" — paso a paso detallado

## Lo primero, porque es donde casi todos se traban

Hay **dos credenciales distintas** en Google Cloud y se crean en sitios distintos del mismo
menú:

| | empieza con | para qué sirve | ¿es la que necesitas? |
|---|---|---|---|
| **Clave de API** | `AIzaSy...` | Maps, Places, Geocoding | ❌ **NO** |
| **ID de cliente de OAuth** | termina en `.apps.googleusercontent.com` | iniciar sesión con Google | ✅ **SÍ** |

Si lo que tienes empieza con `AIzaSy` es la clave de Maps, **no** el Client ID. Son dos
cosas separadas y las dos hacen falta, cada una en su secret.

---

## PARTE 1 — Crear el ID de cliente de OAuth

### Paso 1. Abre la consola en la página correcta

Entra directo a este link, ya te deja en la pantalla exacta:

**https://console.cloud.google.com/apis/credentials**

Arriba a la izquierda, al lado del logo, hay un **selector de proyecto**. Elige el **mismo
proyecto donde creaste la clave de Maps** (así todo queda junto). Si no sabes cuál es, ábrelo
y busca el que tenga tu clave `AIzaSy...` en la lista de credenciales.

### Paso 2. Configura la pantalla de consentimiento (si nunca la hiciste)

Esto es lo que bloquea a casi todo el mundo: **Google no te deja crear el ID de cliente de
OAuth hasta que exista la pantalla de consentimiento.** Si el botón aparece gris o te
redirige, es por esto.

En el menú de la izquierda: **Pantalla de consentimiento de OAuth**
(o directo: **https://console.cloud.google.com/apis/credentials/consent**)

1. Tipo de usuario: **Externo** → **CREAR**
2. Rellena solo lo que tiene asterisco:
   - **Nombre de la aplicación**: `SND//WCH`
   - **Correo de asistencia al usuario**: tu correo (sale en un desplegable)
   - **Datos de contacto del desarrollador**: tu correo otra vez
3. **GUARDAR Y CONTINUAR**
4. Pantalla **Permisos**: no toques nada → **GUARDAR Y CONTINUAR**
5. Pantalla **Usuarios de prueba**: no agregues a nadie → **GUARDAR Y CONTINUAR**
6. **VOLVER AL PANEL**

> En consolas nuevas Google renombró esto a **"Google Auth Platform" → "Branding"**. Es lo
> mismo: nombre de la app, correo de soporte, correo de contacto.

### Paso 3. AHORA sí, crea el ID de cliente

Vuelve a **Credenciales** (https://console.cloud.google.com/apis/credentials).

Arriba verás **`+ CREAR CREDENCIALES`**. Tócalo y se abre un menú con tres opciones:

```
Clave de API              ← NO es esta (es la de Maps, AIzaSy...)
ID de cliente de OAuth    ← ESTA
Cuenta de servicio        ← NO
```

Elige **ID de cliente de OAuth**.

- **Tipo de aplicación**: en el desplegable elige **Aplicación web**
  *(no "Android", no "iOS", no "Otro" — tiene que ser Aplicación web aunque se use en celular)*
- **Nombre**: `SND//WCH web` — es interno, no lo ve ningún cliente

Ahora aparecen dos secciones. **Presta atención a cuál llenas:**

**① Orígenes autorizados de JavaScript** → aquí van tres, uno por uno con `+ AÑADIR URI`:

```
https://sndwch.app
https://www.sndwch.app
http://localhost:3000
```

⚠ **Sin barra al final.** `https://sndwch.app/` con barra Google lo rechaza.
⚠ **Sin rutas.** Solo el dominio, nada de `/login` ni nada.

**② URIs de redireccionamiento autorizados** → **DÉJALO VACÍO.** No agregues nada.
El botón de Google devuelve el token a la misma página, no redirecciona a ningún lado. Si
pones algo acá no rompe nada, pero no sirve.

→ **CREAR**

### Paso 4. Copia el valor correcto

Se abre una ventanita con dos campos:

```
Tu ID de cliente:       123456789012-a1b2c3d4e5f6g7h8.apps.googleusercontent.com   ← ESTE
Tu secreto de cliente:  GOCSPX-xxxxxxxxxxxxxxxx                                    ← este NO
```

**Copia el de arriba**, el que termina en `.apps.googleusercontent.com`.

**El "secreto de cliente" no se usa y no lo pegues en ningún lado.** Sign-In desde el
navegador no lo necesita; solo serviría para un flujo de servidor que esta app no tiene.

> Si cerraste la ventana: el ID sigue visible en la lista de **Credenciales**, en la sección
> "IDs de cliente de OAuth 2.0". El secreto no, pero no lo necesitas.

### Paso 5. Publica la aplicación ⚠ ESTE PASO SE OLVIDA SIEMPRE

Vuelve a **Pantalla de consentimiento de OAuth**. Arriba dice el estado:

- Si dice **"En prueba"** → **SOLO ENTRAN LAS CUENTAS QUE LISTASTE COMO USUARIOS DE PRUEBA.**
  Tus clientes verán un error. Toca **PUBLICAR APLICACIÓN** → **CONFIRMAR**.
- Si dice **"En producción"** → ya está.

**Google NO te va a pedir verificación** con los permisos que usamos (solo correo y perfil
básico). La verificación la exige para permisos sensibles — Gmail, Drive, Calendario — que
esta app no pide. Si te aparece un aviso de verificación, es que se coló un permiso de más en
el paso 2.4: quítalo y vuelve a publicar.

---

## PARTE 2 — Pegarlo en Supabase

### Opción A — desde la web (la más fácil, sin terminal)

1. Entra a **https://supabase.com/dashboard/project/rjosezuoyngiadunfzyn/settings/functions**
2. Busca la sección **Edge Function Secrets** (o "Secrets")
3. **Add new secret**:
   - **Name**: `GOOGLE_CLIENT_ID`
   - **Value**: el ID que termina en `.apps.googleusercontent.com`
4. **Save**

⚠ El nombre va **exactamente así**, en mayúsculas y con guiones bajos: `GOOGLE_CLIENT_ID`.
Si lo escribes distinto, el servidor no lo encuentra y no avisa.

### Opción B — desde la terminal

```bash
npm install -g supabase
supabase login
supabase secrets set GOOGLE_CLIENT_ID=TU_ID.apps.googleusercontent.com \
  --project-ref rjosezuoyngiadunfzyn
supabase secrets list --project-ref rjosezuoyngiadunfzyn
```

El valor sale censurado en el listado — eso es normal.

### De paso, la clave de Maps

Si todavía no configuraste la de Maps, es el **mismo sitio** y el mismo procedimiento, con
otro nombre: `GOOGLE_MAPS_KEY`, y ahí sí va la `AIzaSy...`.

⚠ Esa clave **tiene que estar restringida por referrer** a `sndwch.app` (en la consola:
Credenciales → tu clave → *Restricciones de aplicación* → *Sitios web*). Sin esa
restricción, cualquiera que la copie del HTML consume tu cuota y la paga tu tarjeta.

---

## PARTE 3 — Comprobar que prendió

**No hay que redesplegar nada.** El secret lo lee la edge function `api` en la siguiente
llamada, y el cliente lo recibe dentro de `get-store-hours`.

1. Abre `https://sndwch.app` en una ventana **de incógnito** (para que no use tu sesión).
2. Toca **PUNTOS**.
3. Tiene que aparecer el botón **"Continuar con Google"**.

Si no aparece o falla, el síntoma dice cuál de los pasos quedó a medias:

| qué ves | qué faltó |
|---|---|
| No aparece ningún botón | El secret no quedó — revisa el nombre exacto `GOOGLE_CLIENT_ID` |
| `Error 400: origin_mismatch` | Falta `https://sndwch.app` en **Orígenes autorizados** (Paso 3.①) |
| `Error 403: access_denied` o "esta app no está verificada" | Falta **PUBLICAR APLICACIÓN** (Paso 5) |
| Aparece, eliges cuenta y dice "no se pudo verificar" | El valor pegado no es el Client ID (¿pegaste la `AIzaSy...`?) |
| Entra tu cuenta pero no la de otro | Sigue **En prueba** — Paso 5 |

---

## Qué pasa cuando un cliente lo usa

1. Toca "Continuar con Google" y elige su cuenta.
2. **Si ya tenía cuenta vinculada** → entra directo, sin escribir nada.
3. **Si es nuevo** → una pantalla con **un solo campo: el teléfono**. El nombre y el correo
   ya vinieron de Google; el PIN lo genera el servidor y nunca lo ve ni lo necesita.
4. Cuenta creada, con bono de bienvenida. Si venía de un pedido como invitado, ese pedido se
   reclama solo y le da sus puntos.

**Por qué el teléfono no se puede evitar**: es la llave primaria de la tabla de clientes
(seis tablas le apuntan) y es con lo que ubicas a la persona para entregarle el pedido.
Google no devuelve teléfono en ningún permiso de Sign-In, en ninguna configuración.

**El DNI no se pide por este camino** (lo autorizaste el 2026-09-12). Quien entra con Google
recupera el acceso volviendo a entrar con Google. El registro por formulario lo sigue
exigiendo, y la base lo obliga con el constraint `customers_dni_o_google`.

---

## Costo

**Cero.** Google Sign-In no se cobra, no tiene cuota ni límite de usuarios. No lo confundas
con Maps/Places, que sí tienen consumo medido y facturable.
