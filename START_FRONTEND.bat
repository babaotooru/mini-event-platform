@echo off
title React Dev Server - Port 3001
echo ========================================
echo   Starting React on Port 3001
echo ========================================
echo.
echo Please wait 1-2 minutes for compilation...
echo.
cd /d %~dp0client
set PORT=3001
set BROWSER=none
call npm start
pause

