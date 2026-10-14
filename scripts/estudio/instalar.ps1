# SND//WCH - instala, revisa y prueba el Estudio automatico en la laptop del dueno.
# Autorizado por el dueno el 2026-10-08: "si, deja 100% automatico lo de Flow" y "debe ser automatico".
#
# Se corre con UNA linea en una ventana de PowerShell (tecla Windows, "PowerShell", Enter, pegar):
#   [Net.ServicePointManager]::SecurityProtocol='Tls12'; iwr https://raw.githubusercontent.com/raganarok95-hash/Sndwch/main/scripts/estudio/instalar.ps1 -UseBasicParsing -OutFile $HOME\instalar-sndwch.ps1; powershell -ExecutionPolicy Bypass -File $HOME\instalar-sndwch.ps1
# (2026-10-14: con Windows+R la ventana se cerraba sin mostrar el error. Tambien sirve por irm | iex.)
#
# Se puede correr las veces que haga falta. Revisa cada pieza y la instala si falta (Git, su propio
# clon ~\sndwch-estudio, gflow-cli para Flow, Claude Code para los lunes), revisa la sesion de
# Flow (si hace falta abre Chrome para que entres UNA vez), programa la tarea "SNDWCH Estudio"
# (7:30 y 19:30) y hace una primera corrida a la vista. Al final dice [OK] o [FALTA] por pieza.
# 2026-10-14: Flow lo genera gflow-cli (autorizado por el dueno), no el MCP de antes.
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

  # 3 - gflow-cli: Flow desde la terminal (2026-10-14, autorizado por el dueno). Flow se mudo a
  #     flow.google.com y el MCP de antes no lo conoce. Se instala con uv, que trae su Python.
  if (-not (Tiene 'uv')) { ConWinget 'astral-sh.uv' 'uv' }
  if (-not (Tiene 'uv')) { Mal 'uv (instala gflow)' 'Instalalo desde https://docs.astral.sh/uv/ y vuelve a pegar la linea.'; return }
  # Python 3.12, fijo: uv elegia el mas nuevo (3.15) y para ese aun no hay paquetes listos de lz4
  # ni pyyaml en Windows; los queria compilar y pedia Visual C++ (registro del 2026-10-14).
  Di 'Instalando o actualizando gflow-cli (la primera vez baja ~150 MB)...' 'Cyan'
  uv tool install --upgrade --python 3.12 gflow-cli 2>&1 | ForEach-Object { Add-Content -Path $log -Value ([string]$_) }
  RecargarPath
  uv tool run --python 3.12 --from gflow-cli playwright install chromium 2>&1 | ForEach-Object { Add-Content -Path $log -Value ([string]$_) }
  if (Tiene 'gflow') { Bien ('gflow-cli ' + ((gflow --version) -replace '^.*version\s*', '')) }
  else {
    $error1 = (Get-Content $log | Where-Object { $_ -match '^error:' } | Select-Object -Last 1)
    if ($error1) { Di ('        ' + $error1) }
    Mal 'gflow-cli' 'Manda una captura de esta ventana.'; return
  }

  # 4 - Tu sesion de Flow en gflow. Si no la hay, se abre Chrome: entras UNA vez con tu cuenta de
  #     Google y, cuando carga Flow, se cierra solo. Dura semanas. (Lo que imprime no va al
  #     registro: lleva tu correo y el registro es publico.)
  & gflow auth status *> $null
  if ($LASTEXITCODE -ne 0) {
    Di 'Se abre Chrome: entra con tu cuenta de Google de Flow. Cuando cargue Flow, se cierra solo.' 'Cyan'
    $navegador = 'auto'
    foreach ($c in @('C:\Program Files\Google\Chrome\Application\chrome.exe',
        'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'))) { if (Test-Path $c) { $navegador = 'chrome' } }
    & gflow auth login --browser $navegador
    & gflow auth status *> $null
  }
  $sesionOk = ($LASTEXITCODE -eq 0)
  if (-not $sesionOk) {
    # 2026-10-14, dos capturas del dueno: gflow ve la sesion ("Signed in"), pero su verificacion
    # rapida falla en Windows (auth_flow_session_probe_error, OSError: lee las cookies con
    # browser_cookie3 y no cae a Chrome con ese error) y borra su marca de Chrome. Generar NO usa
    # esa verificacion: abre el perfil con Chrome. Se repone la marca (USER_GUIDE 13.4 de gflow) y
    # se prueba lo que de verdad importa: una imagen de prueba (las imagenes no gastan creditos).
    # Si no sale, se quita la marca: nada queda dando por buena una sesion que no lo es.
    Di 'La verificacion rapida de gflow fallo. Pruebo de verdad: una imagen de prueba en Flow (gratis, ~1 minuto)...' 'Cyan'
    Start-Sleep -Seconds 5
    $raiz = Join-Path $env:LOCALAPPDATA 'ffroliva\gflow-cli'
    $perfil = Get-ChildItem $raiz -Directory -Filter 'profile_*' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($perfil) {
      $ruta = $perfil.FullName.ToLower()
      Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine.ToLower().Contains($ruta) } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
      Start-Sleep -Seconds 3
      $marca = Join-Path $perfil.FullName '.gflow_browser_strategy'
      $habia = Test-Path $marca
      [System.IO.File]::WriteAllText($marca, 'chrome', (New-Object System.Text.UTF8Encoding($false)))
      $prueba = Join-Path $env:TEMP 'sndwch-prueba-flow'
      Remove-Item $prueba -Recurse -Force -ErrorAction SilentlyContinue
      $salida = (& gflow image t2i 'A single red apple on a plain white table, soft daylight.' -n 1 --aspect 1:1 --out $prueba 2>&1 | Out-String)
      $codigo = $LASTEXITCODE
      # La salida va al registro (publico): sin la ruta del usuario ni correos.
      Add-Content -Path $log -Value (([string]$salida).Replace($HOME, '~') -replace '[\w.+-]+@[\w-]+\.[\w.-]+', '<correo>')
      $imagen = @(Get-ChildItem $prueba -File -Filter '*.png' -ErrorAction SilentlyContinue)
      if ($codigo -eq 0 -and $imagen.Count -gt 0) { $sesionOk = $true }
      else {
        Di ('        la imagen de prueba no salio (gflow salio con ' + $codigo + ')')
        if (-not $habia) { Remove-Item $marca -Force -ErrorAction SilentlyContinue }
      }
      Remove-Item $prueba -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  if ($sesionOk) { Bien 'Sesion de Flow (gflow)' }
  else { Mal 'Sesion de Flow' 'Vuelve a pegar la linea y entra con tu cuenta de Google en la ventana de Chrome que se abre.'; return }

  # 5 - El MCP de Flow de antes ya no sirve: se quita para que nada lo use.
  $claude = RutaClaude
  if ($claude) {
    $mcp = (& $claude mcp list 2>&1 | Out-String)
    if ($mcp -match 'google-flow') { & $claude mcp remove --scope user google-flow 2>&1 | ForEach-Object { Di $_ } }
  }

  # 6 - Claude Code, con tu cuenta: solo para el ciclo de la agencia de los lunes. Si falta, Flow
  #     igual corre.
  if (-not $claude) {
    Di 'Instalando Claude Code...' 'Cyan'
    try { Invoke-RestMethod 'https://claude.ai/install.ps1' | Invoke-Expression } catch { Di $_.Exception.Message }
    RecargarPath
    $claude = RutaClaude
  }
  if (-not $claude) { Mal 'Claude Code (el ciclo del lunes)' 'Instalalo desde https://claude.com/claude-code y vuelve a pegar la linea.' }
  else {
    $r = (& $claude -p 'Responde solo con la palabra LISTO' --max-turns 1 2>&1 | Out-String)
    if ($r -match 'LISTO') { Bien 'Claude Code con tu cuenta (ciclo del lunes)' }
    else { Mal 'Claude Code sin sesion (el ciclo del lunes)' 'Abre PowerShell, escribe  claude  , entra con tu cuenta, cierralo y vuelve a pegar la linea.' }
  }

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
      -Principal $quien -Description 'La agencia de SND//WCH: encargos a Google Flow (gflow) y ciclo del lunes' -Force -ErrorAction Stop | Out-Null
    Bien 'Tarea "SNDWCH Estudio" programada (7:30 y 19:30)'
  } catch { Mal 'La tarea programada' ('Windows no la dejo crear: ' + $_.Exception.Message) }

  # 8 - La primera corrida, a la vista: genera lo pendiente y sube lo hecho y su registro a GitHub.
  Di 'Primera corrida del Estudio. Si se abre una ventana para entrar a GitHub, entra con tu cuenta (es solo la primera vez).' 'Cyan'
  $destino = Join-Path $repo 'docs\marketing\estudio\registros'
  New-Item -ItemType Directory -Force -Path $destino | Out-Null
  Copy-Item $log (Join-Path $destino ('instalar_' + $sello + '.log'))
  & powershell -NoProfile -ExecutionPolicy Bypass -File $script -Visible
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
