# SND//WCH - instala, revisa y prueba el Estudio automatico en la laptop del dueno.
# Autorizado por el dueno el 2026-10-08: "si, deja 100% automatico lo de Flow" y "debe ser automatico".
#
# Se corre con UNA linea en una ventana de PowerShell (tecla Windows, "PowerShell", Enter, pegar):
#   [Net.ServicePointManager]::SecurityProtocol='Tls12'; iwr https://raw.githubusercontent.com/raganarok95-hash/Sndwch/main/scripts/estudio/instalar.ps1 -UseBasicParsing -OutFile $HOME\instalar-sndwch.ps1; powershell -ExecutionPolicy Bypass -File $HOME\instalar-sndwch.ps1
# (2026-10-14: con Windows+R la ventana se cerraba sin mostrar el error. Tambien sirve por irm | iex.)
#
# Se puede correr las veces que haga falta. Revisa cada pieza y la instala si falta (Git, su propio
# clon ~\sndwch-estudio, Claude Code con tu cuenta), programa la tarea "SNDWCH Estudio" (7:30 y
# 19:30: ciclo del lunes y subir lo hecho) y abre Claude con tu Chrome para generar en Flow.
# Al final dice [OK] o [FALTA] por pieza.
# 2026-10-14: Flow lo genera Claude en tu Chrome (flow-chrome.ps1); gflow-cli no maneja la
# interfaz de agente de Flow que Google puso en la cuenta.
#
# SOLO ASCII en este archivo: PowerShell 5.1 lee mal las rayas y comillas tipograficas.
# Llega por "irm | iex": nada de param(), $PSScriptRoot ni exit (cerraria la ventana).

$ErrorActionPreference = 'Continue'
$REPO_URL = 'https://github.com/raganarok95-hash/Sndwch.git'
$repo = Join-Path $HOME 'sndwch-estudio'
$registros = Join-Path $HOME 'sndwch-estudio-registros'
New-Item -ItemType Directory -Force -Path $registros | Out-Null
$sello = Get-Date -Format 'yyyy-MM-dd_HHmm'
$log = Join-Path $registros ('instalar_' + $sello + '.log')
$faltas = New-Object System.Collections.ArrayList

