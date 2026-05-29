@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   FARMERS FACTORY — Android Build Script
echo   This script sets up Capacitor and builds the Android APK/AAB
echo ============================================================
echo.

:: ── Prerequisites check ──────────────────────────────────────
echo [1/8] Checking prerequisites...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java not found. Install JDK 11+ from https://adoptium.net
    pause & exit /b 1
)

if not defined ANDROID_HOME (
    echo ERROR: ANDROID_HOME not set. Install Android Studio and set ANDROID_HOME.
    echo        Usually: C:\Users\YourName\AppData\Local\Android\Sdk
    pause & exit /b 1
)

echo    Node.js : OK
echo    Java    : OK
echo    Android : %ANDROID_HOME%
echo.

:: ── Install Capacitor ────────────────────────────────────────
echo [2/8] Installing Capacitor packages...
call npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen @capacitor/status-bar
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause & exit /b 1
)
echo    Done.
echo.

:: ── Init Capacitor (skip if already done) ───────────────────
echo [3/8] Initialising Capacitor...
if not exist "android\" (
    call npx cap init "Farmers Factory" "com.igogroups.farmersfactory" --web-dir out
    echo    Capacitor initialised.
) else (
    echo    Android folder already exists, skipping cap init.
)
echo.

:: ── Add Android platform ────────────────────────────────────
echo [4/8] Adding Android platform...
if not exist "android\" (
    call npx cap add android
    if %errorlevel% neq 0 (
        echo ERROR: npx cap add android failed.
        pause & exit /b 1
    )
    echo    Android platform added.
) else (
    echo    Android platform already present.
)
echo.

:: ── Copy keystore ────────────────────────────────────────────
echo [5/8] Copying keystore to android/app/...
if exist "farmers-factory-release.jks" (
    copy /Y "farmers-factory-release.jks" "android\app\farmers-factory-release.jks"
    echo    Keystore copied.
) else (
    echo    WARNING: farmers-factory-release.jks not found in project root.
    echo    Signing will be skipped — APK will be debug-signed only.
)
echo.

:: ── Write gradle.properties signing config ───────────────────
echo [6/8] Writing signing config to android/gradle.properties...
if exist "android\gradle.properties" (
    findstr /c:"FARMERS_FACTORY_STORE_FILE" android\gradle.properties >nul 2>&1
    if %errorlevel% neq 0 (
        echo. >> android\gradle.properties
        echo # Farmers Factory release signing >> android\gradle.properties
        echo FARMERS_FACTORY_STORE_FILE=farmers-factory-release.jks >> android\gradle.properties
        echo FARMERS_FACTORY_KEY_ALIAS=farmers-factory >> android\gradle.properties
        echo FARMERS_FACTORY_STORE_PASSWORD=FarmersFactory@2024 >> android\gradle.properties
        echo FARMERS_FACTORY_KEY_PASSWORD=FarmersFactory@2024 >> android\gradle.properties
        echo    Signing config written.
    ) else (
        echo    Signing config already present.
    )
)
echo.

:: ── Sync web assets ──────────────────────────────────────────
echo [7/8] Syncing Capacitor (npx cap sync)...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: cap sync failed.
    pause & exit /b 1
)
echo    Sync complete.
echo.

:: ── Build AAB ────────────────────────────────────────────────
echo [8/8] Building release AAB (this takes 3-10 minutes)...
cd android
call gradlew.bat bundleRelease
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Gradle build failed. Check error above.
    echo Common fixes:
    echo   - Make sure ANDROID_HOME is set correctly
    echo   - Run: gradlew.bat clean  then try again
    cd ..
    pause & exit /b 1
)
cd ..

echo.
echo ============================================================
echo   BUILD COMPLETE!
echo ============================================================
echo.
echo   AAB (Play Store upload):
echo   android\app\build\outputs\bundle\release\app-release.aab
echo.
echo   APK (direct install):
echo   android\app\build\outputs\apk\release\app-release.apk
echo.

:: Also build APK
echo Building APK as well...
cd android
call gradlew.bat assembleRelease
cd ..

:: Show file sizes
if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    for %%A in ("android\app\build\outputs\bundle\release\app-release.aab") do (
        echo   AAB size: %%~zA bytes
    )
)
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do (
        echo   APK size: %%~zA bytes
    )
)

echo.
echo Next step: Upload the AAB to Google Play Console.
echo.
pause
