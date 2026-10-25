@echo off
chcp 65001 >nul
title Sprachschule Mank - Development Mode
cd /d "%~dp0"

echo ==================================================
echo   SPRACHSCHULE MANK - DEVELOPMENT MODE
echo   API   : http://127.0.0.1:5000
echo   Client: http://localhost:4200  (hot reload)
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install it from https://nodejs.org first.
  pause
  exit /b 1
)

if not exist "server\node_modules" (
  pushd server
  call npm install --no-audit --no-fund
  popd
)
if not exist "client\node_modules" (
  pushd client
  call npm install --no-audit --no-fund
  popd
)

start "Sprachschule Mank - API (5000)" cmd /k "cd /d ""%~dp0server"" && node scripts/create-admin.js && npm run dev"
timeout /t 2 /nobreak >nul
start "Sprachschule Mank - Client (4200)" cmd /k "cd /d ""%~dp0client"" && npm start"

echo Two windows were opened: the API server and the Angular dev server.
echo The Angular dev server proxies /api and /uploads to port 5000.
echo Close both windows to stop everything.
echo.
pause
