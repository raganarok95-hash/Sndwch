# SND//WCH — el Estudio y el ciclo del lunes, solos en la laptop del dueño (docs/marketing/AGENCIA.md).
# Autorizado por el dueño el 2026-10-08: «sí, deja 100% automático lo de Flow». Lo corre la tarea
# programada «SNDWCH Estudio» (scripts/estudio/instalar.ps1), a las 7:30 y a las 19:30.
#
# Trabaja en su PROPIO clon (~\sndwch-estudio), nunca en tu carpeta Sndwch. Los lunes, antes, corre
# el ciclo de la agencia (scripts/estudio/LUNES.md). Después cumple en Flow los encargos pendientes
# (scripts/estudio/LIBRETO.md). Claude corre con permisos MÍNIMOS: Flow (su MCP), leer y escribir
# archivos del repo y copiar o listar. Sin git, sin borrar, sin red fuera de Flow: el git lo hace
# este script, y solo sube a la rama `estudio`; GitHub lo une a main (.github/workflows/historias.yml).
$repo = Join-Path $HOME 'sndwch-estudio'
$registros = Join-Path $HOME 'sndwch-estudio-registros'
New-Item -ItemType Directory -Force -Path $registros | Out-Null
$log = Join-Path $registros ((Get-Date -Format 'yyyy-MM-dd_HHmm') + '.log')
function Anota($m) { Add-Content -Path $log -Value ('{0}  {1}' -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding UTF8 }

if (-not (Test-Path $repo)) { git clone -q https://github.com/raganarok95-hash/Sndwch.git $repo 2>&1 | Out-Null }
Set-Location $repo
git fetch -q origin 2>&1 | Out-Null
git checkout -q -B estudio origin/main 2>&1 | Out-Null
git rev-parse --verify --quiet origin/estudio 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { git merge -q --no-edit origin/estudio 2>&1 | Out-Null }

$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) { $claude = Join-Path $HOME '.local\bin\claude.exe' }
$hecho = @()

# 1 · Los lunes: el ciclo de la agencia (brief, historias y encargos de la semana que viene).
if ((Get-Date).DayOfWeek -eq 'Monday' -and (Get-Date).Hour -lt 12) {
  Anota 'lunes: ciclo de la agencia'
  & $claude -p 'Lee scripts/estudio/LUNES.md y cumplelo al pie de la letra.' `
    --allowedTools 'Read,Write,Edit,Glob,Grep' --max-turns 60 2>&1 | ForEach-Object { Anota $_ }
  $hecho += 'agencia'
}

# 2 · El Estudio: los encargos pendientes, en Flow.
$pendientes = @(Get-ChildItem 'docs/marketing/estudio/encargos/*.md' -ErrorAction SilentlyContinue |
  Where-Object { -not (Test-Path ('docs/marketing/estudio/hecho/{0}/estado.json' -f $_.BaseName)) })
if ($pendientes.Count -gt 0) {
  Anota ('Flow: ' + (($pendientes | ForEach-Object { $_.BaseName }) -join ', '))
  $flow = Join-Path $HOME '.google-flow-creator'
  & $claude -p 'Lee scripts/estudio/LIBRETO.md y cumplelo al pie de la letra.' `
    --allowedTools 'mcp__google-flow,Read,Write,Glob,Grep,Bash(cp:*),Bash(mkdir:*),Bash(ls:*)' `
    --add-dir $flow --max-turns 120 2>&1 | ForEach-Object { Anota $_ }
  $hecho += 'flow'
} else { Anota 'Flow: sin encargos pendientes' }

# 3 · Subir solo lo de la agencia y del Estudio, a la rama estudio.
git add docs/marketing/semanas docs/marketing/estudio 2>&1 | Out-Null
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -q -m ('Estudio (' + ($hecho -join ' + ') + ') ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')) 2>&1 | Out-Null
  git push -q origin estudio 2>&1 | ForEach-Object { Anota $_ }
  Anota 'subido a la rama estudio'
} else { Anota 'nada nuevo que subir' }
