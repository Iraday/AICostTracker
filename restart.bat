@echo off
cd /d "%~dp0"
echo Running Next.js Setup and Dev Server...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "restart.ps1"
pause
