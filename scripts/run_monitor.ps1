# Run WinReg-HIDS Backend Service
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting WinReg-HIDS Python Backend & Watchers...      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "C:\dev\CNminiproject"
python -m src.main
