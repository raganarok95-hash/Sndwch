# SND//WCH - el Estudio genera en Google Flow con gflow-cli, sin agente (2026-10-14).
# Autorizado por el dueno: "Autorizo usar gflow-cli con mi cuenta de Google Flow y que el Estudio
# lo corra solo en mi laptop". Lo llama scripts/estudio/estudio.ps1 (paso 3); el git lo hace el.
# A mano, para un solo encargo:
#   powershell -ExecutionPolicy Bypass -File $HOME\sndwch-estudio\scripts\estudio\flow.ps1 -Solo 2026-10-20-puerta-1
#
# Por que gflow y no el MCP de antes: Flow se mudo a flow.google.com (2026-09-14) y ese MCP solo
# conocia labs.google (docs/ENTORNO.md). gflow-cli: https://github.com/ffroliva/gflow-cli
#
# Por cada encargo pendiente (docs/marketing/estudio/encargos/<id>.md sin hecho/<id>/estado.json):
#   - imagen sin personajes -> gflow image t2i
#   - imagen con personajes -> gflow image i2i, con la referencia de CADA uno (referencias/*.png):
#     los personajes no se describen, se muestran
#   - deja hecho/<id>/v1.png, v2.png ... y estado.json (lo lee scripts/piezas/historias.mjs)
#   - video: no se genera solo (gasta creditos); queda pendiente y se anota
# Las imagenes no gastan creditos. Nunca compra creditos.
#
# Si la sesion de Google vencio (gflow sale con 3) o Flow pone limite (4), para: los demas
# fallarian igual y quedan pendientes para la proxima corrida.
#
# SOLO caracteres ASCII en este archivo: PowerShell 5.1 lee los .ps1 sin BOM como ANSI.
param([string]$Solo = '')

$ErrorActionPreference = 'Continue'
$repo = Join-Path $HOME 'sndwch-estudio'
$env:Path = $env:Path + [IO.Path]::PathSeparator + (Join-Path $HOME '.local/bin')

