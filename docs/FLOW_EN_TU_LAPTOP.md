# Conectar Claude a Google Flow — en tu laptop

> **Esto NO corre en la sesión de Claude que trabaja en este repo.** Esa vive en un contenedor
> remoto y efímero, sin tu Chrome y sin tu cuenta de Google. El servidor se instala en **tu
> Claude Code local**, y ahí es donde vas a poder pedirle videos. Yo te preparo los prompts y el
> guion; el que maneja Flow es el Claude de tu máquina.

---

## Cuál de los tres, y por qué

Existen tres servidores MCP de Flow, todos de la comunidad. Leí los tres README y **no son
equivalentes**:

| | `hitjcl/google-flow-mcp` | `Mitanshp5/Google-Flow_MCP` |
|---|---|---|
| instalación | **un comando** (`npx`, publicado en npm) | clonar + configurar a mano |
| pensado para | **Claude Code**, lo nombra primero | OpenCode / Gemini CLI |
| navegador | **perfil propio y aislado** en `~/.google-flow-creator/` | usa o copia **tu perfil real** de Chrome |
| gasto de créditos | **pide confirmación antes de enviar** | no lo menciona |
| contraseñas / 2FA | dice explícitamente que **no las lee, guarda ni escribe** | no lo menciona |
| extras | descarga el video y lo **valida con ffprobe** | personajes, escenas, referencias `@nombre` |

**Empieza con `hitjcl`.** Gana en las tres cosas que importan acá: se instala con un comando,
**no toca tu Chrome de todos los días** (se crea su propio perfil y tú inicias sesión ahí una
vez), y **te pregunta antes de gastar créditos** — que son plata real.

Lo único bueno que tiene el otro y este no es el manejo de **personajes y escenas** de Flow. No
lo necesitas: eso se hace una sola vez desde la interfaz de Flow a mano, y vale más hacerlo así
(ver más abajo).

---

## Antes de empezar

- **Node.js 22.13 o más nuevo** — compruébalo con `node -v`.
- **Google Chrome o Microsoft Edge** instalado.
- **FFmpeg / FFprobe** — los usa para verificar que el video que bajó no vino cortado.
- Tu cuenta de Google **con acceso a Flow** y créditos.

---

## Instalación

**macOS, Linux o WSL:**

```bash
claude mcp add --scope user google-flow -- npx -y google-flow-browser-mcp
```

**Windows:**

```powershell
claude mcp add --scope user google-flow -- cmd /c npx -y google-flow-browser-mcp
```

Después:

```bash
claude mcp get google-flow
```

Reinicia Claude Code y abre `/mcp` para confirmar que aparece.

---

## La primera vez

El flujo que el propio servidor recomienda, en orden:

1. `project_create`
2. `flow_start_login` — se abre una ventana de Chrome **visible**
3. **Inicias sesión tú**, en esa ventana, y confirmas que tienes membresía y créditos
4. `flow_confirm_login`
5. `flow_open_project` y `flow_inspect_page`
6. `flow_prepare_generation`
7. **Recién con tu aprobación explícita**: `flow_submit_generation`
8. `flow_wait_for_generation` → `flow_download_media` → `media_validate_local`

No tienes que memorizarlos: se los pides en español y él los encadena.

---

## ⚠ LO PRIMERO QUE HAY QUE HACER, Y NO ES UN VIDEO

**Crea a SANDO, WICHO y MAFE como PERSONAJES dentro de Flow**, desde su interfaz, subiendo las
imágenes de referencia. Antes de pedir un solo video.

Esto resuelve el problema que nos costó la tarde de hoy. Quedó probado que **el estilo de dibujo
no viaja en palabras**: se describió el trazo de WICHO con todo el detalle posible y salió la
identidad pero no el estilo. Un personaje de Flow guarda la referencia visual, así que **a partir
de ahí todos los videos mantienen al mismo mono**, sin volver a describirlo.

Las referencias a subir son los **bustos**, no los de cuerpo entero:

- **SANDO** → `img/sando_sonrie.png`
- **WICHO** → `img/wicho_rie.png`
- **MAFE** → todavía no existe. Hay que generarla primero (ver `docs/PROMPTS_PERSONAJES.md`,
  sección 3.3), elegir una variante y guardarla como `img/mafe_ref.png`.

**Los bustos y no los `_cuerpo`** por un motivo concreto: los de cuerpo entero traen pegada la
elipse de sombra del piso, que no se puede quitar por software —la sombra y la suela de la
zapatilla son literalmente el mismo color— y no conviene que Flow la aprenda como parte del
personaje.

Y **cada hermano se sube por separado**. Nunca los dos juntos en la misma referencia: sus estilos
son distintos a propósito, y un modelo al que le enseñas los dos los promedia.

---

## Qué pedirle, ya escrito

Una vez instalado y con los personajes creados, esto se pega tal cual en tu Claude Code local:

```
Usa Google Flow para hacer un video de 8 segundos en 9:16.
Pregúntame antes de enviar, que gasta créditos.
Usa el personaje WICHO que ya está creado en el proyecto.
Cuando termine, descárgalo y valídalo localmente.
```

El **prompt de la escena** sale del panel: el borrador semanal del calendario ya trae el
`flowPromptSemanal` listo para pegar, con el formato leído de la letra con la que empieza el
guion de esa semana. No hace falta inventarlo.

Para el ritmo y quién sale en cada toma, la gramática está en `docs/UNIVERSO_SNDWCH.md`:
**SANDO se queda quieto y se mueve la cámara; WICHO se mueve él y la cámara no; con MAFE no se
mueve nadie y lo que cambia es el tiempo.** Y ninguno habla — el texto va en pantalla.

---

## Lo que tienes que saber antes de confiar en esto

- **Es automatización de navegador no oficial.** El propio README lo dice: Flow no expone una API
  estable para este flujo, así que **cuando Google cambie la interfaz, el servidor se rompe**
  hasta que su autor lo actualice. No construyas encima nada que el negocio necesite a diario.
- **Gasta créditos de verdad.** Por eso importa que este servidor pida confirmación: es la
  diferencia entre aprobar cada generación y descubrir el gasto después.
- **`~/.google-flow-creator/` contiene una sesión de Google activa.** No la subas a ningún repo,
  no la compartas, no la copies a otra máquina.
- **Es código de un tercero.** No pide tu contraseña —tú inicias sesión en su ventana y él nunca
  la lee— pero igual es software de la comunidad manejando un navegador con tu cuenta abierta.
  Vale la pena saberlo antes, no después.
- **La alternativa oficial es Veo por la Gemini API, y ya la descartamos** el 2026-09-10: cuesta
  **US$0.10-0.15 por segundo** y duplica el proceso que ya tienes. "Conectarse a Flow por API" y
  "volver a poner Veo" son la misma cosa con otro nombre.
