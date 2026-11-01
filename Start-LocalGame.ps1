$ErrorActionPreference = 'Stop'
$engineDir = Join-Path $PSScriptRoot '..\..\work\OpenFrontIO'
if ($env:OPENFRONT_DIR) { $engineDir = $env:OPENFRONT_DIR }
$engineDir = (Resolve-Path $engineDir).Path
if (-not (Test-Path (Join-Path $engineDir 'node_modules\vite\bin\vite.js'))) { throw 'OpenFront dependencies are not installed.' }
$nodePath = (Get-Command node).Source
Start-Process -FilePath $nodePath -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','9010','--strictPort') -WorkingDirectory $engineDir -WindowStyle Hidden
Start-Process 'http://127.0.0.1:9010/'
