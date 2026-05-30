@echo off
echo.
echo ============================================================
echo   FARMERS FACTORY - Expo EAS Build
echo   Builds your APK in the CLOUD - no Java/Android SDK needed
echo ============================================================
echo.

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js found

:: Install dependencies
echo.
echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit /b 1 )

:: Install EAS CLI globally
echo.
echo [2/4] Installing EAS CLI...
call npm install -g eas-cli
if %errorlevel% neq 0 ( echo ERROR: eas-cli install failed & pause & exit /b 1 )

:: Login to Expo
echo.
echo [3/4] Login to your Expo account...
echo      (Create free account at https://expo.dev if you don't have one)
echo.
call eas login

:: Build APK
echo.
echo [4/4] Starting cloud build - APK (FREE, takes 5-15 mins)...
echo.
echo Choose what to build:
echo   1. APK  - for testing / direct install on phone (FREE)
echo   2. AAB  - for Google Play Store upload (FREE)
echo.
set /p choice="Enter 1 or 2: "

if "%choice%"=="1" (
    echo Building APK...
    call eas build --platform android --profile preview --non-interactive
) else (
    echo Building AAB for Play Store...
    call eas build --platform android --profile production --non-interactive
)

echo.
echo ============================================================
echo   BUILD SUBMITTED TO CLOUD!
echo   - Check progress at: https://expo.dev
echo   - Download link will be emailed to you when done
echo   - Usually takes 5-15 minutes
echo ============================================================
echo.
pause
