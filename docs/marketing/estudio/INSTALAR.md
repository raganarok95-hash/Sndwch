# Instalar el Estudio automático en tu laptop (una sola vez, ~3 minutos)

Dueño, 2026-10-08: «sí, deja 100% automático lo de Flow». Después de esto, tu laptop:
- **los lunes a las 7:30** hace el ciclo de la agencia: brief, historias y encargos de la semana
  que viene (`scripts/estudio/LUNES.md`);
- **todos los días a las 7:30 y a las 19:30** genera en Flow los encargos pendientes con
  **gflow-cli** (`scripts/estudio/flow.ps1`; dueño, 2026-10-14: «Autorizo usar gflow-cli con mi
  cuenta de Google Flow y que el Estudio lo corra solo en mi laptop»);
- sube todo a GitHub, y GitHub monta las historias y las programa en Instagram a su hora.

Tú no haces nada más. Solo deja la laptop **prendida o en suspensión** (no apagada) y con tu sesión
de Windows iniciada. Si estaba apagada a esa hora, corre apenas la prendes.

## Instalar o arreglar (2026-10-14: desde una ventana de PowerShell)

Dueño: «cuando intenté Windows más R no funcionó el comando». Con Windows + R, si algo falla la
ventana se cierra sola y no se ve por qué (y el antivirus de Windows a veces frena el «descargar y
correr» de `irm | iex`). Por eso ahora se hace desde una ventana que se queda abierta:

1. Presiona la tecla **Windows**, escribe **PowerShell** y presiona **Enter** (la normal, no
   «como administrador»).
2. Pega esta línea (clic derecho pega) y presiona **Enter**:
   ```
   [Net.ServicePointManager]::SecurityProtocol='Tls12'; iwr https://raw.githubusercontent.com/raganarok95-hash/Sndwch/main/scripts/estudio/instalar.ps1 -UseBasicParsing -OutFile $HOME\instalar-sndwch.ps1; powershell -ExecutionPolicy Bypass -File $HOME\instalar-sndwch.ps1
   ```
   Baja el instalador a tu carpeta de usuario y lo corre. Si algo sale en rojo, la ventana se queda
   abierta: mándame una captura.
3. Revisa cada pieza y dice **[OK]** o **[FALTA]**:
   - **Git y su propio clon**, `sndwch-estudio`. Tu carpeta `Sndwch` no se toca.
   - **gflow-cli**, para Flow. Si Windows pide permiso para instalar algo, acepta.
   - **Tu sesión de Flow:** si no la hay, **se abre Chrome: entras con tu cuenta de Google una sola
     vez** y se cierra solo cuando carga Flow.
   - **Claude Code con tu cuenta**, solo para los lunes.
   - **La tarea programada**, a las 7:30 y a las 19:30.
   - **La primera corrida, a la vista.** Si se abre una ventana para entrar a GitHub, entra con tu
     cuenta. Es solo la primera vez.
4. Si al final dice **LISTO**, ya está: corre solo. Si dice **[FALTA]**, haz lo que dice en
   amarillo y vuelve a pegar la misma línea. Puedes pegarla las veces que quieras.

Cada corrida, también las que fallan, sube su registro a GitHub
(`docs/marketing/estudio/registros/`), así se ve qué pasó sin preguntarte. El repositorio es
público: el registro nunca lleva la ruta ni el nombre de tu usuario.

## Lo que el instalador revisa (antes era a mano)

- Git y su propio clon, `sndwch-estudio`, al día.
- **gflow-cli** (lo instala con `uv`, que trae su propio Python) y su navegador.
- **Tu sesión de Flow en gflow**: si no la hay, se abre Chrome, entras una vez con tu cuenta de
  Google y se cierra solo cuando carga Flow. Dura semanas; cuando venza, el registro lo dice y
  vuelves a pegar la línea.
- Claude Code con tu cuenta, solo para el ciclo de los lunes. Si falta, Flow igual corre.
- Quita el MCP de Flow de antes (`google-flow`), que dejó de servir cuando Flow se mudó a
  `flow.google.com`.

## Qué puede hacer y qué no

- **Puede**: generar imágenes en Flow con tu cuenta (no gastan créditos), leer y escribir archivos
  dentro de su propio clon (`sndwch-estudio`) y subir
  a la rama `estudio`. GitHub solo acepta de esa rama la carpeta de la agencia (`docs/marketing/
  semanas/` y `docs/marketing/estudio/`).
- **No puede**: tocar tu carpeta `Sndwch`, publicar, ni generar video (eso sí gasta créditos y
  queda pendiente). Nunca compra créditos.
- **El riesgo que aceptaste**: gflow-cli no es de Google; maneja Flow con tu cuenta como lo harías
  tú, con pausas entre imagen e imagen. Si Google cambia la página, falla y lo dice el registro.
- **Para quitarla**: `Unregister-ScheduledTask -TaskName 'SNDWCH Estudio' -Confirm:$false`.
