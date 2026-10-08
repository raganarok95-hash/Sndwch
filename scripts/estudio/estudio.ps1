# SND//WCH - el Estudio y el ciclo del lunes, solos en la laptop del dueno (docs/marketing/AGENCIA.md).
# Autorizado por el dueno el 2026-10-08. Lo corre la tarea programada "SNDWCH Estudio"
# (scripts/estudio/instalar.ps1) a las 7:30 y a las 19:30. A mano, para ver todo en pantalla:
#   powershell -ExecutionPolicy Bypass -File scripts\estudio\estudio.ps1 -Visible
#
# SOLO caracteres ASCII en este archivo: PowerShell 5.1 lee los .ps1 sin BOM como ANSI y una raya
# o unas comillas tipograficas pueden romper el script sin aviso (2026-10-08: "no abrio nada").
#
# Trabaja en su PROPIO clon (~\sndwch-estudio). Claude corre con permisos minimos (Flow, leer y
# escribir archivos, copiar y listar). El git lo hace este script, solo hacia la rama "estudio";
# GitHub lo une a main (.github/workflows/historias.yml). CADA corrida sube su registro a
# docs/marketing/estudio/registros/, para que la agencia vea que paso sin preguntarle a nadie.
param([switch]$Visible)

$repo = Join-Path $HOME 'sndwch-estudio'
$registros = Join-Path $HOME 'sndwch-estudio-registros'
New-Item -ItemType Directory -Force -Path $registros | Out-Null
$sello = Get-Date -Format 'yyyy-MM-dd_HHmm'
$log = Join-Path $registros ($sello + '.log')
function Anota($m) {
  $linea = '{0}  {1}' -f (Get-Date -Format 'HH:mm:ss'), $m
  Add-Content -Path $log -Value $linea -Encoding UTF8
  if ($Visible) { Write-Host $linea }
}

Anota ('inicio. usuario=' + $env:USERNAME + ' powershell=' + $PSVersionTable.PSVersion)
$hecho = @()
try {
  if (-not (Test-Path $repo)) { Anota 'clonando el repo'; git clone -q https://github.com/raganarok95-hash/Sndwch.git $repo 2>&1 | ForEach-Object { Anota $_ } }
  Set-Location $repo
  git fetch -q origin 2>&1 | ForEach-Object { Anota $_ }
  git checkout -q -B estudio origin/main 2>&1 | ForEach-Object { Anota $_ }
  git rev-parse --verify --quiet origin/estudio 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { git merge -q --no-edit origin/estudio 2>&1 | ForEach-Object { Anota $_ } }
  Anota ('repo en ' + (git rev-parse --short HEAD))

  $claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $claude) { $claude = Join-Path $HOME '.local\bin\claude.exe' }
  if (-not (Test-Path $claude)) { throw ('no encuentro claude: ' + $claude) }
  Anota ('claude en ' + $claude)
  & $claude mcp list 2>&1 | ForEach-Object { Anota ('mcp: ' + $_) }

  # 1 - Los lunes: el ciclo de la agencia (brief, historias y encargos de la semana que viene).
  if ((Get-Date).DayOfWeek -eq 'Monday' -and (Get-Date).Hour -lt 12) {
    Anota 'lunes: ciclo de la agencia'
    & $claude -p 'Lee scripts/estudio/LUNES.md y cumplelo al pie de la letra.' `
      --allowedTools 'Read,Write,Edit,Glob,Grep' --max-turns 60 2>&1 | ForEach-Object { Anota $_ }
    $hecho += 'agencia'
  }

  # 2 - El Estudio: los encargos pendientes, en Flow.
  $pendientes = @(Get-ChildItem 'docs/marketing/estudio/encargos/*.md' -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-Path ('docs/marketing/estudio/hecho/{0}/estado.json' -f $_.BaseName)) })
  Anota ('encargos pendientes: ' + $pendientes.Count)
  if ($pendientes.Count -gt 0) {
    $flow = Join-Path $HOME '.google-flow-creator'
    & $claude -p 'Lee scripts/estudio/LIBRETO.md y cumplelo al pie de la letra.' `
      --allowedTools 'mcp__google-flow,Read,Write,Glob,Grep,Bash(cp:*),Bash(mkdir:*),Bash(ls:*)' `
      --add-dir $flow --max-turns 120 2>&1 | ForEach-Object { Anota $_ }
    $hecho += 'flow'
  }
} catch {
  Anota ('ERROR: ' + $_.Exception.Message)
} finally {
  # 3 - Siempre: subir lo hecho y el registro de esta corrida a la rama estudio.
  try {
    if (Test-Path (Join-Path $repo '.git')) {
      Set-Location $repo
      $destino = 'docs/marketing/estudio/registros'
      New-Item -ItemType Directory -Force -Path $destino | Out-Null
      Anota ('fin. hecho: ' + ($hecho -join ' + '))
      Copy-Item $log (Join-Path $destino ($sello + '.log'))
      git add docs/marketing/semanas docs/marketing/estudio 2>&1 | Out-Null
      git commit -q -m ('Estudio ' + $sello + ' (' + ($hecho -join ' + ') + ')') 2>&1 | Out-Null
      git push -q origin estudio 2>&1 | ForEach-Object { Anota ('push: ' + $_) }
      if ($Visible) { Write-Host ('Registro subido a GitHub y guardado en ' + $log) }
    }
  } catch { Anota ('ERROR al subir: ' + $_.Exception.Message) }
}
