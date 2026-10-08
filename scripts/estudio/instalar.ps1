# SND//WCH - instala el Estudio automatico en esta laptop (docs/marketing/estudio/INSTALAR.md).
# Autorizado por el dueno el 2026-10-08. SOLO ASCII en este archivo (ver estudio.ps1).
# Crea la tarea programada "SNDWCH Estudio": 7:30 y 19:30, despierta la laptop si esta suspendida
# y, si estaba apagada a esa hora, corre apenas la prendes. Corre con tu usuario y con tu sesion
# iniciada, porque Flow necesita tu Chrome con tu cuenta de Google. Para quitarla:
#   Unregister-ScheduledTask -TaskName 'SNDWCH Estudio' -Confirm:$false
$repo = Join-Path $HOME 'sndwch-estudio'
if (-not (Test-Path $repo)) { git clone https://github.com/raganarok95-hash/Sndwch.git $repo }
$script = Join-Path $repo 'scripts\estudio\estudio.ps1'
$accion = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File "{0}"' -f $script)
$disparos = @((New-ScheduledTaskTrigger -Daily -At '07:30'), (New-ScheduledTaskTrigger -Daily -At '19:30'))
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2) -MultipleInstances IgnoreNew
$quien = New-ScheduledTaskPrincipal -UserId ($env:USERDOMAIN + '\' + $env:USERNAME) -LogonType Interactive
Register-ScheduledTask -TaskName 'SNDWCH Estudio' -Action $accion -Trigger $disparos -Settings $ajustes `
  -Principal $quien -Description 'La agencia de SND//WCH: ciclo del lunes y encargos a Google Flow' -Force | Out-Null
Write-Host 'Listo: la tarea SNDWCH Estudio corre a las 7:30 y a las 19:30.'
Write-Host 'Probarla ahora:  Start-ScheduledTask -TaskName "SNDWCH Estudio"'
Write-Host ('Lo que hizo:      ' + (Join-Path $HOME 'sndwch-estudio-registros'))
