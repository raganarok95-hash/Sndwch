# Instalar el Estudio automático en tu laptop (una sola vez, ~3 minutos)

Dueño, 2026-10-08: «sí, deja 100% automático lo de Flow». Después de esto, tu laptop:
- **los lunes a las 7:30** hace el ciclo de la agencia: brief, historias y encargos de la semana
  que viene (`scripts/estudio/LUNES.md`);
- **todos los días a las 7:30 y a las 19:30** genera en Flow los encargos pendientes
  (`scripts/estudio/LIBRETO.md`);
- sube todo a GitHub, y GitHub monta las historias y las programa en Instagram a su hora.

Tú no haces nada más. Solo deja la laptop **prendida o en suspensión** (no apagada) y con tu sesión
de Windows iniciada. Si estaba apagada a esa hora, corre apenas la prendes.

## Instalar o arreglar: una sola línea (2026-10-08)

Dueño: «No funciona el comando y debe ser automático». Ya no hay que abrir carpetas ni tener nada
instalado antes:

1. En la laptop, presiona **Windows + R**.
2. Pega esta línea y presiona **Enter**:
   ```
   powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol='Tls12'; irm https://raw.githubusercontent.com/raganarok95-hash/Sndwch/main/scripts/estudio/instalar.ps1 | iex"
   ```
3. Se abre una ventana azul que revisa cada pieza y dice **[OK]** o **[FALTA]**:
   - **Git, Node y Claude Code:** si falta alguno, lo instala solo. Si Windows pide permiso, acepta.
   - **Claude Code con tu cuenta:** si no hay sesión, te dice cómo entrar.
   - **Flow conectado a Claude Code.**
   - **Su propio clon**, `sndwch-estudio`. Tu carpeta `Sndwch` no se toca.
   - **Tu sesión de Flow:** si no la hay, **se abre Chrome: entras con tu cuenta de Google una sola
     vez** y vuelves a la ventana.
   - **La tarea programada**, a las 7:30 y a las 19:30.
   - **La primera corrida, a la vista.** Si se abre una ventana para entrar a GitHub, entra con tu
     cuenta. Es solo la primera vez.
4. Si al final dice **LISTO**, ya está: corre solo. Si dice **[FALTA]**, haz lo que dice en
   amarillo y vuelve a pegar la misma línea. Puedes pegarla las veces que quieras.

Cada corrida, también las que fallan, sube su registro a GitHub
(`docs/marketing/estudio/registros/`), así se ve qué pasó sin preguntarte. El repositorio es
público: el registro nunca lleva la ruta ni el nombre de tu usuario.

## Lo que el instalador revisa (antes era a mano)

- Claude Code instalado e iniciado con tu cuenta.
- El MCP de Flow agregado: `claude mcp add --scope user google-flow -- cmd /c npx -y google-flow-browser-mcp`.
- Flow con la sesión de Google iniciada, y SANDO y WICHO creados como personajes.

## Qué puede hacer y qué no

- **Puede**: usar Flow, leer y escribir archivos dentro de su propio clon (`sndwch-estudio`) y subir
  a la rama `estudio`. GitHub solo acepta de esa rama la carpeta de la agencia (`docs/marketing/
  semanas/` y `docs/marketing/estudio/`).
- **No puede**: tocar tu carpeta `Sndwch`, borrar, publicar, ni gastar créditos fuera de los 50
  diarios gratis. Nunca compra créditos.
- **Para quitarla**: `Unregister-ScheduledTask -TaskName 'SNDWCH Estudio' -Confirm:$false`.
