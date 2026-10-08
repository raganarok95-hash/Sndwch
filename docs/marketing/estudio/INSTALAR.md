# Instalar el Estudio automático en tu laptop (una sola vez, ~3 minutos)

Dueño, 2026-10-08: «sí, deja 100% automático lo de Flow». Después de esto, tu laptop:
- **los lunes a las 7:30** hace el ciclo de la agencia: brief, historias y encargos de la semana
  que viene (`scripts/estudio/LUNES.md`);
- **todos los días a las 7:30 y a las 19:30** genera en Flow los encargos pendientes
  (`scripts/estudio/LIBRETO.md`);
- sube todo a GitHub, y GitHub monta las historias y las programa en Instagram a su hora.

Tú no haces nada más. Solo deja la laptop **prendida o en suspensión** (no apagada) y con tu sesión
de Windows iniciada. Si estaba apagada a esa hora, corre apenas la prendes.

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
