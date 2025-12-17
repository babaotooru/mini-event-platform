$env:PORT = "3001"
$env:BROWSER = "none"
Set-Location "$PSScriptRoot\client"
Write-Host "Starting React on port 3001..." -ForegroundColor Green
npm start

