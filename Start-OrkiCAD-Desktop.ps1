# OrkiCAD AI Studio Desktop (Tauri development) — Windows.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $root '.venv\Scripts\python.exe'
$occt = Join-Path $root '.venv-occt\Scripts\python.exe'
if (-not (Test-Path $python) -and -not (Test-Path $occt)) {
    Write-Error 'A local .venv or .venv-occt with orkicad-core installed is needed to launch Tauri dev.'
    exit 1
}
$frontend = Join-Path $root 'studio\frontend'
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
    Write-Host 'Installing frontend dependencies (first run)...'
    Push-Location $frontend
    try { npm install; if ($LASTEXITCODE -ne 0) { throw 'npm install failed' } }
    finally { Pop-Location }
}
Write-Host 'Opening OrkiCAD AI Studio Desktop (Tauri dev)...' -ForegroundColor Cyan
Write-Host 'The desktop app starts its private Python CAD worker automatically.'
Push-Location $frontend
try { npm run tauri:dev; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
finally { Pop-Location }
