@echo off
echo Starting GrowIt Medical Backend (Local Development)
echo.

REM Set environment variables
set OPENAI_API_KEY=your_openai_api_key_here
set ALLOWED_ORIGIN=http://localhost:5173
set WHISPER_MODEL=small
set WHISPER_DEVICE=cpu
set OPENAI_MODEL=gpt-4o-mini

echo Environment variables set:
echo - OPENAI_API_KEY: Set
echo - ALLOWED_ORIGIN: %ALLOWED_ORIGIN%
echo - WHISPER_MODEL: %WHISPER_MODEL%
echo.

echo Starting backend server...
cd backend
python main.py