# El registro sube a un repo PUBLICO: nunca lleva la ruta de tu usuario.
function Di($m, $color) {
  $m = ([string]$m).Replace($HOME, '~')
  Add-Content -Path $log -Value ('{0}  {1}' -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding UTF8
  if ($color) { Write-Host $m -ForegroundColor $color } else { Write-Host $m }
}
function Bien($m) { Di ('[OK]    ' + $m) 'Green' }
function Mal($m, $arreglo) {
  Di ('[FALTA] ' + $m) 'Red'
  if ($arreglo) { Di ('        -> ' + $arreglo) 'Yellow' }
  [void]$faltas.Add($m)
}
function RecargarPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
    [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + (Join-Path $HOME '.local\bin')
}
function Tiene($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function ConWinget($id, $nombre) {
  if (-not (Tiene 'winget')) { Di ('No hay winget para instalar ' + $nombre + ' solo.'); return }
  Di ('Instalando ' + $nombre + '. Si Windows pide permiso, acepta.') 'Cyan'
  winget install -e --id $id --silent --accept-source-agreements --accept-package-agreements 2>&1 |
    ForEach-Object { Add-Content -Path $log -Value ([string]$_) }
  RecargarPath
}
function RutaClaude {
  $c = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $c) { $c = Join-Path $HOME '.local\bin\claude.exe' }
  if (Test-Path $c) { return $c }
  return $null
}

function Instalar {
  Di '== SND//WCH - el Estudio: instalacion y prueba ==' 'Cyan'
  Di ('Windows PowerShell ' + $PSVersionTable.PSVersion)
  RecargarPath

  # 1 - Git: baja el trabajo y sube lo que Flow genera.
  if (-not (Tiene 'git')) { ConWinget 'Git.Git' 'Git' }
  if (Tiene 'git') { Bien ((git --version) -replace 'git version ', 'Git ') }
  else { Mal 'Git' 'Instalalo desde https://git-scm.com/download/win y vuelve a pegar la linea.'; return }

  # 2 - Su propio clon, al dia. Tu carpeta Sndwch no se toca.
  if (-not (Test-Path (Join-Path $repo '.git'))) {
    if (Test-Path $repo) { Rename-Item $repo ($repo + '-viejo-' + $sello) }
    git clone -q $REPO_URL $repo 2>&1 | ForEach-Object { Di $_ }
  }
  Push-Location $repo
  try {
    git config user.name 'SNDWCH Estudio'
    git config user.email 'estudio@sndwch.app'
    git fetch -q origin 2>&1 | ForEach-Object { Di $_ }
    git checkout -q -B estudio origin/main 2>&1 | ForEach-Object { Di $_ }
    if ($LASTEXITCODE -ne 0) {
      # Cambios a medias de una corrida vieja: se guardan aparte (git stash), nunca se borran.
      git stash push -u -q -m ('instalador ' + $sello) 2>&1 | ForEach-Object { Di $_ }
      git checkout -q -B estudio origin/main 2>&1 | ForEach-Object { Di $_ }
    }
    if ($LASTEXITCODE -eq 0) { Bien ('Clon al dia (' + (git rev-parse --short HEAD) + ')') }
    else { Mal 'El clon no se pudo actualizar' 'Manda una captura de esta ventana.'; return }
  } finally { Pop-Location }

  # 3 - Flow se genera con Claude en tu Chrome (2026-10-14, el dueno eligio "Claude maneja Flow
  #     en tu Chrome"): Google paso la cuenta a la interfaz de agente de Flow y gflow-cli no la
  #     maneja (exit 25, issue #799; docs/ENTORNO.md). gflow queda instalado si ya estaba; no se usa.
  #     El MCP de Flow de antes tampoco sirve: se quita para que nada lo use.
  $claude = RutaClaude
  if ($claude) {
    $mcp = (& $claude mcp list 2>&1 | Out-String)
    if ($mcp -match 'google-flow') { & $claude mcp remove --scope user google-flow 2>&1 | ForEach-Object { Di $_ } }
  }

  # 4 - Claude Code, con tu cuenta: maneja Flow en tu Chrome y hace el ciclo de los lunes.
  if (-not $claude) {
    Di 'Instalando Claude Code...' 'Cyan'
    try { Invoke-RestMethod 'https://claude.ai/install.ps1' | Invoke-Expression } catch { Di $_.Exception.Message }
    RecargarPath
    $claude = RutaClaude
  }
  if (-not $claude) { Mal 'Claude Code' 'Instalalo desde https://claude.com/claude-code y vuelve a pegar la linea.'; return }
  $r = (& $claude -p 'Responde solo con la palabra LISTO' --max-turns 1 2>&1 | Out-String)
  if ($r -match 'LISTO') { Bien 'Claude Code con tu cuenta' }
  else {
    Mal 'Claude Code sin sesion' 'Abre PowerShell, escribe  claude  , entra con tu cuenta, cierralo y vuelve a pegar la linea.'
    return
  }

  # 5 - La tarea programada: 7:30 y 19:30, despierta la laptop, y si estaba apagada corre al prenderla.
  $script = Join-Path $repo 'scripts\estudio\estudio.ps1'
  $accion = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File "{0}"' -f $script)
  $disparos = @((New-ScheduledTaskTrigger -Daily -At '07:30'), (New-ScheduledTaskTrigger -Daily -At '19:30'))
  $ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 3) -MultipleInstances IgnoreNew
  $quien = New-ScheduledTaskPrincipal -UserId ($env:USERDOMAIN + '\' + $env:USERNAME) -LogonType Interactive
  try {
    Register-ScheduledTask -TaskName 'SNDWCH Estudio' -Action $accion -Trigger $disparos -Settings $ajustes `
      -Principal $quien -Description 'La agencia de SND//WCH: ciclo del lunes y subir lo hecho a GitHub' -Force -ErrorAction Stop | Out-Null
    Bien 'Tarea "SNDWCH Estudio" programada (7:30 y 19:30)'
  } catch { Mal 'La tarea programada' ('Windows no la dejo crear: ' + $_.Exception.Message) }

  # 6 - La primera corrida, a la vista: pone el clon al dia, sube lo pendiente y abre Claude con tu
  #     Chrome para generar los encargos en Flow (scripts/estudio/flow-chrome.ps1).
  Di 'Abro Claude con tu Chrome para generar en Flow. Si te ofrece instalar la extension Claude in Chrome, acepta.' 'Cyan'
  $destino = Join-Path $repo 'docs\marketing\estudio\registros'
  New-Item -ItemType Directory -Force -Path $destino | Out-Null
  Copy-Item $log (Join-Path $destino ('instalar_' + $sello + '.log'))
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\estudio\flow-chrome.ps1')
}

# Si algo falto, el registro igual sube a GitHub (rama estudio), para ver que paso sin preguntarte.
function SubirRegistro {
  if (-not (Test-Path (Join-Path $repo '.git')) -or -not (Tiene 'git')) { return }
  Push-Location $repo
  try {
    if ((git rev-parse --abbrev-ref HEAD) -ne 'estudio') { return }
    $destino = 'docs\marketing\estudio\registros'
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    Copy-Item $log (Join-Path $destino ('instalar_' + $sello + '.log'))
    git add $destino 2>&1 | Out-Null
    git commit -q -m ('Estudio: instalador ' + $sello + ' (falta: ' + ($faltas -join ', ') + ')') 2>&1 | Out-Null
    git push -q origin estudio 2>&1 | ForEach-Object { Di ('push: ' + $_) }
  } finally { Pop-Location }
}

Instalar
if ($faltas.Count -gt 0) { SubirRegistro }
Write-Host ''
if ($faltas.Count -eq 0) {
  Di 'LISTO. Desde ahora corre solo a las 7:30 y a las 19:30. No tienes que hacer nada mas.' 'Green'
} else {
  Di ('Falta: ' + ($faltas -join ', ') + '. Haz lo que dice en amarillo y vuelve a pegar la misma linea.') 'Red'
  Di 'Si no se arregla, manda una captura de esta ventana.' 'Yellow'
}
Read-Host 'Presiona Enter para cerrar'
