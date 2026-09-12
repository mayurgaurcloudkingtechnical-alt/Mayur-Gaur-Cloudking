@echo off
title SOFTLAB GLOBAL DEV SERVER (Port 3000)
color 0A
set "PATH=C:\Users\softl\AppData\Local\Programs\nodejs;C:\Users\softl\AppData\Roaming\npm;%PATH%"
cd /d "C:\Users\softl\OneDrive\Desktop\SOFTLAB-GLOBAL"
echo ==============================================================
echo     SOFTLAB GLOBAL - Next.js Development Server (Port 3000)
echo ==============================================================
echo.
call npm.cmd run dev
pause
