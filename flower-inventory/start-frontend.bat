@echo off
echo.
echo ========================================
echo   8718 FLOWER SYSTEM - Frontend Server
echo   Phase 1: Local Development
echo ========================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting Next.js on http://localhost:3000
echo.

npm run dev
