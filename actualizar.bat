@echo off
title Actualizando Agenda Cobranza...
cd /d "%~dp0"

echo.
echo  Bajando cambios de GitHub...
git pull
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] No se pudo conectar a GitHub.
    pause
    exit /b 1
)

echo.
echo  Compilando nueva version...
npm run build:win
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Fallo la compilacion.
    pause
    exit /b 1
)

echo.
echo  Listo! La app fue actualizada correctamente.
echo  Podés cerrar esta ventana y abrir Agenda Cobranza.
echo.
pause
