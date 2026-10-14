# SND//WCH - genera los encargos pendientes en Google Flow con Claude en TU Chrome (2026-10-14).
# Dueno: eligio "Claude maneja Flow en tu Chrome". Google paso la cuenta a la interfaz de agente
# de Flow (un chat) y gflow-cli no la maneja; Claude la usa como la usarias tu.
# Lo abres tu cuando quieras generar (no corre solo):
#   powershell -ExecutionPolicy Bypass -File $HOME\sndwch-estudio\scripts\estudio\flow-chrome.ps1
# Necesita la extension Claude in Chrome (Claude Code la ofrece la primera vez) y tu sesion de
# Google abierta en ese Chrome. Las instrucciones que sigue Claude: scripts/estudio/FLOW_EN_CHROME.md
#
# SOLO caracteres ASCII en este archivo: PowerShell 5.1 lee los .ps1 sin BOM como ANSI.
$repo = Join-Path $HOME 'sndwch-estudio'
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
  [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + (Join-Path $HOME '.local\bin')

# 1 - El clon al dia con main (encargos nuevos) y lo pendiente subido a GitHub.
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\estudio\estudio.ps1') -Visible

# 2 - Claude con tu Chrome, en el clon. Al terminar sube lo hecho (corre estudio.ps1 otra vez).
Set-Location $repo
$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) { $claude = Join-Path $HOME '.local\bin\claude.exe' }
if (-not (Test-Path $claude)) { Write-Host 'No encuentro Claude Code: pega otra vez la linea del instalador.' -ForegroundColor Red; Read-Host 'Presiona Enter para cerrar'; return }
Write-Host 'Abriendo Claude con tu Chrome. Si te ofrece instalar la extension Claude in Chrome, acepta.' -ForegroundColor Cyan
& $claude --chrome 'Lee scripts/estudio/FLOW_EN_CHROME.md y cumplelo: genera en Flow los encargos pendientes.'
