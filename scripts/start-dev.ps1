$env:PATH = "C:\Users\softl\AppData\Local\Programs\nodejs;C:\Users\softl\AppData\Roaming\npm;" + $env:PATH
Set-Location "C:\Users\softl\OneDrive\Desktop\SOFTLAB-GLOBAL"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting SOFTLAB GLOBAL Dev Server...   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
npm run dev
