@echo off
echo.
echo ========================================
echo    CRAFTLY AI - INSTALLATION
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please follow these steps:
    echo 1. Go to https://nodejs.org
    echo 2. Download the LTS version
    echo 3. Install it
    echo 4. Restart your computer
    echo 5. Run this script again
    echo.
    pause
    exit
)

echo Node.js is installed!
node --version
npm --version
echo.

echo Installing dependencies...
echo This will take 2-5 minutes. Please wait...
echo.

npm install

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed!
    echo.
    echo Please try manually:
    echo 1. Open Command Prompt
    echo 2. Type: cd Desktop\craftly-ai-complete
    echo 3. Type: npm install
    echo.
    pause
    exit
)

echo.
echo ========================================
echo    INSTALLATION SUCCESSFUL!
echo ========================================
echo.
echo To start the app:
echo - Double-click START-APP.bat
echo   OR
echo - Type: npm start
echo.

pause
