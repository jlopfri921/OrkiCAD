# OrkiCAD AI Web development snapshot — localhost only.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root 'studio\frontend\dist'
if (-not (Test-Path (Join-Path $dist 'index.html'))) {
    Write-Error 'Missing compiled web client. In studio/frontend run: npm install; npm run build'
    exit 1
}
$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) {
    $python = 'python'
}
$env:PYTHONPATH = (Join-Path $root 'core') + [IO.Path]::PathSeparator + $env:PYTHONPATH
$env:ORKICAD_STUDIO_PORT = '8765'
Write-Host 'OrkiCAD AI Web: http://127.0.0.1:8765' -ForegroundColor Cyan
Write-Host 'Local-only: do not expose this port to the Internet.'
& $python (Join-Path $root 'studio\web_runner.py')
