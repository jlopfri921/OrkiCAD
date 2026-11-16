# OrkiCAD AI - local Windows verification when cloud CI is unavailable.
# Run from any current folder: .\scripts\verify-studio.ps1
# Optional: -VerifyOCCT to check native STEP for the selected local interpreter.
param(
    [switch]$VerifyOCCT,
    [switch]$LaunchWeb
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontend = Join-Path $root 'studio\frontend'
$originalPythonPath = $env:PYTHONPATH

function Assert-CommandSuccess([string]$description) {
    if ($LASTEXITCODE -ne 0) {
        throw ("OrkiCAD AI: " + $description + " failed (exit code " + $LASTEXITCODE + ").")
    }
}

try {
    Set-Location $root
    $python = @(
        (Join-Path $root '.venv-occt\Scripts\python.exe'),
        (Join-Path $root '.venv\Scripts\python.exe')
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $python) {
        $python = (Get-Command python -ErrorAction SilentlyContinue).Source
    }
    if (-not $python) {
        throw 'Python is missing. Create .venv or .venv-occt first.'
    }

    $env:PYTHONPATH = (Join-Path $root 'core') + [IO.Path]::PathSeparator + $originalPythonPath
    Write-Host 'OrkiCAD AI: verifying native project / CAD Core...' -ForegroundColor Cyan
    & $python -m unittest discover -s tests -v
    Assert-CommandSuccess 'Python Core tests'

    if ($VerifyOCCT) {
        Write-Host 'OrkiCAD AI: checking actual OCCT B-rep and STEP support...' -ForegroundColor Cyan
        & $python -c 'import OCP'
        Assert-CommandSuccess 'OCP import (install cadquery-ocp into the chosen Python environment)'
        & $python -m unittest discover -s tests -p test_occt_integration.py -v
        Assert-CommandSuccess 'native STEP round-trip acceptance'
    }

    Set-Location $frontend
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw 'Node/npm not found. Install the supported Node.js version.'
    }
    if (-not (Test-Path 'node_modules')) {
        Write-Host 'OrkiCAD AI: installing frontend dependencies...' -ForegroundColor Cyan
        & npm install --no-audit --no-fund
        Assert-CommandSuccess 'npm dependency installation'
    }
    Write-Host 'OrkiCAD AI: verifying synchronized versions...' -ForegroundColor Cyan
    & npm run check:version
    Assert-CommandSuccess 'version metadata check'

    Write-Host 'OrkiCAD AI: compiling TypeScript and production Web...' -ForegroundColor Cyan
    & npm run build
    Assert-CommandSuccess 'Web frontend build'
    if (-not (Test-Path 'dist\index.html')) {
        throw 'Built Web index.html not found after successful npm build.'
    }

    Write-Host 'PASSED: OrkiCAD AI Python tests, version guard and Web build.' -ForegroundColor Green
    Write-Host 'Note: this command does not verify Tauri installation, UI interaction or bundled OCCT.' -ForegroundColor Yellow
    if ($LaunchWeb) {
        Set-Location $root
        & (Join-Path $root 'Start-OrkiCAD-Web.ps1')
        Assert-CommandSuccess 'local Web launch'
    }
} finally {
    $env:PYTHONPATH = $originalPythonPath
    Set-Location $root
}
