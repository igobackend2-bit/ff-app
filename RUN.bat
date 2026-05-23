@echo off
TITLE QuickCart - Dev Server Setup
COLOR 0A

echo.
echo  ========================================
echo   QuickCart - 10-Minute Grocery App
echo   Setting up your dev environment...
echo  ========================================
echo.

:: Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo  Download it from: https://nodejs.org
    pause
    exit /b 1
)

echo [1/5] Installing dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/5] Generating Prisma client...
call npx prisma generate
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Prisma generate failed.
    pause
    exit /b 1
)

echo.
echo [3/5] Creating database and running migrations...
call npx prisma migrate dev --name init --skip-seed
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] Migration failed - trying db push instead...
    call npx prisma db push
)

echo.
echo [4/5] Seeding demo data...
call npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] Seed failed - app will still work with empty data.
)

echo.
echo [5/5] Starting development server...
echo.
echo  ========================================
echo   QuickCart is running!
echo   Open: http://localhost:3000
echo  ========================================
echo.
call npm run dev
