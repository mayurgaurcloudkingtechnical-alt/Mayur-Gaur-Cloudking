# SOFTLAB GLOBAL — Helper to stop local PostgreSQL 16 server
$pgBin = "$env:LOCALAPPDATA\Programs\pgsql\bin"
$dataDir = "$env:LOCALAPPDATA\Programs\pgsql\data"

Write-Host "Stopping PostgreSQL 16..."
& "$pgBin\pg_ctl.exe" stop -D $dataDir -m fast
