# Punch list — decisiones pendientes del dueño

Generado durante la sesión de mejoras autónomas overnight. Nada aquí se implementó
solo — son cosas que requieren tu criterio de negocio, no algo que un agente deba
decidir por ti. Bórralo cuando lo hayas revisado.

## 1. Premio de curación 30CM en signatures (pendiente desde antes del loop)

Hallazgo: THE ORIGINAL, THE MEATBALL, THE SMOKE y THE FRESH cobran S/0 (o menos,
en el caso de THE FRESH) de premio sobre armar el mismo sándwich en BUILD YOUR OWN
cuando el tamaño es 30CM — el "premio" de curación solo existe en 15CM.

Ya resuelto en esta sesión (ver commit "POLLO CAJÚN pasa a ser exclusiva de THE VAULT"):
el problema del menú secreto (VAULT costaba más que armarlo en BYO) — arreglado
haciendo la proteína exclusiva, no tocando precio.

Todavía sin resolver — pediste "dame más detalle antes de decidir" y no llegamos a
cerrarlo antes de pedirme correr el loop. Datos ya reunidos (sin inventar costos
reales, que no tengo):

| Signature | 30CM hoy | Sugerido | Ganancia/unidad |
|---|---|---|---|
| THE ORIGINAL | S/22 | S/26 | +S/4 |
| THE MEATBALL | S/24 | S/29 | +S/5 |
| THE SMOKE | S/26 | S/31 | +S/5 |
| THE FRESH | S/20 | S/22-24 | +S/2-4 |

No toqué estos precios — es una decisión tuya, no algo que decida mientras duermes.

## 2. Activar "Continuar con Google" (implementado, apagado hasta que configures el Client ID)

Se implementó el botón de registro/login directo con Google (backend: acción `google-auth`
+ `actRegister` extendido; cliente: botón en la pantalla PUNTOS // REWARDS). El DNI sigue
siendo obligatorio SIEMPRE — Google solo pre-llena nombre/correo, nunca crea la cuenta por
sí solo; el cliente igual debe completar teléfono/PIN/DNI antes de que exista una cuenta.

Para activarlo (no puedo hacer esto por ti — son credenciales reales de tu propia cuenta):

1. Crea un proyecto (o usa uno existente) en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Crea un "OAuth 2.0 Client ID" tipo "Web application". En "Authorized JavaScript origins"
   agrega el dominio real donde vive la app (ej. `https://sndwch.app`, o el que uses).
3. Copia el Client ID (termina en `.apps.googleusercontent.com`) y reemplázalo en
   `src/app.ts`, línea con `var GOOGLE_CLIENT_ID='REEMPLAZA_CON_TU_GOOGLE_CLIENT_ID...'`.
4. En Supabase → Edge Functions → Secrets, corre (o pídeme que lo corra):
   `supabase secrets set GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com`
   (el backend necesita el mismo valor para validar el token — ver `GOOGLE_CLIENT_ID` en
   `supabase/functions/api/env.ts`).
5. `npm run build` + el ritual de despliegue normal.

Mientras no hagas esto, el botón simplemente no aparece — el registro/login por
teléfono+PIN de siempre sigue funcionando exactamente igual.

## 3. (los agentes irán agregando ítems aquí si aparecen)
