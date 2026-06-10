@echo off
rem ============================================================
rem  actualizar-app.bat — Actualizador para usuarios sin Git.
rem  Descarga la última versión publicada en GitHub Releases
rem  y reemplaza la carpeta de la app. Los datos no se tocan
rem  (viven en %APPDATA%).
rem ============================================================

rem Fase 1: copiarse a TEMP y relanzarse desde ahí
rem (no se puede reemplazar la carpeta mientras este .bat viva en ella)
if "%~1"=="" (
    copy /y "%~f0" "%TEMP%\cobranza-updater.bat" >nul
    start "" "%TEMP%\cobranza-updater.bat" "%~dp0."
    exit /b 0
)

rem Fase 2 (corriendo desde TEMP): %1 = carpeta de la app
setlocal
set "APPDIR=%~f1"
title Actualizando Agenda Cobranza...

echo.
echo  Cerrando la aplicacion...
taskkill /im AgendaCobranza.exe /f >nul 2>&1
timeout /t 2 /nobreak >nul

set "ZIP=%TEMP%\AgendaCobranza-update.zip"
set "EXTRACT=%TEMP%\AgendaCobranza-update"

echo  Descargando la ultima version...
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest 'https://github.com/SebastianGarciaGuerrero/agenda-cobranza/releases/latest/download/AgendaCobranza.zip' -OutFile '%ZIP%'"
if not exist "%ZIP%" (
    echo.
    echo  [ERROR] No se pudo descargar la actualizacion.
    echo  Revisa tu conexion a internet e intenta de nuevo.
    pause
    exit /b 1
)

echo  Instalando...
if exist "%EXTRACT%" rd /s /q "%EXTRACT%"
powershell -NoProfile -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%EXTRACT%' -Force"
if not exist "%EXTRACT%\AgendaCobranza-win32-x64\AgendaCobranza.exe" (
    echo.
    echo  [ERROR] El archivo descargado no es valido.
    pause
    exit /b 1
)

robocopy "%EXTRACT%\AgendaCobranza-win32-x64" "%APPDIR%" /MIR /NFL /NDL /NJH /NJS >nul

echo  Limpiando archivos temporales...
del "%ZIP%" >nul 2>&1
rd /s /q "%EXTRACT%" >nul 2>&1

echo.
echo  Listo! Abriendo Agenda Cobranza...
timeout /t 1 /nobreak >nul
start "" "%APPDIR%\AgendaCobranza.exe"
exit /b 0
