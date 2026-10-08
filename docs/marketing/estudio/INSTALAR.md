# Instalar el Estudio automático en tu laptop (una sola vez, ~3 minutos)

Dueño, 2026-10-08: «sí, deja 100% automático lo de Flow». Después de esto, tu laptop:
- **los lunes a las 7:30** hace el ciclo de la agencia: brief, historias y encargos de la semana
  que viene (`scripts/estudio/LUNES.md`);
- **todos los días a las 7:30 y a las 19:30** genera en Flow los encargos pendientes
  (`scripts/estudio/LIBRETO.md`);
- sube todo a GitHub, y GitHub monta las historias y las programa en Instagram a su hora.

Tú no haces nada más. Solo deja la laptop **prendida o en suspensión** (no apagada) y con tu sesión
de Windows iniciada. Si estaba apagada a esa hora, corre apenas la prendes.

## Si ya lo instalaste y «no abrió nada» (arreglo del 2026-10-08)

La primera versión tenía rayas y comillas tipográficas, y el PowerShell de Windows las lee mal y no
corre. La nueva es solo ASCII, te deja verlo todo en pantalla y sube un registro de cada corrida a
GitHub, así veo qué pasó sin preguntarte. Tu laptop tiene la versión vieja: actualízala una vez.

1. Abre **PowerShell** y pega esto (actualiza el clon y vuelve a instalar la tarea):
   ```
   cd $HOME\sndwch-estudio; git fetch origin; git checkout -B estudio origin/main; powershell -ExecutionPolicy Bypass -File scripts\estudio\instalar.ps1
   ```
2. Pruébalo **a la vista**, sin la tarea programada:
   ```
   powershell -ExecutionPolicy Bypass -File $HOME\sndwch-estudio\scripts\estudio\estudio.ps1 -Visible
   ```
   Ves cada paso en la ventana. **Si se abre una ventana para iniciar sesión en GitHub, entra con
   tu cuenta**: es la primera vez que la laptop sube algo y después ya no lo pide.
3. Mándame una captura de la ventana cuando termine. El registro también me llega por GitHub.

## Los pasos

1. Abre **PowerShell** (tecla Windows → escribe «PowerShell» → Enter).
2. Pega esto y Enter:
   ```
   git clone https://github.com/raganarok95-hash/Sndwch.git $HOME\sndwch-estudio; powershell -ExecutionPolicy Bypass -File $HOME\sndwch-estudio\scripts\estudio\instalar.ps1
   ```
   (Crea su propio clon, `sndwch-estudio`: tu carpeta `Sndwch` no se toca. Si el clon ya existía,
   el primer comando avisa y el segundo instala igual.)
   Debe decir: «Listo: «SNDWCH Estudio» corre a las 7:30 y a las 19:30.»
3. Pruébala ya, sin esperar a mañana:
   ```
   Start-ScheduledTask -TaskName "SNDWCH Estudio"
   ```
   Se abre Chrome con Flow y empieza a generar. Tarda unos minutos por imagen.
4. Lo que hizo queda escrito en la carpeta `sndwch-estudio-registros` de tu usuario. Si algo
   falla, ábrelo y mándame lo que dice.

## Lo que tiene que estar listo antes (ya lo hiciste)

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
