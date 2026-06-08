@echo off
echo Running Next.js Dev Server Restarter...
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart.ps1"
pause
