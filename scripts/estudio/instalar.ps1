# SND//WCH - instala, revisa y prueba el Estudio automatico en la laptop del dueno.
# Autorizado por el dueno el 2026-10-08: "si, deja 100% automatico lo de Flow" y "debe ser automatico".
#
# Se corre con UNA linea, sin abrir carpetas ni tener nada antes (Windows+R, pegar, Enter):
#   powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/raganarok95-hash/Sndwch/main/scripts/estudio/instalar.ps1 | iex"
#
# Se puede correr las veces que haga falta. Revisa cada pieza y la instala si falta (Git, Node,
# Claude Code, el MCP de Flow), deja al dia su propio clon (~\sndwch-estudio), revisa la sesion de
# Flow (si hace falta abre Chrome para que entres UNA vez), programa la tarea "SNDWCH Estudio"
# (7:30 y 19:30) y hace una primera corrida a la vista. Al final dice [OK] o [FALTA] por pieza.
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
function NodeSirve {
  if (-not (Tiene 'node')) { return $false }
  $p = ((node -v) -replace '^v', '').Split('.')
  return ([int]$p[0] -gt 22) -or ([int]$p[0] -eq 22 -and [int]$p[1] -ge 13)
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

  # 2 - Node 22.13 o mas nuevo: el MCP de Flow corre con npx.
  if (-not (NodeSirve)) { ConWinget 'OpenJS.NodeJS.LTS' 'Node.js' }
  if (NodeSirve) { Bien ('Node ' + (node -v)) }
  else { Mal 'Node.js 22.13 o mas nuevo' 'Instalalo desde https://nodejs.org (LTS) y vuelve a pegar la linea.' }

  # 3 - Claude Code, con tu cuenta.
  $claude = RutaClaude
  if (-not $claude) {
    Di 'Instalando Claude Code...' 'Cyan'
    try { Invoke-RestMethod 'https://claude.ai/install.ps1' | Invoke-Expression } catch { Di $_.Exception.Message }
    RecargarPath
    $claude = RutaClaude
  }
  if (-not $claude) { Mal 'Claude Code' 'Instalalo desde https://claude.com/claude-code y vuelve a pegar la linea.'; return }
  Bien 'Claude Code instalado'
  $r = (& $claude -p 'Responde solo con la palabra LISTO' --max-turns 1 2>&1 | Out-String)
  if ($r -match 'LISTO') { Bien 'Claude Code con tu cuenta' }
  else {
    Mal 'Claude Code sin sesion' 'Abre PowerShell, escribe  claude  , entra con tu cuenta, cierralo y vuelve a pegar la linea.'
    Di ('        respondio: ' + $r.Trim())
    return
  }

  # 4 - El MCP de Flow. Start-Process pasa el "--" tal cual (PowerShell 5.1 puede comerselo).
  $mcp = (& $claude mcp list 2>&1 | Out-String)
  if ($mcp -notmatch 'google-flow') {
    Di 'Conectando Flow a Claude Code...' 'Cyan'
    $out = Join-Path $registros 'mcp_add.txt'
    Start-Process -FilePath $claude -NoNewWindow -Wait -RedirectStandardOutput $out -RedirectStandardError ($out + '.err') `
      -ArgumentList @('mcp', 'add', '--scope', 'user', 'google-flow', '--', 'cmd', '/c', 'npx', '-y', 'google-flow-browser-mcp')
    Get-Content $out, ($out + '.err') -ErrorAction SilentlyContinue | ForEach-Object { Di $_ }
    $mcp = (& $claude mcp list 2>&1 | Out-String)
  }
  if ($mcp -match 'google-flow') { Bien 'Flow conectado a Claude Code' }
  else { Mal 'El MCP de Flow' 'Manda una captura de esta ventana.'; Di $mcp; return }

  # 5 - Su propio clon, al dia. Tu carpeta Sndwch no se toca.
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

  # 6 - La sesion de Flow y los personajes. Si no hay sesion, se abre Chrome: entras UNA vez.
  Di 'Revisando tu sesion de Flow. Si se abre Chrome, entra con tu cuenta de Google y vuelve aqui.' 'Cyan'
  $p = 'Usa SOLO las herramientas de google-flow. 1) Comprueba si la sesion de Google en Flow esta iniciada. ' +
    '2) Si no lo esta, inicia el login (se abre una ventana visible de Chrome) y espera a que el dueno entre: ' +
    'compruebalo cada 20 segundos (Bash: sleep 20) durante 10 minutos como maximo, y confirma el login. ' +
    '3) Busca el proyecto de Flow donde estan los personajes SANDO y WICHO. No generes nada ni gastes creditos. ' +
    'Responde en UNA linea: SESION_OK o SESION_FALTA, y PERSONAJES_OK o PERSONAJES_FALTA, con el nombre del proyecto.'
  Push-Location $repo
  $r = (& $claude -p $p --allowedTools 'mcp__google-flow,Bash(sleep:*)' --max-turns 80 2>&1 | Out-String)
  Pop-Location
  Di ('        Flow respondio: ' + $r.Trim())
  if ($r -match 'SESION_OK') { Bien 'Sesion de Flow' } else { Mal 'Sesion de Flow' 'Vuelve a pegar la linea y entra con tu cuenta de Google en la ventana de Chrome que se abre.' }
  if ($r -match 'PERSONAJES_OK') { Bien 'SANDO y WICHO en Flow' } else { Mal 'SANDO y WICHO en Flow' 'Crea en Flow los personajes SANDO y WICHO (docs/FLOW_EN_TU_LAPTOP.md) y vuelve a pegar la linea.' }

  # 7 - La tarea programada: 7:30 y 19:30, despierta la laptop, y si estaba apagada corre al prenderla.
  $script = Join-Path $repo 'scripts\estudio\estudio.ps1'
  $accion = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File "{0}"' -f $script)
  $disparos = @((New-ScheduledTaskTrigger -Daily -At '07:30'), (New-ScheduledTaskTrigger -Daily -At '19:30'))
  $ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 3) -MultipleInstances IgnoreNew
  $quien = New-ScheduledTaskPrincipal -UserId ($env:USERDOMAIN + '\' + $env:USERNAME) -LogonType Interactive
  try {
    Register-ScheduledTask -TaskName 'SNDWCH Estudio' -Action $accion -Trigger $disparos -Settings $ajustes `
      -Principal $quien -Description 'La agencia de SND//WCH: ciclo del lunes y encargos a Google Flow' -Force -ErrorAction Stop | Out-Null
    Bien 'Tarea "SNDWCH Estudio" programada (7:30 y 19:30)'
  } catch { Mal 'La tarea programada' ('Windows no la dejo crear: ' + $_.Exception.Message) }

  # 8 - La primera corrida, a la vista. Sube lo hecho y su registro a GitHub.
  if ($faltas.Count -eq 0) {
    Di 'Primera corrida del Estudio. Si se abre una ventana para entrar a GitHub, entra con tu cuenta (es solo la primera vez).' 'Cyan'
    $destino = Join-Path $repo 'docs\marketing\estudio\registros'
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    Copy-Item $log (Join-Path $destino ('instalar_' + $sello + '.log'))
    & powershell -NoProfile -ExecutionPolicy Bypass -File $script -Visible
  }
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