# Lo que sale va al registro del repo, que es PUBLICO: sin la ruta del usuario ni correos.
function Limpio($m) {
  return (([string]$m).Replace($HOME, '~') -replace '[\w.+-]+@[\w-]+\.[\w.-]+', '<correo>')
}
function Di($m) { Write-Output (Limpio $m) }
# estado.json en UTF-8 SIN BOM: el BOM rompe el JSON.parse de historias.mjs.
function Escribe($ruta, $texto) {
  [System.IO.File]::WriteAllText($ruta, $texto, (New-Object System.Text.UTF8Encoding($false)))
}
function Estado($dir, $estado, $motivo) {
  $m = 'null'
  if ($motivo) { $m = '"' + ([string]$motivo).Replace('\', '/').Replace('"', "'") + '"' }
  Escribe (Join-Path $dir 'estado.json') ('{"estado":"' + $estado + '","motivo":' + $m +
    ',"creditos":0,"hecho":"' + (Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz') + '"}')
}

# El encargo: la cabecera entre los dos "---" y la escena debajo (docs/marketing/estudio/README.md).
function LeerEncargo($archivo) {
  $meta = @{}
  $escena = New-Object System.Collections.ArrayList
  $rayas = 0
  foreach ($l in (Get-Content -Path $archivo -Encoding UTF8)) {
    if ($rayas -lt 2 -and $l.Trim() -eq '---') { $rayas++; continue }
    if ($rayas -eq 1) {
      if ($l -match '^\s*([A-Za-z_]+)\s*:\s*(.*)$') {
        $meta[$Matches[1]] = (($Matches[2] -replace '\s+#.*$', '').Trim()).Trim('"')
      }
    } elseif ($rayas -eq 2 -and $l.Trim() -ne '') { [void]$escena.Add($l.Trim()) }
  }
  # Comillas dobles fuera: PowerShell 5.1 las rompe al pasarlas a un programa.
  $meta['escena'] = (($escena -join ' ').Replace('"', "'")).Trim()
  $nombres = @()
  if ($meta['personajes']) {
    $nombres = @($meta['personajes'].Trim('[', ']').Split(',') | ForEach-Object { $_.Trim().ToUpper() } |
      Where-Object { $_ -ne '' })
  }
  $meta['nombres'] = $nombres
  return $meta
}

Set-Location $repo
$gflow = (Get-Command gflow -ErrorAction SilentlyContinue).Source
if (-not $gflow) { $gflow = Join-Path $HOME '.local/bin/gflow.exe' }
if (-not (Test-Path $gflow)) { Di 'FLOW: no encuentro gflow. Pega otra vez la linea del instalador.'; exit 2 }

# La verificacion rapida de gflow falla en Windows aunque la sesion sirva (OSError al leer las
# cookies, 2026-10-14): solo avisa. Si de verdad vencio, el primer encargo sale con 3 y se para.
& $gflow auth status *> $null
if ($LASTEXITCODE -ne 0) { Di 'FLOW: aviso: la verificacion rapida de gflow no confirmo la sesion; se intenta igual.' }

$referencias = @{}
foreach ($n in @('SANDO', 'WICHO')) {
  $referencias[$n] = (Join-Path $repo ('docs/marketing/estudio/referencias/' + $n.ToLower() + '.png'))
}

$pendientes = @(Get-ChildItem 'docs/marketing/estudio/encargos/*.md' -ErrorAction SilentlyContinue | Sort-Object Name |
  Where-Object { -not (Test-Path ('docs/marketing/estudio/hecho/{0}/estado.json' -f $_.BaseName)) } |
  Where-Object { $Solo -eq '' -or $_.BaseName -eq $Solo })
Di ('FLOW: encargos pendientes: ' + $pendientes.Count)

$listos = 0; $fallos = 0; $saltados = 0
foreach ($archivo in $pendientes) {
  $id = $archivo.BaseName
  $e = LeerEncargo $archivo.FullName
  if ($e['tipo'] -ne 'imagen') {
    Di ('FLOW: ' + $id + ' es ' + $e['tipo'] + ': el video gasta creditos y no se genera solo; queda pendiente.')
    $saltados++; continue
  }
  $sinRef = @($e['nombres'] | Where-Object { -not $referencias.ContainsKey($_) })
  if ($sinRef.Count -gt 0) {
    Di ('FLOW: ' + $id + ': no hay referencia para ' + ($sinRef -join ', ') + '; queda pendiente.')
    $saltados++; continue
  }
  $formato = $e['formato']; if (-not $formato) { $formato = '9:16' }
  $variantes = 2; if ($e['variantes'] -match '^\d+$') { $variantes = [Math]::Min(4, [Math]::Max(1, [int]$e['variantes'])) }

  $dir = Join-Path $repo ('docs/marketing/estudio/hecho/' + $id)
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Get-ChildItem $dir -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^v' } | Remove-Item -Force

  $argumentos = New-Object System.Collections.ArrayList
  if ($e['nombres'].Count -eq 0) {
    [void]$argumentos.AddRange(@('image', 't2i', $e['escena']))
  } else {
    # Cada referencia con su nombre, en orden: el modelo sabe quien es quien y no los mezcla.
    $quien = @()
    for ($i = 0; $i -lt $e['nombres'].Count; $i++) { $quien += ('reference image ' + ($i + 1) + ' is ' + $e['nombres'][$i]) }
    $prompt = 'Characters: ' + ($quien -join '; ') + '. Keep each one exactly as drawn there ' +
      '(face, colors, clothes, line style); never merge them. ' + $e['escena']
    [void]$argumentos.AddRange(@('image', 'i2i', $prompt))
    foreach ($n in $e['nombres']) { [void]$argumentos.AddRange(@('--ref', $referencias[$n])) }
  }
  [void]$argumentos.AddRange(@('--aspect', $formato, '-n', [string]$variantes, '-o', (Join-Path $dir 'v.png')))

  Di ('FLOW: ' + $id + ' (' + $e['nombres'].Count + ' personajes, ' + $variantes + ' variantes)...')
  $salida = (& $gflow @argumentos 2>&1 | Out-String)
  $codigo = $LASTEXITCODE
  $ultima = (($salida -split "`n") | Where-Object { $_.Trim() -ne '' } | Select-Object -Last 1)

  if ($codigo -eq 0) {
    $hechos = @(Get-ChildItem $dir -File | Where-Object { $_.Name -match '^v(_\d+)?\.(png|jpe?g|webp)$' } | Sort-Object Name)
    if ($hechos.Count -eq 0) { Di ('FLOW: ' + $id + ': gflow termino sin dejar imagen; queda pendiente.'); $saltados++; continue }
    $n = 0
    foreach ($f in $hechos) { $n++; Rename-Item -Path $f.FullName -NewName ('v' + $n + $f.Extension.ToLower()) }
    Estado $dir 'listo' $null
    Di ('FLOW: ' + $id + ' listo (' + $n + ' imagenes)')
    $listos++
  } elseif ($codigo -eq 5) {
    Estado $dir 'fallo' 'Flow rechazo la escena por su politica de contenido'
    Di ('FLOW: ' + $id + ' fallo: Flow rechazo la escena (politica de contenido)')
    $fallos++
  } elseif ($codigo -eq 3 -or $codigo -eq 4) {
    $porque = 'la sesion de Google vencio: pega otra vez la linea del instalador'
    if ($codigo -eq 4) { $porque = 'Flow puso un limite por ahora; se sigue en la proxima corrida' }
    Di ('FLOW: paro en ' + $id + ': ' + $porque)
    break
  } else {
    Di ('FLOW: ' + $id + ': gflow salio con ' + $codigo + ' (' + $ultima + '); queda pendiente.')
    $saltados++
  }
  # Pausa entre encargos: un ritmo de persona, no de robot (docs/ACCOUNT_SAFETY.md de gflow).
  Start-Sleep -Seconds (Get-Random -Minimum 8 -Maximum 20)
}
Di ('FLOW: listos ' + $listos + ', con fallo ' + $fallos + ', siguen pendientes ' + ($pendientes.Count - $listos - $fallos))
