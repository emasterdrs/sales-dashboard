@echo off
setlocal enabledelayedexpansion

:: 1. Move to the project directory
cd /d "%~dp0"

echo [1/3] Processing CSV data...
:: Run the node script to convert CSV to JSON
node scripts/sync_csv.js

echo [2/3] Preparing Git commit...
:: Add all changes (CSVs and the generated JSON)
git add .

:: Create a timestamp for the commit message
set "timestamp=%date% %time%"
git commit -m "Auto-update data: %timestamp%"

echo [3/3] Uploading to Homepage (GitHub/Vercel)...
:: Push to the main branch
git push origin main

echo.
echo ==========================================
echo 업데이트가 완료되었습니다! 
echo Vercel에서 빌드가 완료될 때까지 약 1분 정도 기다려주세요.
echo ==========================================
pause
