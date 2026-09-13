@echo off
title SOFTLAB GLOBAL SERVER (http://127.0.0.1:3000)
color 0A
set "PATH=C:\Users\softl\AppData\Local\Programs\nodejs;C:\Users\softl\AppData\Roaming\npm;%PATH%"
cd /d "C:\Users\softl\OneDrive\Desktop\SOFTLAB-GLOBAL"
echo ==============================================================
echo     SOFTLAB GLOBAL - Next.js Server (http://127.0.0.1:3000)
echo ==============================================================
echo [1/2] Verifying and starting PostgreSQL 16 server...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-postgres.ps1"
echo.
echo [2/2] Starting Next.js Web Portal... Open http://127.0.0.1:3000 in your browser!
echo.
call npm run dev
pause

