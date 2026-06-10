@echo off
title Agenda Cobranza - Instalador de acceso directo
set "DIR=%~dp0"

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\Agenda Cobranza.lnk'); $sc.TargetPath = '%DIR%AgendaCobranza.exe'; $sc.WorkingDirectory = '%DIR%'; $sc.Description = 'Agenda de Cobranza - Hadad & Asociados'; $sc.Save()"

if %errorlevel% equ 0 (
    echo.
    echo  Listo! "Agenda Cobranza" ya esta en tu escritorio.
    echo  Podes cerrar esta ventana.
) else (
    echo.
    echo  [ERROR] No se pudo crear el acceso directo.
)
echo.
pause
