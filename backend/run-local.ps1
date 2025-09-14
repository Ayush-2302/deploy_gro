# GrowIt Medical Backend - Local Development
Write-Host "Starting GrowIt Medical Backend (Local Development)" -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:OPENAI_API_KEY = "your_openai_api_key_here"
$env:ALLOWED_ORIGIN = "http://localhost:5173"
$env:WHISPER_MODEL = "small"
$env:WHISPER_DEVICE = "cpu"
$env:OPENAI_MODEL = "gpt-4o-mini"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "- OPENAI_API_KEY: Set" -ForegroundColor Cyan
Write-Host "- ALLOWED_ORIGIN: $env:ALLOWED_ORIGIN" -ForegroundColor Cyan
Write-Host "- WHISPER_MODEL: $env:WHISPER_MODEL" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting backend server..." -ForegroundColor Green
Set-Location backend
python main.py
