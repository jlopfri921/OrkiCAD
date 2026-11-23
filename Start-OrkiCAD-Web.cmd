@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-OrkiCAD-Web.ps1"
if errorlevel 1 (
    echo.
    echo No se pudo iniciar OrkiCAD. Revisa el error de arriba.
    pause
)
endlocal
