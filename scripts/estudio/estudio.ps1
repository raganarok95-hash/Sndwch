# SND//WCH - el Estudio y el ciclo del lunes, solos en la laptop del dueno (docs/marketing/AGENCIA.md).
# Autorizado por el dueno el 2026-10-08. Lo corre la tarea programada "SNDWCH Estudio" a las 7:30 y
# a las 19:30; la instala y la prueba scripts/estudio/instalar.ps1 (una linea, ver INSTALAR.md).
# A mano, para ver todo en pantalla:
#   powershell -ExecutionPolicy Bypass -File $HOME\sndwch-estudio\scripts\estudio\estudio.ps1 -Visible
#
# SOLO caracteres ASCII en este archivo: PowerShell 5.1 lee los .ps1 sin BOM como ANSI y una raya
# o unas comillas tipograficas pueden romper el script sin aviso (2026-10-08: "no abrio nada").
#
# Trabaja en su PROPIO clon (~\sndwch-estudio). Claude corre con permisos minimos (Flow, leer y
# escribir archivos, copiar y listar). El git lo hace este script, solo hacia la rama "estudio";
# GitHub lo une a main (.github/workflows/historias.yml). CADA corrida sube su registro a
# docs/marketing/estudio/registros/ (repo PUBLICO: el registro nunca lleva la ruta de tu usuario).
param([switch]$Visible)

$repo = Join-Path $HOME 'sndwch-estudio'
$registros = Join-Path $HOME 'sndwch-estudio-registros'
New-Item -ItemType Directory -Force -Path $registros | Out-Null
$sello = Get-Date -Format 'yyyy-MM-dd_HHmm'
$log = Join-Path $registros ($sello + '.log')
function Anota($m, $color) {
  $m = ([string]$m).Replace($HOME, '~')
  Add-Content -Path $log -Value ('{0}  {1}' -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding UTF8
  if ($Visible) { if ($color) { Write-Host $m -ForegroundColor $color } else { Write-Host $m } }
}
# La tarea programada hereda el PATH de cuando se instalo; se relee por si algo se instalo despues.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
  [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + (Join-Path $HOME '.local\bin')

# Sube a la rama estudio lo que haya en las carpetas de la agencia. Devuelve $true si quedo arriba.
function Subir($mensaje) {
  git add docs/marketing/semanas docs/marketing/estudio 2>&1 | Out-Null
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) { git commit -q -m $mensaje 2>&1 | ForEach-Object { Anota $_ } }
  $salida = (git push -q origin estudio 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) { Anota ('ERROR al subir a GitHub: ' + $salida.Trim()) 'Red'; return $false }
  return $true
}

Anota ('inicio. powershell=' + $PSVersionTable.PSVersion) 'Cyan'
$hecho = @()
try {
  if (-not (Test-Path (Join-Path $repo '.git'))) { throw 'no hay clon: pega otra vez la linea del instalador (INSTALAR.md)' }
  Set-Location $repo
  git config user.name 'SNDWCH Estudio'
  git config user.email 'estudio@sndwch.app'

  # 0 - Lo que quedo de una corrida anterior sin subir (sin comitear, o comiteado y sin push): se
  # sube primero. Si no se puede, se para aqui: el paso 1 rehace la rama y lo perderia.
  if ((git rev-parse --abbrev-ref HEAD) -eq 'estudio') {
    if (-not (Subir ('Estudio: lo que quedo de antes de ' + $sello))) {
      throw 'no pude subir lo de la corrida anterior a GitHub; no sigo, para no perderlo'
    }
  }

  # 1 - Al dia con main (encargos y scripts nuevos) y con lo que la laptop ya subio.
  git fetch -q origin 2>&1 | ForEach-Object { Anota $_ }
  git checkout -q -B estudio origin/main 2>&1 | ForEach-Object { Anota $_ }
  if ($LASTEXITCODE -ne 0) { throw 'no pude ponerme al dia con main (git checkout)' }
  git rev-parse --verify --quiet origin/estudio 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) {
    git merge -q --no-edit origin/estudio 2>&1 | ForEach-Object { Anota $_ }
    if ($LASTEXITCODE -ne 0) { git merge --abort 2>&1 | Out-Null; throw 'choque al unir lo ya subido (git merge)' }
  }
  Anota ('repo en ' + (git rev-parse --short HEAD))

  $claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $claude) { $claude = Join-Path $HOME '.local\bin\claude.exe' }
  if (-not (Test-Path $claude)) { throw 'no encuentro Claude Code: pega otra vez la linea del instalador' }

  # 2 - Los lunes: el ciclo de la agencia (brief, historias y encargos de la semana que viene).
  if ((Get-Date).DayOfWeek -eq 'Monday' -and (Get-Date).Hour -lt 12) {
    Anota 'lunes: ciclo de la agencia' 'Cyan'
    & $claude -p 'Lee scripts/estudio/LUNES.md y cumplelo al pie de la letra.' `
      --allowedTools 'Read,Write,Edit,Glob,Grep' --max-turns 60 2>&1 | ForEach-Object { Anota $_ }
    $hecho += 'agencia'
  }

  # 3 - El Estudio: los encargos pendientes, en Flow.
  $pendientes = @(Get-ChildItem 'docs/marketing/estudio/encargos/*.md' -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-Path ('docs/marketing/estudio/hecho/{0}/estado.json' -f $_.BaseName)) })
  Anota ('encargos pendientes: ' + $pendientes.Count)
  if ($pendientes.Count -gt 0) {
    Anota 'Flow: generando (tarda unos minutos por imagen)' 'Cyan'
    $argumentos = @('-p', 'Lee scripts/estudio/LIBRETO.md y cumplelo al pie de la letra.',
      '--allowedTools', 'mcp__google-flow,Read,Write,Glob,Grep,Bash(cp:*),Bash(mkdir:*),Bash(ls:*),Bash(sleep:*)',
      '--max-turns', '150')
    $flow = Join-Path $HOME '.google-flow-creator'
    if (Test-Path $flow) { $argumentos += @('--add-dir', $flow) }
    & $claude @argumentos 2>&1 | ForEach-Object { Anota $_ }
    $hecho += 'flow'
    $listos = @(Get-ChildItem 'docs/marketing/estudio/hecho/*/estado.json' -ErrorAction SilentlyContinue).Count
    Anota ('encargos con resultado: ' + $listos)
  }
} catch {
  Anota ('ERROR: ' + $_.Exception.Message) 'Red'
} finally {
  # 4 - Siempre: subir lo hecho y el registro de esta corrida a la rama estudio.
  try {
    if ((Test-Path (Join-Path $repo '.git')) -and ((Get-Location).Path -eq $repo) -and
        ((git rev-parse --abbrev-ref HEAD) -eq 'estudio')) {
      $destino = 'docs/marketing/estudio/registros'
      New-Item -ItemType Directory -Force -Path $destino | Out-Null
      Anota ('fin. hecho: ' + ($hecho -join ' + '))
      Copy-Item $log (Join-Path $destino ($sello + '.log'))
      if (Subir ('Estudio ' + $sello + ' (' + ($hecho -join ' + ') + ')')) { Anota 'subido a GitHub' 'Green' }
    }
  } catch { Anota ('ERROR al subir: ' + $_.Exception.Message) 'Red' }
  if ($Visible) { Write-Host ('Registro: ' + $log) }
}
