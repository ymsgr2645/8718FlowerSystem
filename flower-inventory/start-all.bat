@echo off
echo.
echo ========================================
echo   8718 FLOWER SYSTEM - Full Stack
echo   Phase 1: Local Development
echo ========================================
echo.
echo Starting Backend (FastAPI + SQLite)...
start "8718 Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 3 /nobreak > nul

echo Starting Frontend (Next.js)...
start "8718 Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ========================================
echo   Servers Starting...
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
pause
