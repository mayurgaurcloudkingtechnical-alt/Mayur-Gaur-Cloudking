@echo off
title SOFTLAB GLOBAL SERVER (http://127.0.0.1:3000)
color 0A
set "PATH=C:\Users\softl\AppData\Local\Programs\nodejs;C:\Users\softl\AppData\Roaming\npm;%PATH%"
cd /d "C:\Users\softl\OneDrive\Desktop\SOFTLAB-GLOBAL"
echo ==============================================================
echo     SOFTLAB GLOBAL - Next.js Server (http://127.0.0.1:3000)
echo ==============================================================
echo.
echo Starting server... Open http://127.0.0.1:3000 in your browser!
echo.
call npx next dev -H 127.0.0.1 -p 3000
pause
