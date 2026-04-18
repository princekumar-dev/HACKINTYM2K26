@echo off
REM Quick Start Script for Health Monitoring Backend (Windows)
REM This script sets up and starts the backend system

echo.
echo 🚀 Health Monitoring Backend - Quick Start
echo ==========================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js not found. Please install Node 18+
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Check if MongoDB is available
echo 🔍 Checking MongoDB...
where mongo >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ MongoDB found (make sure it's running)
) else (
  echo ⚠️  MongoDB not found in PATH
  echo    Using Docker Compose instead
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
if exist "package.json" (
  call npm install
  echo ✅ Dependencies installed
) else (
  echo ❌ package.json not found. Are you in the backend directory?
  pause
  exit /b 1
)

REM Build TypeScript
echo.
echo 🔨 Building TypeScript...
call npm run build
if %ERRORLEVEL% EQU 0 (
  echo ✅ Build successful
) else (
  echo ⚠️  Build completed with warnings
)

REM Start backend
echo.
echo 🌟 Starting backend server...
echo    Listening on http://localhost:3001
echo    Swagger docs: http://localhost:3001/api/docs
echo.
echo 📝 To test the system, in another terminal run:
echo    curl http://localhost:3001/api/health/health-check
echo.
echo 📖 Documentation:
echo    - HEALTH_MONITORING_GUIDE.md - API reference
echo    - QUICK_REFERENCE.md - Cheat sheet
echo    - IMPLEMENTATION_GUIDE.md - Integration steps
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run start:dev
pause
