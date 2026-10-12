# WinReg-HIDS Automated Evaluation Benchmark Suite
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Executing WinReg-HIDS Evaluation & Benchmark Suite...   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "C:\dev\CNminiproject"
python -m pytest -v tests --junitxml="evaluation_report.xml"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll 24 evaluation test scenarios PASSED with zero regressions!" -ForegroundColor Green
} else {
    Write-Host "`nEvaluation suite reported failures." -ForegroundColor Red
}
