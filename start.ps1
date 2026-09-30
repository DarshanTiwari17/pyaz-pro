Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  PYAAZ-PRO: AI-Powered Onion Quality & Procurement Platform" -ForegroundColor Green
Write-Host "  Dept. of Consumer Affairs (DoCA) | Problem Statement 26031" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# Start backend server
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start frontend server
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "PYAAZ-PRO is launching!" -ForegroundColor Green
Write-Host " - Frontend UI: http://localhost:5173" -ForegroundColor Yellow
Write-Host " - Backend API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
