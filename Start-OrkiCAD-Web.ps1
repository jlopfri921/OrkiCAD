# OrkiCAD Studio local developer launcher (Windows PowerShell 5.1+).
# Web: React/Vite at 127.0.0.1:5173; Core API at 127.0.0.1:8765.
param(
    [switch]$Api,
    [switch]$Frontend
)

$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot
$frontendDir = Join-Path $repo 'studio\frontend'
$python = Join-Path $repo '.venv\Scripts\python.exe'
$apiHealth = 'http://127.0.0.1:8765/api/health'
$studioUrl = 'http://127.0.0.1:5173/'

function Test-StudioApi {
    try {
        $response = Invoke-RestMethod -Uri $apiHealth -TimeoutSec 2
        return ($response.status -eq 'ok' -and $response.service -eq 'orkicad-studio-api')
    } catch {
        return $false
    }
}
function Test-ListeningPort([int]$port) {
    try {
        return [bool](Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
    } catch {
        return $false
    }
}
function Test-ViteStudio {
    try {
        $response = Invoke-WebRequest -Uri $studioUrl -UseBasicParsing -TimeoutSec 2
        return ($response.StatusCode -eq 200 -and $response.Content -match 'orkicad|/@vite/client')
    } catch {
        return $false
    }
}

if ($Api) {
    Set-Location $repo
    Write-Host 'OrkiCAD Core API - http://127.0.0.1:8765/api/health' -ForegroundColor Cyan
    & $python -m orkicad_core.studio_server
    if ($LASTEXITCODE -ne 0) { throw 'El motor CAD ha terminado con un error.' }
    return
}
if ($Frontend) {
    Set-Location $frontendDir
    Write-Host 'OrkiCAD Studio Vite - http://127.0.0.1:5173/' -ForegroundColor Cyan
    & npm.cmd run dev -- --strictPort
    if ($LASTEXITCODE -ne 0) { throw 'Vite ha terminado con un error.' }
    return
}

Write-Host 'Iniciando OrkiCAD Studio (modo desarrollo local)...' -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $python)) {
    throw "No existe $python. Crea el entorno: py -3 -m venv .venv; .\.venv\Scripts\python.exe -m pip install -e ."
}
if (-not (Test-Path -LiteralPath (Join-Path $frontendDir 'node_modules\vite'))) {
    throw "Faltan dependencias de React/Vite. Ejecuta: cd studio\frontend; npm install"
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm no esta disponible. Instala Node.js y comprueba el PATH.'
}

if (Test-StudioApi) {
    Write-Host 'Motor CAD ya iniciado: reutilizando puerto 8765.' -ForegroundColor Green
} elseif (Test-ListeningPort 8765) {
    throw 'El puerto 8765 esta ocupado por otro servicio. No se iniciara un segundo motor CAD.'
} else {
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $repo -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Api"
    Write-Host 'Motor CAD iniciado en una ventana independiente.' -ForegroundColor Green
}

if (Test-ViteStudio) {
    Write-Host 'Interfaz React ya iniciada: reutilizando puerto 5173.' -ForegroundColor Green
} elseif (Test-ListeningPort 5173) {
    throw 'El puerto 5173 esta ocupado por otro servicio. Comprueba la ventana de Vite.'
} else {
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $frontendDir -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Frontend"
    Write-Host 'Interfaz React iniciada en una ventana independiente.' -ForegroundColor Green
}

$apiReady = $false
$frontendReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if (-not $apiReady) { $apiReady = Test-StudioApi }
    if (-not $frontendReady) { $frontendReady = Test-ViteStudio }
    if ($apiReady -and $frontendReady) { break }
    Start-Sleep -Milliseconds 500
}
if (-not $apiReady) {
    Write-Warning 'La API CAD no responde todavia: revisa la ventana de Python.'
}
if (-not $frontendReady) {
    Write-Warning 'Vite no responde todavia: revisa la ventana de React.'
}
if ($apiReady -and $frontendReady) {
    Write-Host 'OrkiCAD listo. Abriendo el navegador...' -ForegroundColor Green
    Start-Process $studioUrl
} else {
    Write-Host "Interfaz: $studioUrl"
    Write-Host "Motor CAD: $apiHealth"
}
