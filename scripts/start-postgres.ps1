# SOFTLAB GLOBAL — Helper to start local PostgreSQL 16 server
$pgBin = Join-Path $env:LOCALAPPDATA "Programs\pgsql\bin"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
$dataDir = Join-Path $env:LOCALAPPDATA "Programs\pgsql\data"
$logFile = Join-Path $env:LOCALAPPDATA "Programs\pgsql\pg.log"

$status = & $pgCtl status -D $dataDir 2>&1
if ($status -match "server is running") {
    Write-Host "PostgreSQL 16 is already active and running on localhost:5432"
    exit 0
}

Write-Host "Starting PostgreSQL 16 on localhost:5432..."
Start-Process -FilePath $pgCtl -ArgumentList "start -D `"$dataDir`" -l `"$logFile`"" -NoNewWindow
Start-Sleep -Seconds 3

Write-Host "PostgreSQL Status:"
& $pgCtl status -D $dataDir
