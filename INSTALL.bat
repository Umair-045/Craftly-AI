@echo off
color 0A
title Craftly AI - Automatic Setup

echo.
echo ═══════════════════════════════════════════════════════════════
echo    CRAFTLY AI - AUTOMATIC SETUP
echo ═══════════════════════════════════════════════════════════════
echo.

REM Check if Node.js is installed
echo [1/4] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download LTS version
    echo 3. Install and restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
npm --version
echo.

REM Install dependencies
echo [2/4] Installing dependencies...
echo This may take 2-5 minutes. Please wait...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Failed to install dependencies!
    echo.
    echo Try manually:
    echo 1. Open Command Prompt
    echo 2. cd to this folder
    echo 3. Run: npm install
    echo.
    pause
    exit /b 1
)
echo.
echo ✅ Dependencies installed successfully!
echo.

REM Success message
echo [3/4] Setup complete!
echo.
echo ═══════════════════════════════════════════════════════════════
echo    INSTALLATION SUCCESSFUL! 🎉
echo ═══════════════════════════════════════════════════════════════
echo.
echo To start the app:
echo 1. Double-click "START-APP.bat"
echo    OR
echo 2. Open Command Prompt and run: npm start
echo.
echo [4/4] Would you like to start the app now? (Y/N)
set /p start="Your choice: "

if /i "%start%"=="Y" (
    echo.
    echo Starting Craftly AI...
    echo Your browser will open in 10-30 seconds...
    echo.
    call npm start
) else (
    echo.
    echo No problem! Run "START-APP.bat" when you're ready.
    echo.
)

pause
