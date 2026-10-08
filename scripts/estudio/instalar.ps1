# SND//WCH — instala el Estudio automático en esta laptop (docs/marketing/estudio/INSTALAR.md).
# Autorizado por el dueño el 2026-10-08: «sí, deja 100% automático lo de Flow».
# Crea la tarea programada «SNDWCH Estudio»: 7:30 y 19:30, despierta la laptop si está suspendida
# y, si estaba apagada a esa hora, corre apenas la prendes. Corre con tu usuario y con tu sesión
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
Register-ScheduledTask -TaskName 'SNDWCH Estudio' -Action $accion -Trigger $disparos -Settings $ajustes `
  -Description 'La agencia de SND//WCH: ciclo del lunes y encargos a Google Flow' -Force | Out-Null
Write-Host 'Listo: «SNDWCH Estudio» corre a las 7:30 y a las 19:30.'
Write-Host 'Probarla ahora:  Start-ScheduledTask -TaskName "SNDWCH Estudio"'
Write-Host ('Lo que hizo:      ' + (Join-Path $HOME 'sndwch-estudio-registros'))
