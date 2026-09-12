# SOFTLAB GLOBAL — Helper to start local PostgreSQL 16 server
$pgBin = "$env:LOCALAPPDATA\Programs\pgsql\bin"
$dataDir = "$env:LOCALAPPDATA\Programs\pgsql\data"
$logFile = "$env:LOCALAPPDATA\Programs\pgsql\data\logfile.txt"

Write-Host "Starting PostgreSQL 16 on localhost:5432..."
& "$pgBin\pg_ctl.exe" start -D $dataDir -l $logFile -w

Write-Host "PostgreSQL Status:"
& "$pgBin\pg_ctl.exe" status -D $dataDir
