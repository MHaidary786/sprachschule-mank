
@echo off
setlocal
chcp 65001 >nul
title Sprachschule Mank - Windows Server
cd /d "%~dp0" || (
    echo [ERROR] Could not access the application directory.
    pause
    exit /b 1
)

echo ==================================================
echo   SPRACHSCHULE MANK
echo   Express.js + Angular - Local / LAN Server
echo ==================================================
echo.

rem ---------- 1. Check Node.js and npm ----------
echo [1/5] Checking Node.js and npm...

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or missing from PATH.
    echo Install the Node.js LTS release from:
    echo https://nodejs.org/en/download/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available in PATH.
    echo Repair your Node.js installation and try again.
    pause
    exit /b 1
)

node --version
call npm --version
if errorlevel 1 (
    echo [ERROR] npm is not working correctly.
    pause
    exit /b 1
)
echo.

rem ---------- 2. Install server dependencies ----------
echo [2/5] Checking server dependencies...

if not exist "server\package.json" (
    echo [ERROR] server\package.json was not found.
    pause
    exit /b 1
)

if not exist "server\node_modules" (
    pushd server || exit /b 1

    if exist package-lock.json (
        call npm ci --no-audit --no-fund
    ) else (
        call npm install --no-audit --no-fund
    )

    if errorlevel 1 (
        echo [ERROR] Server dependency installation failed.
        popd
        pause
        exit /b 1
    )

    popd
)
echo Server dependencies OK.
echo.

rem ---------- 3. Create the first administrator ----------
echo [3/5] Creating the first administrator...
echo.
echo  A new window opens for the administrator setup.
echo  - If an administrator already exists, it exits immediately.
echo  - On the very first run, enter the name, email and password there.
echo.

rem The setup runs in its own window (a separate console keeps the Node
rem prompt/input from interfering with this batch file). The window stays open
rem until you close it. If no admin exists when the server starts, it will
rem warn in the API window - the public site still works, the admin area just
rem stays locked until you finish the setup window.
start "Sprachschule Mank - Create Admin" cmd /k "cd /d ""%~dp0server"" && node scripts/create-admin.js && echo. && echo Finished. You can close this window."
timeout /t 2 /nobreak >nul
echo.

rem ---------- 4. Install client dependencies ----------
echo [4/5] Checking Angular dependencies...

if not exist "client\package.json" (
    echo [ERROR] client\package.json was not found.
    pause
    exit /b 1
)

if not exist "client\node_modules" (
    pushd client || exit /b 1

    if exist package-lock.json (
        call npm ci --no-audit --no-fund
    ) else (
        call npm install --no-audit --no-fund
    )

    if errorlevel 1 (
        echo [ERROR] Client dependency installation failed.
        popd
        pause
        exit /b 1
    )

    popd
)
echo Client dependencies OK.
echo.

rem ---------- 5. Build Angular ----------
echo [5/5] Building the Angular website...

pushd client || exit /b 1
call npm run build

if errorlevel 1 (
    echo [ERROR] Angular build failed.
    popd
    pause
    exit /b 1
)

popd
echo Angular build completed successfully.
echo.

rem ---------- 6) Start Angular and Express ----------
echo Starting Sprachschule Mank...

rem Start Angular development server in a separate window.
start "Sprachschule Mank - Angular Client" cmd /k "cd /d ""%~dp0client"" && npm start"

rem ---------- 7) LAN address ----------
set "MYIP="

for /f "usebackq delims=" %%i in (`node -e "const os=require('os');for(const l of Object.values(os.networkInterfaces()))for(const n of l||[])if(n.family==='IPv4'&&!n.internal&&!n.address.startsWith('169.254.')){console.log(n.address);process.exit(0)}"`) do set "MYIP=%%i"

echo ==================================================
echo   SPRACHSCHULE MANK - SERVER
echo ==================================================
echo   Local URL: http://127.0.0.1:8000

if defined MYIP (
    echo   LAN URL:   http://%MYIP%:8000
) else (
    echo   LAN URL:   Not detected
    echo   [WARNING] Check your network connection.
)

echo   Remote access: Configure HTTPS or VPN.
echo   Stop server: Press Ctrl+C
echo ==================================================
echo.

rem Open the local website in the default browser.
start "" "http://localhost:4200"

rem Start Express (current directory must be server).
pushd server 
node server.js
set "SERVER_EXIT_CODE=%ERRORLEVEL%"

popd

echo.
echo Server stopped with exit code %SERVER_EXIT_CODE%.
pause
exit /b %SERVER_EXIT_CODE%
