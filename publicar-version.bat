@echo off
title Publicar nueva version de Agenda Cobranza
cd /d "%~dp0"

echo.
echo  Publicando nueva version en GitHub Releases...
echo  (esto compila, comprime y sube el zip — puede tardar unos minutos)
echo.

call npm run release

echo.
pause
